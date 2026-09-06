// Help & FAQ, and the feedback form. Both are fully offline: the FAQ ships with the app, and
// feedback goes out through the share sheet, an email client or the clipboard, because there
// is no backend to post it to.
import { resolveItem } from '../place-ui.js';
import { save, store } from '../state.js';
import { field, screenHint, selectEl } from '../ui-widgets.js';
import { h } from '../util.js';
import { APP_VERSION, go, mount, recentErrors, topbar } from '../main.js';

export function helpScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Help & FAQ', '#home'));
  wrap.append(screenHint('How Mekonging works, what needs internet, and how your data is kept. This page works offline.'));
  const faq = (q, a) => h('details', { class: 'card' }, [h('summary', {}, q), typeof a === 'string' ? h('p', {}, a) : a]);

  wrap.append(faq('What works offline, and what needs internet?', h('div', {}, [
    h('p', {}, 'Almost everything works with no signal, because the guide is stored on your device: the phrasebook, places, food and produce guides, the wildlife field guide, fair prices, transport routes and schedules, border crossings, pools, your journal, trip, calendar, saved places, the document vault, and the base map (coastlines, rivers, borders and your pins).'),
    h('p', {}, 'A few features need a connection, and each one says so: refreshing the weather, currency rates, live translation, the “Across the web” rating and “Compare & book” links, streamed animal calls, and satellite map imagery. Weather and rates are cached after one online refresh, so you can still read them offline.'),
  ])));
  wrap.append(faq('How do I build and log a trip?', h('div', {}, [
    h('p', {}, '“My trip” holds your itinerary (stops with dates) and a budget log that totals your spending in your home currency. “Travel calendar” schedules stays, meals and activities by day and surfaces festivals falling in your dates. “Travel journal” keeps dated, GPS-stamped entries with photos, and the “Journey map” animates the path between them.'),
    h('button', { class: 'btn ghost', onclick: () => go('#trip') }, 'Open My trip'),
  ])));
  wrap.append(faq('How do ratings work?', 'Each place shows a guidebook score synthesised from public sources, plus an “Across the web” card with snapshots from sites such as TripAdvisor — each stamped with the month it was checked — and live links to compare and book. Your own rating always counts first: rate a place and it becomes the headline score and colours its pin on the map.'));
  wrap.append(faq('Can I travel my way — with kids, a tent, or for a long stay?', 'On the Places screen you can filter by interests, price, “Good for kids”, stay type (from a tent to a resort) and short- or long-stay. On the map, local (non-tourist) restaurants have their own red pin, and the map key explains every colour.'));
  wrap.append(faq('Where is my data kept? Is it private?', 'Everything you create — saved places, notes, reviews, pins, journal, trip and calendar — stays on this device only. There are no accounts and nothing is uploaded. The document vault (passports, tickets) is encrypted on-device; if you forget the passcode you can still get back in with the one-time recovery code shown at setup, or by restoring an encrypted backup. The only data that leaves your device is what you actively use online, such as a weather refresh, a translation, or tapping through to a booking site.'));
  wrap.append(faq('Finding your way around', 'The bottom tabs are Home, Talk (phrasebook), You, Places and Explore. Search on the Home screen looks across places, food, wildlife, phrases and prices at once. Save any place with the ⭐ and organise saves into Collections. On the map (inside Places) you can drop a pin, set “my stay”, measure distances, and save an area for offline satellite imagery.'));

  // Site-wide source register. Individual screens also cite their own sources inline
  // (via the same "Sources:" line), so every claim is traceable to a primary source.
  wrap.append(faq('Where does the information come from? (Sources)', h('div', {}, [
    h('p', {}, 'Guidance is compiled from public, authoritative sources, and each screen also cites its own inline. The main sources across the app:'),
    h('ul', { class: 'sos-aid' }, [
      h('li', {}, [h('strong', {}, 'Health & first aid: '), 'World Health Organization and the IFRC / Red Cross; hospitals reflect Joint Commission International accreditation and facilities travellers commonly use.']),
      h('li', {}, [h('strong', {}, 'Kosher: '), 'Chabad of Thailand, Chabad of Cambodia and the Chabad center directory — only certified-kosher venues, never “kosher-style”.']),
      h('li', {}, [h('strong', {}, 'Places, worship & maps: '), 'OpenStreetMap contributors and national tourism boards; satellite imagery from Esri / ArcGIS.']),
      h('li', {}, [h('strong', {}, 'Weather: '), 'Open-Meteo. Exchange rates: open.er-api.com. Live translation: MyMemory.']),
      h('li', {}, [h('strong', {}, 'Wildlife: '), 'photographs from Wikimedia Commons (Creative Commons, credited on each species); animal calls streamed from Xeno-canto and iNaturalist.']),
      h('li', {}, [h('strong', {}, 'Ratings: '), 'public snapshots from sites such as TripAdvisor, each stamped with the month it was checked, with live links to the source.']),
    ]),
    h('p', { class: 'muted' }, 'Everything here is guidance — always confirm prices, hours, service times and safety with the primary source or locally before you rely on them.'),
  ])));

  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Suggest a feature or a correction'),
    h('p', { class: 'muted' }, 'Spotted something out of date, or want a feature added? Send it over — it helps make the guide better for everyone.'),
    h('button', { class: 'btn block', onclick: () => go('#feedback') }, '✍️ Send feedback'),
  ]));
  wrap.append(h('p', { class: 'disclaimer' }, `Mekonging ${APP_VERSION}. Guidance only — always confirm prices, hours and safety locally.`));
  mount(wrap, '#home');
}

