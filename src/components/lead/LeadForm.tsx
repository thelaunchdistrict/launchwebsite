'use client';
import { useId, useState } from 'react';
import { site } from '@/config/site';
import { track } from '@/lib/track';
import { WhatsAppLink } from './WhatsAppLink';

type Errors = Partial<Record<'name' | 'phone' | 'consent' | 'form', string>>;

/**
 * Progressive two-step lead form (interest first, then contact) — lower friction than a seven-field
 * wall, and the first step already qualifies the lead.
 */
export function LeadForm({
  projects = [],
  defaultProject,
  heading = 'Request early-access pricing',
  compact = false,
  source = 'site',
}: {
  projects?: { slug: string; name: string }[];
  defaultProject?: { slug: string; name: string };
  heading?: string;
  compact?: boolean;
  source?: string;
}) {
  const id = useId();
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [v, setV] = useState({
    project: defaultProject?.slug ?? '',
    budget: '',
    timeline: '',
    name: '',
    phone: '',
    consent: false,
    company: '', // honeypot
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const projectName = defaultProject?.name ?? projects.find((p) => p.slug === v.project)?.name;

  function validate(): Errors {
    const e: Errors = {};
    if (v.name.trim().length < 2) e.name = 'Enter your name.';
    const digits = v.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (!v.consent) e.consent = 'Please agree so we can contact you.';
    return e;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (step === 1) { setStep(2); return; }
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${id}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...v, projectName, source, page: location.pathname }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Something went wrong.');
      track('generate_lead', { project: v.project || 'general', budget: v.budget });
      setStep('done');
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Something went wrong. Please try WhatsApp instead.' });
    } finally {
      setBusy(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <p className="h3">Thanks — you’re on the list.</p>
        <p className="text-sm text-ink-2">
          An advisor will call within one working day{projectName ? ` with the current price sheet for ${projectName}` : ''}. Prefer chat?
        </p>
        <WhatsAppLink projectName={projectName} className="btn btn-ghost" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-describedby={`${id}-desc`}>
      {heading && <h2 className={compact ? 'h3' : 'h2'}>{heading}</h2>}
      <p id={`${id}-desc`} className="text-sm text-ink-2">
        Step {step} of 2 · {step === 1 ? 'What are you looking for?' : 'Where can we reach you?'}
      </p>

      <div className={step === 1 ? 'space-y-4' : 'hidden'}>
        {!defaultProject && projects.length > 0 && (
          <div>
            <label className="label" htmlFor={`${id}-project`}>Project of interest</label>
            <select id={`${id}-project`} className="field" value={v.project} onChange={set('project')}>
              <option value="">Open to suggestions</option>
              {projects.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
          <div>
            <label className="label" htmlFor={`${id}-budget`}>Budget</label>
            <select id={`${id}-budget`} className="field" value={v.budget} onChange={set('budget')}>
              <option value="">Select a range</option>
              {site.leads.budgets.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`${id}-timeline`}>Timeline</label>
            <select id={`${id}-timeline`} className="field" value={v.timeline} onChange={set('timeline')}>
              <option value="">Select timeline</option>
              {site.leads.timelines.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor={`${id}-name`}>Name</label>
            <input id={`${id}-name`} className="field" autoComplete="name" value={v.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${id}-name-err` : undefined} />
            {errors.name && <p id={`${id}-name-err`} className="mt-1 text-sm text-signal">⚠ {errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor={`${id}-phone`}>Mobile</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-[10px] border border-r-0 border-rule-strong bg-sunk px-3 text-ink-2 num" aria-hidden>+91</span>
              <input id={`${id}-phone`} className="field rounded-l-none" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98xxxxxxxx" value={v.phone} onChange={set('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-phone-err` : undefined} />
            </div>
            {errors.phone && <p id={`${id}-phone-err`} className="mt-1 text-sm text-signal">⚠ {errors.phone}</p>}
          </div>
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input id={`${id}-consent`} type="checkbox" className="mt-1 h-5 w-5 accent-[var(--signal)]" checked={v.consent} onChange={set('consent')} aria-invalid={!!errors.consent} />
            <span>
              I agree to be contacted by {site.name} about this enquiry by phone or WhatsApp. See the <a className="link" href="/privacy">privacy policy</a>.
              {errors.consent && <span className="mt-1 block text-signal">⚠ {errors.consent}</span>}
            </span>
          </label>
          <div className="hidden" aria-hidden>
            <label>Company <input tabIndex={-1} autoComplete="off" value={v.company} onChange={set('company')} /></label>
          </div>
        </div>
      )}

      {errors.form && <p role="alert" className="text-sm text-signal">⚠ {errors.form}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {step === 2 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {step === 1 ? 'Continue' : busy ? 'Sending…' : 'Get early-access pricing'}
        </button>
      </div>
      <p className="text-xs text-ink-2">No spam. We never share your number with developers without asking.</p>
    </form>
  );
}
