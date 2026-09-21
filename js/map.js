// Fully offline vector map: MapLibre GL JS (vendored) renders a SELF-HOSTED GeoJSON
// basemap of the four countries — no external tiles, so it works with no connection
// from first launch (the old Protomaps demo bucket was retired and returned 404).
// GPS via the geolocate control, curated places + user pins as rating-coloured
// markers, inter-city routes and the Mekong drawn on top, tap-to-drop-a-pin. Street
// detail is intentionally omitted so the whole region ships in ~26 KB and never breaks.

import { h } from './util.js';
import { store, getMyStay, getLastFix } from './state.js';
import { effectiveRating, RATING_BANDS, ratingColor, inkOn } from './render-utils.js';
import { allPlaces } from './data/regions.js';
import { BASEMAP } from './data/basemap.js';
import { BORDER_LINES } from './data/borders_lines.js';
import { POOLS } from './data/pools.js';

// The Mekong main stem as lat/lng (same trace as the landing-map river).
const MEKONG_LL = [
  [100.08, 20.36], [100.60, 20.27], [101.15, 20.05], [101.65, 19.60], [102.10, 19.88],
  [102.00, 19.25], [101.60, 18.70], [101.90, 18.00], [102.60, 17.97], [103.25, 17.60],
  [104.05, 17.40], [104.74, 16.90], [105.00, 16.00], [105.45, 15.40], [105.80, 15.12],
  [105.95, 14.50], [106.00, 13.95], [106.02, 13.52], [105.95, 12.70], [105.46, 12.00],
  [104.93, 11.56], [105.25, 11.00], [105.46, 10.40], [105.78, 10.03], [106.20, 9.90],
  [106.60, 9.65], [106.78, 9.50],
];
const MEKONG_FC = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: MEKONG_LL } }] };

// Optional satellite basemap (Esri World Imagery) — streamed when online and
// runtime-cached by the service worker so viewed areas persist offline. It sits
// OVER the self-hosted vector basemap, which remains the always-offline fallback
// (uncached tiles simply fail to paint and the vector layers show through). This
// reuses the same source/attribution as the Nomadic Almanac map.
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTR = 'Imagery © Esri — Source: Esri, Maxar, Earthstar Geographics, USGS, NOAA';
// Street basemap: Esri World Street Map raster (roads + place labels). Same host as the
// satellite imagery, so it needs no new CSP entry and no API key. Shown when the user picks
// "Map" instead of "Satellite"; like satellite it is cached to mk-tiles for offline reuse and
// falls back to the self-hosted geometry basemap when a tile cannot load.
const STREET_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const STREET_ATTR = 'Streets © Esri — HERE, Garmin, USGS, © OpenStreetMap contributors';

// How far each Esri basemap is actually surveyed in this region — NOT how far MapLibre will
// let you zoom.
//
// Esri's tile services answer a request beyond their coverage with HTTP 200 and a 2,521-byte
// grey JPEG reading "Map data not yet available". That is a real image, so MapLibre draws it:
// zoom one notch too far and the map becomes a grey panel with an error message on it, which
// is what this did everywhere outside a handful of big cities.
//
// Measured over 20 spots across all four countries (Bangkok, Chiang Mai, Krabi, Koh Lanta,
// Pai, Hanoi, HCMC, Hoi An, Da Nang, Phu Quoc, Phnom Penh, Siem Reap, Vientiane, Luang
// Prabang, Kep, Nong Khiaw and five rural points), 2026-09-20:
//
//   satellite  z17 0/20 missing   z18 0/20 missing   z19 11/20 missing
//   street     z17 0/20 missing   z18 6/20 missing   z19  6/20 missing
//
// Declaring those as the source maxzoom makes MapLibre OVERZOOM — it scales the last real
// tile up instead of asking for one that does not exist. A slightly soft image beats a grey
// "no data" panel, and it is the only option that behaves the same in Bangkok and in rural
// Laos. Re-measure before raising either: Esri backfills imagery.
const SATELLITE_MAXZOOM = 18;
const STREET_MAXZOOM = 17;
// One level past the better of the two. Without it MapLibre's default of 22 lets a pinch turn
// the map into a 16x magnification of a tile that has no more detail in it.
const MAP_MAXZOOM = 19;

// Build the list of tile URLs covering `bounds` from the current zoom down a few levels
// (capped) so the service worker can pre-cache the area for offline use.
//
// Bug fix: this used to hard-code SATELLITE_TILES only, so a traveller who downloaded an
// area while viewing in street mode had zero usable offline raster imagery for that view once
// offline — silently, since the vector basemap still shows through as a fallback and nothing
// says imagery is missing. Now emits one URL per requested style for every tile coordinate.
// `cap` bounds tile COORDINATES, not raw URLs, so a saved area's geographic footprint does not
// silently shrink when a second style is added — the honest trade-off is ~2x storage per area,
// not a smaller area.
function tileUrlsForBounds(bounds, z0, extraZoom = 2, cap = 600, styles = [SATELLITE_TILES, STREET_TILES]) {
  const lon2tile = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const lat2tile = (lat, z) => {
    const r = lat * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** z);
  };
  const clampTile = (t, z) => Math.max(0, Math.min(2 ** z - 1, t));
  const urls = [];
  let coordCount = 0;
  const zStart = Math.max(1, Math.floor(z0));
  const zEnd = Math.min(zStart + extraZoom, 17);
  for (let z = zStart; z <= zEnd; z++) {
    const x0 = clampTile(lon2tile(bounds.getWest(), z), z), x1 = clampTile(lon2tile(bounds.getEast(), z), z);
    const y0 = clampTile(lat2tile(bounds.getNorth(), z), z), y1 = clampTile(lat2tile(bounds.getSouth(), z), z);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
        for (const tpl of styles) urls.push(tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y));
        coordCount++;
        if (coordCount >= cap) return urls;
      }
    }
  }
  return urls;
}

// ---- HOSPITALS MAP LAYER -----------------------------------------------------
// The full OpenStreetMap-derived hospital/clinic/surgery dataset (js/data/hospitals.js,
// ~7,400 facilities across all four countries) as a real, toggleable map layer — distinct
// from the curated-place DOM-marker system above, which is built for a few hundred points per
// country and would not scale to this. Native MapLibre GeoJSON source + circle layers with
// built-in clustering instead; see addHospitalsLayers() inside initMap.
//
// Colours echo js/data/medical.js's TIER_META dot language (🟢 international, 🔵 private,
// 🟡 government, 🟠 district, ⚪ clinic) without importing that module — it is deliberately
// lazy for the SOS screen's own reasons, and pulling it in here just for five colours would
// double-load it whenever a traveller has never opened Medical. OSM-only entries (no curated
// tier) get a neutral grey, same as an unrecognised tier would.
const HOSPITAL_TIER_COLOR = ['case',
  ['==', ['get', 'curated'], 1],
  ['match', ['get', 'tier'],
    'intl', '#34C759',
    'private', '#0A84FF',
    'public', '#FFCC00',
    'district', '#FF9500',
    'clinic', '#C7C7CC',
    '#8E8E93'],
  '#8E8E93',
];
const HOSPITAL_TIER_LABEL = { intl: 'International', private: 'Private', public: 'Government', district: 'District', clinic: 'Clinic' };
// Mirrors js/data/hospitals.js's own KIND_LABEL for the same reason the tier colours above
// aren't imported from medical.js — three short strings, not worth pulling in a whole module.
const KIND_LABEL_FALLBACK = { 1: 'Hospital', 2: 'Clinic', 3: 'Doctor’s surgery' };
const HOSPITAL_COUNTRIES = ['th', 'vi', 'kh', 'la'];

// ATM layer: real, OpenStreetMap-sourced locations of the one bank per country that
// genuinely charges travellers the least on a foreign-card withdrawal. Vietnam (VPBank) is a
// real FEE-FREE claim; Thailand/Cambodia/Laos are the LOWEST fee identified, never free — no
// bank in those three waives the foreign-card fee, so the layer must never say "free" there.
// See scripts/build_atms.py for the exact sourcing (Overpass queries, fee research, dates).
// Colour distinguishes the one real "free" country from the three "lowest fee" countries —
// green reads as an unambiguous win, the amber as "cheapest available, still a fee".
const ATM_TIER_COLOR = ['match', ['get', 'tier'], 'free', '#34C759', 'low', '#FF9500', '#8E8E93'];

function atmsFC(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)).map((x) => ({
      type: 'Feature',
      properties: { name: x.name || '', bank: x.bank, tier: x.tier, note: x.note },
      geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
    })),
  };
}

// Loaded once per app session and cached at module scope, same rationale as loadHospitalsFC —
// opening a second map or re-toggling the layer never re-parses the (small) data file again.
let atmsFCPromise = null;
function loadAtmsFC() {
  if (atmsFCPromise) return atmsFCPromise;
  atmsFCPromise = import('./data/atms.js').then((mod) => {
    const rows = mod.ATM_ROWS.map(([cc, lat, lng, name]) => {
      const [bank, tier, note] = mod.ATM_BANK[cc];
      return { lat, lng, name, bank, tier, note };
    });
    return atmsFC(rows);
  });
  return atmsFCPromise;
}

// Bus stop layer. Thailand's stops carry real route numbers (from a GTFS feed); Vietnam,
// Cambodia and Laos are OpenStreetMap-sourced downtown-core coverage only, with no route
// numbers — see js/data/bus.js and scripts/build_bus_osm.py for exactly why. `routes` is an
// empty string for those three, and the popup below shows an honest "not available" line
// rather than silently leaving a blank space where a traveller would expect an answer.
function busStopsFC(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)).map((x) => ({
      type: 'Feature',
      // `cc` rides along so the popup can quote the right fare: the five networks charge
      // completely differently (flat, per-zone, per-kilometre, per-route), so a single
      // app-wide price would be wrong for four of them.
      // `color` is present only where the network draws coloured routes (Phu Quoc); the layer
      // falls back to its own violet everywhere else.
      properties: { name: x.name || '', routes: x.routes || '', cc: x.cc || '', color: x.color || null },
      geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
    })),
  };
}
// The country keys come from js/data/bus.js itself (mod.BUS_COUNTRIES below), never from a
// copy kept here. A hand-kept copy is exactly how Phu Quoc's 107 stops went missing: this list
// read ['th','vi','kh','la'], the data module exported ['th','vi','pq','kh','la'], so the
// island's route LINES drew (they load from BUS_ROUTE_NETWORKS) while every stop on them was
// silently never fetched — bus lines with nowhere to get on.
// Captured off the bus data module when it loads, so the popup can quote fares without
// importing that module eagerly just to render a tooltip.
let busFareFor = null;
let busFaresChecked = '';
let busRoutesData = null;
let busRouteLegend = [];
function busRoutesFC(routesByCc) {
  const features = [];
  for (const routes of Object.values(routesByCc)) {
    for (const r of routes) {
      for (const line of r.lines || []) {
        if (!line || line.length < 2) continue;
        features.push({
          type: 'Feature',
          properties: { ref: r.ref, color: r.color },
          geometry: { type: 'LineString', coordinates: line.map((p) => [p[1], p[0]]) },
        });
      }
    }
  }
  return { type: 'FeatureCollection', features };
}

