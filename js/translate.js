// Optional online live-translate fallback. Thin, pluggable adapter: it POSTs to a
// user-configured endpoint (e.g. a LibreTranslate instance or a compatible proxy).
// The endpoint + key live ONLY in localStorage (js/state.js) and are NEVER
// committed. The phrasebook is the offline backbone; this is an enhancement that
// degrades gracefully when offline or unconfigured.
//
// NOTE: the endpoint origin must also be present in the page CSP `connect-src`
// (index.html) or the browser will block the request. Settings explains this.
//
// ---------------------------------------------------------------------------
// Why this file is more than a one-line fetch
//
// It talks to more than one service, fastest first (see FREE_PROVIDERS below for the
// measurements that set that order), and every failure mode below belongs to MyMemory, which
// is now the FALLBACK rather than the only provider. The notes are kept in full because it is
// still the one answering whenever the faster service cannot.
//
// MyMemory has three hard limits that each used to surface to the traveller as the SAME
// sentence — "Could not translate that — try simpler wording or the phrasebook." That message
// was wrong in every case but one, and it blamed the traveller's phrasing for problems that
// had nothing to do with phrasing. All three were reproduced against the live API before this
// was written:
//
//   1. Source == target  → HTTP 403 "PLEASE SELECT TWO DISTINCT LANGUAGES".
//      Reachable without doing anything unusual: the source picker defaults to the
//      app's INTERFACE language, so a traveller reading the app in Thai who opens the
//      Thai phrasebook — or a local Thai speaker handed the phone, which is the single
//      highest-value case this screen has — got a guaranteed hard failure telling them
//      to simplify their wording. Now short-circuited before any request.
//
//   2. Over 500 characters → HTTP 403 "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED
//      QUERY : 500 CHARS". A traveller explaining a symptom to a pharmacist writes
//      long, and was told to simplify. Now split on sentence boundaries and
//      reassembled, so long text actually translates instead of erroring.
//
//   3. Daily quota, counted PER IP → the response text becomes a MYMEMORY WARNING.
//      The per-IP part is what makes this bite: a hostel, a cafe or a hotel puts every
//      guest behind one address, so travellers exhaust a shared allowance together and
//      it reads as "the app is broken for everyone at once". The cache below is the
//      main defence — a phrase translated once never costs quota again, on any later
//      day, and works offline from then on.
//
// A fourth mode is silent rather than loud: for a pair it has no engine for, MyMemory
// answers 200 with the input echoed straight back. That is not a translation, and
// presenting it as one is worse than an error, so it is detected and named.

import { store } from './state.js';
import { fetchTimeout } from './util.js';

// Two free, no-key endpoints so the feature works with zero setup. Users who want higher
// volume or full privacy can still point the app at their own LibreTranslate-compatible
// server in Settings, which then replaces both.
//
// The public Google Translate service, reached over its keyless `gtx` client — the SAME
// service the app already depends on for phrase audio (js/tts.js `ttsUrl`), over a different
// path. It sends `access-control-allow-origin: *`, so a browser can read it directly.
const GTX = 'https://translate.googleapis.com/translate_a/single';
const MYMEMORY = 'https://api.mymemory.translated.net/get';

// MyMemory rejects anything longer than this outright. Held a little under the real
// 500 so a multi-byte sentence cannot cross it after encoding.
const MAX_CHARS = 450;
// gtx has no such small ceiling: measured 2026-09-22, an 820-character paragraph came back as
// ONE request in 1.4s. Held well under the URL-length limit of a GET. This is most of the win
// on long text — a symptom described to a pharmacist used to be several requests in series.
const GTX_MAX_CHARS = 1800;

// True only when the user has supplied their own endpoint (an advanced option).
export function isConfigured() {
  return !!(store.profile && store.profile.translateEndpoint);
}

// ---- translation cache ------------------------------------------------------
// Every successful translation is kept, keyed by exactly what produced it. Three
// things this buys, in order of how much they matter to a traveller:
//   * a repeated phrase costs no quota, so the shared per-IP allowance lasts far longer;
//   * a repeated phrase works with no connection at all;
//   * a repeated phrase is instant.
// Deliberately its own localStorage key rather than a field on the profile store: it is
// disposable derived data, and it must never ride along with — or risk a migration of —
// the traveller's own saved content.
const CACHE_KEY = 'mk.translate.cache.v1';
const CACHE_CAP = 600;
let _cache = null;

