// Social share cards (Open Graph / Twitter), 1200×630 JPEG:
//   public/og/default.jpg               branded card for pages without their own image
//   public/og/projects/<slug>.jpg       project photo with name, location, price and possession
// Rendered with Playwright so the brand fonts match the site. Re-run after adding or changing projects,
// then commit public/og:   npm run og
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'public', 'og');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const data = read('data/projects.json');
const projects = (Array.isArray(data) ? data : data.projects);
const mediaMap = read('src/data/media-map.json');
const siteTs = fs.readFileSync(path.join(ROOT, 'src/config/site.ts'), 'utf8');
const BRAND = (siteTs.match(/name:\s*'([^']+)'/) || [])[1] || 'The Launch District';
const TAGLINE = (siteTs.match(/tagline:\s*'([^']+)'/) || [])[1] || '';

const C = { night: '#0E1626', ink: '#EEE8DC', ink2: '#AEB5C3', brass: '#C2A066', signal: '#E3906B' };
const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500&family=Jost:wght@400;500&display=block">';
const LOGO = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6.5 21v-7M17.5 21v-9"/><path d="M12 21V4M8.5 7.5 12 4l3.5 3.5" stroke="${C.signal}"/></svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const dataUri = (file) => `data:image/webp;base64,${fs.readFileSync(file).toString('base64')}`;
const inr = (n) => (n == null ? null : n >= 1e7 ? `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr` : `₹${(n / 1e5).toFixed(1).replace(/\.0$/, '')} L`);
const monthYear = (iso) => { if (!iso) return null; const [y, m] = iso.split('-'); return m ? new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : y; };
const shell = (body) => `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>
  *{margin:0;box-sizing:border-box} body{width:1200px;height:630px;overflow:hidden;background:${C.night};color:${C.ink};font-family:Jost,sans-serif}
  .serif{font-family:'Bodoni Moda',serif;font-variation-settings:"opsz" 28;font-weight:500}
  .eyebrow{font-weight:500;font-size:20px;letter-spacing:.16em;text-transform:uppercase;color:${C.ink2}}
  .brand{display:flex;align-items:center;gap:14px;font-size:30px}
</style></head><body>${body}</body></html>`;

const defaultCard = () => {
  const map = path.join(ROOT, 'public/media/map/base-dark-all.webp');
  return shell(`
  <div style="position:absolute;inset:0;background:url('${fs.existsSync(map) ? dataUri(map) : ''}') right -60px center/auto 120% no-repeat;opacity:.55"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,${C.night} 38%,rgba(14,22,38,.55) 70%,rgba(14,22,38,.2))"></div>
  <div style="position:relative;height:100%;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between">
    <div class="brand serif">${LOGO}${esc(BRAND)}</div>
    <div>
      <p class="eyebrow">Gurugram · Private early-entry real estate</p>
      <h1 class="serif" style="margin-top:22px;font-size:76px;line-height:1.08;max-width:760px">${esc(TAGLINE).replace(/\bbefore\b/, `<em style="color:${C.signal}">before</em>`)}</h1>
    </div>
    <div style="display:flex;align-items:center;gap:18px;font-size:22px;color:${C.ink2}"><span style="width:56px;height:2px;background:${C.brass}"></span>Pre-launch and early-construction homes, checked with each developer</div>
  </div>`);
};

const projectCard = (p, photo) => {
  const loc = p.location.sector ? `Sector ${p.location.sector}${p.location.locality && !/sector/i.test(p.location.locality) ? `, ${p.location.locality}` : ''}` : (p.location.locality ?? p.location.city ?? '').replace(/,?\s*\d{6}$/, '');
  const facts = [p.pricing.startingPriceInr ? `From ${inr(p.pricing.startingPriceInr)}` : 'Price on request', p.possessionDate ? `Possession ${monthYear(p.possessionDate)}` : null].filter(Boolean);
  return shell(`
  <div style="position:absolute;inset:0;background:url('${dataUri(photo)}') center/cover no-repeat"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,22,38,.15) 0%,rgba(14,22,38,.25) 40%,rgba(14,22,38,.92) 78%,${C.night} 100%)"></div>
  <div style="position:relative;height:100%;padding:52px 64px;display:flex;flex-direction:column;justify-content:space-between">
    <div class="brand serif" style="font-size:26px;text-shadow:0 1px 12px rgba(0,0,0,.5)">${LOGO}${esc(BRAND)}</div>
    <div>
      <p class="eyebrow" style="color:${C.ink}">${esc(p.developer.name ?? '')}${loc ? ` · ${esc(loc)}` : ''}</p>
      <h1 class="serif" style="margin-top:14px;font-size:${(p.name ?? '').length > 26 ? 62 : 74}px;line-height:1.05">${esc(p.name)}</h1>
      <p style="margin-top:20px;display:flex;align-items:center;gap:16px;font-size:26px;font-weight:500"><span style="width:44px;height:2px;background:${C.brass}"></span>${esc(facts.join('  ·  '))}</p>
    </div>
  </div>`);
};

fs.mkdirSync(path.join(OUT, 'projects'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const render = async (html, file) => {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });
  const info = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(file);
  return info.size;
};

let n = 0, bytes = 0, skipped = [];
bytes += await render(defaultCard(), path.join(OUT, 'default.jpg')); n++;
for (const p of projects) {
  const ref = p.media.hero ?? p.media.gallery?.[0];
  const web = ref?.localPath && mediaMap[ref.localPath];
  if (!web) { skipped.push(p.slug); continue; }
  bytes += await render(projectCard(p, path.join(ROOT, 'public', web.src)), path.join(OUT, 'projects', `${p.slug}.jpg`)); n++;
}
await browser.close();
console.log(`wrote ${n} cards (${Math.round(bytes / 1024)} KB) to public/og${skipped.length ? `; no image for: ${skipped.join(', ')}` : ''}`);
