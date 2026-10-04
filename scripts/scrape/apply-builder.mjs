// Apply builder-first corrections (data/verify/builder/<slug>.json) on top of the normalised data.
// Rule set by the site owner: when sources disagree, the builder's own published information wins.
// Every applied change keeps the previous value, the builder source and a quote in `p.corrections`,
// so the project page can show what changed and why. Re-scrapes cannot silently undo a correction.
import fs from 'node:fs';
import path from 'node:path';
import { normalizeStatus, parseBhk } from './parse.mjs';

// Third-party sources that must never be treated as "the builder", even if an agent cites them.
const NOT_BUILDER = /(^|\.)(99acres\.com|magicbricks\.com|housing\.com|squareyards\.com|nobroker\.in|proptiger\.com|realtycanvas\.in|luxuryroof\.com|reratracker\.com|youtube\.com|propertypistol\.com|houssed\.com|housiey\.com|commonfloor\.com|makaan\.com)$/i;
const YM = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

export function applyBuilderCorrections(projects, { dir, marketFor, log = console.log }) {
  if (!fs.existsSync(dir)) return { applied: 0, rejected: 0 };
  let applied = 0, rejected = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json') && !x.startsWith('_'))) {
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { log(`builder: ${f} unreadable (${e.message})`); continue; }
    const p = projects.find((x) => x.slug === doc.slug);
    if (!p) { log(`builder: ${doc.slug} not in dataset`); continue; }
    p.corrections = [];
    p.builderUnresolved = doc.unresolved ?? [];
    for (const c of doc.corrections ?? []) {
      let host = '';
      try { host = new URL(c.source).hostname.replace(/^www\./, ''); } catch { /* invalid URL */ }
      if (!host || (NOT_BUILDER.test(host) && c.sourceType !== 'rera-filing-by-developer')) { rejected++; log(`builder: rejected ${p.slug}.${c.field} — source ${host || c.source} is not the builder`); continue; }
      const before = read(p, c.field);
      const ok = write(p, c, marketFor);
      if (!ok) { rejected++; log(`builder: rejected ${p.slug}.${c.field} — value ${JSON.stringify(c.normalized)} not usable`); continue; }
      const after = read(p, c.field);
      if (JSON.stringify(before) === JSON.stringify(after)) continue; // builder confirms what we had
      p.corrections.push({ field: c.field, from: before, to: after, value: c.value, source: c.source, sourceType: c.sourceType, quote: c.quote, checkedAt: doc.checkedAt });
      p.provenance[c.field] = `builder:${c.sourceType}:${c.source}`;
      applied++;
    }
  }
  return { applied, rejected };
}

function read(p, field) {
  switch (field) {
    case 'possessionDate': return p.possessionDate;
    case 'reraCompletionDate': return p.reraCompletionDate ?? null;
    case 'startingPrice': return p.pricing.startingPriceInr;
    case 'reraNumber': return p.reraNumber;
    case 'additionalRera': return p.additionalRera ?? [];
    case 'units': return p.facts.units;
    case 'towers': return p.facts.towers;
    case 'floors': return p.facts.floors;
    case 'landArea': return p.facts.landAreaAcres;
    case 'developer': return p.developer.name;
    case 'sector': return p.location.sector;
    case 'locality': return p.location.locality;
    case 'status': return p.status;
    case 'configurations': return p.pricing.configurations.map((c) => `${c.label}${c.areaSqft ? ` ${c.areaSqft} sq ft` : ''}`);
    default: return undefined;
  }
}

