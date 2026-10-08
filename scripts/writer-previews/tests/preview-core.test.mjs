import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { API, branchName, commitSHA, target, inventory, matches, evidence, cleanup,
  validateBuildRun, validateStaticDirectory, verifyUnavailable } from '../scripts/preview-core.mjs';

const config = { repository: 'Command-N/aaronnichol.com', project: 'writer-previews',
  previewAccount: 'a'.repeat(32), productionAccount: 'b'.repeat(32), reservedBranch: 'writer-preview-base' };
const env = { CLOUDFLARE_PREVIEW_ACCOUNT_ID: config.previewAccount, CLOUDFLARE_PREVIEW_PROJECT: config.project };
const branch = 'preview/reliability-test';
const deployment = (id = 'old', extra = {}) => ({ id, url: `https://${id}.writer-previews.pages.dev`, aliases: [],
  environment: 'preview', deployment_trigger: { metadata: { branch, commit_hash: 'c'.repeat(40) } }, ...extra });
const page = (items, number = 1, total = 1) => ({ success: true, result: items,
  result_info: { page: number, total_pages: total, count: items.length, total_count: items.length * total } });
const absent = { request: async () => null };
const unavailable = async () => new Response('', { status: 404 });

function provider(lists, { failDelete = false } = {}) {
  const deleted = [];
  let reads = 0;
  return { deleted, request: async (path, options) => {
    if (options?.method === 'DELETE') {
      deleted.push(path);
      if (failDelete) throw new Error('Lost deletion response');
      return null;
    }
    if (path.includes('/deployments?')) {
      const items = lists[Math.min(reads++, lists.length - 1)];
      return page(items, 1, items.length ? 1 : 0);
    }
    return { success: true, result: { name: config.project, production_branch: config.reservedBranch } };
  } };
}

function operation(cf, options = {}) {
  return cleanup({ cf, github: absent, config, env, branch,
    plan: evidence(config, branch, [deployment()]), dryRun: false, sleep: async () => {}, fetcher: unavailable, ...options });
}

test('branch and commit identity reject tags, whitespace, injection and blob-like values', () => {
  for (const value of ['main', 'refs/tags/preview/test', 'preview/test other', 'preview/a..b', 'preview/x\n', 'preview/x/y', 'preview/$(id)']) {
    assert.throws(() => branchName(value));
  }
  assert.equal(branchName(branch), branch);
  assert.throws(() => commitSHA('blob'));
  assert.equal(commitSHA('a'.repeat(40)), 'a'.repeat(40));
});

test('target rejects unset, wrong project, wrong account and production account', () => {
  assert.throws(() => target({ ...config, previewAccount: null }, env));
  assert.throws(() => target(config, { ...env, CLOUDFLARE_PREVIEW_PROJECT: 'aaronnichol-com' }));
  assert.throws(() => target(config, { ...env, CLOUDFLARE_PREVIEW_ACCOUNT_ID: config.productionAccount }));
  assert.throws(() => target({ ...config, previewAccount: config.productionAccount }, env));
});

test('exhaustive pagination retains historical matches and rejects missing or repeated records', async () => {
  const requested = [];
  const cf = { request: async path => {
    requested.push(path);
    return path.endsWith('page=1') ? page([deployment()], 1, 2) : page([deployment('older')], 2, 2);
  } };
  const all = await inventory(cf, '/project');
  assert.deepEqual(all.map(d => d.id), ['old', 'older']);
  assert.equal(requested.length, 2);
  assert.ok(requested.every(p => p.includes('env=preview')));
  await assert.rejects(inventory({ request: async () => ({ result: [] }) }, '/project'));
  await assert.rejects(inventory({ request: async p => page([deployment()], p.endsWith('page=1') ? 1 : 2, 2) }, '/project'), /changed during pagination/);
  await assert.rejects(inventory({ request: async () => ({ ...page([]), result_info: { ...page([]).result_info, total_count: 1 } }) }, '/project'), /Incomplete/);
});

