# Mekonging redesign prompt

Status: written 2026-10-04 against `mk-v0.623.0` on `feat/scaffold-bangkok-slice`. Companion to
`UX_OVERHAUL_PROMPT.md` (2026-08-13), which remains the record of the earlier information-architecture
work. This prompt covers the visual system, the app shell, the component kit, navigation, button
placement and the layout of the main screens.

---

## 0. How to use this prompt

- This prompt is phased. Never execute it in one pass. Run one slice per session, in order; each slice
  gets its own worktree, branch and pull request.
- Read sections 0 to 7 in full, then only the slice you are executing.
- Stop at every decision gate (GATE n). Ask the owner with the AskUserQuestion tool, recommended option
  first, and wait for the answer. Never pass a gate on an assumption.
- Every step that produces an output (baseline screenshots, style tiles, audit tables) is resumable:
  check whether the output already exists and is complete before regenerating it.
- Starting fresh: run Phase 0 (section 6), then Slice 1a, then stop at GATE 1.
- GATE 1 round 1 ran on 2026-10-04 (`DESIGN_SYSTEM.md`). The owner answered the skin strategy and the
  icon policy and chose no direction. Until `DESIGN_SYSTEM.md` records a direction, run
  `VISUAL_DIRECTION_PROMPT.md` before Slice 1b.

---

## 1. Your role

You are a senior product designer and design-systems engineer who is also a veteran guidebook writer
and editor, with years of writing for the major independent travel-guide series. Hold three standards
at once:

1. **The designer's.** Hierarchy, restraint and consistency; a system, not a collection of screens.
2. **The UX lead's.** A traveller in bright sun, on one bar of signal, using one thumb, often hurried,
   often reading in a second language.
3. **The guidebook editor's.** The verdict comes first; practical facts (price, hours, how to get
   there, what to watch out for) are scannable and never buried in a sentence; every word earns its
   place.

You also ship production code here: vanilla ES modules, no build step, no bundler, no `node`, one
stylesheet (`css/style.css`), Python guards in `scripts/`, and a cache-first service worker.

---

## 2. The goal

> A traveller finds what they need in one glance and one tap, on a screen that feels calm, modern and
> unmistakably of the Mekong.

"Modern", made concrete:

- Fewer, stronger elements: one primary action per view, one card style, one heading style, one icon
  family.
- Solid colour with one accent, not a gradient on every button.
- A clear type hierarchy with few sizes, on generous and consistent spacing (the existing 4px scale).
- Motion that explains (120–200ms, transform and opacity only), never decoration.

"Not overwhelming", made concrete:

- The first 812px of every screen shows that screen's primary tool or answer.
- At most one row of chips before content; further filters live in a bottom sheet.
- No instruction paragraph on any screen; orientation lives behind the info control (ⓘ, `screenHint()`).
- No destination offered twice on the same screen.

---

## 3. Current state, measured 2026-10-04 (375×812, mk-v0.623.0)

I observed every item in the rendered app or counted it in the source, excluding comments. Re-measure
before relying on a number; the code changes daily.

### 3.1 The shell

