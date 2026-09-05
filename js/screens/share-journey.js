// "Share my journey" — build a self-contained page of where you went and hand it to someone.
//
// The honest architecture is stated on the screen rather than buried here, the same way the
// visitors map states its own. There is no server and no account, so a shared journey is a
// FILE: whoever holds it sees everything inside it, and it cannot be recalled once sent. That
// is a real limitation and the screen says so, because a traveller deciding what to put in
// front of family deserves to know what "share" actually means here.
//
// Several named journeys can coexist, which is how "who sees what" works without accounts:
// the scope is baked into whichever file you hand over.
import { h } from '../util.js';
import { getCountry } from '../data/regions.js';
import { infoTip, field, confirmAction } from '../ui-widgets.js';
import {
  store, journalEntries, getJourneys, addJourney, updateJourney, deleteJourney,
} from '../state.js';
import {
  buildJourneyHtml, journeyPoints, journeyMapSVG, photoCount, DEFAULT_INCLUDE, journeyLinkData,
} from '../journey-share.js';
import { encodeJourney, parseJourney, shareUrl, MAX_PAYLOAD_URL } from '../social.js';
import { shareOrDownload } from '../exporter.js';
import { go, mount, topbar } from '../main.js';

const PARTS = [
  { k: 'map', label: 'Journey map', hint: 'Where you went, drawn on the real map' },
  { k: 'stops', label: 'Trip stops and dates', hint: 'Your itinerary, in order' },
  { k: 'journal', label: 'Journal entries', hint: 'Your written entries — pick which ones below' },
  { k: 'photos', label: 'Photos', hint: 'Journal, place and album pictures' },
  { k: 'reviews', label: 'Ratings and reviews', hint: 'Places you scored, with what you wrote' },
  { k: 'spending', label: 'Spending', hint: 'Your expense log — off unless you turn it on' },
];

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function slug(s) {
  return String(s || 'journey').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'journey';
}
function sizeLabel(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Build, then hand to the share sheet (falling back to a download). Progress is real: photo
// re-encoding is the slow part and can run to a minute on a big journey, so the button counts
// pictures rather than spinning.
async function buildAndShare(j, btn, status) {
  const label = btn.textContent;
  const total = photoCount(j.include, j.journalIds);
  let done = 0;
  btn.disabled = true;
  btn.textContent = total ? `Building… 0/${total} photos` : 'Building…';
  status.textContent = '';
  try {
    const html = await buildJourneyHtml(j, () => {
      done += 1;
      btn.textContent = `Building… ${done}/${total} photos`;
    });
    const blob = new Blob([html], { type: 'text/html' });
    const name = `${slug(j.name)}-${stamp()}.html`;
    btn.textContent = 'Opening share…';
    const how = await shareOrDownload([{ blob, name }], j.name || 'My journey');
    updateJourney(j.id, { builtAt: Date.now() });
    status.textContent = how === 'shared'
      ? `Sent · ${sizeLabel(blob.size)}. Whoever opens it sees everything inside it.`
      : `Saved as ${name} · ${sizeLabel(blob.size)}. Send it however you like — it opens in any browser.`;
  } catch {
    status.textContent = 'Could not build that on this device. Try including fewer photos.';
  }
  btn.disabled = false;
  btn.textContent = label;
}

// The per-journey editor card.
function journeyCard(j, onChange) {
  const card = h('div', { class: 'card' });
  card.append(h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, `📖 ${j.name}`),
    h('button', {
      class: 'btn ghost tiny', 'aria-label': `Delete ${j.name}`,
      onclick: async () => {
        const ok = await confirmAction({
          title: 'Delete this journey?',
          body: 'This removes the recipe only. Your journal, photos and trip are untouched, and any file you already shared stays where it is.',
          confirmLabel: 'Delete', danger: true,
        });
        if (ok) { deleteJourney(j.id); onChange(); }
      },
    }, '🗑'),
  ]));

  card.append(field('Name', h('input', {
    type: 'text', value: j.name, maxlength: '60',
    onchange: (e) => { updateJourney(j.id, { name: e.target.value }); onChange(); },
  })));

  PARTS.forEach((p) => {
    const on = j.include[p.k] !== false && !!j.include[p.k];
    const row = h('label', { class: 'switch-row' }, [
      h('input', {
        type: 'checkbox', checked: on ? '' : null,
        onchange: (e) => { updateJourney(j.id, { include: { [p.k]: e.target.checked } }); onChange(); },
      }),
      h('span', {}, [h('span', {}, p.label), h('span', { class: 'tiny muted', style: 'display:block' }, p.hint)]),
    ]);
    card.append(row);
  });

  // Per-entry journal choice. Journal entries are often the most personal thing here, so this
  // is a real picker rather than an all-or-nothing switch.
  const entries = journalEntries();
  if (j.include.journal && entries.length) {
    const chosen = j.journalIds;
    const fold = h('details', { class: 'fold' }, [
      h('summary', {}, `Which entries? (${chosen ? chosen.length : entries.length} of ${entries.length})`),
    ]);
    const all = h('button', { class: 'btn ghost tiny', style: 'margin:6px 6px 6px 0', onclick: () => { updateJourney(j.id, { journalIds: null }); onChange(); } }, 'Include all');
    const none = h('button', { class: 'btn ghost tiny', onclick: () => { updateJourney(j.id, { journalIds: [] }); onChange(); } }, 'Include none');
    fold.append(h('div', {}, [all, none]));
    entries.forEach((e) => {
      const isOn = !chosen || chosen.includes(e.id);
      fold.append(h('label', { class: 'switch-row' }, [
        h('input', {
          type: 'checkbox', checked: isOn ? '' : null,
          onchange: (ev) => {
            const cur = chosen ? chosen.slice() : entries.map((x) => x.id);
            const i = cur.indexOf(e.id);
            if (ev.target.checked && i < 0) cur.push(e.id);
            if (!ev.target.checked && i >= 0) cur.splice(i, 1);
            updateJourney(j.id, { journalIds: cur });
            onChange();
          },
        }),
        h('span', {}, [
          h('span', {}, e.title || 'Untitled'),
          h('span', { class: 'tiny muted', style: 'display:block' }, [e.date || '', e.place || ''].filter(Boolean).join(' · ')),
        ]),
      ]));
    });
    card.append(fold);
  }

  const nPhotos = photoCount(j.include, j.journalIds);
  const nPts = journeyPoints(j.include, j.journalIds).length;
  card.append(h('p', { class: 'tiny muted', style: 'margin:10px 0 6px' },
    `${nPts} place${nPts === 1 ? '' : 's'} on the map · ${nPhotos} photo${nPhotos === 1 ? '' : 's'}`
    + (nPhotos > 150 ? ' · a big one — expect a minute to build' : '')));

  const status = h('p', { class: 'tiny muted', style: 'margin:6px 0 0' });
  const build = h('button', { class: 'btn block' }, '📤 Build and share');
  build.onclick = () => buildAndShare(j, build, status);
  card.append(build);

  // The link half. Everything except the photographs fits inside the URL itself, so a
  // recipient opens it in a browser with nothing to install. When it does not fit we say so
  // and point at the file rather than quietly dropping stops out of someone's journey.
  const payload = encodeJourney(journeyLinkData(j));
  const url = shareUrl('jr', payload);
  const fits = payload.length <= MAX_PAYLOAD_URL;
  const link = h('button', { class: 'btn ghost block btn-spaced' },
    fits ? '🔗 Copy a link (map and words, no photos)' : '🔗 Too long for a link — send the file above');
  if (!fits) link.disabled = true;
  link.onclick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(url);
      else if (navigator.share) { await navigator.share({ title: j.name, url }); status.textContent = 'Link sent.'; return; }
      else throw new Error('no clipboard');
      status.textContent = 'Link copied. It opens in any browser — photos travel in the file above.';
    } catch { status.textContent = 'Could not copy the link on this device — use Build and share instead.'; }
  };
  card.append(link);
  card.append(h('p', { class: 'tiny muted', style: 'margin:6px 0 0' }, fits
    ? `Link is ${Math.round(url.length / 100) / 10} KB of characters — well within what messaging apps carry.`
    : 'A link carries the map and your written entries, but this journey is too long for one. The file has everything.'));
  card.append(status);
  return card;
}

