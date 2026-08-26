// "Where people are using this from" — a world map with a pin on every place the app has
// been opened from.
//
// The honest architecture is stated on the screen itself rather than buried here, because
// a traveller looking at a world map of dots deserves to know what the dots are. Mekonging
// is a static site with no server, so there is nothing that can see every user. What this
// screen can always show is YOUR OWN journey, kept on your device. What it can show as
// well — if the traveller points it at a collector of their own — is a shared feed. There
// is no default endpoint, deliberately.
import { h } from '../util.js';
import { infoTip, field, confirmAction } from '../ui-widgets.js';
import { getCountry } from '../data/regions.js';
import { getLastFix } from '../state.js';
import {
  visitsEnabled, setVisitsEnabled, visitsShareEnabled, setVisitsShareEnabled,
  visitsFeedUrl, setVisitsFeedUrl, myVisits, clearVisits, loadSharedVisits, GRID,
} from '../visits.js';
import { initVisitMap } from '../map.js';
import { go, mount, topbar } from '../main.js';
import { setLiveCleanup, getLiveCleanup } from '../app-state.js';

function countryName(cc) { const c = getCountry(cc); return c ? `${c.flag} ${c.name}` : null; }

// One row per place, most-visited first. "Place" here means a 0.5° cell, so it is labelled
// as an area rather than given a false address.
function cellLabel(p) {
  const ns = p.lat >= 0 ? 'N' : 'S';
  const ew = p.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(p.lat).toFixed(1)}° ${ns}, ${Math.abs(p.lng).toFixed(1)}° ${ew}`;
}

export function visitorsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Where people are', '#settings'));

  const on = visitsEnabled();
  const mine = myVisits().map((p) => ({ ...p, mine: true }));

  // ---- What this map is ---------------------------------------------------
  const intro = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🌍 The map'),
    infoTip(`Mekonging is a static site with no server and no account, so nothing here can see every user — there is nothing collecting them. Orange pins are your own, kept on this device. Blue pins come from a shared feed, and only if you add one yourself below. Every pin is rounded to a ${GRID}° grid cell, roughly 55 km, so no pin can place anyone more precisely than "this corner of the world".`),
  ])]);
  const mapBox = h('div', { class: 'visit-map', role: 'img', 'aria-label': 'World map of places this app has been opened from' });
  intro.append(mapBox);
  const legend = h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, '🟠 your own pins · 🔵 shared feed · each pin is an area of about 55 km, never an address');
  intro.append(legend);
  // The map's own attribution control is collapsed to a ⓘ so it does not cover the world on a
  // phone, so the credit is stated here in full as well — it is a licence condition, not a
  // decoration, and it should not depend on anyone opening a control.
  intro.append(h('p', { class: 'tiny muted', style: 'margin:4px 0 0' }, 'Map: © OpenStreetMap contributors · Natural Earth · streets © Esri, HERE, Garmin, USGS.'));
  wrap.append(intro);

  // ---- Your own pins ------------------------------------------------------
  const own = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '📍 Your pins'),
    infoTip('Recorded when the app opens and your location is on, at most one per place per day. It never leaves this device unless you switch on contributing below. Turning this off stops new pins; use Forget to delete the ones already here.'),
  ])]);
  const toggle = h('label', { class: 'switch-row' }, [
    h('input', { type: 'checkbox', checked: on ? '' : null, onchange: (e) => { setVisitsEnabled(e.target.checked); go('#visitors'); } }),
    h('span', {}, 'Drop a pin where I open the app'),
  ]);
  own.append(toggle);
  if (!on) {
    own.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, 'Off. Nothing is being recorded.'));
  } else if (!mine.length) {
    own.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, getLastFix()
      ? 'On. Your first pin appears the next time the app opens.'
      : 'On, but there is no location fix yet — allow location and reopen the app.'));
  } else {
    const total = mine.reduce((a, p) => a + (p.n || 1), 0);
    const ccs = [...new Set(mine.map((p) => p.cc).filter(Boolean))];
    own.append(h('p', { style: 'margin:10px 0 4px' }, [
      h('strong', {}, `${mine.length} ${mine.length === 1 ? 'place' : 'places'}`),
      ` · ${total} ${total === 1 ? 'opening' : 'openings'}`,
      ccs.length ? ` · ${ccs.map(countryName).filter(Boolean).join(', ')}` : '',
    ]));
    const rows = mine.slice().sort((a, b) => (b.n || 1) - (a.n || 1)).slice(0, 12);
    // Only four countries have flags in this app, so a pin in London or Tokyo has no country
    // name to show — in that case the grid cell IS the label, and printing it twice (once as
    // the fallback name and again as the detail) is just noise.
    rows.forEach((p) => {
      const name = countryName(p.cc);
      own.append(h('div', { class: 'row-between', style: 'padding:4px 0' }, [
        h('span', { class: 'tiny' }, name
          ? [name, h('span', { class: 'muted' }, `  ${cellLabel(p)}`)]
          : [h('span', { class: 'muted' }, cellLabel(p))]),
        h('span', { class: 'fair' }, `${p.n || 1}×`),
      ]));
    });
    own.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => {
      confirmAction({ title: 'Forget every pin?', body: 'This deletes the record of everywhere you have opened the app. It cannot be undone.', confirmLabel: 'Forget them', danger: true })
        .then((ok) => { if (ok) { clearVisits(); go('#visitors'); } });
    } }, '🗑 Forget my pins'));
  }
  wrap.append(own);

  // ---- The shared feed ----------------------------------------------------
  const shared = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🔵 Everyone else'),
    infoTip('No shared feed ships with this app, and none is switched on by default — a static site collecting its users’ locations is exactly what this project does not do. Point it at a collector you run and its pins appear alongside yours. The origin must also be listed in index.html’s Content-Security-Policy (connect-src), or the browser will block the request.'),
  ])]);
  shared.append(h('p', { class: 'tiny muted', style: 'margin:0 0 8px' }, 'Expects HTTPS returning JSON: an array of { lat, lng, n, cc }, or { points: [ … ] }. Anything malformed is ignored.'));
  shared.append(field('Shared pin feed URL', h('input', {
    type: 'url', value: visitsFeedUrl(), placeholder: 'https://your-collector.example/visits.json',
    oninput: (e) => setVisitsFeedUrl(e.target.value),
  })));
  const contribRow = h('label', { class: 'switch-row' }, [
    h('input', { type: 'checkbox', checked: visitsShareEnabled() ? '' : null, onchange: (e) => setVisitsShareEnabled(e.target.checked) }),
    h('span', {}, 'Also send my pins to that feed'),
  ]);
  shared.append(contribRow);
  shared.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, `Sends the rounded ${GRID}° cell and the country. Never a track, never a time, never anything that identifies you or this device.`));
  const feedStatus = h('p', { class: 'tiny muted', style: 'margin:8px 0 0' }, '');
  shared.append(feedStatus);
  wrap.append(shared);

  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#settings') }, '← Back to settings'));
  mount(wrap, '#settings');

  // ---- Draw, after mount so the container has a size ----------------------
  // The map is an enhancement: if MapLibre cannot start, the counts and the list above are
  // the screen and they still read correctly. Never let a map failure blank this page.
  let ctrl = null;
  initVisitMap(mapBox, mine).then((c) => {
    ctrl = c;
    // A MapLibre instance holds a WebGL context, and browsers cap how many a page may have
    // (around sixteen). Without this, opening this screen a dozen times over a session
    // leaks contexts until the map silently stops starting at all. Same idiom as the Places
    // map: chain onto any cleanup already registered rather than replacing it.
    { const prev = getLiveCleanup(); setLiveCleanup(() => { try { if (prev) prev(); } catch { /* noop */ } try { c.dispose(); } catch { /* noop */ } ctrl = null; }); }
    if (mine.length) c.fit(mine);
    if (!visitsFeedUrl()) return;
    feedStatus.textContent = 'Loading the shared feed…';
    return loadSharedVisits().then((res) => {
      if (!ctrl) return;
      if (!res.ok) {
        feedStatus.textContent = res.reason === 'not-https'
          ? 'The feed URL must start with https://.'
          : 'Could not reach the shared feed. Check the URL, your connection, and that its origin is allowed in the page’s Content-Security-Policy.';
        return;
      }
      const all = mine.concat(res.points.map((p) => ({ ...p, mine: false })));
      ctrl.setPoints(all);
      const total = res.points.reduce((a, p) => a + p.n, 0);
      feedStatus.textContent = `${res.points.length} ${res.points.length === 1 ? 'place' : 'places'} from the shared feed · ${total} openings.`;
      if (!mine.length) ctrl.fit(all);
    });
  }).catch(() => {
    mapBox.replaceChildren(h('p', { class: 'empty' }, 'The map could not start here. The list of places above still works.'));
  });
}
