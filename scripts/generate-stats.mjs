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
