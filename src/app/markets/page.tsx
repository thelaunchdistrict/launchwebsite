import type { Metadata } from 'next';
import Link from 'next/link';
import { MARKETS, marketStats, summaries } from '@/lib/data';
import { inr, monthRange, psf } from '@/lib/format';
import { STORIES } from '@/content/markets';
import { CorridorMap } from '@/components/map/CorridorMap';

export const metadata: Metadata = {
  title: 'Gurugram micro-markets — corridors, prices and growth drivers',
  description: 'Dwarka Expressway, Golf Course Extension, SPR, Sohna Road and New Gurgaon: tracked projects, median ₹/sq ft and the infrastructure story.',
  alternates: { canonical: '/markets' },
};

export default function MarketsPage() {
  const list = MARKETS.map((m) => ({ ...m, ...marketStats(m.slug) })).filter((m) => m.count > 0).sort((a, b) => b.count - a.count);
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Markets</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Gurugram, corridor by corridor.</h1>
      <p className="mt-4 max-w-2xl text-ink-2">Infrastructure moves prices here more than anything else. Each corridor has its own story, its own entry price and its own risks.</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <ul className="divide-y divide-rule border-y border-ink">
          {list.map((m) => (
            <li key={m.slug}>
              <Link href={`/markets/${m.slug}`} className="group grid grid-cols-[1fr_auto] gap-2 py-5">
                <span>
                  <span className="font-display text-2xl group-hover:underline underline-offset-4">{m.name}</span>
                  <span className="mt-1 line-clamp-2 block text-sm text-ink-2">{STORIES[m.slug]?.thesis}</span>
                </span>
                <span className="text-right text-sm">
                  <span className="num block">{m.count} projects</span>
                  <span className="num block text-ink-2">{psf(m.medianPsf)}/sq ft</span>
                  <span className="num block text-ink-2">from {inr(m.minPrice)}</span>
                  {m.possessionFrom && <span className="num block text-xs text-ink-2">{monthRange(m.possessionFrom, m.possessionTo)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="card self-start p-3 md:p-5 lg:sticky lg:top-24"><CorridorMap projects={summaries()} /></div>
      </div>
    </div>
  );
}
