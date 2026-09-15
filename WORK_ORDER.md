# Mekonging — work order, round of 2026-09-14

Fifteen requests from the owner, triaged into **seven independent slices**.

## How to use this file

**You are expected to do ONE slice per session, then stop.** Do not read ahead into other
slices; do not "while I am here" into a neighbouring one. Every slice is scoped so that a
session doing only that slice stays short, and a short session is the single biggest cost
lever in this project.

A session starts like this and needs nothing else pasted in:

> Read `/Users/zim/Claude Code/Mekong/WORK_ORDER.md`. Do **Slice C** only. Stop when its
> acceptance criteria are met and report what you verified versus what you assumed.

Slices are independent and may run in any order **except** where "Blocked by" says otherwise.
They may run in parallel in separate worktrees, since no two slices share a primary file.

---

## Non-negotiables — read once, they apply to every slice

These are the things that waste a session when nobody tells you.

- **There is no build step, no bundler, no `node`, and no `gh` CLI.** Plain ES modules served
  as files. You cannot run `npm test`, and you cannot open a PR from the terminal. Print the
  `https://github.com/SamuelLClemens/Mekonging/pull/new/<branch>` link and let the owner click it.
- **There is no `main` branch.** The integration branch is `feat/scaffold-bangkok-slice`.
  Branch from it, PR back into it.
- **The guards do not parse JavaScript.** All twelve can pass on a `main.js` that will not
  load. Passing guards is necessary and not sufficient — you must load the app before you
  claim a slice works.
- **The service worker is cache-first for JS and CSS.** A file edited on disk is *not*
  necessarily what the browser runs. `location.reload()` is not enough and
  `unregister()` does not stop an already-controlling worker. Close the tab and reopen it.
- **Every shipped change must bump `APP_VERSION` (`js/main.js:710`) and `CACHE_VERSION`
  (`sw.js:15`) to the same new value.** These two lines are also the only thing that ever
  conflicts between branches — resolve such a conflict by going *higher than both sides*,
  never by taking one side. Anything lower leaves users on a stale cache that never receives
  the fix.
- **Verify on the rendered screen at 375px width**, in both an empty and a populated state,
  with the console clean. Code-reading alone has produced confidently wrong conclusions here
  more than once.
- **The browser preview pane is always `document.hidden`.** Every element rectangle reads as
  zero, so any "is it clipped" measurement is a confident lie. Screenshot first, then measure.
  Coordinate clicks time out; use accessibility-tree refs and direct value-setting instead.
- **Secret-scan every diff before committing.** Never commit tokens, keys, or personal data.
- **Never force-push.** Never commit directly to the integration branch.

### Guard suite

```bash
for g in check-imports check-undefined check-lazy-data check-preloads check-ui-strings \
         check-cache-version check-contrast check-spacing check-place-fields \
         check-month-arrays check-net-gates check-place-dupes; do
  [ -f "scripts/$g.py" ] && { printf '%-22s ' "$g"; python3 "scripts/$g.py" >/dev/null 2>&1 \
    && echo PASS || echo FAIL; }
done
```

---

## Decisions the owner must make before some slices can start

Three slices are blocked on a judgement that is not mine to make. Answering these **in the
same message that starts the slice** saves a full round trip each.

| # | Decision | Blocks | Why it cannot be defaulted |
|---|---|---|---|
| D1 | Navigation pattern: keep iPhone-style folders, keep chip rows, or adopt a third pattern | Slice D | Changes the shape of every screen; picking wrong means redoing it |
| D2 | Storage budget for offline language packs, in MB, and whether iOS eviction risk is acceptable | Slice B | Determines whether "download all languages" is even offerable |
| D3 | Charity inclusion criteria — which evaluator's rating is authoritative, and the minimum bar | Slice F | "The very best" is a values judgement, not a measurable one |

### Evidence gathered for D2 (2026-09-14) — storage budget for audio packs

D2 now has real numbers. The owner decides the budget; these are the costs it buys.

**Format: use AAC in an `.m4a` container.** It is natively supported across the entire relevant
iOS range with no container caveats. Opus is roughly half the size but only plays on iOS 18.4+,
and **only in Ogg or WebM — Opus inside MP4/m4a silently fails to play in Safari**, which is a
trap if tooling defaults to that wrapper. The size difference does not justify the risk.

Byte cost for 300 phrases × 4 languages = 1,200 clips (**estimates**, assuming a 3-second average
clip, excluding container overhead and silence trimming — measure against real recordings before
committing):

- AAC 48 kbps mono: **≈ 21.6 MB total**, ≈ 5.4 MB per language
- AAC 64 kbps mono: **≈ 28.8 MB total**, ≈ 7.2 MB per language
- Opus 24 kbps mono: ≈ 10.8 MB total — for reference only, not recommended

**The iOS eviction constraint the owner must accept or reject.** Safari's 7-day cap on all
script-writable storage is **still in force in 2026**: after seven days of Safari use with no
interaction on the origin, IndexedDB, Cache Storage, service worker caches and LocalStorage are
all deleted. A traveller could lose every downloaded pack precisely while travelling.

