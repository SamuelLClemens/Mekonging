// Export — the traveller's own contributions, per type, in formats a person can actually
// open: a printable HTML travel book, an album, a spreadsheet, a zip of photos. Nothing here
// reads anything the traveller did not enter themselves.
//
// Everything is built on-device from the store + IndexedDB photos. Journal and reviews
// come out as self-contained HTML (photos inline), photos as an album + a JPEG ZIP, and
// spending as a true .xlsx and a .csv. Shareable via the device share sheet, else saved.
//
// Extracted from main.js as a lazy, route-scoped screen (#export). It took js/exporter.js —
// zipStore, toCsv, buildXlsx, downloadBlob, shareOrDownload — out of the eager cold-start
// graph with it: main.js used those five names nowhere but here, and the only other importers
// (js/screens/places.js, js/screens/share-journey.js) are lazy screens themselves.
//
// exportOnePlaceReviewHtml is exported because js/screens/places.js shares a single review
// from the place detail screen. places.js does NOT import this module: main.js keeps a small
// async wrapper of the same name that loads this module through loadScreenMod() first. That
// is deliberate — a bare `await import()` there would be cached as a PERMANENT failure by the
// module map if the fetch ever failed, so the "Share my review" button would keep failing on a
// connection that had already come back. loadScreenMod retries with a fresh query string.
import { store, getPin } from '../state.js';
import { h, esc, money } from '../util.js';
import { screenHint } from '../ui-widgets.js';
import { getCountry, getPlace } from '../data/regions.js';
import { convert } from '../currency.js';
import { expCatOf, expCatLookup } from '../budget-ui.js';
import { zipStore, toCsv, buildXlsx, downloadBlob, shareOrDownload } from '../exporter.js';
import { getBlob, getAllBlobs } from '../idb.js';
import { mount, topbar, homeCurrency, blobToDataURL, entryPhotoKeys, stopDateLabel } from '../main.js';

