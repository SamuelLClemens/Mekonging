// F8: a position when the app returns to the foreground.
//
// The `visibilitychange` handlers in js/main.js check for a new release and sync live data; none asked for a position. An installed
// iPhone app is suspended between uses and resumed, not reopened, so the position watch (started once, at launch) can sit on a fix
// taken yesterday. This reads a new one on the way back, and when an Emergency or Home screen opens with an old fix.
//
// The rule it must keep (owner, 2026-10-24, restated 2026-11-16 for the Home Screen app): the browser's permission dialog is raised
// by a tap, never here. So a position is read only where the Permissions API answers `granted`. Where it answers `prompt` (an install
// that forgets the answer, or a traveller who never gave one) nothing happens here, and the old-location note offers a button.
// `unknown` (no Permissions API, or the query threw) is also left alone: an unanswered permission would raise the dialog.
import { getLastFix, fixAgeMs, isFixOld } from './state.js';
import { geolocate } from './util.js';
import { noteLocationError } from './fix-age.js';

const MIN_GAP_MS = 20000;             // two returns inside this are one: a notification shade flickers visibility
const WORTH_REFRESHING_MS = 120000;   // a fix younger than this is as good as a new one

let hooks = null;   // { takeFix(coords), startWatch(), redraw() } from js/main.js
let lastTry = 0;
let busy = false;

async function permissionState() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'none';
  if (!(navigator.permissions && navigator.permissions.query)) return 'unknown';
  try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'unknown'; }
}

// Read a position now if the permission is held and the stored fix is worth replacing. `force` (the Settings "Check again" button)
// skips the gap and the freshness test. Resolves true when a fix was stored.
export async function freshen(reason = 'foreground', force = false) {
  if (!hooks || busy) return false;
  const now = Date.now();
  if (!force && now - lastTry < MIN_GAP_MS) return false;
  const fix = getLastFix();
  const age = fixAgeMs(fix, now);
  if (!force && fix && age != null && age < WORTH_REFRESHING_MS) return false;
  if ((await permissionState()) !== 'granted') return false;
  busy = true; lastTry = now;
  try {
    hooks.startWatch();   // idempotent; a grant that arrived while the app was away has no watch yet
    const pos = await geolocate({ enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    hooks.takeFix(pos);   // the same path as a watch callback: stores it, adopts it, redraws a screen that showed the old one
    return true;
  } catch (e) {
    if (noteLocationError(e) && isFixOld(getLastFix())) hooks.redraw();
    return false;
  } finally {
    busy = false;
  }
}

export function initFixRefresh(h) {
  if (hooks || typeof document === 'undefined') return;
  hooks = h;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) freshen('foreground'); });
  // A page restored from the back-forward cache gets no visibilitychange on some versions of Safari.
  window.addEventListener('pageshow', (e) => { if (e.persisted) freshen('pageshow'); });
}
