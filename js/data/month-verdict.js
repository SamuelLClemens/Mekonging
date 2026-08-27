// Shared verdict logic for every "when to go" tier — region (zones.js), city (history.js),
// and place (place-months.js). All three store the SAME shape, `{ bestM: number[], avoidM:
// number[] }` (1 = January), so one function serves every tier; the only thing that differs
// between them is which object a caller hands in and how far its own prose was willing to
// commit. See js/data/zones.js for the full editorial rule these arrays are held to — every
// month either array claims must be named by that object's own prose, verified by
// scripts/check-month-arrays.py, which fails the build otherwise.
//
// Kept dependency-free and this small on purpose: zones.js is lazy-loaded per route and
// history.js is loaded eagerly (homeScreen needs it on first paint), so the one piece both
// need cannot live in either — importing one from the other would force the lazy side eager.
//
// Named `verdictFor`, not `monthVerdict`: scripts/check-lazy-data.py gates routes on IDENTIFIER
// NAMES read from lazy-data.js's `// LAZY-MODULE: zones = ... monthVerdict ...` comment, not on
// traced import bindings — any function anywhere whose body calls something literally spelled
// `monthVerdict` is read as "this route now needs the zones module", region tier or not. Every
// OTHER consumer of this file (render-utils.js's placeWhen, main.js's city-tier read) must stay
// clear of that name so an unrelated call never drags an always-on screen into that gate. Only
// zones.js's own public `monthVerdict` export (still that name — no existing caller changes)
// wraps this one; the reserved name lives in exactly one place, on purpose.
export const VERDICT_RANK = { best: 0, shoulder: 1, mixed: 2, avoid: 3 };

export function verdictFor(obj, month) {
  if (!obj || !month) return 'shoulder';
  const best = (obj.bestM || []).includes(month);
  const avoid = (obj.avoidM || []).includes(month);
  if (best && avoid) return 'mixed';
  if (best) return 'best';
  if (avoid) return 'avoid';
  return 'shoulder';
}
