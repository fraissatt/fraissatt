import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBanner } from './banner-svg.mjs';
import { renderSennaScene } from './pixel-scene.mjs';

// Static artwork: run by hand after changing the scene, the banner or the helmet/trophy art.
export async function run({ root }) {
  const helmet = await readFile(path.join(root, 'assets/art/helmet.png'));
  const trophySvg = await readFile(path.join(root, 'assets/art/trophy.svg'), 'utf8');
  const trophyInner = trophySvg.replace(/^<svg[^>]*>\s*/, '').replace(/\s*<\/svg>\s*$/, '');

  await mkdir(path.join(root, 'assets/animations'), { recursive: true });
  await writeFile(path.join(root, 'assets/animations/senna-s.svg'), renderSennaScene());
  await writeFile(path.join(root, 'assets/banner.svg'),
    renderBanner({ helmetBase64: helmet.toString('base64'), trophyInner }));
}

const thisFile = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] ?? '') === thisFile) {
  run({ root: path.resolve(path.dirname(thisFile), '..') }).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