**Adding the app to the Home Screen exempts it** — an installed web app is "not part of Safari"
for this purpose and runs its own usage-day counter. This is the single most important mitigation
and it is a user action the app must actively prompt for, not an engineering fix.
`navigator.storage.persist()` should be called on first install but its result treated as
advisory; WebKit effectively grants persistence only to Home Screen installs, and re-earns it
each session.

Sources: <https://webkit.org/blog/14403/updates-to-storage-policy/>,
<https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/>,
<https://opus-codec.org/comparison/>

**Storage shape:** Cache Storage for the audio bytes, keyed by a versioned per-language cache
name; IndexedDB for pack metadata (version, size, timestamp, state) so Settings can list and
delete packs without reading the whole cache. Report real usage from
`navigator.storage.estimate()`, re-queried after every install and delete. Note that Safari does
not implement the `usageDetails` breakdown, so iOS can show a total but not a per-type split.

### D2 — decided (2026-09-15)

- **Bitrate:** let the traveller choose at download time — offer both AAC 48 kbps (≈21.6 MB all
  four languages) and AAC 64 kbps (≈28.8 MB all four). No default has been chosen between the
  two; the download UI presents both.
- **Bulk vs per-language:** offer both — a "download all 4 languages + my dictionary" one-tap
  option, and independent per-language selection (checkboxes, not one-at-a-time).
- **iOS eviction risk: accepted, ship it.** Reframed during the interview: this is not an
  audio-pack-specific risk — Safari's 7-day rule evicts the whole origin's storage at once
  (IndexedDB + Cache Storage + Service Worker caches + LocalStorage together), so the app's
  entire local dataset (trip, dictionary, journal, photos) is already exposed today, with or
  without B4, wherever the traveller hasn't installed to Home Screen. B4 ships with a
  Home-Screen-install prompt shown at the moment a traveller downloads their **first** offline
  content of any kind (an audio pack, or their first saved dictionary entry) — not gated to
  audio packs specifically. The broader whole-app exposure is tracked as its own follow-up,
  deliberately kept out of B4's scope (spawned as a separate task, 2026-09-15).

### Evidence gathered for D1 (2026-09-14)

The owner asked whether to keep folders, keep chips, or adopt something new. Research was run
against current design-system guidance, comparable travel apps, and controlled usability studies.
The evidence converges, and it points against **both** current patterns.

**Against chip rows as navigation:**

- Material Design 3 defines chips as components to "enter information, make selections, filter
  content, or trigger actions" across four types — assist, filter, input, suggestion. Chips are
  **not** listed among its navigation components; navigation is assigned to the navigation bar,
  rail, drawer, and tabs. <https://m3.material.io/components/chips>
- Apple's Human Interface Guidelines contain **no chip component at all**. The nearest native
  equivalents are the segmented control and filter buttons, not a scrolling pill row.
  <https://developer.apple.com/design/human-interface-guidelines/segmented-controls>
- Airbnb — the most-cited real-world chip row in travel — **removed theirs in April 2025**. Even
  while present, it filtered one vertical list; it was never navigation between feature sets.
- Nielsen Norman Group eye-tracking found users scanning a horizontally scrollable filmstrip
  **never looked at the navigation arrows** and so never discovered the off-screen items, despite
  the arrows being visually prominent. <https://www.nngroup.com/articles/horizontal-scrolling/>
- Baymard found a horizontally scrolling block taller than 50% of the mobile viewport risks
  **scroll-hijacking**, where a vertical swipe accidentally drives the carousel sideways.
  <https://baymard.com/blog/mobile-homepage-usability>

**Against adding folder depth:**

- Nielsen Norman Group's controlled study (179 participants, 6 sites, phone and desktop) found
  hiding primary navigation behind **one extra tap** cut discoverability by **more than 20%**,
  made users **15% slower on mobile**, and raised self-reported task difficulty by 21%.
  <https://www.nngroup.com/articles/hamburger-menus/> — This directly quantifies the cost of the
  previous navigation rebuild, in which 17 features each gained a tap.
- Nielsen Norman Group caps safe progressive disclosure at **two levels**: "designs that go beyond
  2 disclosure levels typically have low usability because users often get lost moving between
  levels." <https://www.nngroup.com/articles/progressive-disclosure/>
- Classic menu-hierarchy research (Larson & Czerwinski, CHI 1998) finds broad-shallow beats
  narrow-deep — but the fastest structure was a **moderate** breadth/depth mix, not the flattest
  one tested. Maximum flatness is not the goal.

**What comparable apps actually do:**

- Google Maps cut its bottom bar from five destinations to **three** in 2024, folding Go, Saved,
  and Updates into a single personalized "You" hub rather than adding top-level items.
- Citymapper, at comparable feature density, leads with one search prompt plus a few
  recognition-based shortcuts (Home, Work, Places) — no chip row, no feature grid.
