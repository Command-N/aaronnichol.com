import { readFile, lstat, readdir } from 'node:fs/promises';
import { resolve, relative, basename } from 'node:path';

export function branchName(value) {
  if (typeof value !== 'string' || !/^preview\/[a-z0-9][a-z0-9-]{0,119}$/.test(value)) {
    throw new Error('Expected an exact preview/<lowercase identity> branch');
  }
  return value;
}

export function commitSHA(value) {
  if (!/^[0-9a-f]{40}$/.test(value ?? '')) throw new Error('Expected a full commit SHA');
  return value;
}

export function target(config, env) {
  if (!/^[0-9a-f]{32}$/.test(config.previewAccount ?? '') ||
      config.previewAccount === config.productionAccount ||
      env.CLOUDFLARE_PREVIEW_ACCOUNT_ID !== config.previewAccount ||
      env.CLOUDFLARE_PREVIEW_PROJECT !== config.project) {
    throw new Error('Preview account/project must match the reviewed configuration and exclude production');
  }
  return `/accounts/${config.previewAccount}/pages/projects/${config.project}`;
}

export class API {
  constructor(base, token, { fetcher = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
    this.base = base;
    this.token = token;
    this.fetcher = fetcher;
    this.sleep = sleep;
  }

  async request(path, { method = 'GET', missing = false } = {}) {
    for (let attempt = 0; attempt < 4; attempt++) {
      let response;
      try {
        response = await this.fetcher(`${this.base}${path}`, {
          method, redirect: 'error', signal: AbortSignal.timeout(30_000),
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
        });
      } catch (error) {
        if (error.name === 'AbortError' || attempt === 3) throw new Error('Provider request failed or timed out');
        await this.sleep(500 * 2 ** attempt);
        continue;
      }
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        const retryAfter = response.headers.get('retry-after');
        const seconds = Number(retryAfter);
        const dated = Date.parse(retryAfter);
        const wait = retryAfter && Number.isFinite(seconds) ? seconds * 1000 :
          Number.isFinite(dated) ? Math.max(0, dated - Date.now()) : 500 * 2 ** attempt;
        await this.sleep(Math.min(30_000, Math.max(500, wait)));
        continue;
      }
      if (missing && response.status === 404) return null;
      if (!response.ok) throw new Error(`Provider HTTP ${response.status}; cleanup remains pending`);
      if (response.status === 204) return {};
      const data = await response.json();
      if (this.base.includes('api.cloudflare.com') && data.success !== true) {
        throw new Error('Cloudflare rejected the operation');
      }
      return data;
    }
  }
}

export async function branchHead(github, config, branch) {
  branchName(branch);
  const ref = await github.request(`/repos/${config.repository}/git/ref/heads/${encodeURIComponent(branch)}`, { missing: true });
  return ref ? commitSHA(ref.object?.sha) : null;
}

export async function checkProject(cf, config, env) {
  const path = target(config, env);
  const data = await cf.request(path);
  if (data.result?.name !== config.project || data.result?.production_branch !== config.reservedBranch || data.result?.source) {
    throw new Error('Expected the isolated Direct Upload project with its reserved base branch');
  }
  return path;
}

export async function inventory(cf, path) {
  const found = new Map();
  let expectedCount;
  for (let page = 1; page <= 1000; page++) {
    const data = await cf.request(`${path}/deployments?env=preview&per_page=25&page=${page}`);
    const pages = data.result_info?.total_pages;
    const count = data.result_info?.total_count;
    if (!Array.isArray(data.result) || !Number.isInteger(pages) || pages < 1 || pages > 1000 ||
        data.result_info.page !== page || data.result_info.count !== data.result.length ||
        !Number.isInteger(count) || count < 0 || (expectedCount !== undefined && count !== expectedCount)) {
      throw new Error('Incomplete or malformed deployment inventory');
    }
    expectedCount = count;
    for (const deployment of data.result) {
      if (typeof deployment.id !== 'string' || !deployment.id) throw new Error('Missing deployment identity');
      if (found.has(deployment.id)) throw new Error('Deployment inventory changed during pagination; retry');
      found.set(deployment.id, deployment);
    }
    if (page >= pages) {
      if (found.size !== expectedCount) throw new Error('Incomplete deployment inventory; retry');
      return [...found.values()];
    }
  }
  throw new Error('Inventory limit exceeded');
}

export function matches(deployments, branch) {
  branchName(branch);
  const exact = deployments.filter(d => d.deployment_trigger?.metadata?.branch === branch);
  if (exact.some(d => d.environment !== 'preview')) throw new Error('Refusing a production or unidentified deployment');
  return exact;
}

export function pagesURL(value, config) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !url.hostname.endsWith(`.${config.project}.pages.dev`)) {
    throw new Error('Refusing a probe outside the preview project');
  }
  return url;
}

export function evidence(config, branch, deployments) {
  return { account: config.previewAccount, project: config.project, branch: branchName(branch),
    deployments: deployments.map(d => ({ id: d.id, url: pagesURL(d.url, config).href,
      aliases: (d.aliases ?? []).map(u => pagesURL(u, config).href) })) };
}

