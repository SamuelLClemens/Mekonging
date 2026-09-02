// Journal — the antique-book travel diary (cover/table-of-contents/entry pages), the
// post-travel scrapbook (auto-assembled keepsake: journal + photos + loved places +
// itinerary + budget), and the journey map (the Indiana-Jones dotted-line route between
// stamped entry locations). One file because the scrapbook and journey map are both just
// VIEWS over the same journal entries the diary writes, not separate data.
// Extracted from main.js (module split, task #211 slice 4 — the fourth of six screens
// identified as still inline, after familyScreen/settingsScreen/calendarScreen). The
// router is journalDispatch's only external caller, confirmed by a fresh grep rather than
// trusted from the prior scoping pass alone; scrapbookScreen and journeyScreen are router
// entry points too (#scrapbook, #journey).
// entryPhotoKeys stays in main.js instead of moving here, despite being called constantly
// throughout this file: its definition sits ~200 lines away from here in the original
// file, inside main.js's own separate "Export the traveller's own contributions" cluster
// (exportJournalHtml and a second full-trip exporter both call it) — two callers outside
// this file's scope, caught by grepping every call site rather than assuming from how
// often THIS file calls it. It is now exported for this file to reverse-import.
// journalFormScreen carries this project's real live-resource risk for this slice:
// getUserMedia+MediaRecorder (voice note), continuous SpeechRecognition (live
// transcription), a raw geolocation.getCurrentPosition call (location stamping — separate
// from and not routed through refreshLocation(), since stamping a journal entry is a
// point-in-time record, not a "where am I now" signal that should move activeCountry), and
// object-URL create/revoke for both photos and audio, all torn down through one
// setLiveCleanup() call. Moved verbatim, unchanged: the same setLiveCleanup() shape that
// already worked correctly in main.js keeps working identically here, since its behaviour
// is entirely defined by app-state.js, not by which file calls it.
import {
  store, journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry,
  getAlbum, addAlbumPhoto, deleteAlbumPhoto, updateAlbumPhoto, getPin, getLastFix,
} from '../state.js';
import { getActiveCountry, setLiveCleanup } from '../app-state.js';
import { h } from '../util.js';
import { fmtTemp } from '../render-utils.js';
import { field, confirmAction } from '../ui-widgets.js';
import { getCountry, getPlace } from '../data/regions.js';
import { getCachedWeather, spotKey, wmo } from '../weather.js';
import { getBlob, putBlob, delBlob } from '../idb.js';
import { trailPoints, trailStats, trailEnabled, setTrailEnabled, clearTrail } from '../trail.js';
import { journeyMapParts } from '../journey-share.js';
import { myVisits } from '../visits.js';
import { WEATHER_SPOTS } from '../weather.js';
import { dateLocale } from '../i18n.js';
import {
  go, mount, topbar, render, focusSpot, chipIcon, setBlobThumb, nearestSpotGlobal,
  entryPhotoKeys,
} from '../main.js';

export function journalDispatch(arg) {
  if (!arg) return journalCover();
  if (arg === 'open') return journalTOC();
  if (arg === 'add') return journalFormScreen();
  if (arg.startsWith('edit-')) return journalFormScreen(arg.slice(5));
  if (arg.startsWith('entry-')) return journalEntryScreen(arg.slice(6));
  return journalCover();
}

function regionTitle() {
  const c = getCountry(getActiveCountry());
  return c ? c.name : 'Southeast Asia';
}

function journalCover() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s journal` : 'Your journal', '#me'));
  const n = journalEntries().length;
  const book = h('button', { class: 'book closed', 'aria-label': 'Open journal', onclick: () => go('#journal-open') }, [
    h('div', { class: 'book-spine' }),
    h('div', { class: 'book-cover' }, [
      h('div', { class: 'book-emboss' }, 'ADVENTURES IN'),
      h('div', { class: 'book-title' }, regionTitle()),
      h('div', { class: 'book-flour' }, '✦ ❧ ✦'),
      h('div', { class: 'book-count' }, n ? `${n} ${n === 1 ? 'entry' : 'entries'}` : 'open me'),
    ]),
  ]);
  wrap.append(book);
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:16px', onclick: () => go('#journal-add') }, '✒ New entry'));
  mount(wrap, '#home');
}

function journalTOC() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s adventures` : 'Your adventures', '#journal'));
  const entries = journalEntries();
  const spread = h('div', { class: 'book-open page-enter' }, [
    h('div', { class: 'page page-left' }, [
      h('div', { class: 'page-head' }, 'Adventures in'),
      h('div', { class: 'page-title' }, regionTitle()),
      h('div', { class: 'book-flour' }, '✦ ❧ ✦'),
      h('p', { class: 'muted' }, `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`),
    ]),
    h('div', { class: 'page page-right' }, [
      h('div', { class: 'page-head' }, 'Contents'),
      entries.length
        ? h('ol', { class: 'toc' }, entries.map((e) => h('li', {}, [
            h('button', { class: 'toc-link', onclick: () => go(`#journal-entry-${e.id}`) },
              [h('span', { class: 'toc-date' }, e.date), ' ', e.title]),
          ])))
        : h('p', { class: 'muted' }, 'Your story starts here. Add your first entry.'),
    ]),
  ]);
  wrap.append(spread);
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:16px' }, [
    h('button', { class: 'btn', onclick: () => go('#journal-add') }, '✒ New entry'),
    h('button', { class: 'btn ghost', onclick: () => go('#journey') }, '🗺 Journey map'),
  ]));
  mount(wrap, '#home');
}

