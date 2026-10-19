# Handoff — 2026-10-19 (slice M3a: CSP tightening, self-hosted tesseract, check-secrets)

## Shipped
- PR #123 (the release-order docs) was merged by owner approval at the start of this session, as feab64d.
- M3 is split in two, because the owner steps (SQL, Security Advisor, iPhone) do not fit in one session alongside the rest. M3a: branch `feat/m3a-csp-secrets`, [PR #124](https://github.com/SamuelLClemens/Mekonging/pull/124), commit a749fd8, `mk-v0.644.0`. It ships before any sign-in token can exist on the origin (EXCHANGE §16, item 2).
  - CSP (`index.html`): `script-src 'self' 'wasm-unsafe-eval'` (unpkg.com and cdn.jsdelivr.net removed); `worker-src 'self' blob:`; cdn.jsdelivr.net removed from `connect-src`. Nothing was added: the §2 Supabase and Turnstile entries go in M3b with the code that uses them.
  - `lib/tesseract/` (14 MB): tesseract.js 5.1.1, tesseract.js-core 5.1.1 (only the two LSTM cores the worker can pick: SIMD and plain) and the tha, vie, khm and lao `4.0.0_best_int` traineddata. These are the exact files production loaded from unpkg and jsdelivr. Each npm tarball matched the registry's sha512 `dist.integrity`. `lib/tesseract/README.md` records the sources and how to update.
  - `js/screens/signtranslate.js` passes `workerPath`, `corePath` and `langPath` into `lib/tesseract/`, resolved from `import.meta.url`.
  - `scripts/check-secrets.py` (EXCHANGE §2): whole-key patterns, the publishable key allowed in `js/market-config.js` only. It scans tracked and untracked, non-ignored files, prints `file:line: kind` and never the value, and self-tests on 6 planted fakes and 4 near-misses before every scan. It is in `scripts/README.md`, `guards.yml` and the CLAUDE.md guard loop (17 guards).
  - `docs/PLAN.md` release order now records the split.

## Verified
Headless Chrome over CDP, fresh profile per run, `127.0.0.1`, 375 x 812 at device scale 2. `document.hidden` was false throughout. The driver is `scratchpad/ocr/ocr_e2e.py` (not committed).
- OCR end to end through the real screen in all four languages. A 640 x 480 JPEG of a two-line sign (exit and toilet) played as Chrome's fake camera (`--use-file-for-fake-video-capture=<file>.mjpeg`), `#signtranslate-<code>` was opened, and Capture was pressed.
  - Times: vi 6.7 s and km 5.2 s, both read exactly; th 4.6 s, line 1 exact and line 2 without its tone marks; lo 7.3 s, one character off on line 1 and a tone mark lost on line 2. These are the same engine and data as before, so accuracy is unchanged.
  - Per run: 240 to 254 requests, 0 off-origin, 0 errors or exceptions, 0 `securitypolicyviolation` events. The page and blob-worker sessions were both attached.
  - Server log: each tesseract file came from `/lib/tesseract/` with HTTP 200.
- The non-SIMD core, forced through `corePath`, read the Thai sign identically on the bumped tree.
- Negative control: `Tesseract.recognize()` with tesseract's default jsdelivr paths. The blob worker logged a `script-src 'self' 'wasm-unsafe-eval'` violation and the call rejected with `NetworkError: Failed to execute 'importScripts'`. This proves a blob worker inherits the page's CSP.
- `check-secrets`:
  - It passes on the tree (348 text files) and passes `docs/EXCHANGE.md` on its own.
  - A planted file holding a fake `sb_secret_` key failed (exit 1, `zz-planted-fake.js:3: Supabase secret key`); the file was removed.
  - A deliberately broken pattern made the self-test refuse to scan (exit 1).
- All 17 guards pass, as do `check-place-fields --assert`, `port-themes --check` and `check-cache-version`.
  - The cache-version changed-file list is `index.html`, `js/main.js`, `js/screens/signtranslate.js`, the four `lib/tesseract` scripts and `sw.js`.
  - `jsc -m` parses `signtranslate.js`, `main.js` and `sw.js`.
  - `jsc -m scripts/validate-jsc.mjs`: 18,097 of 18,097 checks, exit 0.
- CI on PR #124: the guards check was pending at handoff.

## Not done / known issues
- New in M3a:
  - M3b is the rest of M3; see its prompt below.
  - iOS wrapper, unverified: `sync-web.sh` copies `lib/`, so the next wrapper build gains about 14 MB. Inside the wrapper, OCR now loads from `mekong://`. Whether WebKit routes a blob worker's `importScripts` and `fetch` through `WebSchemeHandler` has not been tested. Check Point & translate in the wrapper at its next rebuild.
  - Offline OCR after first use is untested. The `/lib/` files are cached cache-first by `sw.js`, and tesseract keeps the language data in IndexedDB, but whether the blob worker's `importScripts` is served by the service worker offline was not proven. The screen's help text ("needs the internet for both steps") was left alone.
  - The `.traineddata.gz` files are not in the service-worker manifest (it hashes code only). A release drops the service-worker copy; the IndexedDB copy stays.
  - `check-js-syntax` skips `lib/` by design, so the vendored scripts are proven only by running them.
- Carried from D5 Laos:
  - Homepage-only records: 21 (th 1, vi 7, kh 5, la 8, all filed `open`). Unsourced routes: 0. 2 place records still name a source with no URL: th (`th-ext-rca-royal-city-avenue`, `th-ext-nimmanhaemin-road-bar-scene`). Edit them by hand: `--install` refuses them.
  - Who tourismlaos.org is: its footer names the Tourism Marketing and Promotion Department of the Ministry of Culture and Tourism, so it is the ministry's own site. 46 leftover entries in 8 data files still carry the label "Lao National Tourism Administration" (and 4 say "Ministry of Information, Culture and Tourism"). See Open decision 13.
  - tourismlaos.org's robots.txt disallows every crawler except Googlebot. Nothing was crawled: pages were found through search and read once each in the in-app browser. Its province pages keep the per-attraction text in hidden "Read more" blocks, so read them with `document.body.textContent`, not `innerText`. Two Tourism Laos posts that look like pages about a place are reposts and were not cited as its own pages: the 2023 Patuxay post credits wearelao.com, and the 2025 Black Stupa post credits the Laotian Times.
  - Discover Laos Today is a booking platform ("supported by Laos Tourism Board"). Its pages are cited only for Tad Katamtok and Tad Yuang, where the card already cited it. Its sitemap omits some pages (Tad Katamtok is not in it).
  - Cards that disagree with the page now cited, left unchanged:
    - Tad Champee: Wikivoyage gives a 30,000 kip entry and the card 10,000 to 20,000. Tad Yuang: Wikivoyage 40,000 kip.
    - Tad Katamtok: the Discover Laos Today page puts it in Sekong Province, about 47 km east of Paksong, and the card says Paksong (coordinates 15.07, 106.30, unchecked). Tourism Laos's Xekatam Waterfall (100 m, Huay Katam River) is probably the same fall but does not use the card's name, so it was not cited.
    - Plain of Jars Site 2: Tourism Laos gives 20 km south-west of Phonsavan on one section and 25 km south in another, and the card says 25 km. Wikivoyage's Site 2 entry is 30,000 kip against the card's 10,000 to 20,000.
    - Savannakhet Dinosaur Museum: the Lao article says 8:00 to 12:00 and 13:00 to 14:00, Wikivoyage 08:00 to 11:30 and 13:30 to 16:30, and the card 08:00 to 12:00 and 13:00 to 16:00.
    - Mekong slow boat: Wikivoyage gives 200,000 kip to Pak Beng and 400,000 to Luang Prabang (Dec 2024), and the card's low is 500,000.
    - Vang Vieng rentals: Wikivoyage gives bicycles at 60,000 kip and motorbikes at 170,000 to 200,000, and the card says scooters from about 60,000. It names no buggies.
    - Pakse to Thakhek: Wikivoyage says 8 to 9 h; 12Go shows 7 h on a sleeper; the card says 6 to 7.5 h.
  - Thin matches, kept because each page names the place: the Thakhek night market (Wikivoyage names night food stalls, no grills), the Thakhek square guesthouses (the square is named in Eat, not in Sleep), the Nong Khiaw homestays (no host named), Vientiane long-stay (one serviced-apartment block), Vang Vieng riverside bars (Travelfish names a sunset bar, not the riverside decks), and the Bolaven coffee tour (a province page, not an operator).
  - Coordinates not checked: the Tad Champee and Tad Yuang cards sit within 0.3 km of each other (15.192, 106.128 and 15.19, 106.13) although Wikivoyage puts them 38 and 40 km from Pakse. The Wikipedia coordinate for Champasak town (14.84, 105.75) is about 14 km from the card's (14.8933, 105.8722) and looks wrong; the card was kept. The Wikipedia and Wikidata coordinate for That Sikhottabong (Q7711276) is in Thailand; it was not fixed upstream.
  - No operator page was reachable for the six routes. Lao Airlines' schedule pages name neither Phonsavan nor Savannakhet in their text, and `kpl.gov.la` (the Lao news agency's report on Southern Bus Station fares) does not load from here. Wikivoyage names Lao Airlines, Lanexang Airways and Lao Skyway for the Phonsavan flights.
  - Hosts that block curl and were read in the in-app browser: 12Go, UNESCO, Travelfish, Tourism Laos (robots.txt). The 12Go page title appears a step late in the tab list; read `document.title` after a short wait.
