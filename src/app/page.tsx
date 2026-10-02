import Link from 'next/link';
import { site } from '@/config/site';
import { datasetMeta, featured, MARKETS, marketStats, stats, summaries } from '@/lib/data';
import { inr, monthRange, psf } from '@/lib/format';
import { Counter } from '@/components/Counter';
import { CorridorMap } from '@/components/map/CorridorMap';
import { ProjectCard } from '@/components/project/ProjectCard';
import { SectionHead, Disclaimer } from '@/components/Section';
import { LeadForm } from '@/components/lead/LeadForm';
import { WhatsAppLink } from '@/components/lead/WhatsAppLink';
import { Icon } from '@/components/Icon';
import { SpotlightCarousel } from '@/components/home/SpotlightCarousel';

export default function Home() {
  const s = stats();
  const all = summaries();
  // First five go to the spotlight carousel, the next six to the grid, so nothing repeats.
  const ranked = featured(11);
  const spotlight = ranked.slice(0, 5);
  const feat = ranked.slice(5);
  const markets = MARKETS.map((m) => ({ ...m, ...marketStats(m.slug) })).filter((m) => m.count > 0).sort((a, b) => b.count - a.count);
  const updated = new Date(datasetMeta.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {/* HERO — type on paper, the corridor map as the visual */}
      <section className="wrap grid gap-10 pt-10 pb-12 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Gurugram · Early-entry research · Updated {updated}</p>
          <h1 className="display mt-5">
            Get in <em className="text-signal not-italic md:italic">before</em> the crowd.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">
            Pre-launch, new-launch and under-construction projects, ranked by how early you are, priced per square foot and checked for RERA, with the possession horizon on every card.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/projects?early=1" className="btn btn-primary">Browse early-entry projects <Icon name="arrowRight" size={18} /></Link>
            <Link href="/tools/roi-calculator" className="btn btn-ghost">Run the numbers</Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 border-t border-ink sm:grid-cols-4">
            {[
              ['Projects tracked', <Counter key="a" value={s.tracked} />],
              ['At early-entry stage', <Counter key="b" value={s.early} />],
              ['Developers', <Counter key="c" value={s.developers} />],
              ['Median ₹/sq ft', s.medianPsf ? <Counter key="d" value={Math.round(s.medianPsf)} format="inr" /> : '—'],
            ].map(([k, v], i) => (
              <div key={String(k)} className={`py-4 pr-3 ${i % 2 ? 'pl-3 border-l hairline sm:border-l' : 'sm:pl-0'} ${i > 1 ? 'border-t hairline sm:border-t-0 sm:border-l sm:pl-3' : ''}`}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1 text-2xl md:text-3xl">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-ink-2">
            Pre-launch / new-launch per listing: <span className="num">{s.preLaunch}</span>. “Early-entry” also counts projects with possession 3+ years out.{' '}
            <Link href="/disclaimer#methodology" className="link">How we classify</Link>
          </p>
        </div>
        <div className="card p-3 md:p-5">
          <CorridorMap projects={all} title="Where the tracked projects sit" />
        </div>
      </section>

      {/* SPOTLIGHT */}
      <section className="wrap py-12" aria-labelledby="spotlight">
        <SectionHead id="spotlight" eyebrow="Spotlight" title="Five to look at first" intro="The earliest projects on the rail right now. Swipe or use the controls below. Tap a project to open it." />
        <SpotlightCarousel projects={spotlight} />
      </section>

      {/* FEATURED */}
      <section className="wrap py-12" aria-labelledby="featured">
        <SectionHead id="featured" eyebrow="Earliest on the rail" title="More early-entry opportunities" intro="Sorted by stage, then by the longest runway to possession. The ranking is rule-based, and nobody pays for placement." href="/projects?early=1" cta="All early-entry projects" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feat.map((p) => <ProjectCard key={p.slug} p={p} />)}
        </div>
        <p className="mt-4 text-xs text-ink-2">* ₹/sq ft marked with an asterisk is indicative: starting price ÷ smallest listed unit. Developers rarely publish a per-sq-ft rate.</p>
      </section>

      {/* WHY EARLY */}
      <section className="wrap py-12" aria-labelledby="why">
        <SectionHead id="why" eyebrow="The case, and the catch" title="Why invest early?" />
        <div className="grid gap-px overflow-hidden rounded-2xl border hairline bg-rule md:grid-cols-3">
          {[
            ['01', 'Lower entry price', 'Launch-phase price lists are usually the lowest a project will see. Developers price early tranches to build momentum and fund construction.', 'Launch pricing is not guaranteed to be below resale later. Check comparable ₹/sq ft in the same sector.'],
            ['02', 'Staggered payments', 'Construction-linked plans spread payments over 3–5 years, so your capital is deployed gradually rather than on day one.', 'Possession-linked and subvention plans shift risk. Read who pays the interest if the project slips.'],
            ['03', 'Appreciation into possession', 'Gurugram projects have historically re-rated as infrastructure (Dwarka Expressway, SPR, metro extensions) lands near them.', 'Past performance is no guarantee. Delays, oversupply and developer risk can erase the early-entry discount.'],
          ].map(([n, t, body, risk]) => (
            <div key={n} className="bg-raised p-6">
              <p className="num text-signal">{n}</p>
              <h3 className="h3 mt-3">{t}</h3>
              <p className="mt-3 text-sm text-ink-2">{body}</p>
              <p className="mt-4 border-t hairline pt-3 text-sm"><span className="font-medium">The catch: </span><span className="text-ink-2">{risk}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS */}
      <section className="wrap py-12" aria-labelledby="markets">
        <SectionHead id="markets" eyebrow="Micro-markets" title="Corridor snapshots" intro={`Medians are across the projects ${site.name} tracks, not the whole market.`} href="/markets" cta="All markets" />
        <div className="overflow-x-auto">
          <table className="ledger min-w-[640px]">
            <caption className="sr-only">Micro-market snapshot: projects tracked, median price per square foot, lowest entry price and possession window</caption>
            <thead>
              <tr><th scope="col">Corridor</th><th scope="col" className="n">Projects</th><th scope="col" className="n">Median ₹/sq ft</th><th scope="col" className="n">Entry from</th><th scope="col" className="n">Possession window</th></tr>
            </thead>
            <tbody>
              {markets.map((m) => (
                <tr key={m.slug} className="hover:bg-raised">
                  <th scope="row" className="py-3 text-left font-normal">
                    <Link href={`/markets/${m.slug}`} className="inline-flex min-h-11 items-center font-display text-xl hover:underline underline-offset-4">{m.name}</Link>
                  </th>
                  <td className="n">{m.count}</td>
                  <td className="n">{psf(m.medianPsf)}</td>
                  <td className="n">{inr(m.minPrice)}</td>
                  <td className="n">{monthRange(m.possessionFrom, m.possessionTo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="wrap py-12" aria-labelledby="how">
        <SectionHead id="how" eyebrow="How it works" title="From shortlist to allotment" />
        <ol className="grid gap-6 md:grid-cols-4">
          {[
            ['Screen', 'Filter by stage, corridor, budget and possession year. The Entry Rail shows how early each project is.'],
            ['Compare', 'Put up to three projects side by side: ₹/sq ft, unit sizes, density, RERA and payment terms.'],
            ['Model', 'Run your own assumptions through the ROI calculator: appreciation, rent, loan, exit costs.'],
            ['Get access', 'Ask for the current price sheet. We confirm the inventory and the all-inclusive cost before you visit.'],
          ].map(([t, d], i) => (
            <li key={t} className="border-t border-ink pt-4">
              <p className="num text-sm text-ink-2">Step {i + 1}</p>
              <h3 className="h3 mt-1">{t}</h3>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TRUST */}
      <section className="wrap py-12" aria-labelledby="trust">
        <SectionHead id="trust" eyebrow="Why trust the numbers" title="Every figure shows where it came from" />
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <p className="num text-4xl">{s.withRera}<span className="text-ink-2">/{s.tracked}</span></p>
            <p className="mt-2 text-sm text-ink-2">projects have a published HARERA registration number. Where one is missing, we say so on the card.</p>
          </div>
          <div className="card p-6">
            <p className="font-display text-2xl">Derived ≠ published</p>
            <p className="mt-2 text-sm text-ink-2">Anything {site.name} infers is labelled as inferred: indicative ₹/sq ft, construction progress, micro-market. Missing values stay blank. We never fill them in.</p>
          </div>
          <div className="card p-6">
            <p className="font-display text-2xl">Risk on the page</p>
            <p className="mt-2 text-sm text-ink-2">Each project carries a due-diligence checklist covering RERA, approvals, payment-plan type and possession, so the questions to ask are written down before you visit.</p>
          </div>
        </div>
      </section>

      {/* LEAD */}
      <section id="early-access" className="wrap py-12" aria-labelledby="lead">
        <div className="grid gap-10 rounded-3xl bg-ink p-6 text-paper md:grid-cols-[1fr_1.1fr] md:p-12">
          <div>
            <p className="eyebrow" style={{ color: 'inherit', opacity: 0.7 }}>Early access</p>
            <h2 id="lead" className="h2 mt-2">Hear about launches before the price list moves.</h2>
            <p className="mt-4 opacity-80">Tell us your budget and timeline. We’ll send the current price sheet, inventory status and our view on the corridor, usually within one working day.</p>
            <div className="mt-6"><WhatsAppLink className="btn border border-paper/30 text-paper hover:border-paper" label="Chat on WhatsApp" /></div>
          </div>
          <div className="rounded-2xl bg-paper p-5 text-ink md:p-6">
            <LeadForm heading="" projects={all.map((p) => ({ slug: p.slug, name: p.name }))} source="home" />
          </div>
        </div>
        <Disclaimer className="mt-6">{site.disclaimer}</Disclaimer>
      </section>
    </>
  );
}
