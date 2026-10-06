# The Launch District QA report

Generated 2026-10-06T08:24:15.688Z against `http://localhost:3300` · 27 pages × 4 passes (desktop light, mobile light, mobile dark, desktop dark) · 193 s

| Category | Errors | Warnings | Info |
|---|---:|---:|---:|
| Code hygiene | 0 | 1 | 1 |
| Content | 0 | 5 | 1 |
| Data consistency | 0 | 0 | 1 |
| Spelling | 0 | 0 | 1 |
| UI/UX | 0 | 0 | 3 |
| **Total** | **0** | **6** | **7** |

Severity: **error** = wrong or broken for users (fix before launch) · **warn** = inconsistent or weak · **info** = worth knowing; often caused by source data.

## Code hygiene

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| 🟠 warn | K05 placeholder config | Contact details in src/config/site.ts are still placeholders | src/config/site.ts |  |
| ⚪ info | K04 raw colour | Hex colour outside the token config | src/app/globals.css:147 | --signal: #E3906B; --signal-soft: #3A2117; --on-signal: var(--night); --brass: var(--brass-bright);  |

## Content

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| 🟠 warn | C02 placeholder | Placeholder text "placeholder" is visible | /, /projects, /markets +24 more | © 2026 The Launch District (placeholder entity). @ footer.band-night.mt-16 > div.border-t.hairline > div.wrap.space-y-2 > p ; Operator: The Launch District (placeholder entity). @ main#main > div.wrap.py-10 > div.prose-b |
| 🟠 warn | C02 placeholder | WhatsApp link points at the placeholder number | /, /contact, /projects/4s-the-aurrum-sector-59-gurgaon +1 more | https://wa.me/910000000000?text=Hi%20The%20Launch%20District |
| 🟠 warn | C02 placeholder | Placeholder text "00000 00000" is visible | /contact | +91 00000 00000 @ dl.divide-y.divide-rule > div.flex.items-center > dd > a.link.num |
| 🟠 warn | C02 placeholder | Placeholder text "example.com" is visible | /contact, /privacy, /terms | hello@thelaunchdistrict.example.com @ dl.divide-y.divide-rule > div.flex.items-center > dd > a.link.inline-flex ; hello@thelaunchdistrict.example.com @ div.wrap.py-10 > div.prose-brand.mt-10 > p > a.link |
| 🟠 warn | C02 placeholder | Placeholder text "Placeholder" is visible | /disclaimer | The Launch District’s agent registration number will appear here once issued. [Placeholder: add the HARERA agent registr @ main#main > div.wrap.py-10 > div.prose-brand.mt-10 > p |
| ⚪ info | C06 inconsistent terminology | ₹ format: "₹N␠Cr" ×377, "₹N␠L" ×37 | /, /projects, /markets | Minority form appears on 8 page(s) |

## Data consistency

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | D08 config table | Source lists 2407 sq ft for both 3 BHK and 4 BHK — page shows a verification note | /projects/4s-the-aurrum-sector-59-gurgaon |  |

## Spelling

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | S01 source data | "Fiber" → fibre / faber / Faber | /projects/4s-the-aurrum-sector-59-gurgaon | Fiber Optic Internet  |

## UI/UX

| Sev | Check | Finding | Where | Evidence |
|---|---|---|---|---|
| ⚪ info | U09 clipped text | 1 element(s) clip their text | /projects/4s-the-aurrum-sector-59-gurgaon, /projects/adani-lushlands-gurgaon | section#developer > div.card.mt-6 > a.btn.btn-ghost «All 4S Developers projects» ; section#developer > div.card.mt-6 > a.btn.btn-ghost «All Adani Realty projects» |
| ⚪ info | U12 touch target (documented exception) | 59 controls: map stations; every project is also reachable through a 44px card link | /, /markets, /markets/dwarka-expressway +6 more |  |
| ⚪ info | U12 touch target (documented exception) | 1 controls: map stations; every project is also reachable through a 44px card link | /projects/4s-the-aurrum-sector-59-gurgaon, /projects/adani-lushlands-gurgaon |  |

## Checks performed

- **Content:** leaked values (undefined/NaN/null), placeholders, repeated words, spacing and punctuation, unbalanced brackets, compound words broken by dashes, terminology and spelling-variant consistency (sq ft, pre-launch, Gurugram/Gurgaon, colour/color, -ise/-ize, ₹ formats).
- **Data consistency:** each project page against data/projects.json (name, price, RERA, possession, developer, FAQs); stale possession dates; contradictory configuration rows; home, listing, market and timeline counts against the dataset.
- **Spelling:** cspell (en + en-GB) over visible text plus alt, aria-label, title and placeholder text. Domain words are in scripts/qa/words.txt, and project and developer names are added from the data. Each word is attributed to site copy (fix here) or source data (from the listing).
- **UI/UX:** HTTP status of every page and internal link, in-page and cross-page #anchors, mailto/tel validity, rel=noopener, broken, stretched or low-res images, clipped text, button sizes, horizontal scroll at 375px, 44px touch targets, console and runtime errors.
- **Accessibility:** axe-core WCAG 2.1 A/AA (desktop light), colour contrast in all four theme/viewport combinations, visible keyboard focus, duplicate ids, controls without names, missing alt text.
- **SEO & structure:** title and description presence, length and uniqueness, canonical correctness, html lang, a single h1, heading-level skips, JSON-LD validity.
- **Code hygiene:** TODO/FIXME, console.log, brand name hard-coded outside src/config/site.ts, raw hex colours outside the token config, placeholder contact config.