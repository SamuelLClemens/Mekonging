// Fixture listings for the shared Market (docs/EXCHANGE.md section 17, slice M4a): enough data to
// design the screens against in M4b without a real account. Like js/market-fixture.js, it is loaded
// only when fixtureAllowed() is true (127.0.0.1 or localhost, `?market=fixture`); a production
// host never loads it.
//
// WHAT IT HOLDS. 47 listings everyone can see, across the four kinds and 17 cities, with free, paid
// and no-price rows in five currencies, titles from 3 words to the 80-character limit, and titles
// in Thai, Vietnamese, Khmer and Lao. It also holds the rows that must never reach search: an
// ended listing, one whose owner is under review, the traveller's own closed listing and the
// traveller's own hidden one (those two show only under My listings).
//
// SEARCH is a port of public.market_search (supabase/migrations/002_listings.sql) so a screen sees
// the same rows, sorts and totals the server gives. The typo match is an approximation of pg_trgm:
// the same trigram idea, per word, at the same 0.6 threshold.
//
// THE GATE. Like the server, the fixture answers `market_closed` until the market is open. In the
// browser, `&open=1` opens it for everyone and `&tester=1` (the sign-in fixture's flag) lets the
// signed-in traveller in; the validator passes `open` directly.

const FIX_KEY = 'mk-market-fixture-listings';
const ME = 'me';

const pad = (n) => String(n).padStart(12, '0');
const idOf = (n) => '00000000-0000-4000-8000-' + pad(n);

