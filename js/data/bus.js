// Bus stop layer loader. Thailand's data (build_bus_th.py, from a real GTFS feed) carries a
// `routes` string per stop ("8, 25, 159"); Vietnam/Cambodia/Laos (build_bus_osm.py, from
// OpenStreetMap `highway=bus_stop`) do not — see that script's own comment for why the join
// isn't available there. Both shapes are normalised to the same {lat, lng, name, routes}
// object here so the map layer never needs to know which country sourced which way.
//
// `pq` (Phu Quoc island) is keyed separately from `vi` rather than merged into it because it
// is sourced differently: OSM carries real bus route relations there, so 92 of its 107 stops
// DO name the VinBus routes calling at them — the only place outside Bangkok in this region
// where that join exists. Merging it into bus.vi.js would bury that behind Hanoi's blanket
// "no route numbers" note and force the whole island to load with the mainland file.
const LOADERS = {
  th: () => import('./bus.th.js').then((m) => m.BUS_STOPS_TH.map(([lat, lng, name, routes]) => ({ lat, lng, name, routes }))),
  vi: () => import('./bus.vi.js').then((m) => m.BUS_STOPS_VI.map(([lat, lng, name]) => ({ lat, lng, name, routes: '' }))),
  pq: () => import('./bus.pq.js').then((m) => m.BUS_STOPS_PQ.map(([lat, lng, name, routes]) => ({ lat, lng, name, routes }))),
  kh: () => import('./bus.kh.js').then((m) => m.BUS_STOPS_KH.map(([lat, lng, name]) => ({ lat, lng, name, routes: '' }))),
  la: () => import('./bus.la.js').then((m) => m.BUS_STOPS_LA.map(([lat, lng, name]) => ({ lat, lng, name, routes: '' }))),
};
const ROWS = {};
const INFLIGHT = {};

export function loadBusStops(cc) {
  if (ROWS[cc]) return Promise.resolve(ROWS[cc]);
  if (INFLIGHT[cc]) return INFLIGHT[cc];
  const loader = LOADERS[cc];
  if (!loader) return Promise.resolve([]);
  INFLIGHT[cc] = loader()
    .then((rows) => { ROWS[cc] = rows || []; return ROWS[cc]; })
    .catch((err) => { delete INFLIGHT[cc]; throw err; });
  return INFLIGHT[cc];
}

export const BUS_COUNTRIES = ['th', 'vi', 'pq', 'kh', 'la'];
