// Backendless user-to-user sharing ("Travel circle"). Everything travels INSIDE a
// shareable payload — a link or the OS share sheet — so there is NO server, NO
// account, and NO personal data stored anywhere off this device. A payload is
// compact JSON, URL-safe base64-encoded, and carried in the URL hash so the
// recipient's app can import it fully offline (e.g. AirDrop / Nearby Share).
//
// SECURITY: anything decoded here arrived from another user and is UNTRUSTED.
// Callers MUST render decoded fields as text (h() text children / createTextNode),
// never via innerHTML. This module also clamps every field's length and strips
// ids to a safe character set.

const PV = 1;                         // payload format version
export const MAX_PAYLOAD_URL = 8000;  // keep shared links within safe URL limits

// --- UTF-8-safe URL base64 ---------------------------------------------------
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s) {
  let t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// --- payload envelope --------------------------------------------------------
export function encodePayload(type, data) {
  return b64urlEncode(JSON.stringify({ v: PV, t: type, d: data }));
}
export function decodePayload(str) {
  let obj;
  try { obj = JSON.parse(b64urlDecode(str)); } catch { return null; }
  if (!obj || typeof obj !== 'object' || obj.v !== PV || typeof obj.t !== 'string') return null;
  return obj;
}

// Build the full shareable URL for a route + payload (works from any host/path).
export function shareUrl(route, payloadStr) {
  const base = (typeof location !== 'undefined') ? location.origin + location.pathname : '';
  return `${base}#${route}-${payloadStr}`;
}

// --- sanitisers (imported data is UNTRUSTED) ---------------------------------
function clean(s, max) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, max); }
function cleanId(s) {
  const id = String(s == null ? '' : s).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  // Reject reserved object keys: ids key plain objects (threads, boards), so a
  // crafted '__proto__' id would otherwise hit the prototype instead of a key.
  return ['__proto__', 'constructor', 'prototype'].includes(id) ? '' : id;
}
function cleanEmoji(s) { return Array.from(String(s || '')).slice(0, 2).join('') || '🧭'; }
// A currency code: letters only, upper-cased, 2–4 chars (ISO codes are 3, but stay lenient).
function cleanCur(s) { return String(s == null ? '' : s).replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase(); }
// A non-negative, finite amount (untrusted numbers may be NaN/Infinity/negative/huge strings).
function cleanNum(n) { const v = Number(n); return Number.isFinite(v) && v > 0 ? Math.min(v, 1e12) : 0; }

// --- traveller card ----------------------------------------------------------
// A minimal identity a user chooses to share: an on-device id + display name +
// an emoji avatar + a short bio. No email, no phone, nothing auto-collected.
export function encodeCard(me) {
  return encodePayload('c', {
    i: cleanId(me.userId), n: clean(me.name, 40), a: cleanEmoji(me.avatar), b: clean(me.bio, 160),
  });
}
export function parseCard(payloadStr) {
  const p = decodePayload(payloadStr);
  if (!p || p.t !== 'c' || !p.d || !p.d.i) return null;
  return {
    userId: cleanId(p.d.i),
    name: clean(p.d.n, 40) || 'Traveller',
    avatar: cleanEmoji(p.d.a),
    bio: clean(p.d.b, 160),
  };
}

// --- shared content (place / collection / trip) ------------------------------
// A user shares an item with another traveller. The payload carries the sender's
// mini-card (so the recipient can add them back), an optional note, and compact,
// id-based content the recipient's app re-opens against its OWN data. Untrusted:
// every field is sanitised here and rendered as text by the caller.
function fromCard(me) { return { i: cleanId(me.userId), n: clean(me.name, 40), a: cleanEmoji(me.avatar) }; }
export function encodeShare(kind, payload, me, msg = '') {
  return encodePayload('s', { k: String(kind).slice(0, 16), f: fromCard(me), m: clean(msg, 200), d: payload });
}
export function parseShare(str) {
  const p = decodePayload(str);
  if (!p || p.t !== 's' || !p.d) return null;
  const s = p.d;
  const k = String(s.k || '').slice(0, 16);
  const from = s.f ? { userId: cleanId(s.f.i), name: clean(s.f.n, 40) || 'A traveller', avatar: cleanEmoji(s.f.a) } : null;
  const raw = s.d || {};
  let data;
  if (k === 'place') {
    const id = cleanId(raw.id);
    if (!id) return null;
    data = { id, name: clean(raw.n, 80) || 'A place' };
  } else if (k === 'collection') {
    const items = Array.isArray(raw.items) ? raw.items.slice(0, 100)
      .map((it) => ({ id: cleanId(it && it.id), name: clean(it && it.n, 80) })).filter((it) => it.id) : [];
    data = { name: clean(raw.name, 40) || 'Shared list', items };
  } else if (k === 'trip') {
    const stops = Array.isArray(raw.stops) ? raw.stops.slice(0, 60)
      .map((st) => ({ title: clean(st && st.t, 80), country: clean(st && st.c, 4), date: clean(st && st.d, 10), endDate: clean(st && st.e, 10) })).filter((st) => st.title) : [];
    data = { stops, notes: clean(raw.notes, 200) };
  } else if (k === 'tip') {
    // a local-noticeboard tip: pinned to a country+city, with a topic + text
    const text = clean(raw.text, 500);
    if (!text) return null;
    data = { cc: clean(raw.cc, 4), city: clean(raw.city, 40) || 'a city', topic: clean(raw.topic, 16) || 'tip', text };
  } else if (k === 'jelly') {
    // a community jellyfish sighting pinned to a beach place: id + date + severity + note
    const id = cleanId(raw.id);
    if (!id) return null;
    data = { id, name: clean(raw.n, 80) || 'a beach', d: clean(raw.d, 10), sev: clean(raw.sev, 8) || 'seen', note: clean(raw.note, 160) };
  } else if (k === 'secret') {
    // a "local secret" tip pinned to a specific place: place id + name + the tip + who
    const id = cleanId(raw.id);
    const text = clean(raw.text, 400);
    if (!id || !text) return null;
    data = { id, name: clean(raw.n, 80) || 'a place', text, by: clean(raw.by, 40) };
  } else if (k === 'bb') {
    // a Traveller Board listing (any category): cash swap, ride, stay, kids, gear, other.
    // A generic, fully-sanitised shape — the recipient's app renders by `cat`.
    const cat = clean(raw.cat, 12) || 'other';
    data = {
      cat,
      title: clean(raw.title, 80),
      have: raw.have ? { c: cleanCur(raw.have.c), a: cleanNum(raw.have.a) } : null,
      want: raw.want ? { c: cleanCur(raw.want.c) } : null,
      from: clean(raw.from, 40), to: clean(raw.to, 40),
      when: clean(raw.when, 40), seats: cleanNum(raw.seats),
      price: raw.price ? { a: cleanNum(raw.price.a), c: cleanCur(raw.price.c) } : null,
      g: clean(raw.g, 16),
      city: clean(raw.city, 40), note: clean(raw.note, 400), contact: clean(raw.contact, 80),
    };
  } else {
    return null;
  }
  return { kind: k, from, msg: clean(s.m, 200), data };
}

