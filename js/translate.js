// Optional online live-translate fallback. Thin, pluggable adapter: it POSTs to a
// user-configured endpoint (e.g. a LibreTranslate instance or a compatible proxy).
// The endpoint + key live ONLY in localStorage (js/state.js) and are NEVER
// committed. The phrasebook is the offline backbone; this is an enhancement that
// degrades gracefully when offline or unconfigured.
//
// NOTE: the endpoint origin must also be present in the page CSP `connect-src`
// (index.html) or the browser will block the request. Settings explains this.

import { store } from './state.js';

export function isConfigured() {
  return !!(store.profile && store.profile.translateEndpoint);
}

// Translate `text` from English into the target language code ('th','vi','km','lo').
// Resolves to the translated string, or throws an Error the UI can surface.
export async function translate(text, target) {
  const endpoint = store.profile && store.profile.translateEndpoint;
  const key = store.profile && store.profile.translateKey;
  if (!endpoint) throw new Error('Live translate is not configured. Add an endpoint in Settings.');
  if (!navigator.onLine) throw new Error('You are offline. Use the phrasebook instead.');

  // LibreTranslate-compatible request shape. A proxy can adapt other providers.
  const body = { q: text, source: 'en', target, format: 'text' };
  if (key) body.api_key = key;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Translate service error (${res.status}).`);
  const data = await res.json();
  const out = data && (data.translatedText || data.translation || data.text);
  if (!out) throw new Error('Translate service returned no text.');
  return out;
}
