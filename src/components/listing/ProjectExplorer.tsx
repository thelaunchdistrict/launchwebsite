'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectSummary } from '@/lib/types';
import { typeLabel } from '@/lib/format';
import { ProjectCard } from '../project/ProjectCard';
import { CorridorMapView, type StationPos } from '../map/CorridorMapView';
import { Icon } from '../Icon';
import { activeCount, apply, BUDGETS, EMPTY, fromParams, SORTS, STAGES, toParams, type Filters, type SortKey } from './filters';

interface Options {
  markets: { slug: string; name: string }[];
  developers: string[];
  sectors: string[];
  years: number[];
  types: string[];
}

export function ProjectExplorer({ projects, options, map }: { projects: ProjectSummary[]; options: Options; map: { stations: StationPos[]; base: React.ReactNode; attribution: string } }) {
  // The page is prerendered with no filters (so the full grid is in the HTML); filters from the URL
  // are applied after mount. Reading search params during render would force a client-only bailout.
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [sheet, setSheet] = useState(false);
  const PAGE = 18;
  const [limit, setLimit] = useState(PAGE);
  const ready = useRef(false);

  useEffect(() => {
    const init = fromParams(new URLSearchParams(window.location.search));
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL after hydration */
    setF(init.f);
    setSort(init.sort);
    setView(init.view);
    /* eslint-enable react-hooks/set-state-in-effect */
    ready.current = true;
  }, []);

  // Keep the URL shareable without adding history entries (and without a server round-trip).
  useEffect(() => {
    if (!ready.current) return;
    const next = `${window.location.pathname}${toParams(f, sort, view)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', next);
  }, [f, sort, view]);

  const results = useMemo(() => apply(projects, f, sort), [projects, f, sort]);
  // New filters or sort start again from the first page.
  const [lastKey, setLastKey] = useState('');
  const key = JSON.stringify([f, sort]);
  if (key !== lastKey) { setLastKey(key); setLimit(PAGE); }
  const n = activeCount(f);
  const upd = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggleIn = (k: 'stage' | 'market' | 'bhk' | 'type', v: string) => setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));

  const tokens: { label: string; clear: () => void }[] = [];
  if (f.early) tokens.push({ label: 'Early-entry only', clear: () => upd('early', false) });
  f.stage.forEach((s) => tokens.push({ label: STAGES.find((x) => x.key === s)?.label ?? s, clear: () => toggleIn('stage', s) }));
  f.market.forEach((s) => tokens.push({ label: options.markets.find((m) => m.slug === s)?.name ?? s, clear: () => toggleIn('market', s) }));
  if (f.developer) tokens.push({ label: f.developer, clear: () => upd('developer', '') });
  if (f.sector) tokens.push({ label: `Sector ${f.sector}`, clear: () => upd('sector', '') });
  if (f.budgetMin != null || f.budgetMax != null) tokens.push({ label: BUDGETS.find((b) => b.min === f.budgetMin && b.max === f.budgetMax)?.label ?? 'Budget', clear: () => setF((s) => ({ ...s, budgetMin: null, budgetMax: null })) });
  f.bhk.forEach((b) => tokens.push({ label: `${b} BHK`, clear: () => toggleIn('bhk', b) }));
  if (f.possessionBy) tokens.push({ label: `Possession by ${f.possessionBy}`, clear: () => upd('possessionBy', null) });
  f.type.forEach((t) => tokens.push({ label: typeLabel(t), clear: () => toggleIn('type', t) }));
  if (f.q) tokens.push({ label: `“${f.q}”`, clear: () => upd('q', '') });

  const panel = (
    <FilterPanel f={f} options={options} upd={upd} toggleIn={toggleIn} />
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Desktop filter column */}
      <aside aria-label="Filters" className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2 pb-8">{panel}</div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink pb-3">
          <p className="mr-auto w-full text-sm sm:w-auto" role="status" aria-live="polite">
            <span className="num text-lg">{results.length}</span> <span className="text-ink-2">of {projects.length} projects</span>
          </p>
          <button type="button" className="btn btn-ghost lg:hidden" onClick={() => setSheet(true)} aria-haspopup="dialog">
            <Icon name="filter" /> Filters{n ? ` (${n})` : ''}
          </button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" className="field order-last w-full rounded-[2px] py-2 pr-8 text-sm sm:order-none sm:w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div role="group" aria-label="View" className="inline-flex rounded-[2px] border hairline p-0.5">
            {(['grid', 'map'] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`flex min-h-11 items-center gap-1.5 rounded-[2px] px-3 text-sm capitalize ${view === v ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'}`}>
                <Icon name={v === 'grid' ? 'grid' : 'map'} size={16} /> {v}
              </button>
            ))}
          </div>
        </div>

        {tokens.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
            {tokens.map((t) => (
              <li key={t.label}>
                <button type="button" onClick={t.clear} className="chip min-h-11 bg-raised hover:border-ink" aria-label={`Remove filter ${t.label}`}>
                  {t.label} <Icon name="close" size={14} />
                </button>
              </li>
            ))}
            <li><button type="button" onClick={() => setF(EMPTY)} className="chip min-h-11 border-transparent underline underline-offset-4">Clear all</button></li>
          </ul>
        )}

        <h2 className="sr-only">Results</h2>
        <div className="mt-6">
          {results.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="h3">No projects match these filters.</p>
              <p className="mt-2 text-sm text-ink-2">Try widening the budget or possession year.</p>
              <button type="button" className="btn btn-ink mt-4" onClick={() => setF(EMPTY)}>Clear filters</button>
            </div>
          ) : view === 'map' ? (
            <div className="card p-3 md:p-6">
              <CorridorMapView {...map} projects={results} title="Filtered projects on the map" />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.slice(0, limit).map((p, i) => <ProjectCard key={p.slug} p={p} priority={i < 2} />)}
            </div>
          )}
          {view === 'grid' && results.length > limit && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button type="button" className="btn btn-ink" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, results.length - limit)} more</button>
              <p className="text-xs text-ink-2">Showing {limit} of {results.length}</p>
            </div>
          )}
        </div>
        <p className="mt-6 text-xs text-ink-2">* Indicative ₹/sq ft = starting price ÷ smallest listed unit (developer did not publish a rate). Early construction = possession 3+ years away, as stated by the developer.</p>
      </div>

      {sheet && <FilterSheet count={results.length} onClose={() => setSheet(false)} onClear={() => setF(EMPTY)}>{panel}</FilterSheet>}
    </div>
  );
}

