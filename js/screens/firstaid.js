// "Survival guide" — the full first-aid reference the SOS screen's quick cards point to.
//
// sosScreen() (js/main.js) still carries four quick cards for the bites/stings a traveller
// asks about most; this screen is everything else, and everything in more depth: CPR and
// choking for every age, anaphylaxis and asthma, bleeding and shock, heart attack and stroke,
// a baby/child section (fever thresholds, dehydration, dosing, dengue warning signs, water
// and sun safety), snakes and marine life, and the practical "how do you actually get help
// here" facts — Thai emergency-number detail, rip currents, lightning, insurance.
//
// Every topic in js/data/firstaid.js is always fully visible to everyone — the view selector
// below only decides what opens first and what carries a "for you" badge, because a solo
// traveller may still need the baby-choking steps for someone else's child, and a parent
// still needs the snakebite steps. Nothing is ever hidden by a profile guess.
import { h } from '../util.js';
import { store, save, getLastFix } from '../state.js';
import { getCountry } from '../data/regions.js';
import { infoTip, foldable, readAloudBar } from '../ui-widgets.js';
import { sourcesNote } from '../render-utils.js';
import { FIRSTAID_SECTIONS, FIRSTAID_TOPICS, FIRSTAID_SOURCES } from '../data/firstaid.js';
import { go, mount, topbar, countryChips } from '../main.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';

const VIEWS = [
  { id: 'everyone', ic: '🧭', label: 'Everyone' },
  { id: 'baby', ic: '👶', label: 'Baby' },
  { id: 'kids', ic: '👪', label: 'Children' },
  { id: 'solo', ic: '🧍', label: 'Solo' },
];
const VIEW_IDS = new Set(VIEWS.map((v) => v.id));

// Mirrors the family-detection already used across main.js (search "prefs.withBaby ||
// prefs.kids || prefs.party === 'family'") so this guide's default agrees with every other
// screen's idea of who is travelling, rather than inventing a second rule.
function defaultView(prefs) {
  if (prefs.withBaby) return 'baby';
  if (prefs.kids || prefs.party === 'family') return 'kids';
  if (prefs.party === 'solo') return 'solo';
  return 'everyone';
}

function topicNode(topic, view) {
  const forYou = (topic.views || []).includes(view);
  const summary = `${topic.ic} ${topic.t}${forYou ? ' · for you' : ''}`;
  const body = () => {
    const inner = h('div', {});
    if (topic.lead) inner.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 0' }, topic.lead));
    if (topic.now && topic.now.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Right now')]));
      inner.append(h('ul', { class: 'sos-aid' }, topic.now.map((li) => h('li', {}, li))));
    }
    if (topic.then && topic.then.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Then')]));
      inner.append(h('ul', { class: 'sos-aid' }, topic.then.map((li) => h('li', {}, li))));
    }
    if (topic.avoid && topic.avoid.length) {
      inner.append(h('p', { class: 'tiny', style: 'margin: var(--sp-2) 0 0' }, [h('strong', {}, 'Do not')]));
      inner.append(h('ul', { class: 'sos-aid dont' }, topic.avoid.map((li) => h('li', {}, li))));
    }
    if (topic.note) inner.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, topic.note));
    const cites = (topic.srcs || []).map((n) => FIRSTAID_SOURCES.find((s) => s.n === n)).filter(Boolean);
    if (cites.length) {
      inner.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' },
        `Checked against: ${cites.map((s) => s.org).join(' · ')}`));
    }
    const rd = readAloudBar(() => [
      `${topic.t}.`,
      topic.lead || '',
      topic.now && topic.now.length ? 'Right now: ' + topic.now.join(' ') : '',
      topic.then && topic.then.length ? 'Then: ' + topic.then.join(' ') : '',
      topic.avoid && topic.avoid.length ? 'Do not: ' + topic.avoid.join(' ') : '',
    ].filter(Boolean).join(' '));
    if (rd) inner.append(rd);
    return inner;
  };
  return foldable(summary, body, { open: forYou });
}

