// The place card of the refined style (docs/PROGRAM.md 5.3 items 6 and 8): one anatomy for every place, so the same
// facts sit in the same spots on every card. Slice S1 builds the component; R1 puts it on Home, Places and Nearby.
//
//   media      a photo, or artwork when the place has none, in a 3 / 2 box capped at 240 px (css/refined.css)
//   credit     one credit line under a photo; a black-and-white archive photograph also wears "Archival photo"
//   name       the place's name (a link when `href` is given), and under it the local name in its own script
//   meta       open now, price tier and distance, in tabular figures; a fact the caller does not have is left out
//   foot       the source chip, and "Checked <month year>" when the record carries a `verified` stamp
//
// The card is a pure view: it reads the place record and the options below, and imports no screen. The caller
// supplies what only a screen knows (the photo path, whether the place is open now, the distance from the traveller),
// so the module stays lazy and the same card serves Home, Places, Nearby and a saved list.
//
//   placeCardRF(place, {
//     photo: { src, credit, archival },    // omit for artwork
//     href: '#place-<id>',                 // makes the name a link; or `onOpen` to make it a button
//     openState: 'open' | 'closed' | null, // null leaves the open-now item out
//     priceLabel: '$$',                    // the tier label (PRICE_TIER_LABEL in js/render-utils.js)
//     distanceLabel: '1.2 km',
//   })
//
// The strings are English only until L2, like the other strings S1 and F3 added (docs/PROGRAM.md 4.4, Copy).
import { h } from './util.js';
import { placeArtNode, placeArtKey } from './place-art.js';

// The language of a place's local name, for line height and font choice (css/refined.css, :lang rules).
const LOCAL_LANG = { th: 'th', vi: 'vi', kh: 'km', la: 'lo' };

// "2026-09" -> "Sep 2026" in the page's language; anything else is left out rather than guessed.
function checkedLabel(verified) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(verified || ''));
  if (!m) return '';
  const when = new Date(Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 1));
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
  try {
    return new Intl.DateTimeFormat(lang, m[3] ? { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' } : { year: 'numeric', month: 'short', timeZone: 'UTC' }).format(when);
  } catch (e) {
    return m[1] + '-' + m[2];
  }
}

function media(p, photo) {
  const box = h('div', { class: 'rf-card-media' });
  if (photo && photo.src) {
    box.append(h('img', { class: 'rf-photo', src: photo.src, alt: '', loading: 'lazy', decoding: 'async' }));
    if (photo.archival) box.append(h('span', { class: 'rf-archival' }, 'Archival photo'));
  } else {
    box.append(placeArtNode(placeArtKey(p)));
  }
  return box;
}

export function placeCardRF(p, o = {}) {
  const photo = o.photo && o.photo.src ? o.photo : null;
  const nameLabel = String(p.name || '');
  const nameEl = o.href
    ? h('a', { href: o.href }, nameLabel)
    : (typeof o.onOpen === 'function' ? h('button', { type: 'button', onclick: o.onOpen }, nameLabel) : nameLabel);
  const meta = [];
  if (o.openState === 'open') meta.push(h('li', { class: 'rf-open', 'data-state': 'open' }, 'Open now'));
  else if (o.openState === 'closed') meta.push(h('li', { class: 'rf-open', 'data-state': 'closed' }, 'Closed'));
  if (o.priceLabel) meta.push(h('li', {}, o.priceLabel));
  if (o.distanceLabel) meta.push(h('li', {}, o.distanceLabel));
  const src = Array.isArray(p.sources) && p.sources[0] && p.sources[0].org ? String(p.sources[0].org) : '';
  const checked = checkedLabel(p.verified);
  const foot = [src ? h('span', { class: 'rf-chip' }, src) : null, checked ? h('span', { class: 'rf-checked num' }, 'Checked ' + checked) : null].filter(Boolean);
  return h('article', { class: 'rf-card', 'data-refined': '', 'data-place': p.id || null }, [
    media(p, photo),
    photo && photo.credit ? h('p', { class: 'rf-credit' }, photo.credit) : null,
    h('div', { class: 'rf-card-body' }, [
      h('h3', { class: 'rf-card-name' }, nameEl),
      p.localName ? h('p', { class: 'rf-card-local', lang: LOCAL_LANG[p.country] || null }, String(p.localName)) : null,
      meta.length ? h('ul', { class: 'rf-card-meta num' }, meta) : null,
      foot.length ? h('p', { class: 'rf-card-foot' }, foot) : null,
    ]),
  ]);
}
