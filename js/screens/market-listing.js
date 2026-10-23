// One shared-Market listing: #market-l-<id> (docs/EXCHANGE.md §11 and §17, slice M4b-1).
//
// The hero artwork (photos arrive with M4c), the price, the detail chips, the body, the kind's
// safety line, "A traveller · member since <month>", and app links only: the city's places, the
// country's scams, and the page that fits the kind (§16, ruling 2: travellers cannot link out).
// Report sits in the ⋯ menu. Message is shown with an honest line until M5 brings messages; Block
// arrives with M5 too, so it is not drawn here at all (no dead controls).
//
// Every gate renders something: data off, no connection, closed beta, gone, an error.
// The listing is held in memory for this page only (§2), and its text is rendered as text.

import { h } from '../util.js';
import { netMode, setNetMode, online } from '../ui-widgets.js';
import { go, mount, topbar, render, shareButton } from '../main.js';
import { marketSession } from '../market-api.js';
import { getListing, reportListing, listingErrorText, isListingId, REPORT_REASONS } from '../market-listings.js';
import { artKey, artNode } from '../market-art.js';
import {
  ensureMarketStyles, marketStylesReady, KIND_META, REPORT_LABEL, cityName, cityCountry, countryName, placeText,
  windowText, monthText, agoText, priceText, detailChips, personal, icon, openSheet, setReturn, takeResume, signInSheet,
} from './market-parts.js';

// One flight per id, shared by the double render at start-up.
let flight = null;   // { id, promise }
function load(id) {
  if (flight && flight.id === id) return flight.promise;
  const promise = getListing(id);
  flight = { id, promise };
  const clear = () => { if (flight && flight.id === id) flight = null; };
  promise.then(clear, clear);
  return promise;
}

const backToMarket = () => h('button', { class: 'btn ghost block', type: 'button', onclick: () => go('#market') }, 'Back to the market');

function gateCard(title, text, kids) {
  return h('div', { class: 'card mx-gate' }, [h('div', { class: 'stripe-crown', 'aria-hidden': 'true' }), h('h2', {}, title), h('p', {}, text), ...kids]);
}

// The app's own pages that help with this listing (§16, ruling 2).
function appLinks(l) {
  const cc = cityCountry(l.city);
  const name = cityName(l.city);
  const links = [];
  if (name) links.push([`#places-${l.city}`, `Places in ${name}`, 'Sights, food and stays nearby']);
  if (l.kind === 'ride') links.push([`#transport-${cc}`, 'Getting around', 'Buses, trains and boats on this route']);
  if (l.kind === 'item') links.push([`#prices-${cc}`, 'Fair prices', 'What things cost locally']);
  if (l.kind === 'meetup') links.push([`#today-${cc}`, 'Things to do', 'Picks for the weather and the hour']);
  if (l.kind === 'room') links.push([`#arrival-${cc}`, 'Just arrived', 'Cash, SIM and getting into town']);
  links.push([`#scams-${cc}`, `Common scams in ${countryName(cc)}`, 'The ones that actually happen']);
  links.push([`#sos-${cc}`, 'Emergency help', 'Who to call, and the nearest hospital']);
  return h('section', { class: 'mxl-links', 'data-nofold': '' }, [
    h('h2', { class: 'mxh-h' }, 'In the app'),
    h('div', { class: 'mxl-link-list' }, links.map(([href, label, sub]) => h('a', { class: 'mxl-link', href }, [
      h('span', { class: 'mxl-link-text' }, [h('span', { class: 'mxl-link-label' }, label), h('span', { class: 'mxl-link-sub' }, sub)]),
      icon('arrow'),
    ]))),
  ]);
}