export function firstaidScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Survival guide', '#sos'));

  const fix = getLastFix();
  const active = getActiveCountry();
  const c = getCountry(active) || getCountry('th');
  const prefs = store.profile.prefs;

  // The view: an explicit quick-button (arg is one of the four ids) both selects THIS visit
  // and persists as the traveller's own choice for next time; otherwise fall back to whatever
  // was last chosen here, then to the profile-derived default.
  let view;
  if (VIEW_IDS.has(arg)) { view = arg; prefs.firstAidFor = arg; save(); }
  else view = (VIEW_IDS.has(prefs.firstAidFor) && prefs.firstAidFor) || defaultView(prefs);

  wrap.append(h('p', { class: 'sos-loc' }, `${c.flag} ${c.name} — everything here works with no signal.`));
  wrap.append(countryChips((id) => { setActiveCountry(id); go('#firstaid'); }, active));

  // ---- Call for help, and where you are, right at the top ------------------------------
  const call = h('div', { class: 'card sos-card', 'data-nofold': '' }, [h('div', { class: 'row-between' }, [
    h('h2', {}, `📞 Call — ${c.name}`),
    infoTip('The national emergency number, free from any phone and usually working with no SIM. If you cannot describe where you are, read the coordinates below to the dispatcher.'),
  ])]);
  const em = (c.info && c.info.emergency) || [];
  if (em.length) em.forEach((e) => call.append(h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else call.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));
  if (fix && fix.lat != null) {
    const coordStr = `${fix.lat.toFixed(5)}, ${fix.lng.toFixed(5)}`;
    call.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'Your coordinates, to read out to a dispatcher:'));
    call.append(h('p', { class: 'sos-num', style: 'margin: var(--sp-0h) 0 0;font-size:1.1rem;user-select:all' }, coordStr));
  }
  wrap.append(call);

  // ---- Who this is for ------------------------------------------------------------------
  const viewCard = h('div', { class: 'card', 'data-nofold': '' }, [
    h('h2', {}, '🧭 Who is this for?'),
    h('p', { class: 'tiny muted', style: 'margin: var(--sp-0h) 0 var(--sp-1h)' }, 'Nothing is hidden either way — this only decides what opens first.'),
  ]);
  const chips = h('div', { class: 'chips' });
  VIEWS.forEach((v) => {
    chips.append(h('button', {
      class: `chip${v.id === view ? ' active' : ''}`,
      'aria-pressed': v.id === view ? 'true' : 'false',
      onclick: () => { prefs.firstAidFor = v.id; save(); go(`#firstaid-${v.id}`); },
    }, `${v.ic} ${v.label}`));
  });
  viewCard.append(chips);
  wrap.append(viewCard);

  // ---- Every topic, grouped by section, ordered so the active view's own topics lead ----
  FIRSTAID_SECTIONS.forEach((sec) => {
    const topics = FIRSTAID_TOPICS.filter((t) => t.section === sec.id);
    if (!topics.length) return;
    const ordered = [...topics].sort((a, b) => {
      const af = (a.views || []).includes(view) ? 0 : 1;
      const bf = (b.views || []).includes(view) ? 0 : 1;
      return af - bf;
    });
    const secCard = h('div', { class: 'card' }, [h('h2', {}, `${sec.ic} ${sec.t}`)]);
    ordered.forEach((t) => secCard.append(topicNode(t, view)));
    wrap.append(secCard);
  });

  wrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#sos-${active}`) }, '🆘 Back to emergency numbers & hospitals'));
  wrap.append(sourcesNote(FIRSTAID_SOURCES.map((s) => ({ org: s.org, url: s.url })), 'September 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Every topic here was checked against several independent, named medical or safety authorities, cited above. Nothing on this screen is a diagnosis or a treatment decision, and none of it replaces calling the emergency number or reaching a hospital. In a life-threatening emergency, call first and read second.'));
  mount(wrap, '#home');
}
