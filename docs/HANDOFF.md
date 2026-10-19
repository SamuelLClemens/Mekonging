# Handoff — 2026-10-19 (slice M3b: Market accounts and sign-in, closed beta)

## Shipped
- M3b: branch `feat/m3-signin`, [PR #125](https://github.com/SamuelLClemens/Mekonging/pull/125), commit 7dbf1de, merged by the owner as 4a7e48c at 13:32 UTC, `mk-v0.645.0`. The Pages deploy and the guards run both succeeded, and www.mekonging.com serves `mk-v0.645.0`.
  - `supabase/migrations/001_accounts.sql`:
    - Tables: `profiles` and `cities` (174, generated). The `private` schema holds `admins`, `testers`, `settings` (`market_open` and `cash_open` false, `terms_version` `beta-2026-10`) and `filter_terms` (the §8 list).
    - Functions: the helpers (`is_admin`, `is_tester`, `is_member`, `setting_on`, `normalise`, `text_hit`), `market_me`, `market_join`, `market_delete_account`, and the display-name trigger.
    - Rules: RLS on every table, nothing granted to anon, and each function's default EXECUTE revoked before exactly five are granted to `authenticated`.
  - `supabase/tests/001_rls.sql`: 66 checks in one rolled-back block, then a summary line. Expected output: 66 PASS lines and `PASS summary: 66 checks, 0 failed, nothing kept`.
  - `scripts/build-market-cities.py` writes `js/data/market-cities.js`, the migration's seed block and the test's expected count. `--check` exits 1 when either output is stale. It is documented in `scripts/README.md`.
  - Client modules:
    - `js/market-config.js` (public values only).
    - `js/market-api.js` (plain fetch, refresh in one flight, error codes; `fixtureAllowed()` and `signInPlace()` are pure).
    - `js/market-fixture.js` (127.0.0.1 and localhost only; the code 000000 is "wrong", the name "admin" is refused, `&tester=1` makes a tester).
    - `js/market-link.js` (eager: `?signin=` leaves the address before the first render).
    - `js/screens/market-account.js` (`#market-signin`, `#market-me`, Turnstile, the state line on `#market`).
  - CSP: `connect-src` adds the Supabase project; `script-src` and a new `frame-src` add `challenges.cloudflare.com`. There is no `wss://`: 0 sockets were measured, and Realtime (M5) adds it.
  - "Reset everything" in Settings also signs the Market session out.
- This handoff's branch, `docs/m3b-handoff`, records the owner's rulings of 2026-10-19, made after M3b:
  - Photos: category artwork on every card, and up to 3 traveller photos per listing.
  - Links: the app's own links only.
  - The Market is redesigned to work like a modern marketplace.
  - Order: Market first, one slice per session.
  - Where they are recorded: `docs/EXCHANGE.md` §2, §10, §14 (new item 8, photos, for legal), §16, and §17, where M4 is split into M4a, M4b and M4c. `docs/PLAN.md` holds the release order and the new "City depth" program.

## Verified
Headless Chrome over CDP, a fresh profile per theme, 127.0.0.1:8753 served from the worktree, 375 x 812 at device scale 2, fixture mode, Cloudflare's always-pass test key and `caffeinate -d`. `document.hidden` was false for every state. The driver is `side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/m3b-cdp/` (`cdp.py`, a stdlib WebSocket client, and `states.py`).
- The four done-when states in light and dark: signed out (18 controls), code entry with a 63-character email (15), signed in (14) and offline (14). Each had 0 overflow, 0 body controls under 44 px and 0 CSP violations.
  - So did data switched off, "Finish joining" (a link opened in a fresh browser), the delete confirm and "Account deleted".
  - On the `#market` state line, the only small control is the existing board's paste field (309 x 22). It is not new.
- 0 console errors, 0 exceptions, 0 Turnstile warnings and 0 WebSockets.
  - Off-origin requests went to `challenges.cloudflare.com` and to the app's existing `api.open-meteo.com` and `open.er-api.com`.
  - Turnstile renders in a closed shadow root. Its token is read from `input[name=cf-turnstile-response]`.
- The 25-character fixture token is in neither `JSON.stringify(store)` nor `exportData()`.
  - Sign out, delete and "Reset everything" each left `mk-market-auth` null.
  - The link sign-in left the address at `/?market=fixture#market-signin` with no token in it or in the Back-stack state.
  - Back from Account landed on `#market`, with no bounce.
- Two bugs were found by this run and fixed before the PR:
  - The route renders twice at start-up, and the second render drew "signed out" over a successful link sign-in. The fix is one shared flight.
  - Detached Turnstile widgets raised warnings. They are now removed.
- `validate.mjs`: 18,470 of 18,470 checks. Negative control: with the fixture gate deliberately broken, it failed with 9 errors.
- All 17 guards pass, as do `check-place-fields --assert`, `port-themes --check`, `check-cache-version` (12 files) and `build-market-cities --check`.
  - `check-js-syntax` parses 246 files, and `jsc -m` parses every edited file.
- Not run here: the SQL. There is no Postgres on this machine, and the owner declined installing one. It was reviewed by reading only.

## Owner checks for M3b (status at handoff)
- [ ] Migration 001 run in the SQL editor. **Production waits on this.** Until it runs, a sign-in on the live Market tab reaches "That did not work", because `market_me` does not exist yet. At 13:40 UTC the probe still answered 404 `PGRST202`.
- [ ] `supabase/tests/001_rls.sql`: 66 PASS lines and the PASS summary. Copy the output into PR #125's thread.
- [ ] Security Advisor: no errors. WARN rows for the three `security definer` RPCs callable by `authenticated` are expected; they are definer by design (§4).
- [ ] The owner signs in on the iPhone Home Screen app by code. Then their user id goes into `private.admins` and `private.testers`.
  - Look the id up in Authentication, Users. One line of SQL inserts it into each table.
- [ ] The owner signs in by link in Safari, then deletes a test account there.
  - The app confirms the deletion only when Auth refuses the old token ("the server confirms it is gone").
- [ ] From the first real email: whether `{{ .Token }}` and `{{ .TokenHash }}` both render, and how many digits the code has. The input takes 6 to 10.

## Not done / known issues
- New in M3b:
  - Every owner check above is still open.
  - Name false positives in the §8 list: "kush" and "gun" are block terms and also real given names and nicknames. They are for M4a's native-speaker review.
  - Renaming a profile waits for M4a's rate limits. The grant and the trigger exist and are tested.
  - The Market's new strings are English only. "Send a new code" returns to the form, because each code needs a new robot check.
  - Why the router renders a route twice at start-up was not traced. Screens with async work must check `isConnected` (CLAUDE.md).
  - The iOS wrapper shows the honest gate ("open www.mekonging.com in Safari or the Home Screen app"). It was proven by `signInPlace('mekong:', …)` in `validate.mjs`, not on a device.
- Carried from M3a:
  - In the iOS wrapper, OCR from `mekong://` (a blob worker's `importScripts` through `WebSchemeHandler`) is untested. Check Point & translate at the next wrapper build.
  - Offline OCR after first use is untested. The `.traineddata.gz` files are not in the service-worker manifest.
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
  - The main checkout is behind origin. Start every session in a worktree from `origin/feat/scaffold-bangkok-slice`.
  - Pai stays deferred.

## Open decisions (need the user)
Closed on 2026-10-19: 9, 11 and 12 (earlier that day), and 15. The owner's "Market first, one slice per session" ruling places D5 tidy after M4c and before Bangkok B1. The numbers below keep their old values.
6. Translation review of "Market", by a native speaker if one is available. Least sure: Korean, Polish, Turkish, Filipino, Chinese and Japanese (alternatives are in git history, `docs/HANDOFF.md` at ae4f0f5).
8. Legal, for Omer Hanegbi or Omri Siri: the questions in `docs/EXCHANGE.md` §14, now including item 8 (photos uploaded by travellers), and the dispensary question in `docs/PLAN.md`, Bangkok build-out. The terms and privacy policy gate M9 (opening to everyone); cash swap gates M10.
10. Topbar icon spacing: the title column has 102 px, so a 44 px pitch costs title width. Recommended: leave the topbar until Q3 to Q5 are done, then test a wider pitch against the nine longest titles.
13. Relabel the 46 leftover "Lao National Tourism Administration" entries (and 4 "Ministry of Information, Culture and Tourism") on tourismlaos.org as "Tourism Laos"? This is data text only, and it bumps the version. Recommended: yes, inside D5 tidy.
14. Add a coordinates check slice? D5 Laos checked 2 of 185 Lao pins, and both were wrong. Recommended: yes, one country per session, starting with Laos's remote sites, flagging any record more than 2 km from its OSM object.
16. City depth order (`docs/PLAN.md`): recommended C1 Chiang Mai, C2 Hanoi, C3 Ho Chi Minh City, C4 Siem Reap, C5 Phnom Penh, C6 Luang Prabang, C7 Da Nang and Hoi An, C8 Vientiane.
17. Where M5 (messages) goes. A marketplace that cannot message cannot complete a hand-off. Recommended: M5 right after M4c, before D5 tidy and the Bangkok slices.
18. Browsing without signing in. Facebook Marketplace, eBay and Amazon let visitors browse, but the owner ruled on 2026-10-12 that reading the market requires sign-in. Recommended: keep sign-in for the closed beta, and decide again at M9 with legal's privacy answer.

## Next session prompts
Order (owner, 2026-10-19): **M4a, M4b, M4c**, then D5 tidy, then Bangkok B1 to B8, then city depth C1 onward. Each releasing slice stacks on the merged tip of the one before. Q2 (tools only) can run alongside any of them.

**Before M4a:** the M3b owner checks above. If they are not all ticked when M4a starts, do them first, with the owner, in the M3b style:
- one small step per message;
- `open` the dashboard page and `pbcopy` the script;
- the owner copies the result grid (Export, then Copy as CSV) and the session reads it with `pbpaste`, then empties the clipboard.
- Never ask for or accept a secret.

### M4a: listings and search, server side
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §3 (listings and reports), §4, §8, §9, §10, §16 (the 2026-10-19 rulings) and §17 (M4 and M4a). Run /slice for slice M4a: listings and search, server side.
> **Start.**
> - `git fetch`; `gh pr list --state all`. Confirm the `docs/m3b-handoff` PR is merged and no PR is open.
> - Confirm the M3b owner checks are ticked in docs/HANDOFF.md. Probe: `POST /rest/v1/rpc/market_me` with only the publishable key must answer 401 (permission denied), not 404 `PGRST202`. If a check is open, finish it with the owner first. Ask the owner to restore the project if Supabase paused it.
> - Worktree from `origin/feat/scaffold-bangkok-slice` on `feat/m4a-listings`.
> **Scope.**
> 1. `supabase/migrations/002_listings.sql`:
>    - the §3 enums, `listings` and `reports`;
>    - BEFORE triggers:
>      - the §8 text check on title and body (reuse `private.normalise` and `private.text_hit`);
>      - the contact-detail and link rejection: phone numbers of 8 or more digits, emails, URLs, bare domains, @handles, and "line id", "whatsapp", "telegram", "wa.me", "t.me". The 2026-10-19 ruling is app links only;
>      - the kind, intent and window rules, and `updated_at`;
>      - the §9 rate limits, including the 3-a-day name change on `profiles`;
>    - AFTER triggers: report weight and auto-hide at 3 (distinct reporters whose accounts are at least 24 hours old, plus system flags); a flag term files a `filter` report;
>    - `market_my_listings()`, `private.today()`, and report snapshots set by trigger;
>    - column grants that make `owner` unselectable, and RLS exactly as the §4 table says.
> 2. Search, as one RPC over open, unexpired, visible and unblocked listings:
>    - free text over title and body: a generated `tsvector` (`simple` config, over normalised text) with a GIN index. Add `pg_trgm` for typo tolerance only if `pg_available_extensions` lists it, and install it into `extensions`, never `public`;
>    - filters: kind, category, city, date overlap, price range, free only;
>    - sorts: newest, soonest, price up, price down;
>    - pages of at most 50, with no `owner` in any row.
>    - Decide invoker or definer from the tests, and write the decision in the migration's header.
> 3. `supabase/tests/002_rls.sql`, in the 001 pattern (one rolled-back block, PASS or FAIL lines, a summary line). It covers:
>    - the M4 done-when (§17);
>    - every seeded block term, plus a phone number, an email, a URL and a bare domain, rejected in a listing;
>    - each rate limit at its edge, including a new account's lower limits;
>    - auto-hide at exactly 3 eligible reports;
>    - search never showing hidden, ended or blocked listings and never returning `owner`, in every row shape.
> 4. Client: a new module for the listing calls. Do not add exports to `js/market-api.js`, because an open app may hold the old copy (CLAUDE.md lazy-module rule). Add fixture data rich enough to design against in M4b: at least 40 listings across the four kinds and a dozen cities, mixed prices including free, long titles, and one hidden and one ended listing that must never show.
> 5. The native-speaker check of the Thai, Vietnamese, Khmer and Lao terms (M4 done-when), and the owner's word on the two name false positives from M3b ("kush" and "gun").
> **Pitfalls.**
> - There is no Postgres here, and the owner declined a local install. Review the SQL by reading it.
> - Open the PR as a **draft** and mark it ready only after the owner's 002 run prints only PASS. PR #125 was merged before migration 001 had run, and production waited on it.
> - The Write and Edit tools decode a typed backslash-u escape into the raw character. Build SQL regex escapes from a script with `chr(92)`, then grep for invisible characters.
> - Listing text is untrusted: render it with `textContent` only. Owner ids never leave the server (§4).
> - Release bookkeeping: bump `APP_VERSION` and `CACHE_VERSION` together, run `build-sw-manifest.py --write`, and put new exports in new files.
> **Done when:**
> - the 002 test prints only PASS in the SQL editor, and the output is in the PR;
> - the Security Advisor shows no errors;
> - the native-speaker check is recorded, or the owner records that none is available;
> - a validator test runs fixture search and gets the expected rows;
> - every guard, `jsc -m` on each edited file and `jsc -m scripts/validate-jsc.mjs` pass;
> - the PR is ready into `feat/scaffold-bangkok-slice`. Then run /handoff.
> **Out of scope:** screens (M4b), photos (M4c), messages and blocks (M5), matching (M6), the review queue (M7).

### M4b: the marketplace redesign
> Read CLAUDE.md, docs/HANDOFF.md, DESIGN_SYSTEM.md, and docs/EXCHANGE.md §2, §11, §13, §16 (the 2026-10-19 rulings) and §17 (M4 and M4b). Run /slice for slice M4b: the marketplace screens.
> **Brief (owner, 2026-10-19).** The Market must look and feel like a modern marketplace: Facebook Marketplace, eBay, Amazon. It should be beautiful, modern, fun to look at and fun to use, with search, pictures and the app's own links. It is still a closed beta for testers.
> **Start.** `git fetch`; `gh pr list --state all`. M4a must be merged with its test output recorded. Worktree on `feat/m4b-market-ui`.
> **Scope.**
> 1. Market home (`#market`):
>    - a sticky search bar, kind tabs (Items, Meetups, Rooms, Rides) and category tiles with artwork;
>    - city and date chips, and a prominent "Post" button;
>    - a two-column, picture-led card grid: the price through `money()`, "Free" instead of "฿0", a two-line title, the city and date window, the kind colour;
>    - skeleton cards while loading;
>    - the link-based board folded under "On this phone" (§11).
>    - Signed out, show an inviting preview built from artwork only, because reading listings requires sign-in.
> 2. Search:
>    - debounced live results, and a filters sheet (kind, category, city, dates, price range, free only);
>    - sorting, a result count, and active-filter chips that clear in one tap;
>    - an empty state with suggestions, and recent searches kept on the phone as a convenience.
> 3. The listing page (`#market-l-<id>`):
>    - a hero image (artwork until M4c), the price, chips, the body, and the kind's safety line;
>    - "A traveller · member since …";
>    - app links only: the city's guide, nearby places, and the scam and safety pages;
>    - Report and Block in a ⋯ menu, and "Message" shown with an honest line until M5.
> 4. Post forms (`#market-new-<kind>`): a short stepper per kind with a live card preview. Client checks mirror the server's, and server errors map to plain copy.
> 5. My listings (`#market-mine`): status chips, close and delete.
> 6. Category artwork: a self-hosted SVG set in the house style, one per kind and per item category (about 16), under `img/market/`.
>    - Theme tokens, so every one of the 11 skins reads well.
>    - No stock photos and no hotlinking. Report the total bytes.
> 7. Motion: tasteful press and transition feedback that respects `prefers-reduced-motion`.
> **Rules.**
> - New lazy modules (for example `market-home.js`, `market-search.js`, `market-listing.js`, `market-post.js`), each under about 1,500 lines. `main.js` gets registration lines only.
> - Tokens only (`check-spacing`, `check-contrast`), and 44 px targets.
> - Remote text renders as text only. Personal values carry `data-no-i18n` and `data-no-mt`.
> - Nothing another traveller wrote is stored on the phone (§2).
> - Every gate still renders something (`check-net-gates`).
> **Pitfalls.**
> - The router renders a route twice at start-up: after every await, check `isConnected`, and share in-flight work.
> - Use fixture mode, `?market=fixture` on 127.0.0.1, with M4a's fixture data.
> - Reuse the M3b CDP driver (see Verified) for real layout and screenshots.
> **Done when:**
> - At 375 px and at 1280 px, in light and dark, on the default skin and one dark skin, these screens render: home, results with a query and with filters, the filters sheet, the listing page, a post form per kind, My listings, and the empty and offline states.
> - Each has 0 overflow, 0 console errors, 0 CSP violations and 0 body controls under 44 px, and `check-contrast` passes.
> - Before and after screenshots of `#market` are in the PR.
> - On production, the owner and a tester see each other's listings.
> - Every guard and the validator pass, and the PR is open. Then run /handoff.
> **Out of scope:** photo upload (M4c), messages (M5), matching (M6).

### M4c: listing photos
> Read CLAUDE.md, docs/HANDOFF.md, and docs/EXCHANGE.md §2 (photos), §10, §13, §14 (item 8) and §17 (M4c). Run /slice for slice M4c: listing photos.
> **Start.** `git fetch`; `gh pr list --state all`. M4b must be merged. Read the current Supabase Free limits for Storage size and egress from supabase.com/pricing, and cap photos per account to fit them. Worktree on `feat/m4c-photos`.
> **Scope.**
> 1. Migration 003 (renumber the later slices' migrations in §17):
>    - a private bucket;
>    - `storage.objects` rules: upload only under `<uid>/<listing id>/` by the listing's owner while it is open; read only by members who can see the listing; delete by the owner;
>    - at most 3 photos per listing, purged with the listing;
>    - a reported listing's photos hidden with it.
> 2. Client:
>    - pick from the camera or the library;
>    - resize on a canvas to at most 1280 px on the long side and re-encode at about 300 KB, which drops the metadata, GPS included;
>    - upload progress, and required alt text;
>    - show photos by an authenticated fetch into a `blob:` URL (`img-src` already allows `blob:`), held in memory only, never stored (§2);
>    - the first photo replaces the artwork on the card, and the listing page shows a gallery.
> 3. A test in the 001 pattern for the storage rules.
> **Pitfalls.**
> - There is no automated image scanning on the Free tier. Say so in the PR, and keep the report path one tap away.
> - Before the market opens to everyone, §14 item 8 must be answered (M9).
> **Done when:**
> - The SQL test shows a stranger cannot upload into another person's folder or read the photos of a hidden or ended listing.
> - A test JPEG carrying GPS metadata arrives on the server with none (read the stored bytes back).
> - The gallery renders at 375 px in light and dark, with 0 overflow and 0 errors.
> - The owner uploads from the iPhone, and a tester sees the photo.
> - Every guard passes, and the PR is open. Then run /handoff.

### D5 tidy (after M4c)
> Read CLAUDE.md, docs/HANDOFF.md and the Release order and D5 sections of docs/PLAN.md. Run /slice for slice D5 tidy.
> - Relabel the 50 entries in 6 data files that cite tourismcambodia.com or tourismcambodia.org as "Ministry of Tourism" to "Tourism Cambodia". Change no URL; treat tourism.gov.kh as the ministry.
> - If the owner agrees (open decision 13), relabel the 46 "Lao National Tourism Administration" entries and the 4 "Ministry of Information, Culture and Tourism" entries on tourismlaos.org to "Tourism Laos".
> - Compare the coordinates of Long Beach (Sok San) and Long Set Beach (4K Beach) with Wikivoyage's Koh Rong section and the island's map. If they are one beach, merge them with a `js/data/place-merges.js` line in the same commit, and give the merged card a citation.
> - Done when: no "Ministry of Tourism" label remains on either Cambodian host; the beach decision is recorded with its evidence; the affected cards show correctly at 375 px in headless Chrome; all guards and `jsc -m scripts/validate-jsc.mjs` pass.
> - Out of scope: other citations, photos, Bangkok.

### Bangkok B1, Old City and Rattanakosin (then B2 to B8 in the same shape)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" section of docs/PLAN.md. Run /slice for slice B1: Old City and Rattanakosin.
> - Count Bangkok's records by category first (40 of 293 Thai places). Run `check-place-dupes.py` before adding: a name collision silently deletes travellers' saved data.
> - Add the district's records in a new file, `js/data/places.th.bkk.rattanakosin.js`, with one loader line in `js/data/regions.js` next to `PLACES_TH` and `PLACES_TH_EXT`. Ids are `th-bkk-<slug>`.
> - Cover every category in the plan that fits the district, the practical ones included (health, errands, daily shopping, visa and living).
> - Each record ships complete: a Thai-script `localName`, page-level `sources` (the venue's own page or its Wikipedia article first), `hours`, a price tier, `coords` and `tips`. A photo comes only from the place's own Wikipedia article. Hold dispensaries out.
> - Done when: Bangkok records for the district are counted by category before and after; every new record passes `check-place-fields.py --assert`; 10 sample cards show correctly at 375 px in headless Chrome over CDP; all guards and `jsc -m scripts/validate-jsc.mjs` pass; the pack size is reported before and after if photos were added; the PR is open into `feat/scaffold-bangkok-slice`.
> - Out of scope: the other districts, dispensaries, D6 fields beyond the `afterDark` contract.
>
> For B2 to B8, swap the district, the file name (`places.th.bkk.<district>.js`) and the slice number. The district order is in docs/PLAN.md: B2 Chinatown and Yaowarat, B3 Siam, Pratunam and Ratchathewi, B4 Sukhumvit, B5 Silom, Sathorn and Bang Rak, B6 Riverside and Thonburi, B7 north and the outskirts, B8 a gap sweep and the 300 reassessment. B2 onward adds only a file and a loader line.

### City depth C1, Chiang Mai (then C2 onward in the same shape)
> Read CLAUDE.md, docs/HANDOFF.md and the "Bangkok build-out" and "City depth" sections of docs/PLAN.md. Run /slice for slice C1: Chiang Mai.
> - Count Chiang Mai's 33 records by category, and run `check-place-dupes.py` first.
> - Add new records in `js/data/places.th.chiangmai.js`, with one loader line in `js/data/regions.js`, and ids `th-chiangmai-<slug>`. Existing records stay where they are.
> - Apply the Bangkok rules: every category, complete at creation, page-level sources, photos only from the place's own Wikipedia article, no dispensaries, and adult nightlife as factual area entries only.
> - Target: double the city's records in the first pass, and record what is still missing.
> - Done when: the same done-when as a B slice, for Chiang Mai.

### Q2: commit the audit driver (tools only, no version bump, can run alongside any slice)
> Read CLAUDE.md, docs/HANDOFF.md and docs/AUDIT_375.md (Method and limits; Proposed fix slices). Run /slice for slice Q2: add the driver under `tools/audit-375/`.
> - The files are in `/Users/zim/Library/Application Support/Claude/side-session-notes/local_45164220-ea74-40e6-851e-808583e5b9f4/q1-audit-driver/`. The M3b CDP client (`m3b-cdp/cdp.py`, stdlib only) is in the same folder and may replace the driver's own client.
> - Make one command print the headline table and the per-route tables for both themes. It must refuse a load where `document.hidden` is true, and it must keep the display awake (`caffeinate -d`).
> - Done when: a clean worktree reproduces the headline numbers in `docs/AUDIT_375.md` and the script is documented.
> - Out of scope: fixing what the audit finds.
