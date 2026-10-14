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
