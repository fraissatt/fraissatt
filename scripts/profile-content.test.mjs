import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT } from './profile-content.mjs';
import { wrapText } from './sections-svg.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function strings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
}

test('pt and en describe the same stints, categories and podium', () => {
  const { pt, en } = CONTENT;
  assert.deepEqual(pt.stints.map((s) => s.n), en.stints.map((s) => s.n));
  assert.deepEqual(pt.categories.map((c) => c.name), en.categories.map((c) => c.name));
  assert.deepEqual(pt.categories.map((c) => c.items), en.categories.map((c) => c.items));
  assert.deepEqual(pt.podium.map((p) => [p.place, p.name, p.url]), en.podium.map((p) => [p.place, p.name, p.url]));
});

test('there are four stints, five categories and a three-step podium', () => {
  for (const lang of ['pt', 'en']) {
    assert.equal(CONTENT[lang].stints.length, 4);
    assert.equal(CONTENT[lang].categories.length, 5);
    assert.deepEqual(CONTENT[lang].podium.map((p) => p.place), [1, 2, 3]);
  }
});

test('no content string is blank', () => {
  for (const text of strings(CONTENT)) assert.ok(text.trim().length > 0);
});

test('podium descriptions fit in three lines of the step card', () => {
  for (const lang of ['pt', 'en']) {
    for (const p of CONTENT[lang].podium) {
      assert.ok(wrapText(p.text, 36).length <= 3, `${lang} ${p.name}`);
    }
  }
});

function svgFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return svgFiles(full);
    return full.endsWith('.svg') ? [full] : [];
  });
}

test('no em dash anywhere in the READMEs, SVGs or content data', () => {
  const files = [
    path.join(root, 'README.md'),
    path.join(root, 'README.en.md'),
    path.join(root, 'scripts', 'profile-content.mjs'),
    ...svgFiles(path.join(root, 'assets')),
  ];
  for (const file of files) {
    assert.ok(!readFileSync(file, 'utf8').includes('—'), `em dash in ${path.relative(root, file)}`);
  }
});

test('the podium ranks the requested repositories 2nd and 3rd', () => {
  for (const lang of ['pt', 'en']) {
    const [first, second, third] = CONTENT[lang].podium;
    assert.equal(first.url, 'https://github.com/fraissatt/metas-app');
    assert.equal(second.url, 'https://github.com/GabrielVianaNunes/TCC');
    assert.equal(third.url, 'https://github.com/ThiagoFalcone/dfc-planner');
  }
});

test('every podium name matches its repository URL and fits the step card', () => {
  for (const lang of ['pt', 'en']) {
    for (const p of CONTENT[lang].podium) {
      assert.ok(p.url.startsWith('https://github.com/'), p.url);
      assert.ok(p.url.endsWith(`/${p.name.split('/').pop()}`), `${p.name} vs ${p.url}`);
      assert.ok(p.name.length * 8.4 + 20 <= 262, `${p.name} is too wide for the step card`);
    }
  }
});
