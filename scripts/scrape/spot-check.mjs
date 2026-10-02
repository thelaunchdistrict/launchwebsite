// Re-fetch N random live project pages and compare key fields with data/projects.json.
// Compares against what is *rendered for visitors* (visible text) as well as the payload.
//   node scripts/scrape/spot-check.mjs [--n 10] [--seed 42]
import path from 'node:path';
import { SOURCE, STATE_DIR, DATA_DIR, loadRobots, politeFetch, readJSON, writeJSON, log, decodeRsc, extractObject } from './lib.mjs';
import { parseInr } from './parse.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const N = Number(opt('--n', 10));
let seed = Number(opt('--seed', Date.now() % 100000));
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const stripTags = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ');

async function main() {
  await loadRobots();
  const { projects } = readJSON(path.join(DATA_DIR, 'projects.json'));
  const pool = projects.filter((p) => p.source !== 'curated');
  const sample = [];
  while (sample.length < Math.min(N, pool.length)) sample.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  const results = [];
  for (const p of sample) {
    const { body } = await politeFetch(`${SOURCE}/projects/${p.slug}`);
    const live = extractObject(decodeRsc(body), '"project":{') || {};
    const text = stripTags(body);
    const checks = {
      nameVisible: !!p.name && text.toLowerCase().includes(p.name.toLowerCase()),
      reraMatches: (live.reraId ?? null) === p.reraNumber && (!p.reraNumber || text.includes(p.reraNumber)),
      startingPriceMatches: (live.priceMin ?? parseInr(live.basePrice)) === p.pricing.startingPriceInr,
      statusMatches: (live.status ?? null) === p.statusRaw,
      developerMatches: (live.developerName ?? null) === p.developer.nameRaw,
      configCountMatches: (live.pricingTable || []).length === p.pricing.configurations.length,
      floorPlanCountMatches: (live.floorPlans || []).length === p.media.floorPlans.length,
      faqCountMatches: (live.faqs || []).length === p.content.faqs.length,
      galleryCountMatches: (live.galleryImages || []).length === p.media.gallery.length,
    };
    const ok = Object.values(checks).every(Boolean);
    results.push({ slug: p.slug, ok, checks });
    log(`${ok ? '✓' : '✗'} ${p.slug}${ok ? '' : ' ' + Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`);
  }
  writeJSON(path.join(STATE_DIR, 'spot-check.json'), { checkedAt: new Date().toISOString(), seed: Number(opt('--seed', 0)) || null, results });
}

main().catch((e) => { console.error(e); process.exit(1); });