function journalEntryScreen(id) {
  const entries = journalEntries();
  const idx = entries.findIndex((e) => e.id === id);
  const e = entries[idx];
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Journal', '#journal-open'));
  if (!e) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }
  const when = new Date(e.ts);
  const stamp = `${when.toLocaleDateString(dateLocale(), { year: 'numeric', month: 'long', day: 'numeric' })} · ${when.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })}`;
  const loc = e.place || (e.coords ? `${e.coords.lat.toFixed(3)}, ${e.coords.lng.toFixed(3)}` : '');
  const page = h('div', { class: 'page page-single page-enter' }, [
    h('div', { class: 'stamp' }, [h('span', {}, stamp), loc ? h('span', { class: 'stamp-loc' }, `📍 ${loc}`) : null, e.weather ? h('span', { class: 'stamp-loc' }, e.weather) : null]),
    h('h2', { class: 'entry-title' }, e.title),
    h('div', { class: 'entry-body' }, (e.text || '').split('\n').map((p) => h('p', {}, p))),
  ]);
  // All photos on this entry, newest additions after older, just below the stamp.
  entryPhotoKeys(e).forEach((k, i) => {
    const img = h('img', { class: 'entry-photo', alt: 'Journal photo' });
    page.insertBefore(img, page.children[1 + i]);
    setBlobThumb(img, k);
  });
  if (e.audioKey) {
    const au = h('audio', { class: 'entry-audio', controls: '' });
    getBlob(e.audioKey).then((b) => { if (b) au.src = URL.createObjectURL(b); }).catch(() => { /* recording missing */ });
    page.append(h('div', { class: 'entry-audio-wrap' }, [h('div', { class: 'muted tiny', style: 'margin:8px 0 2px' }, '🎙 Your recording'), au]));
  }
  wrap.append(page);
  wrap.append(h('button', { class: 'btn block', style: 'margin-top:14px', onclick: () => go(`#journal-edit-${e.id}`) }, '✎ Edit this entry'));
  wrap.append(h('div', { class: 'row-between', style: 'margin-top:10px' }, [
    h('button', { class: 'btn ghost', disabled: idx <= 0 ? '' : null, onclick: () => idx > 0 && go(`#journal-entry-${entries[idx - 1].id}`) }, '‹ Prev'),
    h('button', { class: 'btn ghost', onclick: () => { confirmAction({ title: 'Delete this entry?', body: 'This removes the journal entry and its photos from this device.', confirmLabel: 'Delete', danger: true }).then((ok) => { if (ok) { entryPhotoKeys(e).forEach((k) => delBlob(k)); if (e.audioKey) delBlob(e.audioKey); deleteJournalEntry(e.id); go('#journal-open'); } }); } }, 'Delete'),
    h('button', { class: 'btn ghost', disabled: idx >= entries.length - 1 ? '' : null, onclick: () => idx < entries.length - 1 && go(`#journal-entry-${entries[idx + 1].id}`) }, 'Next ›'),
  ]));
  mount(wrap, '#home');
}

// ---- POST-TRAVEL SCRAPBOOK --------------------------------------------------
// A keepsake assembled automatically from what the traveller recorded on the road:
// journal entries + photos, places they rated highly, the itinerary and the budget.
// Nothing new is stored — it is a printable/shareable VIEW over the existing data,
// which is exactly the "documentation carries over to post-travel" the trip needs.
function sbFmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(dateLocale(), { year: 'numeric', month: 'short', day: 'numeric' });
}
function sbDateRange(a, b) {
  if (!a && !b) return '';
  if (a && b && a !== b) return `${sbFmtDate(a)} – ${sbFmtDate(b)}`;
  return sbFmtDate(a || b);
}
function sbStatPill(n, label) {
  return h('span', { class: 'scrap-stat' }, [h('b', {}, String(n)), ` ${label}`]);
}
function scrapbookText(entries, loved, stops, budget, range) {
  const L = [];
  L.push(`${store.profile.name ? store.profile.name + '’s' : 'My'} journey${range ? ' · ' + range : ''}`);
  if (stops.length) L.push('\nWhere I went: ' + stops.map((s) => s.city).filter(Boolean).join(', '));
  if (loved.length) L.push('\nPlaces I loved:\n' + loved.slice(0, 20).map(({ p, d }) => `  • ${p.name} ${'★'.repeat(Math.round(d.rating || 0))}`).join('\n'));
  if (entries.length) L.push('\nJournal:\n' + entries.map((e) => `  ${sbFmtDate(e.date || String(e.ts || '').slice(0, 10))} — ${e.title || 'Untitled'}`).join('\n'));
  if (budget.length) {
    const t = {}; budget.forEach((b) => { const c = b.currency || '?'; t[c] = (t[c] || 0) + (parseFloat(b.amount) || 0); });
    L.push('\nSpent: ' + Object.entries(t).map(([c, v]) => `${Math.round(v).toLocaleString()} ${c}`).join(', '));
  }
  L.push('\n— made with Mekonging (www.mekonging.com)');
  return L.join('\n');
}

// The scrapbook's photo album: the pictures the user adds directly + every journal photo,
// in one editable gallery. Album photos are tappable to caption or remove; journal photos
// open their entry. Blobs live in IndexedDB; metadata + captions in the store (backup-safe).
function scrapAlbumSection() {
  const album = getAlbum();
  const journalPhotos = [];
  (store.journal.entries || []).forEach((e) => entryPhotoKeys(e).forEach((k) => journalPhotos.push({ key: k, entry: e })));
  const placePhotos = [];
  Object.keys(store.placeData || {}).forEach((id) => (store.placeData[id].photos || []).forEach((k) => placePhotos.push({ key: k, placeId: id })));
  const card = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '📸 Photo album')]);
  const inp = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none', onchange: async (ev) => {
    const files = ev.target.files ? [...ev.target.files] : [];
    let n = 0;
    for (const f of files) { const nk = `album-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`; try { await putBlob(nk, f); addAlbumPhoto({ key: nk }); } catch { /* skip */ } }
    ev.target.value = ''; render();
  } });
  card.append(h('div', { class: 'chips' }, [h('button', { class: 'chip', onclick: () => inp.click() }, '＋ Add pictures to album'), inp]));
  if (!album.length && !journalPhotos.length && !placePhotos.length) {
    card.append(h('p', { class: 'muted', style: 'margin:6px 0 0' }, 'Add pictures here, or add photos to your journal entries and the places you rate — they all gather in this album.'));
    return card;
  }
  const grid = h('div', { class: 'photo-gallery' });
  // Album photos first (most recent first), each editable.
  album.slice().reverse().forEach((ph) => {
    const img = h('img', { alt: ph.caption || '', loading: 'lazy' });
    setBlobThumb(img, ph.key);
    grid.append(h('button', { class: 'gallery-cell', onclick: () => {
      const cap = prompt('Caption for this photo (leave blank to keep). Type DELETE to remove it.', ph.caption || '');
      if (cap === null) return;
      if (cap.trim().toUpperCase() === 'DELETE') { delBlob(ph.key); deleteAlbumPhoto(ph.id); render(); return; }
      updateAlbumPhoto(ph.id, { caption: cap }); render();
    } }, [img, ph.caption ? h('span', { class: 'gallery-cap' }, ph.caption) : null]));
  });
  // Journal photos (most recent first) — tap opens the entry.
  journalPhotos.slice().reverse().forEach((jp) => {
    const img = h('img', { alt: '', loading: 'lazy' });
    setBlobThumb(img, jp.key);
    grid.append(h('button', { class: 'gallery-cell', onclick: () => go(`#journal-entry-${jp.entry.id}`) }, [img, h('span', { class: 'gallery-cap' }, `📔 ${jp.entry.title || 'Journal'}`)]));
  });
  // Place photos (most recent first) — tap opens the place they belong to.
  placePhotos.slice().reverse().forEach((pp) => {
    const img = h('img', { alt: '', loading: 'lazy' });
    setBlobThumb(img, pp.key);
    const pl = getPlace(pp.placeId) || getPin(pp.placeId);
    grid.append(h('button', { class: 'gallery-cell', onclick: () => go(`#place-${pp.placeId}`) }, [img, h('span', { class: 'gallery-cap' }, `📍 ${pl ? pl.name : 'Place'}`)]));
  });
  card.append(grid);
  return card;
}

