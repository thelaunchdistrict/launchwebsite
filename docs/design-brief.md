# The Launch District — Design Brief

*Phase 1 output. Audience: early-stage real-estate investors in Gurgaon / NCR who buy at pre-launch, new-launch or under-construction stage and exit on appreciation or rental yield.*

## 0. Sources and method

**HIG source.** The Apple HIG *skill* (the 123-page Markdown bundle) is **not installed in this environment**. As instructed, I fell back to developer.apple.com/design/human-interface-guidelines. The HTML pages render client-side, so I pulled the structured DocC JSON for 18 pages and read them as text: accessibility, layout, typography, color, dark-mode, motion, charts, searching, buttons, inputs, entering-data, maps, lists-and-tables, image-views, tab-bars, toolbars, sheets, right-to-left.

**Reference sites reviewed** (UX patterns only; no code, copy, logos or branding were taken):

| Site | Hero | Project card | Filter UX | Lead capture | Trust | Mobile |
|---|---|---|---|---|---|---|
| realtycanvas.in | Image carousel with a search bar overlaid (category / status / price) | Image, name, location. Very little data | 3 dropdowns plus a "view all" link | Long mid-page form (7 fields) and a header phone/WhatsApp | Testimonials, a satisfaction %, RERA mentions | Sticky header and a call button |
| Square Yards (new projects, Gurgaon) | Search-first | **Data-dense**: status badge, units, acres, connectivity line, amenity count, price range and ₹/sq ft, BHK-wise prices, possession, a 6–8 image carousel | Status chips (Ready / UC / New Launch / Upcoming), affordable vs luxury, metro, travel time, near me | "Get a call back" plus WhatsApp on every card | RERA, architect credit, possession dates | Card CTAs collapse into a bottom bar |
| Housing.com / Magicbricks | Search-first portals *(both refused automated fetch, so these notes come from prior familiarity)* | Image-led cards with price, BHK and locality; "RERA" chip | Big faceted sidebar, map toggle, sort | Contact-seller modal gated by phone OTP | Verified-listing chips | Full-screen filter sheet |
| Anarock | Value-prop banner | Research report cards (category tag, month, title) | — | Contact button, newsletter | Client logo wall, scale stats | — |
| DLF | Corporate brand statement, years and sq m delivered | — | — | **Progressive multi-step enquiry** (category, then property, then contact) | Compliance reports, environmental clearances, long disclaimer | — |
| M3M | Full-bleed video; category, city, price search | Image, tag, location | Dropdown search | Sticky "Enquire", modal, site-visit time slots, WhatsApp | Stats dashboard, testimonial videos, awards | Sticky enquire |
| Godrej Properties | Big imagery; Enquire and Schedule-visit CTAs | Cards with **list/map toggle** | Cities, type, status, budget; "New launches only" quick filter; reset | Name, phone (country code), email, project, opt-in | Founded 1990, ISO first, scale metrics | Filter drawer |
| Sobha | Brand tagline and flagship carousel | City-filtered grid | City, then project, then configuration finder | Phone in footer | **Backward integration** and delivery record as trust | Separate mobile banners |
| Roofstock (US) | "Portfolios perform" headline over chart graphics | **Investor metrics first** (gross yield filter) | Filters on financial metrics | "Get in touch" plus phone and email | Users / markets / $ transacted, licence notices | — |
| Fundrise / Arrived (US) | Value prop plus an email field in the hero | Asset-class tabs; returns shown with heavy disclaimers | Category tabs | Email-first sign-up | Ratings, press, regulator docs; "past performance…" footnotes everywhere | App-first |

**What the Indian portals get wrong for *investors*:** cards lead with photography and BHK, but an investor's first questions are *how early am I, what does a sq ft cost here, and when do I get possession*. The developer sites build trust through scale stats but give no comparative data. The US platforms handle the investor's mental model well (metrics first, disclaimers that are honest without being buried), but they have no notion of construction-stage risk.

**The Launch District's position:** take the investor-metrics-first card and honest-disclaimer habits from the US platforms, keep the Indian norms buyers expect (RERA number up front, WhatsApp, configuration-wise pricing, possession date), and add one thing nobody shows: **where each project sits in its lifecycle, as a visual entry window.**

---

## 1. Point of view: "The survey sheet"

The Launch District should look like a **surveyor's field sheet crossed with an analyst's ledger**: warm paper, ink, hairline rules, tabular numerals, and one vermilion signal colour that only ever means *early*.