function cacheLoad() {
  if (_cache) return _cache;
  _cache = new Map();
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) { const obj = JSON.parse(raw); if (obj && typeof obj === 'object') _cache = new Map(Object.entries(obj)); }
  } catch { /* unreadable or disabled storage — an empty cache is a correct cache */ }
  return _cache;
}

function cacheKey(text, target, src) { return `${src}|${target}|${text}`; }

function cacheGet(text, target, src) {
  const hit = cacheLoad().get(cacheKey(text, target, src));
  return typeof hit === 'string' ? hit : null;
}

function cacheSet(text, target, src, out) {
  const c = cacheLoad();
  c.set(cacheKey(text, target, src), out);
  // Oldest out first — Map keeps insertion order, so the first key is the stalest.
  while (c.size > CACHE_CAP) { const first = c.keys().next(); if (first.done) break; c.delete(first.value); }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(c))); }
  catch { /* full or disabled — the in-memory cache still serves this session */ }
}

// Whether a phrase can be answered with no connection at all. Lets the UI offer a
// previously-translated phrase while offline instead of refusing outright.
export function isCached(text, target, source = 'en') {
  const q = (text || '').trim();
  if (!q) return false;
  return cacheGet(q, target, source || 'en') != null;
}

// ---- helpers ----------------------------------------------------------------
// The code handed to the service. Every code the picker offers was checked against the
// live API, the two region-tagged Chinese entries ('zh-CN'/'zh-TW') included, and all of
// them are accepted as-is — so this is a seam for a future provider that spells one
// differently, not a translation table.
function apiLang(code) { return String(code || '').trim(); }

// Same language either side is not a translation, and the service rejects it outright.
// Compared on the base tag so 'zh-CN' vs 'zh' counts as the same language.
function sameLang(a, b) {
  const base = (x) => String(x || '').toLowerCase().split(/[-_]/)[0];
  return !!base(a) && base(a) === base(b);
}

// Split over-long text into pieces the service will accept, preferring sentence ends,
// then clause breaks, then whitespace — so a seam lands where a translator would
// naturally pause rather than mid-word. A single word longer than the limit (rare, and
// never in the languages here) is hard-cut rather than dropped.
function chunk(text, max = MAX_CHARS) {
  if (text.length <= max) return [text];
  const out = [];
  let rest = text;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = -1;
    for (const re of [/[.!?。！？](?=[^.!?。！？]*$)/, /[,;:，；、](?=[^,;:，；、]*$)/, /\s(?=\S*$)/]) {
      const m = re.exec(window);
      if (m && m.index > max * 0.4) { cut = m.index + 1; break; }
    }
    if (cut <= 0) cut = max;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

// The service reports its failures inside a 200 body as often as in the status, so both
// have to be read. Returns a specific, honest message per mode — none of which blames
// the traveller's choice of words for a limit that has nothing to do with words.
function serviceError(text, status) {
  const s = String(text || '');
  if (/USED ALL AVAILABLE FREE|QUOTA|DAILY LIMIT/i.test(s)) {
    return 'The free translation service has hit its daily limit for this network — on shared hotel or cafe wifi that is everyone at once. Phrases you have translated before still work here, and the phrasebook below works offline. Your own translation service can be set in Settings.';
  }
  if (/QUERY LENGTH LIMIT/i.test(s)) {
    return 'That is too long for the translation service even after splitting it up. Try sending it a couple of sentences at a time.';
  }
  if (/TWO DISTINCT LANGUAGES/i.test(s)) {
    return 'Pick a different language to translate from — those two are the same language.';
  }
  if (/INVALID LANGUAGE PAIR|NOT SUPPORTED/i.test(s)) {
    return 'The translation service cannot handle that pair of languages. Translating from English usually works where a direct pair does not.';
  }
  if (Number(status) === 429) return 'The translation service is busy right now. Wait a moment and try again — the phrasebook below works either way.';
  return 'The translation service could not answer just now. Try again in a moment — the phrasebook below works offline either way.';
}

// ---- providers --------------------------------------------------------------
// One request for one chunk, one provider. Each takes the same arguments and either resolves
// to translated text or throws; everything around them — the cache, chunking, the retry, the
// echo check — is provider-independent and lives in runProvider/translate below.

// The traveller's own LibreTranslate-compatible server. A proxy can adapt other providers.
async function customRequest(q, target, src, signal, timeout) {
  const endpoint = store.profile && store.profile.translateEndpoint;
  const key = store.profile && store.profile.translateKey;
  const body = { q, source: src, target, format: 'text' };
  if (key) body.api_key = key;
  const res = await fetchTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }, timeout);
  if (!res.ok) throw new Error(`Your translation service answered with an error (${res.status}). Check the endpoint in Settings.`);
  const data = await res.json();
  const out = data && (data.translatedText || data.translation || data.text);
  if (!out) throw new Error('Your translation service returned no text. Check the endpoint in Settings.');
  return out;
}

