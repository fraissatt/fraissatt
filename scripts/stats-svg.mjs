export const FONT = "ui-monospace,'SF Mono',Consolas,'Liberation Mono',monospace";
const NS = 'xmlns="http://www.w3.org/2000/svg"';
const WIDTH = 495;
const BAR_X = 24;
const BAR_W = 447;
const RED = '#e10600';

export const STYLE = `
.bg{fill:#0b0b0d;stroke:#2a2a2e}
.stripe{fill:${RED}}
.title{fill:#fff;font:700 13px ${FONT};letter-spacing:1.5px}
.pos{fill:#e9e9ee}
.posn{fill:#0b0b0d;font:700 13px ${FONT};text-anchor:middle}
.name{fill:#fff;font:700 14px ${FONT}}
.tag{fill:#9a9aa2;font:11px ${FONT}}
.value{fill:#fff;font:700 18px ${FONT};text-anchor:end}
.pct{fill:#fff;font:700 14px ${FONT};text-anchor:end}
.sep{stroke:#2a2a2e}
.track{fill:#26262b}`;

// Tyre compounds by rank: soft, medium, hard, intermediate, wet.
export const TYRES = ['#ff3b30', '#ffd12e', '#f2f2f2', '#43b02a', '#0067ad'];
const GRAY = '#6b6b73';
const tyreColor = (lang, rank) => (lang.name === 'Other' ? GRAY : (TYRES[rank] ?? GRAY));

export function escapeXml(value) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  return String(value).replace(/[&<>"']/g, (char) => map[char]);
}

const formatNumber = (n) =>
  n === null || n === undefined ? '-' : new Intl.NumberFormat('en-US').format(n);

export function frame(height, label, title, body, { width = WIDTH, extraStyle = '' } = {}) {
  return `<svg ${NS} width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">` +
    `<style>${STYLE}${extraStyle}</style>` +
    `<rect class="bg" x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="6"/>` +
    `<rect class="stripe" x="24" y="22" width="4" height="18"/>` +
    `<text class="title" x="36" y="36">${escapeXml(title)}</text>` +
    body + '</svg>';
}

export function positionCell(rowY, position, right = 471) {
  return `<line class="sep" x1="24" y1="${rowY}" x2="${right}" y2="${rowY}"/>` +
    `<rect class="pos" x="24" y="${rowY + 6}" width="24" height="24" rx="3"/>` +
    `<text class="posn" x="36" y="${rowY + 23}">${position}</text>`;
}

const OVERVIEW_ROWS = [
  ['repos', 'REPOS', 'Repositórios · Repositories'],
  ['stars', 'STARS', 'Estrelas · Stars'],
  ['commits', 'COMMITS', '12 meses · months'],
  ['followers', 'FOLLOWERS', 'Seguidores · Followers'],
];

export function renderOverviewSvg(stats) {
  const rows = OVERVIEW_ROWS.map(([key, name, tag], i) => {
    const y = 56 + i * 36;
    return positionCell(y, i + 1) +
      `<text class="name" x="60" y="${y + 23}">${name}</text>` +
      `<text class="tag" x="160" y="${y + 22}">${escapeXml(tag)}</text>` +
      `<text class="value" x="471" y="${y + 24}">${escapeXml(formatNumber(stats[key]))}</text>`;
  }).join('');
  return frame(214, 'GitHub overview', 'TIMING · Visão geral · Overview', rows);
}

export function renderLanguagesSvg(langs) {
  const title = 'TYRE STRATEGY · Linguagens · Languages';
  if (langs.length === 0) {
    const empty = '<text class="tag" x="24" y="70">Sem dados · No data</text>';
    return frame(100, 'GitHub languages', title, empty);
  }

  const totalBytes = langs.reduce((sum, lang) => sum + lang.bytes, 0);
  let x = BAR_X;
  const segments = langs.map((lang, i) => {
    const isLast = i === langs.length - 1;
    const width = isLast
      ? Math.round((BAR_X + BAR_W - x) * 100) / 100
      : Math.round((lang.bytes / totalBytes) * BAR_W * 100) / 100;
    const rect = `<rect class="seg" x="${x}" y="52" width="${width}" height="12" fill="${tyreColor(lang, i)}"/>`;
    x = Math.round((x + width) * 100) / 100;
    return rect;
  }).join('');

  const bar = `<clipPath id="bar"><rect x="${BAR_X}" y="52" width="${BAR_W}" height="12" rx="6"/></clipPath>` +
    `<rect class="track" x="${BAR_X}" y="52" width="${BAR_W}" height="12" rx="6"/>` +
    `<g clip-path="url(#bar)">${segments}</g>`;

  const rows = langs.map((lang, i) => {
    const y = 80 + i * 30;
    return positionCell(y, i + 1) +
      `<circle cx="66" cy="${y + 18}" r="6" fill="${tyreColor(lang, i)}"/>` +
      `<text class="name" x="82" y="${y + 23}">${escapeXml(lang.name)}</text>` +
      `<text class="pct" x="471" y="${y + 23}">${escapeXml(`${lang.percent}%`)}</text>`;
  }).join('');

  return frame(80 + langs.length * 30 + 14, 'GitHub languages', title, bar + rows);
}