// ---- what a RECIPIENT sees -------------------------------------------------
// Reached by opening a shared link. Everything here arrived from someone else and is
// UNTRUSTED: it is rendered as text children only (never innerHTML), and the map SVG is built
// from numbers alone, so nothing from the payload reaches the markup.
export function sharedJourneyScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('A shared journey', '#home'));
  const d = parseJourney(arg);
  if (!d) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This journey link could not be read'),
      h('p', { class: 'muted' }, 'It may have been cut off in transit — long links are sometimes shortened by messaging apps. Ask whoever sent it to share it again, or to send the file instead.'),
      h('button', { class: 'btn', onclick: () => go('#home') }, 'Go to Mekonging'),
    ]));
    mount(wrap, '#home'); return;
  }

  const head = h('div', { class: 'card' }, [h('h2', {}, d.name)]);
  if (d.subtitle) head.append(h('p', { class: 'muted', style: 'margin:0' }, d.subtitle));
  wrap.append(head);

  if (d.points.length) {
    const box = h('div', { class: 'card' });
    box.append(h('div', { class: 'journey-preview', html: journeyMapSVG(d.points, []) }));
    box.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' },
      `${d.points.length} place${d.points.length === 1 ? '' : 's'} along the way, in order.`));
    wrap.append(box);
  }

  if (d.stops.length) {
    const box = h('div', { class: 'card' }, [h('h2', {}, 'Where they went')]);
    d.stops.forEach((st) => {
      const cn = st.country ? (getCountry(st.country) || {}).name : '';
      const when = (st.date && st.endDate && st.endDate !== st.date) ? `${st.date} → ${st.endDate}` : (st.date || st.endDate || '');
      box.append(h('div', { class: 'list-note' }, [st.title, cn, when].filter(Boolean).join(' · ')));
    });
    wrap.append(box);
  }

  d.entries.forEach((e) => {
    const box = h('div', { class: 'card' }, [h('h2', {}, e.title || 'Untitled')]);
    const meta = [e.date, e.place].filter(Boolean).join(' · ');
    if (meta) box.append(h('p', { class: 'tiny muted', style: 'margin:0 0 6px' }, meta));
    if (e.text) String(e.text).split('\n').forEach((line) => box.append(h('p', { style: 'margin:0 0 6px' }, line)));
    wrap.append(box);
  });

  wrap.append(h('div', { class: 'card' }, [
    h('p', { class: 'tiny muted', style: 'margin:0' },
      'Shared from Mekonging. A link carries the map and the writing; photographs travel in the file version, so ask the sender for that if you would like to see them. Nothing here was uploaded anywhere — the whole journey arrived inside the link you opened.'),
  ]));
  mount(wrap, '#home');
}

