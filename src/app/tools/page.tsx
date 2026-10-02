import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS } from '@/components/tools/ToolsNav';
import { Icon } from '@/components/Icon';

export const metadata: Metadata = {
  title: 'Investment tools',
  description: 'ROI and IRR calculator, price-per-sq-ft comparison by sector and a possession timeline for Gurugram projects.',
  alternates: { canonical: '/tools' },
};

export default function ToolsPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow">Tools</p>
      <h1 className="display mt-3 text-[clamp(2.25rem,5vw,4rem)]">Do the maths before the site visit.</h1>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {TOOLS.map((t, i) => (
          <li key={t.href}>
            <Link href={t.href} className="card group flex h-full flex-col p-6 transition-colors hover:border-ink">
              <span className="num text-sm text-signal">0{i + 1}</span>
              <span className="h3 mt-3">{t.label}</span>
              <span className="mt-2 flex-1 text-sm text-ink-2">{t.blurb}</span>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">Open <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
