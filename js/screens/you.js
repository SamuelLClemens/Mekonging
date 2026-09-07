// You — the personal hub and the "For you" results screen.
//
// Extracted from js/main.js (screen split, mk-v0.539.0). 257 lines that only render when the
// traveller taps the YOU tab, parsed on every launch before this.
import * as reminders from '../reminders.js';
import { getActiveCountry } from '../app-state.js';
import { budgetTarget, tripSpanDays } from '../budget-ui.js';
import {
  allFood,
  allPlaces,
  getCountry,
} from '../data/regions.js';
import { dateLocale } from '../i18n.js';
import { suggestPlans } from '../lazy-data.js';
import { navGroup, visibleItems } from '../nav-groups.js';
import {
  PRICE_TIER_LABEL,
  effectiveRating,
  personalScore,
  photoBlock,
  starsStr,
} from '../render-utils.js';
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
  dishDietVerdict,
  go,
  groupDoors,
  homeFold,
  hubRow,
  inferPhase,
  mount,
  nameEntryCard,
  placeFitReason,
  prefChips,
  priceLine,
  profileIsSet,
  quickChipLabel,
  render,
  rnThumb,
  topbar,
  tripSpendHome,
  tripStartISO,
  whoName,
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
  wrap.append(h('div', { class: 'card home-status you-chips', style: 'margin-top: var(--sp-3)', role: 'group', 'aria-label': 'Quick access' }, [
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
    const jc = h('div', { class: 'card', style: 'margin-top: var(--sp-3)' });
    const jrange = (from, to) => {
      if (!from) return '';
      const f = (iso) => { try { return new Date(iso + 'T00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }); } catch { return iso; } };
      return (!to || to === from) ? f(from) : `${f(from)} – ${f(to)}`;
    };
    jc.append(h('h3', {}, '🗺 Your journey'));
    jc.append(h('p', { class: 'muted tiny', style: 'margin: 0 0 var(--sp-2)' },
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
    const rc = h('div', { class: 'card', style: 'margin-top: var(--sp-3)' }, [h('h3', {}, '🔔 Coming up')]);
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
    h('summary', {}, h('span', { class: 'home-section', style: 'margin: 0' }, `${mine.ic} ${mine.title}`)),
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
    wrap.append(h('div', { class: 'row-between backup-line', style: 'margin-top: var(--sp-4)' }, [
      h('button', { class: 'btn ghost', style: 'flex:1;text-align:left', onclick: () => go('#settings') }, '⬇️ Back up your journal & budget'),
      h('button', { class: 'btn ghost', onclick: () => { store.profile.prefs.dataBackupDone = true; save(); render(); } }, 'Dismiss'),
    ]));
  }

  wrap.append(h('p', { class: 'disclaimer' },
    'Everything here stays on your device — no account, no tracking. Back it up in Settings so an update or a lost phone never loses your story.'));
  mount(wrap, '#me');
}

// ---- Best for <name> --------------------------------------------------------
// REBUILT (mk-v0.539.0). What was here ranked places by personalScore() and printed them as a
// column of ghost buttons reading "★★★★☆ Wat Pho" — a list that ASSERTED it was personal and
// showed nothing to back the claim. Three things were wrong with that, and they are the brief:
//
//  1. It never said WHY. personalScore() has explicit, enumerable reasons — it rewards a
//     matching price tier, kid-friendliness for a family, a hostel for a solo traveller, an
//     interest that matches a category. None of them reached the screen, so a traveller had no
//     way to tell a ranking from a shuffle, and no way to spot one built on a wrong assumption.
//     personalWhy() below reads the SAME facts the score used, so the explanation cannot drift
//     from the ranking; when nothing matched, it says nothing rather than inventing a reason.
//  2. It sent you to Settings to change anything. Five "＋ Trip length" chips, each a trip to
//     another screen and back. The things driving the ranking are now editable in place.
//  3. It had no photographs, in an app that self-hosts 527 of them, and it ignored food
//     entirely — the most personal thing the app knows, since it holds the traveller's diet and
//     allergies and 126 dishes tagged with allergens.
function personalWhy(p, prefs) {
  const cats = p.categories || [];
  const r = Number(p.rating) || 0;
  const why = [];
  // Read in the same order and on the same fields as personalScore (js/render-utils.js), so
  // the sentence a traveller reads is the arithmetic that put the place where it is.
  if (prefs.interests && prefs.interests.length) {
    const hit = prefs.interests.find((i) => cats.includes(i));
    if (hit) why.push(`matches your interest in ${String(hit).replace(/-/g, ' ')}`);
  }
  if ((prefs.party === 'family' || prefs.withBaby) && p.kidFriendly === true) why.push('good with children');
  if (prefs.party === 'solo' && p.stayType === 'hostel') why.push('sociable base for a solo trip');
  if (prefs.party === 'couple' && r >= 4.4) why.push('one of the highest-rated');
  if (prefs.party === 'group' && (p.stayType === 'hostel' || p.stayType === 'apartment')) why.push('room for a group');
  if (prefs.tripLength === 'long' && (p.stayDuration === 'long' || p.stayDuration === 'both')) why.push('suits a long stay');
  if (prefs.tripLength === 'short' && r >= 4.5) why.push('a highlight worth a short trip');
  // Price tier LAST, and only when nothing else matched. It contributes to the score like the
  // rest, but as a sentence it is the weakest thing here: every mid-tier place in the country
  // satisfies it, so leading with it printed the identical reason on all five picks — which is
  // worse than no reason at all, because it looks like an explanation and explains nothing.
  // A reason earns its place on this screen by distinguishing this pick from the next one.
  if (!why.length && prefs.budget && prefs.budget !== 'flexible' && p.budgetTier === prefs.budget) {
    why.push('priced how you travel');
  }
  return why.slice(0, 3);
}

// The controls that actually drive the ranking, editable where they are read. prefChips writes
// straight to the store; the callback re-renders so the list below reorders as you tap, which
// is the whole point — you can see the ranking respond instead of taking it on faith.
function rankingControls(prefs) {
  const box = h('details', { class: 'card fy-controls' });
  const active = [
    prefs.party && ({ solo: '🎒 Solo', couple: '👫 Couple', family: '👨‍👩‍👧 Family', group: '👥 Group' }[prefs.party]),
    prefs.withBaby && '🍼 With a baby',
    prefs.tripLength && ({ short: '≤1 week', medium: '2–3 weeks', long: '1 month +' }[prefs.tripLength]),
    prefs.budget && prefs.budget !== 'flexible' && PRICE_TIER_LABEL[prefs.budget],
    (prefs.interests || []).length && `${prefs.interests.length} interest${prefs.interests.length > 1 ? 's' : ''}`,
    (prefs.diet || []).length && `${prefs.diet.length} diet note${prefs.diet.length > 1 ? 's' : ''}`,
  ].filter(Boolean);
  box.append(h('summary', {}, active.length ? `⚙ Ranked for ${active.join(' · ')}` : '⚙ Nothing set yet — tap to tune'));
  const body = h('div', { class: 'fy-controls-body' });
  const line = (label, node) => { body.append(h('p', { class: 'tiny muted fy-lbl' }, label)); body.append(node); };
  line('Who is travelling', prefChips(
    [['solo', '🎒 Solo'], ['couple', '👫 Couple'], ['family', '👨‍👩‍👧 Family'], ['group', '👥 Group']],
    prefs.party, (v) => { prefs.party = prefs.party === v ? '' : v; save(); render(); }));
  line('How long', prefChips(
    [['short', '≤ 1 week'], ['medium', '2–3 weeks'], ['long', '1 month +']],
    prefs.tripLength, (v) => { prefs.tripLength = prefs.tripLength === v ? '' : v; save(); render(); }));
  line('Price', prefChips(
    [['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high], ['flexible', PRICE_TIER_LABEL.flexible]],
    prefs.budget, (v) => { prefs.budget = v; save(); render(); }));
  body.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#settings') },
    '⚙️ Interests, diet, accessibility — in Settings'));
  box.append(body);
  return box;
}

// One pick. A photograph, the name, what it costs, and why it is here — the four things that
// let a traveller decide whether to tap. `why` is omitted when there is nothing true to say.
function pickRow(p, prefs, common) {
  // Only the reasons that are NOT shared by every pick. A reason common to the whole list is
  // hoisted to one line above it (see the caller): with a baby in the party every top-ranked
  // place is kid-friendly, so printing "good with children" on all five rows looked like an
  // explanation and distinguished nothing. What is left here is what actually separates this
  // pick from the one below it — and often that is nothing, which is fine and says so by
  // rendering no line at all.
  const why = personalWhy(p, prefs).filter((w) => !common.has(w)).slice(0, 2).join(' · ');
  const warn = placeFitReason(p, prefs);
  const price = (p.priceRange && p.priceRange.currency)
    ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const meta = [p.city, price].filter(Boolean).join(' · ');
  return h('button', { class: 'fy-pick', onclick: () => go(`#place-${p.id}`) }, [
    rnThumb(p),
    h('span', { class: 'fy-pick-txt' }, [
      h('span', { class: 'fy-pick-name' }, p.name),
      meta ? h('span', { class: 'fy-pick-meta' }, meta) : null,
      why ? h('span', { class: 'fy-pick-why' }, `✓ ${why}`) : null,
      warn ? h('span', { class: 'fy-pick-warn' }, `! ${warn}`) : null,
    ]),
    h('span', { class: 'fy-pick-rate' }, `★ ${Number(effectiveRating(p.id, p.rating)).toFixed(1)}`),
  ]);
}

export function foryouScreen() {
  const prefs = store.profile.prefs;
  const wrap = h('div', { class: 'screen' });
  const name = whoName();
  wrap.append(topbar(name ? `Best for ${name}` : 'Best for you', '#home'));

  // Nothing set at all: one honest invitation rather than a screen pretending to rank. The
  // controls open expanded here, so the first tap tunes the ranking instead of navigating away.
  if (!profileIsSet()) {
    wrap.append(screenHint('Tell the app how you travel and every list in it puts what fits you first — places, dishes, trip plans. It stays on your device.'));
    const ctl = rankingControls(prefs);
    ctl.open = true;
    wrap.append(ctl);
    mount(wrap, '#home');
    return;
  }

  wrap.append(rankingControls(prefs));

  const cc = getActiveCountry();
  const c = getCountry(cc);
  const ranked = allPlaces({ country: cc }).slice().sort((a, b) => personalScore(b) - personalScore(a));

  // The lead pick gets the photograph at full width. One place, chosen by the same score as
  // the rest, presented as a recommendation rather than a row — this is the screen's answer to
  // "where should I go", and a 40px thumbnail is not an answer.
  const top = ranked[0];
  if (top) {
    const why = personalWhy(top, prefs).slice(0, 2).join(' · ');
    const card = h('div', { class: 'card fy-hero' });
    // The card's own h2 is the SECTION title, not the place name. mount() turns a card's first
    // heading into the fold summary and hoists it to the top, so making the place name the h2
    // put it above the "Top pick in Thailand" eyebrow that was supposed to introduce it. The
    // heading names the card, the place name is a strong line inside it, and folding now reads
    // correctly either way.
    card.append(h('h2', {}, `Top pick${c ? ' in ' + c.name : ''}`));
    card.append(photoBlock(top, top.name));
    card.append(h('p', { class: 'fy-hero-name' }, top.name));
    if (top.blurb) card.append(h('p', { class: 'muted fy-hero-blurb' }, top.blurb));
    if (why) card.append(h('p', { class: 'fy-hero-why' }, `✓ Why you: ${why}`));
    card.append(h('button', { class: 'btn block', onclick: () => go(`#place-${top.id}`) }, `Open ${top.name}`));
    wrap.append(card);
  }

  const rest = ranked.slice(1, 6);
  if (rest.length) {
    // The reasons every pick shares, said once. Computed as the intersection so the claim is
    // exactly true of the list it sits above.
    const sets = rest.map((p) => new Set(personalWhy(p, prefs)));
    const common = new Set([...(sets[0] || [])].filter((w) => sets.every((st) => st.has(w))));
    const pk = h('div', { class: 'card' });
    pk.append(h('h2', {}, 'Then these'));
    if (common.size) {
      pk.append(h('p', { class: 'tiny fy-common' },
        `✓ All ${rest.length} are ${[...common].join(' and ')}.`));
    }
    rest.forEach((p) => pk.append(pickRow(p, prefs, common)));
    pk.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#places-${cc}`) },
      'All places, ranked for you'));
    wrap.append(pk);
  }

  // Dishes the traveller can actually eat. New here, and the clearest gap in the old screen:
  // the app holds their diet and allergies and 126 dishes tagged with allergens, and a screen
  // called "Best for you" said nothing about food. Only rendered when there is a diet to
  // respect — with none set, a list of dishes is not personal, it is just a list.
  if ((prefs.diet || []).length || (prefs.allergies || []).length) {
    const fits = allFood({ country: cc })
      .filter((d) => d && d.name)
      .map((d) => ({ d, v: dishDietVerdict(d) }))
      .filter((x) => x.v === 'ok' || x.v === 'good')
      .slice(0, 5);
    if (fits.length) {
      const fc = h('div', { class: 'card' });
      fc.append(h('h2', {}, '🍽 Dishes that fit your diet'));
      fc.append(h('p', { class: 'tiny muted fy-lbl' }, 'Checked against what you told the app. Always confirm in person for a serious allergy.'));
      fits.forEach(({ d }) => fc.append(h('button', { class: 'fy-pick', onclick: () => go(`#dish-${d.id}`) }, [
        h('span', { class: 'fy-pick-txt' }, [
          h('span', { class: 'fy-pick-name' }, d.name),
          d.roman ? h('span', { class: 'fy-pick-meta' }, d.roman) : null,
        ]),
        h('span', { class: 'fy-pick-rate' }, '✓'),
      ])));
      fc.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#food') }, 'Identify any dish'));
      wrap.append(fc);
    }
  }

  // The matching plan, with the action that makes it theirs. Trip plans became editable in
  // mk-v0.537.0, so "take this plan" is no longer a commitment to someone else's itinerary —
  // which is what made this card worth keeping rather than cutting.
  const plans = suggestPlans({ country: cc, tripLength: prefs.tripLength, party: prefs.party, budget: prefs.budget });
  if (plans.length) {
    const pl = plans[0];
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'A plan shaped like your trip'),
      h('p', { class: 'fy-plan-title' }, [h('strong', {}, pl.title), ` — about ${pl.days} days, ${pl.pace} pace.`]),
      pl.summary ? h('p', { class: 'muted' }, pl.summary) : null,
      h('p', { class: 'tiny muted fy-lbl' }, 'Take it and change it — nights, stops and order are all yours to edit.'),
      h('button', { class: 'btn block', onclick: () => go('#plans') }, 'See plans that match'),
    ]));
  }

  mount(wrap, '#home');
}
