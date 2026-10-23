// The shared Market's listing calls: search, one listing, my listings, post, close or delete, and
// report (docs/EXCHANGE.md sections 3, 4 and 17, slice M4a). No DOM here; the screens arrive with M4b.
//
// WHY A NEW FILE. js/market-api.js stays as it is: an open app keeps the old copy of an eager
// module after a deploy, and a new export imported by a lazy module that loads later spins forever
// (CLAUDE.md, Versioning). So this module imports only names market-api.js already exports
// (marketSession, marketMe, MarketError, fixtureMode, marketErrorText) and keeps its own small
// transport. It never refreshes a token itself: when the session is near its end it calls
// marketMe(), whose transport refreshes (one flight at a time) and stores the new tokens, then
// re-reads the session. Two refreshers racing would spend one rotating refresh token twice.
//
// VISITORS. Search and a single listing work without an account, once the market is open
// (owner ruling 2026-10-19). With a session the token is sent, so the server can leave out the
// listings of people the caller blocked. Posting, reporting and My listings need a session.
//
// COLUMNS. Always send an explicit column list (LISTING_COLUMNS) on a read: `select=*` asks for
// `owner`, which no role may read, and fails with "permission denied".
//
// POSTING. A post never asks the server to return the row it inserts: the row-level rules cannot
// see a new row yet, so INSERT ... RETURNING is refused. postListing picks the id itself (a uuid),
// inserts with `Prefer: return=minimal`, then reads the row back with getListing(id).
//
// TEXT. Everything in a listing is another traveller's text. Render it with textContent only.

import { SUPABASE_URL, SUPABASE_KEY } from './market-config.js';
import { MarketError, marketSession, marketMe, fixtureMode, marketErrorText } from './market-api.js';

export const KINDS = ['item', 'meetup', 'room', 'ride'];   // 'cash' stays off until legal clears it (section 14)
export const ITEM_CATEGORIES = ['carseat', 'stroller', 'carrier', 'toys', 'kids-clothing', 'bicycle', 'camping', 'clothing', 'books', 'other'];
export const ACTIVITIES = ['food', 'sights', 'outdoors', 'cowork', 'sport', 'other'];
export const ROOM_TYPES = ['private', 'shared', 'whole'];
export const CURRENCIES = ['THB', 'VND', 'KHR', 'LAK', 'USD'];
export const SORTS = ['newest', 'soonest', 'price_up', 'price_down'];
export const REPORT_REASONS = ['scam', 'drugs', 'unsafe', 'harassment', 'spam', 'minor', 'other'];
export const MAX_PAGE_SIZE = 50;
export const MAX_PAGE = 199;

// The columns a listing row carries (the server's private.listing_json plus status and updated_at).
export const LISTING_COLUMNS = [
  'id', 'kind', 'intent', 'category', 'city', 'to_city', 'starts_on', 'ends_on', 'title', 'body', 'price_amount',
  'price_currency', 'seats', 'room_type', 'activity', 'have_currency', 'have_amount', 'want_currency', 'status',
  'created_at', 'updated_at',
].join(',');