// ---- report ----------------------------------------------------------------------------------------
function reportSheet(l) {
  let reason = '';
  const err = h('p', { class: 'mx-err', role: 'alert' });
  const note = h('textarea', { class: 'mxr-note', name: 'note', rows: '3', maxlength: '300', 'aria-label': 'Anything to add (optional)', placeholder: 'Anything to add (optional)' });
  const send = h('button', { class: 'btn', type: 'submit' }, 'Send report');
  const list = h('div', { class: 'mxr-reasons', role: 'radiogroup', 'aria-label': 'Reason' }, REPORT_REASONS.map((r) => {
    const box = h('input', { type: 'radio', name: 'reason', value: r, onchange: () => { reason = r; err.textContent = ''; } });
    return h('label', { class: 'mx-tick' }, [box, h('span', {}, REPORT_LABEL[r] || r)]);
  }));
  const form = h('form', {
    class: 'mxr-form', novalidate: '',
    onsubmit: (e) => {
      e.preventDefault();
      if (!reason) { err.textContent = 'Pick a reason.'; return; }
      send.disabled = true;
      send.textContent = 'Sending…';
      reportListing(l.id, reason, note.value.trim()).then(() => {
        s.sheet.replaceChildren(h('div', { class: 'mx-grip', 'aria-hidden': 'true' }),
          h('h3', {}, 'Thank you'),
          h('p', {}, 'Your report is in. Listings that several travellers report are hidden for review.'),
          h('div', { class: 'mx-sheet-actions' }, [h('button', { class: 'btn', type: 'button', onclick: () => s.close() }, 'Done')]));
        const done = s.sheet.querySelector('button');
        if (done) done.focus();
      }, (e2) => {
        if (e2 && e2.code === 'signed_out') { s.close(); signInSheet('report', `#market-l-${l.id}`); return; }
        err.textContent = listingErrorText(e2);
        send.disabled = false;
        send.textContent = 'Send report';
      });
    },
  }, [
    h('h3', {}, 'Report this listing'),
    h('p', { class: 'muted' }, 'What is wrong with it? The traveller is not told who reported.'),
    list, note, err,
    h('div', { class: 'mx-sheet-actions' }, [h('button', { class: 'btn ghost', type: 'button', onclick: () => s.close() }, 'Cancel'), send]),
  ]);
  const s = openSheet('Report this listing', [form], 'mxr');
  return s;
}

function startReport(l) {
  if (!marketSession()) { signInSheet('report', `#market-l-${l.id}`); return; }
  reportSheet(l);
}

// The ⋯ menu: share, and report (or, on the traveller's own listing, a note instead).
function moreMenu(l) {
  const url = `${location.origin}${location.pathname}#market-l-${l.id}`;
  const kids = [h('h3', {}, 'Listing')];
  kids.push(shareButton('Share this listing', 'Mekonging Market', () => url, 'btn ghost block mxl-menu-btn'));
  if (l.mine) kids.push(h('p', { class: 'muted' }, 'This is your listing. Close or delete it under My listings, coming in the next update.'));
  else kids.push(h('button', { class: 'btn ghost block mxl-menu-btn danger-outline', type: 'button', 'data-act': 'report', onclick: () => { s.close(); startReport(l); } }, 'Report this listing'));
  kids.push(h('button', { class: 'btn ghost block mxl-menu-btn', type: 'button', onclick: () => s.close() }, 'Cancel'));
  const s = openSheet('Listing', [h('div', { class: 'mxl-menu' }, kids)], 'mxm');
}

function messageSoon() {
  const s = openSheet('Message', [
    h('h3', {}, 'Messages are coming'),
    h('p', {}, 'Writing to a traveller arrives in a coming update, with blocking and alerts. Your email and the traveller’s stay private.'),
    h('div', { class: 'mx-sheet-actions' }, [h('button', { class: 'btn', type: 'button', onclick: () => s.close() }, 'OK')]),
  ], 'mxmsg');
}

