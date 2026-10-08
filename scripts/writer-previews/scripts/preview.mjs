import { readFile, writeFile, appendFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { API, branchName, commitSHA, branchHead, checkProject, inventory, matches, evidence,
  cleanup, validateBuildRun, validateStaticDirectory, loadConfig } from './preview-core.mjs';

const env = process.env;
const config = await loadConfig(new URL('../preview-config.json', import.meta.url));
const command = process.argv[2];
const unprivilegedPushResolution = command === 'resolve-build' && env.GITHUB_EVENT_NAME === 'push' &&
  env.GITHUB_REF === `refs/heads/${branchName(env.PREVIEW_BRANCH)}`;
if (env.GITHUB_REPOSITORY !== config.repository ||
    (env.GITHUB_REF !== `refs/heads/${config.defaultBranch}` && !unprivilegedPushResolution)) {
  throw new Error('Privileged preview operations must run from the fixed repository default branch');
}
const github = new API('https://api.github.com', env.GH_TOKEN);
const cf = new API('https://api.cloudflare.com/client/v4', env.CLOUDFLARE_PREVIEW_EDIT_TOKEN);
const base = `/repos/${config.repository}`;
const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, 'utf8'));

async function output(values) {
  await appendFile(env.GITHUB_OUTPUT, Object.entries(values).map(([k,v]) => `${k}=${v}\n`).join(''));
}

async function source() {
  if (env.GITHUB_EVENT_NAME === 'workflow_run') {
    const r = event.workflow_run;
    const run = await github.request(`${base}/actions/runs/${r.id}`);
    const workflow = await github.request(`${base}/actions/workflows/writer-preview-build.yml`);
    validateBuildRun(run, workflow, config, { branch: r.head_branch, sha: r.head_sha });
    return { branch: branchName(run.head_branch), sha: commitSHA(run.head_sha), runID: run.id };
  }
  // The manual build's resolve job is separate from the untrusted build job.
  const branch = branchName(env.PREVIEW_BRANCH);
  const sha = commitSHA(env.PREVIEW_SHA);
  return { branch, sha, runID: env.GITHUB_RUN_ID };
}

async function plans() {
  const directory = resolve(env.PLAN_DIRECTORY, 'targets');
  const files = await readdir(directory);
  return Promise.all(files.filter(f => f.endsWith('.json')).map(async f => JSON.parse(await readFile(resolve(directory, f), 'utf8'))));
}

async function history() {
  const records = [];
  for (const entry of await readdir(env.HISTORY_DIRECTORY, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of await readdir(resolve(env.HISTORY_DIRECTORY, entry.name))) {
      const data = JSON.parse(await readFile(resolve(env.HISTORY_DIRECTORY, entry.name, file), 'utf8'));
      if (data.account !== config.previewAccount || data.project !== config.project) throw new Error('Historical evidence ownership mismatch');
      branchName(data.branch);
      records.push(data);
    }
  }
  return records;
}

