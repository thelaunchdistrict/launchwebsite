// Verification agent: for each project, Claude researches the published facts on the open web
// (web_search server tool) and returns a structured verdict per field.
//
//   ANTHROPIC_API_KEY=… npm run verify                  all projects (resumable: skips existing results)
//   npm run verify -- --only slug-a,slug-b --force      re-check specific projects
//   npm run verify -- --concurrency 2
// Results: data/verify/<slug>.json → npm run verify:report → data/verify/verification-report.md
// Credentials: ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an `ant auth login` profile.
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { INSTRUCTIONS, OUT_DIR, RESULT_SCHEMA, brief, listedProjects } from './brief.mjs';

const MODEL = 'claude-opus-5-5';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const FORCE = args.includes('--force');
const ONLY = opt('--only', null)?.split(',');
const CONCURRENCY = Number(opt('--concurrency', 3));
const MAX_CONTINUATIONS = 5;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const client = new Anthropic({ maxRetries: 4 });
fs.mkdirSync(OUT_DIR, { recursive: true });

const WEB_SEARCH = { type: 'web_search_20260209', name: 'web_search', max_uses: 10, blocked_domains: ['realtycanvas.in'] };

/** Phase 1 — open research with web search; resumes server-side pauses (pause_turn). */
async function research(p) {
  const messages = [{
    role: 'user',
    content: `${INSTRUCTIONS}\n\nFacts our site publishes:\n${brief(p)}\n\nResearch each fact now. End with a plain list: for every field, our value, what the web says, your verdict, and the URLs.`,
  }];
  let final;
  for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      tools: [WEB_SEARCH],
      messages,
    });
    final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new Error(`refused (${final.stop_details?.category ?? 'unknown'})`);
    if (final.stop_reason !== 'pause_turn') break;
    // The server's tool loop paused: send the turn back unchanged and it resumes where it stopped.
    messages.push({ role: 'assistant', content: final.content });
  }
  messages.push({ role: 'assistant', content: final.content });
  const text = final.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const urls = [...new Set(final.content.flatMap((b) => (b.type === 'web_search_tool_result' && Array.isArray(b.content) ? b.content.map((r) => r.url) : [])))];
  return { text, urls };
}

/** Phase 2 — structured verdict (no tools) from the research notes. */
async function verdict(p, notes) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: RESULT_SCHEMA } },
    messages: [{
      role: 'user',
      content: `Turn these fact-check notes into the result JSON. Use slug "${p.slug}" and name "${p.name}". Include one check per field that was examined. Only cite URLs that appear in the notes or this list.\n\nOur facts:\n${brief(p)}\n\nResearch notes:\n${notes.text}\n\nURLs retrieved during research:\n${notes.urls.join('\n')}`,
    }],
  });
  if (res.stop_reason === 'refusal') throw new Error('refused while structuring');
  const text = res.content.find((b) => b.type === 'text')?.text ?? '';
  return JSON.parse(text);
}

async function verifyOne(p) {
  const file = path.join(OUT_DIR, `${p.slug}.json`);
  if (!FORCE && fs.existsSync(file)) return 'skipped';
  const notes = await research(p);
  const result = await verdict(p, notes);
  fs.writeFileSync(file, JSON.stringify({ ...result, checkedAt: new Date().toISOString(), method: `api:${MODEL}` }, null, 1));
  return result.overall;
}

const todo = listedProjects().filter((p) => !ONLY || ONLY.includes(p.slug));
log(`${todo.length} projects, concurrency ${CONCURRENCY}`);
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < todo.length) {
    const p = todo[next++];
    try { log(`${p.slug}: ${await verifyOne(p)}`); }
    catch (e) {
      if (e instanceof Anthropic.AuthenticationError) { log('No valid credentials: set ANTHROPIC_API_KEY or run `ant auth login`.'); process.exit(1); }
      log(`${p.slug}: FAILED — ${e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e.message}`);
    }
  }
}));
log('done — run `npm run verify:report`');
