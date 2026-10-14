import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILES = [
  'helmet', 'trophy',
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

for (const name of ['ferrari', 'mclaren']) {
  test(`assets/art/${name}.png is an RGBA pixel-art PNG`, () => {
    const png = readFileSync(path.join(root, `assets/art/${name}.png`));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'PNG signature');
    assert.equal(png.toString('ascii', 12, 16), 'IHDR');
    assert.ok(png.readUInt32BE(16) >= 400, 'wide enough to stay crisp');
    assert.equal(png[24], 8, 'bit depth 8');
    assert.equal(png[25], 6, 'colour type 6 = RGBA, so the background can be transparent');
  });
}