// Google's public keyless endpoint. Answers with [[[translated, original, …], …], …] — one
// entry per sentence-sized segment, which is why the segments join bare: each already carries
// its own leading and trailing spacing, and inserting more would space out the punctuation.
async function gtxRequest(q, target, src, signal, timeout) {
  const params = new URLSearchParams({ client: 'gtx', sl: src, tl: target, dt: 't', q });
  const res = await fetchTimeout(`${GTX}?${params}`, { signal }, timeout);
  if (!res.ok) throw new Error(serviceError('', res.status));
  const data = await res.json();
  const segs = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : null;
  const out = segs ? segs.map((s) => (Array.isArray(s) ? s[0] : '')).filter(Boolean).join('') : '';
  if (!out) throw new Error(serviceError('', res.status));
  return out;
}

// MyMemory. Returns { responseData: { translatedText }, responseStatus }.
// `de` is the documented way to identify a caller and raises the anonymous daily
// allowance roughly tenfold. It is the traveller's OWN address, entered by them in
// Settings and stored only on their device — never a hard-coded one, which would
// both put an address in the repository and pool every user onto one allowance.
async function myMemoryRequest(q, target, src, signal, timeout) {
  const email = store.profile && store.profile.translateEmail;
  const params = new URLSearchParams({ q, langpair: `${src}|${target}` });
  if (email) params.set('de', email);
  const res = await fetchTimeout(`${MYMEMORY}?${params}`, { signal }, timeout);
  // A transport-level failure carries no body to inspect, so it is reported as itself.
  if (!res.ok && res.status !== 403) throw new Error(serviceError('', res.status));
  const data = await res.json();
  const out = data && data.responseData && data.responseData.translatedText;
  const status = data && data.responseStatus;
  const details = (data && data.responseDetails) || '';
  if (!out || (status && Number(status) !== 200)) throw new Error(serviceError(details || out, status));
  // A warning can arrive inside an otherwise-200 body with the text replaced by it.
  if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|TWO DISTINCT LANGUAGES|INVALID LANGUAGE PAIR/i.test(out)) {
    throw new Error(serviceError(out, status));
  }
  return out;
}

// The free chain, fastest first, and the whole point of there being a chain: the fast one is
// undocumented and can change without notice, so the slow one stays behind it as the floor.
//
// MEASURED 2026-09-22, same short phrase, same pair, from a browser: gtx 0.8–1.5s, MyMemory
// 14.6–16.4s. MyMemory had been the only provider, and its latency had grown PAST this file's
// own 15s timeout — so the request was aborted a beat before the answer arrived, the retry
// waited the whole thing out again, and the traveller got an error at ~30 seconds for a phrase
// the service would have answered at 16. That is the failure this ordering removes.
//
// `retry` is per provider rather than global for the same reason: one more attempt at ~1s is
// worth having on a link that drops requests, and one more attempt at ~18s is the dead end.
const CUSTOM_PROVIDER = { max: MAX_CHARS, timeout: 15000, retry: true, request: customRequest };
const FREE_PROVIDERS = [
  { max: GTX_MAX_CHARS, timeout: 6000, retry: true, request: gtxRequest },
  { max: MAX_CHARS, timeout: 18000, retry: false, request: myMemoryRequest },
];

