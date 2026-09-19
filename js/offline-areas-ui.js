// Shared "Save this map view for offline" card: the download/list/delete flow for offline
// map areas, used identically by Places' embedded map and the standalone map screen (js/screens/map.js).
// Extracted from places.js so real bug-fix history — quota handling, a restricted-context
// window.prompt() fallback, keeping saved-area records in sync with their cached tiles — is
// not maintained twice.
import { h } from './util.js';
import { getSavedAreas, addSavedArea, removeSavedArea, clearSavedAreas } from './state.js';
import { online, confirmAction, foldedCard } from './ui-widgets.js';

// `getCtrl()` returns the caller's current map.js controller, or null before it resolves —
// both consumers share that same "controller resolves asynchronously after this card already
// exists" shape. Returns { card, refresh } — append `card` and call `refresh()` once the
// controller resolves (to reveal the download button) and after anything else that changes
// what should be shown (a saved area added/removed elsewhere).
export function buildOfflineAreasCard(getCtrl, opts = {}) {
  const areasStatusP = h('p', { class: 'muted', style: 'margin: var(--sp-1) 0;font-size:13px' }, '');
  const storageLineP = h('p', { class: 'muted', style: 'margin: var(--sp-0h) 0 var(--sp-2);font-size:12px' }, '');
  const areasCard = h('div', { class: 'card' });
  const swAvailable = ('serviceWorker' in navigator) && !!navigator.serviceWorker.controller;

  // Reported gap: nothing here ever showed how much offline map data actually exists, or gave
  // a way to clear it in one action (only one area at a time). navigator.storage.estimate()
  // covers the whole origin (precached app shell + IndexedDB photos/audio too, not just map
  // tiles), so the line is worded as total offline storage rather than implying tiles-only.
  async function renderStorageLine() {
    storageLineP.textContent = '';
    const mapMod = await import('./map.js');
    const est = await mapMod.storageEstimate();
    if (!est) return; // navigator.storage.estimate unsupported — say nothing rather than guess
    const used = est.usageMB < 1 ? est.usageMB.toFixed(1) : String(Math.round(est.usageMB));
    storageLineP.textContent = `~${used} MB stored offline on this device (maps, photos, audio).`;
  }
  function estimateArea() {
    const ctrl = getCtrl();
    if (!ctrl) { areasStatusP.textContent = 'The map is still loading — try again in a moment.'; return; }
    const urls = ctrl.getDownloadTiles(1000);
    if (!urls.length) { areasStatusP.textContent = 'Nothing to save at this view — zoom in to an area first.'; return; }
    const viewInfo = ctrl.getViewInfo();
    const mbNum = urls.length * 0.018;
    const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
    areasStatusP.textContent = '';
    // Reported gap: no signal anywhere that connectivity affects this feature — a traveller
    // offline right now would only find out by trying. Non-blocking (a view already fully
    // cached from a previous save still completes fine with no connection), just upfront.
    const offlineNote = online() ? '' : ' You appear to be offline right now — this will only work for tiles you already have saved.';
    areasStatusP.append(
      `This view is about ${urls.length} map tiles (~${mb} MB).${offlineNote} `,
      h('button', { class: 'linklike', onclick: () => downloadArea(urls, viewInfo) }, 'Download now'),
      ' · ',
      h('button', { class: 'linklike', onclick: () => { areasStatusP.textContent = ''; } }, 'Cancel'),
    );
  }
  async function downloadArea(urls, viewInfo) {
    areasStatusP.textContent = `Saving ${urls.length} map tiles for offline…`;
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === 'PREFETCH_PROGRESS') { areasStatusP.textContent = `Saving map tiles… ${d.done}/${d.total}`; return; }
      if (d.type !== 'PREFETCH_DONE') return;
      navigator.serviceWorker.removeEventListener('message', onMsg);
      const ctrl = getCtrl();
      if (d.quotaHit) { areasStatusP.textContent = `Storage is full — saved ${d.ok} tiles before stopping. Remove a saved area below, then try a smaller view.`; return; }
      if (d.ok > 0 && viewInfo) {
        const def = (ctrl && ctrl.nearestCityName && ctrl.nearestCityName()) || 'Saved area';
        // Found live: some embedded/restricted browser contexts (confirmed here) don't support
        // window.prompt() at all — it THROWS rather than just being uncallable or cancellable.
        // Uncaught, that exception would skip addSavedArea() entirely: the tiles are genuinely
        // cached (d.ok > 0) but the traveller never sees a saved area, and the status text stays
        // stuck on "Saving…" forever with no error. Falls back to the same default name a
        // cancelled prompt already uses, so the save still completes either way.
        let name = def;
        try { name = (prompt('Name this offline area:', def) || def).trim() || def; } catch { /* prompt unsupported here — keep def */ }
        addSavedArea({ name, center: viewInfo.center, bounds: viewInfo.bounds, z: Math.floor(viewInfo.zoom), count: d.ok });
        areasStatusP.textContent = '';
      } else if (d.ok === 0) {
        // Reported gap: this used to go silently blank on total failure — from the traveller's
        // point of view, identical to the "saved fine" case above. Now it says plainly why
        // nothing is available offline, and distinguishes "you're offline" from "you're online
        // but the tile service itself didn't respond" instead of guessing which applies.
        areasStatusP.textContent = online()
          ? 'Nothing could be saved — the map service did not respond. Try again in a moment.'
          : 'Nothing could be saved — you need a connection to download new tiles. Reconnect and try again.';
      } else {
        areasStatusP.textContent = '';
      }
      renderAreasCard();
      renderStorageLine();
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    let protect = [];
    try {
      const ctrl = getCtrl();
      protect = getSavedAreas().flatMap((a) => (ctrl && ctrl.tileUrlsForArea) ? ctrl.tileUrlsForArea(a.bounds, a.z) : []);
    } catch { /* best-effort */ }
    navigator.serviceWorker.controller.postMessage({ type: 'PREFETCH_TILES', urls, protect });
  }
  function deleteArea(a) {
    removeSavedArea(a.id); renderAreasCard(); renderStorageLine();
    const ctrl = getCtrl();
    if (ctrl && swAvailable && a.bounds && navigator.serviceWorker.controller) {
      const urls = ctrl.tileUrlsForArea(a.bounds, a.z || 12, 1000);
      const onMsg = (e) => { if ((e.data || {}).type === 'DELETE_DONE') { navigator.serviceWorker.removeEventListener('message', onMsg); renderAreasCard(); renderStorageLine(); } };
      navigator.serviceWorker.addEventListener('message', onMsg);
      navigator.serviceWorker.controller.postMessage({ type: 'DELETE_TILES', urls });
    }
  }
  // Reported gap: clearing offline map data meant removing areas one at a time — no single
  // "start over" action. Clears both sides that need to stay in sync: the actual cached tiles
  // (js/map.js's clearTileCache(), the mk-tiles* Cache Storage entries) and the saved-area
  // RECORDS (state.js's clearSavedAreas()) — clearing only one would leave either orphaned
  // tiles with no listing, or listed areas pointing at tiles that no longer exist.
  function clearAllAreas() {
    confirmAction({
      title: 'Clear all offline map data?',
      body: 'This removes every saved area and its downloaded tiles from this device. You can save areas again any time you have a connection.',
      confirmLabel: 'Clear all', danger: true,
    }).then(async (ok) => {
      if (!ok) return;
      const mapMod = await import('./map.js');
      await mapMod.clearTileCache();
      clearSavedAreas();
      areasStatusP.textContent = '';
      renderAreasCard();
      renderStorageLine();
    });
  }
  function renderAreasCard() {
    areasCard.textContent = '';
    const dlBtn = h('button', { class: 'btn ghost', onclick: estimateArea }, '⬇ Save this map view for offline');
    if (!swAvailable || !getCtrl()) dlBtn.style.display = 'none';
    areasCard.append(dlBtn, areasStatusP);
    const areas = getSavedAreas();
    if (!areas.length) {
      areasCard.append(h('p', { class: 'muted' }, 'Save the view above to use the satellite/street map with no signal. Each area you save is listed here and can be removed on its own.'));
      areasCard.append(storageLineP);
      return;
    }
    areas.forEach((a) => {
      const mbNum = (a.count || 0) * 0.018;
      const mb = mbNum < 10 ? mbNum.toFixed(1) : String(Math.round(mbNum));
      areasCard.append(h('div', { class: 'row-between price-item' }, [
        h('div', {}, [h('strong', {}, a.name), h('div', { class: 'muted', style: 'font-size:12px' }, `${a.count || 0} tiles · ~${mb} MB · saved ${a.savedAt}`)]),
        h('div', { class: 'cats' }, [
          h('button', { class: 'chip', title: 'Show on map', 'aria-label': `Show ${a.name} on map`, onclick: () => { const ctrl = getCtrl(); if (ctrl && a.center) ctrl.flyTo(a.center.lng, a.center.lat, a.z || 12); } }, '◎'),
          h('button', { class: 'chip', 'aria-label': `Delete ${a.name}`, onclick: () => { confirmAction({ title: `Delete offline maps for ${a.name}?`, body: `This deletes ~${mb} MB of downloaded map tiles. You will need a connection to view this area offline again.`, confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) deleteArea(a); }); } }, '✕'),
        ]),
      ]));
    });
    areasCard.append(storageLineP, h('button', { class: 'btn ghost btn-spaced', onclick: clearAllAreas }, '🗑 Clear all offline map data'));
  }
  renderAreasCard();
  renderStorageLine();
  const card = foldedCard(opts.title || '🗂️ Saved offline areas', areasCard, opts.key || 'placesAreasOpen', false);
  return { card, refresh: () => { renderAreasCard(); renderStorageLine(); } };
}
