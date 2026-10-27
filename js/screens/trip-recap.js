// #recap: the whole trip after it is over, from what the traveller logged (F4). Every figure comes from js/recap-data.js; a section
// with nothing behind it is left out, and a traveller with nothing logged gets an honest empty state. The screen root carries
// data-refined for the refined type scale; charts are js/recap-charts.js. Home's short summary links here (js/screens/home.js).
import { h } from '../util.js';
import { money } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { dateLocale } from '../i18n.js';
import { go, mount, topbar, ownTitle, ensureRouteGraph } from '../main.js';
import { tripRecap } from '../recap-data.js';
import { MODE_GLYPHS, MODE_LABELS } from '../journey-stops.js';
import { barList, legend, stackedColumns, routeMap } from '../recap-charts.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
const fmtDay = (iso, year) => {
  try { return new Date(iso + 'T00:00').toLocaleDateString(dateLocale(), year ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }); } catch { return iso; }
};
const fmtMonth = (iso) => { try { return new Date(iso + 'T00:00').toLocaleDateString(dateLocale(), { month: 'short', year: 'numeric' }); } catch { return iso.slice(0, 7); } };
const rangeText = (a, b) => (a === b ? fmtDay(a, true) : `${fmtDay(a)} – ${fmtDay(b, true)}`);
const kmText = (km) => `${Math.round(km).toLocaleString(dateLocale())} km`;

function tile(value, label, sub) {
  return h('div', { class: 'rc-tile' }, [h('b', { class: 'rc-tile-val' }, value), h('span', { class: 'rc-tile-lbl' }, label), sub ? h('span', { class: 'rc-tile-sub' }, sub) : null]);
}
function card(title, kids, hint) {
  return h('div', { class: 'card rc-card' }, [h('h2', {}, title), hint ? screenHint(hint) : null, ...kids]);
}
const sub = (text) => h('h3', { class: 'rc-sub' }, text);
const link = (label, hash, ghost = true) => h('button', { class: `btn${ghost ? ' ghost' : ''} block btn-spaced`, onclick: () => go(hash) }, label);

function heroCard(m) {
  const amt = (v) => money(Math.round(v), m.home);
  const tiles = [];
  if (m.span) tiles.push(tile(String(m.span.nights), m.span.nights === 1 ? 'night' : 'nights', rangeText(m.span.from, m.span.to)));
  if (m.countryCount) tiles.push(tile(String(m.countryCount), m.countryCount === 1 ? 'country' : 'countries'));
  if (m.stops) tiles.push(tile(String(m.stops), m.stops === 1 ? 'stop' : 'stops'));
  if (m.legs.length) tiles.push(tile(kmText(m.distanceKm), 'between stops', 'straight lines'));
  if (m.spend.total > 0) tiles.push(tile(amt(m.spend.total), 'spent', m.spend.perDay ? `about ${amt(m.spend.perDay)} a day` : null));
  if (m.journal.entries) tiles.push(tile(String(m.journal.entries), m.journal.entries === 1 ? 'journal entry' : 'journal entries', m.journal.photos ? plural(m.journal.photos, 'photo') : null));
  return h('div', { class: 'card rc-hero' }, [tiles.length ? h('div', { class: 'rc-tiles' }, tiles) : null,
    m.spend.left.length ? h('p', { class: 'rc-flag' }, `Not counted in “spent”: ${m.spend.left.map((l) => `${l.amount.toLocaleString(dateLocale())} ${l.currency}`).join(', ')}, no exchange rate held.`) : null]);
}

function countriesCard(m) {
  const rows = m.countries.filter((c) => c.nights > 0);
  const kids = [];
  const places = (c) => c.places.slice(0, 4).join(', ') + (c.places.length > 4 ? ` and ${c.places.length - 4} more` : '');
  if (rows.length >= 2) {
    kids.push(barList(rows.map((c) => ({ label: c.name, text: plural(c.nights, 'night'), value: c.nights, sub: places(c) }))));
  } else if (rows.length === 1) {
    kids.push(h('p', { class: 'rc-line' }, [h('b', {}, `${plural(rows[0].nights, 'night')} in ${rows[0].name}`), `: ${places(rows[0])}.`]));
  } else {
    m.countries.forEach((c) => kids.push(h('p', { class: 'rc-line' }, [h('b', {}, c.name), `: ${places(c)}.`])));
  }
  return card('Where you stayed', kids, 'Nights run from the day you reached a stop to the day you reached the next one, so they follow the dates of your stops.');
}

