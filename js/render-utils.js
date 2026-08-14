// Shared, stateless render/format helpers used across nearly every screen in main.js
// (home, places, weather, journal, day-suggestions, best-of, board...). Extracted from
// main.js to shrink the file every future edit has to load — pure functions only, no
// screen logic. See MASTER_BUILD_PROMPT.md / plan history for the extraction rationale.

import { h, fmtDistance, compass, bearing } from './util.js';
import { store, getLastFix } from './state.js';

// "Near me" is a DRIVE-TIME ceiling, not a straight-line radius. A haversine distance badly
// understates real travel on the region's winding roads — Pai to Chiang Mai is ~55 km as the
// crow flies but a 3-hour mountain drive — so a flat km cap would still call Chiang Mai "near
// Pai". We convert straight-line km to an estimated road drive (a winding-road multiplier and a
// realistic effective speed) and cap "near you" at about an hour give or take. Places just
// beyond that, up to a ~3-hour day trip, surface separately as "Further afield".
const ROAD_FACTOR = 1.35;       // straight-line km -> likely road km (curves, terrain, towns)
const DRIVE_KMH = 50;           // effective road speed incl. towns, stops, slow sections
// Kept conservative at 75 min rather than raised to 90: because the estimate is straight-line
// derived, a 90-min ceiling would pull genuine 3-hour mountain routes (e.g. Pai->Chiang Mai,
// est. ~89 min) into "near you". Raising it safely needs verified corridor/terrain drive times.
const NEAR_MAX_MIN = 75;        // "within an hour give or take" — the near-me ceiling (~46 km)
export const DAYTRIP_MAX_MIN = 180;    // "further afield / next destinations" — up to a ~3-hour trip
export function estDriveMin(km) { return km == null ? null : Math.round((km * ROAD_FACTOR) / DRIVE_KMH * 60); }
export function withinNear(km) { const m = estDriveMin(km); return m != null && m <= NEAR_MAX_MIN; }
export function withinDayTrip(km) { const m = estDriveMin(km); return m != null && m > NEAR_MAX_MIN && m <= DAYTRIP_MAX_MIN; }
// Human label: a walk time under ~2.5 km, otherwise a ROUGH road estimate. The estimate is
// derived from straight-line distance, so it is deliberately framed as approximate ("by road
// (est.)") with coarse granularity and a "+" on longer trips — a switchback mountain route can
// take far longer than the number suggests, and false precision would mislead a traveller.
export function driveLabel(km) {
  if (km == null) return null;
  if (km <= 2.5) return `~${Math.max(1, Math.round((km / 4.8) * 60))} min walk`;
  const m = estDriveMin(km);
  if (m < 60) return `~${Math.max(5, Math.round(m / 5) * 5)} min by road (est.)`;
  // Coarse half-hour steps + a trailing "+" so a straight-line estimate is never read as a
  // precise routed time.
  const half = Math.round(m / 30) * 30;
  const hrs = Math.floor(half / 60), rem = half % 60;
  return `~${rem ? `${hrs}h ${rem}m` : `${hrs}h`}+ by road (est.)`;
}

// Universal straight-line distance (km) between two {lat,lng} points.
export function haversineKm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// "1.2 km · ~15 min walk away" from the user's last GPS fix, when known. Offline,
// pure maths (haversine + ~4.8 km/h walking pace); walk time only for close spots.
// Returns a chip node or null. Reused on cards, detail and the near-me experiences.
export function distanceChip(p) {
  const fix = getLastFix();
  if (!fix || !p || !p.coords) return null;
  const km = haversineKm(fix, p.coords);
  const parts = [fmtDistance(km)];
  const t = driveLabel(km);            // walk time if close, else estimated road-drive time
  if (t) parts.push(t);
  parts.push(`${compass(bearing(fix, p.coords))}`);
  return h('span', { class: 'dist-chip', title: 'From your last location' }, `📍 ${parts.join(' · ')}`);
}

