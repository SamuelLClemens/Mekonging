// Bus stop layer loader. Thailand's data (build_bus_th.py, from a real GTFS feed) carries a
// `routes` string per stop ("8, 25, 159"); Vietnam/Cambodia/Laos (build_bus_osm.py, from
// OpenStreetMap `highway=bus_stop`) do not — see that script's own comment for why the join
// isn't available there. Both shapes are normalised to the same {lat, lng, name, routes}
// object here so the map layer never needs to know which country sourced which way.
const LOADERS = {
  th: () => import('./bus.th.js').then((m) => m.BUS_STOPS_TH.map(([lat, lng, name, routes]) => ({ lat, lng, name, routes }))),
  vi: () => import('./bus.vi.js').then((m) => m.BUS_STOPS_VI.map(([lat, lng, name]) => ({ lat, lng, name, routes: '' }))),
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

export const BUS_COUNTRIES = ['th', 'vi', 'kh', 'la'];
