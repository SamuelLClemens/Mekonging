// Trip planning — the itinerary and budget planner, the suggested routes matched to the
// traveller's own profile, and the pre-trip checklist.
//
// checklistFor and matchesProfile stayed in main.js: the journey-countdown card counts a
// traveller's outstanding checklist items on an eager render path. stopDateLabel stayed too —
// js/place-ui.js, js/screens/places.js and js/screens/export.js all use it. All three are
// imported back rather than duplicated.
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { budgetLogRow, expenseAddCard } from '../budget-ui.js';
import { convert } from '../currency.js';
import { getCountry } from '../data/regions.js';
import { suggestPlans } from '../lazy-data.js';
import { resolveItem, tripVisitSheet } from '../place-ui.js';
import { sourcesNote } from '../render-utils.js';
import { encodeShare, shareUrl } from '../social.js';
import { store, addPlaceVisit, addStop, ensureMe, isChecked, moveStop, removePlaceVisit, removeStop,
  toggleChecklistItem, unscheduledVisits, updatePlaceVisit, updateStop, visitsForStop } from '../state.js';
import { confirmAction, promptAction, screenHint } from '../ui-widgets.js';
import { h, money } from '../util.js';
import { dateLocale } from '../i18n.js';
import { checklistFor, countryChips, go, homeCurrency, mount, profileIsSet, render, shareButton, stopDateLabel,
  ownTitle, todayISO, addDaysISO, tripStartISO, topbar } from '../main.js';

let editStopId = null;   // trip stop currently open for inline editing (correct a mistake)

let placePickerOpenFor = null;  // stop id currently showing its "+ Add a place" saved-places picker, or null

// One "thing to see" on the itinerary — used for both the rows tagged to a stop and the
// not-yet-scheduled ones, so a note written in either place behaves identically.
//
// placeVisits have carried a `note` field since they were introduced, but nothing ever
// wrote one: addPlaceVisit is only ever called with { placeId, stopId }, so the field was
// unreachable and every row was a bare place name. The note is the part that makes the
// itinerary useful — "book three days ahead", "closed Mondays", "go at dawn" — so it is
// edited here, in place, rather than on a separate screen.
function tripVisitRow(visit, place, prefix = '', extraChip = null) {
  const row = h('div', { class: 'trip-visit' });
  const noteEl = h('div', { class: 'tiny muted trip-visit-note' });
  const noteBtn = h('button', { class: 'chip' });
  // The note is written and repainted without a re-render (a re-render would tear down the
  // button mid-tap), so the chip's own label has to be repainted here too — otherwise it
  // keeps reading "＋ Note" on a row that now has one.
  const paintNote = () => {
    noteEl.textContent = visit.note || '';
    noteEl.hidden = !visit.note;
    noteBtn.textContent = visit.note ? '✎' : '＋ Note';
    noteBtn.setAttribute('aria-label', `${visit.note ? 'Edit' : 'Add'} a note for ${place.name}`);
  };
  const editNote = () => {
    promptAction({
      title: place.name,
      body: 'A reminder for when you get there.',
      label: 'Note',
      value: visit.note || '',
      placeholder: 'e.g. book 3 days ahead · closed Mondays',
      confirmLabel: 'Save',
      maxLength: 160,
      multiline: true,
    }).then((note) => {
      // null = cancelled. '' is a real answer here (unlike a collection name): clearing the
      // field is how a traveller deletes a note they no longer need.
      if (note == null) return;
      updatePlaceVisit(visit.id, { note });
      paintNote();
    });
  };
  noteBtn.addEventListener('click', editNote);
  paintNote();
  row.append(h('div', { class: 'row-between' }, [
    h('button', { class: 'linklike', onclick: () => go(`#place-${place.id}`) }, `${prefix}${place.name}`),
    h('div', { class: 'chips' }, [
      extraChip,
      noteBtn,
      h('button', { class: 'chip', 'aria-label': `Remove ${place.name}`, onclick: () => { removePlaceVisit(visit.id); go('#trip'); } }, '✕'),
    ]),
  ]));
  row.append(noteEl);
  return row;
}

