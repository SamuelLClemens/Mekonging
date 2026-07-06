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
      .map((st) => ({ title: clean(st && st.t, 80), country: clean(st && st.c, 4), date: clean(st && st.d, 10) })).filter((st) => st.title) : [];
    data = { stops, notes: clean(raw.notes, 200) };
  } else if (k === 'tip') {
    // a local-noticeboard tip: pinned to a country+city, with a topic + text
    const text = clean(raw.text, 500);
    if (!text) return null;
    data = { cc: clean(raw.cc, 4), city: clean(raw.city, 40) || 'a city', topic: clean(raw.topic, 16) || 'tip', text };
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
