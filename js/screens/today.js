// Things to do today — the day planner and its ranking.
//
// Extracted from js/main.js (screen split, mk-v0.539.0).
import { h } from '../util.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { allPlaces, getCountry } from '../data/regions.js';
import {
  CATEGORY_FAMILIES,
  aqiBand,
  catFamily,
  citySlug,
  fmtTemp,
  swatch,
  uvBand,
  withinDayTrip,
  withinNear,
} from '../render-utils.js';
import {
  getLastFix,
  store,
} from '../state.js';
import { online } from '../ui-widgets.js';
import { getCachedWeather, maybeRefreshWeather, spotKey, wmo } from '../weather.js';
import {
  festivalsInWindow,
  focusSpot,
  go,
  moodLine,
  mount,
  openStateNow,
  placeFitReason,
  refreshLocation,
  todoCard,
  todoContext,
  todoDoable,
  todoScore,
  topbar,
  travellingAsLine,
} from '../main.js';


// Session-only browsing state for this screen. Moved here with it: a module's `let` cannot be
// assigned from another module, so the filters and the code that sets them must share a file.
let dayUserLoc = null;   // GPS captured this session, for "near me" sorting
let todoFamily = 'all';  // active category filter
let todoPlan = 'now';    // "plan ahead" scenario for the ranking