export function tripScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  // Plain title, no possessive. The topbar gives the title ~102px at 375px and clamps it to
  // two lines; a name plus a long noun overflowed it silently (same fix as Dictionary in
  // mk-v0.510.0). The traveller's name still appears throughout the screen body and on the
  // buttons that lead here, which is where it reads as a nice touch rather than as an
  // overflowing heading.
  wrap.append(topbar(ownTitle('trip', 'Your trip'), '#me'));

  // itinerary
  const itin = h('div', { class: 'card' }, [h('h2', {}, 'Itinerary')]);
  const stops = store.trip.stops;
  // Hoisted above the loop: reused both for the existing "quick-add a stop" chips further down
  // and for each stop's own "+ Add a place" picker (S4 — place-linked trip stops) below.
  const saved = store.favorites.map(resolveItem).filter(Boolean);
  if (!stops.length) itin.append(h('p', { class: 'muted' }, 'Add the places or cities you plan to visit, in order.'));
  stops.forEach((s, i) => {
    // Inline editor when this stop is open for correction — fix a typo'd name or a wrong date.
    if (editStopId === s.id) {
      const t = h('input', { 'aria-label': 'Stop name', type: 'text', value: s.title });
      const dt = h('input', { 'aria-label': 'Arrive date', type: 'date', value: s.date || '' });
      const dt2 = h('input', { 'aria-label': 'Leave date', type: 'date', value: s.endDate || '' });
      itin.append(h('div', { class: 'trip-stop', style: 'display:block' }, [
        h('div', { class: 'field' }, [h('label', {}, `Edit stop ${i + 1}`), t,
          h('div', { class: 'trip-dates' }, [
            h('label', { class: 'trip-date-lbl' }, ['Arrive', dt]),
            h('label', { class: 'trip-date-lbl' }, ['Leave (optional)', dt2]),
          ])]),
        h('div', { class: 'chips' }, [
          h('button', { class: 'btn', onclick: () => { updateStop(s.id, { title: t.value.trim() || s.title, date: dt.value, endDate: dt2.value }); editStopId = null; go('#trip'); } }, 'Save'),
          h('button', { class: 'btn ghost', onclick: () => { editStopId = null; render(); } }, 'Cancel'),
        ]),
      ]));
      return;
    }
    itin.append(h('div', { class: 'row-between trip-stop' }, [
      h('div', {}, [h('strong', {}, `${i + 1}. ${s.title}`), stopDateLabel(s) ? h('div', { class: 'muted' }, stopDateLabel(s)) : null]),
      h('div', { class: 'cats' }, [
        h('button', { class: 'chip', 'aria-label': 'Edit', onclick: () => { editStopId = s.id; render(); } }, '✎'),
        h('button', { class: 'chip', 'aria-label': 'Move up', disabled: i === 0 ? '' : null, onclick: () => { moveStop(s.id, -1); go('#trip'); } }, '↑'),
        h('button', { class: 'chip', 'aria-label': 'Move down', disabled: i === stops.length - 1 ? '' : null, onclick: () => { moveStop(s.id, 1); go('#trip'); } }, '↓'),
        h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { confirmAction({ title: 'Remove this stop?', confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { removeStop(s.id); go('#trip'); } }); } }, '✕'),
      ]),
    ]));
    // S4 — places tagged to this leg (a stop and a place are not 1:1, so this is its own list;
    // see addPlaceVisit in state.js). Tagged from placeScreen / Explore / Places cards.
    const visits = visitsForStop(s.id).map((v) => ({ visit: v, place: resolveItem(v.placeId) })).filter((x) => x.place);
    if (visits.length) {
      itin.append(h('p', { class: 'muted', style: 'margin:6px 0 2px 22px;font-size:12px' }, 'Things to see here:'));
      itin.append(h('div', { class: 'trip-visits' }, visits.map(({ visit, place }) => tripVisitRow(visit, place, '📍 '))));
    }
    if (placePickerOpenFor === s.id) {
      const pickable = saved.filter((sp) => !visits.some((x) => x.place.id === sp.id));
      itin.append(h('div', { class: 'trip-visit' }, pickable.length
        ? h('div', { class: 'chips' }, pickable.map((sp) => h('button', {
            class: 'chip', onclick: () => { addPlaceVisit({ placeId: sp.id, stopId: s.id }); placePickerOpenFor = null; go('#trip'); },
          }, sp.name)))
        : h('p', { class: 'muted', style: 'font-size:12px;margin:2px 0' }, 'Nothing saved yet — save places from Explore or Places, then add them here.')));
    } else {
      itin.append(h('button', { class: 'chip', style: 'margin:4px 0 4px 22px', onclick: () => { placePickerOpenFor = s.id; render(); } }, '+ Add a place'));
    }
  });
  // S4 — places added from Explore/a place page before this trip has a matching leg yet
  // (or left unscheduled on purpose). Nothing is ever blocked on a leg existing first.
  const unscheduled = unscheduledVisits().map((v) => ({ visit: v, place: resolveItem(v.placeId) })).filter((x) => x.place);
  if (unscheduled.length) {
    itin.append(h('div', { class: 'trip-stop' }, [
      h('strong', {}, '📍 Not scheduled yet'),
      h('div', { class: 'trip-visits' }, unscheduled.map(({ visit, place }) =>
        tripVisitRow(visit, place, '', stops.length ? h('button', { class: 'chip', onclick: () => tripVisitSheet(place.id) }, '→ Assign') : null))),
    ]));
  }
  const stopName = h('input', { 'aria-label': 'Stop name', type: 'text', placeholder: 'Place or city' });
  const stopDate = h('input', { 'aria-label': 'Arrive date', type: 'date' });
  const stopEnd = h('input', { 'aria-label': 'Leave date', type: 'date' });
  itin.append(h('div', { class: 'field', style: 'margin-top:10px' }, [h('label', {}, 'Add a stop'), stopName,
    h('div', { class: 'trip-dates' }, [
      h('label', { class: 'trip-date-lbl' }, ['Arrive', stopDate]),
      h('label', { class: 'trip-date-lbl' }, ['Leave (optional)', stopEnd]),
    ]),
    h('p', { class: 'muted', style: 'font-size:12px;margin:6px 0 0' }, 'Set arrive and leave to cover several days in one stop — e.g. ten days in Chiang Mai, without adding each day.'),
    h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { if (stopName.value.trim()) { addStop({ title: stopName.value.trim(), country: getActiveCountry(), date: stopDate.value, endDate: stopEnd.value }); go('#trip'); } } }, 'Add stop')]));
  // quick add from saved (`saved` is hoisted above the stops loop — see comment there)
  if (saved.length) {
    itin.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Quick-add from saved:'));
    itin.append(h('div', { class: 'chips' }, saved.slice(0, 12).map((p) => h('button', { class: 'chip', onclick: () => { addStop({ title: p.name, country: p.country }); go('#trip'); } }, p.name))));
  }
  wrap.append(itin);

  // share this trip with a travel companion (backendless — link carries the stops)
  if (store.trip.stops.length) {
    wrap.append(h('div', { class: 'card' }, [
      h('h3', {}, 'Share this trip'),
      h('p', { class: 'muted' }, 'Send your itinerary to a travel companion — they can copy the stops straight into their own trip.'),
      shareButton('📤 Share my trip', 'My Mekong trip', () => shareUrl('in', encodeShare('trip', { stops: store.trip.stops.map((s) => ({ t: s.title, c: s.country, d: s.date, e: s.endDate })), notes: store.trip.notes || '' }, ensureMe()))),
    ]));
  }

  // budget log
  const bud = h('div', { class: 'card' }, [h('h2', {}, 'Budget log')]);
  const home = homeCurrency();
  const totals = {};
  store.trip.budgetLog.forEach((b) => { const c = b.currency || '?'; totals[c] = (totals[c] || 0) + (parseFloat(b.amount) || 0); });
  if (Object.keys(totals).length) {
    bud.append(h('p', { class: 'fair' }, 'Total: ' + Object.entries(totals).map(([c, v]) => `${v.toLocaleString()} ${c}`).join(' · ')));
    // Single grand total converted to the traveller's home currency (live or cached
    // offline rates). Flag if any currency has no known rate so the figure is honest.
    let homeSum = 0, allKnown = true;
    for (const [c, v] of Object.entries(totals)) {
      if (c === home) { homeSum += v; continue; }
      const conv = convert(v, c, home);
      if (conv == null || isNaN(conv)) allKnown = false; else homeSum += conv;
    }
    if (homeSum > 0 && Object.keys(totals).some((c) => c !== home)) {
      bud.append(h('p', { class: 'muted', style: 'margin:-4px 0 0' },
        `≈ ${money(Math.round(homeSum), home)} total${allKnown ? '' : ' (some rates unknown — refresh in Currency)'}`));
    }
  }
  store.trip.budgetLog.forEach((b) => bud.append(budgetLogRow(b)));
  wrap.append(bud);
  // Same "Log an expense" card as Budget & Expenses (#expenses) — that screen is the master;
  // this used to be its own, slightly different inline form (no date, no smart title chips).
  const c = getCountry(getActiveCountry());
  wrap.append(expenseAddCard({ currency: c ? c.currency : 'THB', afterAdd: () => go('#trip') }));
  mount(wrap, '#home');
}