// ---- Colour-coded attribute/status chips ------------------------------------
// Category tags are already family-coloured (catTag, main.js). These are the OTHER little
// tags — "Good with kids", "Good in the rain", "Open now", stay type, "may not suit you" —
// which used to be one flat colour. attrClass() maps a chip's text/emoji to a semantic
// colour class so every kind of tag on the site reads at a glance. attrTag() builds the pill.
export function attrClass(text) {
  const t = String(text).toLowerCase();
  if (/may not suit|not a good fit|⚠/.test(t)) return 'at-warn';
  if (/closed/.test(t)) return 'at-closed';
  if (/open now/.test(t)) return 'at-open';
  if (/kids|family|👨‍👩‍👧/.test(t)) return 'at-kids';
  if (/rain|☔|indoor/.test(t)) return 'at-rain';
  if (/cool off|🏊|heat|❄/.test(t)) return 'at-heat';
  if (/market|🛍|🧺/.test(t)) return 'at-market';
  if (/step[- ]free|wheelchair|accessible|♿|walking|steps|mobility/.test(t)) return 'at-access';
  if (/veg|vegan|kosher|halal/.test(t)) return 'at-veg';
  if (/morning|cool-hours|🌅|clear weather|☀/.test(t)) return 'at-cool';
  if (/sunset|evening|🌇|rooftop|buzzing|street-food|night|🌙/.test(t)) return 'at-evening';
  if (/hostel|hotel|guesthouse|homestay|resort|apartment|short stay|long stay|stay/.test(t)) return 'at-stay';
  return 'at-info';
}
export function attrTag(text, base) { return h('span', { class: `${base || 'attr-tag'} ${attrClass(text)}` }, text); }

export function starsStr(n) { const r = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return '★'.repeat(r) + '☆'.repeat(5 - r); }

export function isMarket(p) {
  return !!(p && (p.marketType || (Array.isArray(p.marketDays) && p.marketDays.length)
    || (Array.isArray(p.categories) && p.categories.includes('market'))));
}

// Category buckets for grouping the Places list and filtering Search. A place falls in
// the FIRST matching bucket (stays are distinct; then the four interest categories).
export function placeBucket(p) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  if (p.stayType || cats.some((c) => ['hotel', 'stay', 'accommodation', 'guesthouse', 'homestay', 'resort', 'hostel', 'apartment'].includes(c))) return 'stay';
  // Markets are their own section (the user asked for "food and markets" separately),
  // taken before the generic food bucket so a wet / night / weekend market reads as a market.
  if (isMarket(p)) return 'market';
  if (cats.includes('rental') || cats.includes('fuel')) return 'rental';
  for (const it of ['food', 'culture', 'nature', 'nightlife']) if (cats.includes(it)) return it;
  return 'other';
}

