// "Get to a hospital" — the screen that has to work when nothing else does.
//
// The old version of this lived inside sosScreen() as a single card: one Google Maps link
// and a list of nineteen big-city hospitals. That answered the question "where is a good
// hospital in Bangkok?" It did not answer the question a traveller actually asks, which is
// "I am somewhere I cannot pronounce and something is wrong — what do I do?"
//
// So the screen is built around a fallback chain that never dead-ends:
//   1. the national emergency number (works with no credit, usually with no SIM);
//   2. a phrase in the local script, held up to a stranger (works with no signal at all);
//   3. named hospitals near the fix, ordered by distance and labelled by capability;
//   4. when nothing is near, what the country's health system structurally guarantees at
//      the traveller's own province and district — plus the local word for "hospital", so
//      a map search or a question to a passer-by still lands;
//   5. the referral and evacuation chain out, which for Laos crosses into Thailand.
// Every one of those steps except (3)'s map links renders and functions fully offline.
import { h } from '../util.js';
import { store, save, getLastFix } from '../state.js';
import { getCountry, getLanguage } from '../data/regions.js';
import { haversineKm } from '../util.js';
import { driveLabel, sourcesNote } from '../render-utils.js';
import { infoTip, field } from '../ui-widgets.js';
import { showBigPhrase } from './phrasebook.js';
import {
  HOSPITALS, HOSP_TAG, TIER_META, TIER_ORDER,
  CARE_SYSTEM, EVAC, REACH_STEPS, REMOTE_PLAN, MED_SOURCES,
} from '../data/medical.js';
import {
  go, mount, topbar, countryChips, mapsSearch, kmLabel, whereAmI, nearestSpotGlobal, ensureRegionSet,
} from '../main.js';
import { getActiveCountry, setActiveCountry } from '../app-state.js';

