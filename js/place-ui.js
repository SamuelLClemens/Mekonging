// Place UI shared between the (lazily loaded) places screens and the screens that still live
// in main.js — collections, the trip itinerary and feedback all render place cards, save
// sheets and jelly/secret previews without ever visiting #places.
//
// WHY THIS FILE EXISTS. js/screens/places.js is 124 KB and sat in the launch graph purely
// because main.js imported twelve names from it. Two of those twelve are the route handlers
// themselves (placesScreen, placeScreen, 65 KB together) which only the router needs; the rest
// are these small helpers. Splitting the helpers out lets the screen module go lazy like the
// nine already in SCREEN_LOADERS, and takes ~112 KB off every launch.
//
// The dependency closure here was computed, not guessed: the ten helpers main.js imports pull
// in eight more (beachChip, collRow, daysSinceISO, dowShort, formatMarketDays, getPlaceSecrets,
// jellyMonths, marketChip) and four literal tables, and nothing else — no route handler is
// reachable from any of them, which is exactly why the split is clean.
//
// This module imports six names from main.js, the same static cycle places.js already had.
// It is safe because nothing here runs at import time: every export is a function declaration
// or a literal table, so no binding is read before main.js has finished evaluating.

import { h } from './util.js';
import { t, dateLocale } from './i18n.js';
import { openModal } from './ui-widgets.js';
import { COLLECTION_PRESETS, getPlace } from './data/regions.js';
import { daysUntilISO, go, placeFamily, placePhotoSrc, priceLine, stopDateLabel } from './main.js';
import {
  FAMILY_META, attrTag, bucketColor, catTag, distanceChip, isBeach, isMarket, marketOpenDays,
  starsStr, tierBadge,
} from './render-utils.js';
import {
  addPlaceVisit, collectionsForItem, createCollection, getPin, getPlaceData, isFavorite,
  removePlaceVisit, save, setPlaceField, store, todayKey, toggleFavorite, togglePlaceInCollection,
} from './state.js';

export const STAY_LABEL = { tent: '⛺ Camping', hostel: '🛏️ Hostel', guesthouse: '🏠 Guesthouse', homestay: '🏡 Homestay', hotel: '🏨 Hotel', resort: '🌴 Resort', apartment: '🏢 Apartment' };

export const DOW_FALLBACK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SEV_LABEL = { seen: 'Jellyfish seen', lots: 'Lots of jellyfish', stung: 'Someone was stung' };

export function placeCard(p, num) {
  const cats = Array.isArray(p.categories) ? p.categories : [];
  const hasPrice = p.priceRange && p.priceRange.currency;
  const priceStr = hasPrice ? (priceLine(p.priceRange.low, p.priceRange.high, p.priceRange.currency) || 'Free') : '';
  const colls = collectionsForItem(p.id);
  const dchip = distanceChip(p);
  const accent = bucketColor(p);
  const fam = placeFamily(p);
  const src = placePhotoSrc(p);
  // A recognition thumbnail on the left: a self-hosted photo when one exists (offline,
  // lazy-loaded), else a calm family-emoji placeholder. The category colour still reads
  // from the left accent bar and the coloured tags, so the placeholder stays quiet.
  const thumb = src
    ? h('img', { class: 'pc-thumb', src, alt: '', loading: 'lazy', decoding: 'async' })
    : h('span', { class: 'pc-thumb ph' }, (FAMILY_META[fam] || FAMILY_META.other).emoji);
  const card = h('div', { class: 'card place-card' + (num != null ? ' has-num' : ''), style: `--cat:${accent}` }, [
    h('div', { class: 'pc-row' }, [
      thumb,
      h('div', { class: 'pc-body' }, [
        h('div', { class: 'place-head' }, [
          h('h2', {}, `${p.isPin ? '📌 ' : ''}${p.name}`),
          h('button', {
            class: 'save-star', 'aria-label': 'Quick save to favourites', title: 'Quick save',
            onclick: (e) => { const on = toggleFavorite(p.id); e.currentTarget.textContent = on ? '★' : '☆'; },
          }, isFavorite(p.id) ? '★' : '☆'),
        ]),
        (cats.length || (p.budgetTier && !p.isPin)) ? h('div', { class: 'row-between' }, [
          h('div', { class: 'cats' }, cats.map((c) => catTag(c))),
          (p.budgetTier && !p.isPin) ? tierBadge(p.budgetTier) : null,
        ]) : null,
        travelerChips(p),
        isMarket(p) ? h('div', { style: 'margin: var(--sp-0h) 0' }, marketChip(p)) : null,
        (() => { const bc = beachChip(p); return bc ? h('div', { style: 'margin: var(--sp-0h) 0' }, bc) : null; })(),
        p.blurb ? h('p', {}, p.blurb) : null,
        h('p', { class: 'muted' }, [p.city, priceStr].filter(Boolean).join(' · ')),
        dchip ? h('div', { style: 'margin: var(--sp-0h) 0' }, dchip) : null,
        p.rating ? h('div', { class: 'stars-static' }, `${starsStr(p.rating)} ${Number(p.rating).toFixed(1)}`) : null,
        colls.length ? h('div', { class: 'cats' }, colls.map((c) =>
          h('span', { class: 'cat-tag', style: 'background:var(--grape)' }, `${c.emoji} ${c.name}`))) : null,
      ]),
    ]),
    h('div', { class: 'row-between', style: 'flex-wrap:wrap' }, [
      h('button', { class: 'btn ghost', onclick: () => go(`#place-${p.id}`) }, 'Details'),
      h('button', { class: 'btn ghost', onclick: () => saveSheet(p.id) }, '＋ Save'),
      h('button', { class: 'btn ghost', onclick: () => tripVisitSheet(p.id) }, '🧭 Trip'),
    ]),
  ]);
  // A number badge matching the map pin, when the caller supplies a number.
  if (num != null) card.prepend(h('span', { class: 'pc-num', 'aria-hidden': 'true', style: `background:${accent}` }, String(num)));
  return card;
}

