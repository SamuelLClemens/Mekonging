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
