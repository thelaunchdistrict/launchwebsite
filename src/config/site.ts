/**
 * Rebrand in minutes: brand name, contact details, colours, analytics and lead routing live here.
 * Colours are emitted as CSS custom properties by `src/app/layout.tsx`, so nothing else needs editing.
 */
export const site = {
  name: 'The Launch District',
  legalName: 'The Launch District (placeholder entity)',
  tagline: 'Own the address before the city does.',
  description:
    'Private portfolio of pre-launch and early-construction homes in Gurugram, checked with each developer: ₹/sq ft, possession, RERA and corridor context.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelaunchdistrict.example.com',
  locale: 'en_IN',
  city: 'Gurugram',

  contact: {
    // No phone number or email is ever shown on the site: visitors leave their details or message on WhatsApp.
    // Placeholder: replace before launch. Digits only, with country code; used only inside wa.me links.
    whatsapp: '910000000000',
    address: 'Gurugram, Haryana, India',
    hours: 'Mon–Sat, 10:00–19:00 IST',
  },

  social: {
    linkedin: '',
    instagram: '',
    youtube: '',
  },

  /**
   * "Charcoal and champagne" palette: restrained luxury neutrals (WCAG AA checked in both modes).
   * - ink / night: charcoal for type, primary buttons and the dark bands
   * - signal / brass: champagne bronze, used sparingly for hairlines, numerals, status and the "early" marks
   * - negative: the one saturated colour, reserved for errors and negative returns
   */
  colors: {
    light: {
      paper: '#F6F5F1',
      paperRaised: '#FFFFFF',
      paperSunk: '#EFEDE6',
      ink: '#171A19',
      ink2: '#5F635F',
      rule: '#E6E3DC',
      ruleStrong: '#CFCABF',
      signal: '#7A6640',
      signalSoft: '#EFE9DB',
      onSignal: '#FFFFFF',
      brass: '#7A6640',
      brassSoft: '#EFE9DB',
      brassBright: '#B6A17E',
      night: '#171A19',
      nightRaised: '#222625',
      nightInk: '#F6F5F1',
      nightInk2: '#B8BBB6',
      nightRule: '#343938',
      positive: '#2F6B4F',
      negative: '#A33A2B',
      caution: '#8A6A12',
      focus: '#1F5FBF',
    },
    dark: {
      paper: '#111413',
      paperRaised: '#1A1D1C',
      paperSunk: '#0C0F0E',
      ink: '#F1EFE8',
      ink2: '#A9ADA8',
      rule: '#2A2E2D',
      ruleStrong: '#454A48',
      signal: '#C9B58E',
      signalSoft: '#2A261C',
      onSignal: '#111413',
      brass: '#C9B58E',
      brassSoft: '#2A261C',
      brassBright: '#C9B58E',
      night: '#0B0D0C',
      nightRaised: '#151817',
      nightInk: '#F1EFE8',
      nightInk2: '#A9ADA8',
      nightRule: '#2A2E2D',
      positive: '#6FCF97',
      negative: '#F08A7A',
      caution: '#E2B84A',
      focus: '#8AB4FF',
    },
  },

  analytics: {
    // GA4 uses the property below unless NEXT_PUBLIC_GA4_ID overrides it. Meta Pixel is off unless its env var is set.
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID || 'G-M9FV3ZFH8Y',
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
  },

  leads: {
    /** `webhook` posts JSON to LEAD_WEBHOOK_URL (Zapier, Make, Google Apps Script → Sheet, CRM).
     *  `file` appends to .leads/leads.jsonl (local/dev only — serverless file systems are read-only). */
    defaultStore: 'file' as 'file' | 'webhook',
    budgets: ['Under ₹1 Cr', '₹1–2 Cr', '₹2–3 Cr', '₹3–5 Cr', '₹5–10 Cr', '₹10 Cr+'],
    timelines: ['Ready to book now', 'Within 3 months', '3–6 months', '6–12 months', 'Just researching'],
  },

  disclaimer:
    'The Launch District publishes research for information only. It is not investment, legal or tax advice. Prices, dates and specifications come from public listings and developer material and can change; projections are illustrative. Verify every project on the HARERA Gurugram portal and with the developer before you commit money.',
  sourceNote:
    'Project facts are compiled from public listing pages and developer material. Images belong to their respective developers and are shown for identification.',
} as const;

export type Site = typeof site;
