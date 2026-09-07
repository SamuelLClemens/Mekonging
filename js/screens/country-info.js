// Six per-country info screens reached from the "Know this country" section
// (js/nav-groups.js): set your location, history & culture, accessibility, travelling with
// a baby, entry & visa, and common scams. Grouped together because they share one shape
// (all take a country code, all render a topbar + a stack of cards, none touches a live
// map/GPS/wake-lock/mic surface) and because five of the six were already physically
// adjacent in main.js.
//
// Extracted from main.js (module split, main.js size-reduction pass). Shared helpers that
// the still-in-main.js country hub screen ALSO renders inline — countryHistory/cityHistory/
// knownForRow (read by historyScreen here AND by cityAboutCard, which stays), whereAmICard,
// accessCard, visaCard — stay in main.js and are reached back into, the same pattern already
// used by js/screens/board.js reaching back in for boardRow (see main.js's own comment on
// that function). dataAgeDays stays too: freshnessNotice below needs it, but so does the
// unrelated, generic freshnessLine that other screens still in main.js call.
//
// countryHistoryCard moved here with historyScreen for thematic reasons, not because
// anything calls it — it currently has no callers anywhere in the app (checked before this
// split, not a side effect of it). Left as found rather than wired in or deleted; a pure
// module move is not the place to make that call.
import { h } from '../util.js';
import { getCountry, boardsForCountry } from '../data/regions.js';
import { getAccessibility } from '../data/accessibility.js';
import { getVisa } from '../data/visa.js';
import { scamsFor } from '../data/scams.js';
import { HISTORY } from '../data/history.js';
import { spotKey } from '../weather.js';
import { sourcesNote } from '../render-utils.js';
import { field, locationSelect, spotForKey, screenHint, readAloudBar, foldable } from '../ui-widgets.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { store, getLastFix } from '../state.js';
import {
  go, mount, topbar, countryContextLine, focusSpot, setFocusSpot, nearestSpotGlobal,
  countryChips, boardRow, countryHistory, knownForRow, dataAgeDays,
} from '../main.js';

function setCityScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Set your location', cc && getCountry(cc) ? `#country-${cc}` : '#home'));
  wrap.append(screenHint('Choose where you are so distances, weather, “near me” and local prices all match — even with no signal or GPS off.'));
  // One dropdown, defaulting to your current (or last-set) location, grouped by country.
  const cur = focusSpot(cc && getCountry(cc) ? cc : undefined).spot;
  wrap.append(h('div', { class: 'card' }, [
    field('Your location', locationSelect(spotKey(cur), (key) => { const s = spotForKey(key); if (s) { setFocusSpot(s); go(`#country-${s.country}`); } })),
    h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, `Currently: ${cur.city}. Works offline — no GPS needed.`),
  ]));
  mount(wrap, '#home');
}

// ---- HISTORY & ORIENTATION (full read; the country hub carries the collapsed version) ----
function countryHistoryCard(cc) {
  const hi = countryHistory(cc);
  if (!hi || !hi.blurb) return null;
  const card = h('div', { class: 'card history-card' }, [h('h2', {}, 'History & culture')]);
  card.append(h('p', {}, hi.blurb));
  const kf = knownForRow(hi.knownFor); if (kf) card.append(kf);
  if (hi.cultureTip) card.append(h('p', { class: 'culture-tip' }, `🙏 ${hi.cultureTip}`));
  if (hi.sources && hi.sources.length) card.append(h('p', { class: 'disclaimer', style: 'margin-bottom:0' }, `Sources: ${hi.sources.join(', ')}`));
  return card;
}

