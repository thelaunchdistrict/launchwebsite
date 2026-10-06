# Changelog

All notable changes to The Launch District are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- The corridor map's base layer (grid, sector numbers, roads, labels) is now served as pre-rendered **WebP** images (light and dark, with one variant per corridor) instead of inline SVG. Project markers remain an interactive SVG layer. Regenerate with `npm run map:webp`.
- Headings (h1–h3 and large serif text) are easier to read: Bodoni's optical size is pinned to a sturdier cut, weight is 500, and tracking and line height are looser.

- Readability pass across the site: labels, form labels, table headers, tags and buttons are larger with less letter spacing; the serif uses a sturdier cut below 20 px; map labels are larger and heavier.
- The due-diligence checklist is now a single **Verified** row above the project gallery: confirmed items as chips, then a "N to verify" dropdown menu listing everything still to check or missing.
- The configurations and pricing table shows three different configurations up front, with a "Show N more" toggle for the rest.
- **No phone number on the site.** The contact page no longer shows a number or a Call button, and the number is removed from the structured data and the config. Visitors leave their details in the form or message on WhatsApp.
- **About page rewritten** around the site's purpose: a curated, live portfolio of pre-launch and early-construction projects for early investors, updated as the market moves. Covers who it is for, how projects are chosen, how to work with us, principles and how we are paid.

### Added
- `npm run map:webp` script and an export-only page (404 on the live site) that renders the map base for it.
- Project README rewritten for the current stack, design system, engagement features and Cloudflare deployment.
- This changelog.

## [1.0.0] - 2026-10-05

The premium redesign.

### Added
- **Find your entry point:** a three-question quiz on the home page (budget, possession timeline, goal) that returns real matching projects and offers their price sheets.
- **Update tags** on cards and project pages: *Newly listed*, *Price updated* and *Verified (date)*, generated from dated records and aging out with each data refresh.
- **Announcement bar** with the latest refresh's real counts (projects re-verified, prices updated, new listings). A dismissal is remembered per refresh.
- **Commitment ladder** (save → compare → price sheet → site visit) on the shortlist page, with progress stored only in the visitor's browser.
- Compare-tray progress pips; a "Plan a site visit" next step after a price-sheet request.
- "Recently verified" sort on the projects listing.
- Night (`.band-night`) and stone (`.band-stone`) section bands; a midnight footer.

### Changed
- **Typography:** Bodoni Moda (display) and Jost (text and figures) replace Instrument Serif, Geist and Geist Mono. Monospace was removed, and the type scale is larger and airier.
- **Colour:** the "Midnight and terracotta" palette has a sandstone background, midnight navy structure, terracotta primary actions and brass for status. It meets WCAG AA in both modes.
- **Buttons:** 2 px corners, tracked capitals, a colour sweep and an arrow nudge on hover. Secondary actions are text links with a growing brass underline. Corner radii are consistent site-wide.
- **Copy:**
  - Hero: "Own the address before the city does."
  - Calls to action: "View the collection", "See your returns", "Private preview", "Receive the private price sheet", "Speak to an advisor".
  - "Unlock the price sheet" replaces "Price on request".
- Trust cards renamed "Verified at the source" and "Nothing hidden"; how-it-works steps renamed "Discover" and "Private access".
- The design brief was updated with the new palette and engagement principles.

### Fixed
- The `--ink-2` colour token was never emitted (the generator produced `--ink2`), so secondary text could render without its intended colour.
- The animated counters could start below zero for one frame.
- On phones, the header call to action no longer overflows, and the logo no longer wraps.
- On phones, the sort menu on the listing page no longer collapses to an empty box.
- Sideways-scrolling tables (pricing, corridor snapshot, compare) are reachable by keyboard.

## [0.6.0] - 2026-10-05

### Added
- Deployment on **Cloudflare Workers** through OpenNext (`wrangler.jsonc`, `open-next.config.ts`), with `npm run preview` and `npm run deploy` scripts.
- `public/_headers` with security and long-cache headers for static assets.
- Google Analytics 4 tag (`G-M9FV3ZFH8Y`) enabled by default; `NEXT_PUBLIC_GA4_ID` overrides it.