export function daySuggestScreen(country) {
  const explicit = country && getCountry(country) ? country : null;
  if (explicit) setActiveCountry(explicit);
  const fs = focusSpot(explicit || undefined);
  const spot = fs.spot;
  const id = getCountry(spot.country) ? spot.country : (getCountry(getActiveCountry()) ? getActiveCountry() : 'th');
  setActiveCountry(id);
  todoFamily = 'all';   // fresh filter each visit, so a stale category never hides a new city's picks
  todoPlan = 'now';     // always open on "now"; planning ahead is an explicit, per-visit choice
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Things to do', `#country-${id}`));

  // A compact header (scope + conditions + filters) sits above the list, but the list itself
  // starts near the top so the traveller never scrolls past chrome to reach what they can do now.
  const header = h('div', { class: 'todo-header' });
  const listWrap = h('div', {});
  wrap.append(header, listWrap);

  function paint(rec) {
    header.innerHTML = ''; listWrap.innerHTML = '';
    const today = rec && rec.daily && rec.daily[0];
    const ctx = todoContext(rec, spot);
    const prefs = store.profile.prefs;
    const DAYPART_LBL = { morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening', night: 'Tonight' };

    // --- Scope row: where the picks are for, plus a one-tap location control. ---
    const gps = fs.source === 'gps';
    header.append(h('div', { class: 'todo-scope' }, [
      h('span', { class: 'todo-scope-city' }, `📍 ${gps ? 'Near ' : ''}${spot.city}`),
      h('button', { class: 'chip', onclick: async (e) => {
        const b = e.currentTarget; b.textContent = 'Locating…'; b.disabled = true;
        try { await refreshLocation(); go('#today'); return; } catch { /* denied/offline */ }
        b.textContent = 'Location off'; b.disabled = false;
      } }, gps ? 'Update' : '📍 Use my location'),
    ]));

    // --- Conditions now: one glanceable chip row (weather · time · UV · air). ---
    const cond = [];
    if (today) {
      const emo = wmo(today.code)[1];
      cond.push(`${emo} ${fmtTemp(today.tmin)}–${fmtTemp(today.tmax)}`);
      if (today.rainProb != null) cond.push(`☔ ${today.rainProb}%`);
    }
    cond.push(`🕑 ${DAYPART_LBL[ctx.daypart]}`);
    if (ctx.uv != null) { const ub = uvBand(ctx.uv); if (ub) cond.push(`UV ${Math.round(ctx.uv)} ${ub[0]}`); }
    if (ctx.aqi != null) { const ab = aqiBand(ctx.aqi); if (ab) cond.push(`AQI ${Math.round(ctx.aqi)}`); }
    header.append(h('div', { class: 'todo-cond' }, cond.map((b) => h('span', { class: 'todo-cond-chip' }, b))));
    header.append(h('p', { class: 'muted small', style: 'margin:4px 0 0' }, today ? moodLine(ctx.weather) : 'Connect once for weather-aware picks; meanwhile these are ranked by rating and distance.'));
    // Always show WHO these picks are ranked for — not just a prompt when unset. One line,
    // doubling as the edit control, so the traveller can always see and correct the app's
    // assumption about them from the surface that assumption is shaping.
    header.append(travellingAsLine());

    // --- Rank the doable pool for RIGHT NOW, then keep only what is actually reachable. ---
    const anchor = dayUserLoc || ((gps && getLastFix()) ? getLastFix() : { lat: spot.lat, lng: spot.lng });
    const doable = allPlaces({ country: id }).filter(todoDoable);
    // "Plan ahead" re-ranks the SAME reachable places for a hypothetical time or weather,
    // without touching the live conditions shown above. Reachability (distance) is unchanged;
    // only the score and the "why now" reasons shift, so the tiers stay stable.
    const ctxForPlan = (base, plan) =>
      plan === 'heat' ? { ...base, weather: 'hot' }
        : plan === 'rain' ? { ...base, weather: 'wet' }
          : plan === 'morning' ? { ...base, daypart: 'morning' }
            : plan === 'evening' ? { ...base, daypart: 'evening' }
              : plan === 'night' ? { ...base, daypart: 'night' }
                : base;
    let scored = doable.map((p) => todoScore(p, ctxForPlan(ctx, todoPlan), prefs, anchor));
    const rescore = () => { scored = doable.map((p) => todoScore(p, ctxForPlan(ctx, todoPlan), prefs, anchor)); };
    const sameCity = (x) => citySlug(x.p.city || '') === citySlug(spot.city || '');
    // In scope only if reachability is trustworthy, tiered by estimated DRIVE time: walkable,
    // within about an hour's drive ("near"), or up to a ~3-hour day trip ("trip"). When a place
    // has no coordinates we fall back to same-city as "near". Anything further is hidden.
    const tierOf = (x) => {
      if (x.dist != null) return x.dist <= 2.5 ? 'walk' : withinNear(x.dist) ? 'near' : withinDayTrip(x.dist) ? 'trip' : null;
      return sameCity(x) ? 'near' : null;
    };
    const inScope = scored.filter((x) => tierOf(x));

    // --- Category filter chips (only the families that exist nearby). ---
    const famsPresent = CATEGORY_FAMILIES.filter((f) => !['stay', 'transport', 'practical', 'other'].includes(f.key))
      .filter((f) => inScope.some((x) => x.cats.some((c) => catFamily(c) === f.key)));
    const chipRow = h('div', { class: 'chips todo-filter' });
    const mkChip = (key, label) => h('button', { class: 'chip', dataset: { f: key }, 'aria-pressed': todoFamily === key ? 'true' : 'false', onclick: () => { todoFamily = key; drawList(); } }, label);
    chipRow.append(mkChip('all', 'All'));
    famsPresent.forEach((f) => chipRow.append(mkChip(f.key, [swatch(f.color), ` ${f.emoji} ${f.label}`])));
    header.append(chipRow);

    // --- Plan ahead (progressive disclosure): re-rank for a different time or weather. ---
    const PLANS = [['now', 'Now'], ['heat', '☀️ Beat the heat'], ['rain', '🌧 If it rains'], ['morning', '🌅 Morning'], ['evening', '🌇 Evening'], ['night', '🌙 Tonight']];
    const PLAN_NOTE = { heat: 'to beat the midday heat', rain: 'for if it rains', morning: 'for the morning', evening: 'for the evening', night: 'for tonight' };
    const planNote = h('p', { class: 'muted small', style: 'margin:6px 0 0' });
    const updatePlanNote = () => { planNote.textContent = todoPlan === 'now' ? '' : `Re-ranked ${PLAN_NOTE[todoPlan]}. The live conditions above are unchanged.`; };
    const planChips = h('div', { class: 'chips todo-plan' }, PLANS.map(([k, lbl]) =>
      h('button', {
        class: 'chip', dataset: { p: k }, 'aria-pressed': todoPlan === k ? 'true' : 'false',
        onclick: () => {
          todoPlan = k;
          planChips.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', el.dataset.p === k ? 'true' : 'false'));
          rescore(); drawList(); updatePlanNote();
        },
      }, lbl)));
    updatePlanNote();
    header.append(h('details', { class: 'todo-plan-d', open: todoPlan !== 'now' ? '' : null }, [
      h('summary', {}, '🗓 Plan for a different time or weather'),
      planChips, planNote,
    ]));

    const listBody = h('div', {});
    listWrap.append(listBody);
    const TIERS = [
      { key: 'walk', label: '🚶 Right here' },
      { key: 'near', label: '📍 Nearby' },
      { key: 'trip', label: '🚌 Worth a day trip' },
    ];
    function renderTier(label, items) {
      listBody.append(h('h2', { class: 'home-section todo-tier' }, `${label} · ${items.length}`));
      const CAP = 8;
      items.slice(0, CAP).forEach((x) => listBody.append(todoCard(x, 2)));
      if (items.length > CAP) {
        const more = h('div', {});
        const btn = h('button', { class: 'btn ghost block', onclick: () => { items.slice(CAP).forEach((x) => more.append(todoCard(x, 2))); btn.remove(); } }, `Show all ${items.length}`);
        listBody.append(btn, more);
      }
    }
    function drawList() {
      chipRow.querySelectorAll('.chip').forEach((el) => el.setAttribute('aria-pressed', el.dataset.f === todoFamily ? 'true' : 'false'));
      listBody.innerHTML = '';
      let pool = scored.filter((x) => tierOf(x));
      if (todoFamily !== 'all') pool = pool.filter((x) => x.cats.some((c) => catFamily(c) === todoFamily));
      // Annotate each pick with fit + open status, then DROP known-closed places outright when
      // planning for NOW — a shut restaurant is a dead end, not a suggestion, so it no longer
      // just sinks to the bottom tagged; it is hidden, with a one-line note so nothing feels
      // silently removed. "Closed now" only applies to the NOW plan — a place shut this minute
      // is irrelevant when planning for tonight or tomorrow, and unknown hours are never treated
      // as closed (we only ever act on what the data actually says).
      const nowPlan = todoPlan === 'now';
      pool.forEach((x) => { x._fit = placeFitReason(x.p, prefs); x._closed = nowPlan && openStateNow(x.p) === false; });
      const closedNow = nowPlan ? pool.filter((x) => x._closed).length : 0;
      if (nowPlan) pool = pool.filter((x) => !x._closed);
      // Good fits lead; poor fits sink (but stay, tagged) — then score.
      const fitKey = (x) => (x._fit ? 1 : 0);
      pool.sort((a, b) => fitKey(a) - fitKey(b) || b.s - a.s);
      let rendered = 0;
      TIERS.forEach((t) => {
        const items = pool.filter((x) => tierOf(x) === t.key);
        if (items.length) { renderTier(t.label, items); rendered += items.length; }
      });
      if (closedNow) {
        listBody.append(h('p', { class: 'muted small', style: 'margin:8px 0 0' },
          `${closedNow} more ${closedNow === 1 ? 'is' : 'are'} closed right now, so ${closedNow === 1 ? "it's" : "they're"} hidden — see “Plan for a different time” above.`));
      }
      if (!rendered) {
        // Nothing trustworthy nearby: fall back to the nearest we can measure — but still only
        // within about an hour's drive, so we never pad a "near you" list with a 3-hour trip.
        const far = scored.filter((x) => withinNear(x.dist) && (todoFamily === 'all' || x.cats.some((c) => catFamily(c) === todoFamily)))
          .sort((a, b) => a.dist - b.dist).slice(0, 12);
        if (far.length) {
          listBody.append(h('p', { class: 'muted small', style: 'margin:8px 0 0' }, `Nothing mapped close to ${spot.city} yet — here are the nearest.`));
          renderTier('Nearest to you', far);
        } else {
          listBody.append(h('p', { class: 'empty' }, `Nothing to do mapped within about an hour’s drive of ${spot.city} yet. Open a nearby city, or browse all places.`));
        }
      }
    }
    drawList();

    // Festivals have their own screen; surface only a single quiet link when any fall in the trip window.
    const fests = festivalsInWindow().filter((e) => e.country === id);
    if (fests.length) listWrap.append(h('button', { class: 'linklike', style: 'display:block;margin:14px 0 0', onclick: () => go('#events') }, `🎉 ${fests.length} festival${fests.length === 1 ? '' : 's'} during your trip →`));
    // Home's "Right now" card used to end in "See more near me →" straight to #nearby. That
    // button merged into one onward action pointing here, so this screen now carries the
    // distance-sorted list itself — the destination moved one tap, it was not removed.
    // This list is ranked by what suits the time of day and weather; #nearby ranks purely by
    // distance, which is a different question and worth keeping reachable.
    listWrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#nearby') },
      '📍 What’s nearest to me, by distance →'));
  }

  let lastRec = getCachedWeather(spotKey(spot));
  paint(lastRec);
  if (online()) {
    maybeRefreshWeather(spot).then((r) => { if (r && (location.hash || '').startsWith('#today')) { lastRec = r; paint(r); } });
  }
  mount(wrap, '#home');
}
