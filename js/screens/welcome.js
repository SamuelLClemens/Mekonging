// First run — the three-step setup, and the one-shot recap Home shows afterwards.
//
// Extracted from js/main.js (screen split, mk-v0.539.0), and of everything in that file this
// is the clearest case: onboarding runs ONCE per traveller and was parsed on every launch
// forever after. js/screens/home.js imports setupRecapCard from here rather than from main.js.
import { save, store } from '../state.js';
import { h } from '../util.js';
import { INTERESTS } from '../data/regions.js';
import { uiLangMeta } from '../i18n.js';
import { PRICE_TIER_LABEL } from '../render-utils.js';
import { foldable, netMode } from '../ui-widgets.js';
import {
  applyTheme,
  dietPicker,
  go,
  languageSheet,
  locationFixCard,
  logoSVG,
  mount,
  prefChips,
  render,
} from '../main.js';


// welcomeStep is module state so Next/Back re-render the same focused flow without a route,
// and it moved here with the screen for the usual reason: it is assigned by the code below.
const WELCOME_STEPS = 3;
let welcomeStep = 0;

export function welcomeScreen() {
  const prefs = store.profile.prefs;
  const step = Math.min(Math.max(welcomeStep | 0, 0), WELCOME_STEPS - 1);
  const wrap = h('div', { class: 'screen welcome' });

  // Finishing = leave onboarding for a personalised Home. Show the recap only when the
  // traveller actually personalised something, so a pure "just explore" skip lands clean.
  const somethingSet = () => !!(prefs.party || prefs.withBaby || prefs.soloFemale
    || (prefs.diet || []).length || (prefs.access || []).length || prefs.tripLength
    || (prefs.interests || []).length || (prefs.budget && prefs.budget !== 'flexible'));
  const finish = () => {
    store.profile.seenWelcome = true;
    prefs.geoAsked = true;
    prefs.showSetupRecap = somethingSet();
    welcomeStep = 0;
    save();
    go('#home');
  };
  const goStep = (n) => { welcomeStep = Math.min(Math.max(n, 0), WELCOME_STEPS - 1); welcomeScreen(); };

  // Compact header: small logo + a progress indicator so the traveller always knows where
  // they are and that the flow is short (three steps). The language chip sits here — not
  // gated behind any step — so a wrong first-run guess (detectPreferredLang(), js/i18n.js) can
  // be corrected before the traveller has to read a single question in it. Reuses the exact
  // picker every other screen's topbar flag opens (languageSheet()), so it is one consistent
  // control rather than a second, onboarding-only implementation.
  const lang = uiLangMeta();
  wrap.append(h('section', { class: 'hero welcome-hero' }, [
    h('div', { class: 'logo-wrap', html: logoSVG() }),
    h('p', { style: 'margin:0' }, 'A few quick taps and Home fits you — or skip and explore. Everything stays on your device.'),
    h('button', {
      class: 'chip', 'data-no-i18n': '', style: 'margin-top:10px',
      'aria-label': `Language: ${lang.name} — tap to change`, title: `${lang.native} — change language`,
      onclick: () => languageSheet(),
    }, `${lang.flag} ${lang.native}`),
  ]));
  wrap.append(h('div', { class: 'welcome-progress', role: 'group', 'aria-label': `Step ${step + 1} of ${WELCOME_STEPS}` },
    [0, 1, 2].map((n) => h('span', { class: 'wp-dot' + (n === step ? ' on' : (n < step ? ' done' : '')) }))));

  // ---- Step 1 — Location ----
  // Promoted out of the old collapsed "Fine-tune" foldable at the very end of setup, where it
  // was easy to never see at all: with no live fix and nothing focused yet, every screen that
  // reads "where am I" falls back to the country default (js/main.js focusSpot()) — which is
  // exactly how a traveller ends up reading "Hanoi" while standing in Sapa. Asked plainly here,
  // with a working manual fallback right beside it, and still fully skippable via Next.
  if (step === 0) {
    wrap.append(locationFixCard());
    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn', style: 'margin-left:auto', onclick: () => goStep(1) }, 'Next →'),
    ]));
    // A first-timer can bail out of setup entirely and personalise later (Settings, "For you").
    // Nothing is lost by skipping and nothing is silently switched off by it — which was not
    // true while this flow opened on the network question.
    wrap.append(h('button', { class: 'btn ghost block welcome-skip', onclick: finish }, 'Skip — just explore'));
  }

  // ---- Step 2 — Who is travelling (+ baby, solo female) ----
  if (step === 1) {
    const whoCard = h('div', { class: 'card' });
    whoCard.append(h('h2', {}, 'Who is travelling?'));
    whoCard.append(prefChips([['solo', '🎒 Solo'], ['couple', '👫 Couple'], ['family', '👨‍👩‍👧 Family'], ['group', '👥 Group']], prefs.party, (v) => { prefs.party = prefs.party === v ? '' : v; save(); }));
    whoCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Bringing little ones?'));
    const babyChip = h('button', { class: 'chip', 'aria-pressed': prefs.withBaby ? 'true' : 'false',
      onclick: (e) => { prefs.withBaby = !prefs.withBaby; save(); e.currentTarget.setAttribute('aria-pressed', prefs.withBaby ? 'true' : 'false'); } }, '🍼 Travelling with a baby or toddler');
    whoCard.append(h('div', { class: 'chips' }, [babyChip]));
    whoCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Travelling alone? We will surface tailored, non-alarmist safety notes.'));
    const soloFemChip = h('button', { class: 'chip', 'aria-pressed': prefs.soloFemale ? 'true' : 'false',
      onclick: (e) => { prefs.soloFemale = !prefs.soloFemale; save(); e.currentTarget.setAttribute('aria-pressed', prefs.soloFemale ? 'true' : 'false'); } }, '🧭 Solo female traveller');
    whoCard.append(h('div', { class: 'chips' }, [soloFemChip]));
    wrap.append(whoCard);
    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn ghost', onclick: () => goStep(0) }, '← Back'),
      h('button', { class: 'btn', style: 'margin-left:auto', onclick: () => goStep(2) }, 'Next →'),
    ]));
  }

  // ---- Step 3 — Food allergies / diet (the most visibly personalised surface) ----
  if (step === 2) {
    const dietCard = h('div', { class: 'card' });
    dietCard.append(h('h2', {}, 'Any food allergies or diet?'));
    dietCard.append(h('p', { class: 'muted' }, 'Pick any that apply. The app will highlight dishes that fit you when identifying food, and pin your exact phrases at the top of the phrasebook to show a cook. Guidance only — always confirm in person for a serious allergy.'));
    dietCard.append(dietPicker());
    wrap.append(dietCard);

    // Everything else is optional and tucked away — reachable now for keen setters, invisible
    // to travellers who just want to get moving. All fields also live in Settings. Location
    // used to be folded away in here too; it now has its own step (Step 2, above) since a
    // missing or stale fix silently breaks weather/near-me everywhere else in the app.
    wrap.append(foldable('⚙️ Fine-tune (optional): accessibility, price, interests', () => {
      const box = [];
      // Accessibility + text size
      const accCard = h('div', { class: 'card' });
      accCard.append(h('h3', {}, 'Accessibility needs'));
      accCard.append(h('p', { class: 'muted' }, 'We will surface honest, practical guidance for how these countries work for you. Pick any that apply, or none.'));
      const accRow = h('div', { class: 'chips' });
      [['mobility', '♿ Wheelchair / limited mobility'], ['vision', '🦯 Blind / low vision'], ['hearing', '🦻 Deaf / hard of hearing']].forEach(([id, lbl]) => {
        const on = () => (prefs.access || []).includes(id);
        accRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
          onclick: (e) => { prefs.access = prefs.access || []; const i = prefs.access.indexOf(id); if (i >= 0) prefs.access.splice(i, 1); else prefs.access.push(id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, lbl));
      });
      accCard.append(accRow);
      accCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Text size'));
      accCard.append(prefChips([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], store.profile.textScale || 'm', (v) => { store.profile.textScale = v; save(); applyTheme(); }));
      box.push(accCard);
      // How you like to travel
      const fitCard = h('div', { class: 'card' });
      fitCard.append(h('h3', {}, 'How you like to travel'));
      fitCard.append(h('p', { class: 'muted' }, 'Price'));
      fitCard.append(prefChips([['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high], ['flexible', PRICE_TIER_LABEL.flexible]], prefs.budget, (v) => { prefs.budget = v; save(); }));
      fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Trip length'));
      fitCard.append(prefChips([['short', '≤ 1 week'], ['medium', '2–3 weeks'], ['long', '1 month +']], prefs.tripLength, (v) => { prefs.tripLength = prefs.tripLength === v ? '' : v; save(); }));
      fitCard.append(h('p', { class: 'muted', style: 'margin-top:10px' }, 'Interests'));
      const intRow = h('div', { class: 'chips' });
      INTERESTS.forEach((it) => { const on = () => (prefs.interests || []).includes(it.id);
        intRow.append(h('button', { class: 'chip', 'aria-pressed': on() ? 'true' : 'false',
          onclick: (e) => { prefs.interests = prefs.interests || []; const i = prefs.interests.indexOf(it.id); if (i >= 0) prefs.interests.splice(i, 1); else prefs.interests.push(it.id); save(); e.currentTarget.setAttribute('aria-pressed', on() ? 'true' : 'false'); } }, `${it.emoji} ${it.label}`)); });
      fitCard.append(intRow);
      box.push(fitCard);
      return box;
    }, { cls: 'welcome-more' }));

    wrap.append(h('div', { class: 'welcome-nav' }, [
      h('button', { class: 'btn ghost', onclick: () => goStep(1) }, '← Back'),
      h('button', { class: 'btn', style: 'margin-left:auto', onclick: finish }, 'See what I set up →'),
    ]));
  }

  // No tab bar during first-run setup: onboarding is a focused flow with its own
  // Next / Back / Skip exits, not something to wander out of mid-step.
  mount(wrap);
}

// NAV-1: the "here is what I set up for you" recap, shown once on the first Home render after
// the value-first setup. It names each active personalisation and what it does, then points to
// Settings for the rest. Dismissed (or "add more") clears the one-shot flag.
export function setupRecapCard() {
  const p = store.profile.prefs;
  const rows = [];
  // This row used to report the traveller's answer to onboarding's network question. There is
  // no such question any more, so reporting the setting back as a personalisation would be
  // claiming credit for a default. What IS worth naming here is the thing the app is doing on
  // their behalf without being asked: putting the field guide on the device.
  rows.push(netMode() === 'offline'
    ? ['✈️', 'Fully offline', 'You have turned data off. Tap the signal icon at the top to use a connection when you have one.']
    : ['📥', 'Downloading for offline use', 'Photos of what can hurt you first, then the rest of the field guide — so identifying works with no signal.']);
  const partyLbl = { solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group' }[p.party];
  if (partyLbl || p.withBaby || p.soloFemale) {
    const who = [partyLbl, p.withBaby && 'with a baby', p.soloFemale && 'solo female'].filter(Boolean).join(', ');
    rows.push(['🧭', who, 'Safety notes and picks are tuned to who is travelling.']);
  }
  if ((p.diet || []).length) rows.push(['🍽️', p.diet.join(', '), 'Dishes are flagged for you, and your phrases are pinned at the top of Talk.']);
  if ((p.access || []).length) rows.push(['♿', 'Accessibility: ' + p.access.join(', '), 'Honest, practical access guidance is surfaced for you.']);
  const fit = [{ short: '≤1 week', medium: '2–3 weeks', long: '1 month+' }[p.tripLength], PRICE_TIER_LABEL[p.budget], (p.interests || []).length ? `${p.interests.length} ${p.interests.length > 1 ? 'interests' : 'interest'}` : ''].filter(Boolean).join(' · ');
  if (fit) rows.push(['🎯', fit, 'Trip plans and the “For you” ranking match how you travel.']);

  const dismiss = () => { p.showSetupRecap = false; save(); render(); };
  const card = h('div', { class: 'card setup-recap' });
  card.append(h('strong', {}, '✨ Here is what I set up for you'));
  card.append(h('ul', { class: 'recap-list' }, rows.map(([ic, t, d]) =>
    h('li', {}, [h('span', { class: 'recap-ic' }, ic), h('span', {}, [h('b', {}, t), h('span', { class: 'muted' }, ' — ' + d)])]))));
  card.append(h('div', { class: 'row-between', style: 'margin-top:8px' }, [
    h('button', { class: 'btn', onclick: () => { p.showSetupRecap = false; save(); go('#settings'); } }, 'Add more in Settings'),
    h('button', { class: 'btn ghost', onclick: dismiss }, 'Got it'),
  ]));
  return card;
}
