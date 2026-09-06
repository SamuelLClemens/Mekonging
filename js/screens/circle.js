// The Travel Circle — connect, share and message other travellers with no account and no
// server. Contact cards, shared places/lists/trips, and message threads all travel as encoded
// URLs (js/social.js) that the traveller passes along themselves, by whatever means they
// already use. Nothing is uploaded and there is nothing to sign in to.
//
// EVERYTHING DECODED FROM A LINK IS UNTRUSTED and is rendered as text only. That rule is the
// reason this feature can exist at all, and it does not relax because the code moved file.
//
// Extracted from main.js as a lazy, route-scoped screen module (#circle, #contact, #in,
// #inbox, #thread, #msg). shareButton did NOT come with it: it is a shared widget with three
// callers elsewhere in main.js, so it stays there and is imported back. Nor did the bulletin
// board helpers bbCat/bbHeadline/bbSubline — the board screen still uses them, and the circle
// screens render a preview of a shared listing with the same dictionary.
import { h } from '../util.js';
import { store, getPin, ensureMe, setMe, getContacts, getContact, addContact, removeContact,
  getInbox, addInboxItem, deleteInboxItem, markInboxRead, getThread, addMessage, markThreadRead,
  unreadThreadCount, addBoardPost, addJellyReport, addListing, addStop, createCollection,
  toggleFavorite, togglePlaceInCollection, todayKey, getListings } from '../state.js';
import { field, confirmAction } from '../ui-widgets.js';
import { getPlace, getBoard, getCountry } from '../data/regions.js';
import { encodeCard, parseCard, parseShare, encodeMessage, parseMessage, shareUrl } from '../social.js';
import { SEV_LABEL, addPlaceSecret, fmtReportDate } from '../place-ui.js';
// bbCat/bbHeadline/bbSubline/swapCalcNodes render a preview of a shared bulletin-board
// listing. They belong to the board screen, which still uses them, so they stay in main.js
// and are imported back rather than duplicated here.
import { go, mount, topbar, shareButton, bbCat, bbHeadline, bbSubline, swapCalcNodes } from '../main.js';

// No account, no server: a user's traveller card and (later) messages travel
// only inside links they choose to share. Imported contact fields are UNTRUSTED
// and are rendered exclusively as text children (never innerHTML).
function avatarChip(av) { return h('span', { class: 'avatar', 'aria-hidden': 'true' }, av || '🧭'); }

function contactRow(c, actionEl) {
  return h('div', { class: 'row-between contact-row' }, [
    h('div', { class: 'contact-id' }, [
      avatarChip(c.avatar),
      h('div', {}, [h('strong', {}, c.name || 'Traveller'), c.bio ? h('div', { class: 'tiny muted' }, c.bio) : null]),
    ]),
    actionEl || null,
  ]);
}

// Own-card render mode: false = the saved card as a read-only summary (matches how
// every OTHER contact's card renders via contactRow), true = the editable form.
// Module state, not a route — Save/Edit/Cancel just flip this and re-render #circle
// in place, same pattern as editWithdrawalId. Fixes a real bug: this used to always
// render the raw inputs, pre-filled from the just-saved values, so tapping "Save
// card" appeared to do nothing (the form you were still looking at never changed).
let editingMyCard = false;

