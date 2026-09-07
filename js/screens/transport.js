// Getting around — the transport screen, its "how to get around" section, and adding a pin.
//
// Extracted from js/main.js (screen split, mk-v0.539.0).
import { h } from '../util.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { getCountry } from '../data/regions.js';
import { GET_AROUND } from '../lazy-data.js';
import { citySlug } from '../render-utils.js';
import {
  addPin,
  getPin,
  setMyStay,
  store,
  togglePlaceInCollection,
  updatePin,
} from '../state.js';
import { field } from '../ui-widgets.js';
import {
  collToggleChip,
  countryChips,
  focusSpot,
  go,
  mount,
  priceLine,
  toggleSet,
  topbar,
} from '../main.js';


// Coords captured by tapping the map, consumed by #addpin. Moved with the screen.
let pendingPinCoords = null;

export function transportScreen(countryId) {
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Getting around', '#home'));
  wrap.append(countryChips((id) => go(`#transport-${id}`)));
  wrap.append(h('button', { class: 'btn block', style: 'margin-bottom: var(--sp-3)', onclick: () => go('#route') }, '🧭 Plan a whole journey A → B (incl. borders)'));
  // Rent & ride, tickets and schedules — always shown, even where intercity routes are sparse.
  const ga = getAroundSection(getActiveCountry());
  if (ga) wrap.append(ga);

  const country = getCountry(getActiveCountry());
  const routes = country && country.routes;
  if (!routes) {
    wrap.append(h('p', { class: 'empty' }, `Intercity routes for ${country ? country.name : 'this country'} are not listed yet — use “Plan a whole journey” above, or open any place to see its nearest transport connections.`));
    mount(wrap, '#home'); return;
  }
  const routeCard = (r) => {
    const card = h('div', { class: 'card' }, [
      h('h2', {}, `${r.from} → ${r.to}`),
      r.crossBorder ? h('p', { class: 'border-flag' }, `Border crossing: ${r.border}`) : null,
      r.visa ? h('p', { class: 'muted' }, `Visa: ${r.visa.note}`) : null,
    ]);
    if (r.scamWarnings && r.scamWarnings.length) r.scamWarnings.forEach((w) => card.append(h('div', { class: 'warn-note' }, w)));
    for (const o of r.options) {
      const dur = o.durationHrs ? `${o.durationHrs[0]}–${o.durationHrs[1]} h` : '';
      card.append(h('div', { class: `route-opt ${o.recommended ? 'best' : ''}` }, [
        h('div', { class: 'row-between' }, [
          h('span', { class: 'mode' }, o.mode),
          o.recommended ? h('span', { class: 'pill-best' }, 'Best') : null,
        ]),
        h('div', { class: 'muted' }, `${dur} · ${priceLine(o.price.low, o.price.high, o.price.currency)} · ${o.freq}`),
        o.comfort ? h('div', {}, o.comfort) : null,
        o.notes ? h('div', { class: 'muted' }, o.notes) : null,
        o.bookVia ? h('div', { class: 'muted' }, `Book via: ${o.bookVia}`) : null,
      ]));
    }
    card.append(h('a', { class: 'btn ghost block', style: 'margin-top: var(--sp-3)', href: 'https://12go.asia', target: '_blank', rel: 'noopener' }, 'Check live times & book (12Go) ↗'));
    return card;
  };

  // Context-first: lead with journeys leaving the city you are in (or focused on); the
  // rest of the country network collapses behind one tap instead of a long scroll.
  const fs = focusSpot(getActiveCountry());
  const focusCity = (fs.source === 'gps' || fs.source === 'focus') ? fs.spot.city : '';
  const here = focusCity ? routes.filter((r) => citySlug(r.from) === citySlug(focusCity)) : [];
  const rest = routes.filter((r) => !here.includes(r));
  const collapse = (list, label) => {
    const det = h('details', { class: 'filters-collapse' }, [h('summary', {}, label)]);
    list.forEach((r) => det.append(routeCard(r)));
    wrap.append(det);
  };

  if (here.length) {
    wrap.append(h('h3', { class: 'cat-title' }, `Leaving ${focusCity} · ${here.length}`));
    here.forEach((r) => wrap.append(routeCard(r)));
    if (rest.length) collapse(rest, `More routes across ${country.name} · ${rest.length}`);
  } else {
    // No known city context: show the first few (hub routes lead the data), collapse the tail.
    const lead = rest.slice(0, 5), tail = rest.slice(5);
    lead.forEach((r) => wrap.append(routeCard(r)));
    if (tail.length) collapse(tail, `More routes across ${country.name} · ${tail.length}`);
  }
  wrap.append(h('p', { class: 'disclaimer' }, 'Times and prices are guidance and change with season and operator. Confirm before travel.'));
  mount(wrap, '#home');
}

