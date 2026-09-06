// The local noticeboard — per-city local knowledge (where locals actually shop, market days,
// family supplies, the street food worth queueing for) plus the traveller's own posts, which
// stay on their device and travel only through a link they share themselves.
//
// boardRow stayed in main.js: the family/baby section renders the same row shape on an eager
// path. It is imported back rather than duplicated.
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { getEssentials } from '../data/essentials.js';
import { allPlaces, boardsForCountry, getBoard } from '../data/regions.js';
import { citySlug, effectiveRating, ratingColor, sourcesNote, starsStr } from '../render-utils.js';
import { encodeShare, shareUrl } from '../social.js';
import { addBoardPost, deleteBoardPost, ensureMe, getBoardPosts } from '../state.js';
import { h } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { boardRow, catEmoji, countryChips, go, mount, nearCat, shareButton, topbar } from '../main.js';

const BOARD_TOPICS = [['market', '🥬 Markets'], ['food', '🍜 Food'], ['family', '👶 Family'], ['tip', '💡 Tip']];


export function boardScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  const parts = (arg || '').split('-');
  const cc = parts.shift() || '';
  const slug = parts.join('-');
  const board = (cc && slug) ? getBoard(cc, slug) : null;

  if (!board) {
    // picker: country chips + city list
    wrap.append(topbar('Noticeboard', '#home'));
    wrap.append(screenHint('Local knowledge, city by city: where locals shop for fruit and veg, market schedules, family supplies like nappies, the cheapest genuinely local food and the street-food spots worth queueing for. Curated with sources; add your own notes and share them with your circle.'));
    const selected = cc || getActiveCountry();
    wrap.append(countryChips((id) => { setActiveCountry(id); go(`#board-${id}`); }, selected));
    const boards = boardsForCountry(selected);
    if (!boards.length) wrap.append(h('p', { class: 'empty' }, 'No boards for this country yet — more cities are being added.'));
    boards.forEach((b) => wrap.append(h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:flex-start', onclick: () => go(`#board-${b.country}-${b.slug}`) }, `📋 ${b.city}`)));
    mount(wrap, '#home');
    return;
  }

  wrap.append(topbar(board.city, `#board-${board.country}`));
  if (board.intro) wrap.append(h('p', { class: 'muted' }, board.intro));

  // Highest-recommended places in this city — your own ratings count first.
  const cityPlaces = allPlaces({ country: board.country })
    .filter((p) => citySlug(p.city) === board.slug)
    .map((p) => ({ p, er: effectiveRating(p.id, Number(p.rating) || 0) }))
    .filter((x) => x.er > 0)
    .sort((a, b) => b.er - a.er)
    .slice(0, 6);
  if (cityPlaces.length) {
    const tc = h('div', { class: 'card' }, [h('h2', {}, `🏆 Top-rated in ${board.city}`)]);
    cityPlaces.forEach(({ p, er }) => tc.append(h('button', { class: 'btn ghost block btn-spaced', style: 'justify-content:space-between', onclick: () => go(`#place-${p.id}`) }, [
      h('span', { class: 'near-name' }, `${catEmoji(nearCat(p))} ${p.name}`),
      h('span', { class: 'stars-static', style: `color:${ratingColor(er)}` }, starsStr(er)),
    ])));
    tc.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Blends the guide’s rating and yours — rate a place and it climbs your list.'));
    wrap.append(tc);
  }

  const section = (title, rows) => {
    if (!rows || !rows.length) return;
    const cardEl = h('div', { class: 'card' });
    cardEl.append(h('h2', {}, title));
    rows.forEach((r) => cardEl.append(r));
    wrap.append(cardEl);
  };
  section('🕑 Markets & schedules', (board.markets || []).map((m) =>
    boardRow(m.name, [m.when, m.where].filter(Boolean).join(' · ') + (m.what ? ` — ${m.what}` : ''), m.tip)));
  section('🥬 Shop like a local', (board.shopLocal || []).map((s) => boardRow(s.what, s.where, s.tip)));
  const ess = getEssentials(board.country);
  if (ess) {
    const ec = h('div', { class: 'card' });
    ec.append(h('h2', {}, '🛒 Cheapest essentials'));
    if (ess.note) ec.append(h('p', { class: 'muted', style: 'margin:0 0 8px' }, ess.note));
    ess.items.forEach((it) => ec.append(boardRow(
      `${it.icon} ${it.item}`,
      [it.cheapest, (it.price && it.price !== '—') ? `💰 ${it.price}` : null].filter(Boolean).join(' · '),
      it.tip)));
    ec.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Countrywide guidance — prices move; the cheapest option rarely does.'));
    wrap.append(ec);
  }
  section('👶 Family supplies', (board.family || []).map((f) =>
    boardRow(f.item, [f.where, f.price].filter(Boolean).join(' · '), f.tip)));
  section('🍜 Cheap local food', (board.cheapEats || []).map((e) =>
    boardRow(`${e.name} — ${e.dish}`, [e.price, e.where].filter(Boolean).join(' · '), e.tip)));
  section('🌶️ Street food', (board.streetFood || []).map((s) =>
    boardRow(`${s.name} — ${s.dish}`, [s.price, s.when, s.where].filter(Boolean).join(' · '), s.tip)));

  // Cannabis / dispensaries — only where they legally operate (Thailand), always led by
  // the current legal status and a cross-border warning. Data-gated: absent = not shown.
  if (board.dispensaries && board.dispensaries.length) {
    const dc = h('div', { class: 'card' });
    dc.append(h('h2', {}, '🌿 Cannabis & dispensaries'));
    if (board.dispensaryNote) dc.append(h('p', { class: 'disclaimer', style: 'margin:0 0 8px' }, board.dispensaryNote));
    board.dispensaries.forEach((d) => dc.append(boardRow(d.area, d.where || '', d.note)));
    if (board.dispensarySources && board.dispensarySources.length) dc.append(sourcesNote(board.dispensarySources, board.dispensaryVerified));
    wrap.append(dc);
  }

  // community notes: the user's own posts + share each to the circle
  const key = `${board.country}-${board.slug}`;
  const posts = getBoardPosts(key);
  const notes = h('div', { class: 'card' });
  notes.append(h('h2', {}, 'Your notes on this board'));
  notes.append(h('p', { class: 'tiny muted' }, 'Notes stay on your device. Share one and it travels as a link your circle can pin to their own board.'));
  const topicLbl = Object.fromEntries(BOARD_TOPICS);
  posts.forEach((p) => notes.append(h('div', { class: 'board-post' }, [
    h('div', { class: 'row-between' }, [
      h('span', { class: 'cat-tag' }, topicLbl[p.topic] || p.topic),
      h('div', { class: 'cats' }, [
        shareButton('📤', `Local tip — ${board.city}`, () => shareUrl('in', encodeShare('tip', { cc: board.country, city: board.city, topic: p.topic, text: p.text }, ensureMe())), 'chip'),
        h('button', { class: 'chip', 'aria-label': 'Delete note', onclick: () => { deleteBoardPost(key, p.id); go(`#board-${key}`); } }, '✕'),
      ]),
    ]),
    h('p', { style: 'margin-top:4px' }, p.text),
    h('div', { class: 'tiny muted' }, p.at),
  ])));
  let newTopic = 'tip';
  const topicChips = h('div', { class: 'chips' }, BOARD_TOPICS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': id === newTopic ? 'true' : 'false', dataset: { t: id }, onclick: (e) => {
      newTopic = id; topicChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.t === id ? 'true' : 'false'));
    } }, lbl)));
  const ta = h('textarea', { class: 'ta', rows: '2', maxlength: '500', placeholder: 'e.g. The mango lady at the north gate is the best deal in town…' });
  notes.append(h('div', { style: 'margin-top:8px' }, [topicChips, ta,
    h('button', { class: 'btn block', onclick: () => { if (ta.value.trim()) { addBoardPost(key, { topic: newTopic, text: ta.value.trim() }); go(`#board-${key}`); } } }, '＋ Post to my board')]));
  wrap.append(notes);

  wrap.append(sourcesNote(board.sources, board.verified));
  mount(wrap, '#home');
}
