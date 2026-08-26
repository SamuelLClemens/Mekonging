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
import { HOSPITALS } from './medical.js';

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
function distinctive(name) {
  return (name || '').toLowerCase().replace(STOP, ' ').replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/).filter((w) => w.length > 3).join(' ').trim();
}
function variants(x) {
  return [distinctive(x.name), distinctive(x.en)].filter(Boolean);
}
function namesMatch(a, b) {
  const va = variants(a), vb = variants(b);
  if (!va.length || !vb.length) return false;
  return va.some((x) => vb.some((y) => x.includes(y) || y.includes(x)));
}
function sameFacility(a, b, maxKm) {
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
export function allCare(cc) {
  const curated = HOSPITALS.filter((x) => x.cc === cc).map((x) => ({ ...x, kind: 1, curated: true }));
  const rows = ROWS[cc] || [];
  const extra = [];
  for (const r of rows) {
    const o = unpack(r, cc);
    if (!isCareFacility(o)) continue;
    if (curated.some((c) => sameFacility(o, c, 1.2))) continue;
    // Against other OSM rows the radius is tight (300 m): two genuinely different clinics on
    // one street should both survive, a duplicated node/way pair should not.
    const twin = extra.find((e) => sameFacility(o, e, 0.3));
    if (twin) {
      // Keep whichever row carries more: an English name, or a mapped emergency department.
      if (!twin.en && o.en) twin.en = o.en;
      if (!twin.er && o.er) twin.er = true;
      if (twin.kind > o.kind) twin.kind = o.kind;
      continue;
    }
    extra.push(o);
  }
  return curated.concat(extra);
}

// The question the emergency screen actually asks. Returns the list sorted by real distance
// from the fix, optionally restricted to full hospitals — because for a serious injury the
// nearest doctors' surgery is the wrong answer even when it is two streets closer.
export function nearestCare(fix, cc, opts = {}) {
  const { hospitalsOnly = false, limit = 0 } = opts;
  let list = allCare(cc);
  if (hospitalsOnly) list = list.filter((x) => x.kind === 1);
  if (!fix || fix.lat == null) return limit ? list.slice(0, limit) : list;
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
