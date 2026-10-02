// Pure parsing helpers (unit-tested in scripts/scrape/parse.test.mjs).

const CRORE = 1e7, LAKH = 1e5;

/** "₹3.5 Cr" → 35000000, "₹85 Lakh" → 8500000, "₹ 1,25,00,000" → 12500000. Returns null if no price. */
export function parseInr(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw).replace(/,/g, '').toLowerCase();
  if (/on request|request|tba|coming soon|n\/a/.test(s) && !/\d/.test(s)) return null;
  const m = s.match(/(\d+(?:\.\d+)?)\s*(crores?|cr\b|cr\.|lakhs?|lacs?|lac\b|l\b|k\b|thousand)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2] || '';
  if (/^cr/.test(unit)) return Math.round(n * CRORE);
  if (/^(lakh|lac|l$)/.test(unit)) return Math.round(n * LAKH);
  if (/^(k|thousand)/.test(unit)) return Math.round(n * 1000);
  return Math.round(n);
}

/** "₹1.2 Cr - ₹2.5 Cr" → {min, max}. A unit on the second number applies to the first if it has none. */
export function parseInrRange(raw) {
  if (!raw) return { min: null, max: null };
  const parts = String(raw).split(/\s*(?:-|–|—|to)\s*/i).filter(Boolean);
  if (parts.length < 2) { const v = parseInr(raw); return { min: v, max: null }; }
  const unitOf = (p) => (p.toLowerCase().match(/(crores?|cr|lakhs?|lacs?|lac|l\b)/) || [])[1] || '';
  const a = /\d/.test(parts[0]) ? (unitOf(parts[0]) ? parts[0] : `${parts[0]} ${unitOf(parts[1])}`) : null;
  return { min: a ? parseInr(a) : null, max: parseInr(parts[1]) };
}

/** Area string → square feet. Supports sq ft, sq yd, sq m, acres, hectares. */
export function parseAreaSqft(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw).replace(/,/g, '').toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|sq\.?\s*feet|square\s*feet|ft²|sq\.?\s*yd|sq\.?\s*yards?|square\s*yards?|gaj|sq\.?\s*m(?:t|tr|eters?|etres?)?\b|m²|acres?|hectares?|ha\b)?/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = (m[2] || 'sqft').replace(/\s|\./g, '');
  if (/^(sqyd|sqyard|squareyard|gaj)/.test(u)) return Math.round(n * 9);
  if (/^(sqm|m²)/.test(u)) return Math.round(n * 10.7639);
  if (/^acre/.test(u)) return Math.round(n * 43560);
  if (/^(hectare|ha)/.test(u)) return Math.round(n * 107639);
  return Math.round(n);
}

export function parseAcres(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/,/g, '').toLowerCase();
  const m = s.match(/(\d+(?:\.\d+)?)\s*(acres?|hectares?|ha\b|sq)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (/^acre/.test(m[2])) return n;
  if (/^(hectare|ha)/.test(m[2])) return +(n * 2.47105).toFixed(2);
  const sqft = parseAreaSqft(raw);
  return sqft ? +(sqft / 43560).toFixed(2) : null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/** "December 2028" → "2028-12", "Q2 2027" → "2027-06", "2029" → "2029". */
export function parseMonthYear(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  let m = s.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?\s*'?(\d{4}|\d{2})\b/);
  if (m) {
    const y = m[2].length === 2 ? `20${m[2]}` : m[2];
    return `${y}-${String(MONTHS.indexOf(m[1].slice(0, 3)) + 1).padStart(2, '0')}`;
  }
  m = s.match(/\bq([1-4])\s*,?\s*(?:fy\s*)?(\d{4})\b/);
  if (m) return `${m[2]}-${String(m[1] * 3).padStart(2, '0')}`;
  m = s.match(/\b(20[2-4]\d)\b/);
  if (m) return m[1];
  return null;
}

/** Find a possession date in free text (FAQs, descriptions). Returns {iso, raw} or null. */
export function findPossession(text) {
  if (!text) return null;
  const re = /possession[^.?!\n]{0,120}?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*\d{4}|q[1-4]\s*\d{4}|\b20[2-4]\d\b)/i;
  const m = text.match(re);
  if (!m) return null;
  return { iso: parseMonthYear(m[1]), raw: m[0].trim() };
}

