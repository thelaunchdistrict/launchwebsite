import 'server-only';
import dataset from '../../data/projects.json';
import mediaMapJson from '../data/media-map.json';
import mm from '../config/micromarkets.json';
import { median } from './format';
import { badgesOf, monthsUntil, stageOf } from './stage';
import type { ImageRef, Project, ProjectSummary, WebImage } from './types';

const mediaMap = mediaMapJson as Record<string, WebImage>;
const projects = (dataset as unknown as { projects: Project[] }).projects.filter((p) => p.name);

export const datasetMeta = {
  generatedAt: (dataset as { generatedAt: string }).generatedAt,
  count: projects.length,
};

export interface Market {
  slug: string;
  name: string;
  short: string;
  sectors: string[];
}
export const MARKETS: Market[] = mm.markets.map(({ slug, name, short, sectors }) => ({ slug, name, short, sectors }));
export const marketName = (slug: string | null) => MARKETS.find((m) => m.slug === slug)?.name ?? null;

export function img(ref: ImageRef | null | undefined): WebImage | null {
  if (!ref?.localPath) return null;
  return mediaMap[ref.localPath] ?? null;
}

export function allProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** ₹/sq ft used for comparisons: published rate when the source has one, else Falcon's derived entry rate. */
export function psfOf(p: Project): { value: number | null; derived: boolean } {
  if (p.pricing.pricePerSqftMinInr) return { value: p.pricing.pricePerSqftMinInr, derived: false };
  const v = p.pricing.entryPricePerSqftInr;
  // Ignore implausible derived values (starting price and smallest unit refer to different units).
  if (v && v >= 4000 && v <= 60000) return { value: v, derived: true };
  return { value: null, derived: true };
}

export function summarize(p: Project): ProjectSummary {
  const ps = psfOf(p);
  const bhks = [...new Set(p.pricing.configurations.map((c) => c.bhk).filter((b): b is number => b != null))].sort((a, b) => a - b);
  return {
    slug: p.slug,
    name: p.name ?? p.slug,
    developer: p.developer.name,
    type: p.projectType,
    status: p.status,
    stage: stageOf(p),
    badges: badgesOf(p),
    sector: p.location.sector,
    market: p.location.microMarket,
    marketName: marketName(p.location.microMarket),
    priceFrom: p.pricing.startingPriceInr,
    psf: ps.value,
    psfDerived: ps.derived,
    sizeMin: p.pricing.unitSizeMinSqft,
    sizeMax: p.pricing.unitSizeMaxSqft,
    bhks,
    configLabels: [...new Set(p.pricing.configurations.map((c) => c.label).filter((x): x is string => !!x))],
    possession: p.possessionDate,
    possessionYear: p.possessionDate ? Number(p.possessionDate.slice(0, 4)) : null,
    rera: p.reraNumber,
    units: p.facts.units,
    acres: p.facts.landAreaAcres,
    image: img(p.media.hero) ?? img(p.media.gallery[0]),
    createdAt: p.sourceCreatedAt,
  };
}

let _summaries: ProjectSummary[] | null = null;
export function summaries(): ProjectSummary[] {
  return (_summaries ??= projects.map(summarize));
}

export function featured(n = 6): ProjectSummary[] {
  // Earliest on the rail first, then the furthest possession (more runway), then newest listing.
  return [...summaries()]
    .filter((s) => s.image && s.priceFrom)
    .sort((a, b) => a.stage.position - b.stage.position || (b.possession ?? '').localeCompare(a.possession ?? '') || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, n);
}

export function stats() {
  const s = summaries();
  return {
    tracked: s.length,
    early: s.filter((x) => x.badges.some((b) => b.early)).length,
    preLaunch: s.filter((x) => x.badges.some((b) => b.key === 'pre-launch' || b.key === 'new-launch')).length,
    developers: new Set(s.map((x) => x.developer).filter(Boolean)).size,
    markets: new Set(s.map((x) => x.market).filter(Boolean)).size,
    medianPsf: median(s.map((x) => x.psf).filter((x): x is number => x != null)),
    withRera: s.filter((x) => x.rera).length,
  };
}

export function marketStats(slug: string) {
  const list = summaries().filter((s) => s.market === slug);
  const psfs = list.map((s) => s.psf).filter((x): x is number => x != null);
  const prices = list.map((s) => s.priceFrom).filter((x): x is number => x != null);
  const poss = list.map((s) => s.possession).filter((x): x is string => !!x).sort();
  return {
    count: list.length,
    medianPsf: median(psfs),
    minPsf: psfs.length ? Math.min(...psfs) : null,
    maxPsf: psfs.length ? Math.max(...psfs) : null,
    minPrice: prices.length ? Math.min(...prices) : null,
    medianPrice: median(prices),
    possessionFrom: poss[0] ?? null,
    possessionTo: poss[poss.length - 1] ?? null,
    developers: [...new Set(list.map((s) => s.developer).filter(Boolean))] as string[],
    projects: list,
  };
}

