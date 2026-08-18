// Travelling with kids — schools, childcare and what to do with the children, plus the
// small "Travelling with kids" summary card exploreScreen still reaches back in for. For
// family travellers: things to do with children, drop-in and enrolment childcare, and
// international schools for a term abroad or relocation. Everything is orientation only —
// the screen makes that explicit and links to official sites where confirmed.
// Extracted from main.js (module split, main.js size-reduction pass) — the smallest and
// lowest-risk of the remaining inline screens: one data source (getFamily()), one linear
// render, no live map/GPS/wake-lock/mic surface, and exactly one outside call-in point
// (exploreScreen's own family summary card, which reverse-imports familyCard from here).
import { h } from '../util.js';
import { getFamily } from '../data/family.js';
import { getCountry, allPlaces } from '../data/regions.js';
import { sourcesNote } from '../render-utils.js';
import { go, mount, topbar } from '../main.js';

const CARE_KIND = { daycare: 'Daycare', nursery: 'Nursery', preschool: 'Preschool', 'kids-club': 'Kids’ club', babysitting: 'Babysitting', playcentre: 'Play centre' };
// The activity kinds are free-text and rich (e.g. "children's museum", "waterfall
// swimming"); pick an emoji by keyword and show the kind as a readable label rather than
// flattening everything into a dozen buckets.
function kidKindLabel(kind) {
  const k = (kind || '').toLowerCase();
  const emoji = /aquar/.test(k) ? '🐠'
    : /sanctuary|wildlife|ethical|elephant|\banimal\b/.test(k) ? '🐘'
    : /zoo|safari/.test(k) ? '🦁'
    : /water\s*-?\s*park|waterpark/.test(k) ? '💦'
    : /waterfall|swim/.test(k) ? '🏞'
    : /beach|island/.test(k) ? '🏖'
    : /museum|discovery|science|edutain/.test(k) ? '🏛'
    : /play/.test(k) ? '🧩'
    : /farm/.test(k) ? '🌾'
    : /circus|craft|workshop|show/.test(k) ? '🎨'
    : /theme|amusement/.test(k) ? '🎢'
    : /garden|nature|\bpark\b/.test(k) ? '🌳'
    : /temple|culture/.test(k) ? '🛕'
    : /view/.test(k) ? '🌄'
    : /market/.test(k) ? '🏮'
    : /flight/.test(k) ? '✈️'
    : /boat|river/.test(k) ? '🚣'
    : /landmark/.test(k) ? '📸'
    : '📍';
  const label = k ? k.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : 'Family outing';
  return `${emoji} ${label}`;
}

// One institution / venue card, shared across the three family lists.
function famCard(e, meta) {
  const card = h('div', { class: 'card fam-card' });
  card.append(h('div', { class: 'row-between' }, [
    h('h3', { style: 'margin:0' }, e.name),
    e.city ? h('span', { class: 'cat-tag' }, e.city) : null,
  ]));
  if (meta) card.append(h('p', { class: 'tiny muted', style: 'margin:4px 0' }, meta));
  if (e.note) card.append(h('p', { style: 'margin:4px 0' }, e.note));
  if (e.url) card.append(h('a', { class: 'btn ghost block', href: e.url, target: '_blank', rel: 'noopener' }, 'Official site ↗'));
  return card;
}

// Collapsible section so families can minimise what they do not need and focus.
function familySection(title, count, openDefault, nodes) {
  return h('details', { class: 'filters-collapse fam-section', open: openDefault ? '' : null }, [
    h('summary', {}, count != null ? `${title} · ${count}` : title),
    h('div', {}, nodes),
  ]);
}

export function familyScreen(cc) {
  const f = getFamily(cc);
  const c = getCountry(cc);
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Travelling with kids', c ? `#country-${cc}` : '#home'));
  if (!f) { wrap.append(h('p', { class: 'empty' }, 'Family guidance for this country is on the way.')); mount(wrap, 'home'); return; }
  wrap.append(h('div', { class: 'banner' }, 'Orientation for families. Schools, childcare and venues change their fees, hours and enrolment — confirm directly before you rely on any of it.'));
  if (f.intro) wrap.append(h('p', {}, f.intro));

  // 1 — What to do with the kids: the guide's own kid-friendly places for this country
  // PLUS curated family venues. Leads because it serves every family, short stay or long.
  const kidPlaces = allPlaces({ country: cc }).filter((p) => p.kidFriendly === true).slice(0, 8);
  const acts = f.kidActivities || [];
  const doNodes = [];
  if (kidPlaces.length) {
    doNodes.push(h('p', { class: 'tiny muted', style: 'margin:0 0 6px' }, 'Kid-friendly places from your guide:'));
    doNodes.push(h('div', { class: 'chips', style: 'margin-bottom:8px' }, kidPlaces.map((p) =>
      h('button', { class: 'chip', onclick: () => go(`#place-${p.id}`) }, p.name))));
  }
  acts.forEach((a) => doNodes.push(famCard(a, [kidKindLabel(a.kind), a.ages ? `Ages ${a.ages}` : null].filter(Boolean).join(' · '))));
  if (doNodes.length) wrap.append(familySection('🎡 What to do with the kids', acts.length || null, true, doNodes));

  // 2 — Childcare & daycare (drop-in and enrolment)
  const care = f.childcare || [];
  if (care.length) {
    wrap.append(familySection('🧸 Childcare & daycare', care.length, false,
      care.map((x) => famCard(x, [CARE_KIND[x.kind] || x.kind, x.ages ? `Ages ${x.ages}` : null].filter(Boolean).join(' · ')))));
  }

  // 3 — International schools (families staying a term or relocating)
  const schools = f.intlSchools || [];
  if (schools.length) {
    wrap.append(familySection('🎓 International schools', schools.length, false,
      schools.map((s) => famCard({ name: s.name, city: s.city, note: s.feesNote, url: s.url },
        [s.curriculum, s.ages ? `Ages ${s.ages}` : null].filter(Boolean).join(' · ')))));
  }

  // 4 — Family tips
  if (f.tips && f.tips.length) {
    wrap.append(familySection('💡 Family tips', null, false,
      [h('div', { class: 'card' }, f.tips.map((t) => h('div', { class: 'list-note' }, t)))]));
  }

  // Baby-supplies help is one tap away for anyone travelling with a little one.
  wrap.append(h('button', { class: 'btn ghost block', style: 'margin-top:8px', onclick: () => go(`#baby-${cc}`) }, '🍼 Nappies, formula & baby basics'));

  if (f.sources && f.sources.length) wrap.append(sourcesNote(f.sources, f.asOf));
  mount(wrap, 'home');
}

export function familyCard(cc) {
  if (!getFamily(cc)) return null;
  const card = h('div', { class: 'card' });
  card.append(h('h2', { style: 'margin-top:0' }, '👨‍👩‍👧 Travelling with kids'));
  card.append(h('p', { class: 'muted', style: 'margin:6px 0' }, 'What to do with the kids, childcare & daycare, and international schools for longer stays.'));
  card.append(h('button', { class: 'btn ghost block', onclick: () => go(`#family-${cc}`) }, 'Open the family guide'));
  return card;
}
