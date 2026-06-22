// Region registry — the single source of truth for countries, their languages, and
// the data modules wired to each. Screens read everything from here, so no screen
// hard-codes a destination. Mirrors the Gardenoosh tracks.js registry pattern.
//
// Slice status: Thailand is fully wired (phrasebook + places + prices + routes +
// info). Vietnam, Cambodia and Laos ship with their phrasebook now; places/prices/
// routes/info are null until the content phase fills them (the UI shows "coming
// soon" for null modules).

import { PHRASEBOOK_TH } from './phrasebook.th.js';
import { PHRASEBOOK_VI } from './phrasebook.vi.js';
import { PHRASEBOOK_KM } from './phrasebook.km.js';
import { PHRASEBOOK_LO } from './phrasebook.lo.js';
import { PLACES_TH } from './places.th.js';
import { PRICES_TH } from './prices.th.js';
import { ROUTES_TH } from './routes.th.js';
import { INFO_TH } from './info.th.js';

export const LANGUAGES = {
  th: PHRASEBOOK_TH,
  vi: PHRASEBOOK_VI,
  km: PHRASEBOOK_KM,
  lo: PHRASEBOOK_LO,
};

export const COUNTRIES = [
  {
    id: 'th', name: 'Thailand', flag: '🇹🇭', currency: 'THB', lang: 'th',
    cities: ['Bangkok'],
    places: PLACES_TH, prices: PRICES_TH, routes: ROUTES_TH, info: INFO_TH,
  },
  {
    id: 'vi', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', lang: 'vi',
    cities: ['Hanoi', 'Ho Chi Minh City', 'Hoi An', 'Da Nang'],
    places: null, prices: null, routes: null, info: null,
  },
  {
    id: 'kh', name: 'Cambodia', flag: '🇰🇭', currency: 'KHR', lang: 'km',
    cities: ['Phnom Penh', 'Siem Reap'],
    places: null, prices: null, routes: null, info: null,
  },
  {
    id: 'la', name: 'Laos', flag: '🇱🇦', currency: 'LAK', lang: 'lo',
    cities: ['Vientiane', 'Luang Prabang'],
    places: null, prices: null, routes: null, info: null,
  },
];

export function getCountry(id) { return COUNTRIES.find((c) => c.id === id) || null; }
export function getLanguage(code) { return LANGUAGES[code] || null; }

// All places across every country that has them, optionally filtered.
// filter: { country?, interests?: string[], budget?: 'low'|'mid'|'high'|'flexible' }
export function allPlaces(filter = {}) {
  let out = COUNTRIES.flatMap((c) => Array.isArray(c.places) ? c.places : []);
  if (filter.country) out = out.filter((p) => p.country === filter.country);
  if (Array.isArray(filter.interests) && filter.interests.length) {
    out = out.filter((p) => p.categories.some((cat) => filter.interests.includes(cat)));
  }
  if (filter.budget && filter.budget !== 'flexible') {
    out = out.filter((p) => p.budgetTier === filter.budget || p.budgetTier === 'any');
  }
  return out;
}

export function getPlace(id) {
  return allPlaces().find((p) => p.id === id) || null;
}

export const INTERESTS = [
  { id: 'food', label: 'Food & markets' },
  { id: 'culture', label: 'Culture & history' },
  { id: 'nature', label: 'Nature & outdoors' },
  { id: 'nightlife', label: 'Nightlife & social' },
];
