'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '../Icon';
import { useShortlist } from '@/lib/shortlist';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/projects', label: 'Projects', icon: 'grid' },
  { href: '/tools', label: 'Tools', icon: 'tools' },
  { href: '/shortlist', label: 'Shortlist', icon: 'bookmark' },
];

/** Mobile bottom tab bar — navigation only, never actions (HIG tab bars). */
export function TabBar() {
  const path = usePathname();
  const { items } = useShortlist();
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-paper/95 backdrop-blur md:hidden safe-bottom">
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === '/' ? path === '/' : path === t.href || path.startsWith(t.href + '/');
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] ${active ? 'text-ink' : 'text-ink-2'}`}
              >
                <Icon name={t.icon === 'bookmark' && items.length ? 'bookmarkFilled' : t.icon} size={22} />
                <span>{t.label}{t.href === '/shortlist' && items.length ? ` (${items.length})` : ''}</span>
                {active && <span aria-hidden className="absolute top-0 h-0.5 w-8 bg-signal" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
