// Shared, stateless render/format helpers used across nearly every screen in main.js
// (home, places, weather, journal, day-suggestions, best-of, board...). Extracted from
// main.js to shrink the file every future edit has to load — pure functions only, no
// screen logic. See MASTER_BUILD_PROMPT.md / plan history for the extraction rationale.

import { h, fmtDistance, compass, bearing, mapsUrl, haversineKm } from './util.js';
import { store, getLastFix } from './state.js';
import { spotKey, getCachedAir, refreshAir, getCachedWeather, refreshWeather, nearestSpot } from './weather.js';
import { online } from './ui-widgets.js';
import { PHOTOS } from './data/photos.js';
import { DRIVE_CURVE } from './data/drivetimes.js';
import { getActiveCountry } from './app-state.js';
import { HISTORY } from './data/history.js';
import { PLACE_MONTHS } from './data/place-months.js';
import { verdictFor } from './data/month-verdict.js';

// "Near me" is a DRIVE-TIME ceiling, not a straight-line radius. A haversine distance badly
// understates real travel on the region's winding roads — Pai to Chiang Mai is ~55 km as the
// crow flies but a 2h20m mountain drive — so a flat km cap would still call Chiang Mai "near
// Pai".
//
// The estimate used to be `km * 1.35 / 50 kmh`, one flat figure of 1.62 minutes per
// straight-line kilometre. Measured against 16,000+ real routed journeys between this app's
// own places (see scripts/build_drivetimes.py), that was wrong in a consistent direction:
// 23-63% TOO FAST on short trips and 18-30% too slow on long ones. Minutes per straight-line
// km is not constant — it falls with distance, because a longer journey spends more of itself
// on a better road, and in Thailand it RISES first through the 12-90 km band that is all
// provincial roads and market towns before the motorways take over.
//
// So the curve is now measured per country (js/data/drivetimes.js) and read as cumulative
// minutes at each band edge, interpolated. Cumulative rather than per-band because a step
// function makes a 91 km trip finish sooner than an 89 km one, which is the sort of thing a
// traveller notices and rightly stops trusting.
const CUM = {};
// Three cumulative curves per country: a fast plausible journey (p25), a typical one (p50),
// and a slow one (p75). [straightLineKm, totalMinutes] at each band edge, from (0, 0).
function cumulative(cc) {
  if (CUM[cc]) return CUM[cc];
  const curve = DRIVE_CURVE[cc];
  if (!curve) return null;
  const build = (idx) => {
    const pts = [[0, 0]];
    for (const row of curve) pts.push([row[0], row[0] * row[idx]]);
    // A cumulative total cannot fall as the journey lengthens, whatever the per-band figures
    // do. Enforced rather than assumed: it holds for the current fit, and a future refetch
    // must not be able to produce a 91 km trip that finishes before an 89 km one.
    for (let i = 1; i < pts.length; i += 1) pts[i][1] = Math.max(pts[i][1], pts[i - 1][1]);
    return pts;
  };
  CUM[cc] = { fast: build(1), mid: build(2), slow: build(3) };
  return CUM[cc];
}
// Which curve to use when the caller does not say. The country being browsed is the right
// default: every distance on screen is to a place in it.
function curveFor(cc) {
  return cumulative(cc) || cumulative(getActiveCountry()) || cumulative('th');
}
function hm(mins) {
  if (mins < 60) return `${Math.max(5, Math.round(mins / 5) * 5)} min`;
  const h = Math.floor(mins / 60), m = Math.round((mins % 60) / 15) * 15;
  return m && m < 60 ? `${h}h ${m}m` : `${h + (m >= 60 ? 1 : 0)}h`;
}
// Raised from 75 to 90 now that the estimate is calibrated. The old cap was held down because
// a straight-line-derived guess put Pai -> Chiang Mai at ~89 minutes, so a 90-minute ceiling
// would have called a 2h20m mountain drive "near you". Real routing puts that pair at 122
// minutes on this curve, well outside the cap, so the ceiling can finally be what it should be.
const NEAR_MAX_MIN = 90;        // "within an hour and a half" — ~42 km in Thailand, ~61 in Laos
export const DAYTRIP_MAX_MIN = 180;    // "further afield / next destinations" — up to a ~3-hour trip
function interp(pts, km) {
  if (!pts) return null;
  if (km <= 0) return 0;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (km <= x1) return Math.round(y0 + ((km - x0) / (x1 - x0)) * (y1 - y0));
  }
  // Beyond the last edge, extend at the final pace rather than clamping.
  const [xl, yl] = pts[pts.length - 1];
  return Math.round(yl * (km / xl));
}
// The typical case. Used for the near / day-trip classification, where "typical" is what a
// threshold means.
export function estDriveMin(km, cc) {
  if (km == null) return null;
  const c = curveFor(cc);
  return c ? interp(c.mid, km) : null;
}
// The honest spread, for anything shown to a traveller. Within one band the range is real
// rather than statistical noise: Thailand at 50-90 km holds both a 59-minute motorway run to
// Ayutthaya and a 2h20m mountain drive to Pai, and from two coordinates alone there is no way
// to know which road connects them.
export function driveRange(km, cc) {
  if (km == null) return null;
  const c = curveFor(cc);
  if (!c) return null;
  return [interp(c.fast, km), interp(c.slow, km)];
}
export function withinNear(km, cc) { const m = estDriveMin(km, cc); return m != null && m <= NEAR_MAX_MIN; }
export function withinDayTrip(km, cc) { const m = estDriveMin(km, cc); return m != null && m > NEAR_MAX_MIN && m <= DAYTRIP_MAX_MIN; }
// Human label: a walk time under ~2.5 km, otherwise a ROUGH road estimate. The estimate is
// derived from straight-line distance, so it is deliberately framed as approximate ("by road
// (est.)") with coarse granularity and a "+" on longer trips — a switchback mountain route can
// take far longer than the number suggests, and false precision would mislead a traveller.
export function driveLabel(km, cc) {
  if (km == null) return null;
  if (km <= 2.5) return `~${Math.max(1, Math.round((km / 4.8) * 60))} min walk`;
  // A RANGE, not a point. The old label said "~2h+ by road (est.)" off a single flat
  // multiplier, which was a false precision twice over: the multiplier was uncalibrated, and
  // even a perfectly calibrated one cannot tell a motorway from a mountain pass between two
  // coordinates. The calibration gives a measured fast and slow case, so the label says both.
  const r = driveRange(km, cc);
  if (!r) return null;
  const [fast, slow] = r;
  // Collapse to one figure when the spread is too small to be worth two, or under an hour
  // where the wording would read as fussy.
  if (slow < 60 || slow - fast < Math.max(8, fast * 0.18)) {
    return `~${hm(estDriveMin(km, cc))} by road (est.)`;
  }
  return `${hm(fast)}–${hm(slow)} by road (est.)`;
}

