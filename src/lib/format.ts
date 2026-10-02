const CR = 1e7;
const L = 1e5;

/** ₹ in lakh/crore shorthand: 35000000 → "₹3.5 Cr", 8500000 → "₹85 L". */
export function inr(n: number | null | undefined, { precise = false } = {}): string {
  if (n == null || !isFinite(n)) return '—';
  const sign = n < 0 ? '−' : '';
  const v = Math.abs(n);
  if (v >= CR) return `${sign}₹${trim(v / CR, precise ? 2 : v >= 10 * CR ? 1 : 2)} Cr`;
  if (v >= L) return `${sign}₹${trim(v / L, precise ? 2 : 1)} L`;
  return `${sign}₹${Math.round(v).toLocaleString('en-IN')}`;
}

/** Full rupee figure with Indian digit grouping: "₹3,50,00,000". */
export function inrFull(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return 'not published';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function psf(n: number | null | undefined): string {
  if (n == null) return '—';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function sqft(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${Math.round(n).toLocaleString('en-IN')} sq ft`;
}

function trim(v: number, dp: number) {
  return v.toFixed(dp).replace(/\.?0+$/, '');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2028-12" → "Dec 2028"; "2028" → "2028". */
export function monthYear(iso: string | null | undefined, long = false): string {
  if (!iso) return '—';
  const [y, m] = iso.split('-');
  if (!m) return y;
  return `${(long ? MONTHS_LONG : MONTHS)[Number(m) - 1]} ${y}`;
}

export function pct(n: number | null | undefined, dp = 1): string {
  if (n == null || !isFinite(n)) return '—';
  return `${(n * 100).toFixed(dp)}%`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function bhkLabel(b: number) {
  return b === 0 ? 'Studio' : `${b} BHK`;
}

export function typeLabel(t: string | null) {
  return (
    { residential: 'Residential', commercial: 'Commercial', plots: 'Plots', sco: 'SCO', villas: 'Villas', floors: 'Builder floors', township: 'Township' } as Record<string, string>
  )[t ?? ''] ?? 'Not specified';
}

export function statusLabel(s: string | null) {
  return (
    { 'pre-launch': 'Pre-launch', 'new-launch': 'New launch', 'under-construction': 'Under construction', ready: 'Ready to move' } as Record<string, string>
  )[s ?? ''] ?? 'Not published';
}

export function median(xs: number[]): number | null {
  const a = xs.filter((x) => x != null && isFinite(x)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Strip bullet characters and split templated copy into paragraphs. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/\n+/).map((s) => s.replace(/^[•\-•]\s*/, '').trim()).filter(Boolean);
}

/** "Jun 2026 – May 2032"; collapses to one value when both ends are equal. */
export function monthRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from) return '—';
  if (!to || from === to) return monthYear(from);
  return `${monthYear(from)} – ${monthYear(to)}`;
}