- Rome2Rio and Sygic Travel are search-first and map-first respectively; neither browses by category.
- Klook exposes its full catalogue as an **icon-plus-label grid**, not a scrolling chip row.
- Material Design 3 caps bottom navigation at **five** destinations; Apple recommends **three to
  five** tabs on iPhone and presents its own "More" tab as a fallback, not a preferred solution.

**Honest gaps in this evidence — do not overstate it:**

- No controlled study was found measuring what percentage of users scroll a *chip navigation row*
  specifically. The findings above concern carousels, overflowing tabs, and hidden menus. They all
  point the same direction, but they are proxies.
- The **bento grid is unproven as primary phone navigation**. It is a real trend with production
  adopters (Apple product pages, Notion, Linear), but its documented use is content layout, largely
  on desktop. Circulating performance statistics for bento grids trace to marketing blogs, not to
  any controlled study, and must be treated as unverified.

**Recommendation put to the owner (the owner still decides):** a flat, non-scrolling grid of all
nine section doors on Home, with **exactly one** folder level and never deeper; chips retained
**only** for in-page filtering, matching how Material Design 3 defines them; and a small
state-driven quick-access row above the grid for the few highest-frequency features, following the
Google Maps and Citymapper consolidation pattern. The tradeoff accepted is a visually denser Home
in exchange for nothing hidden and nothing scrolled sideways.

---

## Slice A — Four small independent fixes

**Items 3, 6, 10, 7.** Small, unrelated, each cheap; batched only because each is too small
to deserve a session. Do them in this order and commit separately.

### A1 · Location permission is re-requested every launch (item 3)

The owner wants to grant location once and never be asked again.

- Relevant code: `js/main.js:6023-6100` (`watchPosition` and the `navigator.permissions.query`
  block), `js/util.js:164`, `js/map.js:431`, `js/screens/transport.js:207`.
- **Diagnose before changing anything.** There are three different causes with three different
  fixes, and they are not distinguishable by reading:
  1. The browser prompt itself. If the app is not installed to the Home Screen, iOS Safari
     re-prompts per session and **no code change can fix it** — the answer is an install prompt.
  2. Four separate call sites each independently calling `getCurrentPosition`, so the app asks
     more than once per session even when permission is granted.
  3. The grant is not being cached in prefs, so the app re-asks on every cold start.
- Determine which one it is, state it plainly, then fix that one. If it is cause 1, say so and
  do not write code — recommend the Home Screen install path instead.

**Acceptance:** with permission granted once, a cold start followed by visiting Places, the
map, and Transport produces **exactly zero** additional permission prompts. State which of the
three causes applied.

### A2 · Destructive actions need confirmation (item 6)

Site-wide: any `×` or delete control must confirm before destroying data.

- Find every destructive control first and list them. Start from the dictionary translation `×`
  the owner named, then sweep for the pattern across screens.
- Use **one shared confirm helper**, not a bespoke dialog per site. If a suitable modal helper
  already exists, reuse it; do not add a second one.
- Do **not** wrap non-destructive dismissals (closing a sheet, hiding a chip) — confirming those
  is noise that trains people to tap through the confirmations that matter.

**Acceptance:** every control that permanently removes user data prompts first; the count of
wrapped controls is reported; no non-destructive control was wrapped.

### A3 · Journey map will not zoom in far enough (item 10)

**Probable root cause already located.** `js/map.js:288`:

```js
try { map.fitBounds(b, { padding: 48, maxZoom: 6, duration: 0 }); } catch { /* single point */ }
```

`maxZoom: 6` is roughly country level. When every logged pin sits in one city the map still
refuses to go past zoom 6, which is exactly the reported symptom.

- Confirm this `fit()` is the one the journey screen uses before editing.
- Raise the cap so a tight cluster zooms in properly. Keep a cap — without one, a single pin
  zooms to maximum and looks broken.
- The owner also wants the current location shown as a distinct pin, with free zoom in and out.
  Free zoom is default MapLibre behaviour, so confirm nothing is disabling it rather than
  adding code.

**Acceptance:** with pins in one city the map fills the viewport at city zoom; with pins across
four countries all remain visible; current location is visually distinct; pinch and
double-tap zoom both work in both directions.

### A4 · Weather — replace the leading widget with a 24-hour view (item 7)

The owner finds the first widget redundant and explicitly invited disagreement.

- `js/screens/weather.js:247` renders `wxVizCard(rec, spot)` — the hourly watch-face ring.
  Line 249 begins the 7-day forecast.
- **Screenshot the screen at 375px before touching it.** The ring already encodes hourly data,
  so "redundant" may mean it duplicates the 7-day card, or may mean the ring is not legible as
  an hourly view. Those have opposite fixes.
- If the ring is the only hourly view, replacing it with a plain next-24-hours strip is a
  straight swap. If something else already shows the next 24 hours, remove the duplicate instead.
- Report the finding to the owner with the screenshot. The owner asked to be told if wrong;
  tell them, with evidence, rather than silently implementing either option.
- Note `wxVizCard` had two prior rounds of work on label legibility. If the ring is dropped from
  this screen, check whether anything else still renders it before deleting the function.

