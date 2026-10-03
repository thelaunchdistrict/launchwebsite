// Step 4: raw page payloads → one normalised schema.
// Writes data/projects.json, data/projects.csv. Never invents values: anything not present in the
// source is null. Values that Falcon *derives* (micro-market, entry ₹/sq ft, dates found in FAQ text)
// are recorded in `provenance` so the UI and report can label them.
import fs from 'node:fs';
import path from 'node:path';
import { STATE_DIR, DATA_DIR, SOURCE, readJSON, writeJSON, log } from './lib.mjs';
import { collectImageRefs } from './download-images.mjs';
import { imageSize } from 'image-size';
import { applyBuilderCorrections } from './apply-builder.mjs';
import {
  parseInr, parseInrRange, parseAreaSqft, parseAcres, findPossession, findLaunch, parseBhk, fixCompoundDashes,
  sectorFrom, normalizeStatus, normalizeType, projectName,
} from './parse.mjs';
import mm from '../../src/config/micromarkets.json' with { type: 'json' };

const RAW_DIR = path.join(STATE_DIR, 'raw');
const imgState = readJSON(path.join(STATE_DIR, 'images-state.json'), { byUrl: {} });
const nn = (v) => (v === undefined || v === '' ? null : v);
// Formatting-only clean-up of source text: spaced dashes, compound words, accidental doubled
// function words ("developed by by"). Wording is never changed beyond that.
// Unambiguous typos in the source (found by `npm run qa`). Regional spellings are left as written.
const SOURCE_TYPOS = [[/\bAmenitics\b/g, 'Amenities'], [/\bHighspeed\b/g, 'High-speed'], [/\bhighspeed\b/g, 'high-speed']];
const clean = (s) => {
  if (s == null) return null;
  let t = fixCompoundDashes(String(s).replace(/\s+–\s+/g, ' – ')).replace(/\b(by|the|a|an|and|of|to|in|for|with|is)\s+\1\b/gi, '$1');
  for (const [re, to] of SOURCE_TYPOS) t = t.replace(re, to);
  return t.trim() || null;
};

// The sector number decides the corridor. Keywords are a fallback for listings without a sector, and
// only look at address-like fields: descriptions name *other* corridors for connectivity
// ("10 minutes from Dwarka Expressway"), which previously put Sector 14 and 63A projects on DXP.
function microMarketFor(sector, address, locality, title) {
  if (sector) for (const m of mm.markets) if (m.sectors.includes(sector)) return { slug: m.slug, method: 'sector-table' };
  const hay = [address, locality, title].filter(Boolean).join(' ').toLowerCase();
  for (const m of mm.markets) if (m.keywords.some((k) => new RegExp(k, 'i').test(hay))) return { slug: m.slug, method: 'keyword' };
  return null;
}

// Source `developerName` often holds the project name ("DLF Privana West"); map to the developer brand.
const DEVELOPERS = [
  [/^4s\b/i, '4S Developers'], [/adani/i, 'Adani Realty'], [/birla/i, 'Birla Estates'], [/\baipl\b/i, 'AIPL'],
  [/anant raj/i, 'Anant Raj'], [/\bbptp\b/i, 'BPTP'], [/conscient/i, 'Conscient & Hines'], [/\bdlf\b/i, 'DLF'],
  [/\belan\b/i, 'Elan Group'], [/emaar/i, 'Emaar India'], [/experion/i, 'Experion Developers'], [/hero homes/i, 'Hero Realty'],
  [/^hines/i, 'Hines'], [/\bm3m\b/i, 'M3M India'], [/max estates?/i, 'Max Estates'], [/\bparas\b/i, 'Paras Buildtech'],
  [/\bpuri\b/i, 'Puri Constructions'], [/shapoorji/i, 'Shapoorji Pallonji'], [/signature global/i, 'Signature Global'],
  [/silverglades/i, 'Silverglades'], [/smart ?world/i, 'Smartworld Developers'], [/sobha/i, 'Sobha Limited'], [/\bspj\b/i, 'SPJ Group'],
  [/\btarc\b/i, 'TARC'], [/trevoc/i, 'Trevoc Group'], [/whiteland/i, 'Whiteland Corporation'], [/godrej/i, 'Godrej Properties'],
  [/\bireo\b/i, 'Ireo'], [/\btata\b/i, 'Tata Housing'], [/central park/i, 'Central Park'], [/krisumi/i, 'Krisumi'], [/yugen/i, 'Yugen Infra'],
];
function canonicalDeveloper(raw, title, slug) {
  for (const s of [raw, title, slug]) {
    if (!s) continue;
    const hit = DEVELOPERS.find(([re]) => re.test(String(s).replace(/-/g, ' ')));
    if (hit) return hit[1];
  }
  return nn(raw);
}