function routeCard(m) {
  const kids = [];
  const svg = routeMap(m.located);
  if (svg) kids.push(h('div', { class: 'rc-map' }, svg));
  kids.push(h('details', { class: 'rc-table' }, [h('summary', {}, 'Show the stops'),
    h('ol', { class: 'rc-stops' }, m.located.map((s) => h('li', {}, [h('b', {}, s.label || 'A stop'),
      s.first ? ` ${s.last && s.last !== s.first ? `${fmtDay(s.first)} – ${fmtDay(s.last)}` : fmtDay(s.first)}` : ''])))]));
  kids.push(link('Open the live map', '#journey'));
  return card('Your route', kids);
}

function spendCard(m) {
  const s = m.spend, amt = (v) => money(v < 10 ? Math.round(v * 10) / 10 : Math.round(v), s.home);
  const kids = [];
  kids.push(h('p', { class: 'rc-line' }, [h('b', { class: 'rc-big' }, amt(s.total)), ` across ${plural(s.entries, 'entry', 'entries')}`, s.perDay ? `, about ${amt(s.perDay)} a day` : '', '.']));
  if (s.byCat.length) {
    kids.push(sub('By category'));
    kids.push(barList(s.byCat.map((c) => ({ label: c.label, text: `${amt(c.value)} · ${Math.round(c.value / s.total * 100)}%`, value: c.value, slot: c.slot }))));
  }
  if (s.byCountry.length >= 2) {
    kids.push(sub('By country'));
    kids.push(barList(s.byCountry.map((c) => ({ label: c.name, text: amt(c.value), value: c.value, slot: 1 }))));
  }
  const gap = s.unplaced + s.monthly.sum;
  if (s.byCountry.length && gap > 0.5) kids.push(h('p', { class: 'rc-note' }, `${amt(gap)} is in no country: monthly costs, or spending dated outside your stops.`));
  const d = s.byDay;
  if (d) {
    const word = d.unit === 'day' ? 'Day' : d.unit === 'week' ? 'Week' : 'Month';
    kids.push(sub(`By ${word.toLowerCase()}`));
    if (d.list.length >= 2) {
      const buckets = d.list.map((b) => ({
        label: d.unit === 'day' ? fmtDay(b.from, true) : d.unit === 'week' ? `${fmtDay(b.from)} – ${fmtDay(b.to)}` : fmtMonth(b.from),
        tick: d.unit === 'month' ? fmtMonth(b.from) : fmtDay(b.from),
        total: b.total, parts: Object.entries(b.cats).map(([key, value]) => ({ key, value })),
      }));
      kids.push(stackedColumns({ buckets, series: s.series, fmt: amt, heading: `Spend by ${word.toLowerCase()}`, unitWord: word, note: `Home currency, ${s.home}. Select a ${word.toLowerCase()} with a tap or the arrow keys.` }));
    } else {
      kids.push(h('p', { class: 'rc-line' }, `All of it on ${fmtDay(d.list[0].from, true)}.`));
    }
  }
  return card('What you spent', kids);
}

function journalCard(m) {
  const j = m.journal;
  const kids = [h('p', { class: 'rc-line' }, [h('b', {}, plural(j.entries, 'journal entry', 'journal entries')),
    j.photos ? `, ${plural(j.photos, 'photo')}` : '', j.withPhotos ? ` (${j.withPhotos} of the entries have pictures)` : '', '.'])];
  if (j.writtenMost) kids.push(h('p', { class: 'rc-line' }, `You wrote most in ${j.writtenMost.label}: ${plural(j.writtenMost.n, 'entry', 'entries')}.`));
  if (j.entries) kids.push(link('Open your journal', '#journal'));
  kids.push(link('Build your scrapbook', '#scrapbook'));
  return card('Journal and photos', kids);
}