test('Cloudflare zero-page empty inventory is valid only with consistent zero counts', async () => {
  const empty = page([], 1, 0);
  assert.deepEqual(await inventory({ request: async () => empty }, '/project'), []);
  for (const invalid of [
    { ...empty, result_info: { ...empty.result_info, total_count: 1 } },
    { ...empty, result_info: { ...empty.result_info, count: 1 } },
    { ...empty, result: [deployment()] },
    { ...empty, result_info: { ...empty.result_info, page: 2 } },
  ]) await assert.rejects(inventory({ request: async () => invalid }, '/project'), /Incomplete/);
});

test('similar branches remain untouched; exact production match aborts', () => {
  assert.deepEqual(matches([deployment(), deployment('other', {
    deployment_trigger: { metadata: { branch: branch + '-extra' } }, environment: 'production',
  })], branch).map(d => d.id), ['old']);
  assert.throws(() => matches([deployment('production', { environment: 'production' })], branch));
  assert.throws(() => matches([deployment('missing-env', { environment: undefined })], branch));
});

test('dry run inventories without deleting or probing', async () => {
  const cf = provider([[deployment()]]);
  const result = await operation(cf, { dryRun: true, fetcher: () => assert.fail('dry run probed') });
  assert.deepEqual(result.ids, ['old']);
  assert.equal(cf.deleted.length, 0);
});

test('branch exists: delayed deletion event never touches rebuilt preview', async () => {
  const cf = provider([[deployment()]]);
  const result = await operation(cf, { github: { request: async () => ({ object: { sha: 'a'.repeat(40) } }) } });
  assert.equal(result.skipped, 'branch exists');
  assert.equal(cf.deleted.length, 0);
});

test('branch recreation before a deletion stops mutation', async () => {
  let reads = 0;
  const cf = provider([[deployment()]]);
  const result = await operation(cf, { github: { request: async () => ++reads === 1 ? null : { object: { sha: 'a'.repeat(40) } } } });
  assert.equal(result.skipped, 'branch recreated');
  assert.equal(cf.deleted.length, 0);
});

test('404 deletion reconciles empty inventory and verifies hash plus alias', async () => {
  const item = deployment('old', { aliases: ['https://preview-test.writer-previews.pages.dev'] });
  const cf = provider([[item], [], [], [], []]);
  const urls = [];
  const result = await operation(cf, { plan: evidence(config, branch, [item]), fetcher: async u => {
    urls.push(u.href); return new Response('', { status: 410 });
  } });
  assert.equal(result.removed, true);
  assert.equal(result.checkedURLs, 2);
  assert.equal(cf.deleted.length, 1);
  assert.ok(cf.deleted[0].endsWith('force=true'));
  assert.ok(urls.every(u => u.includes('writer-removal-check=')));
});

test('branch already absent and no new event: cleanup still deletes retained deployments', async () => {
  const cf = provider([[deployment()], [], [], [], []]);
  assert.equal((await operation(cf)).removed, true);
  assert.equal(cf.deleted.length, 1);
});

test('lost response fails pending; persisted evidence enables idempotent verification on retry', async () => {
  await assert.rejects(operation(provider([[deployment()]], { failDelete: true })), /Lost deletion response/);
  const cf = provider([[]]);
  const result = await operation(cf);
  assert.equal(result.removed, true);
  assert.equal(result.checkedURLs, 1);
  assert.equal(cf.deleted.length, 0);
});

test('new deployment before mutation requires a persisted plan', async () => {
  const cf = provider([[deployment('late')]]);
  await assert.rejects(operation(cf), /persisted cleanup plan/);
  assert.equal(cf.deleted.length, 0);
});

test('late build, retained deployment and a public URL never confirm removal', async () => {
  await assert.rejects(operation(provider([[deployment()], [deployment('late')]])), /late deployment/);
  await assert.rejects(operation(provider([[deployment()]])), /Retained/);
  await assert.rejects(operation(provider([[deployment()], []]), { fetcher: async () => new Response('homepage fallback', { status: 200 }) }), /inconclusive/);
  await assert.rejects(operation(provider([[deployment()], []]), { fetcher: async () => { throw new Error('offline'); } }), /offline/);
});

