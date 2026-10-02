// Build src/data/geo.json for the corridor map from the raw OSM files (scripts/geo/fetch-osm.mjs)
// and data/projects.json:
//   roads    simplified corridor polylines [lon, lat]
//   sectors  sector centres, one per sector number
//   places   reference points (Cyber City, Sohna, Manesar…)
//   points   one position per project, with the basis used:
//            'listing'       coordinate published by the source and consistent with its sector (≤ 1.5 km)
//            'locality'      a named locality in the address that overrides an unreliable sector
//            'sector-centre' centre of the project's sector (OSM)
// Inconsistencies (published coordinate far from the stated sector, unknown sector) are written to
// data/geo/discrepancies.json and summarised in the extraction report.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const G = path.join(ROOT, 'data', 'geo');
const read = (f, d = null) => { try { return JSON.parse(fs.readFileSync(path.join(G, f), 'utf8')); } catch { return d; } };

const CORE = { minLat: 28.33, maxLat: 28.56, minLon: 76.86, maxLon: 77.16 }; // Gurugram urban area
const inCore = (lat, lon) => lat >= CORE.minLat && lat <= CORE.maxLat && lon >= CORE.minLon && lon <= CORE.maxLon;
const R = 6371;
const km = (a, b) => {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180, dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// ---------- sectors
const sectors = {};
const raw = read('osm-sectors.raw.json', { elements: [] }).elements;
const cand = {};
for (const x of raw) {
  const k = x.tags.name.replace(/^Sector[ -]?/i, '').toUpperCase();
  const c = x.center ?? { lat: x.lat, lon: x.lon };
  if (!inCore(c.lat, c.lon)) continue; // drops e.g. IMT Manesar's own "Sector 14"
  (cand[k] ??= []).push({ lat: c.lat, lon: c.lon, rank: x.tags.boundary === 'administrative' ? 0 : x.tags.place ? 1 : 2, src: `osm:${x.type}/${x.id}` });
}
for (const [k, list] of Object.entries(cand)) {
  list.sort((a, b) => a.rank - b.rank);
  sectors[k] = { lat: +list[0].lat.toFixed(5), lon: +list[0].lon.toFixed(5), src: list[0].src };
}
const nom = read('nominatim.raw.json', {});
for (const [q, hits] of Object.entries(nom)) {
  const m = q.match(/^Sector (\w+),/);
  if (!m) continue;
  // Geocoders fall back to the nearest *other* sector ("Sector 63A" → Sector 65); accept exact names only.
  const exact = new RegExp(`^Sector[ -]?${m[1]}\\b`, 'i');
  const h = (hits || []).find((x) => inCore(x.lat, x.lon) && exact.test(x.name));
  if (h && !sectors[m[1].toUpperCase()]) sectors[m[1].toUpperCase()] = { lat: +h.lat.toFixed(5), lon: +h.lon.toFixed(5), src: 'nominatim' };
}
// Sectors that OSM has no area for: centre of everything addressed in them (needs ≥ 3 features).
const evidence = read('osm-sector-evidence.raw.json', { elements: [] }).elements;
for (const key of ['63A', '79']) {
  if (sectors[key]) continue;
  const re = new RegExp(`Sector[ -]?${key.replace('A', ' ?-?A')}\\b`, 'i');
  const pts = evidence.filter((x) => Object.values(x.tags).some((v) => re.test(v))).map((x) => x.center ?? { lat: x.lat, lon: x.lon }).filter((c) => c && inCore(c.lat, c.lon));
  if (pts.length >= 3) {
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
    sectors[key] = { lat: +med(pts.map((p) => p.lat)).toFixed(5), lon: +med(pts.map((p) => p.lon)).toFixed(5), src: `osm-addresses:${pts.length}` };
  }
}

// Sectors absent from OSM entirely: documented estimate between numbered neighbours.
const estimates = read('sector-estimates.json', {});
for (const [k, e] of Object.entries(estimates)) {
  if (k.startsWith('_') || sectors[k]) continue;
  const [a, b] = e.between.map((n) => sectors[n]);
  if (a && b) sectors[k] = { lat: +((a.lat + b.lat) / 2).toFixed(5), lon: +((a.lon + b.lon) / 2).toFixed(5), src: 'estimate', why: e.why };
}

// ---------- places
const PLACE_KEYS = { 'Gwal Pahari': 'Gwal Pahari', Sohna: 'Sohna', Manesar: 'Manesar', 'Cyber City': 'Cyber City', 'Indira Gandhi International Airport': 'IGI Airport' };
const places = {};
for (const [q, hits] of Object.entries(nom)) {
  const key = Object.keys(PLACE_KEYS).find((k) => q.startsWith(k));
  // Prefer a settlement point (place=town) over the centroid of a large administrative boundary.
  const h = (hits || []).find((x) => x.class === 'place') ?? hits?.[0];
  if (key && h) places[PLACE_KEYS[key]] = { lat: +h.lat.toFixed(5), lon: +h.lon.toFixed(5) };
}

// ---------- roads
const CORRIDOR_OF = (t) => {
  const n = t.name ?? '', ref = t.ref ?? '';
  if (/Dwarka Expressway|Northern Peripheral/i.test(n) || /NH ?248BB/.test(ref)) return 'dwarka-expressway';
  if (/Golf Course Extension/i.test(n)) return 'golf-course-extension-road';
  if (/Golf Course Road/i.test(n)) return 'golf-course-road';
  if (/Southern Peripheral/i.test(n) || /\bSPR\b/.test(n + ref)) return 'southern-peripheral-road';
  if (/Sohna/i.test(n) || /NH ?248A/.test(ref)) return 'sohna-road';
  if (/Mehrauli|MG Road/i.test(n) || /NH ?148A/.test(ref)) return 'central-gurgaon';
  if (/NH ?48/.test(ref) || /Delhi.?(Gurugram|Jaipur)|Amer Road/i.test(n)) return 'nh48';
  return null;
};
// Douglas–Peucker on lon/lat scaled to metres (good enough at this scale).
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const k = Math.cos((28.45 * Math.PI) / 180);
  const d = (p, a, b) => {
    const [x, y, x1, y1, x2, y2] = [p[0] * k, p[1], a[0] * k, a[1], b[0] * k, b[1]];
    const dx = x2 - x1, dy = y2 - y1;
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))) : 0;
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  };
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) { const v = d(pts[i], pts[0], pts[pts.length - 1]); if (v > max) { max = v; idx = i; } }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
const roads = {};
// SPR is not named in OSM. It is identified as the unnamed secondary road whose whole length lies in the
// east–west band separating Sectors 71/72/74 (north) from 69/70/75 (south): lat 28.395–28.407.
const sprRaw = read('osm-spr.raw.json', { elements: [] }).elements
  .filter((w) => /Southern Peripheral|\bSPR\b/i.test(`${w.tags.name ?? ''} ${w.tags.ref ?? ''} ${w.tags['alt_name'] ?? ''}`)
    || (!w.tags.name && w.tags.highway === 'secondary' && w.geometry?.every((g) => g.lat >= 28.395 && g.lat <= 28.407 && g.lon >= 76.98 && g.lon <= 77.075)))
  .map((w) => ({ ...w, tags: { ...w.tags, name: w.tags.name ?? 'Southern Peripheral Road' } }));
