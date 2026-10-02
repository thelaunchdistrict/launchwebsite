import Link from 'next/link';

export const TOOLS = [
  { href: '/tools/roi-calculator', label: 'ROI calculator', blurb: 'Total return, IRR and money multiple with loan, rent and exit costs.' },
  { href: '/tools/price-per-sqft', label: '₹/sq ft by sector', blurb: 'Where each sector prices against the others, from the projects we track.' },
  { href: '/tools/possession-timeline', label: 'Possession timeline', blurb: 'When each project is due, laid out by year.' },
];

export function ToolsNav({ current }: { current: string }) {
  return (
    <nav aria-label="Tools">
      <ul className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} aria-current={current === t.href ? 'page' : undefined} className={`chip min-h-11 px-4 text-sm ${current === t.href ? 'border-ink bg-ink text-paper' : 'bg-raised hover:border-ink'}`}>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
