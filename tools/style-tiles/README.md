# tools/style-tiles/

Tooling for choosing the app's visual direction (`VISUAL_DIRECTION_PROMPT.md`). Python 3, standard
library only, plus the system Google Chrome. Nothing here is served or precached. Every output belongs
in the session scratchpad, never in the repository.

| file | what it does |
|---|---|
| `capture.py` | Screenshots any route on any of the eight surfaces (Classic light and dark, six named skins) through headless Chrome, at 375×812 and 2×. With `--preview`, renders candidate themes that are not in the app yet |
| `measure.py` | Measures a palette file against the floors of `VISUAL_DIRECTION_PROMPT.md` section 4: WCAG contrast for every role pair, the label on every stop of the primary fill, country colours as graphics, CIEDE2000 between the colours that must not be confused, and the same separations through three kinds of colour-vision deficiency. Exit status 1 below a floor |
| `preview.py` | Renders one theme of a palette file into the stylesheet `capture.py --preview` injects: role tokens mapped onto the app's tokens, the literal chrome overrides, the pinned logo, the wayfinding hooks, and (retro family) the four-stripe band |
| `port-themes.py` | Phase 3: writes the four themes' token blocks and chrome rules from `round2.json` into the generated block at the end of `css/style.css` (`retro` is the `retro-map` tuning). `--check` fails when the block is stale; it runs in CI. Re-run it after any change to `round2.json` or `preview.py` |
| `round2.json` | Phase 1 candidates: the retro default in two stripe tunings, River, Four Flags, Temples & Markets, and today's Classic as shipped. Every sampled colour cites its photograph or flag specification |
| `round1.json` | The three round-1 directions (A, B, C) exactly as the round-1 tiles rendered them; the owner chose none |

## Why headless Chrome rather than the Browser pane

The Browser pane is always `document.hidden`. It computes no layout (every rect reads 0), it clamps
timers, it never paints a MapLibre map, and it cannot write a screenshot to disk. Headless Chrome has
none of these problems. `capture.py` drives it over the DevTools protocol with a small standard-library
websocket client, because no websocket package is installed here.

```bash
python3 scripts/serve.py 8950
```

```bash
python3 tools/style-tiles/capture.py --base http://127.0.0.1:8950 --out "$SCRATCH/baseline" --surfaces classic-light,classic-dark,psych,psychnight --routes home,welcome --webp
```

It seeds each surface through the app's live store (`import('/js/state.js')` from `#settings`, which
sits outside the first-run gate), then checks that every shot carries the requested
`data-theme` and `data-skin`. Other checks, such as a computed-style digest across the route sweep, can
import `launch()` and `CDP`.

## Measuring a palette

```bash
python3 tools/style-tiles/measure.py tools/style-tiles/round2.json --out "$SCRATCH/palettes.json"
```

A theme marked `"reference": true` (today's Classic) is reported but does not fail the run.

## Previewing a candidate theme on real screens

```bash
python3 tools/style-tiles/preview.py tools/style-tiles/round2.json --theme retro-map --nav country --out "$SCRATCH/previews/retro-map--country.css"
```

```bash
python3 tools/style-tiles/capture.py --base http://127.0.0.1:8950 --out "$SCRATCH/shots" --surfaces classic-light,classic-dark --routes welcome,home,places,explore,place-th-bkk-wat-pho,phrasebook,me --webp --preview "$SCRATCH/previews/retro-map--country.css"
```

The preview rides Classic's light and dark modes. Its injected script keeps `html[data-preview]`,
`html[data-tab]`, `html[data-country]`, `html[data-route]` and `data-cc` current; each shot fails unless
the logo's computed stop colours are the pinned sun and every country-coloured element names its
country. `--nav tabs` renders the colour-per-tab navigation variant instead. The places map paints its
satellite tiles late, so that route waits 9 s (`--route-settle`).

## Traps found in Phase 1

- A country colour that clears 3:1 on the page can still vanish into the illustrated map's sea; the sea is
  a measured role (`sea`) for that reason.
- Floors must compare unrounded values. A rounded 12.0 hid a deuteranopia separation of 11.99.
- `border-image` with a top-to-bottom gradient paints only the gradient's first row into a top border, so
  the stripe band is a pseudo-element or a background layer, never a `border-image`.

## Traps found while building the round-1 page

- A local HTML file without a viewport meta lays out at 980px under mobile emulation. Preview an
  artifact page inside the same skeleton the Artifact publish adds, or the look is wrong.
- An author `display:` rule beats the browser's `[hidden]` rule. The publish skeleton supplies
  `[hidden]{display:none!important}`; a local preview needs it too.
- A single-column grid sizes to its widest item's min-content width: one no-wrap, ellipsised title
  pushed the whole kit past its frame. Use `minmax(0, 1fr)` tracks.
