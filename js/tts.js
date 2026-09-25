// Tap-to-speak via the device Web Speech API (speechSynthesis). Offline on most
// devices once voices are installed. Thai and Vietnamese voices are common;
// Khmer (km) and Lao (lo) are frequently ABSENT — callers must handle that
// gracefully (show script + romanisation, disable the speaker control).

import { startPlayback, stopPlayback } from './audio-control.js';

let voices = [];

function refresh() {
  try { voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
  catch { voices = []; }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  refresh();
  // Voices often load asynchronously; repopulate when they arrive.
  try { window.speechSynthesis.addEventListener('voiceschanged', refresh); } catch { /* older API */ }
  // …but Safari does not reliably FIRE voiceschanged, so the listener above can wait forever
  // while getVoices() keeps returning []. Every gate in this file would then report "no voice
  // for this language" on a device that has one. Poll alongside the event and stop as soon as
  // a list arrives (or after ~2s, by which point there is genuinely nothing to wait for).
  let tries = 0;
  const poll = setInterval(() => {
    tries += 1;
    refresh();
    if (voices.length || tries >= 8) clearInterval(poll);
  }, 250);
}

function matches(v, lang, base) {
  const vl = (v.lang || '').toLowerCase();
  return vl === lang || vl.split('-')[0] === base;
}

// Is there a device voice that can speak this BCP-47 locale (e.g. 'th-TH') WITHOUT a network?
// `localService` is the distinction that matters to a traveller with no signal: a remote voice
// is a network call wearing the same interface, so counting it here would promise offline
// speech that goes silent the moment the signal does.
export function hasVoiceFor(locale) {
  if (!locale) return false;
  if (!voices.length) refresh();   // voices often load async on Chromium; re-read on demand
  if (!voices.length) return false;
  const lang = locale.toLowerCase();
  const base = lang.split('-')[0];
  return voices.some((v) => matches(v, lang, base) && v.localService === true);
}

// Prefer an on-device voice; accept a remote one rather than staying silent when that is all
// the platform offers. The caller has already been told, via hasVoiceFor(), which it is.
function pickVoice(locale) {
  const lang = locale.toLowerCase();
  const base = lang.split('-')[0];
  const rank = (v) => (v.localService === true ? 0 : 1) + ((v.lang || '').toLowerCase() === lang ? 0 : 0.5);
  return voices.filter((v) => matches(v, lang, base)).sort((a, b) => rank(a) - rank(b))[0] || null;
}

// Speak `text` in the given locale. Returns true if speech was attempted.
// opts (optional): { rate } playback speed (default 0.9 — a touch slower so the listener can
// follow); { onend } fired when this utterance finishes; { onerror } fired on failure. The
// callbacks let a caller chain sentence chunks (the read-aloud reader) with per-chunk control.
export function speak(text, locale, opts = {}) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return false;
  if (!voices.length) refresh();
  const voice = pickVoice(locale || '');
  if (!voice) return false; // caller should have gated on hasVoiceFor()
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang || locale;
    u.rate = opts.rate ? Math.min(4, Math.max(0.5, opts.rate)) : 0.9;
    // Registered with the shared audio-control so a global "stop" (or any other sound
    // starting, e.g. an animal call) can silence this utterance — speechSynthesis has no
    // other way to be interrupted from outside the code that started it.
    const done = startPlayback(() => { try { window.speechSynthesis.cancel(); } catch { /* ignore */ } });
    u.onend = () => { done(); if (opts.onend) opts.onend(); };
    u.onerror = () => { done(); if (opts.onerror) opts.onerror(); };
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

// Stops whatever is currently speaking or playing, device voice or online TTS alike.
export function stop() {
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ }
  stopPlayback();
}

// Online voice fallback for languages with NO device voice (Khmer and Lao are almost
// always missing). Uses Google Translate's TTS over an <audio> element (audio playback
// is not CORS-restricted; the origin must be in the page CSP media-src). Needs the
// network. Returns a Promise that resolves when playback starts/ends, rejects otherwise.
// Lao is deliberately ABSENT. Measured 2026-09-15 against this exact endpoint: th, km and vi
// each return 200 audio/mpeg, and `tl=lo` returns 400 text/html — Google Translate has no Lao
// voice to serve. Lao also has no device voice on either platform (see the coverage table in
// WORK_ORDER.md B1), so it had neither path and the app offered it anyway: canSay() said yes,
// the speaker rendered enabled, the request 400'd, the <audio> error fired, and the tap did
// visibly nothing. Leaving Lao out here makes ttsUrl() return '' so the failure is known up
// front and the interface can say so, instead of being discovered one silent tap at a time.
// A bundled audio pack (B4) is the only path that can ever pronounce Lao.
const TTS_LANG = { 'th-TH': 'th', 'vi-VN': 'vi', 'km-KH': 'km', 'he-IL': 'iw', 'en-US': 'en' };

