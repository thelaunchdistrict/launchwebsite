import type { Check } from '@/lib/data';
import { Icon } from '../Icon';

/**
 * Compact due-diligence summary for the top of a project page: what is confirmed from published sources as
 * chips, and a dropdown with everything still to verify (needs a check, or the source does not say).
 * Each confirmed chip carries its detail as a tooltip and for screen readers.
 */
export function VerificationPanel({ checks, verifiedOn, className = '' }: { checks: Check[]; verifiedOn?: string | null; className?: string }) {
  const ok = checks.filter((c) => c.state === 'ok');
  const caution = checks.filter((c) => c.state === 'caution');
  const unknown = checks.filter((c) => c.state === 'unknown');
  const open = [...caution, ...unknown];
  return (
    <section aria-labelledby="verify-h" className={`card p-4 md:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="verify-h" className="eyebrow">Verification</h2>
        <p className="flex items-center gap-3 text-sm text-ink-2">
          <span className="flex gap-1" aria-hidden>
            {[...ok, ...caution, ...unknown].map((c, i) => <span key={i} className={`h-1.5 w-4 rounded-full ${c.state === 'ok' ? 'bg-brass' : c.state === 'caution' ? 'bg-caution' : 'bg-rule-strong'}`} />)}
          </span>
          <span><span className="num text-ink">{ok.length}</span> of {checks.length} confirmed{verifiedOn ? ` · developer facts checked ${verifiedOn}` : ''}</span>
        </p>
      </div>

      {ok.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {ok.map((c) => (
            <li key={c.label} title={c.detail} className="tag border-brass bg-brass-soft text-ink">
              <Icon name="check" size={14} className="text-brass" />
              {c.label}
              <span className="sr-only">. {c.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-2">Nothing here is confirmed from a published source yet. Ask for the items below before you commit.</p>
      )}

      {open.length > 0 && (
        <details className="group mt-3 border-t hairline pt-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>
              <span className="num">{open.length}</span> still to verify or missing
              {caution.length > 0 && <span className="ml-2 text-caution">{caution.length} to check</span>}
            </span>
            <Icon name="chevronDown" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-1 divide-y divide-rule">
            {open.map((c) => (
              <li key={c.label} className="grid grid-cols-[auto_1fr] gap-2.5 py-2.5">
                <Icon name={c.state === 'caution' ? 'alert' : 'question'} size={16} className={`mt-1 ${c.state === 'caution' ? 'text-caution' : 'text-ink-2'}`} />
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <p className="text-sm font-medium">
                    {c.label}
                    <span className="ml-2 text-xs font-normal text-ink-2">{c.state === 'caution' ? 'Needs a check' : 'Not published'}</span>
                  </p>
                  <p className="text-sm text-ink-2">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-2">For information only, built from what is published. Confirm each item with the developer and on the state RERA portal.</p>
        </details>
      )}
    </section>
  );
}
