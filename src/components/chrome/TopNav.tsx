'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { Icon } from '../Icon';
import { useShortlist } from '@/lib/shortlist';

export const NAV = [
  { href: '/projects', label: 'Projects' },
  { href: '/markets', label: 'Markets' },
  { href: '/tools', label: 'Tools' },
  { href: '/insights', label: 'Insights' },
];

export function TopNav() {
  const path = usePathname();
  const { items } = useShortlist();
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="wrap flex h-16 items-center gap-6">
        <Link href="/" className="-ml-1 flex min-h-11 items-center px-1" aria-label="Falcon home">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = path === n.href || path.startsWith(n.href + '/');
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center rounded-full px-3 text-[0.95rem] transition-colors ${active ? 'text-ink underline decoration-signal decoration-2 underline-offset-[6px]' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/shortlist" className="btn btn-ghost btn-icon hidden md:inline-flex relative" aria-label={`Shortlist (${items.length})`}>
            <Icon name={items.length ? 'bookmarkFilled' : 'bookmark'} />
            {items.length > 0 && <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.7rem] text-paper">{items.length}</span>}
          </Link>
          <Link href="/contact#early-access" className="btn btn-primary">
            Early access
          </Link>
        </div>
      </div>
    </header>
  );
}
