// Give back — donating to causes that work in the region the traveller is actually in, with a
// calculator that starts from what they have already logged spending rather than an abstract
// figure.
//
// Established non-profits, each verified to an official site (2026-07). The app never
// processes money — every entry is a plain outbound link to the organisation's own site,
// exactly like the booking deep links. People-focused, spanning all four countries.
//
// Extracted from main.js as a lazy, route-scoped screen (#donate). The three loading and
// unavailable screens that used to sit under this same banner did NOT come with it: they are
// router infrastructure that happened to be appended here, and countryLoadingScreen,
// screenLoadingScreen and screenUnavailableScreen are all called by render() itself. Moving
// them would have made the router depend on a lazily-loaded module in order to show the
// loading state for a lazily-loaded module.
import { store, save } from '../state.js';
import { h, money } from '../util.js';
import { field, screenHint, selectEl } from '../ui-widgets.js';
import { sourcesNote } from '../render-utils.js';
import { convert } from '../currency.js';
import { mount, topbar, homeCurrency } from '../main.js';

// Rating research (2026-09-15, Slice F, item 5.2): every entry below carries either a real
// rating from a named independent evaluator with a direct link to that evaluator's own
// profile page, or an explicit "unrated" — never a guessed or approximated number. "Unrated"
// is an expected, normal outcome for a small regional NGO, not a failure of the org. Anything
// with a genuine documented dispute is flagged via `contested` with both sides sourced, for
// the owner to weigh — not resolved here. See WORK_ORDER.md Slice F for the full brief.
const DONATE_ORGS = [
  { scope: 'Across the region', flag: '🌏', items: [
    { name: 'MAG (Mines Advisory Group)', what: 'Finds and clears landmines and unexploded bombs left by war in Cambodia, Laos and Vietnam, so families can farm and children can play safely.', url: 'https://www.maginternational.org/',
      rating: { rated: true, label: '2/4 stars', evaluator: 'Charity Navigator (MAG America)', url: 'https://www.charitynavigator.org/ein/522302253' } },
    { name: 'Friends-International', what: 'Protects urban children and marginalised young people and trains them for work, across Cambodia, Laos and Thailand.', url: 'https://friends-international.org/',
      rating: { rated: false, note: 'No independent evaluator profile found (checked Charity Navigator, Candid/GuideStar, ACNC, UK Charity Commission).' } },
    { name: 'Thrive Networks (East Meets West)', what: 'Health, water, sanitation and education programmes for underserved communities across Vietnam, Cambodia and Laos.', url: 'https://thrivenetworks.org/',
      rating: { rated: true, label: '4/4 stars', evaluator: 'Charity Navigator', url: 'https://www.charitynavigator.org/ein/330316095' } },
  ] },
  { scope: 'Thailand', flag: '🇹🇭', items: [
    { name: 'The Mercy Centre (HDF)', what: 'Kindergartens, shelter and daily care for children of Bangkok’s Klong Toey community, serving the city’s poorest families since 1972.', url: 'https://mercycentre.org/',
      rating: { rated: false, note: 'No confirmed independent rating (a Candid/GuideStar profile exists for its US support entity, Human Development and Children Foundation, but the seal tier could not be verified).' } },
  ] },
  { scope: 'Vietnam', flag: '🇻🇳', items: [
    { name: 'Blue Dragon Children’s Foundation', what: 'Rescues children from trafficking and slavery and helps street kids rebuild their lives, based in Hanoi.', url: 'https://www.bluedragon.org/donate/',
      rating: { rated: true, label: '4/4 stars', evaluator: 'Charity Navigator (Blue Dragon USA)', url: 'https://www.charitynavigator.org/ein/453771750' } },
    { name: 'PeaceTrees Vietnam', what: 'Clears landmines and unexploded ordnance around Quang Tri and helps communities return the land to safe use.', url: 'https://www.peacetreesvietnam.org/',
      rating: { rated: true, label: '4/4 stars', evaluator: 'Charity Navigator', url: 'https://www.charitynavigator.org/ein/201051471' } },
  ] },
  { scope: 'Cambodia', flag: '🇰🇭', items: [
    { name: 'Cambodian Children’s Fund', what: 'Education, healthcare, childcare and family support in one of Phnom Penh’s poorest areas, Steung Meanchey.', url: 'https://www.cambodianchildrensfund.org/donate',
      rating: { rated: true, label: '4/4 stars (100%)', evaluator: 'Charity Navigator', url: 'https://www.charitynavigator.org/ein/200764162' },
      // Orphanage tourism and residential child-care in Cambodia are an area with genuine,
      // active criticism (well-known "orphanages" separating children from families who could
      // care for them) — this specific, named dispute is flagged rather than silently
      // resolved, so the owner decides whether to keep, drop or annotate this entry further.
      contested: { note: 'A named critic ("Cambodia440" blog, Andy Ricketson) has alleged since 2015 that CCF operates as a de facto orphanage with illegal-detention concerns; CCF disputes this publicly and calls the source uncredible. Shown here so the owner can weigh both sides.',
        sources: [
          { org: 'Cambodia440 — allegation', url: 'https://cambodia440.blogspot.com/2015/12/175-is-scott-neesons-cambodian.html' },
          { org: 'Cambodian Children’s Fund — response', url: 'https://www.cambodianchildrensfund.org/fact-sheet-4/' },
        ] } },
  ] },
  { scope: 'Laos', flag: '🇱🇦', items: [
    { name: 'COPE', what: 'Free prosthetic limbs and rehabilitation for survivors of unexploded bombs, run from the visitor centre in Vientiane.', url: 'https://copelaos.org/',
      rating: { rated: false, note: 'No independent evaluator profile found (checked Charity Navigator, Candid/GuideStar, ACNC, GreatNonprofits). COPE has no charity registration of its own in donor countries; it is fiscally sponsored via Global Development Group (Australia) for tax-deductible giving.' } },
    { name: 'Big Brother Mouse', what: 'A Lao-owned literacy project publishing books and running reading parties for village children, from Luang Prabang.', url: 'https://www.bigbrothermouse.com/',
      rating: { rated: false, note: 'Profiled by Charity Navigator (as Laos Literacy Project Inc.) but rated as having insufficient data for a star score.', evaluator: 'Charity Navigator', url: 'https://www.charitynavigator.org/ein/320285330' } },
    { name: 'Pencils of Promise', what: 'Builds schools and supports teachers and clean water access for rural communities, including in Laos.', url: 'https://pencilsofpromise.org/',
      rating: { rated: true, label: '3/4 stars', evaluator: 'Charity Navigator', url: 'https://www.charitynavigator.org/ein/263618722' } },
  ] },
];

