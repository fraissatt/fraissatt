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
