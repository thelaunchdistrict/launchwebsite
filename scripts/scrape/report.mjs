// Step 5: data/extraction-report.md — coverage, gaps, failures, anomalies, spot-check results.
import fs from 'node:fs';
import path from 'node:path';
import { STATE_DIR, DATA_DIR, readJSON, log } from './lib.mjs';

const { projects: allRows, generatedAt } = readJSON(path.join(DATA_DIR, 'projects.json'));
// Hand-curated entries (data/curated) are not part of the extraction; they are listed separately.
const projects = allRows.filter((p) => p.source !== 'curated');
const curatedRows = allRows.filter((p) => p.source === 'curated');
const discovery = readJSON(path.join(STATE_DIR, 'discovery.json'), {});
const imgState = readJSON(path.join(STATE_DIR, 'images-state.json'), { byUrl: {}, byHash: {}, failures: {} });
const fetchFailures = readJSON(path.join(STATE_DIR, 'fetch-failures.json'), {});
const manifest = readJSON(path.join(DATA_DIR, 'images-manifest.json'), []);
const spot = readJSON(path.join(STATE_DIR, 'spot-check.json'), null);

const has = (v) => v !== false && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
const FIELDS = {
  'Identity': {
    name: (p) => p.name, developer: (p) => p.developer.name, projectType: (p) => p.projectType, status: (p) => p.status,
    reraNumber: (p) => p.reraNumber, launchDate: (p) => p.launchDate, possessionDate: (p) => p.possessionDate,
  },
  'Location': {
    sector: (p) => p.location.sector, 'microMarket (derived)': (p) => p.location.microMarket, city: (p) => p.location.city,
    address: (p) => p.location.address, 'latitude/longitude': (p) => p.location.latitude && p.location.longitude,
    landmarks: (p) => p.location.landmarks, 'connectivity (nearby points)': (p) => p.location.connectivity,
  },
  'Pricing': {
    startingPrice: (p) => p.pricing.startingPriceInr, priceMax: (p) => p.pricing.priceMaxInr,
    'pricePerSqft (source)': (p) => p.pricing.pricePerSqftMinInr, 'entryPricePerSqft (derived)': (p) => p.pricing.entryPricePerSqftInr,
    configurations: (p) => p.pricing.configurations, 'config-level price': (p) => p.pricing.configurations.some((c) => c.priceInr),
    'config-level area': (p) => p.pricing.configurations.some((c) => c.areaSqft), paymentPlan: (p) => p.pricing.paymentPlan,
    bookingAmount: (p) => p.pricing.bookingAmount, otherCharges: (p) => p.pricing.otherCharges,
  },
  'Project facts': {
    landArea: (p) => p.facts.landAreaAcres, towers: (p) => p.facts.towers, floors: (p) => p.facts.floors, units: (p) => p.facts.units,
    'unitsPerAcre (derived)': (p) => p.facts.unitsPerAcre, openSpacePercent: (p) => p.facts.openSpacePercent,
    architect: (p) => p.facts.architect, landscapeDesigner: (p) => p.facts.landscapeDesigner, constructionPartner: (p) => p.facts.constructionPartner,
  },
  'Content': {
    description: (p) => p.content.description, overview: (p) => p.content.overview, highlights: (p) => p.content.highlights,
    amenities: (p) => p.content.amenities, specifications: (p) => p.content.specifications, faqs: (p) => p.content.faqs,
    investmentCommentary: (p) => p.content.investmentCommentary,
  },
  'Media': {
    heroImage: (p) => p.media.hero, gallery: (p) => p.media.gallery, floorPlans: (p) => p.media.floorPlans,
    'sitePlan / location map': (p) => p.media.sitePlan, videos: (p) => p.media.videos, virtualTours: (p) => p.media.virtualTours,
    brochurePdf: (p) => p.media.brochurePdf, developerLogo: (p) => p.media.developerLogo,
  },
  'Metadata': { seoTitle: (p) => p.seo.title, seoDescription: (p) => p.seo.description, scrapedAt: (p) => p.scrapedAt },
};

const pct = (n) => `${Math.round((n / projects.length) * 100)}%`;
const lines = [];
const L = (s = '') => lines.push(s);

