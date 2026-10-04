// Fetch the real geography behind the corridor map from OpenStreetMap (© OpenStreetMap contributors, ODbL):
//   data/geo/osm-sectors.raw.json   sector boundaries/centres in Gurugram district (Overpass)
//   data/geo/osm-roads.raw.json     corridor road geometry (Overpass)
//   data/geo/osm-spr.raw.json       Southern Peripheral Road (tagged inconsistently, fetched separately)
//   data/geo/nominatim.raw.json     sectors/localities missing from the above (Nominatim, 1 req/s)
// Polite: descriptive UA, one request at a time, exponential backoff on 429/504/"too busy".
// Re-runs skip files that already exist unless --force.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function curl(url, query) {
  const res = spawnSync('curl', ['-s', '-m', '200', '-A', UA, '-w', '\n%{http_code}', '--data-urlencode', `data=${query}`, url], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const out = res.stdout ?? '';
  const i = out.lastIndexOf('\n');
  const status = Number(out.slice(i + 1)) || 0;
  return { ok: status === 200, status, text: out.slice(0, i) };
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const DIR = path.join(ROOT, 'data', 'geo');
const UA = 'LaunchDistrictGeo/1.0 (corridor map for a property-research prototype; low volume)';
const FORCE = process.argv.includes('--force');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i >= 0 ? process.argv[i + 1] : null; })();
const want = (k) => !ONLY || ONLY === k;
const BBOX = '28.30,76.85,28.58,77.18';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
fs.mkdirSync(DIR, { recursive: true });

async function overpass(file, query) {
  const out = path.join(DIR, file);
  if (!FORCE && fs.existsSync(out)) { try { JSON.parse(fs.readFileSync(out, 'utf8')); log(`skip ${file} (exists)`); return; } catch { /* re-fetch broken file */ } }
  const mirrors = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = mirrors[attempt % mirrors.length];
    try {
      // Overpass rejects Node's fetch signature with 406, so requests go through curl.
      const r = curl(url, query);
      const text = r.text;
      if (r.ok && text.trimStart().startsWith('{')) {
        const j = JSON.parse(text);
        fs.writeFileSync(out, JSON.stringify(j));
        log(`✓ ${file}: ${j.elements.length} elements from ${new URL(url).host}`);
        return;
      }
      log(`… ${file}: ${r.status} from ${new URL(url).host} (${text.match(/Error<\/strong>: ([^<]{0,80})/)?.[1] ?? 'busy'})`);
    } catch (e) { log(`… ${file}: ${e.message}`); }
    await sleep(Math.min(60000, 5000 * 2 ** attempt));
  }
  throw new Error(`Overpass failed for ${file}`);
}

async function nominatim(file, queries) {
  const out = path.join(DIR, file);
  const prev = !FORCE && fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
  for (const q of queries) {
    if (prev[q]) continue;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en' }, signal: AbortSignal.timeout(30000) });
    prev[q] = r.ok ? (await r.json()).map((x) => ({ name: x.display_name, lat: +x.lat, lon: +x.lon, type: x.type, class: x.category ?? x.class })) : [];
    log(`${r.ok ? '✓' : '✗'} nominatim "${q}": ${prev[q].length} hit(s)`);
    fs.writeFileSync(out, JSON.stringify(prev, null, 1));
    await sleep(1100); // Nominatim policy: max 1 request/second
  }
}

if (want('sectors')) await overpass('osm-sectors.raw.json', `[out:json][timeout:90];
area["name"~"^(Gurugram|Gurgaon)( District)?$"]["boundary"="administrative"]->.g;
(nwr["name"~"^Sector[ -]?[0-9]{1,3}[A-Da-d]?$"](area.g););
out center tags;`);
if (want('roads')) await overpass('osm-roads.raw.json', `[out:json][timeout:180];
(
 way["highway"~"^(motorway|trunk|primary|secondary)$"]["name"~"Dwarka Expressway|Northern Peripheral|Golf Course|Sohna|Mehrauli|MG Road"](${BBOX});
 way["highway"~"^(motorway|trunk)$"]["ref"~"NH ?48|NH ?248A"](${BBOX});
);
out tags geom;`);
if (want('spr')) await overpass('osm-spr.raw.json', `[out:json][timeout:120];
way["highway"~"^(trunk|primary|secondary|tertiary)$"](28.385,76.99,28.415,77.075);
out tags geom;`);
if (want('nominatim')) await nominatim('nominatim.raw.json', [
  'Sector 63A, Gurugram, Haryana',
  'Sector 79, Gurugram, Haryana',
  'Gwal Pahari, Gurugram, Haryana',
  'Sohna, Gurugram, Haryana',
  'Manesar, Gurugram, Haryana',
  'Cyber City, Gurugram, Haryana',
  'Indira Gandhi International Airport, Delhi',
]);
// Sectors missing as named areas: collect anything addressed in them (buildings, streets, POIs).
if (want('sector-evidence')) await overpass('osm-sector-evidence.raw.json', `[out:json][timeout:120];
(
 nwr["addr:suburb"~"^Sector[ -]?(63 ?-?A|79)$",i](${BBOX});
 nwr["addr:street"~"Sector[ -]?(63 ?-?A|79)\\\\b",i](${BBOX});
 nwr["name"~"Sector[ -]?(63 ?-?A|79)\\\\b",i](${BBOX});
 nwr["addr:place"~"Sector[ -]?(63 ?-?A|79)$",i](${BBOX});
);
out center tags;`);

// Project-level positions: look each project up by name. build-geo.mjs only accepts a hit whose name
// matches and which lies within 3 km of the project's stated sector.
if (want('projects')) {
  const { projects } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects.json'), 'utf8'));
  await nominatim('nominatim-projects.raw.json', projects.filter((p) => !p.supersededBy && p.source !== 'curated').map((p) => `${p.name}, Gurugram, Haryana`));
}
log('done');