export function scrapbookScreen() {
  const wrap = h('div', { class: 'screen scrapbook' });
  wrap.append(topbar('Trip scrapbook', '#me'));

  const entries = (store.journal.entries || []).slice()
    .sort((a, b) => String(a.ts || a.date || '').localeCompare(String(b.ts || b.date || '')));
  const stops = store.trip.stops || [];
  const budget = store.trip.budgetLog || [];
  const loved = Object.entries(store.placeData || {})
    .filter(([, d]) => d && d.rating >= 4)
    .map(([id, d]) => ({ p: getPlace(id) || getPin(id), d }))
    .filter((x) => x.p);

  if (!entries.length && !stops.length && !budget.length && !loved.length && !getAlbum().length) {
    wrap.append(h('div', { class: 'card empty-state' }, [
      h('h2', { style: 'margin-top:0' }, 'Your scrapbook builds itself'),
      h('p', { class: 'muted' }, 'It is a photo album of your trip — the pictures you add here plus every photo in your journal — alongside the places you rate, your itinerary and budget. Add pictures below, or start a journal entry.'),
      h('div', { class: 'chips' }, [
        h('button', { class: 'chip', onclick: () => go('#journal-add') }, [chipIcon('book'), 'Write a journal entry']),
        h('button', { class: 'chip', onclick: () => go('#trip') }, [chipIcon('suitcase'), 'Plan your trip']),
      ]),
    ]));
    wrap.append(scrapAlbumSection()); // still let them add pictures straight away
    mount(wrap, '#home'); return;
  }

  const allDates = entries.map((e) => e.date || String(e.ts || '').slice(0, 10)).filter(Boolean)
    .concat(stops.flatMap((s) => [s.date, s.endDate]).filter(Boolean)).sort();
  const range = allDates.length ? sbDateRange(allDates[0], allDates[allDates.length - 1]) : '';

  wrap.append(h('div', { class: 'card scrap-cover' }, [
    h('h2', { style: 'margin:0' }, store.profile.name ? `${store.profile.name}’s journey` : 'My journey'),
    range ? h('p', { class: 'muted', style: 'margin:4px 0 8px' }, range) : null,
    h('div', { class: 'scrap-stats' }, [
      sbStatPill(entries.length, entries.length === 1 ? 'journal entry' : 'journal entries'),
      sbStatPill(loved.length, 'places loved'),
      sbStatPill(stops.length, stops.length === 1 ? 'stop' : 'stops'),
    ]),
  ]));

  const copyBtn = h('button', { class: 'chip', onclick: async () => {
    try { await navigator.clipboard.writeText(scrapbookText(entries, loved, stops, budget, range)); copyBtn.replaceChildren(document.createTextNode('✓ Copied')); }
    catch { copyBtn.replaceChildren(document.createTextNode('Copy failed')); }
    setTimeout(() => copyBtn.replaceChildren(chipIcon('users'), document.createTextNode('Copy summary')), 1600);
  } }, [chipIcon('users'), 'Copy summary']);
  wrap.append(h('div', { class: 'chips scrap-actions' }, [
    h('button', { class: 'chip', onclick: () => window.print() }, [chipIcon('book'), 'Print / Save as PDF']),
    copyBtn,
  ]));

  // The album — the pictures the user adds here + every journal photo, in one gallery.
  wrap.append(scrapAlbumSection());

  if (stops.length) {
    const s = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '🧳 Where you went')]);
    stops.forEach((st) => s.append(h('div', { class: 'scrap-row' }, [
      h('strong', {}, st.title || 'Stop'),
      h('span', { class: 'muted' }, [st.country ? (getCountry(st.country) || {}).name : '', sbDateRange(st.date, st.endDate)].filter(Boolean).join(' · ')),
    ])));
    wrap.append(s);
  }

  if (entries.length) {
    wrap.append(h('h3', { class: 'scrap-section' }, '📖 Your journal'));
    entries.forEach((e) => {
      const card = h('div', { class: 'card scrap-entry' }, [
        h('div', { class: 'scrap-date' }, [sbFmtDate(e.date || String(e.ts || '').slice(0, 10)), e.place ? '📍 ' + e.place : ''].filter(Boolean).join(' · ')),
        h('h3', { style: 'margin:2px 0' }, e.title || 'Untitled'),
        e.text ? h('div', { class: 'scrap-text' }, (e.text || '').split('\n').map((p) => h('p', {}, p))) : null,
      ]);
      entryPhotoKeys(e).forEach((k, i) => {
        const img = h('img', { class: 'scrap-photo', alt: 'Journal photo', loading: 'lazy' });
        card.insertBefore(img, card.children[1 + i]);
        setBlobThumb(img, k);
      });
      wrap.append(card);
    });
  }

  if (loved.length) {
    loved.sort((a, b) => (b.d.rating || 0) - (a.d.rating || 0));
    const pv = h('div', { class: 'card' }, [h('h3', { class: 'scrap-h' }, '⭐ Places you loved')]);
    loved.slice(0, 30).forEach(({ p, d }) => pv.append(h('button', { class: 'scrap-row scrap-link', onclick: () => go(`#place-${p.id}`) }, [
      h('strong', {}, p.name),
      h('span', { class: 'muted' }, `${'★'.repeat(Math.round(d.rating))}${d.review ? ' · “' + d.review.slice(0, 60) + '”' : ''}`),
    ])));
    wrap.append(pv);
  }

  if (budget.length) {
    const t = {}; budget.forEach((b) => { const c = b.currency || '?'; t[c] = (t[c] || 0) + (parseFloat(b.amount) || 0); });
    wrap.append(h('div', { class: 'card' }, [
      h('h3', { class: 'scrap-h' }, '💰 What you spent'),
      ...Object.entries(t).map(([c, v]) => h('div', { class: 'scrap-row' }, [h('strong', {}, c), h('span', {}, Math.round(v).toLocaleString())])),
    ]));
  }

  wrap.append(h('p', { class: 'disclaimer' }, 'Built from your journal, ratings, trip and budget — all stored on this device. Print to keep or save as PDF; nothing is uploaded.'));
  mount(wrap, '#home');
}

