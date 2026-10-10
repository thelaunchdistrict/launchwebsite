import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { site } from '@/config/site';
import { datasetMeta, stats } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { WhatsAppLink } from '@/components/lead/WhatsAppLink';
import { Disclaimer } from '@/components/Section';

export const metadata: Metadata = pageMeta({
  title: 'About',
  description: `${site.name} is a curated portfolio of pre-launch and under-construction residences in Gurugram for investors who want to enter early.`,
  path: '/about'});

export default function AboutPage() {
  const s = stats();
  const updated = new Date(datasetMeta.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* INTRO */}
      <section className="wrap pt-12 pb-16 md:pt-20 md:pb-24">
        <p className="eyebrow">About {site.name}</p>
        <h1 className="display mt-4 max-w-4xl">A private portfolio for investors who enter <em className="text-signal">early</em>.</h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-2">
          {site.name} is a curated portfolio of residences in Gurugram that are at pre-launch, launch or early construction: the stage where entry prices are
          at their lowest and the best inventory is still available. Every project here is one we can take you into today.
        </p>
        <dl className="mt-12 grid max-w-4xl grid-cols-2 border-t border-ink sm:grid-cols-4">
          {[
            ['In the portfolio', s.tracked],
            ['At early-entry stage', s.early],
            ['Developers', s.developers],
            ['Corridors', s.markets],
          ].map(([k, v], i) => (
            <div key={String(k)} className={`py-4 pr-3 ${i % 2 ? 'border-l hairline pl-3' : ''} ${i > 1 ? 'border-t hairline sm:border-t-0 sm:border-l sm:pl-3' : ''}`}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-display text-4xl">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-ink-2">Live figures, updated {updated}.</p>
      </section>

      {/* WHO IT IS FOR */}
      <section className="band-stone py-16 md:py-24" aria-labelledby="for">
        <div className="wrap grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Who it is for</p>
            <h2 id="for" className="h2 mt-3">For buyers who would rather be first than late.</h2>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {[
              ['Early-entry investors', 'You want launch or construction-stage pricing and are comfortable holding through to possession.'],
              ['Second-home and end-users', 'You know the address you want and prefer to choose your unit before the best ones are gone.'],
              ['NRI and out-of-town buyers', 'You need the facts laid out clearly, checked at the source, without a dozen site visits.'],
              ['Portfolio builders', 'You compare corridors, ₹/sq ft and possession timelines before you commit capital.'],
            ].map(([t, d]) => (
              <li key={t} className="border-t border-ink pt-4">
                <h3 className="h3">{t}</h3>
                <p className="mt-2 text-sm text-ink-2">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A LIVE PORTFOLIO */}
      <section className="wrap py-16 md:py-24" aria-labelledby="live">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">A live portfolio</p>
            <h2 id="live" className="h2 mt-3">What you see is what is open.</h2>
          </div>
          <div className="space-y-5 text-ink-2">
            <p>This is not a listing site that carries every project in the city. It is the inventory we work with, and it changes with the market.</p>
            <ul className="space-y-3">
              {[
                ['New launches are added', 'as soon as allocations open and the facts are checked.'],
                ['Projects come off', 'when the early-entry window closes, inventory sells through or terms stop making sense.'],
                ['Prices and dates are re-checked', 'against what each developer publishes, and every change is shown on the project page with its source.'],
              ].map(([b, t]) => (
                <li key={b} className="flex gap-3"><span aria-hidden className="mt-1 text-brass">✦</span><span><strong className="font-medium text-ink">{b}</strong> {t}</span></li>
              ))}
            </ul>
            <Link href="/projects?early=1" className="btn btn-primary mt-2">View the collection <Icon name="arrowRight" size={18} /></Link>
          </div>
        </div>
      </section>

      {/* HOW WE CHOOSE */}
      <section className="wrap pb-16 md:pb-24" aria-labelledby="choose">
        <div className="mb-8 border-t border-ink pt-4">
          <p className="eyebrow">How a project makes the cut</p>
          <h2 id="choose" className="h2 mt-2">Four questions before anything goes on the site</h2>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-[8px] border hairline bg-rule md:grid-cols-4">
          {[
            ['Is it early?', 'Pre-launch, launch or early construction, with a real runway to possession.'],
            ['Is it registered?', 'A RERA registration we can point to, or a clear note where one is still pending.'],
            ['Does the price hold up?', '₹/sq ft compared with the same corridor, not with a brochure promise.'],
            ['Who is building it?', 'A developer whose published facts we can check and whose record you can look up.'],
          ].map(([t, d], i) => (
            <li key={t} className="bg-raised p-6">
              <p className="font-display text-3xl text-brass">0{i + 1}</p>
              <h3 className="h3 mt-2">{t}</h3>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* HOW WE WORK WITH YOU */}
      <section className="band-stone py-16 md:py-24" aria-labelledby="work">
        <div className="wrap grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Working with us</p>
            <h2 id="work" className="h2 mt-3">From first look to allotment.</h2>
          </div>
          <ol className="space-y-6">
            {[
              ['Shortlist', 'Browse the collection, save what interests you and compare up to three side by side.'],
              ['Private price sheet', 'Leave your details and an advisor sends the current price sheet, payment plan and live inventory.'],
              ['Site visit', 'We arrange the visit with the developer and walk you through the plans and the paperwork.'],
              ['Allotment', 'You book directly with the developer. We stay with you through the agreement and the payment schedule.'],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[3rem_1fr] gap-4 border-t border-ink pt-4">
                <span className="font-display text-3xl text-brass">0{i + 1}</span>
                <div><h3 className="h3">{t}</h3><p className="mt-1 text-sm text-ink-2">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRINCIPLES + HOW WE ARE PAID */}
      <section className="wrap py-16 md:py-24" aria-labelledby="principles">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow">Our principles</p>
            <h2 id="principles" className="h2 mt-3">Plain facts, no pressure.</h2>
            <ul className="mt-6 space-y-3 text-ink-2">
              {[
                'Where sources disagree, we use what the developer publishes and show you the change.',
                'Missing facts stay marked as missing. We never fill a gap with a guess.',
                'No countdown timers and no invented scarcity. If inventory is limited, the number says so.',
                'Your details are used only to send what you asked for, and never shared without your consent.',
              ].map((t) => <li key={t} className="flex gap-3"><Icon name="check" size={18} className="mt-1 shrink-0 text-brass" /><span>{t}</span></li>)}
            </ul>
          </div>
          <div className="card self-start p-6 md:p-8">
            <p className="eyebrow">How we are paid</p>
            <h2 className="h3 mt-3">Transparently.</h2>
            <p className="mt-3 text-ink-2">
              Like most channel partners in India, we may receive a brokerage from the developer on a completed booking. It does not change the price you pay,
              and no developer pays to be placed or ranked on this site. You are always free to book directly with the developer.
            </p>
            <Link href="/disclaimer" className="cta-line mt-4">RERA note and disclaimer <Icon name="arrowRight" size={16} /></Link>
          </div>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="band-night py-16 md:py-24" aria-labelledby="talk">
        <div className="wrap flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Private preview</p>
            <h2 id="talk" className="h2 mt-3">See what is open before the price list moves.</h2>
            <p className="mt-4 text-ink-2">Tell us your budget and timeline, and we will send the projects that fit, with their current price sheets.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/contact#early-access" className="btn btn-primary">Receive the price sheet <Icon name="arrowRight" size={18} /></Link>
            <WhatsAppLink className="cta-line" label="Message us on WhatsApp" />
          </div>
        </div>
      </section>
      <div className="wrap py-8"><Disclaimer>{site.disclaimer}</Disclaimer></div>
    </>
  );
}
