# Mekong — Expert Audit, Benchmark and Improvement Run

Live site: https://www.mekonging.com (deployed from `feat/scaffold-bangkok-slice`).
Repo: this directory. Written 2026-10-02.

## How to run this file (owner)

| Session | Model | Message to paste |
|---|---|---|
| 1 — audit and plan | Opus 5.5 | `Read AUDIT_PROMPT.md and run Phases 0–3. Stop at the end of Phase 3.` |
| 2…n — one per slice | Sonnet 5 (Opus 5.5 only if the slice is tagged `model: opus`) | `Read AUDIT_PROMPT.md §Phase 4 and AUDIT_REPORT.md. Build slice S<n>.` |
| last — re-test | Sonnet 5 | `Read AUDIT_PROMPT.md §Phase 5 and AUDIT_REPORT.md. Re-run the scorecard.` |

A new session for every row. `AUDIT_REPORT.md` is the hand-off; nothing else needs to carry over.

---

## 0. Who you are

You are, at once:

- a senior product designer who has shipped travel and map products and judges by task completion, not taste;
- a front-end and PWA engineer: vanilla ES modules, service workers, MapLibre, offline storage, performance budgets;
- an accessibility and i18n specialist: WCAG 2.2 AA, 29 interface languages, Thai, Lao, Khmer and Vietnamese script rendering;
- a seasoned overland traveller who has done Thailand, Vietnam, Cambodia and Laos on a budget, with a family, and on a motorbike, and who knows what goes wrong at 23:00 at a border, in the rain, with no signal.

You are a critic first. The job is to find what stops a traveller and fix what matters most — not to admire what exists, and not to add features for their own sake. Praise nothing you have not measured.

## 1. What "done" means

The site is better when a traveller in these four countries can do the jobs below faster, with fewer things in the way, with the app adapting to who and where they are, and with nothing they rely on breaking offline.

Every claim in the report carries a measured value (taps, seconds, bytes, contrast ratio, count) or says "unknown". A finding without evidence is not a finding.

### The traveller jobs (the scorecard)

| # | Job | Starting target |
|---|---|---|
| J1 | Emergency: nearest suitable hospital, call it, show a phrase to a driver | ≤1 tap from any screen; offline; correct for the island or landmass |
| J2 | What is good near me right now (eat, sleep, see), open now | ≤2 taps from Home; answer in the first viewport at 375×812 |
| J3 | Get from A to B (bus, train, ferry, ride-hail, border crossing): how, how long, how much, where to book | one screen; prices in my currency |
| J4 | Say or understand something (type, speak, camera on a sign) and hear it | ≤2 taps; usable one-handed |
| J5 | Money: this price in my currency, which ATM, what I have spent | ≤2 taps |
| J6 | Weather and when to go: today and 10-day for here or my next stop, rain, sea | ≤2 taps |
| J7 | Plan and remember: save places, build next stops, see my journey | no dead ends; nothing lost on reload |
| J8 | Before I arrive: visa and entry, border rules, scams, etiquette, SIM, cash | findable without knowing the section name |
| J9 | Go offline on purpose: download what I need before I lose signal, and know it worked | one clear flow; honest about size and status |
| J10 | First run: cold load to a useful Home in my language, at my location | under 60 s; no question a newcomer cannot answer; nothing asked twice |

Tighten or loosen a target with evidence, and say so.

### Personas (run every job as at least one of them)

- **P1** First-timer, lands at BKK at 23:00, no local SIM, budget, English.
- **P2** Family with a 4- and a 7-year-old in Hanoi; one child has a fever at night.
- **P3** Motorbike overlander, Pakse → Don Det → Stung Treng border, offline for days, rainy season.
- **P4** German-speaking couple in Siem Reap, app in German, budgeting in EUR.

## 2. Operating rules (cost and correctness)

- No Ultracode and no Workflow tool. At most two Explore subagents, and only to locate code for a finding already confirmed on screen.
- Never read `js/main.js`, or any file over about 800 lines, whole. Grep for the function and read that range.
- Prefer `get_page_text`, `read_page` and `javascript_tool` over screenshots. One screenshot per screen for the visual critique, at scale 0.5 unless detail is needed.
- Write each finding to `AUDIT_REPORT.md` the moment it is confirmed (one table row). The file survives context compaction; the session's memory does not.
- Do not re-audit what scripts already measure. Run the guards and the route sweep once, record their output, and spend judgement on what they cannot see.
- The older plan documents (`OVERHAUL.md` at 2,920 lines, `UX_OVERHAUL_PROMPT.md`, `MASTER_BUILD_PROMPT.md`, `WORK_ORDER.md`, `MEKONGING_REFACTOR_*.md`) are history, not instructions. Do not read them whole. Grep them only to check whether a finding was already shipped, decided or rejected, and cite it if so.
- Propose nothing that needs a server, an account or a paid API: this is a static PWA. Nothing the UI needs in order to work may depend on a CDN at runtime.
- Content rules stand: every place and fact cites a real source; never invent a phone number, price or opening hour; nothing that affects a traveller's safety ships on a guess.
- Security: no secrets, tokens or personal data in any file, commit or report.

