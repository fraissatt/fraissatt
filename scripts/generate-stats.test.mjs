import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, loadFromApi } from './generate-stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, 'fixtures', 'sample.json');
const tmp = () => mkdtemp(path.join(os.tmpdir(), 'stats-'));

const okFetch = async (url) => {
  const body = url.endsWith('/users/fraissatt') ? { login: 'fraissatt', followers: 5, public_repos: 1 }
    : url.includes('/repos?') ? [{ name: 'a', stargazers_count: 2, fork: false }]
    : url.includes('/languages') ? { Java: 100 }
    : url.endsWith('/graphql') ? { data: { user: { contributionsCollection: { totalCommitContributions: 42 } } } }
    : null;
  return { ok: body !== null, status: body ? 200 : 404, json: async () => body };
};

test('fixture mode writes both SVGs', async () => {
  const outDir = await tmp();
  await run({ outDir, fixture });
  assert.deepEqual((await readdir(outDir)).sort(), ['stats-languages.svg', 'stats-overview.svg']);
  const overview = await readFile(path.join(outDir, 'stats-overview.svg'), 'utf8');
  assert.match(overview, />120</);
});

test('API mode without token renders - for commits', async () => {
  const outDir = await tmp();
  await run({ outDir, fetchImpl: okFetch });
  const overview = await readFile(path.join(outDir, 'stats-overview.svg'), 'utf8');
  assert.match(overview, />-</);
});

test('API mode with token reads the commit count', async () => {
  const data = await loadFromApi({ fetchImpl: okFetch, token: 't' });
  assert.equal(data.commits, 42);
});

test('API failure rejects and writes nothing', async () => {
  const outDir = await tmp();
  const failing = async () => ({ ok: false, status: 500, json: async () => ({}) });
  await assert.rejects(run({ outDir, fetchImpl: failing }), /GitHub API 500/);
  assert.deepEqual(await readdir(outDir), []);
});

test('GraphQL errors reject', async () => {
  const gqlError = async (url) => url.endsWith('/graphql')
    ? { ok: true, status: 200, json: async () => ({ errors: [{ message: 'boom' }] }) }
    : okFetch(url);
  await assert.rejects(loadFromApi({ fetchImpl: gqlError, token: 't' }), /boom/);
});

test('pagination collects every page of repositories', async () => {
  const page1 = Array.from({ length: 100 }, (_, i) => ({ name: `r${i}`, stargazers_count: 0, fork: false }));
  const paged = async (url) => {
    if (url.includes('/repos?') && url.endsWith('&page=1')) return { ok: true, status: 200, json: async () => page1 };
    if (url.includes('/repos?') && url.endsWith('&page=2')) return { ok: true, status: 200, json: async () => [{ name: 'last', stargazers_count: 0, fork: false }] };
    return okFetch(url);
  };
  const data = await loadFromApi({ fetchImpl: paged });
  assert.equal(data.repos.length, 101);
});

test('private repositories are excluded and never queried for languages', async () => {
  const seen = [];
  const mixed = async (url) => {
    seen.push(url);
    if (url.includes('/repos?')) {
      return { ok: true, status: 200, json: async () => [
        { name: 'pub', stargazers_count: 1, fork: false, private: false },
        { name: 'secret', stargazers_count: 9, fork: false, private: true },
      ] };
    }
    return okFetch(url);
  };
  const data = await loadFromApi({ fetchImpl: mixed });
  assert.deepEqual(data.repos.map((r) => r.name), ['pub']);
  assert.ok(!seen.some((u) => u.includes('/secret/')), 'queried a private repo');
});
