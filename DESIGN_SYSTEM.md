# Mekonging design system

Status: started 2026-10-04 with the gate record. `REDESIGN_PROMPT.md` Slice 1e completes it with the
principles, the tokens and the component inventory. Until then, this file holds the gate record only.

## Gate record

### GATE 1, round 1 (2026-10-04)

Asked at the end of Slice 1a, against the round-1 style tiles
(https://claude.ai/artifact/8QWD6aT81hp6xbpumqH2vx; tokens in `tools/style-tiles/round1.json`).

| Question | Answer |
|---|---|
| Direction | None chosen. The owner was not sure about A ("Golden Hour, refined"), B ("River and Rice") or C ("Night Market"), for two reasons: they are not distinctly Mekong, and they lost today's spirit. The owner asked for a prompt that puts more experts on the question. That prompt is `VISUAL_DIRECTION_PROMPT.md`: round 2, an expert panel in one session. |
| Skins | Keep all six named skins (Night Market, Silk Route, Tropical Pop, Cambodian Psych ’60s–’70s, Psych Night, Luxury Expedition) as palette-only variants of the new semantic roles, and retire any that cannot reach WCAG AA on those roles. |
| Icons | One line-icon family for all chrome: navigation, headings, buttons, tab labels and the group doors. Emoji stay only inside content, where they carry meaning. |
| Scope of round 2 | The full visual language may change: palette, typeface, shapes, density, motif and photo treatment. The five tabs, `js/nav-groups.js` and each screen's information architecture stay fixed. |

### Round 2 (PR #90), superseded 2026-10-05

The round-2 expert-panel prompt was merged but never run. On 2026-10-05 the owner set the direction in
conversation, with a style reference: the "NASA Vintage Colors Emblem" poster (arthook, Redbubble), a deep
navy ground with cream text and a 1970s stripe arc. `VISUAL_DIRECTION_PROMPT.md` now holds that brief.

### Direction decisions (owner, 2026-10-05)

| Question | Answer |
|---|---|
| The default | A retro theme: cream poster paper by day, the navy night poster at night (following the phone). Its four stripes are the four countries. |
| The other new themes | River, Four Flags and Temples & Markets: three plain, modern themes. All four new themes are selectable, and every existing option stays. |
| The retro element | Stripe bands only: behind the sun on Welcome, under the tab-root headers, on section dividers, on empty states and as the tab bar's top edge. No emblem rings, no grain, no new display face; Be Vietnam Pro stays. |
| Feel | Calm base, vivid moments: quiet grounds, vivid stripes, plain modern controls. |
| The logo | Unchanged and pinned: the same sun on every theme. |
| Navigation | Recommended, for the Phase 1 gate to confirm: the four country colours do the wayfinding, the one sun orange marks the active tab and is the only primary-action colour, and red only means danger. |
| Classic | Stays selectable as "Classic sunset", changed only by an AA fix to its primary button. |
| Delivery | Four pull requests in order (candidates and the gate; machinery and guards; the four themes and first paint; flip the default). PR #90 merged before Phase 1 began, so Phase 1 opened its own. |

### Phase 1 gate (asked 2026-10-05)

Asked against the Phase 1 gallery (private artifact): https://claude.ai/artifact/UgtdPRkVg3RnVeg4YQzhKA.
It shows 112 screens (welcome, home, places, explore, the Wat Pho listing, Talk and You, by day and by
night) for the four retro variants, the three modern themes and today's Classic, with the ratios that
`tools/style-tiles/measure.py` measured from `tools/style-tiles/round2.json`.

Answered by the owner on 2026-10-05, each with the recommended option.

| Question | Answer |
|---|---|
| The default and its stripe tuning | The retro theme, with the map stripes: Thailand brick, Vietnam plum, Cambodia gold, Laos green (`retro-map` in `round2.json`). The poster tuning (`retro-poster`) stays in the file as the measured alternative. |
| Navigation | The four country colours do the wayfinding. The one sun orange marks the active tab and is the only primary-action colour, and red only means danger. The colour-per-tab variant is rejected. |
| Theme names | "Mekong Retro" for the default. "River", "Four Flags", "Temples & Markets" and "Classic sunset" as proposed. |
| Existing users on `classic` | Move them to Mekong Retro with a one-time Undo toast that restores Classic, keeping their stored light/dark setting (Phase 4, store version 16). |

## Phase 2: machinery and guards (2026-10-05, `mk-v0.624.0`)

Phase 2 of `VISUAL_DIRECTION_PROMPT.md` changes no theme's look except one: Classic's primary button.

- **Theme table.** `js/theme.js` is import-free and holds `DEFAULT_SKIN` (still `classic`) and `SKIN_MODE`. The
  ids of the four new themes are `retro` (Mekong Retro), `river`, `flags` (Four Flags) and `temples`
  (Temples & Markets); all four are `auto`, as is `classic`. `applyTheme()` stamps `data-skin` for every skin,
  Classic included, and maps an unknown id to `DEFAULT_SKIN`. Until Phase 3 lands their palettes, the four are
  listed as pending in both `check-skins.py` and `check-contrast.py`, are not in Settings, and would render
  Classic's colours if stored.
- **Wayfinding hooks.** The tabs have ids (`tab-home`, `tab-talk`, `tab-you`, `tab-places`, `tab-explore`).
  `applyTab()` runs in `render()` after `applyTheme()` and sets `html[data-tab]` (`home`, `talk`, `you`,
  `places`, `explore`), `html[data-country]` and `html[data-route]`. A route that names a country
  (`#visa-vi`) wins over the traveller's destination, so `data-country` always agrees with the context line.
  Country chips, Explore cards and the context line carry `data-cc`. Nothing styles any of it yet.
- **Tokens.** The four `--country-*` colours, `--role-*` hues for the places that used to borrow a country's
  value (Journal, Exchange, the calendar's holiday and own-plan layers, the budget's Stay), `--on-fill`,
  `--btn-*`, `--back-*`, `--hero-*`, `--rule-brand`, `--pip-brand`, `--sea` and the map strokes, the glows,
  `--shadow-tint`, `--shadow-up` and `--scrim`, all at today's values. `REGION_COLORS` is
  `var(--country-*)`, applied as an inline style.
- **Stripe band.** `--stripes`, `--stripes-crown` and `--stripes-ring` plus `.stripe-band`, `.stripe-crown` and
  `.stripe-sweep` paint nothing until a theme sets `--stripe-1` to `--stripe-4` (and `--stripe-gap`).
- **Classic's button.** `#F2A93B` to `#E8632A` with the badge ink: 8.55:1 and 5.08:1, against 3.01:1 for white
  on the old `#E07A1F` stop. Other fills (chips, phase switch, pills, update toast) keep white labels.
- **Guards.** `check-contrast.py` now reads `js/theme.js`, builds `<id>-light` and `<id>-dark` surfaces in
  cascade order with `var()` resolved, asserts its surface count, checks text on the card and (new themes
  only) on the page, labels on every fill stop, and the country colours (new themes only), and reports the
  rules it skips. `LABEL_EXCEPTIONS` records ten shortfalls of the primary button's white label on five of the
  six named skins (never given a dark ink; fixing them changes their look). `check-skins.py` is new and in CI.
- **Proof of no visual change.** Computed colours, borders, shadows and gradients of every element were
  compared between `origin/feat/scaffold-bangkok-slice` and this branch on 8 themes by 8 screens. The six
  named skins differ nowhere; Classic differs on 29 primary-button elements, all the intended change.

## Phase 3: the four themes, the pinned logo and first paint (2026-10-05, `mk-v0.625.0`)

Phase 3 lands the four palettes. The default is still Classic until Phase 4 flips it, so a traveller sees
the new themes only by choosing one in Settings; two things change for everyone and are named below.

- **Where the values live.** `tools/style-tiles/round2.json` is the only source. `tools/style-tiles/port-themes.py`
  writes the block between the two `GENERATED THEMES` markers at the end of `css/style.css`: per theme, a light and
  a dark `:root[data-skin="<id>"][data-theme="<mode>"]` token block (specificity 0,3,0, so nothing leaks across
  modes) and the chrome rules the owner approved on the Phase 1 gallery. `retro` is the `retro-map` tuning.
  `port-themes.py --check` runs in CI and fails if the block is stale. Re-run the script after any change to
  `round2.json` or `preview.py`.
- **Retro only.** The four-stripe band (one stripe per country, `--stripe-1` to `--stripe-4`) sits behind the sun
  on Welcome, under the tab-root headers and Home's header, on section dividers, on empty states and as the tab
  bar's top edge. River, Four Flags and Temples & Markets use hairlines and no stripes.
- **Navigation.** The sun orange marks the active tab and fills every primary action; a country's own pages carry
  its colour under the header; red is danger only. A pressed chip and the phase switch are ink (selected is a state).
- **The pinned logo.** `logoSVG()` carries literal colours identical to the `index.html` splash (`#F2A93B`,
  `#E8632A`, `#D6336C`, `#16A39A`). This moves one thing everywhere, Classic included: the wordmark's middle stop
  was Classic's `--sun-deep` (`#E07A1F`) and is now the splash's `#E8632A`.
- **Settings.** A "Regional" group holds the four themes. "Day / night (Classic only)" is now "Light / dark",
  enabled for Classic and the four regional themes and disabled for the six fixed-mode skins.
- **First paint.** `js/theme-boot.js` (a classic script in `<head>`, allowed by the CSP, precached) stamps
  `data-skin` and `data-theme` from `mk.store` before the first frame, with the same rules as `applyTheme()`
  (tested on nine stored-profile and device combinations). `index.html` has two `theme-color` metas scoped by
  `prefers-color-scheme` (`#F3EBDA`, `#131A2E`); `applyTheme()` sets both to the resolved surface. The manifest's
  `theme_color` is `#F3EBDA`. Until a theme is stamped, the splash follows the device (cream by day, navy by night).
- **Guards.** `check-skins.py` and `check-contrast.py` have no pending ids; the contrast guard now reads all 16
  surfaces and checks the new labels (ink fill with a surface label, the danger fill, white on `--teal-deep`).
  `--teal-deep` is each theme's secondary, deepened where needed so white reads at 4.5:1 or better (measured
  4.60 to 13.62:1). `check-contrast` replaced its Phase 2 "pressed chip on teal-deep" pair, which no longer applies
  to the new themes.
