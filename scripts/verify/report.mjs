// Aggregate data/verify/<slug>.json into data/verify/verification-report.md (+ summary.json).
import fs from 'node:fs';
import path from 'node:path';
import { OUT_DIR, listedProjects } from './brief.mjs';

const projects = listedProjects();
const results = projects.map((p) => {
  const f = path.join(OUT_DIR, `${p.slug}.json`);
  if (!fs.existsSync(f)) return { slug: p.slug, name: p.name, missing: true };
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return { slug: p.slug, name: p.name, invalid: e.message }; }
});

const done = results.filter((r) => !r.missing && !r.invalid);
const by = (o) => done.filter((r) => r.overall === o);
const issues = done.flatMap((r) => (r.checks || []).filter((c) => c.verdict === 'mismatch' || c.verdict === 'partial').map((c) => ({ ...c, slug: r.slug, name: r.name })));
const sevRank = { high: 0, medium: 1, low: 2 };
issues.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || a.slug.localeCompare(b.slug));
const fieldCount = {};
for (const r of done) for (const c of r.checks || []) { const k = `${c.field}:${c.verdict}`; fieldCount[k] = (fieldCount[k] || 0) + 1; }
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const link = (u) => { try { return `[${new URL(u).hostname.replace(/^www\./, '')}](${u})`; } catch { return esc(u); } };

const L = [];
L.push('# Project verification report', '');
L.push(`Generated ${new Date().toISOString()}. Each project's published facts were checked against independent web sources (state RERA portals, developer sites, major property portals, news). realtycanvas.in, our own source, was excluded.`, '');
L.push('| | Projects |', '|---|---:|');
L.push(`| Checked | ${done.length} / ${projects.length} |`);
L.push(`| Consistent | ${by('consistent').length} |`);
L.push(`| Minor discrepancies | ${by('minor-discrepancies').length} |`);
L.push(`| **Major discrepancies** | **${by('major-discrepancies').length}** |`);
L.push(`| Could not be verified | ${by('unverifiable').length} |`);
if (results.some((r) => r.missing || r.invalid)) L.push(`| Not yet checked / invalid result | ${results.filter((r) => r.missing || r.invalid).map((r) => r.slug).join(', ')} |`);
L.push('');

L.push('## Discrepancies, most serious first', '');
L.push('| Severity | Project | Field | Our data | Web says | Verdict | Sources | Note |', '|---|---|---|---|---|---|---|---|');
for (const c of issues) {
  L.push(`| ${c.severity === 'high' ? '🔴 high' : c.severity === 'medium' ? '🟠 medium' : '⚪ low'} | [${esc(c.name)}](/projects/${c.slug}) | ${c.field} | ${esc(c.ours)} | ${esc(c.web)} | ${c.verdict} | ${(c.sources || []).slice(0, 3).map(link).join(' ')} | ${esc(c.note)} |`);
}
L.push('');

L.push('## Per project', '');
const order = { 'major-discrepancies': 0, 'minor-discrepancies': 1, unverifiable: 2, consistent: 3 };
for (const r of [...done].sort((a, b) => order[a.overall] - order[b.overall] || a.slug.localeCompare(b.slug))) {
  L.push(`### ${r.name} — ${r.overall.replace('-', ' ')}`, '');
  L.push(esc(r.summary), '');
  const unverified = (r.checks || []).filter((c) => c.verdict === 'unverified').map((c) => c.field);
  const matched = (r.checks || []).filter((c) => c.verdict === 'match').map((c) => c.field);
  if (matched.length) L.push(`Confirmed: ${matched.join(', ')}.`);
  if (unverified.length) L.push(`Could not verify: ${unverified.join(', ')}.`);
  L.push(`Checked ${r.checkedAt?.slice(0, 10) ?? '—'} (${r.method ?? 'agent'}).`, '');
}

L.push('## Field-level tally', '');
L.push('| Field | Match | Partial | Mismatch | Unverified |', '|---|---:|---:|---:|---:|');
for (const f of ['existence', 'developer', 'location', 'rera', 'status', 'possession', 'startingPrice', 'configurations', 'landArea', 'towersUnits', 'other']) {
  const g = (v) => fieldCount[`${f}:${v}`] || 0;
  if (g('match') + g('partial') + g('mismatch') + g('unverified')) L.push(`| ${f} | ${g('match')} | ${g('partial')} | ${g('mismatch')} | ${g('unverified')} |`);
}

fs.writeFileSync(path.join(OUT_DIR, 'verification-report.md'), L.join('\n'));
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify({ generatedAt: new Date().toISOString(), checked: done.length, total: projects.length, overall: Object.fromEntries(Object.keys(order).map((k) => [k, by(k).length])), issues }, null, 1));
console.log(`report: ${done.length}/${projects.length} checked; major ${by('major-discrepancies').length}, minor ${by('minor-discrepancies').length}, unverifiable ${by('unverifiable').length}, consistent ${by('consistent').length}; ${issues.length} discrepancies`);