export function circleScreen() {
  const me = ensureMe();
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travel circle', '#home'));
  wrap.append(h('p', { class: 'muted' },
    'Connect with other travellers — no account, no server. Your card and messages travel only inside links you choose to share; nothing is uploaded and nothing leaves this device on its own.'));
  wrap.append(h('button', { class: 'btn ghost block', onclick: () => go('#inbox') }, `📥 Shared with you (${getInbox().length})`));

  // --- traveller board (peer bulletin board; on-device, shared by link) ---
  const nListings = getListings().length;
  wrap.append(h('div', { class: 'card' }, [
    h('h2', {}, 'Traveller board'),
    h('p', { class: 'muted' }, 'Swap cash, split a ride, pass on a room, hand off a car seat, a bike or camping kit. On-device; a listing travels only inside a link you share.'),
    h('button', { class: 'btn ghost block', onclick: () => go('#exchange') }, `🧭 Open the board${nListings ? ` (${nListings})` : ''}`),
  ]));

  // --- your card: read-only summary once saved, editable form on request ---
  const cardBox = h('div', { class: 'card' });
  if (editingMyCard || !me.name) {
    const nameIn = h('input', { type: 'text', maxlength: '40', placeholder: 'Display name (e.g. Sam)', 'aria-label': 'Your display name', value: me.name || '' });
    const avIn = h('input', { type: 'text', maxlength: '4', 'aria-label': 'Your emoji', value: me.avatar || '🧭', style: 'width:64px; text-align:center' });
    const bioIn = h('textarea', { class: 'ta', maxlength: '160', rows: '2', placeholder: 'One line about you (optional)' }, me.bio || '');
    cardBox.append(
      h('h2', {}, 'Your traveller card'),
      h('div', { class: 'field' }, [h('label', {}, 'Emoji & name'), h('div', { style: 'display:flex; gap:8px' }, [avIn, nameIn])]),
      field('Short bio', bioIn),
      h('div', { class: 'row-between', style: 'margin-top:6px' }, [
        me.name ? h('button', { class: 'btn ghost', onclick: () => { editingMyCard = false; go('#circle'); } }, 'Cancel') : h('span', {}),
        h('button', { class: 'btn', onclick: () => { setMe({ name: nameIn.value, avatar: avIn.value, bio: bioIn.value }); editingMyCard = false; go('#circle'); } }, 'Save card'),
      ]),
    );
  } else {
    cardBox.append(
      h('h2', {}, 'Your traveller card'),
      contactRow(me, h('button', { class: 'chip', 'aria-label': 'Edit your traveller card', onclick: () => { editingMyCard = true; go('#circle'); } }, '✎ Edit')),
    );
  }
  wrap.append(cardBox);

  // --- invite a friend (share your card) ---
  // Every path here hands off to an app the traveller already has (WhatsApp, Messages, or
  // the OS share sheet) with the invite link pre-filled — never sent automatically, the
  // traveller still taps send themselves. No account, no server: the link IS the invite.
  const status = h('p', { class: 'muted' });
  const buildUrl = () => shareUrl('add', encodeCard(ensureMe()));
  const inviteMsg = () => `Join me on Mekonging — a free, offline travel app for Thailand, Vietnam, Cambodia & Laos. Add me: ${buildUrl()}`;
  const shareCard = h('div', { class: 'card' });
  shareCard.append(h('h2', {}, '➕ Invite a friend'));
  shareCard.append(h('p', { class: 'muted' }, 'Send this to another traveller. When they open it, you are added to each other’s circle. On a phone, “Share” can send it over AirDrop or Nearby Share with no internet at all.'));

  // WhatsApp — wa.me with no number opens WhatsApp's OWN "choose a chat" picker (exactly
  // like tapping New chat inside WhatsApp), so picking who to invite is entirely WhatsApp's
  // native contact list, not anything this app can or does see.
  shareCard.append(h('button', { class: 'btn block', onclick: () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMsg())}`, '_blank', 'noopener');
  } }, '💬 Invite via WhatsApp'));

  // Phone contacts — Contact Picker API (Chrome/Android; feature-detected, most other
  // browsers simply never show this button). Each tap is a one-off native picker the
  // traveller explicitly opens and chooses from — no standing access, nothing auto-read.
  const contactPickerOk = typeof navigator !== 'undefined' && 'contacts' in navigator
    && typeof window !== 'undefined' && 'ContactsManager' in window;
  if (contactPickerOk) {
    const pickedBox = h('div', {});
    shareCard.append(h('button', { class: 'btn ghost block btn-spaced', onclick: async () => {
      let picked;
      try { picked = await navigator.contacts.select(['name', 'tel'], { multiple: true }); }
      catch { return; } // cancelled, or the browser/user denied the picker
      pickedBox.replaceChildren();
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      (picked || []).forEach((p) => {
        const nm = (p.name && p.name[0]) || 'Contact';
        const tel = (p.tel && p.tel[0]) || '';
        if (!tel) return;
        const digits = tel.replace(/[^\d]/g, '');
        const smsUrl = `sms:+${digits}${isIOS ? '&' : '?'}body=${encodeURIComponent(inviteMsg())}`;
        pickedBox.append(h('div', { class: 'row-between', style: 'margin-top:6px' }, [
          h('span', {}, nm),
          h('div', { class: 'cats' }, [
            h('button', { class: 'chip', onclick: () => window.open(`https://wa.me/${digits}?text=${encodeURIComponent(inviteMsg())}`, '_blank', 'noopener') }, '💬 WhatsApp'),
            h('button', { class: 'chip', onclick: () => { window.location.href = smsUrl; } }, '✉️ SMS'),
          ]),
        ]));
      });
      if (!pickedBox.children.length) pickedBox.append(h('p', { class: 'tiny muted' }, 'No phone number on that contact.'));
    } }, '📇 Invite from phone contacts'));
    shareCard.append(pickedBox);
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    shareCard.append(h('button', { class: 'btn ghost block btn-spaced', onclick: async () => {
      try { await navigator.share({ title: 'Add me on Mekonging', text: `${ensureMe().name || 'A traveller'} on Mekonging`, url: buildUrl() }); status.textContent = 'Shared — they can open it to connect.'; }
      catch { /* cancelled */ }
    } }, '📤 Share my card…'));
  }
  shareCard.append(h('button', { class: 'btn ghost block btn-spaced', onclick: async () => {
    try { await navigator.clipboard.writeText(buildUrl()); status.textContent = 'Link copied — paste it to a friend.'; }
    catch { status.textContent = 'Could not copy automatically — select the link below to copy it.'; }
  } }, '🔗 Copy my link'));
  shareCard.append(h('p', { class: 'tiny muted', style: 'word-break:break-all; margin-top:8px' }, buildUrl()));
  shareCard.append(status);
  wrap.append(shareCard);

  // --- your circle ---
  const contacts = getContacts();
  const listCard = h('div', { class: 'card' });
  listCard.append(h('h2', {}, `Your circle (${contacts.length})`));
  if (!contacts.length) {
    listCard.append(h('p', { class: 'muted' }, 'No one yet. Share your card, or open a friend’s link to add them.'));
  } else {
    contacts.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach((c) => {
      const cUnread = unreadThreadCount(c.userId);
      listCard.append(contactRow(c, h('div', { class: 'cats' }, [
        h('button', { class: 'chip' + (cUnread ? ' budget-red' : ''), onclick: () => go('#thread-' + c.userId) }, cUnread ? `💬 ${cUnread} new` : '💬 Message'),
        h('button', { class: 'chip', 'aria-label': `Remove ${c.name || 'this contact'} from your circle`, onclick: () => { confirmAction({ title: 'Remove contact?', body: `Remove ${c.name || 'this contact'} from your circle?`, confirmLabel: 'Remove', danger: true }).then((ok) => { if (ok) { removeContact(c.userId); go('#circle'); } }); } }, '✕'),
      ])));
    });
  }
  wrap.append(listCard);

  mount(wrap, '#circle');
}