function write(p, c, marketFor) {
  const v = c.normalized;
  const int = (x) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Math.round(Number(x)) : null);
  switch (c.field) {
    case 'possessionDate':
      if (typeof v !== 'string' || !YM.test(v)) return false;
      p.possessionDate = v; p.possessionDateRaw = c.value; return true;
    case 'reraCompletionDate':
      if (typeof v !== 'string' || !YM.test(v)) return false;
      p.reraCompletionDate = v; return true;
    case 'startingPrice': {
      const n = int(v); if (!n || n < 1e5) return false;
      p.pricing.startingPriceInr = n; p.pricing.priceMinInr = n; p.pricing.startingPriceRaw = c.value;
      if (p.pricing.unitSizeMinSqft) p.pricing.entryPricePerSqftInr = Math.round(n / p.pricing.unitSizeMinSqft);
      return true;
    }
    case 'reraNumber':
      if (typeof v !== 'string' || v.length < 5) return false;
      p.reraNumber = v.trim(); return true;
    case 'additionalRera':
      if (!Array.isArray(v) || !v.every((x) => typeof x === 'string')) return false;
      p.additionalRera = [...new Set(v.map((x) => x.trim()))].filter((x) => x && x !== p.reraNumber); return true;
    case 'units': case 'towers': case 'floors': {
      const n = int(v); if (!n) return false;
      p.facts[c.field] = n;
      if (p.facts.units && p.facts.landAreaAcres) p.facts.unitsPerAcre = +(p.facts.units / p.facts.landAreaAcres).toFixed(1);
      return true;
    }
    case 'landArea': {
      const n = Number(v); if (!(n > 0 && n < 2000)) return false;
      p.facts.landAreaAcres = +n.toFixed(2); p.facts.landAreaRaw = c.value;
      if (p.facts.units) p.facts.unitsPerAcre = +(p.facts.units / p.facts.landAreaAcres).toFixed(1);
      return true;
    }
    case 'developer':
      if (typeof v !== 'string' || !v.trim()) return false;
      p.developer.name = v.trim(); return true;
    case 'sector': {
      const sec = typeof v === 'string' ? v.trim().replace(/^sector[\s-]*/i, '') : '';
      if (!/^\d{1,3}[A-D]?$/i.test(sec)) return false;
      p.location.sector = sec.toUpperCase();
      const m = marketFor?.(p.location.sector, p.location.address, p.location.locality);
      if (m) p.location.microMarket = m.slug;
      return true;
    }
    case 'locality':
      if (typeof v !== 'string' || !v.trim()) return false;
      p.location.locality = v.trim(); return true;
    case 'status': {
      const s = normalizeStatus(v); if (!s) return false;
      p.status = s; p.statusRaw = c.value; return true;
    }
    case 'configurations': {
      if (!Array.isArray(v) || !v.length) return false;
      const rows = v.filter((r) => r && (r.label || r.bhk != null)).map((r) => ({
        label: r.label ?? (r.bhk != null ? `${r.bhk} BHK` : null),
        unitType: p.pricing.configurations[0]?.unitType ?? null,
        bhk: r.bhk ?? parseBhk(r.label),
        areaRaw: r.areaSqft ? `${Number(r.areaSqft).toLocaleString('en-IN')} sq ft${r.areaBasis && r.areaBasis !== 'unspecified' ? ` (${r.areaBasis})` : ''}` : null,
        areaSqft: int(r.areaSqft),
        areaBasis: r.areaBasis && r.areaBasis !== 'unspecified' ? `${r.areaBasis} area (developer)` : 'as published by the developer',
        priceRaw: 'Price on request', priceInr: null, pricePerSqftRaw: null, pricePerSqftInr: null, availability: null, features: null,
      }));
      if (!rows.length) return false;
      p.pricing.configurations = rows.sort((a, b) => (a.bhk ?? 99) - (b.bhk ?? 99) || (a.areaSqft ?? 0) - (b.areaSqft ?? 0));
      const areas = rows.map((r) => r.areaSqft).filter(Boolean);
      if (areas.length) { p.pricing.unitSizeMinSqft = Math.min(...areas); p.pricing.unitSizeMaxSqft = Math.max(...areas); }
      if (p.pricing.startingPriceInr && p.pricing.unitSizeMinSqft) p.pricing.entryPricePerSqftInr = Math.round(p.pricing.startingPriceInr / p.pricing.unitSizeMinSqft);
      return true;
    }
    default: return false;
  }
}
