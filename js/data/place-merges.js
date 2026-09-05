// Places that were once two records and are now one.
//
// Merging a duplicate is not just an edit to the guidebook: a traveller may already have
// favourited the losing record, put it in a collection, tagged it to a trip stop, written
// their own note or rating against it, or been sent it by a friend. Nothing in the app
// resolves an id it cannot find — resolveItem() simply returns null and the row vanishes —
// so without this table a merge silently deletes the traveller's own data.
//
// Two things read it: getPlace() in regions.js, so an old id (a bookmarked #place- route, a
// shared link, an inbox item) still opens the surviving record; and the store migration in
// state.js, which rewrites the saved ids once so the alias is a safety net rather than a
// permanent redirect everyone depends on.
//
// Add a line here in the SAME commit that deletes a record. Never remove a line: the old id
// can arrive from a share link years later.
export const MERGED_PLACE_IDS = {
  // 2026-09-05 — the same Bangkok market listed twice, 25 m apart under the same name.
  // th-bkk-chatuchak survived (photos.js maps a photo to it, and it carries the Google
  // externalRatings); its richer fields came across from the deleted entry.
  'th-ext-chatuchak-weekend-market': 'th-bkk-chatuchak',
};

// Follow the chain, so a record merged twice still resolves. Bounded so a table with an
// accidental loop in it degrades to "not found" rather than hanging the app.
export function canonicalPlaceId(id) {
  let cur = id;
  for (let i = 0; i < 8; i++) {
    const next = MERGED_PLACE_IDS[cur];
    if (!next || next === cur) return cur;
    cur = next;
  }
  return cur;
}
