// Shared helpers for the realtycanvas.in extractor: polite HTTP, resumable state, RSC decoding.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
export const SOURCE = 'https://www.realtycanvas.in';
export const CDN_HOSTS = ['cdn.realtycanvas.in'];
export const USER_AGENT =
  'FalconDataBot/1.0 (+research crawler for a project-catalogue prototype; 1 req/s; respects robots.txt)';
export const STATE_DIR = path.join(ROOT, '.scrape-state');
export const DATA_DIR = path.join(ROOT, 'data');
export const MIN_INTERVAL_MS = 1000; // never faster than 1 request / second

fs.mkdirSync(STATE_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- robots.txt ----------
let robotsRules = null;
export async function loadRobots() {
  if (robotsRules) return robotsRules;
  const res = await fetch(`${SOURCE}/robots.txt`, { headers: { 'user-agent': USER_AGENT } });
  const txt = await res.text();
  fs.writeFileSync(path.join(STATE_DIR, 'robots.txt'), txt);
  // Collect rules for the `*` group (we are not one of the named bots).
  const rules = [];
  let inStar = false, lastWasUA = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const [k, ...rest] = line.split(':');
    const key = k.trim().toLowerCase();
    const val = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!lastWasUA) inStar = false;
      if (val === '*') inStar = true;
      lastWasUA = true;
      continue;
    }
    lastWasUA = false;
    if (inStar && (key === 'allow' || key === 'disallow')) rules.push({ allow: key === 'allow', path: val });
  }
  robotsRules = rules;
  return rules;
}
export function isAllowed(urlStr) {
  const u = new URL(urlStr);
  if (u.origin !== SOURCE) return true; // CDN host has its own robots; checked separately
  const p = u.pathname;
  let best = null;
  for (const r of robotsRules || []) {
    if (r.path && p.startsWith(r.path) && (!best || r.path.length > best.path.length)) best = r;
  }
  return !best || best.allow;
}

// ---------- polite fetch: 1 rps per process, retries with exponential backoff ----------
let lastRequest = 0;
export async function politeFetch(url, { as = 'text', retries = 4 } = {}) {
  if (!isAllowed(url)) throw new Error(`robots.txt disallows ${url}`);
  for (let attempt = 0; ; attempt++) {
    const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    try {
      const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: '*/*' }, redirect: 'follow' });
      if (res.status === 404) return { status: 404, body: null, url: res.url };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = as === 'buffer' ? Buffer.from(await res.arrayBuffer()) : await res.text();
      return { status: res.status, body, url: res.url, contentType: res.headers.get('content-type') };
    } catch (err) {
      if (attempt >= retries) throw err;
      const backoff = 2000 * 2 ** attempt;
      log(`retry ${attempt + 1}/${retries} in ${backoff}ms: ${url} (${err.message})`);
      await sleep(backoff);
    }
  }
}

// ---------- resumable JSON state ----------
export function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
export function writeJSON(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file); // atomic-ish so a crash never leaves half a file
}

// ---------- Next.js App Router payload decoding ----------
export function decodeRsc(html) {
  const re = /self\.__next_f\.push\((\[.*?\])\)<\/script>/gs;
  let out = '';
  let m;
  while ((m = re.exec(html))) {
    try {
      const a = JSON.parse(m[1]);
      if (typeof a[1] === 'string') out += a[1];
    } catch { /* non-string chunk */ }
  }
  return out;
}

/** Return the JSON object literal that follows `key` (e.g. '"project":{') in a string. */
export function extractObject(s, key, from = 0) {
  const i = s.indexOf(key, from);
  if (i < 0) return null;
  const st = i + key.length - 1;
  const open = s[st];
  const close = open === '{' ? '}' : ']';
  let d = 0, inStr = false, esc = false, j = st;
  for (; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) d++;
    else if (c === close) { d--; if (d === 0) break; }
  }
  try { return JSON.parse(s.slice(st, j + 1)); } catch { return null; }
}

export function jsonLdBlocks(html) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
  let m;
  while ((m = re.exec(html))) { try { out.push(JSON.parse(m[1])); } catch { /* ignore */ } }
  return out;
}

export function metaTags(html) {
  const get = (re) => (html.match(re) || [])[1] || null;
  const dec = (s) => s && s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return {
    title: dec(get(/<title[^>]*>(.*?)<\/title>/s)),
    description: dec(get(/<meta name="description" content="([^"]*)"/)),
    canonical: get(/<link rel="canonical" href="([^"]*)"/),
    ogImage: get(/<meta property="og:image" content="([^"]*)"/),
  };
}

/** _next/image?url=... → original source URL. */
export function originalImageUrl(u) {
  if (!u) return u;
  try {
    const url = new URL(u, SOURCE);
    if (url.pathname.startsWith('/_next/image')) return decodeURIComponent(url.searchParams.get('url'));
    return url.href;
  } catch { return u; }
}
