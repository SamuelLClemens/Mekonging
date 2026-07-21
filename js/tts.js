// Tap-to-speak via the device Web Speech API (speechSynthesis). Offline on most
// devices once voices are installed. Thai and Vietnamese voices are common;
// Khmer (km) and Lao (lo) are frequently ABSENT — callers must handle that
// gracefully (show script + romanisation, disable the speaker control).

let voices = [];

function refresh() {
  try { voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; }
  catch { voices = []; }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  refresh();
  // Voices often load asynchronously; repopulate when they arrive.
  try { window.speechSynthesis.addEventListener('voiceschanged', refresh); } catch { /* older API */ }
}

// Is there a device voice that can speak this BCP-47 locale (e.g. 'th-TH')?
export function hasVoiceFor(locale) {
  if (!locale) return false;
  if (!voices.length) refresh();   // voices often load async on Chromium; re-read on demand
  if (!voices.length) return false;
  const lang = locale.toLowerCase();
  const base = lang.split('-')[0];
  return voices.some((v) => {
    const vl = (v.lang || '').toLowerCase();
    return vl === lang || vl.split('-')[0] === base;
  });
}

function pickVoice(locale) {
  const lang = locale.toLowerCase();
  const base = lang.split('-')[0];
  return voices.find((v) => (v.lang || '').toLowerCase() === lang)
      || voices.find((v) => (v.lang || '').toLowerCase().split('-')[0] === base)
      || null;
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
    if (opts.onend) u.onend = opts.onend;
    if (opts.onerror) u.onerror = opts.onerror;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stop() {
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* ignore */ }
}

// Online voice fallback for languages with NO device voice (Khmer and Lao are almost
// always missing). Uses Google Translate's TTS over an <audio> element (audio playback
// is not CORS-restricted; the origin must be in the page CSP media-src). Needs the
// network. Returns a Promise that resolves when playback starts/ends, rejects otherwise.
const TTS_LANG = { 'th-TH': 'th', 'vi-VN': 'vi', 'km-KH': 'km', 'lo-LA': 'lo', 'he-IL': 'iw', 'en-US': 'en' };

// The exact online-TTS URL for a phrase. Exported so the offline "audio pack"
// prefetch (service worker) and live playback build the IDENTICAL cache key.
export function ttsUrl(text, locale) {
  const t = (text || '').trim().slice(0, 200);
  if (!t || !locale) return '';
  const lang = TTS_LANG[locale] || locale.split('-')[0];
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
      a.addEventListener('ended', () => resolve(true));
      a.addEventListener('error', () => reject(new Error('audio failed')));
      const p = a.play();
      if (p && p.then) p.then(() => resolve(true), (e) => reject(e));
    } catch (e) { reject(e); }
  });
}

// Best path to pronounce `text` in `locale`: device voice if installed (works offline),
// otherwise the online fallback. Returns 'device' | 'online' | false.
export async function say(text, locale, opts = {}) {
  if (hasVoiceFor(locale) && speak(text, locale, opts)) return 'device';
  try { await speakOnline(text, locale); return 'online'; } catch { return false; }
}

// Can we pronounce this locale at all right now (device voice, or online)?
// No locale (e.g. Hmong) => no audio: there is no online voice to fall back to.
export function canSay(locale) {
  if (!locale) return false;
  return hasVoiceFor(locale) || hasPack(locale) || (typeof navigator === 'undefined' || navigator.onLine !== false);
}
