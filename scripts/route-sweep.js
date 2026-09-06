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
 *     await routeSweep({ clicks: true });  // ALSO press what is safe to press
 *
 * The default pass never clicks anything, so it is safe to run against real data. It still
 * catches both of the regressions that shipped in mk-v0.518.0 — a control that arrives
 * disabled, and a <summary> trapped inside its card's own grid — because neither needed a
 * click to see. `clicks: true` additionally presses screen buttons and reports what throws,
 * skipping anything whose name suggests it deletes, sends, exports or spends (NEVER_CLICK).
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

// ---- CONTROLS -------------------------------------------------------------------------
// Two regressions shipped in three releases and BOTH were found by the user rather than by
// this sweep, because the sweep asked "does the screen render" and never "do its controls
// work". Both are catchable, and — this is the part worth keeping — neither needs a click:
//
//   * Talk's first-lesson audio button rendered `disabled` on every language (canSay() was
//     called without its locale, and it returns false when it has none). A control that
//     arrives disabled with nothing on screen saying why is the shape of that defect.
//   * The You hub's quick-access row put its <summary> inside the card's own two-column
//     grid, so the heading took a whole column and the chips stacked down the other. A
//     <summary> is a fold's handle; it must never be a grid or flex ITEM.
//
// So the default pass stays read-only and safe to run anywhere. Clicking is opt-in
// (`routeSweep({ clicks: true })`) and even then refuses anything whose name suggests it
// destroys, sends or spends — see NEVER_CLICK.

// Never clicked, even with clicks:true. Matched against the accessible name. Deliberately
// broad: a false skip costs one unchecked button, a false click could wipe a traveller's
// journal or fire a share sheet.
const NEVER_CLICK = /delete|remove|erase|wipe|reset|clear|discard|destroy|forget|revoke|unpair|unsave|unpin|sign ?out|log ?out|leave|import|restore|export|download|share|send|email|pay|buy|donate|purchase|subscribe|call|dial/i;

function accName(el) {
  return (el.getAttribute('aria-label') || el.title || el.textContent || '').trim();
}

// Does this control have an accessible name by ANY of the routes a browser actually uses?
// The first version of this checked aria-label, title and text only, and duly reported ~50
// "unnamed" controls across fourteen screens. Almost every one was a false positive: this
// codebase labels its inputs with field() in js/ui-widgets.js, which emits a real
// <label for="…">, and a wrapping <label> works too. A check that cries wolf is worse than
// no check — so this honours every mechanism, and a placeholder counts as a weak last resort
// because browsers do fall back to it.
function hasName(el) {
  if (accName(el)) return true;
  if (el.getAttribute('aria-labelledby')) return true;
  if (el.querySelector('img[alt]:not([alt=""])')) return true;
  if (el.closest('label')) return true;
  if (el.id) {
    const esc = (window.CSS && CSS.escape) ? CSS.escape(el.id) : el.id;
    try { if (document.querySelector(`label[for="${esc}"]`)) return true; } catch { /* odd id */ }
  }
  if (el.placeholder && el.placeholder.trim()) return true;
  if (el.type === 'hidden') return true;
  return false;
}

// Controls belonging to the SCREEN, not the app shell. The topbar and tab bar are on every
// route; they say nothing about the screen and clicking them navigates away.
function screenControls(root) {
  return [...root.querySelectorAll('button, [role="button"], input, select, textarea')]
    .filter((el) => !el.closest('.topbar') && !el.closest('.tabbar'));
}

// A closed <details> that renders its body only when opened is invisible to any audit — which
// is exactly where Talk's broken audio lived. Open everything first, and let the screen
// settle again so lazily-imported bodies land. Nothing is persisted by this: rememberFold()
// records closures only, so opening a section writes no preference.
async function openEveryFold(root) {
  const shut = [...root.querySelectorAll('details:not([open])')];
  if (!shut.length) return 0;
  shut.forEach((d) => { d.open = true; });
  await settle({ quietTicks: 30, minMs: 250, maxMs: 2500 });
  return shut.length;
}

