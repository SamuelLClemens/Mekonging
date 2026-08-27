// Place-tier "when to go" — the finest of the app's three month tiers, layered on top of the
// city tier (js/data/history.js) by `placeWhen()` in render-utils.js, which itself falls back
// to the region tier (js/data/zones.js) where a caller has one. See MEKONGING_REFACTOR_TODO.md
// Priority 10.1 for why this tier exists and how it was scoped.
//
// Deliberately small and hand-picked, not derived in bulk: of the app's 696 place records,
// only a minority say anything month-specific in their own prose at all, and of those, most
// name a harvest, a hotel's peak rate, or a park's flood closure — real facts, but not a
// visiting recommendation. An entry belongs here ONLY when the place's own record already
// states, in its own words, that some months are better (or worse) TO VISIT than others. No
// entry here may assert a month its own cited field does not name — enforced by
// scripts/check-month-arrays.py under the identical asymmetric rule the region and city tiers
// already use: every month in `bestM`/`avoidM` must be named by `why`; the reverse is not
// required.
//
// PLACE_MONTHS[placeId] = { bestM: number[], avoidM: number[], why: string }
// `why` is a direct quote (or a trimmed one) of a sentence that already exists on that same
// place's own record — never a new claim written for this file.
export const PLACE_MONTHS = {
};
