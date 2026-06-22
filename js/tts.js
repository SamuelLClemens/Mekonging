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
