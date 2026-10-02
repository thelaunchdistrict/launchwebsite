// Step 1: enumerate every project URL from three sources and cross-check them.
//   a) /sitemap.xml            (canonical list)
//   b) /sitemap  (HTML page)   (prompt asked for it; logged if absent)
//   c) /projects listing, rendered in headless Chromium with infinite scroll / "load more" handling
// Output: .scrape-state/discovery.json
import path from 'node:path';
import { SOURCE, STATE_DIR, USER_AGENT, loadRobots, politeFetch, writeJSON, readJSON, log, decodeRsc, sleep } from './lib.mjs';

const OUT = path.join(STATE_DIR, 'discovery.json');
const slugFrom = (href) => (href.match(/\/projects\/([a-z0-9-]+)\/?$/i) || [])[1];
const RESERVED = new Set(['create']);

async function fromSitemapXml() {
  const { body } = await politeFetch(`${SOURCE}/sitemap.xml`);
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // sitemap index support
  const nested = locs.filter((l) => l.endsWith('.xml'));
  for (const n of nested) {
    const r = await politeFetch(n);
    if (r.body) locs.push(...[...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
  }
  return [...new Set(locs.map(slugFrom).filter(Boolean))];
}

async function fromHtmlSitemap() {
  const r = await politeFetch(`${SOURCE}/sitemap`);
  if (r.status === 404) return { status: 404, slugs: [] };
  const all = r.body + decodeRsc(r.body);
  return { status: r.status, slugs: [...new Set([...all.matchAll(/\/projects\/([a-z0-9-]+)/g)].map((m) => m[1]))] };
}

async function fromListing() {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch {
    log('playwright not installed — skipping rendered listing check');
    return { rendered: false, slugs: [] };
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ userAgent: USER_AGENT, viewport: { width: 1280, height: 900 } });
  // We let the page's own front-end load its data like any visitor would; this crawler never
  // calls the robots-disallowed /api/ paths directly.
  await page.goto(`${SOURCE}/projects`, { waitUntil: 'networkidle', timeout: 90000 });
  const collect = () => page.$$eval('a[href*="/projects/"]', (as) => as.map((a) => a.getAttribute('href')));
  let seen = new Set();
  let stable = 0;
  let pagesVisited = 1;
  for (let i = 0; i < 80 && stable < 4; i++) {
    (await collect()).map(slugFrom).filter(Boolean).forEach((s) => seen.add(s));
    const before = seen.size;
    await page.mouse.wheel(0, 4000);
    // click a "load more"/"show more" button if one exists
    const more = page.getByRole('button', { name: /load more|show more|view more/i });
    if (await more.count()) { await more.first().click().catch(() => {}); }
    await sleep(1200);
    // numbered pagination ("Next")
    const next = page.getByRole('button', { name: /^next$/i }).or(page.getByRole('link', { name: /^next/i }));
    (await collect()).map(slugFrom).filter(Boolean).forEach((s) => seen.add(s));
    if (seen.size === before) {
      if ((await next.count()) && (await next.first().isEnabled().catch(() => false))) {
        await next.first().click().catch(() => {});
        pagesVisited++;
        await page.waitForLoadState('networkidle').catch(() => {});
        await sleep(1200);
        stable = 0;
      } else stable++;
    } else stable = 0;
  }
  const countText = await page.locator('text=/\\d+\\s+(projects|properties|results)/i').first().textContent().catch(() => null);
  await browser.close();
  return { rendered: true, pagesVisited, displayedCountText: countText, slugs: [...seen] };
}

async function main() {
  await loadRobots();
  const prev = readJSON(OUT, null);
  if (prev && process.argv.includes('--resume')) { log(`discovery exists (${prev.slugs.length} slugs) — reusing`); return; }
  const xml = await fromSitemapXml();
  log(`sitemap.xml: ${xml.length} project URLs`);
  const html = await fromHtmlSitemap();
  log(`/sitemap HTML: status ${html.status}, ${html.slugs.length} project links`);
  const listing = await fromListing();
  log(`/projects rendered listing: ${listing.slugs.length} project links`);

  const union = [...new Set([...xml, ...listing.slugs, ...html.slugs])].filter((s) => !RESERVED.has(s)).sort();
  const mismatches = {
    inSitemapNotListing: listing.rendered ? xml.filter((s) => !listing.slugs.includes(s)) : null,
    inListingNotSitemap: listing.slugs.filter((s) => !xml.includes(s)),
    inHtmlSitemapNotXml: html.slugs.filter((s) => !xml.includes(s)),
  };
  writeJSON(OUT, {
    discoveredAt: new Date().toISOString(),
    sources: { sitemapXml: xml.length, htmlSitemap: html, listing: { ...listing, slugs: listing.slugs.length } },
    mismatches,
    slugs: union,
  });
  log(`union: ${union.length} unique project slugs → ${OUT}`);
  if (Object.values(mismatches).some((m) => m && m.length)) log('MISMATCH between sources:', JSON.stringify(mismatches));
}

main().catch((e) => { console.error(e); process.exit(1); });
