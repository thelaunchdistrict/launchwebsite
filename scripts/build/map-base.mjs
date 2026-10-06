// Pre-render the corridor map's base layer (grid, sector numbers, OSM roads, labels) as WebP files:
//   public/media/map/base-<light|dark>-<all|market-slug>.webp   (1440×1200, transparent)
// "all" is the default map; each market slug is the variant with that corridor emphasised and the rest dimmed.
// The live site draws project markers over these as an interactive SVG layer.
//
// Needs a production build first:  npm run build && npm run map:webp
// Re-run whenever data/geo or the map styling changes, then commit public/media/map.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'public', 'media', 'map');
const PORT = 3400;
const BASE = `http://localhost:${PORT}`;
const markets = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'config', 'micromarkets.json'), 'utf8')).markets.map((m) => m.slug);
const variants = ['all', ...markets];

fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', String(PORT)], {
  cwd: ROOT,
  env: { ...process.env, MAP_BASE_EXPORT: '1' },
  stdio: 'ignore',
});
const stop = () => { try { server.kill(); } catch { /* already gone */ } };
process.on('exit', stop);

try {
  for (let i = 0; i < 60; i++) {
    if (await fetch(`${BASE}/map-base/light/all`).then((r) => r.ok).catch(() => false)) break;
    if (i === 59) throw new Error('server did not start; run `npm run build` first');
    await new Promise((r) => setTimeout(r, 1000));
  }
  const browser = await chromium.launch();
  let total = 0;
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('tld-theme', t); } catch { /* ignore */ } }, theme);
    const page = await ctx.newPage();
    for (const v of variants) {
      await page.goto(`${BASE}/map-base/${theme}/${v}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.locator('#map-base-export').screenshot({ omitBackground: true });
      const file = path.join(OUT, `base-${theme}-${v}.webp`);
      const info = await sharp(png).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(file);
      total += info.size;
      console.log(`${path.relative(ROOT, file)}  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
    }
    await ctx.close();
  }
  await browser.close();
  console.log(`done: ${variants.length * 2} files, ${Math.round(total / 1024)} KB`);
} finally {
  stop();
}