test('historical URLs remain part of verification even when current inventory is empty', async () => {
  const result = await operation(provider([[]]), { plan: evidence(config, branch, []),
    previous: [evidence(config, branch, [deployment('prior')])] });
  assert.equal(result.checkedURLs, 1);
  await assert.rejects(verifyUnavailable([{ ...evidence(config, branch, [deployment()]), account: config.productionAccount }], config));
  assert.throws(() => evidence(config, branch, [deployment('wrong', { url: 'https://aaronnichol.com' })]));
});

test('empty inventory with no URL evidence never claims public removal', async () => {
  const result = await operation(provider([[]]), { plan: evidence(config, branch, []) });
  assert.equal(result.removed, false);
  assert.equal(result.inventoryEmpty, true);
});

test('429 and 5xx honor bounded retry; auth and 422 are never success', async () => {
  const waits = [];
  let requests = 0;
  const api = new API('https://api.cloudflare.com/client/v4', 'fake', { sleep: async ms => waits.push(ms),
    fetcher: async () => ++requests < 3 ? new Response('', { status: requests === 1 ? 429 : 503,
      headers: { 'Retry-After': '9999' } }) : Response.json({ success: true, result: [] }) });
  await api.request('/x');
  assert.equal(requests, 3);
  assert.deepEqual(waits, [30000, 30000]);
  for (const status of [401, 403, 422]) {
    let calls = 0;
    await assert.rejects(new API('https://api.cloudflare.com', 'fake', { fetcher: async () => {
      calls++; return new Response('', { status });
    } }).request('/x'), new RegExp(String(status)));
    assert.equal(calls, 1);
  }
});

test('malformed envelope and exhausted network retries fail closed', async () => {
  await assert.rejects(new API('https://api.cloudflare.com', 'fake', { fetcher: async () => Response.json({ success: false, result: [] }) }).request('/x'));
  await assert.rejects(new API('https://api.cloudflare.com', 'fake', { fetcher: async () => new Response('bad json') }).request('/x'));
  let calls = 0;
  await assert.rejects(new API('https://api.cloudflare.com', 'fake', { sleep: async () => {}, fetcher: async () => {
    calls++; throw new Error('offline');
  } }).request('/x'));
  assert.equal(calls, 4);
});

test('artifact provenance rejects fork, wrong workflow, wrong revision, dispatch and failure', () => {
  const run = { repository: { full_name: config.repository }, head_repository: { full_name: config.repository },
    path: '.github/workflows/writer-preview-build.yml', workflow_id: 123, event: 'push',
    status: 'completed', conclusion: 'success', head_branch: branch, head_sha: 'a'.repeat(40) };
  const expected = { branch, sha: run.head_sha };
  validateBuildRun(run, { id: 123 }, config, expected);
  for (const change of [{ head_repository: { full_name: 'evil/fork' } }, { workflow_id: 456 },
    { head_sha: 'b'.repeat(40) }, { event: 'workflow_dispatch' }, { conclusion: 'failure' }, { head_branch: 'main' }]) {
    assert.throws(() => validateBuildRun({ ...run, ...change }, { id: 123 }, config, expected));
  }
});

test('artifact data never contains workers, functions, configs or symbolic links', async () => {
  const root = await mkdtemp(join(tmpdir(), 'writer-preview-test-'));
  try {
    await writeFile(join(root, 'index.html'), '<html>disposable</html>');
    assert.equal((await validateStaticDirectory(root)).files, 1);
    for (const name of ['_worker.js', 'wrangler.jsonc', '.env', 'functions-filepath-routing-config.json']) {
      await writeFile(join(root, name), 'untrusted');
      await assert.rejects(validateStaticDirectory(root));
      await rm(join(root, name));
    }
    await mkdir(join(root, 'functions'));
    await assert.rejects(validateStaticDirectory(root));
    await rm(join(root, 'functions'), { recursive: true });
    await symlink('/etc/passwd', join(root, 'escape'));
    await assert.rejects(validateStaticDirectory(root));
  } finally { await rm(root, { recursive: true, force: true }); }
});
