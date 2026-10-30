# 375 px rendered-screen audit (slice Q1)

Measured values only. Nothing was fixed. Each number below was read from the rendered page in headless Chrome, not estimated from CSS.

## Setup

| Item | Value |
| --- | --- |
| Date | 2026-10-19 |
| Build audited | `mk-v0.640.0`, `origin/feat/scaffold-bangkok-slice` at 1aa5876. The branch has since moved (PR #118, D5 Vietnam, data and citations); the audit was not repeated on it |
| Browser | Google Chrome 155.0.8059.80, `--headless=new`, fresh profile per theme, `launch` and `CDP` from `tools/style-tiles/capture.py` |
| Viewport | 375 x 812 CSS px, device scale factor 2, mobile emulation with touch. `document.hidden` is false on every recorded route: macOS display sleep flips headless pages to hidden mid-run, so 51 routes per theme measured in that state were discarded and measured again after the display was kept awake |
| Skin | Mekong Retro (`retro`) seeded through the live store, once with `theme: light` and once with `theme: dark`, with `prefers-color-scheme` emulated to match. Each route reports `data-skin` and `data-theme`; all matched |
| Server | `python3 scripts/serve.py 8761` on 127.0.0.1 from the audit worktree |
| Routes | 77: the 72 that `scripts/route-sweep.js` derives from `js/nav-groups.js` (55 features, 9 `#hub-*` doors, the tab bar, `#search`, `#saved`, `#sos`, `#everything`, `#welcome`), plus `#market` and its four chips (`#market-items`, `#market-rooms`, `#market-rides`, `#market-cash`). `{cc}` routes use `th` |
| Loads | 154 route loads (77 routes x 2 themes), each a cold deep link (`/?q=<n>#route`) so every route boots as a shared link would |
| State | A fresh profile: every screen is in its empty state. One extra pass seeds two trip stops so the journey map renders (see Map credits panel) |

## Headline numbers

| Measure | Routes affected (of 77) | Detail |
| --- | --- | --- |
| Horizontal overflow past the 375 px edge | 0 | none: no unclipped box extends past either edge in either theme |
| Console errors or exceptions from the app | 1 | #map |
| Network errors (failed requests) | 0 | none |
| Controls covered by an overlay | 0 | none; the credits panel is covered separately below |
| Contrast failures (WCAG AA, rendered colours) | 28 | 19 distinct selectors |
| Controls under 44 x 44 px in the screen body | 66 | 1315 controls in light, 1315 in dark, summed over routes |
| Map credits panel covering a pin when opened | 2 | #journey (2 stops), #places |
| `route-sweep.js` flags other than the zero-size artefact | 0 | none |

What the numbers say:

- **Layout holds.** No route overflows 375 px in either theme, and the app raises no console error or failed request except one intermittent exception on `#map` (below).
- **Tap size is the main finding.** 66 of 77 routes carry body controls under 44 px (1315 controls, 199 of them under 24 px), and the topbar icons are only 30 to 36 px wide. Disclosure `summary` rows are the most widespread (301 controls on 62 routes); Identify's star buttons are the largest single selector (385 controls).
- **Contrast fails on 27 routes in light and 6 in dark**, almost all from a handful of selectors: the default placeholder colour, the weather heat cells and the etiquette badges. The one severe case is dark only: today's selected calendar day is 1.21:1.
- **One overlay.** The MapLibre credits plate is open as loaded and covers 16.6% of the journey map and its first pin, and two pins on Places.

## Routes by severity

Sorted by the larger of the light and dark scores. The score is a triage aid, not a measurement: horizontal overflow 100 + px, a console exception 50, a failed request 10, a control covered by an overlay or a map credits panel that covers a pin or 5% or more of the map 40, a contrast failure 10, a `route-sweep.js` flag 20, a control under 24 px in either axis 2, any other control under 44 px 1.

| Route | Title | Overflow px (L / D) | Controls under 44 (L / D) | of which under 24 | Contrast fails (L / D) | Covered (L / D) | Errors code + network (L / D) | Score L / D |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#nature` | Identify nature | 0 / 0 | 258 / 258 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 268 / 258 |
| `#phrasebook` | Phrasebook | 0 / 0 | 214 / 214 | 0 / 0 | 3 / 0 | 0 / 0 | 0+0 / 0+0 | 244 / 214 |
| `#transport-th` | Getting around | 0 / 0 | 105 / 105 | 95 / 95 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 200 / 200 |
| `#places` | Places for you | 0 / 0 | 89 / 89 | 36 / 36 | 2 / 0 | 1 / 1 | 0+0 / 0+0 | 185 / 165 |
| `#weather-th` | Weather | 0 / 0 | 72 / 72 | 53 / 53 | 6 / 4 | 0 / 0 | 0+0 / 0+0 | 185 / 165 |
| `#map` | Full offline map | 0 / 0 | 19 / 19 | 1 / 1 | 1 / 0 | 0 / 0 | 1+0 / 0+0 | 120 / 60 |
| `#plans` | Trip plans | 0 / 0 | 93 / 93 | 8 / 8 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 101 / 101 |
| `#produce` | Market produce | 0 / 0 | 66 / 66 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 76 / 66 |
| `#danger` | Dangerous | 0 / 0 | 68 / 68 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 68 / 68 |
| `#streetfood` | Street food | 0 / 0 | 53 / 53 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 53 / 53 |
| `#food-th` | Identify food | 0 / 0 | 41 / 41 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 51 / 41 |
| `#home` | Bangkok · Mon, Oct 19 | 0 / 0 | 8 / 8 | 0 / 0 | 3 / 3 | 0 / 0 | 0+0 / 0+0 | 38 / 38 |
| `#etiquette-th` | 🇹🇭 Culture & etiquette | 0 / 0 | 7 / 7 | 0 / 0 | 3 / 3 | 0 / 0 | 0+0 / 0+0 | 37 / 37 |
| `#expenses` | Budget | 0 / 0 | 15 / 15 | 1 / 1 | 2 / 0 | 0 / 0 | 0+0 / 0+0 | 36 / 16 |
| `#trip` | Your trip | 0 / 0 | 5 / 5 | 0 / 0 | 3 / 0 | 0 / 0 | 0+0 / 0+0 | 35 / 5 |
| `#settings` | Settings | 0 / 0 | 23 / 23 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 33 / 23 |
| `#sos` | Emergency | 0 / 0 | 23 / 23 | 0 / 0 | 1 / 1 | 0 / 0 | 0+0 / 0+0 | 33 / 33 |
| `#pantry` | 🧂 Market products | 0 / 0 | 15 / 15 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 25 / 15 |
| `#circle` | Travel circle | 0 / 0 | 4 / 4 | 0 / 0 | 2 / 0 | 0 / 0 | 0+0 / 0+0 | 24 / 4 |
| `#feedback` | Send feedback | 0 / 0 | 1 / 1 | 0 / 0 | 2 / 0 | 0 / 0 | 0+0 / 0+0 | 21 / 1 |
| `#export` | Export | 0 / 0 | 6 / 6 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 16 / 6 |
| `#market-cash` | Market | 0 / 0 | 3 / 3 | 1 / 1 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 14 / 4 |
| `#market-items` | Market | 0 / 0 | 3 / 3 | 1 / 1 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 14 / 4 |
| `#market-rides` | Market | 0 / 0 | 3 / 3 | 1 / 1 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 14 / 4 |
| `#market-rooms` | Market | 0 / 0 | 3 / 3 | 1 / 1 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 14 / 4 |
| `#calendar` | Calendar | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 1 | 0 / 0 | 0+0 / 0+0 | 2 / 12 |
| `#route` | Journey planner | 0 / 0 | 2 / 2 | 0 / 0 | 1 / 1 | 0 / 0 | 0+0 / 0+0 | 12 / 12 |
| `#donate` | Give back | 0 / 0 | 1 / 1 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 11 / 1 |
| `#saved` | Saved & collections | 0 / 0 | 1 / 1 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 11 / 1 |
| `#bargain` | Bargain helper | 0 / 0 | 0 / 0 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 10 / 0 |
| `#search` | Search | 0 / 0 | 0 / 0 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 10 / 0 |
| `#vault` | Documents | 0 / 0 | 0 / 0 | 0 / 0 | 1 / 0 | 0 / 0 | 0+0 / 0+0 | 10 / 0 |
| `#crossings` | Borders | 0 / 0 | 9 / 9 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 9 / 9 |
| `#visa-th` | Entry & visa | 0 / 0 | 9 / 9 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 9 / 9 |
| `#checklist` | Pre-trip checklist | 0 / 0 | 6 / 6 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 6 / 6 |
| `#prices-th` | Fair prices | 0 / 0 | 6 / 6 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 6 / 6 |
| `#arrival-th` | Just arrived | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#currency` | Currency | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#help` | Help & FAQ | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#me` | Your space | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#pools-th` | Thailand pools | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#scams-th` | Common scams | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#worship-th` | Places of worship | 0 / 0 | 5 / 5 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 5 / 5 |
| `#access-th` | Accessibility | 0 / 0 | 4 / 4 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 4 / 4 |
| `#contributions` | Contributions | 0 / 0 | 4 / 4 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 4 / 4 |
| `#family-th` | With kids | 0 / 0 | 4 / 4 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 4 / 4 |
| `#foryou` | Best for you | 0 / 0 | 3 / 3 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 3 / 3 |
| `#history-th` | Thailand, history | 0 / 0 | 3 / 3 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 3 / 3 |
| `#hub-plan` | Plan & travel | 0 / 0 | 3 / 3 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 3 / 3 |
| `#explore` | Explore | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#hub-identify` | Identify | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#info-th` | Thailand guide | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#market` | Market | 0 / 0 | 1 / 1 | 1 / 1 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#nextstop` | Plan your next stop | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#scrapbook` | Scrapbook | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#today-th` | Things to do | 0 / 0 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 2 / 2 |
| `#baby-th` | With a baby | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#bestof-th` | Best of | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#board-th` | Noticeboard | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#events-th` | Festivals | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#everything` | All features | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-admin` | Settings & help | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-around` | Transport | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-country` | Know this country | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-mine` | My stuff | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-money` | Money | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-people` | People | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#hub-seedo` | See & do | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#schedules-th` | Schedules | 0 / 0 | 1 / 1 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 1 / 1 |
| `#dictionary` | My dictionary | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#identified` | My identifier | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#inbox` | Shared with you | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#journal` | Journal | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#journey` | Journey | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#nearby` | Near me | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#sharejourney` | Share my journey | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |
| `#welcome` | (no topbar) | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0+0 / 0+0 | 0 / 0 |

## Findings that repeat across routes

### App shell: topbar controls (on every route that has a topbar)

Measured on every route load. The hit area is the visual box plus whatever the control's own `::before` adds, found by `elementFromPoint` probing from the centre, so it is what a thumb can actually hit. The CSS gives each icon a 44 x 44 px `::before`, but the icons sit about 31 px apart and each neighbour's box paints over the next one, so the horizontal hit area shrinks to the pitch.

| Control | Selector | Visual w x h px | Hit area w x h px | Seen on routes |
| --- | --- | --- | --- | --- |
| Language: English, tap to change | `header.topbar > button.topbar-ic.topbar-lang` | 26 x 27.2 | 31 x 44 | 76 |
| Settings | `header.topbar > button.topbar-ic` | 26 x 30 | 31 x 44 | 75 |
| Saved & collections | `header.topbar > button.topbar-ic` | 26 x 30 | 31 x 44 | 75 |
| Search everything | `header.topbar > button.topbar-ic` | 26 x 30 | 36 x 44 | 74 |

### Screen-body selectors under 44 x 44 px on five or more routes

| Selector | Example label | Visual min w x h | Hit area min w x h | Routes | Controls (light pass, summed over routes) |
| --- | --- | --- | --- | --- | --- |
| `details.screen-hint > summary` | What this is | 103.6 x 25 | 103.6 x 25 | 28 | 28 |
| `details.card.foldcard.autofold > summary.foldcard-sum` | 💱 Currency converter | 307 x 21.8 | 307 x 22 | 27 | 92 |
| `details.foldcard.autofold.autofold-run > summary.foldcard-sum` | 🐍 Snakes | 343 x 27.3 | 343 x 28 | 13 | 34 |
| `div.card.species-card.id-cardrow > button.id-star` | Save to my identifier | 28 x 32 | 28 x 33 | 5 | 385 |
| `details.filters-collapse > summary` | All 23 everyday prices · 15 m… | 149.2 x 34.5 | 149.2 x 36 | 5 | 23 |

### Screen-body controls under 44 px, by kind

Counted in the light pass (geometry does not change with theme), every control once, summed over routes. Under 24 px means either axis of the effective hit area is below 24 px, the WCAG 2.2 AA minimum.

| Kind | Controls | Under 24 px | Routes | Most common hit area w x h | Example selector |
| --- | --- | --- | --- | --- | --- |
| button | 772 | 18 | 15 | 28 x 33 | `div.fx-swap-row > button.fx-eq` |
| fold or hint summary | 301 | 74 | 62 | 283 x 21 | `details.card.budget-card.foldcard > summary.foldcard-sum` |
| chip or toggle | 81 | 0 | 5 | 41 x 45 | `div.chips > button.chip` |
| inline unit toggle | 53 | 52 | 1 | 20 x 19 | `div > span.u-tap` |
| form field, checkbox or radio | 42 | 8 | 14 | 52 x 33 | `div.fx-line > input` |
| standalone link | 28 | 28 | 1 | 84.2 x 18 | `div > a` |
| map pin | 27 | 18 | 2 | 22.4 x 22 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-coo…` |
| map control (MapLibre) | 11 | 1 | 2 | 30 x 29 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zo…` |

### Contrast failures that repeat or are widest

Rendered foreground against the effective backdrop (opacity, alpha and gradient stops composited). 4.5:1 for normal text, 3:1 for text of 24 px, or 18.66 px and bold.

| Selector | Theme | Sample text | Foreground | Backdrop | Worst ratio | Needs | Font px | Routes | Elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `div.field > input#fld-N` | light | Amount in USD | `#757575` | `#fbf7ee` | 4.31 | 4.5 | 16 | 11 | 34 |
| `div.screen > input.search` | light | Search dishes or ingredie… | `#757575` | `#fbf7ee` | 4.31 | 4.5 | 16 | 7 | 7 |
| `div.roman > span.lbl` | light | say: | `#7d8190` | `#f3ebda` | 3.26 | 4.5 | 11.2 | 2 | 2 |
| `div.wx-cal-cell > div.wx-cal-num` | light | 22 | `#1e1e1e` | `#de3535` | 3.7 | 4.5 | 11 | 2 | 4 |
| `div.wx-cal-cell > div.wx-cal-v` | light | 34 | `#1e1e1e` | `#de3535` | 3.7 | 4.5 | 10 | 2 | 2 |
| `div.wx-cal-cell > div.wx-cal-num` | dark | 22 | `#1e1e1e` | `#de3535` | 3.7 | 4.5 | 11 | 2 | 4 |
| `div.wx-cal-cell > div.wx-cal-v` | dark | 34 | `#1e1e1e` | `#de3535` | 3.7 | 4.5 | 10 | 2 | 2 |
| `div.exp-title-pick > input#fld-N` | light | Optional, e.g. lunch, ta… | `#757575` | `#fbf7ee` | 4.31 | 4.5 | 16 | 2 | 2 |
| `div.map-search-wrap > input.map-search` | light | Search any city or place,… | `#757575` | `#fbf7ee` | 4.31 | 4.5 | 16 | 2 | 2 |
| `div.field > textarea#fld-N.ta` | light | One line about you (optio… | `#757575` | `#fbf7ee` | 4.31 | 4.5 | 16 | 2 | 2 |
| `button.cal-cell.cal-today.cal-sel > span.cal-day` | dark | 19 | `#ffffff` | `#f3e8d2` | 1.21 | 4.5 | 13 | 1 | 1 |
| `div.etiq-head > span.etiq-badge` | light | ⚠️ Rude | `#ffffff` | `#c89b2a` | 2.57 | 4.5 | 11.2 | 1 | 3 |
| `div.etiq-head > span.etiq-badge` | dark | ⚠️ Rude | `#ffffff` | `#c89b2a` | 2.57 | 4.5 | 11.2 | 1 | 3 |

### Map credits panel (the known overlay case)

The MapLibre attribution plate is the one overlay in the app that covers other controls. Its state is read as loaded (the `<details>` is not forced open), then with the (i) opened. `Open as loaded` is the `details` open attribute at first paint.

| Route and state | Theme | Map px | Panel px | Open as loaded | Share of map covered | Pins under the panel |
| --- | --- | --- | --- | --- | --- | --- |
| `#places` | light | 343 x 320 | 287 x 40 | yes | 10.5% | 19. Yaowarat (Chinatown) street food, 120. Wat Traimit (the Golden Buddha) |
| `#places` | dark | 343 x 320 | 287 x 40 | yes | 10.5% | 19. Yaowarat (Chinatown) street food, 120. Wat Traimit (the Golden Buddha) |
| `#map` | light | 343 x 320 | 287 x 40 | yes | 10.5% | none |
| `#map` | dark | 343 x 320 | 287 x 40 | yes | 10.5% | none |
| `#weather-th` | light | 341 x 447 | 0 x 0 | no (plate 0 x 0) | 0% | none |
| `#weather-th` | dark | 341 x 447 | 0 x 0 | no (plate 0 x 0) | 0% | none |
| `#journey with 2 trip stops` | light | 343 x 300 | 285 x 60 | yes | 16.6% | 1. Bangkok |
| `#journey with 2 trip stops` | dark | 343 x 300 | 285 x 60 | yes | 16.6% | 1. Bangkok |

`#journey` shows no map until the traveller has a stop, so the audit seeded two trip stops (Bangkok, Chiang Mai) in a separate profile for that row. The HANDOFF note says the panel covers about a quarter of the map; measured, it covers 16.6% of the 343 x 300 px journey map (285 x 60 px plate) and sits on the pin for stop 1. On the Places and offline maps the plate is 287 x 40 px (10.5%).

## Per-route results

One table per route, both themes, sorted by severity. Topbar controls are in the shell table above and are not repeated. The light value comes first and the dark value second; `same` means the dark value equals the light one, and `ok` or `pass` means that theme had no finding for the row. Under-44 rows give the effective hit area (`::before` included) and the visual box in brackets; `xN` is the number of controls with that selector.

### `#nature`: Identify nature

_from Identify › Identify nature; 492 controls in light, 492 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > input.search` placeholder "Search by name…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-play` "Play the White-throated Kin…" | 26 x 31 hit (25.8 x 30 visual) x50 | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-star` "Save to my identifier" | 28 x 33 hit (28 x 32 visual) x207 | same |

### `#phrasebook`: Phrasebook

_from the tab bar; 595 controls in light, 595 in dark; DOM still changing after 6 s in both themes._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.ta-wrap > textarea.ta.translate-input` placeholder "e.g. Where is the bus s…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.screen > input.search` placeholder "Search Thai phrases…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.roman > span.lbl` text "say:" | 3.26:1 (#7d8190 on #f3ebda, needs 4.5, 11.2px) | pass |
| Under 44 | `details.screen-hint > summary` "Pinning phrases" | 132.5 x 26 hit (132.5 x 25 visual) | same |
| Under 44 | `details.card.translate-card.foldcard > summary.foldcard-sum` "Say it in 🇹🇭 Thai" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `div.phrase-ctrls > button.speak.pin` "Pin I have a food allergy (…" | 34 x 34 hit (34 x 34 visual) x103 | same |
| Under 44 | `div.phrase-ctrls > button.speak.hide` "Hide Hello" | 34 x 34 hit (34 x 34 visual) x102 | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🔊 Offline phrase audio" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `details.card.lg-card > summary` "📚 Learn more about Thai" | 309 x 35 hit (309 x 33.5 visual) | same |
| Under 44 | `details.lg-sec > summary` "🔊 Sounds and tones" | 309 x 41 hit (309 x 40 visual) x5 | same |
| route-sweep (info) | 1 CONTROL(S) DISABLED ON ARRIVAL, ⤓ Download selected | flagged | flagged |
| route-sweep (info) | NEVER SETTLED — numbers unreliable | flagged | flagged |

### `#transport-th`: Getting around

_from Transport › Getting around; 788 controls in light, 788 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `label.prices-in > select` "Show prices in" | 213.3 x 22 hit (213.3 x 17 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🚕 Ride-hailing apps" | 309 x 28 hit (309 x 27.3 visual) x6 | same |
| Under 44 | `details.filters-collapse > summary` "🛵 Rent a scooter or car" | 221.3 x 40 hit (221.3 x 39 visual) x4 | same |
| Under 44 | `details.route-ops > summary` "📞 Operators & booking · 4" | 283 x 21 hit (283 x 21 visual) x66 | same |
| Under 44 | `div > a` "[number]" | 84.2 x 18 hit (84.2 x 17 visual) x19 | same |
| Under 44 | `div.tiny > a` "[email]" | 147.8 x 18 hit (147.8 x 17 visual) x9 | same |

### `#places`: Places for you

_from the tab bar; 484 controls in light, 484 in dark; not hit-tested: 279 off-view, 4 off-map marker._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Credits panel | map 343 x 320 px, plate 287 x 40 px, shown as loaded: yes | 10.5% of map; covers pins 19. Yaowarat (Chinatown) street food, 120. Wat Traimit (the Golden Buddha) | same |
| Map pins | pins under another pin at the default zoom | 4 | same |
| Contrast | `div.map-search-wrap > input.map-search` placeholder "Search any city or plac…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.screen > input.search` placeholder "🔎 Search places…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "About this screen" | 143.3 x 26 hit (143.3 x 25 visual) | same |
| Under 44 | `div.chips.mk-layer-toggles > button.chip.mk-layer-toggle` "🗺️ Borders" | 96.5 x 38 hit (96.5 x 38 visual) x8 | same |
| Under 44 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-touch-drag-pan > div.mk-numpin.ma…` "9. Mandarin Oriental Bangkok" | 22.4 x 22 hit (22.4 x 22 visual) x18 | same |
| Under 44 | `div.layer-pick-list > button.btn.ghost.block` "✓ Showing everything" | 343 x 40 hit (343 x 40 visual) | same |
| Under 44 | `label.layer-pick-row > input` "🍜 Food" | 54 x 40 hit (18 x 18 visual) x8 | same |
| Under 44 | `details.filters-collapse > summary` "🎨 Colour key" | 151.6 x 40 hit (151.6 x 39 visual) x2 | same |
| Under 44 | `details.card.foldcard > summary.foldcard-sum` "🏠 My accommodation" | 309 x 27.3 hit (309 x 27.3 visual) x4 | same |
| Under 44 | `div.chips.month-strip > button.chip` "Jan" | 32 x 44 hit (30.9 x 44 visual) x11 | same |
| Under 44 | `summary.pqr-summary > button.pqr-compare` "Add Guesthouses (Old City /…" | 20 x 22 hit (18.1 x 21 visual) x18 | same |
| Under 44 | `summary.pqr-summary > button.pqr-star` "Quick save" | 24 x 24 hit (24 x 24 visual) x18 | same |
| route-sweep (info) | 1 CONTROL(S) DISABLED ON ARRIVAL: Location not available | flagged | flagged |

### `#weather-th`: Weather

_from Plan & travel › Weather; 109 controls in light, 109 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Credits panel | map 341 x 447 px, plate 0 x 0 px, shown as loaded: no | 0% of map | same |
| Contrast | `div.air-block > p.aqi-line.mod` text "🌫️ Air quality: 73 US A…" | 3.06:1 (#b08900 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.wx-cal-cell > div.wx-cal-num` text "2" | 4.02:1 (#1e1e1e on #de4736, needs 4.5, 11px) | same |
| Contrast | `div.wx-cal-cell > div.wx-cal-v` text "34" | 3.7:1 (#1e1e1e on #de3535, needs 4.5, 10px) | same |
| Contrast | `div.wx-cal-v > span.u-tap` text "°C" | 3.7:1 (#1e1e1e on #de3535, needs 4.5, 10px) | same |
| Contrast | `div.field > input#fld-N.search` placeholder "e.g. Hoi An, Siem Reap,…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "About this screen" | 143.3 x 25 hit (143.3 x 25 visual) | same |
| Under 44 | `div > span.u-tap` "°C, switch to °F" | 42 x 41 hit (41 x 40 visual) | same |
| Under 44 | `span.wx-stat-val > span.u-tap` "°C, switch to °F" | 20 x 19 hit (19 x 18 visual) x6 | same |
| Under 44 | `details.card.wx-viz.foldcard > summary.foldcard-sum` "Next 24 hours" | 309 x 28 hit (309 x 27.3 visual) | same |
| Under 44 | `details.wx-cal-fold > summary.wx-cal-h` "Upcoming forecast" | 309 x 24 hit (309 x 24 visual) | same |
| Under 44 | `div.wx-cal-v > span.u-tap` "°C, switch to °F" | 14 x 13 hit (12.5 x 12 visual) x16 | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "10-day forecast" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `span.muted.grow > span.u-tap` "mm, switch to imperial" | 24.1 x 18 hit (24.1 x 17 visual) x10 | same |
| Under 44 | `span > span.u-tap` "°C, switch to °F" | 20 x 19 hit (19 x 18 visual) x20 | same |
| Under 44 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-cooperative-gestures > button.wx-…` "Map marker" | 115.5 x 25 hit (115.5 x 24 visual) | same |
| Under 44 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-cooperative-gestures > button.wx-…` "Map marker" | 106.4 x 25 hit (106.4 x 24 visual) x6 | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group.mk-style-toggle > button` "Map view" | 29 x 30 hit (29 x 29 visual) x2 | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-in` "Zoom in" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-out` "Zoom out" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-compass` "Reset bearing to north" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-geolocate` "Find my location" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-scale > span.u-tap` "km, switch to imperial" | 15 x 12 hit (13.7 x 12 visual) | same |
| Under 44 | `details.maplibregl-ctrl.maplibregl-ctrl-attrib.maplibregl-compact > summary.maplibregl-ctrl-attrib-…` "Toggle attribution" | 24 x 24 hit (24 x 24 visual) | same |
| route-sweep (artefact) | 170 ZERO-SIZE CONTROL(S), °C, switch to °F, °C, switch to °F, mm, switch to im…: `content-visibility` skips the cards until scrolled; the same controls measure 12 to 20 px here | flagged | flagged |

### `#map`: Full offline map

_from Transport › Full offline map; 42 controls in light, 42 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Console | exception: TypeError: Cannot read properties of undefined (reading 'getSource') at t.Map.getSource (http://127.0.0.1:8761/lib/maplibre-gl.js:46:408561) (exception seen in 1 of 3 loads (light); 0 of 3 in dark) | yes | no |
| Credits panel | map 343 x 320 px, plate 287 x 40 px, shown as loaded: yes | 10.5% of map | same |
| Contrast | `div.map-search-wrap > input.map-search` placeholder "Search any city or plac…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div.chips.mk-layer-toggles > button.chip.mk-layer-toggle` "🗺️ Borders" | 90.6 x 38 hit (90.6 x 38 visual) x9 | same |
| Under 44 | `details.card.foldcard > summary.foldcard-sum` "🛠 Map & tools" | 309 x 27.3 hit (309 x 27.3 visual) x3 | same |
| Under 44 | `label.prices-in > select` "Show prices in" | 179.3 x 22 hit (179.3 x 17 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-in` "Zoom in" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-out` "Zoom out" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-compass` "Reset bearing to north" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-geolocate` "Find my location" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `details.maplibregl-ctrl.maplibregl-ctrl-attrib.maplibregl-compact > summary.maplibregl-ctrl-attrib-…` "Toggle attribution" | 24 x 24 hit (24 x 24 visual) | same |

### `#plans`: Trip plans

_from Plan & travel › Trip plans; 135 controls in light, 135 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Northern culture loop" | 309 x 22 hit (309 x 21.8 visual) x8 | same |
| Under 44 | `div.plan-nights > button.btn.ghost.plan-step` "One night fewer in Bangkok" | 36 x 36 hit (36 x 36 visual) x56 | same |
| Under 44 | `div.plan-stop > button.btn.ghost.plan-drop` "Drop Bangkok from this plan" | 36 x 36 hit (36 x 36 visual) x28 | same |

### `#produce`: Market produce

_from Identify › Market produce; 151 controls in light, 151 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > input.search` placeholder "Search produce…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-star` "Save to my identifier" | 28 x 33 hit (28 x 32 visual) x65 | same |

### `#danger`: Dangerous

_from Identify › Dangerous; 143 controls in light, 143 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "🐍 Snakes" | 343 x 28 hit (343 x 27.3 visual) x5 | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-star` "Save to my identifier" | 28 x 33 hit (28 x 32 visual) x59 | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-play` "Play the Long-tailed Macaqu…" | 26 x 31 hit (25.8 x 30 visual) x2 | same |
| Under 44 | `details.card.mosquito-card.foldcard > summary.foldcard-sum` "🦟 Mosquitoes & dengue" | 309 x 27.3 hit (309 x 27.3 visual) | same |

### `#streetfood`: Street food

_from See & do › Street food; 338 controls in light, 338 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Rate the classics" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |
| Under 44 | `div.chips > button.chip` "Rate 1 star" | 41 x 45 hit (40.5 x 44 visual) x50 | same |

### `#food-th`: Identify food

_from Identify › Identify food; 123 controls in light, 123 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > input.search` placeholder "Search dishes or ingred…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-star` "Save to my identifier" | 28 x 33 hit (28 x 32 visual) x40 | same |

### `#home`: Bangkok · Mon, Oct 19

_from the tab bar; 47 controls in light, 47 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.wx-cal-cell > div.wx-cal-num` text "2" | 4.02:1 (#1e1e1e on #de4736, needs 4.5, 11px) | same |
| Contrast | `div.wx-cal-cell > div.wx-cal-v` text "34°C" | 3.7:1 (#1e1e1e on #de3535, needs 4.5, 10px) | same |
| Under 44 | `div.pack-line-act > button.btn.tiny-btn` "Download" | 93.6 x 35 hit (93.6 x 34 visual) | same |
| Under 44 | `div.pack-line-act > button.btn.ghost.tiny-btn` "Wait for Wi-Fi" | 122 x 35 hit (122 x 34 visual) | same |
| Under 44 | `details.home-group-d.quick-access > summary.home-group` "⚡ Quick access" | 343 x 37.6 hit (343 x 37.6 visual) | same |
| Under 44 | `details.home-group-d > summary.home-group` "🗓 Your trip" | 343 x 37.6 hit (343 x 37.6 visual) x4 | same |
| Under 44 | `details.wx-cal-fold > summary.wx-cal-h` "Upcoming forecast" | 309 x 25 hit (309 x 24 visual) | same |

### `#etiquette-th`, 🇹🇭 Culture & etiquette

_from Know this country › Culture & etiquette; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.etiq-head > span.etiq-badge` text "🚫 Never" | 3.43:1 (#ffffff on #e0663a, needs 4.5, 11.2px) | same |
| Under 44 | `details.screen-hint > summary` "About this screen" | 143.3 x 26 hit (143.3 x 25 visual) | same |
| Under 44 | `details.foldcard.etiq-fold > summary.foldcard-sum` "⚠️ Rude · 3" | 343 x 28 hit (343 x 27.3 visual) x5 | same |
| Under 44 | `details.foldcard.etiq-region > summary.foldcard-sum` "🌏 True in all four countrie…" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#expenses`: Budget

_from Money › Budget; 48 controls in light, 48 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Amount in USD" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x5 | pass |
| Contrast | `div.exp-title-pick > input#fld-N` placeholder "Optional, e.g. lunch, …" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.card.budget-card.foldcard > summary.foldcard-sum` "💰 Budget" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `div.row-between > select` "Currency" | 74 x 18 hit (74 x 17 visual) | same |
| Under 44 | `details.budget-set > summary` "＋ Set your budget & trip da…" | 309 x 37 hit (309 x 37 visual) x3 | same |
| Under 44 | `label.exp-monthly-toggle > input` "on" | 48 x 24 hit (13 x 13 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "💱 Currency converter" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `div.fx-line > input` "Amount" | 217 x 37 hit (217 x 36 visual) | same |
| Under 44 | `div.fx-line > select` "Currency" | 84 x 37 hit (84 x 36 visual) x2 | same |
| Under 44 | `div.fx-swap-row > button.fx-eq` "Swap currencies" | 34 x 35 hit (34 x 34 visual) | same |
| Under 44 | `div.fx-line > input.fx-out` "Converted amount" | 217 x 37 hit (217 x 36 visual) | same |
| Under 44 | `details.card.exp-add-card.foldcard > summary.foldcard-sum` "Log an expense" | 309 x 28 hit (309 x 27.3 visual) | same |
| Under 44 | `details.card.budget-card.withdrawals-card > summary.foldcard-sum` "🏧 Cash withdrawals" | 309 x 29 hit (309 x 27.3 visual) | same |

### `#trip`: Your trip

_from Plan & travel › My trip; 30 controls in light, 30 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input` placeholder "Place or city" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.field > input#fld-N` placeholder "Amount" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.exp-title-pick > input#fld-N` placeholder "Optional, e.g. lunch, …" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Itinerary" | 309 x 27.3 hit (309 x 27.3 visual) x3 | same |
| Under 44 | `details.card.exp-add-card.foldcard > summary.foldcard-sum` "Log an expense" | 309 x 28 hit (309 x 27.3 visual) | same |
| Under 44 | `label.exp-monthly-toggle > input` "on" | 48 x 25 hit (13 x 13 visual) | same |

### `#settings`: Settings

_from Settings & help › Settings; 111 controls in light, 111 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "[email]" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x3 | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "📲 Install the app" | 309 x 27.3 hit (309 x 27.3 visual) x13 | same |
| Under 44 | `label.qc-choice > input` "Calendar" | 52 x 33 hit (13 x 13 visual) x10 | same |
| route-sweep (info) | 1 CONTROL(S) DISABLED ON ARRIVAL, ⤓ Download selected | flagged | flagged |

### `#sos`: Emergency

_from the topbar emergency control; 121 controls in light, 121 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.roman > span.lbl` text "say:" | 3.45:1 (#7f8596 on #fbf7ee, needs 4.5, 11.2px) | 4.3:1 (#898889 on #1c2541, needs 4.5, 11.2px) |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Get to a hospital" | 309 x 27.3 hit (309 x 27.3 visual) x7 | same |
| Under 44 | `details.card.sos-card.foldcard > summary.foldcard-sum` "📖 Survival guide" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `details.filters-collapse > summary` "🐍 Snake bite" | 149.2 x 39 hit (149.2 x 39 visual) x15 | same |

### `#pantry`, 🧂 Market products

_from Identify › Market products; 49 controls in light, 49 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > input.search` placeholder "Search produce…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div.card.species-card.id-cardrow > button.id-star` "Save to my identifier" | 28 x 33 hit (28 x 32 visual) x14 | same |

### `#circle`: Travel circle

_from People › Travel circle; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div > input` placeholder "Display name (e.g. Sam)" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Contrast | `div.field > textarea#fld-N.ta` placeholder "One line about you (opt…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Traveller board" | 309 x 27.3 hit (309 x 27.3 visual) x4 | same |

### `#feedback`: Send feedback

_from Settings & help › Send feedback; 21 controls in light, 21 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Short summary" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x2 | pass |
| Contrast | `div.field > textarea#fld-N.ta` placeholder "Your message…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#export`: Export

_from Settings & help › Export; 31 controls in light, 31 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > p.lbl` text "Or export one type at a…" | 3.26:1 (#7d8190 on #f3ebda, needs 4.5, 11.2px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "📖 My travel book" | 307 x 27.3 hit (307 x 27.3 visual) x5 | same |

### `#market-cash`: Market

_from Market; 29 controls in light, 29 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Amount" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x3 | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "💱 Post: Cash swap" | 309 x 28 hit (309 x 27.3 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > input` "Paste a board link a travel…" | 309 x 22 hit (309 x 21 visual) | 309 x 20 hit (309 x 19 visual) |

### `#market-items`: Market

_from Market; 33 controls in light, 33 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "What is it" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x4 | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🎒 Post: Gear & bikes" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > input` "Paste a board link a travel…" | 309 x 22 hit (309 x 21 visual) | 309 x 20 hit (309 x 19 visual) |

### `#market-rides`: Market

_from Market; 32 controls in light, 32 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "To (e.g. Chiang Mai)" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x6 | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🚗 Post: Ride share" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > input` "Paste a board link a travel…" | 309 x 22 hit (309 x 21 visual) | 309 x 20 hit (309 x 19 visual) |

### `#market-rooms`: Market

_from Market; 31 controls in light, 31 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Short title (e.g. Spare…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x5 | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🏠 Post: Stay share" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > input` "Paste a board link a travel…" | 309 x 22 hit (309 x 21 visual) | 309 x 20 hit (309 x 19 visual) |

### `#calendar`: Calendar

_from Plan & travel › Travel calendar; 58 controls in light, 58 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `button.cal-cell.cal-today.cal-sel > span.cal-day` text "19" | pass | 1.21:1 (#ffffff on #f3e8d2, needs 4.5, 13px) |
| Under 44 | `div.cal-head > button.chip` "Previous month" | 33 x 44 hit (32.3 x 44 visual) x2 | same |

### `#route`: Journey planner

_from Transport › Journey planner; 17 controls in light, 17 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `label.plan-field > span.lbl` text "From" | 3.45:1 (#7f8596 on #fbf7ee, needs 4.5, 11.2px) x2 | 4.3:1 (#898889 on #1c2541, needs 4.5, 11.2px) x2 |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `div > button.btn.ghost.swap-btn` "Swap start and destination" | 99.6 x 41 hit (99.6 x 40 visual) | same |

### `#donate`: Give back

_from People › Give back; 29 controls in light, 29 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Cash withdrawn in USD" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#saved`: Saved & collections

_from My stuff › Saved places; 34 controls in light, 34 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `details.card.foldcard.autofold > input.search` placeholder "Name your theme…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "New collection" | 309 x 27.3 hit (309 x 27.3 visual) | same |

### `#bargain`: Bargain helper

_from Money › Bargain helper; 17 controls in light, 17 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Asking price" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |

### `#search`: Search

_from Settings & help › Search everything; 30 controls in light, 30 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.screen > input.search` placeholder "Find places, phrases, w…" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) | pass |

### `#vault`: Documents

_from My stuff › Documents; 18 controls in light, 18 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Contrast | `div.field > input#fld-N` placeholder "Choose a passcode (min …" | 4.31:1 (#757575 on #fbf7ee, needs 4.5, 16px) x3 | pass |

### `#crossings`: Borders

_from Transport › Border crossings; 52 controls in light, 52 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Thailand ↔ Laos" | 343 x 28 hit (343 x 27.3 visual) x8 | same |

### `#visa-th`: Entry & visa

_from Know this country › Entry & visa; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "✅ Visa-freeFree (extension …" | 309 x 24 hit (309 x 22.8 visual) x9 | same |

### `#checklist`: Pre-trip checklist

_from Plan & travel › Pre-trip checklist; 55 controls in light, 55 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "🛂 Documents" | 343 x 28 hit (343 x 27.3 visual) x6 | same |

### `#prices-th`: Fair prices

_from Money › Fair prices; 25 controls in light, 25 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `div.fx-line > input` "Amount" | 217 x 36 hit (217 x 36 visual) | same |
| Under 44 | `div.fx-line > select` "Currency" | 84 x 36 hit (84 x 36 visual) x2 | same |
| Under 44 | `div.fx-swap-row > button.fx-eq` "Swap currencies" | 34 x 34 hit (34 x 34 visual) | same |
| Under 44 | `div.fx-line > input.fx-out` "Converted amount" | 217 x 36 hit (217 x 36 visual) | same |
| Under 44 | `details.filters-collapse > summary` "All 23 everyday prices · 15…" | 275.9 x 40 hit (275.9 x 39 visual) | same |

### `#arrival-th`: Just arrived

_from Know this country › Just arrived; 35 controls in light, 35 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "💵 Cash without the fees" | 309 x 27.3 hit (309 x 27.3 visual) x4 | same |

### `#currency`: Currency

_from Money › Currency converter; 20 controls in light, 20 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `div.fx-line > input` "Amount" | 217 x 36 hit (217 x 36 visual) | same |
| Under 44 | `div.fx-line > select` "Currency" | 84 x 36 hit (84 x 36 visual) x2 | same |
| Under 44 | `div.fx-swap-row > button.fx-eq` "Swap currencies" | 34 x 34 hit (34 x 34 visual) | same |
| Under 44 | `div.fx-line > input.fx-out` "Converted amount" | 217 x 36 hit (217 x 36 visual) | same |

### `#help`: Help & FAQ

_from Settings & help › Help & FAQ; 23 controls in light, 23 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card > summary` "How do I build and log a tr…" | 309 x 24 hit (309 x 24 visual) x4 | same |

### `#me`: Your space

_from the tab bar, the You hub, Settings lives inside it; 37 controls in light, 37 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.name-entry-card.foldcard > summary.foldcard-sum` "👋 What should we call you?" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `details.card.name-entry-card.foldcard > input` "Your name" | 222 x 28 hit (222 x 28 visual) | 220 x 26 hit (220 x 26 visual) |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "⚡ Quick access" | 309 x 28 hit (309 x 27.3 visual) | same |
| Under 44 | `details.home-group-d > summary` "📔 My stuff" | 343 x 38 hit (343 x 37.6 visual) | same |
| Under 44 | `details.home-group-d > summary.home-group` "🗂️ Everything else" | 343 x 37.6 hit (343 x 37.6 visual) | same |

### `#pools-th`: Thailand pools

_from See & do › Pools; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Bangkok" | 343 x 28 hit (343 x 27.3 visual) x4 | same |

### `#scams-th`: Common scams

_from Know this country › Common scams; 30 controls in light, 30 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 26 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.scam-card.foldcard > summary.foldcard-sum` "“Meter broken” taxi" | 306 x 28 hit (306 x 27.3 visual) x2 | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "🛂 Visa & border scams" | 309 x 28 hit (309 x 27.3 visual) x2 | same |

### `#worship-th`: Places of worship

_from See & do › Places of worship; 38 controls in light, 38 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 26 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Find a place of worship nea…" | 309 x 28 hit (309 x 27.3 visual) x4 | same |

### `#access-th`: Accessibility

_from Know this country › Accessibility; 18 controls in light, 18 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "♿ Wheelchair / limited mobi…" | 309 x 27.3 hit (309 x 27.3 visual) x4 | same |

### `#contributions`: Contributions

_from My stuff › Your contributions; 22 controls in light, 22 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.contrib-hero.foldcard > summary.foldcard-sum` "Newcomer" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 26 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Ways to earn more" | 309 x 28 hit (309 x 27.3 visual) x2 | same |

### `#family-th`: With kids

_from Know this country › Travelling with kids; 42 controls in light, 42 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.filters-collapse.fam-section > summary` "🎡 What to do with the kids …" | 152.8 x 40 hit (152.8 x 39 visual) x4 | same |

### `#foryou`: Best for you

_from Plan & travel › For you; 27 controls in light, 27 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |
| Under 44 | `details.card.fy-controls > summary` "⚙ Nothing set yet, tap to …" | 309 x 25 hit (309 x 24 visual) | same |
| Under 44 | `div.chips > button.chip` "$" | 36 x 45 hit (35.3 x 44 visual) | same |

### `#history-th`: Thailand, history

_from Know this country › History & culture; 18 controls in light, 18 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.history-card.foldcard > summary.foldcard-sum` "The short history" | 306 x 27.3 hit (306 x 27.3 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Known for" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |

### `#hub-plan`: Plan & travel

_from hub › Plan & travel; 32 controls in light, 32 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Your trip" | 343 x 28 hit (343 x 27.3 visual) x3 | same |

### `#explore`: Explore

_from the tab bar; 24 controls in light, 24 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `div.svg-zoom-ctrl > button.svg-zoom-btn` "Zoom in" | 34 x 34 hit (34 x 34 visual) x2 | same |

### `#hub-identify`: Identify

_from hub › Identify; 21 controls in light, 21 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard > summary.foldcard-sum` "Food & market" | 343 x 28 hit (343 x 27.3 visual) x2 | same |

### `#info-th`: Thailand guide

_from Know this country › Country guide; 34 controls in light, 34 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Emergency numbers" | 309 x 27.3 hit (309 x 27.3 visual) x2 | same |

### `#market`: Market

_from Market; 20 controls in light, 20 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `div.card > input` "Paste a board link a travel…" | 309 x 22 hit (309 x 21 visual) | 309 x 20 hit (309 x 19 visual) |

### `#nextstop`: Plan your next stop

_from Plan & travel › Plan your next stop; 21 controls in light, 21 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "🚌 Where next, from Bangkok" | 343 x 28 hit (343 x 27.3 visual) | same |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#scrapbook`: Scrapbook

_from My stuff › Trip scrapbook; 18 controls in light, 18 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.empty-state.foldcard > summary.foldcard-sum` "Your scrapbook builds itself" | 309 x 27.3 hit (309 x 27.3 visual) | same |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "📸 Photo album" | 309 x 28 hit (309 x 27.3 visual) | same |

### `#today-th`: Things to do

_from See & do › Things to do; 57 controls in light, 57 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.todo-plan-d > summary` "🗓 Plan for a different time…" | 343 x 30 hit (343 x 29 visual) | same |
| Under 44 | `div > button.linklike` "🎉 1 festival during your tr…" | 220.6 x 24 hit (220.6 x 24 visual) | same |

### `#baby-th`: With a baby

_from Know this country › Travelling with a baby; 15 controls in light, 15 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.foldcard.autofold > summary.foldcard-sum` "Handy to know" | 309 x 28 hit (309 x 27.3 visual) | same |

### `#bestof-th`: Best of

_from See & do › Best of; 20 controls in light, 20 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.card.bestof-card.foldcard > summary.foldcard-sum` "👨‍👩‍👧 Best for families4" | 309 x 31 hit (309 x 29.8 visual) | same |

### `#board-th`: Noticeboard

_from People › Local noticeboard; 34 controls in light, 34 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#events-th`: Festivals

_from Plan & travel › Festivals; 37 controls in light, 37 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#everything`: All features

_from the all-features index; 79 controls in light, 79 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.filters-collapse > summary` "🔤 Every feature, A–Z · 55" | 327.6 x 36 hit (327.6 x 34.5 visual) | same |

### `#hub-admin`: Settings & help

_from hub › Settings & help; 27 controls in light, 27 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-around`: Transport

_from hub › Transport; 27 controls in light, 27 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-country`: Know this country

_from hub › Know this country; 31 controls in light, 31 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-mine`: My stuff

_from hub › My stuff; 30 controls in light, 30 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-money`: Money

_from hub › Money; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-people`: People

_from hub › People; 26 controls in light, 26 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#hub-seedo`: See & do

_from hub › See & do; 28 controls in light, 28 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.foldcard.autofold.autofold-run > summary.foldcard-sum` "Other sections" | 343 x 28 hit (343 x 27.3 visual) | same |

### `#schedules-th`: Schedules

_from Transport › Transport schedules; 21 controls in light, 21 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Under 44 | `details.screen-hint > summary` "What this is" | 103.6 x 25 hit (103.6 x 25 visual) | same |

### `#dictionary`: My dictionary

_from My stuff › Your dictionary; 14 controls in light, 14 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| none | no finding in either theme | clean | clean |

### `#identified`: My identifier

_from Identify › My identifier; 17 controls in light, 17 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| none | no finding in either theme | clean | clean |

### `#inbox`: Shared with you

_from People › Shared with you; 13 controls in light, 13 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| route-sweep (info) | very short, is the empty state saying enough? | flagged | flagged |

### `#journal`: Journal

_from My stuff › Journal; 15 controls in light, 15 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| route-sweep (info) | very short, is the empty state saying enough? | flagged | flagged |

### `#journey`: Journey

_from My stuff › Your journey; 14 controls in light, 14 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| none | no finding in either theme | clean | clean |

### `#nearby`: Near me

_from See & do › Near me; 16 controls in light, 16 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| route-sweep (info) | very short, is the empty state saying enough? | flagged | flagged |

### `#sharejourney`: Share my journey

_from My stuff › Share my journey; 15 controls in light, 15 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| none | no finding in either theme | clean | clean |

### `#welcome`: (no topbar)

_from onboarding, reachable directly and easy to break unnoticed; 6 controls in light, 6 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| route-sweep (info) | NO TOPBAR, title checks skipped | flagged | flagged |

### `#journey` with two trip stops (map rendered)

_from a separate profile with trip stops Bangkok and Chiang Mai; 38 controls in light, 38 in dark._

| Type | Detail | Measured light | Measured dark |
| --- | --- | --- | --- |
| Covered | `div.maplibregl-canvas-container.maplibregl-interactive.mapl…` "1. Bangkok" under `details.maplibregl-ctrl.maplibregl-ctrl-attrib.maplibregl-compact > d…` (absolute) | 9 of 9 points | 9 of 9 points |
| Credits panel | map 343 x 300 px, plate 285 x 60 px, shown as loaded: yes | 16.6% of map; covers pins 1. Bangkok | same |
| Contrast | `div.jr-map-toggles > button.status-chip.jr-tog` text "━ Route" | pass | 1.21:1 (#ffffff on #f3e8d2, needs 4.5, 14px) x3 |
| Contrast | `button.jr-row > span.jr-row-n` text "1" | pass | 1.21:1 (#ffffff on #f3e8d2, needs 4.5, 14px) x2 |
| Under 44 | `details.home-group-d > summary.home-group` "🗺 Your map" | 343 x 37.6 hit (343 x 37.6 visual) | same |
| Under 44 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-touch-drag-pan > div.mk-leg-glyph…` "Train to Chiang Mai, tap t…" | 22 x 23 hit (22 x 22 visual) | same |
| Under 44 | `div.maplibregl-canvas-container.maplibregl-interactive.maplibregl-touch-drag-pan > div.mk-numpin-lb…` "1. Bangkok" | 22 x 22 hit (22 x 22 visual) x2 | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group.mk-style-toggle > button` "Map view" | 29 x 30 hit (29 x 29 visual) x2 | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-in` "Zoom in" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-zoom-out` "Zoom out" | 30 x 29 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-compass` "Reset bearing to north" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `div.maplibregl-ctrl.maplibregl-ctrl-group > button.maplibregl-ctrl-geolocate` "Find my location" | 30 x 30 hit (29 x 29 visual) | same |
| Under 44 | `details.maplibregl-ctrl.maplibregl-ctrl-attrib.maplibregl-compact > summary.maplibregl-ctrl-attrib-…` "Toggle attribution" | 24 x 24 hit (24 x 24 visual) | same |
| Under 44 | `div.jr-map-toggles > button.status-chip.jr-tog` "━ Route" | 83.8 x 36 hit (83.8 x 36 visual) x3 | same |
| Under 44 | `details.card.foldcard > summary.foldcard-sum` "🧭 Your stops, in order" | 309 x 29 hit (309 x 27.3 visual) | same |

## Legacy Market routes

`js/market-routes.js` rewrites old board hashes. Each was loaded cold and the final hash and the pressed chips were read.

| Legacy hash | Lands on | Topbar | Chips pressed |
| --- | --- | --- | --- |
| `#swap` | `#market-cash` | Market | 💱 Cash |
| `#exchange` | `#market` | Market | 📋 All |
| `#exchange-ride` | `#market-rides` | Market | 🚗 Rides |
| `#exchange-house` | `#market-rooms` | Market | 🏠 Rooms |
| `#exchange-kids` | `#market-items` | Market | 🎒 Items, 🎒 Gear & bikes |
| `#exchange-swap` | `#market-cash` | Market | 💱 Cash |
| `#market-gear` | `#market-items` | Market | 🎒 Items, 🎒 Gear & bikes |

`#market-items` (and so `#exchange-kids` and `#market-gear`) shows two chips with `aria-pressed=true`: `Items` and its sub-chip `Gear & bikes`. This is the carried "two chips show as pressed" item from the HANDOFF, now measured.

## Method and limits

1. **Each route is a cold deep link.** `/?q=<n>#route` in a fresh tab of the same profile, then `#app` must hold more than 80 characters and the DOM must go quiet (a `MutationObserver` on `#app`, 40 consecutive empty ticks and a 700 ms floor, 6 s cap) before anything is read.
2. **Everything the page holds is laid out first.** `content-visibility: auto` leaves off-screen cards without boxes, so each page is scrolled top to bottom in 500 to 600 px steps before and after every `<details>` is opened (the same `openEveryFold` idea as `route-sweep.js`; MapLibre's own attribution `<details>` is left alone and measured separately). The page grows while it is scrolled: `#transport-th` is 6,032 px tall as loaded, 16,690 px with every fold open and 100,186 px after the scroll, and its text grows from 6,421 to 115,691 characters.
3. **Overflow.** `html` and `body` both set `overflow-x: hidden`, so `scrollWidth - clientWidth` is always 0 and cannot show an overflow. The audit instead scans every box at every scroll step for an edge past x = 0 or x = 375 whose ancestors do not scroll, clip or fix it. A planted 520 px box was reported as 145 px past the edge. Text clipped inside an `overflow: hidden` card (an ellipsis, a line clamp) is by design and is not counted.
4. **Controls** are `a[href]`, `button`, `input`, `select`, `textarea`, `summary`, ARIA widget roles and anything with `tabindex >= 0`. A control narrower or shorter than 43.5 px is reported with its effective hit area: the control is scrolled to the middle of the viewport and `elementFromPoint` is walked outward from its centre, so a `::before` hit box counts and a neighbour's box that sits on top subtracts. Inline links inside a sentence are not counted (WCAG 2.5.8 exempts them). A `div` made clickable only by a script listener, with no role and no tabindex, cannot be found and is not covered.
5. **Covered controls.** After the same scroll, a 3 x 3 grid of points inside each control is hit-tested; a control is covered when any point returns an element that is not the control, its descendant or its label. A link that wraps lines is tested on its largest line box. Map pins under another pin or outside the visible map, and the map canvas under its own markers, are by design and are listed separately or skipped.
6. **Contrast** is computed from rendered colours for every element with its own text: foreground alpha and every ancestor's opacity composited over the stack of backgrounds that overlap the text box (`background-size`, position and repeat respected). A gradient is graded against its worst stop. Text over a `url()` image would be unmeasured; none was found. Large text (24 px, or 18.66 px and bold) needs 3:1, everything else 4.5:1. Disabled controls are skipped. Placeholders are graded from `::placeholder`. Two findings were confirmed by eye in screenshots (the dark calendar's selected day, and the journey credits panel).
7. **Console errors** are `Runtime.exceptionThrown`, `console.error` and browser error logs (`Log.entryAdded`) from navigation to the end of the route-sweep pass. `scripts/route-sweep.js` is then imported and run for the route by hash navigation from another route. Its flags are listed per route; `very short`, `NEVER SETTLED`, `NO TOPBAR` and `DISABLED ON ARRIVAL` are informational (an empty state, a busy page, onboarding, and a button that waits for a selection).

What this audit does **not** cover:

- **Empty states only.** The profile is fresh, so Journal, Saved, Dictionary, Trip, Budget and Scrapbook show their empty states. Populated lists, long names and filled forms are untested. The one seeded exception is the journey map.
- **Thailand only for `{cc}` routes.** Prices, food, scams, visa and the rest were loaded for `th`. `vi`, `kh` and `la` have different data and may overflow differently.
- **Detail screens** (one place, one dish, one species, a thread, a collection), sheets, dialogs and anything behind a tap are not loaded.
- **Network.** The machine had internet, so map tiles, weather and rates were fetched. A cold offline start was not tested here (`scripts/check-offline-boot.py` covers that).
- **A hidden page undercounts.** The first pass ran while macOS display sleep had flipped the headless pages to `document.hidden` (51 routes per theme). Re-measured visible, 33 of those 51 routes changed: `#settings` went from 11 controls to 111 and `#streetfood` from 20 to 338. Only visible measurements are in this document.
- **A transient hit is not a finding.** `#everything` reported one control touched by a door tile in the first pass in both themes; two re-measures and a direct probe found no overlap, so it is not reported.
- **`route-sweep.js` has no Market tab.** Its `EXTRA` list holds five tab routes and omits `#market`; the audit added `#market` and its four chips itself.
- **Tool caveat.** `scripts/route-sweep.js` reports 170 zero-size controls on `#weather-th`. They are `.u-tap` unit toggles inside `content-visibility` cards: 170 of 224 measure 0 x 0 before the page is scrolled and 12 to 20 px after. The flag is an artefact of `content-visibility`, not a defect, and its own comment 4 describes the same trap for `innerText`.
- **`#map` exception is intermittent.** In the first light pass leaving `#map` raised `TypeError: Cannot read properties of undefined (reading 'getSource')` eight times (`js/map.js:1450`, inside `setWeather`: the `.then` runs after the map is removed). Two more light loads and three dark loads did not raise it.

## Proposed fix slices

Each slice is one change on its own branch. None is started. Slices that change a shipped file bump the version.

1. **Q2: commit the audit driver.** Add the driver, the in-page measurement script and the report generator under `tools/audit-375/` (tools only, no version bump), so every later slice can print its own before and after. It was left out of this change to keep the pull request documents-only. Done when one command reproduces the headline table of this document in both themes on a clean worktree, and `docs/AUDIT_375.md` says how to run it.
2. **Q3: disclosure targets.** Give every `summary` a 44 px minimum height and keep the hit area full width. Measured now: 301 summary controls under 44 px on 62 routes, 74 of them under 24 px. By selector: `details.route-ops > summary` 283 x 21 to 22 px (66, all on `#transport-th`); `summary.foldcard-sum` 307 to 343 x 22 to 42 px (156 on 45 routes); `details.screen-hint > summary` 104 to 143 x 25 to 26 px (28 on 28 routes); `details.filters-collapse > summary` 149 to 328 x 36 to 40 px (23 on 5 routes). Done when the audit shows 0 summaries under 44 px at 375 px.
3. **Q4: topbar and form fields.** The topbar icons have a 44 px tall hit area but only 30 to 36 px wide (Language, Settings and Saved 30 px, Search 35 px; the icons sit 31 px apart and each neighbour's 44 px `::before` paints over the next). Form fields: 8 inputs and selects are 18 to 22 px high (`details.card.foldcard.autofold > input`, `div.card > input`, `label.prices-in > select`, `div.row-between > select`), 12 are 36 to 37 px high (`div.fx-line > input`, `select`); 21 native checkboxes and radios are 13 to 18 px boxes inside labels that hit 48 to 54 x 24 to 42 px. Done when no field is under 44 px high and the topbar's narrowest hit area is 44 px, or the spacing is recorded as an accepted trade-off.
4. **Q5: buttons, chips, toggles, links and map controls.** By selector: `button.id-star` 28 x 33 px (385 on 5 identify routes); `button.id-play` 26 x 31 (52); Phrasebook `button.speak.pin` and `.hide` 34 x 34 to 35 (205); Trip `button.plan-step` and `plan-drop` 36 x 36 to 37 (84); `div.chips > button.chip` 36 to 41 x 45 (51) and the month strip 32 to 40 x 44 (11); map layer toggles 90 to 198 x 38 (17); Places `pqr-compare` 20 x 22 and `pqr-star` 24 x 24 (36); standalone links on `#transport-th` 84 to 155 x 18 to 19 (28); map pins 22 to 39 x 22 to 23 on Places. MapLibre's own zoom, compass, locate and style buttons are 30 x 29. Unit toggles (`span.u-tap`, 13 to 20 px high, 54, on 1 route) sit inside a sentence, which WCAG 2.5.8 exempts: decide whether to enlarge them or record the exemption. Done when the audit lists none under 44 px, or each exception is named in `docs/` with its reason.
5. **Q6: contrast.** Light: placeholders are the browser default `#757575` on `#fbf7ee` at 4.31:1 on 22 routes (one `::placeholder` rule fixes all); the weather heat cells set `#1e1e1e` on a red `#de3535` at 3.7:1 (10 to 11 px bold; the same in dark); the air-quality line is `#b08900` at 3.06:1; the etiquette badges are white on `#c89b2a` (Rude, 2.57:1), on `#e0663a` (Never, 3.43:1) and on `#2f8f5b` (Do this, 4.04:1) in both themes; small grey `.lbl` labels are 3.26 to 3.45:1 (4.30:1 in dark, `#898889` on `#1c2541`). Dark only: today's selected calendar day is white on cream `#f3e8d2` at 1.21:1 (confirmed in a screenshot). Done when `check-contrast.py` is extended to cover these composed colours (it grades tokens, not these selectors) and the audit lists 0 contrast failures in both themes.
6. **Q7: map credits panel and the `#map` exception.** Start MapLibre's attribution collapsed (it is open as loaded and `maplibregl-compact-show` is set): the plate covers 16.6% of the 343 x 300 px journey map and sits on the pin for stop 1, and 10.5% of the Places and offline maps, where it covers the pins `19. Yaowarat (Chinatown) street food` and `120. Wat Traimit (the Golden Buddha)` once opened. Separately, guard `setWeather` in `js/map.js` (line 1450) so its `.then` does nothing after the map is removed. Done when the audit shows the plate closed as loaded and no `getSource` exception over 5 light and 5 dark loads of `#map` with a navigation away in between.
7. **Q8: widen the audit.** Add what this one did not cover: populated states (journal entries, saved places, expenses, a long display name), the other three countries for the `{cc}` routes, detail screens and open sheets. The driver must refuse any load where `document.hidden` is true: macOS display sleep flips headless pages to hidden mid-run, and a hidden page undercounts controls (this audit discarded and repeated every such load). Done when the same command prints the new tables for both themes.

Every slice that changes a shipped file bumps `APP_VERSION` and `CACHE_VERSION`, so Q3 to Q7 are stacked, not parallel. Q3 to Q6 are CSS or token edits; Q7 edits `js/map.js` and the map style. Q2 and Q8 change `tools/` only and can run beside any of them. Q2 goes first: Q3 to Q7 each need it to show their result.

