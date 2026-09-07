// Home — "What now?" The present moment: adapts to trip phase (planning / arrived /
// traveling / post), shows today rather than everything. See OVERHAUL.md section 3.
//
// Rebuilt per the Home interview (OVERHAUL.md section 11, 2026-08-06). Three status
// surfaces were requested (a slim identity bar, a right-now situation line, a whole-trip
// status row) and are kept from duplicating each other by giving each a distinct time
// horizon — see the section's "Decisions" table. No placeholder chip ever renders: a status
// cell either carries a real value or is simply absent (rank-collapse-never-remove — nothing
// is deleted from navigation, an empty cell just does not draw until it has something to say).
//
// Chip consolidation pass: the old situation line (weather · spend today · next stop, ground
// phases only) and the separate budget donut card are both gone. Follow-up merge: Trip status
// and Quick access — two separate collapsibles, both just full of chips about the trip — are
// now one collapsible, quickAccessRow() below. It carries the phase switcher plus Calendar
// (bare label pre-trip, a running day count once the trip starts, next-plan-item folded into
// its sub) / Budget (percentage-of-budget + a green/yellow/red pace ring once a target and
// spend both exist, plain spent total otherwise) / Weather (or Scrapbook, post phase) /
// Journal — every phase, one box, nothing duplicated. Online/offline used to be a fifth chip
// here too; it now lives in the shared topbar() (main.js) instead, next to Saved/Settings/
// Emergency, reachable from every screen rather than one tap into Home's own collapsible.
//
// This is also the Great Split's proof case (OVERHAUL.md section 9, F2): most of Home's own
// helpers (phaseSwitchRow, homeStageBlock, ensureHomeWeather, topbar, cityAboutCard, etc.)
// still live in main.js — exported from there and imported back here via a circular import,
// safe because every one is only read inside a function body, never at module-evaluation
// time. New Home-specific logic introduced by this rebuild (the trip status row, the quick
// access row, the next-stop card) is written directly in this file instead, since it belongs
// to Home alone.

import { store, save } from '../state.js';
import { h, money } from '../util.js';
import { getCountry, loadCountry, isCountryLoaded, loadAllCountries } from '../data/regions.js';
import { getActiveCountry } from '../app-state.js';
import { getCachedWeather, spotKey, wmo } from '../weather.js';
import { fmtTemp, citySlug } from '../render-utils.js';
import { planRoutes, isRouteNode } from '../journey.js';
import { confirmAction, netMode, setNetMode, online, collapsibleCard } from '../ui-widgets.js';
import { budgetTarget, tripSpanDays } from '../budget-ui.js';
import { dateLocale } from '../i18n.js';
import { packState, onPackChange, deferPack } from '../offline-pack.js';
// setupRecapCard moved to js/screens/welcome.js with the onboarding flow it belongs to
// (screen split, mk-v0.539.0). Home is its only caller and shows it once ever, so it is
// fetched on demand below rather than imported statically — a static import here would pull
// the whole onboarding module into the launch graph on every launch, which is the opposite of
// the point of moving it.
let _recap = null;
import {
  go, mount, topbar, contextNow, render,
  inferPhase, focusSpot, phaseSwitchRow, homeStageBlock, homeWeatherCard, plannedStopsOutlook,
  ensureHomeWeather, ensurePlannedStopsWeather, nextPlanItem, evShort, tripSpendHome, groupDoors,
  cityAboutCard, todayISO, addDaysISO, tripStartISO, daysUntilISO,
  gamifyLevelBadge, locationSheet, ratesOnConsent,
  recentRoutesRow, identifyRow, homeFold,
  homeBudgetFold, homeRightNowFold, liveStatus, QUICK_CHIPS, quickChipKeys, quickChipLabel,
} from '../main.js';

