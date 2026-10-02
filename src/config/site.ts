/**
 * Rebrand in minutes: brand name, contact details, colours, analytics and lead routing live here.
 * Colours are emitted as CSS custom properties by `src/app/layout.tsx`, so nothing else needs editing.
 */
export const site = {
  name: 'Falcon',
  legalName: 'Falcon Realty Research (placeholder entity)',
  tagline: 'Get in before the crowd.',
  description:
    'Early-entry research on pre-launch and under-construction projects in Gurugram: ₹/sq ft, possession dates, RERA checks and corridor context for investors.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://falcon.example.com',
  locale: 'en_IN',
  city: 'Gurugram',

  contact: {
    // Placeholders — replace before launch.
    phone: '+91 00000 00000',
    phoneHref: 'tel:+910000000000',
    whatsapp: '910000000000', // digits only, with country code, for wa.me links
    email: 'hello@falcon.example.com',
    address: 'Gurugram, Haryana, India',
    hours: 'Mon–Sat, 10:00–19:00 IST',
  },

  social: {
    linkedin: '',
    instagram: '',
    youtube: '',
  },

  /** Signal accent is reserved for "early" and the single primary action per view. */
  colors: {
    light: {
      paper: '#F5F3EE',
      paperRaised: '#FFFFFF',
      paperSunk: '#ECE9E1',
      ink: '#141412',
      ink2: '#5E5B54',
      rule: '#DAD6CC',
      ruleStrong: '#B9B4A8',
      signal: '#B83A0B',
      signalSoft: '#F6E3D9',
      onSignal: '#FFFFFF',
      positive: '#2F6B4F',
      caution: '#8A6A12',
      focus: '#1F5FBF',
    },
    dark: {
      paper: '#121211',
      paperRaised: '#1C1C1A',
      paperSunk: '#0B0B0A',
      ink: '#EDEBE6',
      ink2: '#A3A099',
      rule: '#2C2B28',
      ruleStrong: '#45433E',
      signal: '#FF7A45',
      signalSoft: '#3A1E12',
      onSignal: '#121211',
      positive: '#6FCF97',
      caution: '#E2B84A',
      focus: '#8AB4FF',
    },
  },

  analytics: {
    // Off unless the env vars are set.
    ga4Id: process.env.NEXT_PUBLIC_GA4_ID || '',
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
    'Falcon publishes research for information only. It is not investment, legal or tax advice. Prices, dates and specifications come from public listings and developer material and can change; projections are illustrative. Verify every project on the HARERA Gurugram portal and with the developer before you commit money.',
  sourceNote:
    'Project facts are compiled from public listing pages and developer material. Images belong to their respective developers and are shown for identification.',
} as const;

export type Site = typeof site;
