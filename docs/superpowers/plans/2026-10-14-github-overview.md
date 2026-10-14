# GitHub Profile Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the bilingual (PT-BR / English) profile README for `github.com/fraissatt` plus a zero-dependency Node script and GitHub Action that generate two self-hosted statistics SVGs.

**Architecture:** Pure data functions (`stats-data.mjs`) feed pure SVG renderers (`stats-svg.mjs`); `generate-stats.mjs` loads data from the GitHub API (or a fixture), renders both SVGs in memory, and only then writes files, so a failure never leaves partial output. A scheduled workflow runs the script and commits the SVGs only when they change. The READMEs reference the SVGs by relative path.

**Tech Stack:** Node 20 (built-in `fetch`, `node:test`, no npm dependencies), GitHub Actions, Markdown, SVG with embedded CSS.

**Spec:** `docs/superpowers/specs/2026-10-14-github-overview-design.md`

## Global Constraints

- Working directory for everything: `C:\Users\João Vítor Mamede\Documents\Overview-GitHub` (this becomes the repo `fraissatt/fraissatt`).
- Node 20, ES modules (`.mjs`), zero npm dependencies, tests with `node:test`.
- GitHub login is `fraissatt`. API auth only via the `GITHUB_TOKEN` env var (the Action's built-in token); no personal tokens.
- No third-party stats services. (Static shields.io badges for the stack are allowed; they are not stats.)
- Theme: Formula 1. Stats SVGs are a fixed dark "timing tower" (black/white, one red accent `#e10600`, monospace), identical in GitHub light and dark themes, self-contained, with bilingual short labels so one set serves both READMEs. No F1 or team logos or trademarks anywhere.
- READMEs: `README.md` is PT-BR, `README.en.md` is English; both show `assets/banner.svg`, link to each other at the top, have the same six F1-named `##` sections in the same order (Driver Profile, Stints, Power Unit, Podium, Telemetry, Team Radio), and omit email and phone.
- Facts come only from the Lattes CV and the GitHub API. Do not invent employers, dates, or project claims.
- Commit messages: plain conventional messages, with NO `Co-Authored-By` line and NO mention of Claude or AI (user's standing rule).
- Never create the GitHub remote, push, or change GitHub settings. The user does that.

## Review Focus

Failure modes the spec implies but does not spell out (each is pinned by a test in the named task):

1. No non-fork repos or no language data: renders "Sem dados · No data", no `NaN` or division by zero (Task 3).
2. Language names containing XML-special characters (`&`, `<`): escaped, SVG stays well-formed (Task 3).
3. API failure (HTTP error): script rejects and writes nothing, so existing SVGs stay untouched (Task 4).
4. More than 100 repositories: pagination collects all pages (Task 4).
5. No token (local run): commits shows `—`, never `null` or `0` (Tasks 3 and 4).
6. Forks are excluded from repo count, stars, and language totals (Task 2).

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `.gitignore`, `scripts/fixtures/sample.json`
- Run: `git init` in the project folder

**Interfaces:**
- Produces: `scripts/fixtures/sample.json`, an object `{ user: { login, followers, public_repos }, repos: [{ name, stargazers_count, fork, languages: { [lang]: bytes } }], commits: number|null }`, used by later tests.

- [ ] **Step 1: Check Node version**

Run: `node --version`
Expected: `v20.x` or higher. If lower, stop and tell the user.

- [ ] **Step 2: Initialize git and create `package.json`**

Run: `git init -b main`

```json
{
  "name": "fraissatt-profile",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "stats": "node scripts/generate-stats.mjs"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.DS_Store
Thumbs.db
```

- [ ] **Step 4: Create `scripts/fixtures/sample.json`**

This is made-up sample data for tests and local previews only. It must never be used to generate the committed `assets/*.svg`.

```json
{
  "user": { "login": "fraissatt", "followers": 5, "public_repos": 5 },
  "repos": [
    { "name": "metas-app", "stargazers_count": 2, "fork": false,
      "languages": { "TypeScript": 52000, "CSS": 3000, "HTML": 1200 } },
    { "name": "Site-Senai", "stargazers_count": 0, "fork": false,
      "languages": { "HTML": 30000, "JavaScript": 8000 } },
    { "name": "boas-praticas-software", "stargazers_count": 0, "fork": false,
      "languages": { "Java": 41000 } },
    { "name": "exercicios_25-08", "stargazers_count": 0, "fork": false,
      "languages": { "Dart": 9000 } },
    { "name": "some-fork", "stargazers_count": 99, "fork": true,
      "languages": { "Python": 999999 } }
  ],
  "commits": 120
}
```

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore scripts/fixtures/sample.json docs
git commit -m "chore: scaffold profile project"
```

---

### Task 2: Data functions (`summarize`, `aggregateLanguages`)

**Files:**
- Create: `scripts/stats-data.mjs`
- Test: `scripts/stats-data.test.mjs`

**Interfaces:**
- Consumes: the data shape from Task 1.
- Produces:
  - `summarize({ user, repos, commits }) -> { repos: number, stars: number, commits: number|null, followers: number }` (forks excluded from `repos` and `stars`).
  - `aggregateLanguages(repos, top = 6) -> Array<{ name: string, bytes: number, percent: number }>` sorted by bytes descending (ties by name), forks ignored, languages beyond `top` merged into `{ name: 'Other' }`, `percent` rounded to 1 decimal, `[]` when there are no bytes.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, aggregateLanguages } from './stats-data.mjs';

const repos = [
  { name: 'a', stargazers_count: 2, fork: false, languages: { Java: 600, HTML: 100 } },
  { name: 'b', stargazers_count: 3, fork: false, languages: { Java: 300 } },
  { name: 'f', stargazers_count: 50, fork: true, languages: { Python: 99999 } },
];

test('summarize excludes forks from repos and stars', () => {
  const s = summarize({ user: { followers: 5 }, repos, commits: 120 });
  assert.deepEqual(s, { repos: 2, stars: 5, commits: 120, followers: 5 });
});

test('summarize keeps null commits as null', () => {
  const s = summarize({ user: { followers: 0 }, repos: [], commits: null });
  assert.equal(s.commits, null);
});

test('aggregateLanguages sums, sorts, ignores forks, computes percent', () => {
  const langs = aggregateLanguages(repos);
  assert.deepEqual(langs, [
    { name: 'Java', bytes: 900, percent: 90 },
    { name: 'HTML', bytes: 100, percent: 10 },
  ]);
});

test('aggregateLanguages merges languages beyond top into Other', () => {
  const many = [{ fork: false, languages: { A: 50, B: 40, C: 30, D: 20 } }];
  const langs = aggregateLanguages(many, 2);
  assert.deepEqual(langs.map((l) => l.name), ['A', 'B', 'Other']);
  assert.equal(langs[2].bytes, 50);
});

test('aggregateLanguages returns [] when there is no language data', () => {
  assert.deepEqual(aggregateLanguages([]), []);
  assert.deepEqual(aggregateLanguages([{ fork: false }]), []);
  assert.deepEqual(aggregateLanguages([{ fork: true, languages: { X: 5 } }]), []);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/stats-data.test.mjs`
Expected: FAIL (cannot find module `./stats-data.mjs`).

- [ ] **Step 3: Implement `scripts/stats-data.mjs`**

```js
export function summarize({ user, repos, commits }) {
  const own = repos.filter((repo) => !repo.fork);
  return {
    repos: own.length,
    stars: own.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    commits,
    followers: user.followers,
  };
}

export function aggregateLanguages(repos, top = 6) {
  const totals = new Map();
  for (const repo of repos) {
    if (repo.fork) continue;
    for (const [name, bytes] of Object.entries(repo.languages ?? {})) {
      totals.set(name, (totals.get(name) ?? 0) + bytes);
    }
  }
  const grand = [...totals.values()].reduce((sum, bytes) => sum + bytes, 0);
  if (grand === 0) return [];

  const sorted = [...totals.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
  const head = sorted.slice(0, top);
  const restBytes = sorted.slice(top).reduce((sum, [, bytes]) => sum + bytes, 0);
  if (restBytes > 0) head.push(['Other', restBytes]);

  return head.map(([name, bytes]) => ({
    name,
    bytes,
    percent: Math.round((bytes / grand) * 1000) / 10,
  }));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/stats-data.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/stats-data.mjs scripts/stats-data.test.mjs
git commit -m "feat: add stats data functions"
```

---

### Task 3: SVG renderers (F1 timing-tower style)

**Files:**
- Create: `scripts/stats-svg.mjs`
- Test: `scripts/stats-svg.test.mjs`

**Interfaces:**
- Consumes: output shapes of `summarize` and `aggregateLanguages` (Task 2).
- Produces:
  - `escapeXml(value) -> string`
  - `renderOverviewSvg({ repos, stars, commits, followers }) -> string`: a timing-tower card titled `TIMING · Visão geral · Overview` with four rows (`REPOS`, `STARS`, `COMMITS`, `FOLLOWERS`), each with a position cell (1 to 4), a bilingual tag and a right-aligned value. A `null`/`undefined` field renders as `—`.
  - `renderLanguagesSvg(langs) -> string`: a card titled `TYRE STRATEGY · Linguagens · Languages` with a stint bar and one row per language (position cell, tyre-colored dot, name, right-aligned percent). Empty input renders the text `Sem dados · No data`.
  - Bar segments are `<rect class="seg" x=".." y="52" width=".." .../>` whose widths sum to 447.
  - Design: fixed dark card (broadcast graphic, identical in GitHub light and dark themes), monospace font, one red accent `#e10600`. Tyre-compound colors (soft red, medium yellow, hard white, intermediate green, wet blue) are used only for ranks 1 to 5 in the languages card; `Other` and ranks beyond 5 are gray. No F1 or team logos.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, renderOverviewSvg, renderLanguagesSvg } from './stats-svg.mjs';

test('escapeXml escapes the five XML special characters', () => {
  assert.equal(escapeXml(`a&b<c>"d'`), 'a&amp;b&lt;c&gt;&quot;d&apos;');
});

test('overview is a timing tower with values and bilingual tags', () => {
  const svg = renderOverviewSvg({ repos: 16, stars: 2, commits: 1234, followers: 5 });
  assert.match(svg, /^<svg /);
  assert.match(svg, /TIMING/);
  assert.match(svg, />REPOS</);
  assert.match(svg, />16</);
  assert.match(svg, />1,234</);
  assert.match(svg, /Repositórios · Repositories/);
  assert.match(svg, /#e10600/);
});

test('overview renders — for missing commits, never null or 0', () => {
  const svg = renderOverviewSvg({ repos: 1, stars: 0, commits: null, followers: 0 });
  assert.match(svg, />—</);
  assert.doesNotMatch(svg, /null|undefined|NaN/);
});

test('languages segment widths fill the bar exactly', () => {
  const svg = renderLanguagesSvg([
    { name: 'Java', bytes: 700, percent: 70 },
    { name: 'HTML', bytes: 200, percent: 20 },
    { name: 'CSS', bytes: 100, percent: 10 },
  ]);
  const widths = [...svg.matchAll(/class="seg" x="[\d.]+" y="\d+" width="([\d.]+)"/g)]
    .map((m) => Number(m[1]));
  assert.equal(widths.length, 3);
  const sum = widths.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 447) < 0.01, `sum was ${sum}`);
  assert.match(svg, />Java</);
  assert.match(svg, />70%</);
  assert.match(svg, /TYRE STRATEGY/);
});

