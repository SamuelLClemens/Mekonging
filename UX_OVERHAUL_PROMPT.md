# Mekong — UX Overhaul Master Prompt

Status: authored 2026-08-13. Baseline `mk-v0.381.0`, branch `feat/deep-content`.

This document is the complete, self-contained brief for the next phase of work. It is written
so that a fresh session with no prior context can pick up any single slice and execute it
without re-deriving intent. Do not execute the whole document in one pass — see §6.

---

## 1. The problem, in the traveller's words

Direct report, 2026-08-13:

- Home shows "Right now" and "Nearby picks" as two separate blocks. They are the same idea.
- "Plan your next stop" is a chip that goes nowhere useful. "Just arrived" has a real
  first-hour guide behind it; "Plan your next stop" has no equivalent and needs building out.
- Help text everywhere means the tools are below the fold. Too much scrolling to reach
  anything. Text should be minimal, or gone, or behind a small ⓘ.
- Budget categories still appear differently in different sections and behave differently.
  Reported three times. Two prior "fixed" claims were wrong.
- Bottom navigation is in the wrong order, and the sections do not own coherent jobs.
- "You" should be personalised and fully open, not a wall of collapsed groups.

Synthesised into one sentence, the goal of this overhaul:

> **A traveller reaches the tool they need without reading a paragraph and without scrolling.**

---

## 2. Non-negotiables (standing project rules)

These apply to every slice. They are not optional and not up for re-litigation.

- Never push directly to `main`. Work on `feat/deep-content`, merge `--no-ff` into
  `feat/scaffold-bangkok-slice`, push, confirm the version bump is live.
- Never commit secrets, tokens, API keys, PII, or credentials.
- Bump `APP_VERSION` (`js/main.js`) and `CACHE_VERSION` (`sw.js`) together, every ship.
- Any new JS module must be added to the `PRECACHE` array in `sw.js`. A missing module
  breaks the UI silently when offline.
- No static-site runtime dependency on an external CDN for data required to make the UI
  interactive. Self-host it.
- Verify against the **actual rendered screen at 375×812**, not by reading code. Two prior
  regressions in this project were caused by concluding "already correct" from code alone.
- Drive test state through the app's own live `store` and `save()` (via dynamic
  `import('/js/state.js')` in an already-loaded tab). Do **not** edit `localStorage` directly:
  `state.js`'s backup-preference logic and its `pagehide` flush will silently revert the edit.

---

## 3. Design principles for this overhaul

These are the rules that resolve ambiguity when a slice does not specify something.

1. **The first viewport is sacred.** At 375×812, every screen must show its primary
   interactive tool without scrolling. Everything else earns its place below.
2. **Prose is guilty until proven useful.** Default verdict on any explanatory sentence is
   DELETE. If the information is genuinely needed, it goes behind ⓘ. If it must be visible,
   it gets eight words or fewer.
3. **One idea, one block.** If two blocks answer the same traveller question, they merge.
4. **Rank, collapse, never remove.** No destination may be lost in a reorganisation. It may
   move, be demoted to a chip, or fold — it may not disappear.
5. **Back always returns.** Wherever a traveller came from is where Back sends them.
6. **Personal means named.** Once a name is set, the traveller's own content carries it.
7. **Reuse before building.** This codebase already contains route planning, context scoring,
   a profile lens, an itinerary builder, and place data. New features compose them.

---

## 4. Verified current-state facts

Established by direct inspection on 2026-08-13. Line numbers are against `mk-v0.381.0`.

