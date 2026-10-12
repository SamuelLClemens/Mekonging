# Handoff — 2026-10-12 (slice M0)

## Shipped
- Slice M0, the exchange design: `docs/EXCHANGE.md`. Branch `docs/exchange-m0`, [PR #104](https://github.com/SamuelLClemens/Mekonging/pull/104), commit b560500. Documents only, so there is no version bump. The document covers:
  - tables and RLS; sign-in; matching; alerts;
  - moderation and the word list; rate limits and retention;
  - the Market tab, routes and the move of on-device listings;
  - the threat model, questions for legal, owner actions, and slices M1–M10.
- `docs/PLAN.md` marks M0 done and records the owner's four rulings. Owner actions are now needed before M3, not M1.
- Slice D1 merged earlier today as [PR #103](https://github.com/SamuelLClemens/Mekonging/pull/103) (d37d261, `mk-v0.630.0`). On d37d261, both `guards` and the Pages deploy succeeded.

## Owner rulings (M0 session)
- Reading the shared board requires sign-in.
- Listing cards are anonymous. A display name appears only inside a conversation.
- The exchange becomes a sixth bottom tab, "Market".
- The whole exchange is 18+.

## Verified
- Every item in the M0 brief maps to a section of `docs/EXCHANGE.md` (§3–§13). The document ends with M1–M10, and each slice has a "Done when" with proof at 375 px.
- Supabase details were checked against the current documentation on 2026-10-12. The pages and their findings are cited in the document's header:
  - the email template variables `{{ .Token }}` and `{{ .TokenHash }}`;
  - `verifyOtp` type `email`, and the 60-second request interval;
  - Realtime authorises each event against each subscriber's RLS, and does not apply RLS to DELETE events.
- Not yet verified: that `{{ .Token }}` and `{{ .TokenHash }}` render together in one email. M3 checks it with a test send.
- All 16 guards passed locally on the branch. `check-cache-version` passed (no shipped file changed).

## Not done / known issues
- The Thai, Vietnamese, Khmer and Lao filter terms in `docs/EXCHANGE.md` §8 come from general knowledge. A native speaker must check them; this is part of M4's done-when.
- Free places print "฿0 (≈ $0)" instead of "Free". D1 raised a follow-up task chip for this; it bumps the version.
- On the journey map at 375 px, the map credits panel opens expanded and covers about a quarter of the map.
- `js/main.js` is 7,784 lines; the ceiling is ~1,500. M1 moves about 230 lines of board code out.

## Open decisions (need the user)
1. Commit the Supabase publishable key in `js/market-config.js`? Recommended: yes.
   - It is a public identifier by design; RLS, not secrecy, protects the data.
   - The new `check-secrets` guard would allow it in that one file only.
   - The alternative is injecting it at deploy time. That needs a Pages build workflow, and the key still ships to every browser.
2. Tighten the CSP in M3 by self-hosting or pinning tesseract, so `script-src` drops unpkg.com and cdn.jsdelivr.net before sign-in tokens exist on the origin? Recommended: yes.
3. Before M3, the owner actions in `docs/EXCHANGE.md` §15:
   - create Supabase, Resend and Turnstile;
   - set the DNS and the Auth settings.
4. Take the questions in `docs/EXCHANGE.md` §14 to Omer Hanegbi or Omri Siri. Cash swap (M10) and launch (M9) wait on them.

## Next session prompts
D2 has a worktree at `.claude/worktrees/d2-city-gaps`. It may already be running in another session; check before starting it. Its prompt is unchanged:
> Read CLAUDE.md, docs/HANDOFF.md and the D2 section of docs/PLAN.md. Run /slice for slice D2: city gaps.
> Add `WEATHER_SPOTS` anchors in js/weather.js for the 19 cities listed. Add city history entries in `js/data/history.cities.<cc>.js` for the 26 cities listed, keeping the layout that `check-month-arrays.py` parses. Check Duy Phu against "Duy Phu (My Son)" first.
> Done when: every city that has places has a weather spot and a history entry, measured with jsc over `loadAllCountries()`; all guards and `jsc -m scripts/validate-jsc.mjs` pass; and two of the new cities show the right "Nearby" places and history at 375 px in headless Chrome.
> Out of scope: photos, local names, citations, the "Free" price display.

Exchange M1. Start only after D2 has merged, because both bump the version:
> Read CLAUDE.md, docs/HANDOFF.md and docs/EXCHANGE.md §1, §11 and §17 (M1). Run /slice for slice M1: move the board out of main.js.
> Move `BB_CATS`, `bbCat`, `bbSubKinds`, `HOUSE_KIND`, `bbHeadline`, `bbSubline`, `bbSafety`, `swapCalcNodes`, `guessCityName`, `pasteLinkBox`, `BB_STALE_DAYS`, `listingIsStale`, `listingCard`, `buildBBForm` and `bulletinScreen` into `js/screens/board.js`. Point circle.js and the currency screen at it, with no behaviour change.
> Done when: a computed-style digest of `#exchange`, `#exchange-swap`, `#exchange-kids` and an `#in-` board link is identical before and after at 375 px in headless Chrome; js/main.js is at least 200 lines shorter; all guards pass.
> Out of scope: the Market tab (M2), any Supabase work, any account or key handling.
