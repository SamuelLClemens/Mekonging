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

// Networks whose routes are drawn as coloured lines, and whose stops inherit those colours.
// Only Phu Quoc qualifies: four route numbers read as four distinct colours, whereas Bangkok's
// 708 drawn together would be an unreadable tangle — the same judgement that made this a
// stops-first layer rather than a route-lines layer in the first place.
const ROUTE_LOADERS = {
  pq: () => import('./bus.pq.js').then((m) => m.BUS_ROUTES_PQ),
};

export const BUS_ROUTE_NETWORKS = Object.keys(ROUTE_LOADERS);

export function loadBusRoutes(cc) {
  const loader = ROUTE_LOADERS[cc];
  if (!loader) return Promise.resolve([]);
  return loader().catch(() => []);
}

// What a ride actually costs, per network. Checked 2026-09-20; sources in the comments below.
//
// Every entry is a RANGE or a rule, never a single invented number, because none of these
// networks charges one flat price for every trip — and a precise-looking fare that is wrong
// costs a traveller more trust than a range that is honest. FARES_CHECKED is surfaced in the
// popup for the same reason: bus fares move, and the traveller should see how fresh this is.
export const FARES_CHECKED = '2026-09-20';

const FARES = {
  // bmta.co.th + Thai transit guides: non-aircon 8 THB flat (9.5 THB 23:00-05:00), aircon
  // 11-32 THB by distance, +2 THB if the route uses an expressway, +10 THB to/from Suvarnabhumi.
  th: { text: 'Non-aircon 8 ฿ flat (9.5 ฿ late night). Aircon 11–32 ฿ by distance. Add 2 ฿ on expressway routes, 10 ฿ to or from Suvarnabhumi. Pay the conductor on board.' },

  // Hanoi suspended fares for journeys STARTING inside Ring Road 1, from 2026-07-01 to
  // 2027-06-30. Every Hanoi stop in this dataset is inside that ring (the file is Old Quarter
  // and French Quarter only), so the exemption covers all of them — but it expires, so it is
  // encoded as a date the code checks rather than written into the text, where it would
  // quietly become a lie on 1 July 2027. After it lapses the distance formula below applies.
  vi: {
    freeUntil: '2027-06-30',
    freeText: 'Free until 30 June 2027 — Hanoi has suspended fares for journeys starting inside Ring Road 1, which covers every stop shown here.',
    text: 'From 3,000 ₫, rising about 450 ₫ per kilometre. Pay cash on board.',
  },

  // VinBus began charging on Phu Quoc on 2026-01-01; it was free before that, so any guide
  // written earlier says "free" and is now wrong. Zone-based, cash to the driver.
  pq: { text: '20,000 ₫ within one zone or to the next. 50,000 ₫ across non-neighbouring zones. 10,000 ₫ for students. Cash to the driver — name your destination as you board.' },

  // Phnom Penh City Bus: a genuine flat fare, the only one of the five.
  kh: { text: '1,500 riel flat, any distance, any route.' },

  // Vientiane has no single fare: it is set per route (about 4,000 kip to the Southern
  // terminal, 8,000 to the Friendship Bridge), with a 10,000 kip flat trial on three electric
  // routes in 2026. Quoted as a range rather than picking one route's price to stand for all.
  la: { text: 'Roughly 4,000–10,000 kip depending on the route. Pay on board.' },
};

// The fare line for a network, honouring any dated free period. `now` is injectable so the
// expiry is testable without waiting a year for it.
export function fareFor(cc, now = new Date()) {
  const f = FARES[cc];
  if (!f) return '';
  if (f.freeUntil && now <= new Date(f.freeUntil + 'T23:59:59')) return f.freeText;
  return f.text;
}