export function regionToday(now = Date.now()) {
  return new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);   // UTC+7, as regionNow() is on the phone
}
function addDays(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- the rows ----------------------------------------------------------------------------------------
// Short keys keep the table readable: k kind, i intent, cat category, c city, to to_city, s and e
// the window as days from today, t title, b body, p price, u currency, n seats, r room_type,
// a activity, ago hours since posted, o owner (default 'x'), st status (default 'open').
const SEEDS = [
  // items (18)
  { k: 'item', i: 'sell', cat: 'carseat', c: 'th-bangkok', s: 0, e: 14, t: 'Britax child car seat, group 1, clean and safe', b: 'Used for one year in Bangkok. ISOFIX or belt. Pick up near BTS Ari.', p: 1800, u: 'THB', ago: 1 },
  { k: 'item', i: 'give', cat: 'stroller', c: 'th-chiang-mai', s: 1, e: 20, t: 'Free baby stroller, folds flat, one wheel squeaks', b: 'Take it before Sunday.', p: 0, ago: 2 },
  { k: 'item', i: 'sell', cat: 'bicycle', c: 'th-chiang-mai', s: 0, e: 10, t: 'City bicycle with basket and lock', b: 'Leaving town on Friday.', p: 2500, u: 'THB', ago: 4 },
  { k: 'item', i: 'sell', cat: 'camping', c: 'vi-hanoi', s: 0, e: 20, t: 'Two person tent and sleeping bags, used twice', b: 'Dry and clean. Includes the pegs.', p: 1200000, u: 'VND', ago: 6 },
  { k: 'item', i: 'sell', cat: 'clothing', c: 'th-phuket', s: 0, e: 12, t: 'Surf board shorts and rash vest, size M', b: '', p: 450, u: 'THB', ago: 7 },
  { k: 'item', i: 'trade', cat: 'books', c: 'la-vientiane', s: 0, e: 25, t: 'Trade paperbacks: thrillers for travel guides', b: 'About 15 books, English and French.', ago: 9 },
  { k: 'item', i: 'request', cat: 'toys', c: 'kh-siem-reap', s: 0, e: 14, t: 'Wanted: kids board games for a rainy week', b: '', ago: 11 },
  { k: 'item', i: 'give', cat: 'kids-clothing', c: 'vi-da-nang', s: 2, e: 16, t: 'Free kids clothes, ages 3 to 5', b: 'A bag of shirts and shorts.', p: 0, ago: 12 },
  { k: 'item', i: 'sell', cat: 'carrier', c: 'th-bangkok', s: 0, e: 9, t: 'Baby carrier, ergonomic, hardly used', b: '', p: 900, u: 'THB', ago: 14 },
  { k: 'item', i: 'sell', cat: 'camping', c: 'la-luang-prabang', s: 0, e: 14, t: 'Hammock and mosquito net set', b: '', p: 35, u: 'USD', ago: 16 },
  { k: 'item', i: 'give', cat: 'books', c: 'th-krabi', s: 0, e: 20, t: 'Free beach reads, take the whole box', b: '', p: 0, ago: 18 },
  { k: 'item', i: 'sell', cat: 'bicycle', c: 'kh-phnom-penh', s: 0, e: 14, t: 'Folding bike, 6 speed, new tyres', b: '', p: 90, u: 'USD', ago: 20 },
  { k: 'item', i: 'sell', cat: 'toys', c: 'vi-ho-chi-minh-city', s: 0, e: 21, t: 'Wooden train set with 60 pieces', b: '', p: 350000, u: 'VND', ago: 22 },
  { k: 'item', i: 'trade', cat: 'camping', c: 'th-pai', s: 0, e: 29, t: 'Gas stove for a headlamp', b: '', ago: 25 },
  { k: 'item', i: 'sell', cat: 'other', c: 'th-koh-phangan', s: 0, e: 7, t: 'Snorkel set and dry bag, adult size', b: '', p: 600, u: 'THB', ago: 27 },
  { k: 'item', i: 'sell', cat: 'clothing', c: 'vi-hoi-an', s: 0, e: 14, t: 'Tailored linen shirt, never worn, size L', b: '', p: 400000, u: 'VND', ago: 30 },
  { k: 'item', i: 'request', cat: 'carseat', c: 'th-chiang-mai', s: 0, e: 10, t: 'Looking for a rental car seat for two weeks in Chiang Mai, any brand, any age', b: '', ago: 33 },
  { k: 'item', i: 'sell', cat: 'books', c: 'vi-sapa', s: 0, e: 14, t: 'Trekking guidebooks, three titles and a map', b: '', p: 150000, u: 'VND', ago: 36 },
  // the traveller's own, still open
  { k: 'item', i: 'sell', cat: 'stroller', c: 'th-bangkok', s: 0, e: 20, t: 'My lightweight stroller, one owner', b: 'Moving on, so it needs a home.', p: 1500, u: 'THB', ago: 5, o: ME },
  { k: 'ride', i: 'offer', c: 'th-phuket', to: 'th-krabi', s: 2, e: 2, t: 'Car to Krabi, leaving 10am, two seats', b: '', p: 400, u: 'THB', n: 2, ago: 8, o: ME },
  // meetups (8)
  { k: 'meetup', i: 'join', c: 'th-bangkok', s: 1, e: 1, t: 'Street food walk in Yaowarat', b: 'Four of us, no rush.', a: 'food', n: 4, ago: 3 },
  { k: 'meetup', i: 'join', c: 'th-chiang-mai', s: 2, e: 2, t: 'Sunrise hike to Doi Suthep', b: '', a: 'outdoors', n: 6, ago: 10 },
  { k: 'meetup', i: 'join', c: 'vi-hanoi', s: 1, e: 3, t: 'Coffee and co-working morning', b: '', a: 'cowork', n: 5, ago: 13 },
  { k: 'meetup', i: 'join', c: 'kh-siem-reap', s: 3, e: 3, t: 'Angkor sunrise by tuk-tuk, share the cost', b: '', a: 'sights', n: 4, p: 10, u: 'USD', ago: 17 },
  { k: 'meetup', i: 'join', c: 'la-vang-vieng', s: 1, e: 2, t: 'Kayak the Nam Song, beginners welcome', b: '', a: 'sport', n: 6, ago: 21 },
  { k: 'meetup', i: 'join', c: 'vi-ho-chi-minh-city', s: 2, e: 2, t: 'Banh mi crawl in District 1', b: '', a: 'food', n: 4, ago: 24 },
  { k: 'meetup', i: 'join', c: 'th-krabi', s: 0, e: 6, t: 'Climbing at Railay, share a boat', b: '', a: 'sport', n: 4, p: 150, u: 'THB', ago: 28 },
  { k: 'meetup', i: 'join', c: 'la-luang-prabang', s: 1, e: 1, t: 'Alms morning, then Kuang Si falls', b: '', a: 'sights', n: 5, ago: 31 },
  // rooms (12)
  { k: 'room', i: 'offer', r: 'private', c: 'th-bangkok', s: 5, e: 34, t: 'Private room near BTS Ari, monthly', b: 'Quiet, air-con, fast wifi.', p: 9500, u: 'THB', ago: 15 },
  { k: 'room', i: 'offer', r: 'shared', c: 'vi-hanoi', s: 3, e: 32, t: 'Bed in a friendly 4-bed dorm, Old Quarter', b: '', p: 2500000, u: 'VND', ago: 19 },
  { k: 'room', i: 'offer', r: 'whole', c: 'th-chiang-mai', s: 0, e: 29, t: 'Whole studio in Nimman, two weeks minimum', b: '', p: 14000, u: 'THB', ago: 23 },
  { k: 'room', i: 'seek', r: 'private', c: 'kh-phnom-penh', s: 5, e: 34, t: 'Looking for a quiet room near the river', b: '', ago: 26 },
  { k: 'room', i: 'offer', r: 'private', c: 'la-vientiane', s: 1, e: 30, t: 'Room in a family guesthouse, breakfast included', b: '', p: 20, u: 'USD', ago: 29 },
  { k: 'room', i: 'seek', r: 'shared', c: 'th-phuket', s: 2, e: 31, t: 'Need a shared room near Kata or Karon', b: '', ago: 32 },
  { k: 'room', i: 'offer', r: 'private', c: 'vi-da-nang', s: 0, e: 29, t: 'Sea view room, five minutes to My Khe beach', b: '', p: 6000000, u: 'VND', ago: 35 },
  { k: 'room', i: 'offer', r: 'whole', c: 'kh-kampot', s: 7, e: 36, t: 'Riverside bungalow with a hammock on the deck', b: '', p: 25, u: 'USD', ago: 38 },
  { k: 'room', i: 'offer', r: 'private', c: 'th-koh-phangan', s: 0, e: 29, t: 'ห้องพักใกล้ทะเล เงียบสงบ', b: '', p: 8000, u: 'THB', ago: 40 },
  { k: 'room', i: 'seek', r: 'private', c: 'vi-hanoi', s: 4, e: 33, t: 'Phòng riêng gần hồ Hoàn Kiếm', b: '', ago: 41 },
  { k: 'room', i: 'offer', r: 'private', c: 'kh-siem-reap', s: 0, e: 29, t: 'បន្ទប់ជួលជិតផ្សារ', b: '', p: 150, u: 'USD', ago: 42 },
  { k: 'room', i: 'offer', r: 'shared', c: 'la-luang-prabang', s: 2, e: 31, t: 'ຫ້ອງພັກໃກ້ຕະຫຼາດ', b: '', p: 900000, u: 'LAK', ago: 43 },
  // rides (7)
  { k: 'ride', i: 'offer', c: 'th-chiang-mai', to: 'th-pai', s: 2, e: 2, t: 'Car to Pai, leaving 9am, two seats', b: 'Stops at the viewpoint.', p: 300, u: 'THB', n: 2, ago: 34 },
  { k: 'ride', i: 'seek', c: 'th-bangkok', to: 'th-krabi', s: 1, e: 2, t: 'Need a lift from Bangkok to Krabi', b: '', ago: 37 },
  { k: 'ride', i: 'offer', c: 'vi-hanoi', to: 'vi-sapa', s: 1, e: 1, t: 'Van to Sapa, three seats left', b: '', p: 200000, u: 'VND', n: 3, ago: 39 },
  { k: 'ride', i: 'offer', c: 'vi-da-nang', to: 'vi-hoi-an', s: 0, e: 0, t: 'Shared taxi to Hoi An this afternoon', b: '', p: 100000, u: 'VND', n: 3, ago: 44 },
  { k: 'ride', i: 'seek', c: 'kh-phnom-penh', to: 'kh-siem-reap', s: 2, e: 3, t: 'Looking for a seat to Siem Reap', b: '', ago: 45 },
  { k: 'ride', i: 'offer', c: 'la-vientiane', to: 'la-vang-vieng', s: 1, e: 1, t: 'Pickup to Vang Vieng, bags welcome', b: '', p: 150000, u: 'LAK', n: 2, ago: 46 },
  { k: 'ride', i: 'offer', c: 'kh-kampot', to: 'kh-phnom-penh', s: 3, e: 3, t: 'Driving to Phnom Penh, share the fuel', b: '', p: 8, u: 'USD', n: 3, ago: 47 },
  // the rows that must never reach search
  { k: 'item', i: 'sell', cat: 'books', c: 'th-bangkok', s: -6, e: -2, t: 'Ended: guidebooks, already collected', b: '', p: 200, u: 'THB', ago: 200 },
  { k: 'item', i: 'sell', cat: 'books', c: 'th-bangkok', s: 0, e: 10, t: 'Owner under review: textbooks', b: '', p: 200, u: 'THB', ago: 48, o: 'review' },
  { k: 'item', i: 'sell', cat: 'clothing', c: 'th-bangkok', s: 0, e: 10, t: 'My closed listing: rain jacket', b: 'Sold.', p: 300, u: 'THB', ago: 60, o: ME, st: 'closed' },
  { k: 'room', i: 'offer', r: 'private', c: 'th-bangkok', s: 0, e: 29, t: 'My hidden listing: room with a reported photo', b: '', p: 7000, u: 'THB', ago: 70, o: ME, st: 'hidden' },
];

const FIELDS = ['id', 'kind', 'intent', 'category', 'city', 'to_city', 'starts_on', 'ends_on', 'title', 'body', 'price_amount',
  'price_currency', 'seats', 'room_type', 'activity', 'have_currency', 'have_amount', 'want_currency', 'created_at'];

// The public row a seed becomes. `owner` is never part of it, as on the server.
function rowOf(seed, n, today, now) {
  const priced = typeof seed.p === 'number';
  return {
    id: idOf(n + 1), kind: seed.k, intent: seed.i, category: seed.cat || null, city: seed.c, to_city: seed.to || null,
    starts_on: addDays(today, seed.s), ends_on: addDays(today, seed.e), title: seed.t, body: seed.b || '',
    price_amount: priced ? seed.p : null, price_currency: priced && seed.p > 0 ? seed.u : null,
    seats: seed.n || null, room_type: seed.r || null, activity: seed.a || null,
    have_currency: null, have_amount: null, want_currency: null,
    created_at: new Date(now - seed.ago * 3600 * 1000).toISOString(),
  };
}

// The whole fixture, with the private columns the server keeps: `_owner` ('x', 'me' or 'review')
// and `_status`. Search and the listing call strip them; the validator reads them.
export function fixtureListings(now = Date.now()) {
  const today = regionToday(now);
  return SEEDS.map((s, n) => ({ ...rowOf(s, n, today, now), _owner: s.o || 'x', _status: s.st || 'open' }));
}

const visible = (l, today) => l._status === 'open' && l.ends_on >= today && l._owner !== 'review';
const publicRow = (l) => { const o = {}; for (const k of FIELDS) o[k] = l[k]; return o; };

// ---- search, a port of public.market_search --------------------------------------------------------
export function fold(s) {
  return String(s || '').normalize('NFKC').replace(/[\u00ad\u200b-\u200f\u2060\ufeff]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u0111\u0110]/g, 'd').toLowerCase();
}
const HAS_SCRIPT = /[\u0e00-\u0eff\u1780-\u17ff]/;
const wordsOf = (s) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function trigrams(word) {
  const s = '  ' + word + ' ';
  const out = new Set();
  for (let i = 0; i + 3 <= s.length; i++) out.add(s.slice(i, i + 3));
  return out;
}
function similar(word, textWords) {
  const a = trigrams(word);
  let best = 0;
  for (const w of textWords) {
    const b = trigrams(w);
    let common = 0;
    for (const t of a) if (b.has(t)) common++;
    best = Math.max(best, common / a.size);
  }
  return best;
}