// ---- CANONICAL CATEGORY COLOUR SYSTEM ---------------------------------------
// One fixed hue per category "family", used EVERYWHERE a category appears (tags on
// cards and detail, filters, the colour key) so the colour means the same thing all
// over the app. Every one of the ~30 fine categories in the data maps to a family.
// Fixed hues (not CSS vars) so they read as an accent on both light and dark themes.
export const CATEGORY_FAMILIES = [
  { key: 'culture',   label: 'Culture & history',   emoji: '🏛', color: '#8A5CC0' },
  { key: 'nature',    label: 'Nature & outdoors',   emoji: '🌿', color: '#2E8B57' },
  { key: 'beach',     label: 'Beaches & water',     emoji: '🏖', color: '#0EA5C4' },
  { key: 'food',      label: 'Food & drink',        emoji: '🍜', color: '#E8632A' },
  { key: 'market',    label: 'Markets & shopping',  emoji: '🛍', color: '#E0A100' },
  { key: 'stay',      label: 'Places to stay',      emoji: '🛏', color: '#2C7DA0' },
  { key: 'nightlife', label: 'Nightlife & social',  emoji: '🌃', color: '#D6336C' },
  { key: 'transport', label: 'Getting around',      emoji: '🛵', color: '#0F9D8C' },
  { key: 'wellness',  label: 'Wellness & spa',      emoji: '💆', color: '#7048E8' },
  { key: 'practical', label: 'Money & practical',   emoji: '🧰', color: '#A0693D' },
  { key: 'other',     label: 'More to see',         emoji: '📌', color: '#8A8F98' },
];
export const FAMILY_COLOR = Object.fromEntries(CATEGORY_FAMILIES.map((f) => [f.key, f.color]));
export const FAMILY_META = Object.fromEntries(CATEGORY_FAMILIES.map((f) => [f.key, f]));
const CAT_FAMILY = {
  culture: 'culture', temple: 'culture', museum: 'culture', spectacle: 'culture', history: 'culture', wat: 'culture', heritage: 'culture',
  nature: 'nature', hike: 'nature', waterfall: 'nature', viewpoint: 'nature', park: 'nature', wildlife: 'nature', hotspring: 'nature', sunset: 'nature', riverside: 'nature', garden: 'nature', cave: 'nature', outdoors: 'nature',
  beach: 'beach', island: 'beach', water: 'beach', dive: 'beach', snorkel: 'beach',
  food: 'food', streetfood: 'food', seafood: 'food', restaurant: 'food', cafe: 'food',
  market: 'market', shopping: 'market',
  stay: 'stay', hotel: 'stay', guesthouse: 'stay', homestay: 'stay', hostel: 'stay', resort: 'stay', apartment: 'stay', camping: 'stay', backpacker: 'stay', accommodation: 'stay',
  nightlife: 'nightlife', bars: 'nightlife', clubs: 'nightlife', cocktail: 'nightlife', rooftop: 'nightlife',
  transport: 'transport', rental: 'transport', fuel: 'transport',
  wellness: 'wellness', spa: 'wellness',
  // Cash/ATMs, health & pharmacies, SIM/laundry errands, and the orientation "info" cards
  // (e.g. "Pai practical: cash, health & road safety") — practical guidance rather than a
  // sight to visit. 'practical' itself self-maps so a future entry can just use that one tag.
  practical: 'practical', money: 'practical', health: 'practical', info: 'practical', sim: 'practical', atm: 'practical', laundry: 'practical',
};
export function catFamily(cat) { return CAT_FAMILY[cat] || 'other'; }
export function catColor(cat) { return FAMILY_COLOR[catFamily(cat)] || FAMILY_COLOR.other; }
// The single most identifying category colour for a whole place (beach beats nature,
// culture beats park, etc.) — used to colour map pins by category. 'practical' sits last:
// an info/money/health card that ALSO carries a real physical category (e.g. a transport
// how-to) should still read as that stronger category, not as generic "practical" brown.
export function placeCatColor(p) {
  const cats = p.categories || [];
  const order = ['beach', 'culture', 'nature', 'market', 'nightlife', 'wellness', 'food', 'stay', 'transport', 'practical'];
  for (const fam of order) if (cats.some((c) => catFamily(c) === fam)) return FAMILY_COLOR[fam];
  return FAMILY_COLOR.other;
}

// Budget-tier colours — one source of truth shared by badges, chips and the key.
const TIER_COLOR = { low: 'var(--tier-low)', mid: 'var(--tier-mid)', high: 'var(--tier-high)', any: 'var(--grape)', flexible: 'var(--grape)' };
export function tierColor(tier) { return TIER_COLOR[tier] || 'var(--grape)'; }
// A small round colour swatch (used to colour filter chips consistently with the key).
export function swatch(color) { return h('span', { class: 'swatch', 'aria-hidden': 'true', style: `background:${color}` }); }

// Unit preferences persist in the profile (default metric). Data is always stored
// metric, so toggling converts on display without any re-fetch.
export function wxTempU() { return (store.profile && store.profile.wxTempUnit) || 'C'; }
export function wxWindU() { return (store.profile && store.profile.wxWindUnit) || 'kmh'; }
export function fmtTemp(c) { if (c == null) return 'N/A'; const v = wxTempU() === 'F' ? c * 9 / 5 + 32 : c; return `${Math.round(v)}°${wxTempU()}`; }
export function fmtWind(kmh) { if (kmh == null) return 'N/A'; const mph = wxWindU() === 'mph'; const v = mph ? kmh * 0.621371 : kmh; return `${Math.round(v)} ${mph ? 'mph' : 'km/h'}`; }
export function fmtPrecip(mm) { if (mm == null) return 'N/A'; if (wxTempU() === 'F') return `${(mm / 25.4).toFixed(2)} in`; return `${mm % 1 === 0 ? mm : mm.toFixed(1)} mm`; }