- The topbar carries six controls on every screen: Back, Language, Settings, Saved & collections,
  Search and Emergency. The title receives 119px of the 343px bar. On the Wat Pho page, "Wat Pho
  (Reclining Buddha)" renders as "Wat Pho (Reclining…": the page's most important words are cut off.
- Language and Settings are set-once controls holding prime space on every screen. At topbar size the
  Settings gear (`ICON.gear`) read as a sun in the screenshots.
- Tab labels and screen titles disagree: Talk opens "Phrasebook", YOU opens "Your space", Places opens
  "Places for you". "YOU" is upper case; the other four tabs are title case.
- The language control shows a flag (the UK flag for English). Flags denote countries, not languages.

### 3.2 Visual language

- Two icon languages coexist: a 37-glyph line SVG set (`ICON_PATH`, `js/main.js:840`) in the topbar
  and tab bar, and emoji everywhere else. All 67 `ic:` fields in `js/nav-groups.js` are emoji, as are
  most section-heading icons and many button icons. Emoji render differently on iOS, Android and
  Windows, so the app does not control its own visual language.
- At least four section-heading treatments: muted small capitals with an emoji (Home, "QUICK ACCESS");
  pink upper case (Talk, "ALL PHRASES"); orange upper case behind a rule (You, "MY STUFF"; Explore,
  "CHOOSE ON THE MAP"); and the display face with an emoji inside cards ("Add your travel dates").
- The sunset gradient (`--grad-sun`) fills nearly every action. Talk's translate card shows four large
  buttons, three in that same gradient, so nothing on the card reads as the main action.
- Home offers "Plan your trip" twice, about 80px apart (the trip card's button and the pill below it).
- Token sprawl in `css/style.css` (235,752 bytes, 3,378 lines): 184 unique hex colours, 135 distinct
  `rgb()`/`rgba()` values, 46 gradients, 30 distinct radii, 26 distinct shadows and 59 distinct font
  sizes. In `js/*.js` and `js/screens/*.js` (data files excluded): 712 inline `style:` strings and 292
  hard-coded hex colours.
- Colour carries too many jobs: six brand hues (orange, magenta, pink, teal, grape, olive), nine group
  accents in `js/nav-groups.js`, and the map's category hues.
- House spelling is British (774 uses of "travelling" and "traveller(s)" in interface code), with seven
  American stragglers ("Traveling" five times, "traveler(s)" twice), including the Home trip-phase
  control.

### 3.3 Screens

- **Welcome.** Eleven lines of prose on the first screen. The secondary "Skip — just explore" button is
  full width; the primary "Next" is a small pill beside it.
- **Home.** The weather card is the tallest block (about 500px, mostly the 24-hour ring). Home's "Quick
  access" (Calendar, Budget, Weather, Journal) and You's "Quick access" (Calendar, My trip, Budget,
  Travel circle) are two different sets under one name. The trip-phase control reads "Planning /
  Traveling / Post"; "Post" is ambiguous.
- **Places.** Two rows of country chips, a dashed "travelling as" prompt, three location controls and
  eight layer chips over four rows push the map's top edge to about 610px. About 135px of map shows
  above the tab bar: roughly 20% of the usable first viewport for the screen's primary tool.
- **Explore.** The illustrated four-country map is the strongest visual in the app. Its caption is an
  upper-case instruction ("TAP A COUNTRY TO EXPLORE · PINCH OR SCROLL TO ZOOM · …").
- **All features (`#everything`).** It opens with a three-line instruction paragraph.
- **Place detail.** There is no on-page title (the name exists only in the clamped topbar); the first heading is
  "Why it fits you"; price, hours and booking are prose lines, not a scannable block. The editorial
  content is strong: a crisp verdict, a scam warning, "How you will know you are there", and the
  local-script name.
- **Info control placement.** On Talk, Places and the place page the ⓘ sits alone on its own row (about
  25px each), detached from what it explains.
- **You.** The name input has its own styling, unlike every other field.

### 3.4 What is already right and must survive

- The warmth and personality of the identity: the Mekonging wordmark, the sunset, the illustrated
  country map.
- The editorial voice of place entries: the verdict line, "Watch out", "How you will know you are
  there", and local-currency prices with an approximate home-currency figure.
- The five tabs and their order (`UX_OVERHAUL_PROMPT.md` W5a settled this; do not re-litigate).
- `js/nav-groups.js` as the single navigation manifest (nine groups), which every navigation surface
  renders.
- Automatic section folding in `mount()`, `screenHint()`, `countryContextLine()`, the persisted back
  stack, and `showBigPhrase()` (`js/phrase-ui.js`: full-screen local script to show a driver or a
  pharmacist).
- Offline-first delivery, self-hosted assets and the guard suite.

---

## 4. Non-negotiables

Project rules for every slice. The memory notes in brackets hold the incident detail; read the ones
your slice touches.

### Delivery

- Work in your own worktree off `origin/feat/scaffold-bangkok-slice`. There is no `main`. Never push to
  the integration branch; open a pull request. Other sessions share the main checkout: run
  `git branch --show-current` and `git status` immediately before every commit.
  [mekong-concurrent-sessions-git-safety, mekong-repo-conventions-and-tooling]
- Never commit secrets, tokens, keys, credentials or personal data. Scan every diff before pushing.
- When shipped files change, bump `APP_VERSION` (`js/main.js`) and `CACHE_VERSION` (`sw.js`) together,
  then run `python3 scripts/build-sw-manifest.py --write`. A file reaches returning travellers only
  when its hash moves in the generated manifest. [mekong-cache-version-is-the-only-delivery]
- Run every guard listed in `scripts/README.md` before committing; CI
  (`.github/workflows/guards.yml`) repeats them on every pull request as a backstop, not as the first
  check. Pass `--base origin/feat/scaffold-bangkok-slice` explicitly to `check-cache-version.py`.
  Guards are text analysis: prove parsing with `jsc -m` and behaviour by loading the app.
  [guards-do-not-parse-javascript]
- Run `git fetch origin` before claiming anything about merge state. [fetch-before-merge-state-claims]

### Design constraints

- Self-host every font and icon, and precache it; no CDN for anything the interface needs. Measure any
  font change for bytes, width at the real computed style and diacritic quality (stacked Vietnamese
  marks are the stress case). [webfont-choice-must-be-measured]
- Thai, Lao and Khmer fall back to system fonts; give them line-height room for marks above and below.
  Never set them in a Latin display face.
- 29 interface languages, four of them right-to-left (Hebrew, Arabic, Persian, Urdu; `isRTL()` in
  `js/i18n.js` sets `<html dir>`). Use logical properties (`margin-inline-start`, `padding-inline`,
  `inset-inline-end`), mirror directional icons under `[dir="rtl"]`, and allow strings about 35% longer
  than English. New strings go through the i18n dictionaries and keep `scripts/check-ui-strings.py`
  green. [mekong-parity-guards-are-not-coverage]
- Topbar titles carry no flag or emoji prefix; use `countryContextLine(cc)`. After any rename, sweep
  every route for clipped titles with `scripts/route-sweep.js` (import it; never paste it, because the
  CSP blocks eval). [mekong-topbar-title-column]
- Navigation lives only in `js/nav-groups.js`; never hand-write a feature list on a screen. When the
  group count changes, grep the spelled-out number. [mekong-nav-taxonomy]
- Copy is brief everywhere; orientation goes behind `screenHint()`; safety, legal, visa and sourcing
  disclaimers keep their exact wording. [mekong-ui-copy-brevity, mekong-help-text-behind-an-icon]
- `mount()` folds sections automatically: opt out with `data-nofold`, never nest a `<details>` inside a
  `<summary>`, and hold direct node references rather than querying through a card after mount.
  [mekong-automatic-section-folding, mount-folding-detaches-card-refs]
- Spacing uses `--sp-*` and `.stack-N`; never bake spacing into a shared widget as an inline style.
  `check-spacing.py` is a ratchet. [mekong-stack-utility-specificity]
- Accessibility to WCAG 2.2 AA: text 4.5:1 (large text 3:1); component boundaries and focus indicators
  3:1; hit areas at least 44×44px; visible focus never hidden under the sticky tab bar; both
  `prefers-reduced-motion` and the app's own Reduce motion setting honoured; text sizes S, M and L.
- Eight surfaces today: Classic light, Classic dark and six named skins. `scripts/check-contrast.py`
  stays green. Audit a skin by changing the Settings select as a traveller would; `applyTheme()` reverts
  hand-set attributes on every render. [mekong-skin-audit-traps]
- Performance: the app targets a 0.65 Mbps link and boots offline. No new runtime libraries. The
  stylesheet must shrink, not grow. CSS-only motion.

### Verification

- Verify on the rendered screen at 375×812, in Classic light and Classic dark at minimum. Screenshot
  first, then measure: the Browser pane is always `document.hidden`, so timers are clamped and geometry
  can read zero. [browser-pane-hidden-timeouts, mekong-verify-on-real-screen]
- Before trusting a change, clear the service worker and caches and call `location.reload()`; a hash
  change does not reload. Use a fresh origin (`127.0.0.1` instead of `localhost`) for first-run state.
  [mekong-preview-reload-gotcha, mekong-test-data-cleanup-gotcha]
- `content-visibility: auto` fakes heights and empties `innerText` on card-heavy screens: look, do not
  infer. Prove a refactor is a no-op with a computed-style digest across the route sweep.
  [mekong-measuring-rendered-screens]

### Cost

- No Workflow or multi-agent fan-out on this repository. If a Workflow is ever used, it must follow the
  global CLAUDE.md safeguards (Phase 0 preflight, idempotency guards, inter-phase gates).
- One slice per session; start a fresh session after each slice ships.
- Slice 1 needs design judgement (use the strongest model). Slices 2 onward are largely mechanical
  (Sonnet).
- `js/main.js` is 7,752 lines: grep for the function, then read a narrow range.

---

## 5. Design direction

### 5.1 Principles, in priority order

1. **Content before chrome.** The screen's subject owns the first viewport.
2. **One primary action per view.** Everything else is secondary, tertiary or in a menu.
3. **One of each.** One card style, one heading style, one icon family, one chip shape, one button
   shape.
4. **Colour carries meaning.** The accent marks the primary action and the active state; red means
   danger; nothing is coloured for decoration.
5. **Thumb first.** Frequent actions in the lower half of the screen; set-once controls in Settings.
6. **Glanceable in sunlight.** Strong ink on light surfaces; no pale grey text. Light is the design
   reference; dark is its equal peer.
7. **Guidebook clarity.** Verdict, then facts, then story.
8. **Rank, collapse, never remove** (inherited from `UX_OVERHAUL_PROMPT.md`). A destination may move,
   fold or become a chip; it may not disappear.

### 5.2 Three candidate directions (GATE 1 chooses)

Round 1 rendered these three, and the owner chose none of them (`DESIGN_SYSTEM.md`).
`VISUAL_DIRECTION_PROMPT.md` replaces this section for the direction choice; the values below remain as
the round-1 record.

The values below are starting candidates. I computed their contrast on 2026-10-04, each ratio against
the surface colour. Re-measure after any change.

**A. Golden Hour, refined (recommended).** Evolve the identity rather than replace it. The sunset
becomes a single saffron-orange accent used with restraint, the river becomes a teal secondary, and
everything else is warm paper and deep ink. Gradients survive only as brand moments (the welcome hero
and the wordmark). This keeps the brand's equity, the illustrated map and the existing theme machinery,
and carries the least risk across 29 languages and eight surfaces.

| Role (semantic token) | Light | Dark |
|---|---|---|
| Page `--color-bg` | `#FBF8F3` | `#17121F` |
| Surface `--color-surface` | `#FFFFFF` | `#211A2C` |
| Raised or sunken `--color-surface-2` | `#F3EEE6` | `#2A2238` |
| Hairline `--color-line` | `#E5DCCF` | `#3A3049` |
| Input border `--color-border-strong` | `#8C7F72` (3.89:1) | `#8A7FA0` (4.50:1) |
| Text `--color-text` | `#221A14` (17.13:1) | `#F5EFE6` (14.71:1) |
| Secondary text `--color-text-2` | `#5E5248` (7.56:1) | `#C2B8AC` (8.60:1) |
| Accent `--color-accent` | `#C2410C` (5.18:1; white on it 5.18:1) | `#FF8A3D` (7.17:1; `#1A1208` on it 7.90:1) |
| River `--color-river` | `#0F766E` (5.47:1) | `#3CC6B5` (7.96:1) |
| Danger `--color-danger` | `#B42318` (6.57:1) | `#FF6B5E` (6.02:1) |

**B. River and Rice.** Calmer and cooler: near-white paper, green-slate ink, and a jade river accent
(`#0E6B5C`, 6.41:1; dark `#3DD9B8`, 9.38:1), with saffron (`#B45309`, 5.02:1) only as a highlight.
Serene and botanical; gives up some of today's warmth.

**C. Night Market.** Dark-first and vivid: indigo night (`#12101C`), a neon-pink accent (`#FF5C8A`,
5.81:1) and lantern gold, with a quieter light counterpart (accent `#C2185B`, 5.87:1). The most
distinctive in the evening; the hardest to keep calm by day.

### 5.3 Typography

- Keep Be Vietnam Pro (self-hosted, weights 700 and 800) for display and the system stack for body,
  unless GATE 1 decides otherwise; it won a measured comparison on its drawn Vietnamese diacritics.
- Collapse 59 font sizes onto a scale of at most eight roles: display, title, heading, subheading,
  body, small, caption and label. Keep `--fs-base` at 1rem for form controls (iOS zooms inputs below
  16px).
- Sentence case everywhere. Retire `text-transform: uppercase` on headings and labels: capitals read
  more slowly and mean nothing in Thai, Lao, Khmer, Arabic or Hebrew.
- Body line-height at least 1.5, and at least 1.6 wherever Thai, Lao or Khmer appears.
- Figures that travellers compare (prices, temperatures, times) use `font-variant-numeric:
  tabular-nums`.

### 5.4 Iconography

- One line-icon family for all chrome: extend `ICON_PATH` on a 24px grid with one stroke weight and
  round caps and joins. Borrowed glyphs come from an ISC- or MIT-licensed set, inlined as paths (no
  runtime fetch), with the licence recorded in the repository.
- Emoji leave navigation, headings, buttons and tab labels. They may remain inside content where they
  carry meaning (a dish, a fruit).
- Country flags become four small self-hosted SVGs, used only where a flag genuinely helps (the country
  picker). Name each language in its own script ("ไทย", "Tiếng Việt", "עברית"); never show a language
  as a flag.
- Group doors in `nav-groups.js`: a line icon on a tinted tile, the tints drawn from one validated
  categorical palette.

### 5.5 Colour architecture

- Two layers: primitives (the palette) and semantic roles (`--color-bg`, `--color-surface`,
  `--color-text`, `--color-accent`, `--color-on-accent`, `--color-border-strong`, `--color-danger` and
  so on). Components read roles only; skins redefine roles only.
- Existing variables (`--cream`, `--card`, `--ink`, `--ink-soft`, `--orange`, `--teal`, `--magenta` and
  the rest) become aliases of roles so nothing breaks, then retire screen by screen.
- At most three gradients, all of them brand moments. No gradient on a functional button.
- Map category hues stay as they are (they are the legend's language) and live in one place.

### 5.6 Navigation model

- Five tabs, each owning one job (from `UX_OVERHAUL_PROMPT.md` W5b): Home (what now), Talk (say it),
  You (your trip, your things, your settings), Places (what is around me), Explore (where next).
- Nine group hubs from `js/nav-groups.js` for everything else; sitewide search for anything; Emergency
  one tap away on every screen.
- No feature deeper than three levels below a tab. Back always returns to where the traveller came
  from.
- Each tab's root screen carries the tab's label as its title.

### 5.7 Button placement

- One primary button per view or section, placed at the end of the content it acts on, in the lower
  half of the screen where possible. Never put a primary action in the topbar.
- Full-width buttons only inside forms, dialogs, bottom sheets and onboarding, where the primary
  action sits in a sticky footer above the tab bar and the safe-area inset. Elsewhere, buttons take
  their content width.
- A pair of actions puts the primary on the trailing side (right in left-to-right languages, left in
  right-to-left ones). Never stack more than two full-width buttons; a third becomes a tertiary text
  button or moves into an overflow menu.
- Repeated object actions (Save, Map, Share, Show to driver) live in one consistent action row, each
  with an accessible name and a visible label wherever width allows.
- Destructive actions are never the default, sit apart from the primary, and confirm before anything
  irreversible.
- No floating action buttons, except the map's locate-me control.

### 5.8 Motion

- 120ms for press feedback, 200ms to enter, 160ms to exit; standard easing; transform and opacity
  only.
- Skeletons, not spinners, for anything slower than 300ms. Bottom sheets slide; screens cross-fade with
  a short translate. No parallax and no looping animation.
- Under Reduce motion, every transition becomes an instant change.

---

## 6. Phase 0 preflight (every session, before any slice)

Fail fast and cheaply. Report `PREFLIGHT PASS`, `PREFLIGHT WARN` or `PREFLIGHT FAIL`; stop on FAIL.

1. `git fetch origin`; confirm that `origin/feat/scaffold-bangkok-slice` resolves; create the slice's
   worktree and branch from it.
2. Confirm the key files exist and are non-empty:
   `wc -l css/style.css js/main.js js/nav-groups.js js/ui-widgets.js js/render-utils.js sw.js`.
3. Run every guard in `scripts/README.md` on the untouched branch and record any pre-existing failure,
   so it is not blamed on the slice.
4. Parse-check with `jsc -m js/main.js` (the binary path is in memory note
   guards-do-not-parse-javascript). `node` is absent on this machine: that is `PREFLIGHT WARN`, not
   FAIL. Brace-balance (in Python) every JavaScript file the slice will modify.
5. Add a `.claude/launch.json` entry for the worktree on a free port (never 8742, which other sessions
   use) and start it with `preview_start`.
6. Capture baseline screenshots at 375×812 in Classic light and Classic dark into the session
   scratchpad, never the repository: `#home`, `#phrasebook`, `#me`, `#places`, `#explore`,
   `#everything`, `#place-th-bkk-wat-pho`, `#settings`, plus every route the slice touches.

---

## 7. Decision gates

Ask each gate with AskUserQuestion, recommended option first, at the point named. Record every answer
in `DESIGN_SYSTEM.md`.

- **GATE 1** (end of Slice 1a): the direction (A, B or C); the skin strategy (recommended: keep all six
  named skins as palette-only variants of the new roles and retire any that cannot reach AA;
  alternatives: Classic plus two favourites, or Classic only); the icon policy (recommended: line icons
  for all chrome, emoji only in content). Round 1 (2026-10-04) answered the skin strategy and the icon
  policy; the direction moved to `VISUAL_DIRECTION_PROMPT.md`.
- **GATE 2** (start of Slice 4): the topbar inventory (recommended: Back, title, Search and Emergency;
  Language moves to Settings, while Settings and Saved stay reachable from You; this answers the open
  question recorded in memory note mekong-topbar-title-column); large titles that collapse on scroll
  (recommended: yes).
- **GATE 3** (start of Slice 5): Home's weather (recommended: a one-line summary, with the 24-hour ring
  moved to the Weather screen); the trip-phase labels (recommended: "Planning / On the road / Back
  home"; compact alternative: "Before / During / After"). Change the labels only; keep the stored phase
  keys.
- **GATE 4** (start of Slice 7): the Places layout (recommended: map-first, with a bottom-sheet list and
  one Layers button).

---

## 8. The slices

Slices 1–4 build the system; slices 5–11 apply it. Each slice runs Phase 0 first and section 9 last,
and ships as one pull request.

### Slice 1. Direction and foundations (start here)

- **1a. Style tiles.** In the session scratchpad, build one standalone page that renders directions A,
  B and C at 375px in light and dark: the palette with measured ratios, the type scale, buttons
  (primary, secondary, tertiary, destructive, icon), chips, a card, a list row, a section header, an
  input, the topbar, the tab bar, and one real place listing (Wat Pho). If the Artifact tool is
  available, publish the page as a private artifact so the owner can compare the directions on a
  phone; otherwise serve it from the scratchpad. Then ask **GATE 1**, and stop until it is answered.
- **1b. Token layer as a provable no-op.** Add the primitive and semantic layers to `css/style.css` with
  values equal to today's, alias the existing variables onto them, and prove zero visual change with a
  computed-style digest across the route sweep in Classic light and dark.
- **1c. Restyle by token values only.** Apply the chosen direction by changing token values. Extend
  `scripts/check-contrast.py` to the new roles and keep all eight surfaces green; screenshot every
  reference route.
- **1d. Ratchet guard.** Add `scripts/check-design-tokens.py`, modelled on `check-spacing.py`: unique hex
  colours in CSS and JavaScript, font sizes, radii, shadows, gradients and emoji in navigation chrome
  may fall but never rise. Record today's ceilings, and register the guard in both
  `scripts/README.md` and `.github/workflows/guards.yml` (the workflow keeps its own copy of the
  list).
- **1e. `DESIGN_SYSTEM.md`.** Principles, tokens, gate answers, and the component inventory that Slice 3
  completes.
- **1f. Living style guide.** Add `tools/styleguide.html`, which imports the real factories from
  `js/ui-widgets.js` and `js/render-utils.js` where they import cleanly and renders every component in
  every state, with a skin switcher. It is not linked from the app and touches neither the router nor
  the service-worker manifest. Every later slice verifies against it.

Done when: GATE 1 is answered; the token layer has landed as a proven no-op and then been restyled; the
ratchet guard is green with recorded ceilings; and all eight surfaces pass contrast.

### Slice 2. Type and icons

- Collapse font sizes onto the scale; remove upper-case headings; apply tabular figures.
- Extend `ICON_PATH`; replace emoji in the `nav-groups.js` `ic:` fields, section headings, buttons and
  the tab bar; mirror directional icons in right-to-left languages.
- Replace the language flag with the language's own name.
- Correct the seven American spellings in user-facing strings. Lower the ratchet ceilings.

### Slice 3. The component kit

Rebuild each component in the shared factories so every screen inherits it, with default, pressed,
focus-visible, disabled and loading states.

- **Buttons.** Primary (solid accent, 48px tall), secondary (tonal), tertiary (text), destructive and
  icon. At most one primary per view or section (section 5.7).
- **Chips.** One pill shape; filter, choice and action variants; 32px visual height inside a 44px hit
  area.
- **Card.** One surface, one radius, a hairline or a soft shadow (not both); no card inside a card.
- **Section header.** Sentence case in the display face, an optional trailing action ("See all"), an
  optional fold control, and the info control inline at the end of the row, never on a row of its own.
- **List row.** Icon tile, title, subtitle, and a trailing chevron, value or switch.
- **Callout.** Info, caution, danger and success variants, used for "Watch out", offline notices and
  safety disclaimers.
- **Inputs.** Text, search (with clear), select, textarea and segmented control; 16px text, a visible
  label and a 3:1 border.
- **Bottom sheet.** For filters, layers and overflow actions; focus trapped; closes with Back, Escape
  and a downward swipe.
- **Feedback.** Toast, empty state, skeleton and error state ("This screen is not on your device yet" is
  good copy; keep it).
- At most four radii and three elevations.

### Slice 4. The app shell (GATE 2 first)

- Topbar reduced to the GATE 2 inventory; title column at least 240px wide at 375px.
- A large title that collapses into the compact bar on scroll; on screens with a hero image, the bar
  starts transparent over the image.
- Back as a plain chevron with a 44px hit area, not a filled circle.
- Emergency as a consistent icon button in the danger colour, always reachable.
- Tab bar: sentence-case labels ("You"); one active treatment (a filled icon with an accent label, or an
  indicator pill, not both); each root screen titled with its tab's label.
- Safe-area insets respected; `scroll-padding-bottom` set so focus never hides under the tab bar.

### Slice 5. Home (GATE 3 first)

- Order by trip phase. Planning leads with the countdown and the next step. On the road leads with now:
  where you are, today, the weather in one line and nearby picks. Back home leads with the journal and
  the recap.
- One "Quick access" set, defined once and shared with You; at most six items; personalisable.
- One "Plan your trip"; one primary action per section.
- A prominent search field near the top (the topbar search icon hides on screens that show the field).

### Slice 6. The place listing (guidebook anatomy)

Top to bottom:

1. Full-bleed hero photo (about 16:10); the credit behind a small info tap, not a caption line.
2. On-page title: the name, the local-script name large enough to show a driver, and a one-line
   verdict.
3. At most one badge (for example, a top pick); tags as quiet chips.
4. A facts grid, icon plus value: price, hours, time needed, best time to go, step-free access and
   booking.
5. An action row: Save, Map, Show to driver (reuse `showBigPhrase()` with the local-script name) and
   Share.
6. "Why it fits you" as a short highlighted note, not the first heading.
7. The description; "Watch out" as a caution callout; "Find it" ("How you will know you are there");
   "Combine with" and nearby places; sources behind the info control.

Apply the same anatomy, compressed, to place cards in lists.

### Slice 7. Places (GATE 4 first)

- The map fills the first viewport (target: at least 60% of it), with the location control overlaid on
  the map and the country switch as a compact control in the header.
- The eight layer chips become one Layers button that opens a bottom sheet of switches.
- The "travelling as" prompt becomes one quiet chip or moves into the sheet.

### Slice 8. Talk

- One input row: a text field with a microphone and a camera ("point at a sign") inside it, and one
  primary Translate action.
- The result in large local script, with Speak, Save to dictionary, Copy and Show full screen as icon
  actions.
- Phrase categories as the shared list row.

### Slice 9. Explore, hubs and All features

- Keep the illustrated map; remove the upper-case caption (the tap affordance must be self-evident; any
  explanation goes behind the info control).
- Country cards as a horizontal carousel: a photo or illustration, the flag SVG and three facts.
- `#everything` and `#hub-*`: no intro paragraph; the doors use the new icon tiles.

### Slice 10. Welcome

- One question per step and one primary button per step, at the thumb; "Skip" as a tertiary text
  button.
- At most two short lines of body copy per step; the rest behind the info control.
- The sunburst hero stays as the brand moment; the wordmark stays legible against it (aim for 3:1).

### Slice 11. The long tail

Settings, Emergency (its numbers card keeps `data-nofold`), Budget, Weather, Journal, Identify,
Transport, Borders and every remaining route. Then a full pass across all eight surfaces, text size L,
the longest interface language (German or Russian) and one right-to-left language (Hebrew). Then lower
every ratchet ceiling.

---

## 9. Verification protocol (every slice, before the pull request)

1. Every guard green, including `check-design-tokens.py` once it exists; `jsc -m` parse clean.
2. Before-and-after screenshots of every touched route at 375×812 in Classic light and dark; for slices
   1–4, all eight surfaces.
3. Contrast: `check-contrast.py` green; spot-check rendered pairs, compositing `rgba()` over the real
   background and skipping gradient-filled elements.
4. Hit areas probed with `elementFromPoint` outward from the centre (counting a wrapping label): at
   least 44×44px.
5. Title sweep: zero clipped titles across the route sweep in English and in the longest language.
6. Right-to-left: Hebrew renders mirrored, with no physical-direction leftovers.
7. Reduce motion on: no animation remains.
8. Offline: after one online load, reload with the network off; fonts and icons are present.
9. Refactor steps: computed-style digest identical across the sweep.
10. Console clean.
11. Send the owner the key before-and-after screenshots, and state the measured deltas in the pull
    request (for example, "unique hex colours 184 → 41").

---

## 10. Measures of success

| Measure | 2026-10-04 | Target |
|---|---|---|
| Topbar title column at 375px | 119px | at least 240px |
| Clipped titles in the route sweep | at least one ("Wat Pho (Reclining…") | zero, in English and the longest language |
| Primary tool's share of the first viewport on Places | about 20% | at least 60% |
| Primary-styled buttons in one card (Talk) | 3 | 1 |
| Unique hex colours in `style.css` | 184 | 40 or fewer |
| Hard-coded hex colours in interface JavaScript | 292 | 0 outside one map-palette file |
| Inline `style:` strings in interface JavaScript | 712 | falling every slice (ratchet) |
| Distinct font sizes | 59 | 8 or fewer |
| Distinct radii / shadows / gradients | 30 / 26 / 46 | 4 / 3 / 3 or fewer |
| Emoji icons in `nav-groups.js` | 67 | 0 |
| American spellings in user-facing strings | 7 | 0 |
| `style.css` size | 235,752 bytes | smaller |

---

## 11. Starting message

Paste this into a fresh session opened on the Mekonging repository:

> Read `REDESIGN_PROMPT.md` in full (sections 0–7, then Slice 1). Run Phase 0, then execute Slice 1a
> and stop at GATE 1.

If `DESIGN_SYSTEM.md` records no direction yet, use the starting message in
`VISUAL_DIRECTION_PROMPT.md` section 8 instead.
