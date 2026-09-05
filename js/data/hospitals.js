// ---- THE FULL HOSPITAL LAYER ------------------------------------------------
// js/data/medical.js holds ~136 facilities chosen by hand, with the things no open dataset
// carries: capability tier, English-speaking staff, evacuation arrangements, the honest note
// about what a place can and cannot treat. It was never meant to be exhaustive.
//
// This module is the other half — EVERY named hospital, clinic and doctors' surgery in the
// four countries, from OpenStreetMap, so that "the nearest hospital" is a real answer from a
// village, a mountain pass or a bus, and not only from a city somebody wrote about. The two
// are merged here: a curated entry absorbs its OSM twin and keeps its tier and note, and an
// OSM row that no curated entry matches is shown for what it is.
//
// Loaded per country on demand, mirroring js/data/regions.js's loadCountry() idiom, because
// the four files together are larger than the rest of the app's data put together and a
// traveller in Laos should not parse Vietnam's. All four are precached, though: an emergency
// screen has to work with no signal, including the morning after crossing a border.
import { haversineKm } from '../util.js';
import { HOSPITALS } from './hospitals.curated.js';

const LOADERS = {
  th: () => import('./hospitals.th.js').then((m) => m.HOSPITAL_ROWS_TH),
  vi: () => import('./hospitals.vi.js').then((m) => m.HOSPITAL_ROWS_VI),
  kh: () => import('./hospitals.kh.js').then((m) => m.HOSPITAL_ROWS_KH),
  la: () => import('./hospitals.la.js').then((m) => m.HOSPITAL_ROWS_LA),
};
const ROWS = {};
const INFLIGHT = {};

export function isHospitalsLoaded(cc) { return !!ROWS[cc]; }

export function loadHospitals(cc) {
  if (ROWS[cc]) return Promise.resolve(ROWS[cc]);
  if (INFLIGHT[cc]) return INFLIGHT[cc];
  const loader = LOADERS[cc];
  if (!loader) return Promise.resolve([]);
  INFLIGHT[cc] = loader()
    .then((rows) => { ROWS[cc] = rows || []; return ROWS[cc]; })
    .catch((err) => { delete INFLIGHT[cc]; throw err; });
  return INFLIGHT[cc];
}

// Packed row -> object. [name, lat, lng, kind, englishName|0, hasEmergency]
export const KIND_LABEL = { 1: 'Hospital', 2: 'Clinic', 3: 'Doctor’s surgery' };

// OpenStreetMap's amenity=hospital is used more loosely than the word suggests: blood-donation
// centres, dental and veterinary practices, medical-supply shops and rehabilitation units all
// carry it in places. None of those is somewhere to take a broken leg at midnight, and putting
// one at the top of an emergency list is actively misleading. The list is deliberately short
// and only catches unambiguous cases in the languages this app already handles.
const NOT_EMERGENCY = /(blood[- ]?(donation|bank|centre|center)|บริจาคโลหิต|ບໍລິຈາກເລືອດ|hiến máu|\bdental\b|dentist|ทันตกรรม|nha khoa|veterinar|\bvet\b|สัตวแพทย์|thú y|pharmac|ร้านขายยา|nhà thuốc|optical|optician|แว่นตา|medical supply|การย |laboratory|ห้องแล็บ|xét nghiệm)/i;

function unpack(r, cc) {
  return { name: r[0], lat: r[1], lng: r[2], kind: r[3], en: r[4] || '', er: !!r[5], cc, osm: true };
}
function isCareFacility(o) {
  return !NOT_EMERGENCY.test(o.name) && !(o.en && NOT_EMERGENCY.test(o.en));
}

