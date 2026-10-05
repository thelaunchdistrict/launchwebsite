# The Launch District

An investment-research site for **early-stage real estate in Gurugram / NCR**: pre-launch, new-launch and under-construction projects, ranked by how early you are. Every project carries its ₹/sq ft, possession horizon, RERA number and a due-diligence checklist.

- **Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · static generation from `data/projects.json` · `next/image` (AVIF/WebP)
- **Data:** a polite, resumable extractor for `realtycanvas.in/projects` (Node + Playwright)
- **Docs:** [`docs/design-brief.md`](docs/design-brief.md), [`docs/design-review.md`](docs/design-review.md), [`data/extraction-report.md`](data/extraction-report.md)

## Quick start

```bash
npm install
npx playwright install chromium   # only needed for the scraper's listing cross-check
npm run setup                     # scrape → normalise → spot-check → report → build
npm start                         # http://localhost:3000
```

A fresh clone already contains `data/projects.json` and the web-optimised images in `public/media/`, so you can skip the scrape:

```bash
npm install && npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Builds image derivatives (`npm run media`), then `next build` |
| `npm run setup` | Full pipeline: `scrape` then `build` |
| `npm run scrape` | Discover all projects (sitemap.xml + rendered listing), re-fetch every page, download new images, normalise, spot-check 10 live pages, write the report |
| `npm run scrape:resume` | Resume an interrupted run: reuses discovery, skips pages and images already on disk |
| `npm run scrape:test` | Fetch only the first 3 projects (smoke test) |
| `npm run normalize` / `npm run report` / `npm run spot-check` | Individual pipeline steps |
| `npm run media` | Build `public/media/**.webp` from `data/images/**` (incremental) |
| `npm test` | Parser and finance unit tests (`node --test`) |
| `npm run lint` / `npm run typecheck` | ESLint / tsc |

### Project verification agent (`npm run verify`)

Checks every listed project's published facts against independent web sources: the state RERA portal, developer sites, major portals and news. The source site is excluded. It reports discrepancies field by field.

```bash
npm run verify            # needs ANTHROPIC_API_KEY (or `ant auth login`); resumable, skips projects already checked
npm run verify -- --only m3m-crown-sector-111-gurgaon --force
npm run verify:report     # → data/verify/verification-report.md + summary.json
```

Per project, Claude Opus 5.5 researches with the web-search server tool (resuming on `pause_turn`). A second, tool-free call then converts the notes into a fixed JSON verdict using structured outputs. Server-side refusal fallback is enabled. The instructions and schema live in `scripts/verify/brief.mjs`, so manual or subagent runs produce identical results (`data/verify/briefs/`). Verdicts per field are `match` / `partial` / `mismatch` / `unverified`, with a severity (`high` = would mislead an investor) and source URLs.

### Quality checker (`npm run qa`)

`npm run build && npm run qa` renders every page of the production build (sitemap + client-only routes) in four passes: desktop/light, mobile/light, mobile/dark and desktop/dark. It writes `qa/report.md` and `qa/report.json`, and exits with code 1 if anything is error-level, so it can gate CI. Options: `--quick` (two project pages instead of 60), `--url https://staging…` (audit a deployed site), `--no-fail`.

| Area | What it catches |
|---|---|
| Content | leaked `undefined`/`NaN`/`null`, placeholders, repeated words, spacing and punctuation, broken compound words, terminology drift (Gurugram vs Gurgaon, sq ft variants, colour/color, ₹ formats) |
| Data consistency | each project page against `data/projects.json` (name, price, RERA, possession, developer, FAQs); home, listing, market and timeline counts against the dataset; source contradictions the page fails to flag |
| Spelling | cspell (en + en-GB) over visible text and alt/aria/title text, each word attributed to *site copy* (error) or *source data* (info). Domain words go in `scripts/qa/words.txt` |
| UI/UX | page and link status, missing #anchors, mailto/tel validity, broken, stretched or low-res images, clipped text, horizontal scroll at 375px, 44px touch targets, console errors |
| Accessibility | axe-core WCAG 2.1 AA, colour contrast in all four theme/viewport passes, real keyboard Tab focus visibility, duplicate ids, nameless controls, missing alt |
| SEO & structure | title and description length and uniqueness, canonical correctness, single h1, heading skips, JSON-LD validity |
| Code hygiene | TODO/console.log, brand name hard-coded outside `src/config/site.ts`, raw hex colours outside tokens, placeholder contact config |

Intentional exceptions are declared in markup (`data-qa-touch-exempt="reason"`, `data-focus-ring`) so they are reported as documented exceptions rather than hidden.

### Scraper behaviour

- Reads `robots.txt` first and checks every URL against it. `/api/` is disallowed there, so the crawler never calls it. Data comes from the App Router flight payload embedded in each project page.
- Sends at most **1 request/second**, with a descriptive User-Agent, 4 retries and exponential backoff.
- Resumable state lives in `.scrape-state/` (git-ignored). Writes are atomic.
- Images are originals from the CDN, never `_next/image` resized copies. They are deduplicated by sha256 and recorded in `data/images-manifest.json` (slug, category, original URL, local path, size, hash, source). Images hosted on third-party sites are skipped on purpose and listed in the report.
- Never stores the source site's phone numbers, emails, logo, testimonials or user data.

### Data layout

```
data/
  projects.json            normalised dataset (schema: projects.schema.json)
  projects.csv             flat export (UTF-8 with BOM for Excel)
  projects.schema.json     JSON Schema (draft 2020-12)
  images-manifest.json     one row per image reference
  extraction-report.md     coverage, gaps, anomalies, spot-check
  images/<slug>/<category>/<nn>-<name>.<ext>   originals (git-ignored, ~240 MB)
public/media/…             web derivatives (WebP ≤1600px) the site ships
```

Missing values are `null`, never guessed. Derived values (indicative ₹/sq ft, micro-market, units/acre, dates found in FAQ text, launch stage stated in listing copy) are recorded per project in `provenance`.

## Rebranding

Everything brand-specific is in **`src/config/site.ts`**: name, tagline, contact details, WhatsApp number, light and dark colour tokens, disclaimer copy, lead-form options and analytics IDs. Colours are injected as CSS custom properties at runtime, so no stylesheet edits are needed. Corridor definitions live in `src/config/micromarkets.json`.

## Lead capture

`POST /api/lead` validates the input (Indian mobile number, consent, honeypot, light rate limit), then:

- `LEAD_WEBHOOK_URL` set → POSTs the lead as JSON. Point it at Zapier, Make, a CRM, or a Google Apps Script web app that appends to a Sheet.
- `LEAD_STORE=file` (default locally) → appends to `.leads/leads.jsonl`. On Vercel the filesystem is read-only, so **set a webhook in production**.

WhatsApp deep links pre-fill only the project name, never personal data.

## Analytics

GA4 and the Meta Pixel load only when `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID` are set. A `generate_lead` event fires on successful submission.

## Deploy (Vercel)

1. Push the repo and import it in Vercel (framework preset: Next.js).
2. Set `NEXT_PUBLIC_SITE_URL`, `LEAD_WEBHOOK_URL` and, optionally, the analytics IDs.
3. The build command stays `npm run build`. It works without `data/images` because `public/media` is committed. To refresh data, run `npm run scrape` locally and commit `data/` and `public/media/`.

## Before going live

- Replace the placeholder contact details and add the HARERA agent registration number (`/disclaimer`).
- Have counsel review `/privacy`, `/terms` and `/disclaimer`.
- **Image rights:** project photos and plans belong to the developers. Get permission, or swap in licensed or own photography, before public launch.

## Deploy on Cloudflare Workers

The site runs as a Cloudflare Worker through the OpenNext adapter (`@opennextjs/cloudflare`); config is in `wrangler.jsonc` and `open-next.config.ts`.

Workers Builds (Git-connected), project settings:

| Setting | Value |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy command | `npx opennextjs-cloudflare upload` |
| Root directory | `/` |
| Node.js version (build variable `NODE_VERSION`) | `22` |

Runtime variables and secrets (Settings → Variables and Secrets): `LEAD_WEBHOOK_URL` (secret), optional `LEAD_WEBHOOK_SECRET` (secret), `NEXT_PUBLIC_SITE_URL` (also as a *build* variable), optional `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID` (build variables). `LEAD_STORE=webhook` is already set in `wrangler.jsonc`.

Local commands: `npm run preview` (build + run in the Workers runtime), `npm run deploy` (build + deploy from your machine).
