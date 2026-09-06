// Your contributions — on-device points and levels in the Local Guides style, counted from
// what the traveller has actually added to their own guide. No account, no server, no
// leaderboard: the numbers never leave the device and there is nobody to compare against.
import * as gamify from '../gamify.js';
import { store } from '../state.js';
import { h } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { go, mount, topbar } from '../main.js';

export function contributionsScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Contributions', '#home'));
  const pts = gamify.contributionPoints(store);
  const lvl = gamify.levelInfo(pts);
  const rows = gamify.contributionBreakdown(store);
  const suggestions = gamify.contributionSuggestions(store);

  // Level card with a progress bar to the next level.
  wrap.append(h('div', { class: 'card contrib-hero' }, [
    h('div', { class: 'contrib-badge' }, lvl.emoji),
    h('h2', { style: 'margin:0' }, `${lvl.title}`),
    h('p', { class: 'muted', style: 'margin:2px 0 10px' }, `Level ${lvl.level} · ${pts} point${pts === 1 ? '' : 's'}`),
    h('div', { class: 'contrib-bar' }, [h('span', { style: `width:${Math.round(lvl.pct * 100)}%` })]),
    h('p', { class: 'muted', style: 'margin:8px 0 0' },
      lvl.nextTitle ? `${lvl.ptsToNext} point${lvl.ptsToNext === 1 ? '' : 's'} to ${lvl.nextTitle}` : 'You have reached the top level — thank you!'),
  ]));
  wrap.append(screenHint('Points come from what you add to your own guide. Everything stays on this device — there are no accounts and no leaderboard, just your own progress.'));

  // Ways to earn more (encouragement).
  if (suggestions.length) {
    const card = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'Ways to earn more')]);
    suggestions.forEach((s) => card.append(h('button', { class: 'btn ghost block contrib-suggest btn-spaced', onclick: () => go(s.hash) },
      `${s.emoji} ${s.text}  ·  +${s.pts}`)));
    wrap.append(card);
  }

  // Full breakdown of what counts.
  const bd = h('div', { class: 'card' }, [h('h3', { style: 'margin-top:0' }, 'What you have added')]);
  rows.forEach((r) => bd.append(h('div', { class: 'row-between contrib-row' }, [
    h('span', {}, `${r.emoji} ${r.label}`),
    h('span', { class: 'muted' }, `${r.count} · ${r.points} pt${r.points === 1 ? '' : 's'}`),
  ])));
  wrap.append(bd);
  wrap.append(h('p', { class: 'disclaimer' }, 'Scoring: review +10, photo +5, journal entry +5, tip +5, pin +3, rating +1, collection +2, calendar entry +1.'));
  mount(wrap, '#home');
}