// Recognised giving-effectiveness references, cited in-app for the "how much to give"
// tool. Not financial advice — a suggestion the traveller is free to ignore.
const GIVING_SOURCES = [
  { org: 'Giving What We Can (10% pledge)', url: 'https://www.givingwhatwecan.org/' },
  { org: 'The Life You Can Save', url: 'https://www.thelifeyoucansave.org/' },
];

// Total cash withdrawn, converted to the home currency, or null if nothing is logged or a
// rate is unknown — lets the giving tool prefill "% of cash withdrawn" from real data.
//
// Withdrawals, not the itemised expense log: not every traveller logs every expense, so
// logged spend understates the real total, whereas a cash withdrawal is a complete, discrete
// event. This is still not the whole picture — card spending is not a withdrawal either, so
// someone who pays mostly by card will see an understated figure here too — which is why the
// field stays editable and the calculator says plainly what it is based on (see givingCalculator).
function loggedWithdrawalsHome() {
  const home = homeCurrency();
  let sum = 0, known = true;
  (store.trip.withdrawals || []).forEach((w) => {
    const cur = w.currency || home;
    const amt = parseFloat(w.amount) || 0;
    if (cur === home) { sum += amt; return; }
    const c = convert(amt, cur, home);
    if (c == null || isNaN(c)) known = false; else sum += c;
  });
  return known && sum > 0 ? Math.round(sum) : null;
}

