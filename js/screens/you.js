// You — the personal hub and the "For you" results screen.
//
// Extracted from js/main.js (screen split, mk-v0.539.0). 257 lines that only render when the
// traveller taps the YOU tab, parsed on every launch before this.
import * as reminders from '../reminders.js';
import { getActiveCountry } from '../app-state.js';
import { budgetTarget, tripSpanDays } from '../budget-ui.js';
import { allPlaces, getCountry } from '../data/regions.js';
import { dateLocale } from '../i18n.js';
import { suggestPlans } from '../lazy-data.js';
import { navGroup, visibleItems } from '../nav-groups.js';
import { PRICE_TIER_LABEL, effectiveRating, personalScore, starsStr } from '../render-utils.js';
import {
  save,
  store,
  unreadInboxCount,
  unreadMessagesCount,
} from '../state.js';
import { trailStats } from '../trail.js';
import { screenHint } from '../ui-widgets.js';
import {
  h,
  money,
} from '../util.js';
import {
  CAL_ICON,
  daysUntilISO,
  go,
  groupDoors,
  homeFold,
  hubRow,
  inferPhase,
  mount,
  nameEntryCard,
  profileIsSet,
  quickChipLabel,
  render,
  topbar,
  tripSpendHome,
  tripStartISO,
} from '../main.js';


