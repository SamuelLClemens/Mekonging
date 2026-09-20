// The standalone offline map: the whole region at once, with borders, hospitals and
// satellite/street imagery as independently toggleable layers, plus the measure tool,
// offline name search, "keep screen on" and offline-area downloads — every mode-independent
// capability map.js's controller exposes, in one place, reachable with no other screen open.
//
// This is `initMap`'s "full mode" (opts.places omitted): a code path kept alive specifically
// for this screen (see map.js's own comments on embed vs. full mode) but with no live caller
// until now. Curated places (stay/food/etc.) are deliberately NOT shown here — they are
// DOM-marker-based and country-scoped by every existing caller, and showing all four
// countries' places at once on a region-wide map would multiply redraw cost for a screen whose
// whole value is being fast and reliable with no signal. Places already owns that job, with
// filters and a shortlist; this screen links to it instead of duplicating it.
import { getLiveCleanup, setLiveCleanup } from '../app-state.js';
import { store, save, setLastFix } from '../state.js';
import { h } from '../util.js';
import { screenHint, foldedCard } from '../ui-widgets.js';
import { buildOfflineAreasCard } from '../offline-areas-ui.js';
import { mount, topbar } from '../main.js';

export function mapScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Full offline map', '#home'));
  wrap.append(screenHint('Every country in one place — borders, hospitals and satellite or street imagery, working with no signal once opened or downloaded. Looking for places to stay, eat or visit? → Places has those, with filters and a shortlist.'));

  let mapCtrl = null;
  const mapLayersPrefs = store.profile.prefs.mapLayers || (store.profile.prefs.mapLayers = { borders: true });

  // ---- Map / Satellite style ------------------------------------------------------
  const satOn = mapLayersPrefs.satellite !== false;
  const mapBtn = h('button', { class: 'chip', 'aria-pressed': satOn ? 'false' : 'true', onclick: () => setSat(false) }, '🗺 Map');
  const satBtn = h('button', { class: 'chip', 'aria-pressed': satOn ? 'true' : 'false', onclick: () => setSat(true) }, '🛰 Satellite');
  function setSat(on) {
    mapLayersPrefs.satellite = on; save();
    mapBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
    satBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (mapCtrl) mapCtrl.setSatellite(on);
  }

  // Same store.profile.prefs.mapLayers object Places' own "🛠 More map tools" fold reads/
  // writes, so borders/hospitals are one shared setting rather than two independent toggles.
  const bordersCheck = h('input', { type: 'checkbox', checked: mapLayersPrefs.borders !== false ? '' : null,
    onchange: (e) => { mapLayersPrefs.borders = e.target.checked; save(); if (mapCtrl) mapCtrl.setBorders(e.target.checked); } });
  const hospitalsCheck = h('input', { type: 'checkbox', checked: mapLayersPrefs.hospitals === true ? '' : null,
    onchange: (e) => { mapLayersPrefs.hospitals = e.target.checked; save(); if (mapCtrl) mapCtrl.setHospitals(e.target.checked); } });
  const atmsCheck = h('input', { type: 'checkbox', checked: mapLayersPrefs.atms === true ? '' : null,
    onchange: (e) => { mapLayersPrefs.atms = e.target.checked; save(); if (mapCtrl) mapCtrl.setAtms(e.target.checked); } });
  const busCheck = h('input', { type: 'checkbox', checked: mapLayersPrefs.buses === true ? '' : null,
    onchange: (e) => { mapLayersPrefs.buses = e.target.checked; save(); if (mapCtrl) mapCtrl.setBus(e.target.checked); } });

  // ---- Measure tool -----------------------------------------------------------------
  let measuring = false;
  const measureOut = h('p', { class: 'map-hint', style: 'margin: var(--sp-2) 0 0;display:none' }, '');
  const fmtKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`);
  function toggleMeasure() {
    if (!mapCtrl) return;
    measuring = !measuring;
    if (measuring) {
      measureBtn.textContent = '📏 Measuring — tap the map'; measureBtn.classList.add('toggle-on');
      measureOut.style.display = ''; measureOut.textContent = 'Tap two or more points on the map to measure the distance.';
      mapCtrl.toggleMeasure(true, (km, n) => {
        measureOut.textContent = n < 2 ? 'Tap another point to measure…'
          : `Distance: ${fmtKm(km)} over ${n} points. Tap to extend, or tap “Measure” again to finish.`;
      });
    } else {
      measureBtn.textContent = '📏 Measure'; measureBtn.classList.remove('toggle-on');
      measureOut.style.display = 'none';
      mapCtrl.toggleMeasure(false);
    }
  }
  const measureBtn = h('button', { class: 'btn ghost', onclick: toggleMeasure }, '📏 Measure');

  // ---- Keep screen on (Wake Lock), ported verbatim from Places' own copy ----------------
  let wakeLock = null, wantWake = false;
  const wakeBtn = h('button', { class: 'btn ghost', onclick: toggleWake }, '🔆 Keep screen on');
  if (!('wakeLock' in navigator)) wakeBtn.style.display = 'none';
  async function acquireWake() {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  }
  async function toggleWake() {
    if (wantWake) {
      wantWake = false;
      try { if (wakeLock) await wakeLock.release(); } catch { /* already gone */ }
      wakeLock = null; wakeBtn.textContent = '🔆 Keep screen on'; wakeBtn.classList.remove('toggle-on');
    } else {
      try { await acquireWake(); wantWake = true; wakeBtn.textContent = '🔆 Screen stays on'; wakeBtn.classList.add('toggle-on'); }
      catch { /* denied — leave the button in its off state */ }
    }
  }
  const onVis = () => { if (wantWake && wakeLock === null && document.visibilityState === 'visible') acquireWake().catch(() => { /* denied */ }); };
  document.addEventListener('visibilitychange', onVis);

  // ---- Offline name search: cities, curated places, pools and pins, across all countries ---
  const searchResults = h('div', { class: 'map-search-results' });
  const SEARCH_ICON = { City: '🏙️', Place: '📍', Pool: '🏊', Pin: '📌' };
  function runSearch() {
    searchResults.textContent = '';
    const q = searchInput.value.trim();
    if (!mapCtrl || q.length < 2) return;
    const matches = mapCtrl.search(q);
    if (!matches.length) { searchResults.append(h('p', { class: 'muted', style: 'padding: var(--sp-1h) var(--sp-1);font-size:13px' }, 'No matches in the offline data.')); return; }
    matches.forEach((m) => searchResults.append(
      h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:flex-start', onclick: () => {
        mapCtrl.flyTo(m.lng, m.lat, m.z);
        searchResults.textContent = ''; searchInput.value = '';
      } }, `${SEARCH_ICON[m.type] || '•'}  ${m.name}  ·  ${m.type}`)));
  }
  const searchInput = h('input', { type: 'search', class: 'map-search', placeholder: 'Search any city or place, in any country…', 'aria-label': 'Search the map', autocomplete: 'off', oninput: runSearch });

  const toolsCard = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;align-items:center;gap: var(--sp-3)' }, [
      h('div', { class: 'chips', style: 'margin:0' }, [mapBtn, satBtn]),
      h('label', { style: 'display:flex;align-items:center;gap: var(--sp-1h);min-height:24px;font-size:14px;cursor:pointer' }, [bordersCheck, h('span', {}, '🗺️ Country borders')]),
      h('label', { style: 'display:flex;align-items:center;gap: var(--sp-1h);min-height:24px;font-size:14px;cursor:pointer' }, [hospitalsCheck, h('span', {}, '🏥 Hospitals')]),
      h('label', { style: 'display:flex;align-items:center;gap: var(--sp-1h);min-height:24px;font-size:14px;cursor:pointer' }, [atmsCheck, h('span', {}, '🏧 Lowest-fee ATMs')]),
      h('label', { style: 'display:flex;align-items:center;gap: var(--sp-1h);min-height:24px;font-size:14px;cursor:pointer' }, [busCheck, h('span', {}, '🚌 Bus stops')]),
      measureBtn,
      wakeBtn,
      h('button', { class: 'btn ghost', onclick: () => { if (mapCtrl) mapCtrl.triggerLocate(); } }, '📍 Locate me'),
    ]),
    measureOut,
  ]);
  wrap.append(foldedCard('🛠 Map layers & tools', toolsCard, 'mapToolsOpen', true));

  // ---- Offline walking directions ---------------------------------------------------
  // Routed on-device from a pedestrian graph (js/walk-route.js). Coverage is per city core,
  // so the card says plainly where it works rather than failing mysteriously elsewhere.
  let picking = false;
  const walkOut = h('div', { style: 'margin-top: var(--sp-2)' });
  const pickBtn = h('button', { class: 'btn ghost', onclick: () => setPicking(!picking) }, '🎯 Set destination');
  const clearBtn = h('button', { class: 'btn ghost', style: 'display:none', onclick: clearWalk }, '✕ Clear');

  function setPicking(on) {
    picking = on;
    pickBtn.textContent = on ? '🎯 Tap the map…' : '🎯 Set destination';
    pickBtn.classList.toggle('toggle-on', on);
    if (on) walkOut.textContent = 'Tap your destination on the map.';
  }

  function clearWalk() {
    setPicking(false);
    walkOut.textContent = '';
    clearBtn.style.display = 'none';
    if (mapCtrl) mapCtrl.setWalkRoute(null);
  }

  const fmtMins = (s) => (s < 60 ? 'under a minute' : `${Math.round(s / 60)} min`);

  async function routeTo(dest) {
    setPicking(false);
    const fix = store.profile.prefs.lastFix;
    if (!fix) { walkOut.textContent = 'Tap “Locate me” first — walking directions start from where you are.'; return; }
    walkOut.textContent = 'Working out the route…';
    const mod = await import('../walk-route.js');
    const res = await mod.routeWalk({ lat: fix.lat, lng: fix.lng }, dest);
    walkOut.textContent = '';

    if (!res.ok) {
      const why = res.reason === 'destination-outside'
        ? 'That destination is outside the walking data for this area.'
        : res.reason === 'no-path'
          ? 'No walking path connects those two points in the mapped network.'
          : `Walking directions are not available here yet. Covered so far: ${mod.WALK_AREAS.map((a) => a.label).join(', ')}.`;
      walkOut.append(h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, why));
      return;
    }

    clearBtn.style.display = '';
    mapCtrl.setWalkRoute(res.coords);
    walkOut.append(h('p', { style: 'margin:0 0 var(--sp-1h);font-weight:700' },
      `🚶 ${(res.metres / 1000).toFixed(res.metres < 1000 ? 2 : 1)} km · about ${fmtMins(res.seconds)}`));
    // The snap distances are the walk to and from the mapped path network. Shown when they are
    // large enough to matter, because the route genuinely does not start at the door.
    if (res.snapStart > 60 || res.snapEnd > 60) {
      walkOut.append(h('p', { class: 'muted', style: 'margin:0 0 var(--sp-1h);font-size:12px' },
        `Starts ${res.snapStart} m and ends ${res.snapEnd} m from the nearest mapped path.`));
    }
    const list = h('ol', { class: 'walk-steps' });
    res.instructions.forEach((s) => list.append(
      h('li', {}, s.metres ? `${s.text} · ${s.metres} m` : s.text)));
    walkOut.append(list);
  }

  const walkCard = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;gap: var(--sp-2)' }, [pickBtn, clearBtn]),
    walkOut,
  ]);
  wrap.append(foldedCard('🚶 Walking directions (offline)', walkCard, 'mapWalkOpen', false));
  wrap.append(h('div', { class: 'map-search-wrap', style: 'margin: var(--sp-2) 0 var(--sp-0h)' }, [searchInput, searchResults]));

  const mapSection = h('div', { class: 'places-map-section' });
  const canvas = h('div', { class: 'places-map' });
  mapSection.append(canvas);
  wrap.append(mapSection);

  const areasUI = buildOfflineAreasCard(() => mapCtrl, { title: '🗂️ Saved offline areas', key: 'mapAreasOpen' });
  wrap.append(areasUI.card);

  mount(wrap, '#map');

  import('../map.js').then((m) => m.initMap(canvas, {
    onLocate: (fix) => setLastFix(fix),
    // Only consumed while the walking card is actively waiting for a destination, so a normal
    // tap on the map keeps its existing meaning.
    onMapClick: (pt) => { if (picking) routeTo(pt); },
  })).then((c) => {
    mapCtrl = c;
    const prevCleanup = getLiveCleanup();
    setLiveCleanup(() => {
      try { if (prevCleanup) prevCleanup(); } catch { /* noop */ }
      try { c.dispose(); } catch { /* noop */ }
      wantWake = false;
      document.removeEventListener('visibilitychange', onVis);
      if (wakeLock) { try { wakeLock.release(); } catch { /* noop */ } wakeLock = null; }
    });
    // Full mode leaves the style's own default alone at construction (see map.js) — apply the
    // traveller's real persisted layer prefs now that the controller exists.
    c.setSatellite(satOn);
    c.setBorders(mapLayersPrefs.borders !== false);
    if (mapLayersPrefs.hospitals === true) c.setHospitals(true);
    if (mapLayersPrefs.atms === true) c.setAtms(true);
    if (mapLayersPrefs.buses === true) c.setBus(true);
    areasUI.refresh();
  }).catch(() => {
    canvas.replaceWith(h('p', { class: 'muted', style: 'padding: var(--sp-3) var(--sp-3)' }, 'The map could not start here.'));
  });
}