// A private, opt-in "how much to give?" calculator. Three framings (a % of trip spend,
// a per-day amount over the length of stay, or a % of income). Everything typed stays on
// the device and is NEVER saved or sent — only the non-sensitive preset (method + %) is
// remembered. The app processes no money; the amount is a suggestion to give on the
// charity's own site.
function givingCalculator() {
  const home = homeCurrency();
  const g = store.profile.prefs.giving = store.profile.prefs.giving || { method: 'trip', pct: 1, perDay: 2, incPct: 1, days: '' };
  const card = h('div', { class: 'card give-back' }, [h('h2', {}, '🧮 How much to give?')]);
  card.append(h('p', { class: 'muted tiny', style: 'margin: var(--sp-0h) 0 var(--sp-2)' }, 'Giving is personal and entirely optional. Pick an amount whichever way suits you. Anything you type stays on this device and is never saved or sent — only the amount you choose to give, on the charity’s own site.'));

  const methods = [['trip', '💸 % of cash withdrawn'], ['day', '📅 Per day here'], ['income', '💰 % of income']];
  const methodRow = h('div', { class: 'chips' });
  const body = h('div', {});
  const result = h('p', { style: 'font-weight:800;font-size:1.25rem;margin: var(--sp-3) 0 var(--sp-0h)' });
  const note = h('p', { class: 'tiny muted', style: 'margin: 0' });
  const fmt = (v) => money(Math.max(0, Math.round(v || 0)), home);
  const setResult = (v, sub) => { result.textContent = `Suggested: ${fmt(v)}`; note.textContent = sub || ''; };
  const press = (row, el) => { row.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false')); el.setAttribute('aria-pressed', 'true'); };

  function renderBody() {
    body.innerHTML = '';
    if (g.method === 'trip') {
      const logged = loggedWithdrawalsHome();
      const amt = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Cash withdrawn in ${home}`, value: logged != null ? logged : '' });
      body.append(field(`Cash withdrawn (${home})${logged != null ? ' — from your logged withdrawals' : ''}`, amt));
      const pctRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [0.5, 1, 2, 5].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.pct === p ? 'true' : 'false', onclick: (e) => { g.pct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}%`)));
      body.append(pctRow);
      body.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-1) 0 0' }, 'Based on cash withdrawals, not the itemised expense log — not everyone logs every expense, so withdrawals are the more complete number. If you pay mostly by card, edit the amount above.'));
      const calc = () => { const n = parseFloat(amt.value) || 0; setResult(n * (g.pct / 100), `${g.pct}% of ${fmt(n)}. Many travellers give around 1% of what they withdraw on a trip.`); };
      amt.addEventListener('input', calc); calc();
    } else if (g.method === 'day') {
      const days = h('input', { type: 'number', inputmode: 'numeric', min: '0', placeholder: 'Days in the region', value: g.days || '' });
      body.append(field('Days in the region', days));
      const perRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [1, 2, 5, 10].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.perDay === p ? 'true' : 'false', onclick: (e) => { g.perDay = p; save(); press(perRow, e.currentTarget); calc(); } }, `${money(p, home)}/day`)));
      body.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 var(--sp-0h)' }, 'Amount per day'), perRow);
      const calc = () => { const d = parseFloat(days.value) || 0; g.days = days.value; setResult(d * g.perDay, `${money(g.perDay, home)} × ${d || 0} day${d === 1 ? '' : 's'}. A small daily amount adds up over a trip.`); };
      days.addEventListener('input', () => { save(); calc(); }); calc();
    } else {
      const inc = h('input', { type: 'number', inputmode: 'decimal', min: '0', placeholder: `Your monthly income in ${home}` });
      body.append(field(`Monthly income (${home}) — not saved`, inc));
      const pctRow = h('div', { class: 'chips', style: 'margin-top: var(--sp-1h)' }, [0.5, 1, 2].map((p) =>
        h('button', { class: 'chip', 'aria-pressed': g.incPct === p ? 'true' : 'false', onclick: (e) => { g.incPct = p; save(); press(pctRow, e.currentTarget); calc(); } }, `${p}% of a month`)));
      body.append(pctRow);
      body.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'Giving What We Can suggests pledging 10% of annual income to effective charities — a trip gift can be a first step.'));
      const calc = () => { const n = parseFloat(inc.value) || 0; const pct = g.incPct || 1; setResult(n * (pct / 100), `${pct}% of one month’s income (${fmt(n)}).`); };
      inc.addEventListener('input', calc); calc();
    }
  }
  methods.forEach(([id, label]) => methodRow.append(h('button', { class: 'chip', 'aria-pressed': g.method === id ? 'true' : 'false',
    onclick: (e) => { g.method = id; save(); press(methodRow, e.currentTarget); renderBody(); } }, label)));
  card.append(methodRow, body, result, note);
  card.append(h('p', { class: 'tiny muted', style: 'margin: var(--sp-2) 0 0' }, 'A suggestion, not a rule — give what feels right, or give your time instead. Choose a cause below to give on its official site.'));
  card.append(sourcesNote(GIVING_SOURCES, '2026-07'));
  renderBody();
  return card;
}