- Carried from D5 Cambodia:
  - Who tourismcambodia.com and .org are (Open decision 11). tourismcambodia.org's own About page calls it "an independent guide" that earns booking commission; tourismcambodia.com sells tours and hotels. The ministry's own sites are tourism.gov.kh (script-rendered) and visitcambodia.com (Cloudflare). 50 leftover entries in 6 data files still carry a "Ministry of Tourism" label on these two hosts.
  - Citations that cannot be read from here, or are broken: `cambodia.panda.org` (certificate mismatch), `wildlifealliance.org/chi-phat-ecotourism/` (404), `travelguide.michelin.com` (does not resolve), `angkorenterprise.gov.kh` and `visitcambodia.com` (Cloudflare).
  - Cards that disagree with the page now cited, left unchanged: Long Beach (Sok San) and Long Set Beach (4K Beach) may be one beach (Open decision 12); Yeak Laom's direction from Banlung; Kampot Night Market is mostly clothes; Kratie to Banlung lists only buses on 12Go; Phnom Sampov's page is Sampeou Mountain; Ka Tieng Waterfall's page has no figures.
  - No Cambodian operator page was reachable for Kampot to Kep, Kampot to Sihanoukville or Kratie to Banlung.
  - Pages cited for stay and food clusters name the place or street but do not support the card's prices. The check was that the page names the place; figures were compared only where noted.
  - The preview entries `mekong-d5kh` and `mekong-d5la` are in the parent folder's shared `.claude/launch.json`, uncommitted there, like the other entries.