// New OR edit an entry. editId set => editing an existing entry (prefilled, saved back).
// A short weather snapshot string from the cached forecast nearest to `coords` (or the
// user's focus), stamped onto a journal entry at write time. Empty if nothing is cached
// (offline with no prior refresh) — the entry still saves.
function journalWeatherString(coords) {
  try {
    const fix = coords || getLastFix();
    const near = fix ? nearestSpotGlobal(fix) : null;
    const spot = near ? near.spot : focusSpot().spot;
    if (!spot) return '';
    const rec = getCachedWeather(spotKey(spot));
    if (!rec) return '';
    const cur = rec.current || {};
    const today = (rec.daily && rec.daily[0]) || {};
    const code = cur.code != null ? cur.code : today.code;
    const [lbl, emo] = wmo(code != null ? code : 0);
    const t = cur.temp != null ? cur.temp : today.tmax;
    const hum = cur.humidity != null ? cur.humidity : null;
    const parts = [];
    if (emo) parts.push(emo);
    if (lbl) parts.push(lbl);
    if (t != null) parts.push(fmtTemp(t));
    if (hum != null) parts.push(`humidity ${hum}%`);
    let s = parts.join(' · ');
    if (spot.city) s += ` (${spot.city})`;
    return s.slice(0, 80);
  } catch { return ''; }
}