export function donateScreen() {
  const wrap = h('div', { class: 'screen' });
  wrap.append(topbar('Give back', '#home'));
  wrap.append(screenHint('Established non-profits working directly with people across Thailand, Vietnam, Cambodia and Laos. Each opens the organisation’s own official website, where you donate directly and securely.'));
  wrap.append(h('div', { class: 'banner' }, 'Mekonging takes no money and no cut, and never processes a payment. These links open external sites and need internet. Please do your own checks before giving.'));
  wrap.append(givingCalculator());

  // A dropdown in place of one heading per scope — the charity list filters to whichever
  // region or country is chosen, so it reads as one list rather than a page of headings.
  let scope = DONATE_ORGS[0].scope;
  const orgsWrap = h('div', {});
  function buildOrgs() {
    orgsWrap.replaceChildren();
    const grp = DONATE_ORGS.find((g) => g.scope === scope);
    if (!grp || !grp.items.length) {
      orgsWrap.append(h('p', { class: 'empty' }, `No listed charities yet for ${scope}.`));
      return;
    }
    grp.items.forEach((o) => {
      const r = o.rating;
      const ratingLine = r ? h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-1)' }, [
        r.rated ? `⭐ ${r.label} — ${r.evaluator} ` : `Unrated${r.evaluator ? ` (${r.evaluator}) ` : ' '}`,
        r.url ? h('a', { class: 'linklike', href: r.url, target: '_blank', rel: 'noopener noreferrer' }, r.rated ? 'source ↗' : 'why ↗') : null,
      ]) : null;
      const ratingNote = r && !r.rated ? h('p', { class: 'tiny muted', style: 'margin: 0 0 var(--sp-2)' }, r.note) : null;
      const contestedBlock = o.contested ? h('div', { style: 'margin: var(--sp-1) 0 var(--sp-2)' }, [
        h('div', { class: 'warn-note' }, `Contested: ${o.contested.note}`),
        ...(o.contested.sources || []).map((s) => h('p', { class: 'tiny', style: 'margin: var(--sp-0h) 0 0' },
          h('a', { class: 'linklike', href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.org))),
      ]) : null;
      orgsWrap.append(h('div', { class: 'card donate-card' }, [
        h('strong', {}, o.name),
        h('p', { class: 'muted', style: 'margin: var(--sp-1) 0 var(--sp-2)' }, o.what),
        ratingLine,
        ratingNote,
        contestedBlock,
        h('a', { class: 'btn ghost block', href: o.url, target: '_blank', rel: 'noopener noreferrer' }, 'Visit official site ↗'),
      ]));
    });
  }
  wrap.append(h('div', { class: 'card', style: 'margin-bottom: var(--sp-3)' }, [
    field('Show charities for', selectEl(
      DONATE_ORGS.map((g) => [g.scope, `${g.flag} ${g.scope}`]), scope,
      (v) => { scope = v; buildOrgs(); }, 'Show charities for',
    )),
  ]));
  wrap.append(orgsWrap);
  buildOrgs();
  wrap.append(h('p', { class: 'muted', style: 'margin-top: var(--sp-3)' }, 'Prefer to help in person? Eating at their training restaurants, buying their books, or volunteering supports the same work — ask at each organisation’s visitor centre.'));
  wrap.append(h('p', { class: 'disclaimer' }, 'Mekonging is not affiliated with these organisations and receives nothing from them. Ratings, where shown, are from the named independent evaluator linked, not Mekonging’s own judgement — this is a starting point, not financial advice, and does not resolve any flagged dispute. Confirm each charity independently before donating.'));
  mount(wrap, '#home');
}