export function homeScreen() {
  // "Right now" picks below need this country's place data; Home itself must never block
  // on it — the router's lazy-load gate (render()) deliberately excludes 'home' so first
  // paint stays instant even before any country has loaded. Kick the load off here in the
  // background instead, and quietly repaint Home in place (scroll position preserved) once
  // it lands, so the picks correct themselves rather than reading empty all session.
  if (!isCountryLoaded(getActiveCountry())) {
    const cc = getActiveCountry();
    loadCountry(cc).then(() => {
      const headRoute = (location.hash || '#home').slice(1).split('-')[0];
      if ((headRoute === '' || headRoute === 'home') && isCountryLoaded(cc)) {
        const y = window.scrollY;
        homeScreen();
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }).catch(() => { /* offline with nothing cached yet — leave today's honest fallback tip up */ });
  }

  const wrap = h('div', { class: 'screen' });

  // The four journey buttons sit inside the collapsed Trip status row below, with the active
  // stage highlighted, so a traveller sets or switches their phase in one tap. Home no longer
  // hides the picker once a phase is chosen, and the country map lives on the Explore tab.
  const storedPhase = store.profile.prefs.phase || '';
  const phase = storedPhase || inferPhase();   // infer a sensible stage until they choose one
  const focus = focusSpot();
  const leadCC = focus.spot.country;
  // 'arrived' used to be its own phase (separate from 'traveling'); merged into one
  // on-the-ground phase — see js/main.js PHASES. "Just arrived" now lives as its own
  // dismissible chip (justArrivedChip(), below) rather than a whole trip stage.
  const onGround = (phase === 'traveling');

  // H1 — slim identity + safety bar, replaces the old collapsing hero. Reusing topbar() (no
  // backHash — Home is a root tab) brings the 🆘 emergency button, Saved and Settings icons for
  // free: Home was previously the only screen without 🆘, since the hero displaced the top bar.
  const dateLabel = new Date().toLocaleDateString(dateLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
  wrap.append(topbar(`${focus.spot.city || 'Your trip'} · ${dateLabel}`, null));

  // The headline above names focus.spot.city with full confidence regardless of WHY it was
  // picked — a live GPS fix, a city merely browsed or set days ago, or (with neither) the
  // country's bare default. Only the first of those is actually where the traveller is right
  // now. While on the ground, flag the other two and offer a one-tap fix (locationSheet(), same
  // GPS-or-manual card onboarding's own location step uses) — this is the concrete bug where a
  // traveller who moved on without a fresh fix keeps reading their old city (e.g. still "Hanoi"
  // days after reaching Sapa) with no visible reason or way to correct it. Pre-trip, no fix is
  // normal (they have not left yet), so the hint stays silent until phase is actually 'traveling'.
  if (onGround && focus.source !== 'gps') {
    wrap.append(h('button', { class: 'btn ghost block location-stale-hint', onclick: () => locationSheet() },
      focus.source === 'focus'
        ? `📍 Showing ${focus.spot.city} from earlier — moved on? Tap to update`
        : `📍 Showing ${focus.spot.city} as a starting point — tap to set your real location`));
  }

  // NAV-1: one-shot "here is what I set up for you" recap, right after finishing the
  // value-first first run — proof that the few taps already personalised the app.
  if (store.profile.prefs.showSetupRecap) {
    // Normally already resolved: the traveller has just come through onboarding, so the module
    // is in memory and this renders in the same pass. The import path covers the other case —
    // the flag set in an earlier session and never dismissed — and re-renders once it lands
    // rather than leaving a promise the traveller never sees the result of.
    if (_recap) wrap.append(_recap());
    else import('./welcome.js').then((m) => { _recap = m.setupRecapCard; render(); }).catch(() => {});
  }

  // The field-guide download announces itself while it runs (js/offline-pack.js). It is the
  // one thing in this app that uses the network without being asked, so it does not get to be
  // invisible: the line says what is happening, and it carries the off-switch.
  const packLine = packStatusLine();
  if (packLine) wrap.append(packLine);

  // H2/H3 — Quick access: phase switcher + Calendar / Budget / Weather (Scrapbook, post) /
  // Journal / Online-offline, every phase — see quickAccessRow() below. One collapsible,
  // collapsed by default so it never competes with today's content. Collapsing removes
  // nothing from navigation — every value here still has its own full screen — an individual
  // chip simply does not render until it has a real value.
  const ctx = contextNow();
  wrap.append(quickAccessRow(phase, storedPhase, ctx));

  // "Just arrived" — a dismissible chip to the first-hour arrival guide. Only while on the
  // ground and not yet dismissed; X'd out with a confirm, then hidden until brought back
  // from Settings → Journey phase (settingsScreen, main.js) — never gone for good.
  if (onGround) {
    const ja = justArrivedChip(leadCC);
    if (ja) wrap.append(ja);
    const nsn = nextStopNudgeChip();
    if (nsn) wrap.append(nsn);
  }

  // Two one-tap surfaces, both repaying taps the consolidation charged, and both placed HERE
  // rather than above the doors on purpose. Measured at 375px, above the doors put them 1,293px
  // down the page — past a screen and a half of scrolling. A one-tap affordance reached only
  // after a scroll is not one tap, so they belong in Home's launcher zone with Quick access
  // and Search everything, not in the directory zone with the doors.
  //
  // "Back to" is learned rather than chosen: the four features that kept one-tap access are
  // Quick access's live chips, and those are a fixed guess of mine. This row is the traveller's
  // own most-recent four, and it renders nothing at all until they have opened something, so a
  // first run looks exactly as it did.
  //
  // Identify goes inline while on the ground and keeps its door while planning. All six of its
  // features are performed standing in front of the thing being identified, one-handed — which
  // is precisely when an extra tap costs most — and all six gained one in the consolidation.
  // Chips, not hub rows: six rows would add ~340px, more height than the consolidation saved.
  // Both of these already come back as their own collapsible (see recentRoutesRow /
  // identifyRow in main.js) — wrapping them again would nest a fold inside a fold.
  // "Back to" leads the sections, collapsed by default (per direct request): it is the
  // traveller's own recent four, useful when wanted and not worth a permanent block of
  // chips at the top of every launch. Identify is NO LONGER here — it moved below Right
  // now, further down this function, per the requested section order.
  const recents = recentRoutesRow();
  if (recents) wrap.append(recents);

  // Search everything — while travelling, this leads (moved up from its old spot just before
  // "Plan & tools") and the weather widget moves down to take its place instead, further below —
  // a straight placement swap per direct request. Post also leads with Search now, ahead of
  // the "Welcome back" recap below, per direct request ("start with search everything then
  // welcome back section"). Planning is the only phase where Search still trails (spliced
  // into the middle of its own stage block instead — see the planning branch below).

  // One stage-appropriate situational block. Planning gets a forward-looking outlook +
  // countdown + checklist hub (no near-me); travelling gets the live, forecast-aware
  // near-me card; post gets the return recap. This is what makes Home fit the traveller's
  // actual stage instead of showing "what's near you" to someone still at home or already back.
  // Kept as a variable (rather than appended inline) because the planning phase needs to
  // insert Search everything into its middle, below — see that block's comment.
  const stageBlock = homeStageBlock(phase, leadCC);
  // Planning and post still have a single stage block, and both were rendering as bare cards
  // outside the folding system entirely — which is why "Minimise all" appeared to skip part of
  // the screen in those two phases. They get their own key.
  //
  // The on-the-ground phase returns null here now: its two halves ("💰 Budget" and "🕒 Right
  // now") are appended separately below, in the requested order, with Weather above them —
  // which a single combined block made impossible.
  if (stageBlock) {
    if (phase === 'planning') wrap.append(homeFold('🗓 Your trip', stageBlock, 'homeStageOpen'));
    else if (phase === 'post') wrap.append(homeFold('👋 Welcome back', stageBlock, 'homeStageOpen'));
    else wrap.append(stageBlock);
  }

  // On the first online visit, pull the relevant city's forecast once (respects offline &
  // consent, de-duplicated) so the outlook and the "right now" forecast line populate.
  const phaseSpot = onGround
    ? (ctx.near ? ctx.near.spot : focus.spot)
    : focusSpot(getCountry(leadCC) ? leadCC : undefined).spot;
  ensureHomeWeather(phaseSpot);
  // Planning also needs the forecast for each PLANNED stop, not just the focus city, or the
  // per-stop outlook below falls back to seasonal normals for dates that are well inside the
  // forecast window. One batched request; no-ops offline or without consent.
  if (phase === 'planning') ensurePlannedStopsWeather();

  // The by-category budget donut used to render here too — dropped as a duplicated CARD (Home
  // chip consolidation): budget now shows exactly once on Home, as the Quick access row's
  // Budget chip above, still one tap from the full breakdown on #expenses.

  // Weather — while travelling, this now sits here (Search everything's old spot, swapped up
  // above) instead of nested at the top of the "Right now" card. It is the same rich widget as
  // the Weather screen itself (wxVizCard, via homeWeatherCard — see main.js), not a small ring,
  // per direct request. Wrapped in its own collapsible (same home-group-d pattern as every
  // other Home section) per direct request ("all the sections need to be collapsible including
  // widgets like weather") — homeWeatherCard's own `.card` styling becomes the foldable's body,
  // same technique whereYouAreCard already uses for cityAboutCard's `.card` below. Other
  // phases never had this widget, so they kept Search everything here instead.
  // The fold now renders in EVERY phase, and renders even with no forecast cached yet.
  // Both of those were bugs, and together they meant the default new traveller never saw
  // weather on Home at all: inferPhase() returns 'planning' until a trip has dates or GPS
  // puts you in the region, so `onGround` was false; and onboarding defaults an unanswered
  // network question to 'offline' (welcomeScreen's finish()), so nothing was ever fetched
  // to display. Each condition alone hid the section, silently, with nothing on screen
  // saying why. A forecast is just as useful while planning a trip as during one.
  // While PLANNING, the weather that matters is the weather at the stops on the itinerary,
  // not at whichever city the app happens to be focused on — and showing the focus city here
  // was also the second copy of it on the screen, since the planning block above carried the
  // same city's outlook (direct request: "that is redundant info"). The outlook card is gone
  // from that block and this fold carries the planned stops instead. With no stops entered
  // yet there is nothing to be redundant with, so the ordinary widget stands in.
  const plannedWx = phase === 'planning' ? plannedStopsOutlook() : null;
  wrap.append(weatherFold(plannedWx || homeWeatherCard(phaseSpot) || homeWeatherPending(phaseSpot)));
  // Search everything used to be a full-width button spliced in here (and, in the other two
  // phases, further up). It is now the magnifying glass in the topbar — see topbar() in
  // main.js — so it is one tap from EVERY screen instead of from a scroll position on this
  // one, and Home is a section shorter.

  // --- The requested on-the-ground section order, from here down ---------------------
  // Back to · Weather · Budget · Right now · Identify · Where you are · What do you need ·
  // All features A-Z · Give back. Weather went above (it used to sit below both of these);
  // Budget and Right now used to arrive together as one block from homeStageBlock, in the
  // opposite order, which is why they are appended individually now.
  if (onGround) {
    wrap.append(homeBudgetFold(leadCC));
    wrap.append(homeRightNowFold(phase, leadCC));

    // Next stop: real transport options between here and the next planned stop. Background-
    // loads all four countries' route data (journey.js's route graph memoises across all of
    // them on first build, so it must never run before that finishes) and quietly fills in or
    // omits itself entirely if no bundled route exists — never a dead-end card. It answers
    // "what's after this place", so it follows "what's happening here".
    const card = nextStopCard(ctx);
    // collapsibleCard lifts the card's own <h2> into the summary, so this needs no separate
    // heading — and it persists under the same prefs mechanism every other fold here uses.
    if (card) wrap.append(collapsibleCard(card, 'homeNextStopOpen'));

    // Identify — moved down here from Home's launcher zone at the top, per direct request.
    // Still inline (not behind a door) while on the ground, since identifying a dish or a
    // snake is a one-handed action performed standing in front of the thing; it is simply no
    // longer competing with weather, budget and today's picks for the top of the screen.
    const ident = identifyRow();
    if (ident) wrap.append(ident);

    // "Where you are": real, sourced city history and context, collapsed by default.
    const about = whereYouAreCard(leadCC, ctx.near ? ctx.near.spot.city : focus.spot.city);
    if (about) wrap.append(about);
  }

  // Post only: the gamification level badge, moved out of the middle of the Welcome-back
  // recap card (stageBlock above) to its own standalone element directly before Tools, per
  // direct request ("gamification level should move to before tools in home post section").
  if (phase === 'post') wrap.append(gamifyLevelBadge());

  // The feature sections, as doors — replacing the two chip bags that used to sit
  // here. "🧰 Tools" had become thirteen unrelated chips in one row (Trip plans, Currency
  // converter, Travel circle, Documents, Help & FAQ…) and "🔎 Identify what's around you"
  // six more, and the same destinations were listed again on You, again on the country hub,
  // and again on #everything — four hand-kept lists, four sets of drifting names.
  //
  // Home now shows one door per section (js/nav-groups.js), each saying what is behind it,
  // and the section's own hub holds its features. That is one extra tap to reach the long
  // tail, bought with a Home a traveller can take in at a glance — and nothing that is used
  // daily pays it: Calendar, Budget, Weather and Journal all still show live, one tap away,
  // in Quick access above, and Search everything is its own button.
  //
  // Settings & help is the one section deliberately absent: Settings and Emergency are
  // pinned in the topbar on every screen, and You carries the whole group. Phase filtering
  // is unchanged, only moved — it now lives on the items in the manifest (hidePost /
  // planningOnly), so a returned traveller still never sees Cash swap or a pre-trip
  // checklist, and a section whose every item is hidden drops out entirely.
  // The doors are the directory, and a traveller who knows their way around the app does not
  // need the whole directory standing open under today's content every single launch. Now
  // CLOSED by default (direct request) — the point of this pass is that Home fits on a screen
  // or two, and the door grid is the tallest block on it. Nothing is removed: the section is
  // one tap from open, and it remembers the choice.
  // EVERY section, in every phase — nothing skipped (direct request). It used to drop the
  // Settings door always and the Identify door while on the ground, on the grounds that both
  // were covered elsewhere on the screen; that made this section an almost-complete directory,
  // which is exactly why a separate "All features, A–Z" button had to sit under it as the
  // catch-all. With all nine doors here there is a path to every feature in the app from this
  // one fold, in planning, traveling and post alike, so the A–Z button is gone from Home as
  // well as from You. #everything is still reachable from search and by its own hash.
  wrap.append(homeFold('🧰 What do you need?', groupDoors(),
    'homeDoorsOpen', { defaultOpen: false }));

  // Give back — a calm, opt-in prompt to support the people of the region you are visiting.
  // Closed by default: it is worth offering and it is not today's business, and standing it
  // open on every launch is exactly the kind of permanent scroll this pass exists to remove.
  wrap.append(homeFold('❤️ Give back', h('div', { class: 'card give-back' }, [
    h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' }, 'Support trusted non-profits helping people across Thailand, Vietnam, Cambodia and Laos. The app handles no money — you give directly on each charity’s own site.'),
    h('button', { class: 'btn block', onclick: () => go('#donate') }, 'See causes to support'),
  ]), 'homeGiveBackOpen', { defaultOpen: false }));

  wrap.append(h('p', { class: 'disclaimer' },
    'Works offline. Everything stays on your device — no accounts, no tracking. Prices and rules are guidance with sources; verify locally.'));
  mount(wrap, '#home');
}

// "Just arrived" — a standalone dismissible chip (not one of quickAccessRow's grid chips,
// since it alone needs an X) leading to the first-hour arrival guide (arrivalScreen,
// main.js — already keyed to the traveller's actual gateway/city, so this one chip covers
// "arrival info for each place"). X-ing it out asks for confirmation (this hides a whole
// prompt, not a one-line tip — a plain tap-to-dismiss risks an accidental miss-tap losing
// it), then sets prefs.justArrivedHidden so it does not reappear on its own. It is never
// gone for good: Settings → Journey phase (settingsScreen, main.js) can always turn it back
// on, and the arrival guide itself stays reachable regardless via Explore's "Just arrived"
// tile and the near-me screen's own "Full arrival guide" button.
function justArrivedChip(cc) {
  if (store.profile.prefs.justArrivedHidden) return null;
  return h('div', { class: 'just-arrived-chip' }, [
    h('button', { class: 'ja-main', onclick: () => go(`#arrival-${cc}`) }, [
      h('span', { class: 'status-ic' }, '🛬'),
      h('span', { class: 'status-lbl' }, 'Just arrived — first-hour guide'),
    ]),
    h('button', {
      class: 'ja-x', 'aria-label': 'Hide the Just arrived chip',
      onclick: () => {
        confirmAction({
          title: 'Hide “Just arrived”?',
          body: 'It disappears from Home. Bring it back any time from Settings → Journey phase.',
          confirmLabel: 'Hide',
        }).then((ok) => { if (ok) { store.profile.prefs.justArrivedHidden = true; save(); render(); } });
      },
    }, '✕'),
  ]);
}

// "Planning your next stop" — same dismissible-chip shape as Just arrived, filling the gap
// left when nextStop() (below) has nothing to report. H4's real "🚌 Getting to X" card
// (nextStopCard, below) only ever appears once a next stop already exists; while travelling
// with no dated stop queued for today onward, Home otherwise says nothing here at all — this
// nudges the traveller to #nextstop (screens/nextstop.js) to plan and add one instead of
// leaving that silent — the real tool W2 built, not the bare My Trip form. Self-clears the
// moment a next stop exists again, same as any other "nothing to say yet" cell in this file;
// X-ing it out (for travellers deliberately not planning that far ahead) sets
// prefs.nextStopNudgeHidden — never gone for good, restored from Settings → Journey phase,
// same recovery path as Just arrived.
function nextStopNudgeChip() {
  if (store.profile.prefs.nextStopNudgeHidden || nextStop()) return null;
  return h('div', { class: 'just-arrived-chip' }, [
    h('button', { class: 'ja-main', onclick: () => go('#nextstop') }, [
      h('span', { class: 'status-ic' }, '🧭'),
      h('span', { class: 'status-lbl' }, 'Planning your next stop…'),
    ]),
    h('button', {
      class: 'ja-x', 'aria-label': 'Hide the planning-your-next-stop chip',
      onclick: () => {
        confirmAction({
          title: 'Hide this chip?',
          body: 'It disappears from Home. Bring it back any time from Settings → Journey phase.',
          confirmLabel: 'Hide',
        }).then((ok) => { if (ok) { store.profile.prefs.nextStopNudgeHidden = true; save(); render(); } });
      },
    }, '✕'),
  ]);
}

// H2/H3 merged — Quick access: one collapsible carrying the phase switcher plus every
// phase-appropriate status chip. Trip status and Quick access used to be two separate
// collapsibles; merging them recognises that both were just "chips about the trip," so
// splitting them was itself a kind of duplication. No chip is ever a placeholder — one with
// nothing to say just shows its bare label (rank-collapse-never-remove: nothing here is a
// distinct destination, every value still has its own full screen one tap away).
function quickAccessRow(phase, stored, ctx) {
  const chip = (ic, label, sub, onclick, extraClass) => h('button', {
    class: 'status-chip' + (extraClass ? ' ' + extraClass : ''), onclick,
  }, [h('span', { class: 'status-ic' }, ic), h('span', { class: 'status-lbl' }, sub ? `${label} · ${sub}` : label)]);

  // Calendar — bare label until the trip actually starts (tripStartISO); once it has, a
  // running day count (Day 1, Day 2…) replaces "Calendar" instead. The old Trip status
  // "X days to go" pre-trip countdown is dropped in favour of just naming the destination
  // screen — the day count is the one thing worth surfacing once a trip is actually under
  // way. The next plan item's own title + timing rides along as the sub-label, folded in from
  // the old, now-removed, standalone 📍 chip.
  const startISO = tripStartISO();
  let calLabel = quickChipLabel('calendar');
  if (startISO && daysUntilISO(startISO) <= 0) calLabel = `Day ${1 - daysUntilISO(startISO)}`;
  const calItem = nextPlanItem();
  let calSub = null;
  if (calItem) {
    const t = todayISO();
    const when = calItem.date === t ? 'Today' : (calItem.date === addDaysISO(t, 1) ? 'Tomorrow' : evShort(calItem.date));
    calSub = `${(calItem.title || 'Planned').slice(0, 18)} · ${when}`;
  }

  // Budget — with no target set, the plain spent total (unchanged — "how much has been
  // spent" is the honest answer when there is nothing to grade against). Once a target
  // exists AND at least one expense is logged, the label promotes to a live
  // percentage-of-budget and the chip takes a colour ring: green on track to land under
  // budget, yellow if the current pace projects going over, red if already over.
  const sp = tripSpendHome();
  const target = budgetTarget();
  let budgetLabel = quickChipLabel('budget');
  let budgetSub = (sp.any && sp.sum > 0) ? `${money(Math.round(sp.sum), sp.home)}${sp.allKnown ? '' : '+'}` : null;
  let budgetClass = '';
  if (target && sp.sum > 0) {
    const span = tripSpanDays();
    const dailyRate = span && span.elapsed > 0 ? sp.sum / span.elapsed : sp.sum;
    if (target.per === 'trip') {
      const pct = Math.round(sp.sum / target.amount * 100);
      budgetLabel = `${pct}% spent`; budgetSub = null;
      if (sp.sum > target.amount) budgetClass = 'budget-red';
      else if (span && span.total) budgetClass = (dailyRate * span.total > target.amount) ? 'budget-yellow' : 'budget-green';
      else budgetClass = pct >= 90 ? 'budget-yellow' : 'budget-green';
    } else {
      const pct = Math.round(dailyRate / target.amount * 100);
      budgetLabel = `${pct}% of daily budget`; budgetSub = null;
      if (dailyRate > target.amount) budgetClass = 'budget-red';
      else budgetClass = dailyRate >= target.amount * 0.9 ? 'budget-yellow' : 'budget-green';
    }
  }

  // Journal — entry count.
  const jN = store.journal.entries.length;
  const journalSub = jN ? `${jN} ${jN === 1 ? 'entry' : 'entries'}` : null;

  // Weather's own figure is richer than liveStatus's ("30°C · ☔ 95%" — today's rain
  // probability as well as the temperature), so it stays computed here.
  let wxIc = '🌤', wxSub = null;
  if (ctx.wx && ctx.wx.temp != null) {
    const temp = fmtTemp(ctx.wx.temp);
    if (temp) {
      wxIc = (wmo(ctx.wx.code) || [])[1] || '🌤';
      let rainNote = '';
      const spot = ctx.near ? ctx.near.spot : null;
      if (spot) {
        const rec = getCachedWeather(spotKey(spot));
        const today = rec && Array.isArray(rec.daily) ? rec.daily[0] : null;
        if (today && today.rainProb != null && today.rainProb >= 40) rainNote = ` · ☔ ${today.rainProb}%`;
      }
      wxSub = `${temp}${rainNote}`;
    }
  }

  // Which chips appear is the traveller's choice, defaulting to exactly four — Calendar,
  // Budget, Weather and Journal. Nothing is ever added automatically: a quick-access row is
  // only quick while it is short. The table and the default both live in main.js
  // (QUICK_CHIPS / quickChipKeys) so the Settings editor cannot drift from what Home draws.
  //
  // Calendar, Budget and Weather keep the Home-specific figures computed above (a running day
  // count with the next plan item, a colour-graded percentage of budget, temperature plus rain
  // probability) rather than liveStatus's plainer versions. Everything else takes its figure
  // straight from liveStatus, the same table the hub rows use.
  const RICH = {
    calendar: { ic: '📅', label: calLabel, sub: calSub },
    budget: { ic: '💰', label: budgetLabel, sub: budgetSub, cls: budgetClass },
    weather: { ic: wxIc, label: 'Weather', sub: wxSub },
    journal: { ic: '📔', label: quickChipLabel('journal'), sub: journalSub },
  };
  const chips = quickChipKeys().map((key) => {
    const def = QUICK_CHIPS.find((c) => c.key === key);
    if (!def) return null;
    // Post-trip there is no forecast worth a slot: the Weather chip becomes Scrapbook, which
    // is what a returned traveller actually wants in that position.
    if (key === 'weather' && phase === 'post') return chip('🏆', 'Scrapbook', null, () => go('#scrapbook'));
    const rich = RICH[key];
    if (rich) return chip(rich.ic, rich.label, rich.sub, () => go(def.hash), rich.cls);
    // An opt-in chip the traveller deliberately chose renders whether or not it has a figure
    // yet — they asked for the shortcut, so a bare label is still the shortcut they wanted.
    const live = def.live ? liveStatus(def.live) : null;
    return chip(def.ic, quickChipLabel(def), live && live.sub ? live.sub : null, () => go(def.hash), live && live.cls);
  }).filter(Boolean);
  // Online/offline used to be a chip here too — moved to the shared topbar() (main.js),
  // next to Saved/Settings/Emergency, so it is reachable from every screen, not just Home.

  // Open by default — it only ever collapses because the traveller closed it themselves
  // (prefs.quickAccessOpen explicitly false); an unset/undefined pref still means "open".
  const body = h('div', { style: 'padding-top: var(--sp-2)' });
  body.append(phaseSwitchRow(phase, stored, false));   // the segmented control only — no repeated caption
  body.append(h('div', { class: 'card home-status', style: 'margin-top: var(--sp-2)', role: 'group', 'aria-label': 'Quick access' }, chips));
  const det = homeFold('⚡ Quick access', body, 'quickAccessOpen');
  det.classList.add('quick-access');
  return det;
}

// The traveller's next planned stop from today onward (store.trip.stops), independent of
// whether route data exists for it — this cell needs nothing but a dated stop.
function nextStop() {
  const t = todayISO();
  return (store.trip.stops || [])
    .filter((s) => s.date && s.date >= t)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0] || null;
}

// H4 — real transport options to the next stop. journey.js's route graph walks every
// country's routes and memoises PERMANENTLY on first build, so isRouteNode()/planRoutes()
// must never be called before all four countries have loaded — calling either one early (even
// just to check) would build the graph from whatever is loaded so far and freeze it incomplete
// for the rest of the session. So this card checks the cache only; the very first check for a
// given from/to pair always defers to loadAllCountries().then(), never inline. Background-load,
// then quietly appear or omit — never a "checking…" placeholder and never block Home.
const _routeCache = {};
function nextStopCard(ctx) {
  const stop = nextStop();
  const fromCity = ctx.near ? ctx.near.spot.city : null;
  if (!stop || !fromCity) return null;
  const key = `${fromCity}|${stop.title}`;
  if (key in _routeCache) {
    const plans = _routeCache[key];
    if (!plans.length) return null;   // looked, found nothing (or free-text stop title matched no hub) — omit rather than show a dead end
    const pl = plans[0];
    const changes = pl.changes === 0 ? 'Direct' : `${pl.changes} change${pl.changes > 1 ? 's' : ''}`;
    const timeStr = pl.totalHrs[1] ? `~${pl.totalHrs[0]}–${pl.totalHrs[1]}h moving` : '';
    return h('div', { class: 'card next-stop-card' }, [
      h('h2', {}, `🚌 Getting to ${stop.title}`),
      h('p', { style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, [changes, timeStr].filter(Boolean).join(' · ')),
      h('button', { class: 'btn ghost block', onclick: () => go('#route') }, 'Full journey planner →'),
    ]);
  }
  loadAllCountries().then(() => {
    _routeCache[key] = (isRouteNode(fromCity) && isRouteNode(stop.title)) ? planRoutes(fromCity, stop.title) : [];
    const headRoute = (location.hash || '#home').slice(1).split('-')[0];
    if (headRoute === '' || headRoute === 'home') {
      const y = window.scrollY;
      homeScreen();
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }).catch(() => { /* offline with nothing cached yet — simply stays absent for this session */ });
  return null;   // nothing to show until the check above resolves — never a placeholder card
}

// Minimise or expand every section at once. Per-section folds are the precise control; this
// is the blunt one, and it is the one that answers "I open the app to check one thing and
// scroll past nine sections to reach it". Collapsing everything leaves Home as a short list
// of section names — every one still a single tap from its content — and that shape persists
// until the traveller changes it.
//
// The label reflects what the NEXT tap will do, decided by whether anything is currently
// open, so one control covers both directions without becoming a pair of buttons.

// H5 — real, sourced city context, collapsed by default so it does not compete with today's
// content. cityAboutCard() already returns null when there is no curated history for the
// city, so this naturally omits itself rather than showing an empty card.
function whereYouAreCard(cc, cityName) {
  if (!cityName) return null;
  const inner = cityAboutCard(cc, citySlug(cityName));
  if (!inner) return null;
  return homeFold('📍 Where you are', inner, 'whereYouAreOpen', { defaultOpen: false });
}

// Stand-in body for the weather fold when no forecast is cached yet. The section must never
// silently vanish — that is exactly how a traveller ends up thinking the app has no weather.
// This NEVER fetches: a traveller who has deliberately switched data off gets the switch
// offered back, not flipped for them (see ui-widgets.js online()).
// ---- the field-guide download, while it is happening ------------------------
// The app downloads roughly 95 MB of photos and animal calls on its own, without asking (see
// js/offline-pack.js for why that is the right default and why it is staged). Doing that
// silently would not be acceptable: on an unrecognised connection — which on iOS is every
// connection, since Safari ships no Network Information API — the app cannot tell Wi-Fi from
// a metered foreign SIM, and data in this region is sold by the megabyte.
//
// So this line is the safeguard, and it is deliberately not a permission dialog. Nobody
// standing in an airport wants to arbitrate a storage decision before they have seen the app,
// and a prompt would be dismissed unread by exactly the travellers who most need the photos.
// It states what is happening, in bytes, and carries one tap to stop and wait for Wi-Fi.
//
// It disappears the moment the pack is complete. A permanent status line for a finished
// background task is clutter, and there is a full account in Settings for anyone who wants it.
function packStatusLine() {
  const s = packState();
  if (!s.running && !s.deferred && !s.quotaHit) return null;
  const mb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(0)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

  const line = h('div', { class: 'card pack-line' });
  const txt = h('p', { class: 'pack-line-txt' });
  const act = h('div', { class: 'pack-line-act' });
  line.append(txt, act);

  const paint = () => {
    const st = packState();
    if (!st.running && !st.deferred && !st.quotaHit) { line.remove(); return; }
    act.innerHTML = '';
    if (st.quotaHit) {
      txt.textContent = `📥 This device is out of space, so not all the field-guide photos could be saved. ${mb(st.storedBytes)} is here and works offline.`;
      act.append(h('button', { class: 'btn ghost tiny-btn', onclick: () => go('#settings') }, 'Manage'));
    } else if (st.deferred) {
      txt.textContent = `📥 The rest of the field guide is waiting for Wi-Fi. The dangerous-species photos are already on this device.`;
      act.append(h('button', { class: 'btn ghost tiny-btn', onclick: () => go('#settings') }, 'Manage'));
    } else {
      // Only the safety tier is named. It is the one tier worth a traveller knowing about in
      // the moment — 9 MB of photographs of what can hurt them — and the other two are
      // scenery and dinner by comparison.
      const what = st.tier === 'safety' ? 'photos of dangerous species' : 'the field guide';
      const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
      txt.textContent = `📥 Saving ${what} for offline use — ${pct}%${st.bytes ? ` · ${mb(st.bytes)}` : ''}`;
      act.append(h('button', { class: 'btn ghost tiny-btn', onclick: () => { deferPack(); paint(); } }, 'Not now'));
    }
  };
  paint();
  // Same lifetime rule as the Settings card: unsubscribe when the node leaves the DOM, or
  // every Home render leaves another live closure behind.
  const off = onPackChange(() => { if (line.isConnected) paint(); else off(); });
  return line;
}

function homeWeatherPending(spot) {
  const card = h('div', { class: 'card' });
  const where = (spot && spot.city) ? ` for ${spot.city}` : '';
  if (netMode() === 'offline') {
    card.append(h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' },
      'You have data switched off, so the forecast cannot update. Everything else here works offline.'));
    card.append(h('button', {
      class: 'btn block',
      onclick: () => { setNetMode('online'); ratesOnConsent(); render(); },
    }, '📶 Turn data back on'));
    return card;
  }
  if (!online()) {
    card.append(h('p', { class: 'muted', style: 'margin: 0' },
      'No connection right now — the forecast updates as soon as you are back online.'));
    return card;
  }
  // Consent given and a connection present: ensureHomeWeather() above is already fetching and
  // re-renders Home when it lands, so this is a genuinely transient state.
  card.append(h('p', { class: 'muted', style: 'margin: 0 0 var(--sp-2)' }, `Getting the latest forecast${where}…`));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go('#weather') }, 'Full forecast →'));
  return card;
}

// The big weather widget (homeWeatherCard, main.js) as its own collapsible — same home-group-d
// pattern as every other Home section, open by default (it was always visible before this
// split existed; a traveller who collapses it keeps it collapsed next visit, same as Where you
// are/Quick access already do).
function weatherFold(inner) {
  return homeFold('🌦 Weather', inner, 'homeWeatherOpen');
}
