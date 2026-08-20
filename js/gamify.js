// Contribution points + levels, modelled on Google Maps Local Guides — adapted to be
// fully ON-DEVICE with NO accounts and NO leaderboard. It rewards the traveller's own
// contributions (reviews, ratings, journal entries, photos, tips, pins, collections)
// with points, a level and a friendly nudge toward the next one. Everything is derived
// from data already in the store, so there is no extra bookkeeping and nothing to sync.

// Points per contribution — mirrors the Local Guides weighting (review > photo > rating).
export const POINTS = {
  review: 10,     // a written "your take" on a place
  rating: 1,      // a star rating on a place
  journal: 5,     // a travel-journal entry
  photo: 5,       // each photo (journal photos + album photos)
  tip: 5,         // a local-noticeboard post / tip
  pin: 3,         // a place dropped on the map
  collection: 2,  // a saved collection created
  plan: 1,        // a calendar plan / booking / activity
};

// Ten levels with travel-themed titles (cumulative point thresholds).
export const LEVELS = [
  { pts: 0, title: 'Newcomer', emoji: '🌱' },
  { pts: 20, title: 'Explorer', emoji: '🧭' },
  { pts: 50, title: 'Pathfinder', emoji: '🗺️' },
  { pts: 100, title: 'Trailblazer', emoji: '🥾' },
  { pts: 200, title: 'Navigator', emoji: '🧗' },
  { pts: 350, title: 'Globetrotter', emoji: '🌏' },
  { pts: 550, title: 'Voyager', emoji: '⛵' },
  { pts: 800, title: 'Pioneer', emoji: '🏔️' },
  { pts: 1200, title: 'Legend', emoji: '🌟' },
  { pts: 1800, title: 'Mekong Master', emoji: '🐉' },
];

export function levelInfo(points) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].pts) level = i + 1;
  const cur = LEVELS[level - 1];
  const next = LEVELS[level] || null;
  const span = next ? next.pts - cur.pts : 1;
  const into = points - cur.pts;
  return {
    level, title: cur.title, emoji: cur.emoji,
    nextTitle: next ? next.title : null,
    ptsToNext: next ? next.pts - points : 0,
    pct: next ? Math.max(0, Math.min(into / span, 1)) : 1,
  };
}

// How many photos the user has added, across journal entries (single photoKey OR a
// forward-compatible photoKeys array) and the dedicated album.
function photoCount(store) {
  let n = 0;
  (store.journal && store.journal.entries || []).forEach((e) => {
    if (Array.isArray(e.photoKeys)) n += e.photoKeys.length;
    else if (e.photoKey) n += 1;
  });
  const album = store.album && Array.isArray(store.album.photos) ? store.album.photos : [];
  n += album.length;
  return n;
}

// Count every contribution the traveller has made, from the store.
export function contributionCounts(store) {
  const pd = store.placeData || {};
  let reviews = 0, ratings = 0;
  Object.values(pd).forEach((d) => { if (d && (d.review || '').trim()) reviews++; if (d && d.rating > 0) ratings++; });
  const journal = (store.journal && store.journal.entries || []).length;
  const photos = photoCount(store);
  let tips = 0; const bp = store.boardPosts || {};
  Object.values(bp).forEach((arr) => { if (Array.isArray(arr)) tips += arr.length; });
  const pins = (store.pins || []).length;
  const collections = (store.collections || []).length;
  const plans = (store.calendar && store.calendar.items || []).length;
  return { reviews, ratings, journal, photos, tips, pins, collections, plans };
}

export function contributionPoints(store) {
  const c = contributionCounts(store);
  return c.reviews * POINTS.review + c.ratings * POINTS.rating + c.journal * POINTS.journal
    + c.photos * POINTS.photo + c.tips * POINTS.tip + c.pins * POINTS.pin
    + c.collections * POINTS.collection + c.plans * POINTS.plan;
}

// A readable breakdown [{ key, label, emoji, count, points }] for the contributions screen.
export function contributionBreakdown(store) {
  const c = contributionCounts(store);
  const rows = [
    { key: 'review', label: 'Reviews written', emoji: '✍️', count: c.reviews, per: POINTS.review },
    { key: 'photo', label: 'Photos added', emoji: '📷', count: c.photos, per: POINTS.photo },
    { key: 'journal', label: 'Journal entries', emoji: '📔', count: c.journal, per: POINTS.journal },
    { key: 'tip', label: 'Tips shared', emoji: '💬', count: c.tips, per: POINTS.tip },
    { key: 'pin', label: 'Places pinned', emoji: '📍', count: c.pins, per: POINTS.pin },
    { key: 'rating', label: 'Places rated', emoji: '⭐', count: c.ratings, per: POINTS.rating },
    { key: 'collection', label: 'Collections made', emoji: '🗂️', count: c.collections, per: POINTS.collection },
    { key: 'plan', label: 'Calendar entries', emoji: '🗓️', count: c.plans, per: POINTS.plan },
  ];
  return rows.map((r) => ({ ...r, points: r.count * r.per }));
}

// Friendly "earn more" suggestions — the lowest-count, highest-value actions first, each
// with the route to act on it. Encourages journaling, photos and reviews especially.
export function contributionSuggestions(store) {
  const c = contributionCounts(store);
  const ideas = [
    { key: 'journal', when: c.journal < 5, emoji: '📔', text: 'Write a journal entry about today', pts: POINTS.journal, hash: '#journal-add' },
    { key: 'photo', when: c.photos < 8, emoji: '📷', text: 'Add photos to your journal or album', pts: POINTS.photo, hash: '#journal-add' },
    { key: 'review', when: c.reviews < 5, emoji: '✍️', text: 'Review a place you have visited', pts: POINTS.review, hash: '#places' },
    { key: 'tip', when: c.tips < 3, emoji: '💬', text: 'Share a tip on a local noticeboard', pts: POINTS.tip, hash: '#board' },
    // '#map' hasn't been a real route since #map was merged into Places' embedded map —
    // this pointed at a dead link (silently falling through to Home) until the full-site
    // audit caught it. #addpin is the actual, currently-working "add a place" screen.
    { key: 'pin', when: c.pins < 3, emoji: '📍', text: 'Drop a pin on a place you found', pts: POINTS.pin, hash: '#addpin' },
  ];
  return ideas.filter((i) => i.when);
}