- Carried from D5 Vietnam and Thailand:
  - 7 Vietnamese records are filed `open`, and Nan Walking Street stays `open`.
  - On 12Go, the `dalat` slug serves an empty "Travel Options" placeholder; the real slug is `da-lat`. Check a page's title before citing it.
  - Banh It Cham Towers: the card says 11th to 12th centuries, and Wikivoyage says 10th to 11th. The card is unchanged.
  - La Siesta's cited `www.lasiestahotels.com` homepage returns Cloudflare 526. The bare domain works and is cited.
  - Airline route pages were not tried for the Vietnamese and Thai flight options; 12Go lists the flights.
  - 12Go headline fares are live and date-dependent. They back operators, modes and durations better than fixed fares; no fares were changed.
  - English Wikipedia's Huai Nam Dang infobox places the park about 55 km from the viewpoint (an error in the article). Pong Dueat hot springs' coordinates (19.28, 98.63) are rounded and were not checked.
- Carried from Q1 (all in `docs/AUDIT_375.md`, nothing fixed):
  - The audit driver is not in the repo. It is in the shared notes folder (see the Q2 prompt).
  - Empty states only, `th` only for `{cc}` routes, no detail screens or sheets. The base moved after the audit and was not re-measured.
  - `scripts/route-sweep.js` flags 170 zero-size controls on `#weather-th`; they are `content-visibility` artefacts. Its `EXTRA` list has no `#market`.
  - The `#map` `getSource` exception was seen in 1 of 3 light loads and 0 of 3 dark loads.
  - 66 of 77 routes carry body controls under 44 px; the dark calendar's selected day is 1.21:1; the journey credits panel covers 16.6% of its map.
