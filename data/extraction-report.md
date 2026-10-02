# Extraction report — realtycanvas.in/projects

Generated 2026-10-02T09:07:34.678Z from data built at 2026-10-02T08:58:23.710Z.

## Summary

| | |
|---|---|
| Projects in sitemap.xml | 60 |
| Projects on rendered /projects listing | 60 |
| /sitemap HTML page | HTTP 404 (0 project links) |
| Unique projects discovered | 60 |
| Projects extracted | **60** |
| Page fetch failures | 0 |
| Image references (manifest rows) | 613 |
| Unique image files stored (sha256-deduped) | 598 |
| Image download failures | 18 |
| Image bytes on disk | 251.9 MB (approx., includes duplicates' first copy only) |

**Source cross-check:** sitemap.xml and the rendered /projects listing contain exactly the same set of project slugs — no mismatch. The `/sitemap` HTML page returns 404, so it could not be used as a third source.

## Method

- robots.txt read first. It allows `/` and disallows `/api/`, `/admin/`, `/studio/`, `/projects/create` for `*`. The crawler checks every URL against these rules and **never requests `/api/`**. The CDN (`cdn.realtycanvas.in`) robots.txt carries content-signal comments only, with no directives.
- Project data comes from the Next.js App Router flight payload (`self.__next_f.push`) embedded in each `/projects/<slug>` HTML page. That is the same structured object the page renders from, so it is preferred over DOM scraping. JSON-LD and meta tags are captured too.
- The listing was enumerated by rendering `/projects` in headless Chromium (Playwright), scrolling and clicking any "load more" / "next" controls. The page's own front-end loads its data; the crawler does not call those endpoints itself.
- Rate limit ≤ 1 request/second (single process), descriptive User-Agent, 4 retries with exponential backoff (2s, 4s, 8s, 16s). State in `.scrape-state/` makes every step resumable (`npm run scrape:resume`).
- Images are fetched from the original CDN URLs found in the payload. These are originals, not `_next/image` resized variants; any `_next/image?url=` reference is decoded to its source.
- Excluded on purpose: the source site's own phone numbers, e-mails, logo, branding, testimonials and user data.

## Field coverage

Share of projects with a non-empty value. *Derived* fields are computed by Falcon from source fields and labelled as such in `provenance`.

### Identity

| Field | Coverage | Count |
|---|---:|---:|
| name | 100% | 60/60 |
| developer | 98% | 59/60 |
| projectType | 100% | 60/60 |
| status | 100% | 60/60 |
| reraNumber | 100% | 60/60 |
| launchDate | 2% | 1/60 |
| possessionDate | 55% | 33/60 |

### Location

| Field | Coverage | Count |
|---|---:|---:|
| sector | 98% | 59/60 |
| microMarket (derived) | 98% | 59/60 |
| city | 93% | 56/60 |
| address | 100% | 60/60 |
| latitude/longitude | 5% | 3/60 |
| landmarks | 0% | 0/60 |
| connectivity (nearby points) | 3% | 2/60 |

### Pricing

| Field | Coverage | Count |
|---|---:|---:|
| startingPrice | 98% | 59/60 |
| priceMax | 10% | 6/60 |
| pricePerSqft (source) | 0% | 0/60 |
| entryPricePerSqft (derived) | 75% | 45/60 |
| configurations | 77% | 46/60 |
| config-level price | 5% | 3/60 |
| config-level area | 75% | 45/60 |
| paymentPlan | 8% | 5/60 |
| bookingAmount | 0% | 0/60 |
| otherCharges | 0% | 0/60 |

### Project facts

| Field | Coverage | Count |
|---|---:|---:|
| landArea | 98% | 59/60 |
| towers | 82% | 49/60 |
| floors | 25% | 15/60 |
| units | 82% | 49/60 |
| unitsPerAcre (derived) | 82% | 49/60 |
| openSpacePercent | 0% | 0/60 |
| architect | 0% | 0/60 |
| landscapeDesigner | 0% | 0/60 |
| constructionPartner | 0% | 0/60 |

### Content

| Field | Coverage | Count |
|---|---:|---:|
| description | 100% | 60/60 |
| overview | 98% | 59/60 |
| highlights | 97% | 58/60 |
| amenities | 100% | 60/60 |
| specifications | 0% | 0/60 |
| faqs | 100% | 60/60 |
| investmentCommentary | 97% | 58/60 |

### Media

| Field | Coverage | Count |
|---|---:|---:|
| heroImage | 100% | 60/60 |
| gallery | 100% | 60/60 |
| floorPlans | 97% | 58/60 |
| sitePlan / location map | 67% | 40/60 |
| videos | 55% | 33/60 |
| virtualTours | 0% | 0/60 |
| brochurePdf | 0% | 0/60 |
| developerLogo | 0% | 0/60 |

### Metadata

| Field | Coverage | Count |
|---|---:|---:|
| seoTitle | 100% | 60/60 |
| seoDescription | 100% | 60/60 |
| scrapedAt | 100% | 60/60 |

**Fields the source does not publish for any project** (stored as `null` / `[]`, never guessed): launch date (except where stated in text), lat/long, landmarks, connectivity distances, open-space %, architect, landscape designer, construction partner, specifications, other charges, developer logo, brochure PDF, virtual tours.

## Projects with notable missing data

| Project | Missing |
|---|---|
| Adani The Marq | possessionDate, configurations |
| AIPL Autograph | possessionDate, configurations, units |
| AIPL Joy District | possessionDate, configurations, units |
| BPTP Downtown 66 | possessionDate, configurations |
| DLF Central 67 | possessionDate, configurations, units |
| Club Arcade DLF | possessionDate, configurations, units, landArea |
| Elan Empire | configurations, units |
| Elan Paradise | configurations, units |
| M3M Capital Walk | possessionDate, configurations, units |
| M3M Jewel | possessionDate, configurations, units |
| M3M Paragon57 | configurations, units |
| M3M Route 65 | possessionDate, configurations, units |
| Sobha Crescent | configurations, floorPlans |
| SPJ Vedatam | possessionDate, units |
| The Oryza | startingPrice, configurations |
| Yugen Greens | possessionDate, microMarket |

## Failed downloads / fetches

18 image reference(s) point to hosts other than realtycanvas.in (developer or agent sites that the listing hot-links). They were **deliberately not downloaded**, because the crawler's scope is the source site and its CDN. The original URLs are kept in projects.json. Real download errors: 0.

- image https://www.m3mrealty.com/commercial/m3m-jewel-mg-road-gurgaon/images/pictures/3.jpg: skipped: third-party host www.m3mrealty.com
- image https://www.m3mrealty.com/commercial/m3m-jewel-mg-road-gurgaon/images/pictures/1.jpg: skipped: third-party host www.m3mrealty.com
- image https://www.m3mrealty.com/commercial/m3m-jewel-mg-road-gurgaon/images/gallery/3.jpg: skipped: third-party host www.m3mrealty.com
- image https://www.m3mrealty.com/commercial/m3m-jewel-mg-road-gurgaon/images/gallery/5.jpg: skipped: third-party host www.m3mrealty.com
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/Ground-Floor.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/floorplan-zoom-2.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/floorplan-zoom-3.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/floorplan-zoom-4.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/floorplan-zoom-5.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/floorplan-zoom-6.webp: skipped: third-party host m3mgurugram.co.in
- image https://d2dy9w7mmecm6m.cloudfront.net/dy-images/retail/GlimpsesOfMasterpiece/Artboard_3_-_bhVH75xcv9RR.jpg: skipped: third-party host d2dy9w7mmecm6m.cloudfront.net
- image https://d2dy9w7mmecm6m.cloudfront.net/dy-images/retail/GlimpsesOfMasterpiece/Artboard_2_-_oWAvlEI4TDjw.jpg: skipped: third-party host d2dy9w7mmecm6m.cloudfront.net
- image https://d2dy9w7mmecm6m.cloudfront.net/dy-images/retail/GlimpsesOfMasterpiece/Artboard_1_-_R48SeGuEXfBE.jpg: skipped: third-party host d2dy9w7mmecm6m.cloudfront.net
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/SITE-PLAN.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/LGF.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/FIRST.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/SECOND.webp: skipped: third-party host m3mgurugram.co.in
- image https://m3mgurugram.co.in/wp-content/uploads/2024/12/THIRD.webp: skipped: third-party host m3mgurugram.co.in

## Things that look wrong (anomalies)

- 4S The Aurrum: the same area (2407 sq ft) is listed for different BHK types (3, 4) — likely a data-entry error at source
- Adani The Marq: slug says sector 102 but address/locality says 102A
- Elan Empire: possession 2026-06 is in the past but status is under-construction
- Elan Paradise: possession 2026-09 is in the past but status is under-construction
- Yugen Greens: no micro-market could be derived (sector —, city —)
- 43/60 projects list every configuration as "Price on Request"; only the project-level starting price is numeric.
- 55/60 projects carry the same templated location paragraph ("…enjoys a strategic address…"). Falcon treats it as boilerplate and does not show it as project-specific analysis.
- 3/60 projects have generic placeholder highlights (e.g. "Prime Location", "24/7 Security").

## Spot-check against live pages

10 random projects re-fetched at 2026-10-02T06:58:49.631Z; **10/10 matched on every check** (name visible on the page, RERA no., starting price, status, developer, and counts of configurations, floor plans, FAQs and gallery images).

| Project | Result | Failed checks |
|---|---|---|
| 4s-the-aurrum-sector-59-gurgaon | ✅ match | — |
| m3m-golf-hills-sector-79-gurgaon | ✅ match | — |
| elan-imperial-sector-82-gurgaon | ✅ match | — |
| shapoorji-pallonji-the-dualis-sector-46-gurgaon | ✅ match | — |
| yugen-greens-goa-golf-township | ✅ match | — |
| dlf-privana-north-sector-76-77-gurgaon | ✅ match | — |
| puri-diplomatic-residency-sector-111-gurgaon | ✅ match | — |
| m3m-route-65-sector-65-gurgaon | ✅ match | — |
| conscient-elevate-reserve-sector-62-gurgaon | ✅ match | — |
| dlf-the-arbour-sector-63-gurgaon | ✅ match | — |