- **Not changed, noted for later.** The places map's basemap colours are literal in `js/map.js`, so a dark theme
  still shows its tan land; text inputs keep the browser's white field on dark themes; Talk's translate card stacks
  three primary buttons.

## Phase 4: the default flips to Mekong Retro (2026-10-05, `mk-v0.626.0`)

- `DEFAULT_SKIN` is `retro` (`js/theme.js`), and so is the default profile's `skin` in `js/state.js`. A profile with no
  skin, or an unknown one, renders as Mekong Retro. Classic sunset stays selectable in Settings. An older build does not
  know a newer id and renders it as its own default, so a rollback is safe.
- **Store version 16.** `migrate()` moves a profile whose stored skin is `classic` and whose version is under 16 to `retro`
  (Classic was the default, so that stored value cannot tell "never chose" from "chose"; the gate answer was to move them).
  It keeps the stored light / dark choice and leaves every other skin alone, and a profile that picks Classic again at
  version 16 or later is left on it.
- **The Undo toast.** The migration sets `prefs.skinMovedFrom`; `render()` shows "New look: Mekong Retro." once with an Undo
  that restores Classic, and clears the flag first so it cannot return.
- **First paint.** `js/theme-boot.js` paints a version-15 Classic profile as the default, so it never flashes Classic once.
- **Tested** in headless Chrome on a fresh install, v15 Classic with auto and with forced dark, v16 Classic, and v15 Silk
  Route: the skin, the toast, Undo, the stored value and a reload after Undo all behave as above.