export function shareJourneyScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Share my journey', '#me'));

  const intro = h('div', { class: 'card' }, [h('div', { class: 'row-between' }, [
    h('h2', { style: 'margin:0' }, '🗺 Your journey, as one page'),
    infoTip('Everything is built here on your device and nothing is uploaded. A journey comes out as a single file that holds its own map and pictures, so whoever you send it to can open it in any browser, offline, with no app and no account.'),
  ])]);
  intro.append(h('p', { class: 'muted', style: 'margin:6px 0 0' },
    'Pick what goes in, then send it however you like — message, email, AirDrop. It opens as a normal web page on any phone or computer.'));
  intro.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' },
    'There are no accounts here, so a shared journey cannot be taken back: anyone holding the file sees everything you put in it. Make a second journey with less in it for a wider circle.'));
  wrap.append(intro);

  // A live map preview, so the traveller sees what they are about to send.
  const preview = journeyPoints();
  if (preview.length) {
    const box = h('div', { class: 'card' });
    box.append(h('h2', {}, 'Where you have been'));
    box.append(h('div', { class: 'journey-preview', html: journeyMapSVG(preview, []) }));
    box.append(h('p', { class: 'tiny muted', style: 'margin:8px 0 0' },
      `${preview.length} place${preview.length === 1 ? '' : 's'}, from your journal entries and dated stops.`));
    wrap.append(box);
  } else {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'empty', style: 'margin:0' },
        'No map yet. Stamp a journal entry with your location, or add a dated stop to your trip, and your route appears here.'),
    ]));
  }

  const list = getJourneys();
  const rerender = () => go('#sharejourney');
  list.forEach((j) => wrap.append(journeyCard(j, rerender)));

  const add = h('button', { class: 'btn ghost block btn-spaced' },
    list.length ? '+ Another journey (a different set for a different circle)' : '+ Make a journey to share');
  add.onclick = () => {
    const name = list.length ? `Journey ${list.length + 1}` : ((store.profile.name || '').trim() ? `${store.profile.name.trim()}’s journey` : 'My journey');
    addJourney({ name, include: { ...DEFAULT_INCLUDE }, journalIds: null });
    rerender();
  };
  wrap.append(add);

  mount(wrap, '#me');
}
