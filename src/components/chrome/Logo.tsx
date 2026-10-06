import { site } from '@/config/site';

/** Wordmark + glyph: a low skyline (the district) with one signal arrow rising through it (the launch). */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M6.5 21v-7M17.5 21v-9" />
        <path d="M12 21V4M8.5 7.5 12 4l3.5 3.5" stroke="var(--signal)" />
      </svg>
      <span className="whitespace-nowrap font-display text-[1.15rem] leading-none tracking-[0.005em] sm:text-[1.55rem]">{site.name}</span>
    </span>
  );
}