export function meHubScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s space` : 'Your space'));

  // Per direct request: the name (and the identity card's live stats, incl. phrase count) no
  // longer show as their own lead card here — the name now IDENTIFIES this whole section
  // instead (the tab label above, meTabLabel(), and the topbar title just above read the
  // name directly), and every stat that card used to summarise already shows live on one of
  // the chips below (Journal's entry count, "Saved places · N", My Dictionary's phrase count)
  // — rank-collapse-never-remove, nothing here is a lost destination, only a duplicated card.
  // Until a name is set, this is where the option to add one leads instead — one tap, right
  // at the top, rather than a trip to Settings — and it steps aside for good the moment a
  // name is saved, so the chips below become the true lead.
  if (!name) wrap.append(nameEntryCard());

  // The journal, saved-place, phrase and identifier counts used to be read here for their own
  // chips. All four now show as live status on their rows inside My stuff below, through the
  // one liveStatus() table, rather than being counted a second time here.

  // Quick access chips — Calendar, My Dictionary, Budget and Journal lead (the four asked
  // for), then Documents, My trip, Traveller board, For you and Travel circle promoted to
  // chips too, so the whole "Trip tools" set has an at-a-glance status here. Every one of
  // these is now ALSO a chip, so the "Trip tools" tile group that used to sit below is gone
  // entirely (rank-collapse-never-remove: nothing here loses a destination — it is now
  // reached exactly one tap away, from this row, instead of two). Calendar and Budget reuse
  // Home's exact live logic — a bare label until the trip actually starts / a target is
  // actually set, then a day count and a live percentage with the same green/on-track,
  // yellow/tight, red/over colour ring. "Buy or sell" is renamed "Traveller board" here to
  // match the name the destination screen itself already uses everywhere else (its own
  // topbar, and the "🤝 Traveller board" chip inside Explore) — one name for one place.
  // Label on one line, live figure on its own beneath it. They used to be glued together as
  // `${label} · ${sub}`, which is what made "Chittraporn’s trip" and "Budget · 36 USD" wrap to
  // two lines while "Calendar" and "Travel circle" did not — four chips at four heights.
  const chip = (ic, label, sub, onclick, extraClass) => h('button', {
    class: 'status-chip' + (extraClass ? ' ' + extraClass : ''), onclick,
    'aria-label': sub ? `${label}, ${sub}` : label,
  }, [
    h('span', { class: 'status-ic', 'aria-hidden': 'true' }, ic),
    h('span', { class: 'status-txt' }, [
      h('span', { class: 'status-lbl' }, label),
      sub ? h('span', { class: 'status-sub' }, sub) : null,
    ]),
  ]);

  const startISO = tripStartISO();
  const calLabel = (startISO && daysUntilISO(startISO) <= 0) ? `Day ${1 - daysUntilISO(startISO)}` : quickChipLabel('calendar');

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

  // Shared-with-you items AND circle messages both count as "things waiting for you in
  // Travel circle" — one badge, so a new chat reply is just as visible as a new shared place.
  const unread = unreadInboxCount() + unreadMessagesCount();
  // Quick access is now exactly the shortcuts You does NOT itself contain: a day count, the
  // trip's stops, spend against target, and anything waiting in the circle — each living in
  // another section (Plan & travel, Money, People) and each with a live figure to justify
  // the shortcut. Nine chips became four, on two counts. Documents, Traveller board and For
  // you were bare labels with nothing live to report, which made them duplicate doors rather
  // than status. Journal and Your dictionary were worse: both are the FIRST rows of My stuff
  // directly below, open by default and carrying the same live counts — the same destination
  // twice on one screen. Everything dropped is one tap away, from the row or door that owns
  // it, which is the rule the rest of this refactor follows.
  const stopN = (store.trip.stops || []).length;
  const jStats = trailStats();
  // Headed, so it can fold like everything else on this screen. It had only an aria-label,
  // which meant a screen reader knew what the group was and a sighted traveller did not —
  // and the auto-fold, which keys on a real heading, skipped it entirely.
  wrap.append(h('div', { class: 'card home-status you-chips', style: 'margin-top:12px', role: 'group', 'aria-label': 'Quick access' }, [
    h('h3', { class: 'you-chips-head' }, '⚡ Quick access'),
    chip('📅', calLabel, null, () => go('#calendar')),
    chip('🧳', name ? `${name}’s trip` : 'My trip', stopN ? `${stopN} ${stopN === 1 ? 'stop' : 'stops'}` : null, () => go('#trip')),
    chip('💰', budgetLabel, budgetSub, () => go('#expenses'), budgetClass),
    chip('👥', 'Travel circle', unread ? `${unread} unread` : null, () => go('#circle'), unread ? 'budget-red' : ''),
    // There is no fifth chip. "Your journey" was one, spanning both columns, which is what
    // made this row uneven by construction — and it was the THIRD route to #journey on this
    // one screen: the My stuff list below carries it, and its own card (with the place count
    // and a "View your journey →" button) sits directly beneath this. Four chips is a clean
    // 2x2 and nothing is lost.
  ]));

  // (The old "Trip in numbers" strip — a second, static status-chip row directly below this
  // one, duplicating its Calendar day-count/Journal-entries/Budget-spend figures a second
  // time — is gone. Removed as a duplicate CHIP ROW, not a duplicate destination: every
  // figure it showed still shows live on the one chip above that already owns it.)

  // Your journey: the numbers and a door, no map. A static SVG preview used to sit here, and
  // it was the wrong thing in the wrong place — a thumbnail of a map is not a map. It cannot
  // be panned or zoomed, so it answers no question a traveller actually has, while taking the
  // vertical space of something that could. #journey renders the real, live, zoomable
  // satellite map; this is the door to it, and the stats line is what makes the door worth
  // opening. Still hidden entirely until there is a first pin — an empty door is a promise
  // with nothing behind it.
  if (jStats.places > 0) {
    const jc = h('div', { class: 'card', style: 'margin-top:12px' });
    const jrange = (from, to) => {
      if (!from) return '';
      const f = (iso) => { try { return new Date(iso + 'T00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }); } catch { return iso; } };
      return (!to || to === from) ? f(from) : `${f(from)} – ${f(to)}`;
    };
    jc.append(h('h3', {}, '🗺 Your journey'));
    jc.append(h('p', { class: 'muted tiny', style: 'margin:0 0 8px' },
      [`${jStats.places} ${jStats.places === 1 ? 'place' : 'places'}`,
        jStats.countries > 1 ? `${jStats.countries} countries` : null,
        jrange(jStats.from, jStats.to) || null,
      ].filter(Boolean).join(' · ')));
    jc.append(h('button', { class: 'btn block', onclick: () => go('#journey') }, 'View your journey →'));
    wrap.append(jc);
  }

  // Coming up: reminders set on calendar entries in the next week — one tap to open.
  const up = reminders.upcoming(7);
  if (up.length) {
    const rc = h('div', { class: 'card', style: 'margin-top:12px' }, [h('h3', {}, '🔔 Coming up')]);
    up.slice(0, 4).forEach((u) => {
      const it = u.item;
      const when = u.eventAt.toLocaleDateString(dateLocale(), { weekday: 'short', month: 'short', day: 'numeric' }) + (it.time ? ` ${it.time}` : '');
      rc.append(h('button', { class: 'btn ghost block reminder-row btn-spaced', onclick: () => go('#calendar') },
        `${CAL_ICON[it.type] || '🗓'} ${it.title} · ${when}`));
    });
    wrap.append(rc);
  }

  // (You Y3 — the by-category spend donut used to render again here, identical to Home's own
  // copy of budgetSummaryCard(). Dropped as a duplicated CARD, not a duplicated destination:
  // spend still shows in the numbers strip above and stays one tap away via the Money tile
  // below; the donut itself still renders on Home.)

  // --- The rest of You: its own section in full, then a door to each of the others.
  //
  // This used to be four hand-written chip groups — Your stuff, Everything, Plan & prepare,
  // You & settings — twenty-odd chips listing destinations that Home, the country hub and
  // #everything each listed again under their own names. You now shows the ONE group it
  // actually owns (My stuff, js/nav-groups.js) as full rows that say what each thing is,
  // and the other eight as doors. Nothing has moved further away: every destination those
  // four groups held is either a row below, or one tap inside the door of the section that
  // owns it, and Settings & help is a door of its own rather than a chip inside a bag.
  const mine = navGroup('mine');
  const mineBody = h('div', {});
  visibleItems(mine, store.profile.prefs.phase || inferPhase())
    .forEach((it) => mineBody.append(hubRow(it, getActiveCountry(), mine.accent)));
  wrap.append(h('details', { class: 'home-group-d', open: '' }, [
    h('summary', {}, h('span', { class: 'home-section', style: 'margin:0' }, `${mine.ic} ${mine.title}`)),
    mineBody,
  ]));

  // "Everything else" folds, and CLOSED by default (direct request). It is a door-grid to the
  // eight sections You does not own — a browse surface, not something to read on arrival — and
  // it was the tallest permanently-expanded block on the screen.
  //
  // The "All features, A–Z →" button that used to sit under it is GONE, and only because the
  // condition the request set is actually met: everythingScreen() builds its A–Z list from
  // `visibleGroups(phase)`, the same set groupDoors() renders, so every feature in that index
  // is inside one of these doors already, and My stuff — the ninth group, the one skipped
  // here — is the full section rendered directly above. Nothing lost a path. #everything is
  // still reached from Home and from search.
  wrap.append(homeFold('🗂️ Everything else', groupDoors(['mine']), 'youEverythingOpen', { defaultOpen: false }));
  // You Y4 — the backup nudge, demoted from a full-width card in second position to a single
  // quiet dismissible line near the foot. Same trigger (a single expense is still "something
  // worth protecting") and same dismiss behaviour; only the visual weight and position changed.
  if ((store.journal.entries.length || store.trip.budgetLog.length) && !store.profile.prefs.dataBackupDone) {
    wrap.append(h('div', { class: 'row-between backup-line', style: 'margin-top:16px' }, [
      h('button', { class: 'btn ghost', style: 'flex:1;text-align:left', onclick: () => go('#settings') }, '⬇️ Back up your journal & budget'),
      h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.dataBackupDone = true; save(); render(); } }, 'Dismiss'),
    ]));
  }

  wrap.append(h('p', { class: 'disclaimer' },
    'Everything here stays on your device — no account, no tracking. Back it up in Settings so an update or a lost phone never loses your story.'));
  mount(wrap, '#me');
}

export function foryouScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('For you', '#home'));

  // "For you" now shows your personalised RESULTS. The traveller profile that drives them
  // (who's travelling, baby, accessibility, trip length, budget, interests) is set in ONE
  // place — Settings — so preferences are not scattered across the app.
  if (!profileIsSet()) {
    wrap.append(screenHint('Set who you are and how you travel, and every list ranks what fits you first — and the trip plans match your situation. It all stays on your device.'));
    wrap.append(h('button', { class: 'btn block btn-spaced', onclick: () => go('#settings') }, '⚙️ Set up your travel profile in Settings'));
    mount(wrap, '#home');
    return;
  }
  const profSummary = [
    prefs.party && ({ solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group' }[prefs.party]),
    prefs.withBaby && 'with a baby',
    prefs.tripLength && ({ short: '≤1 week', medium: '2–3 weeks', long: '1 month+' }[prefs.tripLength]),
    prefs.budget && PRICE_TIER_LABEL[prefs.budget],
    (prefs.diet && prefs.diet.length) && `${prefs.diet.length} diet ${prefs.diet.length > 1 ? 'flags' : 'flag'}`,
  ].filter(Boolean).join(' · ');
  wrap.append(h('div', { class: 'row-between', style: 'align-items:center;gap:8px' }, [
    h('p', { class: 'muted', style: 'margin:0' }, profSummary ? `Ranked for: ${profSummary}` : 'Ranked to how you travel.'),
    h('button', { class: 'chip', onclick: () => go('#settings') }, '✎ Edit profile'),
  ]));

  // Inline "finish your profile" nudges — one quiet chip per unset field, each opening the
  // one place profiles live (Settings). More you fill, more the ranking is truly yours.
  const missing = [
    !prefs.party && "Who's travelling",
    !prefs.tripLength && 'Trip length',
    (!prefs.budget || prefs.budget === 'flexible') && 'Price',
    !(prefs.interests || []).length && 'Interests',
    !(prefs.diet || []).length && 'Diet & allergies',
  ].filter(Boolean);
  if (missing.length) {
    wrap.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 4px' }, 'Add these and your picks fit you even better:'));
    wrap.append(h('div', { class: 'chips' }, missing.map((m) =>
      h('button', { class: 'chip', onclick: () => go('#settings') }, `＋ ${m}`))));
  }

  {
    // top personalised picks in the active country
    const picks = allPlaces({ country: getActiveCountry() }).slice().sort((a, b) => personalScore(b) - personalScore(a)).slice(0, 5);
    const c = getCountry(getActiveCountry());
    if (picks.length) {
      const pk = h('div', { class: 'card' });
      pk.append(h('h2', {}, `Top picks for you${c ? ' — ' + c.name : ''}`));
      picks.forEach((p) => pk.append(h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:flex-start', onclick: () => go(`#place-${p.id}`) },
        `${starsStr(Math.round(effectiveRating(p.id, p.rating)))} ${p.name}`)));
      pk.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#places-${getActiveCountry()}`) }, 'See all places, ranked for you'));
      wrap.append(pk);
    }
    // the best-matching plan
    const plans = suggestPlans({ country: getActiveCountry(), tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
    if (plans.length) {
      const pl = plans[0];
      wrap.append(h('div', { class: 'card' }, [
        h('h2', {}, 'A plan that fits you'),
        h('p', {}, [h('strong', {}, pl.title), ` — ~${pl.days} days, ${pl.pace} pace.`]),
        h('p', { class: 'muted' }, pl.summary),
        h('button', { class: 'btn block', onclick: () => go('#plans') }, 'See matching trip plans'),
      ]));
    }
  }
  mount(wrap, '#home');
}
