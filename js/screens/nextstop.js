// "Plan your next stop" (#nextstop) — W2's real tool, mirroring arrivalScreen in weight and
// structure. "Just arrived" answers "I landed, what now"; this answers its counterpart,
// "I'm done here, what next" — navigate where you are, plan where you go, feel prepared to
// get there, and see what's worth doing once you land. Reached from Home's
// nextStopNudgeChip() (home.js) and nothing else builds a second version of any of this:
// every section below composes an existing tool rather than inventing one (design principle
// 7, UX_OVERHAUL_PROMPT.md W2).
//
// Five sections, in order: where you are (one line) → where next (Explore's own mini
// itinerary builder, whereNextSection, main.js task #138, reused verbatim) → getting there
// (planRoutes, the same graph powering Home's next-stop card, task #54) → what's there
// (allPlaces ranked by personalScore, the same "Travelling as" lens as Places, task #146) →
// commit (addStop, state.js). Steps 3-5 only appear once a candidate exists — the tail of
// whereNextSection's own chain for this city (nextChainTail, main.js) — so tapping a
// destination in step 2 is what unlocks the rest, never a separate picker.

import { store, addStop } from '../state.js';
import { h } from '../util.js';
import { getCountry, isCountryLoaded, loadAllCountries, allPlaces } from '../data/regions.js';
import { isFavorite } from '../state.js';
import { planRoutes, isRouteNode } from '../journey.js';
import { citySlug, personalScore } from '../render-utils.js';
import { placeCard } from './places.js';
import {
  go, mount, topbar, render, focusSpot, todayISO, daysUntilISO,
  whereNextSection, nextChainTail, planCard, twelveGoUrl,
} from '../main.js';

// Re-render this screen in place, preserving scroll — the same idiom whereNextSection's own
// candidate taps already use for Explore, and nextStopCard (home.js) uses for its own
// background route load. render() re-reads location.hash, so this only ever repaints
// #nextstop as long as the traveller is still on it.
function rerenderNextStop() {
  const y = window.scrollY;
  render();
  requestAnimationFrame(() => window.scrollTo(0, y));
}

// Step 1 — "Where you are", compressed to one line: the city, how long you've been here (if
// a dated stop covers today), and how many places here are not yet saved — the same
// "saved = already knows about" signal mightNotKnowSection (main.js) already uses, so this
// reads consistently with the rest of Explore rather than inventing a second "seen" concept.
function daysHere(cityName) {
  const t = todayISO();
  const slug = citySlug(cityName);
  const cur = (store.trip.stops || []).find((s) =>
    s.date && s.date <= t && (!s.endDate || s.endDate >= t) && citySlug(s.title) === slug);
  return cur ? 1 - daysUntilISO(cur.date) : null;
}
function whereYouAreLine(cc, cityName) {
  const c = getCountry(cc);
  const days = daysHere(cityName);
  const unsaved = allPlaces({ country: cc }).filter((p) => citySlug(p.city || '') === citySlug(cityName) && !isFavorite(p.id)).length;
  const bits = [`📍 ${cityName}${c ? `, ${c.name}` : ''}`];
  if (days != null && days > 0) bits.push(`Day ${days} here`);
  if (unsaved > 0) bits.push(`${unsaved} place${unsaved === 1 ? '' : 's'} nearby you haven’t saved`);
  return h('p', { class: 'muted', style: 'margin:0 0 10px' }, bits.join(' · '));
}

// Step 3 — "Getting there": the same planRoutes graph as Home's next-stop card and the full
// journey planner, background-loaded and cached by (from, to) pair, never a placeholder.
// Renders the same rich planCard used by the full planner (modes, duration, cost, notes,
// border crossings, 12Go link) rather than a second, thinner summary — the richer detail
// this section exists for. Degrades honestly when no bundled route exists, offline or not.
const _gtCache = {};
function gettingThereCard(fromCity, toCity) {
  const key = `${fromCity}|${toCity}`;
  if (key in _gtCache) {
    const plans = _gtCache[key];
    if (!plans.length) {
      return h('div', { class: 'card' }, [
        h('h2', { class: 'home-section' }, `🚌 Getting to ${toCity}`),
        h('p', {}, `No bundled overland route between ${fromCity} and ${toCity} yet.`),
        h('a', { class: 'btn ghost block', href: twelveGoUrl(fromCity, toCity), target: '_blank', rel: 'noopener' }, 'Search 12Go for this trip ↗'),
      ]);
    }
    return h('div', {}, [h('h2', { class: 'home-section' }, `🚌 Getting to ${toCity}`), planCard(plans[0], true)]);
  }
  loadAllCountries().then(() => {
    _gtCache[key] = (isRouteNode(fromCity) && isRouteNode(toCity)) ? planRoutes(fromCity, toCity) : [];
    rerenderNextStop();
  }).catch(() => { /* offline with nothing cached yet — stays absent for this session */ });
  return null;   // nothing to show until the check above resolves — never a placeholder
}

