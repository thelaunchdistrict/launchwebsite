// Spelling: cspell with en + en-GB (Indian English follows British spelling; US forms are reported by
// the terminology-consistency check instead). Each unknown word is attributed to where it comes from:
//   site copy  → text written in src/ (fixable here, reported as error)
//   source data → text that came from the scraped listings (reported as info, with suggestions)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spellCheckDocument } from 'cspell-lib';

export async function makeSpeller(root, projects) {
  const req = createRequire(path.join(root, 'package.json'));
  const gb = req.resolve('@cspell/dict-en-gb/cspell-ext.json');
  const words = fs.readFileSync(path.join(root, 'scripts/qa/words.txt'), 'utf8').split(/\r?\n/).map((w) => w.trim()).filter((w) => w && !w.startsWith('#'));
  // Proper nouns from the dataset are not spelling errors.
  for (const p of projects) {
    for (const s of [p.name, p.developer.name, p.developer.nameRaw, p.location.locality, p.location.address, ...(p.location.connectivity || []).map((c) => c.name)]) {
      if (s) words.push(...s.split(/[^A-Za-z']+/).filter((w) => w.length > 1));
    }
  }
  const srcText = [...walk(path.join(root, 'src'))].map((f) => fs.readFileSync(f, 'utf8')).join('\n').toLowerCase();
  const dataText = fs.readFileSync(path.join(root, 'data/projects.json'), 'utf8').toLowerCase();
  const settings = { language: 'en,en-GB', import: [gb], words: [...new Set(words)], ignoreRegExpList: ['/[A-Z]{2,}[\\w/-]*\\d[\\w/-]*/g', '/\\b\\w*\\d\\w*\\b/g', '/https?:\\S+/g'], minWordLength: 4 };
  const cache = new Map();
  return {
    async check(text) {
      if (cache.has(text)) return cache.get(text);
      const r = await spellCheckDocument({ uri: 'file:///qa/page.txt', text, languageId: 'plaintext', locale: 'en-GB' }, { noConfigSearch: true, generateSuggestions: true, numSuggestions: 3 }, settings);
      const issues = r.issues.map((i) => ({ word: i.text, suggestions: (i.suggestions || []).slice(0, 3), context: i.line?.text?.slice(Math.max(0, i.offset - (i.line?.offset ?? 0) - 40), i.offset - (i.line?.offset ?? 0) + 40) ?? '' }));
      cache.set(text, issues);
      return issues;
    },
    origin(word) {
      const w = word.toLowerCase();
      const inSrc = srcText.includes(w), inData = dataText.includes(w);
      return inSrc && !inData ? 'site copy' : inData ? 'source data' : 'site copy';
    },
  };
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|json)$/.test(e.name)) yield p;
  }
}