for (const w of [...read('osm-roads.raw.json', { elements: [] }).elements, ...sprRaw]) {
  const c = CORRIDOR_OF(w.tags);
  if (!c || !w.geometry?.length) continue;
  if (/_link$/.test(w.tags.highway)) continue;
  const line = simplify(w.geometry.map((g) => [g.lon, g.lat]), 0.00035).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  if (line.length >= 2) (roads[c] ??= []).push(line);
}

// ---------- project positions
const { projects } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects.json'), 'utf8'));
const LOCALITY = [{ re: /gwal pahari/i, place: 'Gwal Pahari' }];
const byName = read('nominatim-projects.raw.json', {});
const tokens = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !['the', 'gurugram', 'gurgaon', 'haryana', 'sector', 'india'].includes(w));
/** A geocoder hit counts only if its own name contains every word of the project name and it sits near the stated sector. */
function projectHit(p, sec) {
  const want = tokens(p.name);
  for (const h of byName[`${p.name}, Gurugram, Haryana`] ?? []) {
    const got = new Set(tokens(h.name.split(',')[0]));
    if (!want.every((w) => got.has(w))) continue;
    if (!inCore(h.lat, h.lon) || ['highway', 'boundary'].includes(h.class)) continue;
    if (sec && km([h.lat, h.lon], [sec.lat, sec.lon]) > 3) continue;
    return h;
  }
  return null;
}
const points = {};
const discrepancies = [];
for (const p of projects) {
  if (p.supersededBy) continue;
  const text = [p.location.address, p.location.locality, p.content?.subtitle, p.content?.title].filter(Boolean).join(' ');
  const loc = LOCALITY.find((l) => l.re.test(text) && places[l.place]);
  const sec = p.location.sector ? sectors[p.location.sector] : null;
  const pub = p.location.latitude && p.location.longitude ? [p.location.latitude, p.location.longitude] : null;
  const named = projectHit(p, sec);
  if (named) {
    points[p.slug] = { lat: +named.lat.toFixed(5), lon: +named.lon.toFixed(5), basis: 'osm-project', note: 'Mapped by name in OpenStreetMap' };
  } else if (loc) {
    points[p.slug] = { ...places[loc.place], basis: 'locality', note: `Plotted at ${loc.place} (named in the address)` };
    if (sec) discrepancies.push({ slug: p.slug, issue: `Listing says Sector ${p.location.sector}, but the address names ${loc.place} (${km([sec.lat, sec.lon], [places[loc.place].lat, places[loc.place].lon]).toFixed(1)} km from that sector). Plotted at ${loc.place}.` });
  } else if (pub && sec && km(pub, [sec.lat, sec.lon]) <= 1.5) {
    points[p.slug] = { lat: pub[0], lon: pub[1], basis: 'listing', note: 'Coordinate published by the listing' };
  } else if (sec) {
    points[p.slug] = sec.src === 'estimate'
      ? { lat: sec.lat, lon: sec.lon, basis: 'approximate', note: `Approximate: ${sec.why}` }
      : { lat: sec.lat, lon: sec.lon, basis: 'sector-centre', note: `Centre of Sector ${p.location.sector}` };
    if (sec.src === 'estimate') discrepancies.push({ slug: p.slug, issue: `${sec.why}. Shown as approximate.` });
    if (pub) discrepancies.push({ slug: p.slug, issue: `Published coordinate ${pub.join(', ')} is ${km(pub, [sec.lat, sec.lon]).toFixed(1)} km from the centre of Sector ${p.location.sector}; plotted at the sector centre instead.` });
  } else if (pub && inCore(pub[0], pub[1])) {
    points[p.slug] = { lat: pub[0], lon: pub[1], basis: 'listing', note: 'Coordinate published by the listing' };
  } else {
    discrepancies.push({ slug: p.slug, issue: p.location.sector ? `Sector ${p.location.sector} not found in OpenStreetMap; not plotted.` : 'Outside Gurugram or no sector; not plotted on the Gurugram map.' });
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  attribution: '© OpenStreetMap contributors (ODbL)',
  roads, sectors, places, points,
};
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'geo.json'), JSON.stringify(out));
fs.writeFileSync(path.join(G, 'discrepancies.json'), JSON.stringify(discrepancies, null, 1));
const n = Object.values(points).reduce((a, x) => ((a[x.basis] = (a[x.basis] || 0) + 1), a), {});
console.log(`geo: ${Object.keys(sectors).length} sectors, roads ${Object.entries(roads).map(([k, v]) => `${k}:${v.length}`).join(' ')}, points ${JSON.stringify(n)}, ${discrepancies.length} discrepancies`);
discrepancies.forEach((d) => console.log(`  ! ${d.slug}: ${d.issue}`));