// What a client may write when posting; anything else is dropped before it leaves the phone.
const INSERT_FIELDS = [
  'kind', 'intent', 'category', 'city', 'to_city', 'starts_on', 'ends_on', 'title', 'body', 'price_amount',
  'price_currency', 'seats', 'room_type', 'activity', 'have_currency', 'have_amount', 'want_currency',
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const isListingId = (id) => typeof id === 'string' && UUID.test(id);

// A fresh listing id. The id is not a secret (nothing of the owner can be read from it), so a
// platform without crypto falls back to Math.random.
export function newListingId() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

// ---- plain copy for every server code (sections 8 and 9) -------------------------------------------
const COPY = {
  market_closed: 'The shared market is in closed beta. It opens to everyone later.',
  not_member: 'Join the shared market first.',
  signed_out: 'You are signed out. Sign in again.',
  cash_closed: 'Cash swap is not open yet.',
  account_too_new: 'New accounts can post items first. Meetups, rooms and rides open after 24 hours.',
  city_invalid: 'Pick a city from the list.',
  to_city_invalid: 'Pick a destination that differs from the start.',
  kind_intent: 'Those options do not go together. Start the post again.',
  kind_fields: 'Those options do not go together. Start the post again.',
  category_invalid: 'Pick a category.',
  activity_invalid: 'Pick an activity.',
  room_type_invalid: 'Pick a room type.',
  seats_invalid: 'Check the seats or the group size.',
  price_invalid: 'Check the price. A sale needs one and a gift is free.',
  currency_invalid: 'Pick a currency.',
  dates_required: 'Pick the dates.',
  window_order: 'The end date comes before the start date.',
  window_past: 'That window has already ended.',
  window_too_long: 'That window is too long for this kind of post.',
  starts_too_late: 'A post can start up to 90 days from today.',
  title_length: 'Use 3 to 80 characters for the title.',
  title_invalid: 'Remove the odd characters from the title.',
  body_length: 'Keep the details to 400 characters.',
  body_invalid: 'Remove the odd characters from the details.',
  text_rejected: 'This breaks the market rules.',
  contact_details: 'Keep contact details for messages.',
  status_invalid: 'That change is not allowed.',
  not_owner: 'That change is not allowed.',
  gone: 'That listing is no longer there.',
  'rate_limited:post': 'You have posted enough for today. Try again tomorrow.',
  'rate_limited:open': 'You have the most open posts allowed. Close one first.',
  'rate_limited:same_title': 'You posted that title in the last day.',
  'rate_limited:report': 'You have reported enough for today.',
  'rate_limited:name': 'You can change your name 3 times a day.',
  report_reason_invalid: 'That cannot be reported.',
  report_target_invalid: 'That listing can no longer be reported.',
  own_listing: 'You cannot report your own listing.',
  already_reported: 'You already reported this.',
  note_length: 'Keep the note to 300 characters.',
  sort_invalid: 'Check the search filters.',
  page_invalid: 'Check the search filters.',
  currency_required: 'Pick a currency for the price range.',
};

// Codes the database raises on purpose (supabase/migrations/002_listings.sql), and the check
// constraints that can fire after the triggers.
const RAISED = new Set(Object.keys(COPY));
const CONSTRAINT_CODE = {
  listings_category: 'category_invalid', listings_title_length: 'title_length', listings_body_length: 'body_length',
  listings_seats: 'seats_invalid', listings_price_amount: 'price_invalid', reports_note_length: 'note_length',
};

// Pure, so the validator can run it. `data` is the parsed PostgREST error body, if any.
export function listingErrorCode(status, data, signedIn) {
  const msg = String((data && (data.message || data.msg)) || '');
  if (RAISED.has(msg)) return msg;
  if (msg === 'not_signed_in') return 'signed_out';
  if (data && data.code === '22003') return 'price_invalid';   // numeric field overflow: a price of a trillion
  for (const name of Object.keys(CONSTRAINT_CODE)) if (msg.includes('"' + name + '"')) return CONSTRAINT_CODE[name];
  if (data && data.code === '23505' && /reports_once_per_listing/.test(msg)) return 'already_reported';
  if (status === 401 || (status === 403 && !signedIn)) return signedIn ? 'expired' : 'signed_out';
  if (status >= 500) return 'server';
  return 'failed';
}

export function listingErrorText(err) {
  const code = err && err.code;
  return COPY[code] || marketErrorText(err);
}

// ---- the request bodies (pure) -------------------------------------------------------------------------
const clean = (v) => v !== undefined && v !== null && v !== '';

// Search options (camel case) to the RPC's named parameters. Unknown keys are dropped, and the
// page and size are clamped the way the server clamps them, so a screen never sees page_invalid.
export function searchBody(opts = {}) {
  const o = {};
  const put = (k, v) => { if (clean(v)) o[k] = v; };
  put('q', typeof opts.q === 'string' ? opts.q.trim().slice(0, 100) : '');
  if (KINDS.includes(opts.kind)) o.kind = opts.kind;
  if (ITEM_CATEGORIES.includes(opts.category)) o.category = opts.category;
  put('city', typeof opts.city === 'string' && /^(th|vi|kh|la)-[a-z0-9-]+$/.test(opts.city) ? opts.city : '');
  put('date_from', DAY.test(opts.dateFrom || '') ? opts.dateFrom : '');
  put('date_to', DAY.test(opts.dateTo || '') ? opts.dateTo : '');
  const num = (v) => (clean(v) && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);
  const lo = num(opts.priceMin), hi = num(opts.priceMax);
  if (lo !== null) o.price_min = lo;
  if (hi !== null) o.price_max = hi;
  if ((lo !== null || hi !== null) && CURRENCIES.includes(opts.currency)) o.currency = opts.currency;
  else if (lo !== null || hi !== null) { delete o.price_min; delete o.price_max; }   // a range needs its currency
  if (opts.freeOnly === true) o.free_only = true;
  o.sort = SORTS.includes(opts.sort) ? opts.sort : 'newest';
  o.page = Math.min(MAX_PAGE, Math.max(0, Math.floor(Number(opts.page) || 0)));
  o.page_size = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(opts.pageSize) || 24)));
  return o;
}

