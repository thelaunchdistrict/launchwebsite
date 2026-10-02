// Schematic geometry for the Corridor Map (viewBox 0 0 720 600, north up). Not to scale — it shows
// how corridors relate, not where buildings are. Lines follow 0°/45°/90° like a transit diagram.

export type Pt = [number, number];

export const CORRIDORS: { slug: string; label: string; short: string; path: Pt[]; labelAt: Pt; anchor?: 'start' | 'end' | 'middle' }[] = [
  { slug: 'dwarka-expressway', label: 'Dwarka Expressway', short: 'DXP', path: [[170, 40], [170, 300], [240, 370]], labelAt: [180, 34], anchor: 'start' },
  { slug: 'central-gurgaon', label: 'Central Gurgaon & MG Road', short: 'CG', path: [[330, 110], [470, 110], [520, 160]], labelAt: [330, 96], anchor: 'start' },
  { slug: 'golf-course-road', label: 'Golf Course Road', short: 'GCR', path: [[540, 120], [560, 140], [560, 250]], labelAt: [552, 104], anchor: 'start' },
  { slug: 'golf-course-extension-road', label: 'Golf Course Ext. Road', short: 'GCER', path: [[560, 260], [560, 380], [620, 440]], labelAt: [574, 300], anchor: 'start' },
  { slug: 'southern-peripheral-road', label: 'Southern Peripheral Road', short: 'SPR', path: [[270, 400], [540, 400]], labelAt: [405, 428], anchor: 'middle' },
  { slug: 'sohna-road', label: 'Sohna Road', short: 'SR', path: [[400, 200], [450, 250], [450, 360]], labelAt: [462, 236], anchor: 'start' },
  { slug: 'new-gurgaon', label: 'New Gurgaon', short: 'NG', path: [[230, 430], [150, 510]], labelAt: [118, 532], anchor: 'start' },
  { slug: 'sohna', label: 'Sohna', short: 'SOH', path: [[450, 470], [450, 540]], labelAt: [462, 548], anchor: 'start' },
];

/** Context lines drawn in the background (not markets). */
export const BACKDROP: { label: string; path: Pt[]; labelAt: Pt }[] = [
  { label: 'NH-48 (Delhi–Jaipur)', path: [[400, 30], [400, 170], [110, 460], [70, 570]], labelAt: [408, 44] },
];

export const LANDMARKS: { label: string; at: Pt }[] = [
  { label: 'IGI Airport ↑', at: [250, 22] },
  { label: 'Cyber City', at: [480, 80] },
  { label: 'Manesar ↙', at: [40, 590] },
  { label: 'Sohna ↓', at: [500, 590] },
];

function segLengths(path: Pt[]) {
  const ls: number[] = [];
  for (let i = 1; i < path.length; i++) ls.push(Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  return ls;
}

/** Point at fraction t (0..1) along a polyline, plus the unit normal there. */
export function pointAt(path: Pt[], t: number): { p: Pt; n: Pt } {
  const ls = segLengths(path);
  const total = ls.reduce((a, b) => a + b, 0);
  let d = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < ls.length; i++) {
    if (d <= ls[i] || i === ls.length - 1) {
      const [x0, y0] = path[i];
      const [x1, y1] = path[i + 1];
      const f = ls[i] ? d / ls[i] : 0;
      const dx = (x1 - x0) / (ls[i] || 1), dy = (y1 - y0) / (ls[i] || 1);
      return { p: [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f], n: [-dy, dx] };
    }
    d -= ls[i];
  }
  return { p: path[0], n: [0, 1] };
}

export const sectorKey = (s: string | null) => {
  if (!s) return 9999;
  const m = s.match(/^(\d+)([A-D]?)$/);
  return m ? Number(m[1]) + (m[2] ? (m[2].charCodeAt(0) - 64) / 10 : 0) : 9999;
};
