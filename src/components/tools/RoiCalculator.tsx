'use client';
import { useEffect, useMemo, useState } from 'react';
import { computeRoi, ROI_DEFAULTS, type RoiInput } from '@/lib/finance';
import { inr, inrFull, pct } from '@/lib/format';

type Field = { key: keyof RoiInput; label: string; min: number; max: number; step: number; unit: 'inr' | '%' | 'yrs'; help?: string };

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'Entry',
    fields: [
      { key: 'price', label: 'Entry price', min: 2_000_000, max: 200_000_000, step: 500_000, unit: 'inr' },
      { key: 'buyCostsPct', label: 'Stamp duty, registration & other buy costs', min: 0, max: 12, step: 0.5, unit: '%', help: 'Haryana stamp duty is roughly 5–7% of the price, depending on the buyer. Add registration and legal fees.' },
    ],
  },
  {
    title: 'Holding',
    fields: [
      { key: 'holdYears', label: 'Holding period', min: 1, max: 15, step: 0.5, unit: 'yrs' },
      { key: 'appreciationPct', label: 'Assumed appreciation per year', min: -5, max: 20, step: 0.5, unit: '%', help: 'This is an assumption, not a forecast. Try a pessimistic case too.' },
      { key: 'rentStartsYears', label: 'Rent starts after (possession)', min: 0, max: 8, step: 0.5, unit: 'yrs' },
      { key: 'rentalYieldPct', label: 'Gross rental yield', min: 0, max: 8, step: 0.25, unit: '%', help: 'Gurugram residential gross yields have typically run at about 2–4%.' },
      { key: 'rentCostsPct', label: 'Vacancy, maintenance & tax on rent', min: 0, max: 50, step: 1, unit: '%' },
    ],
  },
  {
    title: 'Loan',
    fields: [
      { key: 'loanPct', label: 'Loan as % of price', min: 0, max: 90, step: 5, unit: '%', help: 'Set to 0 for an all-cash purchase.' },
      { key: 'loanRatePct', label: 'Interest rate', min: 5, max: 14, step: 0.05, unit: '%' },
      { key: 'loanYears', label: 'Tenure', min: 5, max: 30, step: 1, unit: 'yrs' },
    ],
  },
  { title: 'Exit', fields: [{ key: 'exitCostsPct', label: 'Brokerage & costs on sale', min: 0, max: 6, step: 0.5, unit: '%' }] },
];

const fmt = (f: Field, v: number) => (f.unit === 'inr' ? inr(v) : f.unit === '%' ? `${v}%` : `${v} yrs`);

export function RoiCalculator() {
  const [i, setI] = useState<RoiInput>(ROI_DEFAULTS);
  // Prefill from ?price=&years=&rent= (links from project pages) after mount, keeping the page static.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const n = (k: string) => (sp.get(k) && !isNaN(Number(sp.get(k))) && Number(sp.get(k)) > 0 ? Number(sp.get(k)) : null);
    if (![...sp.keys()].length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    setI((s) => ({ ...s, price: n('price') ?? s.price, holdYears: n('years') ?? s.holdYears, rentStartsYears: sp.get('rent') != null ? Number(sp.get('rent')) || 0 : s.rentStartsYears }));
  }, []);
  const r = useMemo(() => computeRoi(i), [i]);
  const bear = useMemo(() => computeRoi({ ...i, appreciationPct: i.appreciationPct - 4 }), [i]);
  const set = (k: keyof RoiInput, v: number) => setI((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()} aria-label="Assumptions">
        {GROUPS.map((g) => (
          <fieldset key={g.title} className="space-y-5">
            <legend className="eyebrow mb-1 w-full border-b border-ink pb-2">{g.title}</legend>
            {g.fields.map((f) => (
              <div key={f.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={`roi-${f.key}`} className="text-sm font-medium">{f.label}</label>
                  {f.unit === 'inr' ? (
                    <input
                      aria-label={`${f.label} in rupees`}
                      className="field num w-40 py-1 text-right text-sm"
                      inputMode="numeric"
                      value={i[f.key].toLocaleString('en-IN')}
                      onChange={(e) => { const v = Number(e.target.value.replace(/[^\d]/g, '')); if (!isNaN(v)) set(f.key, v); }}
                    />
                  ) : (
                    <output htmlFor={`roi-${f.key}`} className="num text-sm">{fmt(f, i[f.key])}</output>
                  )}
                </div>
                <input
                  id={`roi-${f.key}`}
                  type="range"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={Math.min(f.max, Math.max(f.min, i[f.key]))}
                  onChange={(e) => set(f.key, Number(e.target.value))}
                  aria-valuetext={fmt(f, i[f.key])}
                  aria-describedby={f.help ? `roi-${f.key}-help` : undefined}
                  className="mt-2 h-11 w-full cursor-pointer accent-[var(--signal)]"
                />
                {f.help && <p id={`roi-${f.key}-help`} className="text-xs text-ink-2">{f.help}</p>}
              </div>
            ))}
          </fieldset>
        ))}
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <section aria-labelledby="roi-results" className="card p-5 md:p-6" aria-live="polite">
          <h2 id="roi-results" className="eyebrow">Result over {i.holdYears} years</h2>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border hairline bg-rule">
            <Big label="Annualised return (IRR)" value={r.irr != null ? pct(r.irr) : '—'} tone={r.irr != null && r.irr < 0 ? 'neg' : 'pos'} />
            <Big label="Net profit" value={inr(r.profit)} title={inrFull(r.profit)} tone={r.profit < 0 ? 'neg' : 'pos'} />
            <Big label="Money multiple" value={`${r.multiple.toFixed(2)}×`} />
            <Big label="Cash you put in" value={inr(r.totalCashIn)} title={inrFull(r.totalCashIn)} />
          </div>
          <ValueChart r={r} years={i.holdYears} />
          <table className="ledger mt-4 text-sm">
            <caption className="sr-only">Cash-flow breakdown</caption>
            <tbody>
              <Row k="Equity at entry (down payment + buy costs)" v={r.equityAtEntry} />
              {r.emi > 0 && <Row k={`EMIs paid (${inr(r.emi)}/month)`} v={r.totalEmiPaid} />}
              {r.emi > 0 && <Row k="… of which interest" v={r.interestPaid} muted />}
              <Row k="Net rent received" v={r.rentNet} />
              <Row k="Sale price at exit" v={r.salePrice} />
              <Row k="Exit costs" v={-r.exitCosts} />
              {r.loanOutstanding > 0 && <Row k="Loan repaid at exit" v={-r.loanOutstanding} />}
              <Row k="Net sale proceeds" v={r.netSaleProceeds} strong />
            </tbody>
          </table>
          <p className="mt-4 rounded-[12px] bg-sunk p-3 text-sm">
            <span className="font-medium">Stress test:</span> at {i.appreciationPct - 4}% appreciation a year, the IRR would be <span className="num">{bear.irr != null ? pct(bear.irr) : '—'}</span> and the profit <span className="num">{inr(bear.profit)}</span>.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-ink-2">
            Illustrative only, not financial advice. Simplified model: the loan is assumed fully disbursed at entry (actual construction-linked disbursement and pre-EMI interest differ), rent grows with value, and there is no tax on capital gains. Returns are not guaranteed. Verify every input with your advisor and the developer’s cost sheet.
          </p>
        </section>
      </div>
    </div>
  );
}