function exportStamp() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function htmlDoc(title, bodyHtml) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Mekonging</title>
<style>
 body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:820px;margin:0 auto;padding:20px;color:#20143a;background:#faf7f0;line-height:1.5}
 h1{font-size:1.7rem}h2{font-size:1.2rem;margin:0 0 4px}
 article{border:1px solid #e3dccb;border-radius:12px;padding:14px 16px;margin:14px 0;background:#fff}
 .meta{color:#7a7264;font-size:.85rem;margin:0 0 8px}.stars{color:#E0A21A;font-size:1.1rem;margin:2px 0}
 .note{color:#4a7a5a}img{max-width:100%;border-radius:8px;margin:6px 6px 0 0;max-height:360px}
 .album{display:flex;flex-wrap:wrap;gap:8px}.album img{width:180px;height:180px;object-fit:cover;max-height:none}
 .book-section{font-size:1.4rem;margin:30px 0 8px;padding-bottom:5px;border-bottom:2px solid #E8632A}
 .lead{color:#7a7264;margin:0 0 10px}
 table{border-collapse:collapse;width:100%;margin:8px 0;font-size:.92rem}
 th,td{border:1px solid #e3dccb;padding:6px 9px;text-align:left}th{background:#f3ede0}
 tr.total td{font-weight:800;background:#faf3e6}
 footer{color:#9a927f;font-size:.8rem;margin-top:24px;text-align:center}
</style></head><body>
<h1>${esc(title)}</h1>
${bodyHtml}
<footer>Exported from Mekonging on ${exportStamp()} · your data, kept on your device.</footer>
</body></html>`;
}
async function blobsToDataURLs(keys) {
  const out = [];
  for (const k of keys) { try { const b = await getBlob(k); if (b) out.push(await blobToDataURL(b)); } catch { /* skip a missing photo */ } }
  return out;
}
async function exportJournalHtml() {
  const entries = (store.journal.entries || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const parts = [];
  for (const e of entries) {
    const imgs = await blobsToDataURLs(entryPhotoKeys(e));
    const when = e.ts ? new Date(e.ts).toLocaleString() : '';
    parts.push(`<article><h2>${esc(e.title || 'Untitled')}</h2>
<p class="meta">${[when, e.place, e.weather].filter(Boolean).map(esc).join(' · ')}</p>
<p>${esc(e.text || '').replace(/\n/g, '<br>')}</p>
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
  }
  return htmlDoc('My travel journal', parts.join('\n') || '<p>No journal entries yet.</p>');
}
async function exportReviewsHtml() {
  const parts = [];
  for (const id of Object.keys(store.placeData || {})) {
    const d = store.placeData[id];
    if (!d || !(d.rating || d.review || d.note || (d.photos || []).length)) continue;
    const pl = getPlace(id) || getPin(id);
    const imgs = await blobsToDataURLs(d.photos || []);
    parts.push(`<article><h2>${esc(pl ? pl.name : id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
  }
  return htmlDoc('My ratings & reviews', parts.join('\n') || '<p>No ratings or reviews yet.</p>');
}
export async function exportOnePlaceReviewHtml(id, name) {
  const d = store.placeData[id] || {};
  const imgs = await blobsToDataURLs(d.photos || []);
  const body = `<article><h2>${esc(name || id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`;
  return htmlDoc(`My review — ${name || 'a place'}`, body);
}
async function exportPhotosAlbumHtml() {
  const blobs = await getAllBlobs().catch(() => []);
  const imgs = [];
  for (const { blob } of blobs) { if (blob) { try { imgs.push(await blobToDataURL(blob)); } catch { /* skip */ } } }
  return htmlDoc('My photo album', imgs.length ? `<div class="album">${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</div>` : '<p>No photos yet.</p>');
}
async function exportPhotosZip() {
  const blobs = await getAllBlobs().catch(() => []);
  const files = [];
  let n = 1;
  for (const { blob } of blobs) {
    if (!blob) continue;
    const ext = (blob.type && blob.type.includes('png')) ? 'png' : 'jpg';
    try { files.push({ name: `photo-${String(n++).padStart(3, '0')}.${ext}`, bytes: new Uint8Array(await blob.arrayBuffer()) }); } catch { /* skip */ }
  }
  return files.length ? zipStore(files) : null;
}
function expenseTable() {
  const log = (store.trip.budgetLog || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
  return { headers: ['Date', 'Amount', 'Currency', 'Category', 'On what'], rows: log.map((b) => [b.date || '', parseFloat(b.amount) || 0, b.currency || '', expCatLookup(expCatOf(b)).label, b.note || '']) };
}

// The headline export: ONE beautiful, self-contained web page a traveller can open on any
// phone or computer, or print, or share — journal, ratings & reviews, spending and a trip
// summary, with every photo embedded inline. This is what "download my trip" should feel
// like: a keepsake to read, not a data file. (The raw JSON in Settings remains, clearly
// labelled as a device-to-device restore file — not something to read.)
async function exportTravelBookHtml() {
  const home = homeCurrency();
  const parts = [];

  // Trip summary — where and when, and the total spent in the home currency.
  const stops = (store.trip.stops || []).slice();
  const log = store.trip.budgetLog || [];
  let spend = 0, spendKnown = true;
  log.forEach((b) => {
    const cur = b.currency || home, amt = parseFloat(b.amount) || 0;
    if (cur === home) { spend += amt; return; }
    const c = convert(amt, cur, home);
    if (c == null || isNaN(c)) spendKnown = false; else spend += c;
  });
  const summaryBits = [];
  if (stops.length) {
    const countries = [...new Set(stops.map((s) => (getCountry(s.country) || {}).name).filter(Boolean))];
    if (countries.length) summaryBits.push(`Countries: ${countries.join(', ')}`);
    const dates = stops.flatMap((s) => [s.date, s.endDate]).filter(Boolean).sort();
    if (dates.length) summaryBits.push(`Dates: ${dates[0]}${dates.length > 1 && dates[dates.length - 1] !== dates[0] ? ` – ${dates[dates.length - 1]}` : ''}`);
    summaryBits.push(`${stops.length} stop${stops.length === 1 ? '' : 's'}`);
  }
  if (log.length && spend > 0) summaryBits.push(`Total spent: ${money(Math.round(spend), home)}${spendKnown ? '' : ' (partial — some currencies not converted)'}`);
  if (summaryBits.length) {
    parts.push(`<h2 class="book-section">My trip</h2><p class="lead">${summaryBits.map(esc).join(' · ')}</p>`);
    if (stops.length) {
      parts.push('<article>' + stops.map((s) =>
        `<div>${esc(s.title || 'Stop')}${s.country ? ` · ${esc((getCountry(s.country) || {}).name || s.country)}` : ''}${stopDateLabel(s) ? ` · ${esc(stopDateLabel(s))}` : ''}</div>`).join('') + '</article>');
    }
  }

  // Journal
  const entries = (store.journal.entries || []).slice().sort((a, b) => (a.ts || 0) - (b.ts || 0));
  if (entries.length) {
    parts.push('<h2 class="book-section">Journal</h2>');
    for (const e of entries) {
      const imgs = await blobsToDataURLs(entryPhotoKeys(e));
      const when = e.ts ? new Date(e.ts).toLocaleString() : '';
      parts.push(`<article><h2>${esc(e.title || 'Untitled')}</h2>
<p class="meta">${[when, e.place, e.weather].filter(Boolean).map(esc).join(' · ')}</p>
<p>${esc(e.text || '').replace(/\n/g, '<br>')}</p>
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
    }
  }

  // Ratings & reviews (with their photos inline)
  const revIds = Object.keys(store.placeData || {}).filter((id) => {
    const d = store.placeData[id]; return d && (d.rating || d.review || d.note || (d.photos || []).length);
  });
  if (revIds.length) {
    parts.push('<h2 class="book-section">Places I rated</h2>');
    for (const id of revIds) {
      const d = store.placeData[id];
      const pl = getPlace(id) || getPin(id);
      const imgs = await blobsToDataURLs(d.photos || []);
      parts.push(`<article><h2>${esc(pl ? pl.name : id)}</h2>
${d.rating ? `<p class="stars">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</p>` : ''}
${d.review ? `<p>${esc(d.review).replace(/\n/g, '<br>')}</p>` : ''}
${d.note ? `<p class="note"><em>My note:</em> ${esc(d.note).replace(/\n/g, '<br>')}</p>` : ''}
${imgs.map((u) => `<img src="${u}" alt="">`).join('')}</article>`);
    }
  }

  // Expenses table
  if (log.length) {
    const t = expenseTable();
    const body = t.rows.map((r) => `<tr>${r.map((c, i) => `<td>${esc(i === 1 ? String(c) : c)}</td>`).join('')}</tr>`).join('');
    parts.push(`<h2 class="book-section">Spending</h2>
<table><thead><tr>${t.headers.map((hd) => `<th>${esc(hd)}</th>`).join('')}</tr></thead>
<tbody>${body}${spend > 0 ? `<tr class="total"><td>Total</td><td>${esc(String(Math.round(spend)))}</td><td>${esc(home)}</td><td>in your home currency${spendKnown ? '' : ' (partial)'}</td></tr>` : ''}</tbody></table>`);
  }

  if (!parts.length) parts.push('<p>Your travel book is empty for now. Add a journal entry, rate a place, or log an expense and it will appear here.</p>');
  return htmlDoc('My travel book', parts.join('\n'));
}

export function exportScreen() {
  const wrap = h('div', { class: 'screen' });
  // "Export" alone (was "Export & share") — matches the two chips below once they're renamed
  // to match, and fits on one line; the full phrase 3-line-wrapped on mobile.
  wrap.append(topbar('Export', '#settings'));
  wrap.append(screenHint('Save your own contributions as files you can read on any phone or computer, and share them however you like. Each type comes out in a fitting format. Everything is made on your device — nothing is uploaded.'));

  const jCount = (store.journal.entries || []).length;
  const rCount = Object.values(store.placeData || {}).filter((d) => d && (d.rating || d.review || d.note || (d.photos || []).length)).length;
  const bCount = (store.trip.budgetLog || []).length;

  const saver = (btn, build, filename, mime) => { btn.onclick = async () => {
    const lbl = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try { const content = await build(); const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime }); if (!blob || (blob.size === 0)) { alert('Nothing to export yet.'); } else downloadBlob(blob, filename); }
    catch { alert('Could not build that file on this device.'); }
    btn.disabled = false; btn.textContent = lbl;
  }; return btn; };
  const sharer = (btn, build, filename, mime) => { btn.onclick = async () => {
    const lbl = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try { const content = await build(); const blob = (content instanceof Blob) ? content : new Blob([content], { type: mime }); if (!blob || blob.size === 0) alert('Nothing to share yet.'); else await shareOrDownload([{ blob, name: filename }], filename); }
    catch { alert('Could not build that file on this device.'); }
    btn.disabled = false; btn.textContent = lbl;
  }; return btn; };

  // Headline: the whole trip as one beautiful, readable web page (everything, photos inline).
  wrap.append(h('div', { class: 'card', style: 'border:2px solid var(--orange)' }, [
    h('h2', {}, '📖 My travel book'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, 'Everything together — trip, journal, reviews, photos and spending — as one page you can read, print or share. Opens in any browser. This is the nice, readable one.'),
    saver(h('button', { class: 'btn block' }, '⬇️ Save my travel book (.html)'), exportTravelBookHtml, `mekonging-travel-book-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block btn-spaced' }, '📤 Share my travel book'), exportTravelBookHtml, `mekonging-travel-book-${exportStamp()}.html`, 'text/html'),
  ]));
  wrap.append(h('p', { class: 'lbl', style: 'margin: var(--sp-3) var(--sp-0h) var(--sp-0h)' }, 'Or export one type at a time'));

  // Journal
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, '📖 Journal'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, `${jCount} ${jCount === 1 ? 'entry' : 'entries'} — a web page with your writing and photos.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Save journal (.html)'), exportJournalHtml, `mekonging-journal-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block btn-spaced' }, '📤 Share journal'), exportJournalHtml, `mekonging-journal-${exportStamp()}.html`, 'text/html'),
  ]));
  // Reviews & ratings
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, '⭐ Ratings & reviews'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, `${rCount} ${rCount === 1 ? 'place' : 'places'} — your stars, reviews, notes and photos.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Save reviews (.html)'), exportReviewsHtml, `mekonging-reviews-${exportStamp()}.html`, 'text/html'),
    sharer(h('button', { class: 'btn ghost block btn-spaced' }, '📤 Share reviews'), exportReviewsHtml, `mekonging-reviews-${exportStamp()}.html`, 'text/html'),
  ]));
  // Photos
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, '📷 Photos'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, 'A viewable album, or every picture as individual JPEGs in a zip.'),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Photo album (.html)'), exportPhotosAlbumHtml, `mekonging-photos-${exportStamp()}.html`, 'text/html'),
    saver(h('button', { class: 'btn ghost block btn-spaced' }, '⬇️ All photos (.zip of JPEGs)'), exportPhotosZip, `mekonging-photos-${exportStamp()}.zip`, 'application/zip'),
    sharer(h('button', { class: 'btn ghost block btn-spaced' }, '📤 Share photos (.zip)'), exportPhotosZip, `mekonging-photos-${exportStamp()}.zip`, 'application/zip'),
  ]));
  // Expenses — both a true Excel workbook and a CSV, as requested.
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, '💸 Expenses'),
    h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, `${bCount} logged ${bCount === 1 ? 'expense' : 'expenses'} — as a spreadsheet.`),
    saver(h('button', { class: 'btn ghost block' }, '⬇️ Excel (.xlsx)'), () => { const t = expenseTable(); return buildXlsx(t.headers, t.rows, 'Expenses'); }, `mekonging-expenses-${exportStamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    saver(h('button', { class: 'btn ghost block btn-spaced' }, '⬇️ CSV (.csv)'), () => { const t = expenseTable(); return toCsv(t.headers, t.rows); }, `mekonging-expenses-${exportStamp()}.csv`, 'text/csv'),
    sharer(h('button', { class: 'btn ghost block btn-spaced' }, '📤 Share expenses (.xlsx)'), () => { const t = expenseTable(); return buildXlsx(t.headers, t.rows, 'Expenses'); }, `mekonging-expenses-${exportStamp()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  ]));

  wrap.append(h('p', { class: 'disclaimer' }, 'These files are for you — to keep, print or share. For moving everything to a new phone, use the full backup in Settings instead (it restores directly into the app).'));
  mount(wrap, '#settings');
}