// Step 4 — "What is there": top places at the candidate, ranked by the same personalScore
// profile lens Places uses (task #146) — no time-of-day gating, since the candidate is
// somewhere the traveller has not reached yet. Omits itself rather than showing an empty
// heading when the candidate city has no place data.
function whatIsThereSection(candCc, cityName) {
  if (!candCc || !isCountryLoaded(candCc)) return null;
  const slug = citySlug(cityName);
  const places = allPlaces({ country: candCc })
    .filter((p) => citySlug(p.city || '') === slug)
    .slice()
    .sort((a, b) => personalScore(b) - personalScore(a));
  if (!places.length) return null;
  return h('section', {}, [
    h('h2', { class: 'home-section' }, `📍 What’s in ${cityName}`),
    ...places.slice(0, 4).map((p) => placeCard(p)),
    h('button', { class: 'btn ghost block', onclick: () => go(`#places-${candCc}-${slug}`) }, `See all in ${cityName} →`),
  ]);
}

// Step 5 — "Commit": set an arrival date and write it to store.trip.stops via the same
// addStop() every other add-a-stop entry point already uses — this is what makes Home's
// next-stop card light up and the nudge chip self-clear (both simply read the same array).
// The arrive date is required here specifically (tripScreen's own general add-a-stop form
// leaves it optional) because committing a date is the entire point of this flow, and the
// nudge-chip-clears acceptance criterion depends on one existing.
function commitCard(candidate) {
  const dateIn = h('input', { 'aria-label': 'Arrive date', type: 'date' });
  const endIn = h('input', { 'aria-label': 'Leave date', type: 'date' });
  const hint = h('p', { class: 'muted', style: 'font-size:12px;margin:6px 0 0' }, 'Set an arrival date to commit this stop.');
  const btn = h('button', { class: 'btn block btn-spaced', disabled: '' }, `＋ Add ${candidate.name} to My Trip`);
  dateIn.addEventListener('input', () => { btn.disabled = !dateIn.value; });
  btn.onclick = () => {
    if (!dateIn.value) return;
    addStop({ title: candidate.name, country: candidate.country, date: dateIn.value, endDate: endIn.value });
    btn.textContent = '✓ Added — see My Trip';
    btn.disabled = true;
    btn.onclick = null;
    hint.remove();
  };
  return h('div', { class: 'card' }, [
    h('h2', {}, `✅ Commit to ${candidate.name}`),
    h('div', { class: 'trip-dates' }, [
      h('label', { class: 'trip-date-lbl' }, ['Arrive', dateIn]),
      h('label', { class: 'trip-date-lbl' }, ['Leave (optional)', endIn]),
    ]),
    hint, btn,
    h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#trip') }, 'View My Trip →'),
  ]);
}

export function nextStopScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('🧭 Plan your next stop', '#home'));

  const focus = focusSpot(arg && getCountry(arg) ? arg : undefined);
  const cc = focus.spot.country;
  const fromCity = focus.spot.city;

  // 1. Where you are
  wrap.append(whereYouAreLine(cc, fromCity));

  // 2. Where next — Explore's own mini itinerary builder, reused verbatim; its own re-render
  // callback points back at this screen (not Explore) via rerenderNextStop.
  const wn = whereNextSection(cc, fromCity, rerenderNextStop);
  if (wn) {
    wrap.append(wn);
  } else {
    // No bundled route graph reachable from here (still loading, or genuinely no data for
    // this city) — never a dead end: the full planner always takes any two named places.
    wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#route') }, 'Full journey planner →'));
  }

  // The "selected candidate" for steps 3-5 is wherever whereNextSection's own chain
  // currently ends for this city — tapping a destination in step 2 IS the selection.
  const candidate = nextChainTail(fromCity);
  if (candidate) {
    wrap.append(gettingThereCard(candidate.from, candidate.name));
    const wit = whatIsThereSection(candidate.country, candidate.name);
    if (wit) wrap.append(wit);
    wrap.append(commitCard(candidate));
  } else if (wn) {
    wrap.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Tap a destination above to see how to get there, what’s there, and add it to your trip.'));
  }

  mount(wrap, 'home');
}
