import Image from 'next/image';
import Link from 'next/link';
import type { ProjectSummary } from '@/lib/types';
import { inr, inrFull, monthYear, psf, bhkLabel } from '@/lib/format';
import { EntryRail } from './EntryRail';
import { Badges } from './Badges';
import { CardActions } from './CardActions';

export function configSummary(p: Pick<ProjectSummary, 'bhks' | 'configLabels' | 'type'>) {
  if (p.bhks.length) return p.bhks.map(bhkLabel).join(', ').replace(/ BHK, /g, ', ');
  if (p.configLabels.length) return p.configLabels.slice(0, 2).join(', ') + (p.configLabels.length > 2 ? '…' : '');
  return '—';
}

/** Ledger card: photo for recognition, numbers for the decision. */
export function ProjectCard({ p, priority = false }: { p: ProjectSummary; priority?: boolean }) {
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-[0_1px_0_var(--rule),0_12px_32px_-16px_rgba(0,0,0,.25)]">
      <div className="relative aspect-[3/2] bg-sunk">
        {p.image ? (
          <Image
            src={p.image.src}
            alt={`${p.name} — project exterior, ${p.sector ? `Sector ${p.sector}, ` : ''}Gurugram`}
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-2">Image not published</div>
        )}
        <Badges badges={p.badges} status={p.status} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <p className="text-[0.8125rem] text-ink-2">
            {p.developer ?? 'Developer not published'} · {p.sector ? `Sector ${p.sector}` : p.marketName ?? '—'}
          </p>
          <h3 className="h3 mt-1">
            <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-focus focus-visible:after:rounded-[14px]">
              {p.name}
            </Link>
          </h3>
        </div>
        <EntryRail stage={p.stage} />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t hairline pt-3 text-sm">
          <div>
            <dt className="eyebrow">From</dt>
            <dd className="num mt-0.5 text-[1.05rem]" title={inrFull(p.priceFrom)}>{inr(p.priceFrom)}</dd>
          </div>
          <div>
            <dt className="eyebrow">₹ / sq ft{p.psfDerived && p.psf ? '*' : ''}</dt>
            <dd className="num mt-0.5 text-[1.05rem]">
              {psf(p.psf)}
              {p.psfDerived && p.psf ? <span className="sr-only"> (indicative, derived from starting price ÷ smallest unit)</span> : null}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Possession</dt>
            <dd className="num mt-0.5">{monthYear(p.possession)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Configs</dt>
            <dd className="mt-0.5 truncate">{configSummary(p)}</dd>
          </div>
        </dl>
        <div className="relative z-10 mt-auto flex items-center justify-between gap-2">
          <span className="text-xs text-ink-2">{p.rera ? 'RERA no. published' : 'RERA no. not published'}</span>
          <CardActions slug={p.slug} name={p.name} />
        </div>
      </div>
    </article>
  );
}
