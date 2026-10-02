import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MARKETS, marketStats, summaries } from '@/lib/data';
import { inr, monthRange, psf } from '@/lib/format';
import { STORIES } from '@/content/markets';
import { CorridorMap } from '@/components/map/CorridorMap';
import { ProjectCard } from '@/components/project/ProjectCard';
import { Disclaimer } from '@/components/Section';
import { LeadForm } from '@/components/lead/LeadForm';

export function generateStaticParams() {
  return MARKETS.filter((m) => marketStats(m.slug).count > 0).map((m) => ({ slug: m.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/markets/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const m = MARKETS.find((x) => x.slug === slug);
  if (!m) return {};
  const s = marketStats(slug);
  return {
    title: `${m.name} — projects, ₹/sq ft and growth story`,
    description: `${s.count} tracked projects on ${m.name}, Gurugram. Median ${psf(s.medianPsf)}/sq ft, entry from ${inr(s.minPrice)}. Infrastructure drivers and risks.`,
    alternates: { canonical: `/markets/${slug}` },
  };
}

export default async function MarketPage({ params }: PageProps<'/markets/[slug]'>) {
  const { slug } = await params;
  const m = MARKETS.find((x) => x.slug === slug);
  if (!m) notFound();
  const s = marketStats(slug);
  const story = STORIES[slug];
  const early = s.projects.filter((p) => p.badges.some((b) => b.early)).length;
  const sorted = [...s.projects].sort((a, b) => a.stage.position - b.stage.position);

  return (
    <div className="wrap py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-2"><Link href="/markets" className="link">Markets</Link> / <span className="text-ink">{m.name}</span></nav>
      <header className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="eyebrow">Corridor · {m.short}</p>
          <h1 className="display mt-3 text-[clamp(2.5rem,6vw,5rem)]">{m.name}</h1>
          {story && <p className="mt-5 max-w-2xl text-lg text-ink-2">{story.thesis}</p>}
        </div>
        <dl className="grid grid-cols-2 border-t border-ink">
          {[
            ['Projects tracked', s.count],
            ['Early-entry stage', early],
            ['Median ₹/sq ft', psf(s.medianPsf)],
            ['Entry from', inr(s.minPrice)],
            ['₹/sq ft range', s.minPsf ? `${psf(s.minPsf)}–${psf(s.maxPsf)}` : '—'],
            ['Possession window', monthRange(s.possessionFrom, s.possessionTo)],
          ].map(([k, v], i) => (
            <div key={String(k)} className={`border-b hairline py-3 ${i % 2 ? 'pl-3 border-l' : 'pr-3'}`}>
              <dt className="eyebrow">{k}</dt>
              <dd className="num mt-1 text-lg">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      {story && (
        <section className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr]" aria-labelledby="drivers">
          <div>
            <h2 id="drivers" className="h2 border-t border-ink pt-4">What drives it</h2>
            <ol className="mt-6 space-y-6">
              {story.drivers.map((d, i) => (
                <li key={d.title} className="grid grid-cols-[2.5rem_1fr]">
                  <span className="num text-signal">0{i + 1}</span>
                  <div><h3 className="h3">{d.title}</h3><p className="mt-1 text-ink-2">{d.body}</p></div>
                </li>
              ))}
            </ol>
            <h2 className="h3 mt-10">What could go wrong</h2>
            <ul className="prose-falcon mt-3 text-ink-2">{story.risks.map((r) => <li key={r}>{r}</li>)}</ul>
            <Disclaimer className="mt-6">Infrastructure status is described as of 2026 and is not a forecast. Check current project status with the authorities (GMDA, NHAI, HSIIDC) before relying on any timeline.</Disclaimer>
          </div>
          <div className="card self-start p-3 md:p-5"><CorridorMap projects={summaries()} highlight={slug} title={`${m.name} on the corridor map`} /></div>
        </section>
      )}

      <section className="mt-16" aria-labelledby="list">
        <h2 id="list" className="h2 border-t border-ink pt-4">Projects on {m.name}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sorted.map((p) => <ProjectCard key={p.slug} p={p} />)}</div>
        <Link href={`/projects?market=${slug}`} className="btn btn-ghost mt-6">Filter these projects</Link>
      </section>

      <section className="mt-16 grid gap-8 rounded-3xl border border-ink p-6 md:grid-cols-2 md:p-10" aria-label="Early access">
        <div>
          <h2 className="h2">Watching {m.name}?</h2>
          <p className="mt-3 text-ink-2">Get the next launch on this corridor before the price list is public.</p>
        </div>
        <LeadForm heading="" projects={s.projects.map((p) => ({ slug: p.slug, name: p.name }))} compact source={`market:${slug}`} />
      </section>
    </div>
  );
}