export function addContactScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Add to circle', '#circle'));
  const card = parseCard(arg);
  if (!card) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This link could not be read'),
      h('p', { class: 'muted' }, 'The traveller-card link looks invalid or was cut off in transit. Ask them to share it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle');
    return;
  }
  const me = ensureMe();
  const isSelf = card.userId === me.userId;
  const existing = getContact(card.userId);
  const box = h('div', { class: 'card' });
  box.append(contactRow(card));
  const status = h('p', { class: 'muted' });
  if (isSelf) {
    box.append(h('p', { class: 'muted', style: 'margin-top:8px' }, 'This is your own card.'));
    box.append(h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'));
  } else {
    box.append(h('p', { class: 'muted', style: 'margin-top:8px' }, existing ? `${card.name} is already in your circle — you can refresh their card.` : `Add ${card.name} to your travel circle?`));
    box.append(h('button', { class: 'btn block', onclick: () => { const r = addContact(card); if (r.ok) go('#circle'); else status.textContent = 'Could not add this contact.'; } }, existing ? 'Refresh their card' : `Add ${card.name}`));
    box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#circle') }, 'Not now'));
  }
  box.append(status);
  wrap.append(box);
  wrap.append(h('p', { class: 'tiny muted' }, 'Adding a contact only stores their card on your device. Nothing is sent anywhere.'));
  mount(wrap, '#circle');
}