- Carried from D4:
  - 512 places have no `localName` (th 153, vi 125, kh 92, la 142). There is no OpenStreetMap name lane: Overpass fails from this machine and Nominatim name search found a native name for 1 of 12 places. Nominatim does resolve coordinates by name (D5 Laos used it).
  - Cards mix the newer native-only names with older "native · romanisation" values.
  - Six activity cards carry the venue's name, and the Ho Chi Minh Mausoleum Complex card carries the mausoleum's.
  - `fetch-place-photos.py` still exits 0 when lookups fail.
- Carried from the exchange slices and earlier:
  - The top ~3 px of the tab bar show content scrolled beneath the retro stripe.
  - Meetups have no chip until M4, and the unseen-notifications badge waits for M5.
  - The Market chip labels (Items, Rooms, Rides, Cash) are English only. On `#market-items` two chips show as pressed.
  - "Traveller board" remains on the Travel circle card and the Near me chip. Malay "Laman utama" is truncated in the tab bar.
  - Two Vietnamese photos are archival black-and-white images. The Museum of Cham Sculpture credit reads "Unknown authorUnknown author".
  - Eight Vietnamese activity cards use their landmark's image.
  - Some Cambodian and Lao photos are flagged: the Skuon vendor, the Muang Sing market faces, Tonle Bati showing the lake, and Phare Circus not fetched.
  - Tall portrait photos are uncapped (Phanom Rung is 548 px at 375 px wide).
  - Free places print "฿0 (≈ $0)" instead of "Free".
  - `js/main.js` is 7,558 lines; the ceiling is ~1,500.
  - The main checkout is at ddf57b9, behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