function textMatches(l, q) {
  if (!q) return true;
  const hay = fold(l.title + ' ' + l.body);
  if (HAS_SCRIPT.test(q)) return hay.includes(q);
  const have = wordsOf(hay);
  return wordsOf(q).slice(0, 8).every((w) => have.some((h) => h.startsWith(w)) || (w.length >= 4 && similar(w, have) >= 0.6));
}

const ORDER = {
  newest: (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0),
};

// opts are the RPC's named parameters (see searchBody in js/market-listings.js). Throws
// { code } for the same cases the server raises.
export function fixtureSearch(opts = {}, ctx = {}) {
  const now = ctx.now || Date.now();
  const today = regionToday(now);
  if (!ctx.open) throw { code: 'market_closed', status: 400 };
  const sort = opts.sort || 'newest';
  if (!['newest', 'soonest', 'price_up', 'price_down'].includes(sort)) throw { code: 'sort_invalid', status: 400 };
  const page = opts.page === undefined || opts.page === null ? 0 : opts.page;
  if (page < 0 || page > 199) throw { code: 'page_invalid', status: 400 };
  if ((opts.price_min != null || opts.price_max != null) && !opts.currency) throw { code: 'currency_required', status: 400 };
  const size = Math.min(Math.max(opts.page_size == null ? 24 : opts.page_size, 1), 50);
  const q = fold(String(opts.q || '').trim()).slice(0, 100);
  const cur = opts.currency ? String(opts.currency).toUpperCase() : null;

  let rows = ctx.rows.filter((l) => visible(l, today)
    && (!opts.kind || l.kind === opts.kind)
    && (!opts.category || l.category === opts.category)
    && (!opts.city || l.city === opts.city)
    && (!opts.date_from || l.ends_on >= opts.date_from)
    && (!opts.date_to || l.starts_on <= opts.date_to)
    && (!opts.free_only || l.price_amount === 0)
    && ((opts.price_min == null && opts.price_max == null)
        || (l.price_amount !== null && (l.price_amount === 0 || l.price_currency === cur)
            && l.price_amount >= (opts.price_min == null ? 0 : opts.price_min)
            && (opts.price_max == null || l.price_amount <= opts.price_max)))
    && textMatches(l, q));

  const byPrice = (dir) => (a, b) => {
    const pa = a.price_amount, pb = b.price_amount;
    if (pa === null && pb === null) return ORDER.newest(a, b);
    if (pa === null) return 1;
    if (pb === null) return -1;
    return pa === pb ? ORDER.newest(a, b) : dir * (pa - pb);
  };
  const cmp = {
    newest: ORDER.newest,
    soonest: (a, b) => {
      const sa = a.starts_on > today ? a.starts_on : today, sb = b.starts_on > today ? b.starts_on : today;
      return sa < sb ? -1 : sa > sb ? 1 : a.ends_on < b.ends_on ? -1 : a.ends_on > b.ends_on ? 1 : ORDER.newest(a, b);
    },
    price_up: byPrice(1),
    price_down: byPrice(-1),
  }[sort];
  rows = rows.slice().sort(cmp);
  const total = rows.length;
  return rows.slice(page * size, page * size + size).map((l) => ({ ...publicRow(l), total }));
}