function journalFormScreen(editId) {
  const existing = editId ? journalEntries().find((e) => e.id === editId) : null;
  const editing = !!existing;
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar(editing ? 'Edit entry' : 'New entry', editing ? `#journal-entry-${editId}` : '#journal-open'));
  if (editId && !existing) { wrap.append(h('p', { class: 'empty' }, 'Entry not found.')); mount(wrap, '#home'); return; }

  // New entries auto-stamp the current location (last GPS fix) and weather; both stay
  // editable. Existing entries keep whatever was saved.
  const st = { coords: existing ? existing.coords : (getLastFix() || null) };
  const title = h('input', { 'aria-label': 'Memory title', type: 'text', placeholder: 'A title for this memory' });
  const text = h('textarea', { 'aria-label': 'What happened', class: 'ta', placeholder: 'What happened? What did you see, eat, feel?' });
  const place = h('input', { 'aria-label': 'Place', type: 'text', placeholder: 'Place (e.g. Hoi An old town)' });
  const weather = h('input', { 'aria-label': 'Weather', type: 'text', placeholder: 'Weather (auto — editable)' });
  if (existing) {
    title.value = existing.title || ''; text.value = existing.text || ''; place.value = existing.place || '';
    weather.value = existing.weather || '';
  } else {
    // Prefill the place with where the traveller is, and the weather from the cache.
    try { const fs = focusSpot(); if (fs && fs.spot && fs.spot.city) place.value = fs.spot.city; } catch { /* none */ }
    weather.value = journalWeatherString(st.coords);
  }

  // Photos: MULTIPLE per entry. Take new ones and/or upload several; each is removable.
  // st.photos = [{ key?, file?, url }] — key = an already-saved blob, file = a new pick.
  st.photos = [];
  const thumbs = h('div', { class: 'photo-thumbs' });
  const renderThumbs = () => {
    thumbs.innerHTML = '';
    if (!st.photos.length) { thumbs.append(h('p', { class: 'muted', style: 'margin:0' }, 'No photos yet.')); return; }
    st.photos.forEach((p, i) => {
      const img = h('img', { alt: '', loading: 'lazy' });
      if (p.url) img.src = p.url;
      thumbs.append(h('div', { class: 'photo-thumb' }, [
        img,
        h('button', { class: 'photo-thumb-x', 'aria-label': 'Remove photo', onclick: () => { st.photos.splice(i, 1); renderThumbs(); } }, '✕'),
      ]));
    });
  };
  entryPhotoKeys(existing).forEach((k) => { const o = { key: k, url: null }; st.photos.push(o); getBlob(k).then((b) => { if (b) { o.url = URL.createObjectURL(b); renderThumbs(); } }).catch(() => {}); });
  const camIn = h('input', { type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none' });
  const libIn = h('input', { type: 'file', accept: 'image/*', multiple: '', style: 'display:none' });
  const addFiles = (inp) => { (inp.files ? [...inp.files] : []).forEach((f) => st.photos.push({ file: f, url: URL.createObjectURL(f) })); inp.value = ''; renderThumbs(); };
  camIn.onchange = () => addFiles(camIn);
  libIn.onchange = () => addFiles(libIn);
  renderThumbs();

  // Voice note: record audio and, where the browser supports it, live-transcribe speech into
  // the entry text — which stays fully editable. The original recording is kept on-device
  // (IndexedDB) and plays back on the entry, so the traveller has both the written version and
  // the original audio. Denial of the microphone degrades to typing with no loss.
  const SR = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition);
  st.audio = (existing && existing.audioKey) ? { key: existing.audioKey, url: null } : null;
  const recStatus = h('div', { class: 'muted tiny', style: 'margin:4px 0' }, '');
  const audioBox = h('div', { class: 'jr-audio-box' });
  const drawAudio = () => {
    audioBox.innerHTML = '';
    if (st.audio && (st.audio.url || st.audio.key)) {
      const au = h('audio', { class: 'entry-audio', controls: '' });
      if (st.audio.url) au.src = st.audio.url;
      else if (st.audio.key) getBlob(st.audio.key).then((b) => { if (b) { st.audio.url = URL.createObjectURL(b); au.src = st.audio.url; } }).catch(() => { /* missing */ });
      audioBox.append(au, h('button', { class: 'btn ghost', style: 'margin-top:4px', onclick: () => {
        if (st.audio && st.audio.url) { try { URL.revokeObjectURL(st.audio.url); } catch { /* noop */ } }
        st.audio = null; drawAudio(); recBtn.style.display = ''; recStatus.textContent = '';
      } }, '🗑 Remove recording'));
    }
  };
  let mediaRec = null, chunks = [], sr = null, recording = false;
  const recBtn = h('button', { class: 'chip', onclick: () => startRec() }, '🎙 Record a voice note');
  const stopBtn = h('button', { class: 'chip jr-rec-stop', style: 'display:none', onclick: () => stopRec() }, '⏹ Stop');
  async function startRec() {
    if (recording) return;
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { recStatus.textContent = 'Microphone unavailable or blocked — you can still type your entry.'; return; }
    try {
      chunks = [];
      mediaRec = new MediaRecorder(stream);
      mediaRec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
      mediaRec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mediaRec.mimeType || 'audio/webm' });
        if (st.audio && st.audio.url) { try { URL.revokeObjectURL(st.audio.url); } catch { /* noop */ } }
        st.audio = { blob, url: URL.createObjectURL(blob) };
        drawAudio();
      };
      mediaRec.start();
      recording = true; recBtn.style.display = 'none'; stopBtn.style.display = '';
      recStatus.textContent = '● Recording… speak now.' + (SR ? ' Transcribing into your entry below.' : ' (This device cannot auto-transcribe — the audio is saved; type your notes.)');
      if (SR) {
        try {
          sr = new SR(); sr.continuous = true; sr.interimResults = true; sr.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
          let base = text.value ? (text.value.replace(/\s*$/, '') + '\n') : '';
          sr.onresult = (ev) => {
            let finalTxt = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) { if (ev.results[i].isFinal) finalTxt += ev.results[i][0].transcript; }
            if (finalTxt) { base += finalTxt.replace(/^\s+/, '') + ' '; text.value = base; }
          };
          sr.onerror = () => { /* keep recording audio even if transcription drops */ };
          sr.start();
        } catch { sr = null; }
      }
    } catch { recStatus.textContent = 'Recording is not supported on this device — you can still type.'; try { stream.getTracks().forEach((t) => t.stop()); } catch { /* noop */ } }
  }
  function stopRec() {
    recording = false; recBtn.style.display = ''; stopBtn.style.display = 'none';
    try { if (mediaRec && mediaRec.state !== 'inactive') mediaRec.stop(); } catch { /* noop */ }
    try { if (sr) sr.stop(); } catch { /* noop */ }
    sr = null;
    recStatus.textContent = 'Saved — play it back below, and edit the transcribed text freely.';
  }
  drawAudio();
  const voiceField = field('Voice note (optional)', h('div', {}, [
    h('div', { class: 'chips' }, [recBtn, stopBtn]), recStatus, audioBox,
  ]));

  const locOut = h('p', { class: 'muted' }, st.coords
    ? `Stamped at ${st.coords.lat.toFixed(4)}, ${st.coords.lng.toFixed(4)}`
    : 'Entry is stamped with the current date and time automatically.');
  const card = h('div', { class: 'card' }, [
    field('Title', title), field('Your entry', text),
    voiceField,
    field('Place (editable)', place),
    field('Weather (auto — editable)', weather),
    field('Location', h('div', {}, [
      h('button', { class: 'btn ghost', onclick: () => {
        locOut.textContent = 'Locating…';
        if (!navigator.geolocation) { locOut.textContent = 'Geolocation unavailable.'; return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            st.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            locOut.textContent = `Stamped at ${st.coords.lat.toFixed(4)}, ${st.coords.lng.toFixed(4)}`;
            const w = journalWeatherString(st.coords); if (w) weather.value = w; // refresh the snapshot
          },
          (err) => { locOut.textContent = `No location: ${err.message}`; }, { enableHighAccuracy: true, timeout: 10000 });
      } }, st.coords ? '📍 Update location' : '📍 Stamp my location'),
      locOut,
    ])),
    field('Photos', h('div', {}, [
      thumbs,
      h('div', { class: 'chips' }, [
        h('button', { class: 'chip', onclick: () => camIn.click() }, '📷 Take a photo'),
        h('button', { class: 'chip', onclick: () => libIn.click() }, '🖼 Add pictures'),
      ]),
      h('p', { class: 'muted tiny', style: 'margin:4px 0 0' }, 'Saved with this entry once you tap Save below — then gathers into your scrapbook automatically.'),
      camIn, libIn,
    ])),
  ]);
  wrap.append(card);
  wrap.append(h('button', { class: 'btn block', onclick: async () => {
    if (!title.value.trim() && !text.value.trim() && !st.audio) { alert('Write something, or record a voice note, first.'); return; }
    const origKeys = entryPhotoKeys(existing);
    const finalKeys = [];
    let n = 0;
    for (const p of st.photos) {
      if (p.key) { finalKeys.push(p.key); continue; }
      if (p.file) { const nk = `jrphoto-${Date.now()}-${n++}-${Math.floor(Math.random() * 1e6)}`; try { await putBlob(nk, p.file); finalKeys.push(nk); } catch { /* skip this one */ } }
    }
    origKeys.filter((k) => !finalKeys.includes(k)).forEach((k) => delBlob(k)); // free removed blobs
    // Persist the voice recording: a new blob gets a fresh key; an unchanged one is kept; a
    // removed one is dropped and its blob freed. The original audio never leaves the device.
    let audioKey = existing ? (existing.audioKey || null) : null;
    if (st.audio && st.audio.blob) {
      const ak = `jraudio-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      try { await putBlob(ak, st.audio.blob); audioKey = ak; } catch { audioKey = existing ? (existing.audioKey || null) : null; }
    } else if (st.audio && st.audio.key) { audioKey = st.audio.key; } else { audioKey = null; }
    if (existing && existing.audioKey && existing.audioKey !== audioKey) delBlob(existing.audioKey);
    const fields = { title: title.value.trim() || 'Untitled', text: text.value, place: place.value.trim(), coords: st.coords, photoKeys: finalKeys, weather: weather.value.trim(), audioKey };
    if (editing) { updateJournalEntry(editId, fields); go(`#journal-entry-${editId}`); }
    else { addJournalEntry(fields); go('#journal-open'); }
  } }, editing ? 'Save changes' : 'Save to journal'));
  // Editable thumbnails hold live object URLs (they must survive re-renders while picking), so
  // revoke them when the editor screen is torn down rather than on img-load. render() runs this
  // before the next screen builds.
  setLiveCleanup(() => {
    (st.photos || []).forEach((p) => { if (p.url) { try { URL.revokeObjectURL(p.url); } catch { /* noop */ } p.url = null; } });
    if (st.audio && st.audio.url) { try { URL.revokeObjectURL(st.audio.url); } catch { /* noop */ } }
    try { if (mediaRec && mediaRec.state && mediaRec.state !== 'inactive') mediaRec.stop(); } catch { /* noop */ }
    try { if (sr) sr.stop(); } catch { /* noop */ }
  });
  mount(wrap, '#home');
}