**Acceptance:** exactly one next-24-hours representation on the screen; a before-and-after
screenshot at 375px; an explicit statement of whether the owner's redundancy call was confirmed.

---

## Slice B — Talk: speech, translation, and offline language packs

**Items 2.1, 2.2, 2.3, 2.4, 11.1, 11.3.** The largest slice and the one with the most user-
visible breakage. **Blocked by D2.** Item 11.2 is deliberately excluded — see Slice G.

Primary files: `js/tts.js`, `js/screens/phrasebook.js`, `js/ui-widgets.js:32`,
`js/state.js:1073-1090`, `js/screens/settings.js`.

### B1 · Speak is broken (item 2.1) — do this first and alone

This is a live defect and it is the reason the slice exists. Everything else here is additive.

- `js/tts.js` wraps `speechSynthesis`. Line 9 calls `getVoices()`, line 16 listens for
  `voiceschanged`.
**Research was run on 2026-09-14. Read this before diagnosing — it probably explains the report.**

**Language coverage is the likely headline cause, and it is not a bug:**

| Language | iOS | Android | Note |
|---|---|---|---|
| Thai `th-TH` | Yes | Yes | "Kanya" voice, on-device since iOS 13 |
| Vietnamese `vi-VN` | **iOS 18.4+ only** | Yes | Apple shipped no vi-VN system voice at all before March 2025 |
| Khmer `km-KH` | **No** | Yes | No evidence of Apple shipping Khmer on any platform |
| Lao `lo-LA` | **No** | **No** | Absent from Android's official list despite Thai, Khmer and Vietnamese all being present |

Of the four phrasebook languages, **only Thai has confirmed system speech on both platforms.**
A request for an unavailable voice matches nothing and returns without throwing, which presents
exactly as "the speaker does nothing". Confirm this is what is happening before writing any code.

**Two genuine iOS bugs to check for, both with known fixes:**

1. `getVoices()` returns an empty array on the first call in Safari, **and Safari does not
   reliably fire `onvoiceschanged`** — so code that waits for that event (see `js/tts.js:16`)
   can wait forever. The established workaround is to poll every ~250 ms up to a ~2000 ms
   timeout rather than relying on the event.
2. `speak()` must be called **synchronously inside the user-gesture handler**. Calling it after
   an `await`, a timer, or an async callback fails silently on iOS. Check whether the tap
   handler awaits anything before reaching `speak()`.

Also note: speech stops silently with no error when Safari is backgrounded mid-utterance.

Sources: <https://caniuse.com/speech-synthesis>,
<https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService>,
<https://accessibleandroid.com/list-of-languages-with-available-tts-engines-on-android/>,
<https://support.apple.com/en-vn/120499>,
<https://dev.to/jankapunkt/cross-browser-speech-synthesis-the-hard-way-and-the-easy-way-353>

**Required behaviour:** feature-detect per language at runtime — poll `getVoices()` with the
timeout workaround, filter by BCP-47 prefix, and require **`localService === true`** before
presenting the speaker as working. Where no voice exists, **say so** rather than rendering a
control that silently does nothing. Route Lao — and Vietnamese on pre-18.4 iOS — to B4's
bundled audio, which is the only path that can ever work for them.

**Acceptance:** pressing the speaker produces audio for every language that has a device voice,
and a visible explanation for every language that does not. State which of the three causes
(missing voice, empty `getVoices()`, broken gesture chain) actually applied, with evidence from
a real device.

### B2 · Split Translate from Translate-and-save (item 2.2)

Two buttons with distinct behaviour: **Translate** shows the translation and saves nothing;
**Translate & save to my dictionary** does both. Verify the current wiring first — the report
is that the buttons do not do what their labels say.

**Acceptance:** Translate leaves the dictionary unchanged, verified by inspecting the
dictionary before and after; Translate-and-save adds exactly one entry.

### B3 · Editing longer text (item 2.3)

The composing field needs to be editable after entry and needs an explicit **Clear** to start a
new message. Per A2, Clear must confirm when it would discard more than a trivial amount of text.

**Acceptance:** text is editable after translating; Clear empties the field and resets the
result; a long entry survives a screen rotation.

### B4 · Offline audio packs (item 2.4)

**Much of this already exists.** `js/state.js:1073-1090` already provides `getAudioPacks`,
`hasAudioPack`, `addAudioPack`, and `removeAudioPack`. The storage layer is built. What is
missing is the interface. Do not rebuild the state layer.

Required:
- A dropdown to download **additional** languages, not only the current one.
- An option to download **all** languages plus the personal dictionary — gated on D2, because
  this is the item with a real byte cost.
- The list of downloaded packs belongs in **Settings**, each with a remove control (which per
  A2 must confirm).
- **Show the real size** before download and the real total in Settings, from
  `navigator.storage.estimate()`. Do not print an estimate as though it were measured.
- Remove or hide the explanatory blurb under the re-download button, as requested.

**Acceptance:** a second language can be downloaded and then used with the device offline;
Settings lists every pack with an accurate size; removing one frees the space and the speaker
falls back audibly; the blurb is gone.

