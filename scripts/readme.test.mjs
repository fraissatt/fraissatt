import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(path.join(root, name), 'utf8');
const pt = read('README.md');
const en = read('README.en.md');
const ART = [
  'assets/art/ferrari.png', 'assets/art/mclaren.png',
  ...['helmet', 'trophy', 'track-interlagos', 'track-monza', 'track-suzuka', 'track-monaco']
    .map((name) => `assets/art/${name}.svg`),
];
const headings = (text) => text.split('\n').filter((line) => line.startsWith('## '));

test('both READMEs have the same number of sections', () => {
  assert.equal(headings(pt).length, 7);
  assert.equal(headings(en).length, 7);
});

test('READMEs link to each other', () => {
  assert.match(pt, /\(README\.en\.md\)/);
  assert.match(en, /\(README\.md\)/);
});

test('both READMEs reference existing banner and stats SVGs', () => {
  for (const text of [pt, en]) {
    for (const asset of ['assets/banner.svg', 'assets/stats-overview.svg', 'assets/stats-languages.svg', ...ART]) {
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
