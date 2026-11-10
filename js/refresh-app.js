// Reload the app onto the newest release, for a screen that cannot work on the build that is running.
//
// A plain location.reload() is not enough. The service worker serves main.js and every other
// module cache-first, and a changed file is dropped from its cache only when the NEW worker
// activates. A reload taken before that moment brings the same old files back, and the traveller
// sees nothing happen (the Talk "Refresh to use face to face" button, iPhone Home Screen app,
// 2026-11-10). So this asks for the new worker, waits for it to activate, and only then reloads.
//
// `hard` is the second attempt: it removes the worker and its shell cache (never the map tiles,
// the phrase audio or the field-guide media) so the reload loads straight from the network and a
// fresh worker is installed. It needs a connection and is skipped without one.

const UPDATE_WAIT_MS = 8000;      // the sw.js byte-check
const ACTIVATE_WAIT_MS = 12000;   // install, skipWaiting, activate (reconcile runs inside it)
const SHELL_CACHE = 'mk-shell';   // sw.js SHELL_CACHE

function within(promise, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    promise.then(() => { clearTimeout(t); resolve(); }, () => { clearTimeout(t); resolve(); });
  });
}

function activated(worker) {
  return new Promise((resolve) => {
    if (!worker || worker.state === 'activated') { resolve(); return; }
    const t = setTimeout(resolve, ACTIVATE_WAIT_MS);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated' || worker.state === 'redundant') { clearTimeout(t); resolve(); }
    });
  });
}

export async function refreshApp({ hard = false } = {}) {
  try {
    const reg = ('serviceWorker' in navigator) ? await navigator.serviceWorker.getRegistration() : null;
    if (reg && hard && navigator.onLine !== false) {
      await within(reg.unregister(), UPDATE_WAIT_MS);
      if (typeof caches !== 'undefined') await within(caches.delete(SHELL_CACHE), UPDATE_WAIT_MS);
    } else if (reg) {
      await within(reg.update(), UPDATE_WAIT_MS);
      await activated(reg.installing || reg.waiting);
    }
  } catch { /* fall through to the reload */ }
  location.reload();
}
