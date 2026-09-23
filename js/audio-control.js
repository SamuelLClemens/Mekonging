// Shared "one thing plays at a time" registry for every sound the app makes — phrase/translate
// speech (tts.js), and animal-call recordings (main.js). Two independent Audio/SpeechSynthesis
// systems existed with no way to stop either one once started (the online Google Translate TTS
// path in particular has no pause/cancel control of its own), so a traveller who tapped a
// speaker by accident, or needed to go quiet immediately, had no way to do so except waiting it
// out. This module gives every playback call site a single place to register how to stop
// itself, and gives the UI a single place to ask "is anything playing" and "stop it" — each
// button that starts a sound or a translation wires its OWN stop control through here (see
// wireSpeak() in js/screens/phrasebook.js and playCall() in js/main.js) rather than a shared
// floating control, so onPlaybackChange below is what lets a button revert itself the moment
// its own playback ends, is superseded, or is stopped elsewhere.

// Cancellable NON-SOUND work registers here too, for the same reason sound does: a live
// translation is a thing the app is doing to the traveller's phone that they cannot call off.
// A long phrase is now split into several requests, each with a retry, so "Translating…" can
// sit there for seconds on a weak link with no way out but waiting — the exact complaint that
// created this module for audio.
let stopFn = null;
let taskFn = null;
const listeners = new Set();

function notify() {
  const active = !!stopFn || !!taskFn;
  listeners.forEach((cb) => { try { cb(active); } catch { /* ignore */ } });
}

// Register cancellable in-flight work (currently: a live translation). Unlike startPlayback
// this does NOT supersede sound — the two are independent, and translating should not silence
// a phrase the traveller deliberately started playing.
export function startTask(fn) {
  if (taskFn) { try { taskFn(); } catch { /* ignore */ } }
  taskFn = fn;
  notify();
  return () => { if (taskFn === fn) { taskFn = null; notify(); } };
}

export function stopTask() {
  if (!taskFn) return;
  const fn = taskFn;
  taskFn = null;
  notify();
  try { fn(); } catch { /* ignore */ }
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

export function isPlaying() { return !!stopFn || !!taskFn; }

// Subscribe to playing-state changes. Returns an unsubscribe function.
export function onPlaybackChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
