import type { Badge, ProjectUpdate } from '@/lib/types';
import { statusLabel } from '@/lib/format';

/** Text + shape, never colour alone. Early stages use terracotta, the hero project night and brass; others are neutral. */
export function Badges({ badges, status, className = '' }: { badges: Badge[]; status?: string | null; className?: string }) {
  const list = badges.length ? badges : status ? [{ key: 'status', label: statusLabel(status), early: false, note: 'Listed status' }] : [];
  if (!list.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Stage">
      {list.map((b) => (
        <li key={b.key} title={b.note} className={`tag ${b.key === 'hero' ? 'tag-hero' : b.early ? 'tag-early' : ''}`}>
          {b.key === 'hero' ? <span aria-hidden>★</span> : <span aria-hidden className={b.early ? 'h-1.5 w-1.5 rotate-45 bg-signal' : 'h-1.5 w-1.5 rounded-full bg-ink-2'} />}
          {b.label}
          <span className="sr-only"> ({b.note})</span>
        </li>
      ))}
    </ul>
  );
}

/** Brass "what changed" line: newly listed, price confirmed, verified with the developer. Each one is dated. */
export function UpdateTags({ updates, className = '' }: { updates: ProjectUpdate[]; className?: string }) {
  if (!updates.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Recent updates">
      {updates.map((u) => (
        <li key={u.key} title={u.note} className="tag tag-brass">
          <span aria-hidden>{u.key === 'verified' ? '✓' : u.key === 'price' ? '₹' : '✦'}</span>
          {u.label}
          <span className="sr-only"> ({u.note})</span>
        </li>
      ))}
    </ul>
  );
}