export function travelerChips(p) {
  const chips = [];
  if (p.kidFriendly === true) chips.push(attrTag('👨‍👩‍👧 Kids OK'));
  if (p.stayType) chips.push(attrTag(STAY_LABEL[p.stayType] || p.stayType));
  if (p.stayDuration === 'long') chips.push(attrTag('Long stay'));
  else if (p.stayDuration === 'short') chips.push(attrTag('Short stay'));
  else if (p.stayDuration === 'both') chips.push(attrTag('Short or long stay'));
  return chips.length ? h('div', { class: 'cats', style: 'margin-top: var(--sp-1)' }, chips) : null;
}

export function saveSheet(itemId) {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Save to collections' });
  let close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const body = h('div', {});
  function rebuild() {
    body.innerHTML = '';
    body.append(h('h3', {}, 'Save to'));
    // favourite quick toggle
    body.append(collRow('⭐', 'Favourites', store.favorites.includes(itemId),
      () => { toggleFavorite(itemId); rebuild(); }));
    // existing collections
    for (const c of store.collections) {
      body.append(collRow(c.emoji, `${c.name} (${c.itemIds.length})`, c.itemIds.includes(itemId),
        () => { togglePlaceInCollection(c.id, itemId); rebuild(); }));
    }
    // create new
    const input = h('input', { class: 'search', type: 'text', 'aria-label': 'Search', placeholder: 'New collection name…', style: 'margin-top: var(--sp-2)' });
    const add = h('button', { class: 'btn', onclick: () => {
      if (!input.value.trim()) return;
      const c = createCollection(input.value.trim(), '⭐');
      togglePlaceInCollection(c.id, itemId);
      rebuild();
    } }, 'Create & add');
    body.append(input, add);
    // preset quick-create
    body.append(h('p', { class: 'muted', style: 'margin: var(--sp-3) 0 var(--sp-1)' }, 'Quick themes'));
    body.append(h('div', { class: 'chips presets' }, COLLECTION_PRESETS
      .filter((pr) => !store.collections.some((c) => c.name.toLowerCase() === pr.name.toLowerCase()))
      .map((pr) => h('button', { class: 'chip', onclick: () => {
        const c = createCollection(pr.name, pr.emoji);
        togglePlaceInCollection(c.id, itemId);
        rebuild();
      } }, `${pr.emoji} ${pr.name}`))));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top: var(--sp-3)', onclick: close }, 'Done'));
  }
  rebuild();
  sheet.append(body);
  backdrop.append(sheet);
  close = openModal(backdrop);
}

export function tripVisitSheet(placeId) {
  const backdrop = h('div', { class: 'sheet-backdrop' });
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': 'Add to my trip' });
  let close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

  const body = h('div', {});
  function rebuild() {
    body.innerHTML = '';
    body.append(h('h3', {}, 'Add to my trip'));
    const mine = store.trip.placeVisits.filter((v) => v.placeId === placeId);
    if (store.trip.stops.length) {
      body.append(h('p', { class: 'muted' }, 'Which stop is this for?'));
      store.trip.stops.forEach((s) => {
        const tagged = mine.find((v) => v.stopId === s.id);
        const label = s.title + (stopDateLabel(s) ? ` — ${stopDateLabel(s)}` : '');
        body.append(collRow('📍', label, !!tagged,
          () => { if (tagged) removePlaceVisit(tagged.id); else addPlaceVisit({ placeId, stopId: s.id }); rebuild(); }));
      });
    } else {
      body.append(h('p', { class: 'muted' }, 'No trip stops yet — this will sit unscheduled until you add one.'));
    }
    const unsched = mine.find((v) => !v.stopId);
    body.append(collRow('🗒️', 'Not scheduled yet', !!unsched,
      () => { if (unsched) removePlaceVisit(unsched.id); else addPlaceVisit({ placeId, stopId: null }); rebuild(); }));
    body.append(h('button', { class: 'btn ghost block', style: 'margin-top: var(--sp-3)', onclick: close }, 'Done'));
  }
  rebuild();
  sheet.append(body);
  backdrop.append(sheet);
  close = openModal(backdrop);
}