// ---- the page --------------------------------------------------------------------------------------
function page(body, l) {
  const kind = KIND_META[l.kind] ? l.kind : 'item';
  const meta = KIND_META[kind];
  const hero = artNode(artKey(l), kind, 'mxl-hero');
  const more = h('button', { class: 'mxl-more', type: 'button', 'aria-label': 'More: share or report', onclick: () => moreMenu(l) }, icon('more'));
  const head = h('div', { class: 'mxl-head', 'data-kind': kind }, [
    h('div', { class: 'mxl-price-row' }, [
      h('p', { class: 'mxl-price' + (l.price_amount === 0 ? ' is-free' : '') }, priceText(l)),
      more,
    ]),
    personal('h2', 'mxl-title', l.title),
    h('p', { class: 'mxl-where' }, [icon('pin'), h('span', {}, placeText(l)), h('span', { class: 'mxl-dot', 'aria-hidden': 'true' }, '·'), h('span', {}, windowText(l))]),
    h('div', { class: 'mxl-chips' }, [h('span', { class: 'mxl-chip mxl-chip-kind' }, meta.one), ...detailChips(l).map((t) => h('span', { class: 'mxl-chip' }, t))]),
  ]);
  const kids = [hero, head];
  if (l.body) kids.push(personal('p', 'mxl-text', l.body));
  const since = monthText(l.member_since);
  kids.push(h('div', { class: 'mxl-who' }, [
    h('span', { class: 'mxl-avatar', 'aria-hidden': 'true' }, icon('person')),
    h('div', {}, [
      h('p', { class: 'mxl-who-name' }, since ? `A traveller · member since ${since}` : 'A traveller'),
      h('p', { class: 'muted' }, `Posted ${agoText(l.created_at)}`),
    ]),
  ]));
  if (!l.mine) {
    kids.push(h('div', { class: 'mxl-act' }, [
      h('button', { class: 'btn ghost block mxl-msg', type: 'button', onclick: messageSoon }, [icon('chat'), h('span', {}, 'Message')]),
      h('p', { class: 'muted mxl-msg-note' }, 'Messages open in a coming update.'),
    ]));
  } else {
    kids.push(h('p', { class: 'mx-pill mxl-mine' }, l.status === 'open' ? 'Your listing' : `Your listing · ${l.status === 'hidden' ? 'under review' : l.status}`));
  }
  kids.push(h('div', { class: 'mxl-safety' }, [icon('shield'), h('p', {}, meta.safety)]));
  kids.push(appLinks(l));
  body.replaceChildren(...kids);
  // Back from sign-in to finish what the traveller started here.
  if (takeResume(location.hash) === 'report' && marketSession() && !l.mine) reportSheet(l);
}

async function paint(body, id) {
  if (netMode() === 'offline') {
    body.replaceChildren(gateCard('Shared market', 'You have data switched off, so this listing cannot load. The board on this phone still works.', [
      h('button', { class: 'btn block', type: 'button', onclick: () => { setNetMode('online'); render(); } }, 'Turn data back on'), backToMarket()]));
    return;
  }
  if (!online()) {
    body.replaceChildren(gateCard('The shared market needs internet.', 'No connection right now.', [
      h('button', { class: 'btn block', type: 'button', onclick: () => render() }, 'Try again'), backToMarket()]));
    return;
  }
  if (!isListingId(id)) { body.replaceChildren(gateCard('Listing not found', 'That listing is no longer there.', [backToMarket()])); return; }
  body.replaceChildren(h('div', { class: 'mxl-skel', 'aria-busy': 'true' }, [
    h('span', { class: 'mxl-hero mx-shimmer' }),
    h('span', { class: 'mx-bar mx-shimmer w40' }), h('span', { class: 'mx-bar mx-shimmer w90' }), h('span', { class: 'mx-bar mx-shimmer w60' }),
  ]));
  let l;
  try { l = await load(id); } catch (e) {
    if (!body.isConnected) return;
    if (e && e.code === 'market_closed') {
      const kids = [];
      if (!marketSession()) kids.push(h('button', { class: 'btn block', type: 'button', onclick: () => { setReturn(location.hash); go('#market-signin'); } }, 'Tester? Sign in'));
      kids.push(backToMarket());
      body.replaceChildren(gateCard('Closed beta', 'The shared market is open to invited testers for now. It opens to everyone later.', kids));
      return;
    }
    if (e && (e.code === 'offline' || e.code === 'network')) {
      body.replaceChildren(gateCard('The shared market needs internet.', listingErrorText(e), [
        h('button', { class: 'btn block', type: 'button', onclick: () => render() }, 'Try again'), backToMarket()]));
      return;
    }
    body.replaceChildren(gateCard('Shared market', listingErrorText(e), [h('button', { class: 'btn block', type: 'button', onclick: () => render() }, 'Try again'), backToMarket()]));
    return;
  }
  if (!body.isConnected) return;   // a newer render owns the screen
  if (!l) { body.replaceChildren(gateCard('Listing not found', 'That listing has ended, closed or was taken down.', [backToMarket()])); return; }
  const title = body.parentElement && body.parentElement.querySelector('.topbar h1');
  if (title && KIND_META[l.kind]) title.textContent = KIND_META[l.kind].one;
  page(body, l);
}

export function marketListingScreen(id) {
  if (!marketStylesReady()) {
    const at = location.hash;
    ensureMarketStyles().then(() => { if (location.hash === at) marketListingScreen(id); });
    return;
  }
  const wrap = h('div', { class: 'screen mxl', 'data-nofold': '' });
  wrap.append(topbar('Listing', '#market'));
  const body = h('div', { class: 'mxl-body', 'data-nofold': '', 'aria-live': 'polite' });
  wrap.append(body);
  mount(wrap, '#market');
  paint(body, id);
}