export function findLaunch(text) {
  if (!text) return null;
  const m = text.match(/launch(?:ed)?\s+(?:in|on)\s+((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*\d{4}|\b20[12]\d\b)/i);
  return m ? { iso: parseMonthYear(m[1]), raw: m[0].trim() } : null;
}

/** "3BHK + SQ" → 3; "Studio" → 0; "4.5 BHK" → 4.5 */
export function parseBhk(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (/studio/.test(s)) return 0;
  const m = s.match(/(\d+(?:\.\d+)?)\s*-?\s*bhk/);
  return m ? parseFloat(m[1]) : null;
}

export function sectorFrom(...texts) {
  for (const t of texts) {
    if (!t) continue;
    const m = String(t).match(/sector[-\s]*(\d{1,3}[a-d]?)\b/i);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

export const STATUS_MAP = {
  PRE_LAUNCH: 'pre-launch', PRELAUNCH: 'pre-launch', UPCOMING: 'pre-launch', COMING_SOON: 'pre-launch',
  NEW_LAUNCH: 'new-launch', LAUNCHED: 'new-launch', NEWLY_LAUNCHED: 'new-launch',
  UNDER_CONSTRUCTION: 'under-construction', ONGOING: 'under-construction',
  READY_TO_MOVE: 'ready', READY: 'ready', COMPLETED: 'ready', READY_TO_MOVE_IN: 'ready', DELIVERED: 'ready',
};
export function normalizeStatus(raw) {
  if (!raw) return null;
  const k = String(raw).toUpperCase().replace(/[\s-]+/g, '_');
  return STATUS_MAP[k] || null;
}

export function normalizeType(category, type, unitTypes = [], text = '') {
  const all = [category, type, ...unitTypes, text].filter(Boolean).join(' ').toLowerCase();
  if (/\bsco\b|shop[-\s]cum[-\s]office/.test(all)) return 'sco';
  if (/\bplots?\b/.test(String(type || '') + ' ' + unitTypes.join(' ').toLowerCase()) || /plot/.test(String(category || '').toLowerCase())) return 'plots';
  if (/villa/.test(String(type || '') + ' ' + unitTypes.join(' ').toLowerCase())) return 'villas';
  if (/builder\s*floor|independent\s*floor|\bfloors\b/.test(String(type || '') + ' ' + unitTypes.join(' ').toLowerCase())) return 'floors';
  if (/commercial|retail|office/.test(String(category || '').toLowerCase())) return 'commercial';
  if (/residential|apartment/.test(all)) return 'residential';
  return null;
}

/** Strip the decorative suffix from realtycanvas titles: "Sobha Aranya – Residential Development in …" → "Sobha Aranya". */
export function projectName(p) {
  const fromAbout = p.aboutTitle && p.aboutTitle.match(/^(?:project overview|about)\s*[–—-]\s*(.+)$/i);
  const raw = fromAbout ? fromAbout[1] : String(p.title || '').split(/\s+[–—|-]\s+/)[0];
  return cleanName(raw) || null;
}

/** Drop location/marketing suffixes: "Elan The Statement , Sector 49, Sohna Road Gurgaon" → "Elan The Statement". */
export function cleanName(s) {
  let n = String(s || '').replace(/\s+/g, ' ').trim();
  n = n.replace(/\s*,\s*.*\b(sector|expressway|road|gurgaon|gurugram)\b.*$/i, '');
  n = n.replace(/\s*:\s*.{10,}$/, '');
  n = n.replace(/\s+(?:in|at)\s+sector.*$/i, '');
  n = n.replace(/\s+sector[-\s]*\d+[a-d]?$/i, '');
  n = n.replace(/\s+(gurgaon|gurugram)$/i, '');
  return n.trim();
}