### Changed
- The default appearance is **Light**. Dark and System remain available in the footer.
- The file-based lead store runs only in development, because Workers have no writable disk. Production uses the webhook.
- The QA dark-mode passes select the dark theme explicitly.
- The privacy policy states that Google Analytics is in use.

## [0.5.0] - 2026-10-04

### Changed
- **Rebrand from "Falcon" to "The Launch District"** across the site, data, scripts and docs. It includes a new skyline-and-arrow logo and favicon and `tld-` storage keys.
- Page titles are shortened to fit the longer brand suffix in search results.

## [0.4.0] - 2026-10-04

### Added
- **Builder-first corrections** for all 60 projects (`data/verify/builder/`). Where sources disagree, the developer's own website, brochure, press release or RERA filing wins. The changes cover:

  | Field | Changes |
  |---|---|
  | RERA completion dates | 52 |
  | Possession | 28 |
  | Units | 27 |
  | Land area | 27 |
  | Configurations | 16 |
  | RERA numbers | 15 |
  | Starting prices | 13 |
  | Floors | 12 |
  | Towers | 11 |

- A "Verified with the developer" section on project pages, showing each change with its previous value, source and check date, and listing fields the developer does not publish.
- A RERA completion date shown next to the marketed possession date where they differ. The due-diligence checklist recommends planning around the RERA date.
- A price and information disclaimer on every project page, with "Raise a query" and WhatsApp actions.

### Changed
- Portals, brokers and news sites are rejected as correction sources. Values reported only by them are listed as unconfirmed.
- Curated projects keep the developer material on file; only a regulator filing can override them.
- Unit sizes are kept when a developer lists configurations without sizes.
- A RERA number found to belong to another project (M3M Capital Walk) was removed.
- Promoter companies (e.g. "DLF Home Developers Limited") are stored separately from the developer brand.

## [0.3.0] - 2026-10-02

### Added
- **Project verification agent** (`npm run verify`). It checks every project against independent web sources and writes a per-field verdict with severity and sources, plus a summary report.
- **Yugen Golf City** added as the hero project, curated from the developer's brochure, layout plan and poster, and placed first in the carousel.
- **Real map geography** from OpenStreetMap: roads, sectors and corridor assignments, with approximate placements marked.
- **Spotlight carousel** on the home page: five early-entry projects, swipeable and autoplaying.

### Fixed
- Wrong corridor (micro-market) assignments for 14 projects.

## [0.2.0] - 2026-10-02

### Added
- **Quality checker** (`npm run qa`). It audits content, data consistency, spelling, UI/UX, accessibility, SEO and code hygiene across four theme and viewport passes, and every finding it raised was fixed.

## [0.1.0] - 2026-10-02

Initial build.

### Added
- **Phase 1:** design research and design brief (`docs/design-brief.md`).
- **Phase 2:** a polite, resumable extractor for the source listing, producing 60 projects as JSON, CSV and JSON Schema, with deduplicated images, a manifest and an extraction report with a 10-project spot check.
- **Phase 3:** the website (Next.js App Router, TypeScript, Tailwind). It includes:
  - home and project listing with filters, sorting, map, shortlist and compare
  - project pages, micro-market pages and insights
  - ROI/IRR calculator, ₹/sq ft comparison and possession timeline
  - legal pages, lead capture, SEO and structured data
  - light and dark themes
- **Phase 4:** design review (`docs/design-review.md`) and the fixes it called for.

[Unreleased]: https://github.com/thelaunchdistrict/launchwebsite/compare/94b7764...HEAD
[1.0.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/938d033...94b7764
[0.6.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/e3a932a...938d033
[0.5.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/308d706...e3a932a
[0.4.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/054a714...308d706
[0.3.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/d6a08e9...054a714
[0.2.0]: https://github.com/thelaunchdistrict/launchwebsite/compare/0be2c2e...d6a08e9
[0.1.0]: https://github.com/thelaunchdistrict/launchwebsite/commits/0be2c2e
