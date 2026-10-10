# The Launch District QA report

Generated 2026-10-10T11:46:02.143Z against `http://localhost:3300` · 85 pages × 4 passes (desktop light, mobile light, mobile dark, desktop dark) · 1109 s

| Category | Errors | Warnings | Info |
|---|---:|---:|---:|
| Code hygiene | 0 | 1 | 1 |
| Content | 0 | 4 | 2 |
| Data consistency | 0 | 0 | 3 |
| Spelling | 0 | 0 | 7 |
| UI/UX | 0 | 0 | 4 |
| **Total** | **0** | **5** | **17** |

Severity: **error** = wrong or broken for users (fix before launch) · **warn** = inconsistent or weak · **info** = worth knowing; often caused by source data.

## Code hygiene

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| 🟠 warn | K05 placeholder config | Contact details in src/config/site.ts are still placeholders | src/config/site.ts |  |
| ⚪ info | K04 raw colour | Hex colour outside the token config | src/app/globals.css:158 | .hero .display em { font-style: italic; color: #E9DCC3; } |

## Content

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| 🟠 warn | C02 placeholder | Placeholder text "placeholder" is visible | /, /projects, /projects/4s-the-aurrum-sector-59-gurgaon +82 more | © 2026 The Launch District (placeholder entity). @ footer.band-night.mt-16 > div.border-t.hairline > div.wrap.space-y-2 > p ; Operator: The Launch District (placeholder entity). @ main#main > div.wrap.py-10 > div.prose-b |
| 🟠 warn | C02 placeholder | WhatsApp link points at the placeholder number | /, /projects/4s-the-aurrum-sector-59-gurgaon, /projects/adani-lushlands-gurgaon +62 more | https://wa.me/910000000000?text=Hi%20The%20Launch%20District |
| 🟠 warn | C02 placeholder | Placeholder text "Placeholder" is visible | /disclaimer | The Launch District’s agent registration number will appear here once issued. [Placeholder: add the HARERA agent registr @ main#main > div.wrap.py-10 > div.prose-brand.mt-10 > p |
| 🟠 warn | C06 inconsistent terminology | centre: "centre" ×151, "center" ×13 | /projects/elan-the-presidential-sector-106-gurgaon, /projects/emaar-amaris-sector-62-gurgaon, /projects/experion-the-trillion-sector-48-gurgaon | Minority form appears on 9 page(s) |
| ⚪ info | C06 inconsistent terminology | sq ft: "sq ft" ×1021, "sq.ft" ×75, "sq. ft" ×6, "sqft" ×6 | /projects/aipl-lake-city-sector-103-gurgaon, /projects/anant-raj-estate-residences-sector-63a-gurgaon, /projects/birla-arika-sector-31-nh8-gurgaon | Minority form appears on 3 page(s) |
| ⚪ info | C06 inconsistent terminology | ₹ format: "₹N␠Cr" ×849, "₹N␠L" ×69, "₹N␠Crore" ×3, "₹N␠Crores" ×3, "₹N␠Lakhs" ×1 | /, /projects, /projects/aipl-autograph-sector-66-gurgaon | Minority form appears on 1 page(s) |

## Data consistency

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | D07 stale possession | Under construction but stated possession Jun 2026 has passed — page flags it under the status line | /projects/elan-empire-sector-66-gurgaon |  |
| ⚪ info | D07 stale possession | Under construction but stated possession Sep 2026 has passed — page flags it under the status line | /projects/elan-paradise-sector-50-gurgaon |  |
| ⚪ info | D08 config table | Source lists 2407 sq ft for both 3 BHK and 4 BHK — page shows a verification note | /projects/4s-the-aurrum-sector-59-gurgaon |  |

## Spelling

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | S01 source data | "Fiber" → fibre / faber / Faber | /projects/4s-the-aurrum-sector-59-gurgaon, /projects/bptp-gaia-residences-sector-102-gurgaon, /projects/m3m-jewel-sector-25-gurgaon | Fiber Optic Internet  |
| ⚪ info | S01 source data | "Theater" → theatre / treater / heater | /projects/adani-the-marq-sector-102-gurgaon, /projects/elan-the-emperor-sector-106-gurgaon | Mini Theater  |
| ⚪ info | S01 source data | "amphitheater" → amphitheatre / amphitheatres / amphitheatre's | /projects/anant-raj-estate-residences-sector-63a-gurgaon, /projects/elan-the-emperor-sector-106-gurgaon, /projects/puri-the-aravallis-sector-61-gurgaon | Kids play areas, amphitheater, sunken garden, party lawn, |
| ⚪ info | S01 source data | "sqft" → sift / soft / sqrt | /projects/dlf-the-arbour-sector-63-gurgaon, /projects/silverglades-the-legacy-sector-63a-gurgaon | acres, it offers 4 BHK residences (3956 sqft) in the lowest density high-rise to |
| ⚪ info | S01 source data | "unrivaled" → unrivalled / unriveted / unrevealed | /projects/elan-the-emperor-sector-106-gurgaon | features, imported marble flooring, and unrivaled connectivity to Delhi, IGI Air |
| ⚪ info | S01 source data | "Barbeque" → barbecue / barque / baroque | /projects/smartworld-one-dxp-sector-113-gurgaon | Kids' Water Play & Barbeque Zone  |
| ⚪ info | S01 source data | "tranquility" → tranquillity / tranquilly / tranquil | /projects/sobha-aranya-sector-80-gurgaon | odern luxury, wellness, and undisturbed tranquility.  |

## UI/UX

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | U07 low-res image | Image shown at 584px but only 300px wide | /projects/adani-samsara-ivana-sector-63-gurgaon, /projects/aditya-birla-pravaah-sector-71-gurgaon, /projects/aipl-autograph-sector-66-gurgaon +15 more | http://localhost:3300/_next/image?url=%2Fmedia%2Fadani-samsara-ivana-sector-63-gurgaon%2Fgallery%2F0 ; http://localhost:3300/_next/image?url=%2Fmedia%2Faditya-birla-pravaah-sector-71-gurgaon%2Fgallery%2F |
| ⚪ info | U09 clipped text | 1 element(s) clip their text | /projects/4s-the-aurrum-sector-59-gurgaon, /projects/adani-lushlands-gurgaon, /projects/adani-samsara-ivana-sector-63-gurgaon +57 more | section#developer > div.card.mt-6 > a.btn.btn-ghost «All 4S Developers projects» ; section#developer > div.card.mt-6 > a.btn.btn-ghost «All Adani Realty projects» |
| ⚪ info | U12 touch target (documented exception) | 59 controls: map stations; every project is also reachable through a 44px card link | /, /markets, /markets/dwarka-expressway +6 more |  |
| ⚪ info | U12 touch target (documented exception) | 1 controls: map stations; every project is also reachable through a 44px card link | /projects/4s-the-aurrum-sector-59-gurgaon, /projects/adani-lushlands-gurgaon, /projects/adani-samsara-ivana-sector-63-gurgaon +56 more |  |

## Checks performed

- **Content:** leaked values (undefined/NaN/null), placeholders, repeated words, spacing and punctuation, unbalanced brackets, compound words broken by dashes, terminology and spelling-variant consistency (sq ft, pre-launch, Gurugram/Gurgaon, colour/color, -ise/-ize, ₹ formats).
- **Data consistency:** each project page against data/projects.json (name, price, RERA, possession, developer, FAQs); stale possession dates; contradictory configuration rows; home, listing, market and timeline counts against the dataset.
- **Spelling:** cspell (en + en-GB) over visible text plus alt, aria-label, title and placeholder text. Domain words are in scripts/qa/words.txt, and project and developer names are added from the data. Each word is attributed to site copy (fix here) or source data (from the listing).
- **UI/UX:** HTTP status of every page and internal link, in-page and cross-page #anchors, mailto/tel validity, rel=noopener, broken, stretched or low-res images, clipped text, button sizes, horizontal scroll at 375px, 44px touch targets, console and runtime errors.
- **Accessibility:** axe-core WCAG 2.1 A/AA (desktop light), colour contrast in all four theme/viewport combinations, visible keyboard focus, duplicate ids, controls without names, missing alt text.
- **SEO & structure:** title and description presence, length and uniqueness, canonical correctness, html lang, a single h1, heading-level skips, JSON-LD validity.
- **Code hygiene:** TODO/FIXME, console.log, brand name hard-coded outside src/config/site.ts, raw hex colours outside the token config, placeholder contact config.