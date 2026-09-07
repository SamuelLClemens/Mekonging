// Settings — install prompt, journey phase, profile (name/currency/language/budget/
// interests/theme/motion/text size), who's-travelling (party/baby/accessibility/diet/trip
// length + linked family/baby/accessibility guides), live-translate endpoint, help &
// feedback, reminders, and your-data (backup/restore/reset). One screen because a traveller
// sets each of these once and rarely hunts for it again.
// Extracted from main.js (module split, task #211 slice 2 — the second of six screens
// identified as still inline, after familyScreen). The router is its only external caller,
// confirmed by a fresh grep rather than trusted from the prior scoping pass alone.
// Two small helpers moved with it because each has exactly one caller and that caller is
// settingsScreen itself: phaseSelector (the journey-phase segmented control) and the
// backup-file trio buildBackupBundle/restoreBackupFile/dataURLToBlob. dataURLToBlob's
// sibling, blobToDataURL, stays in main.js instead — the Export screen's own journal/
// review/photo-album exporters call it too, confirmed by grep rather than assumed from the
// two functions sitting next to each other in the original file.
// applyTheme, dietPicker, PHASE_ORDER and PHASES all stay in main.js for the same reason:
// each has a second caller outside Settings (dietPicker: welcomeScreen; PHASE_ORDER/PHASES:
// signatureSightsStrip; applyTheme: app boot plus the system dark-mode-change listener) —
// and are now exported from there for this file to reverse-import, the same pattern already
// used for go/mount/topbar/render/focusSpot/daysUntilISO/todayISO.
// The captured PWA install prompt (deferredInstallPrompt) is boot-time state written by two
// top-level main.js listeners. It is exposed here through a getter plus a clearer function
// rather than a raw reverse-imported binding — an ES module import binding cannot be
// reassigned from the importing side — the same getter/setter shape app-state.js already
// uses for activeCountry.
import { store, save, resetAll, exportData, importData, storageStatus, requestPersistence } from '../state.js';
import { h } from '../util.js';
import { field, selectEl, infoTip, confirmAction, netMode, setNetMode } from '../ui-widgets.js';
import {
  packState, packManifest, onPackChange, refreshPackStatus, deferPack, resumePack, clearPack,
} from '../offline-pack.js';
import { visitsEnabled, myVisits } from '../visits.js';
import { trailEnabled, setTrailEnabled, clearTrail, trailStats } from '../trail.js';
import { PRICE_TIER_LABEL } from '../render-utils.js';
import { LANGUAGES, INTERESTS } from '../data/regions.js';
import { getFamily } from '../data/family.js';
import { getAccessibility } from '../lazy-data.js';   // route-scoped: see js/lazy-data.js
import { getAllBlobs, putBlob } from '../idb.js';
import * as reminders from '../reminders.js';
import { CURRENCY_CODES, currencyFlag, currencySymbol } from '../currency.js';
import {
  go, mount, topbar, render, focusSpot, daysUntilISO, todayISO, applyTheme, dietPicker,
  PHASE_ORDER, PHASES, blobToDataURL, getDeferredInstallPrompt, clearDeferredInstallPrompt,
  QUICK_CHIPS, QUICK_CHIPS_DEFAULT, quickChipKeys,
} from '../main.js';

// `active` lets Home show an INFERRED stage as pressed without persisting it; falls back to
// the stored choice everywhere else. Tapping a button is what actually saves the phase.
// ---- How long this launch took ---------------------------------------------
// The one performance number this project has never had: what a launch costs on the device it
// is running on. Everything else has been inferred from source bytes on a desktop, and the
// priority order of the remaining performance work (splitting main.js, adding a webfont,
// converting the spacing system) depends entirely on whether a real mid-range Android launch is
// half a second or eight.
//
// Read from the marks main.js sets at boot, against the navigation start the browser records
// itself, so it measures the same thing here as scripts/cold-start.js measures in a browser
// session. Shown in Settings rather than hidden behind a debug flag because the person who
// needs it is holding the phone.
function launchTimeLine() {
  const p = h('p', { class: 'tiny muted pack-count' });
  try {
    const at = (name) => {
      const e = performance.getEntriesByName(name);
      return e.length ? Math.round(e[e.length - 1].startTime) : null;
    };
    const paint = performance.getEntriesByName('first-contentful-paint');
    const evald = at('mk-eval-done');
    const first = at('mk-first-render');
    const fcp = paint.length ? Math.round(paint[0].startTime) : null;
    const bits = [];
    if (evald != null) bits.push(`code ready ${evald} ms`);
    if (first != null) bits.push(`first screen ${first} ms`);
    if (fcp != null) bits.push(`painted ${fcp} ms`);
    // navigator.connection is Chromium-only, so this is often absent — worth printing when it
    // is there, because a launch time without the connection it happened on is half a number.
    const c = navigator.connection;
    if (c && c.effectiveType) bits.push(c.effectiveType);
    p.textContent = bits.length ? `⏱ This launch: ${bits.join(' · ')}` : '';
    if (!bits.length) p.hidden = true;
  } catch { p.hidden = true; }
  return p;
}

