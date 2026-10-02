'use client';
import { useState } from 'react';
import { Icon } from '../Icon';
import { useCompare, useShortlist } from '@/lib/shortlist';

export function CardActions({ slug, name, variant = 'icon' }: { slug: string; name: string; variant?: 'icon' | 'full' }) {
  const shortlist = useShortlist();
  const compare = useCompare();
  const [msg, setMsg] = useState('');
  const saved = shortlist.has(slug);
  const comparing = compare.has(slug);
  const onCompare = () => {
    const ok = compare.toggle(slug);
    setMsg(ok ? '' : 'You can compare up to 3 projects. Remove one first.');
  };
  const full = variant === 'full';
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={`btn btn-ghost ${full ? '' : 'btn-icon'}`}
        aria-pressed={saved}
        aria-label={full ? undefined : saved ? `Remove ${name} from shortlist` : `Save ${name} to shortlist`}
        onClick={() => shortlist.toggle(slug)}
      >
        <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} />
        {full && (saved ? 'Saved' : 'Save')}
      </button>
      <button
        type="button"
        className={`btn btn-ghost ${full ? '' : 'btn-icon'}`}
        aria-pressed={comparing}
        aria-label={full ? undefined : comparing ? `Remove ${name} from compare` : `Add ${name} to compare`}
        onClick={onCompare}
      >
        <Icon name="compare" />
        {full && (comparing ? 'Comparing' : 'Compare')}
      </button>
      <span role="status" aria-live="polite" className={msg ? 'absolute bottom-full right-0 mb-2 w-56 rounded-lg bg-ink p-2 text-xs text-paper' : 'sr-only'}>
        {msg}
      </span>
    </div>
  );
}
