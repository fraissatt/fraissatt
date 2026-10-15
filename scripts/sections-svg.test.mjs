import test from 'node:test';
import assert from 'node:assert/strict';
import {
  wrapText, renderStintsSvg, renderPowerUnitSvg, renderPodiumStepSvg,
} from './sections-svg.mjs';

const heightOf = (svg) => Number(svg.match(/^<svg [^>]*height="(\d+)"/)[1]);
const count = (svg, needle) => svg.split(needle).length - 1;

test('wrapText wraps on word boundaries and never exceeds max', () => {
  assert.deepEqual(wrapText('aaa bbb ccc ddd eee', 7), ['aaa bbb', 'ccc ddd', 'eee']);
});

test('wrapText keeps an over-long word on its own line', () => {
  assert.deepEqual(wrapText('hi supercalifragilistic yo', 6), ['hi', 'supercalifragilistic', 'yo']);
});

test('wrapText of blank text is empty', () => {
  assert.deepEqual(wrapText('   ', 10), []);
});

const stints = [
  { n: 2, org: 'B & Co', period: '2025 – 2026', text: 'x '.repeat(80).trim() },
  { n: 1, org: 'A', period: '01/2024', text: 'short' },
];

test('stints: one row per stint, escaped, titled', () => {
  const svg = renderStintsSvg(stints, 'RACE STRATEGY · Stints');
  assert.equal(count(svg, 'class="pos"'), 2);
  assert.match(svg, />B &amp; Co</);
  assert.doesNotMatch(svg, /B & Co/);
  assert.match(svg, /RACE STRATEGY/);
  assert.doesNotMatch(svg, /NaN|undefined/);
});

test('stints: a long description makes the card taller', () => {
  const short = renderStintsSvg([stints[1]], 'T');
  const long = renderStintsSvg([stints[0]], 'T');
  assert.ok(heightOf(long) > heightOf(short));
});

const categories = [
  { name: 'ENGINE', label: 'Back-end', items: ['Java', 'C#'] },
  { name: 'FUEL & CO', label: 'Dados', items: ['SQL'] },
];

test('power unit: one chip per technology, names escaped', () => {
  const svg = renderPowerUnitSvg(categories, 'POWER UNIT · Stack');
  assert.equal(count(svg, 'class="chip"'), 3);
  assert.match(svg, />ENGINE</);
  assert.match(svg, />FUEL &amp; CO</);
  assert.doesNotMatch(svg, /NaN|undefined/);
});

const step = (place) => renderPodiumStepSvg({
  place, name: 'a<b>', lang: 'Java', text: 'Projeto em Java sobre boas práticas de software', trophyBase64: 'CCCC',
});
const stepHeight = (svg) => Number(svg.match(/class="step"[^>]*height="([\d.]+)"/)[1]);

test('podium: steps get lower from 1st to 3rd, only the winner has a trophy', () => {
  const [s1, s2, s3] = [1, 2, 3].map(step);
  assert.ok(stepHeight(s1) > stepHeight(s2));
  assert.ok(stepHeight(s2) > stepHeight(s3));
  assert.match(s1, /<image class="trophy"[^>]*href="data:image\/png;base64,CCCC"/);
  assert.doesNotMatch(s2, /class="trophy"/);
  assert.doesNotMatch(s3, /class="trophy"/);
});

test('podium: shows the place number and escapes the name', () => {
  const svg = step(2);
  assert.match(svg, />2</);
  assert.match(svg, />a&lt;b&gt;</);
  assert.doesNotMatch(svg, /a<b>/);
});

test('power unit: every known technology chip carries a logo', () => {
  const svg = renderPowerUnitSvg(categories, 'T');
  assert.equal(count(svg, 'class="logo"'), count(svg, 'class="chip"'));
});

test('power unit: an unknown technology still gets a chip, just without a logo', () => {
  const svg = renderPowerUnitSvg([{ name: 'X', label: 'y', items: ['Cobol 9000'] }], 'T');
  assert.equal(count(svg, 'class="chip"'), 1);
  assert.equal(count(svg, 'class="logo"'), 0);
  assert.match(svg, />Cobol 9000</);
});
