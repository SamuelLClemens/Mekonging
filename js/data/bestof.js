// Curated "best of" recommendation lists per country — best for families, family
// restaurants & neighborhoods, best experiences, couples, budget eats, and more.
// Synthesised from multiple cited public sources (NOT copied/scraped); each item
// deep-links to live maps/reviews. Filled by the content workflow.
// Shape per country code:
//   [{ id, title, category, forWho, blurb, items:[{name, city, why, mapQuery, rating, sources:[{org}]}] }]
export const BESTOF = {};

export function bestForCountry(code) { return BESTOF[code] || []; }
export function getBestList(id) {
  for (const c of Object.keys(BESTOF)) {
    const l = (BESTOF[c] || []).find((x) => x.id === id);
    if (l) return { ...l, country: c };
  }
  return null;
}
