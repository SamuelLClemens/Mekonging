/* Sweep every real route and report what is broken, in one pass.
 *
 * HOW TO RUN IT. There is no `node` on this machine and this needs a live DOM anyway, so it
 * runs in the page. Serve the worktree (`python3 scripts/serve.py <port>`), open it, then
 * IMPORT it — from the DevTools console or from Claude Code's Browser pane javascript_tool:
 *
 *     const { routeSweep } = await import('/scripts/route-sweep.js');
 *     await routeSweep();                  // every route
 *     await routeSweep({ only: /journ/ }); // just the ones matching
 *     await routeSweep({ quiet: true });   // summary only, no per-route table
 *
 * It must be an import and not a pasted blob: index.html sets `script-src 'self'`, so eval()
 * of this file's text throws EvalError before a line of it runs. A dynamic import of a
 * same-origin path is what that policy allows. (It also sets window.routeSweep, so later
 * calls in the same page need no second import.)
 *
 * WHY THIS FILE EXISTS. This sweep has been written from scratch three times in three
 * sessions. It found a real defect every time — a truncated title, a screen rendering
 * nothing, a ReferenceError on a control nobody had clicked since a refactor. It was also
 * WRONG twice, in ways that read as confident passes, and both traps are now encoded below
 * rather than left to be rediscovered:
 *
 *   1. THE ROUTE LIST WAS HAND-TYPED. About twelve of the entries (#visas, #docs, #medical,
 *      #trips, #budget, #packing, #culture, #noticeboard) are not routes at all. They fall
 *      through the router's switch to Home, which renders perfectly — so the sweep graded
 *      Home a dozen times and reported a clean run while the screen it was supposed to be
 *      checking went unvisited. The list is now DERIVED from js/nav-groups.js, and any hash
 *      that lands on a screen it did not ask for is reported rather than counted as a pass.
 *
 *   2. LAYOUT IS NOT COMPUTED WHEN THE PAGE IS HIDDEN. The Browser pane is permanently
 *      `document.hidden`, and a hidden document has no layout: every getBoundingClientRect()
 *      returns 0. A width check against 0 does not fail loudly, it INVERTS — a sweep for
 *      clipped titles reported seven, and exactly one was real. So the layout checks here
 *      refuse to run until a non-zero rect proves layout exists, and say so instead of
 *      guessing. Force a paint first: in Claude Code, take one screenshot.
 *
 * Two more traps, both cheap to hit:
 *
 *   3. A LAZY ROUTE RETURNS BEFORE IT MOUNTS. Most screens arrive through a dynamic
 *      import(), so render() has returned while "Opening…" is still on screen. Waiting a
 *      fixed number of milliseconds does not fix this — setTimeout is clamped to about a
 *      second in a hidden tab, so a generous wait is also a slow one. This waits on a
 *      MutationObserver hit and then for the placeholder to be gone, yielding through a
 *      MessageChannel, which is not clamped.
 *
 *   4. innerText LIES on this app's screens. `content-visibility` on card-heavy screens makes
 *      off-screen content report as empty, and a <details> body returns "" from innerText
 *      even when open. Everything below reads textContent.
 */
const APP = () => document.getElementById('app');

// Real destinations that are not features in the taxonomy, each with its reason.
const EXTRA = [
  ['#home', 'the tab bar'],
  ['#me', 'the tab bar — the You hub, Settings lives inside it'],
  ['#places', 'the tab bar'],
  ['#explore', 'the tab bar'],
  ['#phrasebook', 'the tab bar'],
  ['#everything', 'the all-features index'],
  ['#search', 'the topbar magnifier'],
  ['#saved', 'the topbar star'],
  ['#sos', 'the topbar emergency control'],
  ['#welcome', 'onboarding, reachable directly and easy to break unnoticed'],
];

const yieldToTask = () => new Promise((resolve) => {
  // Not setTimeout: clamped to ~1s while the tab is hidden, which is every run in the
  // Browser pane. A MessageChannel port message is a task and is not clamped.
  const ch = new MessageChannel();
  ch.port1.onmessage = () => resolve();
  ch.port2.postMessage(0);
});