// Where each bus dataset actually has stops, as [west, south, east, north], measured from the
// data rather than assumed from the country. They are far smaller than their countries:
// Cambodia's file is a 3 km box in central Phnom Penh, Laos' a 5 km box in Vientiane,
// Vietnam's the Hanoi Old Quarter. Only Thailand's is region-scale.
//
// This exists because turning the bus layer on used to download ALL FIVE files — 1,017 KB, of
// which 892 KB is Bangkok — wherever the traveller was standing. Somebody in Vientiane paid a
// megabyte over a guesthouse connection to see 65 stops that live in a 3.5 KB file. Now only
// the datasets whose box is on screen load, and the rest load if the map is moved over them.
const BUS_BBOX = {
  th: [98.541, 9.583, 100.954, 14.191],   // 13,144 stops, 872 KB
  vi: [105.820, 21.000, 105.870, 21.049], //    308 stops,  19 KB
  pq: [103.853, 9.957, 104.037, 10.383],  //    107 stops, 116 KB
  kh: [104.900, 11.550, 104.929, 11.598], //    128 stops,   7 KB
  la: [102.601, 17.940, 102.645, 17.988], //     65 stops,   3 KB
};
// ~28 km of slack around the viewport, so panning towards a city starts its download slightly
// before its stops would come into view rather than after.
const BUS_BBOX_PAD = 0.25;

function boxVisible(box, bounds, pad) {
  if (!box || !bounds) return true;
  const [w, s, e, n] = box;
  return !(bounds.getWest() - pad > e || bounds.getEast() + pad < w
    || bounds.getSouth() - pad > n || bounds.getNorth() + pad < s);
}

// Every dataset loaded so far stays loaded, so panning back and forth across a border never
// re-fetches or drops what is already drawn.
//
// The per-dataset promise is stored SYNCHRONOUSLY, before the first await. That is the whole
// point of the shape: setBus() and a moveend firing during the same flyTo both call in before
// either finishes, and a "have I loaded this yet?" Set consulted AFTER an await lets both
// append the same rows. Measured at 15x duplicate geometry during one zoom before this was
// keyed per dataset.
const busLoads = {};
let busTaggedRows = [];
let busModPromise = null;
let busRoutesByCc = {};

function busModule() {
  if (!busModPromise) {
    busModPromise = import('./data/bus.js').then((mod) => {
      busFareFor = mod.fareFor;
      busFaresChecked = mod.FARES_CHECKED;
      return mod;
    });
  }
  return busModPromise;
}

// One dataset's stops, plus its route lines where the network draws them (only Phu Quoc does).
// Scoped per dataset rather than loaded once globally, so looking at Chiang Mai does not pull
// Phu Quoc's route geometry for lines 700 km off screen.
function loadBusCc(cc, mod) {
  if (busLoads[cc]) return busLoads[cc];
  const wantsRoutes = mod.BUS_ROUTE_NETWORKS.includes(cc);
  busLoads[cc] = Promise.all([
    mod.loadBusStops(cc).catch(() => []),
    wantsRoutes ? mod.loadBusRoutes(cc).catch(() => []) : Promise.resolve([]),
  ]).then(([rows, routes]) => {
    const colors = Object.fromEntries(routes.map((r) => [r.ref, r.color]));
    if (routes.length) {
      busRoutesByCc[cc] = routes;
      busRoutesData = busRoutesFC(busRoutesByCc);
      busRouteLegend = Object.values(busRoutesByCc).flat().map((r) => ({ ref: r.ref, color: r.color }));
    }
    busTaggedRows = busTaggedRows.concat(rows.map((r) => {
      // A stop serving several routes takes the first one's colour; the popup still lists
      // every route calling there, so nothing is lost by the dot picking one.
      const first = r.routes ? r.routes.split(',')[0].trim() : '';
      return { ...r, cc, color: colors[first] || null };
    }));
  });
  return busLoads[cc];
}

// `bounds` is the map's current LngLatBounds; null forces every dataset.
async function loadBusStopsFC(bounds) {
  const mod = await busModule();
  await Promise.all(mod.BUS_COUNTRIES
    .filter((cc) => boxVisible(BUS_BBOX[cc], bounds, BUS_BBOX_PAD))
    .map((cc) => loadBusCc(cc, mod)));

  // Clustering exists for Bangkok's 13,144 points. The route-coloured networks stay
  // unclustered: clustering Phu Quoc's 107 meant that at the zoom you actually look at an
  // island from, every stop collapsed into a count bubble — route lines drawn with nothing
  // showing where to get on or off.
  const solo = new Set(mod.BUS_ROUTE_NETWORKS);
  return {
    clustered: busStopsFC(busTaggedRows.filter((r) => !solo.has(r.cc))),
    solo: busStopsFC(busTaggedRows.filter((r) => solo.has(r.cc))),
  };
}

// ---- OUTDOOR MAP LAYERS (hiking trails, bike paths, viewpoints & waterfalls) --------------
// Three more layers on exactly the pattern above: country-scoped dynamic import, only for the
// countries on screen, accumulated across pans, one in-flight promise per dataset. See
// js/data/outdoors.js and scripts/build_outdoor_layers.py for what the data is and is not.
const outdoorLoads = { trails: {}, scenic: {} };
let hikeFeatures = [];
let bikeFeatures = [];
let scenicFeatures = [];
let outdoorsModPromise = null;
// Country-scale boxes, so a full degree of slack rather than the bus layer's quarter.
const OUTDOOR_BBOX_PAD = 0.5;

function outdoorsModule() {
  if (!outdoorsModPromise) outdoorsModPromise = import('./data/outdoors.js');
  return outdoorsModPromise;
}

function lineFC(features) { return { type: 'FeatureCollection', features }; }

function trailRowsToFeatures(rows) {
  const out = [];
  for (const [name, pts] of rows || []) {
    if (!pts || pts.length < 2) continue;
    out.push({
      type: 'Feature',
      properties: { name: name || '' },
      geometry: { type: 'LineString', coordinates: pts.map((p) => [p[1], p[0]]) },
    });
  }
  return out;
}

// A country whose generated file does not exist yet resolves to empty rather than rejecting,
// and its promise is still kept, so a pan does not retry a missing import on every moveend.
function loadOutdoorCc(kind, cc, mod) {
  const slot = outdoorLoads[kind];
  if (slot[cc]) return slot[cc];
  slot[cc] = (kind === 'trails'
    ? mod.loadTrails(cc).catch(() => [[], []]).then(([hike, bike]) => {
      hikeFeatures = hikeFeatures.concat(trailRowsToFeatures(hike));
      bikeFeatures = bikeFeatures.concat(trailRowsToFeatures(bike));
    })
    : mod.loadScenic(cc).catch(() => []).then((rows) => {
      scenicFeatures = scenicFeatures.concat((rows || []).map(([lat, lng, name, tag]) => ({
        type: 'Feature',
        properties: { name: name || '', kind: tag || 'v' },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      })));
    }));
  return slot[cc];
}

async function loadOutdoors(kind, bounds) {
  const mod = await outdoorsModule();
  await Promise.all(mod.OUTDOOR_COUNTRIES
    .filter((cc) => boxVisible(mod.OUTDOOR_BBOX[cc], bounds, OUTDOOR_BBOX_PAD))
    .map((cc) => loadOutdoorCc(kind, cc, mod)));
}

function hospitalsFC(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng)).map((x) => ({
      type: 'Feature',
      properties: { name: x.name || '', en: x.en || '', kind: x.kind || 2, curated: x.curated ? 1 : 0, tier: x.tier || '' },
      geometry: { type: 'Point', coordinates: [x.lng, x.lat] },
    })),
  };
}

// Loaded once per app session (not per map instance) and cached at module scope, so opening a
// second map or re-toggling the layer never re-fetches or re-merges all four countries' rows.
let hospitalsFCPromise = null;
function loadHospitalsFC() {
  if (hospitalsFCPromise) return hospitalsFCPromise;
  hospitalsFCPromise = import('./data/hospitals.js').then(async (mod) => {
    await Promise.all(HOSPITAL_COUNTRIES.map((cc) => mod.loadHospitals(cc).catch(() => [])));
    const rows = HOSPITAL_COUNTRIES.flatMap((cc) => mod.allCare(cc));
    return hospitalsFC(rows);
  });
  return hospitalsFCPromise;
}

// The rating helpers (effectiveRating / RATING_BANDS / ratingColor) used to live here. They
// moved to render-utils.js because main.js needs them on every place card: importing two
// four-line functions from this module put map.js — and, through it, basemap.js,
// borders_lines.js and pools.js, 111 KB of map data — into the eagerly-parsed graph of every
// cold start, including launches that never open a map. Re-exported below so that map-side
// callers and any external importer keep working unchanged.
export { effectiveRating, RATING_BANDS, ratingColor };

