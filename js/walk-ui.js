// Shared "Walking directions (offline)" card: pick a destination on the map, get a routed
// pedestrian path drawn on it plus turn-by-turn steps, with no network at route time.
//
// Extracted from js/screens/map.js and given to Places' embedded map too. It shipped on the
// standalone #map screen only, which is the map almost nobody opens — Places is the map a
// traveller actually has in front of them, so from there the feature simply did not appear to
// exist. Same reasoning, and the same shape, as buildOfflineAreasCard in js/offline-areas-ui.js:
// one implementation, two callers, so the routing/snap/error wording cannot drift apart.
import { h } from './util.js';
import { store } from './state.js';
import { foldedCard } from './ui-widgets.js';

const fmtMins = (s) => (s < 60 ? 'under a minute' : `${Math.round(s / 60)} min`);

// `getCtrl()` returns the caller's map.js controller, or null before it resolves — the same
// "controller arrives after the card is built" shape both screens already have.
//
// Returns { card, handleMapClick, reset }:
//   card           — append it wherever the screen wants the control to live
//   handleMapClick — pass every map tap to it; it returns true when it consumed the tap as a
//                    destination pick, so a normal tap keeps its existing meaning otherwise
//   reset          — clear the drawn line and any shown route (used on screen teardown)
export function buildWalkCard(getCtrl, opts = {}) {
  const { key = 'mapWalkOpen', defaultOpen = false } = opts;

  let picking = false;
  const out = h('div', { style: 'margin-top: var(--sp-2)' });
  const pickBtn = h('button', { class: 'btn ghost', onclick: () => setPicking(!picking) }, '🎯 Set destination');
  const clearBtn = h('button', { class: 'btn ghost', style: 'display:none', onclick: clearWalk }, '✕ Clear');

  function setPicking(on) {
    picking = on;
    pickBtn.textContent = on ? '🎯 Tap the map…' : '🎯 Set destination';
    pickBtn.classList.toggle('toggle-on', on);
    if (on) out.textContent = 'Tap your destination on the map.';
  }

  function clearWalk() {
    setPicking(false);
    out.textContent = '';
    clearBtn.style.display = 'none';
    const ctrl = getCtrl();
    if (ctrl) ctrl.setWalkRoute(null);
  }

  async function routeTo(dest) {
    setPicking(false);
    const ctrl = getCtrl();
    if (!ctrl) return;
    const fix = store.profile.prefs.lastFix;
    if (!fix) { out.textContent = 'Tap “Locate me” first — walking directions start from where you are.'; return; }
    out.textContent = 'Working out the route…';
    const mod = await import('./walk-route.js');
    const res = await mod.routeWalk({ lat: fix.lat, lng: fix.lng }, dest);
    out.textContent = '';

    if (!res.ok) {
      const why = res.reason === 'destination-outside'
        ? 'That destination is outside the walking data for this area.'
        : res.reason === 'no-path'
          ? 'No walking path connects those two points in the mapped network.'
          : `Walking directions are not available here yet. Covered so far: ${mod.WALK_AREAS.map((a) => a.label).join(', ')}.`;
      out.append(h('p', { class: 'muted', style: 'margin:0;font-size:13px' }, why));
      return;
    }

    clearBtn.style.display = '';
    ctrl.setWalkRoute(res.coords);
    out.append(h('p', { style: 'margin:0 0 var(--sp-1h);font-weight:700' },
      `🚶 ${(res.metres / 1000).toFixed(res.metres < 1000 ? 2 : 1)} km · about ${fmtMins(res.seconds)}`));
    // The snap distances are the walk to and from the mapped path network. Shown when they are
    // large enough to matter, because the route genuinely does not start at the door.
    if (res.snapStart > 60 || res.snapEnd > 60) {
      out.append(h('p', { class: 'muted', style: 'margin:0 0 var(--sp-1h);font-size:12px' },
        `Starts ${res.snapStart} m and ends ${res.snapEnd} m from the nearest mapped path.`));
    }
    const list = h('ol', { class: 'walk-steps' });
    res.instructions.forEach((s) => list.append(
      h('li', {}, s.metres ? `${s.text} · ${s.metres} m` : s.text)));
    out.append(list);
  }

  const body = h('div', {}, [
    h('div', { style: 'display:flex;flex-wrap:wrap;gap: var(--sp-2)' }, [pickBtn, clearBtn]),
    out,
  ]);

  return {
    card: foldedCard('🚶 Walking directions (offline)', body, key, defaultOpen),
    handleMapClick(pt) {
      if (!picking) return false;
      routeTo(pt);
      return true;
    },
    reset: clearWalk,
  };
}