// --- async messages ("postcards") --------------------------------------------
// A single message travels as a link. The recipient imports it into a thread and
// replies the same way — an offline, serverless back-and-forth. The payload
// carries the SENDER's card so the recipient can thread and (optionally) add them.
export function encodeMessage(me, text) {
  return encodePayload('m', { f: fromCard(me), m: clean(text, 800) });
}
export function parseMessage(str) {
  const p = decodePayload(str);
  if (!p || p.t !== 'm' || !p.d) return null;
  const from = p.d.f ? { userId: cleanId(p.d.f.i), name: clean(p.d.f.n, 40) || 'A traveller', avatar: cleanEmoji(p.d.f.a) } : null;
  const text = clean(p.d.m, 800);
  if (!from || !from.userId || !text) return null;
  return { from, text };
}

// --- a journey, as a link ----------------------------------------------------
// The companion to the self-contained journey FILE (js/journey-share.js). The file carries
// photographs and so must be sent as a file; this carries the map, the stops and the written
// entries inside the link itself, which means a recipient opens it in a browser with nothing
// to install and no account — the app renders it for them from the payload alone.
//
// Keys are single letters and coordinates are rounded to 4 decimals (about 11 m, far finer
// than a journey line needs) because every character counts against MAX_PAYLOAD_URL. Callers
// must check the encoded length against that cap and fall back to the file when it does not
// fit; there is no silent truncation, because a journey that quietly lost half its stops in
// transit is worse than one that honestly refused to become a link.
function r4(n) { const v = Number(n); return Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : 0; }
export function encodeJourney(d) {
  return encodePayload('j', {
    n: clean(d.name, 60),
    b: clean(d.subtitle, 90),
    m: (d.points || []).slice(0, 120).map((p) => [r4(p.lat), r4(p.lng), clean(p.label, 40), clean(p.date, 10)]),
    s: (d.stops || []).slice(0, 60).map((s) => ({ t: clean(s.title, 60), c: clean(s.country, 4), d: clean(s.date, 10), e: clean(s.endDate, 10) })),
    j: (d.entries || []).slice(0, 60).map((e) => ({ t: clean(e.title, 70), d: clean(e.date, 10), p: clean(e.place, 40), x: clean(e.text, 600) })),
  });
}
export function parseJourney(str) {
  const p = decodePayload(str);
  if (!p || p.t !== 'j' || !p.d) return null;
  const d = p.d;
  const pts = Array.isArray(d.m) ? d.m.slice(0, 120).map((a) => ({
    lat: Number(a && a[0]), lng: Number(a && a[1]), label: clean(a && a[2], 40), date: clean(a && a[3], 10),
  })).filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lng) && Math.abs(x.lat) <= 90 && Math.abs(x.lng) <= 180) : [];
  const stops = Array.isArray(d.s) ? d.s.slice(0, 60).map((s) => ({
    title: clean(s && s.t, 60), country: clean(s && s.c, 4), date: clean(s && s.d, 10), endDate: clean(s && s.e, 10),
  })).filter((s) => s.title) : [];
  const entries = Array.isArray(d.j) ? d.j.slice(0, 60).map((e) => ({
    title: clean(e && e.t, 70), date: clean(e && e.d, 10), place: clean(e && e.p, 40), text: clean(e && e.x, 600),
  })).filter((e) => e.title || e.text) : [];
  if (!pts.length && !stops.length && !entries.length) return null;
  return { name: clean(d.n, 60) || 'A journey', subtitle: clean(d.b, 90), points: pts, stops, entries };
}