// Composes a message the user sends themselves via the OS share sheet, their email
// app (mailto — recipient is optional and set in Settings), or the clipboard. Nothing
// is transmitted automatically and no personal address is baked into the app.
export function feedbackScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  const place = arg ? resolveItem(arg) : null;
  wrap.append(topbar(place ? 'Suggest an edit' : 'Send feedback', place ? `#place-${place.id}` : '#help'));
  wrap.append(screenHint(place
    ? `Suggest a correction or addition for “${place.name}”. Your message opens in your share sheet, email app, or clipboard — nothing is sent automatically.`
    : 'Tell us what to fix, add or improve. Your message opens in your share sheet, email app, or clipboard — nothing is sent automatically, and no account is needed.'));

  const card = h('div', { class: 'card' });
  let category = place ? 'correction' : 'feedback';
  card.append(field('Type', selectEl([['feedback', 'General feedback'], ['feature', 'Feature idea'], ['correction', 'Correct information']], category, (v) => { category = v; })));
  const subject = h('input', { type: 'text', placeholder: 'Short summary', value: place ? `Correction: ${place.name}` : '' });
  card.append(field('Subject', subject));
  const body = h('textarea', { class: 'ta', rows: '6', placeholder: place ? 'What should change, and what is correct?' : 'Your message…' });
  card.append(field('Message', body));
  const fromEmail = h('input', { type: 'email', placeholder: 'you@example.com', value: store.profile.contactEmail || '' });
  fromEmail.addEventListener('change', () => { store.profile.contactEmail = fromEmail.value.trim(); save(); });
  card.append(field('Your email (optional, so we can reply)', fromEmail));
  wrap.append(card);

  function compose() {
    const catLabel = { feedback: 'Feedback', feature: 'Feature idea', correction: 'Correction' }[category] || 'Feedback';
    const text = [
      body.value.trim(), '',
      '— sent from Mekonging —',
      `Type: ${catLabel}`,
      place ? `Place: ${place.name} (${place.id})` : null,
      fromEmail.value.trim() ? `Reply-to: ${fromEmail.value.trim()}` : null,
      `App: ${APP_VERSION}`,
      // Anything the app caught since this device last cleared it. Attached automatically
      // because the traveller cannot be expected to have written down an error they saw
      // three screens ago — and without it, "it stopped working" is unactionable.
      ...(recentErrors().length
        ? ['', 'Recent errors:', ...recentErrors().slice(0, 5).map((e) => `  ${new Date(e.at).toISOString()} ${e.kind} ${e.hash} — ${e.msg}`)]
        : []),
    ].filter((x) => x != null).join('\n');
    return { subject: `[Mekonging] ${catLabel}${subject.value.trim() ? ': ' + subject.value.trim() : ''}`, text };
  }
  const status = h('p', { class: 'muted' });
  const actions = h('div', { class: 'card' });
  if (typeof navigator !== 'undefined' && navigator.share) {
    actions.append(h('button', { class: 'btn block', onclick: async () => {
      const m = compose();
      try { await navigator.share({ title: m.subject, text: m.text }); status.textContent = 'Shared — choose where to send it.'; }
      catch { /* user cancelled */ }
    } }, '📤 Share…'));
  }
  actions.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => {
    const m = compose();
    const to = (store.profile.feedbackTo || '').trim();
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.text)}`;
    status.textContent = to ? 'Opening your email app…' : 'Opened your email app — add a recipient, or set a feedback address in Settings.';
  } }, '✉️ Email'));
  actions.append(h('button', { class: 'btn ghost block btn-spaced', onclick: async () => {
    const m = compose();
    try { await navigator.clipboard.writeText(`${m.subject}\n\n${m.text}`); status.textContent = 'Copied to clipboard — paste it wherever you like.'; }
    catch { status.textContent = 'Could not copy automatically — select your message and copy it.'; }
  } }, '📋 Copy'));
  actions.append(status);
  wrap.append(actions);
  mount(wrap, place ? `#place-${place.id}` : '#help');
}
