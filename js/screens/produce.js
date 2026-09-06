// The market produce guide — identify a fruit, vegetable or herb on the stall, then read what
// it is, when it is in season and roughly what it should cost.
import { PRODUCE_CATEGORIES, getProduce, produceByCategory } from '../lazy-data.js';
import { photoBlock } from '../render-utils.js';
import { canSay, say } from '../tts.js';
import { screenHint } from '../ui-widgets.js';
import { debounce, h } from '../util.js';
import { go, idPinButton, idPinStar, imageSearch, mount, priceLine, recogThumb, topbar } from '../main.js';

let produceQuery = '';

let produceCat = '';

function produceCard(p) {
  const cat = PRODUCE_CATEGORIES.find((c) => c.id === p.category);
  const main = h('button', { class: 'id-cardmain', onclick: () => go(`#produce-${p.id}`) }, [
    recogThumb(p, p.emoji || (cat ? cat.emoji : '🍈')),
    h('span', { class: 'grow' }, [
      h('div', { class: 'en' }, p.name),
      h('div', { class: 'sci' }, `${(p.names && p.names.th) || ''}${p.season ? ' · ' + p.season : ''}`),
    ]),
  ]);
  return h('div', { class: 'card species-card id-cardrow' }, [main, idPinStar('produce', p.id)]);
}

export function produceScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Market produce', '#home'));
  wrap.append(screenHint('Fruits, vegetables and herbs you will see at the market — names in every local language, when they are in season, how to eat and pick them, and a fair price.'));
  const cats = [{ id: '', label: 'All', emoji: '✶' }].concat(PRODUCE_CATEGORIES);
  const chips = h('div', { class: 'chips' }, cats.map((g) =>
    h('button', { class: 'chip', 'aria-pressed': produceCat === g.id ? 'true' : 'false', dataset: { g: g.id },
      onclick: () => { produceCat = g.id; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.g === g.id ? 'true' : 'false')); renderList(); } },
      `${g.emoji} ${g.label}`)));
  wrap.append(chips);
  const search = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', placeholder: 'Search produce…', value: produceQuery,
    oninput: debounce((e) => { produceQuery = e.target.value; renderList(); }, 120) });
  wrap.append(search);
  const listEl = h('div', {});
  wrap.append(listEl);
  function renderList() {
    listEl.innerHTML = '';
    let items = produceByCategory(produceCat);
    const q = produceQuery.trim().toLowerCase();
    if (q) items = items.filter((p) => p.name.toLowerCase().includes(q)
      || Object.values(p.names || {}).some((n) => (n || '').toLowerCase().includes(q) || (n || '').includes(produceQuery.trim())));
    if (!items.length) { listEl.append(h('p', { class: 'empty' }, 'No produce matches.')); return; }
    items.forEach((p) => listEl.append(produceCard(p)));
  }
  renderList();
  mount(wrap, '#home');
}

export function produceDetail(id) {
  const p = getProduce(id);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(p ? p.name : 'Produce', '#produce'));
  if (!p) { wrap.append(h('p', { class: 'empty' }, 'Not found.')); mount(wrap, '#home'); return; }
  const cat = PRODUCE_CATEGORIES.find((c) => c.id === p.category);
  const langs = [['th', '🇹🇭', 'th-TH'], ['vi', '🇻🇳', 'vi-VN'], ['km', '🇰🇭', 'km-KH'], ['lo', '🇱🇦', 'lo-LA']];
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, `${p.emoji || ''} ${p.name}`),
      cat ? h('span', { class: 'cat-tag' }, `${cat.emoji} ${cat.label}`) : null,
    ]),
    h('p', { class: 'muted', style: 'margin:6px 0 2px' }, 'Local names (tap 🔊 to hear):'),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px' },
      langs.filter(([k]) => p.names && p.names[k]).map(([k, flag, loc]) => (canSay(loc)
        ? h('button', { class: 'cat-tag', style: 'cursor:pointer;border:none', onclick: () => say(p.names[k], loc) }, `${flag} ${p.names[k]} 🔊`)
        : h('span', { class: 'cat-tag' }, `${flag} ${p.names[k]}`)))),
  ]);
  card.append(photoBlock(p, p.name));
  if (p.season) card.append(h('h3', {}, 'In season'), h('p', {}, p.season));
  if (p.taste) card.append(h('h3', {}, 'Taste'), h('p', {}, p.taste));
  if (p.howToEat) card.append(h('h3', {}, 'How to eat'), h('p', {}, p.howToEat));
  if (p.selectTip) card.append(h('h3', {}, 'Picking a good one'), h('p', {}, p.selectTip));
  if (p.caution) card.append(h('div', { class: 'warn-note', style: 'margin-top:8px' }, `⚠ ${p.caution}`));
  if (p.price) card.append(h('p', { style: 'margin-top:10px' }, [h('strong', {}, 'Typical price: '), `${priceLine(p.price.low, p.price.high, p.price.currency)}${p.price.unit ? ' ' + p.price.unit : ''}`]));
  if (p.sources && p.sources.length) card.append(h('p', { class: 'muted', style: 'margin-top:8px' }, `Sources: ${p.sources.join('; ')}`));
  wrap.append(card);
  wrap.append(idPinButton('produce', p.id));
  wrap.append(h('a', { class: 'btn block', href: imageSearch(`${p.name} fruit vegetable`), target: '_blank', rel: 'noopener' }, 'See photos ↗'));
  mount(wrap, '#home');
}
