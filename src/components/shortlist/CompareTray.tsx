'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '@/lib/shortlist';
import { Icon } from '../Icon';

/** Floating tray once at least one project is queued for comparison. */
export function CompareTray() {
  const { items, remove, clear } = useCompare();
  const path = usePathname();
  if (!items.length || path.startsWith('/compare')) return null;
  return (
    <aside aria-label="Compare tray" className="fixed inset-x-3 bottom-[4.5rem] z-40 mx-auto max-w-xl rounded-2xl bg-ink p-3 text-paper shadow-2xl md:bottom-5" style={{ animation: 'fade-in .2s both' }}>
      <div className="flex items-center gap-3">
        <p className="text-sm">
          <span className="num">{items.length}/3</span> to compare
        </p>
        <ul className="hidden min-w-0 flex-1 gap-1 sm:flex">
          {items.map((s) => (
            <li key={s} className="flex min-w-0 items-center rounded-full bg-paper/10 pl-3 text-xs">
              <span className="truncate">{s.replace(/-sector.*|-gurgaon.*/, '').replace(/-/g, ' ')}</span>
              <button type="button" onClick={() => remove(s)} className="grid h-11 w-9 place-items-center" aria-label={`Remove ${s} from compare`}>
                <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={clear} className="btn min-h-11 px-3 text-sm text-paper/80 hover:text-paper">Clear</button>
          <Link href={`/compare?p=${items.join(',')}`} className="btn btn-primary" aria-disabled={items.length < 2}>
            Compare{items.length < 2 ? ' (add 1 more)' : ''}
          </Link>
        </div>
      </div>
    </aside>
  );
}
