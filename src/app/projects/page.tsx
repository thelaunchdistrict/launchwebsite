import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import { Suspense } from 'react';
import { MARKETS, summaries } from '@/lib/data';
import { sectorKey } from '@/lib/corridors';
import { ProjectExplorer } from '@/components/listing/ProjectExplorer';
import { mapProps } from '@/components/map/CorridorMap';

export const metadata: Metadata = pageMeta({
  title: 'Gurugram projects: pre-launch to ready',
  description: 'Filter Gurugram projects by stage, corridor, budget, configuration and possession year. Compare ₹/sq ft and shortlist early-entry opportunities.',
  path: '/projects'});

export default function ProjectsPage() {
  const list = summaries();
  const options = {
    markets: MARKETS.filter((m) => list.some((p) => p.market === m.slug)).map(({ slug, name }) => ({ slug, name })),
    developers: [...new Set(list.map((p) => p.developer).filter((d): d is string => !!d))].sort(),
    sectors: [...new Set(list.map((p) => p.sector).filter((d): d is string => !!d))].sort((a, b) => sectorKey(a) - sectorKey(b)),
    years: [...new Set(list.map((p) => p.possessionYear).filter((d): d is number => !!d))].sort(),
    types: [...new Set(list.map((p) => p.type).filter((d): d is NonNullable<typeof d> => !!d))],
  };
  return (
    <div className="wrap py-10">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Projects · Gurugram</p>
        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Every project, by how early you are.</h1>
        <p className="mt-4 text-ink-2">Filters live in the URL, so a filtered view can be shared. Save projects to your shortlist, or queue up to three to compare.</p>
      </header>
      <Suspense fallback={<p className="text-ink-2">Loading projects…</p>}>
        <ProjectExplorer projects={list} options={options} map={mapProps(list)} />
      </Suspense>
    </div>
  );
}
