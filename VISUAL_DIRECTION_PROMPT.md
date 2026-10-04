# Mekonging visual direction prompt

Status: written 2026-10-04, after round 1 of GATE 1, against `mk-v0.623.0` on
`feat/scaffold-bangkok-slice`. Companion to `REDESIGN_PROMPT.md`. It replaces that prompt's section 5.2
(three candidate directions) and settles the one GATE 1 question still open: the visual direction.
Everything else in `REDESIGN_PROMPT.md` stands, except where the owner approves an amendment at this
prompt's gate.

---

## 0. How to use this prompt

- Run it in one fresh session with the strongest model. The expert panel is a working method inside that
  session. Do not start a Workflow or fan out to sub-agents (`REDESIGN_PROMPT.md` section 4, Cost).
- Read `REDESIGN_PROMPT.md` sections 0 to 7 first; its section 4 non-negotiables apply here in full. Then
  read this prompt in full.
- Every phase writes its output to the session scratchpad. Before starting a phase, check whether its
  output already exists and is complete, and resume rather than regenerate.
- Stop at the gate (section 6). Ask with AskUserQuestion, recommended option first, and wait. Never pass
  it on an assumption.
- Starting fresh: run `REDESIGN_PROMPT.md` section 6 (Phase 0), then phases 1 to 5 below, then the gate.
  Nothing in the repository changes until the owner answers the gate; then `DESIGN_SYSTEM.md` records
  the answer.

---

## 1. Round 1, and what the owner said

- Round 1 style tiles (private artifact): https://claude.ai/artifact/8QWD6aT81hp6xbpumqH2vx. It shows
  the three directions of `REDESIGN_PROMPT.md` section 5.2 (A "Golden Hour, refined", B "River and
  Rice", C "Night Market") at 375px in light and dark, with the real Wat Pho entry, a component kit and
  today's screens for comparison. Its source is a working kit (role tokens, type scale, buttons, chips,
  card, list row, input, topbar, tab bar, listing). Read it with the Artifact tool's `read` action rather
  than rebuilding it.
- The owner chose none of the three. Asked what missed, the owner picked two reasons, and only these:
  1. **Not distinctly Mekong.** They could belong to any travel app; the region's places, crafts and
     culture do not come through.
  2. **Lost today's spirit.** They drop the psychedelic warmth, the sunburst and the playful personality
     the app has now.

  The owner did not pick "too alike" or "too plain". Neither reason asks for a louder design. Both ask
  for identity.
- My reading of why round 1 missed. Section 5.2 defined the directions by mood words and hex values,
  and nothing in them exists on the Mekong. Round 1 held type, shape and motif constant, so colour alone
  had to carry identity. And the restraint rules (one accent, at most three gradients, no upper case)
  removed the sunburst and the sunset gradient, which is where today's spirit lives. Direction A also
  sat close to a look that is common in generated design: warm cream paper with a terracotta accent.
