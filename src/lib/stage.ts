import type { Badge, Project, Stage } from './types';

/** Typical Gurgaon high-rise build cycle used to place under-construction projects on the rail. */
const BUILD_MONTHS = 60;
const EARLY_CONSTRUCTION_MONTHS = 36;

export function monthsUntil(isoYearMonth: string | null, now = new Date()): number | null {
  if (!isoYearMonth) return null;
  const [y, m] = isoYearMonth.split('-').map(Number);
  const month = m || 12; // year-only dates: assume the end of that year
  return (y - now.getFullYear()) * 12 + (month - (now.getMonth() + 1));
}

export const RAIL_STATIONS = ['Pre-launch', 'Launch', 'Construction', 'Possession'] as const;

export function stageOf(p: Pick<Project, 'status' | 'marketingStage' | 'possessionDate'>, now = new Date()): Stage {
  if (p.status === 'pre-launch') return { position: 0, label: 'Pre-launch', basis: 'status' };
  if (p.status === 'new-launch') return { position: 1, label: 'New launch', basis: 'status' };
  if (p.status === 'ready') return { position: 3, label: 'Ready to move', basis: 'status' };
  if (p.status === 'under-construction') {
    if (p.marketingStage === 'pre-launch') return { position: 0.3, label: 'Pre-launch', basis: 'listing-text' };
    if (p.marketingStage === 'new-launch') return { position: 1.15, label: 'New launch', basis: 'listing-text' };
    const left = monthsUntil(p.possessionDate, now);
    if (left == null) return { position: 2, label: 'Under construction', basis: 'status' };
    const progress = Math.min(0.95, Math.max(0.05, 1 - left / BUILD_MONTHS));
    return { position: 1 + 2 * progress, label: 'Under construction', basis: 'derived' };
  }
  return { position: 0, label: 'Stage not published', basis: 'unknown' };
}

export function badgesOf(p: Project, now = new Date()): Badge[] {
  const out: Badge[] = [];
  const stage = p.status === 'pre-launch' || p.marketingStage === 'pre-launch' ? 'pre-launch'
    : p.status === 'new-launch' || p.marketingStage === 'new-launch' ? 'new-launch' : null;
  if (stage === 'pre-launch') out.push({ key: 'pre-launch', label: 'Pre-launch', early: true, note: p.status === 'pre-launch' ? 'Listed status' : 'Stated in listing text' });
  if (stage === 'new-launch') out.push({ key: 'new-launch', label: 'New launch', early: true, note: p.status === 'new-launch' ? 'Listed status' : 'Stated in listing text' });
  const left = monthsUntil(p.possessionDate, now);
  if (!stage && p.status === 'under-construction' && left != null && left >= EARLY_CONSTRUCTION_MONTHS) {
    out.push({ key: 'early-construction', label: 'Early construction', early: true, note: `Possession ${Math.round(left / 12)}+ years out — Falcon inference from the stated possession date` });
  }
  const { units, availableUnits } = p.facts;
  if (units && availableUnits != null && availableUnits / units <= 0.15) {
    out.push({ key: 'limited-inventory', label: 'Limited inventory', early: false, note: `${availableUnits} of ${units} units listed as available` });
  }
  if (p.status === 'ready') out.push({ key: 'ready', label: 'Ready to move', early: false, note: 'Listed status' });
  return out;
}