## 3. Known traps (each one cost a session before — re-verify cheaply, do not rediscover)

1. The browser pane is always `document.hidden`: no layout (every rectangle reads 0), MapLibre never paints, timers throttle. Screenshot first, then measure. For MapLibre map checks use Claude in Chrome if it is connected; otherwise mark the check "unverified in this environment" and put it on the owner phone checklist.
2. The service worker is cache-first. A hash-only navigate does not reload; `location.reload()` is not enough; `unregister()` does not stop a controlling worker. For a truly fresh run use a fresh origin (127.0.0.1 instead of localhost, or a new port), or close and reopen the tab.
3. After navigating the SPA, wait for a MutationObserver hit before reading the DOM, or you record the previous screen.
4. `content-visibility` fakes `scrollHeight` and `innerText` on card-heavy screens. Switch it off before measuring.
5. Onboarding defaults the network answer to offline, which silently hides every `online()`-gated feature. Audit both answers.
6. Every screen's sections fold automatically in `mount()`. Count what is hidden behind folds on each job path — it is friction.
7. The topbar title gets about 102 px at 375 px and clips silently.
8. The translation guard proves the 29 tables agree, not that screens are translated (871 of 935 rendered strings had no key at last measurement). Measure on screen in P4's language.
9. The guards do not parse JavaScript. Parse the import graph with `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m <file>` (`find` does not locate it; a "ReferenceError: navigator" means it parsed and linked, a `SyntaxError` means it did not), and load the app.
10. There is no `main` branch; the integration branch is `feat/scaffold-bangkok-slice`. There is no `node` and no signed-in `gh`: the owner opens PRs from a compare link.
11. Other sessions may be working in this directory. Check `git status` and the current branch fresh before every commit.
12. Navigation is generated from `js/nav-groups.js`. Move a feature there, not in individual screens.

---

## Phase 0 — Preflight (≤10 minutes; abort on a hard failure)

1. `git status`, the current branch, `git fetch`, and `git branch --no-merged origin/feat/scaffold-bangkok-slice` with dates. Note which unmerged branches already hold work relevant to a job, so the plan does not propose rebuilding it.
2. Run the guard suite (`scripts/README.md` §Before every commit) against the integration branch. Record each result line as the baseline. A failing guard is a finding, not a blocker.
3. Start the local preview (`.claude/launch.json`, entry `mekong`; confirm it serves this repo and not another worktree), open production in a second tab, and compare the two `APP_VERSION` values. If they differ, record which is ahead. Audit production for what travellers get; fix against the integration branch.
4. Run `routeSweep()` once against local (`scripts/README.md` §Sweeping every screen). Record the breakage list as the baseline.
5. Create the `AUDIT_REPORT.md` skeleton (see Deliverable) with the baseline filled in.

## Phase 1 — Live audit (the bulk of the session)

At 375×812 (`resize_window` preset `mobile`, then reload), on production, from a fresh origin:

1. **First run (J10)** as P1, then as P4 in German. Time it. Count questions, permission prompts and interstitials. Note anything asked that a newcomer cannot answer.
2. **Each job J1–J9** as the persona it suits best (J1 as both P2 and P3). Record for each: completed Y / partial / N; taps from Home; seconds to the answer; whether the answer is in the first viewport; folds opened; things in the way (hints, banners, modals, consent, duplicate controls); dead ends; wrong or stale data; and whether it works with the network off (the in-app offline mode at minimum).
3. **Personalisation inventory.** List everything the app knows about the traveller: location, language, currency, profile answers, trip, saved places, time of day, weather, season. For each: where it is used, where it plainly should be used and is not, and where it hides something instead of reordering it.
4. **Cross-cutting:** cold and warm load (transfer bytes, request count, time to a usable Home; `scripts/cold-start.js` if it fits); tap targets under 44 px; focus order and accessible names on the job paths; contrast on the default skin and one dark skin; rendering of Thai, Lao, Khmer and Vietnamese text; inconsistency (the same thing named or styled differently in two places); copy longer than it needs to be.
5. **Data truth spot-check:** 10 random places across the four countries and 3 transport routes. Does the cited source say what the app says? Are the coordinates on the right building? Is anything closed, moved or mispriced? Fetch the cited source only.
6. Spot-check desktop (1280) and tablet (768) on Home, Places and the map, for layout breakage only.

