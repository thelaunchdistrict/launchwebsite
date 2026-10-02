import Link from 'next/link';
import { Icon } from './Icon';

export function SectionHead({ eyebrow, title, intro, href, cta, id }: { eyebrow?: string; title: string; intro?: string; href?: string; cta?: string; id?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-t border-ink pt-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 id={id} className="h2">{title}</h2>
        {intro && <p className="mt-3 text-ink-2">{intro}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline underline-offset-4">
          {cta ?? 'View all'} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

export function Disclaimer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex gap-2 rounded-xl border border-dashed border-rule-strong p-3 text-xs leading-relaxed text-ink-2 ${className}`}>
      <Icon name="info" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