function Big({ label, value, title, tone }: { label: string; value: string; title?: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="bg-raised p-4">
      <p className="text-xs text-ink-2">{label}</p>
      <p className={`num mt-1 text-2xl md:text-3xl ${tone === 'neg' ? 'text-signal' : tone === 'pos' ? 'text-positive' : ''}`} title={title}>{value}</p>
    </div>
  );
}

function Row({ k, v, strong, muted }: { k: string; v: number; strong?: boolean; muted?: boolean }) {
  return (
    <tr>
      <th scope="row" className={`py-2 text-left font-normal ${muted ? 'pl-4 text-ink-2' : ''}`}>{k}</th>
      <td className={`n py-2 ${strong ? 'font-semibold' : ''} ${muted ? 'text-ink-2' : ''}`} title={inrFull(v)}>{inr(v)}</td>
    </tr>
  );
}

/** Property value vs outstanding loan by year, with the equity gap shaded. */
function ValueChart({ r, years }: { r: ReturnType<typeof computeRoi>; years: number }) {
  const W = 520, H = 180, P = { l: 52, r: 12, t: 12, b: 24 };
  const max = Math.max(...r.path.map((p) => p.value)) * 1.05;
  const x = (y: number) => P.l + (y / years) * (W - P.l - P.r);
  const y = (v: number) => H - P.b - (v / max) * (H - P.t - P.b);
  const val = r.path.map((p) => `${x(p.year)},${y(p.value)}`).join(' ');
  const loan = r.path.map((p) => `${x(p.year)},${y(p.loan)}`).join(' ');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => max * k);
  const first = r.path[0], last = r.path[r.path.length - 1];
  const summary = `Property value grows from ${inr(first.value)} to ${inr(last.value)} over ${years} years${r.loanOutstanding > 0 ? `; the loan falls from ${inr(first.loan)} to ${inr(last.loan)}` : ''}.`;
  return (
    <figure className="mt-5">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text x={P.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--ink-2)" fontFamily="var(--font-sans)">{inr(t)}</text>
          </g>
        ))}
        {r.path.filter((p) => Number.isInteger(p.year)).map((p) => (
          <text key={p.year} x={x(p.year)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--ink-2)" fontFamily="var(--font-sans)">Y{p.year}</text>
        ))}
        <polygon points={`${val} ${[...r.path].reverse().map((p) => `${x(p.year)},${y(p.loan)}`).join(' ')}`} fill="var(--signal-soft)" />
        <polyline points={val} fill="none" stroke="var(--signal)" strokeWidth="2.5" />
        {r.loanOutstanding > 0 || r.path.some((p) => p.loan > 0) ? <polyline points={loan} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 3" /> : null}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4 bg-signal" /> Property value</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0 w-4 border-t border-dashed border-ink" /> Loan outstanding</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-4 bg-signal-soft" /> Your equity</span>
      </figcaption>
    </figure>
  );
}
