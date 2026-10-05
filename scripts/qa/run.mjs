// The Launch District QA — renders every page of the built site and reports discrepancies in content, data,
// spelling, UI/UX, accessibility, SEO structure and code hygiene.
//
//   npm run build && npm run qa              full run (starts `next start` itself if nothing is listening)
//   npm run qa -- --quick                    one project page instead of all 60
//   npm run qa -- --url http://host:port     audit an already-running / deployed site
//   npm run qa -- --no-fail                  always exit 0 (default: exit 1 when any error-level finding)
//
// Output: qa/report.md (human), qa/report.json (machine).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { probe } from './probe.mjs';
import { textChecks, variantCheck, metaChecks } from './checks-content.mjs';
import { projectPageChecks, crossPageChecks } from './checks-data.mjs';
import { codeChecks } from './checks-code.mjs';
import { makeSpeller } from './spell.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');
const { default: AxeBuilder } = await import('@axe-core/playwright');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const QUICK = args.includes('--quick');
const NO_FAIL = args.includes('--no-fail');
const PORT = Number(opt('--port', 3300));
let BASE = opt('--url', `http://localhost:${PORT}`);
const OUT_DIR = path.join(ROOT, 'qa');
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const { projects } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/projects.json'), 'utf8'));
const bySlug = new Map(projects.map((p) => [p.slug, p]));

// ---------- server
async function up(url) { try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); return r.ok || r.status < 500; } catch { return false; } }
let server = null;
async function ensureServer() {
  if (await up(BASE)) return log(`using running site at ${BASE}`);
  if (args.includes('--url')) throw new Error(`${BASE} is not reachable`);
  if (!fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'))) throw new Error('No production build found — run `npm run build` first.');
  log(`starting next start on :${PORT}`);
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 60 && !(await up(BASE)); i++) await new Promise((r) => setTimeout(r, 500));
  if (!(await up(BASE))) throw new Error('server did not start');
}
function stopServer() { if (server && !server.killed) server.kill(); }

// ---------- page list: sitemap + client-only routes + a 404 probe
async function pageList() {
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  let paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (QUICK) { const proj = paths.filter((p) => p.startsWith('/projects/')); paths = paths.filter((p) => !p.startsWith('/projects/')).concat(proj.slice(0, 2)); }
  const extra = ['/compare?p=' + projects.slice(0, 3).map((p) => p.slug).join(','), '/shortlist'];
  return [...new Set([...paths, ...extra])];
}

// ---------- main
const findings = [];
const add = (arr) => findings.push(...arr.filter(Boolean));