// ---- Offline data ----------------------------------------------------------
// The disclosure for a download that starts on its own (js/offline-pack.js). The app does not
// ask permission for the field guide, which makes showing what it did non-negotiable: how much
// is on the device, which tiers are complete, and the two controls — hold it back, or forget
// it. Also the one place the network switch is a labelled setting rather than an icon.
//
// Numbers come from the service worker counting its own cache, not from what the app believes
// it downloaded. Those disagree whenever the browser evicts a non-persistent cache, and only
// the first is worth showing anyone.
const TIER_LABEL = {
  safety: 'Dangerous species',
  guide: 'Wildlife, dishes, market produce & calls',
  places: 'Place photos',
};
function offlineDataCard() {
  const card = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, '📥 Offline field guide'),
      infoTip('Photos are the part of this app you are most likely to need with no signal — you identify a snake, a mushroom or a dish while standing in front of it. So the app downloads them by itself: the dangerous species first, on any connection, then the rest of the guide once you are on Wi-Fi. Nothing here is required; the app works either way.'),
    ]),
  ]);
  const line = h('p', { class: 'muted pack-state' }, 'Checking what is on this device…');
  const tiers = h('ul', { class: 'pack-tiers' });
  const btns = h('div', { class: 'pack-btns' });
  card.append(line, tiers, btns);

  let total = 0;
  packManifest().then((m) => { total = m.all.length; paint(); }).catch(() => {});

  const paint = () => {
    const s = packState();
    const mb = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(0)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
    if (s.running) {
      const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      line.textContent = `Downloading ${TIER_LABEL[s.tier] ? TIER_LABEL[s.tier].toLowerCase() : s.tier} — ${s.done} of ${s.total} (${pct}%).`;
    } else if (s.quotaHit) {
      line.textContent = `This device is out of storage, so the rest of the guide could not be saved. ${mb(s.storedBytes)} is already here and works offline.`;
    } else if (netMode() === 'offline') {
      line.textContent = `Data is switched off, so nothing is downloading. ${mb(s.storedBytes)} is already on this device.`;
    } else if (s.deferred) {
      line.textContent = `Waiting for Wi-Fi. ${mb(s.storedBytes)} is on this device — the dangerous-species photos are included.`;
    } else if (Object.keys(s.tiers).length >= 3) {
      line.textContent = `The whole field guide is on this device — ${mb(s.storedBytes)}, every photo and call. Nothing here needs a connection.`;
    } else if (s.kind === 'metered' || s.kind === 'slow') {
      line.textContent = `${mb(s.storedBytes)} on this device. The rest waits for Wi-Fi so it never runs up a data bill.`;
    } else {
      line.textContent = `${mb(s.storedBytes)} on this device.`;
    }

    tiers.innerHTML = '';
    ['safety', 'guide', 'places'].forEach((t) => {
      const done = !!s.tiers[t];
      tiers.append(h('li', { class: 'pack-tier' + (done ? ' is-done' : '') }, [
        h('span', { class: 'pt-ic', 'aria-hidden': 'true' }, done ? '✓' : (s.running && s.tier === t ? '↓' : '·')),
        h('span', {}, TIER_LABEL[t]),
      ]));
    });

    btns.innerHTML = '';
    if (netMode() === 'offline') {
      btns.append(h('button', { class: 'btn block', onclick: () => { setNetMode('online'); resumePack(); render(); } },
        '📶 Turn data on and finish the download'));
    } else if (s.deferred || s.quotaHit) {
      btns.append(h('button', { class: 'btn block', onclick: () => { resumePack(); paint(); } },
        '📥 Download the rest now'));
    } else if (s.running) {
      btns.append(h('button', { class: 'btn ghost block', onclick: () => { deferPack(); paint(); } },
        '⏸ Not now — wait for Wi-Fi'));
    }
    if (s.storedBytes > 0) {
      btns.append(h('button', {
        class: 'btn ghost block', onclick: async () => {
          const ok = await confirmAction({
            title: 'Forget the downloaded photos?',
            body: 'The photos and calls come back as you view them online, and the app will download them again on your next Wi-Fi connection. Your own data is not touched.',
            confirmLabel: 'Forget them',
            danger: true,
          });
          if (ok) { clearPack(); paint(); }
        },
      }, '🗑 Forget the downloaded photos'));
    }
    if (total && !s.running) {
      btns.append(h('p', { class: 'tiny muted pack-count' },
        `${total} photos and recordings in the full guide.`));
    }
  };
  card.append(launchTimeLine());
  paint();
  refreshPackStatus().catch(() => {});
  // The card is rebuilt on every Settings render, so the subscription has to be released with
  // it — otherwise each visit leaves another closure repainting a card that is off the DOM.
  const off = onPackChange(() => { if (card.isConnected) paint(); else off(); });
  return card;
}