// Three routes to the same place, because exactly one of them works in each situation:
// the Google deep link is best when online; the geo: URI hands the coordinate to whatever
// map app is installed — including an offline one such as OsmAnd or Organic Maps, which is
// the only link on this screen that resolves with no data; OpenStreetMap is the neutral
// fallback for a device with neither.
function routeLinks(lat, lng, label) {
  const q = encodeURIComponent(label || '');
  return h('div', { class: 'chips', style: 'margin-top:6px' }, [
    h('a', { class: 'chip', href: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, target: '_blank', rel: 'noopener' }, 'Directions ↗'),
    h('a', { class: 'chip', href: `geo:${lat},${lng}?q=${lat},${lng}(${q})` }, 'Open in map app'),
    h('a', { class: 'chip', href: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`, target: '_blank', rel: 'noopener' }, 'OpenStreetMap ↗'),
  ]);
}

function tierChip(tier) {
  const m = TIER_META[tier];
  return m ? h('span', { class: 'cat-tag' }, `${m.dot} ${m.label}`) : null;
}

// One hospital, rendered with the two facts that decide whether to go there: how far it is
// and what it can actually do. Distance is straight-line — driveLabel() converts it to an
// honest road estimate, which on a mountain or an island is a very different number.
function hospitalCard(x, fix) {
  const km = (fix && fix.lat != null) ? haversineKm(fix, { lat: x.lat, lng: x.lng }) : null;
  const drive = km != null ? driveLabel(km) : null;
  return h('div', { class: 'card sos-hosp', style: 'margin:6px 0' }, [
    h('div', { class: 'row-between' }, [
      h('strong', {}, x.name),
      km != null ? h('span', { class: 'fair' }, kmLabel(km)) : null,
    ]),
    h('div', { class: 'muted tiny', style: 'margin:2px 0 4px' },
      [x.city, x.prov && x.prov !== x.city ? x.prov : null, drive].filter(Boolean).join(' · ')),
    x.note ? h('div', { class: 'tiny', style: 'margin:0 0 4px' }, x.note) : null,
    h('div', { class: 'chips' }, [tierChip(x.tier), ...(x.tags || []).map((t) => h('span', { class: 'cat-tag' }, HOSP_TAG[t] || t))].filter(Boolean)),
    routeLinks(x.lat, x.lng, x.name),
  ]);
}

// The traveller's own emergency card: blood type, allergies, regular medication, insurer
// and next of kin. It never leaves the device — it is written to the same local store as
// the journal and the budget, is never sent anywhere, and is never included in a share
// link. Its whole purpose is to be readable by a stranger holding your phone, so the
// "Show" view renders it large and works with no signal.
function medCardData() {
  const p = store.profile;
  if (!p.medical || typeof p.medical !== 'object') p.medical = {};
  return p.medical;
}
const MED_FIELDS = [
  { k: 'blood', label: 'Blood type', ph: 'O+' },
  { k: 'allergies', label: 'Allergies', ph: 'Penicillin, peanuts' },
  { k: 'conditions', label: 'Conditions', ph: 'Asthma, type 1 diabetes' },
  { k: 'meds', label: 'Regular medication', ph: 'Name and dose' },
  { k: 'insurer', label: 'Insurer & policy number', ph: 'Insurer, policy 12345' },
  { k: 'assist', label: 'Insurer 24h assistance line', ph: '+44 …' },
  { k: 'kin', label: 'Emergency contact', ph: 'Name, relationship, number' },
];

function showMedCard() {
  const m = medCardData();
  const rows = MED_FIELDS.filter((f) => (m[f.k] || '').trim());
  const overlay = h('div', { class: 'bigphrase', role: 'dialog', 'aria-label': 'Medical card' });
  const inner = h('div', { class: 'card', style: 'max-width:520px;text-align:left' }, [
    h('h2', { style: 'margin-top:0' }, '🏥 Medical information'),
    rows.length
      ? h('div', {}, rows.map((f) => h('p', { style: 'margin:10px 0;font-size:1.15rem' }, [
        h('strong', {}, `${f.label}: `), (m[f.k] || '').trim(),
      ])))
      : h('p', { class: 'muted' }, 'Nothing filled in yet. Close this and complete the card below — it takes a minute and it is read by someone else, at the worst possible time.'),
    h('p', { class: 'tiny muted', style: 'margin-bottom:0' }, 'Stored on this device only. Tap anywhere to close.'),
  ]);
  overlay.append(inner);
  overlay.addEventListener('click', () => overlay.remove());
  document.body.append(overlay);
}

// Country resolution mirrors sosScreen: an explicit chip wins, otherwise the GPS fix
// decides, otherwise the last browsed country. Returns everything downstream needs so the
// render below reads as one linear pass.
function resolveWhere(cc) {
  const fix = getLastFix();
  const near = fix ? nearestSpotGlobal(fix) : null;
  if (cc) setActiveCountry(cc);
  else if (near) setActiveCountry(near.spot.country);
  const active = getActiveCountry();
  return { fix, near, wai: fix ? whereAmI(fix) : null, c: getCountry(active), cc: active };
}

export function hospitalScreen(cc) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Get to a hospital', '#sos'));
  const { fix, wai, c, cc: active } = resolveWhere(cc);
  if (!c) { wrap.append(h('p', { class: 'empty' }, 'Pick a country first.')); mount(wrap, '#home'); return; }
  // The province is the fact that decides which hospital is actually reachable, so pull the
  // polygons in the background if they are not here yet — the screen has already painted.
  ensureRegionSet(active);
  const sys = CARE_SYSTEM[active];
  const book = getLanguage(c.lang);
  const emCat = book && book.categories.find((cat) => cat.id === 'emergency');

  // ---- Where you are -------------------------------------------------------
  // Naming the province matters more than naming the town: the province is what decides
  // which hospital can actually treat you, and it is what a dispatcher needs to hear.
  // Only name a locality when it is in the country being shown. whereAmI() falls back to the
  // nearest listed hub town when it cannot resolve a province, and near a border that hub can
  // sit on the other side of it — printing "Ubon Ratchathani — Laos" on an emergency screen
  // is worse than printing nothing, because the traveller may repeat it to a dispatcher.
  const localName = wai && wai.country === active ? wai.name : null;
  const provName = wai && wai.country === active ? wai.province : null;
  const whereLine = localName
    ? `📍 ${localName}${provName && provName !== localName ? `, ${provName}` : ''} — ${c.flag} ${c.name}`
    : `${c.flag} ${c.name} — turn on location for distances, or pick your country:`;
  wrap.append(h('p', { class: 'sos-loc' }, whereLine));
  wrap.append(countryChips((id) => go(`#hospital-${id}`), active));

  // ---- 1. Call ------------------------------------------------------------
  // `data-no-mt` exempts these from the optional machine-translation pass: the label and
  // the digits share one text node, and a translation service that regroups or drops a
  // digit here could get somebody killed. The bundled dictionary still covers the labels.
  const call = h('div', { class: 'card sos-card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, `1. Call — ${c.name}`),
    infoTip('Emergency numbers are free from any phone, need no credit, and on most networks work with no SIM card. If nobody answers in English, keep the line open and hand the phone to anyone nearby.'),
  ])]);
  const em = (c.info && c.info.emergency) || [];
  if (em.length) em.forEach((e) => call.append(h('a', { class: 'btn block sos-num', 'data-no-mt': '', href: `tel:${String(e.number).replace(/\s/g, '')}` }, `${e.label}: ${e.number}`)));
  else call.append(h('p', { class: 'muted' }, 'Emergency numbers are being added for this country.'));
  wrap.append(call);

  // ---- 2. Show ------------------------------------------------------------
  // The offline half of the screen. A phrase in the local script, full-screen, is the one
  // thing here that works with a dead data connection and a language you cannot speak.
  const show = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '2. Show — works offline'),
    infoTip('No signal needed. Hold the screen up to a driver, a hotel receptionist or anyone passing. The phrase is in the local script, so it does not depend on your pronunciation.'),
  ])]);
  // Each button is labelled with the phrase's OWN English, never a label of our choosing:
  // an earlier draft said "Take me to the hospital" over a card that actually read "Where
  // is the hospital?", which is exactly the kind of quiet mismatch that gets someone driven
  // to the wrong place. The regex list is ordered best-first and falls back gracefully.
  const pick = (...res) => {
    if (!emCat) return null;
    for (const re of res) { const hit = emCat.phrases.find((p) => re.test(p.en)); if (hit) return hit; }
    return null;
  };
  const SHOW_PHRASES = [
    { ic: '🪧', primary: true, p: pick(/take me to the hospital/i, /where is the (nearest )?hospital/i, /^hospital$/i, /doctor/i) },
    { ic: '🚑', p: pick(/ambulance/i) },
    { ic: '⏱', p: pick(/emergency/i) },
    { ic: '🆘', p: pick(/help/i) },
    { ic: '🩸', p: pick(/bleeding/i) },
    { ic: '🫁', p: pick(/not breathing/i) },
    { ic: '🐍', p: pick(/snake bit/i) },
    { ic: '📄', p: pick(/travel insurance/i) },
  ].filter((x) => x.p);
  const seen = new Set();
  SHOW_PHRASES.forEach((x) => {
    if (seen.has(x.p.en)) return;
    seen.add(x.p.en);
    show.append(h('button', {
      class: x.primary ? 'btn block' : 'btn ghost block',
      style: x.primary ? null : 'margin-top:6px',
      onclick: () => showBigPhrase(x.p, book.locale),
    }, `${x.ic} “${x.p.en}”`));
  });
  show.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px', onclick: showMedCard }, '🏥 Show my medical card'));
  if (sys) {
    show.append(h('p', { class: 'tiny muted', style: 'margin:10px 0 2px' }, 'The word for “hospital” here — say it, or type it into any map app:'));
    show.append(h('p', { style: 'margin:0;font-size:1.3rem', lang: book ? book.locale : null }, [
      h('strong', {}, sys.hospitalWord.script),
      h('span', { class: 'muted', style: 'font-size:0.9rem' }, `  (${sys.hospitalWord.roman})`),
    ]));
    show.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, [
      'Emergency room: ', h('strong', { lang: book ? book.locale : null }, sys.erWord.script), ` (${sys.erWord.roman})`,
    ]));
  }
  wrap.append(show);

  // ---- 3. Where to go -----------------------------------------------------
  // Ordered by distance when there is a fix, otherwise by capability so the strongest
  // options in the country are on top. The split at 150 km is the point where "go there"
  // stops being useful advice on its own and the province fallback below starts to matter.
  const inCountry = HOSPITALS.filter((x) => x.cc === active);
  const withKm = inCountry.map((x) => ({ x, km: (fix && fix.lat != null) ? haversineKm(fix, { lat: x.lat, lng: x.lng }) : null }));
  if (fix && fix.lat != null) withKm.sort((a, b) => a.km - b.km);
  else withKm.sort((a, b) => TIER_ORDER.indexOf(a.x.tier) - TIER_ORDER.indexOf(b.x.tier));
  const near = withKm.filter((r) => r.km != null && r.km <= 150);
  const rest = withKm.filter((r) => !near.includes(r));

  const go2 = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '3. Where to go'),
    infoTip('Distances are straight-line; the road figure is an estimate that already allows for how these roads actually drive. Green and blue are private hospitals used to foreign patients. Yellow is the government hospital that must accept an emergency. Orange and white can stabilise you and refer you onward, but not much more.'),
  ])]);
  const liveSearch = (fix && fix.lat != null)
    ? `https://www.google.com/maps/search/hospital/@${fix.lat},${fix.lng},13z`
    : 'https://www.google.com/maps/search/?api=1&query=hospital%20near%20me';
  go2.append(h('a', { class: 'btn block', href: liveSearch, target: '_blank', rel: 'noopener' }, '🔎 Search every hospital around me (needs internet) ↗'));

  if (near.length) {
    go2.append(h('p', { class: 'muted', style: 'margin:12px 0 4px' }, 'Within reach of you, nearest first:'));
    near.slice(0, 8).forEach((r) => go2.append(hospitalCard(r.x, fix)));
  }
  // The honest case. No listed hospital nearby does NOT mean no hospital nearby — it means
  // this app does not name the one that is there. So say what the country's health system
  // guarantees at this administrative level, and give the traveller the local word to ask
  // with. This is the paragraph that makes the screen work in a village.
  const NEAR_ENOUGH_KM = 40;
  const nothingClose = !near.length || (near[0].km != null && near[0].km > NEAR_ENOUGH_KM);
  if (nothingClose && sys) {
    const provLine = provName ? `You are in ${provName}. ` : '';
    go2.append(h('div', { class: 'card allergy-card', style: 'margin:12px 0' }, [
      h('h3', { style: 'margin:0 0 6px' }, near.length ? 'There is almost certainly something closer than that' : 'No hospital listed close to you — here is what is there anyway'),
      h('p', { class: 'tiny', style: 'margin:0 0 6px' }, `${provLine}This app names the hospitals travellers use, not every hospital in the country. What the health system guarantees where you are:`),
      h('ul', { class: 'sos-aid' }, sys.levels.map((li) => h('li', {}, li))),
      h('p', { class: 'tiny', style: 'margin:6px 0 0' }, [
        'Ask for, or search for, ', h('strong', { lang: book ? book.locale : null }, sys.hospitalWord.script),
        ` (${sys.hospitalWord.roman}) — plus the name of the town you are in.`,
      ]),
      provName ? h('a', { class: 'btn ghost block', style: 'margin-top:8px', href: mapsSearch(`${sys.hospitalWord.script} ${provName}`), target: '_blank', rel: 'noopener' }, `🔎 Hospitals in ${provName} ↗`) : null,
    ]));
  }
  if (rest.length) {
    const more = h('details', { class: 'filters-collapse', open: near.length ? null : '' }, [
      h('summary', {}, near.length ? `Every other hospital listed in ${c.name} (${rest.length})` : `Hospitals listed in ${c.name} (${rest.length})`),
    ]);
    const inner = h('div', {});
    rest.forEach((r) => inner.append(hospitalCard(r.x, fix)));
    more.append(inner);
    go2.append(more);
  }
  go2.append(h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'A starting list, not a directory, and not a ranking of quality. For a child, a pregnancy or a complex condition, telephone ahead so the right department is open when you arrive.'));
  wrap.append(go2);

  // ---- 4. How to actually get there ---------------------------------------
  const how = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '4. How to get there'),
    infoTip('Read this before you need it. The single most useful thing on this screen is knowing, in advance, whether an ambulance is coming or whether you are making your own way.'),
  ])]);
  REACH_STEPS.forEach((s) => {
    const d = h('details', { class: 'filters-collapse' }, [h('summary', {}, `${s.ic} ${s.t}`)]);
    d.append(h('p', { class: 'tiny', style: 'margin:6px 0' }, s.d));
    how.append(d);
  });
  if (sys) {
    how.append(h('p', { style: 'margin:10px 0 4px' }, [h('strong', {}, '🚑 Ambulances here: ')]));
    how.append(h('p', { class: 'tiny', style: 'margin:0 0 8px' }, sys.ambulance));
    how.append(h('p', { style: 'margin:8px 0 4px' }, [h('strong', {}, '💳 Paying: ')]));
    how.append(h('p', { class: 'tiny', style: 'margin:0 0 8px' }, sys.payment));
    how.append(h('p', { style: 'margin:8px 0 4px' }, [h('strong', {}, '💊 Pharmacies: ')]));
    how.append(h('p', { class: 'tiny', style: 'margin:0' }, sys.pharmacy));
  }
  wrap.append(how);

  // ---- 5. Far from anywhere -----------------------------------------------
  const remote = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '5. If there is nothing near you'),
    infoTip('For the passes, the islands, the highlands and the long river stretches, where the journey to real care is measured in hours rather than minutes.'),
  ])]);
  remote.append(h('ul', { class: 'sos-aid' }, REMOTE_PLAN.map((li) => h('li', {}, li))));
  wrap.append(remote);

  // ---- 6. Getting out -----------------------------------------------------
  const evac = EVAC[active] || [];
  if (evac.length) {
    const ev = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
      h('h2', { style: 'margin:0' }, '6. If you have to be moved'),
      infoTip('Where a serious case actually goes when the local hospital cannot treat it. Your insurer arranges and pays for this — which is why the assistance line is worth calling early, before a decision has already been made for you.'),
    ])]);
    evac.forEach((e) => ev.append(h('div', { class: 'card', style: 'margin:6px 0' }, [
      h('div', {}, [h('strong', {}, e.from), ' → ', h('strong', {}, e.to)]),
      h('div', { class: 'tiny muted', style: 'margin-top:2px' }, e.how),
    ])));
    wrap.append(ev);
  }

  // ---- 7. The card someone else will read ---------------------------------
  const m = medCardData();
  const card = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '7. Your medical card'),
    infoTip('Stored on this device only. It is never uploaded, never included in a share link, and never sent to a translation service. Fill it in now — it exists to be read by a paramedic or a stranger holding your phone.'),
  ])]);
  MED_FIELDS.forEach((f) => card.append(field(f.label, h('input', {
    type: 'text', value: m[f.k] || '', placeholder: f.ph,
    oninput: (e) => { m[f.k] = e.target.value; save(); },
  }))));
  card.append(h('button', { class: 'btn block', style: 'margin-top:8px', onclick: showMedCard }, '🏥 Show it full screen'));
  wrap.append(card);

  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#sos-${active}`) }, '🆘 Back to emergency — numbers, first aid and phrases'));
  wrap.append(sourcesNote(MED_SOURCES, 'August 2026'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Hospital names, capabilities and opening arrangements change. Nothing here is medical advice or a diagnosis, and none of it replaces calling the emergency number. In a life-threatening emergency, call first and read second.'));
  mount(wrap, '#home');
}