export async function verifyUnavailable(records, config, fetcher = fetch) {
  const urls = new Set();
  for (const record of records) {
    if (record.account !== config.previewAccount || record.project !== config.project) throw new Error('Evidence ownership mismatch');
    for (const d of record.deployments) for (const u of [d.url, ...d.aliases]) urls.add(pagesURL(u, config).href);
  }
  for (const value of urls) {
    const url = pagesURL(value, config);
    url.searchParams.set('writer-removal-check', `${Date.now()}`);
    const response = await fetcher(url, { redirect: 'manual', cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
    if (response.status !== 404 && response.status !== 410) {
      throw new Error(`Preview URL verification inconclusive (HTTP ${response.status}); cleanup remains pending`);
    }
    await response.body?.cancel();
  }
  return urls.size;
}

// The workflow persists this plan as an immutable artifact BEFORE calling apply.
// New/late deployments are never deleted without first recording their URLs in a new plan.
export async function cleanup({ cf, github, config, env, branch, plan, previous = [], dryRun = true,
  sleep = ms => new Promise(r => setTimeout(r, ms)), fetcher = fetch, rounds = 12 }) {
  const path = await checkProject(cf, config, env);
  if (await branchHead(github, config, branch) !== null) return { skipped: 'branch exists' };
  if (plan.account !== config.previewAccount || plan.project !== config.project || plan.branch !== branch ||
      previous.some(p => p.branch !== branch)) throw new Error('Cleanup plan ownership mismatch');
  let deployments = matches(await inventory(cf, path), branch);
  if (dryRun) return { dryRun: true, ids: deployments.map(d => d.id) };
  const recorded = new Map(plan.deployments.map(d => [d.id, d]));
  for (const d of deployments) {
    const saved = recorded.get(d.id);
    if (!saved || saved.url !== pagesURL(d.url, config).href ||
        (d.aliases ?? []).some(u => !saved.aliases.includes(pagesURL(u, config).href))) {
      throw new Error('New deployment or alias needs a persisted cleanup plan; retry');
    }
  }
  for (const d of deployments) {
    if (await branchHead(github, config, branch) !== null) return { skipped: 'branch recreated' };
    await cf.request(`${path}/deployments/${encodeURIComponent(d.id)}?force=true`, { method: 'DELETE', missing: true });
  }
  let emptyRounds = 0;
  for (let round = 0; round < rounds; round++) {
    if (await branchHead(github, config, branch) !== null) return { skipped: 'branch recreated' };
    deployments = matches(await inventory(cf, path), branch);
    if (deployments.length) throw new Error('Retained or late deployment remains; retry with a new persisted plan');
    emptyRounds++;
    if (emptyRounds >= 3) {
      const checkedURLs = await verifyUnavailable([plan, ...previous], config, fetcher);
      if (await branchHead(github, config, branch) !== null || matches(await inventory(cf, path), branch).length) {
        throw new Error('Preview changed during verification; cleanup remains pending');
      }
      if (!checkedURLs) return { removed: false, inventoryEmpty: true, checkedURLs: 0 };
      return { removed: true, recorded: recorded.size, checkedURLs };
    }
    await sleep(10_000);
  }
  throw new Error('Cleanup did not settle; retry');
}

export function validateBuildRun(run, workflow, config, expected) {
  if (run.repository?.full_name !== config.repository || run.head_repository?.full_name !== config.repository ||
      run.path !== '.github/workflows/writer-preview-build.yml' || run.workflow_id !== workflow.id ||
      run.event !== 'push' || run.status !== 'completed' || run.conclusion !== 'success' ||
      run.head_branch !== branchName(expected.branch) || run.head_sha !== commitSHA(expected.sha)) {
    throw new Error('Artifact source is not the expected successful preview push build');
  }
}

// Never interpret artifact configuration or execute files from the downloaded site.
export async function validateStaticDirectory(directory) {
  const root = resolve(directory);
  let files = 0;
  let bytes = 0;
  async function visit(path) {
    const stat = await lstat(path);
    if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) throw new Error('Non-regular artifact entry');
    if (path !== root && ['_worker.js', '_worker.bundle', 'functions', 'functions-filepath-routing-config.json',
      'wrangler.toml', 'wrangler.json', 'wrangler.jsonc', '.wrangler', '.env', '.dev.vars'].includes(basename(path))) {
      throw new Error('Executable or deployment configuration in static artifact');
    }
    if (/^\.(env|dev\.vars)\./.test(basename(path))) throw new Error('Environment configuration in static artifact');
    if (relative(root, path).startsWith('..')) throw new Error('Artifact path escapes root');
    if (stat.isDirectory()) for (const entry of await readdir(path)) await visit(resolve(path, entry));
    else { files++; bytes += stat.size; if (stat.size > 25 * 1024 * 1024) throw new Error('Asset exceeds Pages limit'); }
  }
  await visit(root);
  if (!files || files > 20_000 || bytes > 200 * 1024 * 1024) throw new Error('Artifact size/count limit');
  return { files, bytes };
}

export async function loadConfig(path) { return JSON.parse(await readFile(path, 'utf8')); }