if (command === 'resolve-build') {
  const branch = branchName(env.PREVIEW_BRANCH);
  const sha = await branchHead(github, config, branch);
  if (!sha) throw new Error('Preview branch does not exist');
  if (env.GITHUB_EVENT_NAME === 'push' && sha !== env.GITHUB_SHA) throw new Error('Push revision superseded');
  await output({ branch, sha });
} else if (command === 'resolve-upload') {
  const s = await source();
  if (await branchHead(github, config, s.branch) !== s.sha) throw new Error('Preview artifact superseded or branch removed');
  await output({ branch: s.branch, sha: s.sha, run_id: s.runID });
} else if (command === 'upload') {
  const s = await source();
  const path = await checkProject(cf, config, env);
  const directory = resolve(env.STATIC_DIRECTORY);
  await validateStaticDirectory(directory);
  if (await branchHead(github, config, s.branch) !== s.sha) throw new Error('Preview artifact superseded or branch removed');
  // The runner tooling directory contains no artifact configuration. Wrangler only sees static files.
  const executable = resolve(env.RUNNER_TEMP, 'writer-tools/node_modules/.bin/wrangler');
  await new Promise((accept, reject) => {
    const child = spawn(executable, ['pages', 'deploy', directory, '--project-name', config.project,
      '--branch', s.branch, '--commit-hash', s.sha, '--commit-dirty=false'], {
      cwd: resolve(env.RUNNER_TEMP, 'writer-tools'), stdio: 'inherit',
      env: { PATH: env.PATH, HOME: env.HOME, CI: 'true', WRANGLER_SEND_METRICS: 'false',
        CLOUDFLARE_ACCOUNT_ID: config.previewAccount, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_PREVIEW_EDIT_TOKEN },
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? accept() : reject(new Error(`Wrangler failed (${code})`)));
  });
  const deployments = matches(await inventory(cf, path), s.branch);
  if (!deployments.some(d => d.deployment_trigger.metadata.commit_hash === s.sha && d.latest_stage?.status === 'success')) {
    throw new Error('Uploaded commit/environment could not be verified');
  }
  if (await branchHead(github, config, s.branch) !== s.sha) {
    throw new Error('Branch changed during upload; trusted cleanup/reconciliation must finish before confirming removal');
  }
} else if (command === 'plan-cleanup') {
  if (env.GITHUB_EVENT_NAME === 'workflow_dispatch' && env.DELETE_PREVIEWS === 'true' && !env.PREVIEW_BRANCH) {
    throw new Error('Manual deletion requires one explicit preview branch');
  }
  const path = await checkProject(cf, config, env);
  const deployments = await inventory(cf, path);
  const previous = await history();
  let branches;
  if (env.GITHUB_EVENT_NAME === 'delete') {
    if (event.ref_type !== 'branch') throw new Error('Tag deletion is not a preview removal');
    branches = [branchName(event.ref)];
  } else if (env.PREVIEW_BRANCH) branches = [branchName(env.PREVIEW_BRANCH)];
  else branches = [...new Set([...deployments.map(d => d.deployment_trigger?.metadata?.branch), ...previous.map(p => p.branch)])]
    .filter(b => typeof b === 'string' && /^preview\/[a-z0-9][a-z0-9-]{0,119}$/.test(b));
  const targetsDirectory = resolve(env.PLAN_DIRECTORY, 'targets');
  const evidenceDirectory = resolve(env.PLAN_DIRECTORY, 'evidence');
  await mkdir(targetsDirectory, { recursive: true });
  await mkdir(evidenceDirectory, { recursive: true });
  const cumulative = new Map(previous.map(p => [p.branch, p]));
  for (const branch of branches) {
    if (await branchHead(github, config, branch) !== null) continue;
    const plan = evidence(config, branch, matches(deployments, branch));
    // Carry forward URL evidence so successful retries do not lose older hash URLs
    // when earlier Actions artifacts expire.
    const byID = new Map(plan.deployments.map(d => [d.id, d]));
    for (const old of previous.filter(p => p.branch === branch)) {
      for (const d of old.deployments) {
        const current = byID.get(d.id);
        if (current) current.aliases = [...new Set([...current.aliases, ...d.aliases])];
        else byID.set(d.id, d);
      }
    }
    plan.deployments = [...byID.values()];
    cumulative.set(branch, plan);
    await writeFile(resolve(targetsDirectory, `${branch.slice(8)}.json`), JSON.stringify(plan, null, 2));
  }
  for (const plan of cumulative.values()) {
    await writeFile(resolve(evidenceDirectory, `${branchName(plan.branch).slice(8)}.json`), JSON.stringify(plan, null, 2));
  }
  await output({ planned: (await plans()).length > 0 });
} else if (command === 'apply-cleanup') {
  const previous = await history();
  for (const plan of await plans()) {
    const result = await cleanup({ cf, github, config, env, branch: plan.branch, plan,
      previous: previous.filter(p => p.branch === plan.branch), dryRun: env.DELETE_PREVIEWS !== 'true' });
    await appendFile(env.GITHUB_STEP_SUMMARY, `\nBranch \`${plan.branch}\`: \`${JSON.stringify(result)}\`\n`);
  }
} else throw new Error('Unknown preview operation');