L('# Extraction report — realtycanvas.in/projects');
L();
L(`Generated ${new Date().toISOString()} from data built at ${generatedAt}.`);
L();
L('## Summary');
L();
L(`| | |`);
L(`|---|---|`);
L(`| Projects in sitemap.xml | ${discovery.sources?.sitemapXml ?? '—'} |`);
L(`| Projects on rendered /projects listing | ${discovery.sources?.listing?.rendered ? discovery.sources.listing.slugs : 'not rendered'} |`);
L(`| /sitemap HTML page | HTTP ${discovery.sources?.htmlSitemap?.status ?? '—'} (${discovery.sources?.htmlSitemap?.slugs?.length ?? 0} project links) |`);
L(`| Unique projects discovered | ${discovery.slugs?.length ?? '—'} |`);
L(`| Projects extracted | **${projects.length}** |`);
L(`| Hand-curated projects (data/curated, not scraped) | ${curatedRows.length}${curatedRows.length ? ` (${curatedRows.map((p) => p.slug).join(', ')})` : ''} |`);
L(`| Listings superseded by a curated entry | ${projects.filter((p) => p.supersededBy).map((p) => `${p.slug} → ${p.supersededBy}`).join(', ') || 'none'} |`);
L(`| Page fetch failures | ${Object.keys(fetchFailures).length} |`);
L(`| Image references (manifest rows) | ${manifest.length} |`);
L(`| Unique image files stored (sha256-deduped) | ${Object.keys(imgState.byHash).length} |`);
L(`| Image download failures | ${Object.keys(imgState.failures).length} |`);
L(`| Image bytes on disk | ${(Object.values(imgState.byUrl).reduce((a, r) => a + (r.bytes || 0), 0) / 1e6).toFixed(1)} MB (approx., includes duplicates' first copy only) |`);
L();
const mism = discovery.mismatches || {};
const mm = Object.entries(mism).filter(([, v]) => v && v.length);
L(mm.length ? `**Source mismatch:** ${mm.map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ')}` : '**Source cross-check:** sitemap.xml and the rendered /projects listing contain exactly the same set of project slugs — no mismatch. The `/sitemap` HTML page returns 404, so it could not be used as a third source.');
L();
L('## Method');
L();
L('- robots.txt read first. It allows `/` and disallows `/api/`, `/admin/`, `/studio/`, `/projects/create` for `*`. The crawler checks every URL against these rules and **never requests `/api/`**. The CDN (`cdn.realtycanvas.in`) robots.txt carries content-signal comments only, with no directives.');
L('- Project data comes from the Next.js App Router flight payload (`self.__next_f.push`) embedded in each `/projects/<slug>` HTML page. That is the same structured object the page renders from, so it is preferred over DOM scraping. JSON-LD and meta tags are captured too.');
L('- The listing was enumerated by rendering `/projects` in headless Chromium (Playwright), scrolling and clicking any "load more" / "next" controls. The page\'s own front-end loads its data; the crawler does not call those endpoints itself.');
L('- Rate limit ≤ 1 request/second (single process), descriptive User-Agent, 4 retries with exponential backoff (2s, 4s, 8s, 16s). State in `.scrape-state/` makes every step resumable (`npm run scrape:resume`).');
L('- Images are fetched from the original CDN URLs found in the payload. These are originals, not `_next/image` resized variants; any `_next/image?url=` reference is decoded to its source.');
L('- Excluded on purpose: the source site\'s own phone numbers, e-mails, logo, branding, testimonials and user data.');
L();
L('## Field coverage');
L();
L('Share of projects with a non-empty value. *Derived* fields are computed by The Launch District from source fields and labelled as such in `provenance`.');
L();
for (const [group, fields] of Object.entries(FIELDS)) {
  L(`### ${group}`);
  L();
  L('| Field | Coverage | Count |');
  L('|---|---:|---:|');
  for (const [k, f] of Object.entries(fields)) {
    const n = projects.filter((p) => has(f(p))).length;
    L(`| ${k} | ${pct(n)} | ${n}/${projects.length} |`);
  }
  L();
}
L('**Fields the source does not publish for any project** (stored as `null` / `[]`, never guessed): launch date (except where stated in text), lat/long, landmarks, connectivity distances, open-space %, architect, landscape designer, construction partner, specifications, other charges, developer logo, brochure PDF, virtual tours.');
L();

// ---- missing data per project
L('## Projects with notable missing data');
L();
L('| Project | Missing |');
L('|---|---|');
const KEY = { reraNumber: (p) => p.reraNumber, possessionDate: (p) => p.possessionDate, startingPrice: (p) => p.pricing.startingPriceInr, configurations: (p) => p.pricing.configurations, floorPlans: (p) => p.media.floorPlans, gallery: (p) => p.media.gallery, units: (p) => p.facts.units, landArea: (p) => p.facts.landAreaAcres, microMarket: (p) => p.location.microMarket };
let missingRows = 0;
for (const p of projects) {
  const miss = Object.entries(KEY).filter(([, f]) => !has(f(p))).map(([k]) => k);
  if (miss.length >= 2 || miss.includes('reraNumber') || miss.includes('startingPrice')) { L(`| ${p.name ?? p.slug} | ${miss.join(', ')} |`); missingRows++; }
}
if (!missingRows) L('| — | none |');
L();

// ---- failures
L('## Failed downloads / fetches');
L();
const imgFails = Object.entries(imgState.failures);
const pageFails = Object.entries(fetchFailures);
if (!imgFails.length && !pageFails.length) L('None.');
const skipped = imgFails.filter(([, e]) => e.startsWith('skipped')).length;
if (skipped) L(`${skipped} image reference(s) point to hosts other than realtycanvas.in (developer or agent sites that the listing hot-links). They were **deliberately not downloaded**, because the crawler's scope is the source site and its CDN. The original URLs are kept in projects.json. Real download errors: ${imgFails.length - skipped}.\n`);
pageFails.forEach(([s, e]) => L(`- page \`${s}\`: ${e}`));
imgFails.forEach(([u, e]) => L(`- image ${u}: ${e}`));
L();

