// Loader for the outdoor map layers: hiking trails, bike paths, and the scenic points
// (viewpoints and waterfalls) they usually lead to.
//
// Same shape as js/data/bus.js — a per-country dynamic import behind a cached promise — and
// for the same reason: these are the largest generated files in the project after the bus and
// walking-graph data, and nothing here should ever reach a traveller who has not switched the
// layer on. See scripts/build_outdoor_layers.py for sourcing, the name/tag quality gates, and
// why the geometry is simplified to 4 m.
//
// Rows:
//   trails  [name, [[lat, lng], ...]]           one polyline per segment
//   scenic  [lat, lng, name, kind]              kind 'v' = viewpoint, 'w' = waterfall

const TRAIL_LOADERS = {
  th: () => import('./trails.th.js').then((m) => [m.TRAILS_HIKE_TH, m.TRAILS_BIKE_TH]),
  vi: () => import('./trails.vi.js').then((m) => [m.TRAILS_HIKE_VI, m.TRAILS_BIKE_VI]),
  kh: () => import('./trails.kh.js').then((m) => [m.TRAILS_HIKE_KH, m.TRAILS_BIKE_KH]),
  la: () => import('./trails.la.js').then((m) => [m.TRAILS_HIKE_LA, m.TRAILS_BIKE_LA]),
};

const SCENIC_LOADERS = {
  th: () => import('./scenic.th.js').then((m) => m.SCENIC_TH),
  vi: () => import('./scenic.vi.js').then((m) => m.SCENIC_VI),
  kh: () => import('./scenic.kh.js').then((m) => m.SCENIC_KH),
  la: () => import('./scenic.la.js').then((m) => m.SCENIC_LA),
};

export const OUTDOOR_COUNTRIES = ['th', 'vi', 'kh', 'la'];

// Country extents as [west, south, east, north]. Unlike the bus datasets — which cover a few
// square kilometres each and are measured from the data — these really are country-wide, so
// the country box is the honest bound. The map layer uses them to avoid pulling Thailand's
// file for somebody looking at Laos.
export const OUTDOOR_BBOX = {
  th: [97.34, 5.61, 105.64, 20.47],
  vi: [102.14, 8.18, 109.46, 23.39],
  kh: [102.33, 10.41, 107.63, 14.69],
  la: [100.08, 13.91, 107.70, 22.51],
};

// Source lines shown in the layer's own popup/legend, so a traveller can tell what this is
// and — more to the point — what it is not.
export const TRAILS_SOURCE = 'OpenStreetMap contributors (ODbL). Named paths, tracks and hiking '
  + 'routes; cycleways and bicycle-designated ways. Unnamed footpaths are not included.';
export const SCENIC_SOURCE = 'OpenStreetMap contributors (ODbL). Viewpoints and waterfalls.';

const cache = {};
const inflight = {};

function once(kind, cc, loader) {
  const key = `${kind}:${cc}`;
  if (cache[key]) return Promise.resolve(cache[key]);
  if (inflight[key]) return inflight[key];
  const fn = loader[cc];
  if (!fn) return Promise.resolve(null);
  inflight[key] = fn()
    .then((rows) => { cache[key] = rows; return rows; })
    .catch((err) => { delete inflight[key]; throw err; });
  return inflight[key];
}

// Resolves to [hikeRows, bikeRows]; [[], []] for a country with no file yet.
export function loadTrails(cc) {
  return once('trails', cc, TRAIL_LOADERS).then((v) => v || [[], []]);
}

export function loadScenic(cc) {
  return once('scenic', cc, SCENIC_LOADERS).then((v) => v || []);
}
