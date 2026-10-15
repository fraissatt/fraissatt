import { FONT, STYLE, TYRES, escapeXml, frame, positionCell } from './stats-svg.mjs';
import { logoFor } from './tech-logos.mjs';

const WIDTH = 840;
const RIGHT = WIDTH - 24;

const EXTRA = `
.chip{fill:#26262b;stroke:#3a3a40}
.chiptxt{fill:#fff;font:12px ${FONT}}
.step{fill:#0b0b0d;stroke:#2a2a2e}
.bar{fill:#e10600}
.big{font:700 38px ${FONT}}
.when{fill:#e9e9ee;font:700 12px ${FONT};text-anchor:end}
.desc{fill:#9a9aa2;font:11px ${FONT}}`;

export function wrapText(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderStintsSvg(stints, title) {
  let y = 56;
  const rows = stints.map((stint) => {
    const lines = wrapText(stint.text, 104);
    const color = TYRES[(stint.n - 1) % TYRES.length];
    const row = positionCell(y, stint.n, RIGHT) +
      `<circle cx="66" cy="${y + 18}" r="7" fill="${color}"/>` +
      `<text class="name" x="84" y="${y + 23}">${escapeXml(stint.org)}</text>` +
      `<text class="when" x="${RIGHT}" y="${y + 22}">${escapeXml(stint.period)}</text>` +
      lines.map((line, i) =>
        `<text class="desc" x="84" y="${y + 44 + i * 15}">${escapeXml(line)}</text>`).join('');
    y += 44 + lines.length * 15 + 10;
    return row;
  }).join('');
  return frame(y + 10, 'Experience stints', title, rows, { width: WIDTH, extraStyle: EXTRA });
}

const CHIP_PAD = 10;
const LOGO_SIZE = 16;
const CHAR_W = 7.4;

export function renderPowerUnitSvg(categories, title) {
  let y = 56;
  const rows = categories.map((category) => {
    let x = 250;
    const chips = category.items.map((item) => {
      const logo = logoFor(item);
      const textX = CHIP_PAD + (logo ? LOGO_SIZE + 6 : 0);
      const width = Math.round(textX + item.length * CHAR_W + CHIP_PAD);
      const icon = logo
        ? `<svg class="logo" x="${x + CHIP_PAD - 2}" y="${y + 14}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" viewBox="${logo.viewBox}">${logo.body}</svg>`
        : '';
      const chip = `<rect class="chip" x="${x}" y="${y + 9}" width="${width}" height="26" rx="4"/>` + icon +
        `<text class="chiptxt" x="${x + textX}" y="${y + 26}">${escapeXml(item)}</text>`;
      x += width + 8;
      return chip;
    }).join('');
    const row = `<line class="sep" x1="24" y1="${y}" x2="${RIGHT}" y2="${y}"/>` +
      `<rect class="bar" x="24" y="${y + 10}" width="3" height="24"/>` +
      `<text class="name" x="38" y="${y + 22}">${escapeXml(category.name)}</text>` +
      `<text class="tag" x="38" y="${y + 36}">${escapeXml(category.label)}</text>` +
      chips;
    y += 46;
    return row;
  }).join('');
  return frame(y + 10, 'Technology stack', title, rows, { width: WIDTH, extraStyle: EXTRA });
}

const STEP_W = 270;
const STEP_H = 240;
const STEP_HEIGHT = { 1: 190, 2: 170, 3: 150 };
const MEDAL = { 1: '#f5b800', 2: '#c9ccd2', 3: '#cd7f32' };

const MINI_TROPHY = '<g class="trophy" transform="translate(117 6) scale(.3)">' +
  '<path d="M30 26 H16 C16 55 26 62 36 64" fill="none" stroke="#e0a800" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M90 26 H104 C104 55 94 62 84 64" fill="none" stroke="#e0a800" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<path d="M30 18 H90 V50 C90 78 75 90 60 92 C45 90 30 78 30 50 Z" fill="#f5b800"/>' +
  '<rect x="53" y="92" width="14" height="20" rx="2" fill="#e0a800"/>' +
  '<rect x="38" y="110" width="44" height="10" rx="2" fill="#f5b800"/>' +
  '<rect x="28" y="120" width="64" height="12" rx="2" fill="#2a2a2e"/>' +
  '</g>';

export function renderPodiumStepSvg({ place, name, lang, text }) {
  const height = STEP_HEIGHT[place];
  const top = STEP_H - height;
  const lines = wrapText(text, 36);
  const body = `<rect class="step" x=".5" y="${top}" width="${STEP_W - 1}" height="${height - 0.5}" rx="6"/>` +
    `<rect class="bar" x="1" y="${top}" width="${STEP_W - 2}" height="3"/>` +
    `<text class="big" x="20" y="${top + 46}" fill="${MEDAL[place]}">${place}</text>` +
    `<text class="name" x="20" y="${top + 72}">${escapeXml(name)}</text>` +
    `<text class="tag" x="20" y="${top + 90}">${escapeXml(lang)}</text>` +
    lines.map((line, i) =>
      `<text class="desc" x="20" y="${top + 110 + i * 14}">${escapeXml(line)}</text>`).join('') +
    (place === 1 ? MINI_TROPHY : '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STEP_W}" height="${STEP_H}" viewBox="0 0 ${STEP_W} ${STEP_H}" role="img" aria-label="${escapeXml(`${place}: ${name}`)}">` +
    `<style>${STYLE}${EXTRA}</style>${body}</svg>`;
}
