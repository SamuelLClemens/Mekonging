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
// F7b (2026-10-29): the world outline finds the country (js/emergency-world.js, loaded for #sos and #hospital by
// render() when a fix is more than 10 km from the four countries' outlines) and a cited table gives its numbers,
// each a tap-to-call button like the four countries'. A country the outline names but the table has no checked
// source for gets 112 and the coordinates, never a guess. Where the outline decides, it replaces the distance hedge:
// 30 km into Myanmar from Mae Sot is Myanmar however near a curated city is. Not settled by it: within 10 km of
// a region border the four countries' own outline and ADM1 polygons still decide (countryOfFix), because the world
// outline is generalised by about 5 km and a border town is narrower than that.
import { h } from '../util.js';
import { OUTSIDE_KM } from '../fix-place.js';
import { uiLang } from '../i18n.js';
import { go, mount, topbar, countryChips, countriesNearFix, nearestSpotGlobal } from '../main.js';
import { worldCountryOf, worldDecides, appCountryOf, emergencyFor, sourceHost, telHref, COAST_KM } from '../emergency-world.js';

// Past this from every curated city, with no region outline within 10 km, the named country may be wrong.
export const FAR_KM = 60;

// 'sure': a shipped outline is within 10 km, the world outline settles the fix in one of the four countries, or a
//   curated city is within FAR_KM.
// 'far': none of those, but a city is within OUTSIDE_KM: the nearest city's country is named and may be wrong.
// 'outside': the world outline settles the fix in another country (worldDecides: inside its polygon, or off it with no
//   city of the four countries within 100 km), or no city is within OUTSIDE_KM and the outline names none.
// `world` is the outline's answer ({ id, name, km, exact }) when it settled the fix, else null (not loaded, no land
// within REACH_KM, or a city of the four countries is too near to let an off-outline answer overrule it).
export function fixSureness(fix) {
  if (!fix || fix.lat == null || fix.lng == null) return { kind: 'sure', near: null, world: null };
  if (countriesNearFix(fix).length) return { kind: 'sure', near: null, world: null };
  const near = nearestSpotGlobal(fix);
  const world = worldCountryOf(fix);
  if (worldDecides(world, near && near.km)) return { kind: appCountryOf(world.id) ? 'sure' : 'outside', near, world };
  if (!near || near.km > OUTSIDE_KM) return { kind: 'outside', near, world: null };
  return { kind: near.km > FAR_KM ? 'far' : 'sure', near, world: null };
}

// The country's name in the traveller's language (F5c). The outline names countries in English only; for Thai, Vietnamese, Khmer and
// Lao the platform's own CLDR names (Intl.DisplayNames, no dictionary, no network) read as the rest of the screen does. Any other
// language keeps the English name so a sentence is not half one language and half another, and so does a code the platform lacks.
const HOST_LANGS = new Set(['th', 'vi', 'km', 'lo']);
function countryName(world) {
  const lang = uiLang();
  if (!HOST_LANGS.has(lang) || !world.id) return world.name;
  try {
    const id = world.id.toUpperCase();
    const name = new Intl.DisplayNames([lang], { type: 'region' }).of(id);
    return name && name !== id ? name : world.name;
  } catch { return world.name; }
}

// 1.3521° N, 103.8198° E (four decimals, about 11 m).
function coordsLabel(fix) {
  const dir = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  return `${dir(fix.lat, 'N', 'S')}, ${dir(fix.lng, 'E', 'W')}`;
}

// `data-no-mt` on the number and the coordinates: the optional machine-translation pass (js/i18n.js)
// must never regroup digits on the one screen where a mangled string could get somebody hurt.
// With the country's table entry the card is the same shape as the four countries': one tap-to-call button per number
// (`a.btn.block.sos-num`, label and digits in two nodes), then 112 as the fallback and the entry's source.
function callCard(world, entry) {
  const nums = entry ? entry.numbers : [];
  // A country whose own table lists 112 (most of Europe) needs no second 112 button under it.
  const lists112 = nums.some((e) => String(e.number).replace(/\s/g, '') === '112');
  return h('div', { class: 'card sos-card', 'data-nofold': '' }, [
    h('h2', {}, entry ? `📞 ${countryName(world)} — call for help` : '📞 Call for help'),
    ...nums.map((e) => h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: telHref(e.number) }, [e.label, `: ${e.number}`])),
    lists112 ? null : h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: 'tel:112' }, 'International emergency number: 112'),
    lists112 ? null : h('p', { class: 'muted tiny', style: 'margin: var(--sp-1h) 0 0' }, '112 is answered on most mobile networks worldwide, not all. If it does not connect, ask anyone nearby for the local number.'),
    entry ? h('p', { class: 'muted tiny', 'data-no-mt': '', style: 'margin: var(--sp-1h) 0 0' }, ['Source: ', h('a', { href: entry.src, target: '_blank', rel: 'noopener' }, `${sourceHost(entry.src)} ↗`)]) : null,
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
export function outsideScreen(route, fix, near, world) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(route === 'hospital' ? 'Get to a hospital' : 'Emergency', route === 'hospital' ? '#sos' : '#home'));
  const km = near ? Math.round(near.km) : null;
  const entry = world ? emergencyFor(world.id) : null;
  const offshore = world && world.km > COAST_KM;
  // The country when the outline names one; otherwise the F7a text (open water, or the outline never loaded).
  const head = world
    ? [h('h2', {}, `📍 ${offshore ? 'Near ' : ''}${countryName(world)}`),
       offshore ? h('p', { style: 'margin: var(--sp-1h) 0' }, `About ${world.km} km off its coast.`) : null,
       h('p', { class: 'muted tiny', style: 'margin: var(--sp-1h) 0' }, 'Outside Thailand, Vietnam, Cambodia and Laos.')]
    : [h('h2', {}, '📍 Outside Thailand, Vietnam, Cambodia and Laos'),
       km != null ? h('p', { style: 'margin: var(--sp-1h) 0' }, `You appear to be about ${km.toLocaleString('en')} km from ${near.spot.city}.`) : null];
  const gap = world && !entry ? `This app has no checked emergency number for ${countryName(world)} yet.` : 'This app has no emergency numbers for where you are yet: pick one of the four countries below to see its numbers.';
  wrap.append(h('div', { class: 'card sos-card', 'data-nofold': '', 'data-outside': '' }, [
    ...head,
    h('p', { 'data-no-mt': '', style: 'margin: var(--sp-1h) 0' }, [h('strong', {}, 'Your coordinates: '), coordsLabel(fix)]),
    h('p', { class: 'muted tiny', style: 'margin: 0' }, entry ? 'Read these to a dispatcher.' : ['Read these to a dispatcher. ', gap]),   // two text nodes: each sentence is a key
  ]));
  wrap.append(callCard(world, entry));
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