function placesCard(m) {
  const p = m.places, kids = [];
  const bits = [];
  if (p.rated) bits.push(`${p.rated} rated`);
  if (p.loved) bits.push(`${p.loved} loved (4 or 5 stars)`);
  kids.push(h('p', { class: 'rc-line' }, [h('b', {}, bits.length ? bits.join(', ') : plural(p.saved, 'saved place')), p.rated && p.saved ? `; ${p.saved} saved in all` : '', '.']));
  if (p.rated >= 2) {
    kids.push(sub('How you rated them'));
    kids.push(barList([5, 4, 3, 2, 1].filter((n) => p.stars[n - 1]).map((n) => ({ label: `${n} ${n === 1 ? 'star' : 'stars'}`, text: String(p.stars[n - 1]), value: p.stars[n - 1], slot: 1 }))));
  }
  if (p.top.length) {
    kids.push(sub(p.top.length === 1 ? 'Your top place' : `Your top ${p.top.length}`));
    kids.push(h('ul', { class: 'rc-top' }, p.top.map((t) => {
      const body = [h('span', { class: 'rc-top-name' }, t.name),
        h('span', { class: 'rc-top-meta' }, [h('span', { class: 'rc-stars', role: 'img', 'aria-label': `${t.rating} out of 5` }, '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating)), t.country ? ` ${t.country}` : '']),
        t.review ? h('span', { class: 'rc-top-review' }, t.review) : null];
      return h('li', {}, t.isPin ? h('div', { class: 'rc-top-row' }, body) : h('a', { class: 'rc-top-row', href: `#place-${t.id}`, onclick: (e) => { e.preventDefault(); go(`#place-${t.id}`); } }, body));
    })));
  }
  return card('Places', kids);
}

// The legs, in a body the router's second pass can refill once the route graph is built (a leg's mode is then looked up, not guessed).
function legsBody(m) {
  const kids = [];
  const set = m.modes.reduce((a, x) => a + x.set, 0), all = m.legs.length;
  kids.push(barList(m.modes.map((x) => ({
    label: `${MODE_GLYPHS[x.mode] || ''} ${MODE_LABELS[x.mode] || x.mode}`.trim(), text: `${plural(x.legs, 'leg')} · ${kmText(x.km)}`, value: x.legs,
    segs: [{ value: x.set, slot: 1 }, { value: x.legs - x.set, slot: 0 }],
  }))));
  if (set && set < all) kids.push(legend([{ slot: 1, label: 'You chose it' }, { slot: 0, label: 'The app worked it out' }]));
  kids.push(h('p', { class: 'rc-note' }, set === all ? 'You chose every mode.' : set ? `You chose ${set} of ${all}; the rest are worked out from the route graph, or from distance and days.`
    : 'None chosen yet: each is worked out from the route graph, or from distance and days.'));
  return kids;
}

function emptyCard() {
  return h('div', { class: 'card rc-empty' }, [
    h('h2', { class: 'rf-empty-title' }, 'Nothing logged yet'),
    h('p', { class: 'rf-empty-text muted' }, 'Stops, journal entries, places you rate and what you spend all gather here once you have written them down.'),
    link('Write a journal entry', '#journal', false), link('Add a stop', '#trip'), link('Log an expense', '#expenses'),
  ]);
}

export function tripRecapScreen() {
  const wrap = h('div', { class: 'screen rc', 'data-refined': '' });
  wrap.append(topbar(ownTitle('trip', 'Your trip'), '#home'));
  const m = tripRecap({ graphReady: false });
  if (m.empty) {
    wrap.append(emptyCard());
    mount(wrap, '#home');
    return;
  }
  wrap.append(heroCard(m));
  if (m.countries.length && m.span) wrap.append(countriesCard(m));
  if (m.located.length) wrap.append(routeCard(m));
  if (m.spend.total > 0) wrap.append(spendCard(m));
  if (m.journal.entries || m.journal.photos) wrap.append(journalCard(m));
  if (m.places.rated || m.places.saved) wrap.append(placesCard(m));
  let legs = null;
  if (m.legs.length) {
    legs = h('div', { class: 'rc-legs' }, legsBody(m));
    wrap.append(h('div', { class: 'card rc-card' }, [h('h2', {}, 'Getting around'), legs, link('Correct a leg', '#journey')]));
  }
  wrap.append(h('div', { class: 'card rc-end' }, [link('Save and share your trip', '#export', false), link('Share my journey', '#sharejourney')]));
  mount(wrap, '#home');
  // The route graph decides a leg's mode where it knows the pair. It is built on demand; refill the legs when it is ready, if this screen is still showing.
  if (legs) ensureRouteGraph(() => { if (legs.isConnected) legs.replaceChildren(...legsBody(tripRecap({ graphReady: true }))); });
}