// ---- JOURNEY MAP (Indiana-Jones dotted line + moving vehicle) ----------------
// ---- THE JOURNEY MAP --------------------------------------------------------
// A map of where the traveller has actually been, built for them rather than by them, and
// deliberately a DIFFERENT map from the two the app already has: Places is a live MapLibre
// map of what is around you right now, Explore is a region chooser for deciding where to
// go. This one is a record of a trip that happened — real country outlines and the Mekong
// drawn from js/data/geo.js, no tiles, no network, cropped to the trip itself — and every
// pin is a door into what the traveller put in the app at that place.
//
// It replaces an abstract dotted line drawn inside a bounding box, which had no geography
// at all, needed two journal entries before it would draw anything, and listed its stops
// as plain text that led nowhere. Pins are now automatic (js/trail.js), so a traveller who
// has written nothing still has a map.

// One "place" on this map. 10 km rather than a tighter figure because a stop is a town and
// the things around it — a journal entry stamped at Tam Coc is 7 km from a trail pin in Ninh
// Binh city and belongs on the same pin, not on a second one with the same name. Labels are
// checked as well as distance, so two records that call themselves the same place merge even
// when the coordinates disagree by more than that.
const NEAR_KM = 10;

function jkm(a, b) {
  const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180, la2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// One list of stops, each carrying everything the traveller has at that place. The trail
// leads because it is the only source that exists without the traveller doing anything;
// journal entries and dated trip stops then either land on an existing stop or add one of
// their own, so a journey is complete whether it was recorded by walking around with the
// app open, by writing entries, or by planning stops in advance.
function journeyStops() {
  const stops = [];
  const add = (coords, seed) => {
    const label = ((seed && seed.label) || '').trim().toLowerCase();
    if (label) { const named = stops.find((s) => (s.label || '').trim().toLowerCase() === label); if (named) return named; }
    let best = null, bestKm = Infinity;
    for (const s of stops) { const d = jkm(coords, s); if (d < bestKm) { bestKm = d; best = s; } }
    if (best && bestKm < NEAR_KM) return best;
    const st = { lat: coords.lat, lng: coords.lng, label: '', first: '', last: '', cc: '',
      entries: [], places: [], auto: false, ...seed };
    stops.push(st);
    return st;
  };
  const stamp = (st, date) => {
    if (!date) return;
    if (!st.first || date < st.first) st.first = date;
    if (!st.last || date > st.last) st.last = date;
  };

  trailPoints().forEach((p) => {
    const st = add(p, { label: p.city || '', cc: p.cc || '', auto: true });
    if (p.city && !st.label) st.label = p.city;
    if (p.cc && !st.cc) st.cc = p.cc;
    st.auto = true;
    stamp(st, p.first); stamp(st, p.last);
  });

  journalEntries().forEach((e) => {
    if (!e.coords || typeof e.coords.lat !== 'number') return;
    const st = add(e.coords, { label: e.place || e.title || '' });
    if (!st.label) st.label = e.place || e.title || '';
    st.entries.push(e);
    stamp(st, e.date);
  });

  // A trip stop has a free-text title and no coordinates, so it can only reach the map when
  // its title names a city the app knows. One that does not still shows in the list below —
  // absent from the map is honest; inventing a coordinate for it would not be.
  (store.trip.stops || []).forEach((s) => {
    const sp = (s.title || '').trim().toLowerCase();
    if (!sp) return;
    const hit = WEATHER_SPOTS.find((w) => (w.city || '').toLowerCase() === sp);
    if (!hit) return;
    const st = add({ lat: hit.lat, lng: hit.lng }, { label: s.title, cc: hit.country });
    if (!st.label) st.label = s.title;
    st.planned = true;
    stamp(st, s.date);
  });

  // Saved and rated places attach to whichever stop they sit in, so a pin also leads back to
  // the places the traveller starred while they were there.
  const ids = new Set([...(store.favorites || []), ...Object.keys(store.placeData || {})]);
  ids.forEach((id) => {
    const pl = getPlace(id);
    if (!pl || !pl.coords || typeof pl.coords.lat !== 'number') return;
    let best = null, bestKm = Infinity;
    for (const s of stops) { const d = jkm(pl.coords, s); if (d < bestKm) { bestKm = d; best = s; } }
    if (best && bestKm < NEAR_KM) best.places.push(pl);
  });

  stops.forEach((s) => {
    s.entries.sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);
    s.photos = s.entries.flatMap((e) => entryPhotoKeys(e));
  });
  stops.sort((a, b) => (a.first || '9999') < (b.first || '9999') ? -1 : (a.first || '9999') > (b.first || '9999') ? 1 : 0);
  return stops;
}

