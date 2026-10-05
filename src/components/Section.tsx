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
        <Link href={href} className="cta-line shrink-0">
          {cta ?? 'View all'} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}

export function Disclaimer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex gap-3 border-l-2 border-brass bg-sunk px-4 py-3 text-xs leading-relaxed text-ink-2 ${className}`}>
      <Icon name="info" size={16} className="mt-0.5 shrink-0 text-brass" />
      <span>{children}</span>
    </p>
  );
}
