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

| Question | Answer |
|---|---|
| The default and its stripe tuning | Pending |
| Navigation | Pending |
| Theme names | Pending |
| Existing users on `classic` | Pending |