const CK_CAT = { documents: '🛂 Documents', health: '💊 Health', money: '💳 Money', connectivity: '📶 Connectivity', packing: '🎒 Packing', safety: '🛡 Safety & laws' };



export function checklistScreen(countryId) {
  if (countryId) setActiveCountry(countryId);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Pre-trip checklist', '#home'));
  wrap.append(countryChips((id) => go(`#checklist-${id}`)));
  const items = checklistFor(getActiveCountry());
  if (!items.length) { wrap.append(h('p', { class: 'empty' }, 'The checklist is being prepared — reconnect once to download it.')); mount(wrap, '#home'); return; }
  const done = items.filter((it) => isChecked(it.id)).length;
  wrap.append(h('div', { class: 'banner' }, `${done} of ${items.length} done`));
  // group by category in CK_CAT order
  Object.keys(CK_CAT).forEach((cat) => {
    const group = items.filter((it) => it.cat === cat);
    if (!group.length) return;
    wrap.append(h('h2', { class: 'cat-title' }, CK_CAT[cat]));
    group.forEach((it) => {
      const row = h('label', { class: 'ck-row' }, [
        h('input', { type: 'checkbox', checked: isChecked(it.id) ? '' : null, onchange: () => { toggleChecklistItem(it.id); row.classList.toggle('done'); } }),
        h('div', { class: 'grow' }, [
          h('strong', {}, [it.title, it.iff ? h('span', { class: 'for-you-tag' }, 'for you') : null]),
          it.detail ? h('div', { class: 'muted' }, it.detail) : null,
          it.link ? (it.link.startsWith('#')
            ? h('button', { class: 'linklike', onclick: (e) => { e.preventDefault(); go(it.link); } }, 'Open in app →')
            : h('a', { href: it.link, target: '_blank', rel: 'noopener' }, 'Official link ↗')) : null]),
      ]);
      if (isChecked(it.id)) row.classList.add('done');
      wrap.append(row);
    });
  });
  mount(wrap, '#home');
}