export function sectorStats() {
  const by = new Map<string, number[]>();
  for (const s of summaries()) {
    if (!s.sector || s.psf == null) continue;
    (by.get(s.sector) ?? by.set(s.sector, []).get(s.sector)!).push(s.psf);
  }
  return [...by.entries()]
    .map(([sector, xs]) => ({ sector, count: xs.length, median: median(xs)!, min: Math.min(...xs), max: Math.max(...xs) }))
    .sort((a, b) => b.median - a.median);
}

export function similar(p: Project, n = 3): ProjectSummary[] {
  const all = summaries().filter((s) => s.slug !== p.slug);
  const me = summarize(p);
  const score = (s: ProjectSummary) =>
    (p.relatedSlugs.includes(s.slug) ? 2 : 0) +
    (s.market && s.market === me.market ? 3 : 0) +
    (s.type === me.type ? 1 : 0) +
    (me.priceFrom && s.priceFrom ? Math.max(0, 2 - Math.abs(Math.log(s.priceFrom / me.priceFrom)) * 2) : 0);
  return all.map((s) => ({ s, k: score(s) })).sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.s);
}

export type Check = { label: string; state: 'ok' | 'caution' | 'unknown'; detail: string };

/** Informational due-diligence checklist built only from what the data actually says. */
export function dueDiligence(p: Project): Check[] {
  const checks: Check[] = [];
  checks.push(
    p.reraNumber
      ? { label: 'RERA registration', state: 'ok', detail: `Registration no. ${p.reraNumber} is published. Confirm it is active and matches this phase/tower on the HARERA Gurugram portal.` }
      : { label: 'RERA registration', state: 'caution', detail: 'No RERA number is published for this listing. Do not pay a booking amount until you have one and have checked it.' },
  );
  checks.push({
    label: 'Developer delivery record',
    state: 'unknown',
    detail: `Not assessed by Falcon. Look up ${p.developer.name ?? 'the developer'}'s completed projects and any HARERA complaints or delay orders.`,
  });
  checks.push({ label: 'Approvals (licence, building plan, environmental clearance)', state: 'unknown', detail: 'Not published in the source listing. Ask for the DTCP licence number and approved building plan.' });
  const plan = p.pricing.paymentPlan ?? '';
  if (!plan) checks.push({ label: 'Payment-plan type', state: 'unknown', detail: 'Payment plan not published. Prefer construction-linked plans; treat heavy up-front or subvention schemes with care.' });
  else if (/construction[-\s]linked|\bclp\b/i.test(plan)) checks.push({ label: 'Payment-plan type', state: 'ok', detail: 'Construction-linked plan mentioned — payments track build progress.' });
  else if (/subvention|possession[-\s]linked|\bplp\b|\d{2}\s*:\s*\d{2}/i.test(plan)) checks.push({ label: 'Payment-plan type', state: 'caution', detail: 'Possession-linked / ratio plan mentioned — lower outflow now, but understand who carries the interest and what happens on delay.' });
  else checks.push({ label: 'Payment-plan type', state: 'unknown', detail: 'Plan mentioned but type unclear — ask for the full schedule.' });
  const left = monthsUntil(p.possessionDate);
  if (!p.possessionDate) checks.push({ label: 'Possession date', state: 'unknown', detail: 'No possession date published. Get the RERA-committed completion date in writing.' });
  else if (left != null && left < 0 && p.status !== 'ready') checks.push({ label: 'Possession date', state: 'caution', detail: `Stated possession (${p.possessionDate}) has passed but the project is not listed as ready. Ask about revised timelines.` });
  else checks.push({ label: 'Possession date', state: 'ok', detail: `Possession stated as ${p.possessionDate}. Compare with the RERA completion date — marketing dates are often earlier.` });
  const priced = p.pricing.configurations.filter((c) => c.priceInr).length;
  checks.push(
    priced
      ? { label: 'Price transparency', state: 'ok', detail: `${priced} of ${p.pricing.configurations.length} configurations have a published price.` }
      : { label: 'Price transparency', state: 'caution', detail: 'Configuration prices are "on request". Ask for an all-inclusive cost sheet (BSP, PLC, EDC/IDC, parking, club, GST).' },
  );
  return checks;
}
