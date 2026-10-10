'use client';
import { site } from '@/config/site';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [path]);
  const overlay = path === '/' && !scrolled;
  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${overlay ? 'border-transparent bg-transparent text-night-ink' : 'hairline bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80'}`}>
      <div className="wrap flex h-16 items-center gap-3 md:gap-6">
        <Link href="/" className="-ml-1 flex min-h-11 items-center px-1" aria-label={`${site.name} home`}>
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
                    className={`flex min-h-11 items-center rounded-full px-3 text-[0.95rem] transition-colors ${active ? `${overlay ? 'text-night-ink' : 'text-ink'} underline decoration-brass-bright decoration-2 underline-offset-[6px]` : overlay ? 'text-night-ink/85 hover:text-night-ink' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/shortlist" className={`btn btn-icon hidden md:inline-flex relative ${overlay ? 'btn-outline-light' : 'btn-ghost'}`} aria-label={`Shortlist (${items.length})`}>
            <Icon name={items.length ? 'bookmarkFilled' : 'bookmark'} />
            {items.length > 0 && <span className="num absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-night-ink px-1 text-[0.7rem] text-night">{items.length}</span>}
          </Link>
          <Link href="/contact#early-access" className={`btn px-4 sm:px-6 ${overlay ? 'btn-outline-light' : 'btn-primary'}`}>
            <span className="sm:hidden">Preview</span><span className="hidden sm:inline">Private preview</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