// Universal straight-line distance (km) between two {lat,lng} points. Re-exported from
// util.js rather than reimplemented: this module used to carry its own copy that differed
// in two ways — no null guard, and no Math.min(1, ...) clamp before asin. Callers such as
// nearbySafetyStrip already filter on `km != null`, which only means anything with util's
// guarded version, so the two copies were quietly disagreeing about missing coordinates.
export { haversineKm };

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
  // #2E8B57 was the one hue in this palette that could carry neither white (4.25:1) nor dark
  // (4.10:1) text at label size. Three channels deeper clears 4.5 with white and is not a
  // visible change to the pin or the tag.
  { key: 'nature',    label: 'Nature & outdoors',   emoji: '🌿', color: '#2C8453' },
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
  archaeology: 'culture', ruins: 'culture', memorial: 'culture', church: 'culture', architecture: 'culture', spiritual: 'culture', pilgrimage: 'culture',
  landmark: 'culture', craft: 'culture', handicraft: 'culture', silk: 'culture', workshop: 'culture', 'lantern-boats': 'culture',
  nature: 'nature', hike: 'nature', waterfall: 'nature', viewpoint: 'nature', park: 'nature', wildlife: 'nature', hotspring: 'nature', sunset: 'nature', riverside: 'nature', garden: 'nature', cave: 'nature', outdoors: 'nature',
  hiking: 'nature', lake: 'nature', river: 'nature', riverfront: 'nature', wetland: 'nature', reserve: 'nature', 'protected-area': 'nature', birdwatching: 'nature',
  landscape: 'nature', ecotourism: 'nature', swimming: 'nature', kayaking: 'nature', zipline: 'nature', adventure: 'nature', remote: 'nature', 'road-trip': 'nature', cycling: 'nature', boat: 'nature',
  beach: 'beach', island: 'beach', water: 'beach', dive: 'beach', snorkel: 'beach', 'beach-adjacent': 'beach',
  food: 'food', streetfood: 'food', 'street-food': 'food', seafood: 'food', restaurant: 'food', cafe: 'food', breakfast: 'food',
  market: 'market', shopping: 'market', 'night-market': 'market',
  stay: 'stay', hotel: 'stay', guesthouse: 'stay', homestay: 'stay', hostel: 'stay', resort: 'stay', apartment: 'stay', camping: 'stay', backpacker: 'stay', accommodation: 'stay',
  nightlife: 'nightlife', bars: 'nightlife', clubs: 'nightlife', cocktail: 'nightlife', rooftop: 'nightlife',
  'live-music': 'nightlife', 'live-sport': 'nightlife', 'beer-street': 'nightlife', 'after-hours': 'nightlife', 'beach-bar': 'nightlife', 'beach-club': 'nightlife', 'expat-strip': 'nightlife', 'cafe-bar': 'nightlife',
  transport: 'transport', rental: 'transport', fuel: 'transport', motorbike: 'transport',
  wellness: 'wellness', spa: 'wellness',
  // Cash/ATMs, health & pharmacies, SIM/laundry errands, and the orientation "info" cards
  // (e.g. "Pai practical: cash, health & road safety") — practical guidance rather than a
  // sight to visit. 'practical' itself self-maps so a future entry can just use that one tag.
  practical: 'practical', money: 'practical', health: 'practical', info: 'practical', sim: 'practical', atm: 'practical', laundry: 'practical',
};
// Deliberately NOT mapped, so they keep falling through to 'other': village, town, area,
// local, remote-ish descriptors, seasonal, family, free, budget, activity, sight, attraction.
// Those are modifiers on a place (who it suits, what it costs, when to go) rather than a
// category of thing to do, so folding them into a family would mislabel the pin and the filter.
export function catFamily(cat) { return CAT_FAMILY[cat] || 'other'; }
export function catColor(cat) { return FAMILY_COLOR[catFamily(cat)] || FAMILY_COLOR.other; }
// The single most identifying category colour for a whole place (beach beats nature,
// culture beats park, etc.) — used to colour map pins by category. 'practical' sits last:
// an info/money/health card that ALSO carries a real physical category (e.g. a transport
// how-to) should still read as that stronger category, not as generic "practical" brown.
export const FAMILY_PRIORITY = ['beach', 'culture', 'nature', 'market', 'nightlife', 'wellness', 'food', 'stay', 'transport', 'practical'];
// The place's single most-identifying family. One implementation, imported by main.js's
// placeFamily() too, so the colour and the placeholder emoji can never disagree.
export function placeFamilyKey(p) {
  const cats = (p && p.categories) || [];
  for (const fam of FAMILY_PRIORITY) if (cats.some((c) => catFamily(c) === fam)) return fam;
  return 'other';
}
export function placeCatColor(p) {
  return FAMILY_COLOR[placeFamilyKey(p)] || FAMILY_COLOR.other;
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

// ---- Extracted from main.js (task #205 step 1) ------------------------------
// Genuinely cross-screen helpers that happened to be physically declared inside
// main.js's "Places" section but are called from Home, day-suggestions and other
// screens too — moved here so those callers stop reverse-importing from a screen
// module. Pure relocate, no behaviour change; see task #205 for the full audit.

// "Chiang Mai" -> "chiang-mai" for city-scoped Places routes (#places-<cc>-<slug>).
export function citySlug(name) {
  return String(name || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Display labels for a place's price tier — deliberately never the word "budget" anywhere in
// the UI. That word is reserved for the expense tracker (EXP_CATS, trip.budgetLog); two chip
// rows both reading "Budget" in different sections was the site's most-repeated report. The
// stored tier keys (low/mid/high/any/flexible) are unchanged — this is a label map only, so
// no data migration is needed. Shared by every screen that shows a tier: the Places filter,
// the compare sheet, the colour key, onboarding, and Settings.
export const PRICE_TIER_LABEL = { flexible: 'Any price', any: 'Any price', low: '$', mid: '$$', high: '$$$' };

export function tierBadge(tier) {
  const lbl = PRICE_TIER_LABEL[tier] || tier;
  return h('span', { class: `tier ${tier}` }, lbl);
}

// Category buckets for grouping the Places list and filtering Search. A place falls in
// the FIRST matching bucket (stays are distinct; then the four interest categories).
export const PLACE_BUCKETS = [
  ['food', '🍜 Food'],
  ['market', '🛒 Markets'],
  ['stay', '🛏 Places to stay'],
  ['culture', '🏛 Culture & history'],
  ['nature', '🌿 Nature & outdoors'],
  ['nightlife', '🌃 Nightlife & social'],
  ['rental', '🛵 Getting around & rentals'],
  ['other', '📌 More to see'],
];
// One semantic colour per category bucket so the eye can tell a place to STAY (blue)
// from a place to EAT (orange), see (violet), a nature spot (green) or nightlife (pink)
// at a glance — on cards, list section headers and chips. Fixed hues (like the map
// legend) read as an accent on both light and dark themes.
export const BUCKET_COLOR = {
  food: '#E8632A', market: '#E0A100', stay: '#2C7DA0', culture: '#8A5CC0',
  nature: '#2C8453', nightlife: '#D6336C', rental: '#0F9D8C', other: '#8A8F98',   // nature: see CATEGORY_FAMILIES
};

export function bucketColor(p) { return BUCKET_COLOR[placeBucket(p)] || BUCKET_COLOR.other; }

// A category chip coloured by its family, with the family name as a tooltip.
// ---- LABEL COLOUR FOR A SOLID BADGE -----------------------------------------
// These category hues are fixed on purpose (see CATEGORY_FAMILIES) and several of them are too
// light to carry white text at label size — white on the market amber #E0A100 measures 2.27:1
// against the 4.5:1 that 11px text needs. Changing the hues was the wrong answer: they are the
// map legend's colour language and every pin uses them. So the FILL stays and the LABEL is
// chosen from it, exactly as .tier.mid and the four light .attr-tag fills do in CSS.
//
// --badge-ink in style.css is the same value; keep the two in step.
const BADGE_INK = '#241A10';
const BADGE_INK_LUM = 0.0141;   // relative luminance of BADGE_INK, precomputed
const _lumCache = new Map();
function relLuminance(hex) {
  let v = _lumCache.get(hex);
  if (v !== undefined) return v;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) { _lumCache.set(hex, 1); return 1; }
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  v = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  _lumCache.set(hex, v);
  return v;
}
// White or the dark badge ink — whichever contrasts more with this fill.
export function inkOn(hex) {
  const l = relLuminance(hex);
  const white = 1.05 / (l + 0.05);
  const dark = (Math.max(l, BADGE_INK_LUM) + 0.05) / (Math.min(l, BADGE_INK_LUM) + 0.05);
  return dark > white ? BADGE_INK : '#fff';
}

export function catTag(cat, label) {
  const fam = catFamily(cat);
  const bg = FAMILY_COLOR[fam];
  return h('span', { class: 'cat-tag', style: `background:${bg};color:${inkOn(bg)}`, title: FAMILY_META[fam].label }, label || cat);
}

// ---- MARKETS: day-of-week awareness -----------------------------------------
// Many markets run only on certain days (weekend walking streets, Fri–Sun floating
// markets). marketDays is an array of weekday indices (0=Sun … 6=Sat); absent/empty
// means daily. Returns the sorted unique open-days array, or null when the market runs daily.
export function marketOpenDays(p) {
  const d = Array.isArray(p.marketDays) ? p.marketDays.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  if (!d.length || d.length >= 7) return null;
  return [...new Set(d)].sort((a, b) => a - b);
}
export function marketOnToday(p, dow) { const d = marketOpenDays(p); return !d || d.includes(dow); }
// Best-effort "is this actually shelter from rain?" — most night/walking-street/floating
// markets in the region are open-air stalls, not weatherproof, so a market is only treated
// as rain-friendly when its own text says so (a covered hall, a tin/corrugated roof, "market
// building"). No structured covered/indoor field exists in the data, so this reads the same
// free text a traveller would: marketType, blurb, recognition and tips. Under-detects rather
// than over-detects on purpose — an unmarked market defaults to "gets wet", the honest guess.
export function marketCovered(p) {
  const text = [p.marketType, p.blurb, p.recognition, ...(p.tips || [])].filter(Boolean).join(' ');
  return /covered market|market hall|tin[- ]roofed|corrugated roof|under.{0,25}roofs?/i.test(text);
}

// A beach is any place carrying beach-safety fields or the 'beach' category — used to
// gate the whole beach-safety card cluster (lifeguards, jellyfish season, sea state).
export function isBeach(p) {
  return !!(p && (p.lifeguard || p.swim || (Array.isArray(p.jellyfishMonths) && p.jellyfishMonths.length)
    || (Array.isArray(p.categories) && p.categories.includes('beach'))));
}

// Human "n min/h/d ago" from a timestamp — used by the live air-quality and sea-state blocks.
export function seaAgo(ts) {
  const min = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

// --- Air quality -------------------------------------------------------------
// US AQI band -> [label, css class, health advice]. Standard US EPA breakpoints.
export function aqiBand(aqi) {
  if (aqi == null) return null;
  if (aqi <= 50) return ['Good', 'good', 'Air is clean — enjoy the outdoors.'];
  if (aqi <= 100) return ['Moderate', 'mod', 'Fine for most; unusually sensitive people may take it easier.'];
  if (aqi <= 150) return ['Unhealthy for sensitive groups', 'usg', 'Asthma, heart or lung conditions, children and the elderly should limit long or intense time outdoors.'];
  if (aqi <= 200) return ['Unhealthy', 'unhealthy', 'Everyone may feel effects — limit prolonged exertion outdoors and consider a mask.'];
  if (aqi <= 300) return ['Very unhealthy', 'vunhealthy', 'Health warning — avoid outdoor exertion and wear an N95/KN95 mask outside.'];
  return ['Hazardous', 'hazard', 'Emergency conditions — stay indoors with air filtered where possible; wear an N95/KN95 outdoors.'];
}
// Air-quality sub-block for a city spot: US AQI + PM2.5, painted from cache immediately
// and refreshed when online (repaints only if still attached). Honest offline fallback.
export function airBlock(spot, opts) {
  const compact = opts && opts.compact;
  const box = h('div', { class: 'air-block' });
  const key = spotKey(spot);
  function paint(rec, loading) {
    box.innerHTML = '';
    if (rec && rec.aqi != null) {
      const b = aqiBand(rec.aqi);
      const pm = rec.pm25 != null ? ` · PM2.5 ${Math.round(rec.pm25)} µg/m³` : '';
      box.append(h('p', { class: `aqi-line ${b[1]}` }, `🌫️ Air quality: ${Math.round(rec.aqi)} US AQI — ${b[0]}${pm}`));
      if (!compact) box.append(h('p', { class: 'muted small' }, b[2]));
      box.append(h('p', { class: 'muted small' }, `Updated ${seaAgo(rec.fetchedAt)}${online() ? '' : ' · offline'}`));
    } else {
      box.append(h('p', { class: 'muted small' }, loading ? '🌫️ Checking air quality…' : '🌫️ Air quality loads when you are online.'));
    }
  }
  const cached = getCachedAir(key);
  paint(cached, !cached && online());
  if (online()) refreshAir(spot).then((r) => { if (r && box.isConnected) paint(r, false); });
  return box;
}

// --- Sun / UV index ----------------------------------------------------------
// WHO UV Index band -> [label, css band class, sun-safety advice]. Reuses the AQI
// colour bands so no new palette is needed. UV comes free with the 7-day forecast
// (Open-Meteo daily uv_index_max), so it is cache-first and works offline.
export function uvBand(uv) {
  if (uv == null) return null;
  if (uv < 3) return ['Low', 'good', 'Minimal sun protection needed for most people.'];
  if (uv < 6) return ['Moderate', 'mod', 'Wear sunscreen, a hat and sunglasses; seek shade near midday.'];
  if (uv < 8) return ['High', 'usg', 'Protection needed — SPF 30+, a hat, and shade between 11am and 3pm.'];
  if (uv < 11) return ['Very high', 'unhealthy', 'Extra care — avoid the sun 11am–4pm, use SPF 50+, cover up and re-apply often.'];
  return ['Extreme', 'hazard', 'Avoid being outside in the middle of the day; full protection is essential.'];
}
// A coloured UV line node (optionally with the advice line). Returns null when unknown.
export function uvLineNode(uv, opts) {
  const b = uvBand(uv);
  if (!b) return null;
  const box = h('div', {});
  box.append(h('p', { class: `aqi-line ${b[1]}` }, `☀️ Sun index (UV): ${Math.round(uv)} — ${b[0]}`));
  if (opts && opts.advice) box.append(h('p', { class: 'muted small' }, b[2]));
  return box;
}
// Today's UV for a place's location, taken from the nearest forecast city (cache-first,
// refreshed once when online). Mirrors airBlock so the card never blocks on the network.
export function uvTodayBlock(coords, country) {
  const spot = nearestSpot(coords, country);
  const box = h('div', { class: 'air-block' });
  function paint(rec) {
    box.innerHTML = '';
    const uv = rec && rec.daily && rec.daily[0] ? rec.daily[0].uv : null;
    const node = uvLineNode(uv, { advice: true });
    if (node) box.append(node);
    else box.append(h('p', { class: 'muted small' }, online() ? '☀️ Checking the sun index…' : '☀️ Sun (UV) index loads with the forecast when you are online.'));
  }
  const cached = getCachedWeather(spotKey(spot));
  paint(cached);
  if (online() && !(cached && cached.daily && cached.daily.length)) {
    refreshWeather(spot).then((r) => { if (r && box.isConnected) paint(r); });
  }
  return box;
}

// ---- Extracted from main.js (task #205 step 2) -------------------------------

// Self-hosted, openly-licensed identify photo. `item.photo` is a repo-relative
// path (e.g. 'img/nature/king-cobra.jpg') so it works fully offline once bundled;
// `item.photoAttribution` credits the source and licence. Until an image is added
// a placeholder slot makes the gap explicit (photos are filled in a dedicated
// pass). Images lazy-load so slow/offline connections degrade gracefully.
export function photoBlock(item, alt) {
  const reg = (item && item.id && PHOTOS[item.id]) || null;
  const src = (item && item.photo) || (reg && reg.src);
  const credit = (item && item.photoAttribution) || (reg && reg.credit);
  if (src) {
    return h('figure', { class: 'id-photo' }, [
      h('img', { src, alt: alt || '', loading: 'lazy', decoding: 'async' }),
      credit ? h('figcaption', { class: 'muted' }, credit) : null,
    ]);
  }
  return h('div', { class: 'id-photo placeholder' }, [
    h('span', { class: 'id-photo-emoji' }, (item && item.emoji) || '📷'),
    h('span', { class: 'muted' }, 'Photo coming soon'),
  ]);
}

// Deep-links out to an external ratings/booking site (or a search for the place on that
// site when no direct URL is known). Split out of the "Ratings across the web" cluster
// (extStars/extRow/externalRatingsCard, main.js) because this — like sourceHref below —
// is needed wherever a citation appears, not only on the ratings card itself.
export function extUrl(ext, p) {
  if (ext && ext.url) return ext.url;
  const q = encodeURIComponent(`${p.name} ${p.city || ''}`.trim());
  const site = ((ext && ext.site) || '').toLowerCase();
  if (site.includes('booking')) return `https://www.booking.com/searchresults.html?ss=${q}`;
  if (site.includes('agoda')) return `https://www.agoda.com/search?q=${q}`;
  if (site.includes('tripadvisor')) return `https://www.tripadvisor.com/Search?q=${q}`;
  if (site.includes('trip.com') || site === 'trip') return `https://www.trip.com/hotels/list?searchword=${q}`;
  if (site.includes('google')) return mapsUrl(p);
  return `https://www.google.com/search?q=${q}%20${encodeURIComponent((ext && ext.site) || '')}`;
}

// A citation is only worth linking when it points somewhere specific. A bare review-site
// homepage (tripadvisor.com with no path) dumps the traveller on the front page, so when we
// know the place we turn it into a search for that place; otherwise we show the name as plain
// text rather than a useless link. Deep links (UNESCO listings, official sites) stay clickable.
export function sourceHref(s, place) {
  const url = s && s.url;
  if (!url) return null;
  const m = /^https?:\/\/[^/]+(\/[^?#]*)?/i.exec(url);
  const path = (m && m[1] ? m[1] : '').replace(/\/+$/, '');
  const isReviewSite = /tripadvisor|booking|agoda|trip\.com|google/i.test(url);
  if (isReviewSite && !path) return place ? extUrl({ site: s.org }, place) : null;
  return url;
}
export function sourcesNote(sources, verified, place) {
  const kids = ['Sources: '];
  sources.forEach((s, i) => {
    if (i) kids.push(', ');
    const href = sourceHref(s, place);
    kids.push(href
      ? h('a', { class: 'src-link', href, target: '_blank', rel: 'noopener' }, s.org)
      : s.org);
  });
  kids.push(`${verified ? ` · verified ${verified}` : ''}. Guidance only — verify locally.`);
  return h('p', { class: 'disclaimer' }, kids);
}

// "For you" personalisation (task #205 step 3): once the traveller sets a profile
// (#foryou), lists rank what fits them first — budget tier, kids, long-stay fit and
// interests all add to a place's base rating. Stateless (reads store.profile.prefs and
// the passed-in place's own plain fields only, no DOM/map coupling), so it moves cleanly
// here rather than staying a places.js-bound export — nextstop.js and the eventual
// places.js both rank lists with it, and this way neither has to reach into the other.
export function personalScore(p) {
  const prefs = store.profile.prefs;
  const r = Number(p.rating) || 0;
  let s = r || 3;
  if (prefs.budget && prefs.budget !== 'flexible' && (p.budgetTier === prefs.budget || p.budgetTier === 'any')) s += 0.7;
  // Party shape — modest nudges using fields that always exist (rating/stayType/kidFriendly),
  // so choosing Solo / Couple / Group / Family actually reorders picks instead of being inert.
  if (prefs.party === 'family') { if (p.kidFriendly === true) s += 0.8; if (p.kidFriendly === false) s -= 0.5; }
  // Travelling with a baby leans even harder on kid-friendly places, and away from
  // ones explicitly flagged not-for-kids — regardless of the party shape chosen.
  if (prefs.withBaby) { if (p.kidFriendly === true) s += 0.6; if (p.kidFriendly === false) s -= 0.6; }
  if (prefs.party === 'solo' && p.stayType === 'hostel') s += 0.4;                 // sociable, budget-friendly bases
  if (prefs.party === 'couple') { if (r >= 4.4) s += 0.3; if (p.stayType === 'hostel') s -= 0.3; }  // quality over dorms
  if (prefs.party === 'group' && (p.stayType === 'hostel' || p.stayType === 'apartment')) s += 0.3; // space for several
  // Trip length — long stays prefer long-stay lodging; short trips want the highlights first.
  if (prefs.tripLength === 'long' && (p.stayDuration === 'long' || p.stayDuration === 'both')) s += 0.5;
  if (prefs.tripLength === 'short' && r >= 4.5) s += 0.5;
  if (prefs.tripLength === 'medium' && r >= 4.3) s += 0.25;
  if ((prefs.interests || []).some((i) => (p.categories || []).includes(i))) s += 0.4;
  return s;
}

// "When to go", resolved for one place — the finest tier that actually has data for it, in
// order: PLACE_MONTHS (this record's own visiting-window sentence, rare), the CITY's bestTime
// (js/data/history.js, covers 62 cities and 83% of all place records), then the REGION's
// bestMonths (js/data/zones.js) if the caller supplies one — see MEKONGING_REFACTOR_TODO.md
// Priority 10.1 for why the tiers stop there rather than resolving the region internally.
//
// `zone` is OPTIONAL and deliberately not resolved in here: doing so needs point-in-polygon
// province lookup (main.js's zoneAssignment(), which depends on the lazily-loaded province
// geometry), and this module is loaded eagerly by every screen. A caller that already has the
// place's zone object cheaply on hand (main.js, once a country's region set is loaded) passes
// it; a caller that does not (the always-on Places list) gets city/place precision only and
// says so honestly via `tier` — never a silent, unlabelled guess at the region.
//
// Returns null when NO tier has anything to say (a place with no city profile and no zone
// passed in) — every caller must handle that by omitting the signal, not defaulting to
// "shoulder", which would print a specific-looking claim this function never made.
export function placeWhen(place, month, zone) {
  if (!place || !month) return null;
  const ov = PLACE_MONTHS[place.id];
  if (ov) return { tier: 'place', verdict: verdictFor(ov, month), why: ov.why };
  const slug = place.city ? citySlug(place.city) : '';
  const city = slug ? HISTORY.cities[`${place.country}-${slug}`] : null;
  if (city && city.bestTime) {
    return { tier: 'city', verdict: verdictFor(city, month), why: city.bestTime, name: city.name };
  }
  if (zone) {
    return { tier: 'region', verdict: verdictFor(zone, month), why: zone.bestMonths, name: zone.name };
  }
  return null;
}

// ---- place rating ----------------------------------------------------------
// Pin and card colour by rating. The traveller's OWN rating (placeData) wins over the
// curated/synthesised score, so once you rate a place its pin and its stars reflect YOUR view.
// These live here rather than in map.js so that rendering a place card — which every screen
// does — does not drag the map module and its 111 KB of basemap/border/pool data into the
// cold-start graph. map.js re-exports them for its own callers.
export function effectiveRating(id, curated) {
  const own = (store.placeData && store.placeData[id] && store.placeData[id].rating) || 0;
  return own > 0 ? own : (curated || 0);
}
export const RATING_BANDS = [
  { min: 4.5, color: '#1E9E5A', label: 'Excellent (4.5+)' },
  { min: 4.0, color: '#7DB23A', label: 'Great (4.0+)' },
  { min: 3.0, color: '#F2A93B', label: 'Good (3.0+)' },
  { min: 2.0, color: '#E8632A', label: 'Mixed (2.0+)' },
  { min: 0.1, color: '#D6336C', label: 'Poor (<2.0)' },
  { min: 0, color: '#8A8F98', label: 'Unrated' },
];
export function ratingColor(r) { return (RATING_BANDS.find((b) => r >= b.min) || RATING_BANDS[RATING_BANDS.length - 1]).color; }
