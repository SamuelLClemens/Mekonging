# tools/style-tiles/

Tooling for choosing the app's visual direction (`VISUAL_DIRECTION_PROMPT.md`). Python 3, standard
library only, plus the system Google Chrome. Nothing here is served or precached. Every output belongs
in the session scratchpad, never in the repository.

| file | what it does |
|---|---|
| `capture.py` | Screenshots any route on any of the eight surfaces (Classic light and dark, six named skins) through headless Chrome, at 375×812 and 2× |
| `measure.py` | Measures a palette file: WCAG contrast for every role pair the tiles use, and CIEDE2000 between accent and danger. Exit status 1 below the floors |
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
python3 tools/style-tiles/measure.py tools/style-tiles/round1.json --out "$SCRATCH/palettes.json"
```

## Traps found while building the round-1 page

- A local HTML file without a viewport meta lays out at 980px under mobile emulation. Preview an
  artifact page inside the same skeleton the Artifact publish adds, or the look is wrong.
- An author `display:` rule beats the browser's `[hidden]` rule. The publish skeleton supplies
  `[hidden]{display:none!important}`; a local preview needs it too.
- A single-column grid sizes to its widest item's min-content width: one no-wrap, ellipsised title
  pushed the whole kit past its frame. Use `minmax(0, 1fr)` tracks.
