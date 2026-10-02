// Shared by the API agent (verify-projects.mjs) and by any manual/subagent run, so every verification
// follows the same instructions and produces the same JSON shape.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
export const OUT_DIR = path.join(ROOT, 'data', 'verify');

export const FIELDS = ['existence', 'developer', 'location', 'rera', 'status', 'possession', 'startingPrice', 'configurations', 'landArea', 'towersUnits', 'other'];

/** JSON Schema for one project's verification result (structured outputs + manual runs). */
export const RESULT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'name', 'overall', 'summary', 'checks'],
  properties: {
    slug: { type: 'string' },
    name: { type: 'string' },
    overall: { type: 'string', enum: ['consistent', 'minor-discrepancies', 'major-discrepancies', 'unverifiable'] },
    summary: { type: 'string', description: 'Two or three sentences: what was confirmed, what differs, what could not be checked.' },
    checkedAt: { type: 'string', description: 'ISO timestamp (added by the runner)' },
    method: { type: 'string', description: 'e.g. api:claude-opus-5-5 or subagent:web-research (added by the runner)' },
    checks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'ours', 'web', 'verdict', 'severity', 'sources', 'note'],
        properties: {
          field: { type: 'string', enum: FIELDS },
          ours: { type: 'string', description: 'The value in our data, verbatim' },
          web: { type: 'string', description: 'What independent sources say; empty string if nothing found' },
          verdict: { type: 'string', enum: ['match', 'mismatch', 'partial', 'unverified'] },
          severity: { type: 'string', enum: ['high', 'medium', 'low'], description: 'high = would mislead an investor (wrong RERA, developer, location, price off by >15%, possession off by >1 year); medium = notable; low = cosmetic' },
          sources: { type: 'array', items: { type: 'string' }, description: 'URLs that support the web value' },
          note: { type: 'string' },
        },
      },
    },
  },
};

export const INSTRUCTIONS = `You are a meticulous real-estate fact-checker for an investor research site covering Gurugram (Haryana) and a few other markets.

You receive the facts our site publishes about ONE project. Verify each fact against independent sources on the web and report every discrepancy.

How to work:
- Search for the project by name + developer + location. Prefer, in this order: the state RERA portal (HARERA for Gurugram: haryanarera.gov.in; MahaRERA; Goa RERA) or pages quoting the registration; the developer's official website; established portals (99acres, Magicbricks, Housing.com, Square Yards, NoBroker, PropTiger); reputable news.
- Do NOT use realtycanvas.in (it is our source, so it cannot confirm itself).
- Check: the project exists under this name; developer; location (sector / locality / city / state); RERA registration number(s); construction status; possession / completion date (RERA date and marketed date if they differ); starting price; configurations and unit sizes; land area; towers / units.
- A match needs a source that states the same value. If sources disagree with each other, say so in the note.
- Prices on portals vary and go stale: treat a starting price within ±15% as "match", larger gaps as "mismatch" (state both). Areas: carpet vs super area differences are "partial", not "mismatch".
- If a project has several phases with different RERA numbers, a correct number for one phase is "partial".
- Never invent a value. If you cannot find something, verdict "unverified" with web = "".
- Record the URLs you relied on for each check.
- Overall: "consistent" if nothing differs; "minor-discrepancies" for low/medium issues only; "major-discrepancies" if any high-severity mismatch; "unverifiable" if the project itself can't be found.`;

/** Plain-text brief of what our site says about a project. */
export function brief(p) {
  const cfg = p.pricing.configurations.map((c) => `${c.label ?? c.unitType ?? '?'}${c.areaRaw ? ` — ${c.areaRaw}` : ''}${c.priceRaw ? ` — ${c.priceRaw}` : ''}`);
  const lines = [
    `slug: ${p.slug}`,
    `name: ${p.name}`,
    `developer: ${p.developer.name}${p.developer.nameRaw && p.developer.nameRaw !== p.developer.name ? ` (listed as "${p.developer.nameRaw}")` : ''}`,
    `location: ${[p.location.address, p.location.sector ? `Sector ${p.location.sector}` : null, p.location.locality, p.location.city, p.location.state].filter(Boolean).join(', ')}`,
    `type: ${p.projectType ?? '—'}`,
    `RERA number: ${p.reraNumber ?? 'not published'}`,
    `status: ${p.status ?? '—'}${p.statusRaw ? ` (source: ${p.statusRaw})` : ''}`,
    `possession: ${p.possessionDate ?? 'not published'}${p.possessionDateRaw ? ` (from: "${p.possessionDateRaw}")` : ''}`,
    `starting price: ${p.pricing.startingPriceRaw ?? 'not published'}`,
    `price range: ${p.pricing.priceRangeRaw ?? '—'}`,
    `configurations: ${cfg.length ? cfg.join(' | ') : 'not published'}`,
    `land area: ${p.facts.landAreaRaw ?? '—'}`,
    `towers: ${p.facts.towers ?? '—'}; units: ${p.facts.units ?? '—'}; floors: ${p.facts.floors ?? '—'}`,
  ];
  if (p.content?.developerClaims?.length) lines.push(`developer claims to test: ${p.content.developerClaims.map((c) => c.claim).join(' | ')}`);
  return lines.join('\n');
}

export function listedProjects() {
  const { projects } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects.json'), 'utf8'));
  return projects.filter((p) => !p.supersededBy);
}
