// National emergency numbers, americas (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.
// Keyed by the world outline's lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,
// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that agrees goes in `src2`.
// A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.
// scripts/check-emergency-world.py reads this file.
export const EMERGENCY_WORLD = {
};
