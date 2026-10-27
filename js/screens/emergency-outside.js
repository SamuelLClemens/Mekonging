// Emergency outside the four countries (slice F7a, owner decision 28, 2026-10-27:
// "no matter where you are in the world it should give you the emergency info").
//
// The emergency screens used to name a region country for every fix: the nearest curated city's
// country, so Singapore read "Showing Thailand" with Thailand's numbers. `fixSureness` says how far
// the answer can be trusted, and this screen is what a fix outside the region gets instead.
//
// The test is the shipped outlines first (countriesNearFix: a region outline within 10 km), then the
// distance to the nearest curated city. Measured 2026-10-27 on the 36,131 offline list places
// (js/data/gazetteer.<cc>.js): 681 have no outline within 10 km (islands, coast, remote sites) and
// only 124 of those, 0.34 % of all list places, are more than 60 km from a curated city, so a
// "far" note past 60 km is rare for a traveller inside the region. Yangon (237 km), Mawlamyine
// (189 km) and Penang (165 km) are inside OUTSIDE_KM and read "far", not "outside": no distance
// separates them from remote region sites, and the nearest city still names a country there.
//
// Not here: the national numbers for the rest of the world and the world outline that would find the
// country (F7b). Until then, outside the region the screen gives the international number and the
// traveller's coordinates, never a region country's numbers as if they applied.
import { h } from '../util.js';
import { OUTSIDE_KM } from '../fix-place.js';
import { go, mount, topbar, countryChips, countriesNearFix, nearestSpotGlobal } from '../main.js';

// Past this from every curated city, with no region outline within 10 km, the named country may be wrong.
export const FAR_KM = 60;

// 'sure': a shipped outline is within 10 km, or a curated city is within FAR_KM.
// 'far': neither, but a city is within OUTSIDE_KM: the nearest city's country is named and may be wrong.
// 'outside': no city within OUTSIDE_KM, so countryOfFix() is null (Singapore, Kuala Lumpur, Kunming).
export function fixSureness(fix) {
  if (!fix || fix.lat == null || fix.lng == null) return { kind: 'sure', near: null };
  if (countriesNearFix(fix).length) return { kind: 'sure', near: null };
  const near = nearestSpotGlobal(fix);
  if (!near || near.km > OUTSIDE_KM) return { kind: 'outside', near };
  return { kind: near.km > FAR_KM ? 'far' : 'sure', near };
}

// 1.3521° N, 103.8198° E (four decimals, about 11 m).
function coordsLabel(fix) {
  const dir = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  return `${dir(fix.lat, 'N', 'S')}, ${dir(fix.lng, 'E', 'W')}`;
}

// `data-no-mt` on the number and the coordinates: the optional machine-translation pass (js/i18n.js)
// must never regroup digits on the one screen where a mangled string could get somebody hurt.
function callCard() {
  return h('div', { class: 'card sos-card', 'data-nofold': '' }, [
    h('h2', {}, '📞 Call for help'),
    h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: 'tel:112' }, 'International emergency number: 112'),
    h('p', { class: 'muted tiny', style: 'margin: var(--sp-1h) 0 0' }, '112 is answered on most mobile networks worldwide, not all. If it does not connect, ask anyone nearby for the local number.'),
  ]);
}

// The extra card on a 'far' fix: the country named is the nearest city's, so say so, and offer 112.
export function farCard(near, countryName) {
  const km = Math.round(near.km);
  return h('div', { class: 'card sos-card', 'data-nofold': '', 'data-far': '' }, [
    h('p', { style: 'margin: 0 0 var(--sp-1h)' }, `Far from any place this app lists (${km} km from ${near.spot.city}). If you are not in ${countryName}, the numbers below may not work.`),
    h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: 'tel:112' }, 'International emergency number: 112'),
  ]);
}

// One screen for both routes: the sos and hospital screens differ here only in title and chip target.
export function outsideScreen(route, fix, near) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(route === 'hospital' ? 'Get to a hospital' : 'Emergency', route === 'hospital' ? '#sos' : '#home'));
  const km = near ? Math.round(near.km) : null;
  wrap.append(h('div', { class: 'card sos-card', 'data-nofold': '', 'data-outside': '' }, [
    h('h2', {}, '📍 Outside Thailand, Vietnam, Cambodia and Laos'),
    km != null ? h('p', { style: 'margin: var(--sp-1h) 0' }, `You appear to be about ${km.toLocaleString('en')} km from ${near.spot.city}.`) : null,
    h('p', { 'data-no-mt': '', style: 'margin: var(--sp-1h) 0' }, [h('strong', {}, 'Your coordinates: '), coordsLabel(fix)]),
    h('p', { class: 'muted tiny', style: 'margin: 0' }, 'Read these to a dispatcher. This app has no emergency numbers for where you are yet: pick one of the four countries below to see its numbers.'),
  ]));
  wrap.append(callCard());
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Get to a hospital'),
    h('a', { class: 'btn block', href: `https://www.google.com/maps/search/hospital/@${fix.lat},${fix.lng},13z`, target: '_blank', rel: 'noopener' }, '🔎 Search hospitals around me (needs internet) ↗'),
    h('p', { class: 'muted tiny', style: 'margin: var(--sp-1h) 0 0' }, 'No hospital list is built for where you are.'),
  ]));
  wrap.append(countryChips((id) => go(`#${route}-${id}`), null));
  if (route === 'sos') {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, '📖 Survival guide'),
      h('button', { class: 'btn block', onclick: () => go('#firstaid') }, '📖 Open the full survival guide'),
      h('a', { class: 'btn ghost block btn-spaced', href: `https://www.google.com/maps/search/embassy/@${fix.lat},${fix.lng},12z`, target: '_blank', rel: 'noopener' }, '🔎 Find your embassy near me ↗'),
    ]));
  }
  wrap.append(h('p', { class: 'disclaimer' }, 'In a serious emergency, call 112 or any local emergency number you know. First-aid guidance here is general and not a substitute for a doctor.'));
  mount(wrap, '#home');
}
