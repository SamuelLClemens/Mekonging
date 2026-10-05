# Mekonging visual direction prompt

Status: rewritten 2026-10-05 for the approved plan "a retro default theme and three modern regional
themes" (Phase 1 of 4), against `mk-v0.623.0` on `feat/scaffold-bangkok-slice`. It replaces the round-2
expert-panel prompt that PR #90 merged: the owner settled the direction in conversation instead. It is a
companion to `REDESIGN_PROMPT.md`, whose section 4 non-negotiables still apply in full. `DESIGN_SYSTEM.md`
holds the gate record.

---

## 0. How to use this prompt

- One phase per session, one pull request per phase, merged in order, one open at a time. Each PR gets
  its own worktree off `origin/feat/scaffold-bangkok-slice`.
- Phase 1 needs design judgement and runs on Opus. Phases 2 to 4 are mechanical and run on Sonnet. No
  Workflow and no sub-agent fan-out: `js/main.js` punishes both (`REDESIGN_PROMPT.md` section 4, Cost).
- Every number in this file was measured. Re-measure before citing one in a later phase.
- Ask each gate with AskUserQuestion, recommended option first, and wait. Never pass a gate on an
  assumption.

---

## 1. How we got here

- **GATE 1, round 1 (2026-10-04).** Three style-tile directions (A "Golden Hour, refined", B "River and
  Rice", C "Night Market"; tokens in `tools/style-tiles/round1.json`). The owner chose none: they were
  "not distinctly Mekong" and "lost today's spirit". Two questions were answered and stand: keep all six
  named skins, and one line-icon family for chrome with emoji only in content.
- **Round 2 (PR #90).** An eight-seat expert-panel prompt. It was never run: on 2026-10-05 the owner gave
  the direction directly, with a style reference.
- **The reference.** The "NASA Vintage Colors Emblem" poster (arthook, Redbubble): a deep navy ground,
  cream text, a sweeping 1970s stripe arc (teal, mustard, orange, rust), a thin gold frame and sparkles.
  The owner wants that retro colour and artistry on a site that looks and works like a modern one. The
  image is personal reference. It is never committed, published or embedded; only colours sampled from
  it are recorded here.

---

## 2. The brief (owner, 2026-10-05)

> Keep every existing option. Make the default, the theme new users open the app to, stunning and
> helpful for navigation. Leave the sun logo exactly as it is. Anchor the colours in the region. Keep
> the screens easy to look at for hours.

Decisions:

- **Retro default only.** The default theme is the retro one. Its stripe colours are the four countries,
  so it absorbs the "map colours" anchor. River, Four Flags and Temples & Markets are three plain,
  modern themes. All four stay selectable, and every existing option stays too.
- **Stripe bands are the only retro element.** A four-stripe band, one stripe per country, sweeps behind
  the sun on Welcome. It also appears as a thin rule under the tab-root headers, on section dividers, on
  empty states and as the tab bar's top edge. No emblem rings, no grain, no new display face: Be Vietnam
  Pro stays.
- **Follow the phone.** Cream poster paper by day and the navy night poster on dark-mode phones and at
  night. Both modes get equal care.
- **Calm base, vivid moments.** The cream and navy grounds stay quiet, the stripes are vivid, and every
  working control stays plain and modern.
- **Navigation (recommended; the Phase 1 gate confirms or overrules).** The four country colours do the
  wayfinding: the country context line, the country pages, the illustrated map and the country chips.
  The active tab is marked by the one sun orange, which is also the only primary-action colour. Red only
  means danger. A per-tab colour variant is previewed beside it, because five tab colours plus four
  country colours make nine hues.
- **Keep today's Classic.** It stays selectable as "Classic sunset", changed only by an AA fix to its
  primary button (Phase 2).

---

## 3. The themes

Every value lives in `tools/style-tiles/round2.json`, with the source of every sampled colour. The
gallery of real screens is linked from the gate record in `DESIGN_SYSTEM.md`.

### 3.1 The retro default

- **Grounds and inks.** Day: cream paper `#F3EBDA`, cards `#FBF7EE`, navy ink `#17203A` (13.6:1 on the
  page). Night: poster navy `#131A2E`, cards `#1C2541`, cream ink `#F3E8D2` (14.2:1).
- **The sun orange.** The logo's own `#E8632A` fills every primary button, with a navy label (4.79:1 by
  day, 5.14:1 at night). As a graphic on cream it reaches only 2.83:1, so the day-mode marker (the active
  tab's bar) is the same hue a step deeper, `#E05C24` (3.06:1). As text it is `#A8420E` by day and
  `#FF8A4C` at night.
- **Selected is a state, not an action.** Pressed chips and the phase switch are ink (navy by day, cream
  at night), so orange keeps meaning "tap here" and "you are here".
- **Two stripe tunings** (top to bottom: Thailand, Vietnam, Cambodia, Laos):

  | Tuning | Day | Night |
  |---|---|---|
  | Poster | rust `#92452B`, teal `#006E79`, mustard `#AC7C19`, sage `#6C8C5D` | `#D89683`, `#40A8AF`, `#F5C26F`, `#95A430` |
  | Map | brick `#994627`, plum `#904B7E`, gold `#AF7C0C`, green `#5C8F5E` | `#EBA086`, `#C77BB2`, `#FACE6C`, `#67AD32` |

  The floors (section 4) bent both. The poster's orange stripe is the sun's own colour, so sage takes the
  fourth stripe; the warm stripes of the two tunings converge on the same rust and gold, so the real
  choice is Vietnam (teal or plum) and Laos (sage or green). Section 7 has the numbers.
- **Two navigation variants.** "Country" (recommended): the sun orange marks the active tab, the header
  rule is the four stripes, and a country's own pages carry its colour under the header. "Tabs": each
  tab has its own text-safe colour for the title, the active label and the header rule.

### 3.2 The three modern themes

Plain and modern: no stripes, hairline rules, and the theme's own secondary colour on section marks.
The action colour is the sun orange in every theme, so a flag red or a temple red is never a button.

- **River.** Mekong mist by day and jungle night by night. Ground from the sky in
  `img/places/vi-ext-cai-rang.jpg`, ink and night ground from the foliage in
  `img/places/kh-siemreap-tonle-sap-floating.jpg`, secondary from the silt in
  `img/places/la-ext-don-khon.jpg`. Each country's colour comes from a river photo in that country:
  Amphawa (Thailand), Cai Rang (Vietnam), the Tonle Sap villages (Cambodia), Don Khon (Laos).
- **Four Flags.** Flag white `#F4F5F8` and, at night, neutral graphite. Each country takes its flag's
  central colour: Thailand the Thai blue `#2D2A4A` (Office of the Prime Minister, 30 September 2017,
  CIELAB under D65; Pantone 2766C on the ASEAN sheet), Vietnam the star's gold (Pantone 116), Cambodia
  the red band (Pantone 032; the Ministry of Foreign Affairs gives CMYK 0-100-100-0), Laos the blue band
  (Pantone 293). Where a floor requires it the value moves and the file says so: by day the gold deepens
  to `#A58907` and the red moves to `#CF585F`; at night the two blues lift. Danger by day is the Thai flag
  red `#A51931`, because Thailand's own colour is its blue. The flags themselves never appear as
  decoration (section 5).
- **Temples & Markets.** Ivory, lacquer and gold. Ground from Wat Chalong's cream gold, ink from the
  Temple of Literature's lacquer, secondary from Wat Pho's gold. Each country's colour comes from a
  temple or market in that country: Wat Chalong (Thailand), the Temple of Literature (Vietnam), the
  Royal Palace in Phnom Penh (Cambodia), the Luang Prabang night-market textiles (Laos).

### 3.3 What stays

- **Classic sunset**, today's default, unchanged except the Phase 2 button fix.
- **The six named skins** (Night Market, Silk Route, Tropical Pop, Cambodian Psych, Psych Night, Luxury
  Expedition) keep their fixed modes.
- **The logo** is pinned: `--sun:#F2A93B; --sun-deep:#E8632A; --magenta:#D6336C; --teal:#16A39A` on
  `.logo`, identical to `icons/icon.svg` and the `index.html` splash, in every theme.

---

## 4. Floors

`tools/style-tiles/measure.py` checks every one; it exits 1 below a floor. Floors apply to both modes of
every candidate. Classic is measured as shipped, for comparison only.

- **Text.** At least 4.5:1 on every surface it can sit on, including the page (`--bg`), and body text at
  least 7:1 on its main surface for sunlight. The screen title is checked on the page.
- **Primary label.** The label against every stop of the primary fill, at least 4.5:1.
- **Graphics.** Boundaries, icons, focus rings, the sun-orange marker and the rating star at least 3:1.
- **Country colours.** At least 3:1 as graphics against the page, the card and the illustrated map's
  sea; at least ΔE00 12 between each pair; at least ΔE00 15 from danger and from the sun orange (both its
  fill and its marker).
- **Colour vision.** The same pairwise ΔE00 through protanopia, deuteranopia and tritanopia (Machado
  2009, full severity). A warning below 12 rather than a failure, because a country's name always
  travels with its colour; every candidate reaches 12 for protanopia and deuteranopia.
- **Accent against danger.** At least ΔE00 15 (round 1 measured 9.1 for a pair that read alike).
- **Names.** `capture.py` checks, on every shot, that each element painted in a country colour also
  names its country.

---

## 5. Guardrails

- Buddha images, monks and other sacred objects are never ornament or pattern. A place's own photograph
  in its listing is content, and the rule does not apply to it.
- National and royal symbols (flags, royal emblems, the Angkor Wat silhouette) appear only where they
  carry meaning, never as decoration. Four Flags borrows the flags' colours, never their designs.
- No faux-Asian Latin lettering, and no Latin face that imitates Thai, Lao or Khmer letterforms.
- No pan-Asian pastiche. Credit each colour to its country and source.
- Cream paper reads as a generic look when it comes with a serif face and a terracotta accent. The retro
  default stays faithful to the poster instead: navy ink, the stripe band, Be Vietnam Pro.

---

## 6. Phases

### Phase 1. Candidates and the default decision (docs and tools only)

1. Rewrite this prompt and record the decisions in `DESIGN_SYSTEM.md`.
2. `capture.py --preview <css>`: inject the candidate stylesheet at document start, keep the wayfinding
   hooks current, pin and assert the logo.
3. `measure.py`: the floors of section 4.
4. Design the palettes (section 3) with `round2.json` as the single source; `preview.py` renders it.
5. Capture welcome, home, places, explore, place-th-bkk-wat-pho, phrasebook and me in light and dark: the
   retro default in four variants (two tunings by two navigation variants), the three modern themes, and
   today's Classic. Publish one private gallery with the measured ratios.
6. The gate (section 8). If the owner says the default is not right yet, iterate here before any app
   code changes.

### Phase 2. Machinery and guards, with no visual change

- A new import-free `js/theme.js`: `DEFAULT_SKIN` (still `'classic'`) and `SKIN_MODE` (the six legacy
  skins keep fixed modes; `classic` and the four new ids are `'auto'`). `applyTheme()` always stamps
  `data-skin`, maps an unknown id to `DEFAULT_SKIN`, and drops its `'classic'` special cases.
- Wayfinding hooks: the tabs gain ids; a new `applyTab()`, called in `render()` after `applyTheme()`,
  sets `html[data-tab]` from `activeTabForHash()` and `html[data-country]` from the country in context;
  country chips, cards and the context line carry `data-cc`. The preview stamps `html[data-route]` (the
  hash head) to find country pages; a screen class would do the same job.
- Country colours become tokens (`--country-th`, `--country-vi`, `--country-kh`, `--country-la`) at
  today's values. `REGION_COLORS`, the explore map and the cards read them. The chrome leaks use neutral
  or role tokens instead: `js/nav-groups.js` (its group accents), `accentFor()` in `js/main.js` (Journal
  is Thailand's `#C25E3A`, Exchange is Vietnam's `#9C5780`), `js/screens/calendar.js` and
  `js/budget-ui.js`.
- The chrome selectors that still carry literal colours, routed through tokens at today's values (the
  preview overrides each one):
  - the topbar back button, and the hero glow (`.hero::before`, `.hero`'s radial and conic layers);
  - the shadows (`--shadow`, `--shadow-soft`, `--elev-*`);
  - the white labels on `.btn`, `.chip[aria-pressed]`, `.country-chip[aria-pressed]`,
    `.phase-btn[aria-pressed]`, `.pill-best` and `.update-toast-btn`, and the chip glows;
  - `.tile .ic`;
  - the tab bar's rule (`border-image`) and its active pip, and the same rule on `.sheet` and
    `.compare-tray`;
  - `.region-map`'s sea and the map's strokes and labels (`.ctry`, `.mekong`, `.mekong-name`,
    `.ctry-name`).
- A token-driven stripe-band component (CSS gradients only) that renders nothing until a theme sets
  `--stripe-*`. `tools/style-tiles/preview.py` is its prototype: the straight band, the Welcome arc with
  the sun's window, and the empty-state arc.
- Guards: `check-contrast.py` builds `<id>-light` and `<id>-dark` surfaces in cascade order, resolves
  `var()`, checks text on `--bg`, labels on every fill stop and the country colours, asserts its surface
  count and counts the rules it skips; a new `scripts/check-skins.py` checks that the ids agree across
  `theme.js`, the CSS blocks, Settings and the boot script; both are registered in `scripts/README.md`
  and `.github/workflows/guards.yml`; `capture.py` reads `theme.js`.
- Classic's `.btn`: a two-stop `#F2A93B`→`#E8632A` gradient with `--badge-ink` (8.55 and 5.08:1). This is
  the only intended visual change, and the PR names it.

### Phase 3. The four themes, the pinned logo and first paint

- Each theme gets `:root[data-skin="<id>"][data-theme="light"]` and `[data-theme="dark"]` blocks holding
  every token, plus `--country-*` and, for the retro default, `--stripe-*`, at specificity 0,3,0 so they
  cannot leak across modes. Port the values from `round2.json`; do not retype them.
- Brand surfaces: the retro default places the band on Welcome (behind the sun), the tab-root headers,
  section dividers, empty states and the tab bar's top edge. The modern themes use no stripes.
- `logoSVG()` uses literal colours identical to `icons/icon.svg` and the splash.
- Settings: a "Regional" group holds the new themes; "Day / night (Classic only)" becomes "Light /
  dark", enabled for Classic and the new themes and disabled for the six fixed skins.
- First paint: an external `js/theme-boot.js` (allowed by the CSP) sets `data-skin` and `data-theme`
  from `mk.store` before first paint; two `media`-scoped `theme-color` metas replace the one in
  `index.html`, and `applyTheme()` updates both; the manifest's `theme_color` becomes the default's light
  `--bg`; the splash `--bg` follows `prefers-color-scheme`.
- Add both new files to `PRECACHE` in `sw.js`, run `check-preloads.py --fix`, bump `APP_VERSION` and
  `CACHE_VERSION` together, and run `python3 scripts/build-sw-manifest.py --write`.

### Phase 4. Flip the default

- `DEFAULT_SKIN` becomes the retro theme. `CURRENT_VERSION` in `js/state.js` goes from 15 to 16 with the
  migration the gate chose; it keeps the stored light/dark mode and shows the one-time Undo toast if
  migrating. Classic stays selectable. Older builds render an unknown id as Classic, so a rollback is
  safe.

---

## 7. Phase 1 findings (measured 2026-10-05)

- **The poster's orange cannot name a country.** Sampled as `#D36942`, it sits ΔE00 5.3 from the sun
  orange's marker, against a floor of 15. Its mustard (`#CD8032`) reaches 2.63:1 on cream and its rust
  (`#AF4A44`) sits ΔE00 10.1 from the danger crimson. Through deuteranopia the mustard and the orange
  collapse to ΔE00 4.2.
- **Today's map already blurs Thailand with the action colour.** The terracotta `#C25E3A` sits ΔE00 6.3
  from `#DD571E` and 8.3 from `#E8632A`. On Classic's own card the marigold reaches 1.84:1 and the sage
  2.75:1; through deuteranopia Thailand and Laos collapse to ΔE00 5.4.
- **An olive avocado fails colour vision.** As the poster's fourth stripe it drops the protanopia and
  deuteranopia separations to 4 to 9, so Laos takes the bluer sage `#6C8C5D`.
- **The map's sea had to be measured too.** The first sea tints left 14 country colours under 3:1 against
  the water. Each sea is now the strongest tint of the theme's water that keeps every country at 3:1 or
  more.
- **Classic as shipped fails 19 checks.** Among them: the white primary label on the `#E07A1F` stop at
  3.01:1, accent against danger at ΔE00 7.1 (day) and 6.6 (night), chip boundaries at 1.27:1, the white
  label on the night danger fill at 2.82:1, and the map itself: against today's sea the marigold reaches
  1.37:1, the sage 2.04:1 and the terracotta 2.64:1.
- **Not changed by Phase 1, noted for later.** The places map's basemap colours are literal in
  `js/map.js`, so a dark theme still shows its tan land; Talk's translate card stacks three primary
  buttons; the "Kids OK" tag's amber `#d97706` sits near the sun orange.

---

## 8. The gate (Phase 1)

Ask with AskUserQuestion, recommended option first, against the gallery:

1. Is this retro default the one, and which stripe tuning (poster or map)?
2. Which navigation variant (country colours with one sun orange, or a colour per tab)?
3. The theme names (the retro default's name, and "River", "Four Flags", "Temples & Markets",
   "Classic sunset").
4. Existing users whose store says `classic`: move to the new default with a one-time Undo toast, or
   stay on Classic?

Record the answers in `DESIGN_SYSTEM.md`, push, and stop. Answered on 2026-10-05: `DESIGN_SYSTEM.md` holds
the record, and Phases 2 to 4 follow it without asking again.

---

## 9. Tools

All in `tools/style-tiles/`: Python 3, standard library plus the system Google Chrome (Pillow only to
sample photos). Outputs go to the session scratchpad, never into the repository. See its `README.md`.

---

## 10. Starting messages

Each phase starts in a fresh session, on the model named in section 0:

- Phase 2: "Read VISUAL_DIRECTION_PROMPT.md and the gate record in DESIGN_SYSTEM.md, then execute Phase 2
  and stop when its pull request is open."
- Phase 3: the same message with "Phase 3"; the owner reviews its screenshots before it merges.
- Phase 4: the same message with "Phase 4".