// ---- anomalies
L('## Things that look wrong (anomalies)');
L();
const anomalies = [];
const now = new Date().toISOString().slice(0, 7);
for (const p of projects) {
  const n = p.name ?? p.slug;
  if (p.statusRaw && !p.status) anomalies.push(`${n}: unrecognised status \`${p.statusRaw}\``);
  if (!p.location.microMarket) anomalies.push(`${n}: no micro-market could be derived (sector ${p.location.sector ?? '—'}, city ${p.location.city ?? '—'})`);
  if (p.location.city && !/gur(u)?g(r)?(a|aa)?o?n|gurugram/i.test(p.location.city)) anomalies.push(`${n}: city is "${p.location.city}" — outside Gurgaon`);
  const slugSector = (p.slug.match(/sector-(\d+[a-d]?)/i) || [])[1]?.toUpperCase();
  if (slugSector && p.location.sector && slugSector !== p.location.sector) anomalies.push(`${n}: slug says sector ${slugSector} but address/locality says ${p.location.sector}`);
  const psf = p.pricing.entryPricePerSqftInr;
  if (psf && (psf < 4000 || psf > 60000)) anomalies.push(`${n}: derived entry ₹/sq ft ${psf.toLocaleString('en-IN')} is outside the plausible 4k–60k band for Gurgaon — starting price and smallest unit probably refer to different units`);
  if (p.possessionDate && p.possessionDate < now && ['pre-launch', 'new-launch', 'under-construction'].includes(p.status)) anomalies.push(`${n}: possession ${p.possessionDate} is in the past but status is ${p.status}`);
  const byArea = {};
  p.pricing.configurations.forEach((c) => { if (c.areaSqft) (byArea[c.areaSqft] ||= new Set()).add(c.bhk); });
  Object.entries(byArea).forEach(([a, s]) => { if (s.size > 1) anomalies.push(`${n}: the same area (${a} sq ft) is listed for different BHK types (${[...s].join(', ')}) — likely a data-entry error at source`); });
  const por = p.pricing.configurations.filter((c) => /request/i.test(c.priceRaw || '')).length;
  if (por && por === p.pricing.configurations.length) { /* common; counted below */ }
  if (p.pricing.startingPriceRaw && !p.pricing.startingPriceInr) anomalies.push(`${n}: starting price "${p.pricing.startingPriceRaw}" could not be parsed`);
}
const allPor = projects.filter((p) => p.pricing.configurations.length && p.pricing.configurations.every((c) => !c.priceInr)).length;
anomalies.push(`${allPor}/${projects.length} projects list every configuration as "Price on Request"; only the project-level starting price is numeric.`);
const boiler = projects.filter((p) => /enjoys a strategic address/i.test(p.location.commentary || '')).length;
anomalies.push(`${boiler}/${projects.length} projects carry the same templated location paragraph ("…enjoys a strategic address…"). The Launch District treats it as boilerplate and does not show it as project-specific analysis.`);
const genericHl = projects.filter((p) => p.content.highlights.some((h) => /^(prime location|24\/7 security|ample parking|modern infrastructure)$/i.test(h))).length;
anomalies.push(`${genericHl}/${projects.length} projects have generic placeholder highlights (e.g. "Prime Location", "24/7 Security").`);
anomalies.forEach((a) => L(`- ${a}`));
L();

// ---- map positions (scripts/geo/build-geo.mjs)
const geoIssues = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'geo', 'discrepancies.json'), 'utf8')); } catch { return null; } })();
if (geoIssues) {
  L('## Map positions');
  L();
  L('Projects are plotted from OpenStreetMap geography (© OpenStreetMap contributors): the listing\'s own coordinate when it lies within 1.5 km of its stated sector, otherwise the sector centre. A named locality with its own sector numbering (Gwal Pahari) overrides the sector table. Sectors missing from OSM are placed between their numbered neighbours and drawn as approximate.');
  L();
  geoIssues.forEach((d) => L(`- **${d.slug}**: ${d.issue}`));
  L();
}

// ---- spot check
L('## Spot-check against live pages');
L();
if (!spot) L('Not run yet — `node scripts/scrape/spot-check.mjs --n 10`.');
else {
  const okN = spot.results.filter((r) => r.ok).length;
  L(`${spot.results.length} random projects re-fetched at ${spot.checkedAt}; **${okN}/${spot.results.length} matched on every check** (name visible on the page, RERA no., starting price, status, developer, and counts of configurations, floor plans, FAQs and gallery images).`);
  L();
  L('| Project | Result | Failed checks |');
  L('|---|---|---|');
  spot.results.forEach((r) => L(`| ${r.slug} | ${r.ok ? '✅ match' : '⚠️ differs'} | ${Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k).join(', ') || '—'} |`));
}
L();
fs.writeFileSync(path.join(DATA_DIR, 'extraction-report.md'), lines.join('\n'));
log('wrote data/extraction-report.md');
