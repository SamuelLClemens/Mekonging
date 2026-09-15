// Offline phrase-audio packs (item 2.4 / B4) — one module so the phrasebook screen's own
// single-language card and Settings' full pack-management list build the exact same URL list
// (must match tts.js's own cache key, see ttsUrl()) and drive the same service-worker messages,
// instead of two copies of this logic drifting apart.
//
// WHICH LANGUAGES ARE ACTUALLY DOWNLOADABLE. Only ones ttsUrl() serves audio for at all —
// Thai, Vietnamese and Khmer today (js/tts.js TTS_LANG). Lao has NO online voice (Google
// Translate's endpoint returns 400 text/html for tl=lo, measured 2026-09-15 — see tts.js) and
// no device voice either, so it has no source to bundle a pack FROM. That is a content gap
// (real Lao audio has to come from somewhere — a free/no-cost source is still being sourced,
// see the flagged follow-up task), not something this module can paper over:
// downloadableLanguages() simply excludes any language with an empty url list, Lao included,
// rather than offering a download that would silently save nothing. The other four phrasebook
// languages (Chinese, Burmese, Malay, Hmong) are excluded the same way — most already have a
// device voice, so a downloaded pack buys them nothing, and the rest have no source either.
//
// NO QUALITY CHOICE. The D2 research assumed encoding our own clips at a chosen AAC bitrate,
// but what is actually cached here is whatever Google Translate's public TTS endpoint returns —
// there is no bitrate/quality parameter on that URL at all. So there is one quality, not a
// picker; downloadPack() does not take one.
//
// SIZE IS MEASURED, NOT ESTIMATED. Every clip is fetched `mode: 'no-cors'`, so the response is
// opaque — its body size is invisible to JS by design (that is what "opaque" means), so summing
// per-clip bytes is not possible even in principle. navigator.storage.estimate() is the one
// number the platform will give us, so a pack's size is measured as the estimate() delta across
// the download (see downloadPack) and kept in prefs.audioPackBytes; a pack whose delta could not
// be measured (API unavailable) records null and callers must say "size not available", never
// print a guess as though it were a measurement.

import { h } from './util.js';
import { LANGUAGES, getLanguage } from './data/regions.js';
import { ALLERGENS } from './data/allergens.js';
import { ttsUrl, setSavedPacks } from './tts.js';
import { store, getAudioPacks, hasAudioPack, addAudioPack, removeAudioPack } from './state.js';
import { isStandalone, getDeferredInstallPrompt, clearDeferredInstallPrompt, render } from './main.js';

function swReady() { return ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller; }

// Every clip URL one language's built-in phrasebook + allergy phrases + the traveller's OWN
// saved translations ("my dictionary") resolve to — the personal-dictionary phrases are custom
// text with no entry in the static book, so they need adding explicitly rather than falling out
// of book.categories. Deduplicated: several phrases can share the same source text.
export function packUrls(code) {
  const book = getLanguage(code);
  if (!book) return [];
  const allergy = (ALLERGENS[code] && ALLERGENS[code].length) ? ALLERGENS[code] : [];
  const bookScripts = book.categories.flatMap((c) => c.phrases).concat(allergy).map((p) => p.script);
  const custom = (store.profile.prefs.customPhrases && store.profile.prefs.customPhrases[code]) || [];
  const scripts = bookScripts.concat(custom.map((c) => c.script));
  return [...new Set(scripts.map((s) => ttsUrl(s, book.locale)).filter(Boolean))];
}

// Phrasebook languages with an actual audio source to download — see the header comment for
// why this is Thai/Vietnamese/Khmer today and nobody else.
export function downloadableLanguages() {
  return Object.keys(LANGUAGES)
    .map((code) => ({ code, book: LANGUAGES[code], urls: packUrls(code) }))
    .filter((l) => l.urls.length > 0);
}

// The whole origin's on-device storage usage, right now — the only real number the platform
// will hand over for content cached as opaque responses. null where the API is unavailable
// (older Safari, private browsing in some browsers).
//
// NOT per-pack. An earlier version of this file tried to measure one pack's cost as the
// estimate() delta across its own download, and it was wrong by two orders of magnitude the
// first time it was tested live (a 97-clip Khmer pack "measured" at 699 MB) — because usage is
// for the WHOLE origin, and this app's other caches (satellite tiles, the field guide's own
// background photo prefetch) can grow at the same time for reasons that have nothing to do
// with the pack being downloaded. There is no reliable way to isolate one pack's bytes from an
// opaque, no-cors response, so this module does not try: a pack's size is its clip count,
// never a byte figure attributed to it specifically.
export async function estimateUsage() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const { usage } = await navigator.storage.estimate();
    return typeof usage === 'number' ? usage : null;
  } catch { return null; }
}

