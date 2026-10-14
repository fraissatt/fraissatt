// Animated pixel-art scene: a McLaren-coloured car through the Senna S at Interlagos.
// The track is rasterised onto a coarse grid so it reads as pixel art; the car follows the
// same racing line with SMIL (no scripts, so it plays when GitHub shows the SVG as an image).

// Top-down car facing right. W white body, R red stripe, Y yellow helmet, K tyres, D wings.
export const CAR_MAP = [
  '...KKKK..........KKKK...',
  'DD.KKKK..........KKKK.DD',
  'DD.KKKK.WWWWWWWW.KKKK.DD',
  'DDWWWWWWWWWWWWWWWWWWWWDD',
  'DDWWWWWWRRRRRRRRRRRWWWDD',
  'DDWWWWWWYYRRRRRRRRRWWWDD',
  'DDWWWWWWRRRRRRRRRRRWWWDD',
  'DDWWWWWWWWWWWWWWWWWWWWDD',
  'DD.KKKK.WWWWWWWW.KKKK.DD',
  'DD.KKKK..........KKKK.DD',
  '...KKKK..........KKKK...',
];
export const CAR_PALETTE = {
  W: '#f4f4f4', R: '#d40000', Y: '#ffd600', K: '#101012', D: '#2a2a30',
};

// Merge horizontal runs of the same colour into one rect each.
function mergeRuns(rows, fillOf) {
  let out = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = fillOf(row[x]);
      let end = x;
      while (end + 1 < row.length && fillOf(row[end + 1]) === fill) end += 1;
      if (fill) out += `<rect x="${x}" y="${y}" width="${end - x + 1}" height="1" fill="${fill}"/>`;
      x = end + 1;
    }
  });
  return out;
}

export function spriteRects(map, palette, px) {
  const unit = mergeRuns(map, (char) => palette[char] ?? null);
  return unit.replace(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1"/g,
    (_, x, y, w) => `<rect x="${x * px}" y="${y * px}" width="${w * px}" height="${px}"`);
}

// Racing line through the Senna S: a right-hander, then a left-hander, then the straight.
export const PATH = {
  start: [-30, 52],
  segs: [
    ['L', 230, 52],
    ['C', 330, 52, 392, 100, 392, 140],
    ['C', 392, 184, 452, 206, 520, 206],
    ['L', 870, 206],
  ],
};

export function pathD(path) {
  return `M ${path.start.join(' ')} ` +
    path.segs.map(([cmd, ...nums]) => `${cmd} ${nums.join(' ')}`).join(' ');
}

export function samplePath(path, step = 1) {
  const points = [[...path.start]];
  let [cx, cy] = path.start;
  for (const [cmd, ...n] of path.segs) {
    if (cmd === 'L') {
      const [x, y] = n;
      const steps = Math.max(1, Math.ceil(Math.hypot(x - cx, y - cy) / step));
      for (let i = 1; i <= steps; i += 1) {
        points.push([cx + ((x - cx) * i) / steps, cy + ((y - cy) * i) / steps]);
      }
      [cx, cy] = [x, y];
    } else {
      const [x1, y1, x2, y2, x, y] = n;
      const hull = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
      const steps = Math.ceil(hull / step) * 2;
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const u = 1 - t;
        points.push([
          u ** 3 * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x,
          u ** 3 * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y,
        ]);
      }
      [cx, cy] = [x, y];
    }
  }
  return points;
}

// Rasterise the racing line: asphalt near it, alternating red/white kerbs just outside.
export function buildTrack(points, { cols, rows, cell, half = 20, kerbOuter = 26 }) {
  const asphalt = new Set();
  const kerbs = new Map();
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cx = (x + 0.5) * cell;
      const cy = (y + 0.5) * cell;
      let best = Infinity;
      let bestIndex = 0;
      for (let i = 0; i < points.length; i += 1) {
        const d = Math.hypot(points[i][0] - cx, points[i][1] - cy);
        if (d < best) { best = d; bestIndex = i; }
      }
      if (best <= half) asphalt.add(`${x},${y}`);
      else if (best <= kerbOuter) kerbs.set(`${x},${y}`, Math.floor(bestIndex / 18) % 2);
    }
  }
  return { asphalt, kerbs };
}