async function settle(opts) {
  // Waiting for ONE mutation is not enough, and this tool proved it on itself: the first run
  // graded #prices-th, #food-th, #danger and #family-th as nearly empty at 46-259 characters,
  // and a re-measure of the same four with a longer wait found 8079, 3116, 3304 and 11817.
  // Nothing was wrong with those screens. A route mounts an empty shell, and its lazy data
  // module lands a few ticks later and fills it — so a sweep that stops at the first mutation
  // records the shell, every time, and reports a clean-looking table of wrong numbers.
  //
  // So wait for the DOM to go QUIET: a run of ticks with no mutation at all, plus a wall-clock
  // floor, because an import() that has to hit the network is slower than any tick count.
  const o = opts || {};
  // Tuned against the two screens that kept moving after they looked finished. #nextstop
  // mounts in stages and reported "NO TOPBAR" at a 250 ms floor while a direct 900 ms
  // measurement of the same route found a topbar and 426 characters. Raising the floor is
  // the cheap fix; the expensive one is trusting a flag that is really a race.
  const quietTicks = o.quietTicks || 60;
  const minMs = o.minMs || 500;
  const maxMs = o.maxMs || 5000;
  const root = APP();
  let mutations = 0;
  let sinceMutation = 0;
  const obs = new MutationObserver(() => { mutations += 1; sinceMutation = 0; });
  obs.observe(root, { childList: true, subtree: true, characterData: true });
  const t0 = performance.now();
  let quiet = false;
  while (performance.now() - t0 < maxMs) {
    await yieldToTask();
    sinceMutation += 1;
    const opening = /Opening…|One moment\./.test(root.textContent || '');
    if (mutations && !opening && sinceMutation >= quietTicks && performance.now() - t0 >= minMs) {
      quiet = true;
      break;
    }
  }
  obs.disconnect();
  return { mutations, quiet, ms: Math.round(performance.now() - t0) };
}

