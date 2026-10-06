'use client';
import { useEffect, useRef } from 'react';
import type { Check } from '@/lib/data';
import { Icon } from '../Icon';

/**
 * One-line due-diligence summary at the top of a project page: confirmed items as chips, then a dropdown
 * menu (floating, not an inline pane) with everything still to verify or missing.
 */
export function VerificationPanel({ checks, className = '' }: { checks: Check[]; className?: string }) {
  const ok = checks.filter((c) => c.state === 'ok');
  const open = [...checks.filter((c) => c.state === 'caution'), ...checks.filter((c) => c.state === 'unknown')];
  const menu = useRef<HTMLDetailsElement>(null);

  // Close the menu on an outside click or Escape, like any dropdown.
  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.open = false; };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <section aria-label="Verification" className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="eyebrow mr-1">Verified</span>
      {ok.length ? ok.map((c) => (
        <span key={c.label} title={c.detail} className="tag border-brass bg-brass-soft text-ink">
          <Icon name="check" size={14} className="text-brass" />
          {c.label}
          <span className="sr-only">. {c.detail}</span>
        </span>
      )) : <span className="text-sm text-ink-2">Nothing confirmed yet</span>}

      {open.length > 0 && (
        <details ref={menu} className="group relative">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 px-1 text-sm font-medium text-ink underline decoration-brass underline-offset-4 hover:decoration-ink [&::-webkit-details-marker]:hidden">
            {open.length} to verify
            <Icon name="chevronDown" size={14} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="card absolute left-0 z-30 mt-2 w-[min(26rem,calc(100vw-2rem))] p-3 shadow-[0_18px_40px_-20px_rgba(14,22,38,.45)] sm:left-auto sm:right-0">
            <ul className="divide-y divide-rule">
              {open.map((c) => (
                <li key={c.label} className="grid grid-cols-[auto_1fr] gap-2 py-2">
                  <Icon name={c.state === 'caution' ? 'alert' : 'question'} size={15} className={`mt-0.5 ${c.state === 'caution' ? 'text-caution' : 'text-ink-2'}`} />
                  <div className="min-w-0 [overflow-wrap:anywhere]">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-ink-2">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </section>
  );
}
