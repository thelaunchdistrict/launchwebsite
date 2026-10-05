'use client';
import { useEffect, useState } from 'react';

type Mode = 'system' | 'light' | 'dark';

function applyTheme(m: Mode) {
  const root = document.documentElement;
  try {
    if (m === 'light') { localStorage.removeItem('tld-theme'); root.removeAttribute('data-theme'); }
    else { localStorage.setItem('tld-theme', m); root.setAttribute('data-theme', m); }
  } catch {
    // Storage unavailable: still apply for this page view.
    if (m === 'light') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', m);
  }
}

/** Appearance override. Default is Light; visitors can switch to Dark or follow their System setting. Lives in the footer. */
export function ThemeSwitch() {
  const [mode, setMode] = useState<Mode>('light');
  useEffect(() => {
    try {
      const t = localStorage.getItem('tld-theme');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted preference after hydration
      if (t === 'system' || t === 'dark') setMode(t);
    } catch { /* ignore */ }
  }, []);
  const set = (m: Mode) => {
    setMode(m);
    applyTheme(m);
  };
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">Appearance</legend>
      <span className="text-sm text-ink-2" aria-hidden>Appearance</span>
      <div className="inline-flex rounded-full border hairline p-0.5">
        {(['light', 'dark', 'system'] as Mode[]).map((m) => (
          <label key={m} className={`cursor-pointer rounded-full px-3 py-2 text-sm capitalize min-h-11 flex items-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus ${mode === m ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'}`}>
            <input type="radio" name="theme" value={m} checked={mode === m} onChange={() => set(m)} className="sr-only" />
            {m}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
