// The worldwide half of Emergency (slice F7b, owner decision 28, 2026-10-27: "no matter where you are in the
// world it should give you the emergency info"): which country a fix is in, and that country's numbers.
//
// Three lazy data files, none in the eager graph (an open app keeps old eager modules after a deploy, and a new file
// is always fetched fresh): the Natural Earth 50m outline at 0.05 degrees (js/data/world-outline.js, 470 KB, decision 26),
// the country names (js/data/world-names.js), and the cited table of national numbers, one file per region
// (js/data/emergency-world.<region>.js; tools/world-outline/build.py writes the first two). `ensureWorld()` loads
// them; the screens stay synchronous and ask `worldCountryOf()` and `emergencyFor()` afterwards. Both answer null
// until the load has run, so a screen whose data never arrived (offline before the first precache, a failed fetch)
// renders what F7a rendered: 112 and the coordinates.

// The outline's ids are ISO 3166-1 alpha-2: `vi` is the US Virgin Islands there and Vietnam is `vn`, while this
// app's own id for Vietnam is `vi`. WORLD_TO_APP is the only place the two meet.
export const WORLD_TO_APP = { th: 'th', vn: 'vi', kh: 'kh', la: 'la' };
// How far from land a fix is still named for the nearest country. Decision 26 measured it: the longest reach an
// island of the four countries needed was 92 km (Con Dao at 0.05 degrees); the open Gulf of Thailand is 153 km from
// land and stays unnamed, which a reach above 150 km would turn into Thailand.
export const REACH_KM = 100;
// Within this of an outline a fix counts as in that country (the outline is generalised by about 5 km, and an estuary
// or a small island can sit outside it); farther out it is off the coast and the screen says how far.
export const COAST_KM = 20;
// Off an outline (a coast, an estuary, an island the generalised outline dropped) the outline decides only where no
// city of the four countries is within this: measured on the 681 list places more than 10 km from the four countries'
// outlines (2026-10-29), the Surin Islands (Thai, 88 km from Khao Lak) read Myanmar and Ko Hantu (Thai, 66 km from Satun)
// reads Malaysia off the outline, while Mawlamyine (189 km from Mae Sariang) and Penang (165 km from Satun) really are
// Myanmar's and Malaysia's. Inside a polygon it always decides: no list place of the four countries lies inside another
// country's polygon beyond the 10 km band.
export const ANCHOR_KEEPS_KM = 100;

// Does the outline's answer settle the country, given the km to the nearest city of the four countries (null: none)?
export const worldDecides = (world, nearKm) => !!world && (world.exact || nearKm == null || nearKm > ANCHOR_KEEPS_KM);

// One loader per region, written out so the import graph and the service worker can see every file.
const REGION_FILES = [
  () => import('./data/emergency-world.asia.js'),
  () => import('./data/emergency-world.europe.js'),
  () => import('./data/emergency-world.africa.js'),
  () => import('./data/emergency-world.americas.js'),
  () => import('./data/emergency-world.oceania.js'),
];

let _world = null;      // { polys, names, table } once loaded
let _settled = false;   // the load has run, whether or not it worked: render() waits only until then
let _loading = null;

export const worldReady = () => !!_world;
export const worldSettled = () => _settled;

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// [west, south, east, north] of a polygon's outer ring.
function boxOf(ring) {
  let w = 180, s = 90, e = -180, n = -90;
  for (const [x, y] of ring) { if (x < w) w = x; if (x > e) e = x; if (y < s) s = y; if (y > n) n = y; }
  return [w, s, e, n];
}

// Every polygon of every feature, flattened: { id, box, rings } with the outer ring first and holes after it.
function flatten(fc) {
  const polys = [];
  for (const f of fc.features) {
    const g = f.geometry;
    for (const rings of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
      polys.push({ id: f.properties.id, box: boxOf(rings[0]), rings });
    }
  }
  return polys;
}

