# The Launch District — Design Review

*Phase 4. I reviewed the built site against `docs/design-brief.md` on a production build (`next build && next start`). Coverage: home, listing (grid, map, mobile filter sheet), project detail (M3M Crown, Sobha Aranya), ROI calculator, ₹/sq ft, possession timeline and market pages, at 375px and 1280px, in light and dark. The HIG reference is developer.apple.com (the HIG skill bundle is not installed here; see the brief).*

## Method

- Manual walkthroughs in a browser at desktop (1280×860) and mobile (375×812), with appearance forced to light and to dark through the footer switch.
- An automated pass with Playwright over **21 routes × 2 colour schemes at 375px**, checking horizontal overflow, interactive targets under 44px and console/page errors. A second pass covered **all 60 project pages** for overflow.
- Lighthouse 12 on the production build (simulated throttling), mobile and desktop.

### Lighthouse (after fixes)

| Page | Mobile perf | Desktop perf | Accessibility | Best practices | SEO |
|---|---:|---:|---:|---:|---:|
| `/` | 90 (warm; 54–95 cold) | 100 | 100 | 100 | 100 |
| `/projects` | 90 | 100 | 100 | 100 | 100 |
| `/projects/m3m-crown-…` | 96 | 100 | 100 | 100 | 100 |
| `/tools/roi-calculator` | 95 | 100 | 100 | 100 | 100 |
| `/markets/dwarka-expressway` | 91 | — | 100 | 100 | 100 |

Before fixes, mobile was home 81 / listing 71 (CLS 0.31) / calculator 88 (CLS 0.17), with accessibility 97–99.

---

## Platform honesty

What the HIG asks for, what I found and what I changed.

| # | Finding | HIG principle | Fix | Status |
|---|---|---|---|---|
| 1 | The listing and calculator read `useSearchParams` during render. Static prerender then bailed out to a Suspense fallback, so the grid was not in the HTML, and the page jumped when it hydrated (CLS 0.31 / 0.17). | Layout stability; content first | URL state is applied after mount and written back with `history.replaceState`. The full grid ships in the HTML. | ✅ Fixed (CLS 0) |
| 2 | Home main-thread work was high because 60+ `<Link>`s (map stations and cards) all prefetched. | Responsiveness | `prefetch={false}` on dense link sets | ✅ Fixed (TBT 780 → 40 ms) |
| 3 | The listing rendered all 60 cards (3,200 DOM nodes). | Progressive disclosure | First 18 cards, then "Show 18 more". The page resets to the first set when filters change. | ✅ Fixed |
| 4 | Counter values used `aria-label` on a plain `<span>` (prohibited ARIA). | Accessibility labels | Visually hidden text instead | ✅ Fixed |
| 5 | The due-diligence "Check" chip was 3.77:1 contrast (caution text on a tinted fill). | Contrast ≥ 4.5:1 | Outline chip, ink text, coloured icon. State is carried by icon and word, never colour alone. | ✅ Fixed |
| 6 | Heading order on the listing (h1 → h3 cards). | Hierarchy | Visually hidden "Results" h2 | ✅ Fixed |
| 7 | Filter-token chips were 36px tall. | 44pt minimum hit target | `min-h-11` (44px) | ✅ Fixed |
| 8 | Row headers in ledger tables inherited the uppercase column-header style ("GOLF COURSE ROAD"). | Typography hierarchy | Header styles scoped to `thead th` | ✅ Fixed |
| 9 | The corridor map at 375px shrank labels to about 6px. | Legibility; Dynamic Type spirit | Larger SVG type (16/12px), and a 540px minimum canvas inside a horizontally scrollable frame on phones | ✅ Fixed |
| 10 | The map's minimum width blew out its grid track, and a long unbroken RERA number did the same in the checklist. Both caused page-level horizontal scroll. | No horizontal page scroll | `min-width: 0` on cards; `overflow-wrap: anywhere` in the checklist | ✅ Fixed. All 81 routes checked. |
| 11 | The gallery mosaic left empty cells for projects with fewer than 5 images. | Consistent layout | The mosaic adapts to 1, 2, 3, 4 or 5+ images | ✅ Fixed |
| 12 | The possession-year histogram bars rendered at zero height (percentage height with no sized parent). | Charts must show the data | Bars sit in a flex track | ✅ Fixed |
| 13 | The ₹/sq ft chart used `display:grid` on table rows, which breaks table semantics in some screen readers. | Accessible charts | Rebuilt as an ordered list; each bar has a `role="img"` label with real values | ✅ Fixed |
| 14 | Counters could stay mid-count if `requestAnimationFrame` paused in a background tab. | Motion must never be the only carrier of information | Timeout fallback sets the final value; reduced-motion users see final values immediately | ✅ Fixed |
| 15 | Compare: removing every project brought the URL's list back. | Predictable state | The URL seeds the list once; the local list rules after that | ✅ Fixed |
| 16 | A range showed "2028 – 2028". | Clarity | `monthRange()` collapses equal ends | ✅ Fixed |

