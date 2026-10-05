'use client';
import Link from 'next/link';
import { useCompare, useJourney, useShortlist } from '@/lib/shortlist';
import { Icon } from '../Icon';

/**
 * Commitment ladder: four small, reversible steps from browsing to a site visit. Progress is real and lives
 * only in this browser. Each step shows what it unlocks, and the next one is offered as soon as one is done.
 */
export function JourneyLadder({ className = '' }: { className?: string }) {
  const shortlist = useShortlist();
  const compare = useCompare();
  const journey = useJourney();
  const steps = [
    { label: 'Save projects', done: shortlist.items.length > 0, href: '/projects', next: 'Save a project you like' },
    { label: 'Compare side by side', done: compare.items.length >= 2, href: shortlist.items.length >= 2 ? `/compare?p=${shortlist.items.slice(0, 3).join(',')}` : '/projects', next: shortlist.items.length >= 2 ? 'Compare your saved projects' : `Save ${2 - shortlist.items.length} more to compare` },
    { label: 'Receive the price sheet', done: journey.has('price-sheet'), href: '/contact#early-access', next: 'Ask for the private price sheet' },
    { label: 'Plan a site visit', done: journey.has('visit'), href: '/contact', next: 'Plan a site visit' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return (
    <section aria-label="Your progress" className={`card p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Your path to allotment</p>
        <p className="num text-sm text-ink-2">{doneCount} of {steps.length} steps</p>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-sunk" aria-hidden>
        <div className="h-full bg-brass transition-[width] duration-700" style={{ width: `${Math.max(6, (doneCount / steps.length) * 100)}%` }} />
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[0.7rem] ${s.done ? 'border-brass bg-brass text-paper' : 'border-rule-strong text-ink-2'}`}>
              {s.done ? '✓' : i + 1}
            </span>
            <span className={s.done ? 'text-ink' : 'text-ink-2'}>{s.label}<span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span></span>
          </li>
        ))}
      </ol>
      {next && (
        <Link href={next.href} className="cta-line mt-3">
          Next: {next.next} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </section>
  );
}
