// Speech input (Web Speech API recognition), shared by Talk's single box and its face-to-face mode.
//
// The traveller decides when they have finished speaking, not the engine: it listens through
// pauses, hands the words over as they are recognised and stops on finish(). Recognition mishears
// names, numbers and noisy streets, so nothing here ever sends text anywhere on its own.

// One transcript from a continuous recognition session's result list. Desktop engines send
// each phrase as its own result ("where is the bus station", "and how much is it"), so those
// are joined. Android Chrome instead re-sends the growing sentence as a NEW result each time
// ("where", "where is", "where is the bus station"), so a result that repeats the previous one
// word-for-word and carries on replaces it rather than being appended after it.
export function joinSpeechResults(results) {
  const parts = [];
  for (let i = 0; i < results.length; i++) {
    const t = String((results[i] && results[i][0] && results[i][0].transcript) || '').trim();
    if (!t) continue;
    const last = parts.length ? parts[parts.length - 1].toLowerCase() : null;
    const cur = t.toLowerCase();
    if (last != null && (cur === last || cur.startsWith(last + ' '))) parts[parts.length - 1] = t;
    else if (last != null && last.startsWith(cur + ' ')) continue;
    else parts.push(t);
  }
  return parts.join(' ');
}

export function speechCtor() {
  return (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) : null;
}

// The reason codes the engine reports, as short sentences. `language-not-supported` is the one
// that means "this phone cannot listen in that language"; the caller then offers typing only.
export const MIC_ERRORS = {
  'not-allowed': 'Microphone blocked. Allow it for this site in your browser settings.',
  'service-not-allowed': 'Microphone blocked. Allow it for this site in your browser settings.',
  'audio-capture': 'No microphone found on this device.',
  'network': 'Voice input needs a connection on this device.',
  'no-speech': 'No speech heard. Tap the microphone and try again.',
  'language-not-supported': 'This device cannot take voice input in that language.',
};

const SILENCE_MS = 15000;    // safety stop for a microphone left open by mistake
const STOP_GRACE_MS = 1500;  // how long stop() may take to deliver its final words

// One dictation controller. `locale` is a function so the language can change between turns.
//   onText(text)   the words heard so far (the whole utterance, replacing the last call)
//   onState(on)    true while listening
//   onError(code)  an engine error code (a key of MIC_ERRORS, or another)
// Returns { start, finish, abort, listening }. finish() resolves once the microphone is off.
export function createDictation({ locale, onText, onState, onError }) {
  const SR = speechCtor();
  let rec = null;
  let silenceTimer = 0;
  let graceTimer = 0;
  let settle = null;

  const done = () => {
    clearTimeout(silenceTimer);
    clearTimeout(graceTimer);
    window.removeEventListener('hashchange', abort);
    rec = null;
    if (onState) onState(false);
    if (settle) { const s = settle; settle = null; s(); }
  };
  // Leaving the screen must switch the microphone off, not leave it running behind the next one.
  function abort() { const r = rec; done(); if (r) { try { r.abort(); } catch { /* already ended */ } } }
  const armSilence = () => { clearTimeout(silenceTimer); silenceTimer = setTimeout(() => finish(), SILENCE_MS); };
  function finish() {
    if (!rec) return Promise.resolve();
    const r = rec;
    const p = new Promise((res) => { const prev = settle; settle = () => { if (prev) prev(); res(); }; });
    if (!graceTimer) {
      try { r.stop(); } catch { done(); return p; }
      // Safari on iPhone can take its time delivering the last words after stop(), or never
      // report the end at all. Whatever already reached the caller is kept either way.
      graceTimer = setTimeout(() => { if (rec === r) { done(); try { r.abort(); } catch { /* ended */ } } }, STOP_GRACE_MS);
    }
    return p;
  }
  function start() {
    if (!SR || rec) return false;
    const r = new SR();
    r.lang = locale() || 'en-US';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      if (rec !== r) return;
      const text = joinSpeechResults(e.results);
      if (text && onText) onText(text);
      armSilence();
    };
    r.onerror = (e) => { if (rec === r && onError) onError(e.error); };
    r.onend = () => { if (rec === r) done(); };
    rec = r;
    graceTimer = 0;
    if (onState) onState(true);
    armSilence();
    window.addEventListener('hashchange', abort);
    try { r.start(); } catch { abort(); return false; }
    return true;
  }
  return { start, finish, abort, get listening() { return !!rec; } };
}