// Import screen for a shared place / list / trip (#in-<payload>). All decoded
// fields are UNTRUSTED and rendered only as text.
export function importShareScreen(arg) {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Shared with you', '#circle'));
  const s = parseShare(arg);
  if (!s) {
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This shared link could not be read'),
      h('p', { class: 'muted' }, 'It may be invalid or was cut off in transit. Ask the sender to share it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle'); return;
  }
  // Save to the inbox once (dedupe on identical content so re-opening the link
  // does not pile up duplicates).
  const sig = `${s.kind}|${s.from ? s.from.userId : ''}|${JSON.stringify(s.data)}`;
  if (!getInbox().some((x) => `${x.kind}|${x.from ? x.from.userId : ''}|${JSON.stringify(x.data)}` === sig)) {
    addInboxItem({ from: s.from, kind: s.kind, data: s.data, msg: s.msg });
  }

  const box = h('div', { class: 'card' });
  if (s.from) box.append(contactRow(s.from));
  if (s.msg) box.append(h('p', { style: 'margin-top:6px' }, s.msg));
  if (s.kind === 'place') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, s.data.name));
    box.append(h('p', { class: 'muted' }, exists ? 'A place they recommend.' : 'A place they recommend — not in your guide, so search for it by name.'));
    if (exists) box.append(h('button', { class: 'btn block', onclick: () => go(`#place-${s.data.id}`) }, 'Open this place'));
    box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: (e) => { toggleFavorite(s.data.id); e.currentTarget.textContent = '✓ Saved to favourites'; } }, '⭐ Save to favourites'));
  } else if (s.kind === 'collection') {
    box.append(h('h2', { style: 'margin-top:8px' }, s.data.name));
    box.append(h('p', { class: 'muted' }, `${s.data.items.length} place${s.data.items.length === 1 ? '' : 's'} in this list.`));
    box.append(h('ul', {}, s.data.items.slice(0, 40).map((it) => h('li', {}, it.name || it.id))));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      const c = createCollection(s.data.name || 'Shared list', '📥');
      let n = 0; s.data.items.forEach((it) => { if (getPlace(it.id)) { togglePlaceInCollection(c.id, it.id); n++; } });
      e.currentTarget.textContent = `✓ Saved (${n} in your guide)`;
    } }, '＋ Save as a collection'));
  } else if (s.kind === 'trip') {
    box.append(h('h2', { style: 'margin-top:8px' }, 'A shared trip'));
    box.append(h('ol', {}, s.data.stops.slice(0, 40).map((st) => h('li', {}, st.title + (st.date ? ` — ${st.date}` : '')))));
    box.append(h('button', { class: 'btn block', onclick: (e) => { s.data.stops.forEach((st) => addStop({ title: st.title, country: st.country, date: st.date, endDate: st.endDate })); e.currentTarget.textContent = '✓ Added to my trip'; } }, '＋ Add these stops to my trip'));
  } else if (s.kind === 'tip') {
    box.append(h('h2', { style: 'margin-top:8px' }, `Local tip — ${s.data.city}`));
    box.append(h('p', {}, s.data.text));
    const board = getBoard(s.data.cc, s.data.city.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      const key = board ? `${board.country}-${board.slug}` : `${s.data.cc || 'xx'}-${s.data.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      addBoardPost(key, { topic: s.data.topic, text: `${s.from ? s.from.name + ': ' : ''}${s.data.text}` });
      e.currentTarget.textContent = '✓ Pinned to your board';
    } }, '📌 Pin to my noticeboard'));
    if (board) box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#board-${board.country}-${board.slug}`) }, `📋 Open the ${board.city} board`));
  } else if (s.kind === 'jelly') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, `🪼 Jellyfish sighting — ${s.data.name}`));
    box.append(h('p', {}, `${SEV_LABEL[s.data.sev] || SEV_LABEL.seen}${s.data.note ? ` — ${s.data.note}` : ''}${s.data.d ? ` · ${fmtReportDate(s.data.d)}` : ''}`));
    box.append(h('button', { class: 'btn block', onclick: (e) => {
      addJellyReport(s.data.id, { d: s.data.d || todayKey(), sev: s.data.sev || 'seen', note: s.data.note || '', by: s.from ? s.from.name : 'a traveller' });
      e.currentTarget.textContent = '✓ Added to this beach';
    } }, '＋ Add this sighting to the beach'));
    if (exists) box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#place-${s.data.id}`) }, 'Open this beach'));
    else box.append(h('p', { class: 'muted', style: 'margin-top:6px' }, 'This beach is not in your guide, so the sighting cannot be pinned to it.'));
  } else if (s.kind === 'secret') {
    const exists = getPlace(s.data.id);
    box.append(h('h2', { style: 'margin-top:8px' }, `🔑 Local secret — ${s.data.name}`));
    box.append(h('p', {}, s.data.text));
    if (s.data.by) box.append(h('p', { class: 'tiny muted' }, `Shared by ${s.data.by}`));
    if (exists) {
      box.append(h('button', { class: 'btn block', onclick: (e) => { addPlaceSecret(s.data.id, { text: s.data.text, by: s.data.by || (s.from ? s.from.name : 'a traveller') }); e.currentTarget.textContent = '✓ Saved to this place'; } }, '＋ Save this secret to the place'));
      box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go(`#place-${s.data.id}`) }, 'Open this place'));
    } else {
      box.append(h('p', { class: 'muted', style: 'margin-top:6px' }, 'This place is not in your guide, so the secret cannot be pinned to it.'));
    }
  } else if (s.kind === 'bb') {
    const d = s.data; const cat = d.cat || 'other'; const meta = bbCat(cat);
    box.append(h('h2', { style: 'margin-top:8px' }, `${meta.emoji} ${bbHeadline(cat, d)}`));
    if (cat === 'swap') box.append(h('p', { class: 'muted small' }, swapCalcNodes((d.have && d.have.a) || 0, d.have && d.have.c, d.want && d.want.c)));
    else { const sub = bbSubline(cat, d); if (sub) box.append(h('p', { class: 'small', style: 'font-weight:700' }, sub)); }
    const line = [meta.label, d.city].filter(Boolean).join(' · ');
    if (line) box.append(h('p', { class: 'tiny muted' }, line));
    if (d.note) box.append(h('p', { style: 'margin-top:6px' }, d.note));
    if (d.contact) box.append(h('p', { class: 'small' }, `Reach: ${d.contact}`));
    box.append(h('button', { class: 'btn block btn-spaced', onclick: (e) => { addListing({ cat, mine: false, from: s.from, data: d }); e.currentTarget.textContent = '✓ Saved to your board'; } }, '＋ Save to my board'));
    box.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#exchange-' + cat) }, 'Open the traveller board'));
  }
  wrap.append(box);

  if (s.from) {
    const already = getContact(s.from.userId);
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, already ? `${s.from.name} is in your circle.` : `Add ${s.from.name} to your circle so you can share back?`),
      already ? null : h('button', { class: 'btn ghost block', onclick: (e) => { addContact(s.from); e.currentTarget.textContent = '✓ Added to your circle'; } }, `Add ${s.from.name}`),
    ]));
  }
  wrap.append(h('button', { class: 'btn ghost block btn-spaced', onclick: () => go('#inbox') }, '📥 See everything shared with you'));
  mount(wrap, '#circle');
}

