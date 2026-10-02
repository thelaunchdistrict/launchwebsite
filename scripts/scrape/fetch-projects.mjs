// Step 2: fetch every project page (1 req/s) and pull the structured project object out of the
// App Router flight payload (`self.__next_f`) + JSON-LD + meta tags. Resumable: a project whose raw
// file already exists is skipped unless --force is passed.
//   node scripts/scrape/fetch-projects.mjs [--limit N] [--only slug,slug] [--force]
import fs from 'node:fs';
import path from 'node:path';
import {
  SOURCE, STATE_DIR, loadRobots, politeFetch, readJSON, writeJSON, log,
  decodeRsc, extractObject, jsonLdBlocks, metaTags,
} from './lib.mjs';

const RAW_DIR = path.join(STATE_DIR, 'raw');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

async function fetchOne(slug) {
  const url = `${SOURCE}/projects/${slug}`;
  const res = await politeFetch(url);
  if (res.status === 404) return { slug, url, error: 'HTTP 404' };
  const rsc = decodeRsc(res.body);
  const project = extractObject(rsc, '"project":{');
  if (!project) return { slug, url, error: 'project object not found in page payload' };
  const related = extractObject(rsc, '"relatedProjects":[');
  return {
    slug,
    url,
    finalUrl: res.url,
    fetchedAt: new Date().toISOString(),
    project,
    relatedProjects: Array.isArray(related) ? related.map((r) => r.slug).filter(Boolean) : [],
    jsonLd: jsonLdBlocks(res.body),
    meta: metaTags(res.body),
  };
}

async function main() {
  await loadRobots();
  const discovery = readJSON(path.join(STATE_DIR, 'discovery.json'), null);
  if (!discovery) throw new Error('run discover.mjs first');
  let slugs = discovery.slugs;
  if (opt('--only')) slugs = opt('--only').split(',');
  if (opt('--limit')) slugs = slugs.slice(0, Number(opt('--limit')));

  const failures = readJSON(path.join(STATE_DIR, 'fetch-failures.json'), {});
  let done = 0, skipped = 0;
  for (const slug of slugs) {
    const file = path.join(RAW_DIR, `${slug}.json`);
    if (!flag('--force') && fs.existsSync(file)) { skipped++; continue; }
    try {
      const raw = await fetchOne(slug);
      if (raw.error) { failures[slug] = raw.error; log(`✗ ${slug}: ${raw.error}`); }
      else { writeJSON(file, raw); delete failures[slug]; done++; log(`✓ ${slug}`); }
    } catch (e) {
      failures[slug] = e.message;
      log(`✗ ${slug}: ${e.message}`);
    }
    writeJSON(path.join(STATE_DIR, 'fetch-failures.json'), failures);
  }
  log(`fetched ${done}, skipped (already had) ${skipped}, failed ${Object.keys(failures).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
