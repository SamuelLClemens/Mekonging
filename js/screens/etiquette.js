// Culture & etiquette (#etiquette-{cc}) — what is rude, what is polite, and what is actually
// illegal, for the country the traveller is in.
//
// Ordered by CONSEQUENCE rather than by topic, which is the whole reason this is a screen and
// not four bullet points inside the country guide: the things that carry a prison sentence
// (Thailand's lèse-majesté law, criticism of the state in Vietnam and Laos) are read first and
// are never folded away, then the deep offences, then ordinary rudeness, then the positive
// form — what a polite visitor actually does. A traveller who reads only the first card has
// still read the part that matters.
//
// Region-wide rules come after the country's own, in their own fold, so someone crossing a
// border is not re-reading the feet rule under a new flag while the country-specific
// difference they actually needed sits below it.
import { ETIQUETTE_GROUPS, LEVELS, etiquetteFor } from '../data/etiquette.js';
import { screenHint } from '../ui-widgets.js';
import { h } from '../util.js';
import { go, mount, topbar, countryChips } from '../main.js';
import { getCountry } from '../data/regions.js';
// activeCountry lives in app-state.js, not main.js — importing it from main would also be a
// needless second path to the same setter.
import { getActiveCountry, setActiveCountry } from '../app-state.js';

const LEVEL_ORDER = ['law', 'never', 'avoid', 'do'];

function itemCard(it) {
  const lv = LEVELS[it.level] || LEVELS.avoid;
  const grp = ETIQUETTE_GROUPS.find((g) => g.id === it.group);
  return h('div', { class: `card etiq-card etiq-${it.level}` }, [
    h('div', { class: 'etiq-head' }, [
      h('span', { class: 'etiq-badge', style: `background:${lv.color}` }, `${lv.emoji} ${lv.label}`),
      grp ? h('span', { class: 'etiq-group muted' }, `${grp.emoji} ${grp.label}`) : null,
    ]),
    h('p', { class: 'etiq-text' }, it.text),
    // The reason is not decoration. Several of these are impossible to remember, or to apply
    // to a situation the list did not name, without knowing why they exist.
    it.why ? h('p', { class: 'etiq-why muted' }, it.why) : null,
  ]);
}

function levelBlock(items, level, opts = {}) {
  const of = items.filter((x) => x.level === level);
  if (!of.length) return null;
  const lv = LEVELS[level];
  const body = h('div', {}, of.map(itemCard));
  // 'law' is deliberately NOT a fold: it is the one group where a traveller who never taps
  // anything must still have read it.
  if (opts.noFold) {
    return h('div', {}, [h('h2', { class: 'home-section', 'data-nofold': '' }, `${lv.emoji} ${lv.label} — read this one`), body]);
  }
  return h('details', { class: 'foldcard etiq-fold', open: opts.open ? '' : null }, [
    h('summary', { class: 'foldcard-sum' }, `${lv.emoji} ${lv.label} · ${of.length}`),
    body,
  ]);
}

export function etiquetteScreen(cc) {
  if (cc) setActiveCountry(cc);
  const id = cc || getActiveCountry();
  const c = getCountry(id);
  const { own, region } = etiquetteFor(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.flag} Culture & etiquette` : 'Culture & etiquette', '#home'));
  wrap.append(countryChips((next) => go(`#etiquette-${next}`)));
  wrap.append(screenHint(
    'What is rude, what is polite, and what is against the law — before you do it rather than after. '
    + 'Ordered by how much it costs you to get wrong.', 'About this screen'));

  if (!own.length) {
    wrap.append(h('p', { class: 'empty' }, `${c ? c.name : 'This country'} etiquette is being written. The region-wide rules below apply here too.`));
  }

  // Country-specific first, hardest consequence first.
  LEVEL_ORDER.forEach((lv) => {
    const blk = levelBlock(own, lv, { noFold: lv === 'law', open: lv === 'never' });
    if (blk) wrap.append(blk);
  });

  const regionBody = h('div', {});
  LEVEL_ORDER.forEach((lv) => {
    const blk = levelBlock(region, lv, { open: lv === 'never' });
    if (blk) regionBody.append(blk);
  });
  wrap.append(h('details', { class: 'foldcard etiq-region' }, [
    h('summary', { class: 'foldcard-sum' }, `🌏 True in all four countries · ${region.length}`),
    regionBody,
  ]));

  wrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#info-${id}`) },
    '📘 Visas, health and the practical guide →'));
  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#phrasebook') },
    '💬 Learn hello and thank you →'));
  wrap.append(h('p', { class: 'disclaimer' },
    'Customs vary by region, by generation and by household. When you are unsure, watch what the people around you are doing and copy it — that is never the wrong answer.'));
  mount(wrap, '#home');
}