function phaseSelector(active) {
  const cur = active || store.profile.prefs.phase || '';
  return h('div', { class: 'phase-seg', role: 'group', 'aria-label': 'Your journey phase' },
    PHASE_ORDER.map((k) => {
      const p = PHASES[k];
      return h('button', {
        class: 'phase-btn', 'aria-pressed': cur === k ? 'true' : 'false',
        onclick: () => { store.profile.prefs.phase = k; save(); render(); },
      }, [h('span', { class: 'phase-emoji' }, p.emoji), h('span', { class: 'phase-lbl' }, p.label)]);
    }));
}

function dataURLToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const mime = (dataUrl.slice(0, comma).match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(dataUrl.slice(comma + 1));
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Full on-device backup: the store JSON PLUS every photo blob (base64), so "everything" —
// journal, ratings, reviews, trip, calendar, saved places AND the pictures — travels in one
// file. It stays on the device; nothing is uploaded. Older plain-store backups still restore
// (detected by the absence of the bundle marker).
async function buildBackupBundle() {
  const bundle = { format: 'mekonging-backup', v: 1, store: JSON.parse(exportData()), photos: [] };
  const blobs = await getAllBlobs();
  for (const { key, blob } of blobs) {
    if (!blob) continue;
    try { bundle.photos.push({ key, data: await blobToDataURL(blob) }); } catch { /* skip a bad blob */ }
  }
  return bundle;
}
async function restoreBackupFile(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a valid backup.' }; }
  if (parsed && parsed.format === 'mekonging-backup' && parsed.store) {
    // Photos first, so restored entries that reference them render immediately.
    for (const ph of (parsed.photos || [])) {
      if (ph && ph.key && ph.data) { try { await putBlob(ph.key, dataURLToBlob(ph.data)); } catch { /* skip a bad blob */ } }
    }
    const res = importData(JSON.stringify(parsed.store));
    if (res.ok && res.counts) res.counts.photos = (parsed.photos || []).length;
    return res;
  }
  return importData(text); // legacy plain store-JSON backup (no photos bundled)
}

export function settingsScreen() {
  const p = store.profile;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Settings'));

  // Install (Add to Home Screen) — keep the offline companion one tap away. Android/Chrome
  // expose a captured prompt; iOS Safari needs the Share sheet; hidden once already installed.
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (!standalone) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
    const ic = h('div', { class: 'card' }, [h('h2', {}, '📲 Install the app')]);
    if (getDeferredInstallPrompt()) {
      ic.append(h('p', { class: 'muted', style: 'margin-top: 0' }, 'Keeps Mekonging offline and one tap away.'));
      ic.append(h('button', { class: 'btn', onclick: async () => {
        const dp = getDeferredInstallPrompt(); if (!dp) return;
        dp.prompt(); try { await dp.userChoice; } catch { /* dismissed */ }
        clearDeferredInstallPrompt(); render();
      } }, '➕ Install app'));
    } else if (isIOS) {
      ic.append(h('p', { class: 'muted', style: 'margin-top: 0' }, 'Tap Share in Safari → “Add to Home Screen”.'));
    } else {
      ic.append(h('p', { class: 'muted', style: 'margin-top: 0' }, 'Browser menu → “Install app” or “Add to Home Screen”.'));
    }
    wrap.append(ic);
  }

  // Journey phase — always switchable here, so Home never has to drag the traveller
  // back to the picker once they have chosen a stage.
  const phaseCard = h('div', { class: 'card' }, [
    h('h2', {}, 'Journey phase'),
    h('p', { class: 'muted', style: 'margin-top: 0' }, 'Reshapes Home for your stage.'),
    phaseSelector(),
  ]);
  // The "Just arrived" chip (Home, on the ground) is only ever hidden by an explicit,
  // confirmed X — never silently — so this is the one place it can be brought back.
  if (store.profile.prefs.justArrivedHidden) {
    phaseCard.append(h('button', {
      class: 'btn ghost block', style: 'margin-top: var(--sp-3)',
      onclick: () => { store.profile.prefs.justArrivedHidden = false; save(); render(); },
    }, '🛬 Show the “Just arrived” chip again'));
  }
  // Same "never gone for good" recovery for the other two dismissible Home chips.
  if (store.profile.prefs.tripStartedHidden) {
    phaseCard.append(h('button', {
      class: 'btn ghost block', style: 'margin-top: var(--sp-3)',
      onclick: () => { store.profile.prefs.tripStartedHidden = false; save(); render(); },
    }, '🎉 Show the “Trip started” chip again'));
  }
  if (store.profile.prefs.nextStopNudgeHidden) {
    phaseCard.append(h('button', {
      class: 'btn ghost block', style: 'margin-top: var(--sp-3)',
      onclick: () => { store.profile.prefs.nextStopNudgeHidden = false; save(); render(); },
    }, '🧭 Show the “Planning your next stop” chip again'));
  }
  wrap.append(phaseCard);

  // Home screen — which Quick access chips appear. Home ships with exactly four (Calendar,
  // Budget, Weather, Journal) and never adds more on its own; this is where a traveller who
  // wants the currency rate, their saved count or their travel circle on Home puts it there.
  // The list and the default both come from main.js (QUICK_CHIPS / quickChipKeys), so this
  // editor and the row it edits cannot drift apart.
  const qcCard = h('div', { class: 'card qc-card' }, [
    h('h2', {}, '🏠 Home screen'),
    h('p', { class: 'muted' }, 'Which shortcuts show in Quick access, each with its own live figure.'),
  ]);
  const qcList = h('div', { class: 'qc-choices' });
  // Both of these are held as direct node references and never re-found by querying through
  // qcCard. mount()'s automatic section folding re-parents a card's children into the fold it
  // builds, which leaves the original card element detached — so `qcCard.querySelector(...)`
  // returns null from any handler that runs after mount(), and the live element on screen goes
  // stale while the write throws. A node reference keeps working wherever the node ends up.
  const qcCount = h('p', { class: 'tiny muted qc-count' }, '');
  const drawQc = () => {
    qcList.replaceChildren();
    const chosen = quickChipKeys();
    QUICK_CHIPS.forEach((c) => {
      const on = chosen.includes(c.key);
      const box = h('input', { type: 'checkbox', checked: on ? '' : null, 'aria-label': c.label });
      box.addEventListener('change', () => {
        const now = quickChipKeys();
        const next = box.checked ? [...now, c.key] : now.filter((k) => k !== c.key);
        // Never allow the row to empty out entirely — unticking the last one would leave Home
        // with a Quick access section containing nothing. Keep the change, restore the default.
        store.profile.prefs.quickChips = next.length ? next : QUICK_CHIPS_DEFAULT.slice();
        save();
        drawQc();
      });
      qcList.append(h('label', { class: 'qc-choice' }, [box, h('span', {}, `${c.ic} ${c.label}`)]));
    });
    qcCount.textContent = `${chosen.length} showing${chosen.length > 4 ? ' — more than four makes the row longer than it is quick' : ''}`;
  };
  qcCard.append(qcList, qcCount);
  qcCard.append(h('button', {
    class: 'btn ghost block btn-spaced',
    onclick: () => { delete store.profile.prefs.quickChips; save(); drawQc(); render(); },
  }, '↺ Back to the default four'));
  drawQc();
  wrap.append(qcCard);

  const card = h('div', { class: 'card' });

  card.append(field('Your name (optional)', h('input', {
    type: 'text', value: p.name, oninput: (e) => { p.name = e.target.value; save(); },
  })));

  // The full shared currency list (same one the per-expense picker uses — see
  // ui-widgets.js's currencySelect) — this used to be a separate, shorter, hardcoded list
  // that omitted THB/VND/KHR/LAK/CNY/MYR entirely, so a traveller logging expenses in Thai
  // Baht (or any other Mekong-region currency) had no way to pick that same currency as the
  // one totals are shown in. Every mixed-currency expense/withdrawal is converted into
  // whatever is chosen here before being summed — nothing is dropped, just re-expressed in
  // one currency (see budgetSummaryCard's totalsCurrencyRow for the same control, live,
  // right next to the totals it drives).
  // The picker leads with flag + symbol, like every other currency control in the app, and
  // sets currencyManual so a later interface-language change cannot move it (see
  // applyLocaleDefaults in js/i18n.js — a language implies a currency only until you choose).
  card.append(field('Home currency', selectEl(
    CURRENCY_CODES.map((c) => [c, `${currencyFlag(c)} ${currencySymbol(c) || c} · ${c}`.trim()]),
    p.homeCurrency, (v) => { p.homeCurrency = v; p.currencyManual = true; save(); })));
  card.append(h('p', { class: 'muted tiny', style: 'margin:calc(var(--sp-1h) * -1) 0 var(--sp-3)' },
    'Used for every total and percentage across the app, however each expense was logged.'));

  card.append(field('Default phrasebook language',
    selectEl([['', 'Auto — match where I am']].concat(Object.values(LANGUAGES).map((b) => [b.lang, b.label])), p.defaultLang,
      (v) => { p.defaultLang = v; save(); })));

  card.append(field('Price', selectEl([['flexible', PRICE_TIER_LABEL.flexible], ['low', PRICE_TIER_LABEL.low], ['mid', PRICE_TIER_LABEL.mid], ['high', PRICE_TIER_LABEL.high]],
    p.prefs.budget, (v) => { p.prefs.budget = v; save(); })));

  // interests
  const selInterests = new Set(p.prefs.interests || []);
  const intChips = h('div', { class: 'chips' }, INTERESTS.map((it) =>
    h('button', { class: 'chip', 'aria-pressed': selInterests.has(it.id) ? 'true' : 'false',
      onclick: (e) => {
        if (selInterests.has(it.id)) selInterests.delete(it.id); else selInterests.add(it.id);
        p.prefs.interests = [...selInterests]; save();
        e.currentTarget.setAttribute('aria-pressed', selInterests.has(it.id) ? 'true' : 'false');
      } }, `${it.emoji} ${it.label}`)));
  card.append(field('Interests', intChips));

  // Theme picker grouped Day / Night. Two dark themes (Night Market, Psych Night) and
  // three day themes; Classic follows the day/night (or fixed) light-dark setting below.
  const curSkin = p.skin || 'classic';
  const opt = (v, l) => h('option', { value: v, selected: v === curSkin ? '' : null }, l);
  card.append(field('Theme', h('select', {
    onchange: (e) => { p.skin = e.target.value; save(); applyTheme(); },
  }, [
    opt('classic', 'Classic sunset (day / night)'),
    h('optgroup', { label: '☀︎ Day' }, [
      opt('silk', 'Silk Route'), opt('tropical', 'Tropical Pop'), opt('psych', 'Cambodian Psych ’60s–’70s'),
    ]),
    h('optgroup', { label: '☾ Night' }, [
      opt('night', 'Night Market'), opt('psychnight', 'Psych Night'), opt('expedition', 'Luxury Expedition'),
    ]),
  ])));

  card.append(field('Day / night (Classic only)', selectEl([['auto', 'Auto — match your device, else light by day'], ['light', 'Always light'], ['dark', 'Always dark']], p.theme || 'auto',
    (v) => { p.theme = v; save(); applyTheme(); })));

  card.append(field('Reduce motion', selectEl([['auto', 'Auto (system)'], ['on', 'On'], ['off', 'Off']], p.reducedMotion,
    (v) => { p.reducedMotion = v; save(); applyTheme(); })));

  card.append(field('Text size', selectEl([['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], p.textScale || 'm',
    (v) => { p.textScale = v; save(); applyTheme(); })));
  wrap.append(card);

  // Who's travelling — the party/baby/accessibility/trip-length preferences that shape
  // ranking and surface the right help. Kept here (not scattered) so a traveller sets
  // them once. These also drive "For you" and the baby / accessibility shortcuts.
  const who = h('div', { class: 'card' }, [
    h('h2', {}, 'Who’s travelling'),
    h('p', { class: 'muted', style: 'margin-top: 0' }, 'Tailors picks, plans and help to you.'),
  ]);
  who.append(field('Travelling as', selectEl([['', 'Not set'], ['solo', 'Solo'], ['couple', 'Couple'], ['family', 'Family'], ['group', 'Group']],
    p.prefs.party || '', (v) => { p.prefs.party = v; save(); })));
  who.append(field('Travelling with a baby or toddler', selectEl([['no', 'No'], ['yes', 'Yes — show nappies, formula & family help']],
    p.prefs.withBaby ? 'yes' : 'no', (v) => { p.prefs.withBaby = (v === 'yes'); save(); })));
  const selAcc = new Set(p.prefs.access || []);
  const accChips = h('div', { class: 'chips' }, [['mobility', '♿ Mobility'], ['vision', '👁 Vision'], ['hearing', '👂 Hearing']].map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': selAcc.has(id) ? 'true' : 'false',
      onclick: (e) => {
        if (selAcc.has(id)) selAcc.delete(id); else selAcc.add(id);
        p.prefs.access = [...selAcc]; save();
        e.currentTarget.setAttribute('aria-pressed', selAcc.has(id) ? 'true' : 'false');
      } }, lbl)));
  who.append(field('Accessibility needs', accChips));
  who.append(h('p', { class: 'muted', style: 'margin: var(--sp-4) 0 0' }, [
    'Allergies & dietary restrictions',
    infoTip('Highlights dishes that fit you in “Identify food”, and pins your exact phrases at the top of the phrasebook to show a cook.'),
  ]));
  who.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-0h) 0 0' }, 'Guidance only — always confirm in person.'));
  who.append(dietPicker());
  who.append(field('Trip length', selectEl([['', 'Not set'], ['short', 'Short (≤1 week)'], ['medium', '2–3 weeks'], ['long', '1 month+']],
    p.prefs.tripLength || '', (v) => { p.prefs.tripLength = v; save(); })));
  who.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'Budget and interests are set above.'));
  // The guides that go WITH this profile (family/kids, baby supplies, accessibility) live
  // right here in Settings too, resolved to where the traveller is focused — so "travelling
  // with baby and kids and all that" is set AND opened from one place.
  const whoCC = focusSpot().spot.country;
  const guideLinks = [];
  if ((p.prefs.party === 'family' || p.prefs.withBaby) && getFamily(whoCC))
    guideLinks.push(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#family-${whoCC}`) }, '👨‍👩‍👧 Travelling with kids — schools, childcare & things to do'));
  if (p.prefs.withBaby)
    guideLinks.push(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#baby-${whoCC}`) }, '🍼 Baby: nappies, formula & family help'));
  if ((p.prefs.access || []).length && getAccessibility(whoCC))
    guideLinks.push(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#access-${whoCC}`) }, '♿ Accessibility where you are'));
  if (guideLinks.length) { who.append(h('p', { class: 'muted', style: 'margin: var(--sp-3) 0 var(--sp-0h)' }, 'Guides for your situation')); guideLinks.forEach((b) => who.append(b)); }
  wrap.append(who);

  // live translate
  const tcard = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Live translate'),
      infoTip('Translation already works with no setup, using a free online service on the Talk screen — the phrasebook itself works fully offline regardless. Your own endpoint and key stay on this device, but the server origin must also be added to index.html’s Content-Security-Policy (connect-src).'),
    ]),
    h('p', { class: 'muted' }, 'Optional — your own server, for volume or privacy.'),
  ]);
  tcard.append(field('Translate endpoint URL', h('input', {
    type: 'url', placeholder: 'https://your-endpoint/translate', value: p.translateEndpoint,
    oninput: (e) => { p.translateEndpoint = e.target.value.trim(); save(); },
  })));
  tcard.append(field('API key (optional)', h('input', {
    type: 'password', value: p.translateKey, oninput: (e) => { p.translateKey = e.target.value.trim(); save(); },
  })));
  wrap.append(tcard);

  // help & feedback
  wrap.append(h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Help & feedback'),
      infoTip('Leave this blank and the feedback screen uses your device share sheet or clipboard instead.'),
    ]),
    h('button', { class: 'btn ghost block', onclick: () => go('#help') }, '❓ Help & FAQ'),
    field('Feedback address (optional)', h('input', {
      type: 'email', placeholder: 'where “Email feedback” is sent', value: p.feedbackTo || '',
      oninput: (e) => { p.feedbackTo = e.target.value.trim(); save(); },
    })),
    h('p', { class: 'disclaimer' }, 'Stays on this device — never committed to the app.'),
  ]));

  // Where people are using this from. Sits here rather than under "Your data" because the
  // interesting half is the map, not the storage — but the privacy shape of it is stated on
  // the chip's own screen, and the recording is off until switched on there.
  wrap.append(h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Where people are'),
      infoTip('A world map with a pin on every place the app has been opened from. Your own pins stay on this device and are rounded to about 55 km, so no pin can place anyone. There is no shared feed unless you add one.'),
    ]),
    h('div', { class: 'chips' }, [
      h('button', { class: 'chip', onclick: () => go('#visitors') }, '🌍 Open the world map'),
    ]),
    visitsEnabled()
      ? h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, `Recording your pins — ${myVisits().length} ${myVisits().length === 1 ? 'place' : 'places'} so far.`)
      : h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'Not recording anything yet. Switch it on from the map.'),
  ]));

  // Your journey map. A SEPARATE control from "Where people are" above, and the difference
  // is the whole point: that one feeds a shared map, is rounded to ~55 km and is off until
  // switched on; this one is the traveller's own record, kept at real precision, never
  // transmitted, and on by default so a map of their trip exists without them opting into
  // anything. Which means the off switch has to be easy to find — hence its own card, said
  // plainly, next to the erase button.
  const ts = trailStats();
  wrap.append(h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Your journey map'),
      infoTip('Pins are recorded automatically whenever the app has your location, so a map of your trip builds itself. They stay on this device at all times — there is no code path that sends them anywhere — and you can stop or erase them here.'),
    ]),
    h('p', { class: 'tiny muted', style: 'margin: var(--sp-1h) 0 var(--sp-2)' }, trailEnabled()
      ? (ts.places
        ? `Recording — ${ts.places} ${ts.places === 1 ? 'place' : 'places'} so far, ${ts.countries || 1} ${ts.countries === 1 ? 'country' : 'countries'}.`
        : 'Recording. Your map fills in once your device gives the app a location.')
      : 'Stopped. Nothing new is being recorded.'),
    h('div', { class: 'chips' }, [
      h('button', { class: 'chip', onclick: () => go('#journey') }, '🗺 Open my journey map'),
      h('button', { class: 'chip', onclick: () => { setTrailEnabled(!trailEnabled()); render(); } },
        trailEnabled() ? '⏸ Stop recording' : '▶️ Start recording'),
      ts.places ? h('button', { class: 'chip', onclick: () => {
        confirmAction({ title: 'Erase your journey pins?', body: `This removes all ${ts.places} recorded ${ts.places === 1 ? 'pin' : 'pins'} from this device. Your journal, photos and saved places are not touched.`, confirmLabel: 'Erase pins', danger: true })
          .then((ok) => { if (ok) { clearTrail(); render(); } });
      } }, '🗑 Erase pins') : null,
    ]),
  ]));

  // Reminders — server-free: per-entry lead time on the calendar + an optional daily
  // journal nudge. Always in-app on Home; device notifications are opt-in + best-effort.
  const rset = reminders.settings();
  const remCard = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Reminders'),
      infoTip('Set a reminder on any calendar entry, with its own lead time — it always appears on the “Coming up” card on Home too. Allow notifications for a device alert while the app is open or when you next open it.'),
    ]),
    h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, 'No background alerts once fully closed — there is no server.'),
  ]);
  remCard.append(h('button', { class: 'btn ghost block',
    onclick: async () => { const ok = await reminders.requestNotify(); reminders.tick(); alert(ok ? 'Device notifications are on.' : 'Notifications are off — you can enable them for this site in your browser settings.'); render(); } },
    (reminders.notifyGranted() && rset.notify) ? '🔔 Device notifications: on' : '🔔 Allow device notifications'));
  remCard.append(field('Default reminder for new entries', selectEl(reminders.LEADS.map((l) => [String(l[0]), l[1]]), String(rset.defaultLead), (v) => { reminders.setDefaultLead(v); })));
  remCard.append(h('button', { class: 'btn ghost block btn-spaced', 'aria-pressed': rset.journalDaily ? 'true' : 'false',
    onclick: () => { reminders.setJournalDaily(!reminders.settings().journalDaily); reminders.tick(); render(); } },
    rset.journalDaily ? '📔 Daily journal reminder: on' : '📔 Remind me to journal each day'));
  if (rset.journalDaily) remCard.append(field('Journal reminder time', h('input', { type: 'time', value: rset.journalTime, onchange: (e) => { reminders.setJournalTime(e.target.value); reminders.tick(); } })));
  wrap.append(remCard);

  wrap.append(offlineDataCard());

  // Your data — protected across updates, and yours to back up / move between devices.
  const dataCard = h('div', { class: 'card' }, [
    h('div', { class: 'row-between' }, [
      h('h2', {}, 'Your data'),
      infoTip('Everything you create — journal, photos, ratings, trip, budget, calendar, saved places and collections — is written to three places on this device after every change, so a single glitch can never wipe it.'),
    ]),
    h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, 'Kept safe across updates. Nothing is ever uploaded — download a copy below.'),
  ]);
  // On-device durability status — filled in asynchronously (persisted flag + space used).
  const statusP = h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, 'Checking on-device storage…');
  dataCard.append(statusP);
  // A gentle reminder to keep an off-device copy when none exists or it has gone stale.
  const anyData = (store.journal.entries.length || store.trip.budgetLog.length || store.calendar.items.length
    || (store.pins || []).length || Object.keys(store.placeData || {}).length);
  const lastBak = store.profile.prefs.lastBackupAt || '';
  const staleBak = anyData && (!lastBak || daysUntilISO(lastBak) <= -14);
  if (staleBak) {
    dataCard.append(h('p', { class: 'nudge-line', style: 'margin: 0 0 var(--sp-2)' },
      lastBak ? '⏳ It has been a while since you saved a copy — a fresh one keeps your latest entries safe.'
        : '⭐ Save your first copy now so nothing can ever be lost.'));
  }
  // The readable, shareable deliverable comes first — this is what most people want when
  // they "download their trip". The raw JSON below it is a technical restore file, relabelled
  // so no one mistakes it for something to read.
  dataCard.append(h('button', { class: 'btn block', style: 'margin-bottom: var(--sp-1h)', onclick: () => go('#export') },
    '📖 Save or share my trip — readable book, photos & spreadsheet'));
  dataCard.append(h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-3)' },
    'Your journal, reviews, photos and spending as files you can open, read and share on any device — beautifully laid out, not raw data.'));
  const dlBtn = h('button', { class: 'btn ' + (staleBak ? 'block' : 'ghost block') }, '💾 Download a safety copy (to move to a new device)');
  dlBtn.onclick = async () => {
    dlBtn.disabled = true; const label = dlBtn.textContent; dlBtn.textContent = 'Preparing backup…';
    try {
      const bundle = await buildBackupBundle();
      const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const a = document.createElement('a'); a.href = url; a.download = `mekonging-backup-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      store.profile.prefs.dataBackupDone = true;
      store.profile.prefs.lastBackupAt = todayISO(); save();
    } catch { alert('Could not create the backup file on this device.'); }
    dlBtn.disabled = false; dlBtn.textContent = label;
  };
  dataCard.append(dlBtn);
  dataCard.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1) 0 0' },
    'A complete data file for restoring everything onto a new phone. It is not meant to be read — for something nice to look at, use the travel book above.'));
  // "Extra protection" — the app's own safety (a triple on-device write + IndexedDB mirror)
  // is ALWAYS active, so this control never reports a failure or a browser limitation. It
  // additionally asks the browser to mark storage evict-resistant; whether or not the browser
  // grants that flag, the result is framed positively and truthfully — and always points the
  // traveller to the one guaranteed safeguard: a downloaded copy.
  const persistBtn = h('button', { class: 'btn ghost block btn-spaced', style: 'display:none' }, '🔒 Turn on maximum protection');
  const protectMsg = h('p', { class: 'tiny', style: 'margin: var(--sp-1h) 0 0; display:none' });
  persistBtn.onclick = async () => {
    persistBtn.disabled = true; const lbl = persistBtn.textContent; persistBtn.textContent = 'Turning on…';
    let granted = false;
    try { granted = await requestPersistence(); } catch { granted = false; }
    store.profile.prefs.protectionOn = true; save();
    persistBtn.style.display = 'none';
    protectMsg.style.display = '';
    protectMsg.style.color = 'var(--green, #4a7a5a)';
    protectMsg.textContent = granted
      ? '✅ Maximum protection is on. Your data is saved in three places on this device, and your browser has locked it against low-storage cleanups. For a copy you keep forever, download a backup above.'
      : '✅ Protection is on. Your data is saved in three separate places on this device after every change, so nothing here is lost to an app update or a glitch. The one thing no app can survive is losing the device itself — so download a backup above to keep a copy that is truly yours.';
  };
  dataCard.append(persistBtn, protectMsg);
  storageStatus().then((st) => {
    const bits = [];
    // Always lead with what is guaranteed (the app's own triple write), never with a browser
    // shortcoming — so no traveller is ever told "your browser does not offer this".
    if (st.persisted === true) bits.push('🔒 Fully protected — saved in three places on this device and locked against low-storage cleanups.');
    else { bits.push('🛡️ Protected — your data is saved in three separate places on this device after every change.'); if (!store.profile.prefs.protectionOn) persistBtn.style.display = ''; }
    if (st.usageMB != null) bits.push(`Using about ${st.usageMB < 1 ? 'under 1' : Math.round(st.usageMB)} MB.`);
    bits.push(store.profile.prefs.lastBackupAt ? `Last copy saved ${store.profile.prefs.lastBackupAt}.` : 'No off-device copy saved yet.');
    statusP.textContent = bits.join(' ');
  }).catch(() => { statusP.textContent = '🛡️ Protected — your data is saved in three separate places on this device.'; });
  const restoreInput = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', 'aria-label': 'Choose a backup file to restore',
    onchange: (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        if (!(await confirmAction({ title: 'Restore this backup?', body: 'It replaces the journal, photos, budget and other data currently on this device.', confirmLabel: 'Restore', danger: true }))) { e.target.value = ''; return; }
        const res = await restoreBackupFile(String(reader.result || ''));
        if (res.ok) {
          applyTheme();
          const c = res.counts || {};
          alert(`Restored ${c.journal || 0} journal, ${c.budget || 0} budget, ${c.calendar || 0} calendar entries${c.photos ? ` and ${c.photos} photos` : ''}.`);
          go('#home');
        } else alert(res.error || 'Could not restore that file.');
        e.target.value = '';
      };
      reader.readAsText(file);
    } });
  dataCard.append(restoreInput);
  dataCard.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => restoreInput.click() }, '⬆️ Restore from a backup file'));
  wrap.append(dataCard);

  // reset
  wrap.append(h('div', { class: 'card' }, [
    h('button', { class: 'btn ghost block', onclick: () => {
      confirmAction({ title: 'Reset everything on this device?', body: 'This erases your journal, budget and saved places and cannot be undone. Consider downloading a backup first.', confirmLabel: 'Reset everything', danger: true }).then((ok) => { if (ok) { resetAll(); applyTheme(); go('#home'); } });
    } }, 'Reset everything'),
    h('p', { class: 'disclaimer' }, 'Your data is kept safe across app updates — an update never erases your journal, budget or saved places. This button is the only in-app way to wipe them, and clearing your browser storage would also remove them.'),
  ]));
  mount(wrap, '#settings');
}