async function main() {
  const t0 = Date.now();
  await ensureServer();
  const paths = await pageList();
  log(`${paths.length} pages to audit`);
  const speller = await makeSpeller(ROOT, projects);
  const browser = await chromium.launch();
  const results = new Map();
  const linkTargets = new Map(); // href path → [{from, text}]
  const hashTargets = []; // {from, path, hash}
  const pageTextForVariants = [];
  const authoredText = [];

  // Pass 1 — desktop / light: everything
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    let errs = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404 \(Not Found\)/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => errs.push('Uncaught: ' + e.message.slice(0, 200)));
    let i = 0;
    for (const p of paths) {
      i++;
      errs = [];
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch((e) => ({ status: () => 0, err: e }));
      if (res.status() >= 400 || res.status() === 0) { add([{ sev: 'error', cat: 'UI/UX', check: 'U01 page status', msg: `HTTP ${res.status()}`, page: p }]); continue; }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); // trigger lazy images
      await page.waitForTimeout(250);
      await page.evaluate(() => window.scrollTo(0, 0));
      const r = await page.evaluate(probe, { mobile: false });
      r.extra = {};
      if (p === '/') r.extra.stats = await page.$$eval('main dl dd .sr-only', (els) => els.map((e) => Number(e.textContent.replace(/[^\d]/g, ''))));
      if (p.startsWith('/markets/')) {
        r.extra.marketTracked = await page.evaluate(() => {
          const dd = [...document.querySelectorAll('dt')].find((d) => /projects tracked/i.test(d.textContent))?.nextElementSibling;
          const sec = [...document.querySelectorAll('section')].find((s) => /^Projects on/.test(s.querySelector('h2')?.textContent || ''));
          return { tracked: Number(dd?.textContent.replace(/\D/g, '')), cards: sec ? sec.querySelectorAll('article').length : -1 };
        });
      }
      results.set(p, r);
      if (errs.length) add([{ sev: 'error', cat: 'UI/UX', check: 'U08 console errors', msg: `${errs.length} console/page error(s)`, page: p, evidence: errs.slice(0, 2).join(' | ') }]);

      // content
      add(textChecks(p, r));
      add(metaChecks(p, r, p));
      const slug = p.match(/^\/projects\/([^/?]+)/)?.[1];
      if (slug && bySlug.has(slug)) add(projectPageChecks(p, r, bySlug.get(slug)));

      // text for site-wide checks
      const visibleText = r.blocks.filter((b) => !b.hidden).map((b) => b.text).join('\n');
      pageTextForVariants.push([p, visibleText]);
      // "Authored" = blocks outside the project-data regions (rough split: everything on non-project pages, chrome on project pages)
      authoredText.push([p, slug ? r.blocks.filter((b) => /header|footer|nav|eyebrow|label|btn/.test(b.where)).map((b) => b.text).join('\n') : visibleText]);

      // links & anchors
      for (const l of r.links) {
        if (/^(mailto:|tel:)/.test(l.href)) {
          if (l.href.startsWith('mailto:') && !/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/.test(l.href)) add([{ sev: 'error', cat: 'UI/UX', check: 'U02 bad mailto', msg: l.href, page: p }]);
          if (l.href.startsWith('tel:') && !/^tel:\+?\d{10,13}$/.test(l.href)) add([{ sev: 'error', cat: 'UI/UX', check: 'U02 bad tel', msg: l.href, page: p }]);
          continue;
        }
        if (/^https?:/.test(l.href)) {
          if (new URL(l.href).origin !== new URL(BASE).origin) {
            if (l.target === '_blank' && !/noopener/.test(l.rel || '')) add([{ sev: 'warn', cat: 'UI/UX', check: 'U03 target=_blank', msg: `External link opens a new tab without rel="noopener"`, page: p, evidence: l.href }]);
            if (/wa\.me\/(\d+)/.test(l.href) && /wa\.me\/0+\b|wa\.me\/910{10}/.test(l.href)) add([{ sev: 'warn', cat: 'Content', check: 'C02 placeholder', msg: 'WhatsApp link points at the placeholder number', page: p, evidence: l.href.slice(0, 60) }]);
            continue;
          }
        }
        const u = new URL(l.href, BASE + p);
        if (u.origin !== new URL(BASE).origin) continue;
        const key = u.pathname;
        (linkTargets.get(key) ?? linkTargets.set(key, []).get(key)).push({ from: p, text: l.text });
        if (u.hash) hashTargets.push({ from: p, path: u.pathname, hash: u.hash.slice(1), text: l.text });
      }
      if (r.deadLinks.length) add([{ sev: 'warn', cat: 'UI/UX', check: 'U04 dead link', msg: `${r.deadLinks.length} link(s) with empty/# href`, page: p, evidence: r.deadLinks[0] }]);
      if (r.dupIds.length) add([{ sev: 'error', cat: 'Accessibility', check: 'A03 duplicate id', msg: `Duplicate id(s): ${r.dupIds.join(', ')}`, page: p }]);
      if (r.emptyInteractive.length) add([{ sev: 'error', cat: 'Accessibility', check: 'A04 nameless control', msg: `${r.emptyInteractive.length} link/button(s) with no accessible name`, page: p, evidence: r.emptyInteractive[0] }]);

      // images
      for (const im of r.images) {
        if (im.complete && im.nw === 0 && !im.lazy) add([{ sev: 'error', cat: 'UI/UX', check: 'U05 broken image', msg: 'Image failed to load', page: p, evidence: im.src.slice(0, 120) }]);
        if (im.alt === null) add([{ sev: 'error', cat: 'Accessibility', check: 'A05 missing alt', msg: 'Image has no alt attribute', page: p, evidence: im.where }]);
        if (im.nw && im.w && im.fit === 'fill') {
          const ra = im.w / im.h, na = im.nw / im.nh;
          if (Math.abs(ra / na - 1) > 0.08) add([{ sev: 'warn', cat: 'UI/UX', check: 'U06 distorted image', msg: `Image stretched (${im.w}×${im.h} shown, ${im.nw}×${im.nh} natural)`, page: p, evidence: im.where }]);
        }
        if (im.nw && im.w && im.nw < im.w * 0.75 && im.w > 200) add([{ sev: 'info', cat: 'UI/UX', check: 'U07 low-res image', msg: `Image shown at ${im.w}px but only ${im.nw}px wide`, page: p, evidence: im.src.slice(0, 100) }]);
      }
      if (r.clipped.length) add([{ sev: 'info', cat: 'UI/UX', check: 'U09 clipped text', msg: `${r.clipped.length} element(s) clip their text`, page: p, evidence: r.clipped.slice(0, 2).join(' ; ') }]);
      const odd = [...new Set(r.btnHeights)].filter((h) => h < 40);
      if (odd.length) add([{ sev: 'warn', cat: 'UI/UX', check: 'U10 button size', msg: `Buttons below 44px tall: ${odd.join(', ')}px`, page: p }]);

      // spelling (visible text + alt/aria/title/placeholder)
      const issues = await speller.check([visibleText, ...r.attrText].join('\n'));
      for (const is of issues) add([{ sev: 'spell', cat: 'Spelling', check: 'S01', msg: is.word, page: p, evidence: is.context, suggestions: is.suggestions }]);

      // axe — WCAG 2.1 A/AA
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of axe.violations) add([{ sev: v.impact === 'critical' || v.impact === 'serious' ? 'error' : 'warn', cat: 'Accessibility', check: `A01 ${v.id}`, msg: v.help, page: p, evidence: v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ') }]);

      // keyboard focus visibility: tab through the first focusable elements
      if (i <= 12 || p === '/' || p.startsWith('/tools/roi')) {
        // Real keyboard: press Tab and inspect whatever receives focus (so :focus-visible applies as for users).
        const invisible = [];
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        for (let k = 0; k < 40; k++) {
          await page.keyboard.press('Tab');
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); // let focus styles/state settle
          const bad = await page.evaluate(() => {
            const e = document.activeElement;
            if (!e || e === document.body) return null;
            const s = getComputedStyle(e), after = getComputedStyle(e, '::after');
            const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none') || (after.outlineStyle !== 'none' && parseFloat(after.outlineWidth) > 0) || !!e.closest('label')?.matches(':has(:focus-visible)')
              // Custom indicator (e.g. SVG map stations): a [data-focus-ring] child that is actually drawn on focus.
              || [...e.querySelectorAll('[data-focus-ring]')].some((c) => { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c); return b.width > 4 && !/^(none|transparent|rgba\(0, 0, 0, 0\))$/.test(cs.stroke) && cs.visibility !== 'hidden'; });
            return ring ? null : (e.getAttribute('aria-label') || e.textContent || e.tagName).trim().slice(0, 40);
          });
          if (bad && !invisible.includes(bad)) invisible.push(bad);
        }
        if (invisible.length) add([{ sev: 'error', cat: 'Accessibility', check: 'A02 focus not visible', msg: `${invisible.length} focusable element(s) show no focus indicator`, page: p, evidence: invisible.slice(0, 4).join(' | ') }]);
      }
      if (i % 10 === 0) log(`desktop/light ${i}/${paths.length}`);
    }
    await ctx.close();
  }

  // Link targets: status of every internal path + anchors exist
  log(`checking ${linkTargets.size} internal link targets`);
  const statusOf = new Map();
  for (const [p] of linkTargets) {
    if (results.has(p)) { statusOf.set(p, 200); continue; }
    try { statusOf.set(p, (await fetch(BASE + p, { redirect: 'manual' })).status); } catch { statusOf.set(p, 0); }
  }
  for (const [p, from] of linkTargets) {
    const s = statusOf.get(p);
    if (s >= 400 || s === 0) add([{ sev: 'error', cat: 'UI/UX', check: 'U01 broken link', msg: `Link to ${p} returns ${s}`, page: from[0].from, evidence: `${from.length} link(s), e.g. «${from[0].text}»` }]);
  }
  for (const h of hashTargets) {
    const target = results.get(h.path);
    if (target && !target.ids.includes(h.hash)) add([{ sev: 'error', cat: 'UI/UX', check: 'U02 missing anchor', msg: `Link to ${h.path}#${h.hash} but no element has id="${h.hash}"`, page: h.from, evidence: `«${h.text}»` }]);
  }

  // Pass 2/3 — mobile light + dark: layout, touch targets, colour contrast in both themes
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: scheme, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    if (scheme === 'dark') await ctx.addInitScript(() => { try { localStorage.setItem('tld-theme', 'dark'); } catch { /* ignore */ } });
    const page = await ctx.newPage();
    let i = 0;
    for (const p of paths) {
      i++;
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => null);
      if (!res || res.status() >= 400) continue;
      const r = await page.evaluate(probe, { mobile: true });
      if (scheme === 'light') {
        if (r.overflowX > 0) add([{ sev: 'error', cat: 'UI/UX', check: 'U11 horizontal scroll', msg: `Page is ${r.overflowX}px wider than a 375px phone`, page: p, evidence: r.overflowers.join(' ; ') }]);
        r.exemptTargets.forEach((e) => add([{ sev: 'info', cat: 'UI/UX', check: 'U12 touch target (documented exception)', msg: e, page: p }]));
        if (r.smallTargets.length) add([{ sev: 'warn', cat: 'UI/UX', check: 'U12 touch target', msg: `${r.smallTargets.length} control(s) smaller than 44×44px on mobile`, page: p, evidence: r.smallTargets.slice(0, 3).join(' ; ') }]);
      }
      const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      for (const v of axe.violations) add([{ sev: 'error', cat: 'Accessibility', check: `A01 color-contrast (${scheme}, mobile)`, msg: v.help, page: p, evidence: v.nodes.slice(0, 2).map((n) => `${n.target.join(' ')} — ${(n.any[0]?.message || '').slice(0, 90)}`).join(' ; ') }]);
      if (i % 20 === 0) log(`mobile/${scheme} ${i}/${paths.length}`);
    }
    await ctx.close();
  }
  // Pass 4 — desktop dark: contrast
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark', reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { try { localStorage.setItem('tld-theme', 'dark'); } catch { /* ignore */ } });
    const page = await ctx.newPage();
    for (const p of paths) {
      const res = await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => null);
      if (!res || res.status() >= 400) continue;
      const axe = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      for (const v of axe.violations) add([{ sev: 'error', cat: 'Accessibility', check: 'A01 color-contrast (dark, desktop)', msg: v.help, page: p, evidence: v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ') }]);
    }
    await ctx.close();
  }
  await browser.close();

  // Site-wide checks
  add(variantCheck(pageTextForVariants, authoredText));
  add(crossPageChecks(results, projects));
  const titles = new Map();
  for (const [p, r] of results) (titles.get(r.title) ?? titles.set(r.title, []).get(r.title)).push(p);
  for (const [t, ps] of titles) if (ps.length > 1) add([{ sev: 'warn', cat: 'SEO & structure', check: 'C07 duplicate title', msg: `${ps.length} pages share the title "${t}"`, page: ps.slice(0, 3).join(', ') }]);
  const descs = new Map();
  for (const [p, r] of results) if (r.description) (descs.get(r.description) ?? descs.set(r.description, []).get(r.description)).push(p);
  for (const [, ps] of descs) if (ps.length > 1) add([{ sev: 'info', cat: 'SEO & structure', check: 'C07 duplicate description', msg: `${ps.length} pages share a meta description`, page: ps.slice(0, 3).join(', ') }]);
  add(codeChecks(ROOT));

  writeReport(findings, paths.length, Date.now() - t0, speller);
}

