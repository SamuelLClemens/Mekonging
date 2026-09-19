// Shared "one thing plays at a time" registry for every sound the app makes — phrase/translate
// speech (tts.js), and animal-call recordings (main.js). Two independent Audio/SpeechSynthesis
// systems existed with no way to stop either one once started (the online Google Translate TTS
// path in particular has no pause/cancel control of its own), so a traveller who tapped a
// speaker by accident, or needed to go quiet immediately, had no way to do so except waiting it
// out. This module gives every playback call site a single place to register how to stop
// itself, and gives the UI a single place to ask "is anything playing" and "stop it".

let stopFn = null;
const listeners = new Set();

function notify() {
  const playing = !!stopFn;
  listeners.forEach((cb) => { try { cb(playing); } catch { /* ignore */ } });
}

// Call when playback starts. Stops whatever was previously registered (only one thing plays
// at a time app-wide, same rule main.js's animal-call audio already followed on its own).
// Returns a `done` function the caller must call when ITS playback ends naturally (success or
// error) so state does not falsely stay "playing" — guarded so a stale done() from a playback
// that was already stopped/superseded cannot clear a newer one's state.
export function startPlayback(fn) {
  if (stopFn) { try { stopFn(); } catch { /* ignore */ } }
  stopFn = fn;
  notify();
  return () => { if (stopFn === fn) { stopFn = null; notify(); } };
}

// Stop whatever is currently playing, if anything. Safe to call when nothing is playing.
export function stopPlayback() {
  if (!stopFn) return;
  const fn = stopFn;
  stopFn = null;
  notify();
  try { fn(); } catch { /* ignore */ }
}

export function isPlaying() { return !!stopFn; }

// Subscribe to playing-state changes. Returns an unsubscribe function.
export function onPlaybackChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