const media = (url) => {
  if (!url) return null;
  const rec = imgState.byUrl[url];
  return { originalUrl: url, localPath: rec?.localPath ?? null, width: rec?.width ?? null, height: rec?.height ?? null };
};

function normalize(raw) {
  const p = raw.project;
  const prov = {};
  const faqText = (p.faqs || []).map((f) => `${f.question} ${f.answer}`).join('\n');
  const allText = [p.description, p.aboutDescription, p.bannerDescription, faqText, p.seo?.localContent, p.seo?.longFormContent].filter(Boolean).join('\n');

  // ---- identity
  const name = projectName(p);
  const statusRaw = nn(p.status);
  const status = normalizeStatus(statusRaw);
  const unitTypes = (p.pricingTable || []).map((r) => r.type).filter(Boolean);
  const projectType = normalizeType(p.category, p.type, unitTypes, p.title);
  // Launch stage stated in the listing's own copy ("currently in the new launch phase"), kept apart
  // from the structured status so the UI can label its origin.
  const stageText = [p.title, p.subtitle, p.bannerTitle, p.description, faqText].filter(Boolean).join('\n');
  const stageMatch = stageText.match(/(?:^|\n)[^\n]*?\b(pre-?launch|new[- ]launch)\b(?!\s+(?:benefit|offer|price))/i);
  const marketingStage = stageMatch && /(currently|is (?:a |an )?|^.{0,60}$)/im.test(stageMatch[0])
    ? (/pre/i.test(stageMatch[1]) ? 'pre-launch' : 'new-launch') : null;
  if (marketingStage) prov.marketingStage = 'extracted-from-listing-text';
  const possession = findPossession(faqText) || findPossession(allText);
  if (possession) prov.possessionDate = 'extracted-from-faq-text';
  const launch = findLaunch(allText);
  if (launch) prov.launchDate = 'extracted-from-text';

  // ---- location
  const sector = sectorFrom(p.locality, p.address, p.title, p.slug);
  // A named locality with its own sector numbering (e.g. Gwal Pahari) overrides the Gurugram sector table.
  const namedLocality = (mm.localities ?? []).find((l) => new RegExp(l.keyword, 'i').test([p.address, p.locality, p.subtitle].filter(Boolean).join(' ')));
  const market = namedLocality ? { slug: namedLocality.market, method: 'locality' } : microMarketFor(sector, p.address, p.locality, p.title);
  if (market) prov.microMarket = `derived:${market.method}`;
  const connectivity = (p.nearbyPoints || []).map((n) => ({
    name: nn(n.name || n.title),
    category: nn(n.type || n.category)?.toLowerCase().replace(/_/g, '-') ?? null,
    distanceRaw: nn(n.distance ?? null),
    distanceKm: nn(n.distanceKm ?? (n.distance != null ? parseFloat(String(n.distance)) || null : null)),
    travelTime: n.travelTimeMin != null ? `${n.travelTimeMin} min` : nn(n.travelTime || n.time || null),
    travelTimeMin: nn(n.travelTimeMin),
  }));

  // ---- pricing
  const startingInr = nn(p.priceMin) ?? parseInr(p.basePrice);
  const range = parseInrRange(p.priceRange);
  const configurations = (p.pricingTable || []).map((r) => {
    const label = (nn(r.floorNumbers) || nn(r.type))?.replace(/(\d(?:\.\d)?)\s*BHK/gi, '$1 BHK') ?? null;
    const areaSqft = parseAreaSqft(r.reraArea) ?? parseAreaSqft(r.unitArea);
    const priceInr = parseInr(r.price);
    const psfInr = parseInr(r.pricePerSqft);
    return {
      label,
      unitType: nn(r.type),
      bhk: parseBhk(r.floorNumbers) ?? parseBhk(r.type),
      areaRaw: nn(r.reraArea) || nn(r.unitArea),
      areaSqft,
      areaBasis: r.reraArea ? 'RERA carpet/saleable (as listed)' : r.unitArea ? 'unit area' : null,
      priceRaw: nn(r.price),
      priceInr,
      pricePerSqftRaw: nn(r.pricePerSqft),
      pricePerSqftInr: psfInr && psfInr > 500 ? psfInr : null,
      availability: nn(r.availabilityStatus),
      features: nn(r.features),
    };
  }).sort((a, b) => (a.bhk ?? 99) - (b.bhk ?? 99) || (a.areaSqft ?? 0) - (b.areaSqft ?? 0));

  const areas = configurations.map((c) => c.areaSqft).filter(Boolean);
  const minArea = areas.length ? Math.min(...areas) : null;
  const maxArea = areas.length ? Math.max(...areas) : null;
  // Derived (labelled) indicative entry ₹/sq ft = starting price ÷ smallest listed unit area.
  let entryPsf = null;
  if (startingInr && minArea) {
    entryPsf = Math.round(startingInr / minArea);
    prov.entryPricePerSqft = 'derived:startingPrice/smallestUnitArea';
  }
  const paymentFaq = (p.faqs || []).find((f) => /payment plan|booking amount|construction[-\s]linked|\d+\s*:\s*\d+/i.test(f.question + ' ' + f.answer) && /payment|booking|plan/i.test(f.question));
  const bookingFaq = (p.faqs || []).find((f) => /booking amount|eoi|expression of interest/i.test(f.question));
  if (paymentFaq) prov.paymentPlan = 'extracted-from-faq-text';

  // ---- facts
  const units = nn(p.numberOfApartments) ?? nn(p.totalUnits);
  const acres = parseAcres(p.landArea);
  const density = units && acres ? +(units / acres).toFixed(1) : null;
  if (density) prov.unitsPerAcre = 'derived:units/landAcres';

  // ---- amenities
  const amenities = (p.amenities || []).map((a) => ({ category: nn(a.category), name: clean(a.name), details: clean(a.details) }));

  // ---- media
  const refs = collectImageRefs(p);
  const floorPlans = (p.floorPlans || []).map((f) => ({ label: clean(f.title) || clean(f.level), level: nn(f.level), details: nn(f.details), image: media(f.imageUrl) }));
  const videos = (p.videoUrls || []).filter(Boolean);
  const pdfs = [...new Set((JSON.stringify(p).match(/https?:[^"\s]+\.pdf/gi) || []))];

  return {
    id: p.id,
    slug: p.slug,
    name,
    sourceUrl: `${SOURCE}/projects/${p.slug}`,
    developer: { name: canonicalDeveloper(p.developerName, p.title, p.slug), nameRaw: nn(p.developerName) },
    projectType,
    categoryRaw: nn(p.category),
    typeRaw: nn(p.type),
    status,
    statusRaw,
    marketingStage,
    marketingStageRaw: marketingStage ? stageMatch[0].trim().slice(0, 200) : null,
    reraNumber: nn(p.reraId),
    launchDate: launch?.iso ?? null,
    launchDateRaw: launch?.raw ?? null,
    possessionDate: possession?.iso ?? null,
    possessionDateRaw: possession?.raw ?? null,
    location: {
      sector,
      microMarket: market?.slug ?? null,
      locality: nn(p.locality) ?? namedLocality?.name ?? null,
      city: p.city ? (/gurgaon|gurugram/i.test(p.city) ? 'Gurugram' : p.city) : null,
      cityRaw: nn(p.city),
      state: nn(p.state),
      address: nn(p.address),
      latitude: nn(p.latitude),
      longitude: nn(p.longitude),
      landmarks: [],
      connectivity,
      commentary: nn(p.seo?.localContent) || nn(p.sitePlanDescription),
    },
    pricing: {
      startingPriceRaw: nn(p.basePrice),
      startingPriceInr: startingInr,
      priceRangeRaw: nn(p.priceRange),
      priceMinInr: range.min ?? startingInr,
      priceMaxInr: nn(p.priceMax) ?? range.max,
      pricePerSqftMinInr: parseInr(p.minRatePsf),
      pricePerSqftMaxInr: parseInr(p.maxRatePsf),
      entryPricePerSqftInr: entryPsf,
      unitSizeMinSqft: minArea,
      unitSizeMaxSqft: maxArea,
      configurations,
      paymentPlan: paymentFaq ? clean(paymentFaq.answer) : null,
      bookingAmount: bookingFaq ? clean(bookingFaq.answer) : null,
      otherCharges: null,
    },
    facts: {
      landAreaRaw: nn(p.landArea),
      landAreaAcres: acres,
      towers: nn(p.numberOfTowers),
      floors: nn(p.numberOfFloors),
      units,
      soldUnits: nn(p.soldUnits),
      availableUnits: nn(p.availableUnits),
      unitsPerAcre: density,
      openSpacePercent: null,
      architect: null,
      landscapeDesigner: null,
      constructionPartner: null,
    },
    content: {
      title: clean(p.title),
      subtitle: clean(p.subtitle),
      description: clean(p.description),
      overview: clean(p.aboutDescription),
      highlights: (p.highlights || []).map((h) => clean(h.label)).filter(Boolean),
      amenities,
      specifications: [],
      faqs: (p.faqs || []).map((f) => ({ question: clean(f.question), answer: clean(f.answer) })),
      investmentCommentary: nn(p.seo?.longFormContent),
      offerings: (p.offerings || []).map((o) => ({ title: clean(o.title || o.name), details: clean(o.description || o.details) })),
    },
    media: {
      hero: media(p.featuredImage),
      gallery: (p.galleryImages || []).map(media),
      floorPlans,
      sitePlan: media(p.sitePlanImage),
      videos,
      virtualTours: [],
      brochurePdf: pdfs[0] ?? null,
      developerLogo: null,
      imageCount: refs.length,
    },
    seo: {
      title: nn(p.seoTitle) || nn(p.seo?.metaTitle) || raw.meta?.title,
      description: nn(p.seoDescription) || nn(p.seo?.metaDescription) || raw.meta?.description,
      keywords: p.seoKeywords || p.seo?.metaKeywords || [],
      h1: nn(p.seo?.h1Tag),
    },
    relatedSlugs: raw.relatedProjects || [],
    sourceCreatedAt: nn(p.createdAt),
    scrapedAt: raw.fetchedAt,
    provenance: prov,
  };
}

// ---- CSV
const CSV_COLS = [
  ['slug', (p) => p.slug], ['name', (p) => p.name], ['developer', (p) => p.developer.name], ['projectType', (p) => p.projectType],
  ['status', (p) => p.status], ['reraNumber', (p) => p.reraNumber], ['launchDate', (p) => p.launchDate], ['possessionDate', (p) => p.possessionDate],
  ['sector', (p) => p.location.sector], ['microMarket', (p) => p.location.microMarket], ['city', (p) => p.location.city], ['address', (p) => p.location.address],
  ['latitude', (p) => p.location.latitude], ['longitude', (p) => p.location.longitude],
  ['startingPriceRaw', (p) => p.pricing.startingPriceRaw], ['startingPriceInr', (p) => p.pricing.startingPriceInr], ['priceMaxInr', (p) => p.pricing.priceMaxInr],
  ['pricePerSqftMinInr', (p) => p.pricing.pricePerSqftMinInr], ['pricePerSqftMaxInr', (p) => p.pricing.pricePerSqftMaxInr], ['entryPricePerSqftInr_derived', (p) => p.pricing.entryPricePerSqftInr],
  ['unitSizeMinSqft', (p) => p.pricing.unitSizeMinSqft], ['unitSizeMaxSqft', (p) => p.pricing.unitSizeMaxSqft],
  ['configurations', (p) => [...new Set(p.pricing.configurations.map((c) => c.label))].join('; ')],
  ['paymentPlan', (p) => p.pricing.paymentPlan], ['landAreaAcres', (p) => p.facts.landAreaAcres], ['towers', (p) => p.facts.towers], ['floors', (p) => p.facts.floors], ['units', (p) => p.facts.units],
  ['amenityCount', (p) => p.content.amenities.length], ['faqCount', (p) => p.content.faqs.length], ['floorPlanCount', (p) => p.media.floorPlans.length],
  ['galleryCount', (p) => p.media.gallery.length], ['videoCount', (p) => p.media.videos.length], ['sourceUrl', (p) => p.sourceUrl], ['scrapedAt', (p) => p.scrapedAt],
];
const csvCell = (v) => { if (v == null) return ''; const s = String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

function loadCurated() {
  const dir = path.join(DATA_DIR, 'curated');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const c = readJSON(path.join(dir, f));
    delete c._comment;
    for (const k of ['id', 'slug', 'name', 'status', 'location', 'pricing', 'facts', 'content', 'media', 'seo', 'provenance']) {
      if (!(k in c)) throw new Error(`curated ${f}: missing "${k}"`);
    }
    // Fill image dimensions from the files so the schema matches scraped entries.
    const dims = (ref) => {
      if (!ref?.localPath) return ref;
      try { const { width, height } = imageSize(fs.readFileSync(path.join(DATA_DIR, '..', ref.localPath))); return { ...ref, width, height }; }
      catch { log(`curated ${c.slug}: image missing ${ref.localPath}`); return { ...ref, width: null, height: null }; }
    };
    c.media.hero = dims(c.media.hero);
    c.media.gallery = (c.media.gallery || []).map(dims);
    c.media.floorPlans = (c.media.floorPlans || []).map((fp) => ({ ...fp, image: dims(fp.image) }));
    c.media.sitePlan = dims(c.media.sitePlan);
    c.media.imageCount = 1 + c.media.gallery.length + c.media.floorPlans.length + (c.media.sitePlan ? 1 : 0);
    return { ...c, source: 'curated' };
  });
}

function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json')).sort();
  const projects = files.map((f) => ({ source: 'listing', ...normalize(readJSON(path.join(RAW_DIR, f))) }));
  // Hand-curated listings (data/curated/*.json) from developer material supplied to Falcon.
  const curated = loadCurated();
  for (const c of curated) {
    for (const s of c.supersedes || []) {
      const old = projects.find((p) => p.slug === s);
      if (old) { old.supersededBy = c.slug; log(`${s} superseded by curated ${c.slug}`); }
    }
  }
  projects.push(...curated);
  // Builder-first corrections (data/verify/builder): the developer's own published values win.
  const b = applyBuilderCorrections(projects, { dir: path.join(DATA_DIR, 'verify', 'builder'), marketFor: (sector, address, locality) => microMarketFor(sector, address, locality, null), log });
  if (b.applied || b.rejected) log(`builder corrections: ${b.applied} applied, ${b.rejected} rejected`);
  projects.sort((a, b) => a.slug.localeCompare(b.slug));
  writeJSON(path.join(DATA_DIR, 'projects.json'), { generatedAt: new Date().toISOString(), source: SOURCE, count: projects.length, projects });
  const csv = [CSV_COLS.map((c) => c[0]).join(','), ...projects.map((p) => CSV_COLS.map(([, f]) => csvCell(f(p))).join(','))].join('\n');
  fs.writeFileSync(path.join(DATA_DIR, 'projects.csv'), '﻿' + csv);
  log(`normalised ${projects.length} projects → data/projects.json, data/projects.csv`);
}

main();
