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
// SIZE. Every clip is fetched `mode: 'no-cors'`, so the response is opaque and its size is
// invisible to JS. A pack's size before download is its clip count times CLIP_BYTES, a measured
// average, and is always shown as approximate ("≈"). It cannot be fetched any other way: no
// form of Google's TTS URL sends Access-Control-Allow-Origin (checked 2026-10-03, see sw.js
// prefetchTTS). What a pack costs against the browser's storage allowance is a separate and
// much larger number on Chromium — see QUOTA_CLIP_BYTES.

import { h } from './util.js';
import { LANGUAGES, getLanguage } from './lazy-data.js';
import { ALLERGENS } from './data/allergens.js';
import { ttsUrl, setSavedPacks } from './tts.js';
import { store, getAudioPacks, hasAudioPack, addAudioPack, removeAudioPack } from './state.js';
import { isStandalone, getDeferredInstallPrompt, clearDeferredInstallPrompt, render } from './main.js';
import { confirmAction, infoTip } from './ui-widgets.js';

function swReady() { return ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller; }

// Average clip from the online voice. Measured 2026-10-03 with curl over every clip of all three
// packs (300): Thai 102 clips 1.79 MB, Vietnamese 102 clips 1.44 MB, Khmer 96 clips 1.66 MB, a
// mean of 17,082 B. An earlier 13,300 came from 12 random phrases per language and missed the
// long allergy sentences, the biggest clips in every pack (up to 67 KB).
export const CLIP_BYTES = 17100;

// What one stored clip costs against the browser's storage allowance on Chromium. Chromium pads
// every opaque response in Cache Storage to a random size of several MB, so that a page cannot
// learn a cross-origin response's length from its own quota use. Measured 2026-10-03 on an empty
// origin: 10 clips cost 6.8 MB each, against 13,438 B each for ten ordinary 13,300-byte
// responses, and one 96-clip Khmer pack took usage from 20.7 to 692.8 MB (7.0 MB a clip, all 96
// playable; an earlier run on 404 pages instead of audio cost the same). The bytes on disk are
// the real ~17 KB; the allowance is what runs out, with QuotaExceededError, and a fuller origin
// is the likelier one to be evicted under storage pressure. Safari and Firefox were not
// measured, so padsOpaque() names only Chromium and nobody else is shown a figure.
export const QUOTA_CLIP_BYTES = 7 * 1048576;
export function padsOpaque() {
  try {
    const ua = navigator.userAgentData;
    return !!(ua && Array.isArray(ua.brands) && ua.brands.some((b) => /Chromium/.test(b.brand)));
  } catch { return false; }
}

