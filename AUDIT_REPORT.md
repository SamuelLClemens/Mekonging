# Mekong — Audit Report

Session 1 (audit and plan), 2026-10-02. Method: `AUDIT_PROMPT.md` Phases 0–3.
Audited build: **mk-v0.597.0** (production and integration are byte-identical, see Baseline).

## 1. Verdict

1. **The emergency screen is wrong where it matters most.** It picks the country from the nearest weather anchor — wrong for 13.2 % of the four countries' area and for 9 of 20 border towns tested (Don Det shows Cambodia). It shows **no emergency number** whenever the GPS country differs from the last-browsed one. Online, it lists a district health centre, an adult trauma hospital and an obstetrics hospital before any children's hospital for a family in Hanoi. All three are small fixes in one slice (S1).
2. **"Sourced" holds for only part of the data.** 80 % of transport routes cite nothing and 29 % of places cite only a homepage; 5 of 10 sampled places are contradicted or unsupported by their own source. The sourced-and-offline moat is the product, so this is S2 and S10.
3. **The first screen does not answer the first question.** After onboarding, 56 % of Home is one-off notices; "what is near me" is 1,598 px down, sorted by season rather than distance, with no open/closed state anywhere. In German the emergency screen is 93–95 % English.

Measured and working: SOS is one tap from every screen; a warm launch makes zero network requests; hospitals are island-aware; the Journey planner puts border, visa, price and scams on one screen; Thai, Lao, Khmer and Vietnamese render correctly; 11 of 12 guards pass (the failing one is a known false positive with a fix branch).

## 2. Baseline

### Versions

| Where | APP_VERSION | CACHE_VERSION | Note |
|---|---|---|---|
| Production `https://www.mekonging.com` | mk-v0.597.0 | mk-v0.597.0 | `sw.js` byte-identical to integration (`cmp`) |
| Integration `origin/feat/scaffold-bangkok-slice` @ `0d7c1a8` (2026-09-29) | mk-v0.597.0 | mk-v0.597.0 | — |
| Local preview | mk-v0.597.0 | — | `git archive` of `0d7c1a8`, served on `127.0.0.1:8779` (fresh origin) |

Neither is ahead. The main checkout is on `feat/weather-10day-forecast` (`db0d119`), whose tree is identical to integration. Port 8742 (`mekong` in `launch.json`) belongs to another live session, so this audit served its own export rather than share it. The local `feat/scaffold-bangkok-slice` ref is stale (`e5c2047`); the guard below was run with `--base origin/feat/scaffold-bangkok-slice`.

### Guards (run once on the integration tree)

| Guard | Result |
|---|---|
| check-imports | PASS — every named import resolves to a real export |
| check-lazy-data | **FAIL** — 77 lines (76 routes + one unnamed) "read `phrasebooks` but ROUTE_DATA gates []". False positive: the regex literal `/TWO DISTINCT LANGUAGES/` in `serviceError()` (js/translate.js) matches the export `LANGUAGES`. Red on integration since PR #40 (`6715dec`, 2026-09-21); fixed on unmerged `fix/lazy-data-phrasebooks` (also carried by `ci/guards-workflow`). See F-01 |
| check-preloads | PASS — same set as the eager graph |
| check-ui-strings | PASS — 29 languages, 368 keys each |
| check-month-arrays | PASS |
| check-contrast | PASS — every text colour clears WCAG AA on every surface |
| check-spacing | PASS |
| check-place-dupes | PASS |
| check-undefined | ok — 228 files, every identifier resolves |
| check-net-gates | PASS — 227 files, 19 network gates |
| check-place-fields --assert | PASS |
| check-cache-version --base origin/… | PASS |
| `jsc -m js/main.js` (parse) | PASS — whole import graph parsed (`ReferenceError: navigator` at main.js:460 is the expected runtime stop) |

