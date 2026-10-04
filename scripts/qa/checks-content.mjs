// Content & context checks over the probed page text. Each returns findings:
// { sev: 'error'|'warn'|'info', cat, check, msg, page, evidence }

const f = (sev, check, msg, page, evidence = '') => ({ sev, cat: 'Content', check, msg, page, evidence });

export function textChecks(page, r) {
  const out = [];
  const seen = new Set();
  const once = (key, fn) => { if (!seen.has(key)) { seen.add(key); out.push(fn()); } };
  for (const b of r.blocks) {
    if (b.hidden && !/sr-only/.test(b.where)) continue;
    const t = b.text;
    // C01 leaked programming values
    // "Infinity" only counts as a leak when it stands alone (not "Infinity Pool").
    const leak = t.match(/\b(undefined|NaN)\b|(?:^|[\s:₹(])Infinity(?![ -]?[A-Za-z])|\[object Object\]|\$\{|\{\{|\bnull\b(?! and void)/);
    if (leak) once('C01' + t, () => f('error', 'C01 leaked value', `Rendered text contains "${leak[0]}"`, page, `${t.slice(0, 120)} @ ${b.where}`));
    // C02 placeholders
    const ph = t.match(/\b(lorem ipsum|TODO|FIXME|TBD|XXX|placeholder)\b|00000 00000|example\.com/i);
    if (ph) once('C02' + ph[0] + page, () => f('warn', 'C02 placeholder', `Placeholder text "${ph[0]}" is visible`, page, `${t.slice(0, 120)} @ ${b.where}`));
    // C04 spacing / punctuation
    const sp = t.match(/\s[,.;:!?](?![\d.])|[,;:]{2,}|(?<!\.)\.\.(?!\.)|\s{2,}|\(\s|\s\)/);
    if (sp && !/…|\.\.\./.test(sp[0])) once('C04' + t, () => f('info', 'C04 spacing/punctuation', `Odd spacing or punctuation "${sp[0].replace(/\s/g, '␠')}"`, page, `${t.slice(0, 120)} @ ${b.where}`));
    const opens = (t.match(/\(/g) || []).length, closes = (t.match(/\)/g) || []).length;
    if (opens !== closes) once('C04b' + t, () => f('info', 'C04 unbalanced brackets', `${opens} "(" vs ${closes} ")"`, page, t.slice(0, 120)));
    // C05 hyphen-as-dash leftovers from source ("ultra – luxury", "5 – Star")
    const dash = t.match(/\b\w+ – \w+-?\w*\b/);
    if (dash && /\b(ultra|state|high|eco|world|5|well|mid|top|semi|pre|non|all|multi)\s–\s/i.test(dash[0])) once('C05' + dash[0], () => f('warn', 'C05 broken compound word', `Compound word split by an en dash: "${dash[0]}"`, page, t.slice(0, 120)));
  }
  // C03 repeated words — within one text node only
  for (const t of r.textNodes || []) {
    const rep = t.match(/\b([A-Za-z]{2,})\s+\1\b/i);
    if (rep && !/^(that|had|is|bye|so|very|no|ha)$/i.test(rep[1])) once('C03' + rep[0], () => f('warn', 'C03 repeated word', `"${rep[0]}"`, page, t.slice(0, 120)));
  }
  return out;
}

// C06 terminology / variant consistency across the whole site (site-authored copy and data alike).
const VARIANTS = [
  ['sq ft', /\bsq\.? ?ft\b|\bsqft\b|\bsq\. ?ft\.|\bsquare feet\b/gi, (m) => m.toLowerCase().replace(/\s+/g, ' ')],
  ['pre-launch', /\bpre[- ]?launch\b/gi, (m) => m.toLowerCase()],
  // House style: the city is "Gurugram"; "Gurgaon" survives only inside proper names (New Gurgaon, Central Gurgaon).
  ['Gurugram/Gurgaon (site copy)', /(?<!New |Central )\bGurgaon\b|\bGurugram\b/g, (m) => m],
  ['colour', /\bcolou?rs?\b/gi, (m) => (/ou/i.test(m) ? 'colour' : 'color')],
  ['centre', /\bcent(?:re|er)s?\b/gi, (m) => (/re$|res$/i.test(m) ? 'centre' : 'center')],
  ['-ise/-ize', /\b(?:organi|reali|recogni|priori|analy|utili|optimi)(?:s|z)e[sd]?\b/gi, (m) => (/s(e|es|ed)$/i.test(m) ? '-ise' : '-ize')],
  ['e-mail', /\be-?mail\b/gi, (m) => m.toLowerCase()],
  ['₹ format', /₹\s?\d[\d,.]*\s?(?:Cr|Crore|Crores|L|Lakh|Lac)s?\b/g, (m) => m.replace(/[\d,.]+/, 'N').replace(/\s/g, '␠')],
];

export function variantCheck(pagesText, authoredText) {
  const out = [];
  for (const [name, re, norm] of VARIANTS) {
    const scope = name.includes('site copy') ? authoredText : pagesText;
    const counts = {};
    for (const [page, text] of scope) for (const m of text.matchAll(re)) { const k = norm(m[0]); (counts[k] ??= { n: 0, pages: new Set() }).n++; counts[k].pages.add(page); }
    const keys = Object.keys(counts);
    if (keys.length > 1) {
      const sorted = keys.sort((a, b) => counts[b].n - counts[a].n);
      out.push({
        sev: name.includes('site copy') || ['colour', 'centre', '-ise/-ize'].includes(name) ? 'warn' : 'info',
        cat: 'Content', check: 'C06 inconsistent terminology',
        msg: `${name}: ${sorted.map((k) => `"${k}" ×${counts[k].n}`).join(', ')}`,
        page: [...counts[sorted[1]].pages].slice(0, 3).join(', '),
        evidence: `Minority form appears on ${counts[sorted[sorted.length - 1]].pages.size} page(s)`,
      });
    }
  }
  return out;
}

// C07 metadata quality, C08 heading structure, C09 JSON-LD validity
export function metaChecks(page, r, path) {
  const out = [];
  const m = (sev, check, msg, evidence = '') => out.push({ sev, cat: 'SEO & structure', check, msg, page, evidence });
  if (!r.title) m('error', 'C07 title', 'Missing <title>');
  else if (r.title.length > 70) m('warn', 'C07 title length', `Title is ${r.title.length} chars (search results cut at ~60–70)`, r.title);
  if (!r.description) m('warn', 'C07 description', 'Missing meta description');
  else if (r.description.length > 165 || r.description.length < 50) m('info', 'C07 description length', `Meta description is ${r.description.length} chars (aim for 50–160)`, r.description);
  if (!r.canonical && !/^\/(compare|shortlist)/.test(path)) m('warn', 'C07 canonical', 'No canonical link');
  else if (r.canonical && new URL(r.canonical, 'http://x').pathname !== path.split('?')[0] && !path.includes('?')) m('error', 'C07 canonical mismatch', `Canonical ${r.canonical} ≠ ${path}`);
  if (r.lang !== 'en-IN') m('info', 'C07 lang', `html lang="${r.lang}"`);
  const h1 = r.headings.filter((h) => h.level === 1);
  if (h1.length !== 1) m('error', 'C08 h1 count', `${h1.length} <h1> elements (expected 1)`, h1.map((h) => h.text).join(' | '));
  for (let i = 1; i < r.headings.length; i++) {
    const a = r.headings[i - 1], b = r.headings[i];
    if (b.level > a.level + 1) { m('warn', 'C08 heading skip', `h${a.level} → h${b.level}`, `"${a.text.slice(0, 40)}" → "${b.text.slice(0, 40)}"`); break; }
  }
  r.headings.filter((h) => !h.text).forEach(() => m('error', 'C08 empty heading', 'Heading with no text'));
  r.jsonLd.forEach((raw, i) => {
    let j;
    try { j = JSON.parse(raw); } catch (e) { m('error', 'C09 JSON-LD', `Block ${i + 1} is not valid JSON: ${e.message}`); return; }
    if (!j['@context'] || !j['@type']) m('error', 'C09 JSON-LD', `Block ${i + 1} lacks @context/@type`);
    if (j['@type'] === 'FAQPage' && !(j.mainEntity || []).every((q) => q.name && q.acceptedAnswer?.text)) m('error', 'C09 JSON-LD', 'FAQPage has a question without text or answer');
    if (j['@type'] === 'RealEstateListing' && (!j.name || !j.url)) m('error', 'C09 JSON-LD', 'RealEstateListing missing name/url');
    const s = JSON.stringify(j);
    if (/":null|":""|undefined/.test(s)) m('info', 'C09 JSON-LD', `Block ${i + 1} (${j['@type']}) contains null/empty values`);
  });
  return out;
}