// Download one language's pack. Resolves { ok, total, quotaHit } once the service worker
// reports done; `onProgress(done, total)` fires as clips land.
export function downloadPack(code, onProgress) {
  const urls = packUrls(code);
  if (!urls.length || !swReady()) return Promise.resolve({ ok: 0, total: 0, quotaHit: false });
  return new Promise((resolve) => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.lang !== code) return;
      if (d.type === 'TTS_PROGRESS') { if (onProgress) onProgress(d.done, d.total); return; }
      if (d.type !== 'TTS_DONE') return;
      navigator.serviceWorker.removeEventListener('message', onMsg);
      if (d.ok) { addAudioPack(code); setSavedPacks(getAudioPacks()); }
      resolve({ ok: d.ok, total: d.total, quotaHit: d.quotaHit });
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TTS', urls, lang: code });
  });
}

// Download several languages' packs — one at a time, not in parallel, same reasoning as
// js/offline-pack.js's own serial media prefetch: a shared hostel connection stays usable
// instead of four downloads saturating it at once. Skips a language already saved unless
// `force` (the phrasebook screen's "re-download" button passes true). `onProgress` is called
// as (code, langIndex, langCount, done, total) so a caller can show "Vietnamese (2 of 3) —
// 140/300 clips" while it runs.
export async function downloadPacks(codes, onProgress, force = false) {
  const results = {};
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (!force && hasAudioPack(code)) { results[code] = { ok: true, skipped: true }; continue; }
    results[code] = await downloadPack(code, (done, total) => {
      if (onProgress) onProgress(code, i, codes.length, done, total);
    });
  }
  return results;
}

// Remove one language's saved clips from the shared cache (sw.js DELETE_TTS) — recomputing the
// SAME url list the pack was downloaded with, so only this language's entries are dropped;
// other languages' clips, and anything cached incidentally from ordinary tap-to-speak use, are
// left alone. Always clears the app's own record even if the service worker is unavailable, so
// a stale "downloaded" flag never outlives what it described.
export function removePack(code) {
  const urls = packUrls(code);
  return new Promise((resolve) => {
    if (!swReady() || !urls.length) {
      removeAudioPack(code); setSavedPacks(getAudioPacks());
      resolve({ removed: 0 }); return;
    }
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type !== 'DELETE_TTS_DONE') return;
      navigator.serviceWorker.removeEventListener('message', onMsg);
      removeAudioPack(code); setSavedPacks(getAudioPacks());
      resolve({ removed: d.removed });
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    navigator.serviceWorker.controller.postMessage({ type: 'DELETE_TTS', urls });
  });
}

// D2's resolution: a traveller who has not installed to the Home Screen can lose downloaded
// packs to Safari's 7-day storage eviction with no warning, so ask right when it would matter —
// after a pack finishes downloading — rather than only in Settings, where nobody not already
// looking for it will see it. Returns null once installed (nothing to ask).
export function installNudge() {
  if (isStandalone()) return null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  if (getDeferredInstallPrompt()) {
    return h('div', { class: 'audio-install-nudge' }, [
      h('p', { class: 'tiny muted', style: 'margin: 0' },
        'Add this app to your Home Screen so downloads like this one survive even if you do not open it for a while.'),
      h('button', {
        class: 'btn ghost btn-spaced',
        onclick: async () => {
          const dp = getDeferredInstallPrompt(); if (!dp) return;
          dp.prompt(); try { await dp.userChoice; } catch { /* dismissed */ }
          clearDeferredInstallPrompt(); render();
        },
      }, '➕ Add to Home Screen'),
    ]);
  }
  return h('div', { class: 'audio-install-nudge' }, [
    h('p', { class: 'tiny muted', style: 'margin: 0' }, isIOS
      ? 'To make sure this survives, tap Share in Safari → “Add to Home Screen”.'
      : 'To make sure this survives, use your browser menu → “Install app” or “Add to Home Screen”.'),
  ]);
}