test('languages escapes special characters in names', () => {
  const svg = renderLanguagesSvg([{ name: 'A&B<C>', bytes: 10, percent: 100 }]);
  assert.match(svg, />A&amp;B&lt;C&gt;</);
  assert.doesNotMatch(svg, /A&B<C>/);
});

test('languages with no data shows the empty message without NaN', () => {
  const svg = renderLanguagesSvg([]);
  assert.match(svg, /Sem dados · No data/);
  assert.doesNotMatch(svg, /NaN/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/stats-svg.test.mjs`
Expected: FAIL (cannot find module `./stats-svg.mjs`).

- [ ] **Step 3: Implement `scripts/stats-svg.mjs`**

```js
const FONT = "ui-monospace,'SF Mono',Consolas,'Liberation Mono',monospace";
const NS = 'xmlns="http://www.w3.org/2000/svg"';
const WIDTH = 495;
const BAR_X = 24;
const BAR_W = 447;
const RED = '#e10600';

const STYLE = `
.bg{fill:#0b0b0d;stroke:#2a2a2e}
.stripe{fill:${RED}}
.title{fill:#fff;font:700 13px ${FONT};letter-spacing:1.5px}
.pos{fill:#e9e9ee}
.posn{fill:#0b0b0d;font:700 13px ${FONT};text-anchor:middle}
.name{fill:#fff;font:700 14px ${FONT}}
.tag{fill:#9a9aa2;font:11px ${FONT}}
.value{fill:#fff;font:700 18px ${FONT};text-anchor:end}
.pct{fill:#fff;font:700 14px ${FONT};text-anchor:end}
.sep{stroke:#2a2a2e}
.track{fill:#26262b}`;

// Tyre compounds by rank: soft, medium, hard, intermediate, wet.
const TYRES = ['#ff3b30', '#ffd12e', '#f2f2f2', '#43b02a', '#0067ad'];
const GRAY = '#6b6b73';
const tyreColor = (lang, rank) => (lang.name === 'Other' ? GRAY : (TYRES[rank] ?? GRAY));

export function escapeXml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

const formatNumber = (n) =>
  n === null || n === undefined ? '—' : new Intl.NumberFormat('en-US').format(n);

function frame(height, label, title, body) {
  return `<svg ${NS} width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${escapeXml(label)}">` +
    `<style>${STYLE}</style>` +
    `<rect class="bg" x=".5" y=".5" width="${WIDTH - 1}" height="${height - 1}" rx="6"/>` +
    `<rect class="stripe" x="24" y="22" width="4" height="18"/>` +
    `<text class="title" x="36" y="36">${escapeXml(title)}</text>` +
    body + '</svg>';
}

function positionCell(rowY, position) {
  return `<line class="sep" x1="24" y1="${rowY}" x2="471" y2="${rowY}"/>` +
    `<rect class="pos" x="24" y="${rowY + 6}" width="24" height="24" rx="3"/>` +
    `<text class="posn" x="36" y="${rowY + 23}">${position}</text>`;
}

const OVERVIEW_ROWS = [
  ['repos', 'REPOS', 'Repositórios · Repositories'],
  ['stars', 'STARS', 'Estrelas · Stars'],
  ['commits', 'COMMITS', '12 meses · months'],
  ['followers', 'FOLLOWERS', 'Seguidores · Followers'],
];

export function renderOverviewSvg(stats) {
  const rows = OVERVIEW_ROWS.map(([key, name, tag], i) => {
    const y = 56 + i * 36;
    return positionCell(y, i + 1) +
      `<text class="name" x="60" y="${y + 23}">${name}</text>` +
      `<text class="tag" x="160" y="${y + 22}">${escapeXml(tag)}</text>` +
      `<text class="value" x="471" y="${y + 24}">${escapeXml(formatNumber(stats[key]))}</text>`;
  }).join('');
  return frame(214, 'GitHub overview', 'TIMING · Visão geral · Overview', rows);
}

export function renderLanguagesSvg(langs) {
  const title = 'TYRE STRATEGY · Linguagens · Languages';
  if (langs.length === 0) {
    const empty = '<text class="tag" x="24" y="70">Sem dados · No data</text>';
    return frame(100, 'GitHub languages', title, empty);
  }

  const totalBytes = langs.reduce((sum, lang) => sum + lang.bytes, 0);
  let x = BAR_X;
  const segments = langs.map((lang, i) => {
    const isLast = i === langs.length - 1;
    const width = isLast
      ? Math.round((BAR_X + BAR_W - x) * 100) / 100
      : Math.round((lang.bytes / totalBytes) * BAR_W * 100) / 100;
    const rect = `<rect class="seg" x="${x}" y="52" width="${width}" height="12" fill="${tyreColor(lang, i)}"/>`;
    x = Math.round((x + width) * 100) / 100;
    return rect;
  }).join('');

  const bar = `<clipPath id="bar"><rect x="${BAR_X}" y="52" width="${BAR_W}" height="12" rx="6"/></clipPath>` +
    `<rect class="track" x="${BAR_X}" y="52" width="${BAR_W}" height="12" rx="6"/>` +
    `<g clip-path="url(#bar)">${segments}</g>`;

  const rows = langs.map((lang, i) => {
    const y = 80 + i * 30;
    return positionCell(y, i + 1) +
      `<circle cx="66" cy="${y + 18}" r="6" fill="${tyreColor(lang, i)}"/>` +
      `<text class="name" x="82" y="${y + 23}">${escapeXml(lang.name)}</text>` +
      `<text class="pct" x="471" y="${y + 23}">${escapeXml(`${lang.percent}%`)}</text>`;
  }).join('');

  return frame(80 + langs.length * 30 + 14, 'GitHub languages', title, bar + rows);
}
```

- [ ] **Step 4: Run to verify pass**

Run: `node --test scripts/stats-svg.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/stats-svg.mjs scripts/stats-svg.test.mjs
git commit -m "feat: add F1 timing-tower stats SVG renderers"
```

---

### Task 4: Generator script (API loading, fixture mode, atomic output)

**Files:**
- Create: `scripts/generate-stats.mjs`
- Test: `scripts/generate-stats.test.mjs`

**Interfaces:**
- Consumes: `summarize`, `aggregateLanguages` (Task 2); `renderOverviewSvg`, `renderLanguagesSvg` (Task 3); fixture from Task 1.
- Produces:
  - `loadFromApi({ fetchImpl = fetch, token, login = 'fraissatt' }) -> Promise<{ user, repos, commits }>`. `commits` is `null` when `token` is falsy. Rejects with an `Error` on any non-OK response or GraphQL `errors`.
  - `run({ outDir, fixture, fetchImpl, token }) -> Promise<void>`. Renders both SVGs in memory first, then writes `stats-overview.svg` and `stats-languages.svg` into `outDir`.
  - CLI: `node scripts/generate-stats.mjs [--fixture path]` writes into `<project>/assets`.

- [ ] **Step 1: Write the failing tests**

```js
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

test('API mode without token renders — for commits', async () => {
  const outDir = await tmp();
  await run({ outDir, fetchImpl: okFetch });
  const overview = await readFile(path.join(outDir, 'stats-overview.svg'), 'utf8');
  assert.match(overview, />—</);
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
    if (url.includes('/repos?') && url.includes('page=1')) return { ok: true, status: 200, json: async () => page1 };
    if (url.includes('/repos?') && url.includes('page=2')) return { ok: true, status: 200, json: async () => [{ name: 'last', stargazers_count: 0, fork: false }] };
    return okFetch(url);
  };
  const data = await loadFromApi({ fetchImpl: paged });
  assert.equal(data.repos.length, 101);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/generate-stats.test.mjs`
Expected: FAIL (cannot find module `./generate-stats.mjs`).

- [ ] **Step 3: Implement `scripts/generate-stats.mjs`**

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateLanguages, summarize } from './stats-data.mjs';
import { renderLanguagesSvg, renderOverviewSvg } from './stats-svg.mjs';

const LOGIN = 'fraissatt';
const API = 'https://api.github.com';

async function getJson(fetchImpl, url, token, init = {}) {
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `${LOGIN}-profile-stats`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return response.json();
}

async function loadCommits(fetchImpl, token, login) {
  const body = await getJson(fetchImpl, `${API}/graphql`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'query($login:String!){user(login:$login){contributionsCollection{totalCommitContributions}}}',
      variables: { login },
    }),
  });
  if (body.errors) throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
  return body.data.user.contributionsCollection.totalCommitContributions;
}

export async function loadFromApi({ fetchImpl = fetch, token, login = LOGIN }) {
  const user = await getJson(fetchImpl, `${API}/users/${login}`, token);

  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = await getJson(
      fetchImpl,
      `${API}/users/${login}/repos?per_page=100&type=owner&page=${page}`,
      token,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  for (const repo of repos) {
    repo.languages = repo.fork
      ? {}
      : await getJson(fetchImpl, `${API}/repos/${login}/${repo.name}/languages`, token);
  }

  const commits = token ? await loadCommits(fetchImpl, token, login) : null;
  return { user, repos, commits };
}

export async function run({ outDir, fixture, fetchImpl, token }) {
  const data = fixture
    ? JSON.parse(await readFile(fixture, 'utf8'))
    : await loadFromApi({ fetchImpl, token });

  // Render everything before touching disk so a failure never leaves partial output.
  const overview = renderOverviewSvg(summarize(data));
  const languages = renderLanguagesSvg(aggregateLanguages(data.repos));

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'stats-overview.svg'), overview);
  await writeFile(path.join(outDir, 'stats-languages.svg'), languages);
}

const thisFile = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] ?? '') === thisFile) {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--fixture');
  const fixture = flag >= 0 ? path.resolve(args[flag + 1]) : undefined;
  const outDir = path.resolve(path.dirname(thisFile), '..', 'assets');
  run({ outDir, fixture, token: process.env.GITHUB_TOKEN }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Run all tests**

Run: `node --test`
Expected: PASS for `stats-data`, `stats-svg`, and `generate-stats` test files.

- [ ] **Step 5: Generate the real assets from the live public API**

Never use the fixture for the committed assets. If the `gh` CLI is logged in, pass its token so the commit count is real; otherwise commits shows `—` until the Action's first run.

Run (with gh): `GITHUB_TOKEN=$(gh auth token) node scripts/generate-stats.mjs`
Run (without gh): `node scripts/generate-stats.mjs`
Expected: no output, exit 0, and `assets/stats-overview.svg` plus `assets/stats-languages.svg` exist. If the API returns a rate-limit error (403), report it to the user rather than falling back to the fixture.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-stats.mjs scripts/generate-stats.test.mjs assets
git commit -m "feat: add stats generator and initial assets"
```

---

### Task 5: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/stats.yml`

**Interfaces:**
- Consumes: `node scripts/generate-stats.mjs` (Task 4), which reads `GITHUB_TOKEN` and writes `assets/*.svg`.

- [ ] **Step 1: Create `.github/workflows/stats.yml`**

```yaml
name: Update profile stats

on:
  schedule:
    - cron: '17 6 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  stats:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Generate stats
        run: node scripts/generate-stats.mjs
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Commit changes
        run: |
          if [ -z "$(git status --porcelain -- assets)" ]; then
            echo "No changes"
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add assets/stats-overview.svg assets/stats-languages.svg
          git commit -m "chore: update profile stats"
          git push
```

- [ ] **Step 2: Sanity-check the YAML**

Run: `node -e "const t=require('fs').readFileSync('.github/workflows/stats.yml','utf8'); for (const k of ['workflow_dispatch','contents: write','generate-stats.mjs','status --porcelain']) if(!t.includes(k)) throw new Error('missing '+k); console.log('ok')"`
Expected: `ok`. (This only checks the key lines are present; the workflow cannot actually run until the repo is published. State that in the handoff.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/stats.yml
git commit -m "ci: add scheduled stats workflow"
```

---

### Task 6: Bilingual F1-themed READMEs, banner and README checks

**Files:**
- Create: `assets/banner.svg` (static, hand-written, not generated), `README.md`, `README.en.md`
- Test: `scripts/readme.test.mjs`

**Interfaces:**
- Consumes: `assets/stats-overview.svg` and `assets/stats-languages.svg` (Task 4).
- Produces: two READMEs, each with the banner, a language link at the top, six `##` sections in the same order (Driver Profile, Stints, Power Unit, Podium, Telemetry, Team Radio) and relative links to both stats SVGs. Theme rules: F1 vocabulary in headings only, black/white/red look, no F1 or team logos.

- [ ] **Step 1: Write the failing README tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const pt = read('README.md');
const en = read('README.en.md');
const headings = (text) => text.split('\n').filter((line) => line.startsWith('## '));

test('both READMEs have the same number of sections', () => {
  assert.equal(headings(pt).length, 6);
  assert.equal(headings(en).length, 6);
});

test('READMEs link to each other', () => {
  assert.match(pt, /\(README\.en\.md\)/);
  assert.match(en, /\(README\.md\)/);
});

test('both READMEs reference existing banner and stats SVGs', () => {
  for (const text of [pt, en]) {
    for (const asset of ['assets/banner.svg', 'assets/stats-overview.svg', 'assets/stats-languages.svg']) {
      assert.ok(text.includes(asset), `missing ${asset}`);
      assert.ok(existsSync(path.join(root, asset)), `file not found: ${asset}`);
    }
  }
});

test('READMEs contain no placeholders, emails or phone numbers', () => {
  for (const text of [pt, en]) {
    assert.doesNotMatch(text, /TODO|TBD|lorem/i);
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[\w.]+/);
    assert.doesNotMatch(text, /\(\d{2}\)\s?\d{4,5}-?\d{4}/);
  }
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node --test scripts/readme.test.mjs`
Expected: FAIL (README files and banner do not exist).

- [ ] **Step 3: Create `assets/banner.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="160" viewBox="0 0 900 160" role="img" aria-label="João Vítor Mamede · Software Engineering · Full Stack Developer">
  <defs>
    <pattern id="check" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#ffffff"/>
      <rect width="10" height="10" fill="#0b0b0d"/>
      <rect x="10" y="10" width="10" height="10" fill="#0b0b0d"/>
    </pattern>
  </defs>
  <rect width="900" height="160" fill="#0b0b0d"/>
  <rect width="10" height="160" fill="#e10600"/>
  <text x="44" y="70" fill="#ffffff" font-family="ui-monospace,'SF Mono',Consolas,'Liberation Mono',monospace" font-size="34" font-weight="700" letter-spacing="2">JOÃO VÍTOR MAMEDE</text>
  <text x="44" y="102" fill="#9a9aa2" font-family="ui-monospace,'SF Mono',Consolas,'Liberation Mono',monospace" font-size="15" letter-spacing="1">SOFTWARE ENGINEERING · FULL STACK DEVELOPER</text>
  <rect x="44" y="116" width="48" height="4" fill="#e10600"/>
  <rect y="140" width="900" height="20" fill="url(#check)"/>
</svg>
```

- [ ] **Step 4: Create `README.md` (PT-BR)**

````markdown
<div align="center">

<img src="assets/banner.svg" alt="João Vítor Mamede · Software Engineering · Full Stack Developer" />

🇧🇷 Português · [🇬🇧 English](README.en.md)

</div>

## 🏁 Driver Profile — Sobre mim

Cursando o 8º período de Engenharia de Software na **Faculdade SENAI Fatesg** (desde 2023), com foco em aplicações web, liderança em projetos acadêmicos e desenvolvimento full stack. Estagiei na matriz da **ZEISS**, em Oberkochen (Alemanha), e atuo com metrologia, transformação digital e inovação tecnológica.

- 🎓 Engenharia de Software, Faculdade SENAI Fatesg
- 🌍 Estágio internacional na ZEISS IQS, Alemanha
- 🗣️ Português · Inglês (fluente, certificação ECCE) · Alemão (intermediário)
- 📜 AWS Academy Cloud Foundations · Curso de Metrologia (INMETRO)
- 📍 Goiânia, Brasil

## 🛞 Stints — Experiência

| Stint | Período | Onde | O que fiz |
|---|---|---|---|
| 4 | 2025 – 2026 | **ZEISS IQS**, Oberkochen, Alemanha | Estágio internacional: desenvolvimento e manutenção de aplicações web com C#, Angular, SQL, REST APIs, Swagger e Git/GitHub |
| 3 | 01/2025 – 09/2025 | **Centro de Metrologia SENAI ZEISS** | ZEISS PILOT, sistema web de gestão do laboratório (Spring Boot, PostgreSQL, dashboards e relatórios); operação de equipamentos de metrologia |
| 2 | 06/2024 – 01/2025 | **Instituto SENAI de Tecnologia em Automação** | Desenvolvimento full stack de sistema web para relatórios de Emissão Acústica: hierarquia de usuários, dashboards dinâmicos e engenharia de requisitos |
| 1 | 01/2024 – 04/2024 | **Integra Engenharia de Sistemas** | Estágio em suporte: instalação e configuração de sistemas operacionais |

## ⚙️ Power Unit — Stack

![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![C#](https://img.shields.io/badge/C%23-512BD4?style=flat&logo=dotnet&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=flat&logo=dart&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonwebservices&logoColor=white)

## 🏆 Podium — Projetos em destaque

| Pos. | Projeto | Descrição |
|---|---|---|
| 🥇 | [metas-app](https://github.com/fraissatt/metas-app) | Aplicação web em TypeScript · [demo](https://metas-app-flax.vercel.app) |
| 🥈 | [CEM-Senai-Zeiss](https://github.com/fraissatt/CEM-Senai-Zeiss) | Projeto em JavaScript ligado ao Centro de Metrologia SENAI ZEISS |
| 🥉 | [Site-Senai](https://github.com/fraissatt/Site-Senai) | Site de gestão de empresas, usuários, agendamentos e documentos |
| P4 | [cadastro-alunos](https://github.com/fraissatt/cadastro-alunos) | Sistema de cadastro de alunos com Angular |

## ⏱️ Telemetry — Estatísticas

<img src="assets/stats-overview.svg" alt="Visão geral do GitHub" />
<img src="assets/stats-languages.svg" alt="Linguagens mais usadas" />

<sub>Gerado diariamente por GitHub Actions a partir de repositórios públicos. A contagem de commits considera apenas contribuições públicas.</sub>

## 📻 Team Radio — Contato

- 💼 [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-v%C3%ADtor-de-alencar-fraissat-mamede-a59394270/)
- 📄 [Currículo Lattes](http://lattes.cnpq.br/2934832325743292)
````

- [ ] **Step 5: Create `README.en.md` (English)**

````markdown
<div align="center">

<img src="assets/banner.svg" alt="João Vítor Mamede · Software Engineering · Full Stack Developer" />

[🇧🇷 Português](README.md) · 🇬🇧 English

</div>

## 🏁 Driver Profile — About me

8th-term Software Engineering student at **Faculdade SENAI Fatesg** (since 2023), focused on web applications, project leadership and full stack development. I completed an international internship at **ZEISS** headquarters in Oberkochen, Germany, and I work at the intersection of metrology, digital transformation and technological innovation.

- 🎓 Software Engineering, Faculdade SENAI Fatesg
- 🌍 International internship at ZEISS IQS, Germany
- 🗣️ Portuguese · English (fluent, ECCE certified) · German (intermediate)
- 📜 AWS Academy Cloud Foundations · Metrology course (INMETRO)
- 📍 Goiânia, Brazil

## 🛞 Stints — Experience

| Stint | Period | Where | What I did |
|---|---|---|---|
| 4 | 2025 – 2026 | **ZEISS IQS**, Oberkochen, Germany | International internship: development and maintenance of web applications with C#, Angular, SQL, REST APIs, Swagger and Git/GitHub |
| 3 | 01/2025 – 09/2025 | **SENAI ZEISS Metrology Center** | ZEISS PILOT, a web system to manage the laboratory (Spring Boot, PostgreSQL, dashboards and reports); hands-on operation of metrology equipment |
| 2 | 06/2024 – 01/2025 | **SENAI Institute of Automation Technology** | Full stack development of a web system for Acoustic Emission reports: user hierarchy, dynamic dashboards and requirements engineering |
| 1 | 01/2024 – 04/2024 | **Integra Engenharia de Sistemas** | Support internship: installation and configuration of operating systems |

## ⚙️ Power Unit — Stack

![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat&logo=angular&logoColor=white)
![C#](https://img.shields.io/badge/C%23-512BD4?style=flat&logo=dotnet&logoColor=white)
![Dart](https://img.shields.io/badge/Dart-0175C2?style=flat&logo=dart&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonwebservices&logoColor=white)

## 🏆 Podium — Featured projects

| Pos. | Project | Description |
|---|---|---|
| 🥇 | [metas-app](https://github.com/fraissatt/metas-app) | TypeScript web application · [demo](https://metas-app-flax.vercel.app) |
| 🥈 | [CEM-Senai-Zeiss](https://github.com/fraissatt/CEM-Senai-Zeiss) | JavaScript project tied to the SENAI ZEISS Metrology Center |
| 🥉 | [Site-Senai](https://github.com/fraissatt/Site-Senai) | Management site for companies, users, scheduling and documents |
| P4 | [cadastro-alunos](https://github.com/fraissatt/cadastro-alunos) | Student registration system built with Angular |

## ⏱️ Telemetry — Statistics

<img src="assets/stats-overview.svg" alt="GitHub overview" />
<img src="assets/stats-languages.svg" alt="Most used languages" />

<sub>Generated daily by GitHub Actions from public repositories. The commit count only includes public contributions.</sub>

## 📻 Team Radio — Contact

- 💼 [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-v%C3%ADtor-de-alencar-fraissat-mamede-a59394270/)
- 📄 [Lattes CV](http://lattes.cnpq.br/2934832325743292)
````

- [ ] **Step 6: Run all tests**

Run: `node --test`
Expected: PASS for every test file, including the four README tests.

- [ ] **Step 7: Commit**

```bash
git add assets/banner.svg README.md README.en.md scripts/readme.test.mjs
git commit -m "docs: add bilingual F1-themed profile README and banner"
```

---

### Task 7: Final verification and handoff

**Files:** none created; verification only.

- [ ] **Step 1: Full test run**

Run: `node --test`
Expected: all tests pass, 0 failures.

- [ ] **Step 2: Visual check of the SVGs in light and dark themes**

Open `assets/stats-overview.svg` and `assets/stats-languages.svg` with the Browser pane (`file:///C:/Users/Jo%C3%A3o%20V%C3%ADtor%20Mamede/Documents/Overview-GitHub/assets/stats-overview.svg`), using `resize_window` with `colorScheme` set to `light`, then `dark`. Confirm: the card looks identical in both (fixed dark design), text is readable, nothing is clipped, bar segments fill the track, and the tyre colors only appear in the languages card. Also open `assets/banner.svg`. Reset the viewport to `desktop` afterward. Fix `scripts/stats-svg.mjs` and regenerate if anything is off, then re-run `node --test`.

- [ ] **Step 3: Visual check of the READMEs**

Preview `README.md` and `README.en.md` in the Browser pane (any Markdown preview that works locally). Confirm tables render, badges load, and the language link at the top points to the other file. Badge images need internet; a missing badge offline is not a defect.

- [ ] **Step 4: Confirm repo state**

Run: `git status --short` and `git log --oneline`
Expected: clean tree; commits from Tasks 1 to 6; no `Co-Authored-By` line in any message (`git log --format=%B | grep -ci "co-authored"` prints `0`).

- [ ] **Step 5: Handoff report to the user**

Report plainly: what was built and verified (tests, SVG render in both themes); what was NOT verified (the workflow has never run, live commit count depends on the first Action run if no token was available locally, badge images need internet); and the user's to-do list:
1. Review the four project descriptions (`metas-app` and `CEM-Senai-Zeiss` are deliberately generic because the repos have no description; Site-Senai and cadastro-alunos come from the repo descriptions).
2. Check the LinkedIn link (the Lattes PDF extraction garbled the accents; the URL is percent-encoded from the name).
3. Create the public repo `fraissatt/fraissatt` on GitHub, push this folder, and run the "Update profile stats" workflow once from the Actions tab.
4. Note that GitHub disables scheduled workflows after 60 days without repository activity; the bot commits count as activity only when stats change.