export function inboxScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Shared with you', '#circle'));
  const items = getInbox();
  if (!items.length) {
    wrap.append(h('div', { class: 'card' }, [h('p', { class: 'muted' }, 'Nothing yet. When a friend shares a place, list or trip with you, it lands here.')]));
    mount(wrap, '#circle'); return;
  }
  const KIND = { place: '📍 Place', collection: '⭐ List', trip: '🧳 Trip', tip: '💡 Local tip', jelly: '🪼 Sighting', secret: '🔑 Secret', bb: '🧭 Board' };
  // Until now nothing ever cleared `read`, so the Travel circle badge counted every item
  // the traveller had ever received and the only way to make it go down was to delete the
  // item. An item is marked read when it is opened or acted on (below); this clears the
  // backlog in one tap for someone who has already seen them.
  if (items.some((it) => !it.read)) {
    wrap.append(h('button', { class: 'btn ghost block inbox-markall',
      onclick: () => { items.forEach((it) => markInboxRead(it.id)); go('#inbox'); } }, '✓ Mark all as read'));
  }
  items.forEach((it) => {
    const title = it.kind === 'place' ? (it.data.name || 'A place')
      : it.kind === 'collection' ? (it.data.name || 'A list')
      : it.kind === 'tip' ? `Tip — ${it.data.city || 'a city'}`
      : it.kind === 'jelly' ? `🪼 Jellyfish — ${it.data.name || 'a beach'}`
      : it.kind === 'secret' ? `🔑 ${it.data.name || 'a place'}`
      : it.kind === 'bb' ? `${bbCat(it.data.cat).emoji} ${bbHeadline(it.data.cat || 'other', it.data)}`
      : 'A trip';
    const unreadDot = it.read ? null : h('span', { class: 'inbox-dot', 'aria-label': 'Unread' }, '●');
    // Everything below the header row is conditional on the item's kind, and each carried its
    // own margin-top:6px against a header that contributed none. stack-2 gives one 8px step.
    const card = h('div', { class: 'card stack-2' + (it.read ? '' : ' inbox-unread') }, [
      h('div', { class: 'row-between' }, [
        h('div', {}, [h('strong', {}, [unreadDot, title]), h('div', { class: 'tiny muted' }, `${KIND[it.kind] || it.kind}${it.from ? ' · from ' + it.from.name : ''} · ${it.at}`)]),
        h('button', { class: 'chip', 'aria-label': 'Remove', onclick: () => { deleteInboxItem(it.id); go('#inbox'); } }, '✕'),
      ]),
      it.msg ? h('p', {}, it.msg) : null,
      (it.kind === 'place' && getPlace(it.data.id)) ? h('button', { class: 'btn ghost block', onclick: () => go(`#place-${it.data.id}`) }, 'Open place') : null,
      (it.kind === 'trip') ? h('button', { class: 'btn ghost block', onclick: (e) => { (it.data.stops || []).forEach((st) => addStop({ title: st.title, country: st.country, date: st.date, endDate: st.endDate })); e.currentTarget.textContent = '✓ Added to my trip'; } }, 'Add stops to my trip') : null,
      (it.kind === 'collection') ? h('button', { class: 'btn ghost block', onclick: (e) => { const c = createCollection(it.data.name || 'Shared list', '📥'); let n = 0; (it.data.items || []).forEach((x) => { if (getPlace(x.id)) { togglePlaceInCollection(c.id, x.id); n++; } }); e.currentTarget.textContent = `✓ Saved (${n})`; } }, 'Save as a collection') : null,
      (it.kind === 'tip') ? h('p', {}, it.data.text || '') : null,
      (it.kind === 'tip') ? h('button', { class: 'btn ghost block', onclick: (e) => {
        const slug = String(it.data.city || 'a-city').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        addBoardPost(`${it.data.cc || 'xx'}-${slug}`, { topic: it.data.topic, text: `${it.from ? it.from.name + ': ' : ''}${it.data.text}` });
        e.currentTarget.textContent = '✓ Pinned';
      } }, '📌 Pin to my noticeboard') : null,
      (it.kind === 'jelly') ? h('p', {}, `${SEV_LABEL[it.data.sev] || SEV_LABEL.seen}${it.data.note ? ` — ${it.data.note}` : ''}${it.data.d ? ` · ${fmtReportDate(it.data.d)}` : ''}`) : null,
      (it.kind === 'jelly' && getPlace(it.data.id)) ? h('button', { class: 'btn ghost block', onclick: (e) => {
        addJellyReport(it.data.id, { d: it.data.d || todayKey(), sev: it.data.sev || 'seen', note: it.data.note || '', by: it.from ? it.from.name : 'a traveller' });
        e.currentTarget.textContent = '✓ Added to the beach';
      } }, '＋ Add to the beach') : null,
    ]);
    // Marking read on view is what threadScreen does, but every inbox item shares one
    // screen, so "viewed" here would clear the whole badge the first time the traveller
    // glanced at the list. Acting on an item — opening the place, saving the list, adding
    // the stops — is the signal that this one has actually been dealt with. Handled on the
    // card so it catches every action inside it, and updated in place rather than by
    // re-rendering, which would tear down the button mid-tap.
    if (!it.read) {
      card.addEventListener('click', () => {
        if (it.read) return;
        markInboxRead(it.id);
        card.classList.remove('inbox-unread');
        if (unreadDot) unreadDot.remove();
      });
    }
    wrap.append(card);
  });
  mount(wrap, '#circle');
}

