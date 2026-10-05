'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ProjectSummary } from '@/lib/types';
import { apply, BUDGETS, EMPTY, toParams, type Filters, type SortKey } from '../listing/filters';
import { inr, monthYear } from '@/lib/format';
import { track } from '@/lib/track';
import { Icon } from '../Icon';

type Goal = 'growth' | 'income' | 'home';
const GOALS: { key: Goal; label: string; hint: string }[] = [
  { key: 'growth', label: 'Capital growth', hint: 'Enter early, exit after possession' },
  { key: 'income', label: 'Rental income', hint: 'Possession sooner, rent sooner' },
  { key: 'home', label: 'A home to live in', hint: 'The right address, on a clear timeline' },
];
const HORIZONS = [
  { label: 'Within 2 years', years: 2 },
  { label: 'In 2–4 years', years: 4 },
  { label: 'I can wait longer', years: null },
];

/**
 * Three taps to a personal shortlist. Answers become ordinary listing filters (so the result is shareable)
 * and the matches shown are real projects. The ask for contact details comes only after the visitor has value.
 */
export function FindYourEntry({ projects }: { projects: ProjectSummary[] }) {
  const [step, setStep] = useState(0);
  const [budget, setBudget] = useState<number | null>(null);
  const [horizon, setHorizon] = useState<number | null | undefined>(undefined);
  const [goal, setGoal] = useState<Goal | null>(null);

  const result = useMemo(() => {
    if (step < 3 || budget == null || horizon === undefined || !goal) return null;
    const b = BUDGETS[budget];
    const f: Filters = { ...EMPTY, budgetMin: b.min, budgetMax: b.max, early: goal === 'growth', possessionBy: horizon == null ? null : new Date().getFullYear() + horizon };
    const sort: SortKey = goal === 'growth' ? 'recommended' : 'possession-asc';
    const list = apply(projects, f, sort);
    return { list, href: `/projects${toParams(f, sort, 'grid')}` };
  }, [step, budget, horizon, goal, projects]);

  const choose = (fn: () => void) => { fn(); setStep((s) => s + 1); };
  const Q = ['What is your budget?', 'When would you like possession?', 'What matters most?'];
  const option = (label: string, hint: string | null, on: () => void, key: string) => (
    <button key={key} type="button" onClick={on} className="card group flex min-h-16 items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-ink">
      <span>
        <span className="block">{label}</span>
        {hint && <span className="block text-sm text-ink-2">{hint}</span>}
      </span>
      <Icon name="arrowRight" size={16} className="shrink-0 text-ink-2 transition-transform group-hover:translate-x-1 group-hover:text-ink" />
    </button>
  );

  return (
    <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="eyebrow">Find your entry point</p>
        <h2 id="find" className="h2 mt-2">Three questions. Your shortlist.</h2>
        <p className="mt-3 text-ink-2">Answer three questions and see the projects that fit, drawn from the {projects.length} we track. No sign-up needed to see the results.</p>
        <div className="mt-5 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className={`h-1 w-10 rounded-full transition-colors duration-500 ${i < step ? 'bg-brass' : 'bg-rule'}`} />)}
        </div>
      </div>

      <div aria-live="polite">
        {step < 3 && (
          <fieldset>
            <legend className="mb-3 flex w-full items-baseline justify-between gap-3">
              <span className="font-display text-2xl">{Q[step]}</span>
              <span className="num shrink-0 text-sm text-ink-2">{step + 1} / 3</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {step === 0 && BUDGETS.slice(1).map((b, i) => option(b.label, null, () => choose(() => setBudget(i + 1)), b.label))}
              {step === 1 && HORIZONS.map((h) => option(h.label, null, () => choose(() => setHorizon(h.years)), h.label))}
              {step === 2 && GOALS.map((g) => option(g.label, g.hint, () => choose(() => { setGoal(g.key); track('quiz_complete', { goal: g.key }); }), g.key))}
            </div>
            {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="cta-line mt-3">Back</button>}
          </fieldset>
        )}

        {result && (
          <div>
            <p className="font-display text-2xl">
              {result.list.length ? <><span className="num">{result.list.length}</span> {result.list.length === 1 ? 'project fits' : 'projects fit'} your brief</> : 'Nothing fits exactly yet'}
            </p>
            {result.list.length > 0 ? (
              <ul className="mt-4 divide-y divide-rule border-y hairline">
                {result.list.slice(0, 3).map((p) => (
                  <li key={p.slug}>
                    <Link href={`/projects/${p.slug}`} className="flex min-h-14 items-center justify-between gap-3 py-3 hover:text-signal">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-lg">{p.name}</span>
                        <span className="block text-sm text-ink-2">{p.locationLabel ?? p.marketName ?? ''}</span>
                      </span>
                      <span className="num shrink-0 text-right text-sm">
                        {p.priceFrom ? inr(p.priceFrom) : 'On request'}
                        <span className="block text-ink-2">{p.possession ? `Possession ${monthYear(p.possession)}` : ''}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-ink-2">Try a longer timeline or the next budget band. New launches are added as they are verified.</p>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {result.list.length > 0 && <a href="#early-access" className="btn btn-primary">Send me these price sheets <Icon name="arrowRight" size={16} /></a>}
              <Link href={result.href} className="cta-line">See all matches <Icon name="arrowRight" size={16} /></Link>
              <button type="button" onClick={() => { setStep(0); setBudget(null); setHorizon(undefined); setGoal(null); }} className="cta-line">Start again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
