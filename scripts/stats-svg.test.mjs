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

test('overview renders - for missing commits, never null or 0', () => {
  const svg = renderOverviewSvg({ repos: 1, stars: 0, commits: null, followers: 0 });
  assert.match(svg, />-</);
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
