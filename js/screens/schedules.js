// Transport schedules — curated reference departure times that ship with the app, so they are
// there in a bus station with no signal. Guidance only, always with the date they were checked.
import { setActiveCountry } from '../app-state.js';
import { COUNTRIES, getCountry } from '../data/regions.js';
import { SCHEDULES, SCHEDULES_VERIFIED, schedulesForCountry } from '../lazy-data.js';
import { citySlug } from '../render-utils.js';
import { screenHint } from '../ui-widgets.js';
import { h } from '../util.js';
import { focusSpot, freshnessLine, mount, topbar } from '../main.js';

// The timetable is data built into the app bundle — it updates when the app
// updates. (An in-page "re-sync" fetch would be answered cache-first by the
// service worker and silently discarded, so we do not pretend to sync.)
let schedCountry = '';

function scheduleCard(s) {
  const c = getCountry(s.country);
  return h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${c ? c.flag + ' ' : ''}${s.from} → ${s.to}`),
      h('span', { class: 'cat-tag' }, s.mode),
    ]),
    h('div', { class: 'muted', style: 'margin: var(--sp-0h) 0' }, `${s.operator} · ~${s.durationHrs[0]}–${s.durationHrs[1]} h · verified ${s.verified}`),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap: var(--sp-1h);margin: var(--sp-2) 0' }, s.departures.map((t) => h('span', { class: 'cat-tag' }, t))),
    s.note ? h('p', { class: 'muted', style: 'margin: var(--sp-1) 0' }, s.note) : null,
    s.book ? h('a', { class: 'btn ghost', href: s.book, target: '_blank', rel: 'noopener' }, 'Check / book ↗') : null,
  ]);
}

export function schedulesScreen(country) {
  if (country && getCountry(country)) { setActiveCountry(country); schedCountry = country; }
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Schedules', '#home'));
  wrap.append(screenHint('Reference departure times for popular routes — guidance only; always reconfirm with the operator or the booking links below.'));

  const filters = [{ id: '', name: 'All', flag: '🌏' }].concat(COUNTRIES.map((c) => ({ id: c.id, name: c.name, flag: c.flag })));
  const chips = h('div', { class: 'chips' }, filters.map((f) =>
    h('button', { class: 'chip', 'aria-pressed': schedCountry === f.id ? 'true' : 'false', dataset: { c: f.id },
      onclick: () => { schedCountry = f.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.c === f.id ? 'true' : 'false')); renderList(); } },
      `${f.flag} ${f.name}`)));
  wrap.append(chips);

  const schedFresh = freshnessLine(SCHEDULES_VERIFIED, 'Reference timetable', 365);
  if (schedFresh) wrap.append(schedFresh);

  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    const rows = schedCountry ? schedulesForCountry(schedCountry) : SCHEDULES;
    if (!rows.length) { listEl.append(h('p', { class: 'empty' }, 'No reference schedules for this country yet.')); return; }
    // Lead with departures from where the traveller actually is (GPS or focused city), so a
    // route on the far side of the country never sits on top. The rest collapses behind a tap.
    const fs = focusSpot(schedCountry || undefined);
    const focusCity = (fs.source === 'gps' || fs.source === 'focus') ? fs.spot.city : '';
    const here = focusCity ? rows.filter((s) => citySlug(s.from) === citySlug(focusCity)) : [];
    const rest = rows.filter((s) => !here.includes(s));
    if (here.length) {
      listEl.append(h('h3', { class: 'cat-title' }, `🚌 Departing ${focusCity} · ${here.length}`));
      here.forEach((s) => listEl.append(scheduleCard(s)));
      if (rest.length) {
        listEl.append(h('details', { class: 'filters-collapse' }, [
          h('summary', {}, `More schedules${getCountry(schedCountry) ? ' across ' + getCountry(schedCountry).name : ''} · ${rest.length}`),
          h('div', {}, rest.map((s) => scheduleCard(s))),
        ]));
      }
    } else {
      rows.forEach((s) => listEl.append(scheduleCard(s)));
    }
  }
  renderList();
  mount(wrap, '#home');
}