Closed on 2026-10-19 by the owner (recorded in `docs/PLAN.md`, Bangkok build-out, Owner rulings): 1 (PR #118 is merged), and 2, 3, 4, 5 and 7 accepted. Closed later the same day in a status review (recorded in `docs/PLAN.md`, Release order): 9 (commit the audit driver, Q2), 11 (relabel the 50 "Ministry of Tourism" entries as "Tourism Cambodia") and 12 (the Long Beach coordinates check) accepted, and M3 follows D5 Laos. M3 was split into M3a (PR #124) and M3b in the M3a session. The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Legal, for Omer Hanegbi or Omri Siri: the questions in `docs/EXCHANGE.md` §14 (the terms and privacy policy gate M9, and cash swap gates M10) and the dispensary question in `docs/PLAN.md`, Bangkok build-out. The M3 owner actions are done (see the M3b prompt below).
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
13. Relabel the 46 leftover "Lao National Tourism Administration" entries (and 4 "Ministry of Information, Culture and Tourism") on tourismlaos.org as "Tourism Laos" (data text only; it bumps the version)? The site's footer names the Tourism Marketing and Promotion Department of the Ministry of Culture and Tourism. Recommended: yes, in one small data slice together with decision 11.
14. Add a coordinates check slice? D5 Laos checked 2 of 185 Lao pins and both were wrong (one 28 km, one in Thailand), and Nominatim resolves coordinates by name from this machine. Recommended: yes, one country per session, starting with Laos's remote sites (waterfalls, caves, lakes), flagging any record more than 2 km from its OSM object. It would also settle decision 12.
15. Where "D5 tidy" (items 11 and 12) sits after M3b, and whether it also takes item 13. Recommended: right after M3b, with item 13 folded in, because all three are small data edits.

## Next session prompts
PR #124 (M3a, `mk-v0.644.0`) is open. Order (owner, 2026-10-19): M3 next, now as M3b, stacked on M3a; Q2 can run alongside (tools only). The order after M3b is open (decision 15): "D5 tidy" is recommended before Bangkok B1.

Exchange M3b, accounts and sign-in: backend and screens (next; stacked on M3a, PR #124). The owner actions were done on 2026-10-19:
- Supabase Free in Singapore, project ref `xnruspjauhmcrqxmjmxg`.
- Resend SMTP with the sender `signin@mekonging.com`; DKIM, SPF and DMARC (p=none) are live.
- A Turnstile widget (Managed, hostname www.mekonging.com) whose secret is in Supabase Attack Protection.
- Auth settings: the Site URL and the single Redirect URL are `https://www.mekonging.com`; OTP expiry is 900 s; the email rate limit is 30 an hour; both templates follow §5.
- `/auth/v1/settings` showed email as the only provider, with anonymous sign-in off.

Not verified from here: the Supabase MFA (owner-reported), the schema and RLS defaults chosen at project creation, and a real sign-in email (none sent yet). Every key and password stays in a dashboard or a password manager, never in the repo or in chat.

> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §2 to §5, §8 (the display-name filter), §16 and §17 (M3). Run /slice for slice M3b: accounts and sign-in, backend and screens (closed beta).
> **Start.**
> - Run `git fetch` and `gh pr list --state all`. Confirm PR #124 (M3a) has merged and no PR is open; if #124 is still open, ask the owner whether to merge it first.
> - Create a worktree from `origin/feat/scaffold-bangkok-slice` (`mk-v0.644.0` or later) on `feat/m3-signin`.
> - The public values for `js/market-config.js` (project URL, publishable key, Turnstile site key) are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/m3-owner-setup-values.md`. If that file is missing, stop and ask.
> - Supabase Free pauses a project after 7 idle days, and keep-awake arrives in M7. If the project is paused, ask the owner to restore it.
> **Scope.**
> 1. `supabase/migrations/001_*.sql`:
>    - `profiles` and `cities`. The cities seed comes from a new `scripts/build-market-cities.py`, which also generates the new file `js/data/market-cities.js` (lazy-data rule).
>    - The `private` schema: `admins`, `testers`, `settings` (`market_open=false`, `cash_open=false`) and `filter_terms`. Helpers are security definer, stable, with `search_path=''`.
>    - `market_join`, `market_delete_account`, and the display-name filter terms.
>    - RLS on every table, and no grants to `anon`. Revoke the default PUBLIC EXECUTE on every function, then grant each one deliberately.
> 2. `supabase/tests/001_rls.sql`, run in the SQL editor. It impersonates roles with `set local role` and `request.jwt.claims` and prints only PASS or FAIL lines. Cover:
>    - anon denial;
>    - cross-user reads and updates;
>    - the column-restricted UPDATE;
>    - `market_join` rejecting `adult=false` and filtered names;
>    - the delete cascade;
>    - the tester gate while `market_open` is false.
> 3. `js/market-config.js` and `js/market-api.js`:
>    - plain fetch, no supabase-js;
>    - session refresh and error-code mapping;
>    - fixture mode honoured on 127.0.0.1 and localhost only, with a test proving production hosts ignore it.
> 4. `#market-signin` and `#market-me` in a new lazy screen module; `main.js` gets registration lines only.
> 5. The §2 CSP additions: `connect-src https://xnruspjauhmcrqxmjmxg.supabase.co`, plus `script-src` and `frame-src https://challenges.cloudflare.com`. Decide from evidence whether `wss://` is needed before Realtime (M5); M3a deliberately added nothing early.
> 6. Use a closed-beta `terms_version` and say so in the PR: legal sign-off on the terms gates M9, not this slice.
> **Pitfalls.**
> - The iOS wrapper serves the app from `mekong://` (`Mekonging Xcode/Mekonging/Mekonging/ContentView.swift:45`). Neither Turnstile's www-only hostname nor the Supabase redirect can match that origin. Decide what Market sign-in does inside the wrapper (an honest gated state is acceptable), record the decision, and do not edit `Mekonging Xcode/`.
> - Cloudflare's test sitekeys validate only against the test secret, so 127.0.0.1 cannot complete a real sign-in. Use fixture mode locally; the owner proves the live path on production.
> - `?signin=<token_hash>`: only script may spend the token, because mail scanners pre-fetch links. Spend it once, then call `history.replaceState` before the router runs. `sw.js` already matches navigations with `ignoreSearch`.
> - Confirm with the first test send that `{{ .Token }}` and `{{ .TokenHash }}` both render in one email. Read the project's OTP length before fixing the input at six digits.
> - `mk-market-auth` lives in localStorage, outside `state.js`. Prove that backup, export and Travel circle sharing cannot include it, and define what "reset app data" does to it.
> - A signed-in non-tester needs a defined, honest state while `market_open` is false.
> - Every gated path still renders something offline or with the gate shut (`check-net-gates`).
> - Release bookkeeping: bump `APP_VERSION` and `CACHE_VERSION` together, run `build-sw-manifest.py --write`, and put new exports in new files.
> **Owner touchpoints** (the owner is not technical):
> - The owner runs the SQL, reads the Security Advisor, adds their user id to `private.admins` and `private.testers`, and does the iPhone checks.
> - Give one small step per message, open the exact dashboard page with `open <url>`, and give SQL ready to paste in one block.
> - Verify each result yourself through the REST API where you can.
> - Never ask for or accept the secret key, the database password, the Resend key or the Turnstile secret. If one is pasted, stop, say so, and have it rotated.
> **Done when** (measured, not asserted):
> - The RLS test prints only PASS in the SQL editor, and the Security Advisor shows no errors.
> - At 375 px in headless Chrome over CDP (fresh profile, 127.0.0.1, `document.hidden` false), four states render in light and dark: signed out, code entry, signed in (fixture) and offline. The new screens show no horizontal overflow, no console errors and no controls under 44 px.
> - The owner signs in on the iPhone home-screen app by code and in Safari by link, then deletes a test account. You confirm the deletion through the API.
> - Every guard (including `check-secrets`), `jsc -m` on each edited JS file and `jsc -m scripts/validate-jsc.mjs` pass.
> - The PR is open into `feat/scaffold-bangkok-slice` with no AI-attribution lines. Then run /handoff.
> **Out of scope:** listings, messages, realtime, alerts, push, moderation tooling, cash swap, and the wrapper's code.

Bangkok B1, Old City and Rattanakosin (the next data slice, after M3b; owner rulings are in docs/PLAN.md, Bangkok build-out):
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`. Cover the categories in the plan that fit the district. Each record ships complete: Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`; a photo only from the place's own Wikipedia article. Hold dispensaries out.
> Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.

Q2, commit the audit driver (approved; tools only, no version bump, so it can run alongside M3b):
> Read CLAUDE.md, docs/HANDOFF.md and docs/AUDIT_375.md (Method and limits; Proposed fix slices). Run /slice for slice Q2: add the driver under `tools/audit-375/`.
> The files are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/q1-audit-driver/`: `audit375.py`, `audit375-page.js`, `report375.py`, `listroutes.py`, `redirects.py`, `shot.py`. If that folder is gone, rebuild them from the Method section.
> Make one command print the headline table and the per-route tables for both themes. It must refuse a load where `document.hidden` is true, and keep the display awake (`caffeinate -d`).
> Done when: a clean worktree reproduces the headline numbers in `docs/AUDIT_375.md` (66 routes with controls under 44 px, 0 overflow) and the script is documented in `scripts/README.md` or `tools/audit-375/README.md`.
> Out of scope: fixing what the audit finds.

Q3 to Q8 follow in the shape set out under Proposed fix slices in `docs/AUDIT_375.md`. Q3 to Q7 change shipped files, so they are stacked, one at a time.

D5 tidy, Cambodia source labels and the Long Beach check (approved 2026-10-19; a small releasing data slice, recommended right after M3b):
> Read CLAUDE.md, docs/HANDOFF.md and the Release order and D5 sections of docs/PLAN.md. Run /slice for slice D5 tidy.
> Relabel the 50 entries in 6 data files that cite tourismcambodia.com or tourismcambodia.org as "Ministry of Tourism" to "Tourism Cambodia". Change no URL. Treat tourism.gov.kh as the ministry.
> Compare the coordinates of Long Beach (Sok San) and Long Set Beach (4K Beach) with Wikivoyage's Koh Rong section and the island's map. If they are one beach, merge the records with a `js/data/place-merges.js` line in the same commit, and give the merged card a citation.
> Done when: no "Ministry of Tourism" label remains on either host; the beach decision is recorded with its evidence; the affected cards show correctly at 375 px in headless Chrome; all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> Out of scope: other citations, photos, Bangkok.
