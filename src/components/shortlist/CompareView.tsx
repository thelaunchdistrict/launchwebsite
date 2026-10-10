'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ProjectSummary } from '@/lib/types';
import { inr, monthYear, psf, sqft, statusLabel } from '@/lib/format';
import { useCompare } from '@/lib/shortlist';
import { EntryRail } from '../project/EntryRail';
import { configSummary } from '../project/ProjectCard';
import { Icon } from '../Icon';

export type CompareRow = ProjectSummary & {
  towers: number | null;
  unitsPerAcre: number | null;
  paymentPlan: string | null;
  amenityCount: number;
  floorPlanCount: number;
  marketMedianPsf: number | null;
};

type Metric = { label: string; get: (r: CompareRow) => React.ReactNode; best?: (r: CompareRow) => number | null; dir?: 1 | -1 };

const METRICS: Metric[] = [
  { label: 'Stage', get: (r) => <EntryRail stage={r.stage} /> },
  { label: 'Listed status', get: (r) => statusLabel(r.status) },
  { label: 'Starting price', get: (r) => inr(r.priceFrom), best: (r) => r.priceFrom, dir: 1 },
  { label: '₹ / sq ft', get: (r) => <>{psf(r.psf)}{r.psfDerived && r.psf ? '*' : ''}</>, best: (r) => r.psf, dir: 1 },
  { label: 'vs corridor median', get: (r) => (r.psf && r.marketMedianPsf ? `${r.psf > r.marketMedianPsf ? '+' : '−'}${Math.abs(Math.round((r.psf / r.marketMedianPsf - 1) * 100))}%` : '—'), best: (r) => (r.psf && r.marketMedianPsf ? r.psf / r.marketMedianPsf : null), dir: 1 },
  { label: 'Possession', get: (r) => monthYear(r.possession) },
  { label: 'Configurations', get: (r) => configSummary(r) },
  { label: 'Unit sizes', get: (r) => (r.sizeMin ? `${sqft(r.sizeMin)}${r.sizeMax && r.sizeMax !== r.sizeMin ? ` – ${sqft(r.sizeMax)}` : ''}` : '—') },
  { label: 'Land', get: (r) => (r.acres ? `${r.acres} acres` : '—') },
  { label: 'Density', get: (r) => (r.unitsPerAcre ? `${r.unitsPerAcre} units/acre` : '—'), best: (r) => r.unitsPerAcre, dir: 1 },
  { label: 'Towers / units', get: (r) => `${r.towers ?? '—'} / ${r.units?.toLocaleString('en-IN') ?? '—'}` },
  { label: 'Corridor', get: (r) => `${r.marketName ?? '—'}${r.sector ? ` · Sector ${r.sector}` : ''}` },
  { label: 'Developer', get: (r) => r.developer ?? '—' },
  { label: 'RERA no.', get: (r) => <span className="break-all text-xs">{r.rera ?? 'Not published'}</span> },
  { label: 'Payment plan', get: (r) => (r.paymentPlan ? <span className="line-clamp-3 text-xs">{r.paymentPlan}</span> : 'Not published') },
  { label: 'Amenities listed', get: (r) => r.amenityCount },
  { label: 'Floor plans', get: (r) => r.floorPlanCount },
];

export function CompareView({ rows }: { rows: CompareRow[] }) {
  const sp = useSearchParams();
  const compare = useCompare();
  const fromUrl = (sp.get('p') ?? '').split(',').filter(Boolean);
  // A shared /compare?p=… link seeds the local compare list once; after that the local list rules
  // (so removing every project really empties the table).
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !fromUrl.length) return;
    seeded.current = true;
    compare.clear();
    fromUrl.slice(0, 3).forEach((s) => compare.toggle(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);
  const [hydrated, setHydrated] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- flip once after mount so the server render can use the URL list
  useEffect(() => setHydrated(true), []);
  const slugs = hydrated ? compare.items : fromUrl;
  const picked = slugs.map((s) => rows.find((r) => r.slug === s)).filter((r): r is CompareRow => !!r);

  if (picked.length === 0) {
    return (
      <div className="card mt-8 p-8">
        <p className="h3">Nothing to compare yet.</p>
        <p className="mt-2 text-ink-2">Use the <Icon name="compare" size={16} className="inline" /> button on any project card to add up to three projects.</p>
        <Link href="/projects" className="btn btn-ink mt-4">Browse projects</Link>
      </div>
    );
  }

  const bestOf = (m: Metric) => {
    if (!m.best || picked.length < 2) return null;
    const vals = picked.map((r) => m.best!(r));
    const nums = vals.filter((v): v is number => v != null);
    if (nums.length < 2) return null;
    const target = m.dir === 1 ? Math.min(...nums) : Math.max(...nums);
    return vals.map((v) => v === target);
  };

  return (
    <div className="mt-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Comparison table, scrolls sideways">
      <table className="ledger min-w-[720px] table-fixed">
        <caption className="sr-only">Comparison of {picked.map((p) => p.name).join(', ')}</caption>
        <colgroup><col className="w-44" />{picked.map((p) => <col key={p.slug} />)}</colgroup>
        <thead>
          <tr>
            <td />
            {picked.map((p) => (
              <th key={p.slug} scope="col" className="align-bottom normal-case tracking-normal">
                <div className="relative mb-3 aspect-[3/2] overflow-hidden rounded-[6px] bg-sunk">
                  {p.image && <Image src={p.image.src} alt="" fill sizes="300px" className="object-cover" />}
                </div>
                <Link href={`/projects/${p.slug}`} className="inline-flex min-h-11 items-center font-display text-xl font-medium text-ink hover:underline">{p.name}</Link>
                <button type="button" onClick={() => compare.remove(p.slug)} className="mt-1 flex min-h-11 items-center gap-1 text-xs text-ink-2 hover:text-ink">
                  <Icon name="close" size={14} /> Remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((m) => {
            const best = bestOf(m);
            return (
              <tr key={m.label}>
                <th scope="row" className="text-left text-sm font-normal text-ink-2">{m.label}</th>
                {picked.map((p, i) => (
                  <td key={p.slug} className={`num text-sm ${best?.[i] ? 'font-semibold' : ''}`}>
                    {m.get(p)}
                    {best?.[i] && <span className="ml-1 font-sans text-xs font-normal text-ink-2">(lowest)</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-2">* Indicative ₹/sq ft (starting price ÷ smallest unit). “Lowest” marks the lowest value, not a recommendation. Lower density and price can each come with trade-offs.</p>
    </div>
  );
}