| Fact | Location |
|---|---|
| `main.js` is 13,728 lines | `js/main.js` |
| `render-utils.js` (158) and `ui-widgets.js` (212) already extracted | prior refactor slices 1a/1b complete |
| `TABS` order: home, explore, places, phrasebook(Talk), me(You) | `js/main.js:386` |
| Tab label is already live-computed from the name | `meTabLabel()`, `js/main.js:274` |
| Home renders three separate foldables: Right now / Nearby picks / Budget | `js/main.js:2177-2179` |
| Context scoring by weather, time of day and situation already exists | `js/main.js:561`, `801` |
| `homeFold(label, inner, prefKey)` is the shared collapsible | `js/main.js:2137` |
| "Just arrived" chip leads to a real first-hour guide | `justArrivedChip()` `js/screens/home.js:283` → `arrivalScreen` `js/main.js:3233` |
| "Planning your next stop" chip currently leads only to `#trip` | `nextStopNudgeChip()`, `js/screens/home.js` |
| Single expense category source of truth exists | `EXP_CATS` `js/main.js:10038`, `expCatsAll()` `:10049`, `expCatPicker()` `:10084` |
| Home and Budget both use the same `expenseAddCard` | `js/main.js:10171`, called from `quickSpendRow` `:2079` with `compact:true` |
| `.exp-add-compact` CSS is padding/margin only — hides nothing | `css/style.css:762-767` |
| ~255 `muted` strings in `main.js` alone | census in progress |
| `meHubScreen` chip groups: "Your stuff" open, "Plan & prepare" and "You & settings" closed | `js/main.js:2230-2384` |
| Name personalisation exists on dictionary and journey only | `js/main.js:4397`, `7505`, `7598` |
| An in-app back stack already exists | `js/main.js:~400` |

**Consequence of the compact-CSS finding:** the budget-category complaint is *not* explained
by the Home/Budget compact variant hiding controls. The real cause is elsewhere and must be
found empirically in the live DOM — see W4.

---

## 5. Workstreams

Each workstream is independently shippable and has testable acceptance criteria.

### W1 — Home: merge "Right now" and "Nearby picks" into one context block

**Why:** they answer the same question. Two collapsibles double the vertical cost of one idea.

**Build:**
- Collapse `homeFold('🕒 Right now', …)` and `homeFold('📍 Nearby picks', …)` into a single
  foldable with one pref key. Migrate the two old pref keys (`rightNowHeadOpen`,
  `rightNowPicksOpen`) so an existing traveller's open/closed choice is preserved, defaulting
  to open if either was open.
- The merged block leads with the live moment (weather, time of day) as a single compact
  line, then the ranked picks directly beneath.
- Surface *why* these picks, in four words or fewer, from the existing scoring signals —
  for example "Indoor · raining" or "Open now · evening". The scoring already computes this
  (`js/main.js:561`, `801`); it is currently not shown.
- Keep the existing category filter and profile lens behaviour.

**Acceptance:**
- One collapsible replaces two, on every phase where both previously rendered.
- At 375×812, the picks list is visible without scrolling on the Traveling phase.
- No pick that rendered before the merge fails to render after it.
- An existing traveller's collapse preference is not reset.

**Difficulty:** MODERATE. **Reuse:** high — scoring, filter and picks list all already exist.

---

### W2 — "Plan your next stop": build the real tool

**Why:** the biggest functional gap. "Just arrived" has `arrivalScreen` behind it. Its
counterpart has nothing. The traveller explicitly wants to *navigate where they are, plan
where they go next, feel prepared to arrange the travel, and explore what they could do there.*

**Build a new screen `#nextstop`, mirroring `arrivalScreen` in weight and structure:**

1. **Where you are** — current hub, days spent here, what is still unseen nearby. One line.
2. **Where next** — ranked candidate destinations reachable from here. Reuse Explore's
   existing "Where next" mini itinerary builder (shipped as task #138: chain, cumulative
   time, add-to-My-Trip) rather than writing a second one.
