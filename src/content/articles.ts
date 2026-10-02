import { site } from '@/config/site';

export type Block = { h: string } | { p: string } | { ul: string[] } | { note: string };
export interface Article {
  slug: string;
  title: string;
  seoTitle?: string; // ≤ 55 chars; the full title stays as the H1
  dek: string;
  date: string; // ISO
  readMins: number;
  body: Block[];
}

export const ARTICLES: Article[] = [
  {
    slug: 'pre-launch-vs-new-launch-vs-under-construction',
    title: 'Pre-launch, new launch, under construction: what you are actually buying at each stage',
    seoTitle: 'Pre-launch vs new launch vs under construction',
    dek: 'The earlier you enter, the lower the price and the higher the uncertainty. A field guide to each stage, and what to ask before you pay anything.',
    date: '2026-09-15',
    readMins: 7,
    body: [
      { p: 'Developers in Gurugram sell in tranches. The first price list is usually the lowest a project will see, because the developer is buying momentum and early cash flow. The trade is simple: the earlier you enter, the less certain everything else is.' },
      { h: 'Pre-launch (EOI / soft launch)' },
      { p: 'Before RERA registration, some developers take refundable "expressions of interest" (EOIs) to gauge demand and allot units in priority order later. You may get the best price, but you are not buying a registered project yet.' },
      { ul: ['Insist that any EOI is fully refundable and get the refund terms in writing.', 'Under RERA, a developer should not advertise or sell an unregistered project. Treat "booking" language before registration as a red flag.', 'Do not sign an agreement for sale until the RERA number is live and you have checked it.'] },
      { h: 'New launch' },
      { p: 'The project is registered, the first price list is out, and allotments are happening. Most of the early-entry discount is usually captured here, with the legal footing that pre-launch lacks.' },
      { ul: ['Read the RERA page: the promoter, approved plans, completion date and the separate escrow account.', 'Ask for the all-inclusive cost sheet. The headline "₹X Cr onwards" rarely includes PLC, EDC/IDC, parking, club, IFMS and GST.', 'Prefer construction-linked payment plans, so your money moves with the building.'] },
      { h: 'Under construction' },
      { p: 'The structure is rising. Prices have usually moved up from launch, but execution risk falls with every floor cast. The gap between "early construction" and "near completion" matters a lot.' },
      { ul: ['Compare the developer’s marketing possession date with the RERA completion date. The RERA date is the one that binds them.', 'Check quarterly progress updates on the RERA portal.', 'In a resale of an under-construction unit, factor in transfer charges and the original buyer’s payment status.'] },
      { h: 'Ready to move' },
      { p: 'No construction risk and immediate rent, at the highest price. For an early-stage investor, ready inventory is the benchmark: an under-construction purchase has to beat it after accounting for the wait.' },
      { note: site.name + ' marks stage on every project using the Entry Rail. Where we infer a stage (for example "early construction" from a far-off possession date), we say so.' },
    ],
  },
  {
    slug: 'reading-a-gurugram-price-sheet',
    title: 'Reading a Gurugram price sheet: from "₹3 Cr onwards" to what you will actually pay',
    seoTitle: 'How to read a Gurugram price sheet',
    dek: 'The headline price is a starting point. Here is how to rebuild the all-in number line by line, and how to compare projects on ₹/sq ft without fooling yourself.',
    date: '2026-09-22',
    readMins: 6,
    body: [
      { p: '"Onwards" is doing a lot of work in most listings. The starting price usually refers to the smallest unit, on the lowest floor, with the least desirable view, before charges and taxes.' },
      { h: 'The line items' },
      { ul: ['Basic sale price (BSP): the per-sq-ft rate × area. Check which area: carpet (RERA) or super/saleable.', 'Preferential location charges (PLC): floor, corner, park or golf-view premiums.', 'EDC/IDC: development charges payable to the state, sometimes bundled into BSP.', 'Car parking, club membership and power back-up: often fixed charges per unit.', 'IFMS / maintenance deposit: a refundable or adjustable security for the maintenance agency.', 'GST: currently 5% on under-construction residential units outside the affordable category (without input tax credit). Check the rate that applies on your agreement date.', 'Stamp duty and registration: paid at conveyance, roughly 5–7% in Haryana depending on the buyer.'] },
      { h: 'Carpet vs super area' },
      { p: 'RERA requires carpet area to be disclosed. Many listings still quote super area. A 1,000 sq ft carpet unit might be 1,350–1,450 sq ft super. Always convert to the same basis before comparing ₹/sq ft.' },
      { h: 'Using ₹/sq ft properly' },
      { p: site.name + ' shows ₹/sq ft on every project. Where the developer has not published a rate, we compute an indicative one (starting price ÷ smallest listed unit) and mark it with an asterisk. It is good for ranking projects within a corridor. It is not good for valuing a specific unit.' },
      { note: 'Ask for the cost sheet as a PDF on the developer’s letterhead. If a number is not on paper, it does not exist.' },
    ],
  },
  {
    slug: 'due-diligence-checklist-under-construction',
    title: 'A due-diligence checklist for under-construction property in Haryana',
    seoTitle: 'Due-diligence checklist: under-construction homes',
    dek: 'Ten checks you can do in an evening, before a site visit or a booking cheque.',
    date: '2026-09-29',
    readMins: 8,
    body: [
      { p: 'Most painful outcomes in under-construction property (multi-year delays, stalled projects, disputed titles) leave a paper trail well before they happen. These checks find most of it.' },
      { h: 'On the HARERA portal' },
      { ul: ['1. Registration: the RERA number is valid, covers the specific phase or tower, and names the promoter you are dealing with.', '2. Completion date: the registered date, and whether it has been extended.', '3. Quarterly updates: is construction progress being reported, and does it match what you see on site?', '4. Complaints and orders: search the promoter’s name for complaints, delay orders and penalties across their other projects.'] },
      { h: 'Approvals and land' },
      { ul: ['5. DTCP licence: the licence number and the licensee (often a group company). Make sure the licence is in force.', '6. Approved building plans and environmental clearance for the project’s size.', '7. Title and encumbrance: if the land is mortgaged to a lender, ask for the lender’s no-objection to sale.'] },
      { h: 'Money' },
      { ul: ['8. Payment plan: construction-linked is the default safe choice. Possession-linked and subvention plans move cost and risk around, so read who pays what if the project is late.', '9. Escrow: under RERA, 70% of collections must go into a project-specific account. Ask which bank holds it.', '10. Exit: check the transfer/resale policy and charges before possession. Your exit may depend on it.'] },
      { note: site.name + '’s project pages carry a short checklist built from what is published. Where something is not published, it shows "unknown", which is your cue to ask.' },
    ],
  },
];