**Verified as compliant:** visible focus rings (2px, `--focus`, offset) on every control. The filter sheet and lightbox are modal dialogs with focus trap, Escape and focus return. A skip link is present. Every form control has a visible label and errors are shown as text with an icon. The mobile tab bar holds navigation only, with safe-area padding. The theme defaults to System and the override sits in the footer. `prefers-reduced-motion` turns animations into instant state changes. Image alt text is generated from project, category and location. Status always pairs a word with a shape (diamond for early, dot otherwise).

## Point of view

What makes this specifically The Launch District, and where it slipped.

- **The Entry Rail carries the brand.** It is on every card, the detail hero, compare and the market pages, and it says "how early" without copy. In review it read clearly at card size. Sharpened: the line under the rail now states where the position came from ("estimated from the stated possession date"), which turns a decoration into a claim with a source.
- **The Corridor Map is the second signature,** and reviewers will screenshot it. On desktop it reads like a transit diagram on survey paper. On phones it was the weakest moment (finding 9), so it now scrolls in its frame rather than shrinking into noise.
- **Ledger cards.** Mono tabular numerals in a two-by-two grid, with the price in Indian lakh/crore. Next to a typical portal card it looks like research, not advertising. The asterisk on derived ₹/sq ft stays, because honesty is part of the identity.
- **Restraint held.** Vermilion appears only on early-entry badges, the rail fill, the single primary CTA and the median dot on the ₹/sq ft chart. There are no gradients and no gold. Dark mode keeps the same voice: warm near-black with lighter raised surfaces, never pure black.
- **Instrument Serif at display sizes** gives the editorial tone. It is never used below about 20px, where Geist takes over.
- **Copy voice:** numerate and plain ("₹/sq ft vs corridor −9%", "Runway to possession 2y 2m"), and every "why invest" point carries "the catch". That is the opposite of the portal register, and it is deliberate.

## Unresolved / accepted

1. **Map station targets are about 24px at phone scale,** below 44px. Stations are too dense for full-size targets without overlapping. Mitigation: every station duplicates a card link that is ≥ 44px. Proper fix: a mobile "list along corridor" mode for the map view.
2. **Mobile LCP is 2.6–3.6 s under simulated slow 4G.** The LCP element is the display headline, which waits on the web font. Options: `font-display: optional` for the display face, or self-hosting a subset. Left as is because it would change the brand typeface on slow first loads.
3. **The source has little investor data:** 43/60 projects have every configuration "on request", and only 33/60 state a possession date. The design surfaces these gaps honestly, but the ₹/sq ft tool depends mostly on *derived* rates.
4. **No pre-launch projects exist in the source today** (all are under construction or ready). Only one listing calls itself "new launch" in its copy. The early-entry story therefore leans on the derived "early construction" badge. The UI is ready for real pre-launch statuses when the data has them.
5. **Image rights:** developer photography is used for identification. Licence it or replace it before a public launch.
6. **Dark-mode photography** is not tone-adjusted. Bright renders can glare on near-black. An optional `brightness(.92)` in dark mode was considered and deferred.