function FilterSheet({ children, onClose, onClear, count }: { children: React.ReactNode; onClose: () => void; onClear: () => void; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input, select')?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const els = [...ref.current.querySelectorAll<HTMLElement>('button, input, select, a[href]')].filter((el) => !el.hasAttribute('disabled'));
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filters-title">
      <div className="absolute inset-0 bg-black/40" style={{ animation: 'fade-in .2s both' }} onClick={onClose} aria-hidden />
      <div ref={ref} className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-paper safe-bottom" style={{ animation: 'sheet-up .25s var(--ease-out-soft) both' }}>
        <div className="flex items-center justify-between border-b hairline px-4 py-2">
          <button type="button" className="btn px-2 text-sm" onClick={onClear}>Clear</button>
          <h2 id="filters-title" className="font-sans text-base font-semibold">Filters</h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close filters"><Icon name="close" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        <div className="border-t hairline p-3">
          <button type="button" className="btn btn-primary w-full" onClick={onClose}>Show {count} project{count === 1 ? '' : 's'}</button>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ f, options, upd, toggleIn }: {
  f: Filters;
  options: Options;
  upd: <K extends keyof Filters>(k: K, v: Filters[K]) => void;
  toggleIn: (k: 'stage' | 'market' | 'bhk' | 'type', v: string) => void;
}) {
  const budgetIdx = BUDGETS.findIndex((b) => b.min === f.budgetMin && b.max === f.budgetMax);
  return (
    <div className="space-y-7">
      <div>
        <label className="label" htmlFor="q">Search</label>
        <div className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
          <input id="q" type="search" className="field pl-9" placeholder="Project, developer, sector" value={f.q} onChange={(e) => upd('q', e.target.value)} />
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[4px] border border-signal bg-signal-soft px-3">
        <span className="text-sm font-medium">Early-entry only</span>
        <input type="checkbox" role="switch" className="h-5 w-5 accent-[var(--signal)]" checked={f.early} onChange={(e) => upd('early', e.target.checked)} />
      </label>

      <ChipGroup legend="Stage" items={STAGES.map((s) => ({ value: s.key, label: s.label }))} selected={f.stage} onToggle={(v) => toggleIn('stage', v)} />
      <ChipGroup legend="Corridor" items={options.markets.map((m) => ({ value: m.slug, label: m.name }))} selected={f.market} onToggle={(v) => toggleIn('market', v)} />

      <div>
        <label className="label" htmlFor="budget">Budget (starting price)</label>
        <select id="budget" className="field" value={budgetIdx < 0 ? 0 : budgetIdx} onChange={(e) => { const b = BUDGETS[Number(e.target.value)]; upd('budgetMin', b.min); upd('budgetMax', b.max); }}>
          {BUDGETS.map((b, i) => <option key={b.label} value={i}>{b.label}</option>)}
        </select>
      </div>

      <ChipGroup legend="Configuration" items={['2', '3', '4', '5+'].map((b) => ({ value: b, label: `${b} BHK` }))} selected={f.bhk} onToggle={(v) => toggleIn('bhk', v)} />

      <div>
        <label className="label" htmlFor="by">Possession by</label>
        <select id="by" className="field" value={f.possessionBy ?? ''} onChange={(e) => upd('possessionBy', e.target.value ? Number(e.target.value) : null)}>
          <option value="">Any year</option>
          {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <ChipGroup legend="Project type" items={options.types.map((t) => ({ value: t, label: typeLabel(t) }))} selected={f.type} onToggle={(v) => toggleIn('type', v)} />

      <div>
        <label className="label" htmlFor="developer">Developer</label>
        <select id="developer" className="field" value={f.developer} onChange={(e) => upd('developer', e.target.value)}>
          <option value="">All developers</option>
          {options.developers.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="sector">Sector</label>
        <select id="sector" className="field" value={f.sector} onChange={(e) => upd('sector', e.target.value)}>
          <option value="">All sectors</option>
          {options.sectors.map((d) => <option key={d} value={d}>Sector {d}</option>)}
        </select>
      </div>
    </div>
  );
}

function ChipGroup({ legend, items, selected, onToggle }: { legend: string; items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const on = selected.includes(it.value);
          return (
            <button key={it.value} type="button" aria-pressed={on} onClick={() => onToggle(it.value)} className={`chip min-h-11 px-3 text-sm ${on ? 'border-ink bg-ink text-paper' : 'bg-raised hover:border-ink'}`}>
              {on && <Icon name="check" size={14} />}
              {it.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