export function resolveItem(id) {
  if (typeof id === 'string' && id.startsWith('pin-')) {
    const pin = getPin(id);
    if (!pin) return null;
    return {
      id: pin.id, name: pin.name, city: 'Your pin', country: '', isPin: true,
      categories: pin.tags || [], budgetTier: 'any', blurb: pin.note || 'A place you marked.',
      priceRange: { low: null, high: null, currency: '' }, coords: pin.coords || null, mapQuery: pin.name,
    };
  }
  return getPlace(id);
}

export function jellyInSeason(p, month) { const m = jellyMonths(p); return !!(m && m.includes(month)); }
// Compact "Jul–Oct" / "Apr, Jun & Aug" from a sorted month array. Also reused by the danger

export function formatMonths(m) {
  if (!m || !m.length) return '';
  let contig = true;
  for (let i = 1; i < m.length; i++) if (m[i] !== m[i - 1] + 1) contig = false;
  if (contig && m.length > 2) return `${MONTH_SHORT[m[0]]}–${MONTH_SHORT[m[m.length - 1]]}`;
  return m.map((n) => MONTH_SHORT[n]).join(m.length > 2 ? ', ' : ' & ');
}

export function fmtReportDate(iso) {
  const ds = daysSinceISO(iso);
  if (ds <= 0) return 'today';
  if (ds === 1) return 'yesterday';
  if (ds < 30) return `${ds} days ago`;
  return iso;
}

export function addPlaceSecret(id, { text, by }) {
  const list = getPlaceSecrets(id).slice();
  list.unshift({ text: String(text || '').slice(0, 400), by: String(by || '').slice(0, 40), at: todayKey() });
  setPlaceField(id, 'secrets', list);
}

export function beachChip(p) {
  if (!isBeach(p)) return null;
  const nowM = new Date().getMonth() + 1;
  if (jellyInSeason(p, nowM)) return h('span', { class: 'beach-chip jelly', title: 'Elevated jellyfish season — check the flags' }, '🪼 Jellyfish season');
  if (p.lifeguard === 'yes') return h('span', { class: 'beach-chip on' }, '🏖️ Lifeguards');
  if (p.lifeguard === 'no') return h('span', { class: 'beach-chip off' }, '🏖️ No lifeguards');
  return null;
}

export function collRow(emoji, label, checked, onToggle) {
  return h('label', { class: 'coll-row' }, [
    h('input', { type: 'checkbox', checked: checked ? '' : null, onchange: onToggle }),
    h('span', {}, `${emoji} ${label}`),
  ]);
}

export function daysSinceISO(iso) { const n = -daysUntilISO(iso); return Number.isFinite(n) ? n : 9999; }
// Exported for the same Travel Circle share-detail/inbox reason as SEV_LABEL above.

export function dowShort(i) {
  try {
    return new Intl.DateTimeFormat(dateLocale(), { weekday: 'short' }).format(new Date(2024, 0, 7 + i));
  } catch { return DOW_FALLBACK[i]; }
}

export function formatMarketDays(p) {
  const d = marketOpenDays(p);
  // t() rather than a bare literal: these two are assembled at runtime around locale-derived
  // weekday names, so translateTree's exact-string match can never see them as a whole.
  if (!d) return t('Daily');
  if (d.length === 2 && d.includes(0) && d.includes(6)) return `${t('Weekends')} (${dowShort(6)} & ${dowShort(0)})`;
  if (d.join(',') === '0,5,6') return `${dowShort(5)}–${dowShort(0)}`;   // Fri, Sat, Sun (Sun wraps to index 0)
  let contig = true;
  for (let i = 1; i < d.length; i++) if (d[i] !== d[i - 1] + 1) contig = false;
  if (contig && d.length > 2) return `${dowShort(d[0])}–${dowShort(d[d.length - 1])}`;
  return d.map((n) => dowShort(n)).join(d.length > 2 ? ', ' : ' & ');
}

export function getPlaceSecrets(id) { const s = getPlaceData(id).secrets; return Array.isArray(s) ? s : []; }
// Exported: the Travel Circle share-detail screen (main.js) saves an incoming shared secret

export function jellyMonths(p) {
  const m = Array.isArray(p.jellyfishMonths) ? p.jellyfishMonths.filter((n) => Number.isInteger(n) && n >= 1 && n <= 12) : [];
  return m.length ? [...new Set(m)].sort((a, b) => a - b) : null;
}

export function marketChip(p) {
  if (!isMarket(p)) return null;
  const d = marketOpenDays(p);
  if (!d) return h('span', { class: 'mkt-chip daily' }, `🛍️ ${p.marketType || 'Market'} · daily`);
  const on = d.includes(new Date().getDay());
  return h('span', { class: `mkt-chip ${on ? 'on' : 'off'}`, title: `Runs ${formatMarketDays(p)}` },
    on ? '🛍️ On today' : `🛍️ ${formatMarketDays(p)}`);
}