- **Signature element: the Entry Rail.** A thin horizontal rail with four stations (Pre-launch, Launch, Construction, Possession). Every project carries a marker on this rail. It shows up on cards, the detail hero, compare and the timeline tool. The vermilion fill runs from the start of the rail to the marker, so the less vermilion you see, the earlier you are. No other property site encodes stage this way. It is honest, because it comes straight from the `status` field, and it explains the brand promise ("get in before the crowd") without a word.
- **Signature map: the Corridor Map.** Most projects have no lat/long in the source, and I won't invent coordinates, so The Launch District draws a schematic *transit-style* map of Gurgaon's growth corridors (Dwarka Expressway, NH-48, Golf Course Road / Extension, Southern Peripheral Road, Sohna Road, New Gurgaon). Projects appear as stations on their corridor, ordered by sector. It is honest about precision, reads well at phone width, and looks like nothing else in the category.
- **Ledger cards, not hero-image cards.** Image on top at 3:2. Below it the numbers carry the card: price from, ₹/sq ft, possession and configurations, set in a mono tabular face and aligned like a ledger row. The project name sits in the display serif.
- **No stock-gradient hero.** The home hero is type on paper: a large serif headline, a live counter strip set in mono, and the Corridor Map as the hero visual.
- **Copy voice:** plain, numerate, slightly dry. "₹14,200 / sq ft. Possession Dec 2029. Pre-launch." We avoid "luxurious", "world-class" and "dream home".

## 2. Typography

| Role | Face | Why |
|---|---|---|
| Display (h1–h3, project names) | **Instrument Serif** (Google Fonts, 400 + italic) | A tall, narrow editorial serif. It gives the brand a point of view and stays out of the "luxury gold serif" cliché because it is set large, in ink, and never in gold. |
| UI and body | **Geist** (variable) | A neutral grotesk with good small-size legibility, standing in for SF on the web. |
| Data | **Geist Mono** with `font-variant-numeric: tabular-nums` | Prices, ₹/sq ft, dates and counters line up in columns, which is the ledger feel. |

- Scale in rem, fluid with `clamp()`. Body is 1rem (16px) minimum and never below 0.8125rem (13px) even for captions, following the HIG's recommended minimums. Text survives 200% browser zoom (HIG: "enlarge text by at least 200 percent") because all type is rem and the layouts reflow.
- Display: `clamp(2.5rem, 6vw, 5.5rem)`, line-height 0.95, tracking −0.01em. H2 `clamp(1.75rem, 3vw, 2.5rem)`.
- Lakh/crore formatting (`₹1.45 Cr`, `₹85 L`) everywhere, with the full INR value in `title`/aria text.

## 3. Colour

The palette is restrained: paper, ink, three greys and **one signature accent**. Status colours are muted and always paired with a text label, never colour alone (HIG Accessibility: "doesn't rely on any single method to convey information").

| Token | Light | Dark | Use | Contrast (text on bg) |
|---|---|---|---|---|
| `--paper` (bg) | `#F5F3EE` | `#121211` | Page | — |
| `--paper-raised` | `#FFFFFF` | `#1C1C1A` | Cards, sheets (dark elevated surfaces are *lighter*, per HIG dark mode) | — |
| `--ink` | `#141412` | `#EDEBE6` | Primary text | 16.6 / 15.7 |
| `--ink-2` | `#5E5B54` | `#A3A099` | Secondary text | 6.1 / 7.2 |
| `--rule` | `#DAD6CC` | `#2C2B28` | Hairlines | — |
| `--signal` (accent) | `#B83A0B` (vermilion) | `#FF7A45` | Entry Rail, primary CTA, "early" badges | 5.2 / 7.3 |
| `--on-signal` | `#FFFFFF` | `#121211` | Text on accent buttons | 5.8 / 7.3 |
| `--positive` | `#2F6B4F` | `#6FCF97` | Gains in calculator | 5.7 / 9.9 |
| `--caution` | `#8A6A12` | `#E2B84A` | Due-diligence flags | 4.6 / 10.0 |

All pairs meet WCAG AA (4.5:1 for text). The accent is **reserved**: it marks "early" and the one primary action per view, and nothing else. Dark mode follows the system (`prefers-color-scheme`), with a manual override in the footer because the brief requires a toggle. The HIG discourages app-specific appearance settings, so the default is always "System". No pure black. Images get a 1px `--rule` outline in dark mode so light renders don't glare.

## 4. Layout system

