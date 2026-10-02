// Build web derivatives of the scraped originals for the site:
//   data/images/<slug>/<category>/<file>  →  public/media/<slug>/<category>/<file>.webp
// and write src/data/media-map.json  { "<localPath>": { src, width, height } }.
// Incremental: an existing derivative newer than its source is kept.
// Originals stay in data/images (git-ignored); derivatives are what the site ships.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const SRC = path.join(ROOT, 'data', 'images');
const OUT = path.join(ROOT, 'public', 'media');
const MAP = path.join(ROOT, 'src', 'data', 'media-map.json');
const MAX = { 'floor-plans': 1600, 'site-plan': 1800, default: 1600 };

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

const map = {};
let made = 0, kept = 0;
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const category = rel.split('/')[1];
  const outRel = rel.replace(/\.[a-z0-9]+$/i, '.webp');
  const out = path.join(OUT, outRel);
  if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) {
    kept++;
  } else {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    try {
      await sharp(file).rotate().resize({ width: MAX[category] || MAX.default, withoutEnlargement: true }).webp({ quality: 74, effort: 5 }).toFile(out);
      made++;
    } catch (e) {
      console.warn(`skip ${rel}: ${e.message}`);
      continue;
    }
  }
  const meta = await sharp(out).metadata();
  map[`data/images/${rel}`] = { src: `/media/${outRel}`, width: meta.width, height: meta.height };
}
fs.mkdirSync(path.dirname(MAP), { recursive: true });
fs.writeFileSync(MAP, JSON.stringify(map, null, 0));
console.log(`media: ${made} built, ${kept} up to date, ${Object.keys(map).length} mapped`);