// Run one provider over the whole text: split to that provider's own limit, request each piece,
// and reassemble. Throws on the first piece it cannot get.
async function runProvider(p, q, target, src, signal) {
  const stopped = () => signal && signal.aborted;
  const done = [];
  for (const part of chunk(q, p.max)) {
    if (stopped()) throw new TranslateAborted();
    let out;
    try {
      out = await p.request(part, target, src, signal, p.timeout);
    } catch (err) {
      // An abort is not a network wobble — never burn the retry on one, and never report it
      // as a failure. Checked before the message match because an aborted fetch's own message
      // is browser-specific and would otherwise fall through to the retry.
      if (stopped() || err.name === 'AbortError' || err instanceof TranslateAborted) throw new TranslateAborted();
      // A quota, length or pair refusal is not transient and asking again cannot fix it.
      if (!p.retry || /daily limit|pair of languages|too long/i.test(err.message)) throw err;
      out = await p.request(part, target, src, signal, p.timeout);
    }
    done.push(out);
  }
  return done.join(' ').trim();
}

// Thrown when the traveller calls the translation off. Its own class so the UI can tell a
// deliberate cancel apart from a failure and stay silent instead of reporting an error at
// somebody who already knows what happened.
export class TranslateAborted extends Error {
  constructor() { super('Translation stopped.'); this.name = 'TranslateAborted'; }
}

// Translate `text` into the target language code ('th','vi','km','lo') from a chosen
// source language (defaults to English; every language in the picker is offered).
// Resolves to the translated string, or throws an Error the UI can surface.
//
// `signal` is an optional AbortSignal, and it exists because this can now take real time:
// long text is several requests, each with a retry behind it, so on a weak link "Translating…"
// can sit on screen for seconds. Sound has had a stop control for a while; work the app is
// doing over the network had none, and waiting it out was the only option.
export async function translate(text, target, source = 'en', signal = null) {
  const stopped = () => signal && signal.aborted;
  if (stopped()) throw new TranslateAborted();
  const q = (text || '').trim();
  if (!q) throw new Error('Type or say something first.');
  const src = apiLang(source || 'en');
  const tgt = apiLang(target);

  // Same language either side: there is nothing to translate, and asking the service
  // is a guaranteed 403. Hand the text straight back — a phrasebook target that
  // matches the traveller's own language means they can already read it.
  if (sameLang(src, tgt)) return q;

  const cached = cacheGet(q, tgt, src);
  if (cached) return cached;

  // Offline is only a dead end for something never translated before; the cache above
  // has already answered anything that has been.
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are offline, and this phrase has not been translated before — the phrasebook below works with no connection.');
  }

  // A configured endpoint is an explicit choice and is used alone — falling back from it to a
  // public service would quietly undo the privacy that is the reason for setting one.
  const chain = isConfigured() ? [CUSTOM_PROVIDER] : FREE_PROVIDERS;
  let lastErr = null;
  for (const p of chain) {
    let joined;
    try {
      joined = await runProvider(p, q, tgt, src, signal);
    } catch (err) {
      // A cancel is the traveller's decision and ends the whole thing; anything else is worth
      // asking the next provider about, including a quota refusal — that is precisely when
      // the other service is the one that can answer.
      if (err instanceof TranslateAborted) throw err;
      lastErr = err;
      continue;
    }
    if (stopped()) throw new TranslateAborted();
    // For a pair it cannot handle, a service echoes the input back with a 200. That is
    // not a translation, and showing it as one would send a traveller to a counter with a
    // sentence in their own language believing it had been converted. Worth trying the next
    // provider for rather than reporting, since the pair may simply be one this one lacks.
    if (!joined || joined.toLowerCase() === q.toLowerCase()) {
      lastErr = new Error('The translation service had no translation for that and sent the text back unchanged. Translating from English usually works where a direct pair does not — the phrasebook below is always exact.');
      continue;
    }
    cacheSet(q, tgt, src, joined);
    return joined;
  }
  throw lastErr || new Error(serviceError('', 0));
}
