'use client';
import Link from 'next/link';
import { useState } from 'react';
import type { ProjectSummary } from '@/lib/types';
import { inr, monthYear, psf } from '@/lib/format';

export interface StationPos { slug: string; x: number; y: number; basis: string; note: string }

/**
 * Interactive layer of the corridor map. Positions come from the server (real coordinates,
 * projected); this component only handles hover/focus and the tooltip.
 */
export function CorridorMapView({
  projects, stations, base, attribution, highlight, compact = false, title,
}: {
  projects: ProjectSummary[];
  stations: StationPos[];
  base: React.ReactNode;
  attribution: string;
  highlight?: string;
  compact?: boolean;
  title: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const shown = stations.filter((s) => bySlug.has(s.slug));
  const unplaced = projects.length - shown.length;
  const current = active ? bySlug.get(active) ?? null : null;
  const currentNote = active ? shown.find((s) => s.slug === active)?.note : null;

  return (
    <figure className="relative">
      <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0" data-qa-touch-exempt="map stations; every project is also reachable through a 44px card link">
        <svg viewBox="0 0 720 600" className="h-auto w-full min-w-[540px] sm:min-w-0" role="group" aria-label={`${title}. Map of Gurugram drawn from OpenStreetMap.`}>
          <title>{title}</title>
          {base}
          {shown.map(({ slug, x, y, note, basis }) => {
            const p = bySlug.get(slug)!;
            const early = p.badges.some((b) => b.early);
            const on = active === slug;
            const dim = highlight && p.market !== highlight;
            const label = `${p.name}, ${p.locationLabel ?? ''}${p.marketName ? `, ${p.marketName}` : ''}. From ${inr(p.priceFrom)}${p.psf ? `, ${psf(p.psf)} per sq ft` : ''}${p.possession ? `, possession ${monthYear(p.possession)}` : ''}${early ? '. Early entry.' : ''} ${note}.`;
            return (
              <Link
                key={slug}
                href={`/projects/${slug}`}
                prefetch={false}
                aria-label={label}
                onMouseEnter={() => setActive(slug)}
                onFocus={() => setActive(slug)}
                onMouseLeave={() => setActive((a) => (a === slug ? null : a))}
                className="outline-none [&:focus-visible>circle.ring]:stroke-focus"
                style={{ opacity: dim ? 0.3 : 1 }}
              >
                <circle cx={x} cy={y} r="16" fill="transparent" />
                {/* Always drawn; coloured by CSS on :focus-visible (instant, no JS) and by state on hover. */}
                <circle className="ring" data-focus-ring cx={x} cy={y} r={10} fill="none" stroke={on ? 'var(--ink)' : 'transparent'} strokeWidth="2" />
                {basis === 'approximate' && <circle cx={x} cy={y} r="8.5" fill="none" stroke="var(--ink-2)" strokeWidth="1.2" strokeDasharray="2 2" />}
                {early ? (
                  <rect x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} fill="var(--signal)" stroke="var(--paper)" strokeWidth="1.5" />
                ) : (
                  <circle cx={x} cy={y} r="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
                )}
              </Link>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-signal" /> Early-entry stage</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full border-2 border-ink" /> Other stages</span>
        {shown.some((s) => s.basis === 'approximate') && <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 w-3 rounded-full border border-dashed border-ink-2" /> Approximate (sector not mapped)</span>}
        <span>Plotted at the listing’s published coordinate where it checks out, otherwise at the centre of the project’s sector. Small numbers are sector numbers.</span>
        {unplaced > 0 && <span>{unplaced} project{unplaced > 1 ? 's' : ''} outside Gurugram not shown.</span>}
        <span>Roads and sectors {attribution}.</span>
      </figcaption>
      {!compact && (
        <div aria-live="polite" className="pointer-events-none absolute right-2 top-2 w-64 max-w-[60%]">
          {current && (
            <div className="card p-3 text-sm shadow-lg">
              <p className="font-display text-lg leading-tight">{current.name}</p>
              <p className="text-xs text-ink-2">{current.developer} · {current.locationLabel}{current.marketName ? ` · ${current.marketName}` : ''}</p>
              <p className="num mt-2 text-xs">From {inr(current.priceFrom)} · {psf(current.psf)}/sq ft · {monthYear(current.possession)}</p>
              {currentNote && <p className="mt-1 text-[0.6875rem] text-ink-2">{currentNote}</p>}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
