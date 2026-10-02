'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BACKDROP, CORRIDORS, LANDMARKS, pointAt, sectorKey } from '@/lib/corridors';
import type { ProjectSummary } from '@/lib/types';
import { inr, monthYear, psf } from '@/lib/format';

type Station = { p: ProjectSummary; x: number; y: number };

/**
 * Schematic, transit-style map of Gurugram's growth corridors. Projects are stations on their
 * corridor, ordered by sector. Early-entry stations are vermilion diamonds; others are ink dots.
 */
export function CorridorMap({
  projects,
  highlight,
  compact = false,
  title = 'Corridor map of tracked projects',
}: {
  projects: ProjectSummary[];
  highlight?: string; // market slug to emphasise
  compact?: boolean;
  title?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const stations = useMemo(() => {
    const out: Station[] = [];
    for (const c of CORRIDORS) {
      const list = projects.filter((p) => p.market === c.slug).sort((a, b) => sectorKey(a.sector) - sectorKey(b.sector) || a.name.localeCompare(b.name));
      list.forEach((p, i) => {
        const t = list.length === 1 ? 0.5 : 0.06 + (0.88 * i) / (list.length - 1);
        const { p: [x, y], n } = pointAt(c.path, t);
        const side = i % 2 === 0 ? 1 : -1; // alternate sides to reduce overlap
        const off = list.length > 6 ? 9 * side : 0;
        out.push({ p, x: x + n[0] * off, y: y + n[1] * off });
      });
    }
    return out;
  }, [projects]);
  const current = stations.find((s) => s.p.slug === active)?.p ?? null;
  const unplaced = projects.filter((p) => !p.market || !CORRIDORS.some((c) => c.slug === p.market));

  return (
    <figure className="relative">
      <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
      <svg viewBox="0 0 720 600" className="h-auto w-full min-w-[540px] sm:min-w-0" role="group" aria-label={`${title}. Schematic — not to scale.`}>
        <title>{title}</title>
        {/* grid paper */}
        <defs>
          <pattern id="survey-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="var(--rule)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="720" height="600" fill="url(#survey-grid)" opacity={compact ? 0.5 : 0.8} />
        {BACKDROP.map((b) => (
          <g key={b.label} aria-hidden>
            <polyline points={b.path.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--rule-strong)" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" opacity="0.6" />
            <text x={b.labelAt[0]} y={b.labelAt[1]} className="fill-ink-2" fontSize="12" fontFamily="var(--font-mono)">{b.label}</text>
          </g>
        ))}
        {CORRIDORS.map((c) => {
          const dim = highlight && highlight !== c.slug;
          return (
            <g key={c.slug} opacity={dim ? 0.35 : 1} aria-hidden>
              <polyline points={c.path.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--ink)" strokeWidth={highlight === c.slug ? 4 : 2.5} strokeLinejoin="round" strokeLinecap="round" />
              <text x={c.labelAt[0]} y={c.labelAt[1]} textAnchor={c.anchor} fontSize="16" fontFamily="var(--font-serif)" fontStyle="italic" className="fill-ink">{c.label}</text>
            </g>
          );
        })}
        {LANDMARKS.map((l) => (
          <text key={l.label} x={l.at[0]} y={l.at[1]} fontSize="12" fontFamily="var(--font-mono)" className="fill-ink-2" aria-hidden>{l.label}</text>
        ))}
        {stations.map(({ p, x, y }) => {
          const early = p.badges.some((b) => b.early);
          const on = active === p.slug;
          const dim = highlight && p.market !== highlight;
          const label = `${p.name}, ${p.sector ? `Sector ${p.sector}, ` : ''}${p.marketName ?? ''}. From ${inr(p.priceFrom)}${p.psf ? `, ${psf(p.psf)} per sq ft` : ''}${p.possession ? `, possession ${monthYear(p.possession)}` : ''}${early ? '. Early entry.' : ''}`;
          return (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              prefetch={false}
              aria-label={label}
              onMouseEnter={() => setActive(p.slug)}
              onFocus={() => setActive(p.slug)}
              onMouseLeave={() => setActive((a) => (a === p.slug ? null : a))}
              className="outline-none [&:focus-visible>circle.ring]:stroke-focus"
              style={{ opacity: dim ? 0.3 : 1 }}
            >
              {/* 44px-equivalent invisible hit area */}
              <circle cx={x} cy={y} r="16" fill="transparent" />
              <circle className="ring" cx={x} cy={y} r={on ? 10 : 0} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
              {early ? (
                <rect x={x - 5.5} y={y - 5.5} width="11" height="11" transform={`rotate(45 ${x} ${y})`} fill="var(--signal)" stroke="var(--paper)" strokeWidth="1.5" />
              ) : (
                <circle cx={x} cy={y} r="5.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
              )}
            </Link>
          );
        })}
      </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-signal" /> Early-entry stage</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full border-2 border-ink" /> Other stages</span>
        <span>Schematic — not to scale. Stations ordered by sector number.</span>
        {unplaced.length > 0 && <span>{unplaced.length} project{unplaced.length > 1 ? 's' : ''} outside these corridors not shown.</span>}
      </figcaption>
      {!compact && (
        <div aria-live="polite" className="pointer-events-none absolute right-2 top-2 w-64 max-w-[60%]">
          {current && (
            <div className="card p-3 text-sm shadow-lg">
              <p className="font-display text-lg leading-tight">{current.name}</p>
              <p className="text-xs text-ink-2">{current.developer} · {current.sector ? `Sector ${current.sector}` : current.marketName}</p>
              <p className="num mt-2 text-xs">From {inr(current.priceFrom)} · {psf(current.psf)}/sq ft · {monthYear(current.possession)}</p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}