// The exact online-TTS URL for a phrase. Exported so the offline "audio pack"
// prefetch (service worker) and live playback build the IDENTICAL cache key.
export function ttsUrl(text, locale) {
  const t = (text || '').trim().slice(0, 200);
  if (!t || !locale) return '';
  // No `|| locale.split('-')[0]` fallback: that guess is what handed Lao a URL the endpoint
  // answers with 400. An unlisted language has no online voice, and an empty URL says so.
  const lang = TTS_LANG[locale];
  if (!lang) return '';
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(t)}`;
}

// Locales for which the user has downloaded an offline audio pack. Populated by the
// app on boot / after a download so canSay() reports audio as available offline.
let savedPacks = new Set();
export function setSavedPacks(list) { savedPacks = new Set((list || []).map((s) => String(s).toLowerCase().split('-')[0])); }
export function hasPack(locale) { return !!locale && savedPacks.has(String(locale).toLowerCase().split('-')[0]); }

export function speakOnline(text, locale) {
  return new Promise((resolve, reject) => {
    // No locale (e.g. Hmong) means no online voice — do NOT fall back to English, which
    // would mispronounce the phrase. Reject so the caller suppresses audio.
    const url = ttsUrl(text, locale);
    if (!url) { reject(new Error('no voice for this language')); return; }
    // We do NOT hard-reject when offline: the service worker serves this URL from the
    // downloaded audio pack cache-first, so a saved phrase still plays with no signal.
    // If it is genuinely uncached and offline, the <audio> 'error' fires and we reject.
    try {
      const a = new Audio(url);
      // Same shared registry as the device-voice path (see speak()) — this is the ONLY
      // playback path that previously had no way to be stopped once started at all, since
      // an <audio> element started here was never held onto by the caller.
      const done = startPlayback(() => { try { a.pause(); } catch { /* ignore */ } });
      a.addEventListener('ended', () => { done(); resolve(true); });
      a.addEventListener('error', () => { done(); reject(new Error('audio failed')); });
      const p = a.play();
      if (p && p.then) p.then(() => resolve(true), (e) => { done(); reject(e); });
    } catch (e) { reject(e); }
  });
}

// Best path to pronounce `text` in `locale`: device voice if installed (works offline),
// otherwise the online fallback. Returns 'device' | 'online' | false.
export async function say(text, locale, opts = {}) {
  if (hasVoiceFor(locale) && speak(text, locale, opts)) return 'device';
  try { await speakOnline(text, locale); return 'online'; } catch { return false; }
}

// speak() runs a device voice a touch slow (0.9) so a listener can follow. phrasePlayer's
// speeds multiply that, so its 1× is exactly how a phrase has always sounded.
const DEVICE_RATE = 0.9;

// One phrase with play, pause, resume, stop and a live speed change — the Talk player. Takes
// the same route as say(): the device voice when one is installed (works offline), otherwise
// the online voice, which a downloaded audio pack also serves. onChange(state) reports
// 'playing', 'paused', 'idle' (finished or stopped) or 'failed'.
//
// Online audio is an <audio> element, so pause and speed are native and exact. The device voice
// is never paused natively: speechSynthesis.pause() is unreliable across browsers (see
// readAloudBar in ui-widgets.js), and a Pause that keeps talking is worse than a resume that
// repeats a word. So pausing cancels, and resuming speaks the rest from the start of the word it
// stopped on — or from the beginning, on voices that report no word boundaries. An utterance's
// rate is fixed once it starts, so a speed change mid-phrase restarts from the current word too.
// Every speak() here runs synchronously inside the caller's tap handler, as iOS requires.
export function phrasePlayer(text, locale, { rate = 1, onChange } = {}) {
  let state = 'idle';
  let how = null;     // 'device' | 'online', once started
  let done = null;    // the audio-control registration, held while playing AND while paused
  let audio = null;   // online: the <audio> element
  let utter = null;   // device: the live utterance — events from any other one are stale
  let at = 0;         // device: where the current word starts, which is where a resume picks up
  const set = (s) => { state = s; if (onChange) onChange(s); };
  const quiet = () => {
    if (how === 'online') { try { audio.pause(); } catch { /* ignore */ } return; }
    utter = null;   // first: some engines fire the cancelled utterance's error inside cancel()
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  };
  const end = (s) => {
    const d = done;
    done = null; audio = null; utter = null; how = null; at = 0;
    if (d) d();
    set(s);
  };
  // audio-control calls this when another sound starts or everything is stopped. It has already
  // let go of this registration, so end() must not hand it back.
  const halt = () => { done = null; quiet(); end('idle'); };
  const speakFrom = (i) => {
    const voice = pickVoice(locale);
    if (!voice) return false;
    const u = new SpeechSynthesisUtterance(text.slice(i));
    u.voice = voice;
    u.lang = voice.lang || locale;
    u.rate = Math.min(4, Math.max(0.5, DEVICE_RATE * rate));
    u.onboundary = (e) => { if (utter === u && typeof e.charIndex === 'number') at = i + e.charIndex; };
    u.onend = () => { if (utter === u) end('idle'); };
    u.onerror = (e) => { if (utter === u) end(e.error === 'interrupted' || e.error === 'canceled' ? 'idle' : 'failed'); };
    quiet();
    at = i;
    utter = u;
    window.speechSynthesis.speak(u);
    return true;
  };
  // A play() refused while still meant to be playing is a failure; one refused because Pause
  // got there first (AbortError) is not.
  const start = (a) => {
    const p = a.play();
    if (p && p.catch) p.catch(() => { if (audio === a && state === 'playing') end('failed'); });
  };
  const resume = () => {
    if (state !== 'paused') return;
    if (how === 'online') { set('playing'); start(audio); return; }
    if (!text.slice(at).trim()) { end('idle'); return; }
    if (speakFrom(at)) set('playing'); else end('failed');
  };
  const play = () => {
    if (state === 'playing') return;
    if (state === 'paused') { resume(); return; }
    const device = !!String(text || '').trim() && hasVoiceFor(locale);
    const url = device ? '' : ttsUrl(text, locale);
    if (!device && !url) { set('failed'); return; }
    how = device ? 'device' : 'online';
    done = startPlayback(halt);
    if (device) {
      if (speakFrom(0)) set('playing'); else end('failed');
      return;
    }
    const a = new Audio(url);
    // Both: load() resets playbackRate to defaultPlaybackRate, which would silently drop a
    // speed set on a clip that is still loading.
    a.defaultPlaybackRate = a.playbackRate = rate;
    a.addEventListener('ended', () => { if (audio === a) end('idle'); });
    a.addEventListener('error', () => { if (audio === a) end('failed'); });
    audio = a;
    set('playing');
    start(a);
  };
  const pause = () => { if (state === 'playing') { quiet(); set('paused'); } };
  const stop = () => { if (state === 'playing' || state === 'paused') { quiet(); end('idle'); } };
  const setRate = (r) => {
    rate = r;
    if (how === 'online') { audio.defaultPlaybackRate = audio.playbackRate = r; return; }
    if (how === 'device' && state === 'playing' && !speakFrom(at)) end('failed');
  };
  return { play, pause, stop, setRate, get state() { return state; } };
}

// Why audio is or is not available for this locale, so the interface can EXPLAIN rather than
// present a control that does nothing. `how` is the path that would actually produce sound.
//
// The old canSay() ended in `navigator.onLine !== false`, which is true on any connected
// device — so it answered yes for every language in the app, Lao included, and every caller
// rendered an enabled speaker on that answer. The check now has to name a real path.
export function audioSupport(locale) {
  if (!locale) return { can: false, how: null, why: 'This language has no written pronunciation guide or voice.' };
  if (hasVoiceFor(locale)) return { can: true, how: 'device', why: '' };
  if (hasPack(locale)) return { can: true, how: 'pack', why: '' };
  // `why` never repeats "no device voice" — every caller has already established that before
  // asking, and the phrasebook banner read as a stutter when both halves said it.
  if (!ttsUrl('x', locale)) {
    return { can: false, how: null, why: 'There is no online voice for it either — use the romanised pronunciation.' };
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { can: false, how: null, why: 'Connect to the internet, or download the audio pack, to hear it.' };
  }
  return { can: true, how: 'online', why: '' };
}

// Can we pronounce this locale at all right now (device voice, downloaded pack, or online)?
export function canSay(locale) { return audioSupport(locale).can; }
