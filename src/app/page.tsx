import Link from 'next/link';
import { site } from '@/config/site';
import { datasetMeta, featured, heroSlides, MARKETS, marketStats, stats, summaries } from '@/lib/data';
import { inr, monthRange, psf } from '@/lib/format';
import { Counter } from '@/components/Counter';
import { CorridorMap } from '@/components/map/CorridorMap';
import { ProjectCard } from '@/components/project/ProjectCard';
import { SectionHead, Disclaimer } from '@/components/Section';
import { LeadForm } from '@/components/lead/LeadForm';
import { WhatsAppLink } from '@/components/lead/WhatsAppLink';
import { Icon } from '@/components/Icon';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FindYourEntry } from '@/components/home/FindYourEntry';

export default function Home() {
  const s = stats();
  const all = summaries();
  // Hero carousel: the top projects that also have a high-resolution photo. The grid shows the next six, so nothing repeats.
  const spotlight = heroSlides(5);
  const inHero = new Set(spotlight.map((p) => p.slug));
  const feat = featured(all.length).filter((p) => !inHero.has(p.slug)).slice(0, 6);
  const markets = MARKETS.map((m) => ({ ...m, ...marketStats(m.slug) })).filter((m) => m.count > 0).sort((a, b) => b.count - a.count);
  const updated = new Date(datasetMeta.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      {/* HERO: full-bleed carousel of the featured projects */}
      <HeroCarousel projects={spotlight} updated={updated} />

      {/* STATS + VALUES */}
      <section className="wrap py-14 md:py-20" aria-label="At a glance">
        <dl className="grid grid-cols-2 border-t border-ink sm:grid-cols-4">
          {[
            ['Projects tracked', <Counter key="a" value={s.tracked} />],
            ['At early-entry stage', <Counter key="b" value={s.early} />],
            ['Developers', <Counter key="c" value={s.developers} />],
            ['Median ₹/sq ft', s.medianPsf ? <Counter key="d" value={Math.round(s.medianPsf)} format="inr" /> : '—'],
          ].map(([k, v], i) => (
            <div key={String(k)} className={`py-4 pr-3 ${i % 2 ? 'pl-3 border-l hairline sm:border-l' : 'sm:pl-0'} ${i > 1 ? 'border-t hairline sm:border-t-0 sm:border-l sm:pl-3' : ''}`}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-display text-3xl md:text-4xl">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-2">
          Pre-launch / new-launch per listing: <span className="num">{s.preLaunch}</span>. “Early-entry” also counts projects with possession 3+ years out.{' '}
          <Link href="/disclaimer#methodology" className="link">How we classify</Link>
        </p>
        <div className="mt-14 grid gap-0 border-t hairline md:grid-cols-3">
          {[
            ['01', 'Early entry', 'Launch and construction-stage pricing, with the best inventory still open to choose from.'],
            ['02', 'Verified at the source', 'Where sources disagree, we use what the developer publishes, and show you the change.'],
            ['03', 'Considered corridors', 'Dwarka Expressway to Golf Course Extension: each project placed against its own market.'],
          ].map(([n, t, d], i) => (
            <div key={n} className={`py-8 md:py-10 ${i ? 'md:border-l hairline md:pl-10' : ''} ${i < 2 ? 'md:pr-10' : ''}`}>
              <p className="font-display text-xl text-brass">{n}</p>
              <h2 className="h3 mt-3">{t}</h2>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FIND YOUR ENTRY: three-question personal shortlist */}
      <section className="band-stone py-16 md:py-24" aria-labelledby="find">
        <div className="wrap"><FindYourEntry projects={all} /></div>
      </section>

      {/* FEATURED */}
      <section className="wrap py-16 md:py-24" aria-labelledby="featured">
        <SectionHead id="featured" eyebrow="Earliest on the rail" title="The early-entry collection" intro="Ordered by stage, then by the longest runway to possession. The ranking follows fixed rules, and no developer pays for placement." href="/projects?early=1" cta="View the collection" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {feat.map((p) => <ProjectCard key={p.slug} p={p} />)}
        </div>
        <p className="mt-4 text-xs text-ink-2">* ₹/sq ft marked with an asterisk is indicative: starting price ÷ smallest listed unit. Developers rarely publish a per-sq-ft rate.</p>
      </section>

      {/* WHERE IT SITS: corridor map */}
      <section className="band-stone py-16 md:py-24" aria-labelledby="where">
        <div className="wrap grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">Where the portfolio sits</p>
            <h2 id="where" className="h2 mt-3">Every project, on its corridor.</h2>
            <p className="mt-4 max-w-md text-ink-2">Roads and sectors are drawn from OpenStreetMap, and each project sits at its published coordinates where they check out.</p>
            <Link href="/projects?view=map" className="cta-line mt-6">Open the map <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="card p-3 md:p-5"><CorridorMap projects={all} title="Where the tracked projects sit" /></div>
        </div>
      </section>

      {/* WHY EARLY */}
      <section className="wrap pb-16 md:pb-24" aria-labelledby="why">
        <SectionHead id="why" eyebrow="The case, and the catch" title="Why invest early?" />
        <div className="grid gap-px overflow-hidden rounded-[8px] border hairline bg-rule md:grid-cols-3">
          {[
            ['01', 'Lower entry price', 'Launch-phase price lists are usually the lowest a project will see. Developers price early tranches to build momentum and fund construction.', 'Launch pricing is not guaranteed to be below resale later. Check comparable ₹/sq ft in the same sector.'],
            ['02', 'Staggered payments', 'Construction-linked plans spread payments over 3–5 years, so your capital is deployed gradually rather than on day one.', 'Possession-linked and subvention plans shift risk. Read who pays the interest if the project slips.'],
            ['03', 'Appreciation into possession', 'Gurugram projects have historically re-rated as infrastructure (Dwarka Expressway, SPR, metro extensions) lands near them.', 'Past performance is no guarantee. Delays, oversupply and developer risk can erase the early-entry discount.'],
          ].map(([n, t, body, risk]) => (
            <div key={n} className="bg-raised p-7">
              <p className="font-display text-3xl text-brass">{n}</p>
              <h3 className="h3 mt-3">{t}</h3>
              <p className="mt-3 text-sm text-ink-2">{body}</p>
              <p className="mt-4 border-t hairline pt-3 text-sm"><span className="font-medium">The catch: </span><span className="text-ink-2">{risk}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* MARKETS: stone band */}
      <section className="band-stone py-16 md:py-24" aria-labelledby="markets">
        <div className="wrap">
          <SectionHead id="markets" eyebrow="Micro-markets" title="Corridor snapshots" intro={`Medians are across the projects ${site.name} tracks, not the whole market.`} href="/markets" cta="All markets" />
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Corridor snapshot table, scrolls sideways">
            <table className="ledger min-w-[640px]">
              <caption className="sr-only">Micro-market snapshot: projects tracked, median price per square foot, lowest entry price and possession window</caption>
              <thead>
                <tr><th scope="col">Corridor</th><th scope="col" className="n">Projects</th><th scope="col" className="n">Median ₹/sq ft</th><th scope="col" className="n">Entry from</th><th scope="col" className="n">Possession window</th></tr>
              </thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.slug} className="transition-colors hover:bg-raised">
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
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="wrap py-16 md:py-24" aria-labelledby="how">
        <SectionHead id="how" eyebrow="How it works" title="From first look to allotment" />
        <ol className="grid gap-6 md:grid-cols-4">
          {[
            ['Discover', 'Filter by stage, corridor, budget and possession year. The Entry Rail shows how early each project is.'],
            ['Compare', 'Put up to three projects side by side: ₹/sq ft, unit sizes, density, RERA and payment terms.'],
            ['Model', 'Run your own assumptions through the ROI calculator: appreciation, rent, loan, exit costs.'],
            ['Private access', 'Receive the current price sheet. We confirm inventory and the all-inclusive cost before you visit the site.'],
          ].map(([t, d], i) => (
            <li key={t} className="border-t border-ink pt-5">
              <p className="font-display text-3xl text-brass">0{i + 1}</p>
              <h3 className="h3 mt-1">{t}</h3>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* TRUST */}
      <section className="wrap pb-16 md:pb-24" aria-labelledby="trust">
        <SectionHead id="trust" eyebrow="Why trust the numbers" title="Every figure shows its source" />
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card p-7">
            <p className="font-display text-5xl">{s.withRera}<span className="text-ink-2">/{s.tracked}</span></p>
            <p className="mt-3 text-sm text-ink-2">projects have a published HARERA registration number. Where one is missing, we say so on the card.</p>
          </div>
          <div className="card p-7">
            <p className="font-display text-2xl">Verified at the source</p>
            <p className="mt-3 text-sm text-ink-2">Where sources disagree, we use what the developer publishes and show the change. Anything {site.name} infers is labelled as inferred, and missing values stay blank. We never fill them in.</p>
          </div>
          <div className="card p-7">
            <p className="font-display text-2xl">Nothing hidden</p>
            <p className="mt-3 text-sm text-ink-2">Each project carries a due-diligence checklist covering RERA, approvals, payment-plan type and possession, so the questions to ask are written down before you visit.</p>
          </div>
        </div>
      </section>

      {/* PRIVATE PREVIEW: full-width night band */}
      <section id="early-access" className="band-night scroll-mt-16 py-16 md:py-24" aria-labelledby="lead">
        <div className="wrap grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="eyebrow">Private preview</p>
            <h2 id="lead" className="h2 mt-3">Receive the price sheet before the price list moves.</h2>
            <p className="mt-4 text-ink-2">Tell us your budget and timeline. An advisor sends the current price sheet, live inventory and our view on the corridor, usually within one working day.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {['Current price sheet and payment plans', 'Inventory confirmed with the developer', 'No spam, and your number is never shared without consent'].map((t) => (
                <li key={t} className="flex gap-2"><span aria-hidden className="text-brass">✦</span>{t}</li>
              ))}
            </ul>
            <div className="mt-7"><WhatsAppLink className="cta-line" label="Or chat on WhatsApp" /></div>
          </div>
          <div className="card p-5 md:p-7">
            <LeadForm heading="" projects={all.map((p) => ({ slug: p.slug, name: p.name }))} source="home" />
          </div>
        </div>
      </section>
      <div className="wrap py-8"><Disclaimer>{site.disclaimer}</Disclaimer></div>
    </>
  );
}
