import type { Badge } from '@/lib/types';
import { statusLabel } from '@/lib/format';

/** Text + shape, never colour alone. Early badges use the signal accent; others are neutral. */
export function Badges({ badges, status, className = '' }: { badges: Badge[]; status?: string | null; className?: string }) {
  const list = badges.length ? badges : status ? [{ key: 'status', label: statusLabel(status), early: false, note: 'Listed status' }] : [];
  if (!list.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Stage">
      {list.map((b) => (
        <li
          key={b.key}
          title={b.note}
          className={`chip ${b.early ? 'border-signal bg-signal-soft text-ink' : 'bg-raised text-ink-2'}`}
        >
          <span aria-hidden className={b.early ? 'h-1.5 w-1.5 rotate-45 bg-signal' : 'h-1.5 w-1.5 rounded-full bg-ink-2'} />
          {b.label}
          <span className="sr-only"> ({b.note})</span>
        </li>
      ))}
    </ul>
  );
}
