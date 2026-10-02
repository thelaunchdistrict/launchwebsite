import type { ProjectSummary } from '@/lib/types';

export interface Filters {
  early: boolean;
  stage: string[]; // badge keys or status values
  market: string[];
  developer: string;
  sector: string;
  budgetMax: number | null; // ₹
  budgetMin: number | null;
  bhk: string[]; // '2','3','4','5+'
  possessionBy: number | null; // year
  type: string[];
  q: string;
}

export const EMPTY: Filters = { early: false, stage: [], market: [], developer: '', sector: '', budgetMax: null, budgetMin: null, bhk: [], possessionBy: null, type: [], q: '' };

export const SORTS = {
  recommended: 'Earliest stage first',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'psf-asc': '₹/sq ft: low to high',
  'psf-desc': '₹/sq ft: high to low',
  'possession-asc': 'Possession: soonest',
  'possession-desc': 'Possession: latest',
  newest: 'Newest listed',
} as const;
export type SortKey = keyof typeof SORTS;

export const STAGES = [
  { key: 'pre-launch', label: 'Pre-launch' },
  { key: 'new-launch', label: 'New launch' },
  { key: 'early-construction', label: 'Early construction' },
  { key: 'under-construction', label: 'Under construction' },
  { key: 'ready', label: 'Ready to move' },
];

export const BUDGETS: { label: string; min: number | null; max: number | null }[] = [
  { label: 'Any', min: null, max: null },
  { label: 'Under ₹2 Cr', min: null, max: 2e7 },
  { label: '₹2–4 Cr', min: 2e7, max: 4e7 },
  { label: '₹4–7 Cr', min: 4e7, max: 7e7 },
  { label: '₹7–10 Cr', min: 7e7, max: 1e8 },
  { label: '₹10 Cr+', min: 1e8, max: null },
];

export function apply(list: ProjectSummary[], f: Filters, sort: SortKey): ProjectSummary[] {
  const q = f.q.trim().toLowerCase();
  const out = list.filter((p) => {
    if (f.early && !p.badges.some((b) => b.early)) return false;
    if (f.stage.length && !f.stage.some((s) => p.badges.some((b) => b.key === s) || p.status === s)) return false;
    if (f.market.length && !f.market.includes(p.market ?? '')) return false;
    if (f.developer && p.developer !== f.developer) return false;
    if (f.sector && p.sector !== f.sector) return false;
    if (f.budgetMax != null && (p.priceFrom == null || p.priceFrom > f.budgetMax)) return false;
    if (f.budgetMin != null && (p.priceFrom == null || p.priceFrom < f.budgetMin)) return false;
    if (f.bhk.length && !f.bhk.some((b) => (b === '5+' ? p.bhks.some((x) => x >= 5) : p.bhks.includes(Number(b))))) return false;
    if (f.possessionBy != null && (p.possessionYear == null || p.possessionYear > f.possessionBy)) return false;
    if (f.type.length && !f.type.includes(p.type ?? '')) return false;
    if (q && !`${p.name} ${p.developer} ${p.sector ? 'sector ' + p.sector : ''} ${p.marketName}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => (a == null ? 1 : b == null ? -1 : (a - b) * dir);
  const ym = (s: string | null) => (s ? Number(s.slice(0, 4)) * 12 + (Number(s.slice(5, 7)) || 12) : null);
  out.sort((a, b) => {
    switch (sort) {
      case 'price-asc': return nullsLast(a.priceFrom, b.priceFrom, 1);
      case 'price-desc': return nullsLast(a.priceFrom, b.priceFrom, -1);
      case 'psf-asc': return nullsLast(a.psf, b.psf, 1);
      case 'psf-desc': return nullsLast(a.psf, b.psf, -1);
      case 'possession-asc': return nullsLast(ym(a.possession), ym(b.possession), 1);
      case 'possession-desc': return nullsLast(ym(a.possession), ym(b.possession), -1);
      case 'newest': return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
      default: return a.stage.position - b.stage.position || nullsLast(ym(a.possession), ym(b.possession), -1);
    }
  });
  return out;
}

// ---- URL <-> state
export function fromParams(sp: URLSearchParams): { f: Filters; sort: SortKey; view: 'grid' | 'map' } {
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(',').filter(Boolean) : []);
  const num = (k: string) => (sp.get(k) && !isNaN(Number(sp.get(k))) ? Number(sp.get(k)) : null);
  const sort = (sp.get('sort') as SortKey) || 'recommended';
  return {
    f: {
      early: sp.get('early') === '1',
      stage: list('stage'),
      market: list('market'),
      developer: sp.get('developer') ?? '',
      sector: sp.get('sector') ?? '',
      budgetMin: num('min'),
      budgetMax: num('max'),
      bhk: list('bhk'),
      possessionBy: num('by'),
      type: list('type'),
      q: sp.get('q') ?? '',
    },
    sort: sort in SORTS ? sort : 'recommended',
    view: sp.get('view') === 'map' ? 'map' : 'grid',
  };
}

export function toParams(f: Filters, sort: SortKey, view: 'grid' | 'map'): string {
  const sp = new URLSearchParams();
  if (f.early) sp.set('early', '1');
  if (f.stage.length) sp.set('stage', f.stage.join(','));
  if (f.market.length) sp.set('market', f.market.join(','));
  if (f.developer) sp.set('developer', f.developer);
  if (f.sector) sp.set('sector', f.sector);
  if (f.budgetMin != null) sp.set('min', String(f.budgetMin));
  if (f.budgetMax != null) sp.set('max', String(f.budgetMax));
  if (f.bhk.length) sp.set('bhk', f.bhk.join(','));
  if (f.possessionBy != null) sp.set('by', String(f.possessionBy));
  if (f.type.length) sp.set('type', f.type.join(','));
  if (f.q) sp.set('q', f.q);
  if (sort !== 'recommended') sp.set('sort', sort);
  if (view !== 'grid') sp.set('view', view);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function activeCount(f: Filters) {
  return (f.early ? 1 : 0) + f.stage.length + f.market.length + (f.developer ? 1 : 0) + (f.sector ? 1 : 0) + (f.budgetMin != null || f.budgetMax != null ? 1 : 0) + f.bhk.length + (f.possessionBy ? 1 : 0) + f.type.length + (f.q ? 1 : 0);
}