### B4 — done (2026-09-15, `fix/b4-offline-audio-packs`)

Shipped for Thai/Vietnamese/Khmer — the only phrasebook languages with a working audio source
(see below). Settings gets a full pack-management card: checkboxes to pick one or more
languages, a "download all + my dictionary" button, per-language Remove with a confirm dialog,
real clip counts, and a real total-device-storage line from `navigator.storage.estimate()`.
`js/audio-packs.js` is the new shared logic module (phrasebook's own single-language card now
uses it too, so the two can never disagree on what "downloaded" means).

**Two corrections to this section's original assumptions, found while building it:**

- **No bitrate choice is possible.** The "storage layer" already in place turned out to prefetch
  clips live from Google Translate's public TTS endpoint (`js/tts.js` `ttsUrl`), not pre-encoded
  files — there is no quality parameter on that URL at all. D2's AAC-bitrate numbers assumed
  encoding our own clips; that is not what this app actually does.
- **Per-pack byte size cannot be measured — do not attempt it again.** A first draft measured
  each pack's cost as a `navigator.storage.estimate()` delta across its own download. Tested
  live, a 97-clip Khmer pack "measured" at 699 MB, because `estimate()` is whole-origin and this
  app's other caches (satellite tiles, the field guide's background photo prefetch) can grow at
  the same moment for unrelated reasons. Shipped with clip counts per pack instead, and a real
  (not per-pack) total.

**Lao still has no audio.** No device voice, and Google Translate's endpoint 400s for `tl=lo` —
confirmed directly against the endpoint. Lao is excluded from the download list with an
explanation rather than offered as a download that would silently save nothing. The owner
confirmed (2026-09-15): ship the 3 working languages now, and find a **free, no-paid-API** Lao
audio source as its own follow-up (spawned as a separate task).

### B5 · Language picker (items 11.1, 11.3)

- The picker becomes a dropdown rather than a long list.
- It must be dismissable **without choosing** — closing returns to the previous language and
  changes nothing.

**Acceptance:** dismissing leaves the previously selected language active; the dropdown is
operable one-handed at 375px.

---

## Slice C — Money: expense logging and Give back

**Items 12, 5.1, 5.3.** Item 5.2 is research and lives in Slice F.

Primary files: `js/budget-ui.js:151-170`, `js/screens/budget.js:47`, `js/screens/giveback.js`.

### C1 · Merge "On what?" into Category (item 12)

Current: `js/budget-ui.js:151-168` renders a free-text "On what?" field with a dropdown of
previously used titles. The owner wants this inverted:

1. **Category** first, as a dropdown, including an **Other** option.
2. Choosing Other reveals a field for a new category name, with an option to save it for reuse.
3. **Details** second, free text, optional, for the description that "On what?" used to hold.

- Existing logged expenses have a `note` and a category. **Do not orphan them.** Decide and
  state how old records map into the new shape, and make it non-destructive.
- Custom categories already exist in this app. Reuse that mechanism rather than adding a second
  notion of a user-defined category.
- Export (`js/screens/export.js:116`) and share (`js/journey-share.js:436`) both emit an
  "On what" column. Update both or deliberately keep the column and say why.

**Acceptance:** a new expense can be logged with a built-in category, and with a new custom
category that persists to the next expense; every pre-existing expense still displays correctly
with its description intact; export headers match the new model.

### C2 · Give back percentages from withdrawals, not logged expenses (item 5.1)

The owner's reasoning is sound: not everyone logs every expense, so logged spend understates
the real total, whereas cash withdrawals are complete.

- Withdrawals live in `trip.withdrawals` with `addWithdrawal` / `deleteWithdrawal` in `state.js`.
- **Card spending is not a withdrawal.** If a traveller pays by card, withdrawals understate
  the total exactly as expenses do. Check what the screen claims the percentage is *of*, and
  make the label honest about the basis. Report to the owner if the honest answer is that
  neither source alone is complete.

**Acceptance:** the calculation uses withdrawals; the on-screen label states the basis; a trip
with zero withdrawals shows a sensible empty state rather than a division by zero.

### C3 · Country dropdown on Give back (item 5.3)

The "across the region" heading becomes a dropdown: **Across the region**, Thailand, Laos,
Cambodia, Vietnam. The listed charities filter to the selection.

- Depends on Slice F having per-country charity data. If F is not done, build the control and
  wire it to whatever data exists, leaving the expansion to F.

**Acceptance:** each of the five options yields a correctly filtered list; no option produces an
empty list without an explanatory empty state.

---

## Slice D — Navigation and Home

**Items 8, 9, 4.1, 13, 14. Blocked by D1** — do not start until the owner has chosen a pattern.

Primary files: `js/nav-groups.js`, `js/screens/home.js`.

### D1-impl · The chosen navigation pattern (item 8)

Implement the pattern the owner selected. Whatever it is, the constraint that decides success is
**minimal scrolling and minimal searching at 375px**, so measure Home's height before and after
and report both numbers.

### D2-impl · Identify becomes a single button (item 9)

