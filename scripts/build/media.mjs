// Build web derivatives of image originals for the site and write src/data/media-map.json
// ({ "<localPath>": { src, width, height } }). Two source roots:
//   data/images/<slug>/<category>/<file>          scraped originals (git-ignored)
//   data/curated/images/<slug>/<category>/<file>  developer material supplied to Falcon (committed)
// → public/media/<slug>/<category>/<file>.webp (committed).
// Incremental: an existing derivative newer than its source is kept. Entries whose original is not
// on disk (e.g. a fresh clone without data/images) are kept from the previous map as long as the
// derivative exists, so a build never silently drops images.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const ROOTS = [
  { dir: path.join(ROOT, 'data', 'images'), key: 'data/images' },
  { dir: path.join(ROOT, 'data', 'curated', 'images'), key: 'data/curated/images' },
];
const OUT = path.join(ROOT, 'public', 'media');
const MAP = path.join(ROOT, 'src', 'data', 'media-map.json');
const MAX = { 'floor-plans': 1600, 'site-plan': 1800, 'location-map': 1800, default: 1600 };

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else yield p;
  }
}

let previous = {};
try { previous = JSON.parse(fs.readFileSync(MAP, 'utf8')); } catch { /* first run */ }

const map = {};
let made = 0, kept = 0, carried = 0;
for (const { dir, key } of ROOTS) {
  for (const file of walk(dir)) {
    const rel = path.relative(dir, file).split(path.sep).join('/');
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
    map[`${key}/${rel}`] = { src: `/media/${outRel}`, width: meta.width, height: meta.height };
  }
}
// Keep entries whose original is absent but whose shipped derivative still exists.
for (const [k, v] of Object.entries(previous)) {
  if (map[k]) continue;
  if (fs.existsSync(path.join(ROOT, 'public', v.src))) { map[k] = v; carried++; }
}
fs.mkdirSync(path.dirname(MAP), { recursive: true });
fs.writeFileSync(MAP, JSON.stringify(map, null, 0));
console.log(`media: ${made} built, ${kept} up to date, ${carried} carried over, ${Object.keys(map).length} mapped`);