export function plansScreen() {
  const prefs = store.profile.prefs;
  const tripName = (store.profile.name || '').trim();
  const tripLabel = tripName ? `${tripName}’s trip` : 'My Trip';
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Trip plans', '#home'));
  wrap.append(screenHint(`Suggested routes, matched to how you travel. Nights are guidance — stretch or compress freely. Add a plan to ${tripLabel} and edit it there.`));
  if (!profileIsSet()) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, 'Set your price range, party and trip length first and these plans sort themselves to fit you.'),
      h('button', { class: 'btn block', onclick: () => go('#foryou') }, '🎯 Set up "For you"'),
    ]));
  }
  wrap.append(countryChips((id) => { setActiveCountry(id); go('#plans'); }));
  const plans = suggestPlans({ country: getActiveCountry(), tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
  const PARTY_LBL = { solo: '🎒 solo', couple: '👫 couples', family: '👨‍👩‍👧 families', group: '👥 groups' };
  // "Sep 12–15" for a range inside one month, "Sep 28–Oct 2" across a boundary. Local to this
  // screen: the trip screen's own stopDateLabel is the ISO/day-count form used on saved stops,
  // and a suggestion being shaped wants the compact reading form instead.
  const planDay = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' });
  };
  const planRange = (a, b) => (a.slice(0, 7) === b.slice(0, 7)
    ? `${planDay(a)}–${Number(b.slice(8, 10))}`
    : `${planDay(a)}–${planDay(b)}`);

  plans.forEach((pl, idx) => {
    const card = h('div', { class: 'card' });
    card.append(h('div', { class: 'row-between' }, [h('h2', {}, pl.title), idx === 0 && profileIsSet() ? h('span', { class: 'cat-tag' }, 'Best match') : null]));
    card.append(h('p', { class: 'muted' }, `~${pl.days} days · ${pl.pace} pace · suits ${pl.party.map((x) => PARTY_LBL[x] || x).join(', ')}`));
    card.append(h('p', {}, pl.summary));

    // EDITABLE BEFORE YOU TAKE IT (direct request). The stops used to be a read-only <ol>:
    // a plan that offered two nights in Pai and three in Chiang Mai could be accepted or
    // ignored, and nothing in between, when "make it a week in Pai and one night in Chiang
    // Mai" is the normal thing a traveller wants to do with a suggestion.
    //
    // Adding a plan was ALSO dropping the nights entirely — addStop() was called with only a
    // title and a country, so a plan that carefully said "3 nights in Chiang Mai" produced an
    // undated stop and the trip's own day count stayed at zero. Editable nights plus a start
    // date fix both at once: the plan now lands as real arrival and departure dates.
    //
    // Local copy, so editing one card never mutates the shared ITINERARIES data.
    const draft = pl.stops.map((s) => ({ ...s }));
    const startEl = h('input', {
      type: 'date', 'aria-label': 'Start date for this plan',
      value: tripStartISO() || addDaysISO(todayISO(), 30),
    });
    const rows = h('div', { class: 'plan-stops' });
    const totalEl = h('p', { class: 'tiny muted plan-total' }, '');
    // Direct node references throughout — mount()'s automatic folding re-parents a card's
    // children, so anything looked up through `card` from a handler would come back null.
    const draw = () => {
      rows.replaceChildren();
      let cursor = startEl.value || todayISO();
      draft.forEach((s, i) => {
        const from = cursor;
        const to = addDaysISO(cursor, Math.max(1, s.nights));
        cursor = to;
        const nEl = h('span', { class: 'plan-n' }, String(s.nights));
        const step = (d) => {
          s.nights = Math.min(30, Math.max(1, s.nights + d));
          draw();
        };
        rows.append(h('div', { class: 'plan-stop' }, [
          h('div', { class: 'plan-stop-main' }, [
            h('strong', {}, s.title),
            // A compact friendly range, and counted in NIGHTS to match the stepper beside it.
            // stopDateLabel prints raw ISO and counts calendar DAYS ("2026-09-12 → 2026-09-14
            // · 3 days"), which on a card whose control says "2" read as a contradiction.
            h('div', { class: 'tiny muted' },
              `${planRange(from, to)} · ${s.nights} night${s.nights === 1 ? '' : 's'}${s.why ? ` · ${s.why}` : ''}`),
          ]),
          h('div', { class: 'plan-nights' }, [
            h('button', { class: 'btn ghost plan-step', 'aria-label': `One night fewer in ${s.title}`, onclick: () => step(-1) }, '−'),
            nEl,
            h('button', { class: 'btn ghost plan-step', 'aria-label': `One night more in ${s.title}`, onclick: () => step(1) }, '＋'),
          ]),
          h('button', {
            class: 'btn ghost plan-drop', 'aria-label': `Drop ${s.title} from this plan`,
            onclick: () => { draft.splice(i, 1); draw(); },
          }, '✕'),
        ]));
      });
      const nights = draft.reduce((a, s) => a + Math.max(1, s.nights), 0);
      totalEl.textContent = draft.length
        ? `${nights} night${nights === 1 ? '' : 's'} · ${draft.length} stop${draft.length === 1 ? '' : 's'} · back ${planDay(addDaysISO(startEl.value || todayISO(), nights))}`
        : 'Every stop dropped — add one back to use this plan.';
    };
    startEl.addEventListener('change', draw);
    card.append(h('label', { class: 'plan-start' }, [h('span', {}, 'Starting'), startEl]));
    card.append(rows, totalEl);
    draw();

    (pl.tips || []).forEach((t) => card.append(h('div', { class: 'list-note' }, t)));
    card.append(h('button', { class: 'btn block btn-spaced', onclick: (e) => {
      if (!draft.length) return;
      let cursor = startEl.value || todayISO();
      draft.forEach((s) => {
        const to = addDaysISO(cursor, Math.max(1, s.nights));
        addStop({ title: s.title, country: pl.country, date: cursor, endDate: to });
        cursor = to;
      });
      e.currentTarget.textContent = `✓ Added — open ${tripLabel} to edit`;
    } }, `＋ Add this plan to ${tripLabel}`));
    card.append(sourcesNote(pl.sources, null));
    wrap.append(card);
  });
  mount(wrap, '#home');
}
