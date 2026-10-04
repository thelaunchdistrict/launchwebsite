export type Status = 'pre-launch' | 'new-launch' | 'under-construction' | 'ready';
export type ProjectType = 'residential' | 'commercial' | 'plots' | 'sco' | 'villas' | 'floors' | 'township';

export interface ImageRef {
  originalUrl: string;
  localPath: string | null;
  width: number | null;
  height: number | null;
}

export interface Configuration {
  label: string | null;
  unitType: string | null;
  bhk: number | null;
  areaRaw: string | null;
  areaSqft: number | null;
  areaBasis: string | null;
  priceRaw: string | null;
  priceInr: number | null;
  pricePerSqftRaw: string | null;
  pricePerSqftInr: number | null;
  availability: string | null;
  features: unknown;
}

export interface Project {
  id: string;
  /** 'listing' = scraped public listing; 'curated' = developer material supplied to Falcon (data/curated). */
  source?: 'listing' | 'curated';
  sourceNote?: string;
  /** Editorial pin: lower rank shows first in the spotlight and listings. */
  featured?: { rank: number; label: string };
  supersedes?: string[];
  /** Set on a scraped listing that a curated listing replaces; hidden from lists, page links onward. */
  supersededBy?: string;
  /** Project-specific due-diligence items added to the generated checklist. */
  diligenceNotes?: { label: string; state: 'ok' | 'caution' | 'unknown'; detail: string }[];
  /** Values replaced by what the builder publishes (data/verify/builder); 'from' is our previous value. */
  corrections?: { field: string; from: unknown; to: unknown; value: string; source: string; sourceType: string; quote: string; checkedAt: string }[];
  builderUnresolved?: { field: string; note: string }[];
  /** Completion date in the builder's RERA filing, when it differs from the marketed possession date. */
  reraCompletionDate?: string | null;
  /** Further RERA registrations (other phases/towers). */
  additionalRera?: string[];
  slug: string;
  name: string | null;
  sourceUrl: string;
  /** promoter: the registered company in the builder's RERA filing, when it differs from the brand. */
  developer: { name: string | null; nameRaw: string | null; promoter?: string };
  projectType: ProjectType | null;
  categoryRaw: string | null;
  typeRaw: string | null;
  status: Status | null;
  statusRaw: string | null;
  marketingStage: 'pre-launch' | 'new-launch' | null;
  marketingStageRaw: string | null;
  reraNumber: string | null;
  launchDate: string | null;
  launchDateRaw: string | null;
  possessionDate: string | null;
  possessionDateRaw: string | null;
  location: {
    sector: string | null;
    microMarket: string | null;
    locality: string | null;
    city: string | null;
    cityRaw: string | null;
    state: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    landmarks: string[];
    connectivity: { name: string | null; category: string | null; distanceKm: number | null; travelTime: string | null; travelTimeMin: number | null }[];
    commentary: string | null;
  };
  pricing: {
    startingPriceRaw: string | null;
    startingPriceInr: number | null;
    priceRangeRaw: string | null;
    priceMinInr: number | null;
    priceMaxInr: number | null;
    pricePerSqftMinInr: number | null;
    pricePerSqftMaxInr: number | null;
    entryPricePerSqftInr: number | null;
    unitSizeMinSqft: number | null;
    unitSizeMaxSqft: number | null;
    configurations: Configuration[];
    paymentPlan: string | null;
    bookingAmount: string | null;
    otherCharges: string | null;
  };
  facts: {
    landAreaRaw: string | null;
    landAreaAcres: number | null;
    towers: number | null;
    floors: number | null;
    units: number | null;
    soldUnits: number | null;
    availableUnits: number | null;
    unitsPerAcre: number | null;
    openSpacePercent: number | null;
    architect: string | null;
    landscapeDesigner: string | null;
    constructionPartner: string | null;
  };
  content: {
    title: string | null;
    subtitle: string | null;
    description: string | null;
    overview: string | null;
    highlights: string[];
    amenities: { category: string | null; name: string | null; details: string | null }[];
    specifications: unknown[];
    faqs: { question: string | null; answer: string | null }[];
    investmentCommentary: string | null;
    offerings: { title: string | null; details: string | null }[];
    /** Marketing claims shown with Falcon's caution notes. */
    developerClaims?: { claim: string; note: string }[];
  };
  media: {
    hero: ImageRef | null;
    gallery: (ImageRef | null)[];
    floorPlans: { label: string | null; level: string | null; details: unknown; image: ImageRef | null }[];
    sitePlan: ImageRef | null;
    videos: string[];
    virtualTours: string[];
    brochurePdf: string | null;
    developerLogo: ImageRef | null;
    imageCount: number;
  };
  seo: { title: string | null; description: string | null; keywords: string[]; h1: string | null };
  relatedSlugs: string[];
  sourceCreatedAt: string | null;
  scrapedAt: string;
  provenance: Record<string, string>;
}

/** Lean shape sent to client components (listing, compare, shortlist). */
export interface ProjectSummary {
  slug: string;
  name: string;
  developer: string | null;
  type: ProjectType | null;
  status: Status | null;
  stage: Stage;
  badges: Badge[];
  sector: string | null;
  market: string | null;
  marketName: string | null;
  priceFrom: number | null;
  psf: number | null;
  psfDerived: boolean;
  sizeMin: number | null;
  sizeMax: number | null;
  bhks: number[];
  configLabels: string[];
  possession: string | null;
  possessionYear: number | null;
  rera: string | null;
  units: number | null;
  acres: number | null;
  image: WebImage | null;
  createdAt: string | null;
  featured: { rank: number; label: string } | null;
  locationLabel: string | null;
}

export interface WebImage {
  src: string;
  width: number;
  height: number;
}

/** Position on the Entry Rail: 0 pre-launch → 3 possession. Fractional values for construction progress. */
export interface Stage {
  position: number;
  label: string;
  /** 'status' = structured source field; 'listing-text' = stated in listing copy; 'derived' = Falcon's inference. */
  basis: 'status' | 'listing-text' | 'derived' | 'unknown';
}

export interface Badge {
  key: 'hero' | 'pre-launch' | 'new-launch' | 'early-construction' | 'limited-inventory' | 'ready';
  label: string;
  early: boolean;
  note: string;
}