// City-name → coordinate lookup for nearest-city naming (a default saved-area name)
// and the offline name search below.
const CITY_COORDS = {
  'Bangkok': [100.5018, 13.7563], 'Chiang Mai': [98.9853, 18.7883], 'Phuket': [98.3923, 7.8804],
  'Krabi': [98.9063, 8.0863], 'Pai': [98.4406, 19.3583], 'Koh Lanta': [99.0853, 7.6286],
  'Surat Thani': [99.3329, 9.1399], 'Nong Khai': [102.7460, 17.8782], 'Ayutthaya': [100.5870, 14.3692],
  'Hanoi': [105.8342, 21.0278], 'Ho Chi Minh City': [106.6297, 10.8231], 'Hoi An': [108.3380, 15.8801],
  'Da Nang': [108.2022, 16.0544], 'Hue': [107.5909, 16.4637], 'Nha Trang': [109.1967, 12.2388], 'Sapa': [103.8440, 22.3364],
  'Phnom Penh': [104.9282, 11.5564], 'Siem Reap': [103.8448, 13.3671], 'Sihanoukville': [103.5223, 10.6270],
  'Battambang': [103.1968, 13.0957], 'Kampot': [104.1819, 10.6104],
  'Vientiane': [102.6331, 17.9757], 'Luang Prabang': [102.1348, 19.8845], 'Vang Vieng': [102.4470, 18.9237], 'Pakse': [105.7820, 15.1202],
  // Secondary towns matching board/place coverage, so the offline map shows more
  // named orientation anchors (also feeds search + nearest-city naming). Additive.
  'Chiang Rai': [99.8325, 19.9105], 'Mae Hong Son': [97.9654, 19.3020], 'Sukhothai': [99.8265, 17.0078],
  'Kanchanaburi': [99.5328, 14.0227], 'Nan': [100.7730, 18.7756], 'Trang': [99.6114, 7.5589],
  'Hua Hin': [99.9576, 12.5684], 'Koh Tao': [99.8403, 10.0956], 'Koh Phangan': [99.9931, 9.7318], 'Koh Chang': [102.3199, 12.0489],
  'Ninh Binh': [105.9750, 20.2506], 'Ha Giang': [104.9784, 22.8233], 'Cat Ba': [107.0489, 20.7276],
  'Da Lat': [108.4583, 11.9404], 'Phu Quoc': [103.9600, 10.2170], 'Can Tho': [105.7852, 10.0341],
  'Chau Doc': [105.1259, 10.7010], 'Con Dao': [106.6100, 8.6900], 'Mai Chau': [105.0900, 20.6600], 'Buon Ma Thuot': [108.0500, 12.6667],
  'Kratie': [106.0180, 12.4881], 'Kep': [104.3160, 10.4831], 'Koh Rong Sanloem': [103.3100, 10.6000],
  'Nong Khiaw': [102.6167, 20.5667], 'Luang Namtha': [101.4130, 20.9490], 'Don Det': [105.9333, 13.9333], 'Thakhek': [104.8000, 17.4000],
};

let libsPromise = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = resolve; s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.append(s);
  });
}
function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.append(l);
}
function loadLibs() {
  if (libsPromise) return libsPromise;
  loadCss('lib/maplibre-gl.css');
  libsPromise = loadScript('lib/maplibre-gl.js');
  return libsPromise;
}

// Self-hosted geometry style: sea background, the four country fills with a coastline
// outline, and the Mekong. No glyphs/sprites/text layers, so nothing is fetched.
function basemapStyle() {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: BASEMAP, attribution: '© OpenStreetMap · Natural Earth' },
      mekong: { type: 'geojson', data: MEKONG_FC },
      satellite: { type: 'raster', tiles: [SATELLITE_TILES], tileSize: 256, maxzoom: SATELLITE_MAXZOOM, attribution: SATELLITE_ATTR },
      street: { type: 'raster', tiles: [STREET_TILES], tileSize: 256, maxzoom: STREET_MAXZOOM, attribution: STREET_ATTR },
      borderlines: { type: 'geojson', data: BORDER_LINES },
    },
    layers: [
      { id: 'sea', type: 'background', paint: { 'background-color': '#9FD3CE' } },
      { id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#EFE2C6' } },
      { id: 'land-outline', source: 'land', type: 'line', paint: { 'line-color': '#C9A86A', 'line-width': 1.2 } },
      // Street raster sits above the geometry but below satellite: when satellite is hidden ("Map"
      // view) the streets show through; when satellite is on it covers the streets. Toggled by the
      // controller's setSatellite (street visible === satellite hidden).
      { id: 'street', source: 'street', type: 'raster', layout: { visibility: 'none' } },
      { id: 'satellite', source: 'satellite', type: 'raster', layout: { visibility: 'visible' } },
      { id: 'borders', source: 'borderlines', type: 'line', layout: { visibility: 'visible' },
        paint: { 'line-color': '#FF3B30', 'line-width': 2, 'line-dasharray': [2, 1.5], 'line-opacity': 0.95 } },
      { id: 'mekong-line', source: 'mekong', type: 'line', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2C7DA0', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 8, 3, 12, 6] } },
    ],
  };
}

// ---- WORLD MAP OF VISITS ----------------------------------------------------
// A separate, much smaller map than initMap: no places, no pins-as-markers, no GPS
// control, no offline-area tooling. Just the world with dots on it.
//
// The basemap is the Esri street raster already used elsewhere, which is worldwide and
// already named in the CSP, so this adds no new dependency and no new origin. At world
// zoom that is a handful of tiles. When they cannot load — offline, or a firewall — the
// map does NOT go blank: the sea background, a 30° graticule and the self-hosted
// four-country geometry all render from data in the bundle, so the dots still sit on
// something recognisable. That is the same graceful-degradation rule the rest of the
// app's map layers follow.
function graticule(step = 30) {
  const features = [];
  for (let lng = -180; lng <= 180; lng += step) {
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[lng, -85], [lng, 85]] } });
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const line = [];
    for (let lng = -180; lng <= 180; lng += 10) line.push([lng, lat]);
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line } });
  }
  return { type: 'FeatureCollection', features };
}

// How far out any in-app map may zoom: far enough to see all four countries the app covers at
// once, and no further.
//   Thailand  5.6–20.5°N,  97.3–105.7°E
//   Vietnam   8.2–23.4°N, 102.1–109.5°E   (mainland; the offshore island claims are ignored,
//                                          they would drag the box 8° east for nothing)
//   Cambodia 10.4–14.7°N, 102.3–107.6°E
//   Laos     13.9–22.5°N, 100.1–107.7°E
// So the four countries together span 97.3–109.5°E and 5.6–23.4°N.
//
// The box below is deliberately LARGER than that span, and the reason is worth stating because
// the obvious tight box is wrong. MapLibre's maxBounds clamps zoom so the viewport stays
// *inside* the box, and a viewport has an aspect ratio the box does not: on a phone the map is
// about 343x320, so when the box's longitude fills the width, its latitude is cropped to
// roughly width/height of the span. Fitting the box exactly to the four countries therefore
// stopped the zoom at 7–22.3°N — southern Thailand and the top of Vietnam were unreachable at
// maximum zoom-out, which is precisely what this was supposed to fix. The extra ~3° of
// longitude buys the latitude back; the margin is sea, Myanmar and southern China, so panning
// is still confined to the region rather than the planet.
//
// WHEN A COUNTRY IS ADDED TO THE APP, EXTEND THIS BOX — it is the single place that decides
// how far out every map can go, and a new country outside it would be unreachable on the map
// even though its data had loaded. Re-check the fit on a 375px screen after changing it.
export const REGION_BOUNDS = [[92.0, 2.0], [115.0, 27.5]];   // [[west, south], [east, north]]

