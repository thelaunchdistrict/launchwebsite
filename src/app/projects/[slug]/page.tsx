import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { site } from '@/config/site';
import { allPages, dueDiligence, getProject, img, marketName, marketStats, psfOf, similar, summarize } from '@/lib/data';
import { bhkLabel, inr, inrFull, monthYear, paragraphs, psf, sqft, statusLabel, typeLabel } from '@/lib/format';
import { monthsUntil } from '@/lib/stage';
import type { GalleryItem } from '@/components/project/Gallery';
import { Gallery } from '@/components/project/Gallery';
import { FloorPlans } from '@/components/project/FloorPlans';
import { EntryRail } from '@/components/project/EntryRail';
import { Badges } from '@/components/project/Badges';
import { CardActions } from '@/components/project/CardActions';
import { ProjectCard } from '@/components/project/ProjectCard';
import { StickyCTA } from '@/components/project/StickyCTA';
import { CorridorMap } from '@/components/map/CorridorMap';
import { stationsFor } from '@/lib/geo';
import { LeadForm } from '@/components/lead/LeadForm';
import { WhatsAppLink } from '@/components/lead/WhatsAppLink';
import { Disclaimer } from '@/components/Section';
import { Icon } from '@/components/Icon';
import { JsonLd } from '@/components/JsonLd';
import { summaries } from '@/lib/data';