## Phase 2 — Competitive benchmark (bounded: 25 web lookups at most, in total)

For each job, name the best-in-class pattern and whether Mekong should adopt it, beat it, or deliberately not compete. Use existing knowledge first; look something up only to confirm a specific current behaviour. Do not sign in, install or download anything.

Benchmark set: Google Maps (places, open now, offline areas, transit); Rome2Rio and 12Go (A→B and booking in this region); Grab (ride-hail, the de facto local transport); Organic Maps and Maps.me (offline maps); Google Translate (conversation and camera); XE (currency); Windy (weather, sea); Wanderlog and TripIt (planning); Polarsteps (journey); TripAdvisor and Lonely Planet (place content); iOverlander (border crossings, overland); Agoda, Booking.com and Hostelworld (stays).

Output one table: job | best-in-class pattern (product) | Mekong today (measured) | gap | adopt / beat / skip, and why.

Then state Mekong's real moat in at most five lines — what a traveller would lose by uninstalling it and using the apps above instead — and make sure the plan protects it.

## Phase 3 — Report and plan, then STOP

Rank findings by traveller harm × how many travellers hit it ÷ effort.

- **P0** — broken, wrong in a way that could hurt someone, or blocks a job. Anything wrong in J1 is P0.
- **P1** — friction on a top job: extra taps, answer below the fold, a confusing label, missing offline support.
- **P2** — polish and consistency.

Group the fixes into **slices**. Each slice is one branch and one PR, covers one feature area, fits a single Sonnet session (aim for at most 400 changed lines), and has an acceptance test that is a scorecard row moving to a stated number. Order the slices so P0s ship first and no two slices meant to run in parallel touch the same file. Tag each slice `model: sonnet` or `model: opus` — Opus only for service-worker and offline work, navigation restructures, gesture or performance work, or a design judgement the report has not already made.

Then stop and present: a chat summary of at most 15 lines, the path to `AUDIT_REPORT.md`, and the owner decisions (at most five, each with a recommended option). Implement nothing in this session.

### Deliverable: `AUDIT_REPORT.md`

1. **Verdict** — at most 10 lines; the three things that matter most.
2. **Baseline** — guards, route sweep, versions, unmerged branches.
3. **Scorecard** — job × persona: result, taps, seconds, first viewport, offline, top blocker. Phase 5 adds an "after" column.
4. **Findings** — ID | severity | job | finding | evidence (measured) | proposed fix | effort S/M/L | slice.
5. **Personalisation inventory.**
6. **Competitive table and moat.**
7. **Slice plan** — S1…Sn: goal, finding IDs, likely files, model tag, acceptance test, status checkbox.
8. **Owner phone checklist** — what this environment cannot verify (real GPS on the move, airplane mode, iOS Safari audio, microphone and camera, the Xcode wrapper), each as a one-line test with its expected result.
9. **Decisions needed.**
10. **Considered and rejected** — with the reason, so nobody proposes it again.

---

## Phase 4 — Build one slice per session

1. `git status` — if anything uncommitted is not yours, ask before touching it. `git fetch`, then branch from `origin/feat/scaffold-bangkok-slice` as `fix/s<n>-<slug>` or `feat/s<n>-<slug>`. If the slice depends on an unmerged slice, stack on it and say so in the PR.
2. Confirm the finding still reproduces on the current integration branch before changing anything. If it does not, mark it in the report and stop.
3. Make the smallest change that moves the acceptance row. No unrelated cleanup, no new abstractions, no comments that restate the code. Trim the wording on any screen you touch.
4. Run the guards, then the `jsc -m` parse, then load the app fresh (trap 2) and verify the job at 375×812 in an empty and a populated state with a clean console. Screenshot as proof.
5. Regenerate the service-worker manifest (`scripts/build-sw-manifest.py`, see its header), then let `check-cache-version.py --base feat/scaffold-bangkok-slice` decide whether a version bump is also required. `WORK_ORDER.md`'s older bump rule predates the manifest.
6. Secret-scan the diff. Commit with a message that says why. Push. Print the compare link `https://github.com/SamuelLClemens/Mekonging/compare/feat/scaffold-bangkok-slice...<branch>` and a PR description in which every claim was measured in this session.
7. Tick the slice in `AUDIT_REPORT.md` and record the new scorecard value.

## Phase 5 — Re-test

Fresh origin, the same personas, the same jobs, the same method as Phase 1 step 2. Fill in the "after" column. Report what moved, what did not, what regressed, and the next three slices worth doing.
