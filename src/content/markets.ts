import { site } from '@/config/site';

// Editorial growth stories per corridor. Infrastructure status is written as of mid-2026 and is
// deliberately hedged — re-verify before relying on any timeline.
export interface MarketStory {
  thesis: string;
  drivers: { title: string; body: string }[];
  risks: string[];
}

export const STORIES: Record<string, MarketStory> = {
  'dwarka-expressway': {
    thesis:
      'The Dwarka Expressway (Northern Peripheral Road) ties west Gurugram to Dwarka and the IGI Airport side of Delhi. Once the Haryana stretch opened to traffic, the sectors along it turned from a long-delayed promise into one of the city’s busiest launch corridors.',
    drivers: [
      { title: 'A finished road', body: 'The expressway is open end to end. Signal-free access to the airport side and to NH-48 changed how the corridor is valued.' },
      { title: 'Airport and Delhi adjacency', body: 'It is the closest new-launch corridor to IGI and the Dwarka sub-city. That is a draw for aviation, logistics and corporate tenants.' },
      { title: 'Planned anchors', body: 'Large planned developments near the corridor (such as the state’s Global City project) and proposed metro links are part of the long-term case. Treat them as optionality, not certainty.' },
    ],
    risks: ['Heavy launch supply across sectors 99–115 can cap near-term appreciation.', 'Social infrastructure (schools, hospitals, retail) is still catching up in newer sectors.', 'Proposed metro alignments and timelines can change.'],
  },
  'golf-course-extension-road': {
    thesis:
      'Golf Course Extension Road carries the premium of Golf Course Road southwards. Sectors 57–66 host many of the city’s high-rise luxury launches, and price points sit near the top of the city.',
    drivers: [
      { title: 'Spill-over from Golf Course Road', body: 'Buyers priced out of established GCR addresses move one corridor south and keep a similar commute to Cyber City and the CBD.' },
      { title: 'SPR and Sohna Road links', body: 'The Southern Peripheral Road and the elevated Sohna Road connect the corridor to NH-48 and to the south.' },
      { title: 'Developer concentration', body: 'Most of the large listed developers have a flagship here. That deepens the resale and rental market over time.' },
    ],
    risks: ['Entry ₹/sq ft is already high, so the early-entry discount is thinner than on newer corridors.', 'Many launches in a short window. Watch absorption.'],
  },
  'golf-course-road': {
    thesis: 'Gurugram’s established luxury address. Little land is left, so new supply is rare, and most activity is redevelopment or the last few land parcels.',
    drivers: [
      { title: 'Scarcity', body: 'Very few new parcels. New launches here usually command a premium from day one.' },
      { title: 'Rapid Metro and CBD access', body: 'Direct access to Cyber City, the Rapid Metro and the city’s commercial core.' },
    ],
    risks: ['Highest entry prices in the city, which leaves less room for appreciation.', 'Rental yields tend to be lowest at the top end.'],
  },
  'southern-peripheral-road': {
    thesis: 'The Southern Peripheral Road links NH-48 to Golf Course Extension Road. Sectors 69–76 along it have become a mid-to-upper segment cluster with both residential and high-street retail launches.',
    drivers: [
      { title: 'Cross-city connector', body: 'SPR lets residents reach NH-48, Sohna Road and Golf Course Extension without crossing the old city.' },
      { title: 'Retail and SCO formats', body: 'Several commercial and shop-cum-office launches sit here, built for the residential catchment around them.' },
    ],
    risks: ['Commercial formats depend on footfall that has not built up yet. Check the leasing story.', 'Traffic at junctions remains a constraint.'],
  },
  'sohna-road': {
    thesis: 'A long-established residential and commercial corridor running south from Rajiv Chowk. The elevated road has made the southern stretch and Sohna more practical for daily commutes.',
    drivers: [
      { title: 'Mature social infrastructure', body: 'Schools, hospitals and retail are already in place in the northern sectors.' },
      { title: 'Elevated corridor', body: 'The elevated Sohna Road cuts travel time to the south. The Delhi–Mumbai Expressway interchange adds a long-distance link.' },
    ],
    risks: ['Older stock competes with new launches on price.', 'Waterlogging and arterial congestion during the monsoon are recurring issues.'],
  },
  'new-gurgaon': {
    thesis: 'Sectors 76–95 south of NH-48 make up New Gurgaon: large planned townships and a growing number of premium launches on lower land costs than the core.',
    drivers: [
      { title: 'Lower entry ₹/sq ft', body: 'Often the lowest entry rates among the corridors ' + site.name + ' tracks, which suits buyers who want early-entry upside.' },
      { title: 'NH-48 and Dwarka Expressway access', body: 'The Dwarka Expressway terminates near the area, and NH-48 links it to Manesar’s industrial belt and to Delhi.' },
    ],
    risks: ['Distance from the CBD; commute depends on NH-48 traffic.', 'Retail and healthcare density is still building.'],
  },
  sohna: {
    thesis: 'Sohna, beyond the Aravallis, is the city’s affordable and plotted-development frontier. Its long-term case is tied to the Delhi–Mumbai Expressway and to industrial growth to the south.',
    drivers: [{ title: 'Expressway access', body: 'The Delhi–Mumbai Expressway and the elevated Sohna Road shrink the distance to Gurugram proper.' }],
    risks: ['The longest time horizon of any corridor. Liquidity can be thin.'],
  },
  'central-gurgaon': {
    thesis: 'The old city and the MG Road / Cyber City belt: the original commercial and residential core. Activity here is mostly redevelopment and commercial launches on small, well-located parcels.',
    drivers: [
      { title: 'Proven demand', body: 'The deepest rental and office demand in the city, with metro access.' },
      { title: 'Redevelopment', body: 'Older plotted sectors are being rebuilt at higher density, and some are getting new commercial formats.' },
    ],
    risks: ['Congestion and ageing civic infrastructure.', 'Small sites limit amenities.'],
  },
};
