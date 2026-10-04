// Static checks over the source tree: things a rebrand or a launch would trip over.
import fs from 'node:fs';
import path from 'node:path';

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|css|mjs)$/.test(e.name)) yield p;
  }
}

export function codeChecks(root) {
  const out = [];
  const f = (sev, check, msg, file, evidence = '') => out.push({ sev, cat: 'Code hygiene', check, msg, page: file, evidence });
  const site = fs.readFileSync(path.join(root, 'src/config/site.ts'), 'utf8');
  const brand = (site.match(/name:\s*'([^']+)'/) || [])[1] || 'The Launch District';
  for (const file of walk(path.join(root, 'src'))) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      if (/\b(TODO|FIXME|XXX|HACK)\b/.test(line)) f('warn', 'K01 todo', 'Unresolved TODO/FIXME', at, line.trim().slice(0, 100));
      if (/console\.(log|debug)\(/.test(line) && !rel.includes('/api/')) f('warn', 'K02 console', 'console.log left in client/shared code', at, line.trim().slice(0, 100));
      // Brand name must come from config so a rebrand is a one-line change.
      if (rel !== 'src/config/site.ts' && new RegExp(`(['"\`>]|\\s)${brand}(?=[\\s'"\`<.,’'s]|$)`).test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line) && !/site\.name/.test(line)) {
        f('warn', 'K03 hard-coded brand', `"${brand}" hard-coded outside src/config/site.ts — rebranding will miss it`, at, line.trim().slice(0, 110));
      }
      // Colours must be tokens (config) — raw hex outside config/svg assets breaks theming.
      if (!/config\/site\.ts|\.svg$/.test(rel) && /#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*(\/\/|\*)/.test(line) && !/href=|#[a-z-]+['"`]/.test(line)) {
        f('info', 'K04 raw colour', 'Hex colour outside the token config', at, line.trim().slice(0, 100));
      }
    });
  }
  // Placeholders that must not ship
  if (/00000 00000|example\.com/.test(site)) f('warn', 'K05 placeholder config', 'Contact details in src/config/site.ts are still placeholders', 'src/config/site.ts');
  return out;
}
