'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '../Icon';

/**
 * Thin bar above the header with what changed in the latest data refresh. Every number comes from the dataset.
 * Dismissal is remembered per refresh (keyed by its date), so it returns only when there is something new.
 */
export function AnnouncementBar({ message, href, cta, version }: { message: string; href: string; cta: string; version: string }) {
  const key = `tld-bar-${version}`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read dismissal after hydration to avoid a mismatch
      setHidden(localStorage.getItem(key) === '1');
    } catch {
      setHidden(false);
    }
  }, [key]);
  if (hidden) return null;
  return (
    <div className="band-night text-[0.8125rem]">
      <div className="wrap flex min-h-11 items-center gap-3">
        <span aria-hidden className="text-brass">✦</span>
        <p className="min-w-0 flex-1 truncate">{message}</p>
        <Link href={href} className="hidden shrink-0 items-center gap-1 font-medium underline decoration-brass underline-offset-4 sm:inline-flex">
          {cta} <Icon name="arrowRight" size={14} />
        </Link>
        <button
          type="button"
          className="-mr-2 grid h-11 w-11 shrink-0 place-items-center text-ink-2 hover:text-ink"
          aria-label="Dismiss announcement"
          onClick={() => { setHidden(true); try { localStorage.setItem(key, '1'); } catch { /* ignore */ } }}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
