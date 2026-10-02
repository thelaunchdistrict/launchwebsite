import { site } from '@/config/site';

/** Wordmark + a two-stroke "stoop" glyph: a falcon's dive drawn as a descending line meeting a rising one. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5l9 14 9-14" />
        <path d="M12 19V9" stroke="var(--signal)" />
      </svg>
      <span className="font-display text-[1.6rem] leading-none tracking-tight">{site.name}</span>
    </span>
  );
}
