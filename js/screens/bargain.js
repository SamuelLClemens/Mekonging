// Bargain helper — what to offer, and how to say it, for the things travellers most often
// haggle over. Reference figures with their own sources; never a promise of a price.
import { getActiveCountry } from '../app-state.js';
import { getEssentials } from '../data/essentials.js';
import { getBoard, getCountry } from '../data/regions.js';
import { citySlug } from '../render-utils.js';
import { currencySelect, field, selectEl } from '../ui-widgets.js';
import { debounce, h } from '../util.js';
import { focusSpot, go, mount, topbar } from '../main.js';

const BARGAIN = {
  market: { label: 'Market / souvenirs', open: 0.4, aim: 0.6, tip: 'Start around 40% of the asking price and settle near 60%. Smile, stay friendly, and be ready to walk away politely.' },
  clothing: { label: 'Clothing / tailor', open: 0.5, aim: 0.7, tip: 'Open near half; bundle several items for a better rate.' },
  tuktuk: { label: 'Tuk-tuk / taxi', open: 0.5, aim: 0.6, tip: 'Better still: insist on the meter or use Grab/Bolt for an upfront price.' },
  tour: { label: 'Tour / activity', open: 0.6, aim: 0.8, tip: 'Compare two or three operators; book direct rather than via a tout.' },
};

export function bargainScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Bargain helper', '#home'));
  const c = getCountry(getActiveCountry());
  const price = h('input', { 'aria-label': 'Asking price', type: 'number', inputmode: 'decimal', placeholder: 'Asking price' });
  const cur = currencySelect(c ? c.currency : 'THB');
  const ctx = selectEl(Object.entries(BARGAIN).map(([k, v]) => [k, v.label]), 'market', () => {}, 'What you are bargaining for');
  const out = h('div', { class: 'card' });
  function recompute() {
    out.innerHTML = '';
    const v = parseFloat(price.value) || 0;
    const b = BARGAIN[ctx.value];
    if (!v) { out.append(h('p', { class: 'muted' }, 'Enter the asking price to get a suggested counter-offer.')); return; }
    out.append(h('h3', {}, 'Suggested counter'));
    out.append(h('p', { class: 'fx-result' }, `Open at ${Math.round(v * b.open).toLocaleString()} ${cur.value}, aim for about ${Math.round(v * b.aim).toLocaleString()} ${cur.value}.`));
    out.append(h('p', {}, b.tip));
    out.append(h('button', { class: 'btn ghost', onclick: () => go(`#prices-${getActiveCountry()}`) }, 'Check fair prices'));
  }
  price.addEventListener('input', debounce(recompute, 120));
  cur.addEventListener('change', recompute); ctx.addEventListener('change', recompute);
  wrap.append(h('div', { class: 'card' }, [field('Asking price', price), field('Currency', cur), field('What are you buying?', ctx)]));
  wrap.append(out);
  recompute();

  // Where to buy the everyday essentials cheapest, anchored to where the traveller is.
  const fc = focusSpot().spot.country || getActiveCountry();
  const fcName = (getCountry(fc) || {}).name || '';
  const ess = getEssentials(fc);
  if (ess && ess.items && ess.items.length) {
    const card = h('div', { class: 'card' }, [
      h('h2', {}, `🛒 Cheapest essentials${fcName ? ' in ' + fcName : ''}`),
      ess.note ? h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, ess.note) : null,
    ]);
    ess.items.forEach((it) => card.append(h('div', { class: 'list-note' }, [
      h('strong', {}, `${it.icon || ''} ${it.item}: `), it.cheapest,
      it.price && it.price !== '—' ? h('span', { class: 'muted' }, ` (${it.price})`) : null,
      it.esim ? h('div', { class: 'tiny muted', style: 'margin-top: var(--sp-1)' }, it.esim) : null,
    ])));
    const slug = citySlug(focusSpot().spot.city || '');
    if (getBoard(fc, slug)) card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#board-${fc}-${slug}`) }, '📍 Local finds & markets near you'));
    card.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#prices-${fc}`) }, 'See fair prices'));
    wrap.append(card);
  }
  mount(wrap, '#home');
}