function layoutIsComputed() {
  const r = document.body.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function foldPrefCount() {
  try {
    const raw = JSON.parse(localStorage.getItem('mekong.v1') || '{}');
    const m = (((raw.profile || {}).prefs || {}).sectionFolds) || {};
    return Object.keys(m).length;
  } catch (e) { return -1; }
}

async function routes() {
  const nav = await import('/js/nav-groups.js');
  const seen = new Map();
  nav.navItems().forEach((it) => {
    const hash = nav.resolveHash(it, 'th');
    if (!seen.has(hash)) seen.set(hash, `${it.groupTitle} › ${it.label}`);
  });
  nav.NAV_GROUPS.forEach((g) => {
    const hash = nav.groupHash(g.id);
    if (!seen.has(hash)) seen.set(hash, `hub › ${g.title}`);
  });
  EXTRA.forEach(([hash, why]) => { if (!seen.has(hash)) seen.set(hash, why); });
  return [...seen.entries()].map(([hash, from]) => ({ hash, from }));
}

async function routeSweep(opts) {
  const o = opts || {};
  const list = (await routes()).filter((r) => (o.only ? o.only.test(r.hash) : true));
  const haveLayout = layoutIsComputed();
  const errors = [];
  const onErr = (e) => errors.push({ hash: location.hash, msg: String((e && (e.message || e.reason)) || e) });
  window.addEventListener('error', onErr);
  window.addEventListener('unhandledrejection', onErr);

  const rows = [];
  const foldsBefore = foldPrefCount();
  for (const r of list) {
    errors.length = 0;
    location.hash = r.hash;
    const settled = await settle(o.settle);
    const root = APP();
    const title = document.querySelector('.topbar h1');
    const text = (root.textContent || '').trim();
    const heads = [...root.querySelectorAll('h1, h2, h3')]
      .map((n) => (n.textContent || '').trim()).filter(Boolean);
    const row = {
      hash: r.hash,
      from: r.from,
      title: title ? (title.textContent || '').trim() : '(no topbar)',
      chars: text.length,
      headings: heads.length,
      firstHeading: heads[0] || '',
      errors: errors.map((e) => e.msg),
      flags: [],
      ms: settled.ms,
    };
    // A screen still changing when it was measured makes every number in this row
    // provisional. Say so rather than reporting it as a result.
    if (!settled.quiet) row.flags.push('NEVER SETTLED — numbers unreliable');
    if (!title) row.flags.push('NO TOPBAR — title checks skipped');
    // A hash the router does not handle falls through to Home and renders perfectly. That
    // is the failure that reads as a pass, so name it.
    if (r.hash !== '#home' && row.title === 'Mekonging') row.flags.push('FELL THROUGH TO HOME');
    // Threshold set from the real empty states, not guessed: #vault renders 46 characters —
    // the topbar and the tab bar and nothing whatsoever between them — while the shortest
    // DESIGNED empty state, #journal, renders 88 and #nearby 237. Under 70 there is no screen
    // body at all, which is a defect; short-but-present is a copy question, not a bug.
    if (text.length < 70) row.flags.push('SCREEN RENDERS NOTHING');
    else if (text.length < 260) row.flags.push('very short — is the empty state saying enough?');
    if (!heads.length) row.flags.push('NO HEADING');
    // A <details> inside a <summary> concatenates the inner element's whole body onto the
    // heading — how Settings once read "Live translateⓘTranslation already works…".
    if (root.querySelector('summary details')) row.flags.push('DETAILS NESTED IN SUMMARY');
    const foldAll = root.querySelectorAll('.foldall, [data-foldall]');
    if (foldAll.length > 1) row.flags.push(`${foldAll.length} FOLD-ALL CONTROLS`);
    if (haveLayout && title) {
      // Two lines is the design (-webkit-line-clamp: 2). More than that is clipped, and a
      // single word wider than the column breaks mid-word, which is its own defect.
      const st = getComputedStyle(title);
      const lh = parseFloat(st.lineHeight) || parseFloat(st.fontSize) * 1.2;
      const lines = Math.round(title.scrollHeight / lh);
      if (title.scrollWidth > title.clientWidth + 1) row.flags.push('TITLE CLIPPED');
      if (lines > 2) row.flags.push(`TITLE ${lines} LINES`);
      if (lines > 1 && !/\s/.test(row.title)) row.flags.push('TITLE BREAKS MID-WORD');
    }
    rows.push(row);
  }
  window.removeEventListener('error', onErr);
  window.removeEventListener('unhandledrejection', onErr);
  const foldsAfter = foldPrefCount();

  const broken = rows.filter((r) => r.flags.length || r.errors.length);
  if (!o.quiet) {
    const table = rows.map((r) => ({
      hash: r.hash, title: r.title, chars: r.chars, h: r.headings,
      problem: [...r.flags, ...r.errors].join(' | ') || '',
    }));
    if (console.table) console.table(table); else console.log(table);
  }
  const summary = {
    routes: rows.length,
    clean: rows.length - broken.length,
    broken: broken.map((r) => ({ hash: r.hash, from: r.from, problem: [...r.flags, ...r.errors] })),
    // Visiting a screen must not write a preference. Inserting a <details open> fires a
    // toggle event, and an early build recorded "this is how it already was" hundreds of
    // times, hitting localStorage on every render to do it.
    foldPrefsWritten: foldsAfter - foldsBefore,
    layoutChecked: haveLayout,
  };
  if (!haveLayout) {
    summary.WARNING = 'Layout was NOT computed — the page is hidden, so every rect is 0 and '
      + 'the title checks were SKIPPED, not passed. Force a paint (take one screenshot) and '
      + 'run again before trusting any title result.';
  }
  if (summary.foldPrefsWritten > 0) {
    summary.NOTE = `${summary.foldPrefsWritten} fold preferences were written just by `
      + 'visiting. Only a real closure should ever be stored — see rememberFold() in js/main.js.';
  }
  console.log(summary.WARNING || `layout checks ran (page is visible)`);
  console.log(`${summary.clean}/${summary.routes} clean · ${summary.broken.length} with problems`
    + ` · ${summary.foldPrefsWritten} fold prefs written`);
  return summary;
}

window.routeSweep = routeSweep;
window.routeSweepRoutes = routes;

export { routeSweep, routes as routeSweepRoutes };