3. **Getting there** — for the selected candidate: transport modes, duration, rough cost,
   practical notes. Reuse `planRoutes` (already powering Home's next-stop card, task #54).
   Must degrade honestly offline rather than showing nothing.
4. **What is there** — top places at the candidate, filtered through the existing profile
   lens (task #146), so a family and a solo hiker see different shortlists.
5. **Commit** — set dates and add to `store.trip.stops`, which makes Home's existing
   next-stop card light up and self-clears the nudge chip.

**Then:** repoint `nextStopNudgeChip()` from `#trip` to `#nextstop`, so the chip and the
"Just arrived" chip are true structural mirrors — same style, same weight, both leading to a
real tool.

**Acceptance:**
- The chip leads to `#nextstop`, not `#trip`.
- With no next stop set, a traveller can go chip → pick a destination → see how to get there
  → see what is there → add it to the trip, without leaving the flow.
- Adding the stop from `#nextstop` makes the Home nudge chip disappear on next render.
- Works offline for everything except live route lookups, which degrade with an honest label.

**Difficulty:** STRUCTURAL — this is the single largest slice. **Reuse:** high, but it is new
surface area.

---

### W3 — The ⓘ pattern, then the site-wide copy purge

**Why:** the traveller's most-repeated complaint. Text is pushing tools below the fold.

**CENSUS COMPLETE, 2026-08-13.** 311 deduplicated findings carrying **approximately 34,771
characters** of removable prose. The worst 60 strings carry 13,223 of those characters — under
one percent of the file's lines holds over a third of the prose weight. Sweep those first.

**Finding that changes the approach.** Across the worst 60, the verdicts fell out as
TIGHTEN 26, INFO-ICON 23, KEEP 10, **DELETE 1**. The instinct to "remove it all together" does
not survive contact with the actual strings: almost none of this is noise. It is real
information in the wrong place. The ⓘ pattern is therefore the primary tool, not the fallback,
and outright deletion is the rare case.

**The mechanism already exists — do not invent one.** Native `<details>` / `<summary>`
disclosures are already used throughout (Help FAQ, family sections, phrase categories), and in
every case but one the open state is correctly conditional. `infoTip()` should be a thin
wrapper over that existing pattern for consistency, not a new component.

**One-line quick win, verified.** `js/main.js:7219` hardcodes the map legend open:
`h('details', { class: 'card map-key', open: '' }, …)`, permanently showing roughly 520
characters of legend prose plus key-grid rows. Removing `open: ''` collapses it by default.
There are exactly two `open: ''` occurrences in the file; the other (`js/main.js:4466`, the
dictionary language dropdown) is deliberate and documented — **do not touch it**.

**Sweep order — corrected by the census.** The intuitive order was wrong. The five worst
prose-to-tool ratios are not the screens under active redesign:

| Rank | Screen | Prose | Blocks | Note |
|---|---|---|---|---|
| 1 | Settings | 2,681 chars | 17 | Every card carries a 150–500 char explanation before its 1–2 controls |
| 2 | Vault | 2,287 chars | 17 | Nearly every button has its own disclaimer beside it |
| 3 | Calendar cluster | 1,723 chars | 12 | Four of the app's largest disclaimers wrap one toggle and a PIN field |
| 4 | Donate | 1,020 chars | 7 | Three prose blocks stack before the first organisation card |
| 5 | Danger / wildlife | 730 chars | 5 | Prose brackets the content above *and* below |

**Top ten above the fold** — each renders immediately after `topbar()` and before any button,
chip, search box or list, so each directly forces scrolling: map (`:6950`, 360 chars), food
(`:8552`), Traveller board (`:3787`), sounds (`:9563`), local noticeboard (`:12652`), export
(`:13043`), crossings (`:6909`), donate (`:13214` + `:13161`), visa (`:1434`), streetfood
(`:12765`).

**The rule for every string:**
- INFO-ICON if it is real help a first-time traveller needs once. This is now the default.
- TIGHTEN to eight words or fewer if the information is load-bearing and must stay visible.
- DELETE only when the UI is genuinely self-evident without it. Rare.
- KEEP for safety, legal, medical, or live data. The Help FAQ answers are already inside
  collapsed `<details>` and cost zero standing space — leave them alone.

**Acceptance:**
- On each swept screen at 375×812, the primary tool is above the fold.
- No prose block survives above the fold ahead of a screen's first interactive control.
- Nothing findable becomes unfindable — help moves behind ⓘ, it does not vanish.

**Difficulty:** TRIVIAL per string, MODERATE in aggregate. The best candidate for a cheaper
model, since each edit is mechanical once the verdict is set.

---

### W4 — Budget categories: fix it once and for all

**Why:** reported three times. Two prior fixes were declared from code reading and were wrong.

**ROOT CAUSE — identified 2026-08-13.** The prior fixes kept unifying *expense* categories,
which were already unified and have now been independently re-verified as unified across all
eleven surfaces (picker on Home, picker on Budget, donut legend, trend colours, log row,
inline editor, expense table, exporter, withdrawals, setup editor, CSS). That was never the
problem. The problem is a **naming and affordance collision between two unrelated concepts
that are both called "Budget":**

| Concept | Defined | Appears in | Chips | Behaviour |
|---|---|---|---|---|
| Expense category | `EXP_CATS`, `js/main.js:10038` | Home 💰 Budget fold, Budget & Expenses | Food / Stay / Transit / Gear / Other, plus custom | Single-select; ＋ Add creates; ✕ removes |
| Place price tier | `budgets`, `js/main.js:4786` | Places filter, For you, Explore | Any budget / **Budget** / Mid / Higher-end | Single-select filter; colour swatches; no add or remove |

Both render as `.chips` rows. Both are about money. They sit in different sections and behave
completely differently. That is what the traveller has been reporting for three rounds.

**Build:**
- **Rename the place price tier away from "budget" entirely** in all user-facing copy — "Price"
  or "Price range", with tiers reading Any / Budget / Mid / Higher-end → Any / $ / $$ / $$$ or
  Any price / Cheap / Mid / Higher-end. Keep the stored `budgetTier` data key unchanged so no
  migration is needed; this is a label change, not a schema change. Sites to update include
  `js/main.js:4786`, `4816`, `5039`, `5230`, `5337-5338`, `9095`, and the tier badge helper.
- **Make the two visually distinct** so they never read as the same control — the price tier
  already carries colour swatches; the expense picker should not adopt them.
- Leave `expCatsAll()` alone. It is correct.

**Verification method — still empirical, and still mandatory:**
1. Do **not** conclude from source. Load the running app and capture what actually renders.
2. Confirm the traveller can no longer find two different chip rows both labelled "Budget".
3. Confirm a custom expense category still propagates to every expense surface immediately.

**Also worth fixing while here — a separate, real staleness hazard found during this audit:**
the iOS bundle at `Mekonging Xcode/Mekonging/Mekonging/Web/` is gitignored, was last synced
2026-06-25, and is 2,749 lines against the repo's 13,728. It has no expense feature at all.
Any testing done through the installed iOS app is testing seven-week-old code. Re-run
`Mekonging Xcode/sync-web.sh` and add it as an Xcode pre-build Run Script phase so a stale
bundle can never ship silently again. This did not cause the category report, but it will
cause a false report eventually.

**Acceptance:**
- No two chip rows in the app are both labelled "Budget".
- A newly added custom expense category still appears immediately in the Home picker, Budget
  picker, donut legend, trend colours, expense table and export.
- Screenshots of the Places filter and the Budget screen attached to the ship note as proof.
- `sync-web.sh` runs automatically at build time.

**Difficulty:** TRIVIAL to fix, once correctly diagnosed. The diagnosis was the hard part.

---

### W5 — Navigation and information architecture

**Why:** the sections do not own coherent jobs, and Back does not reliably return.

**Build:**

**5a. Tab order** → `home, talk, you, places, explore` (`js/main.js:386`). Note this places
"You" in the centre slot, which is the easiest thumb target on a phone — good, keep it there.
Update the Help & FAQ tab-naming text, which has drifted before (task #151).

**5b. Section ownership.** Each tab owns one job:
- **Home** — what now.
- **Talk** — say it.
- **You** — your trip, your stuff, your settings.
- **Places** — what is around me *right now*, and its detail.
- **Explore** — where could I go next, and add it to my trip or wishlist.

**5c. Home's picks link into Places detail — ALREADY DONE.** Verified 2026-08-13: the Nearby
picks handler at `js/main.js:1132` is `onclick: () => go('#place-' + p.id)`, which opens the
real, full `placeScreen`. All 33 place entry points across the app do the same. There is no
modal, no map popup and no dead end anywhere. **No forward-navigation work is required.**

**5d. Back correctness — the real bug is narrower and different than assumed.** Verified:
- `goBack()` has exactly one call site in the entire app (`js/main.js:434`, inside `topbar`),
  so every Back button is already uniform.
- `goBack()` pops `navStack` and returns *before* it ever consults the per-screen fallback
  (`js/main.js:405-417`). So in normal in-app navigation, Back is already correct, and the
  78 hardcoded `topbar()` fallbacks are cosmetic.
- **The actual defect:** `navStack` is a bare in-memory array (`js/main.js:402`), pushed only
  at `js/main.js:13689`, never persisted. A reload, a deep link, a shared link, or iOS
  discarding a backgrounded tab wipes it — and only then does the hardcoded fallback become
  load-bearing. That is when a traveller gets stranded.

**The fix, in two parts, both small:**
1. Persist `navStack` (and `lastHash`) to `sessionStorage` so a reload or an OS tab-discard no
   longer erases where the traveller came from. This single change fixes the majority of
   real-world Back failures.
2. Correct four fallbacks that name the wrong parent — screens reached from the You hub whose
   stack-empty fallback claims `#home`: `journalCover` (`js/main.js:7403`), `calendarScreen`
   (`:8002`), `tripScreen` (`:9882`), `scrapbookScreen` (`:7569`). Also `journeyScreen`
   (`:7890`), which points at `#journal-open`. These become `#me`.
3. `placeScreen` (`js/main.js:6192`) is the one genuinely hard case: it is reachable from 30+
   origins but its fallback recognises only two (`#saved` / `#places`). Once `navStack` is
   persisted this matters far less; leave it as-is rather than building caller-tracking.

**5e. Tools as organised chips**, consistently, using the existing chip pattern rather than
inventing a new one.

**Acceptance:**
- Tab order is exactly home, talk, you, places, explore.
- From Home → tap a nearby pick → Back returns to Home, not to Places.
- The same holds from Explore and from Search.
- No route becomes unreachable. Every hash in the route table still maps to a tab.

**Difficulty:** 5a TRIVIAL, 5b/5e MODERATE, 5c/5d STRUCTURAL.

---

### W6 — Explore: find it, then keep it

**Why:** Explore should end in an action, not a read.

**The open question is now closed.** Verified 2026-08-13 — the two halves of this ask differ
enormously in cost and must not be planned as one thing:

**6a. Wishlist — already fully built. TRIVIAL.**
`store.collections` (`js/state.js:606-628`) is a complete, user-named, multi-list save model,
with `createCollection` / `renameCollection` / `deleteCollection` / `togglePlaceInCollection` /
`collectionsForItem`. `store.favorites` (`js/state.js:689-696`) is the simple starred list
alongside it. `saveSheet(itemId)` (`js/main.js:5711-5748`) is a finished modal driving both at
once, already wired to `placeScreen`'s "＋ Save to collections" button (`js/main.js:6229`).
**Do not build a wishlist. Wire `saveSheet` onto Explore's own item cards and stop.**

**6b. Add-to-trip — genuinely does not exist. STRUCTURAL.**
- `placeScreen` has no add-to-trip action at all. Its action block (`js/main.js:6228-6234`)
  offers only Save to collections, Recommend to a friend, and Suggest an edit.
- `addStop()` (`js/state.js:388`) takes `{ title, country, date, endDate }` and stores **no
  place reference whatsoever**. The only existing quick-add (`js/main.js:9926-9931`) reads
  `store.favorites`, copies the place's name as a bare string, and discards the id. A trip stop
  can therefore never be traced back to the place it came from.
- **Required:** add an optional `placeId` to the stop schema — additive, no migration, old
  stops simply lack it — then add the action to `placeScreen` and to Explore cards.
- **Product decision needed before any code:** a stop is a *dated city-leg*; a place is a
  *point of interest inside one*. They are not 1:1. Decide whether adding a place creates a new
  leg, attaches to an existing leg, or is a third kind of thing.

**Acceptance:** from Explore, a traveller saves a place to a named collection in one tap; and
separately adds a place to their trip such that You → My trip shows it and it still links back
to the place record.

**Difficulty:** 6a TRIVIAL, 6b STRUCTURAL and gated on the product decision above.

---

### W7 — You: open, personal, trip-first

**Why:** the traveller cannot see what tools exist because the groups are collapsed.

**Scope correction, verified 2026-08-13.** This slice is far smaller than it appeared. The
tools named in the ask — trip, journal, budget, calendar, dictionary, travel circle — are
**already always-visible** in the quick-access row (`js/main.js:2292-2302`), which is a plain
card, not a `<details>`. They are never collapsed. Only two groups are collapsed today.

**Build — seven line edits in total:**

1. **Default-expand: two boolean flips.** `chipGrp(…, open)` is defined at `js/main.js:2333`.
   "Your stuff" is already `true` (`:2351`). Flip `false` → `true` at `js/main.js:2359`
   ("Plan & prepare") and `js/main.js:2370` ("You & settings"). Settings is the only tool
   currently hidden behind a tap.
2. **Personalise five headings**, each a one-line ternary matching the pattern already proven
   at `js/main.js:2233` and `:4398`:

   | File:line | Current | Screen |
   |---|---|---|
   | `js/main.js:7403` | `topbar('Journal', '#home')` | journalCover |
   | `js/main.js:7421` | `topbar('Adventures', '#journal')` | journalTOC |
   | `js/main.js:8002` | `topbar('Travel calendar', '#home')` | calendarScreen |
   | `js/main.js:9882` | `topbar('My Trip', '#home')` | tripScreen |
   | `js/main.js:7890` | `topbar('Your journey', '#journal-open')` | journeyScreen |

   Always fall back to "Your …" when no name is set. Never render a bare possessive.

   Note these are the *same five lines* whose back-fallbacks W5d corrects. Do both edits in
   one pass rather than touching the lines twice.

**Acceptance:** opening You shows every tool without a tap. With a name set, journal, calendar,
dictionary, journey and trip all carry it. With no name set, nothing reads awkwardly.

**Difficulty:** TRIVIAL. Seven lines, and five of them overlap with W5d.

---

### W8 — Mobile optimisation pass

**Why:** this is a phone app used on the road, frequently one-handed, often offline.

**Check on every screen touched by W1–W7, at 375×812:**
- Primary tool above the fold.
- Tap targets ≥ 44×44 px.
- No horizontal overflow; long names truncate rather than wrap the layout.
- Headings do not wrap to three lines (regression risk — see task #176).
- Reachability: the most-used action sits in the lower half of the screen where possible.

**Acceptance:** a screenshot per swept screen at 375×812, console clean.

---

## 6. Execution sequence

Do **not** attempt this in one pass. Ship each slice independently, verified, before starting
the next. The ordering below is chosen so that each slice de-risks the next.

Revised 2026-08-13 after the audits. Three slices shrank, two merged, and one product decision
now gates the tail.

| Slice | Contents | Rationale for position |
|---|---|---|
| **S0** | `infoTip()` + W5a tab reorder + **W4 "Budget" rename** + wire `saveSheet` onto Explore (W6a) | All cheap label and wiring work. Clears the three-times-reported irritation in the first ship |
| **S1** | W1 Home merge + copy purge on Home only | Highest-traffic screen; proves the ⓘ pattern in anger |
| **S2** | **W7 You hub + W5d back-stack** — merged | They edit the *same five lines*. Splitting them would touch each line twice |
| **S3** | W2 "Plan your next stop" | The one genuinely large build |
| **S4** | W6b place-linked trip stops | **Gated on the product decision in W6b.** Do not start before it is answered |
| **S5** | W5b Places / Explore route re-triage | Structural, and the least urgent — deliberately after the features land |
| **S6** | W3 remaining site-wide copy purge + W8 mobile pass | Last, because earlier slices change what text exists |

**What changed and why, so this is not silently re-litigated later:**
- The old S4 ("place detail from Home") **disappeared entirely** — verified already working.
- The old S3 (You hub) collapsed from a rebuild to seven line edits, and merged with the
  back-stack fix because they share lines.
- W4 dropped from a risky investigation to a rename, so it moved into the first ship.
- W6 split: the wishlist half was already built and moved into S0; the add-to-trip half is
  genuinely structural and now sits behind a product decision.
- A new S5 appeared that nobody asked for but the route map exposed: **Places currently owns 32
  routes**, mixing "what is around me now" (nearby, weather, today) with country-wide reference
  content (visa, accessibility, baby and family, transport schedules, border crossings, scams).
  Under the new Places/Explore definitions those belong in Explore or a country guide. This is
  the real cost of the tab restructure, and it is larger than the tab reorder itself.

Rationale for the last row: sweeping copy before the structural work would mean sweeping text
that later slices delete or move anyway. The Home sweep is pulled forward into S1 only because
Home is the screen the traveller sees most and the pattern needs proving early.

---

## 7. Verification protocol (every slice, before merge)

1. Python brace/paren/backtick balance on every modified JS file.
2. `grep` for any function moved or renamed — confirm no duplicate definitions remain.
3. Load the preview, cache-busted. Console must be clean — watch specifically for
   `ReferenceError` and "is not a function".
4. Drive state through the live `store`/`save()`, never through direct `localStorage` edits.
5. Click through the affected screens at **375×812**, not desktop width.
6. Screenshot before and after.
7. Bump `APP_VERSION` and `CACHE_VERSION` together; add any new module to `PRECACHE`.
8. Commit, merge `--no-ff` into `feat/scaffold-bangkok-slice`, push, confirm the version is
   live.

---

## 8. Cost control

The dominant cost in this project is not the model. It is that `js/main.js` is 856,349 bytes
— **approximately 214,000 tokens** — and every edit to it requires reading the whole file
first. At roughly twenty edit rounds, that is about 4.3 million tokens spent re-reading one
file that barely changes.

**Highest-leverage fix:** continue the module split (pending task #140). The file already
carries 62 `// ---- SECTION ----` markers that map cleanly onto extractable screens. The four
that matter most for this document, because these slices touch them anyway:

| Extract | Lines | Serves slice |
|---|---|---|
| `js/screens/budget.js` — expenses, categories, donut, projection | 10031–10694 | S2 |
| `js/screens/places.js` — Places screen | 4651–5246 | S4 |
| `js/screens/talk.js` — phrasebook + personal dictionary | 3867–4651 | S7 |
| `js/screens/calendar.js` — travel calendar + day planner + private calendar | 7926–8332 | S7 |

Do each extraction **as part of the slice that touches that screen**, not as separate work.
The Read cost is already being paid by that slice; the extraction makes it the last time.

Other controls:
- Scope sub-agents to `grep -n` plus narrow `sed` ranges. Never let a sub-agent read
  `main.js` wholesale. Several agents each reading it independently is the worst case and has
  already happened once on this project.
- Prefer one well-specified slice over exploratory back-and-forth.
- Match the model to the work: architecture and ambiguous decomposition justify the strongest
  model; a specified slice does not; a mechanical string sweep justifies the cheapest.

---

## 9. Open questions

- **Wishlist model** (W6): does `store.favorites` already serve, or is a new model needed?
  Resolve before starting S6.
- **Candidate ranking** (W2): should "where next" be ranked by travel time, by profile fit,
  or by season and weather? Default assumption: travel time first, profile fit as a filter.
- **ⓘ presentation** (W3): inline expand versus popover. Default assumption: inline expand,
  because it is simpler, works offline, and cannot be clipped by a scroll container.
