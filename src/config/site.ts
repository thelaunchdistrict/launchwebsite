/**
 * Rebrand in minutes: brand name, contact details, colours, analytics and lead routing live here.
 * Colours are emitted as CSS custom properties by `src/app/layout.tsx`, so nothing else needs editing.
 */
export const site = {
  name: 'The Launch District',
  legalName: 'The Launch District (placeholder entity)',
  tagline: 'Own the address before the city does.',
  description:
    'Early-entry research on pre-launch and under-construction projects in Gurugram: ₹/sq ft, possession dates, RERA checks and corridor context for investors.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://thelaunchdistrict.example.com',
  locale: 'en_IN',
  city: 'Gurugram',

  contact: {
    // No phone number is ever shown on the site: visitors leave their details or message on WhatsApp.
    // Placeholder: replace before launch. Digits only, with country code; used only inside wa.me links.
    whatsapp: '910000000000',
    email: 'hello@thelaunchdistrict.example.com',
    address: 'Gurugram, Haryana, India',
    hours: 'Mon–Sat, 10:00–19:00 IST',
  },

  social: {
    linkedin: '',
    instagram: '',
    youtube: '',
  },

  /**
   * "Midnight and terracotta" palette (WCAG AA checked in both modes).
   * - ink / night: midnight navy for structure, type and the dark banner bands (privacy, exclusivity)
   * - signal: terracotta, reserved for "early" and the single primary action per view (warmth, anticipation)
   * - brass: status and reward moments only, used sparingly: hero project, verified, price updates
   */
  colors: {
    light: {
      paper: '#F4EFE7',
      paperRaised: '#FBF8F3',
      paperSunk: '#EAE3D7',
      ink: '#111A2C',
      ink2: '#545B6B',
      rule: '#DCD3C4',
      ruleStrong: '#B9AD99',
      signal: '#A9472B',
      signalSoft: '#F3DED1',
      onSignal: '#FFFFFF',
      brass: '#7E602C',
      brassSoft: '#EFE5D2',
      brassBright: '#C2A066',
      night: '#0E1626',
      nightRaised: '#16213A',
      nightInk: '#EEE8DC',
      nightInk2: '#AEB5C3',
      nightRule: '#26324C',
      positive: '#2F6B4F',
      caution: '#8A6A12',
      focus: '#1F5FBF',
    },
    dark: {
      paper: '#0C1220',
      paperRaised: '#131C30',
      paperSunk: '#080D18',
      ink: '#EEE8DC',
      ink2: '#A7AEBD',
      rule: '#222D44',
      ruleStrong: '#35425E',
      signal: '#E3906B',
      signalSoft: '#3A2117',
      onSignal: '#0C1220',
      brass: '#D3B27A',
      brassSoft: '#2C2416',
      brassBright: '#D3B27A',
      night: '#060A14',
      nightRaised: '#0F1729',
      nightInk: '#EEE8DC',
      nightInk2: '#A7AEBD',
      nightRule: '#222D44',
      positive: '#6FCF97',
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