function pointsFC(points) {
  return {
    type: 'FeatureCollection',
    features: (points || []).map((p) => ({
      type: 'Feature',
      properties: { n: p.n || 1, mine: p.mine ? 1 : 0 },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
  };
}

export async function initVisitMap(containerEl, points) {
  await loadLibs();
  const maplibregl = window.maplibregl;
  if (!maplibregl) throw new Error('map library unavailable');
  const map = new maplibregl.Map({
    container: containerEl,
    style: {
      version: 8,
      sources: {
        street: { type: 'raster', tiles: [STREET_TILES], tileSize: 256, maxzoom: STREET_MAXZOOM, attribution: STREET_ATTR },
        grid: { type: 'geojson', data: graticule() },
        land: { type: 'geojson', data: BASEMAP, attribution: '© OpenStreetMap · Natural Earth' },
        visits: { type: 'geojson', data: pointsFC(points) },
      },
      layers: [
        { id: 'sea', type: 'background', paint: { 'background-color': '#9FD3CE' } },
        { id: 'land', source: 'land', type: 'fill', paint: { 'fill-color': '#EFE2C6' } },
        { id: 'grid', source: 'grid', type: 'line', paint: { 'line-color': '#7FBDB7', 'line-width': 0.6 } },
        { id: 'street', source: 'street', type: 'raster', paint: { 'raster-opacity': 0.95 } },
        // Radius grows with the visit count but is capped, so one very busy cell cannot
        // swallow a continent. sqrt keeps a 100-visit dot from being 100x a 1-visit dot.
        { id: 'visit-halo', source: 'visits', type: 'circle',
          paint: {
            'circle-color': ['case', ['==', ['get', 'mine'], 1], '#FF6B3D', '#2C7DA0'],
            'circle-opacity': 0.22,
            'circle-radius': ['min', 26, ['*', 4, ['sqrt', ['max', 1, ['get', 'n']]]]],
          } },
        { id: 'visit-dot', source: 'visits', type: 'circle',
          paint: {
            'circle-color': ['case', ['==', ['get', 'mine'], 1], '#FF6B3D', '#2C7DA0'],
            'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 1.2,
            'circle-radius': ['min', 11, ['+', 3.5, ['sqrt', ['max', 1, ['get', 'n']]]]],
          } },
      ],
    },
    center: [40, 20], zoom: 1.1, minZoom: 0.6, maxZoom: 9,
    attributionControl: { compact: true },
    renderWorldCopies: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  // MapLibre measures its container once, at construction. This map is built inside a card
  // that is still being laid out — `aspect-ratio` plus `max-height: 46vh` resolves after the
  // element is in the document — so the first measurement is routinely narrower than the
  // final box, and the map then paints into a strip with dead space beside it. Watch the
  // container and tell the map when its size actually settles.
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    let last = '';
    ro = new ResizeObserver(() => {
      const k = `${containerEl.clientWidth}x${containerEl.clientHeight}`;
      if (k === last || !containerEl.clientWidth) return;
      last = k;
      try { map.resize(); } catch { /* map already removed */ }
    });
    ro.observe(containerEl);
  }
  // Belt and braces for browsers without ResizeObserver, and for the case where the card is
  // still transitioning when the observer first fires.
  map.once('load', () => {
    try { map.resize(); } catch { /* noop */ }
    // MapLibre renders the compact attribution EXPANDED on first paint, which on a phone-width
    // map covers a third of the world. Collapse it to the ⓘ it is meant to be — the credit is
    // still one tap away, and the visitors screen also prints a permanent credit line beneath
    // the map, so nothing is hidden.
    try {
      containerEl.querySelectorAll('.maplibregl-ctrl-attrib.maplibregl-compact-show')
        .forEach((el) => el.classList.remove('maplibregl-compact-show'));
    } catch { /* noop */ }
  });

  return {
    map,
    setPoints(next) {
      const src = map.getSource('visits');
      if (src) src.setData(pointsFC(next));
    },
    fit(pts) {
      const list = (pts || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      if (!list.length) return;
      const b = new maplibregl.LngLatBounds([list[0].lng, list[0].lat], [list[0].lng, list[0].lat]);
      list.forEach((p) => b.extend([p.lng, p.lat]));
      try { map.fitBounds(b, { padding: 48, maxZoom: 6, duration: 0 }); } catch { /* single point */ }
    },
    dispose() {
      if (ro) { try { ro.disconnect(); } catch { /* noop */ } }
      try { map.remove(); } catch { /* already gone */ }
    },
  };
}

// Initialise the map into containerEl for a caller-supplied list of places — used by
// Places' living map and the place-detail/street-food mini-maps: numbered/clustered
// pins, rating-or-category colouring, an optional built-in Map/Satellite toggle.
// `opts.places` is the array to show; every current caller passes one. (This also
// once ran in a "full", places-omitted mode for the standalone #map screen; that
// screen was retired into Places and the mode's dead code has since been removed —
// see git history.) Also available: the "way back" line, my-accommodation marker,
// measure tool, offline-area tile saving, offline search, borders toggle, flyTo.
// Returns one controller exposing every method.
// Rejects if the libraries cannot load (caller shows a fallback).
export async function initMap(containerEl, opts = {}) {
  await loadLibs();
  const maplibregl = window.maplibregl;
  if (!maplibregl) throw new Error('map library unavailable');
  const embed = !!opts.places; // embed mode (Places / mini-maps) vs full mode (#map)

  const start = opts.center || { lng: 104.5, lat: 13.5 }; // centre on the region
  const map = new maplibregl.Map({
    container: containerEl,
    style: basemapStyle(),
    center: [start.lng, start.lat],
    zoom: opts.zoom || 5.4,
    // Zoom out far enough to see all four countries at once, and no further (direct request).
    // maxBounds does BOTH halves of that on its own: MapLibre clamps the centre to the box and
    // clamps zoom so the viewport never shows more than the box, which is why there is no
    // matching minZoom here — a fixed one would be wrong on every container size but the one
    // it was measured on. Pinching out on a phone now stops at the region instead of the
    // planet, and panning cannot wander into the Pacific.
    // `opts.worldBounds` opts out; the global visitors map (initVisitMap, below) is a
    // different question and is deliberately left worldwide.
    maxBounds: opts.worldBounds ? undefined : REGION_BOUNDS,
    // The far end of the same idea: stop the pinch where the imagery stops being real, so a
    // traveller cannot zoom past the data into a magnified blur. See SATELLITE_MAXZOOM.
    maxZoom: MAP_MAXZOOM,
    attributionControl: true,
  });
  // Compass enabled so the map can be rotated and reset to north for orientation; a metric
  // scale bar so distances can be judged offline (both glyph-free, no fetch). Full mode keeps
  // the scale top-left (clear of the toolbar above); embed mode keeps it bottom-left — each
  // mode's original placement, preserved so neither map's layout shifts under this merge.
  map.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: false }), 'top-right');
  const geo = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true }, trackUserLocation: true,
    showUserLocation: true, showUserHeading: true,
  });
  map.addControl(geo, 'top-right');
  try { map.addControl(new maplibregl.ScaleControl({ maxWidth: embed ? 120 : 130, unit: 'metric' }), embed ? 'bottom-left' : 'top-left'); } catch { /* older build */ }
  // "Key" button on the map itself (full mode): opens + scrolls to the legend so it is
  // reachable while looking at the map (HTML control, not a GL text layer — glyph-free is
  // unaffected).
  if (opts.onShowKey) {
    const keyCtrl = {
      onAdd() {
        const d = document.createElement('div');
        d.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        const b = document.createElement('button');
        b.type = 'button'; b.title = 'Map key'; b.setAttribute('aria-label', 'Open the map key');
        b.textContent = '🔑'; b.style.fontSize = '15px';
        b.addEventListener('click', () => { try { opts.onShowKey(); } catch { /* noop */ } });
        d.appendChild(b); this._c = d; return d;
      },
      onRemove() { if (this._c && this._c.parentNode) this._c.parentNode.removeChild(this._c); },
    };
    map.addControl(keyCtrl, 'top-right');
  }

  // ---- Satellite / street toggle (shared by both modes) ------------------------
  // Full mode with no opts.satellite passed: leave the style's own default (satellite
  // visible) untouched at load — the standalone map's caller re-applies the traveller's
  // real persisted layer prefs itself once the controller resolves, exactly as before this
  // merge. Embed mode, or any caller that DOES pass opts.satellite, gets the active default
  // this map has always forced on its own: on only when opts.satellite === true.
  let satOn = (embed || Object.prototype.hasOwnProperty.call(opts, 'satellite')) ? (opts.satellite === true) : null;
  const applySatellite = () => {
    if (satOn === null) return; // full mode, unspecified: do not touch the style's own default
    try {
      if (map.getLayer('satellite')) map.setLayoutProperty('satellite', 'visibility', satOn ? 'visible' : 'none');
      if (map.getLayer('street')) map.setLayoutProperty('street', 'visibility', satOn ? 'none' : 'visible');
    } catch { /* noop */ }
  };
  const setSatellite = (on) => {
    satOn = !!on; applySatellite();
    if (opts.onStyleChange) { try { opts.onStyleChange(satOn); } catch { /* noop */ } }
  };
  map.on('style.load', applySatellite);
  // In-map Map/Satellite toggle: a two-button segment (opt-in via opts.styleToggle — Places
  // uses it; the full map instead drives setSatellite from its own external checkbox UI, so
  // it simply never passes this option). HTML control — glyph-free GL style is unaffected.
  if (opts.styleToggle) {
    const toggleCtrl = {
      onAdd() {
        const d = document.createElement('div');
        d.className = 'maplibregl-ctrl maplibregl-ctrl-group mk-style-toggle';
        const mk = (label, sat, title) => {
          const b = document.createElement('button');
          b.type = 'button'; b.textContent = label; b.title = title;
          b.setAttribute('aria-label', title);
          b.addEventListener('click', () => { setSatellite(sat); d.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
          return b;
        };
        const bMap = mk('🗺', false, 'Map view'), bSat = mk('🛰', true, 'Satellite view');
        bMap.setAttribute('aria-pressed', String(!satOn)); bSat.setAttribute('aria-pressed', String(satOn));
        d.append(bMap, bSat); this._c = d; return d;
      },
      onRemove() { if (this._c && this._c.parentNode) this._c.parentNode.removeChild(this._c); },
    };
    map.addControl(toggleCtrl, 'top-left');
  }
  // GPS: reuse the single built-in GeolocateControl (one watcher, one blue dot). Both prior
  // calling conventions are supported so neither mode's call sites need to change: embed
  // callers pass opts.onLocate (wired here, at construction); the full map instead calls the
  // returned onLocate(cb)/triggerLocate() controller methods after it resolves.
  if (opts.onLocate) geo.on('geolocate', (e) => { try { opts.onLocate({ lat: e.coords.latitude, lng: e.coords.longitude, accuracy: e.coords.accuracy }); } catch { /* noop */ } });
  const onLocate = (cb) => geo.on('geolocate', (e) => cb({ lat: e.coords.latitude, lng: e.coords.longitude, accuracy: e.coords.accuracy }));
  const triggerLocate = () => { try { geo.trigger(); } catch { /* not ready / denied */ } };

  // Show the traveller where they are WITHOUT making them find and press the target button
  // first. Standing in an unfamiliar city, "where am I on this map" is the first question the
  // map exists to answer, and it was costing a deliberate tap on every single map, every time.
  //
  // It only ever fires when the browser has ALREADY been granted location — checked through
  // the Permissions API, with a stored previous fix as the fallback for browsers that do not
  // implement it. That distinction is the whole design: auto-triggering on 'prompt' would
  // throw a system permission dialog in the traveller's face on every map in the app, which
  // is both hostile and the fastest way to get location denied for good. Someone who has
  // never granted it still taps the button, exactly as before, and is asked once.
  // First moment the map has finished drawing everything it can — used by callers that show a
  // "loading imagery" state, because until the raster tiles arrive the map renders as the
  // offline geometry: cream landmasses and red border lines. That is a correct fallback and a
  // terrible thing to leave on screen unexplained; it reads as "the map is just outlines".
  if (opts.onReady) map.once('idle', () => { try { opts.onReady(); } catch { /* noop */ } });

  if (opts.autoLocate !== false) {
    const armLocate = () => {
      let done = false;
      const fire = () => { if (!done) { done = true; triggerLocate(); } };
      try {
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'geolocation' })
            .then((st) => { if (st.state === 'granted') fire(); })
            .catch(() => { if (getLastFix()) fire(); });   // Safari < 16 has no geolocation query
        } else if (getLastFix()) fire();
      } catch { /* permissions unavailable — leave it to the button */ }
    };
    if (map.loaded()) armLocate();
    else map.once('load', armLocate);
  }

  let ro = null; // ResizeObserver — only created in embed mode; referenced by the shared dispose()
  let embedApi = {};

  // ==== SHARED — mode-independent features available on every controller =========
  // My-accommodation marker + the "way back" guide line, the measure tool, offline-area
  // tile helpers and the offline name search all work the same regardless of whether the
  // map is showing the full curated dataset or a caller-supplied list, so they live here
  // once instead of being duplicated (or, before this slice, only ever reachable in full
  // mode even though nothing about them is actually full-mode-specific).
  let stayMarker = null;          // the user's accommodation home marker (set live)
  // Build a custom home-pin element (a 🏠 on a white disc) and (re)position it.
  function placeStayMarker(coords) {
    if (!coords) { if (stayMarker) { stayMarker.remove(); stayMarker = null; } return; }
    if (stayMarker) { stayMarker.setLngLat([coords.lng, coords.lat]); return; }
    const el = document.createElement('div');
    el.textContent = '🏠';
    el.title = 'Your accommodation';
    el.style.cssText = 'font-size:18px;width:30px;height:30px;line-height:30px;text-align:center;background:#FFF6E2;border:2px solid #C0431A;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer';
    stayMarker = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([coords.lng, coords.lat]).addTo(map);
  }
  // Nearest known city to a point (within ~0.8°), else null — used for a default
  // saved-area name.
  function nearestCity(coords) {
    let best = null, bestD = Infinity;
    for (const name in CITY_COORDS) {
      const d = (coords.lng - CITY_COORDS[name][0]) ** 2 + (coords.lat - CITY_COORDS[name][1]) ** 2;
      if (d < bestD) { bestD = d; best = name; }
    }
    return bestD <= 0.64 ? best : null;
  }
  // "Way back" guide line: a direct dashed line from the live GPS dot to the saved
  // accommodation, redrawn as you move. Not turn-by-turn (no offline routing engine),
  // but a reliable heading + a casing so it reads over satellite — fully offline.
  function addWayback() {
    if (map.getSource('mk-wayback')) return;
    map.addSource('mk-wayback', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'mk-wayback-casing', type: 'line', source: 'mk-wayback',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': 7, 'line-opacity': 0.75 } });
    map.addLayer({ id: 'mk-wayback-line', type: 'line', source: 'mk-wayback',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#D6336C', 'line-width': 4, 'line-dasharray': [1.4, 1] } });
  }
  function setWayback(from, to) {
    const src = map.getSource('mk-wayback');
    if (!src) return;
    const empty = { type: 'FeatureCollection', features: [] };
    if (!from || !to) { src.setData(empty); return; }
    src.setData({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] } }] });
  }
  // Measure tool: tap points to lay a multi-segment line; the running total distance
  // is reported back to the toolbar. Fully offline (great-circle maths, no service).
  function haversineKmLL(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  let measuring = false, measurePts = [], measureCb = null;
  function addMeasureLayers() {
    if (map.getSource('mk-measure')) return;
    map.addSource('mk-measure', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'mk-measure-line', type: 'line', source: 'mk-measure',
      layout: { 'line-cap': 'round', 'line-join': 'round' }, filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': '#1E1E1E', 'line-width': 3, 'line-dasharray': [1.5, 1] } });
    map.addLayer({ id: 'mk-measure-pts', type: 'circle', source: 'mk-measure', filter: ['==', '$type', 'Point'],
      paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-color': '#1E1E1E', 'circle-stroke-width': 2 } });
  }
  // Journey route: an ordered dashed line connecting opts.route (an array of {lat,lng}, in
  // visit order) — the journey map's dotted line between stops. No-op for every other caller,
  // which never passes opts.route.
  function addRouteLayers() {
    if (map.getSource('mk-route')) return;
    map.addSource('mk-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'mk-route-line', type: 'line', source: 'mk-route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#C0431A', 'line-dasharray': [2.6, 1.8], 'line-opacity': 0.9,
        'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 8, 2.5, 12, 4] } });
  }
  function renderRoute() {
    const src = map.getSource('mk-route');
    if (!src) return;
    const pts = (opts.route || []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    src.setData(pts.length > 1
      ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: pts.map((p) => [p.lng, p.lat]) } }] }
      : { type: 'FeatureCollection', features: [] });
  }
  function renderMeasure() {
    const src = map.getSource('mk-measure'); if (!src) return;
    const feats = measurePts.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] } }));
    if (measurePts.length >= 2) feats.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: measurePts.map((p) => [p.lng, p.lat]) } });
    src.setData({ type: 'FeatureCollection', features: feats });
    let km = 0;
    for (let i = 1; i < measurePts.length; i++) km += haversineKmLL(measurePts[i - 1], measurePts[i]);
    if (measureCb) measureCb(km, measurePts.length);
  }
  // Hospitals layer: an empty source + two circle layers (clusters, individual points), added
  // once and hidden — setHospitals(true) is what actually fetches/merges the four countries'
  // data (loadHospitalsFC, module-scope cached) and fills the source. No cluster-count TEXT
  // layer: the style is glyph-free (no `glyphs` URL anywhere), so "more hospitals here" is
  // communicated by circle-radius scaled to point_count instead, same technique as
  // initVisitMap's visit-halo/visit-dot pair above.
  function addHospitalsLayers() {
    if (map.getSource('mk-hospitals')) return;
    map.addSource('mk-hospitals', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 14,
    });
    map.addLayer({
      id: 'mk-hospitals-clusters', type: 'circle', source: 'mk-hospitals',
      filter: ['has', 'point_count'],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': '#C0431A',
        'circle-opacity': 0.85,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'point_count']], 1, 10, 12, 28],
      },
    });
    map.addLayer({
      id: 'mk-hospitals-points', type: 'circle', source: 'mk-hospitals',
      filter: ['!', ['has', 'point_count']],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': HOSPITAL_TIER_COLOR,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          5, ['case', ['==', ['get', 'kind'], 1], 3, 2.2],
          14, ['case', ['==', ['get', 'kind'], 1], 9, 6]],
      },
    });
    const setCursor = (c) => { map.getCanvas().style.cursor = c; };
    map.on('mouseenter', 'mk-hospitals-clusters', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-hospitals-clusters', () => setCursor(''));
    map.on('mouseenter', 'mk-hospitals-points', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-hospitals-points', () => setCursor(''));
    map.on('click', 'mk-hospitals-clusters', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['mk-hospitals-clusters'] });
      const f = feats[0];
      if (!f) return;
      const src = map.getSource('mk-hospitals');
      src.getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: f.geometry.coordinates, zoom });
      });
    });
    map.on('click', 'mk-hospitals-points', (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const p = f.properties;
      // .setDOMContent(), never .setHTML(): hospital names come from OpenStreetMap and are
      // untrusted external strings — h() sets textContent, so nothing is parsed as markup.
      const body = h('div', {}, [
        h('strong', {}, p.name || 'Unnamed facility'),
        h('div', { class: 'muted', style: 'font-size:12px' },
          p.tier ? (HOSPITAL_TIER_LABEL[p.tier] || p.tier) : `${KIND_LABEL_FALLBACK[p.kind] || 'Facility'} (OpenStreetMap)`),
      ]);
      new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(body)
        .addTo(map);
    });
  }
  function setHospitals(on) {
    // Unlike borders (baked into the initial style object, so map.getLayer('borders') exists
    // the instant the Map is constructed), the hospitals source/layers are only added inside
    // the style.load handler (addHospitalsLayers, above) — cheap to add once, but that means a
    // caller reconciling a saved "on" preference immediately after initMap() resolves can race
    // ahead of style.load and silently no-op (map.getSource returns undefined). Defer to that
    // event when it hasn't fired yet; call straight through once it has (the common case —
    // every interactive checkbox toggle happens long after the map has settled).
    const apply = () => {
      if (!on) {
        if (map.getLayer('mk-hospitals-points')) map.setLayoutProperty('mk-hospitals-points', 'visibility', 'none');
        if (map.getLayer('mk-hospitals-clusters')) map.setLayoutProperty('mk-hospitals-clusters', 'visibility', 'none');
        return Promise.resolve();
      }
      return loadHospitalsFC().then((fc) => {
        const src = map.getSource('mk-hospitals');
        if (src) src.setData(fc);
        if (map.getLayer('mk-hospitals-points')) map.setLayoutProperty('mk-hospitals-points', 'visibility', 'visible');
        if (map.getLayer('mk-hospitals-clusters')) map.setLayoutProperty('mk-hospitals-clusters', 'visibility', 'visible');
      });
    };
    if (map.getSource('mk-hospitals')) return apply();
    return new Promise((resolve) => { map.once('style.load', () => resolve(apply())); });
  }
  // ATM layer: same empty-source-plus-two-circle-layers shape as hospitals above, added once
  // and hidden until setAtms(true). Only ~240 points total (four countries combined) so no
  // clustering is strictly necessary at low zoom, but the same cluster/point pair is used
  // anyway for one consistent interaction pattern (tap cluster to zoom, tap point for details)
  // rather than a special case for the smaller layer.
  function addAtmsLayers() {
    if (map.getSource('mk-atms')) return;
    map.addSource('mk-atms', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 14,
    });
    map.addLayer({
      id: 'mk-atms-clusters', type: 'circle', source: 'mk-atms',
      filter: ['has', 'point_count'],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': '#0A84FF',
        'circle-opacity': 0.85,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'point_count']], 1, 10, 12, 24],
      },
    });
    map.addLayer({
      id: 'mk-atms-points', type: 'circle', source: 'mk-atms',
      filter: ['!', ['has', 'point_count']],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': ATM_TIER_COLOR,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 14, 7],
      },
    });
    const setCursor = (c) => { map.getCanvas().style.cursor = c; };
    map.on('mouseenter', 'mk-atms-clusters', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-atms-clusters', () => setCursor(''));
    map.on('mouseenter', 'mk-atms-points', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-atms-points', () => setCursor(''));
    map.on('click', 'mk-atms-clusters', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['mk-atms-clusters'] });
      const f = feats[0];
      if (!f) return;
      const src = map.getSource('mk-atms');
      src.getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: f.geometry.coordinates, zoom });
      });
    });
    map.on('click', 'mk-atms-points', (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const p = f.properties;
      // .setDOMContent(), never .setHTML(): the name tag comes from OpenStreetMap and is an
      // untrusted external string — h() sets textContent, so nothing is parsed as markup.
      // The tier label never says "free" for a 'low' tier — that distinction is the entire
      // point of this layer, so it cannot be allowed to blur in the one place a traveller
      // reads it right before choosing which machine to use.
      const body = h('div', {}, [
        h('strong', {}, p.name || p.bank),
        h('div', { class: 'muted', style: 'font-size:12px' }, p.tier === 'free' ? '✅ No foreign-card fee' : '💲 Lowest fee available here'),
        h('div', { class: 'muted', style: 'font-size:12px;margin-top: var(--sp-0h)' }, p.note),
      ]);
      new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(body)
        .addTo(map);
    });
  }
  function setAtms(on) {
    // Same style.load race as setHospitals above (see its comment) — the source/layers are
    // added inside the style.load handler, not baked into the initial style, so a caller
    // reconciling a saved "on" preference immediately after initMap() resolves must defer if
    // that event hasn't fired yet.
    const apply = () => {
      if (!on) {
        if (map.getLayer('mk-atms-points')) map.setLayoutProperty('mk-atms-points', 'visibility', 'none');
        if (map.getLayer('mk-atms-clusters')) map.setLayoutProperty('mk-atms-clusters', 'visibility', 'none');
        return Promise.resolve();
      }
      return loadAtmsFC().then((fc) => {
        const src = map.getSource('mk-atms');
        if (src) src.setData(fc);
        if (map.getLayer('mk-atms-points')) map.setLayoutProperty('mk-atms-points', 'visibility', 'visible');
        if (map.getLayer('mk-atms-clusters')) map.setLayoutProperty('mk-atms-clusters', 'visibility', 'visible');
      });
    };
    if (map.getSource('mk-atms')) return apply();
    return new Promise((resolve) => { map.once('style.load', () => resolve(apply())); });
  }
  // The walking route line. Empty until setWalkRoute() receives a path from js/walk-route.js,
  // which computes it on-device from a pedestrian graph with no network at route time.
  function addWalkLayers() {
    if (map.getSource('mk-walk')) return;
    map.addSource('mk-walk', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    // A white casing under the line so the route stays legible over both satellite imagery
    // and the street basemap, which the traveller can switch between mid-walk.
    map.addLayer({
      id: 'mk-walk-casing', type: 'line', source: 'mk-walk',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#FFFFFF', 'line-width': 9, 'line-opacity': 0.9 },
    });
    map.addLayer({
      id: 'mk-walk-line', type: 'line', source: 'mk-walk',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#30D158', 'line-width': 5 },
    });
  }

  // coords arrive as [[lat, lng], ...] (the routing engine's order); GeoJSON wants [lng, lat].
  function setWalkRoute(coords) {
    // Same style.load race as setHospitals/setAtms above — see setHospitals's comment.
    const apply = () => {
      const src = map.getSource('mk-walk');
      if (!src) return;
      if (!coords || coords.length < 2) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      src.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: coords.map((p) => [p[1], p[0]]) },
        }],
      });
      try {
        const b = new maplibregl.LngLatBounds([coords[0][1], coords[0][0]], [coords[0][1], coords[0][0]]);
        for (const p of coords) b.extend([p[1], p[0]]);
        map.fitBounds(b, { padding: 56, maxZoom: 17, duration: 600 });
      } catch { /* noop */ }
    };
    if (map.getSource('mk-walk')) { apply(); return Promise.resolve(); }
    return new Promise((resolve) => { map.once('style.load', () => { apply(); resolve(); }); });
  }

  // Bus stop layer: same shape again. ~13,600 points (13,144 of them Bangkok, which does carry
  // route numbers; the rest are downtown-core-only for Vietnam/Cambodia/Laos with no route
  // numbers) — clustering matters here, unlike the much smaller ATM layer.
  function addBusLayers() {
    if (map.getSource('mk-bus')) return;

    // Route lines, drawn beneath the stops so a stop dot is never hidden by its own route.
    // Only networks small enough to read as distinct colours get lines — Phu Quoc's four
    // route numbers do; Bangkok's 708 would be an unreadable tangle on a phone, which is the
    // same judgement that made this a stops-first layer in the first place.
    map.addSource('mk-bus-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    // A dark casing under each coloured line keeps all four legible over pale satellite sand
    // and over the street basemap alike.
    map.addLayer({
      id: 'mk-bus-routes-casing', type: 'line', source: 'mk-bus-routes',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': 'rgba(0,0,0,0.45)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3.5, 14, 7.5],
      },
    });
    map.addLayer({
      id: 'mk-bus-routes-line', type: 'line', source: 'mk-bus-routes',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 2, 14, 5],
      },
    });

    // Stops for the small, route-coloured networks live in their own UNCLUSTERED source.
    // Clustering exists for Bangkok's 13,144 points; applying it to Phu Quoc's 107 meant that
    // at the zoom you actually look at an island from, every stop collapsed into a few count
    // bubbles — so the route lines were drawn but there was nothing showing where to get on
    // or off. 107 points render fine unclustered at any zoom, so they are simply always there.
    map.addSource('mk-bus-solo', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: 'mk-bus-solo-points', type: 'circle', source: 'mk-bus-solo',
      layout: { visibility: 'none' },
      paint: {
        'circle-color': ['coalesce', ['get', 'color'], '#5E5CE6'],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 14, 2.5],
        'circle-stroke-color': '#FFFFFF',
        // Bigger than the clustered layer's dots at every zoom: these are the stops a
        // traveller is actively looking for, on a network small enough that they can be.
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 12, 6.5, 16, 10],
      },
    });

    map.addSource('mk-bus', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 12,
    });
    map.addLayer({
      id: 'mk-bus-clusters', type: 'circle', source: 'mk-bus',
      filter: ['has', 'point_count'],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': '#5E5CE6',
        'circle-opacity': 0.85,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'point_count']], 1, 10, 12, 28],
      },
    });
    map.addLayer({
      id: 'mk-bus-points', type: 'circle', source: 'mk-bus',
      filter: ['!', ['has', 'point_count']],
      layout: { visibility: 'none' },
      paint: {
        // A stop wears its route's colour where the network is small enough to have one
        // (Phu Quoc); everywhere else it falls back to the layer's own violet.
        'circle-color': ['coalesce', ['get', 'color'], '#5E5CE6'],
        // A thicker white ring and a bigger dot at navigating zooms: these sit over satellite
        // imagery as often as over the street map, and at 5.5px with a 1px ring they were not
        // reliably visible against sand or built-up grey.
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 2],
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 12, 5, 16, 8],
      },
    });
    const setCursor = (c) => { map.getCanvas().style.cursor = c; };
    map.on('mouseenter', 'mk-bus-clusters', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-bus-clusters', () => setCursor(''));
    map.on('mouseenter', 'mk-bus-solo-points', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-bus-solo-points', () => setCursor(''));
    map.on('mouseenter', 'mk-bus-points', () => setCursor('pointer'));
    map.on('mouseleave', 'mk-bus-points', () => setCursor(''));
    map.on('click', 'mk-bus-clusters', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['mk-bus-clusters'] });
      const f = feats[0];
      if (!f) return;
      const src = map.getSource('mk-bus');
      src.getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: f.geometry.coordinates, zoom });
      });
    });
    // Both stop layers share one popup: the clustered one for the big networks and the
    // unclustered one for the route-coloured islands.
    const busStopPopup = (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const p = f.properties;
      // .setDOMContent(), never .setHTML(): stop names come from OpenStreetMap/a GTFS feed and
      // are untrusted external strings — h() sets textContent, so nothing is parsed as markup.
      const fare = busFareFor ? busFareFor(p.cc) : '';
      // Why there is no departure time on this popup, stated ON the popup.
      //
      // No timetable is shown anywhere in this app, and that is a sourcing limit rather than an
      // omission: the Bangkok feed's own schedule table is a 2023-04-21 snapshot whose upstream
      // updater stopped, and no GTFS Realtime feed exists for these buses (scripts/
      // build_bus_th.py documents both). A departure time drawn from that would look exact and
      // be years wrong — which for someone actually standing at the stop is worse than no time
      // at all, because they would wait on it.
      //
      // The build script's header says the popup tells the traveller this. It did not: the only
      // sentence about what to do instead sat in the `!p.routes` branch, so Bangkok — the one
      // network that HAS route numbers, and the one where a traveller is most likely to expect
      // times beside them — showed route numbers and said nothing at all about timing. Every
      // stop now carries the line, worded for what that stop actually knows.
      const timing = p.routes
        ? 'No published timetable — these routes run frequently through the day. The number board on the bus is what to match.'
        : 'No route numbers or timetable for this area — match the number board on the bus, and ask the conductor for your stop.';
      const body = h('div', {}, [
        h('strong', {}, p.name || 'Bus stop'),
        p.routes ? h('div', { class: 'muted', style: 'font-size:12px' }, `Routes: ${p.routes}`) : null,
        h('div', { class: 'muted', style: 'font-size:12px' }, timing),
        fare ? h('div', { style: 'font-size:12px;margin-top: var(--sp-1)' }, [
          h('strong', {}, '💵 Fare: '),
          h('span', {}, fare),
        ]) : null,
        // Dated on purpose: fares move, and two of these five changed within the past year.
        fare && busFaresChecked
          ? h('div', { class: 'muted', style: 'font-size:11px;margin-top: var(--sp-0h)' },
            `Fares checked ${busFaresChecked}`)
          : null,
      ]);
      new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(body)
        .addTo(map);
    };
    map.on('click', 'mk-bus-points', busStopPopup);
    map.on('click', 'mk-bus-solo-points', busStopPopup);
  }
  const BUS_LAYERS = ['mk-bus-points', 'mk-bus-clusters', 'mk-bus-solo-points',
    'mk-bus-routes-line', 'mk-bus-routes-casing'];
  let busOn = false;
  let busMoveHandler = null;

  function paintBus() {
    return loadBusStopsFC(map.getBounds()).then(({ clustered, solo }) => {
      const src = map.getSource('mk-bus');
      if (src) src.setData(clustered);
      const ssrc = map.getSource('mk-bus-solo');
      if (ssrc) ssrc.setData(solo);
      const rsrc = map.getSource('mk-bus-routes');
      if (rsrc && busRoutesData) rsrc.setData(busRoutesData);
    });
  }

  function setBus(on) {
    // Same style.load race as setHospitals/setAtms above.
    const apply = () => {
      const show = (v) => BUS_LAYERS.forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
      });
      busOn = on;
      if (!on) {
        show('none');
        if (busMoveHandler) { map.off('moveend', busMoveHandler); busMoveHandler = null; }
        return Promise.resolve();
      }
      // Only the datasets under the current viewport load now (see BUS_BBOX); panning to a
      // city whose stops have not been fetched pulls that one file in and repaints. The
      // listener is added on "on" and removed on "off", so a screen with buses hidden is not
      // paying for a moveend handler.
      if (!busMoveHandler) {
        busMoveHandler = () => { if (busOn) paintBus(); };
        map.on('moveend', busMoveHandler);
      }
      return paintBus().then(() => show('visible'));
    };
    if (map.getSource('mk-bus')) return apply();
    return new Promise((resolve) => { map.once('style.load', () => resolve(apply())); });
  }

  // ---- Hiking trails and bike paths ------------------------------------------------------
  // Lines, added beneath the point layers so a hospital/ATM/bus dot is never hidden by a trail
  // running through it, and both dashed so they read as "a way through" rather than as another
  // road on the basemap. Green for walking, blue for cycling — the same two colours the rest
  // of the app uses for those two ideas.
  function addTrailLayers() {
    if (map.getSource('mk-hike')) return;
    map.addSource('mk-hike', { type: 'geojson', data: lineFC([]) });
    map.addSource('mk-bike', { type: 'geojson', data: lineFC([]) });
    // A dark casing under each, for the reason the bus routes have one: these sit over pale
    // satellite sand as often as over the street basemap, and a thin coloured line alone is
    // not reliably visible against either.
    const casing = (id, source) => ({
      id, type: 'line', source,
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': 'rgba(0,0,0,0.40)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 14, 5, 17, 8],
      },
    });
    map.addLayer(casing('mk-hike-casing', 'mk-hike'));
    map.addLayer({
      id: 'mk-hike-line', type: 'line', source: 'mk-hike',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#34C759',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 14, 2.6, 17, 4.5],
        'line-dasharray': [2, 1.4],
      },
    });
    map.addLayer(casing('mk-bike-casing', 'mk-bike'));
    map.addLayer({
      id: 'mk-bike-line', type: 'line', source: 'mk-bike',
      layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0A84FF',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 14, 2.6, 17, 4.5],
        'line-dasharray': [1.4, 1.2],
      },
    });

    const setCursor = (c) => { map.getCanvas().style.cursor = c; };
    const trailPopup = (label) => (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      // .setDOMContent(), never .setHTML(): these names are untrusted OpenStreetMap strings.
      new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(e.lngLat)
        .setDOMContent(h('div', {}, [
          h('strong', {}, f.properties.name || label),
          h('div', { class: 'muted', style: 'font-size:12px' }, label),
        ]))
        .addTo(map);
    };
    [['mk-hike-line', 'Hiking trail'], ['mk-bike-line', 'Bike path']].forEach(([id, label]) => {
      map.on('mouseenter', id, () => setCursor('pointer'));
      map.on('mouseleave', id, () => setCursor(''));
      map.on('click', id, trailPopup(label));
    });
  }

  const trailState = { hike: false, bike: false };
  let trailMoveHandler = null;
  function paintTrails() {
    return loadOutdoors('trails', map.getBounds()).then(() => {
      const hs = map.getSource('mk-hike');
      if (hs) hs.setData(lineFC(hikeFeatures));
      const bs = map.getSource('mk-bike');
      if (bs) bs.setData(lineFC(bikeFeatures));
    });
  }
  // Both kinds come out of one per-country file, so turning either on loads the pair and only
  // the visibility differs — which is also why they share one moveend handler.
  function setTrailKind(kind, on) {
    const ids = kind === 'hike'
      ? ['mk-hike-casing', 'mk-hike-line']
      : ['mk-bike-casing', 'mk-bike-line'];
    const apply = () => {
      const show = (v) => ids.forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
      });
      trailState[kind] = on;
      if (!on) {
        show('none');
        if (!trailState.hike && !trailState.bike && trailMoveHandler) {
          map.off('moveend', trailMoveHandler);
          trailMoveHandler = null;
        }
        return Promise.resolve();
      }
      if (!trailMoveHandler) {
        trailMoveHandler = () => { if (trailState.hike || trailState.bike) paintTrails(); };
        map.on('moveend', trailMoveHandler);
      }
      return paintTrails().then(() => show('visible'));
    };
    // Same style.load race as every other layer here.
    if (map.getSource('mk-hike')) return apply();
    return new Promise((resolve) => { map.once('style.load', () => resolve(apply())); });
  }
  const setTrails = (on) => setTrailKind('hike', on);
  const setBike = (on) => setTrailKind('bike', on);

  // ---- Viewpoints and waterfalls ---------------------------------------------------------
  // Clustered like the bus stops: ~5,000 points region-wide reads as nothing but noise drawn
  // individually at country zoom.
  function addScenicLayers() {
    if (map.getSource('mk-scenic')) return;
    map.addSource('mk-scenic', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 11,
    });
    map.addLayer({
      id: 'mk-scenic-clusters', type: 'circle', source: 'mk-scenic',
      filter: ['has', 'point_count'],
      layout: { visibility: 'none' },
      paint: {
        'circle-color': '#30B0C7',
        'circle-opacity': 0.85,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'point_count']], 1, 10, 12, 26],
      },
    });
    map.addLayer({
      id: 'mk-scenic-points', type: 'circle', source: 'mk-scenic',
      filter: ['!', ['has', 'point_count']],
      layout: { visibility: 'none' },
      paint: {
        // Two colours rather than two layers: a waterfall and a viewpoint are the same kind of
        // answer ("worth walking to"), told apart at a glance.
        'circle-color': ['case', ['==', ['get', 'kind'], 'w'], '#0A84FF', '#30B0C7'],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 14, 2],
        'circle-stroke-color': '#FFFFFF',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3, 12, 5.5, 16, 9],
      },
    });
    const setCursor = (c) => { map.getCanvas().style.cursor = c; };
    ['mk-scenic-points', 'mk-scenic-clusters'].forEach((id) => {
      map.on('mouseenter', id, () => setCursor('pointer'));
      map.on('mouseleave', id, () => setCursor(''));
    });
    map.on('click', 'mk-scenic-clusters', (e) => {
      const f = (map.queryRenderedFeatures(e.point, { layers: ['mk-scenic-clusters'] }) || [])[0];
      if (!f) return;
      map.getSource('mk-scenic').getClusterExpansionZoom(f.properties.cluster_id, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: f.geometry.coordinates, zoom });
      });
    });
    map.on('click', 'mk-scenic-points', (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const isFall = f.properties.kind === 'w';
      // .setDOMContent(), never .setHTML(): untrusted OpenStreetMap names.
      new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(f.geometry.coordinates)
        .setDOMContent(h('div', {}, [
          h('strong', {}, f.properties.name || (isFall ? 'Waterfall' : 'Viewpoint')),
          h('div', { class: 'muted', style: 'font-size:12px' }, isFall ? '💧 Waterfall' : '👁 Viewpoint'),
        ]))
        .addTo(map);
    });
  }
  let scenicOn = false;
  let scenicMoveHandler = null;
  function paintScenic() {
    return loadOutdoors('scenic', map.getBounds()).then(() => {
      const src = map.getSource('mk-scenic');
      if (src) src.setData({ type: 'FeatureCollection', features: scenicFeatures });
    });
  }
  function setScenic(on) {
    const apply = () => {
      const show = (v) => ['mk-scenic-clusters', 'mk-scenic-points'].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
      });
      scenicOn = on;
      if (!on) {
        show('none');
        if (scenicMoveHandler) { map.off('moveend', scenicMoveHandler); scenicMoveHandler = null; }
        return Promise.resolve();
      }
      if (!scenicMoveHandler) {
        scenicMoveHandler = () => { if (scenicOn) paintScenic(); };
        map.on('moveend', scenicMoveHandler);
      }
      return paintScenic().then(() => show('visible'));
    };
    // Same style.load race as every other layer here.
    if (map.getSource('mk-scenic')) return apply();
    return new Promise((resolve) => { map.once('style.load', () => resolve(apply())); });
  }
  // Offline search index over the curated data + the user's own pins. No geocoder /
  // network: a simple case-insensitive name match across cities, places, pools and pins.
  function searchIndex(q) {
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const out = [];
    for (const name in CITY_COORDS) {
      if (name.toLowerCase().includes(q)) out.push({ name, type: 'City', lng: CITY_COORDS[name][0], lat: CITY_COORDS[name][1], z: 12 });
    }
    for (const p of allPlaces()) {
      if (p.coords && (p.name || '').toLowerCase().includes(q)) out.push({ name: p.name, type: 'Place', id: p.id, lng: p.coords.lng, lat: p.coords.lat, z: 15 });
    }
    for (const p of POOLS) {
      if (p.coords && (p.name || '').toLowerCase().includes(q)) out.push({ name: p.name, type: 'Pool', lng: p.coords.lng, lat: p.coords.lat, z: 15 });
    }
    for (const pin of store.pins) {
      if (pin.coords && (pin.name || '').toLowerCase().includes(q)) out.push({ name: pin.name, type: 'Pin', id: pin.id, lng: pin.coords.lng, lat: pin.coords.lat, z: 15 });
    }
    // exact / prefix matches first, then by name length (shorter = closer match)
    out.sort((a, b) => {
      const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1, bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      return ap - bp || a.name.length - b.name.length;
    });
    return out.slice(0, 12);
  }
  // Add on style.load (fires when the inline style parses) so the wayback/measure layers
  // and any already-set accommodation marker exist even before — or without — basemap
  // tiles (which need the network on first load).
  map.on('style.load', () => {
    addWayback(); addMeasureLayers(); addRouteLayers(); renderRoute(); addHospitalsLayers(); addAtmsLayers(); addBusLayers(); addWalkLayers();
    addTrailLayers(); addScenicLayers();
    const stay = getMyStay();
    if (stay && stay.coords) placeStayMarker(stay.coords);
  });
  // tap empty map to drop a pin — or, in measure mode, to add a measurement point
  map.on('click', (e) => {
    if (measuring) { measurePts.push({ lat: e.lngLat.lat, lng: e.lngLat.lng }); renderMeasure(); return; }
    if (opts.onMapClick) opts.onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  });

  // ==== EMBED MODE — everything Places / mini-maps use ==========================
  const MARKET = '#E0A100', LOCAL = '#D62828';
  // Two ways to colour a pin: by RATING (default — quality at a glance, markets gold / local
  // eats red kept as special cases) or by CATEGORY family (opts.categoryColor(p), supplied by
  // the app's canonical colour system). setColorMode() flips between them without re-fitting.
  let colorMode = opts.colorMode === 'category' ? 'category' : 'rating';
  const colorFor = (p) => {
    // An explicit per-place colour (e.g. the app's category-bucket colour, so map pins match
    // the numbered list rows exactly) wins over both colour modes.
    if (typeof opts.markerColor === 'function') {
      try { const c = opts.markerColor(p); if (c) return c; } catch { /* fall through */ }
    }
    if (colorMode === 'category' && typeof opts.categoryColor === 'function') {
      try { const c = opts.categoryColor(p); if (c) return c; } catch { /* fall through to rating */ }
    }
    const cats = p.categories || [];
    if (cats.includes('market')) return MARKET;
    if (p.isLocal) return LOCAL;
    return ratingColor(effectiveRating(p.id, p.rating));
  };
  let markers = [];
  let lastList = opts.places || [];
  function fit(list) {
    const pts = (list || []).filter((p) => p.coords).map((p) => [p.coords.lng, p.coords.lat]);
    if (!pts.length) return;
    if (pts.length === 1) { map.flyTo({ center: pts[0], zoom: 13, duration: 400 }); return; }
    try {
      const b = new maplibregl.LngLatBounds(pts[0], pts[0]);
      pts.forEach((c) => b.extend(c));
      map.fitBounds(b, { padding: 46, maxZoom: 14, duration: 400 });
    } catch { /* noop */ }
  }
  // A numbered round badge marker (matches the numbered list rows) when opts.numbered is set;
  // otherwise the default MapLibre teardrop. The badge shows p._num, coloured by colorFor.
  function numPinEl(color, num) {
    const el = document.createElement('div');
    el.className = 'mk-numpin';
    el.style.background = color;
    // The pin number sits directly on the category hue, and several of those are too light for
    // white at 12px (market amber measures 2.27:1). See inkOn() in render-utils.js.
    el.style.color = inkOn(color);
    el.textContent = num != null ? String(num) : '•';
    return el;
  }
  // Numbered pin with its name visible beside it (opts.showLabels — the journey map; every
  // other numbered-pin caller leaves this off and gets the plain badge above, unchanged). A
  // separate element from numPinEl rather than an addition to it, so the label's own box can
  // never grow the marker's anchor box — MapLibre anchors on the wrapper's own size, which the
  // CSS fixes to exactly the badge (see .mk-numpin-lbl in style.css).
  function numPinLabelEl(color, num, label) {
    const wrap = document.createElement('div');
    wrap.className = 'mk-numpin-lbl';
    wrap.appendChild(numPinEl(color, num));
    if (label) {
      const tag = document.createElement('div');
      tag.className = 'mk-pin-name';
      tag.textContent = label;
      wrap.appendChild(tag);
    }
    return wrap;
  }
  function addSingle(p) {
    if (!p.coords) return;
    const color = colorFor(p);
    const m = opts.numbered
      ? new maplibregl.Marker({ element: opts.showLabels ? numPinLabelEl(color, p._num, p.name) : numPinEl(color, p._num), anchor: 'center' }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map)
      : new maplibregl.Marker({ color }).setLngLat([p.coords.lng, p.coords.lat]).addTo(map);
    const el = m.getElement();
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', (p._num != null ? p._num + '. ' : '') + (p.name || 'place'));
    // Lets an external caller (the journey map's stop list) find and highlight this exact
    // marker's element without keeping its own parallel list of marker objects.
    if (p.id != null) el.dataset.placeId = String(p.id);
    const open = (ev) => { ev.stopPropagation(); if (opts.onOpen) opts.onOpen(p.id); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') open(ev); });
    markers.push(m);
  }
  // Greedy pixel-space clustering so dense areas (e.g. Bangkok) stay readable when zoomed out:
  // a point within CLUSTER_PX of an existing cluster centre joins it, else it starts a new one.
  const CLUSTER_PX = 46;
  function clusterByPixels(list) {
    const clusters = [];
    (list || []).forEach((p) => {
      if (!p.coords) return;
      let xy; try { xy = map.project([p.coords.lng, p.coords.lat]); } catch { return; }
      let hit = null;
      for (const c of clusters) { const dx = c.x - xy.x, dy = c.y - xy.y; if (dx * dx + dy * dy <= CLUSTER_PX * CLUSTER_PX) { hit = c; break; } }
      if (hit) hit.members.push(p); else clusters.push({ x: xy.x, y: xy.y, members: [p] });
    });
    return clusters;
  }
  function addCluster(members) {
    const first = members[0];
    const el = document.createElement('div');
    el.className = 'mk-cluster';
    el.textContent = String(members.length);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', members.length + ' places here — zoom in');
    const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([first.coords.lng, first.coords.lat]).addTo(map);
    const zoomIn = (ev) => {
      if (ev) ev.stopPropagation();
      const pts = members.map((p) => [p.coords.lng, p.coords.lat]);
      try {
        const b = new maplibregl.LngLatBounds(pts[0], pts[0]);
        pts.forEach((q) => b.extend(q));
        map.fitBounds(b, { padding: 60, maxZoom: 16, duration: 500 });
      } catch { map.flyTo({ center: [first.coords.lng, first.coords.lat], zoom: Math.min(16, map.getZoom() + 2), duration: 500 }); }
    };
    el.addEventListener('click', zoomIn);
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') zoomIn(ev); });
    markers.push(m);
  }
  function drawMarkers(list) {
    markers.forEach((m) => { try { m.remove(); } catch { /* noop */ } });
    markers = [];
    // Cluster only when asked (the Places living map) and only while zoomed out enough that pins
    // would overlap; past clusterMaxZoom every place shows as its own numbered pin.
    if (opts.cluster && map.getZoom() < (opts.clusterMaxZoom || 11)) {
      clusterByPixels(list).forEach((c) => { if (c.members.length > 1) addCluster(c.members); else addSingle(c.members[0]); });
    } else {
      (list || []).forEach((p) => addSingle(p));
    }
  }
  function setPlaces(list) { lastList = list || []; drawMarkers(lastList); fit(lastList); }
  function setColorMode(mode) { colorMode = mode === 'category' ? 'category' : 'rating'; drawMarkers(lastList); }

  // Draw the initial markers once the map settles. 'idle' is more reliable than 'load' for the
  // glyph-free offline style embedded here (which can finish rendering without ever firing
  // 'load'); it fires after the first render settle. Guarded to run once, and setPlaces is
  // idempotent, so a later 'load' just redraws the same pins.
  let drewInitial = false;
  const drawInitial = () => { if (drewInitial) return; drewInitial = true; setPlaces(opts.places); };
  map.on('load', drawInitial);
  map.on('idle', drawInitial);
  // 'render' fires on the first painted frame even when a raster source (e.g. the hidden
  // satellite layer) never finishes loading, so neither 'load' nor 'idle' ever fires. This is
  // the reliable trigger for the embedded offline map; guarded to run once.
  map.on('render', drawInitial);

  // When clustering is on, re-run the split after the view settles so cluster counts and the
  // pin/cluster boundary always match the current zoom. drawMarkers does not call fit(), so a
  // fitBounds/flyTo → moveend → drawMarkers pass simply re-draws; it never loops.
  if (opts.cluster) {
    map.on('zoomend', () => drawMarkers(lastList));
    map.on('moveend', () => drawMarkers(lastList));
  }

  // Keep the canvas matched to its container. The map is often created while its <details>/card
  // is still settling its real size (or is briefly off-screen), leaving a zero-size viewport
  // where map.project() cannot position markers and no tiles are requested — the "map does not
  // render" bug. A one-shot timer race is unreliable; a ResizeObserver fires exactly when the box
  // gains or changes size, so we resize + redraw precisely then. The first real size also frames
  // the pins (setPlaces); later resizes only redraw so they never fight a user's pan/zoom.
  let roFitted = false;
  if (typeof ResizeObserver !== 'undefined') {
    // Resize synchronously in the callback (no requestAnimationFrame, which is paused while the
    // tab is hidden). map.resize() only re-sizes the inner canvas to the container, which never
    // changes the observed container's own box, so this cannot trigger an observer loop.
    ro = new ResizeObserver(() => {
      const r = containerEl.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;   // still collapsed — wait for a real size
      try {
        map.resize();
        if (!roFitted) { roFitted = true; setPlaces(lastList); }   // first real size: draw + frame
        else drawMarkers(lastList);                                // later resizes: redraw only
      } catch { /* noop */ }
    });
    try { ro.observe(containerEl); } catch { /* noop */ }
  }

  // Highlight one marker by its place id (an outline ring — see .mk-pin-selected in
  // style.css), clearing any previous highlight first. Looked up via the data-place-id set
  // in addSingle rather than kept as its own marker list, so this keeps working regardless
  // of how the pins were last drawn. Pass null to clear.
  function setSelected(id) {
    containerEl.querySelectorAll('.mk-pin-selected').forEach((el) => el.classList.remove('mk-pin-selected'));
    if (id == null) return;
    let sel; try { sel = `[data-place-id="${CSS.escape(String(id))}"]`; } catch { return; }
    const el = containerEl.querySelector(sel);
    if (el) el.classList.add('mk-pin-selected');
  }
  embedApi = { setPlaces, setColorMode, setSelected };

  return {
    map,
    setSatellite,
    onLocate,
    triggerLocate,
    locate: triggerLocate,   // alias — embed mode's original name for the same action
    // ---- Shared, mode-independent methods (see the SHARED block above) -----------
    flyTo: (lng, lat, z = 11) => map.flyTo({ center: [lng, lat], zoom: z }),
    setBorders: (on) => { if (map.getLayer('borders')) map.setLayoutProperty('borders', 'visibility', on ? 'visible' : 'none'); },
    // Toggle the hospitals layer; lazily loads+merges all four countries' data on first "on".
    setHospitals,
    setAtms,
    // Outdoor layers: hiking trails, bike paths, and viewpoints/waterfalls.
    setTrails,
    setBike,
    setScenic,
    // Draw or clear the offline walking route line (pass null/[] to clear).
    setWalkRoute,
    setBus,
    // My-stay home marker: set/move/clear live, and centre on it.
    setMyStay: (coords) => placeStayMarker(coords),
    goToStay: (coords, z = 15) => { if (coords) map.flyTo({ center: [coords.lng, coords.lat], zoom: z }); },
    // Draw / clear the "way back" guide line from `from` to `to` (pass nulls to clear).
    setWayback: (from, to) => setWayback(from, to),
    // Offline name search across cities, curated places, pools and the user's pins.
    search: (q) => searchIndex(q),
    // Fit the view to both points so the whole way-back line is visible.
    frameBoth: (a, b, pad = 64) => {
      if (!a || !b) return;
      try {
        const bounds = new maplibregl.LngLatBounds([a.lng, a.lat], [a.lng, a.lat]);
        bounds.extend([b.lng, b.lat]);
        map.fitBounds(bounds, { padding: pad, maxZoom: 16, duration: 600 });
      } catch { /* noop */ }
    },
    // Offline area download: the satellite tiles covering the current view.
    getDownloadTiles: (cap = 600) => tileUrlsForBounds(map.getBounds(), map.getZoom(), 2, cap),
    // Snapshot of the current view, recorded with a saved area so it can be sized,
    // re-shown and (tile-by-tile) deleted later.
    getViewInfo: () => {
      const b = map.getBounds(), c = map.getCenter();
      return { center: { lng: c.lng, lat: c.lat }, bounds: { w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }, zoom: map.getZoom() };
    },
    // Recompute a saved area's tile URLs (same params as the original save) so the
    // service worker can delete exactly that pack.
    tileUrlsForArea: (bounds, z, cap = 1000) =>
      tileUrlsForBounds({ getWest: () => bounds.w, getEast: () => bounds.e, getNorth: () => bounds.n, getSouth: () => bounds.s }, z, 2, cap),
    // Nearest known city to the current centre (for a default saved-area name), or null.
    nearestCityName: () => { const c = map.getCenter(); return nearestCity({ lng: c.lng, lat: c.lat }); },
    // Measure tool: toggle on with a callback (km, pointCount); off clears the line.
    toggleMeasure: (on, cb) => { measuring = on; measureCb = cb || null; if (!on) { measurePts = []; renderMeasure(); } },
    measureReset: () => { measurePts = []; renderMeasure(); },
    ...embedApi,
    // Tear down the map, its WebGL context, the GPS watcher and the ResizeObserver —
    // call when leaving the screen. Without this, each visit leaks a context and the
    // map dies after ~8-16, or the observer keeps firing against a removed container.
    dispose: () => {
      try { if (ro) ro.disconnect(); } catch { /* noop */ }
      try { map.remove(); } catch { /* already gone */ }
      if (window.__mkMap === map) { try { window.__mkMap = null; } catch { /* noop */ } }
    },
  };
}

export async function storageEstimate() {
  if (!navigator.storage || !navigator.storage.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usageMB: e.usage ? (e.usage / 1048576) : 0, quotaMB: e.quota ? (e.quota / 1048576) : 0 };
}

export async function clearTileCache() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('mk-tiles')).map((k) => caches.delete(k)));
}
