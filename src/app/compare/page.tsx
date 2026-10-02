import type { Metadata } from 'next';
import { Suspense } from 'react';
import { allProjects, marketStats, psfOf, summarize } from '@/lib/data';
import { CompareView, type CompareRow } from '@/components/shortlist/CompareView';

export const metadata: Metadata = {
  title: 'Compare projects',
  description: 'Compare up to three Gurugram projects side by side: price, ₹/sq ft, possession, density, RERA and payment terms.',
  alternates: { canonical: '/compare' },
  robots: { index: false },
};

export default function ComparePage() {
  const rows: CompareRow[] = allProjects().map((p) => {
    const s = summarize(p);
    const m = p.location.microMarket ? marketStats(p.location.microMarket) : null;
    return {
      ...s,
      towers: p.facts.towers,
      unitsPerAcre: p.facts.unitsPerAcre,
      paymentPlan: p.pricing.paymentPlan,
      amenityCount: p.content.amenities.length,
      floorPlanCount: p.media.floorPlans.length,
      marketMedianPsf: m?.medianPsf ?? null,
      psfDerived: psfOf(p).derived,
    };
  });
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Compare</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Side by side.</h1>
      <Suspense fallback={<p className="mt-6 text-ink-2">Loading…</p>}>
        <CompareView rows={rows} />
      </Suspense>
    </div>
  );
}