// ---------- reporting
function group(list) {
  // Collapse identical findings across pages.
  const m = new Map();
  for (const x of list) {
    const k = `${x.sev}|${x.cat}|${x.check}|${x.msg}`;
    const g = m.get(k) ?? m.set(k, { ...x, pages: [], evidences: [] }).get(k);
    if (x.page && !g.pages.includes(x.page)) g.pages.push(x.page);
    if (x.evidence && g.evidences.length < 2 && !g.evidences.includes(x.evidence)) g.evidences.push(x.evidence);
  }
  return [...m.values()];
}

function writeReport(all, pageCount, ms, speller) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Spelling: one row per word.
  const spell = new Map();
  for (const x of all.filter((x) => x.sev === 'spell')) {
    const w = spell.get(x.msg.toLowerCase()) ?? spell.set(x.msg.toLowerCase(), { word: x.msg, pages: new Set(), context: x.evidence, suggestions: x.suggestions }).get(x.msg.toLowerCase());
    w.pages.add(x.page);
  }
  const spellRows = [...spell.values()].map((w) => ({ ...w, origin: speller.origin(w.word), pages: [...w.pages] })).sort((a, b) => (a.origin > b.origin ? -1 : 1) || b.pages.length - a.pages.length);
  const rest = group(all.filter((x) => x.sev !== 'spell'));
  for (const w of spellRows) rest.push({ sev: w.origin === 'site copy' ? 'error' : 'info', cat: 'Spelling', check: `S01 ${w.origin}`, msg: `"${w.word}"${w.suggestions?.length ? ` → ${w.suggestions.map((s) => s.word ?? s).join(' / ')}` : ''}`, pages: w.pages, evidences: [w.context] });
  const order = { error: 0, warn: 1, info: 2 };
  rest.sort((a, b) => order[a.sev] - order[b.sev] || a.cat.localeCompare(b.cat) || a.check.localeCompare(b.check));
  const count = (sev, cat) => rest.filter((x) => x.sev === sev && (!cat || x.cat === cat)).length;
  const cats = [...new Set(rest.map((x) => x.cat))].sort();

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, pages: pageCount, findings: rest }, null, 1));
  const L = [];
  L.push('# The Launch District QA report', '');
  L.push(`Generated ${new Date().toISOString()} against \`${BASE}\` · ${pageCount} pages × 4 passes (desktop light, mobile light, mobile dark, desktop dark) · ${(ms / 1000).toFixed(0)} s`, '');
  L.push('| Category | Errors | Warnings | Info |', '|---|---:|---:|---:|');
  for (const c of cats) L.push(`| ${c} | ${count('error', c)} | ${count('warn', c)} | ${count('info', c)} |`);
  L.push(`| **Total** | **${count('error')}** | **${count('warn')}** | **${count('info')}** |`, '');
  L.push('Severity: **error** = wrong or broken for users (fix before launch) · **warn** = inconsistent or weak · **info** = worth knowing; often caused by source data.', '');
  for (const c of cats) {
    L.push(`## ${c}`, '');
    const rows = rest.filter((x) => x.cat === c);
    L.push('| Sev | Check | Finding | Where | Evidence |', '|---|---|---|---|---|');
    for (const x of rows) {
      const where = x.pages.length > 3 ? `${x.pages.slice(0, 3).join(', ')} +${x.pages.length - 3} more` : x.pages.join(', ');
      L.push(`| ${x.sev === 'error' ? '🔴' : x.sev === 'warn' ? '🟠' : '⚪'} ${x.sev} | ${x.check} | ${esc(x.msg)} | ${esc(where)} | ${esc((x.evidences || []).join(' ; ').slice(0, 220))} |`);
    }
    L.push('');
  }
  L.push('## Checks performed', '');
  L.push('- **Content:** leaked values (undefined/NaN/null), placeholders, repeated words, spacing and punctuation, unbalanced brackets, compound words broken by dashes, terminology and spelling-variant consistency (sq ft, pre-launch, Gurugram/Gurgaon, colour/color, -ise/-ize, ₹ formats).');
  L.push('- **Data consistency:** each project page against data/projects.json (name, price, RERA, possession, developer, FAQs); stale possession dates; contradictory configuration rows; home, listing, market and timeline counts against the dataset.');
  L.push('- **Spelling:** cspell (en + en-GB) over visible text plus alt, aria-label, title and placeholder text. Domain words are in scripts/qa/words.txt, and project and developer names are added from the data. Each word is attributed to site copy (fix here) or source data (from the listing).');
  L.push('- **UI/UX:** HTTP status of every page and internal link, in-page and cross-page #anchors, mailto/tel validity, rel=noopener, broken, stretched or low-res images, clipped text, button sizes, horizontal scroll at 375px, 44px touch targets, console and runtime errors.');
  L.push('- **Accessibility:** axe-core WCAG 2.1 A/AA (desktop light), colour contrast in all four theme/viewport combinations, visible keyboard focus, duplicate ids, controls without names, missing alt text.');
  L.push('- **SEO & structure:** title and description presence, length and uniqueness, canonical correctness, html lang, a single h1, heading-level skips, JSON-LD validity.');
  L.push('- **Code hygiene:** TODO/FIXME, console.log, brand name hard-coded outside src/config/site.ts, raw hex colours outside the token config, placeholder contact config.');
  fs.writeFileSync(path.join(OUT_DIR, 'report.md'), L.join('\n'));
  log(`errors ${count('error')}, warnings ${count('warn')}, info ${count('info')} → qa/report.md`);
  process.exitCode = count('error') && !NO_FAIL ? 1 : 0;
}
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

main().catch((e) => { console.error(e); process.exitCode = 2; }).finally(stopServer);
