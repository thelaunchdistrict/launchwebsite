// Step 3: download every image referenced by each project at original resolution.
// Images are deduplicated by sha256; a manifest row is written for every (project, reference),
// pointing at the single stored copy. Resumable via .scrape-state/images-state.json.
//   node scripts/scrape/download-images.mjs [--only slug,slug]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { imageSize } from 'image-size';
import { STATE_DIR, DATA_DIR, CDN_HOSTS, politeFetch, readJSON, writeJSON, log, originalImageUrl } from './lib.mjs';

const RAW_DIR = path.join(STATE_DIR, 'raw');
const IMG_DIR = path.join(DATA_DIR, 'images');
const STATE_FILE = path.join(STATE_DIR, 'images-state.json');
const args = process.argv.slice(2);
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? args[i + 1].split(',') : null; })();

const IMG_EXT = /\.(webp|jpe?g|png|gif|avif|svg)(\?|$)/i;
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'image';

/** Walk the project object and collect image references with a category and a descriptive name. */
export function collectImageRefs(p) {
  const refs = [];
  const add = (url, category, name) => {
    const u = originalImageUrl(url);
    if (!u || !IMG_EXT.test(u)) return;
    refs.push({ url: u, category, name: slugify(name) });
  };
  add(p.featuredImage, 'hero', `${p.slug}-featured`);
  (p.galleryImages || []).forEach((u, i) => add(u, 'gallery', `gallery-${i + 1}`));
  (p.floorPlans || []).forEach((f) => add(f.imageUrl, 'floor-plans', [f.level, f.title].filter(Boolean).join(' ') || 'floor-plan'));
  add(p.sitePlanImage, 'site-plan', 'site-location-plan');
  (p.amenities || []).forEach((a) => add(a.imageUrl, 'amenities', a.name));
  (p.highlights || []).forEach((h) => add(h.imageUrl, 'highlights', h.label));
  (p.offerings || []).forEach((o) => add(o.imageUrl || o.image, 'offerings', o.title || o.name));
  add(p.seo?.ogImage, 'social', 'og-image');
  // Catch-all: any other image URL anywhere in the object we have not categorised yet.
  const known = new Set(refs.map((r) => r.url));
  (function walk(v, keyPath) {
    if (typeof v === 'string') {
      const u = originalImageUrl(v);
      if (/^https?:\/\//.test(u) && IMG_EXT.test(u) && !known.has(u)) { known.add(u); refs.push({ url: u, category: 'other', name: slugify(keyPath) }); }
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${keyPath}-${i}`));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
  })(p, 'project');
  return refs;
}

async function main() {
  const state = readJSON(STATE_FILE, { byUrl: {}, byHash: {}, failures: {} });
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'));
  const manifest = [];
  for (const f of files) {
    const raw = readJSON(path.join(RAW_DIR, f));
    const p = raw.project;
    if (only && !only.includes(p.slug)) continue;
    const refs = collectImageRefs(p);
    const counters = {};
    for (const ref of refs) {
      counters[ref.category] = (counters[ref.category] || 0) + 1;
      const nn = String(counters[ref.category]).padStart(2, '0');
      let rec = state.byUrl[ref.url];
      if (!rec) {
        const host = new URL(ref.url).host;
        if (!CDN_HOSTS.includes(host) && !host.endsWith('realtycanvas.in')) {
          state.failures[ref.url] = `skipped: third-party host ${host}`;
          continue;
        }
        try {
          const res = await politeFetch(ref.url, { as: 'buffer' });
          if (res.status === 404 || !res.body) throw new Error('HTTP 404');
          const buf = res.body;
          const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
          let width = null, height = null;
          try { ({ width, height } = imageSize(buf)); } catch { /* svg or unknown */ }
          const ext = (ref.url.match(IMG_EXT) || [, 'bin'])[1].toLowerCase().replace('jpeg', 'jpg');
          let localPath = state.byHash[sha256];
          if (!localPath) {
            localPath = `data/images/${p.slug}/${ref.category}/${nn}-${ref.name}.${ext}`;
            const abs = path.join(DATA_DIR, '..', localPath);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, buf);
            state.byHash[sha256] = localPath;
          }
          rec = { sha256, width, height, bytes: buf.length, localPath };
          state.byUrl[ref.url] = rec;
          delete state.failures[ref.url];
          log(`↓ ${localPath}`);
        } catch (e) {
          state.failures[ref.url] = e.message;
          log(`✗ ${ref.url}: ${e.message}`);
          continue;
        } finally {
          writeJSON(STATE_FILE, state);
        }
      }
      manifest.push({
        slug: p.slug,
        category: ref.category,
        originalUrl: ref.url,
        localPath: rec.localPath,
        width: rec.width,
        height: rec.height,
        bytes: rec.bytes,
        sha256: rec.sha256,
        source: 'realtycanvas.in (project listing media; rights belong to the respective developer/publisher)',
        duplicateOf: rec.localPath.includes(`/${p.slug}/`) ? null : rec.localPath,
      });
    }
  }
  if (!only) writeJSON(path.join(DATA_DIR, 'images-manifest.json'), manifest);
  log(`manifest rows ${manifest.length}, unique files ${Object.keys(state.byHash).length}, failures ${Object.keys(state.failures).length}`);
}

if (process.argv[1] && process.argv[1].endsWith('download-images.mjs')) main().catch((e) => { console.error(e); process.exit(1); });
