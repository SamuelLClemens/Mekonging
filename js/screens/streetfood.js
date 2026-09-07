// Street food — find it, rate it, review it. The traveller's own ratings and photos stay on
// their device; the listings are the curated per-city boards.
import { getActiveCountry, setActiveCountry, setLiveCleanup } from '../app-state.js';
import { allPlaces, boardsForCountry } from '../data/regions.js';
import { starsStr } from '../render-utils.js';
import { getPlaceData, save, setLastFix, setPlaceField, store } from '../state.js';
import { h } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { boardRow, countryChips, go, mount, rnThumb, topbar } from '../main.js';

function starPicker(placeId, current) {
  const row = h('div', { class: 'chips' });
  for (let n = 1; n <= 5; n++) {
    row.append(h('button', { class: 'chip', 'aria-pressed': current === n ? 'true' : 'false', 'aria-label': `Rate ${n} star${n > 1 ? 's' : ''}`, onclick: () => { setPlaceField(placeId, 'rating', n); go('#streetfood'); } }, '★'.repeat(n)));
  }
  return row;
}

export function streetfoodScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Street food', '#home'));
  wrap.append(screenHint('The local stalls and food streets worth queueing for — with your own ratings and takes, kept on-device and shown first. Rate a stall and your score drives its colour on the map too.'));
  wrap.append(countryChips((id) => { setActiveCountry(id); go('#streetfood'); }));

  // rateable street-food places (curated local eats) — as a rate-list or on a map.
  const prefs = store.profile.prefs;
  const sview = prefs.streetView === 'map' ? 'map' : 'list';
  const places = allPlaces({ country: getActiveCountry() }).filter((p) => p.isLocal === true || (p.categories || []).includes('streetfood'));
  const mappable = places.filter((p) => p.coords);
  if (places.length) {
    if (mappable.length) {
      wrap.append(h('div', { class: 'view-toggle', style: 'display:flex;gap: var(--sp-2);align-items:center;margin: var(--sp-1h) 0' }, [
        h('div', { class: 'chips', style: 'margin: 0' }, [
          h('button', { class: 'chip', 'aria-pressed': sview === 'list' ? 'true' : 'false', onclick: () => { prefs.streetView = 'list'; save(); go('#streetfood'); } }, '📋 List'),
          h('button', { class: 'chip', 'aria-pressed': sview === 'map' ? 'true' : 'false', onclick: () => { prefs.streetView = 'map'; save(); go('#streetfood'); } }, '🗺 Map'),
        ]),
      ]));
    }
    if (sview === 'map' && mappable.length) {
      wrap.append(h('p', { class: 'muted', style: 'margin: var(--sp-0h) var(--sp-0h) var(--sp-1h)' }, `${mappable.length} stalls & food streets on the map — tap a pin`));
      const canvas = h('div', { class: 'places-map', style: 'height:340px;border-radius:16px;overflow:hidden;position:relative' });
      wrap.append(canvas);
      import('./map.js').then((m) => m.initMap(canvas, {
        places: mappable,
        onOpen: (id) => go(`#place-${id}`), onLocate: (f) => setLastFix(f),
      })).then((c) => { setLiveCleanup(() => { try { c.dispose(); } catch { /* noop */ } }); }).catch(() => { /* list still below */ });
    } else {
      const card = h('div', { class: 'card' });
      card.append(h('h2', {}, 'Rate the classics'));
      places.forEach((p) => {
        const mine = getPlaceData(p.id);
        card.append(h('div', { class: 'board-post' }, [
          h('button', { class: 'sf-row', onclick: () => go(`#place-${p.id}`) }, [
            rnThumb(p),
            h('div', { class: 'sf-text' }, [
              h('div', { class: 'sf-name' }, p.name),
              h('div', { class: 'tiny muted' }, p.city),
            ]),
          ]),
          h('div', { class: 'tiny muted' }, mine.rating ? `Your rating: ${starsStr(mine.rating)}` : `Guide rating ${Number(p.rating || 0).toFixed(1)} — tap to add yours`),
          starPicker(p.id, mine.rating || 0),
          mine.review ? h('p', { class: 'tiny', style: 'margin-top: var(--sp-1)' }, `“${mine.review}”`) : null,
        ]));
      });
      wrap.append(card);
    }
  }

  // street-food areas from the local boards (browse + jump to the board)
  const boards = boardsForCountry(getActiveCountry()).filter((b) => (b.streetFood || []).length);
  if (boards.length) {
    const card = h('div', { class: 'card' });
    card.append(h('h2', {}, 'Where to graze, city by city'));
    boards.forEach((b) => {
      card.append(h('h3', { style: 'margin-top: var(--sp-2)' }, b.city));
      (b.streetFood || []).forEach((s) => card.append(boardRow(`${s.name} — ${s.dish}`, [s.price, s.when].filter(Boolean).join(' · '), s.tip)));
      card.append(h('button', { class: 'btn ghost block', style: 'margin-top: var(--sp-1)', onclick: () => go(`#board-${b.country}-${b.slug}`) }, `📋 ${b.city} noticeboard`));
    });
    wrap.append(card);
  }
  if (!places.length && !boards.length) wrap.append(h('p', { class: 'empty' }, 'No street-food entries for this country yet — more cities are being added.'));
  mount(wrap, '#home');
}
