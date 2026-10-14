import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAR_MAP, CAR_PALETTE, spriteRects, PATH, pathD, samplePath, buildTrack, renderSennaScene,
} from './pixel-scene.mjs';
import { isBalanced, count, HAS_SCRIPT_OR_EXTERNAL } from './test-helpers.mjs';

test('the car sprite is a rectangular 24x11 map using only known colors', () => {
  assert.equal(CAR_MAP.length, 11);
  for (const row of CAR_MAP) {
    assert.equal(row.length, 24, row);
    for (const char of row) assert.ok(char === '.' || char in CAR_PALETTE, `unknown '${char}'`);
  }
});

test('spriteRects merges runs and stays inside the sprite box', () => {
  const svg = spriteRects(CAR_MAP, CAR_PALETTE, 2);
  const rects = [...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g)];
  const cells = CAR_MAP.join('').replaceAll('.', '').length;
  assert.ok(rects.length > 0 && rects.length < cells, `${rects.length} rects for ${cells} cells`);
  for (const [, x, y, w, h] of rects.map((m) => m.map(Number))) {
    assert.ok(x + w <= 24 * 2 && y + h <= 11 * 2);
  }
  assert.match(svg, /#d40000/, 'McLaren red');
  assert.match(svg, /#ffd600/, 'yellow helmet');
});

test('samplePath starts and ends on the path and has no gaps', () => {
  const points = samplePath(PATH, 1);
  assert.deepEqual(points[0], PATH.start);
  const last = points.at(-1);
  const end = PATH.segs.at(-1).slice(-2);
  assert.ok(Math.abs(last[0] - end[0]) < 1.5 && Math.abs(last[1] - end[1]) < 1.5);
  for (let i = 1; i < points.length; i += 1) {
    const d = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    assert.ok(d < 2.5, `gap of ${d} at ${i}`);
  }
});

test('buildTrack paints asphalt on the racing line and kerbs only beside it', () => {
  const { asphalt, kerbs } = buildTrack(samplePath(PATH, 1), { cols: 140, rows: 42, cell: 6 });
  assert.ok(asphalt.size > 300);
  assert.ok(asphalt.has('20,8'), 'cell under the first straight');
  for (const key of kerbs.keys()) assert.ok(!asphalt.has(key), `kerb on asphalt at ${key}`);
  assert.deepEqual([...new Set(kerbs.values())].sort(), [0, 1], 'red and white kerbs');
  for (const key of asphalt) {
    const [x, y] = key.split(',').map(Number);
    assert.ok(x >= 0 && x < 140 && y >= 0 && y < 42, `out of bounds ${key}`);
  }
});

test('the scene animates the McLaren along the racing line, safely', () => {
  const svg = renderSennaScene();
  assert.match(svg, /^<svg [^>]*width="840"/);
  assert.match(svg, /viewBox="0 0 840 252"/);
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-label="[^"]+"/);
  assert.equal(count(svg, '<animateMotion'), 1);
  assert.ok(svg.includes(`path="${pathD(PATH)}"`), 'car follows the same path as the track');
  assert.match(svg, /rotate="auto"/);
  assert.match(svg, /repeatCount="indefinite"/);
  assert.match(svg, /CURVA DO SENNA/);
  assert.doesNotMatch(svg, HAS_SCRIPT_OR_EXTERNAL);
  assert.doesNotMatch(svg, /NaN|undefined/);
  assert.ok(isBalanced(svg), 'tags are balanced');
});