export function generateStaticParams() {
  return allPages().map((p) => ({ slug: p.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const s = summarize(p);
  const sectorPart = p.location.sector ? `, Sector ${p.location.sector}` : '';
  const title = p.source === 'curated' && p.seo.title ? p.seo.title : [`${p.name}${sectorPart} — price, possession & RERA`, `${p.name}${sectorPart} — price & RERA`, `${p.name}${sectorPart}`, `${p.name}`].find((t) => t.length <= 60) ?? `${p.name}`;
  const description = `${p.name} by ${p.developer.name ?? 'the developer'}${p.location.sector ? ` in Sector ${p.location.sector}, Gurugram` : ''}. ${s.priceFrom ? `From ${inr(s.priceFrom)}. ` : ''}${p.possessionDate ? `Possession ${monthYear(p.possessionDate)}. ` : ''}${p.reraNumber ? `RERA ${p.reraNumber}.` : ''}`.trim();
  return {
    title,
    description: p.source === 'curated' && p.seo.description ? p.seo.description : description,
    alternates: { canonical: `/projects/${p.supersededBy ?? slug}` },
    ...(p.supersededBy ? { robots: { index: false, follow: true } } : {}),
    openGraph: { title, description, images: s.image ? [{ url: s.image.src, width: s.image.width, height: s.image.height }] : undefined },
  };
}

const AMENITY_LABEL: Record<string, string> = {
  CLUBHOUSE: 'Clubhouse', SPORTS: 'Sports', RECREATION: 'Recreation', SAFETY: 'Safety & security', SECURITY: 'Safety & security', WELLNESS: 'Wellness', CONVENIENCE: 'Convenience', ENVIRONMENT: 'Green & sustainability', KIDS: 'Children', LIFESTYLE: 'Lifestyle', OTHER: 'Other',
};
function fmtPrev(v: unknown, field: string): string {
  if (v == null || (Array.isArray(v) && !v.length)) return 'not published';
  if (field === 'startingPrice' && typeof v === 'number') return inr(v);
  if ((field === 'possessionDate' || field === 'reraCompletionDate') && typeof v === 'string') return monthYear(v, true);
  if (field === 'landArea' && typeof v === 'number') return `${v} acres`;
  if (Array.isArray(v)) return v.slice(0, 4).join(', ') + (v.length > 4 ? '…' : '');
  return String(v);
}
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

export default async function ProjectPage({ params }: PageProps<'/projects/[slug]'>) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const s = summarize(p);
  const name = p.name ?? p.slug;
  const ps = psfOf(p);
  const market = p.location.microMarket ? marketStats(p.location.microMarket) : null;
  const left = monthsUntil(p.possessionDate);
  const checks = dueDiligence(p);
  const sim = similar(p, 3);
  const byArea = new Map<number, Set<number | null>>();
  p.pricing.configurations.forEach((c) => { if (c.areaSqft) (byArea.get(c.areaSqft) ?? byArea.set(c.areaSqft, new Set()).get(c.areaSqft)!).add(c.bhk); });
  const dupAreas = [...byArea.entries()].filter(([, s]) => s.size > 1).map(([a]) => a);

  // ---- media
  const where = `${p.location.sector ? `Sector ${p.location.sector}, ` : ''}${p.location.city ?? 'Gurugram'}`;
  const gallery: GalleryItem[] = [];
  const hero = img(p.media.hero);
  if (hero) gallery.push({ ...hero, alt: `${name} — featured view, ${where}` });
  p.media.gallery.forEach((g, i) => { const w = img(g); if (w && w.src !== hero?.src) gallery.push({ ...w, alt: `${name} — gallery image ${i + 1}, ${where}` }); });
  const site_plan = img(p.media.sitePlan);
  const plans = p.media.floorPlans
    .map((f) => ({ f, w: img(f.image) }))
    .filter((x) => x.w)
    .map(({ f, w }) => ({ ...w!, group: f.level || f.label || 'Plans', caption: f.label ?? undefined, alt: `${name} — floor plan, ${f.label ?? f.level ?? 'layout'}` }));

  // ---- amenities grouped
  const amen = new Map<string, typeof p.content.amenities>();
  for (const a of p.content.amenities) {
    const k = AMENITY_LABEL[a.category ?? 'OTHER'] ?? cap(a.category ?? 'Other');
    (amen.get(k) ?? amen.set(k, []).get(k)!).push(a);
  }

  const facts: [string, React.ReactNode, string?][] = [
    ['From', <span key="f" title={inrFull(s.priceFrom)}>{inr(s.priceFrom)}</span>],
    [`₹ / sq ft${ps.derived && ps.value ? '*' : ''}`, psf(ps.value), ps.derived && ps.value ? 'Indicative: starting price ÷ smallest listed unit' : undefined],
    ['Possession', monthYear(p.possessionDate)],
    ['Land', p.facts.landAreaAcres ? `${p.facts.landAreaAcres} acres` : p.facts.landAreaRaw?.split(' · ')[0] ?? '—'],
    ['Towers', p.facts.towers ?? '—'],
    ['Units', p.facts.units?.toLocaleString('en-IN') ?? '—'],
  ];

  const isBoilerplate = (t: string | null) => !t || /enjoys a strategic address|is ideal for the following audience/i.test(t);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name,
    url: `${site.url}/projects/${p.slug}`,
    description: p.content.description ?? undefined,
    image: gallery.slice(0, 5).map((g) => `${site.url}${g.src}`),
    datePosted: p.sourceCreatedAt ?? undefined,
    about: {
      '@type': 'Residence',
      name,
      address: { '@type': 'PostalAddress', streetAddress: p.location.address ?? undefined, addressLocality: p.location.city ?? 'Gurugram', addressRegion: p.location.state ?? 'Haryana', addressCountry: 'IN' },
      ...(p.location.latitude && p.location.longitude ? { geo: { '@type': 'GeoCoordinates', latitude: p.location.latitude, longitude: p.location.longitude } } : {}),
    },
    ...(s.priceFrom ? { offers: { '@type': 'Offer', price: s.priceFrom, priceCurrency: 'INR', availability: 'https://schema.org/InStock', description: 'Starting price' } } : {}),
  };
  const faqLd = p.content.faqs.length
    ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.content.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) }
    : null;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Projects', item: `${site.url}/projects` },
      ...(p.location.microMarket ? [{ '@type': 'ListItem', position: 2, name: marketName(p.location.microMarket), item: `${site.url}/markets/${p.location.microMarket}` }] : []),
      { '@type': 'ListItem', position: p.location.microMarket ? 3 : 2, name, item: `${site.url}/projects/${p.slug}` },
    ],
  };

  const sectionNav = [
    ['pricing', 'Pricing'], ['investment', 'Investment view'], ['location', 'Location'], ['plans', 'Floor plans'], ['amenities', 'Amenities'], ['developer', 'Developer'], ['faqs', 'FAQs'],
  ].filter(([id]) => (id === 'plans' ? plans.length : id === 'faqs' ? p.content.faqs.length : id === 'amenities' ? p.content.amenities.length : true));

  return (
    <>
      <JsonLd data={jsonLd} />
      {faqLd && <JsonLd data={faqLd} />}
      <JsonLd data={breadcrumbLd} />

      <div className="wrap pt-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-2">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/projects" className="link">Projects</Link> /</li>
            {p.location.microMarket && <li><Link href={`/markets/${p.location.microMarket}`} className="link">{marketName(p.location.microMarket)}</Link> /</li>}
            <li aria-current="page" className="text-ink">{name}</li>
          </ol>
        </nav>

        {p.supersededBy && (() => {
          const next = getProject(p.supersededBy);
          return next ? (
            <div role="note" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-signal bg-signal-soft p-4 text-sm">
              <Icon name="info" size={18} className="shrink-0" />
              <span className="flex-1">This is an older public listing of the same township. The current, developer-sourced listing has newer prices, phases and RERA details.</span>
              <Link href={`/projects/${next.slug}`} className="btn btn-primary">Go to {next.name}</Link>
            </div>
          ) : null;
        })()}

        {/* HERO */}
        <header className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badges badges={s.badges} status={p.status} />
            <h1 className="display mt-3 text-[clamp(2.4rem,5.5vw,4.75rem)]">{name}</h1>
            <p className="mt-3 text-lg text-ink-2">
              {typeLabel(p.projectType)} by <Link href={`/projects?developer=${encodeURIComponent(p.developer.name ?? '')}`} className="link text-ink">{p.developer.name ?? 'developer not published'}</Link>
              {' · '}{p.location.address ?? where}
            </p>
          </div>
          <CardActions slug={p.slug} name={name} variant="full" />
        </header>
        <EntryRail stage={s.stage} size="lg" className="mt-8 max-w-3xl" />
        <p className="mt-2 text-xs text-ink-2">
          Listed status: {statusLabel(p.status)}{p.marketingStage ? ` · Listing text says “${p.marketingStage.replace('-', ' ')}”` : ''}{s.stage.basis === 'derived' ? ' · Position estimated from the stated possession date' : ''}.
        </p>

        <div className="mt-8"><Gallery items={gallery} name={name} /></div>

        {/* KEY FACTS BAR */}
        <dl className="mt-8 grid grid-cols-2 border-y border-ink sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([k, v, note], i) => (
            <div key={k} className={`px-3 py-4 ${i % 2 ? 'border-l hairline' : ''} sm:border-l sm:first:border-l-0 ${i >= 2 ? 'border-t hairline sm:border-t-0' : ''} ${i >= 3 ? 'sm:border-t lg:border-t-0' : ''}`} title={note}>
              <dt className="eyebrow">{k}</dt>
              <dd className="num mt-1 text-xl">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-ink-2">
          <span>RERA: <span className="num text-ink">{p.reraNumber ?? 'not published'}</span>{p.additionalRera?.length ? <> · also <span className="num text-ink">{p.additionalRera.join(', ')}</span></> : null}</span>
          {ps.derived && ps.value ? <span>* Indicative: starting price ÷ smallest listed unit. The developer has not published a rate.</span> : null}
        </p>
      </div>

      {/* BODY + RAIL */}
      <div className="wrap mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-16">
          <nav aria-label="On this page" className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b hairline bg-paper/95 px-4 backdrop-blur md:-mx-0 md:px-0">
            <ul className="flex gap-1 whitespace-nowrap">
              {sectionNav.map(([id, label]) => (
                <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center px-2 text-sm text-ink-2 hover:text-ink">{label}</a></li>
              ))}
            </ul>
          </nav>

          {/* Overview */}
          <section aria-labelledby="overview">
            <h2 id="overview" className="h2">Overview</h2>
            <div className="prose-falcon mt-4 text-ink-2">
              {p.content.subtitle && <p className="text-ink">{p.content.subtitle}</p>}
              {paragraphs(p.content.description).map((t) => <p key={t}>{t}</p>)}
            </div>
            {p.content.highlights.length > 0 && (
              <ul className="mt-6 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {p.content.highlights.map((h) => (
                  <li key={h} className="flex gap-2 border-t hairline pt-2 text-sm"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-ink-2" />{h}</li>
                ))}
              </ul>
            )}
            {p.content.offerings.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {p.content.offerings.map((o) => (
                  <div key={o.title} className="card p-4"><p className="font-medium">{o.title}</p><p className="mt-1 text-sm text-ink-2">{o.details}</p></div>
                ))}
              </div>
            )}
          </section>

          {/* Pricing */}
          <section id="pricing" aria-labelledby="pricing-h">
            <h2 id="pricing-h" className="h2">Configurations & pricing</h2>
            {p.pricing.configurations.length ? (
              <div className="mt-6 overflow-x-auto">
                <table className="ledger min-w-[560px]">
                  <caption className="sr-only">Configurations, unit areas and prices for {name}</caption>
                  <thead><tr><th scope="col">Configuration</th><th scope="col" className="n">Area</th><th scope="col" className="n">Price</th><th scope="col" className="n">₹/sq ft</th><th scope="col">Status</th></tr></thead>
                  <tbody>
                    {p.pricing.configurations.map((c, i) => (
                      <tr key={i}>
                        <th scope="row" className="text-left font-normal">{c.label ?? (c.bhk != null ? bhkLabel(c.bhk) : c.unitType)}<span className="block text-xs text-ink-2">{c.unitType}</span></th>
                        <td className="n">{c.areaSqft ? sqft(c.areaSqft) : '—'}</td>
                        <td className="n" title={c.priceRaw ?? undefined}>{c.priceInr ? inr(c.priceInr) : <span className="font-sans text-ink-2">{c.priceRaw ?? '—'}</span>}</td>
                        <td className="n">{c.pricePerSqftInr ? psf(c.pricePerSqftInr) : '—'}</td>
                        <td className="capitalize">{c.availability ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-ink-2">Areas as listed (RERA carpet/saleable basis not always specified). “Price on request” means the developer has not published a price for that unit.</p>
                {dupAreas.length > 0 && (
                  <p className="mt-2 flex gap-2 text-sm"><Icon name="alert" size={16} className="mt-0.5 shrink-0 text-caution" /><span>The source lists the same area for different configurations ({dupAreas.map((a) => sqft(Number(a))).join(', ')}). One of these rows is probably a data-entry error. Confirm sizes with the developer’s RERA-registered plans.</span></p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-ink-2">The developer has not published a configuration-wise price list. Starting price: <span className="num text-ink">{p.pricing.startingPriceRaw ?? 'not published'}</span>.</p>
            )}

            <h3 className="h3 mt-10">Payment plan</h3>
            {p.pricing.paymentPlan ? (
              <p className="mt-3 max-w-[68ch] text-ink-2">{p.pricing.paymentPlan}</p>
            ) : (
              <p className="mt-3 max-w-[68ch] text-ink-2">Not published. Ask for the full schedule before booking. Construction-linked plans (payments tied to build milestones) carry less risk than large up-front or possession-linked structures.</p>
            )}
            {p.pricing.bookingAmount && <p className="mt-2 text-ink-2">Booking: {p.pricing.bookingAmount}</p>}
          </section>

          {/* Investment view */}
          <section id="investment" aria-labelledby="investment-h">
            <h2 id="investment-h" className="h2">Investment view</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {ps.value && market?.medianPsf ? (
                <div className="card p-4">
                  <p className="eyebrow">₹/sq ft vs corridor</p>
                  <p className="num mt-2 text-2xl">{ps.value > market.medianPsf ? '+' : '−'}{Math.abs(Math.round((ps.value / market.medianPsf - 1) * 100))}%</p>
                  <p className="mt-1 text-sm text-ink-2">{psf(ps.value)} vs {marketName(p.location.microMarket)} median {psf(market.medianPsf)} across {market.count} tracked projects.</p>
                </div>
              ) : null}
              <div className="card p-4">
                <p className="eyebrow">Runway to possession</p>
                <p className="num mt-2 text-2xl">{left != null ? (left > 0 ? `${Math.floor(left / 12)}y ${left % 12}m` : 'Due') : '—'}</p>
                <p className="mt-1 text-sm text-ink-2">{p.possessionDate ? `Stated possession ${monthYear(p.possessionDate, true)}.` : 'Possession date not published.'}{p.reraCompletionDate && p.reraCompletionDate !== p.possessionDate ? ` RERA completion date: ${monthYear(p.reraCompletionDate, true)}.` : ''} A longer runway means more construction risk and more time for appreciation.</p>
              </div>
              {p.facts.unitsPerAcre ? <div className="card p-4">
                <p className="eyebrow">Density</p>
                <p className="num mt-2 text-2xl">{p.facts.unitsPerAcre ? `${p.facts.unitsPerAcre}` : '—'}<span className="text-sm text-ink-2"> units/acre</span></p>
                <p className="mt-1 text-sm text-ink-2">Computed from {p.facts.units ? `${p.facts.units} units` : 'units'} on {p.facts.landAreaAcres ? `${p.facts.landAreaAcres} acres` : 'the land area'}. Lower density usually means more open space per home.</p>
              </div> : null}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/tools/roi-calculator?price=${s.priceFrom ?? ''}&years=${left && left > 0 ? Math.max(3, Math.ceil(left / 12) + 1) : 5}&rent=${left && left > 0 ? Math.ceil(left / 12) : 0}`} className="btn btn-ink">Model returns for this project</Link>
            </div>

            {(p.content.developerClaims?.length ?? 0) > 0 && (
              <>
                <h3 className="h3 mt-10">Developer claims, and what to check</h3>
                <p className="mt-1 text-sm text-ink-2">Quoted from the developer’s material. {site.name} has not verified these.</p>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {p.content.developerClaims!.map((c) => (
                    <li key={c.claim} className="card p-4">
                      <p className="font-medium">{c.claim}</p>
                      <p className="mt-1 flex gap-2 text-sm text-ink-2"><Icon name="alert" size={16} className="mt-0.5 shrink-0 text-caution" />{c.note}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className="h3 mt-10">Due-diligence checklist</h3>
            <p className="mt-1 text-sm text-ink-2">For information only, built from what is published. Unknown means the source does not say.</p>
            <ul className="mt-4 divide-y divide-rule border-y hairline">
              {checks.map((c) => (
                <li key={c.label} className="grid grid-cols-[auto_1fr] gap-3 py-3">
                  <span className={`mt-0.5 inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium border ${c.state === 'ok' ? 'border-positive text-ink [&>svg]:text-positive' : c.state === 'caution' ? 'border-caution text-ink [&>svg]:text-caution' : 'border-rule-strong text-ink-2'}`}>
                    <Icon name={c.state === 'ok' ? 'check' : c.state === 'caution' ? 'alert' : 'question'} size={14} />
                    {c.state === 'ok' ? 'Published' : c.state === 'caution' ? 'Check' : 'Unknown'}
                  </span>
                  <div className="min-w-0 [overflow-wrap:anywhere]"><p className="font-medium">{c.label}</p><p className="text-sm text-ink-2">{c.detail}</p></div>
                </li>
              ))}
            </ul>
            {!isBoilerplate(p.content.investmentCommentary) && (
              <div className="prose-falcon mt-6 text-ink-2">{paragraphs(p.content.investmentCommentary).map((t) => <p key={t}>{t}</p>)}</div>
            )}
          </section>

          {/* Location */}
          <section id="location" aria-labelledby="location-h">
            <h2 id="location-h" className="h2">Location & connectivity</h2>
            <p className="mt-2 text-ink-2">{p.location.address ?? where}{p.location.microMarket ? ` · ${marketName(p.location.microMarket)} corridor` : ''}</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {stationsFor([s]).stations.length > 0 ? (
                <div className="card p-3">
                  <CorridorMap projects={[s]} highlight={p.location.microMarket ?? undefined} compact title={`${name} on the map of Gurugram`} />
                </div>
              ) : site_plan || p.media.floorPlans.some((f) => /map/i.test(f.label ?? '')) ? null : (
                <p className="text-sm text-ink-2">This project is outside the Gurugram map.</p>
              )}
              <div className="space-y-4">
                {p.location.connectivity.length > 0 ? (
                  <table className="ledger">
                    <caption className="sr-only">Travel times to nearby places</caption>
                    <thead><tr><th scope="col">Nearby</th><th scope="col" className="n">Time</th><th scope="col" className="n">Distance</th></tr></thead>
                    <tbody>
                      {p.location.connectivity.map((c, i) => (
                        <tr key={i}><th scope="row" className="text-left font-normal">{c.name}<span className="block text-xs capitalize text-ink-2">{c.category?.replace(/-/g, ' ')}</span></th><td className="n">{c.travelTime ?? '—'}</td><td className="n">{c.distanceKm ? `${c.distanceKm} km` : '—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-ink-2">Travel times are not published for this project. The {marketName(p.location.microMarket) ?? 'corridor'} page covers the area’s infrastructure.</p>
                )}
                <a
                  className="btn btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={p.location.latitude && p.location.longitude ? `https://www.google.com/maps/search/?api=1&query=${p.location.latitude},${p.location.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${where}`)}`}
                >
                  Open in Google Maps <Icon name="external" size={16} />
                </a>
                {p.location.microMarket && <p><Link href={`/markets/${p.location.microMarket}`} className="link text-sm">The growth story: {marketName(p.location.microMarket)} →</Link></p>}
              </div>
            </div>
            {site_plan && (
              <figure className="card mt-6 overflow-hidden">
                <div className="relative aspect-[16/10] bg-white"><Image src={site_plan.src} alt={`${name} — site and location plan`} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-contain p-2" /></div>
                <figcaption className="border-t hairline px-4 py-2 text-sm text-ink-2">Site / location plan as published by the developer.</figcaption>
              </figure>
            )}
          </section>

          {plans.length > 0 && (
            <section id="plans" aria-labelledby="plans-h">
              <h2 id="plans-h" className="h2">Floor plans</h2>
              <div className="mt-6"><FloorPlans plans={plans} name={name} /></div>
            </section>
          )}

          {p.content.amenities.length > 0 && (
            <section id="amenities" aria-labelledby="amenities-h">
              <h2 id="amenities-h" className="h2">Amenities</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {[...amen.entries()].map(([cat, list]) => (
                  <div key={cat}>
                    <h3 className="eyebrow border-b border-ink pb-2 font-sans">{cat}</h3>
                    <ul className="mt-2 divide-y divide-rule">
                      {list.map((a, i) => <li key={i} className="py-2"><p className="text-[0.95rem]">{a.name}</p>{a.details && <p className="text-sm text-ink-2">{a.details}</p>}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="developer" aria-labelledby="developer-h">
            <h2 id="developer-h" className="h2">Developer</h2>
            <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl">{p.developer.name ?? 'Not published'}</p>
                <p className="text-sm text-ink-2">{summaries().filter((x) => x.developer === p.developer.name).length} project(s) tracked by {site.name}. Delivery record: not assessed. Check completed projects and HARERA orders.</p>
              </div>
              {p.developer.name && <Link href={`/projects?developer=${encodeURIComponent(p.developer.name)}`} className="btn btn-ghost">All {p.developer.name} projects</Link>}
            </div>
          </section>

          {p.media.videos.length > 0 && (
            <section aria-labelledby="video-h">
              <h2 id="video-h" className="h3">Project video</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.media.videos.map((v, i) => (
                  <li key={v}><a href={v} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Icon name="play" size={16} /> Watch video {p.media.videos.length > 1 ? i + 1 : ''} <span className="sr-only">(opens external video file)</span></a></li>
                ))}
              </ul>
            </section>
          )}

          {p.content.faqs.length > 0 && (
            <section id="faqs" aria-labelledby="faqs-h">
              <h2 id="faqs-h" className="h2">FAQs</h2>
              <div className="mt-6 divide-y divide-rule border-y hairline">
                {p.content.faqs.map((f, i) => (
                  <details key={i} className="group py-1">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 font-medium [&::-webkit-details-marker]:hidden">
                      {f.question}
                      <Icon name="chevronDown" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pb-4 text-ink-2">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {(p.corrections?.length ?? 0) > 0 && (
            <section aria-labelledby="builder-h" className="card p-5">
              <h2 id="builder-h" className="h3">Verified with the developer</h2>
              <p className="mt-1 text-sm text-ink-2">Where sources disagreed, these values were updated to what {p.developer.name ?? 'the developer'} publishes.</p>
              <ul className="mt-4 divide-y divide-rule border-t hairline">
                {p.corrections!.map((c) => (
                  <li key={c.field} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                    <span className="text-sm font-medium">{({ possessionDate: 'Possession', reraCompletionDate: 'RERA completion date', startingPrice: 'Starting price', reraNumber: 'RERA number', additionalRera: 'Other RERA registrations', units: 'Units', towers: 'Towers', floors: 'Floors', landArea: 'Land area', developer: 'Developer', sector: 'Sector', locality: 'Locality', configurations: 'Configurations', status: 'Status' } as Record<string, string>)[c.field] ?? c.field}</span>
                    <span className="text-sm">
                      {c.value}
                      <span className="block text-xs text-ink-2">
                        Previously {fmtPrev(c.from, c.field)} ·{' '}
                        <a href={c.source} target="_blank" rel="noopener noreferrer" className="link">{c.sourceType === 'rera-filing-by-developer' ? 'RERA filing' : 'developer source'}</a>
                        {c.checkedAt ? ` · checked ${new Date(c.checkedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Disclaimer>
            {p.source === 'curated' ? `${p.sourceNote ?? 'Compiled from developer material'}.` : `Data retrieved ${new Date(p.scrapedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} from public listing material.`} Prices, availability and dates change. {site.disclaimer}
          </Disclaimer>
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-2">Prices and project information may differ from current actuals, as details can change after a project is launched. Feel free to raise a query about this project for detailed, up-to-date information.</p>
            <div className="flex shrink-0 gap-2">
              <a href="#early-access" className="btn btn-primary">Raise a query</a>
              <WhatsAppLink projectName={name} className="btn btn-ghost" />
            </div>
          </div>
        </div>

        {/* Right rail — sticky lead capture on desktop */}
        <aside id="early-access" aria-label="Request pricing" className="scroll-mt-24">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="card p-5">
              <LeadForm defaultProject={{ slug: p.slug, name }} heading="Request early-access pricing" compact source="project" />
            </div>
            <WhatsAppLink projectName={name} className="btn btn-ghost w-full" label="Ask on WhatsApp" />
          </div>
        </aside>
      </div>

      {sim.length > 0 && (
        <section className="wrap mt-20" aria-labelledby="similar">
          <h2 id="similar" className="h2 border-t border-ink pt-4">Similar projects</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sim.map((x) => <ProjectCard key={x.slug} p={x} />)}</div>
        </section>
      )}

      <StickyCTA name={name} priceFrom={s.priceFrom} />
    </>
  );
}
