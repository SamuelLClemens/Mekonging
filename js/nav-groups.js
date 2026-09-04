// The site's feature taxonomy — ONE source of truth for where every feature lives, what it
// is called, and which of the eight groups owns it.
//
// WHY THIS FILE EXISTS. Four screens each carried their own hand-written list of the same
// destinations: Home's "🧰 Tools" bag (13 loose chips, from Trip plans to Help & FAQ),
// You's four chip groups, Explore's four country decks, and #everything's nine folds. The
// same feature therefore appeared up to four times, under names that had drifted apart —
// "Buy or sell" / "Traveller board", "Money & prices" / "Fair prices", "Documents" /
// "Secure documents" — and every one of those lists had to be edited by hand when a feature
// moved. The comments still in main.js and home.js are a record of that maintenance: half a
// dozen rounds of de-duplicating chips one screen at a time.
//
// So the taxonomy lives here as data, and every navigation surface RENDERS it. A feature
// belongs to exactly one group, carries exactly one label, and adding one means editing one
// array. Nothing here touches the DOM or imports anything — it is a manifest, so it can be
// read by any screen without a cycle.
//
// HOW IT IS USED. Each group is also a real destination — `#hub-<id>` — so a traveller sees
// eight named doors instead of fifty-odd chips, and reaches any feature in two taps. Groups
// too large to scan flat (Plan & travel) declare `section` on their items, and the hub
// renders those as sub-headings. See hubScreen() in js/main.js.

