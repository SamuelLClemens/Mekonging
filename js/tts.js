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
  if (!locale || !voices.length) return false;
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
export function speak(text, locale) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return false;
  if (!voices.length) refresh();
  const voice = pickVoice(locale || '');
  if (!voice) return false; // caller should have gated on hasVoiceFor()
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang || locale;
    u.rate = 0.9; // a touch slower so the listener can follow
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
export function speakOnline(text, locale) {
  return new Promise((resolve, reject) => {
    const t = (text || '').trim();
    if (!t) { reject(new Error('no text')); return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { reject(new Error('offline')); return; }
    const lang = TTS_LANG[locale] || (locale || 'en').split('-')[0];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(t.slice(0, 200))}`;
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
export async function say(text, locale) {
  if (hasVoiceFor(locale) && speak(text, locale)) return 'device';
  try { await speakOnline(text, locale); return 'online'; } catch { return false; }
}

// Can we pronounce this locale at all right now (device voice, or online)?
export function canSay(locale) {
  return hasVoiceFor(locale) || (typeof navigator === 'undefined' || navigator.onLine !== false);
}