// ---- TRANSPORT --------------------------------------------------------------
// Rent & ride, buy tickets (flights, trains, buses, boats) and find live schedules for a
// country. Guidance text is bundled and works offline; booking/timetable links open the
// authoritative source (needs internet) — we never bundle fabricated times or fares.
export function getAroundSection(cc) {
  const g = GET_AROUND[cc];
  if (!g) return null;
  const chip = (b) => h('a', { class: 'chip', href: b.url, target: '_blank', rel: 'noopener' }, `${b.name} ↗`);
  const wrap = h('div', {});

  if (g.hail && g.hail.length) {
    const card = h('div', { class: 'card' }, [h('h2', {}, '🚕 Ride-hailing apps')]);
    g.hail.forEach((a) => card.append(h('div', { class: 'transit-row' }, [h('strong', {}, a.name), h('div', { class: 'muted tiny' }, a.what)])));
    wrap.append(card);
  }

  const rentDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🛵 Rent a scooter or car')]);
  if (g.scooter) {
    rentDet.append(h('h3', {}, '🛵 Scooter / motorbike'));
    rentDet.append(h('p', { class: 'muted' }, g.scooter.note));
    (g.scooter.tips || []).forEach((t) => rentDet.append(h('div', { class: 'list-note' }, t)));
    if (g.scooter.book) rentDet.append(h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, g.scooter.book.map(chip)));
  }
  if (g.car) {
    rentDet.append(h('h3', {}, '🚗 Car'));
    rentDet.append(h('p', { class: 'muted' }, g.car.note));
    if (g.car.book) rentDet.append(h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, g.car.book.map(chip)));
  }
  // Per-city price ranges so a traveller can budget before tapping out to a booking site.
  if (g.rentalPrices && g.rentalPrices.rows && g.rentalPrices.rows.length) {
    rentDet.append(h('h3', {}, '💰 What it costs (per day)'));
    const tbl = h('table', { class: 'rent-price' }, [
      h('thead', {}, h('tr', {}, [h('th', {}, 'City'), h('th', {}, '🛵 Scooter'), h('th', {}, '🚗 Car')])),
      h('tbody', {}, g.rentalPrices.rows.map((r) => h('tr', {}, [h('td', {}, r.city), h('td', {}, r.scooter || '—'), h('td', {}, r.car || '—')]))),
    ]);
    rentDet.append(tbl);
    if (g.rentalPrices.note) rentDet.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1) 0 0' }, g.rentalPrices.note));
  }
  rentDet.append(h('p', { class: 'tiny muted', style: 'margin-top: var(--sp-2)' }, `Reminder: ${g.name} drives on the ${g.drivesOn}. An International Driving Permit plus your home licence keeps you legal and insured.`));
  wrap.append(rentDet);

  // City transit — a stored, offline line list for the metro cities (plus an honest note
  // where there is no rail). No live times bundled; the schedule links below cover those.
  if (g.cityTransit && g.cityTransit.length) {
    const ctDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🚈 City transit (works offline)')]);
    g.cityTransit.forEach((c) => {
      ctDet.append(h('div', { class: 'transit-row' }, [
        h('strong', {}, c.city),
        (c.lines && c.lines.length) ? h('ul', { class: 'transit-lines' }, c.lines.map((ln) => h('li', {}, ln))) : null,
        c.note ? h('div', { class: 'muted tiny', style: 'margin-top: var(--sp-0h)' }, c.note) : null,
      ]));
    });
    wrap.append(ctDet);
  }

  const t = g.tickets || {};
  const tkDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🎫 Buy tickets — flights, trains, buses & boats')]);
  const tkRow = (label, arr) => { if (arr && arr.length) tkDet.append(h('div', { class: 'transit-row' }, [h('strong', {}, label), h('div', { class: 'chips', style: 'margin-top: var(--sp-1)' }, arr.map(chip))])); };
  tkRow('✈️ Flights', t.flight);
  tkRow('🚆 Trains', t.train);
  tkRow('🚌 Buses', t.bus);
  tkRow('⛴️ Boats & ferries', t.ferry);
  tkDet.append(h('p', { class: 'tiny muted', style: 'margin-top: var(--sp-1h)' }, 'Prices and seats are live on these sites. For trains and the fast Laos railway, book a day or two ahead.'));
  wrap.append(tkDet);

  if (g.schedules && g.schedules.length) {
    const scDet = h('details', { class: 'filters-collapse' }, [h('summary', {}, '🕘 Timetables & live schedules')]);
    g.schedules.forEach((s) => scDet.append(h('div', { class: 'transit-row' }, [
      h('div', { class: 'row-between' }, [h('strong', {}, s.what), h('span', { class: 'muted tiny' }, s.org)]),
      s.note ? h('div', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 var(--sp-1)' }, s.note) : null,
      h('a', { class: 'btn ghost block', style: 'margin-top: var(--sp-0h)', href: s.url, target: '_blank', rel: 'noopener' }, `Open ${s.org} ↗`),
    ])));
    scDet.append(h('p', { class: 'tiny muted', style: 'margin-top: var(--sp-1)' }, 'Live times need internet; the guidance above works offline. Schedules shift with season and demand — always confirm on the day.'));
    wrap.append(scDet);
  }
  return wrap;
}