// `{cc}` in a hash is replaced with the country the traveller is looking at — see
// resolveHash(). Kept as a placeholder string rather than a closure so this stays pure data:
// greppable, and safe to import from anywhere.
//
// Item keys:
//   ic          emoji, matching the icon the destination already uses elsewhere
// Group keys additionally carry:
//   accent      the colour its door and heading take, picked from SECTION_ACCENT in
//               js/main.js so a group inherits the hue its own features already use (Money
//               takes the currency green, My stuff the journal terracotta)
//   blurb       the DOOR line — two columns on a 375px phone leave room for about 34
//               characters over two lines, and a door whose description is cut off teaches
//               nothing, so this is deliberately terse
//   intro       the fuller sentence, shown once at the top of the group's own hub where
//               there is a whole line to use
//   label       the ONE name for this feature — matched to the destination's own topbar
//               title wherever that title is clear, so the door and the room agree
//   hash        route, with the optional {cc} placeholder
//   blurb       one short line: what you get, for the hub and the all-features index
//   section     optional sub-heading inside the hub (only used by large groups)
//   live        optional id of a live status resolver — see LIVE_STATUS in js/main.js
//   hidePost    hide once a trip has ended (its whole purpose is preparing for, or being
//               on, a trip) — the rule Home's Tools list already applied
//   planningOnly  show only before a trip starts (stricter than hidePost)
export const NAV_GROUPS = [
  {
    id: 'money',
    accent: '#4C9A6A',
    ic: '💰',
    title: 'Money',
    blurb: 'Rates, budget, what things cost',
    intro: 'Convert, budget, and what things should cost',
    items: [
      { ic: '💱', label: 'Currency converter', hash: '#currency', blurb: 'Live rates, works offline', live: 'rate' },
      { ic: '💰', label: 'Budget', hash: '#expenses', blurb: 'Log what you spend against a target', live: 'budget' },
      { ic: '🏷️', label: 'Fair prices', hash: '#prices-{cc}', blurb: 'What locals pay, so you are not overcharged' },
      { ic: '🤝', label: 'Bargain helper', hash: '#bargain', blurb: 'What to offer, and how to say it', hidePost: true },
      { ic: '💵', label: 'Cash swap', hash: '#swap', blurb: 'Swap currency with travellers going the other way', hidePost: true },
      { ic: '🎒', label: 'Gear market', hash: '#market', blurb: 'Buy and sell kit on the road', hidePost: true },
    ],
  },
  {
    id: 'identify',
    accent: '#E0663A',
    ic: '🔎',
    title: 'Identify',
    blurb: 'What is this dish, fruit or bird?',
    intro: 'Find out what something is — a dish, a fruit, a bird, a snake',
    items: [
      { ic: '🍜', label: 'Identify food', hash: '#food-{cc}', blurb: 'Dishes and what is in them' },
      { ic: '🍈', label: 'Market produce', hash: '#produce', blurb: 'Fruit, veg and herbs on the stall' },
      { ic: '🌿', label: 'Identify nature', hash: '#nature', blurb: 'Birds, fish, plants and insects' },
      { ic: '🔊', label: 'Sounds around you', hash: '#sounds', blurb: 'Match a call you can hear' },
      { ic: '⚠️', label: 'Dangerous', hash: '#danger', blurb: 'What to avoid, and first aid if it bites' },
      { ic: '🔍', label: 'My identifier', hash: '#identified', blurb: 'Everything you have identified so far', live: 'identified' },
    ],
  },
  {
    id: 'plan',
    accent: '#2FA0A0',
    ic: '🧭',
    title: 'Plan & travel',
    blurb: 'Where next, when, and how',
    intro: 'Where you are going, when, and how you get there',
    items: [
      { section: 'Your trip', ic: '🧭', label: 'Trip plans', hash: '#plans', blurb: 'Ready-made routes matched to how you travel', hidePost: true },
      { section: 'Your trip', ic: '🧳', label: 'My trip', hash: '#trip', blurb: 'Your stops, dates and nights' },
      { section: 'Your trip', ic: '👣', label: 'Plan your next stop', hash: '#nextstop', blurb: 'Where to go from here, and how long it takes', hidePost: true },
      { section: 'Your trip', ic: '✅', label: 'Pre-trip checklist', hash: '#checklist', blurb: 'Jabs, papers, packing', planningOnly: true },
      { section: 'Your trip', ic: '🎯', label: 'For you', hash: '#foryou', blurb: 'Tune what the app recommends', hidePost: true },
      { section: 'When to go', ic: '🌤', label: 'Weather', hash: '#weather-{cc}', blurb: 'Forecast, rain and heat by city', live: 'weather' },
      { section: 'When to go', ic: '📅', label: 'Travel calendar', hash: '#calendar', blurb: 'Your dates, bookings and reminders', live: 'calendar' },
      { section: 'When to go', ic: '🎉', label: 'Festivals', hash: '#events-{cc}', blurb: 'Holidays worth planning around — or avoiding' },
    ],
  },
  // Promoted out of Plan & travel, which held twelve features to every other section's six
  // to eight and needed three sub-headings to be readable at all. "How do I get from here to
  // there" is a different question from "where should I go and when", and it is asked on the
  // day rather than in advance — so it is a section, not a sub-heading inside a planning one.
  //
  // Titled "Transport" and not "Getting around" on purpose: the #transport screen's own
  // topbar reads "Getting around", so the ITEM has to keep that name or the manifest starts
  // drifting from the screens again, which is the whole thing it exists to prevent. A door
  // and a row inside it cannot both be "Getting around".
  {
    id: 'around',
    accent: '#7B5EA7',
    ic: '🚌',
    title: 'Transport',
    blurb: 'Buses, trains, boats, borders',
    intro: 'How you get from where you are to where you are going next',
    items: [
      { ic: '🚌', label: 'Getting around', hash: '#transport-{cc}', blurb: 'Best way between two places' },
      { ic: '📋', label: 'Transport schedules', hash: '#schedules-{cc}', blurb: 'Train, bus and boat times' },
      { ic: '🛂', label: 'Border crossings', hash: '#crossings', blurb: 'Where to cross, opening hours, visas' },
      { ic: '🧭', label: 'Journey planner', hash: '#route', blurb: 'Chain buses, trains and boats into one route' },
    ],
  },
  {
    id: 'seedo',
    accent: '#1FA98A',
    ic: '📍',
    title: 'See & do',
    blurb: 'Worth your time nearby',
    intro: 'Worth your time — right here and countrywide',
    items: [
      { ic: '📍', label: 'Near me', hash: '#nearby', blurb: 'What is within walking distance' },
      { ic: '🕒', label: 'Things to do', hash: '#today-{cc}', blurb: 'Picks for the weather and time right now' },
      { ic: '🏆', label: 'Best of', hash: '#bestof-{cc}', blurb: 'Top picks, first-timers, families' },
      { ic: '🍢', label: 'Street food', hash: '#streetfood', blurb: 'Find, rate and review stalls' },
      { ic: '🏊', label: 'Pools', hash: '#pools-{cc}', blurb: 'Swims and day passes' },
      { ic: '🙏', label: 'Places of worship', hash: '#worship-{cc}', blurb: 'Temples, churches and mosques, with dress rules' },
    ],
  },
  {
    id: 'country',
    accent: '#6E8FA0',
    ic: '🛂',
    title: 'Know this country',
    blurb: 'Visas, scams, customs, access',
    intro: 'Rules, risks and practicalities where you are',
    items: [
      { ic: '🧭', label: 'Country guide', hash: '#info-{cc}', blurb: 'Money, SIM, tipping, etiquette' },
      { ic: '🛂', label: 'Entry & visa', hash: '#visa-{cc}', blurb: 'What you need to get in and stay' },
      { ic: '🛬', label: 'Just arrived', hash: '#arrival-{cc}', blurb: 'First hour: cash, SIM, airport to town' },
      { ic: '⚠️', label: 'Common scams', hash: '#scams-{cc}', blurb: 'The ones that actually happen here' },
      { ic: '📜', label: 'History & culture', hash: '#history-{cc}', blurb: 'Enough to make sense of what you see' },
      { ic: '♿', label: 'Accessibility', hash: '#access-{cc}', blurb: 'Step-free routes, ramps, accessible toilets' },
      { ic: '🍼', label: 'Travelling with a baby', hash: '#baby-{cc}', blurb: 'Formula, nappies, clinics, prams' },
      { ic: '👪', label: 'Travelling with kids', hash: '#family-{cc}', blurb: 'Childcare, schools, things they will like' },
    ],
  },
  {
    id: 'mine',
    accent: '#C25E3A',
    ic: '📔',
    title: 'My stuff',
    blurb: 'Your journal, photos and saves',
    intro: 'Everything you have written, saved and made',
    items: [
      { ic: '📔', label: 'Journal', hash: '#journal', blurb: 'Dated entries, photos and places', live: 'journal' },
      { ic: '📸', label: 'Trip scrapbook', hash: '#scrapbook', blurb: 'Your trip as one page to keep' },
      { ic: '🗺', label: 'Your journey', hash: '#journey', blurb: 'Everywhere you have been, on a map' },
      { ic: '📤', label: 'Share my journey', hash: '#sharejourney', blurb: 'One file or link, you choose what is in it' },
      { ic: '⭐', label: 'Saved places', hash: '#saved', blurb: 'Your stars and collections', live: 'saved' },
      { ic: '💬', label: 'Your dictionary', hash: '#dictionary', blurb: 'Phrases you saved and words you added', live: 'phrases' },
      { ic: '🏅', label: 'Your contributions', hash: '#contributions', blurb: 'Reviews, pins and corrections you added', live: 'contributions' },
      { ic: '🔒', label: 'Documents', hash: '#vault', blurb: 'Passport and papers, locked on this device' },
    ],
  },
  {
    id: 'people',
    accent: '#4C79C0',
    ic: '👥',
    title: 'People',
    blurb: 'Travellers and locals',
    intro: 'Other travellers, and the people who live here',
    items: [
      { ic: '👥', label: 'Travel circle', hash: '#circle', blurb: 'Share plans and places with people you trust', live: 'circle' },
      { ic: '🤝', label: 'Traveller board', hash: '#exchange', blurb: 'Lifts, gear, cash and company', hidePost: true },
      { ic: '📌', label: 'Local noticeboard', hash: '#board-{cc}', blurb: 'Markets, classes and family supplies', hidePost: true },
      { ic: '📥', label: 'Shared with you', hash: '#inbox', blurb: 'Places and plans people sent you', live: 'inbox' },
      { ic: '❤️', label: 'Give back', hash: '#donate', blurb: 'Local causes worth supporting' },
    ],
  },
  {
    id: 'admin',
    accent: '#7A7F87',
    ic: '⚙️',
    title: 'Settings & help',
    blurb: 'Preferences, backups, help',
    intro: 'Your preferences, your data, and answers',
    items: [
      { ic: '⚙️', label: 'Settings', hash: '#settings', blurb: 'Language, theme, data and privacy' },
      { ic: '🔎', label: 'Search everything', hash: '#search', blurb: 'One box across every screen and place' },
      { ic: '📤', label: 'Export', hash: '#export', blurb: 'Back up your journal, budget and trip' },
      { ic: '✉️', label: 'Send feedback', hash: '#feedback', blurb: 'Tell us what is wrong or missing' },
      { ic: '❓', label: 'Help & FAQ', hash: '#help', blurb: 'How the app works, and what it never does' },
    ],
  },
];