- 4px base unit, spacing scale 4/8/12/16/24/32/48/64/96. Content max-width 1240px, 16px side gutter on mobile and 24–32px on desktop. 12-column grid on desktop, 4-column on mobile.
- **Navigation:** desktop has a top bar (Projects, Markets, Tools, Insights, plus the primary "Get early access" action). Mobile has a slim top bar and a **bottom tab bar** with 4 items (Home, Projects, Tools, Shortlist), the web translation of an iOS tab bar. It respects `env(safe-area-inset-bottom)`. Per the HIG, the tab bar is for navigation only and never hosts actions.
- **Listing:** results-first. Desktop has a sticky filter column (progressive disclosure: the five most-used filters are open, the rest live under "More"). Mobile has a filter button that opens a full-height **sheet** (the drawer form of a sheet) with a "Show N projects" commit button. Active filters appear as removable **tokens** above results (HIG Searching). The result count is always visible.
- **Project detail section order** (an investor's reading order, not a brochure's): Hero (name, location, Entry Rail, key facts bar), Pricing & configurations, Payment plan, Investment view (₹/sq ft vs sector median, possession horizon, due-diligence checklist), Location & connectivity, Gallery, Floor plans, Amenities, Developer, FAQs, Similar projects. A sticky CTA bar sits at the bottom on mobile and in the right rail on desktop.
- Touch targets ≥ 44×44 CSS px with about 12px spacing between bezelled controls (HIG Accessibility). No more than two text buttons side by side (HIG Layout).

## 5. Components

Top nav, Mobile tab bar, Footer (with disclaimer and appearance switch), **EntryRail**, **StatusBadge** (text plus dot, never colour alone), ProjectCard (ledger), ProjectRow (compact list), KeyFactsBar, PriceTable, FilterPanel / FilterSheet, FilterTokens, SortMenu, ViewToggle (Grid / Map, a segmented control), **CorridorMap** (SVG), Gallery + Lightbox (keyboard, swipe, focus-trapped dialog), FloorPlanViewer, AmenityList (grouped), FAQ (native `<details>` disclosure), DueDiligenceChecklist, ShortlistButton, CompareTray (max 3) + ComparePage, LeadForm (progressive two-step: interest first, then contact), WhatsAppButton, StickyCTA, ROICalculator (inputs plus a results ledger plus a chart), PsfChart (horizontal bars, sorted), TimelineView, Counter, Disclaimer.

**Forms** (HIG Inputs / Entering data): visible labels (never placeholder-only), `inputmode="tel"` with a `+91` prefix, `autocomplete` attributes, inline validation on blur, and errors given as text plus an icon. Budget and timeline are pickers, not free text, to minimise typing.

**Charts** (HIG Charts): mostly simple marks (horizontal bars for ₹/sq ft, a line for the value path). Every chart has a text summary using actual values ("Sector 113 median ₹14,500/sq ft, 22% above…"), with no subjective words, plus a data table fallback. Axis ticks use familiar steps (₹5k, ₹10k, ₹15k).

## 6. Motion

- Motion only clarifies a state change: a sheet sliding up, the lightbox fading, the Entry Rail filling to its marker on first reveal (once), counters ticking up (once, ≤ 900ms).
- Durations 150–250ms for UI and ease-out `cubic-bezier(.2,.7,.2,1)`. No parallax, no autoplaying carousels, no sustained oscillation (HIG Motion).
- `prefers-reduced-motion: reduce` turns transforms into opacity fades or nothing; counters render their final value (HIG: "replacing transitions… with fades").

---

## 7. Review of this brief

### Platform honesty
- ✅ **Hierarchy and deference:** content (numbers, photos) leads and chrome is hairline-thin. Accent use is limited to one primary action per view.
- ✅ **Accessibility:** every colour pair was contrast-checked above. Status is never encoded by colour alone. Targets are ≥ 44px. Text works at 200% zoom. Reduced motion is honoured. Charts carry text summaries.
- ✅ **Navigation:** the tab bar is for navigation only, with 4 items (HIG tab bars recommend ≤ 5). Filters live in a sheet with an explicit commit, and active filters show as tokens.
- ⚠️ **Appearance toggle:** the HIG advises against app-specific appearance settings. The project brief requires light/dark, so the default is *System* and the override is tucked in the footer, not in the nav.
- ⚠️ **Maps:** the HIG Maps page assumes a real map. The Corridor Map is schematic, so it must say so on its face ("Schematic — not to scale") and link to Google Maps when real coordinates exist.
- ⚠️ **Custom fonts:** the HIG prefers system fonts for legibility. Geist is a close stand-in for SF, and the serif is used only at display sizes ≥ 28px.

### Point of view
- The **Entry Rail** and **Corridor Map** are the two things that make a screenshot recognisably The Launch District. Both come from real data (status, sector), not decoration.
- Warm paper, ink and one vermilion signal reads as a research publication, not a luxury brochure. There is no gold, no navy and no gradient.
- Ledger cards with mono tabular numerals say "we did the maths". The serif names keep it human.
- The risk is that this feels austere next to image-heavy portals. To counter that, give photography generous size on the detail page (gallery and hero) while the listing stays data-first.
