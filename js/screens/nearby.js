// Nearby — what is around the traveller right now, ranked by distance from the last fix.
//
// Extracted from js/main.js (screen split, mk-v0.539.0), in the same slice as food.js and for
// a specific reason: this screen renders dietEatCard, so leaving it in main.js would have
// forced main.js to import that card back out of food.js at module level — which would pull
// food.js into the eager graph and undo the extraction entirely. A screen split only pays if
// nothing eager reaches into the module afterwards.
import { h, geolocate, haversineKm, bearing, compass, fmtDistance } from '../util.js';
import { store, getLastFix, setLastFix } from '../state.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { getCountry, allPlaces } from '../data/regions.js';
import { attrTag, driveLabel, withinNear, withinDayTrip } from '../render-utils.js';
import { dietEatCard } from './food.js';
import {
  go, mount, topbar, whereAmI, nearestSpotGlobal, setFocusSpot, locationSheet, catEmoji, chipIcon,
  nearCat, nearbySafetyStrip, arrivalEssentials, placeFitReason, rnThumb, openStateNow,
  isSpotDone, toggleSpotDone, hideSpot, unhideSpot, clearSuggestionMarks, showUndoToast,
} from '../main.js';

export function nearbyScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Near me', '#home'));
  const status = h('p', { class: 'muted' }, [h('span', { class: 'spinner' }), 'Finding your location…']);
  const body = h('div', {});
  wrap.append(status, body);
  mount(wrap, '#nearby');

  // Cached fix paints instantly; a live fix then refines it. Offline-safe throughout.
  let fix = getLastFix();
  if (fix) paint(fix);
  geolocate()
    .then((pos) => { fix = setLastFix(pos); paint(fix); })
    .catch(() => { if (!fix) noLocation(); });

  function nearestCityInfo(f) {
    const w = whereAmI(f);
    if (w) return { city: w.name, country: w.country, km: w.km != null ? w.km : 0, near: !!w.approx };
    return null;
  }

  function noLocation() {
    status.textContent = 'Location is off';
    body.innerHTML = '';
    body.append(h('div', { class: 'card' }, [
      h('p', {}, 'Turn on location to see what is around you — distances, walking times and the closest places, all offline once you have a fix.'),
      h('button', { class: 'btn block', onclick: () => go('#nearby') }, 'Try again'),
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => locationSheet() }, '📍 Set my city manually'),
      h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#home') }, 'Or browse by country'),
    ]));
  }

  function paint(f) {
    const info = nearestCityInfo(f);
    const country = info ? info.country : getActiveCountry();
    setActiveCountry(country);
    const nb = nearestSpotGlobal(f); if (nb) setFocusSpot(nb.spot);   // remember where they are for weather/today
    const cName = getCountry(country) ? getCountry(country).name : '';
    status.innerHTML = '';
    status.append(
      h('strong', {}, info ? `You are ${info.near ? 'near' : 'in'} ${info.city}` : 'You are here'),
      (info && cName) ? h('span', { class: 'muted' }, ` · ${cName}${info.km > 60 ? ` (${fmtDistance(info.km)} away)` : ''}`) : null,
    );

    // Rank ALL nearby places once; drawList() filters "not interested" ones out on each draw
    // (using the live set), so a reset — which clears the marks — restores them immediately
    // without needing to leave and re-open the screen. "Done" places stay findable here (this
    // is a directory, not the rotating suggestion feed) and only drop out of the Home picks.
    const ranked = allPlaces({ country }).filter((p) => p.coords)
      .map((p) => ({ p, km: haversineKm(f, p.coords) })).sort((a, b) => a.km - b.km);

    body.innerHTML = '';
    // Featured (open by default) while still "fresh off the plane": on the ground and the
    // Just arrived chip has not been dismissed. Used to check the now-removed 'arrived'
    // phase value directly; the dismissible chip (justArrivedChip, js/screens/home.js) is
    // the new, narrower signal for "just landed" now that the phase itself only has one
    // merged on-the-ground stage.
    body.append(arrivalEssentials(country, (store.profile.prefs.phase || '') === 'traveling' && !store.profile.prefs.justArrivedHidden));
    body.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#arrival-${country}`) }, '🛬 Full arrival guide — airport→town, cash, SIM'));
    body.append(h('div', { class: 'chips', style: 'margin: var(--sp-3) 0' }, [
      h('button', { class: 'chip', onclick: () => go(`#places-${country}`) }, [chipIcon('map'), 'See on the map']),
      h('button', { class: 'chip', onclick: () => go('#places') }, [chipIcon('pin'), 'Set my stay']),
      h('button', { class: 'chip', onclick: () => go('#exchange') }, '🤝 Traveller board'),
      h('button', { class: 'chip', onclick: () => go('#sos') }, [chipIcon('alert'), 'Emergency']),
    ]));
    body.append(nearbySafetyStrip(country, f));
    // Diet-aware "where you can eat": for a kosher / vegan / vegetarian / halal traveller,
    // point them straight at the verified places they can actually eat, nearest-first.
    const dietCard = dietEatCard(country, f);
    if (dietCard) body.append(dietCard);

    let cat = 'all';
    const cats = [['all', 'Everything'], ['eat', '🍜 Eat'], ['stay', '🛏 Stay'], ['do', '🎫 Do']];
    const catRow = h('div', { class: 'chips' }, cats.map(([id, lbl]) =>
      h('button', {
        class: 'chip', 'aria-pressed': id === 'all' ? 'true' : 'false', dataset: { c: id },
        onclick: () => { cat = id; catRow.querySelectorAll('.chip').forEach((ch) => ch.setAttribute('aria-pressed', ch.dataset.c === id ? 'true' : 'false')); drawList(); },
      }, lbl)));
    const listEl = h('div', {});
    body.append(
      h('h3', { style: 'margin: var(--sp-4) var(--sp-0h) var(--sp-1)' }, 'Closest to you'),
      catRow,
      h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) var(--sp-0h) var(--sp-2)' },
        'Distances are straight-line and drive times are rough estimates — mountain roads (for example around Pai, Sapa or the Bolaven Plateau) take considerably longer.'),
      listEl,
    );

    function drawList() {
      listEl.innerHTML = '';
      // Re-read the marks each draw so hiding one instantly promotes the next place into view,
      // and "done" places show a tick but stay findable in this directory.
      const hid = new Set(store.profile.prefs.hiddenSpots || []);
      const prefs = store.profile.prefs;
      const catOk = (p) => cat === 'all' || nearCat(p) === cat;
      // Good fits that are open lead; poor fits (kids/mobility) and places closed right now
      // sink to the bottom — kept and tagged, never hidden — then order by distance.
      const fitKey = ({ p }) => (placeFitReason(p, prefs) ? 2 : 0) + (openStateNow(p) === false ? 1 : 0);
      const bySort = (a, b) => fitKey(a) - fitKey(b) || a.km - b.km;
      // "Near me" = within about an hour's DRIVE (road-time, not straight-line). Comprehensive
      // within that reach (up to 40) rather than padded with far picks, so every row is truly
      // reachable. A separate, collapsed tier holds real "further afield" next-destinations.
      const near = ranked.filter(({ p, km }) => withinNear(km, p.country) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 40);
      const afield = ranked.filter(({ p, km }) => withinDayTrip(km, p.country) && !hid.has(p.id) && catOk(p)).sort(bySort).slice(0, 20);

      function renderRow(container, p, km) {
        const done = isSpotDone(p.id);
        const closed = openStateNow(p) === false;
        const fit = placeFitReason(p, prefs);
        const tags = [];
        if (closed) tags.push(attrTag('🔒 Closed now'));
        if (fit) tags.push(attrTag('⚠️ ' + fit));
        container.append(h('div', { class: 'rn-item near-item' + (done ? ' is-done' : '') }, [
          h('button', { class: 'rn-open near-open', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'near-text' }, [
              h('span', { class: 'near-name' }, `${catEmoji(nearCat(p))} ${p.name}${done ? ' ✓' : ''}`),
              h('span', { class: 'dist-chip' }, `${fmtDistance(km)} · ${driveLabel(km, p.country)} · ${compass(bearing(f, p.coords))}`),
              tags.length ? h('div', { class: 'near-tags' }, tags) : null,
            ]),
          ]),
          h('div', { class: 'rn-actions' }, [
            h('button', { class: 'rn-act done' + (done ? ' on' : ''), title: done ? 'Done — tap to undo' : 'Mark as done', 'aria-label': `Mark ${p.name} as done`, onclick: () => { const wasDone = done; toggleSpotDone(p.id); drawList(); if (!wasDone) showUndoToast(`“${p.name}” marked done`, () => { toggleSpotDone(p.id); drawList(); }); } }, '✓'),
            h('button', { class: 'rn-act', title: 'Not interested — hide this', 'aria-label': `Hide ${p.name}`, onclick: () => { hideSpot(p.id); drawList(); showUndoToast(`Hidden “${p.name}”`, () => { unhideSpot(p.id); drawList(); }); } }, '✕'),
          ]),
        ]));
      }

      if (!near.length && !afield.length) {
        listEl.append(h('p', { class: 'empty' }, 'Nothing within about an hour’s drive in this category yet — try “Everything”, the map, or open a nearby city.'));
        return;
      }
      if (near.length) near.forEach(({ p, km }) => renderRow(listEl, p, km));
      else listEl.append(h('p', { class: 'muted small', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-2)' }, 'Nothing within about an hour’s drive in this category — the nearest are further afield, below.'));
      if (afield.length) {
        const afBody = h('div', { class: 'near-afield-body' });
        afield.forEach(({ p, km }) => renderRow(afBody, p, km));
        listEl.append(h('details', { class: 'card near-afield', open: near.length ? null : '' }, [
          h('summary', {}, `🚌 Further afield · next destinations (${afield.length})`),
          h('p', { class: 'muted small', style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, 'Beyond an hour’s drive — worth a day trip or your next stop.'),
          afBody,
        ]));
      }
      const nHid = (store.profile.prefs.hiddenSpots || []).length;
      const nDone = (store.profile.prefs.doneSpots || []).length;
      if (nHid || nDone) {
        listEl.append(h('button', { class: 'rn-reset', onclick: () => { clearSuggestionMarks(); drawList(); } },
          `↺ ${[nDone ? `${nDone} done` : '', nHid ? `${nHid} hidden` : ''].filter(Boolean).join(' · ')} — reset`));
      }
    }
    drawList();
  }
}