## S1: tokens and machinery (2026-10-27, `mk-v0.653.0`)

S1 builds the refinement of `docs/PROGRAM.md` section 5.3 as tokens and components and applies it to no existing screen (R1 to
R3 do that). S0, the owner's style gate, has not run, so there are no S0 answers to record here: the values are section 5.3's
own, and S0 or R1 may revise them. The stylesheet is the new `css/refined.css`, linked after `css/style.css` and precached.

- **The mechanism: opt in, never override.** Item 1 keeps the existing `--fs-*` names and puts them on one ratio, which would
  move the 241 places that read them. So the refined values are declared on `[data-refined]` and nowhere else, and `:root`
  keeps today's values. A screen group opts in by putting `data-refined` on its root (R1 to R3); the new place card carries it
  itself. The same holds for the line heights and the reduced-motion rule: a refined screen only. Everything else in the file is
  a new token name, a new class, or the scoped override `[data-refined] .skeleton`.
- **Type (item 1).** On the ratio 1.125 from 1 rem: `--fs-label` 0.75rem (a 12 px floor, the one exception to the ratio),
  `--fs-xs` 0.79rem, `--fs-sm` 0.889rem, `--fs-base` and `--fs-body` 1rem, `--fs-h3` 1.125rem, `--fs-h2` 1.266rem, `--fs-h1`
  `clamp(1.424rem, 1.3rem + 0.7vw, 1.6rem)`, `--fs-display` unchanged. `--fs-lg` is restated in the scope, because a `var()` is
  resolved where it is declared. `scripts/check-font-sizes.py` holds the literal count at 138 CSS declarations (50 distinct) and
  74 in the JavaScript (47 in pixels); R1 to R3 can only lower it (`--write` keeps the gain).