- What round 1 got right, and this round keeps:
  - Every role pair measured: WCAG ratios, plus CIEDE2000 between the accent and the danger colour. A's
    first danger red (#B42318) sat only ΔE00 9.1 from its saffron accent, close enough to mistake a
    destructive control for a primary one. A crimson (#B0103A light, #FF6B81 dark) raised that to 20.0
    and 26.3.
  - White or near-white cards separate from an off-white page at only 1.06 to 1.11:1 in every palette
    (today: 1.11:1). The hairline and the shadow carry the separation.
  - The guidebook anatomy of the place listing: verdict, facts, "Watch out", "How you will know you are
    there", sources.
- GATE 1 answers already given. Record them, and do not ask them again.
  - **Skins.** Keep all six named skins as palette-only variants of the new roles, and retire any that
    cannot reach AA.
  - **Icons.** One line-icon family for all chrome; emoji only inside content.
- The scope is wider this round. The full visual language may change (palette, typeface, shapes,
  density, motif and photo treatment). The five tabs, `js/nav-groups.js` and each screen's information
  architecture stay fixed.

---

## 2. The brief

> Mekonging should look as if it could only be about the Mekong, and still feel like itself: warm,
> playful and a little psychedelic. Its working screens stay calm enough to read in bright sun and use
> with one thumb.

### 2.1 Today's spirit, from the source

The stylesheet's header (`css/style.css`, lines 1 to 4) names it: "1970s Cambodian psychedelic. Warm
sunset palette (golden ochre, burnt orange, hot magenta, turquoise, grape), sunburst motifs, groovy
uppercase headings, soft rounded shapes." Its carriers in code:

- `--grad-sun` and `--sunburst` (a CSS `repeating-conic-gradient`) in `:root`, and each skin's own
  version of both;
- the Mekonging wordmark and the Welcome hero (the sunburst hero is already a protected brand moment,
  `REDESIGN_PROMPT.md` Slice 10);
- the illustrated four-country map: `regionPicker()` in `js/screens/explore.js`, filled from
  `REGION_COLORS` in `js/main.js` (Thailand #C25E3A, Vietnam #9C5780, Cambodia #E0A526, Laos #6E9A52);
- two named skins that are the era itself: "Cambodian Psych ’60s–’70s" (`psych`) and "Psych Night"
  (`psychnight`).

### 2.2 Distinctly Mekong, from real material

Start every direction from something that exists on the river, not from generic "tropical" or "Asian"
cues. The app already holds a licensed, self-hosted photo library of the region: `img/places` (140
photographs of temples, markets, rivers and towns in all four countries), `img/food`, `img/nature` and
`img/produce`, with credits in `js/data/photos.js`. Sample colours from those photographs with a script
(Pillow is installed) and cite the photograph each colour came from. A palette that cannot name its
photographs is not distinctly Mekong. Outside sources (museum collections, archives, published design
histories) are welcome when the session opens and checks them; ask the owner for links rather than
searching blind.

### 2.3 Where personality lives: a hypothesis to test

Personality concentrates on a short, named list of brand surfaces: the wordmark, Welcome, each tab
root's header, section dividers, empty states, loading, the illustrated map and the country hubs.
Functional surfaces stay calm: lists, forms, the place facts, the map's controls and Talk's translate
card. A direction may propose a different split if it shows a better one.

### 2.4 Guardrails (the visual-culture seat holds the veto)

- Buddha images, monks and other sacred objects are never ornament or pattern. Many people in Thailand
  and across the region consider decorative use of a Buddha image disrespectful. A place's own
  photograph in its listing is content, and the rule does not apply to it.
- National and royal symbols (flags, royal emblems, the Angkor Wat silhouette on Cambodia's flag) appear
  only where they carry meaning, never as decoration.
- No faux-Asian Latin lettering (brush-stroke or "chop suey" display faces), and no Latin face that
  imitates Thai, Lao or Khmer letterforms.
- No pan-Asian pastiche. Credit each motif to its country and source, and use it where it belongs.
  Nothing from elsewhere in Asia stands in for the Mekong. Vietnam's Sino-Vietnamese heritage (Hội An's
  assembly halls, Hán-Nôm calligraphy) counts when the direction credits it as Vietnamese.
- Borrow structure and colour from ethnic-minority textiles (Hmong, Tai Dam, Akha and others), never a
  whole pattern, and credit the source.
- Celebrate the Golden Age of Cambodian popular music (the 1960s and early 1970s) with care. The Khmer
  Rouge killed many of its artists, and the app never references that era.
- None of the looks that are common in generated design: warm cream paper with a serif display face and
  a terracotta accent; near-black with a single acid-green or vermilion accent; a purple-to-blue
  gradient hero; Inter or Space Grotesk as the safe face; emoji as section markers; everything centred;
  one large radius on everything; an accent bar down the side of a rounded card.

---

## 3. The panel

One session works as eight named seats. Each seat writes in its own section of every phase's output,
signs its scores, and records dissent instead of converging politely.

| Seat | Mandate | Veto |
|---|---|---|
| Creative director (chair) | Synthesis. Holds each direction to one system that works on every surface, cuts to finalists and recommends one | None |
| Keeper of today's spirit | Speaks as the app's original art director. Inventories what makes today's look Mekonging and defends it | None |
| Mekong visual-culture specialist | Thai, Lao, Khmer and Vietnamese material and graphic culture; sources and credits every reference | Cliché, sacred misuse or pastiche (section 2.4) |
| Typographer | Latin display and text faces beside Thai, Lao, Khmer and Vietnamese; measures every candidate face | A face that fails the measurement rule (section 4.1) |
| Colour and accessibility specialist | Role tokens in light and dark, the eight surfaces, sunlight, colour-vision deficiency | Any measured AA failure |
| Travel UX researcher | The traveller in bright sun, on one bar of signal, with one thumb and a second language | A direction that makes a functional screen busier |
| Guidebook editor | Verdict first, facts scannable, every word earning its place | None |
| Front-end engineer | Vanilla CSS, no build step, offline first, a 0.65 Mbps link | A runtime library, a CDN, or a stylesheet that grows |

Rules for the panel:

1. Divergence is assigned. Each authoring seat starts from a different primary source area (Phase 3),
   so the directions cannot converge on one palette.
2. Evidence over adjectives. A claim about colour, contrast, width, bytes or legibility carries a
   measured number, or it is struck out.
3. Every direction names the one aesthetic risk it takes.
4. Dissent goes into the critique under the seat's name, even when the chair overrules it.

---

## 4. What is fixed and what is open

### 4.1 Fixed

- `REDESIGN_PROMPT.md` section 4 in full: delivery, WCAG 2.2 AA, 44×44px hit areas, 29 interface
  languages with four right-to-left, Thai, Lao and Khmer in system fonts with line-height room,
  self-hosted fonts and icons, no runtime libraries, CSS-only motion, and a stylesheet that shrinks.
- `REDESIGN_PROMPT.md` section 5.1, principles 1, 2 and 5 to 8, and section 2's "not overwhelming" list.
- The five tabs, `js/nav-groups.js` and each screen's information architecture.
- The two answered GATE 1 questions (skins and icons).
- Measurement floors for every finalist, in light and dark: text at least 4.5:1 on every surface it can
  sit on, and body text at least 7:1 on its main surface, for sunlight; boundaries, icons and focus rings
  at least 3:1; accent against danger at least ΔE00 15.
- The measurement rule for a display face: bytes (a variable family can invert a per-weight estimate),
  width at the real computed style, and the rise of stacked Vietnamese marks measured numerically;
  SIL OFL or an equivalent licence; Latin and Vietnamese subsets, self-hosted, about 70 KB at most
  (today's Be Vietnam Pro is 67.7 KB for two weights).

### 4.2 Open: amendments a direction may propose

The gate lists each amendment with its cost, and the owner approves or rejects each one.

- Section 5.1, principles 3 ("one of each") and 4 ("colour carries meaning"), as they apply to brand
  surfaces: a two-tier palette, with restrained functional roles plus an expressive brand palette used
  only on the brand surfaces of section 2.3.
- Section 5.3: the display face, its weights, and whether a Latin-only display case (upper case on brand
  moments, as today) survives. It may never be the only signal of hierarchy, and it never applies to
  Thai, Lao, Khmer, Arabic, Hebrew, Persian or Urdu strings.
- Section 5.5's limit of three gradients, and section 10's targets of 4 radii, 3 shadows and 3
  gradients: a different budget for brand surfaces, as tokens, with a ceiling that Slice 1d's ratchet
  guard can enforce.
- Section 5.8's ban on looping animation: one signature brand motion (for example, a slow turn of the
  Welcome sunburst), CSS-only, paused off screen and off under Reduce motion.

---

## 5. Phases

### Phase 1. Today's spirit (the keeper leads)

Look before reading. Capture Home and Welcome on all eight surfaces (Classic light, Classic dark and the
six named skins; seed `store.profile.skin` as well as `theme`), and read the carriers in section 2.1.
`tools/style-tiles/capture.py` does both captures in one run.

Output, `spirit.md`: eight to twelve traits that make today's look Mekonging, each with where it lives
(a file and line, or a screenshot), a verdict (keep, evolve or retire) and one sentence of reasoning.
The keeper writes it; every other seat may annotate it.

### Phase 2. Reference board (the visual-culture specialist leads)

Output, `references.md` and `samples.json`: for each of the four countries and for the river itself,
three to six sources, the app's own photographs first. For each source: what it contributes (colour,
pattern, letterform, material or composition), the colours sampled from it with the photograph's path,
and any guardrail from section 2.4 that applies.

### Phase 3. Six directions

Each authoring seat develops one direction from its own primary source area.

| Seat | Primary source area |
|---|---|
| Keeper of today's spirit | The Golden Age of Cambodian popular music: record sleeves, film posters and title lettering. This is the identity the app already quotes, evolved rather than refined away |
| Mekong visual-culture specialist | Woven textiles: Lao sinh and pha biang, Khmer hol and pidan, Tai Dam and Hmong indigo, for pattern, colour and edge |
| Typographer | Street lettering: hand-painted shop signs, market price boards, boat and bus livery and temple signage, with Thai, Lao, Khmer and Vietnamese scripts beside Latin |
| Travel UX researcher | The river and the road by day: silt-brown water, laterite earth, rice green, monsoon sky, long-tail boat paint and enamel route signs |
| Guidebook editor | The map and the field guide: printed cartography and field guides, with the app's own illustrated map and its four country colours as a categorical system |
| Creative director | Night on the river: the lanterns of Hội An, the night markets of Luang Prabang and Vientiane, and temple gold at dusk. Real places only; round 1's generic neon (direction C) is the counter-example |

Each direction is a written specification in `directions.json` and `directions.md`:

- a name, a one-sentence thesis, and the photographs or sources it draws on;
- the spirit traits it keeps (by number from `spirit.md`) and any it retires;
- functional role tokens in light and dark, using round 1's set (bg, surface, surface2, line,
  borderStrong, text, text2, accent, onAccent, accentSoft, secondary, star, danger, onDanger), measured
  with `tools/style-tiles/measure.py`;
- its expressive brand palette and the brand surfaces it may appear on;
- typography: the display face (Be Vietnam Pro, or a measured alternative) and the type scale;
- shape and density: radii, spacing rhythm and card treatment;
- the motif system (for example the sunburst, a woven band or a lantern glow), CSS-only, with an
  estimate in bytes;
- photo treatment and icon stroke (line icons are decided; weight and caps may vary);
- the one aesthetic risk it takes, and the section 4.2 amendments it needs.

Run a diversity check. Any two directions must differ in at least three of these six: accent hue family,
display face, shape language, motif system, density and photo treatment. Record the matrix, and the
chair merges any pair that fails it.

### Phase 4. Critique, and a cut to three

Every seat scores every direction from 1 to 5 on each criterion, with one sentence of evidence per
score. Vetoes are binary and cite their rule.

| Criterion | Weight |
|---|---|
| Distinctly Mekong: could it belong to any other app? | ×2 |
| Today's spirit kept (the traits in `spirit.md`) | ×2 |
| Calm where it counts: no functional screen gets busier, and the first viewport still shows the tool | ×2 |
| Glanceable in sunlight, with AA measured across the eight surfaces | ×1 |
| 29 languages, right-to-left, and Thai, Lao and Khmer behaviour | ×1 |
| Feasible and light: CSS-only, measured bytes, a stylesheet that shrinks | ×1 |
| Ownable: none of the generated looks listed in section 2.4 | ×1 |

The chair cuts to three finalists (hybrids are allowed if they credit both sources), records dissent and
recommends one. Output: `critique.md`.

### Phase 5. Style tiles, round 2

Build one standalone page in the scratchpad and publish it as a new private artifact that links to
round 1. For each finalist, at 375px in light and dark, show:

- the brand surfaces: the wordmark, the first Welcome step, Home's header, a section divider, an empty
  state, and the illustrated map in the direction's treatment;
- the functional set from round 1: the palette with measured ratios, the type scale, buttons, chips, a
  card, a list row, a section header, an input, the topbar, the tab bar and the real Wat Pho listing;
- a spirit check: the `spirit.md` traits ticked against what the frame shows;
- today's screens, for comparison.

Build notes from round 1:

- The Artifact page contract blocks external hosts, so inline fonts and images as `data:` URIs.
- Preview the page inside an equivalent publish skeleton. Under mobile emulation, a local file without a
  viewport meta lays out at 980px, and an author `display:` rule overrides the browser's `[hidden]`
  rule.
- Size grid tracks with `minmax(0, 1fr)`. A single-column grid otherwise grows to its widest item's
  min-content width. That pushed round 1's kit past its frame until I fixed it.
- Look once, fix once, then publish.

---

## 6. The gate: GATE 1, round 2

Ask with AskUserQuestion, recommended option first:

1. **Direction.** The three finalists, each with a preview of its key tokens, its display face and the
   spirit traits it keeps. "Other" lets the owner ask for a hybrid.
2. **Amendments.** A multiple choice of the section 4.2 amendments that the finalists need, each with
   its cost.

If the owner chooses none of the finalists, ask what missed, as round 1 did, record the answer, and stop;
round 3 belongs to a later session.

Record the answers in `DESIGN_SYSTEM.md` (the gate record) and in memory, open one pull request for that
record, and stop. `REDESIGN_PROMPT.md` then resumes at Slice 1b, with the chosen direction's tokens in
place of section 5.2.

---

## 7. Cost

- One session with the strongest model, because this is design judgement. No Workflow and no
  sub-agents.
- Measure rather than guess: ratios, ΔE00, bytes and widths.
- Reuse round 1. The artifact's source holds the component kit, and `tools/style-tiles/` holds the
  capture and measurement scripts.
- Phase 2 opens and checks every source it cites. It does not search blind.

---

## 8. Starting message

Paste this into a fresh session opened on the Mekonging repository:

> Read `REDESIGN_PROMPT.md` sections 0–7, then `VISUAL_DIRECTION_PROMPT.md` in full. Run Phase 0, then
> phases 1 to 5, and stop at GATE 1 round 2.
