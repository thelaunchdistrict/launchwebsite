import type { Metadata } from 'next';
import Link from 'next/link';
import { ARTICLES } from '@/content/articles';

export const metadata: Metadata = {
  title: 'Insights — early-stage real estate investing in Gurugram',
  description: 'Guides to investing early: stages, price sheets and due diligence for under-construction property in Gurugram.',
  alternates: { canonical: '/insights' },
};

export default function InsightsPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Insights</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Notes from the field.</h1>
      <ol className="mt-10 divide-y divide-rule border-y border-ink">
        {[...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
          <li key={a.slug}>
            <Link href={`/insights/${a.slug}`} className="group grid gap-2 py-6 md:grid-cols-[10rem_1fr]">
              <span className="num text-sm text-ink-2">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {a.readMins} min</span>
              <span>
                <span className="font-display text-[1.75rem] leading-tight group-hover:underline underline-offset-4">{a.title}</span>
                <span className="mt-2 block max-w-2xl text-ink-2">{a.dek}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
