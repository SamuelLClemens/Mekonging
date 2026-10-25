// The journey screen's stop form: one form that adds a stop and edits one (traveller fix F2).
// A stop is placed in one of three ways, the same for a new stop and for "Move" on an old one:
//   * the place picker (F1: the 165 curated cities, then every town, village and island on the phone);
//   * a pin dropped by tapping the map, anywhere in the world;
//   * "I am here", from the phone's position once, or the app's last fix when the phone will not give one.
// Outside the four countries nothing on the phone knows the name, so the traveller types it.
// The form never touches the journal, the trip plan or the trail itself: it hands { city, first, last,
// lat, lng, cc } to onSave(), and js/trail.js (editJourneyStop, addTrailStop) decides where that lives.
import { h } from '../util.js';
import { field, locationSelect, spotForKey } from '../ui-widgets.js';
import { getLastFix, todayKey } from '../state.js';

// "1.352° N, 103.820° E": what a pin with no name reads as.
export function fmtPt(p) {
  return `${Math.abs(p.lat).toFixed(3)}° ${p.lat >= 0 ? 'N' : 'S'}, ${Math.abs(p.lng).toFixed(3)}° ${p.lng >= 0 ? 'E' : 'W'}`;
}

// opts:
//   heading     the card's title
//   stop        the stop being edited (a journeyStops() entry), or null for a new one
//   note        one quiet line under the title (what an edit does and does not change)
//   map         { pick(cb|null), pin(spot|null), fly(point) }: how the form reaches the live map
//   describe    (point) => { name, cc }: what the app knows about a coordinate, '' when nothing
//   submit      the save button's label
//   nested      true inside another card (an edit sits in the stops list); false for a card of its own
//   onSave      (values) => void
//   onCancel    () => void
export function stopForm({ heading, stop = null, note = '', map, describe, submit, nested = false, onSave, onCancel }) {
  let loc = null;                 // what the traveller chose: { lat, lng, city, cc }; null = not chosen
  let picking = false;
  let nameTouched = !!stop;       // an edit keeps its name until the traveller changes it

  const nameIn = h('input', {
    type: 'text', 'aria-label': 'Stop name', maxlength: '80', autocomplete: 'off', placeholder: 'Name this stop',
    value: stop ? stop.label : '', oninput: () => { nameTouched = true; },
  });
  const where = h('p', { class: 'jr-form-where', 'data-no-mt': '' }, stop ? `📍 ${stop.label ? stop.label + ' · ' : ''}${fmtPt(stop)}` : '');
  const status = h('p', { class: 'muted tiny jr-form-status', role: 'status' });
  // Moving the arrive date past the leave date moves the leave date with it, so a re-date is never refused.
  const dateIn = h('input', { 'aria-label': 'Arrive date', type: 'date', value: (stop && stop.first) || '',
    oninput: () => { if (dateOut.value && dateIn.value && dateOut.value < dateIn.value) dateOut.value = dateIn.value; } });
  const dateOut = h('input', { 'aria-label': 'Leave date', type: 'date', value: (stop && stop.last) || '' });
  const err = h('p', { class: 'muted tiny jr-form-err', role: 'alert' });

  // `fly` is false for a pin the traveller tapped: the map is already where their finger is.
  function setLoc(p, text, fly = true) {
    loc = p;
    where.textContent = `📍 ${text}`;
    if (!nameTouched) nameIn.value = p.city || '';
    map.pin({ city: text, lat: p.lat, lng: p.lng });
    if (fly) map.fly(p);
    err.textContent = '';
    form.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  const fromPoint = (pt) => {
    const d = (describe && describe(pt)) || {};
    return { lat: pt.lat, lng: pt.lng, city: d.name || '', cc: d.cc || '' };
  };

  function stopPick() {
    if (!picking) return;
    picking = false;
    pickBtn.setAttribute('aria-pressed', 'false');
    map.pick(null);
  }
  function startPick() {
    picking = true;
    pickBtn.setAttribute('aria-pressed', 'true');
    status.textContent = 'Tap the map where this stop is.';
    // Stays on after the first tap, so a pin that landed a street away can be moved by tapping again.
    map.pick((pt) => {
      const p = fromPoint(pt);
      setLoc(p, p.city || fmtPt(p), false);
      status.textContent = 'Pin dropped. Tap the map again to move it.';
    });
  }
  const pickBtn = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false',
    onclick: () => (picking ? stopPick() : startPick()) }, '📍 Drop a pin on the map');

  function here() {
    stopPick();
    status.textContent = 'Finding where you are…';
    const use = (pt, stale) => {
      const p = fromPoint(pt);
      setLoc(p, p.city || fmtPt(p));
      if (!dateIn.value) dateIn.value = todayKey();
      status.textContent = stale ? 'Using where the app last saw you.' : '';
    };
    const fallBack = () => {
      const f = getLastFix();
      if (f) use(f, true);
      else status.textContent = 'This phone has not shared a location. Allow it for this app, or drop a pin instead.';
    };
    if (typeof navigator === 'undefined' || !navigator.geolocation) { fallBack(); return; }
    // One reading, asked for by a tap: that tap is the traveller's consent, so this is not a new automatic request.
    navigator.geolocation.getCurrentPosition(
      (r) => use({ lat: r.coords.latitude, lng: r.coords.longitude }, false), fallBack,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  const picker = locationSelect('', (key) => {
    const sp = spotForKey(key);
    if (!sp) return;
    stopPick();
    setLoc({ lat: sp.lat, lng: sp.lng, city: sp.city, cc: sp.country || '' }, sp.city);
    status.textContent = '';
  });

  function save() {
    const city = nameIn.value.trim();
    if (!stop && !loc) { err.textContent = 'Choose a place: search, drop a pin on the map, or tap “I am here”.'; return; }
    if (!city) { err.textContent = 'Name this stop.'; nameIn.focus(); return; }
    if (!dateIn.value) { err.textContent = 'Set when you arrived.'; return; }
    if (dateOut.value && dateOut.value < dateIn.value) { err.textContent = 'The leave date is before the arrive date.'; return; }
    stopPick();
    onSave({
      city, first: dateIn.value, last: dateOut.value || dateIn.value,
      ...(loc ? { lat: loc.lat, lng: loc.lng, cc: loc.cc } : {}),
    });
  }

  const form = h('div', { class: nested ? 'jr-form jr-form-nested' : 'card jr-form' }, [
    h('h3', {}, heading),
    note ? h('p', { class: 'muted tiny jr-form-note' }, note) : null,
    field('Name', nameIn),
    field(stop ? 'Move to' : 'Where', h('div', {}, [
      where, picker,
      h('div', { class: 'chips' }, [pickBtn, h('button', { type: 'button', class: 'chip', onclick: here }, '📍 I am here')]),
      status,
    ])),
    h('div', { class: 'trip-dates' }, [
      h('label', { class: 'trip-date-lbl' }, ['Arrived', dateIn]),
      h('label', { class: 'trip-date-lbl' }, ['Left (optional)', dateOut]),
    ]),
    err,
    h('div', { class: 'chips jr-form-actions' }, [
      h('button', { type: 'button', class: 'btn', onclick: save }, submit),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { stopPick(); onCancel(); } }, 'Cancel'),
    ]),
  ]);
  return form;
}