export function fixtureListing(id, ctx = {}) {
  const today = regionToday(ctx.now || Date.now());
  if (!ctx.open) throw { code: 'market_closed', status: 400 };
  const l = ctx.rows.find((x) => x.id === id);
  if (!l) return null;
  const mine = l._owner === ME;
  if (!(mine && l._status !== 'deleted') && !visible(l, today)) return null;
  return { ...publicRow(l), status: l._status, mine, member_since: mine ? today.slice(0, 7) : '2026-06' };
}

export function fixtureMine(ctx = {}) {
  return ctx.rows.filter((l) => l._owner === ME && l._status !== 'deleted')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((l) => ({ ...publicRow(l), status: l._status, updated_at: l.created_at }));
}

// ---- the calls market-listings.js makes, answered from the fixture -------------------------------
// Posts, closes and deletes live in sessionStorage, so they survive a reload and die with the tab.
function saved() {
  try { return JSON.parse(sessionStorage.getItem(FIX_KEY) || 'null') || { posted: [], status: {} }; } catch { return { posted: [], status: {} }; }
}
function keep(s) {
  try { sessionStorage.setItem(FIX_KEY, JSON.stringify(s)); } catch { /* fixture only */ }
}
function allRows(now) {
  const s = saved();
  return fixtureListings(now).concat(s.posted).map((l) => (s.status[l.id] ? { ...l, _status: s.status[l.id] } : l));
}
function gate() {
  const q = typeof location === 'undefined' ? '' : location.search || '';
  return /(?:^\?|&)(open|tester)=1(?:&|$)/.test(q);
}

