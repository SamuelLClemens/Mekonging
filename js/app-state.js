// Cross-cutting state read or written by nearly every screen in main.js, and by every
// section module extracted out of it (js/screens/*.js — see OVERHAUL.md section 2). Lives
// here, not in main.js, specifically so a screen module never has to import main.js to reach
// it — that would create a circular-import web as each section leaves the file in turn.
//
// Both pieces of state are kept behind get/set functions rather than a bare exported `let`:
// an ES module import is a read-only live binding, so an importing module can see a live
// value change but cannot assign to it directly — only the module that declares it can.

// ---- Active country ---------------------------------------------------------
// The traveller's current destination context (a country id: 'th' | 'vi' | 'kh' | 'la').
// Written from ~20 screens whenever the traveller picks or is detected in a country; read
// from nearly every screen to scope places/prices/routes/etc to that country.
let activeCountry = null;
export function getActiveCountry() { return activeCountry; }
export function setActiveCountry(cc) { activeCountry = cc; }

// ---- Live-screen teardown ----------------------------------------------------
// The router's per-screen cleanup protocol for anything a screen leaves running after the
// traveller navigates away: a map's WebGL context + GPS watcher (liveMapCtrl), or anything
// else — a wake lock, a mic stream, an object URL — via the more general liveCleanup callback.
let liveMapCtrl = null;   // the map controller for the current #map view, if any
let liveCleanup = null;   // per-screen teardown (e.g. release the screen wake lock)
export function getLiveMapCtrl() { return liveMapCtrl; }
export function setLiveMapCtrl(ctrl) { liveMapCtrl = ctrl; }
export function getLiveCleanup() { return liveCleanup; }
export function setLiveCleanup(fn) { liveCleanup = fn; }
// Called once per render(), before the next screen builds. Disposes any live map (frees the
// WebGL context, stops the GPS watcher) and runs any other pending per-screen cleanup, then
// resets both so a screen that needs neither starts clean.
export function teardownLiveScreen() {
  if (liveMapCtrl) { try { liveMapCtrl.dispose(); } catch { /* noop */ } liveMapCtrl = null; }
  if (liveCleanup) { try { liveCleanup(); } catch { /* noop */ } liveCleanup = null; }
}