// Async message thread with one contact. "Sending" records the note locally and
// produces a link to hand over — the reply comes back as another #msg- link.
// justImported=true only for the one render importMessageScreen does immediately after
// adding a brand-new incoming message: without it, that single call would both create the
// unread message AND instantly clear it in the same synchronous pass (this screen is the
// only place a message ever gets viewed, so "just added it" and "about to mark it read"
// would otherwise always happen together and the badge could never show anything). Every
// other way of reaching this screen — the circle list's "💬 Message" chip, a direct
// #thread- reload — is a deliberate, separate visit and marks read as normal.
export function threadScreen(userId, fallbackCard, justImported = false) {
  const wrap = h('div', { class: 'screen' });
  const contact = getContact(userId) || fallbackCard || null;
  const name = contact ? contact.name : 'Traveller';
  wrap.append(topbar(name, '#circle'));
  wrap.append(h('p', { class: 'muted' }, `Messages travel as links — no server. Write a note, then hand the link to ${name} (share sheet, AirDrop, any app). They open it to receive it and reply the same way.`));
  if (contact && !getContact(userId)) {
    wrap.append(h('div', { class: 'card' }, [
      h('p', { class: 'muted' }, `${name} is not in your circle yet.`),
      h('button', { class: 'btn ghost block', onclick: (e) => { addContact(contact); e.currentTarget.textContent = '✓ Added to your circle'; } }, `Add ${name} to your circle`),
    ]));
  }
  const th = getThread(userId);
  if (!justImported) markThreadRead(userId);   // opening the thread IS reading it — clears this contact's badge
  const list = h('div', { class: 'card thread' });
  if (!th.length) list.append(h('p', { class: 'muted' }, 'No messages yet — write the first note below.'));
  else th.forEach((m) => list.append(h('div', { class: 'bubble ' + (m.from === 'me' ? 'me' : 'them') }, [
    h('span', { class: 'who' }, m.from === 'me' ? 'You' : (m.name || name)),
    m.text,
  ])));
  wrap.append(list);
  const ta = h('textarea', { class: 'ta', rows: '3', maxlength: '800', placeholder: `Write a note to ${name}…` });
  const sendBtn = h('button', { class: 'btn block', onclick: async () => {
    const text = ta.value.trim(); if (!text) return;
    addMessage(userId, { from: 'me', text });                       // recorded first, so it survives even if sharing is cancelled
    const url = shareUrl('msg', encodeMessage(ensureMe(), text));
    let handed = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) { await navigator.share({ title: `A note for ${name}`, url }); handed = true; }
      else if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(url); handed = true; }
    } catch (e) { if (e && e.name === 'AbortError') { go('#thread-' + userId); return; } }
    if (!handed) {
      // no Share or Clipboard API (older webviews): execCommand fallback, then
      // show the link as selectable text rather than failing silently.
      try { const t = h('textarea', {}); t.value = url; document.body.append(t); t.select(); handed = document.execCommand('copy'); t.remove(); } catch { /* noop */ }
    }
    if (!handed) { sendStatus.textContent = 'Could not copy automatically — select and copy this link: '; sendStatus.append(h('span', { style: 'word-break:break-all; user-select:all' }, url)); return; }
    go('#thread-' + userId);
  } }, '📤 Send (share the link)');
  const sendStatus = h('p', { class: 'tiny muted' });
  wrap.append(h('div', { class: 'card' }, [
    h('h3', {}, 'Reply'), ta, sendBtn, sendStatus,
    h('p', { class: 'tiny muted', style: 'margin-top:6px' }, 'Your note is saved to this thread and a link is created to hand to them.'),
  ]));
  mount(wrap, '#circle');
}

// Import a received message (#msg-<payload>) into its thread, then show it.
export function importMessageScreen(arg) {
  const m = parseMessage(arg);
  if (!m) {
    const wrap = h('div', { class: 'screen' });
    wrap.append(topbar('Message', '#circle'));
    wrap.append(h('div', { class: 'card' }, [
      h('h2', {}, 'This message link could not be read'),
      h('p', { class: 'muted' }, 'It may be invalid or was cut off in transit. Ask them to send it again.'),
      h('button', { class: 'btn', onclick: () => go('#circle') }, 'Back to your circle'),
    ]));
    mount(wrap, '#circle'); return;
  }
  const uid = m.from.userId;
  const th = getThread(uid);
  const last = th[th.length - 1];
  if (!(last && last.from === 'them' && last.text === m.text)) addMessage(uid, { from: 'them', text: m.text, name: m.from.name });
  // rewrite the URL so a refresh does not re-import, then show the conversation
  try { history.replaceState(null, '', '#thread-' + uid); } catch { /* noop */ }
  return threadScreen(uid, m.from, true);
}