// The five bottom tabs (Home, Talk, You, Places, Explore) and Emergency — pinned in the
// topbar on every screen — are deliberately absent above: they are already one tap away from
// everywhere, so listing them in a group would spend a slot to say nothing. Detail screens
// reached FROM a feature rather than browsed TO (one place, one dish, one species, a message
// thread, a saved collection) are absent for the same reason.

export function navGroup(id) { return NAV_GROUPS.find((g) => g.id === id) || null; }

export function groupHash(id) { return `#hub-${id}`; }

// Country-scoped destinations take whichever country the traveller is looking at — the same
// convention every hand-written chip list already used. An item with no {cc} ignores it.
export function resolveHash(item, cc) {
  return String(item.hash).replace('{cc}', cc || 'th');
}

// Phase filtering, applied at ITEM level so a group never disappears wholesale: `post` hides
// what only serves a trip still ahead of you, `planning` hides nothing extra. A group whose
// every item is hidden is dropped by the caller (see visibleGroups).
export function visibleItems(group, phase) {
  return (group.items || []).filter((it) => (it.planningOnly ? phase === 'planning' : !(it.hidePost && phase === 'post')));
}

export function visibleGroups(phase) {
  return NAV_GROUPS.map((g) => ({ ...g, items: visibleItems(g, phase) })).filter((g) => g.items.length);
}


// Every item in the taxonomy, each carrying the id of the group that owns it. Used by the
// all-features index and by the sitewide search, so both stay in step with the groups above
// without a second list.
export function navItems() {
  return NAV_GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.id, groupTitle: g.title })));
}
