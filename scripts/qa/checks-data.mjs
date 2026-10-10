// Data-fidelity and cross-page consistency checks: what the page says vs what data/projects.json says,
// and whether numbers agree with each other across pages.
import { inr, monthYear } from '../../src/lib/format.ts';

const f = (sev, check, msg, page, evidence = '') => ({ sev, cat: 'Data consistency', check, msg, page, evidence });

export function projectPageChecks(path, r, p) {
  const out = [];
  const text = r.blocks.map((b) => b.text).join('\n');
  const h1 = r.headings.find((h) => h.level === 1)?.text;
  if (h1 !== p.name) out.push(f('error', 'D01 name', `H1 "${h1}" ≠ data name "${p.name}"`, path));
  if (p.pricing.startingPriceInr && !text.includes(inr(p.pricing.startingPriceInr))) out.push(f('error', 'D02 price', `Starting price ${inr(p.pricing.startingPriceInr)} not shown`, path));
  if (p.reraNumber && !text.includes(p.reraNumber)) out.push(f('error', 'D03 RERA', `RERA ${p.reraNumber} not shown`, path));
  if (p.possessionDate && !text.includes(monthYear(p.possessionDate))) out.push(f('error', 'D04 possession', `Possession ${monthYear(p.possessionDate)} not shown`, path));
  if (p.developer.name && !text.includes(p.developer.name)) out.push(f('warn', 'D05 developer', `Developer "${p.developer.name}" not shown`, path));
  const faqs = r.blocks.filter((b) => /summary/i.test(b.where)).length;
  if (p.content.faqs.length && faqs < p.content.faqs.length) out.push(f('warn', 'D06 FAQs', `${faqs} FAQ summaries rendered, data has ${p.content.faqs.length}`, path));
  // Source-data sanity that users will see
  // Source-data problems are acceptable only if the page tells the reader about them.
  if (p.status === 'under-construction' && p.possessionDate && p.possessionDate < new Date().toISOString().slice(0, 7)) {
    const flagged = /has passed/.test(text);
    out.push(f(flagged ? 'info' : 'error', 'D07 stale possession', `Under construction but stated possession ${monthYear(p.possessionDate)} has passed${flagged ? ' — page flags it under the status line' : ' and the page does not say so'}`, path));
  }
  const areas = {};
  p.pricing.configurations.forEach((c) => { if (c.areaSqft) (areas[c.areaSqft] ||= new Set()).add(c.bhk); });
  Object.entries(areas).filter(([, s]) => s.size > 1).forEach(([a, s]) => {
    const flagged = /same area for different configurations/i.test(text);
    out.push(f(flagged ? 'info' : 'warn', 'D08 config table', `Source lists ${a} sq ft for both ${[...s].map((b) => `${b} BHK`).join(' and ')}${flagged ? ' — page shows a verification note' : ' and the page does not warn the reader'}`, path));
  });
  if (p.name && /\b(gurgaon|gurugram|sector \d+)\b/i.test(p.name)) out.push(f('warn', 'D09 name contains location', `Project name "${p.name}" still carries a location suffix`, path));
  if (p.name && /\b[a-z]+\b/.test(p.name.split(' ').slice(-1)[0]) && /\b(Dlf|Tarc|Aipl|Bptp|Spj)\b/.test(p.name)) out.push(f('info', 'D10 brand casing', `"${p.name}" — developer acronym not in capitals`, path));
  return out;
}

export function crossPageChecks(results, allRows) {
  // Superseded listings keep a page but are intentionally left out of every list and count.
  const projects = allRows.filter((p) => !p.supersededBy);
  const out = [];
  const total = projects.length;
  const home = results.get('/');
  if (home?.extra?.stats) {
    const [tracked] = home.extra.stats;
    if (tracked !== total) out.push(f('error', 'D11 home counter', `Home says ${tracked} projects tracked, dataset has ${total}`, '/'));
  }
  const listing = results.get('/projects');
  if (listing?.status) {
    const m = listing.status.match(/(\d+)\s+of\s+(\d+)/);
    if (m && (Number(m[1]) !== total || Number(m[2]) !== total)) out.push(f('error', 'D12 listing count', `Listing status "${listing.status}" ≠ ${total}`, '/projects'));
  }
  for (const [path, r] of results) {
    if (!path.startsWith('/markets/') || !r.extra?.marketTracked) continue;
    const { tracked, cards } = r.extra.marketTracked;
    if (tracked !== cards) out.push(f('error', 'D13 market count', `"Projects tracked" says ${tracked} but ${cards} project cards are listed`, path));
  }
  const tl = results.get('/tools/possession-timeline');
  if (tl) {
    const intro = tl.blocks.find((b) => /state a possession date/.test(b.text))?.text ?? '';
    const m = intro.match(/(\d+) of (\d+)/);
    const dated = projects.filter((p) => p.possessionDate).length;
    if (m && (Number(m[1]) !== dated || Number(m[2]) !== total)) out.push(f('error', 'D14 timeline count', `Timeline says ${m[0]}, data has ${dated} of ${total}`, '/tools/possession-timeline'));
  }
  return out;
}