- **Line height (item 2).** `--lh-tight` 1.2, `--lh-body` 1.5, `--lh-script` 1.7 under `:lang(th)`, `:lang(lo)` and `:lang(km)`,
  `--lh-vi` 1.6 under `:lang(vi)`, all inside `[data-refined]`. A script rule outranks the heading rule, so a Thai heading keeps
  its marks.
- **Figures (item 3).** `.num` is `font-variant-numeric: tabular-nums`; the place card's meta row and its checked date wear it.
- **Chart colours (item 4).** `--viz-1` to `--viz-8` for all 16 surfaces (11 skins; light and dark where a skin has both), plus
  `--viz-grid` (`--line`), `--viz-axis` and `--viz-label` (`--ink-soft`). The method is the `dataviz` skill's. Eight hue families
  in one fixed order, brick, plum, gold, teal, blue, green, violet, rose, never cycled; four are the countries' own hues, read
  from Mekong Retro's `--country-*` (Thailand brick, Vietnam plum, Cambodia gold, Laos green), the other four are the logo's teal
  and rose, the Flags theme's Laos blue and Classic's grape. The hue of a family is the same on every skin; a skin changes only
  the lightness and chroma, stepped for its card. `tools/style-tiles/derive-viz.py` derives the palette into
  `tools/style-tiles/round2.json` (`viz`), `port-themes.py` writes it into the generated block at the end of `css/refined.css`,
  `derive-viz.py --check` holds the dataviz checks on every surface (lightness band, chroma at least 0.10, neighbouring slots at
  least 6 apart under protanopia and deuteranopia, at least 15 apart in normal vision, 3:1 on the card), and `check-contrast.py`
  holds the 3:1 and the label's 4.5:1 in CI. The skill's own `validate_palette.py` reproduces the checks. Worst neighbouring
  pair under colour-vision deficiency across the 16 surfaces: 16.4 (target 8). The palette is for lines, bars and stacks; a
  scatter or a map, where any two marks can touch, takes the first three slots only.
- **Icons (item 5).** `icons/ui.svg` holds 51 Lucide glyphs (the scope said about 40; the 64 chrome emoji of `js/nav-groups.js`
  and the tabs and controls need 51 distinct ones), 12.0 KB, 3.7 KB gzipped, built by `scripts/build-icon-sprite.py` from
  lucide-static 1.62.0. Lucide is ISC licensed and the glyphs it took from Feather are MIT; `icons/LICENSE-lucide.txt` carries
  both. An icon is `iconNode(id)` or `iconSVG(id)` from `js/icons.js`: a 20 px `--icon-size` `<svg class="icon">` at
  `--icon-stroke` 1.75 in `currentColor`. Every group and feature of `js/nav-groups.js` gained an `icon:` id beside its `ic:`;
  nothing reads it until the roll-out. `scripts/check-icons.py` keeps the sprite, those ids and every call in step.
- **Place card and photos (items 6 and 8).** `js/place-card.js` `placeCardRF(place, options)`: media in a `--card-media-ratio`
  3 / 2 box capped at `--card-media-max` 240 px, one crop rule (`object-fit: cover`, centred), one credit-line style, an
  "Archival photo" label when the caller says so; the name (a link or a button, 44 px tall) and the local name in its own
  script; a meta row of open now, price tier and distance in `.num`; the source chip and "Checked <month year>" from the
  record's `verified` stamp. The card is a pure view: the caller supplies the photo, the open state and the distance, so the
  module stays lazy. Which two Vietnamese photos are archival is not recorded in the data; R1 marks them.
- **Artwork (item 7).** `js/place-art.js`: 11 inline-SVG motifs on the pattern of `js/market-art.js` (stay, food, culture,
  market, nature, beach, viewpoint, transport, practical, nightlife, and `other`, which wellness uses), 9.1 KB. The colours are
  classes that `css/refined.css` maps to tokens, so every skin repaints them; the family colour is one of the `--viz-*` slots,
  so it is already held to 3:1. Each drawing is named "Artwork: a bed" for a screen reader and is never captioned as a photo.
- **States and motion (item 9).** `--dur-1` 120 ms and `--dur-2` 200 ms; the one easing token is the existing `--ease`, not a
  new one. One reduced-motion rule, scoped to `[data-refined]`, honouring both the device setting and Settings' own
  `html[data-reduced-motion="on"]`. `[data-refined] .skeleton` takes `--skel-base` and `--skel-shine`, the ink laid over the
  card (`color-mix`, with `--line` as the fallback). `.rf-empty` carries the retro stripe band.
- **Target size (item 10).** `--hit` 44 px, used by the card's name link; Q3 to Q5 apply it to the rest.
- **Strings.** The strings S1 added ("Open now", "Closed", "Checked", "Archival photo", the artwork names) are English only until
  L2, like the other recent additions.