// Two records are the same building when they are close together AND one name contains the
// distinctive part of the other. Distance alone is not enough — a big hospital campus often
// has a clinic across the road — and name alone is not enough either, because "Bangkok
// Hospital" names a chain with sites in a dozen provinces.
//
// Every record can carry TWO names, and both have to be tried against both. OpenStreetMap
// maps Mahosot as "ໂຮງໝໍ ມະໂຫສົດ" with name:en "Mahosot Hospital"; comparing only the
// primary names leaves the curated entry and its OSM twin as two pins 300 m apart, which is
// exactly the confusion this screen cannot afford.
const STOP = /\b(hospital|international|medical|centre|center|clinic|general|provincial|referral|community|district|the|of|and|โรงพยาบาล|bệnh|viện|មន្ទីរពេទ្យ|ໂຮງໝໍ|ສຸກສາລາ)\b/gi;
// Memoised because it is pure and the same handful of curated names used to be re-tokenised
// once for every OpenStreetMap row in the country — several hundred thousand regex passes to
// answer a question with a few hundred distinct inputs.
const _distinctive = new Map();
function distinctive(name) {
  const key = name || '';
  let out = _distinctive.get(key);
  if (out === undefined) {
    out = key.toLowerCase().replace(STOP, ' ').replace(/[^\p{L}\p{N} ]/gu, ' ')
      .split(/\s+/).filter((w) => w.length > 3).join(' ').trim();
    _distinctive.set(key, out);
  }
  return out;
}
function variants(x) {
  return [distinctive(x.name), distinctive(x.en)].filter(Boolean);
}
function namesMatch(a, b) {
  const va = variants(a), vb = variants(b);
  if (!va.length || !vb.length) return false;
  return va.some((x) => vb.some((y) => x.includes(y) || y.includes(x)));
}
// A lower bound on the separation that costs two subtractions, so haversine only runs for the
// pairs that could possibly match. A degree of latitude is never shorter than 110.57 km, and a
// degree of longitude is never shorter than 111.32 x cos(lat) km — 101.6 km anywhere inside 24
// degrees of the equator, which is the whole of this dataset. Coordinates outside that band, or
// missing altogether, skip the shortcut and take the original path unchanged.
const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LNG_MIN = 101.6;
function certainlyFurtherThan(a, b, maxKm) {
  if (Math.abs(a.lat - b.lat) * KM_PER_DEG_LAT > maxKm) return true;
  if (Math.abs(a.lat) <= 24 && Math.abs(b.lat) <= 24 &&
      Math.abs(a.lng - b.lng) * KM_PER_DEG_LNG_MIN > maxKm) return true;
  return false;
}
function sameFacility(a, b, maxKm) {
  if (certainlyFurtherThan(a, b, maxKm)) return false;
  const km = haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
  if (km == null || km > maxKm) return false;
  // An identical string at very close range is the same building whatever the tokens say —
  // this is how the node/way pair OpenStreetMap often holds for one site collapses.
  if (km <= 0.3 && a.name === b.name) return true;
  return namesMatch(a, b);
}

// Everything known about care in one country, curated first so a curated entry always wins
// the dedupe and keeps its tier, tags and note. OSM rows are then deduped against each other
// as well: the same site is frequently mapped twice, once as a node and once as a building
// way, and two pins for one hospital is worse than none.
//
// SPEED. This is the emergency screen's hot path, and hospitalScreen() calls into it up to ten
// times per render — nearest hospitals, then all care, then nearestAnywhere twice, each of
// those over four countries. Built naively it was quadratic: every OpenStreetMap row was
// compared against every row already kept, which for Thailand's 3,693 rows is about six million
// name-and-distance comparisons. Measured on a laptop before this was fixed: allCare('th')
// 1,540 ms, nearestAnywhere() across all four countries 2,125 ms, and the screen 4.4 seconds to
// settle — the slowest screen in the app by two orders of magnitude, and the one somebody opens
// when they are hurt. A mid-range phone is several times slower again.
//
// Two changes, and neither alters a single row of output:
//   - The finished list is kept per country. It depends only on the rows the loader stored and
//     the static curated table, so every call after the first is free. The stored rows array is
//     held alongside it as the cache key, so a reload of that country rebuilds.
//   - The kept rows are bucketed into a grid of 0.01-degree cells instead of being scanned. The
//     twin test can only succeed inside 300 m, and a cell is at least 1.0 km on both axes
//     anywhere in this region, so the 3x3 neighbourhood around a row is a complete candidate
//     set. Candidates are tried in insertion order, so the FIRST match still wins and the merge
//     is byte-for-byte what the linear scan produced.
//
// The one case the grid cannot see is a row with a missing or non-finite coordinate, where
// sameFacility() can match on names alone at any distance. Those fall back to the full scan.
const NO_ROWS = [];
const CARE = Object.create(null);       // cc -> finished list
const CARE_FROM = Object.create(null);  // cc -> the rows array that list was built from
const CELL = 0.01;                      // degrees; >= 1.0 km on both axes within this region

