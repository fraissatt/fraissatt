import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'ferrari', 'mclaren', 'helmet', 'trophy',
  'track-interlagos', 'track-monza', 'track-suzuka', 'track-monaco',
].map((name) => `assets/art/${name}.svg`);

const read = (file) => readFileSync(path.join(root, file), 'utf8');

// Minimal tag-balance check: every opening tag is self-closed or has a matching closing tag.
function isBalanced(svg) {
  const stack = [];
  for (const [, closing, name, , selfClosing] of svg.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    if (selfClosing) continue;
    if (!closing) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}

for (const file of FILES) {
  test(`${file} is an accessible, self-contained drawing`, () => {
    const svg = read(file);
    assert.match(svg, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /viewBox="0 0 \d+ \d+"/);
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-label="[^"]+"/);
    assert.doesNotMatch(svg, /<text|<image|<script|<foreignObject/i, 'no text, bitmaps or scripts');
    assert.doesNotMatch(svg, /(?:href|src)="https?:/i, 'no external references');
    assert.ok(isBalanced(svg), 'tags are balanced');
  });
}