const size = (b) => (b >= 1073741824 ? `${(b / 1073741824).toFixed(1)} GB`
  : b >= 1048576 ? `${(b / 1048576).toFixed(b >= 104857600 ? 0 : 1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// The one line the download cards show on Chromium: what a language costs against the
// allowance, and the allowance itself when the browser reports it. '' everywhere else.
export function quotaNote(clips, quota) {
  if (!clips || !padsOpaque()) return '';
  const of = quota ? ` of the ${size(quota)} it lets this app store` : ' of this app’s storage';
  return `This browser counts each language as ≈ ${size(clips * QUOTA_CLIP_BYTES)}${of}.`;
}

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

// The whole origin's usage and allowance, right now: { usage, quota }, either one null where the
// browser does not say (older Safari, some private modes), or null when there is no API at all.
//
// NOT per-pack. An earlier version of this file read one pack's size as the estimate() delta
// across its download, saw 699 MB for 97 Khmer clips, and blamed other caches growing at the
// same time. They were not: on an empty origin the same pack still took 691 MB. That is the
// opaque padding above, which is real quota use and not disk use — so the delta answers "how
// much allowance did this cost" (on Chromium), never "how many bytes is this pack".
export async function estimateStorage() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { usage: typeof usage === 'number' ? usage : null, quota: typeof quota === 'number' ? quota : null };
  } catch { return null; }
}

// Download one language's pack. Resolves { ok, total, quotaHit } once the service worker
// reports done; `onProgress(done, total)` fires as clips land. A pack the allowance cut short is
// not recorded as saved, and the clips it did store are removed again: kept, they would hold
// most of a language's quota cost with no ✓ beside them and no Remove button to free it.
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
      if (d.quotaHit) {
        // A re-download of a saved pack only adds what is new (sw.js skips clips it holds), so
        // its record and its clips stay; only a first download is undone.
        if (hasAudioPack(code)) { resolve({ ok: d.ok, total: d.total, quotaHit: true }); return; }
        removePack(code).then(() => resolve({ ok: 0, total: d.total, quotaHit: true }));
        return;
      }
      if (d.ok) { addAudioPack(code); setSavedPacks(getAudioPacks()); }
      resolve({ ok: d.ok, total: d.total, quotaHit: false });
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
    if (results[code].quotaHit) break;   // the next language would hit the same wall
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

// The full pack-management card: every downloadable language in one place, pick any
// combination (or all of them) to download, see what is already saved, remove what you no
// longer want. Originally Settings-only; also used from Talk (js/screens/phrasebook.js) so a
// traveller who only ever opens Talk still has "download everything at once" and "what's
// downloaded" without a trip to Settings — one card, one implementation, shared.
export function audioPacksCard() {
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, '🔊 Offline phrase audio'),
      infoTip('Downloads each language’s pronunciations from an online voice once, so the phrasebook’s speaker then works with no signal. There is one audio quality — the online voice does not offer a choice. Lao has no online voice to download from at all yet (tracked separately); this app’s other phrasebook languages already have a voice built into most phones, so a downloaded pack would not buy them anything.'),
    ]),
  ]);
  const status = h('p', { class: 'pack-state muted' }, '');
  const totalLine = h('p', { class: 'tiny muted pack-count' }, '');
  const downloaded = h('ul', { class: 'pack-tiers' });
  const choices = h('div', { class: 'qc-choices' });
  const quotaLine = h('p', { class: 'tiny muted' }, '');
  const btns = h('div', { class: 'pack-btns' });
  const nudgeHost = h('div', {});
  card.append(status, downloaded, choices, quotaLine, btns, nudgeHost, totalLine);

  const all = downloadableLanguages();   // [{ code, book, urls }] — Thai/Vietnamese/Khmer today
  let selected = new Set();
  let busy = false;
  let quota = null;   // the browser's allowance for this origin, once estimateStorage() answers

  // Its own painter: the allowance arrives after paint(), and a full repaint then would wipe a
  // "Storage is full" status that had just been written.
  const paintQuota = (remaining = all.filter((l) => !hasAudioPack(l.code))) => {
    quotaLine.textContent = remaining.length
      ? quotaNote(Math.round(remaining.reduce((n, l) => n + l.urls.length, 0) / remaining.length), quota) : '';
  };

  const paintButtons = (remaining) => {
    btns.innerHTML = '';
    if (!remaining.length) return;
    btns.append(h('button', {
      class: 'btn block', disabled: (busy || !selected.size) ? '' : null,
      onclick: () => runDownload(remaining.filter((l) => selected.has(l.code)).map((l) => l.code)),
    }, `⤓ Download selected${selected.size ? ` (${selected.size})` : ''}`));
    btns.append(h('button', {
      class: 'btn ghost block', disabled: busy ? '' : null,
      onclick: () => runDownload(remaining.map((l) => l.code)),
    }, `⤓ Download all + my dictionary (${remaining.length})`));
  };

  const paint = () => {
    const have = all.filter((l) => hasAudioPack(l.code));
    const remaining = all.filter((l) => !hasAudioPack(l.code));

    downloaded.innerHTML = '';
    have.forEach((l) => {
      downloaded.append(h('li', { class: 'pack-tier is-done' }, [
        h('span', { class: 'pt-ic', 'aria-hidden': 'true' }, '✓'),
        h('span', {}, `${l.book.label} — ${l.urls.length} clips`),
        h('button', {
          class: 'linklike', style: 'margin-left: auto',
          onclick: async () => {
            const ok = await confirmAction({
              title: `Remove ${l.book.label} audio?`,
              body: `The speaker falls back to an online voice whenever you have a signal. Your saved phrases and translations are not touched — only the downloaded audio.`,
              confirmLabel: 'Remove', danger: true,
            });
            if (!ok) return;
            await removePack(l.code);
            paint();
          },
        }, '🗑 Remove'),
      ]));
    });

    choices.innerHTML = '';
    remaining.forEach((l) => {
      const box = h('input', { type: 'checkbox', checked: selected.has(l.code) ? '' : null, 'aria-label': l.book.label });
      // Repaints only the button row (not the whole card, and not this checkbox list) — a
      // full paint() here would rebuild every checkbox mid-tap and cost the traveller their
      // other selections' focus for nothing; the button row is the only thing a toggle changes.
      box.addEventListener('change', () => { if (box.checked) selected.add(l.code); else selected.delete(l.code); paintButtons(remaining); });
      choices.append(h('label', { class: 'qc-choice' }, [box, h('span', {}, `${l.book.label} (${l.urls.length} clips, ≈ ${size(l.urls.length * CLIP_BYTES)})`)]));
    });
    paintQuota(remaining);

    paintButtons(remaining);

    if (!busy) {
      status.textContent = have.length
        ? `${have.length} of ${all.length} downloadable ${all.length === 1 ? 'language is' : 'languages are'} saved on this device.`
        : `${all.length} ${all.length === 1 ? 'language is' : 'languages are'} available to download.`;
    }
  };

  const runDownload = (codes) => {
    if (!codes.length || busy) return;
    busy = true; nudgeHost.innerHTML = ''; paint();
    downloadPacks(codes, (code, langIndex, langCount, done, total) => {
      const label = (all.find((l) => l.code === code) || {}).book?.label || code;
      status.textContent = `Downloading ${label} (${langIndex + 1} of ${langCount}) — ${done}/${total} clips…`;
    }).then((results) => {
      busy = false;
      selected = new Set();
      const failed = Object.values(results).some((r) => !r.skipped && !r.ok);
      const full = Object.keys(results).find((c) => results[c].quotaHit);
      const nudge = installNudge();
      if (nudge) nudgeHost.append(nudge);
      paint();
      showStorage();
      if (full) {
        const label = (all.find((l) => l.code === full) || {}).book?.label || full;
        status.textContent = `Storage is full, so ${label} was not saved. Remove a language or a saved map area, then try again.`;
      } else if (failed) status.textContent = 'Could not download one or more languages — check your connection and try again.';
    });
  };

  const showStorage = () => estimateStorage().then((est) => {
    if (!est || est.usage == null) return;
    quota = est.quota;
    totalLine.textContent = quota
      ? `This app is using ${size(est.usage)} of the ${size(quota)} this browser allows it (everything downloaded, not only audio).`
      : `This app is using about ${size(est.usage)} of storage on this device (everything downloaded, not only audio).`;
    paintQuota();
  });

  paint();
  showStorage();
  return card;
}