On Home, "Identify what's around you" collapses to **one button**. The chip row goes away. The
button leads where it leads today. On the destination screen, remove the other sections — that
screen is the Identify section and does not need them.

**Acceptance:** Home shows one Identify control; the destination retains full identify
functionality; Home's measured height decreased.

### D3-impl · More Right-now categories and a rain tag (item 4.1)

- Add categories beyond Culture & History and Nature & Outdoors.
- Add a **Good in rain** tag alongside the existing Culture / Viewpoint / Good with kids tags.
- There is prior art worth honouring: a previous round fixed a bug where outdoor markets wrongly
  received an indoor rain bonus. **Good in rain must mean genuinely sheltered**, and must not
  regress that fix. Verify against it explicitly.
- Tagging places is data work across four large place files. Decide whether the tag is derived
  from existing fields or newly authored per place, and state the count either way.

**Acceptance:** the new tag appears only on genuinely sheltered places, with a stated sample
check; the outdoor-market regression test still passes.

### D4-impl · "Find my next stop" cannot be hidden (item 13)

It may minimise and maximise; it may not be dismissed. Remove the hide affordance and ensure any
previously persisted "hidden" preference does not leave an existing user without the button.

**Acceptance:** no hide control; a user whose prefs already record it as hidden sees it again.

### D5-impl · Trip sections default to minimised (item 14)

Everything in the user's trip starts collapsed. The app already folds sections automatically in
`mount()` — use that mechanism rather than a parallel one, and note that inserting a
`<details open>` fires a toggle event.

**Acceptance:** every trip section is collapsed on first visit; a section the user opens stays
open for that session.

### Slice D — verified, 2026-09-15.

- **D1** — no code change needed. The flat-grid, one-folder-level pattern was already live
  (introduced before this work order was written); confirmed by loading Home and `#hub-plan`
  at 375px.
- **D2** — done. Identify collapses to one button (`identifyRow()`); `#hub-identify` no longer
  shows the "Other sections" cross-nav list. Verified live: the button leads to a full
  Identify hub with all seven of its sections intact and nothing else appended.
- **D3** — the category-chip half needed no change: Home's "Right now" filter already builds
  its chips from whichever `CATEGORY_FAMILIES` are present in the ranked pool (up to 7 —
  culture, nature, beach, food, market, nightlife, wellness — not just Culture and Nature),
  from a pre-existing commit. The rain-tag half had a real bug: `whyNow()`'s "Good in the
  rain" tag checked only for an indoor category, so a place tagged with BOTH an indoor and an
  outdoor category (e.g. a hilltop temple that is also a viewpoint) got the tag despite not
  being genuinely sheltered. Data audit across all 771 non-stay places: 114 (14.8%) carry both
  an indoor and an outdoor tag and would have been mistagged; fixed by also requiring no
  `OUTDOOR_CATS` match, matching the stricter logic `todoScore()` (day-suggest engine) already
  used. After the fix, 193 places (185 non-market + 8 text-flagged covered markets) are
  eligible for the tag, down from up to 307. The outdoor-market regression (an open-air market
  needs `marketCovered()` text evidence, not just the `market` category) is untouched and still
  passes — it lives in a separate branch of the same function.
- **D4** — done. `nextStopNudgeChip()` no longer has a hide affordance or a hidden-pref check.
  Verified live: with `nextStopNudgeHidden: true` set before load (simulating a pre-D4 user) and
  phase forced to "traveling", the chip still renders with no dismiss control.
- **D5** — done. `tripScreen()` seeds `Itinerary` / `Budget log` / `Share this trip` / `Log an
  expense` closed once per session via the existing `sectionFolds` mechanism. Verified live in
  an isolated tab: all sections collapsed on first visit; opening one and navigating away and
  back within the same page load leaves it open.

---

## Slice E — Load performance

**Item 15.** "Everything takes a few seconds to load."

**Measure before changing anything.** This project has a recorded instance of a plausible
performance theory being wrong: concurrency was tested and was *not* the problem, while the
service worker strategy was. Do not repeat that.

1. Record a cold load and a warm load with the Performance panel. Report both.
2. Attribute the time: network, parse, execute, render. Name the largest contributor with a number.
3. Only then propose a fix, and only for the largest contributor.

Known context, not conclusions: `js/main.js` is roughly 625 KB and about 39% of the eager
module graph; a previous network-first service worker strategy cost 36.7s per launch and
cache-first made repeat launches zero-request; a lazy-loading pass has already shipped.

**Acceptance:** a before-and-after number for the same measured scenario. "It feels faster" is
not an acceptable result. If the honest finding is that it is already near the floor without
splitting `main.js`, say that — splitting `main.js` is a large, high-risk pass of its own and is
explicitly **out of scope here**.

### Slice E — measured, 2026-09-15. No fix proposed.

Measured against the local dev server (`scripts/serve.py`), Navigation Timing + Resource Timing,
service worker and Cache Storage fully cleared beforehand for the cold run:

- **Cold load** (no SW, no cache): 424–638 ms to `DOMContentLoadedEventEnd` across repeated runs,
  `domInteractive` 192–310 ms. The HTML shell itself answers in 9–14 ms; every individual JS file
  downloads in 9–53 ms even on the largest (`main.js`, 428 KB transferred/compressed, 31 ms). 65 JS
  files, ~1,532 KB transferred in total. Attribution: essentially none of this is network wait on
  a fast link — it is parse+execute of the eager module graph, and `main.js` is by a wide margin
  the single largest file (428 KB vs. the next-largest, `nature.js`, at 237 KB).
- **Warm load** (SW installed, cache-first): 253 ms to `DOMContentLoadedEventEnd`, `domInteractive`
  38 ms, **zero network requests** — all 66 resources confirmed served from Cache Storage
  (`transferSize === 0` on every one, `navigator.serviceWorker.controller` present). This matches
  the cache-first behaviour already shipped in 4.6c/4.6d.

These numbers land within noise of what Priority 4.6 already recorded (681 ms cold DCL / zero-
request warm), not a regression and not a new opportunity. **No fix is proposed.** The one
remaining large contributor is `main.js` itself (428 KB compressed, the single biggest file by a
wide margin over everything else) — and splitting it is explicitly out of scope for this slice, per
the acceptance criteria above.

**Honest limitation, not glossed over:** this was measured on localhost, with no real network
round-trip latency. It cannot reproduce a degraded mobile connection the way 4.6c's 36.7 s/launch
finding was exposed — that required actual network throttling, which this environment has no tool
to apply. So this result answers "is the JS graph itself lean" (yes, near the floor for this
architecture) but not "does it still feel slow on a bad connection" — if the report resurfaces
after this, the next step is throttled-network measurement on a real device, not another localhost
pass.

---

## Slice F — Charity vetting research

**Item 5.2. Blocked by D3.** Research only — this slice writes data, not features.

Produce a vetted list of charities for Thailand, Laos, Cambodia, Vietnam, and region-wide.

- Every entry needs a **verifiable source for its rating**, not an assertion. Name the evaluator.
- **Do not invent or approximate a rating.** An unrated but reputable organisation should be
  listed as unrated, not given a plausible number.
- Flag anything contested rather than silently including or excluding it. Orphanage tourism in
  Cambodia in particular is an area where well-known organisations are actively criticised; the
  owner should decide, not the researcher.

**Acceptance:** each charity carries a country, a cause, a source URL, and either a real rating
with its evaluator or an explicit "unrated"; contested entries are flagged separately.

### Slice F — done, 2026-09-15.

All 10 entries in `js/screens/giveback.js`'s `DONATE_ORGS` (the original 7 plus 3 new
candidates — Thrive Networks/East Meets West, PeaceTrees Vietnam, Pencils of Promise — found
with real evaluator ratings during research) now carry a `rating` field: either
`{ rated: true, label, evaluator, url }` linking straight to the evaluator's own profile page,
or `{ rated: false, note }` stating plainly that no evaluator covers the org (checked Charity
Navigator, Candid/GuideStar, ACNC and the UK Charity Commission in each case) — no rating was
ever invented or approximated. 5 of 10 are unrated; that is treated as a normal, expected
outcome for small regional NGOs, not a shortfall.

One entry is flagged as contested: Cambodian Children's Fund carries a perfect Charity
Navigator score, but a named critic ("Cambodia440" blog, Andy Ricketson) has alleged since 2015
that it functions as a de facto orphanage with illegal-detention concerns, which CCF disputes
publicly. Both sides are shown, sourced, with neither resolved nor removed — that judgement is
left to the owner, per the brief. No other entry (including the orphanage-tourism question
broadly) turned up documented controversy in this pass.

The screen now shows the rating (or unrated note) and, where present, the contested flag on
every card, at every scope, verified live at 375px.

---

## Slice G — Camera translation feasibility

**Item 11.2.** A spike, not an implementation. Do not write feature code in this slice.

The owner wants "point the camera at text and it translates", as Google Lens does.

**The research has already been done (2026-09-14). The answer is: not possible offline. Present
this to the owner rather than re-running the investigation.**

The pipeline has two halves, and they have different verdicts.

**Recognising the text — works offline.** Tesseract.js runs client-side with no network. The WASM
core measures 2.86 MB (`tesseract-core-lstm.wasm` at v5.0.0, measured directly). Per-language
trained data, measured from the canonical `tesseract-ocr` repositories:

| Variant | Thai | Lao | Khmer | Vietnamese | All four |
|---|---|---|---|---|---|
| `tessdata_fast` | 1.07 MB | 6.09 MB | 1.38 MB | 0.51 MB | **≈ 9.0 MB** |
| `tessdata_best` | 7.26 MB | 12.9 MB | 7.73 MB | 11.86 MB | **≈ 39.8 MB** |

Tesseract.js actually defaults to a third "best_int" variant whose exact per-language size could
not be retrieved; plan for roughly 15–25 MB for all four as an **unverified** estimate.

**Translating the text — does not work offline on your platforms.** This is what kills it:

