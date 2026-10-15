import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT } from './profile-content.mjs';
import { renderPodiumStepSvg, renderPowerUnitSvg, renderStintsSvg } from './sections-svg.mjs';

// Static cards: run this by hand after editing profile-content.mjs. The stats workflow does not touch them.
export async function run({ outDir }) {
  await mkdir(outDir, { recursive: true });
  const trophyBase64 = (await readFile(path.join(outDir, '..', 'art', 'trophy.png'))).toString('base64');
  const write = (name, svg) => writeFile(path.join(outDir, name), svg);
  for (const [lang, content] of Object.entries(CONTENT)) {
    await write(`stints.${lang}.svg`, renderStintsSvg(content.stints, content.stintsTitle));
    await write(`power-unit.${lang}.svg`, renderPowerUnitSvg(content.categories, content.powerTitle));
    for (const step of content.podium) {
      await write(`podium-${step.place}.${lang}.svg`, renderPodiumStepSvg({ ...step, trophyBase64 }));
    }
  }
}

const thisFile = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] ?? '') === thisFile) {
  const outDir = path.resolve(path.dirname(thisFile), '..', 'assets', 'sections');
  run({ outDir }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