const W = 840;
const H = 252;
const CELL = 6;
const COLS = W / CELL;
const ROWS = H / CELL;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Paint cells as merged rects; colorAt returns a fill or null for each (x, y).
function paintCells(colorAt) {
  const rows = [];
  for (let y = 0; y < ROWS; y += 1) {
    const row = [];
    for (let x = 0; x < COLS; x += 1) row.push(colorAt(x, y));
    rows.push(row);
  }
  let out = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < COLS) {
      const fill = row[x];
      let end = x;
      while (end + 1 < COLS && row[end + 1] === fill) end += 1;
      if (fill) out += `<rect x="${x * CELL}" y="${y * CELL}" width="${(end - x + 1) * CELL}" height="${CELL}" fill="${fill}"/>`;
      x = end + 1;
    }
  });
  return out;
}

export function renderSennaScene() {
  const { asphalt, kerbs } = buildTrack(samplePath(PATH, 1), { cols: COLS, rows: ROWS, cell: CELL });
  const rand = seeded(7);
  const speck = new Set();
  for (let i = 0; i < 380; i += 1) speck.add(`${Math.floor(rand() * COLS)},${Math.floor(rand() * ROWS)}`);
  const crowdColors = ['#e10600', '#ffd12e', '#f2f2f2', '#0067ad', '#43b02a'];
  const crowd = new Map();
  for (let y = 10; y <= 17; y += 1) {
    for (let x = 90; x <= 124; x += 1) {
      crowd.set(`${x},${y}`, y === 10 || y === 17 || (x + y) % 2 === 0 ? '#26262b' : crowdColors[Math.floor(rand() * crowdColors.length)]);
    }
  }

  const grass = paintCells((x, y) => {
    const key = `${x},${y}`;
    if (asphalt.has(key) || kerbs.has(key) || crowd.has(key)) return null;
    return speck.has(key) ? '#2a6a3a' : null;
  });
  const road = paintCells((x, y) => (asphalt.has(`${x},${y}`) ? ((x * 7 + y * 3) % 11 === 0 ? '#44444c' : '#3b3b42') : null));
  const edges = paintCells((x, y) => {
    const k = kerbs.get(`${x},${y}`);
    return k === undefined ? null : (k ? '#f2f2f2' : '#e10600');
  });
  const stand = paintCells((x, y) => crowd.get(`${x},${y}`) ?? null);

  const car = `<g><animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path="${pathD(PATH)}"/>` +
    `<g transform="translate(-24 -11)">${spriteRects(CAR_MAP, CAR_PALETTE, 2)}</g></g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pixel art animation: a red and white race car driving through the Senna S, the first corners of the Interlagos circuit">` +
    `<defs><clipPath id="card"><rect width="${W}" height="${H}" rx="8"/></clipPath></defs>` +
    `<g clip-path="url(#card)" shape-rendering="crispEdges">` +
    `<rect width="${W}" height="${H}" fill="#1f4d2b"/>${grass}${road}${edges}${stand}${car}` +
    `</g>` +
    `<rect x="440" y="128" width="200" height="38" rx="4" fill="#0b0b0d" fill-opacity=".85"/>` +
    `<text x="452" y="146" fill="#ffffff" font-family="ui-monospace,Consolas,monospace" font-size="13" font-weight="700" letter-spacing="1">CURVA DO SENNA</text>` +
    `<text x="452" y="160" fill="#9a9aa2" font-family="ui-monospace,Consolas,monospace" font-size="11">Interlagos · Brasil</text>` +
    `</svg>`;
}
