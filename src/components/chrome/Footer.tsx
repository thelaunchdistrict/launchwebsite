import Link from 'next/link';
import { site } from '@/config/site';
import { Logo } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';
import mm from '@/config/micromarkets.json';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-ink bg-paper">
      <div className="wrap grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-sm text-sm text-ink-2">{site.description}</p>
          <ThemeSwitch />
        </div>
        <FooterCol title="Research" links={[['/projects', 'All projects'], ['/projects?early=1', 'Early-entry only'], ['/compare', 'Compare'], ['/shortlist', 'Shortlist']]} />
        <FooterCol title="Markets" links={mm.markets.slice(0, 6).map((m) => [`/markets/${m.slug}`, m.name] as [string, string])} />
        <FooterCol
          title="Falcon"
          links={[['/tools', 'Investment tools'], ['/insights', 'Insights'], ['/about', 'About'], ['/contact', 'Contact'], ['/disclaimer', 'RERA & disclaimer'], ['/privacy', 'Privacy'], ['/terms', 'Terms']]}
        />
      </div>
      <div className="border-t hairline">
        <div className="wrap space-y-2 py-6 text-xs leading-relaxed text-ink-2">
          <p><strong className="font-medium text-ink">Not investment advice.</strong> {site.disclaimer}</p>
          <p>{site.sourceNote}</p>
          <p>© {year} {site.legalName}.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <h2 className="eyebrow mb-3 font-sans">{title}</h2>
      <ul className="space-y-0.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="inline-flex min-h-11 items-center text-sm text-ink-2 hover:text-ink md:min-h-9">{label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
