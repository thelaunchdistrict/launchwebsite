# Falcon

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
