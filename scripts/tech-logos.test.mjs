import test from 'node:test';
import assert from 'node:assert/strict';
import { LOGOS, logoFor } from './tech-logos.mjs';
import { CONTENT } from './profile-content.mjs';
import { isBalanced } from './test-helpers.mjs';

const ALLOWED_TAGS = new Set([
  'g', 'path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line',
  'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask',
]);

test('every technology shown in the Power Unit has a logo', () => {
  for (const lang of ['pt', 'en']) {
    for (const category of CONTENT[lang].categories) {
      for (const item of category.items) assert.ok(logoFor(item), `${lang}: no logo for ${item}`);
    }
  }
});

test('logoFor returns null for an unknown technology', () => {
  assert.equal(logoFor('Cobol 9000'), null);
});

for (const [name, logo] of Object.entries(LOGOS)) {
  test(`logo ${name} is a safe, well-formed drawing`, () => {
    assert.match(logo.viewBox, /^0 0 \d+(\.\d+)? \d+(\.\d+)?$/);
    assert.ok(logo.body.length > 20, 'has drawing content');
    for (const [, tag] of logo.body.matchAll(/<([a-zA-Z][\w-]*)/g)) {
      assert.ok(ALLOWED_TAGS.has(tag), `tag <${tag}> is not on the allow-list`);
    }
    assert.doesNotMatch(logo.body, /\son\w+=|\sstyle=|href=|<style|<script|javascript:/i);
    assert.ok(isBalanced(logo.body), 'tags are balanced');
    for (const [, ref] of logo.body.matchAll(/url\(#([^)]+)\)/g)) {
      assert.ok(logo.body.includes(`id="${ref}"`), `dangling reference #${ref}`);
    }
  });
}

test('ids are unique across logos so they can share one SVG', () => {
  const seen = new Map();
  for (const [name, logo] of Object.entries(LOGOS)) {
    for (const [, id] of logo.body.matchAll(/\sid="([^"]+)"/g)) {
      assert.ok(!seen.has(id), `id ${id} used by ${seen.get(id)} and ${name}`);
      seen.set(id, name);
    }
  }
});

test('dark brand colours are lightened so the logos show on the black card', () => {
  for (const [name, logo] of Object.entries(LOGOS)) {
    for (const [, hex] of logo.body.matchAll(/fill="#([0-9a-fA-F]{6})"/g)) {
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      assert.ok(luminance >= 60, `${name} uses a too-dark fill #${hex}`);
    }
  }
});
