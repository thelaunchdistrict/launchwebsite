import type { Metadata } from 'next';
import Link from 'next/link';
import { summaries } from '@/lib/data';
import { inr, monthYear } from '@/lib/format';
import { ToolsNav } from '@/components/tools/ToolsNav';
import { Badges } from '@/components/project/Badges';

export const metadata: Metadata = {
  title: 'Possession timeline — Gurugram projects by delivery year',
  description: 'When each tracked Gurugram project is due for possession, grouped by year, with stage and starting price.',
  alternates: { canonical: '/tools/possession-timeline' },
};

export default function TimelinePage() {
  const all = summaries();
  const dated = all.filter((s) => s.possession).sort((a, b) => a.possession!.localeCompare(b.possession!));
  const undated = all.filter((s) => !s.possession);
  const years = [...new Set(dated.map((s) => s.possessionYear!))].sort();
  const now = new Date();
  const thisYear = now.getFullYear();
  const maxCount = Math.max(...years.map((y) => dated.filter((d) => d.possessionYear === y).length));

  return (
    <div className="wrap py-10">
      <ToolsNav current="/tools/possession-timeline" />
      <header className="mb-10 mt-6 max-w-3xl">
        <p className="eyebrow">Tool · Timing</p>
        <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">When do the keys arrive?</h1>
        <p className="mt-4 text-ink-2">
          {dated.length} of {all.length} projects state a possession date, from {monthYear(dated[0]?.possession)} to {monthYear(dated[dated.length - 1]?.possession)}. Dates come from developer statements. RERA completion dates are often later, so treat these as the earliest case.
        </p>
      </header>

      {/* Year histogram */}
      <figure className="card p-5">
        <div className="flex h-40 items-end gap-2" role="img" aria-label={years.map((y) => `${y}: ${dated.filter((d) => d.possessionYear === y).length} projects`).join('; ')}>
          {years.map((y) => {
            const n = dated.filter((d) => d.possessionYear === y).length;
            return (
              <a key={y} href={`#y${y}`} className="group flex flex-1 flex-col items-center justify-end gap-1" aria-hidden tabIndex={-1}>
                <span className="num text-xs">{n}</span>
                <span className={`w-full rounded-t ${y <= thisYear ? 'bg-rule-strong' : 'bg-ink'} group-hover:bg-signal`} style={{ height: `${(n / maxCount) * 100}%` }} />
                <span className="num text-xs text-ink-2">{y}</span>
              </a>
            );
          })}
        </div>
        <figcaption className="mt-3 text-xs text-ink-2">Projects by stated possession year. Grey bars are years already reached ({thisYear} or earlier).</figcaption>
      </figure>

      <div className="mt-12 space-y-12">
        {years.map((y) => (
          <section key={y} id={`y${y}`} aria-labelledby={`h${y}`} className="scroll-mt-24">
            <h2 id={`h${y}`} className="h2 flex items-baseline gap-3 border-t border-ink pt-3">
              <span className="num">{y}</span>
              <span className="font-sans text-sm text-ink-2">{dated.filter((d) => d.possessionYear === y).length} projects{y < thisYear || (y === thisYear) ? ' · due or overdue' : ''}</span>
            </h2>
            <ol className="mt-3 divide-y divide-rule">
              {dated.filter((d) => d.possessionYear === y).map((p) => (
                <li key={p.slug} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 md:grid-cols-[7rem_1fr_auto_8rem] md:items-center">
                  <span className="num text-sm text-ink-2">{monthYear(p.possession)}</span>
                  <div>
                    <Link href={`/projects/${p.slug}`} className="font-display text-xl hover:underline underline-offset-4">{p.name}</Link>
                    <p className="text-xs text-ink-2">{p.developer} · {p.sector ? `Sector ${p.sector}` : p.marketName}</p>
                  </div>
                  <Badges badges={p.badges} status={p.status} className="col-start-2 md:col-start-auto" />
                  <span className="num col-start-2 text-sm md:col-start-auto md:text-right">{inr(p.priceFrom)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {undated.length > 0 && (
          <section aria-labelledby="undated">
            <h2 id="undated" className="h2 border-t border-ink pt-3">No possession date published</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {undated.map((p) => <li key={p.slug}><Link href={`/projects/${p.slug}`} className="chip min-h-11 bg-raised px-3 hover:border-ink">{p.name}</Link></li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