// Zero size is only a finding if it is STILL zero after another turn of the event loop. A
// control inside a <details> that openEveryFold has just opened can measure 0 for a frame or
// two while the disclosure settles — Home reported one every run, and a direct measurement of
// the same screen afterwards found none. Anything that reports a transient as a defect earns
// the same distrust as reporting nothing at all.
async function stillZeroSized(candidates) {
  if (!candidates.length) return [];
  await yieldToTask();
  await yieldToTask();
  return candidates.filter((el) => {
    if (!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width < 1 || r.height < 1;
  });
}

async function controlAudit(root, haveLayout) {
  const flags = [];
  const ctrls = screenControls(root);

  // Arrived disabled, with nothing saying why. Some are legitimate (a submit before anything
  // is typed, a "already saved" marker), so this reports the count and names and leaves the
  // judgement to a person rather than failing the sweep.
  const dead = ctrls.filter((el) => el.disabled && !el.closest('form'));
  if (dead.length) {
    const names = [...new Set(dead.map(accName).filter(Boolean))].slice(0, 4);
    flags.push(dead.length + ' CONTROL(S) DISABLED ON ARRIVAL — ' + (names.join(', ') || '(unnamed)'));
  }

  // A <summary> is the handle of its <details>. If its parent lays children out, the summary
  // has become a grid/flex item and the fold's contents are laid out around it.
  if (haveLayout) {
    const trapped = [...root.querySelectorAll('details > summary')].filter((sum) => {
      const d = getComputedStyle(sum.parentElement).display;
      return d === 'grid' || d === 'flex' || d === 'inline-grid' || d === 'inline-flex';
    });
    if (trapped.length) {
      flags.push(trapped.length + ' SUMMARY IN A GRID/FLEX PARENT — '
        + trapped.map((x) => accName(x).slice(0, 24)).join(', '));
    }
    const invisible = ctrls.filter((el) => {
      if (el.type === 'hidden' || el.hidden) return false;
      // A visually-hidden <input type=file> driven by a styled button next to it is the
      // standard way to make a file picker look like the rest of an app, and this codebase
      // uses it on the vault, the scrapbook and Settings. It is operated through its trigger,
      // never directly, so neither its size nor its own name is a defect.
      if (el.type === 'file') return false;
      // `display: none` and `visibility: hidden` are PROPERLY hidden: not rendered, not
      // focusable, not announced. The defect this looks for is the opposite — an element
      // still in the tab order and still clickable that happens to have no size.
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width < 1 || r.height < 1;
    });
    const reallyZero = await stillZeroSized(invisible);
    if (reallyZero.length) {
      flags.push(reallyZero.length + ' ZERO-SIZE CONTROL(S) — '
        + reallyZero.slice(0, 3).map((el) => accName(el).slice(0, 24) || el.tagName.toLowerCase()).join(', '));
    }
  }

  // Nothing a screen reader can announce it by, through any mechanism.
  const unnamed = ctrls.filter((el) => el.type !== 'file' && !hasName(el));
  if (unnamed.length) {
    flags.push(unnamed.length + ' CONTROL(S) WITH NO ACCESSIBLE NAME — '
      + unnamed.slice(0, 4).map((el) => el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : '')).join(', '));
  }

  return { flags, total: ctrls.length };
}

// Opt-in. Presses what is safe to press and reports what threw. The hash is restored after
// each press, because a control that navigates would carry the sweep off-route.
async function clickAudit(root, hash, errors) {
  const out = [];
  const targets = screenControls(root).filter((el) => el.tagName === 'BUTTON'
    && !el.disabled && !NEVER_CLICK.test(accName(el)) && !el.closest('form'));
  for (const el of targets.slice(0, 12)) {
    if (!el.isConnected) continue;
    const before = errors.length;
    try { el.click(); } catch (e) { out.push(accName(el).slice(0, 28) + ': ' + String((e && e.message) || e)); }
    await yieldToTask();
    if (errors.length > before) out.push(accName(el).slice(0, 28) + ': ' + errors[errors.length - 1].msg);
    if ((location.hash || '') !== hash) { location.hash = hash; await settle({ minMs: 150, maxMs: 900 }); }
    const sheet = document.querySelector('.sheet-backdrop, .modal-backdrop');
    if (sheet) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await yieldToTask(); }
  }
  return out;
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
    // The two failures that a character count alone reports as merely "short". Both have now
    // happened: a lazy screen module whose import throws lands on the router's honest
    // "could not open" card (~200 characters), and a syntax error in main.js itself leaves
    // the app on its splash forever (~55 characters on every route at once). Twelve guards
    // were green for both, because none of them parses JavaScript.
    if (/This screen could not open/.test(text)) {
      const detail = [...root.querySelectorAll('details, pre, code, .muted')]
        .map((n) => (n.textContent || '').trim()).filter(Boolean).pop() || '';
      row.flags.push('SCREEN FAILED TO OPEN — ' + detail.slice(-90));
    } else if (/Loading your companion/.test(text)) {
      row.flags.push('APP NEVER BOOTED — main.js did not evaluate');
    } else if (text.length < 70) row.flags.push('SCREEN RENDERS NOTHING');
    else if (text.length < 260) row.flags.push('very short — is the empty state saying enough?');
    if (!heads.length) row.flags.push('NO HEADING');
    // A <details> inside a <summary> concatenates the inner element's whole body onto the
    // heading — how Settings once read "Live translateⓘTranslation already works…".
    if (root.querySelector('summary details')) row.flags.push('DETAILS NESTED IN SUMMARY');
    const foldAll = root.querySelectorAll('.foldall, [data-foldall]');
    if (foldAll.length > 1) row.flags.push(`${foldAll.length} FOLD-ALL CONTROLS`);
    // Open every fold before auditing controls, or anything inside a closed section — which
    // is where Talk's broken audio lived — is invisible to the checks below.
    row.opened = await openEveryFold(root);
    const ca = await controlAudit(root, haveLayout);
    row.controls = ca.total;
    row.flags.push(...ca.flags);
    if (o.clicks) {
      const broke = await clickAudit(root, r.hash, errors);
      if (broke.length) row.flags.push(`CLICK THREW — ${broke.join(' | ')}`);
    }
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
    controls: rows.reduce((n, r) => n + (r.controls || 0), 0),
    clicked: !!o.clicks,
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
