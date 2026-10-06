import { site } from '@/config/site';
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { MARKETS, marketStats, sectorStats, summaries } from '@/lib/data';
import { psf } from '@/lib/format';
import { ToolsNav } from '@/components/tools/ToolsNav';
import { Disclaimer } from '@/components/Section';

export const metadata: Metadata = pageMeta({
  title: 'Price per sq ft by sector — Gurugram',
  description: `Median, low and high ₹/sq ft by Gurugram sector and corridor, across the projects ${site.name} tracks.`,
  path: '/tools/price-per-sqft'});

export default function PsfPage() {
  const sectors = sectorStats();
  const markets = MARKETS.map((m) => ({ ...m, ...marketStats(m.slug) })).filter((m) => m.medianPsf).sort((a, b) => b.medianPsf! - a.medianPsf!);
  const max = Math.max(...sectors.map((s) => s.max), ...markets.map((m) => m.maxPsf ?? 0));
  const step = 10000;
  const axisMax = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: axisMax / step + 1 }, (_, i) => i * step);
  const withPsf = summaries().filter((s) => s.psf).length;
  const derived = summaries().filter((s) => s.psf && s.psfDerived).length;
  const top = sectors[0], bottom = sectors[sectors.length - 1];

  return (
    <div className="wrap py-10">
      <ToolsNav current="/tools/price-per-sqft" />
      <header className="mb-10 mt-6 max-w-3xl">
        <p className="eyebrow">Tool · Pricing</p>
        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">₹ per sq ft, sector by sector.</h1>
        <p className="mt-4 text-ink-2">
          {top && bottom ? <>Across the {withPsf} projects with a usable rate, Sector {top.sector} has the highest median at {psf(top.median)}/sq ft and Sector {bottom.sector} the lowest at {psf(bottom.median)}/sq ft. </> : null}
          {derived} of those rates are indicative: starting price ÷ smallest listed unit, because developers rarely publish a rate.
        </p>
      </header>

      <Bars title="By corridor" rows={markets.map((m) => ({ key: m.slug, label: m.name, href: `/markets/${m.slug}`, median: m.medianPsf!, min: m.minPsf!, max: m.maxPsf!, count: m.count }))} axisMax={axisMax} ticks={ticks} />
      <Bars title="By sector" rows={sectors.map((s) => ({ key: s.sector, label: `Sector ${s.sector}`, href: `/projects?sector=${s.sector}`, median: s.median, min: s.min, max: s.max, count: s.count }))} axisMax={axisMax} ticks={ticks} />

      <Disclaimer className="mt-10">
        Medians cover only the projects {site.name} tracks, so they are not an index of the whole market. Rates mix carpet and saleable-area bases as listed. Use this to rank options, not to value a unit.
      </Disclaimer>
    </div>
  );
}

function Bars({ title, rows, axisMax, ticks }: { title: string; rows: { key: string; label: string; href: string; median: number; min: number; max: number; count: number }[]; axisMax: number; ticks: number[] }) {
  const x = (v: number) => `${(v / axisMax) * 100}%`;
  return (
    <section className="mt-12" aria-labelledby={`h-${title}`}>
      <h2 id={`h-${title}`} className="h2 border-t border-ink pt-4">{title}</h2>
      <div className="mt-6 hidden grid-cols-[10rem_1fr_6rem] gap-3 text-xs text-ink-2 md:grid" aria-hidden>
        <span />
        <div className="relative h-4">
          {ticks.map((t) => <span key={t} className="num absolute -translate-x-1/2" style={{ left: x(t) }}>{t ? `₹${t / 1000}k` : '0'}</span>)}
        </div>
        <span className="text-right">Median</span>
      </div>
      <ol className="mt-2" aria-label={`${title}: median, lowest and highest ₹ per sq ft`}>
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-b hairline py-2 md:grid-cols-[13rem_1fr_6rem]">
            <span className="text-sm">
              <Link href={r.href} className="inline-flex min-h-11 items-center hover:underline underline-offset-4">{r.label}</Link>
              <span className="ml-1 text-xs text-ink-2">({r.count} project{r.count === 1 ? '' : 's'})</span>
            </span>
            <span className="order-3 col-span-2 md:order-none md:col-span-1">
              <span className="relative block h-6" role="img" aria-label={`Range ${psf(r.min)} to ${psf(r.max)}, median ${psf(r.median)}`}>
                {ticks.map((t) => <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-rule" style={{ left: x(t) }} />)}
                <span aria-hidden className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-rule-strong" style={{ left: x(r.min), width: `calc(${x(r.max)} - ${x(r.min)} + 2px)` }} />
                <span aria-hidden className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-signal" style={{ left: x(r.median) }} />
              </span>
            </span>
            <span className="num text-right text-sm"><span className="sr-only">Median </span>{psf(r.median)}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink-2">Dot = median; grey line = lowest to highest tracked project.</p>
    </section>
  );
}