- **Chrome's on-device Translator API is desktop-only.** Chrome's own documentation states these
  APIs "do not work on mobile devices," naming Chrome for Android and Chrome for iOS explicitly.
  Your targets are mobile Safari and mobile Chrome, so it is unusable regardless of language
  coverage. For reference its list covers Vietnamese and Thai, but **not Lao or Khmer**.
- **Safari has no on-device translation web API at all.** Safari's own Translate UI is not exposed
  to page JavaScript.
- **The Shape Detection API's `TextDetector` never shipped.** It was split into an
  informative-only specification because "text detection is not considered stable enough across
  computing platforms or character sets to be standardized." Not usable.

Sources: <https://developer.chrome.com/docs/ai/translator-api>,
<https://developer.chrome.com/docs/capabilities/shape-detection>,
<https://app.unpkg.com/tesseract.js-core@5.0.0/files/>

**Accuracy caveat, unmeasured and important.** Tesseract's engine is general-purpose and tuned for
scanned documents, not camera-captured signage with perspective distortion, low contrast and mixed
scripts. Expect materially worse real-world results, worst for Lao and Khmer, which have the least
training data. Nobody has measured this against real photographs of Southeast Asian signage.

**Recommendation to the owner: decline for this release.** If it is pursued anyway, the only
honest scoping is **online-required**: capture a frame with `getUserMedia`, OCR locally, then send
**only the extracted text string — never the image** — to a server-side translation API, labelled
plainly as needing connectivity. Before committing engineering time to even that, run Tesseract.js
against a dozen real photographs of Thai and Lao signage and measure the accuracy.

**Acceptance for this slice:** the owner has seen the above and made a build / defer / decline
call. If declining, no code is written and the slice is complete.

### Slice G — built, 2026-09-15. Owner's call: build the online-required version anyway.

**Accuracy spike, run before writing any feature code, as required above.** Sourced 9 real
photographs (not diagrams, not rendered text) of Thai and Lao signage — 5 Thai, 4 Lao, from
Wikimedia Commons — ranging from a 960×768 lit night-market sign down to 120×90 road signs, and
ran each through Tesseract.js v5's `tha`/`lao` "fast" traineddata in a real browser. Full
image list and raw OCR output are in this branch's PR description.

**Result: 2 of 9 produced a genuinely usable reading; 7 were unusable.** The clear pattern was
framing, not language: both successes (`route450_welcome_lo.jpg`, `village_lao_sign_lo.jpg`)
were shots where the sign filled the frame edge to edge with nothing else in view — one was
recognised almost perfectly despite Tesseract's own confidence score reporting a bafflingly low
6% (its confidence number is not trustworthy here). Every photo that also framed a market,
street or embassy plaque around the sign came back as noise or near-empty, including the
960×768 image, which is the highest resolution of the nine — resolution alone did not save it.
This matches the WORK_ORDER's own caveat exactly: Tesseract is tuned for scanned documents, not
camera-captured signage.

**Consequence for the build:** the screen (`js/screens/signtranslate.js`, `#signtranslate`)
asks for a tight crop of just the sign rather than a full scene, and never treats OCR output as
final — every extracted string is shown in an editable field the traveller must confirm or fix
before it is translated. Wired from each of the four host-language phrasebook pages
(`js/screens/phrasebook.js`) as "📷 Point & translate a [language] sign", so it OCRs whichever
script that page is actually showing rather than guessing from the active country.

**Translation, not just recognition:** the app already had a working, no-key text-translate
call (`js/translate.js`, `translate()`, free MyMemory endpoint) built for the phrasebook's
live-translate box — reused as-is rather than inventing a new backend or an API key that would
have to live in client-side code. Only the extracted text string is ever sent to it; the photo
itself never leaves the device, per the WORK_ORDER's own privacy requirement.

**Tesseract.js itself loads from a CDN (unpkg) on first use, not self-hosted.** This is a
deliberate, narrow exception to the site's own self-hosting rule for critical dependencies: the
feature is already online-required end to end (translation needs the network regardless), and
a failed CDN load shows a plain error on this one screen without affecting anything else in the
app — the exact "designed-in graceful degradation" the rule allows for.

**Verified live** at 375px from all four supported phrasebook pages (Thai, Vietnamese, Khmer,
Lao) and confirmed absent from unsupported ones (e.g. Chinese); confirmed the button opens with
the correct language every time regardless of the traveller's active country; typed a known
Thai phrase through the full pipeline and got a correct real translation back ("ตลาดสดมหาราช"
→ "Maharaj Fresh Market", matching the actual market's own English signage). **Not verified:**
the camera capture step itself — the browser sandbox used for this session blocks
`getUserMedia`, so the capture → OCR path could only be exercised offline against the 9 saved
test photographs (via the standalone harness, not the shipped screen), not against a live
camera frame end to end in the app itself. The graceful "camera unavailable" fallback path was
confirmed instead, and is the same path a desktop browser or a permission-denied phone will hit.

---

## Reporting

End every slice with a short report that separates **what was verified** from **what was
assumed**, and names anything deliberately left undone. If a slice turns out to be bigger than
described here, stop and say so rather than expanding the session to absorb it.