// A post's fields, picked from the allowed list. Empty strings and undefined become null so
// PostgREST sends no column the form did not fill.
export function insertBody(fields = {}) {
  const o = {};
  for (const k of INSERT_FIELDS) if (clean(fields[k])) o[k] = fields[k];
  return o;
}

// ---- transport -----------------------------------------------------------------------------------------
async function freshToken() {
  let s = marketSession();
  if (!s) return null;
  if (s.expires_at - Date.now() / 1000 > 60) return s.access_token;
  try { await marketMe(); } catch { /* signed out or offline: use what the session still holds */ }
  s = marketSession();
  return s ? s.access_token : null;
}

async function send(path, { method = 'POST', body, token, prefer } = {}) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new MarketError('offline');
  const headers = { apikey: SUPABASE_KEY };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  if (prefer) headers.Prefer = prefer;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), 20000) : 0;
  let res;
  try {
    res = await fetch(SUPABASE_URL + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl ? ctl.signal : undefined, credentials: 'omit', cache: 'no-store',
    });
  } catch {
    throw new MarketError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'network');
  } finally {
    if (timer) clearTimeout(timer);
  }
  let data = null;
  try { const text = await res.text(); data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) throw new MarketError(listingErrorCode(res.status, data, !!token), res.status);
  return data;
}

// One call, as a visitor (`auth: false`), as whoever is signed in if anyone is (`auth: 'maybe'`),
// or as a signed-in traveller (`auth: true`, which refuses to run signed out).
async function call(path, opts = {}, auth = 'maybe') {
  if (fixtureMode()) {
    const { fixtureListingCall } = await import('./market-fixture-listings.js');
    try { return await fixtureListingCall(path, opts.method || 'POST', opts.body, { signedIn: !!marketSession() }); }
    catch (e) { throw e instanceof MarketError ? e : new MarketError((e && e.code) || 'failed', e && e.status); }
  }
  let token = auth === false ? null : await freshToken();
  if (auth === true && !token) throw new MarketError('signed_out');
  try {
    return await send(path, { ...opts, token });
  } catch (e) {
    if (e.code !== 'expired' || !token) throw e;
    try { await marketMe(); } catch { throw new MarketError('signed_out'); }
    const s = marketSession();
    if (!s) throw new MarketError('signed_out');
    return send(path, { ...opts, token: s.access_token });
  }
}

// ---- calls ---------------------------------------------------------------------------------------------
// Search. Returns { rows, total }: `total` is every match, not just this page, and is 0 when the
// page is past the end (an empty page carries no rows to read it from).
export async function searchListings(opts = {}) {
  const data = await call('/rest/v1/rpc/market_search', { body: searchBody(opts) });
  const rows = Array.isArray(data) ? data : [];
  const total = rows.length ? Number(rows[0].total) || rows.length : 0;
  return { rows: rows.map(({ total: _t, ...row }) => row), total };
}

// One listing for its page: the row, or null when nothing is visible at that id.
export async function getListing(id) {
  if (!isListingId(id)) return null;
  const row = await call('/rest/v1/rpc/market_listing', { body: { listing_id: id } });
  return row || null;
}

// The caller's own listings in any status but deleted, newest first.
export async function myListings() {
  const rows = await call('/rest/v1/rpc/market_my_listings', { body: {} }, true);
  return Array.isArray(rows) ? rows : [];
}

// Post a listing. Resolves to the stored row (no owner, with status and mine). Rejects with a
// MarketError whose code is a key of COPY: print listingErrorText(err), never a server message.
export async function postListing(fields) {
  const id = newListingId();
  await call('/rest/v1/listings', { body: { ...insertBody(fields), id }, prefer: 'return=minimal' }, true);
  const row = await getListing(id);
  if (!row) throw new MarketError('failed');
  return row;
}

async function setStatus(id, status) {
  if (!isListingId(id)) throw new MarketError('gone');
  const rows = await call('/rest/v1/listings?id=eq.' + id + '&select=id,status',
    { method: 'PATCH', body: { status }, prefer: 'return=representation' }, true);
  // Row-level security turns "not yours, or no longer open" into an empty answer, not an error.
  if (!Array.isArray(rows) || !rows.length) throw new MarketError('gone');
  return rows[0];
}
export const closeListing = (id) => setStatus(id, 'closed');
export const deleteListing = (id) => setStatus(id, 'deleted');

// Report a listing. `note` is optional, up to 300 characters.
export async function reportListing(id, reason, note) {
  if (!isListingId(id)) throw new MarketError('report_target_invalid');
  if (!REPORT_REASONS.includes(reason)) throw new MarketError('report_reason_invalid');
  const body = { listing_id: id, reason };
  if (clean(note)) body.note = String(note).slice(0, 300);
  await call('/rest/v1/reports', { body, prefer: 'return=minimal' }, true);
}
