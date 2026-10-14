import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBanner } from './banner-svg.mjs';
import { isBalanced, count, HAS_SCRIPT_OR_EXTERNAL } from './test-helpers.mjs';

const svg = renderBanner({
  helmetBase64: 'AAAA',
  trophyInner: '<rect x="1" y="1" width="2" height="2"/>',
});

test('banner embeds the helmet as pixel art and the trophy', () => {
  assert.match(svg, /<image [^>]*href="data:image\/png;base64,AAAA"/);
  assert.match(svg, /image-rendering:pixelated/);
  assert.match(svg, /<rect x="1" y="1" width="2" height="2"\/>/);
});

test('banner has five start lights that light up in sequence and go out', () => {
  assert.equal(count(svg, '<animate attributeName="fill"'), 5);
  const begins = [...svg.matchAll(/keyTimes="0;([\d.]+);([\d.]+);1"/g)].map((m) => Number(m[1]));
  assert.equal(begins.length, 5);
  assert.deepEqual([...begins].sort((a, b) => a - b), begins, 'lights come on left to right');
  const offs = new Set([...svg.matchAll(/keyTimes="0;[\d.]+;([\d.]+);1"/g)].map((m) => m[1]));
  assert.equal(offs.size, 1, 'all lights go out together');
});

test('the chequered strip scrolls seamlessly', () => {
  assert.match(svg, /<animateTransform attributeName="transform" type="translate" from="0 0" to="-20 0"/);
  assert.match(svg, /repeatCount="indefinite"/);
});

test('banner is accessible, self-contained and well-formed', () => {
  assert.match(svg, /^<svg [^>]*width="900" height="160"/);
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="[^"]*Mamede[^"]*"/);
  assert.doesNotMatch(svg, HAS_SCRIPT_OR_EXTERNAL);
  assert.ok(isBalanced(svg), 'tags are balanced');
});