function jrDateRange(from, to) {
  if (!from) return '';
  const f = (iso) => { try { return new Date(iso + 'T00:00').toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short' }); } catch { return iso; } };
  return (!to || to === from) ? f(from) : `${f(from)} – ${f(to)}`;
}

export function journeyScreen() {
  const wrap = h('div', { class: 'screen' });
  const name = (store.profile.name || '').trim();
  wrap.append(topbar(name ? `${name}’s journey` : 'Your journey', '#me'));

  const stops = journeyStops();
  const st = trailStats();

  if (!stops.length) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { style: 'margin:0 0 8px' }, trailEnabled()
        ? 'Your map draws itself as you travel. Open the app where you are and this fills in — no pins to add.'
        : 'Recording your journey is switched off, so there is nothing to draw yet.'),
      h('p', { class: 'muted tiny', style: 'margin:0 0 8px' }, trailEnabled()
        ? 'It needs your device to have given the app a location at least once. Journal entries with a stamped place, and planned stops that name a city, show up here too.'
        : 'Switch it back on and the map starts filling in from your next trip.'),
      // The fix for "it is switched off" belongs on the screen that is empty because of it,
      // not at the end of a sentence pointing at Settings.
      trailEnabled()
        ? h('button', { class: 'btn block', onclick: () => go('#journal-new') }, '✎ Write the first entry')
        : h('button', { class: 'btn block', onclick: () => { setTrailEnabled(true); render(); } }, '▶️ Start recording my journey'),
    ]));
    mount(wrap, '#home');
    return;
  }

  wrap.append(h('p', { class: 'muted', style: 'margin:0 0 8px' },
    [`${stops.length} ${stops.length === 1 ? 'place' : 'places'}`,
      st.countries > 1 ? `${st.countries} countries` : null,
      jrDateRange(stops[0].first, stops[stops.length - 1].last) || null,
    ].filter(Boolean).join(' · ')));

  // The map. Static layers go in as one SVG string — the same pattern this screen already
  // used — and each pin carries data-i so the handlers below can find it. A pin is a real
  // button to a screen reader and to the keyboard, not just a circle.
  const parts = journeyMapParts(stops, visitMarksForMap());
  const holder = h('div', { class: 'jr-live-wrap' });
  const panel = h('div', { class: 'jr-panel' });

  if (parts) {
    const { vb, minX, minY, w, hgt, u, f, land, river, visited, project } = parts;
    const pp = stops.map((s) => project(s.lng, s.lat));
    const route = pp.length > 1
      ? `<path d="M${pp.map((c) => `${f(c[0])},${f(c[1])}`).join(' L')}" fill="none" stroke="#C0431A" stroke-width="${f(u * 0.8)}" stroke-dasharray="${f(u * 2.8)} ${f(u * 2)}" stroke-linecap="round"/>`
      : '';
    const dotR = u * 2.4, numFs = u * 2.7;
    const pins = pp.map((c, i) => {
      const s = stops[i];
      const lbl = `${i + 1}. ${s.label || 'a place you have been'}${s.entries.length ? `, ${s.entries.length} journal ${s.entries.length === 1 ? 'entry' : 'entries'}` : ''}`;
      return `<g class="jr-pin" data-i="${i}" role="button" tabindex="0" aria-label="${lbl.replace(/"/g, '&quot;')}">`
        + `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(dotR * 1.9)}" fill="transparent"/>`
        + `<circle class="jr-pin-dot" cx="${f(c[0])}" cy="${f(c[1])}" r="${f(dotR)}" fill="#E8632A" stroke="#FFF6E2" stroke-width="${f(u * 0.6)}"/>`
        + `<text x="${f(c[0])}" y="${f(c[1] + numFs * 0.35)}" font-size="${f(numFs)}" font-weight="700" fill="#FFF6E2" text-anchor="middle" font-family="sans-serif">${i + 1}</text></g>`;
    }).join('');
    holder.innerHTML = `<svg viewBox="${vb}" class="jr-map jr-map-live" xmlns="http://www.w3.org/2000/svg" aria-label="Map of your journey">`
      + `<rect x="${minX.toFixed(1)}" y="${minY.toFixed(1)}" width="${w.toFixed(1)}" height="${hgt.toFixed(1)}" fill="#CFE3EC"/>`
      + `${land}${river}${visited}${route}${pins}</svg>`;
    wrap.append(holder);
  }
  wrap.append(panel);

  // Selecting a stop is one function whether it came from a pin or the list, so the two can
  // never disagree about what is shown or which pin is lit.
  let selected = -1;
  const select = (i) => {
    selected = i;
    holder.querySelectorAll('.jr-pin').forEach((el) => el.classList.toggle('on', +el.dataset.i === i));
    panel.innerHTML = '';
    panel.append(stopCard(stops[i], i));
    panel.scrollIntoView({ block: 'nearest' });
  };
  holder.querySelectorAll('.jr-pin').forEach((el) => {
    const i = +el.dataset.i;
    el.addEventListener('click', () => select(i));
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i); } });
  });

  // One stop, in full: when, what was written there, the photos taken there, and the places
  // starred there — each a link to the thing itself. This is the path from the map into the
  // traveller's own content that a text list of stop names never gave them.
  function stopCard(s, i) {
    const card = h('div', { class: 'card jr-stop' });
    card.append(h('div', { class: 'row-between' }, [
      h('h2', { style: 'margin:0' }, `${i + 1}. ${s.label || 'A place you have been'}`),
      h('span', { class: 'muted tiny' }, jrDateRange(s.first, s.last)),
    ]));
    const tags = [];
    if (s.auto) tags.push('recorded automatically');
    if (s.planned) tags.push('a planned stop');
    if (tags.length) card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 6px' }, tags.join(' · ')));

    if (s.photos.length) {
      const strip = h('div', { class: 'jr-photos' });
      s.photos.slice(0, 12).forEach((k, pi) => {
        // No loading="lazy": setBlobThumb has already read the blob out of IndexedDB before it
        // sets src, so there is no network fetch to defer — the attribute would only postpone
        // the decode of a picture the traveller is looking at.
        const img = h('img', { class: 'jr-photo', alt: 'Photo from this place' });
        const e = s.entries.find((en) => entryPhotoKeys(en).includes(k));
        const btn = h('button', { class: 'jr-photo-btn', 'aria-label': `Photo ${pi + 1} from this place — open the journal entry`,
          onclick: () => go(e ? `#journal-entry-${e.id}` : '#scrapbook') }, img);
        strip.append(btn);
        setBlobThumb(img, k);
      });
      card.append(strip);
      if (s.photos.length > 12) card.append(h('p', { class: 'muted tiny', style: 'margin:2px 0 0' }, `…and ${s.photos.length - 12} more in your scrapbook`));
    }

    if (s.entries.length) {
      card.append(h('h3', { style: 'margin:10px 0 2px' }, `📔 Your journal here · ${s.entries.length}`));
      s.entries.forEach((e) => card.append(h('button', { class: 'btn ghost block', style: 'margin-top:6px;text-align:left',
        onclick: () => go(`#journal-entry-${e.id}`) }, `${e.date || ''} — ${e.title || 'Untitled entry'}`)));
    }
    if (s.places.length) {
      card.append(h('h3', { style: 'margin:10px 0 2px' }, `⭐ Places you saved here · ${s.places.length}`));
      card.append(h('div', { class: 'chips' }, s.places.slice(0, 8).map((pl) => h('button', {
        class: 'status-chip', onclick: () => go(`#place-${pl.id}`) },
      [h('span', { class: 'status-ic' }, '📍'), h('span', { class: 'status-lbl' }, pl.name)]))));
    }
    if (!s.entries.length && !s.photos.length && !s.places.length) {
      card.append(h('p', { class: 'muted', style: 'margin:6px 0 8px' }, 'Nothing written here yet — this pin came from having the app open at this place.'));
      card.append(h('button', { class: 'btn block', onclick: () => go('#journal-new') }, '✎ Write about this place'));
    }
    return card;
  }

  // Every stop in order, so the whole trip is readable without hunting for pins on a map,
  // and tapping a row lights its pin. Same select() as the map, so they cannot diverge.
  const list = h('div', { class: 'card', style: 'margin-top:10px' }, [h('h2', { style: 'margin-top:0' }, '🧭 Your stops, in order')]);
  stops.forEach((s, i) => {
    const bits = [];
    if (s.entries.length) bits.push(`${s.entries.length} 📔`);
    if (s.photos.length) bits.push(`${s.photos.length} 📸`);
    if (s.places.length) bits.push(`${s.places.length} ⭐`);
    list.append(h('button', { class: 'jr-row', onclick: () => select(i) }, [
      h('span', { class: 'jr-row-n' }, String(i + 1)),
      h('span', { class: 'jr-row-txt' }, [
        h('span', { class: 'jr-row-lbl' }, s.label || 'A place you have been'),
        h('span', { class: 'jr-row-sub' }, [jrDateRange(s.first, s.last), bits.join(' ')].filter(Boolean).join(' · ')),
      ]),
      h('span', { class: 'jr-row-go' }, '›'),
    ]));
  });
  wrap.append(list);

  // Unmatched planned stops: named, so the list is not quietly incomplete.
  const unmatched = (store.trip.stops || []).filter((s) => {
    const t = (s.title || '').trim().toLowerCase();
    return t && !WEATHER_SPOTS.some((w) => (w.city || '').toLowerCase() === t);
  });
  if (unmatched.length) {
    wrap.append(h('p', { class: 'muted tiny', style: 'margin:8px 0 0' },
      `Not on the map yet: ${unmatched.map((s) => s.title).join(', ')} — the app does not know where ${unmatched.length === 1 ? 'that is' : 'those are'}.`));
  }

  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:10px', onclick: () => go('#sharejourney') },
    '📤 Share this journey →'));

  // Said plainly, on the screen that does it, not only in Settings. Automatic recording is
  // defensible precisely because it never leaves the device and can be stopped and erased
  // here in one tap.
  const foot = h('div', { class: 'card', style: 'margin-top:12px' }, [
    h('p', { class: 'muted tiny', style: 'margin:0 0 8px' },
      'Your pins are recorded automatically, on this device only, whenever the app has your location. Nothing about where you have been is ever sent anywhere.'),
  ]);
  foot.append(h('div', { class: 'chips' }, [
    h('button', { class: 'status-chip', onclick: () => {
      setTrailEnabled(!trailEnabled()); render();
    } }, [h('span', { class: 'status-ic' }, trailEnabled() ? '⏸' : '▶️'),
      h('span', { class: 'status-lbl' }, trailEnabled() ? 'Stop recording' : 'Start recording again')]),
    h('button', { class: 'status-chip', onclick: () => {
      confirmAction({ title: 'Erase your journey pins?', body: `This removes all ${st.places} recorded ${st.places === 1 ? 'pin' : 'pins'} from this device. Your journal, photos and saved places are not touched.`, confirmLabel: 'Erase pins', danger: true })
        .then((ok) => { if (ok) { clearTrail(); render(); } });
    } }, [h('span', { class: 'status-ic' }, '🗑'), h('span', { class: 'status-lbl' }, 'Erase pins')]),
  ]));
  wrap.append(foot);

  mount(wrap, '#home');
}

// The visit-cell map (js/visits.js) as faint background marks, when the traveller has that
// switched on. Kept separate from the pins above on purpose: a cell is rounded to ~55 km and
// says only "the app was opened somewhere in here", so it is context, never a stop.
function visitMarksForMap() {
  try { return (myVisits() || []).map((c) => ({ lat: c.lat, lng: c.lng })); } catch { return []; }
}