// In-depth history & culture: the full country read PLUS every city history we hold, so
// there is somewhere to go deeper than the collapsed hub card.
function historyScreen(cc) {
  const c = getCountry(cc);
  const hi = countryHistory(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(c ? `${c.name} — history` : 'History & culture', c ? `#country-${cc}` : '#home'));
  if (!hi) { wrap.append(h('p', { class: 'empty' }, 'History for this country is on the way.')); mount(wrap, 'home'); return; }
  const histCard = h('div', { class: 'card history-card' }, [h('h2', {}, 'The short history'), h('p', {}, hi.blurb)]);
  { const rd = readAloudBar(() => hi.blurb); if (rd) histCard.append(rd); }
  wrap.append(histCard);
  const kf = knownForRow(hi.knownFor); if (kf) wrap.append(h('div', { class: 'card' }, [h('h3', {}, 'Known for'), kf]));
  if (hi.cultureTip) wrap.append(h('div', { class: 'card' }, [h('h3', {}, '🙏 Cultural respect'), h('p', {}, hi.cultureTip)]));
  const cityKeys = Object.keys(HISTORY.cities || {}).filter((k) => k.startsWith(cc + '-'));
  if (cityKeys.length) {
    wrap.append(h('h2', { class: 'home-section' }, 'City by city'));
    cityKeys.forEach((k) => {
      const ci = HISTORY.cities[k]; if (!ci || !ci.blurb) return;
      wrap.append(foldable(ci.name || k,
        h('div', {}, [h('p', {}, ci.blurb), knownForRow(ci.knownFor), ci.bestTime ? h('p', { class: 'culture-tip' }, `🗓 Best time: ${ci.bestTime}`) : null])));
    });
  }
  if (hi.sources && hi.sources.length) wrap.append(h('p', { class: 'disclaimer' }, `Sources: ${hi.sources.join(', ')}`));
  mount(wrap, 'home');
}