export function addPinScreen(editId) {
  const existing = editId ? getPin(editId) : null;
  const editing = !!existing;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit place' : 'Add a place', editing ? `#place-${editId}` : '#places'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Place not found.')); mount(wrap, '#places'); return; }
  const state = { coords: existing ? existing.coords : (pendingPinCoords || null), colls: new Set() };
  pendingPinCoords = null; // consume the tapped coordinate

  const card = h('div', { class: 'card' });
  const name = h('input', { type: 'text', placeholder: 'Place name (e.g. “Great noodle stall”)', value: existing ? existing.name : '' });
  const note = h('input', { type: 'text', placeholder: 'A note (optional)', value: existing ? (existing.note || '') : '' });
  card.append(field('Name', name), field('Note', note));

  // What kind of place — single-select, stored as the pin's first tag so it reads as a type
  // (like a category on a map) and can colour/group it later.
  const PLACE_KINDS = [['food', '🍜 Food & drink'], ['stay', '🛏 Place to stay'], ['culture', '🏛 Culture'], ['nature', '🌿 Nature'], ['nightlife', '🌃 Nightlife'], ['shopping', '🛍 Shopping'], ['other', '📌 Other']];
  let selKind = (existing && existing.tags && existing.tags[0]) || 'other';
  const kindChips = h('div', { class: 'chips' }, PLACE_KINDS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': selKind === id ? 'true' : 'false', dataset: { k: id },
      onclick: (e) => { selKind = id; kindChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.k === id ? 'true' : 'false')); } }, lbl)));
  card.append(field('What kind of place?', kindChips));

  const coordOut = h('p', { class: 'muted' }, state.coords
    ? `Location: ${state.coords.lat.toFixed(5)}, ${state.coords.lng.toFixed(5)}`
    : 'No location attached.');
  card.append(field('Location', h('div', {}, [
    h('button', { class: 'btn ghost', onclick: () => {
      coordOut.textContent = 'Locating…';
      if (!navigator.geolocation) { coordOut.textContent = 'Geolocation unavailable.'; return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { state.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; coordOut.textContent = `Attached: ${state.coords.lat.toFixed(5)}, ${state.coords.lng.toFixed(5)}`; },
        (err) => { coordOut.textContent = `No location: ${err.message}`; },
        { enableHighAccuracy: true, timeout: 10000 });
    } }, 'Use my current location'),
    coordOut,
  ])));

  // Collections + "my stay" are creation-time extras; when editing, name/note/location
  // are the editable fields (collections stay managed from the Save sheet).
  const stayChk = h('input', { type: 'checkbox' });
  if (!editing) {
    if (store.collections.length) {
      card.append(field('Add to collections', h('div', { class: 'chips' },
        store.collections.map((c) => collToggleChip(c.name, c.emoji, () => toggleSet(state.colls, c.id))))));
    } else {
      card.append(field('Add to collections', h('p', { class: 'muted' }, 'You have no collections yet. Save the pin, then tap “＋ Save” on it to file it under a theme.')));
    }
    card.append(h('label', { style: 'display:flex;align-items:center;gap: var(--sp-2);cursor:pointer;margin-top: var(--sp-2)' },
      [stayChk, h('span', {}, '🏠 Also set this as my accommodation (My stay)')]));
  }
  wrap.append(card);

  wrap.append(h('button', { class: 'btn block', onclick: () => {
    if (!name.value.trim()) { alert('Give the place a name.'); return; }
    if (editing) {
      updatePin(editId, { name: name.value.trim(), note: note.value.trim(), coords: state.coords, tags: [selKind] });
      go(`#place-${editId}`);
      return;
    }
    const pin = addPin({ name: name.value.trim(), note: note.value.trim(), tags: [selKind], coords: state.coords });
    state.colls.forEach((cid) => togglePlaceInCollection(cid, pin.id));
    if (stayChk.checked && state.coords) setMyStay({ name: name.value.trim(), coords: state.coords });
    go(`#place-${pin.id}`);   // open the new place so photos, a rating and a review are one tap away
  } }, editing ? 'Save changes' : 'Save place'));
  wrap.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) var(--sp-0h)' }, 'After saving, open the place to add your photos, a star rating and a review — everything stays on your device.'));
  mount(wrap, true);
}
