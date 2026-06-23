// Optional online live-translate fallback. Thin, pluggable adapter: it POSTs to a
// user-configured endpoint (e.g. a LibreTranslate instance or a compatible proxy).
// The endpoint + key live ONLY in localStorage (js/state.js) and are NEVER
// committed. The phrasebook is the offline backbone; this is an enhancement that
// degrades gracefully when offline or unconfigured.
//
// NOTE: the endpoint origin must also be present in the page CSP `connect-src`
// (index.html) or the browser will block the request. Settings explains this.

import { store } from './state.js';

// A free, no-key translation endpoint (CORS-enabled, fair-use daily limit) so the
// feature works with zero setup. Users who want higher volume or full privacy can
// still point the app at their own LibreTranslate-compatible server in Settings.
const MYMEMORY = 'https://api.mymemory.translated.net/get';

// True only when the user has supplied their own endpoint (an advanced option).
export function isConfigured() {
  return !!(store.profile && store.profile.translateEndpoint);
}

// Translate `text` into the target language code ('th','vi','km','lo') from a chosen
// source language (defaults to English; 'he' Hebrew is also offered in the UI).
// Uses the user's own endpoint if set, otherwise the free fallback. Resolves to the
// translated string, or throws an Error the UI can surface.
export async function translate(text, target, source = 'en') {
  const q = (text || '').trim();
  if (!q) throw new Error('Type or say something first.');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('You are offline — use the phrasebook below.');
  const src = source || 'en';

  const endpoint = store.profile && store.profile.translateEndpoint;
  if (endpoint) {
    // LibreTranslate-compatible request shape. A proxy can adapt other providers.
    const key = store.profile && store.profile.translateKey;
    const body = { q, source: src, target, format: 'text' };
    if (key) body.api_key = key;
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Translate service error (${res.status}).`);
    const data = await res.json();
    const out = data && (data.translatedText || data.translation || data.text);
    if (!out) throw new Error('Translate service returned no text.');
    return out;
  }

  // Free fallback: MyMemory. Returns { responseData: { translatedText }, responseStatus }.
  const url = `${MYMEMORY}?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(`${src}|${target}`)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translate service error (${res.status}).`);
  const data = await res.json();
  const out = data && data.responseData && data.responseData.translatedText;
  const status = data && data.responseStatus;
  if (!out || (status && Number(status) !== 200) || /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(out)) {
    if (/USED ALL AVAILABLE FREE|QUOTA|DAILY/i.test(out || '')) {
      throw new Error('The free translation limit was reached for now. Try again later, or set your own endpoint in Settings.');
    }
    throw new Error('Could not translate that — try simpler wording or the phrasebook.');
  }
  return out;
}
