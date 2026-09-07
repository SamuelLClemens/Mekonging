// Search everything — one box across places, dishes, species, phrases and features.
//
// Extracted from js/main.js (screen split, mk-v0.539.0).
import { getActiveCountry, setActiveCountry } from '../app-state.js';
import { allSpecies } from '../data/nature.js';
import { allPlaces } from '../data/regions.js';
import { itemLabel, navItems, resolveHash, visibleGroups } from '../nav-groups.js';
import { FAMILY_META, placeBucket } from '../render-utils.js';
import {
  getLastFix,
  save,
  store,
} from '../state.js';
import {
  debounce,
  fmtDistance,
  h,
  haversineKm,
} from '../util.js';
import {
  SEARCH_EXAMPLES,
  go,
  inferPhase,
  isNatureLoaded,
  loadNature,
  mount,
  placeFamily,
  recogThumb,
  rememberSearch,
  topbar,
  whoName,
} from '../main.js';


// The live query. Session-only, and moved here with the screen that writes it.
let searchQuery = '';

export function searchScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Search', '#home'));
  const input = h('input', { class: 'search', type: 'search', 'aria-label': 'Search', autofocus: '', value: searchQuery,
    placeholder: 'Find places, phrases, wildlife, prices…',
    oninput: debounce((e) => { searchQuery = e.target.value; renderResults(); }, 150) });
  wrap.append(input);
  // Set the query from a tapped chip (recent or example) and refresh, keeping the box in sync.
  const setQuery = (q) => { searchQuery = q; input.value = q; renderResults(); input.focus(); };

  // Category filter for places. Picking one also lets you browse the nearest places of
  // that kind with no query typed (a "nearest food / nearest stay" tool when GPS is on).
  let cat = 'all';
  const CATS = [['all', 'All'], ['food', '🍜 Food'], ['stay', '🛏 Stay'], ['culture', '🏛 Culture'], ['nature', '🌿 Nature'], ['nightlife', '🌃 Nightlife']];
  const catRow = h('div', { class: 'chips', style: 'margin:6px 0' }, CATS.map(([id, lbl]) =>
    h('button', { class: 'chip', 'aria-pressed': id === 'all' ? 'true' : 'false', dataset: { c: id },
      onclick: () => { cat = id; catRow.querySelectorAll('.chip').forEach((ch) => ch.setAttribute('aria-pressed', ch.dataset.c === id ? 'true' : 'false')); renderResults(); } }, lbl)));
  wrap.append(catRow);

  const out = h('div', {});
  wrap.append(out);

  function section(title, nodes) {
    if (!nodes.length) return;
    out.append(h('h2', { class: 'cat-title' }, `${title} (${nodes.length})`));
    nodes.slice(0, 12).forEach((n) => out.append(n));
    if (nodes.length > 12) out.append(h('p', { class: 'muted' }, `…and ${nodes.length - 12} more — refine your search`));
  }
  const link = (label, hash, extra) => h('button', { class: 'btn ghost block srch', onclick: () => { rememberSearch(searchQuery); if (extra) extra(); go(hash); } }, label);

  function renderResults() {
    out.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    const fix = getLastFix();
    // Features first. Search covered places, wildlife, phrases, fair prices and countries —
    // everything EXCEPT the app's own screens, so typing "visa" or "budget" returned nothing
    // and the only way to a feature was to know where it lived. Now that the long tail sits
    // behind eight hubs (js/nav-groups.js), search is the fast path for anyone who remembers
    // a name instead of a section, so this leads: it is the cheapest and most certain match.
    // Matched on the feature's own name, its description and its section's name, and each hit
    // says which section owns it, so a search also teaches where the thing lives.
    if (q.length >= 2) {
      const cc0 = getActiveCountry();
      const phase0 = store.profile.prefs.phase || inferPhase();
      const live = new Set(visibleGroups(phase0).flatMap((g) => g.items.map((it) => it.hash)));
      const feats = navItems().filter((it) => live.has(it.hash)
        && `${itemLabel(it, whoName())} ${it.label} ${it.blurb || ''} ${it.groupTitle}`.toLowerCase().includes(q));
      // Searchable under BOTH names: a traveller called Sam finds "Sam’s dictionary" by
      // typing their own name and still finds it by typing "your dictionary".
      section('Features', feats.map((it) => link(`${it.ic} ${itemLabel(it, whoName())} · ${it.groupTitle}`, resolveHash(it, cc0))));
    }
    // Places: filter by category and/or text; when a location is known, order by distance.
    let places = allPlaces();
    if (cat !== 'all') places = places.filter((p) => placeBucket(p) === cat);
    if (q.length >= 2) places = places.filter((p) => `${p.name} ${p.blurb || ''} ${p.city || ''}`.toLowerCase().includes(q));
    if (q.length >= 2 || cat !== 'all') {
      if (fix) places = places.slice().sort((a, b) => (a.coords ? haversineKm(fix, a.coords) : Infinity) - (b.coords ? haversineKm(fix, b.coords) : Infinity));
      const catLbl = (CATS.find((x) => x[0] === cat) || [])[1] || 'Places';
      const title = cat === 'all' ? 'Places' : `${catLbl}${fix ? ' near you' : ''}`;
      // Place hits get a recognition thumbnail (photo when one exists, family emoji otherwise)
      // so a search reads like a guide, not a text index. Other sections stay as text links.
      const placeRow = (p) => {
        const dist = (fix && p.coords) ? ` · ${fmtDistance(haversineKm(fix, p.coords))}` : '';
        return h('button', { class: 'btn ghost block srch srch-place', onclick: () => { rememberSearch(searchQuery); go(`#place-${p.id}`); } }, [
          recogThumb(p, (FAMILY_META[placeFamily(p)] || FAMILY_META.other).emoji),
          h('span', { class: 'srch-place-text' }, [
            h('span', { class: 'srch-place-name' }, p.name),
            h('span', { class: 'srch-place-sub muted' }, `${p.city || ''}${dist}`),
          ]),
        ]);
      };
      section(title, places.map(placeRow));
    }
    // The wider indexes only apply to a text query and only when not scoped to a category.
    if (q.length >= 2 && cat === 'all') {
      section('Wildlife & plants', allSpecies({ q }).map((s) => link(`${s.emoji || '🔎'} ${s.commonName}`, `#species-${s.id}`)));
      const phr = [];
      for (const b of Object.values(LANGUAGES)) for (const cate of b.categories) for (const p of cate.phrases) {
        if (`${p.en} ${p.roman || ''} ${p.script || ''}`.toLowerCase().includes(q)) phr.push(link(`💬 ${b.label}: ${p.en} — ${p.script}`, `#phrasebook-${b.lang}`));
      }
      section('Phrases', phr);
      const pr = [];
      for (const c of COUNTRIES) if (c.prices) for (const it of c.prices.items) {
        if (it.label.toLowerCase().includes(q)) pr.push(link(`💵 ${c.name}: ${it.label}`, `#prices-${c.id}`));
      }
      section('Fair prices', pr);
      section('Countries', COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => link(`${c.flag} ${c.name}`, `#country-${c.id}`, () => { setActiveCountry(c.id); })));
    }
    if (!out.children.length) {
      if (q.length < 2 && cat === 'all') {
        // Zero-state launchpad: recent searches (if any) then example queries, so the
        // screen teaches what Search covers instead of showing a bare instruction line.
        const prefs = store.profile.prefs;
        const recent = (Array.isArray(prefs.recentSearches) ? prefs.recentSearches : []).filter((s) => s && s.trim());
        if (recent.length) {
          out.append(h('h2', { class: 'cat-title' }, 'Recent'));
          out.append(h('div', { class: 'chips search-launch' }, [
            ...recent.map((s) => h('button', { class: 'chip', onclick: () => setQuery(s) }, `🕘 ${s}`)),
            h('button', { class: 'chip ghost', 'aria-label': 'Clear recent searches',
              onclick: () => { prefs.recentSearches = []; save(); renderResults(); } }, 'Clear'),
          ]));
        }
        out.append(h('h2', { class: 'cat-title' }, 'Try searching for'));
        out.append(h('div', { class: 'chips search-launch' },
          SEARCH_EXAMPLES.map((s) => h('button', { class: 'chip', onclick: () => setQuery(s) }, s))));
        out.append(h('p', { class: 'muted tiny', style: 'margin:8px 2px 0' }, 'Or type any word — places, phrases, wildlife and prices are all searchable. Pick a category above to browse the nearest places to you.'));
      } else {
        out.append(h('p', { class: 'muted' }, 'Nothing found. Try another word or category.'));
      }
    }
  }
  renderResults();
  // Wildlife results depend on nature.js — kick off its load as soon as Search opens
  // (see loadNature() near the top of this file) rather than waiting for a keystroke, and
  // refresh just the results (never the input above, so an in-progress query is never
  // interrupted) once it resolves. Until then, section() already omits an empty "Wildlife
  // & plants" heading entirely — a matching-text query simply surfaces those results a
  // little later rather than showing anything misleading in the meantime.
  if (!isNatureLoaded()) { loadNature().then(renderResults, renderResults); }
  mount(wrap, '#home');
}