Re-run 2026-10-02 on integration `ee8fcd0` (after PR #64, which carried a byte-identical `scripts/check-lazy-data.py`): **12 of 12 PASS** — check-lazy-data "37 routes, 14 lazy data modules, every read gated". Production then served mk-v0.598.0.

### Route sweep (local, fresh origin `127.0.0.1:8779`, `routeSweep({ quiet: true })`)

**75 routes, 65 clean, 10 flagged; 2,944 controls audited; 0 fold preferences written.** Layout was not computed (hidden pane), so title-clipping checks were skipped, not passed.

| Route | Flag | Verdict |
|---|---|---|
| `#weather-th` | NEVER SETTLED · NO TOPBAR · SCREEN RENDERS NOTHING | false alarm: opened directly it renders 8,525 characters under the "Weather" topbar |
| `#phrasebook` | NEVER SETTLED · 1 control disabled on arrival ("⤓ Download selected") | disabled until a language is ticked — expected |
| `#settings` | 1 control disabled on arrival ("⤓ Download selected") | same control — expected |
| `#map`, `#places` | 1 control disabled on arrival ("Location not available") | no GPS permission in the pane — expected |
| `#nearby`, `#journal`, `#inbox` | very short — empty state | copy question, not a defect |
| `#home`, `#welcome` | NO TOPBAR | by design |

### Unmerged branches (vs `origin/feat/scaffold-bangkok-slice`)

| Date | Branch | Ahead | What it holds | Relevant to |
|---|---|---|---|---|
| 2026-09-27 | `ci/guards-workflow` | +2 | GitHub Actions workflow running the guards on every PR and push; includes the lazy-data fix | tooling (F-01) |
| 2026-09-25 | `fix/lazy-data-phrasebooks` (+ origin) | +1 | Strips literals before tokenising in check-lazy-data — fixes the 77-route false FAIL | tooling (F-01) |
| 2026-09-25 | `fix/lazy-data-phrasebooks-gate` (+ origin) | +1 | Narrower alternative: suppresses the one false match | tooling — superseded by the above |
| 2026-09-20 | `perf/cold-load` (+ origin) | +1 | "what a bus ride actually costs, per network" (map.js +24, main.js, sw.js) | J3 |
| 2026-08-27 | `plan/when-to-go-and-cost` | +1 | docs plan; known superseded — merging it would un-tick shipped slices | none |

## 3. Scorecard

Viewport 375×812, production, fresh origin. Taps counted from Home. "1st VP" = answer visible in the first viewport without scrolling or opening a fold.

| Job | Persona | Result | Taps | Seconds | 1st VP | Offline | Top blocker | After |
|---|---|---|---|---|---|---|---|---|
| J10 First run | P1 (EN, BKK) | Y | 5 (location, Next, Solo, Next, See what I set up) | app: first screen 0.19 s from HTTP cache; first visit = 86 requests, 970 KB compressed (2.47 MB decoded), 81 JS modules; reading time unknown | Home: N — 56 % of it is the setup recap + download line | n/a | F-02 recap/download notices; F-05 "Bang Krachao" | |
| J10 First run | P4 (DE, Siem Reap) | Partial: German chosen in 2 taps (language button → list), city by select, 5 more taps; onboarding steps 2–3 and most of Home stay English | 7 | app <0.1 s per step (local copy, fresh origin `localhost:8779`) | Home: 61 % of multi-word text English | n/a | F-18, F-19 | |
| J1 Emergency | P2 (Hanoi, child, night) | **N** on first open: no number, wrong hospital order | 1 to SOS; 2 to dial 115 (once numbers load) | <0.1 s render | numbers y = 316–428 ✓; hospitals start y = 756 | not tested for P2 (P3 row: in-app offline renders) | F-09 numbers missing; F-10 health centre / adult trauma / obstetrics listed first | **Y** (S1, local mk-v0.600.0, fresh origin): first open after browsing Thailand shows `tel:113` and `tel:115` at y ≤ 440; first hospital Hanoi French Hospital 🧒; the district health centre and obstetrics hospital move under "Closer, capability unknown"; first open 305 ms (desktop) |
| J2 Near me now | P1 (BKK airport, ~22:00) | Partial: lists exist, nothing open-now, nearest pick 23 km away | Home: 0 taps but "Right now" at y = 1,598 (2 screens of scroll); Places: 1 tap, list at y = 1,592; Things to do: 3 taps (fold → See & do → Things to do), first row at y = 598 | <0.2 s | **N** on Home and Places; Y on Things to do | ✓ (local data) | F-02, F-07 (no open/closed on any row), F-05 label "Bang Krachao" | |
| J3 A→B | P3 (Don Det → Stung Treng) | Partial: one screen with border, visa, 3–5 h, $20–28 (converted for a EUR traveller: "≈ €17,75–24,84"), operators, scams, 12Go link; no source, "From" not pre-filled from GPS | ~5 from Home (fold "What do you need?" at y = 2,876 → Transport → Journey planner → From → To) | <0.3 s after selection | result below two selects of 70 stops each | in-app offline ✓ | F-14 no source; From not defaulted (F-17) | |
| J4 Say it | P1 (EN, Bangkok) | Y online (typed → Thai + audio); phrasebook offline; camera and mic unverified here | 2 (Talk, Translate) | 0.66 s to "สถานีขนส่งอยู่ที่ไหน?" (`lang=th-TH`), audio auto-plays | ✓ input at the top | live translation "Needs internet"; phrasebook ✓ | no romanisation for live results; topbar says "Phrasebook" under a "Talk" tab | |
| J5 Money | P4 (DE, Siem Reap, EUR) | Y converter + log; ATM layer unverified (map) | 1 (Quick access → Budget) | <0.3 s | converter ✓ | rates cached ✓ | 13-currency chip row repeated 4× on Budget; "≈ €32,83–63,89" false precision (F-04); screen 100 % English until the machine pass runs (F-18) | |
| J6 Weather | P1 (online) / P3 (offline) | P1 Y; **P3 N** | 1 (Quick access → Weather) | <0.3 s | today ✓, 10-day below | **N for here**: no forecast cached (F-21) | F-04 decimals; F-21 | |
| J7 Plan & remember | P2 / P4 | Y: star → saved, stop added, both survive reload | save 2 (Places, ☆); stop 4 (Plan & travel → My trip → name/date → Add) | <0.3 s | — | ✓ | stop saved with the wrong country (F-22); trip-city weather says "Connect once" while online for a date 18 days out | |
| J8 Before I arrive | P1 | Y via search: "visa" → Entry & visa, Border crossings; "sim card" → Bangkok/Hanoi practical: SIM; "scam" → Common scams; "tipping" → Country guide | 2 + typing (🔍, result) | results after the input debounce (~1 s) | ✓ | ✓ (local index) | one irrelevant hit ("Bamboo Train" for "visa") | |
| J9 Go offline | P3 | Partial: three separate places, sizes shown for one of them | field guide 0 (automatic) · phrase audio 3 (Settings → card → Download) · map 3+ per area (Places → fold → pan → Save view) · weather: not possible (F-21) | — | — | field guide status honest ("97 MB", ✓ per tier); audio and map: no size before download | F-23 fragmented flow; F-03 size not announced; F-20 dead "signal icon" instruction | |
| J1 Emergency | P3 (Don Det, offline) | **N** at the south tip / Nakasang: Cambodia shown; partial after manual "Laos" chip | 1 (wrong country) → 2 with the Laos chip | <0.1 s | numbers ✓ after chip | in-app offline ✓ | F-12 wrong country from nearest anchor; F-09 | **Y** (S1): Don Det and Nakasang show "Laos — call for help", `tel:1195`, "within 10 km of Cambodia"; first open 461 ms (loads both sides' province sets once), repeat 33 ms |

### Cross-cutting measurements (production unless stated)

| Check | Result |
|---|---|
| First visit (no worker, HTTP cache warm) | 86 requests, 970 KB compressed / 2.47 MB decoded; 81 JS modules = 886 KB; eval done 167 ms, first render 194 ms (desktop CPU — phone time unknown). Two third-party calls before any answer: `open.er-api.com` (rates) and `api.open-meteo.com` (network is on by default since `a6c8c03`, a recorded decision) |
| Background on first visit | precache 239 files, 11.5 MB raw ≈ 3.4 MB gzip; then the field guide, 97 MB ("The whole field guide is on this device — 97 MB") |
| Warm launch | 57 resources, **0 from network**; eval 306 ms, first screen 342 ms |
| Tap targets (375 px) | Home 0 under 24 px; SOS 7; Talk 6; Places 39 (mostly map markers) — F-24 |
| Accessible names | route sweep: no unnamed controls on 75 routes |
| Contrast (default skin = "dark") | on-screen samples 6.05–8.52:1 (muted text, headings); `check-contrast` PASS on all seven skins |
| Scripts | phrase text carries `lang` th-TH / vi-VN / km-KH / lo-LA, 19.2 px, line-height 1.50, 0 clipped of 130–134 per language |
| 768 / 1280 px | Home and Places: no horizontal overflow; 1280 renders a centred 720 px column. Map paint at 768: unverified here (blank, hidden-pane artefact); at 1280 pins painted |
| Naming | tab "Talk" opens a screen titled "Phrasebook"; tab "Places" → "Places for you"; tab "YOU" (caps) vs "You" elsewhere; German tab bar flips between "Start" and "Beginnen" depending on whether the machine pass has run |
| Unexpected reload | once, the production tab reloaded itself while a script was running (`navigation.type = "reload"` afterwards, no reload issued by the audit at that moment); cause not established — on the owner checklist |

## 4. Findings

Severity: P0 broken / could hurt / blocks a job (anything wrong in J1); P1 friction on a top job; P2 polish. Rows are ranked by traveller harm × how many travellers hit it ÷ effort, highest first.

| ID | Sev | Job | Finding | Evidence (measured) | Proposed fix | Effort | Slice |
|---|---|---|---|---|---|---|---|
| F-12 | **P0** | J1 | SOS decides **which country you are in** from the nearest weather anchor (`sosScreen` → `nearestSpotGlobal(fix)` → `setActiveCountry(near.spot.country)`, `js/main.js:6430-6436`), so near any border it shows the neighbour's numbers and hospitals. On Don Det it shows Cambodia, no numbers (F-09 compounds it), and a Stung Treng hospital 103 km away across a border | Production, P3 at Don Det (13.958, 105.917), in-app offline: "You appear to be near Don Det. Showing Cambodia", "Cambodia — call for help / Emergency numbers are being added", nearest "16 Makara Provincial Referral Hospital 103 km". Measured over the 147 anchors and the shipped outlines (`js/data/geo.js`): nearest anchor is in another country for **1,347 of 10,230** 0.1° cells (**13.2 %** of the four countries). Real towns wrong: Don Det, Nakasang (la→kh), Hà Tiên (vi→kh), Mukdahan, Chiang Khong, Chong Mek (th→la), Aranyaprathet, Hat Lek (th→kh), Bavet (kh→vi) — **9 of 20** border towns tested. History: `MASTER_BUILD_PROMPT.md:89-96` already ruled the anchor snap "the wrong source for naming the user's location" and `whereAmI()` fixed the *name* on this screen; the *country* decision was never moved off it | Decide the country by point-in-polygon on the outlines already shipped in `js/data/geo.js` (`REGION_PATHS` + `REGION_PROJ`); use anchors only for weather. Show "near the border — also: <other country> numbers" within ~10 km of a border | S | S1 |
| F-09 | **P0** | J1 | SOS can show **no emergency number** for the country the traveller is in. The route gate loads country data for the *active* country, but the screen picks its country from GPS; when they differ (crossed a border, or browsing the next country) `c.info.emergency` is empty and the card says "Emergency numbers are being added for this country." The same fallback exists in `js/screens/medical.js:197` and `js/screens/firstaid.js:104` | Production, P2: GPS fix Hanoi (21.033, 105.850), app last used in Thailand → `#sos` = "📍 You appear to be near Hanoi. Showing Vietnam" + "🇻🇳 Vietnam — call for help / Emergency numbers are being added for this country." After opening `#sos-vi` once, `#sos` shows Police 113, Fire 114, Ambulance 115, Rescue 112 (data is in `js/data/info.vi.js:3-8`). Gate: `js/main.js:6996-7027` uses `getActiveCountry()`; screen: `js/main.js:6441-6465` | Put the four countries' emergency numbers in a tiny eager module the SOS, hospital and first-aid screens read directly (never lazy); and gate `#sos` on the GPS-derived country as well as the active one | S | S1 |
| F-10 | **P0** | J1 | SOS "Nearest to you" gets *worse* once the full OpenStreetMap hospital layer loads: it switches from the curated, capability-tagged list to the three nearest OSM facilities of any kind, with no tags, and ignores the family profile | P2 (party = family), Hanoi Old Quarter. Before the OSM layer: 1. Viet Duc 1 km (🚑 🩸, no 🧒) 2. Hanoi French Hospital 2 km (🧒 🌐) 3. Bach Mai 4 km (🧒). After it loads (online): 1. "Trung tâm Y tế quận Hoàn Kiếm" (district health centre) <1 km, no tags 2. Bệnh viện Hữu nghị Việt Đức <1 km 3. Bệnh viện Phụ sản Trung ương (obstetrics) <1 km. No children's hospital in the top 3 for a child with a fever at night. Curated data has `tags: ['er','peds',…]` (`js/data/hospitals.curated.js:99-100`) | Rank SOS by capability first: curated `er` facilities (and `peds` first for family/baby profiles) above untagged OSM points; show untagged OSM points only as "also nearby (capability unknown)" | M | S1 |
| F-13 | P1 | J1, J6 | Several anchors are misplaced, which mislabels places and fetches weather for the wrong spot | `Huay Xai` anchor 20.33, 100.70 is **30 km** from the town (20.276, 100.414); `Preah Rumkel (Stung Treng)` (kh) at 13.97, 105.94 lies inside Laos; `Don Det` (13.9226, 105.9403) and `Don Khon` (13.912, 105.972) fall on the Cambodian side of the shipped outline; no anchor at all for Mukdahan or Chiang Khong (`js/weather.js:176-192`) | Correct the four coordinates from a cited gazetteer; add Mukdahan and Chiang Khong anchors | S | S1 |
| F-16 | P1 | J2, J8 | Data-truth spot check (10 random places with deep-link sources, seed 20261002, + 3 routes): half of the stated facts checked are contradicted or unsupported by the app's own cited source | **Places — supported: 3** (Railay/Tonsai bungalows; Pai riverside huts 200–400 THB; Pre Rup open to 19:00). **Contradicted or unsupported: 5** — Jaan Bai (Battambang) "Tue–Sun, closed Monday" vs source "10am – 10pm, 7 days a week"; Temple of Literature "08:00-17:00" vs Wikivoyage "Daily 08:00-18:00" (Wikipedia states no hours); Núi Bà Đen cable car "250,000-450,000 VND" vs source "200,000 VND"; Pattaya "Nov–Feb peak" vs source "January to March is peak season"; HCMC "FV Hospital runs 24/7 emergency care" not stated in the cited page. **Unverifiable: 2** — Pak Ou Caves' only deep source (Lonely Planet) returns HTTP 404; Savan Resorts' only source (Tripadvisor) returns 403 to any fetch. Coordinates: Temple of Literature 88 m from Wikipedia's point (inside the compound) ✓; Pre Rup ✓. **Routes:** `la-4000islands-stungtreng` and `kh-phnompenh-siemreap` cite nothing; `th-suratthani-kohsamui` "1.5 h" ✓ against Raja's schedule ("about 1 hour 30 minutes"), fare 210 THB not on the cited page | Fix the five contradicted facts now (one content commit); treat Tripadvisor as a review source, never as the only citation; add a dead-link check for cited URLs to the content slice | S (fixes) / M (link check) | S2 |
| F-20 | P1 | J9 | In offline mode Home tells the traveller to "Tap the signal icon at the top" — that icon was removed on 2026-09-08 (`c24a744`, replaced by Settings), so the instruction points at nothing | Production, in-app offline: Home recap "✈️ Fully offline — You have turned data off. Tap the signal icon at the top to use a connection when you have one."; topbar controls = Language, Settings, Saved, Search, Emergency (no network control). Copy at `js/screens/welcome.js:173`; stale comments at `js/state.js:37,51`, `js/ui-widgets.js:340`, `js/main.js:6877` | Put a "📶 Turn data on" button in that line (the handler exists: `setNetMode('online')` as in `js/screens/home.js:637`) and fix the copy | S | S3 |
| F-02 | P1 | J10, J2 | After onboarding, Home's first viewport is mostly one-off notices; the answer a just-landed traveller needs is two screens down | 375×812, P1: content area 84–746 px = 662 px; setup recap 296 px + download line 76 px = 372 px (56 %). "Right now" starts at y = 1,598; Home is 3,158 px tall (3.9 viewports). "Just arrived — first-hour guide" sits at y = 725, under the tab bar | Collapse the setup recap into one line (or into the download line) after the first render; lift "Just arrived" and a 3-item "Right now" strip above Quick access when phase is arrived/travelling | M | S3 |
| F-05 | P1 | J2, J6, J10 | The traveller's position is labelled with the nearest weather anchor, not the place they are, so a traveller at BKK is told they are in Bang Krachao | GPS 13.690, 100.750 (Suvarnabhumi) → topbar "Bang Krachao · Fri, Oct 2", weather "for Bang Krachao", Right now "Evening near Bang Krachao". Same class as the "in Mae Hong Son it says Pai" bug (`MASTER_BUILD_PROMPT.md:93`), fixed for SOS via `whereAmI()` but not for the Home title or Right now | When the nearest anchor is not a `hub` and a hub is within ~40 km, label with the hub ("near Bangkok"); keep the anchor for weather only | S | S3 |
| F-25 | P1 | J2 | Places' "Nearby" list is sorted by season, not distance, so day-trip destinations 67–76 km away sit inside "Nearby" and the nearest sight is second | Central Bangkok fix (13.756, 100.502), "🗓 October · best places first": 1. Mandarin Oriental 3.9 km, 2. Wat Pho 1.5 km, 3. Wat Arun 2.0 km, 4. Yaowarat 2.0 km, 5. Lumphini 5.2 km, 6. Ayutthaya Historical Park 67 km, 7. Amphawa 70 km, 8. Maeklong Railway Market 67 km … | Within "Nearby", sort by distance band first (≤2 km, ≤10 km, further) and by season score inside a band; label the far band "Day trips" | S | S4 |
| F-07 | P1 | J2 | "Right now" picks carry no open/closed state and are not near: at night at BKK every pick is 23–27 km away | 5/5 picks: "Street-food time", 23–27 km, "35 min–1h 30m by road"; no "Open now"/"Closes" on any row | Show open/closes-at from `hours` where parseable; when nothing is within ~5 km, say so and lead with the airport/first-hour guide | M | S4 |
| F-18 | P1 | J1, J4, J5, J6, J10 | With German chosen, the job screens stay mostly English, including Emergency | P4, UI = Deutsch, share of multi-word text nodes classified English (stop-word test, own-language `[lang]` blocks excluded): **SOS 95 % (188/198)**, Phrasebook 98 % (87/89), Places 90 % (38/42), Weather 100 % (27/27), Currency 100 %, Home 61 % (14/23). Onboarding step 2 ("Who is travelling?", "Couple", "Next →") and step 3 ("Any food allergies or diet?") are English. Mechanism: choosing German turned on the opt-in machine pass (`uiAutoTranslate: true`, 162 cached strings), but it translates at most **40 strings per render** (`MT_CAP`, `js/i18n.js:375`); SOS stayed at 93 % English across 25 s online because it does not re-render, and offline it never changes | When a language is chosen online, translate and cache the J1 path, onboarding and Home strings in one bounded batch (≈ 300 strings) instead of 40 per render; keep `data-no-mt` on numbers, prices and visa rules. Hand-check German for the SOS card as the persona language | M | S5 |
| F-03 | P1 | J9, J10 | The field-guide download starts by itself on first launch and never states its total size; on iPhone (no Network Information API) the "unknown = unmetered" rule downloads the full pack on roaming data | Started with no prompt after onboarding; line read "46 % · 24 MB", then "59 % · 31 MB" — progress only, no total. Policy in `js/offline-pack.js:17-35`: whole pack 95 MB, `unknown` treated as unmetered. P1 has no local SIM | Keep the safety tier automatic; before the 61 MB + 25 MB tiers on an `unknown` connection, show the total once ("86 MB more — on Wi-Fi?") with Download / Wait for Wi-Fi | S | S7 |
| F-21 | P1 | J6, J9 | A traveller going offline gets no forecast for where they are going: nothing caches the 10-day forecast for the next stop or the anchors around the traveller while a connection exists | P3, in-app offline on Don Det: Weather = "No saved forecast yet for this city. Connect to the internet once and tap Refresh"; only current temperatures for 7 Lao cities are cached (`mk.wx.many`). A 10-day forecast fetched earlier in Pakse would still cover these days | When online, also fetch and keep the forecast for trip stops and for the 3 nearest anchors (one request each, Open-Meteo, already used); show its age offline ("forecast from 2 days ago") | M | S6 |
| F-23 | P1 | J9 | There is no single "get ready to go offline" flow; what a traveller needs before losing signal is spread over three screens and one of them cannot be done at all | Field guide: automatic, status in Settings ("97 MB … ✓"); phrase audio: Settings → "🔊 Offline phrase audio" → select → "⤓ Download selected" (no size; Lao has no voice); map: Places → "🗂️ Saved offline areas" → pan → "⬇ Save this map view" (no size, one view at a time); forecast for the next stops: not possible (F-21). App storage reported: "about 111.0 MB" | One "Before you lose signal" card (Settings and the trip screen): ticks for field guide, phrase audio for the trip's countries, map areas around each trip stop, and forecasts for each stop, with one "Get everything (≈ N MB)" button and per-item sizes | L | S7 |
| F-15 | P1 | J2, J8 | More than a quarter of places cite only a website's homepage, which cannot confirm any of the hours, prices or coordinates shown | Parsed 783 place records: **224 (28.6 %)** cite only bare homepages (e.g. `https://www.tripadvisor.com`, `https://www.tourismthailand.org`); 609 of 1,590 source URLs (38.3 %) are homepages; 43 records have no URL at all. All are in the `*.ext.js` files (vi 71, th 55, kh 52, la 46). Example: `th-ext-bua-tong` cites `tourismthailand.org` and `tripadvisor.com` homepages for "08:00–17:00 daily" | Extend `check-place-fields` to report homepage-only citations (ratchet, like check-spacing) and replace them in content passes, most-viewed first | M | S2 |
| F-14 | P1 | J3, J8 | Most transport routes — with their prices, durations, border hours and visa fees — cite no source, which breaks the content rule and makes them impossible to re-verify | **87 of 109** route records have no `sources` field (80 %): Cambodia 18/18, Laos 20/20, Vietnam 25/25, Thailand 24/46. Example: `la-4000islands-stungtreng` states "visa on arrival … about USD 35-40", "$20–28", "departures around 09:00" with no citation (`js/data/routes.la.js:1077-1135`) | Content slice: add one cited source per route (operator page, 12Go route page, or Wikivoyage), starting with the 50 cross-border and island routes (29 of them unsourced); add a `check-route-sources` guard that fails on a route with no source | L | S2 (guard) · S10 (sources) |
| F-11 | P1 | J1 | No hospital can be called from the app: zero phone numbers exist in any hospital dataset, so "call it" is the national ambulance number only | `grep -c "phone\|tel:"` = 0 in hospitals.curated.js, hospitals.vi.js, hospitals.th.js; SOS has 4 `tel:` links, all national numbers (113/114/115/112) | Source the emergency line for the 140 curated hospitals (th 70, vi 38, kh 18, la 14) from each hospital's own site (content rule: no number without a source); render as `tel:` | L | S9 |
| F-30 | P1 | J1, all | A country-data load that fails holds any gated route on "Loading <country>…" forever: `loadCountry()` forgets the failure, the router asks again on every render, and a failed `import()` never succeeds | Found during S1, reproduced on `fix/s1-emergency` before its fix commit: one Cambodian data file returning 404, `#sos` at a Phnom Penh fix stayed on "Loading 🇰🇭 Cambodia…" for the 6 s observed, no numbers, **13,896 DOM mutations** (render loop), the file requested once. Fixed for `#sos` and `#hospital` in S1 (`c129516`: SOS in 244 ms, Cambodia's numbers, 98 mutations). Every other gated route is unchanged | Show the existing unavailable card with a Retry that imports with a fresh URL (see `loadScreenMod`), using `countryLoadFailed()` | S | S11 |
| F-04 | P2 | J5, J6 | Estimates are printed with false precision | Weather screen "Rain today 83.25 % · 7.4 mm"; Home weather tile "☔ 76.5 %" / "83.25 %" (four-model average, `28eef8b`); converted estimates "≈ €32,83–63,89", "≈ €17,75–24,84" | Round probabilities to whole percent and converted ranges to whole units at the formatter | S | S6 |
| F-06 | P2 | J2, J6 | The rain line gives morning advice in the evening | 21:45 Bangkok time: "☁️ Raining now, easing around 6pm — do an indoor morning, then head out." | Make the advice clause depend on the hour (evening: "indoor dinner, it clears by …") | S | S6 |
| F-27 | P2 | J2, J6 | Time of day comes from the device clock while forecasts are in the destination's zone, so a phone still on home time gets the wrong part of day and stale advice | Pane clock Asia/Jerusalem 17:45 = 21:45 in Bangkok: Things to do "🕑 Afternoon · UV 8 Very high", Right now "Raining now, easing around 6pm". `isOpenNow`/`partOfDay` use `new Date().getHours()` (`js/main.js:1605-1650`). All four countries are UTC+7 | Compute hour and weekday in `Asia/Bangkok` via `Intl.DateTimeFormat` for every "now" decision | S | S6 |
| F-24 | P2 | J1, J4 | Controls below the WCAG 2.2 24 px minimum on the emergency and Talk paths | 375×812, production: SOS 120 controls, 34 under 44 px, **7 under 24 px** (every "ⓘ More info" summary 20×20); Talk 590 controls, 220 under 44, **6 under 24** (audio-pack language checkboxes 13×13, ⓘ 20×20, "Open your dictionary →" 152×21); Places "About this screen" 18×24 (map markers excluded). Home: 0 under 24 | Give the ⓘ summary a 44×44 hit area (padding, not a bigger glyph); use the app's chip toggle for the audio-pack picker | S | S8 |
| F-22 | P2 | J7, J8 | A trip stop takes the country the app was last showing, not the country the place is in, and the pre-trip checklist follows the browsed country rather than the trip | Added "Siem Reap" while the active country was Laos → stored `{"title":"Siem Reap","country":"la"}`; Weather's cross-country fallback hides it (shows 🇰🇭). With that one-stop Cambodia trip, Home's checklist (768 px) lists "File the mandatory TDAC online within 72h of arrival" — Thailand's arrival card | Resolve the stop's country from the name against the anchor/place index; fall back to the active country only when the name is unknown | S | S8 |
| F-17 | P2 | J3 | The Journey planner starts blank and carries duplicate stops | Both selects open on "Choose…" although GPS is on (P3 on Don Det); 70 stops include "4000 Islands (Don Det)" and "4000 Islands (Si Phan Don)", "Hue" and "Hue / Dong Ha" | Default "From" to the nearest stop to the GPS fix; merge the two duplicate pairs (or label why they differ) | S | S8 |
| F-26 | P2 | J2 | Four separate "near me" surfaces disagree on what near means and in what order | Home "Right now" (5 picks, time/weather score, phase-gated: absent in planning), Places "Nearby · 44" (season sort, F-25), Things to do "NEARBY · 18" (weather/time sort), Near me `#nearby` (six arrival sections first, then "Closest to you"; its nav blurb promises "What is within walking distance") | Make one ranked list (distance band → open now → fit) and render it on all four; keep each screen's own header | M | S4 |
| F-19 | P2 | J10 | Where German *is* shown it mixes registers and mistranslates, and renders the brand as "Mekong" | Onboarding step 1: "Deinen Standort verwenden?" (du) followed by "Wenn Sie es zulassen…" (Sie); Home "Trage deine Reisedaten ein" (du); "the closest help" rendered "nächstgelegener Standort" ("nearest location"); the wordmark text reads "Mekong" | Pick one register (Sie, matching most strings) and mark the brand `translate="no"`/`data-no-mt` | S | S5 |
| F-08 | P2 | J10 | The onboarding city fallback is a raw, tiny native select | `select "Choose your location"` 147×17 px (WCAG 2.2 SC 2.5.8 minimum is 24×24) | Style it as the other controls (≥44 px) | S | S3 |
| F-29 | P2 | J1 | A curated hospital whose name differs from OpenStreetMap's local-script name does not absorb its OSM twin (the merge compares diacritic-sensitive words of 4+ letters), so the twin can appear as a second, unchecked hospital | Viet Duc's twin (0.55 km away) showed under SOS "Closer, capability unknown" until S1 added the Vietnamese name to the curated record. Confirmed by inspection: Chiang Rai Prachanukroh (OSM "Chiangrai Prachanukroh Hospital", 0.49 km) and Mai Châu ("Trung tâm Y tế khu vực Mai Châu", 0.00 km). Total unknown: a word-overlap heuristic flagged 16 candidates, most of them distinct hospitals | Add the local name to curated records, as "Hanoi French Hospital (Bệnh viện Việt Pháp)" does; or fold diacritics in `distinctive()` and re-count the merges | S | S9 |
| F-28 | P2 | J2, J8 | The "Sopheakmit Waterfall" place (Cambodia) sits at 13.97, 105.94 — inside Laos on both outline sets — and both cited URLs name a different waterfall | `kh-ext-sopheakmit-waterfall` in `js/data/places.kh.ext.js`: coords `{ lat: 13.97, lng: 105.94 }` (geo.js → la, ADM1 → la); sources `helloangkor.com/attractions/preah-nimith-waterfall/` and a Tripadvisor "Preah_Nimith_Waterfall-Krong_Preah_Vihear" page (by URL path; not fetched). The old Preah Rumkel anchor had the same coordinates | Re-source and re-place it from a source that names Sopheakmit | S | S2 |
| F-01 | P2 | tooling | The guard suite has been red on integration for 11 days because of a check-lazy-data false positive, so a real lazy-data regression would now be indistinguishable from the known noise | 77 flagged lines (76 routes plus one unnamed entry — the fix branch's message says "all 76 routes"); root cause and fix already on `fix/lazy-data-phrasebooks` (+1, 2026-09-25) | Merge `fix/lazy-data-phrasebooks` (owner decision; no new work) | S | — (D2) **Resolved 2026-10-02:** PR #64 (`ae93e42`) carried the identical file; 12 of 12 guards pass on `ee8fcd0` |

## 5. Personalisation inventory

What the app knows, where it uses it, where it should and does not, and where it hides instead of reordering. "Seen" = observed on screen this session; "code" = read in source.

| Signal | Where it is used (seen) | Should be used, is not | Hides instead of reordering |
|---|---|---|---|
| GPS fix (`prefs.lastFix`) | Home title, Right now, weather spot, SOS country and hospitals, Places "Near X", every distance | SOS country (uses nearest *anchor*, F-12); naming at the airport (F-05); Journey planner "From" (F-17); trip-stop country (F-22) | — |
| Language (`uiLang`) | Talk source language (seen: "Translate from German"); dates; default currency (seen: EUR for German) | the J1 path and onboarding text (F-18) | — |
| Home currency (inferred) | "≈ €32,83–63,89" next to place prices; Journey planner "$20–28 (≈ €17,75–24,84)"; Budget totals; converter (all seen) | conversions print cents on estimates (F-04) | — |
| Party (solo/couple/family/group), baby, solo-female | "Travelling as solo ✎" on Places and Things to do; SOS shows "Solo emergency guide" or "👪 For your children" (seen) | SOS hospital order for family/baby (F-10) | — |
| Diet and allergies | dish highlighting and pinned phrases (code; onboarding says so) | — | — |
| Accessibility needs, text size | onboarding "Fine-tune" (seen); ranking (code) | not checked on screen this session | — |
| Budget level, trip length, interests | "For you" ranking (code); recap "Any price — Trip plans and the 'For you' ranking…" (seen) | Places "Nearby" ranks a ฿15,000–32,000 hotel first for a traveller who never chose a budget (F-25) | — |
| Trip (stops, dates) | Home countdown "18 days to go", checklist, trip-city weather panels (seen) | checklist country (TDAC for a Cambodia trip, F-22); forecast prefetch for stops (F-21) | — |
| Saved places | Saved screen; "Quick-add from saved" on the trip screen (seen) | — | — |
| Time of day | Right now and Things to do labels and scoring (seen) | uses device zone, not UTC+7 (F-27); rain advice says "morning" at night (F-06) | — |
| Weather now / forecast | Right now forecast line, "Good in the rain" tags, cool-off button (seen) | — | — |
| Season | "wet season" label; Places sort "October · best places first" (seen) | — | season sort overrides distance inside "Nearby" (F-25) |
| Phase (planning / arrived / travelling / post) | Home blocks and the open deck (seen: planning Home has no "Right now") | — | **yes**: planning Home drops "Right now" entirely; `hidePost` / `planningOnly` drop nav items (`js/nav-groups.js:44-46`) — reorder instead, a traveller planning from the hotel lobby still wants dinner |
| Network mode | `online()` gates | the offline notice points to a removed control (F-20) | yes by design (live features vanish offline) |

## 6. Competitive table and moat

Three lookups used of the 25 allowed (Google Translate Lao support; Google Maps offline areas; Grab in Laos). Everything else is from existing knowledge and is marked as such where it matters.

| Job | Best-in-class pattern (product) | Mekong today (measured) | Gap | Adopt / beat / skip — why |
|---|---|---|---|---|
| J1 Emergency | Phone OS emergency call dials the local number for the country the phone is in; Google Maps "hospital" search with hours and a call button (online) | 1 tap from every screen; works offline; island-aware ("🚤 Across the water"); show-to-driver card at 49 px. But wrong country on 13.2 % of the area (F-12), no number when GPS ≠ browsed country (F-09), unsuitable facilities first once online (F-10), no hospital phone (F-11) | correctness, then calling | **Beat**: no other product gives an offline, capability-ranked, landmass-aware hospital list with the right number and a driver card. Fix S1 first; never imitate auto-dial (a web app cannot) |
| J2 Near me now | Google Maps: "Open now" filter, distance order, hours on every row | answer 1,598 px down on Home; Places "Nearby" season-sorted (F-25); no open/closed on any row (F-07) | open-now, distance-first | **Adopt** open-now and distance bands; **do not compete on breadth** (783 sourced places vs millions) — compete on fit, sources and "why now" |
| J3 A → B | Rome2Rio (multi-modal chain, times, prices); 12Go (buses, ferries, borders, e-tickets) | one screen with border, visa, duration, price in my currency, scams and a 12Go link, offline; 80 % unsourced (F-14); From not pre-filled (F-17) | sources, defaults | **Beat** on offline + border/visa/scam context on the route; **skip** booking (accounts and payments; static PWA) — deep-link 12Go |
| J3 in town | Grab (Thailand, Vietnam, Cambodia); LOCA in Laos (lookup: Grab does not operate in Laos) | "Getting around" names LOCA for Laos, "Grab does not operate in Laos" — matches | none found | **Skip** ride-hail; keep the per-country app guidance |
| J4 Say it | Google Translate: conversation mode, camera, offline packs (Lao supported, lookup) | 2 taps typed → Thai + audio in 0.66 s; curated offline phrasebook with audio for th/vi/km; Lao has no voice | camera/conversation (not verified here) | **Skip** competing on machine translation and camera — link out; **beat** on curated, sourced phrases with romanisation, allergy and hospital cards |
| J5 Money | XE: live and cached rates, many currencies | converter 1 tap, cached rates, budget in home currency, fair prices, lowest-fee ATM per country | false precision (F-04) | **Beat** — fair prices + ATM fees + budget in one place is not in XE |
| J6 Weather | Windy: several models, rain and wind layers, sea | four-model average, 10-day, sea and tides, trip-city panels; nothing cached for the next stop offline (F-21) | offline forecast for stops | **Adopt** prefetch + "forecast from N days ago"; **skip** radar and model maps |
| J7 Plan & remember | Wanderlog (itinerary + map, offline is paid); Polarsteps (automatic route tracking offline, journey book) | save 1 tap from a row, stops with dates, journey recorded on the device, share as a file, no account | stop country (F-22) | **Beat** on no account and on-device by default |
| J8 Before I arrive | Lonely Planet / TripAdvisor practicalities; iOverlander dated crossing reports | search finds visa, SIM, scams, tipping in 2 taps; crossings and routes undated and mostly unsourced | "last confirmed" date and source | **Adopt** a "checked <date> against <source>" stamp per crossing (no server); **skip** crowd reports (needs a server) |
| J9 Go offline | Organic Maps / Maps.me: whole-country download with routing and search; Google Maps: rectangle up to ~120,000 km², size shown before download (lookup) | field guide automatic and honest (97 MB); map one view at a time, no size; phrase audio per language, no size; no forecast | one flow, sizes first (F-23) | **Adopt** "size before download" and one "Before you lose signal" card; **skip** nationwide routing (Valhalla's WASM build is 10.0 MB before map data, `js/walk-route.js:4`) — link to Organic Maps for turn-by-turn |
| J10 First run | most travel apps: 0–2 questions, then content | 3 steps / 5 taps, then 56 % notices; German incomplete | first viewport, language | **Beat** — a Home tailored after 5 taps is rare; shrink the notices (S3) |
| Stays | Agoda (dominant here), Booking.com, Hostelworld | "Where to stay" and hostel guides with price ranges | — | **Skip** — link out; no accounts, no payments |

**Moat.** What a traveller loses by uninstalling Mekong and using the apps above:
1. One offline screen with the local emergency number, capability-tagged and landmass-aware hospitals, and a card to show the driver — in four countries, with no signal.
2. Border, visa and scam knowledge attached to the route itself, offline.
3. An offline field guide (dangerous species, dishes, produce, calls) that works in a forest or a night market.
4. Fair prices and ATM fees in their own currency, with nothing leaving the device and no account.

The plan protects it: S1 makes (1) true before anything else; S2 and S10 make "sourced" true for (2) and the places; S6–S7 make offline preparation honest.

## 7. Slice plan

One slice = one branch, one PR, one feature area, ≤ 400 changed lines, one Sonnet session unless tagged `opus`. Branch from `origin/feat/scaffold-bangkok-slice` as `fix/s<n>-<slug>` or `feat/s<n>-<slug>`.

**Order and parallelism.** Run in the waves below; slices in the same wave touch disjoint files. `sw.js` is the one shared file: its `MANIFEST` is generated, so on a merge conflict take either side and re-run `python3 scripts/build-sw-manifest.py`, then `check-cache-version.py`. Never hand-merge it.

| Wave | Slices | Why this order |
|---|---|---|
| A | S1 ∥ S2 ∥ S10 | S1 is every P0. S2 and S10 are content-only (data files and scripts) |
| B | S3 | needs S1's `js/main.js` changes merged |
| B2 | S11 | the router gate in `js/main.js`: after S1 merges, not alongside S3 |
| C | S4 ∥ S5 ∥ S9 | disjoint: S4 main.js/places/today/nearby, S5 i18n/ui-strings/welcome, S9 hospitals.curated + the SOS row renderer — S9 touches main.js, so if S4 is running hold S9 until S4 merges |
| D | S6 | needs S1 (`js/weather.js`) and S4 (`js/main.js`) |
| E | S7 | shows S6's prefetched forecasts in its checklist |
| F | S8 | touches `css/style.css` (S3) and `js/screens/trip.js` (S7) |

- [x] **S1 — Emergency: right country, right number, right hospital** · `model: sonnet` · P0
  - Findings: F-12, F-09, F-10, F-13.
  - Likely files: `js/main.js` (`sosScreen` ~6427–6500; route gate ~6996–7030), `js/data/hospitals.js` (`nearestCare` ~197), `js/screens/medical.js` (~197), `js/screens/firstaid.js` (~104), `js/weather.js` (anchors ~176–192), new `js/data/emergency-numbers.js` (eager, four countries, values copied from `js/data/info.*.js`), `index.html` (modulepreload), `sw.js` (manifest).
  - Do: decide the SOS country by point-in-polygon on `js/data/geo.js` outlines (anchor only as fallback); read numbers from the eager module; gate `#sos` on the displayed country; rank hospitals by capability (curated `er`, `peds` first for family/baby) before distance, untagged OSM points as "also nearby"; correct the four anchors and add Mukdahan and Chiang Khong (cited coordinates).
  - Acceptance: J1/P2 **N → Y** — first open of `#sos` with GPS in Hanoi after browsing Thailand shows `tel:113` and `tel:115` above y = 812, and the first hospital carries 🧒 for party = family. J1/P3 **N → Y** — fixes 13.958, 105.917 and 13.981, 105.940 show "Laos — call for help" and `tel:1195`. Border-town check (this report's script, 20 towns): wrong SOS country **9/20 → 0/20**.
  - **Done 2026-10-02** on `fix/s1-emergency` (`3fb4be1`, `c129516`, mk-v0.600.0; 14 files, +215 −73), PR via compare link, not yet merged. J1/P2 **Y** (`tel:113`/`tel:115` at y ≤ 440, French Hospital 🧒 first). J1/P3 **Y** (Laos, `tel:1195`). Border towns **9/20 → 2/20**: the Chong Mek point was mislabelled in this audit (Wikipedia puts the town at 15.133, 105.467, 13 km west, where the app shows Thailand), and Hat Lek is a checkpoint on the line where the screen says "within 10 km of Thailand". Grid: the answer lies inside that country's ADM1 polygons in all 10,257 cells (was 13.1 % wrong).
  - Deviations: the outlines alone were wrong at Nong Khai and Poipet, so within 10 km of a border the ADM1 polygons decide (7.5 % of the area; the router loads both sides' sets once). Mukdahan and Chiang Khong anchors **not added** — `js/weather.js` defines a non-hub anchor as a city with place records, and they have none; the country decision no longer reads anchors. Preah Rumkel corrected from Wikidata Q56321713. Added: the location line names a place only when it is in the shown country; Viet Duc's curated name gained its Vietnamese name (F-29); emergency routes no longer spin on a failed country load (F-30).
- [x] **S2 — Content truth: fix what the sources contradict, and make the gaps visible** · `model: sonnet` · P1
  - Findings: F-16, F-15, F-14 (guard only), F-28.
  - Likely files: `js/data/places.kh.ext.js` (Jaan Bai), `js/data/places.vi.js` / `places.vi.ext.js` (Temple of Literature, Núi Bà Đen, HCMC practical), `js/data/places.th.ext.js` (Pattaya), `js/data/places.la.ext.js` (Pak Ou, Savan Resorts), `scripts/check-place-fields.py` or a new `scripts/check-sources.py`, `scripts/README.md`.
  - Do: correct the five contradicted facts from their own sources; replace the 404 and 403-only citations; add a ratchet guard that reports homepage-only place citations (baseline 224) and unsourced routes (baseline 87) and fails if either rises.
  - Acceptance: the same 10-place spot check (seed 20261002) **3/10 → ≥ 8/10** supported; the guard prints both baselines and passes.
- [x] **S3 — A useful first screen for a traveller who just landed** · `model: sonnet` · P1
  - Findings: F-02, F-05, F-20, F-08. Decision D5 accepted: in planning, when GPS is inside one of the four countries, show a compact "Right now" (reorder, do not hide).
  - Likely files: `js/screens/home.js` (title ~94, block order), `js/screens/welcome.js` (setup recap ~150–180, city select), `js/main.js` (Right now label), `css/style.css`.
  - Do: collapse the setup recap to one line after its first showing; in arrived/travelling, put "Just arrived" and a three-pick "Right now" strip above Quick access; label the title with the place (`whereAmI`/hub), not the anchor; give the offline line a working "📶 Turn data on" button; style the city select at ≥ 44 px.
  - Acceptance: J10/P1 first viewport **56 % → ≤ 15 %** notices; J2/P1 Home "1st VP" **N → Y** (first pick above y = 746); BKK fix titled "Bangkok" or "Samut Prakan", not "Bang Krachao"; offline mode → online in **1 tap** from Home.
- [x] **S4 — Near-me lists: nearest first, and say what is open** · `model: sonnet` · P1
  - Findings: F-25, F-07, F-26 (F-26 only if it fits in 400 lines; otherwise split to S4b). Decision D4 accepted: one ranking (distance band → open now → fit) for Home, Places, Things to do and Near me.
  - Likely files: `js/main.js` (`isOpenNow`, `whyNow`, `rightNowSection`), `js/screens/places.js` ("best places first"), `js/screens/today.js`, `js/screens/nearby.js`.
  - Do: distance bands (≤ 2 km, ≤ 10 km, "Day trips") with season score inside a band; an "Open now · closes 22:00" / "Closed · opens 08:00" line on every row whose `hours` parse.
  - Acceptance: J2/P1 at 13.756, 100.502 — Places "Nearby" row 1 is the nearest place in band 1 (not Mandarin Oriental at 3.9 km); rows with an open/closed line **0/5 → 5/5** on Home "Right now" where hours parse; no place > 10 km inside the first band.
- [x] **S5 — The emergency path in the traveller's language** · `model: sonnet` · P1
  - Findings: F-18, F-19.
  - Likely files: `js/i18n.js` (`MT_CAP` ~375, `autoTranslateTree` ~458), `js/data/ui-strings.de.js`, `js/screens/welcome.js` (wordmark `data-no-mt`).
  - Do: on choosing a language while online, translate and cache the SOS, hospital, first-aid, onboarding and Home strings in one bounded batch; keep `data-no-mt` on numbers, prices and visa rules; fix the du/Sie mix in German.
  - Acceptance: J1/P4 SOS English share **93 % → ≤ 20 %** on first open after choosing German online, and the same after going offline; onboarding steps 2–3 in German.
- [x] **S6 — Weather and "now": prefetch, honest numbers, local clock** · `model: sonnet` · P1
  - Findings: F-21, F-04, F-06, F-27.
  - Likely files: `js/weather.js` (prefetch), `js/weather-ui.js` (formatters), `js/currency.js` (converted ranges), `js/main.js` (`forecastOutlook`, `partOfDay`, `isOpenNow` hour).
  - Do: while online, keep the 10-day forecast for trip stops and the three nearest anchors, show "forecast from N days ago" offline; round probabilities and converted ranges; hour-aware rain advice; compute hour and weekday in `Asia/Bangkok`.
  - Acceptance: J6/P3 offline **N → Y** (Don Det forecast shown, with age, after one online session); "83.25 %" → "83 %"; with the device on UTC+3 at 21:45 Bangkok time the label reads night, not "Afternoon".
  - **Done 2026-10-03** on `fix/s6-weather-now` (`384d5f0` + `2bf6089`, mk-v0.607.0; 11 files, +256 −99), merged 2026-10-03 as PR #71 (`fa46b52`), which also landed S4. Stacked on S4 (`7b3b013`) with integration `cc792a4` merged in, so merging S6 lands S4 too. J6/P3 offline **Y**: Don Det and Don Khon shown offline with "Forecast from N d ago · offline" and the 10-day list starting today. "83.25" average → "83%"; EUR "$20–28 (≈ €18–25)". Device 17:45 = 21:45 Bangkok: Things to do "Tonight", Home "Night near Don Khon", rain line "easing around 11pm — a good night to stay in".
  - Deviations: offset arithmetic (`regionNow()`, `js/util.js`, UTC+7) instead of Intl — same answer for all four countries, and its ISO string compares with forecast timestamps. Things to do now uses `partOfDay` buckets (night from 21:00, as on Home) and hides today's peak UV after 17:00. Added a bounded forecast cache: a record was ~350,000 characters with no eviction; now ~248,000 (averages rounded, all-null models not stored) and the newest 8 stay, with stops/anchors/focus protected (`setForecastKeep`). Also fixed: a tapped Refresh on Weather did nothing for 2 min after the screen's own attempt (wrong retry-gap key, `2bf6089`).
  - For S7: `prefetchForecasts()` (main.js, exported) keeps stops + the 3 nearest anchors on a 3 h window; `forecastKeepSpots()` is module-private (export it to list per-stop status). `getCachedWeather(key)` returns the as-of-now view: `null` when nothing usable is saved, `fetchedAt` for the age, `current.fromForecast` when "now" is the forecast hour.
- [x] **S7 — One "Before you lose signal" flow** · `model: opus` (offline work) · P1
  - Findings: F-23, F-03.
  - Likely files: `js/offline-pack.js`, `js/screens/settings.js`, `js/offline-areas-ui.js`, `js/screens/trip.js`, `js/screens/home.js` (pack line total).
  - Do: one card with ticks for field guide, phrase audio for the trip's countries, map areas around each stop, forecasts for each stop (S6), sizes before download, one "Get everything (≈ N MB)" button; ask once before the 86 MB tiers on an `unknown` connection (decision D1, accepted).
  - Acceptance: J9/P3 **three screens and 7+ taps → one screen and 2 taps**, with the total size shown before anything downloads.
  - **Done 2026-10-03** on `feat/s7-offline-ready` (`a77d0c7`, mk-v0.608.0; 15 files, +461 −107, about 35 lines of them moved from `js/map.js`), PR via compare link, not yet merged. J9/P3 **Y**: Home → Settings → "⤓ Get everything (≈ 97 MB)", one screen and 2 taps. The card (Settings after Install; trip screen after the itinerary) listed the field guide (87 MB left), "Lao audio: no offline voice exists yet", Khmer audio ≈ 1.2 MB, maps of Don Det ≈ 3.4, Stung Treng ≈ 2.4 and Kratie ≈ 3.1 MB, and three forecasts; after about 3 minutes every row was ticked. D1: with the connection type unknown, the 56 safety photos downloaded alone and Home then asked "The rest of the field guide is 88 MB: download it now, or wait for Wi-Fi?"; the running line reads "46% of 63 MB".
  - Deviations: sizes are measured, not hand-kept. The field-guide tiers are generated from the files (`scripts/build-pack-sizes.py`, verified inside `check-cache-version.py`): 9.1, 63.3 and 24.5 MB, not the 9 + 61 + 25 in the old comments. A voice clip is 13.3 KB (36 real clips). A map tile is 18 KB, which overstates towns (the three saved areas measured 10.1–11.4 KB per tile, 2.2/1.5/1.8 MB stored) and understates central Bangkok (about 31 KB). A stop's map is an 8 km square at zooms 13–15, recorded as a saved area (listed and deletable under Places); a stop whose title names no known city gets no map. Also fixed: "Not now" never stopped a running tier (new `STOP_MEDIA`; stopped at 35 of 381), and Settings' field-guide card stopped updating after its first progress event (`card.isConnected` on a folded card; it read "12 MB" with 97 MB stored). Found, not fixed: one 96-clip Khmer pack raised `navigator.storage.estimate()` from 9.3 to 700.6 MB (Chromium pads each opaque clip about 7 MB in quota accounting); filed as a separate task.
  - For S8: `js/screens/trip.js` gains one import and `wrap.append(offlineReadyCard())` after the itinerary card; nothing else in that file changed.
- [x] **S8 — Small correctness: planner, trip stops, tap targets** · `model: sonnet` · P2
  - Findings: F-17, F-22, F-24.
  - Likely files: `js/main.js` (Journey planner), `js/data/routes.*.js` (duplicate nodes), `js/screens/trip.js` (stop country via `countryForCityName`, see `js/screens/explore.js:80`), `css/style.css` (ⓘ hit area), `js/screens/phrasebook.js` (audio-pack chips).
  - Acceptance: J3/P3 taps **5 → 3** (From pre-filled from GPS); "Siem Reap" added while browsing Laos stored as `kh`; controls under 24 px on SOS **7 → 0** and Talk **6 → 0**.
  - **Done 2026-10-03** on `fix/s8-small-correctness` (`f17e80e`+`50daed7`+`c0e6af0`, mk-v0.611.0; 12 files, +131 −44), PR via compare link, not yet merged. Verified live in-browser, not just by guard: GPS fix at Don Det pre-fills "From" to "4000 Islands (Don Det)" (was "Choose…"); typing "Siem Reap" with Laos active and **zero countries loaded** stores `country: "kh"` (was `"la"`); every `.info-tip` ⓘ measures 44×44 tappable / 20×20 visible (7/7 on SOS); the audio-pack picker's checkboxes are now 210×48 chips with full add/remove-selection parity.
  - Deviations: `countryForCityName` (was explore.js-private) moved to `render-utils.js` so `trip.js` could call it without a lazy screen module reverse-importing another one — and made it check the eager `WEATHER_SPOTS` anchor list before the loaded-places index, since the places-only version only resolved a name once that country's data had already loaded (no help for a traveller's very first stop — the audit's own repro needed this). routeNodes' "From" default now tries GPS-nearest first, old active-country-capital logic kept as the no-fix fallback. Also merged two duplicate route-graph node pairs found in passing ("4000 Islands (Si Phan Don)"/"(Don Det)", "Hue"/"Hue / Dong Ha") — these silently broke multi-hop routing through those cities (Pakse↔Stung Treng via the islands had no graph path at all). "Open your dictionary →" tap target fixed by CSS rule only (not exercised live — no saved translation existed in the fresh test session to render that section); confirmed by a synthetic element carrying its class.
- [x] **S9 — Call the hospital** · `model: sonnet` · P1 (content)
  - Findings: F-11, F-29. Decision D3 accepted: one citation per number, international and provincial hospitals first.
  - Likely files: `js/data/hospitals.curated.js`, the SOS row renderer in `js/main.js`, `js/screens/medical.js`.
  - Do: add each curated hospital's emergency line from its own website, one citation per number (content rule: no number without a source); render 📞 as `tel:`.
  - Acceptance: J1 "call it" — curated hospitals with a sourced `tel:` **0/140 → ≥ 100/140**.
- [x] **S10 — Cite the routes** · `model: sonnet` · P1 (content)
  - Findings: F-14.
  - Likely files: `js/data/routes.kh.js`, `routes.la.js`, `routes.vi.js`, `routes.th.js`.
  - Do: one source per route (operator page, 12Go route page, Wikivoyage), the 50 cross-border and island routes first; record a `verified` month; correct any price or time the source contradicts.
  - Acceptance: unsourced routes **87/109 → ≤ 40/109**, with all 50 cross-border and island routes sourced.
- [x] **S11 — Never spin on a failed load** · `model: sonnet` · P1
  - Findings: F-30 (the emergency routes are already fixed by S1).
  - Likely files: `js/main.js` (the country-data gate in `render()`, `countryLoadingScreen`), `js/data/regions.js` (`countryLoadFailed`, a fresh-URL retry).
  - Do: when `countryLoadFailed(cc)`, show the existing unavailable card with a Retry that re-imports with a fresh URL, instead of re-mounting the loading screen. Run after S1 merges, and not in parallel with another slice touching `js/main.js`.
  - Acceptance: with one country file returning 404, `#places-kh` shows the unavailable card within 1 s and makes **< 200** DOM mutations in 6 s (S1 baseline on `#sos`: 13,896).

## 8. Owner phone checklist

What this environment could not verify. One line each: the test, then the expected result.

1. **Real GPS on the move** — open Home, walk 300 m: the title and "Right now" distances update without a reload.
2. **SOS at a border town** (after S1) — open SOS in Mukdahan, Nong Khai or Hà Tiên: it shows that town's own country and number.
3. **Airplane mode, cold** — force-quit, enable airplane mode, launch from the home-screen icon: Home renders; SOS shows numbers and hospitals; no "Opening…" card stays up.
4. **iOS Safari audio** — Talk 🔊 and a phrasebook row with the ring/silent switch both ways: audio plays, "Stop" stops it.
5. **Microphone** — Talk 🎤 in Safari: speech appears as text; "✓ Done" ends listening; Translate runs on it.
6. **Camera** — "📷 Point & translate a Thai sign" on a real sign: Thai is read and translated.
7. **Xcode wrapper** (`Mekonging Xcode/` WKWebView) — SOS `tel:` links open the dialler; the location prompt appears once only.
8. **Phone on home time** — set the time zone to Europe/Berlin in Thailand at 22:00: Things to do says night, not "Afternoon" (after S6).
9. **MapLibre on a phone** — Places map in Siem Reap with "Lowest-fee ATMs" on: ACLEDA pins paint; tapping one shows the fee note.
10. **First install on roaming** — fresh iPhone install on mobile data: note what the field guide download does (D1), and whether a total size is shown.
11. **Unexpected reload** — leave the app open 10 minutes after a first install and type in Search: the page must not reload mid-typing (observed once in this session; cause unknown).

## 9. Decisions needed

**All five recommendations were accepted by the owner on 2026-10-02.** D2 needed no action: PR #64 had already merged the identical guard fix; `fix/lazy-data-phrasebooks` and `fix/lazy-data-phrasebooks-gate` are now redundant.

| # | Decision | Recommended option | Why |
|---|---|---|---|
| D1 | On an iPhone (connection type unknown), should the 86 MB beyond the safety tier download without asking? | **Ask once**, with the size and "Wait for Wi-Fi" (S7). Keep the 9 MB safety tier automatic | P1 has no local SIM; roaming is sold by the megabyte (the code comment says so, `js/offline-pack.js:17-19`) |
| D2 | Merge the guard fix so the suite is green again? | **Merge `fix/lazy-data-phrasebooks`** now; take `ci/guards-workflow` separately if CI is wanted (it carries the same fix) | a red-for-11-days guard hides real regressions (F-01) |
| D3 | Source hospital phone numbers (S9)? | **Yes**, starting with the international and provincial hospitals travellers use; one citation per number | "call it" is a J1 requirement; today only national numbers can be dialled (F-11) |
| D4 | One ranking for all four near-me surfaces (F-26)? | **Yes**: one function (distance band → open now → fit) rendered by Home, Places, Things to do and Near me; keep the four entry points | the four lists disagree today; one ranking also halves the test surface |
| D5 | When the trip is "planning" but GPS is inside one of the four countries, show "Right now"? | **Yes, compact** — reorder rather than hide | a traveller planning the next stop from a hotel still needs dinner tonight (inventory, Phase row) |

## 10. Considered and rejected

| Idea | Why not |
|---|---|
| Auto-dial the emergency number, or hand off to the phone's SOS | a web page cannot; `tel:` links are the ceiling |
| Nationwide offline turn-by-turn routing | Valhalla's WASM build is 10.0 MB before map data (`js/walk-route.js:4`); link to Organic Maps instead |
| Crowd-sourced border reports (iOverlander-style) | needs a server and accounts; use a dated "checked against <source>" stamp instead |
| In-app booking (12Go, Agoda, Grab) | accounts, payments and a server; deep links only |
| Competing with Google Translate on camera and conversation | not winnable offline in a PWA; link out, keep the curated phrasebook |
| Turning the network back off by default | decided in `a6c8c03` (2026-09-07); the remaining problem is honesty about size (D1), not the default |
| Hand-translating every screen into 29 languages | the project says it cannot verify that (`js/i18n.js:366-367`); batch the machine pass for the J1 path, hand-check German |
| Removing the 67–76 km places from Places | they are useful day trips; move them to a "Day trips" band (S4) |
| Putting weather anchors on the SOS country decision with more anchors near borders | still nearest-point logic and still wrong on islands and rivers; point-in-polygon on the shipped outlines is exact enough and already on the device |