async function load() {
  const [{ WORLD_OUTLINE }, { WORLD_NAMES }, regions] = await Promise.all([
    import('./data/world-outline.js'),
    import('./data/world-names.js'),
    // A region file that cannot be fetched leaves its countries as gaps, not the whole table.
    Promise.all(REGION_FILES.map((f) => f().then((m) => m.EMERGENCY_WORLD, () => ({})))),
  ]);
  _world = { polys: flatten(WORLD_OUTLINE), names: WORLD_NAMES, table: Object.assign({}, ...regions) };
}

// Never rejects: a failed load leaves `_world` null and `_settled` true, so the screens render without it.
export function ensureWorld() {
  if (_settled) return Promise.resolve(worldReady());
  if (!_loading) _loading = load().catch(() => {}).then(() => { _settled = true; return worldReady(); });
  return _loading;
}

// Kilometres from a point to the nearest edge of a polygon's outer ring (a flat approximation around the point).
function edgeKm(lat, lng, ring) {
  const ky = 110.57, kx = 111.32 * Math.max(Math.cos(lat * Math.PI / 180), 0.05);
  let best = Infinity;
  for (let i = 1; i < ring.length; i++) {
    const ax = (ring[i - 1][0] - lng) * kx, ay = (ring[i - 1][1] - lat) * ky;
    const bx = (ring[i][0] - lng) * kx, by = (ring[i][1] - lat) * ky;
    const dx = bx - ax, dy = by - ay, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / den)) : 0;
    const d = Math.hypot(ax + t * dx, ay + t * dy);
    if (d < best) best = d;
  }
  return best;
}

// The country a fix is in: { id, name, km, exact } or null (not loaded, or no land within REACH_KM).
// `km` is 0 inside an outline and the distance to the nearest edge when the fix is off the coast: the outline is
// generalised by about 5 km, so Koh Tao, Koh Phi Phi and Mawlamyine (1.6 km off Myanmar's outline) land in the
// reach, not inside a polygon.
export function worldCountryOf(fix) {
  if (!_world || !fix || fix.lat == null || fix.lng == null) return null;
  const { lat, lng } = fix;
  const answer = (id, km) => ({ id, name: _world.names[id] || id.toUpperCase(), km, exact: km === 0 });
  // The smallest polygon around the fix wins: the Vatican sits inside Italy's outline, which has no hole for it.
  let hit = null;
  for (const p of _world.polys) {
    if (lng < p.box[0] || lng > p.box[2] || lat < p.box[1] || lat > p.box[3]) continue;
    if (!pointInRing(lng, lat, p.rings[0]) || p.rings.slice(1).some((r) => pointInRing(lng, lat, r))) continue;
    const area = (p.box[2] - p.box[0]) * (p.box[3] - p.box[1]);
    if (!hit || area < hit.area) hit = { id: p.id, area };
  }
  if (hit) return answer(hit.id, 0);
  const dLat = REACH_KM / 110.57, dLng = REACH_KM / (111.32 * Math.max(Math.cos(lat * Math.PI / 180), 0.05));
  let best = null;
  for (const p of _world.polys) {
    if (lng < p.box[0] - dLng || lng > p.box[2] + dLng || lat < p.box[1] - dLat || lat > p.box[3] + dLat) continue;
    const d = edgeKm(lat, lng, p.rings[0]);
    if (d <= REACH_KM && (!best || d < best.km)) best = { id: p.id, km: d };
  }
  return best ? answer(best.id, Math.round(best.km)) : null;
}

// This app's id (th, vi, kh, la) for an outline id, or null for any other country.
export const appCountryOf = (worldId) => WORLD_TO_APP[worldId] || null;

// { numbers: [{ label, number }], src, src2? } for an outline id, or null where the table has a gap.
export function emergencyFor(worldId) {
  return (_world && _world.table[worldId]) || null;
}

// The host a source URL points at, for the one line under the numbers ("Source: travel.gc.ca").
export function sourceHost(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

// The `tel:` target for a number as the table writes it: spaces dropped, `#` encoded (a bare `#` would end the URI).
export const telHref = (number) => 'tel:' + String(number).replace(/\s/g, '').replace(/#/g, '%23');