export function allCare(cc) {
  const rows = ROWS[cc] || NO_ROWS;
  if (CARE[cc] && CARE_FROM[cc] === rows) return CARE[cc];

  const curated = HOSPITALS.filter((x) => x.cc === cc).map((x) => ({ ...x, kind: 1, curated: true }));
  const extra = [];
  const grid = new Map();               // cell key -> indices into `extra`, ascending
  for (const r of rows) {
    const o = unpack(r, cc);
    if (!isCareFacility(o)) continue;
    if (curated.some((c) => sameFacility(o, c, 1.2))) continue;
    // Against other OSM rows the radius is tight (300 m): two genuinely different clinics on
    // one street should both survive, a duplicated node/way pair should not.
    const placed = Number.isFinite(o.lat) && Number.isFinite(o.lng);
    let twin = null;
    if (placed) {
      const li = Math.floor(o.lat / CELL), gi = Math.floor(o.lng / CELL);
      const cand = [];
      for (let dl = -1; dl <= 1; dl++) {
        for (let dg = -1; dg <= 1; dg++) {
          const bucket = grid.get(`${li + dl}:${gi + dg}`);
          if (bucket) for (const i of bucket) cand.push(i);
        }
      }
      cand.sort((x, y) => x - y);
      for (const i of cand) { if (sameFacility(o, extra[i], 0.3)) { twin = extra[i]; break; } }
    } else {
      twin = extra.find((e) => sameFacility(o, e, 0.3)) || null;
    }
    if (twin) {
      // Keep whichever row carries more: an English name, or a mapped emergency department.
      if (!twin.en && o.en) twin.en = o.en;
      if (!twin.er && o.er) twin.er = true;
      if (twin.kind > o.kind) twin.kind = o.kind;
      continue;
    }
    if (placed) {
      const key = `${Math.floor(o.lat / CELL)}:${Math.floor(o.lng / CELL)}`;
      const bucket = grid.get(key);
      if (bucket) bucket.push(extra.length); else grid.set(key, [extra.length]);
    }
    extra.push(o);
  }

  const out = curated.concat(extra);
  CARE[cc] = out;
  CARE_FROM[cc] = rows;
  return out;
}

// The question the emergency screen actually asks. Returns the list sorted by real distance
// from the fix, optionally restricted to full hospitals — because for a serious injury the
// nearest doctors' surgery is the wrong answer even when it is two streets closer.
export function nearestCare(fix, cc, opts = {}) {
  const { hospitalsOnly = false, limit = 0 } = opts;
  let list = allCare(cc);
  if (hospitalsOnly) list = list.filter((x) => x.kind === 1);
  // Always a copy: allCare() now memoises, so returning its array directly would let one
  // caller's edit reach the next screen.
  if (!fix || fix.lat == null) return limit ? list.slice(0, limit) : list.slice();
  const withKm = list.map((x) => ({ ...x, km: haversineKm(fix, { lat: x.lat, lng: x.lng }) }));
  withKm.sort((a, b) => a.km - b.km);
  return limit ? withKm.slice(0, limit) : withKm;
}

// The single closest full hospital, whichever country's data is loaded — a traveller near a
// border is often closer to care on the other side of it, and the Lao evacuation chain in
// medical.js exists precisely because that is the right answer there.
export function closestHospital(fix, ccs = ['th', 'vi', 'kh', 'la']) {
  if (!fix || fix.lat == null) return null;
  let best = null;
  for (const cc of ccs) {
    if (!ROWS[cc] && !HOSPITALS.some((x) => x.cc === cc)) continue;
    const top = nearestCare(fix, cc, { hospitalsOnly: true, limit: 1 })[0];
    if (top && (!best || top.km < best.km)) best = top;
  }
  return best;
}

// Every hospital in every country whose data is loaded, nearest first. This is what the
// emergency screen's headline uses, because a traveller at Nong Khai, Mukdahan, Ha Tien or
// Bavet is genuinely nearer to care on the far side of the river than to their own province
// capital — and a border is not a reason to send somebody further away. The country
// assignment for a facility on a riverbank follows the app's own simplified ADM1 geometry,
// so a handful of waterfront entries sit on the neighbouring side; the distance and the name
// are still right, which is what the traveller acts on.
export function nearestAnywhere(fix, opts = {}) {
  const ccs = ['th', 'vi', 'kh', 'la'].filter((cc) => ROWS[cc] || HOSPITALS.some((x) => x.cc === cc));
  const all = ccs.flatMap((cc) => nearestCare(fix, cc, opts));
  if (fix && fix.lat != null) all.sort((a, b) => a.km - b.km);
  return opts.limit ? all.slice(0, opts.limit) : all;
}

export function careCount(cc) {
  const rows = ROWS[cc];
  if (!rows) return null;
  return { total: rows.length, hospitals: rows.filter((r) => r[3] === 1).length };
}
