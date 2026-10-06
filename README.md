# The Launch District

Private early-entry research for **real estate in Gurugram / NCR**. The site covers pre-launch, new-launch and early-construction residences, each checked against what its developer publishes, priced per square foot and placed on the possession timeline. Visitors can shortlist, compare, model returns and request the private price sheet.

- **Live repo:** `github.com/thelaunchdistrict/launchwebsite` (branch `main` deploys automatically to Cloudflare)
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · static generation from `data/projects.json` · Cloudflare Workers via OpenNext
- **Docs:** [design brief](docs/design-brief.md) · [design review](docs/design-review.md) · [extraction report](data/extraction-report.md) · [verification report](data/verify/verification-report.md) · [changelog](CHANGELOG.md)

---

## Contents

1. [Quick start](#quick-start)
2. [What's on the site](#whats-on-the-site)
3. [Design system](#design-system)
4. [Engagement features](#engagement-features)
5. [Data pipeline](#data-pipeline)
6. [Verification and builder-first corrections](#verification-and-builder-first-corrections)
7. [Quality checker](#quality-checker)
8. [Configuration](#configuration)
9. [Deploy on Cloudflare](#deploy-on-cloudflare)
10. [Project structure](#project-structure)
11. [Before going live](#before-going-live)

---

## Quick start

Requires Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:3000
```

A fresh clone already contains `data/projects.json` and the web-optimised images in `public/media/`, so no scrape is needed to run the site.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Builds image derivatives (`npm run media`), then `next build` |
| `npm start` | Serves the production build |
| `npm run preview` | Builds for Cloudflare and runs it locally in the Workers runtime |
| `npm run deploy` | Builds for Cloudflare and deploys from your machine |
| `npm test` | Parser and finance unit tests (`node --test`) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run qa` | Full quality audit of the production build (see [Quality checker](#quality-checker)) |
| `npm run setup` | Full data pipeline (`scrape`), then `build` |
| `npm run scrape` / `scrape:resume` / `scrape:test` | Extract projects from the source listing (see [Data pipeline](#data-pipeline)) |
| `npm run normalize` | Re-normalise the dataset and rebuild map geometry |
| `npm run verify` / `verify:report` | Independent web verification of every project |
| `npm run geo:fetch` / `geo` | Fetch OpenStreetMap geography / rebuild the corridor map data |
| `npm run map:webp` | Re-render the corridor map's base layer as WebP files (needs `npm run build` first) |

---

## What's on the site

| Route | Purpose |
|---|---|
| `/` | Hero, corridor map, spotlight carousel, "Find your entry point" quiz, early-entry collection, micro-market table, private-preview form |
| `/projects` | All projects with filters (stage, corridor, budget, BHK, possession year, developer), sorting, grid or map view; filters live in the URL |
| `/projects/[slug]` | Project file: gallery, Entry Rail, pricing table, floor plans, location, investment view, due-diligence checklist, "Verified with the developer" changes, FAQs, price-sheet form |
| `/markets`, `/markets/[slug]` | Corridor pages with medians, growth drivers, risks and projects |
| `/tools/roi-calculator` | ROI and IRR calculator for under-construction purchases |
| `/tools/price-per-sqft` | ₹/sq ft comparison across projects |
| `/tools/possession-timeline` | Projects by delivery year |
| `/shortlist`, `/compare` | Saved projects (this browser only), progress ladder, side-by-side comparison of up to three |
| `/insights`, `/insights/[slug]` | Guides: stages, price sheets, due diligence |
| `/about`, `/contact`, `/disclaimer`, `/privacy`, `/terms` | Company and legal pages |
| `/api/lead` | Lead capture endpoint |

SEO: per-page metadata and canonicals, `sitemap.xml`, `robots.txt`, schema.org JSON-LD (Organization, RealEstateListing / Residence / Offer, FAQPage, Article, BreadcrumbList).

---

## Design system

Defined in [`src/config/site.ts`](src/config/site.ts) (tokens) and [`src/app/globals.css`](src/app/globals.css) (components); the reasoning is in the [design brief](docs/design-brief.md).

**Typography.** Bodoni Moda (a high-contrast Didone with optical sizes) for headlines, prices and the wordmark. Jost (geometric, in the Futura tradition) for body, labels and figures, using tabular lining numerals. No monospace. Body text is 17 px at 1.7 line height. Labels are small capitals tracked at 0.16–0.24em.

**Colour: "Midnight and terracotta".** Every text pair meets WCAG AA in light and dark mode.

| Role | Light | Use |
|---|---|---|
| Paper | `#F4EFE7` sandstone | Page background |
| Stone | `#EAE3D7` | Alternating section bands |
| Ink / Night | `#111A2C` / `#0E1626` midnight | Text, structure, full-width dark bands |
| Signal | `#A9472B` terracotta | "Early" marks and the single primary action per view |
| Brass | `#7E602C` (on dark `#C2A066`) | Reward and status only: hero project, verified, price updated, progress |

Light is the default appearance. Dark and System are available in the footer, and the choice is remembered.

**Components.**
- Buttons have 2 px corners and tracked capitals. On hover, the colour sweeps across and the arrow moves forward.
- Secondary actions are text links (`.cta-line`) whose brass underline grows on hover.
- Tags (`.tag`, `.tag-early`, `.tag-hero`, `.tag-brass`) always combine text with a shape, never colour alone.
- Sections alternate paper, stone (`.band-stone`) and night (`.band-night`). Night bands re-point the theme tokens, so anything placed inside adapts automatically.

**Rebranding.** The brand name, tagline, contact details, colours, disclaimer, lead-form options and analytics ID all live in `src/config/site.ts`. Colours are injected as CSS custom properties at runtime, so no stylesheet edits are needed.

---

## Engagement features

These use the motivation patterns from game design, with **real data only and no dark patterns**. There are no countdown timers, no invented scarcity and no "people viewing" counters; India's 2023 CCPA dark-pattern guidelines and RERA advertising rules apply.

| Feature | Where | How it stays honest |
|---|---|---|
| **Update tags**: Newly listed, Price updated, Verified *date* | Cards, project pages | Generated from dated records (`sourceCreatedAt`, builder `corrections[].checkedAt`), relative to the dataset refresh, so they age out |
| **Announcement bar** | Above the header | Counts come from the dataset. A dismissal is remembered per data refresh, so the bar returns only when something has changed |
| **Find your entry point** | Home | Three answers become ordinary listing filters, and the results are real matches |
| **Commitment ladder**: save → compare → price sheet → site visit | Shortlist page, compare tray, lead-form success | Progress is stored only in the visitor's browser (`tld-journey`) and never sent anywhere |
| **Curiosity gap** | Pricing tables | "Unlock the price sheet" appears only where the developer has genuinely not published a price |
| **Limited inventory** tag | Cards | Shown only when the source reports 15% or less of units available |

---

## Data pipeline

The extractor lives in `scripts/scrape/` and reads `realtycanvas.in/projects` politely:

- Reads `robots.txt` first and checks every URL against it. Data comes from the App Router flight payload embedded in each page, and disallowed `/api/` routes are never called.
- Sends at most **one request per second**, with a descriptive User-Agent, retries and exponential backoff. State is resumable (`.scrape-state/`, written atomically).
- Downloads original images (never resized copies), deduplicates them by sha256 and records them in `data/images-manifest.json`.
- **Never** stores the source site's phone numbers, emails, branding, logo, testimonials or user data.

```
data/
  projects.json            normalised dataset (schema: projects.schema.json)
  projects.csv             flat export (UTF-8 with BOM for Excel)
  projects.schema.json     JSON Schema (draft 2020-12)
  images-manifest.json     one row per image reference
  extraction-report.md     coverage, gaps, anomalies, 10-project spot check
  curated/                 hand-curated projects from developer material (e.g. Yugen Golf City)
  verify/                  independent checks and builder-first corrections
  geo/                     OpenStreetMap roads and sector geometry
  images/                  originals (git-ignored, ~240 MB)
public/media/              web derivatives (WebP ≤1600 px) the site ships
```

Missing values are `null`, never guessed. Derived values (indicative ₹/sq ft, micro-market, units per acre, dates found in FAQ text) are recorded per project in `provenance`.

**Curated projects.** Files in `data/curated/*.json` are merged at normalise time (`source: "curated"`). They can supersede a scraped listing (`supersedes`) and carry a spotlight rank (`featured`). Yugen Golf City, the hero project, is curated from the developer's brochure, layout plan and poster.

**Map.** Corridors and sectors come from OpenStreetMap data (© OpenStreetMap contributors, ODbL). Projects are placed at their published coordinates when those check out, otherwise at their sector's centre, and approximate placements are marked as such. The base layer (grid, sector numbers, roads, labels) ships as pre-rendered WebP images in `public/media/map/` (light and dark, plus one variant per corridor with the others dimmed). The project markers stay a live SVG layer on top, so they remain links with hover details. After changing `data/geo` or the map styling, run `npm run build && npm run map:webp` and commit `public/media/map/`. The export page behind this (`/map-base/…`) returns 404 unless the server is started with `MAP_BASE_EXPORT=1`, which the script does itself.

---

## Verification and builder-first corrections

**Independent check (`npm run verify`).** Claude Opus 5.5 researches each project with web search: the state RERA portal, developer sites, portals and news, but never the source site. It then returns a structured verdict per field (`match` / `partial` / `mismatch` / `unverified`), with severity and source URLs. The run needs `ANTHROPIC_API_KEY`, is resumable, and writes to `data/verify/` and `verification-report.md`.

```bash
npm run verify -- --only m3m-crown-sector-111-gurgaon --force
npm run verify:report
```

**Builder-first rule.** Where sources disagree, the developer's own published information wins. Corrections live in `data/verify/builder/<slug>.json` and are applied during `npm run normalize` by `scripts/scrape/apply-builder.mjs`.
- **Accepted sources:** the developer's official site, brochure or press release, or the developer's own RERA filing.
- **Rejected sources:** portals, brokers and news sites (enforced by a deny-list).
- **Recording:** each change keeps the previous value, source URL, quote and check date. It appears on the project page under "Verified with the developer".
- **Unpublished fields:** fields the developer does not publish are listed as "Not published by the developer".
- **Curated projects:** for these, only the regulator filing can override the material on file.

---

## Quality checker

`npm run build && npm run qa` renders every page of the production build in four passes (desktop light, mobile light, mobile dark, desktop dark). It writes `qa/report.md` and `qa/report.json`, and exits with code 1 on any error, so it can gate CI. Options: `--quick`, `--url https://staging…`, `--no-fail`.

| Area | What it catches |
|---|---|
| Content | leaked `undefined`/`NaN`/`null`, placeholders, repeated words, punctuation, terminology drift |
| Data consistency | every project page against `data/projects.json`; counts on home, listing, market and timeline pages |
| Spelling | cspell (en + en-GB) over visible and alt/aria text; domain words in `scripts/qa/words.txt` |
| UI/UX | broken links and anchors, images, clipped text, horizontal scroll at 375 px, 44 px touch targets, console errors |
| Accessibility | axe-core WCAG 2.1 AA, contrast in all four passes, keyboard focus visibility, scrollable regions |
| SEO | title and description length and uniqueness, canonicals, single h1, heading order, JSON-LD |
| Code hygiene | stray TODO/console.log, hard-coded brand name or colours, placeholder contact config |

Intentional exceptions are declared in markup (`data-qa-touch-exempt="reason"`), so they appear in the report as documented exceptions rather than being hidden.

---

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | build | Canonical URLs, sitemap, Open Graph (defaults to a placeholder) |
| `LEAD_STORE` | runtime | `webhook` in production (set in `wrangler.jsonc`); `file` writes `.leads/leads.jsonl` in local development only |
| `LEAD_WEBHOOK_URL` | runtime secret | Where leads are POSTed as JSON (Zapier, Make, Google Apps Script → Sheet, CRM). **Required in production**: without it, leads only reach the Worker logs |
| `LEAD_WEBHOOK_SECRET` | runtime secret | Optional bearer token sent to the webhook |
| `NEXT_PUBLIC_GA4_ID` | build | Overrides the default Google Analytics property `G-M9FV3ZFH8Y` |
| `NEXT_PUBLIC_META_PIXEL_ID` | build | Enables the Meta Pixel (off when unset) |
| `ANTHROPIC_API_KEY` | local | Only for `npm run verify` |

Copy `.env.example` to `.env.local` for local development.

**Lead capture.** `POST /api/lead` validates the name, an Indian mobile number and consent. It also has a honeypot field and a per-IP rate limit. It fires a `generate_lead` analytics event on success. WhatsApp deep links pre-fill only the project name, never personal data.

---

## Deploy on Cloudflare

The site runs as a Cloudflare Worker through the OpenNext adapter (`@opennextjs/cloudflare`). Configuration is in `wrangler.jsonc` (Worker name `launchwebsite`, `nodejs_compat`, Images binding) and `open-next.config.ts` (static-assets incremental cache, so no R2 or KV is needed). Security and cache headers for static files are in `public/_headers`.

Workers Builds (Git-connected) settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy command | `npx opennextjs-cloudflare upload` |
| Root directory | `/` |
| Build variable `NODE_VERSION` | `22` |

Add the runtime secrets and build variables from [Configuration](#configuration) under Settings → Variables and Secrets. The build works without `data/images/` because `public/media/` is committed. To refresh data, run `npm run scrape` locally and commit `data/` and `public/media/`.

---

## Project structure

```
src/
  app/                 routes (see "What's on the site"), globals.css, layout.tsx
  components/
    chrome/            header, footer, tab bar, announcement bar, logo, theme switch, analytics
    home/              spotlight carousel, Find your entry point quiz
    listing/           project explorer and URL-backed filters
    project/           card, badges and update tags, Entry Rail, gallery, floor plans, sticky CTA
    shortlist/         shortlist, compare tray and view, journey ladder
    lead/              lead form, WhatsApp link
    map/               corridor map (server-rendered SVG + client view)
    tools/             ROI calculator
  config/              site.ts (brand, tokens, contact), micromarkets.json
  content/             insight articles
  lib/                 data access, types, stage logic, formatting, finance, geo, shortlist stores
scripts/
  scrape/              discover, fetch, images, parse, normalise, builder corrections, report, spot check
  verify/              verification agent and report
  geo/                 OpenStreetMap fetch and map build
  build/               image derivatives
  qa/                  quality checker
data/                  dataset, schema, curated projects, verification, geography
docs/                  design brief and design review
```

---

## Before going live

- [ ] Replace the placeholder phone, WhatsApp and email in `src/config/site.ts`, and add the HARERA agent registration number on `/disclaimer`.
- [ ] Set `LEAD_WEBHOOK_URL` in Cloudflare so leads are delivered.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the final domain.
- [ ] Have counsel review `/privacy`, `/terms` and `/disclaimer`.
- [ ] **Image rights:** project photos and plans belong to the developers. Get permission, or replace them with licensed or own photography.
- [ ] Review the open data questions in the latest verification notes (e.g. M3M Trump Towers status, AIPL Lake City identity).