// A few of the server's refusals, so the post form's error copy can be driven.
function checkPost(f, posted) {
  const title = String(f.title || '').trim();
  if (title.length < 3 || title.length > 80) return 'title_length';
  const text = title + ' ' + String(f.body || '');
  if (/\d[\d .()-]{6,}\d|@|https?:|www\./i.test(text)) return 'contact_details';
  if (/\b(weed|kush|ganja)\b/i.test(text)) return 'text_rejected';
  if (!f.city) return 'city_invalid';
  if (!f.starts_on || !f.ends_on) return 'dates_required';
  if (f.ends_on < f.starts_on) return 'window_order';
  if (posted >= 5) return 'rate_limited:post';
  return null;
}

export async function fixtureListingCall(path, method, body, ctx = {}) {
  await new Promise((r) => setTimeout(r, 200));
  const open = gate();
  const rows = allRows(Date.now());
  const fail = (code, status) => { throw { code, status: status || 400 }; };
  if (path === '/rest/v1/rpc/market_search') return fixtureSearch(body || {}, { open, rows });
  if (path === '/rest/v1/rpc/market_listing') return fixtureListing(body && body.listing_id, { open, rows });
  if (!ctx.signedIn) fail('signed_out', 401);
  if (path === '/rest/v1/rpc/market_my_listings') return fixtureMine({ rows });
  const s = saved();
  if (method === 'POST' && path.startsWith('/rest/v1/listings')) {
    const err = checkPost(body || {}, s.posted.length);
    if (err) fail(err);
    const now = Date.now();
    const f = body || {};
    const row = {
      id: f.id || idOf(1000 + s.posted.length), kind: f.kind, intent: f.intent, category: f.category || null, city: f.city,
      to_city: f.to_city || null, starts_on: f.starts_on, ends_on: f.ends_on, title: String(f.title).trim(), body: String(f.body || '').trim(),
      price_amount: f.price_amount == null ? (f.intent === 'give' ? 0 : null) : f.price_amount,
      price_currency: f.price_amount > 0 ? f.price_currency || null : null, seats: f.seats || null, room_type: f.room_type || null,
      activity: f.activity || null, have_currency: null, have_amount: null, want_currency: null,
      created_at: new Date(now).toISOString(), _owner: ME, _status: 'open',
    };
    s.posted.push(row);
    keep(s);
    return null;   // return=minimal, as the real insert answers; the caller reads the row back
  }
  if (method === 'PATCH' && path.startsWith('/rest/v1/listings')) {
    const m = /id=eq\.([0-9a-f-]{36})/.exec(path);
    const l = m && rows.find((x) => x.id === m[1]);
    if (!l || l._owner !== ME || !['open', 'closed'].includes(l._status)) return [];
    if (!['closed', 'deleted'].includes(body && body.status)) fail('status_invalid');
    s.status[l.id] = body.status;
    keep(s);
    return [{ id: l.id, status: body.status }];
  }
  if (method === 'POST' && path === '/rest/v1/reports') {
    const l = rows.find((x) => x.id === (body && body.listing_id));
    if (!l || !visible(l, regionToday())) fail('report_target_invalid');
    if (l._owner === ME) fail('own_listing');
    if (body.reason === 'filter') fail('report_reason_invalid');
    return null;
  }
  return fail('failed', 404);
}
