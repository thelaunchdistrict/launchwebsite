// Geographic projection for the corridor map. Server-side only: the map component receives
// ready-made SVG paths and positions, so the road geometry never ships to the browser.
import 'server-only';
import geoJson from '../data/geo.json';
import type { ProjectSummary } from './types';

interface Geo {
  attribution: string;
  roads: Record<string, [number, number][][]>;
  sectors: Record<string, { lat: number; lon: number }>;
  places: Record<string, { lat: number; lon: number }>;
  points: Record<string, { lat: number; lon: number; basis: 'listing' | 'locality' | 'sector-centre'; note: string }>;
}
const geo = geoJson as unknown as Geo;

export const VIEW = { w: 720, h: 600, pad: 26 };
export const ATTRIBUTION = geo.attribution;

// Frame: every plotted project plus the corridor roads near them, with a margin.
const framePts = Object.values(geo.points).map((p) => [p.lon, p.lat] as [number, number]);
const lat0 = framePts.reduce((a, p) => a + p[1], 0) / Math.max(1, framePts.length);
const K = Math.cos((lat0 * Math.PI) / 180); // equirectangular: shrink longitude by cos(latitude)
const minLon = Math.min(...framePts.map((p) => p[0])) - 0.018, maxLon = Math.max(...framePts.map((p) => p[0])) + 0.018;
const minLat = Math.min(...framePts.map((p) => p[1])) - 0.014, maxLat = Math.max(...framePts.map((p) => p[1])) + 0.014;
const scale = Math.min((VIEW.w - 2 * VIEW.pad) / ((maxLon - minLon) * K), (VIEW.h - 2 * VIEW.pad) / (maxLat - minLat));
const offX = (VIEW.w - (maxLon - minLon) * K * scale) / 2;
const offY = (VIEW.h - (maxLat - minLat) * scale) / 2;

export function project(lat: number, lon: number): [number, number] {
  return [+(offX + (lon - minLon) * K * scale).toFixed(1), +(offY + (maxLat - lat) * scale).toFixed(1)];
}
const inView = ([x, y]: [number, number], m = 0) => x >= -m && x <= VIEW.w + m && y >= -m && y <= VIEW.h + m;

export const CORRIDOR_LABEL: Record<string, string> = {
  'dwarka-expressway': 'Dwarka Expressway',
  'golf-course-road': 'Golf Course Road',
  'golf-course-extension-road': 'Golf Course Ext. Road',
  'southern-peripheral-road': 'Southern Peripheral Road',
  'sohna-road': 'Sohna Road',
  'central-gurgaon': 'MG Road',
  nh48: 'NH-48',
};

/** Road paths per corridor, clipped loosely to the frame, plus a label anchor on the longest piece. */
export function roadLayers() {
  return Object.entries(geo.roads).map(([corridor, lines]) => {
    const projected = lines.map((l) => l.map(([lon, lat]) => project(lat, lon))).filter((l) => l.some((p) => inView(p, 40)));
    const d = projected.map((l) => 'M' + l.map((p) => p.join(',')).join('L')).join('');
    // Label at the middle of the longest visible stretch.
    let best: [number, number][] = [];
    let bestLen = 0;
    for (const l of projected) {
      const vis = l.filter((p) => inView(p, -30));
      let len = 0;
      for (let i = 1; i < vis.length; i++) len += Math.hypot(vis[i][0] - vis[i - 1][0], vis[i][1] - vis[i - 1][1]);
      if (len > bestLen) { bestLen = len; best = vis; }
    }
    const anchor = best.length ? best[Math.floor(best.length / 2)] : null;
    return { corridor, label: CORRIDOR_LABEL[corridor] ?? corridor, d, anchor };
  }).filter((r) => r.d);
}

export function sectorLabels() {
  return Object.entries(geo.sectors)
    .map(([n, s]) => ({ n, xy: project(s.lat, s.lon) }))
    .filter((s) => inView(s.xy, -8));
}

/** Reference places; those outside the frame become edge markers with a direction arrow. */
export function placeLabels() {
  return Object.entries(geo.places).map(([name, p]) => {
    const [x, y] = project(p.lat, p.lon);
    // Flip the label to the left of its point near the right edge so it never clips.
    if (inView([x, y], -10)) return { name, x, y, edge: false, flip: x > VIEW.w - 110 };
    const cx = Math.min(VIEW.w - 60, Math.max(8, x)), cy = Math.min(VIEW.h - 8, Math.max(14, y));
    const arrow = y < 0 ? '↑' : y > VIEW.h ? '↓' : x < 0 ? '←' : '→';
    return { name: `${arrow} ${name}`, x: cx, y: cy, edge: true, flip: false };
  });
}

export interface Station { slug: string; x: number; y: number; basis: string; note: string }

/** Screen positions for projects; projects sharing a spot are fanned out on a small ring. */
export function stationsFor(list: ProjectSummary[]): { stations: Station[]; unplaced: number } {
  const raw = list
    .map((p) => ({ p, g: geo.points[p.slug] }))
    .filter((x) => x.g)
    .map(({ p, g }) => { const [x, y] = project(g.lat, g.lon); return { slug: p.slug, x, y, basis: g.basis, note: g.note }; })
    .filter((s) => inView([s.x, s.y], 0));
  const groups: Station[][] = [];
  for (const s of raw) {
    const g = groups.find((gr) => Math.hypot(gr[0].x - s.x, gr[0].y - s.y) < 9);
    if (g) g.push(s); else groups.push([s]);
  }
  const stations = groups.flatMap((g) => g.length === 1 ? g : g.map((s, i) => {
    const r = 7 + g.length;
    const a = (i / g.length) * Math.PI * 2 - Math.PI / 2;
    return { ...s, x: +(g[0].x + r * Math.cos(a)).toFixed(1), y: +(g[0].y + r * Math.sin(a)).toFixed(1) };
  }));
  return { stations, unplaced: list.length - stations.length };
}