// ---- ACCESSIBILITY (honest disability guidance per country) -----------------
function accessScreen(cc) {
  const a = getAccessibility(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Accessibility', c ? `#country-${cc}` : '#home'));
  wrap.append(countryContextLine(cc));
  if (!a) { wrap.append(h('p', { class: 'empty' }, 'Accessibility guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('p', { class: 'muted' }, `How ${c ? c.name : 'this country'} works for travellers with disabilities — honestly. ${a.overview}`));
  const needs = store.profile.prefs.access || [];
  const SEC = [['mobility', '♿ Wheelchair / limited mobility'], ['vision', '🦯 Blind / low vision'], ['hearing', '🦻 Deaf / hard of hearing']];
  // Surface the traveller's own needs first.
  SEC.slice().sort((x, y) => (needs.includes(y[0]) ? 1 : 0) - (needs.includes(x[0]) ? 1 : 0)).forEach(([key, label]) => {
    if (!a[key]) return;
    const card = h('div', { class: 'card' + (needs.includes(key) ? ' access-focus' : '') });
    card.append(h('h2', {}, label + (needs.includes(key) ? ' · for you' : '')));
    card.append(h('p', {}, a[key]));
    wrap.append(card);
  });
  if (a.tips && a.tips.length) {
    const t = h('div', { class: 'card' }, [h('h2', {}, 'Practical tips')]);
    a.tips.forEach((x) => t.append(h('div', { class: 'list-note' }, x)));
    wrap.append(t);
  }
  wrap.append(sourcesNote(a.sources, a.verified));
  mount(wrap, 'home');
}

// ---- TRAVELLING WITH A BABY (nappies, formula, family help) -----------------
const DIAPER_WHERE = {
  th: 'Cheapest at the big supercentres — Makro, Big C and Lotus’s (house brands plus MamyPoko / Huggies), far cheaper per nappy than 7-Eleven singles. Boots and Watsons pharmacies stock them too but cost more; Villa Market carries imported brands.',
  vi: 'Cheapest at Bách Hóa Xanh and WinMart+, and at Con Cưng / Bibo Mart baby stores; markets and pharmacies also stock them. Bring your usual brand if your baby is fussy.',
  kh: 'Minimarts and pharmacies in Phnom Penh and Siem Reap carry Huggies / MamyPoko; local markets are cheapest. Stock up in the cities before heading rural.',
  la: 'Minimarts and pharmacies in Vientiane, Luang Prabang and larger towns; choice is limited and pricier, so stock up in the city before remote travel.',
};
function babyScreen(cc) {
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('With a baby', c ? `#country-${cc}` : '#home'));
  wrap.append(countryContextLine(cc));
  wrap.append(h('p', { class: 'muted' }, `Where to find nappies, formula and baby basics in ${c ? c.name : 'this country'} — cheapest first — plus family tips. Guidance; verify locally.`));
  const dc = h('div', { class: 'card' }, [h('h2', {}, '🧷 Where to buy nappies (diapers)')]);
  dc.append(h('p', {}, DIAPER_WHERE[cc] || 'Look for the largest supermarket or pharmacy in town and buy larger packs for the best price per nappy.'));
  wrap.append(dc);
  const boards = boardsForCountry(cc).filter((b) => b.family && b.family.length);
  if (boards.length) {
    wrap.append(h('h3', { style: 'margin:14px 2px 4px' }, 'City by city'));
    boards.forEach((b) => {
      const card = h('div', { class: 'card' });
      card.append(h('div', { class: 'row-between' }, [h('h2', {}, b.city), h('button', { class: 'chip', onclick: () => go(`#board-${cc}-${b.slug}`) }, 'Board')]));
      b.family.forEach((f) => card.append(boardRow(f.item, [f.where, f.price].filter(Boolean).join(' · '), f.tip)));
      wrap.append(card);
    });
  }
  wrap.append(h('div', { class: 'card' }, [h('h2', {}, 'Handy to know'),
    h('div', { class: 'list-note' }, 'Pharmacies (Boots / Watsons in Thailand, local pharmacies elsewhere) are reliable for formula, wipes and baby medicine.'),
    h('div', { class: 'list-note' }, 'In bigger cities, Grab and delivery apps can bring supermarket nappies to your hotel.'),
    h('div', { class: 'list-note' }, 'Changing tables are rare outside malls and airports — a portable changing mat helps.'),
    h('div', { class: 'list-note' }, 'Heat and dehydration hit little ones fast: bottled water, shade and slow mornings.'),
  ]));
  mount(wrap, 'home');
}

// ---- ENTRY & VISA (per country; nationality-dependent, always confirm officially) ----
const VISA_TYPE = { 'visa-free': '✅ Visa-free', 'e-visa': '💻 e-Visa', 'visa-on-arrival': '🛬 Visa on arrival', 'visa-required': '📋 Visa required' };

// Long-stay & remote-work routes, verified July 2026 by WebSearch. These are nationality-
// and policy-dependent and change often, so every entry defers to the official portal.
// This is NOT tourist entry (that is VISA above) — it is for staying longer or working
// remotely, the part digital nomads and retirees ask about.
const LONG_STAY = {
  th: {
    note: 'Thailand has genuine long-stay routes for remote workers and retirees.',
    options: [
      { name: 'DTV — Destination Thailand Visa', who: 'Remote workers for foreign employers or clients, freelancers, and “soft-power” activities (Muay Thai, courses, medical stays)', duration: '5-year, multiple-entry; 180 days per stay, extendable once by +180', note: 'Proof of funds around 500,000 THB; you may work only for foreign clients, not Thai employers. Application fee about 10,000 THB.' },
      { name: 'LTR — Long-Term Resident', who: 'Wealthy pensioners (50+, roughly USD 80k/yr income), work-from-Thailand professionals, high earners and investors', duration: '10-year, issued as 5+5, run by the Board of Investment', note: 'Higher income and asset thresholds with more documentation; includes tax benefits on foreign income and simpler re-entry.' },
    ],
    nomad: 'Chiang Mai is the region’s biggest nomad hub, with many cafés and coworking spaces (for example Punspace and CAMP); Bangkok, Phuket and Koh Lanta also have coworking. Spending 180+ days in a tax year can make you a Thai tax resident — take advice.',
    official: { name: 'Thailand BOI — LTR visa', url: 'https://ltr.boi.go.th/' },
    sources: [ { org: 'Thailand E-Visa (MFA)', url: 'https://www.thaievisa.go.th/' }, { org: 'Thailand BOI — LTR visa', url: 'https://ltr.boi.go.th/' } ],
    asOf: '2026-07',
  },
  vi: {
    note: 'Vietnam has no dedicated digital-nomad or retirement visa (a Golden Visa was proposed in 2025 but is not yet in force).',
    options: [
      { name: '90-day e-Visa (multiple entry)', who: 'All nationalities; what most remote workers use', duration: '90 days, multiple entry; cannot be extended or renewed from inside Vietnam', note: 'When it expires you must leave and apply again from abroad (a “visa run”). Apply only on the official portal. Fee about USD 50.' },
    ],
    nomad: 'Da Nang and Ho Chi Minh City are the main nomad bases, with coworking (for example Toong and Dreamplex) and strong, inexpensive internet. Spending 183+ days in a calendar year can make you a tax resident — take advice.',
    official: { name: 'Vietnam Immigration — official e-Visa', url: 'https://evisa.gov.vn/' },
    sources: [ { org: 'Vietnam Immigration (official e-Visa)', url: 'https://evisa.gov.vn/' } ],
    asOf: '2026-07',
  },
  kh: {
    note: 'Cambodia has no digital-nomad visa, but its long-stay business route is unusually simple.',
    options: [
      { name: 'E-class visa + EB extension', who: 'Long-stayers and those working or running a business', duration: 'Extendable indefinitely (1/3/6/12-month); about USD 285 for the 12-month extension', note: 'A work permit is now enforced — EB renewals are refused without one. Enter on the ordinary (E) visa, then extend as EB.' },
      { name: 'ER retirement extension', who: 'Retirees aged 55+', duration: '12-month, renewable; about USD 275–300/year via an agent', note: 'Requires proof of retirement or means; usually arranged through a visa agent.' },
    ],
    nomad: 'Phnom Penh and Siem Reap have coworking spaces and reliable internet, and the E→EB route makes long stays straightforward compared with neighbours.',
    official: { name: 'Cambodia e-Visa (official)', url: 'https://www.evisa.gov.kh/' },
    sources: [ { org: 'Cambodia e-Visa (official)', url: 'https://www.evisa.gov.kh/' } ],
    asOf: '2026-07',
  },
  la: {
    note: 'Laos has no digital-nomad or retirement visa; long stays are built from tourist extensions or a sponsored business visa.',
    options: [
      { name: 'Tourist visa + extensions', who: 'Most long-stayers', duration: 'Tourist e-Visa or visa on arrival, extendable at immigration (about USD 2/day), then a border run', note: 'For anything longer you generally need a business (NI-B) visa arranged by a local sponsor or employer.' },
    ],
    nomad: 'Vientiane and Luang Prabang have some cafés and limited coworking, but internet and the nomad scene are smaller than in Thailand or Vietnam. Confirm current rules with immigration.',
    official: { name: 'Laos eVisa (official)', url: 'https://laoevisa.gov.la/' },
    sources: [ { org: 'Laos eVisa (official)', url: 'https://laoevisa.gov.la/' } ],
    asOf: '2026-07',
  },
};

// A freshness notice for time-sensitive data (e.g. visa rules). Fresh -> a quiet "checked"
// line; stale -> a prominent warning + a live link to the authoritative official source.
// This is the honest, server-free "self-update": the app can't rewrite the rules, but it
// re-checks their age every open and pushes you to the official portal the moment they age.
function freshnessNotice(dateStr, officialUrl, officialName, staleDays = 150) {
  const age = dataAgeDays(dateStr);
  if (age == null) return null;
  if (age <= staleDays) {
    return h('p', { class: 'muted', style: 'margin:2px 0 10px' }, `✓ Verified ${dateStr}. The app re-checks this date automatically and flags it here once it ages; always reconfirm on the official portal for your nationality.`);
  }
  const months = Math.max(1, Math.round(age / 30));
  return h('div', { class: 'card', style: 'border:1px solid var(--orange)' }, [
    h('strong', {}, '⚠ This may be out of date'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, `Last verified ${dateStr} (about ${months} month${months === 1 ? '' : 's'} ago). Visa and entry rules change often — reconfirm on the official government portal for your nationality before you rely on this.`),
    officialUrl ? h('a', { class: 'btn block', href: officialUrl, target: '_blank', rel: 'noopener' }, `🔄 Check ${officialName || 'the official portal'} now ↗`) : null,
  ]);
}

function visaScreen(cc) {
  const v = getVisa(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Entry & visa', c ? `#country-${cc}` : '#home'));
  wrap.append(countryContextLine(cc));
  if (!v) { wrap.append(h('p', { class: 'empty' }, 'Entry guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'banner' }, 'Visa rules depend on your nationality and change often. Treat this as orientation, then confirm on the official site for your passport before you travel.'));
  const fresh = freshnessNotice(v.asOf, v.officialEvisa && v.officialEvisa.url, v.officialEvisa && v.officialEvisa.name);
  if (fresh) wrap.append(fresh);
  wrap.append(h('p', {}, v.summary));
  (v.options || []).forEach((o) => {
    const card = h('div', { class: 'card' });
    card.append(h('div', { class: 'row-between' }, [h('h3', {}, VISA_TYPE[o.type] || o.type), o.fee ? h('span', { class: 'cat-tag' }, o.fee) : null]));
    if (o.who) card.append(h('p', { class: 'tiny muted', style: 'margin:4px 0' }, o.who));
    if (o.duration) card.append(h('p', { style: 'margin:2px 0' }, `🕒 ${o.duration}`));
    if (o.howApply) card.append(h('div', { class: 'list-note' }, o.howApply));
    wrap.append(card);
  });
  // Long stay & remote work (digital nomads, retirees) — separate from tourist entry.
  const ls = LONG_STAY[cc];
  if (ls) {
    const lc = h('div', { class: 'card' }, [h('h3', {}, '🧳 Long stay & remote work')]);
    if (ls.note) lc.append(h('p', { class: 'tiny muted', style: 'margin:2px 0 8px' }, ls.note));
    ls.options.forEach((o) => lc.append(h('div', { style: 'margin:6px 0' }, [
      h('strong', {}, o.name),
      o.who ? h('div', { class: 'tiny muted', style: 'margin:2px 0' }, o.who) : null,
      o.duration ? h('div', { style: 'margin:2px 0' }, `🕒 ${o.duration}`) : null,
      o.note ? h('div', { class: 'list-note' }, o.note) : null,
    ])));
    if (ls.nomad) lc.append(h('p', { class: 'tiny', style: 'margin:8px 0 0' }, [h('strong', {}, '💻 Nomad tip: '), ls.nomad]));
    if (ls.official && ls.official.url) lc.append(h('a', { class: 'btn ghost block btn-spaced', href: ls.official.url, target: '_blank', rel: 'noopener' }, `${ls.official.name} ↗`));
    lc.append(sourcesNote(ls.sources, ls.asOf));
    wrap.append(lc);
  }
  if (v.officialEvisa && v.officialEvisa.url) {
    wrap.append(h('div', { class: 'card' }, [
      h('h3', {}, 'Official e-visa portal'),
      h('p', { class: 'tiny muted' }, 'Use only the official government site — look-alike reseller sites overcharge and harvest data.'),
      h('a', { class: 'btn block', href: v.officialEvisa.url, target: '_blank', rel: 'noopener' }, `${v.officialEvisa.name} ↗`),
    ]));
  }
  if (v.landBorderNotes) wrap.append(h('div', { class: 'card' }, [h('h3', {}, 'At land borders'), h('p', {}, v.landBorderNotes)]));
  if (v.overstay) wrap.append(h('div', { class: 'card' }, [h('h3', {}, 'Overstay'), h('p', {}, v.overstay)]));
  if (v.scams && v.scams.length) { const s = h('div', { class: 'card' }, [h('h3', {}, '⚠️ Common visa scams')]); v.scams.forEach((x) => s.append(h('div', { class: 'warn-note' }, x))); wrap.append(s); }
  wrap.append(sourcesNote(v.sources, v.asOf));
  mount(wrap, 'home');
}

// ---- COMMON SCAMS (per country) ----------------------------------------------
// One place that gathers the scams travellers actually report, so they can be recognised
// before they happen. The curated top-list (data/scams.js, web-verified) leads; the visa/
// border scams already in VISA and the airport-transport scam already in ARRIVAL are folded
// in below so nothing is duplicated across the app. Reassuring, not alarmist — these are money
// tricks, not danger, and a calm "no, thank you" plus agreeing prices first avoids almost all.
function scamsScreen(cc) {
  // Snap to a sensible country: explicit arg wins, else the last GPS fix, else browsed country.
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc && getCountry(cc)) setActiveCountry(cc);
  else if (near) setActiveCountry(near.spot.country);
  const c = getCountry(getActiveCountry());
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Common scams', c ? `#country-${getActiveCountry()}` : '#home'));
  wrap.append(countryContextLine(getActiveCountry()));
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }

  wrap.append(screenHint(`The scams travellers report most in ${c.name}. Almost all are about money, not danger — recognise the setup, agree prices first, and a calm “no, thank you” ends most of them.`));
  wrap.append(countryChips((id) => go(`#scams-${id}`), getActiveCountry()));

  const s = scamsFor(getActiveCountry());
  if (s && s.hotline) {
    // data-no-mt: same reasoning as the SOS numbers — label and dialable digits share a text
    // node, so this one stays exactly as written. See js/i18n.js.
    wrap.append(h('a', { class: 'btn block', 'data-no-mt': '', style: 'margin:8px 0', href: `tel:${String(s.hotline.number).replace(/\s/g, '')}` }, `🚔 ${s.hotline.label}: ${s.hotline.number}`));
  }

  if (s && s.top && s.top.length) {
    s.top.forEach((x) => {
      wrap.append(h('div', { class: 'card scam-card' }, [
        h('h3', {}, x.title),
        h('p', { class: 'scam-how', style: 'margin:4px 0' }, [h('strong', {}, '⚠ What happens: '), x.how]),
        h('p', { class: 'scam-avoid', style: 'margin:4px 0 0' }, [h('strong', {}, '✓ Avoid it: '), x.avoid]),
      ]));
    });
  } else {
    wrap.append(h('p', { class: 'empty' }, 'A scams guide for this country is on the way.'));
  }

  // Fold in the visa/border scams already carried in VISA, with a link to the full guide.
  const v = getVisa(getActiveCountry());
  if (v && v.scams && v.scams.length) {
    const vc = h('div', { class: 'card' }, [h('h3', {}, '🛂 Visa & border scams')]);
    v.scams.forEach((x) => vc.append(h('div', { class: 'warn-note' }, x)));
    vc.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#visa-${getActiveCountry()}`) }, 'Open the entry & visa guide'));
    wrap.append(vc);
  }

  // Point to the airport-transport scam note, which lives on the arrival hub.
  wrap.append(h('div', { class: 'card' }, [
    h('h3', {}, '🚕 Getting from the airport'),
    h('p', { class: 'muted', style: 'margin:4px 0 8px' }, 'The most common first-hour trick is an airport transport overcharge. The arrival guide lists the cheapest safe way into town for each gateway.'),
    h('button', { class: 'btn ghost block', onclick: () => go(`#arrival-${getActiveCountry()}`) }, '🛬 Open the arrival guide'),
  ]));

  if (s && s.sources && s.sources.length) wrap.append(sourcesNote(s.sources, s.asOf));
  wrap.append(h('p', { class: 'disclaimer' }, 'Guidance only — scams change and situations vary. When something feels off, walk away. If you are cheated or threatened, contact the tourist police.'));
  mount(wrap, '#home');
}

export { setCityScreen, historyScreen, accessScreen, babyScreen, visaScreen, scamsScreen };
