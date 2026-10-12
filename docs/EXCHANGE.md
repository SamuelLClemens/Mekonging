# Traveller exchange: design (M0, 2026-10-12)

This document turns the owner's decisions in `docs/PLAN.md` ("Traveller exchange") into a design that can be built in slices. It covers documents only: no code, no accounts and no keys were touched to write it. Slices M1 to M10 are in §17.

**Owner rulings in this session (2026-10-12):**
- Reading the shared board requires sign-in.
- Listing cards are anonymous. A display name appears only inside a conversation.
- The exchange becomes a new tab in the bottom bar, "Market".
- The whole exchange is 18+, confirmed by the traveller at sign-up.

**Sources read on 2026-10-12:**
- Supabase passwordless email: supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase Realtime Postgres Changes: supabase.com/docs/guides/realtime/postgres-changes
- The free-tier limits are cited in `docs/PLAN.md`.

## 1. What exists today
- **The board.** `bulletinScreen`, `buildBBForm`, `listingCard` and `BB_CATS` live in `js/main.js` (about lines 4271–4500). There are six categories: swap, ride, house, kids, gear and other. A post is saved to `store.social.listings` on the phone. It reaches another person only inside an `#in-` link that the poster shares.
- **Sharing.** `js/social.js` encodes a payload into the URL hash and clamps every decoded field. `js/screens/circle.js` imports it (`importShareScreen`, kind `bb`) and renders it as text only.
- **Messaging.** Travel circle threads (`#thread-`, `#msg-`) travel as links between people who already know each other.
- **Navigation.**
  - The People hub lists "Traveller board" (`#exchange`).
  - The Money hub lists "Cash swap" (`#swap`) and "Gear market" (`#market`).
  - All three open `bulletinScreen`. Other links point at the board from `js/screens/nearby.js:91`, `js/screens/circle.js:64` and `:291`, and the currency screen (`js/main.js:4262`).
- **Carried forward.**
  - The text-only rendering rule for anything another person wrote.
  - The safety line for each kind (`bbSafety`).
  - The fair mid-market value (`swapCalcNodes`).
  - The sanitiser limits and the town prefill (`guessCityName`).
- **Not carried forward.**
  - The free-text "Contact" field. Policy says contact details are never shown.
  - The free-text "When" field, which a date window replaces.

## 2. Architecture

```text
Phone (PWA, or the iOS WKWebView wrapper)
  │  fetch (HTTPS)                      WebSocket (WSS)
  ├──► Supabase Auth      /auth/v1      ├──► Supabase Realtime /realtime/v1
  ├──► Supabase PostgREST /rest/v1           (notifications table only)
  │
Supabase Auth ──SMTP──► Resend ──► traveller's inbox (sign-in code and link)
pg_cron (every minute) ──pg_net──► Edge Function market-push ──► browser push services ──► sw.js
```

- **Client modules.** All are new files. `js/main.js` gains registration lines only (§11).

  | File | Role |
  |---|---|
  | `js/market-config.js` | Public values only: project URL, publishable key, VAPID public key, Turnstile site key |
  | `js/market-api.js` | Plain `fetch` for auth and PostgREST, session refresh, error-code mapping, fixture mode |
  | `js/market-realtime.js` | A small Phoenix-protocol WebSocket client, with a polling fallback |
  | `js/market-push.js` | Web Push opt-in, subscribe and unsubscribe |
  | `js/screens/board.js` | The link-based board, moved out of `main.js` in M1; the offline fallback |
  | `js/screens/market.js`, `market-post.js`, `market-inbox.js`, `market-account.js` | Market screens, each under ~1,500 lines |
  | `js/data/market-cities.js` | City list, generated (a new file, per the lazy-data rule) |
  | `supabase/migrations/*.sql`, `supabase/tests/*.sql`, `supabase/functions/market-push/` | Server side, versioned in the repo |

- **No client library.** `supabase-js` is not used. Auth and PostgREST are a handful of `fetch` calls, and Realtime needs only join, heartbeat and token refresh. This keeps to the PLAN rule "self-hosted under `lib/`, or replaced with plain `fetch`".

- **Keys and secrets.** Only public values reach the repository.

  | Value | Secret? | Where it lives | Who sets it |
  |---|---|---|---|
  | Project URL | No | `js/market-config.js` | Owner supplies; committed |
  | Publishable key (`sb_publishable_…`) | No. It is public by design; row-level security protects the data | `js/market-config.js` | Committed (see open decision 1) |
  | Secret key (service role) | Yes | Inside Supabase only; injected into Edge Functions by Supabase | Never leaves Supabase |
  | Resend API key | Yes | Supabase Auth SMTP settings | Owner, in the dashboard |
  | VAPID public key | No | `js/market-config.js` | Committed |
  | VAPID private key | Yes | Edge Function secret | Owner |
  | Push-trigger shared secret | Yes | Supabase Vault and an Edge Function secret | Owner |
  | Turnstile site key | No | `js/market-config.js` | Committed |
  | Turnstile secret | Yes | Supabase Auth captcha settings | Owner |
  | Database password, CLI token | Yes | The owner's password manager | Owner |

- **New guard, `scripts/check-secrets.py` (M3).**
  - It fails on a full secret key (the `sb_secret_` prefix followed by 20 or more key characters), on a JWT whose payload carries `"role":"service_role"`, and on a Resend key pattern (`re_` followed by 20 or more key characters). It matches whole keys, not bare prefixes, so this document does not trip it.
  - It also fails on `-----BEGIN … PRIVATE KEY-----`, and on a literal assigned to a name containing `SERVICE_ROLE`, `VAPID_PRIVATE` or `TURNSTILE_SECRET`.
  - It allows `sb_publishable_` in `js/market-config.js` only.
  - It goes in `scripts/README.md` and `.github/workflows/guards.yml`.
- **CSP changes (`index.html`, M3).**
  - `connect-src` adds `https://<ref>.supabase.co` and `wss://<ref>.supabase.co`.
  - `script-src` adds `https://challenges.cloudflare.com`.
  - A new `frame-src https://challenges.cloudflare.com` covers the Turnstile widget, which renders in an iframe.
- **Service worker.**
  - `sw.js:750` ignores non-GET requests, and `sw.js:756` returns early for other origins. Supabase traffic therefore already bypasses every cache, and nothing from Supabase is ever cached.
  - M8 adds `push` and `notificationclick` handlers.
- **Offline-first.**
  - When `online()` is false, Market shows the on-phone board under one line: "The shared market needs internet."
  - Listings fetched from the server are held in memory only. Nothing another traveller wrote is written to storage on the phone.
- **Region.** Supabase project in Singapore (`ap-southeast-1`), the closest region to the four countries.
- **No photos in v1.** Images would bring storage cost and a moderation burden (nudity, abuse imagery, identity documents) that one owner cannot carry.

## 3. Data model
Every table below sits in the `public` schema. RLS is on for each of them (§4).

**Enums**
- `market_kind`: `item`, `meetup`, `room`, `ride`, `cash`
- `market_intent`: `give`, `sell`, `trade`, `request`, `offer`, `seek`, `join`
- `listing_status`: `open`, `closed`, `hidden`, `removed`, `deleted`
- `report_reason`: `scam`, `drugs`, `unsafe`, `harassment`, `spam`, `minor`, `other`, `filter`
- `profile_status`: `active`, `review`, `suspended`

**`profiles`** (one row per account; email stays in `auth.users` only)

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | `auth.users.id`, `on delete cascade` |
| `display_name` | text | 1–40 characters after trimming; passes the text check (§8) |
| `avatar` | text | One emoji; at most 16 bytes |
| `adult_confirmed_at` | timestamptz | Not null: the 18+ confirmation |
| `terms_version` | text | Not null: the terms version accepted |
| `status` | `profile_status` | Default `active` |
| `suspended_until` | timestamptz | Null unless suspended |
| `created_at` | timestamptz | Default `now()` |

**`cities`** (the only places a listing can name)

| Column | Type | Rule |
|---|---|---|
| `id` | text PK | `<cc>-<city-slug>`, for example `th-chiang-mai` |
| `country` | char(2) | `th`, `vi`, `kh` or `la` |
| `name` | text | English display name |

`scripts/build-market-cities.py` generates both the seed SQL and `js/data/market-cities.js` from the place records and the endpoints in `js/data/routes`. One source therefore feeds both sides.

**`listings`**

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `owner` | uuid → `profiles` | Default `auth.uid()`. Never readable by another user (§4) |
| `kind` | `market_kind` | |
| `intent` | `market_intent` | Allowed pairs per kind (table below) |
| `category` | text | Items only, from the fixed list below |
| `city` | text → `cities` | For a ride, the departure city |
| `to_city` | text → `cities` | Rides only; must differ from `city` |
| `starts_on`, `ends_on` | date | `ends_on ≥ starts_on`; length cap per kind; `starts_on ≤ today + 90`; `ends_on ≥ today` at insert |
| `title` | text | 3–80 characters |
| `body` | text | At most 400 characters |
| `price_amount` | numeric(14,2) | ≥ 0; null means free or offers |
| `price_currency` | char(3) | ISO code |
| `seats` | smallint | 1–8: seats on a ride offer, group size on a meetup |
| `room_type` | text | Rooms: `private`, `shared` or `whole` |
| `activity` | text | Meetups: `food`, `sights`, `outdoors`, `cowork`, `sport`, `other` |
| `have_currency`, `have_amount`, `want_currency` | | Cash only |
| `status` | `listing_status` | Default `open` |
| `report_weight` | smallint | Maintained by trigger (§8) |
| `created_at`, `updated_at` | timestamptz | |

| Kind | Intents | Longest window | Also required |
|---|---|---|---|
| `item` | give, sell, trade, request | 30 days | `category`; a price for `sell` |
| `meetup` | join | 7 days | `activity`; `seats` (group size 2–8) |
| `room` | offer, seek | 30 days | `room_type` |
| `ride` | offer, seek | 3 days | `to_city`; `seats` for an offer |
| `cash` | offer | 14 days | have and want; off until legal clears it (§14) |

- **Item categories:** `carseat`, `stroller`, `carrier`, `toys`, `kids-clothing`, `bicycle`, `camping`, `clothing`, `books` and `other`.
- **`motorbike`** is added only after the legal answer (§14).
- **SIM cards are excluded.** A SIM is registered to the holder's passport, so a SIM handed on stays in the seller's name.

**`threads`**

| Column | Type | Rule |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid → `listings` | `on delete set null` |
| `owner_id` | uuid → `profiles` | The listing owner |
| `asker_id` | uuid → `profiles` | The person who replied |
| `status` | text | `open` or `closed` |
| `last_message_at` | timestamptz | |
| | | Unique (`listing_id`, `asker_id`) |

**`messages`**: `id` bigint identity; `thread_id` → `threads` (`on delete cascade`); `sender` uuid, default `auth.uid()`; `body` 1–800 characters; `created_at`.

**`blocks`**: `blocker` uuid, default `auth.uid()`; `blocked` uuid; `blocked_name`, a snapshot of the display name for the block list; `created_at`. The primary key is (`blocker`, `blocked`).

**`reports`**

| Column | Type | Rule |
|---|---|---|
| `id` | bigint identity | |
| `reporter` | uuid | Default `auth.uid()`; null for a system report from the text check |
| `listing_id`, `message_id`, `profile_id` | | Exactly one is set |
| `target_user` | uuid | Set by trigger, never by the client |
| `reason` | `report_reason` | |
| `note` | text | At most 300 characters |
| `snapshot` | jsonb | The reported text at report time, set by trigger |
| `status` | text | `open`, `actioned` or `dismissed` |
| `created_at`, `resolved_at` | timestamptz | |
| | | Unique per reporter and target |

**`notifications`**: `id` bigint identity; `recipient` uuid; `kind` (`match`, `message`, `listing_hidden`); `listing_id` (the recipient's own listing); `other_listing_id` (the listing that matched it); `thread_id`; `created_at`; `seen_at`; `pushed_at`.

**`push_subscriptions`**: `id` uuid; `user_id`, default `auth.uid()`; `endpoint` (unique, `https:` only); `p256dh`; `auth`; `created_at`; `last_ok_at`.

**`private` schema** (not exposed through the Data API):
- `admins(user_id)`
- `testers(user_id)`
- `settings(key, value)`, holding `market_open` and `cash_open`
- `filter_terms(term, level, category, lang)`
- `sanctions(user_id, action, reason, until, by, at)`

## 4. Row-level security
**Ground rules**
- RLS is on for every public table. The `anon` role has no grant on any of them, because reading requires sign-in (owner ruling).
- Policies read the caller once per statement with `(select auth.uid())`, Supabase's documented pattern.
- Helper functions live in `private`. They are `security definer`, `stable`, and set `search_path = ''`.
- **Other people's user ids stay on the server.** SELECT on `listings.owner` is never granted. A client therefore cannot read, filter or sort by it, so two listings by the same person cannot be linked. Policy expressions still use the column.
- Rows written by triggers (notifications, report weight, snapshots) come from security-definer functions. Clients have no INSERT grant on those tables.

**Helpers**
- `private.is_member()`: a profile exists for the caller, its status is `active` (or a suspension has lapsed), and `market_open` is true or the caller is a tester.
- `private.is_admin()`: the caller is in `private.admins`. It is not a JWT claim, so a client cannot set it.
- `private.blocked(a, b)`: a block exists in either direction.
- `private.today()`: `(now() at time zone 'Asia/Bangkok')::date`. All four countries are UTC+7, matching `regionNow()`.

**Policies**

| Table | Operation | Rule |
|---|---|---|
| `profiles` | SELECT | Own row; a profile the caller shares a thread with; admin |
| `profiles` | INSERT | None. RPC `market_join` creates it |
| `profiles` | UPDATE | Own row; columns `display_name` and `avatar` only |
| `profiles` | DELETE | None. RPC `market_delete_account` handles it |
| `cities` | SELECT | Any signed-in user |
| `listings` | SELECT | Own rows, any status. Otherwise `is_member()`, status `open`, `ends_on ≥ today()`, and no block between owner and caller. Admin sees all |
| `listings` | INSERT | `is_member()`; `owner = caller`; `kind <> 'cash'` unless `cash_open`; for meetup, room and ride, an account at least 24 hours old |
| `listings` | UPDATE | Own row while `open` or `closed`. Columns `title`, `body` and `status` (to `closed` or `deleted` only). Admin may change `status` |
| `listings` | DELETE | None. The retention job purges rows (§10) |
| `threads` | SELECT | Caller is `owner_id` or `asker_id`; admin |
| `threads` | INSERT | None. RPC `market_start_thread` creates the thread and first message together |
| `threads` | UPDATE | Participant; column `status` to `closed` only |
| `messages` | SELECT | Participant of the thread |
| `messages` | INSERT | `sender = caller`; participant; thread `open`; no block between the two |
| `messages` | UPDATE, DELETE | None |
| `blocks` | SELECT, DELETE | `blocker = caller` |
| `blocks` | INSERT | `blocker = caller`, `blocked <> caller`. A listing's owner is blocked through RPC `market_block_owner` |
| `reports` | INSERT | `is_member()`; `reporter = caller`; the caller can see the target |
| `reports` | SELECT, UPDATE | Admin only |
| `notifications` | SELECT | `recipient = caller` |
| `notifications` | UPDATE | `recipient = caller`; columns `seen_at` and `read_at` |
| `push_subscriptions` | SELECT, INSERT, DELETE | `user_id = caller` |

**Security-definer RPCs.** Each one checks `auth.uid()` itself.

| Function | Purpose |
|---|---|
| `market_join(display_name, avatar, terms_version, adult)` | Creates the profile; `adult` must be true |
| `market_delete_account()` | Deletes the caller's auth user. Rows cascade, but reports keep their snapshot (§10) |
| `market_my_listings()` | The caller's listings in any status; the client learns which cards are its own from this |
| `market_matches(listing_id)` | Open listings that match one of the caller's listings, without owner ids |
| `market_start_thread(listing_id, body)` | Creates the thread and its first message atomically |
| `market_block_owner(listing_id)` | Blocks a listing's owner without revealing who they are |
| `market_review_queue()`, `market_resolve(report_id, action)` | Admin only (§8) |

**Triggers**
- BEFORE INSERT or UPDATE: the text check (§8), rate limits (§9), window and kind rules, and `updated_at`.
- AFTER INSERT: matching (§6), message notifications, and report weight with auto-hide (§8).

**Realtime.** Only `notifications` is added to the `supabase_realtime` publication. Realtime "authorizes every event against each subscriber", so a client receives its own rows only. RLS is not applied to DELETE events, so the client never relies on them.

**Proof.** `supabase/tests/rls.sql` runs in one transaction that rolls back.
- It switches to `role authenticated` and sets `request.jwt.claims` for three fixture users: poster, asker and stranger.
- It checks every row of the policy table above and prints PASS or FAIL per check.
- The owner runs it in the SQL editor, and its output goes in the PR. The Security Advisor must also show no errors.

## 5. Sign-in flow
**Link and code in one email.** The owner chose magic-link sign-in. The same email also carries a six-digit code, for two reasons:
- An iPhone opens a mail link in Safari, which shares no storage with the home-screen app or the iOS wrapper. A link alone would sign in the wrong browser.
- A traveller may read email on a different device.

Supabase's Magic Link template supports `{{ .Token }}` (the code) and `{{ .TokenHash }}`. M3 confirms with a test send that both render in one email.

**The link is checked by script, not by Supabase's redirect.** It points at `{{ .SiteURL }}/?signin={{ .TokenHash }}`, and the app exchanges it with a POST. This has two benefits:
- The token stays out of the hash, which the router owns.
- An email scanner that pre-fetches links does not spend the token, because only script spends it.

**Steps**
1. **Signed out, online.** Market shows a card with:
   - an email field;
   - a display-name field, prefilled from the traveller card (`store.social.me.name`);
   - "I am 18 or older" and "I accept the terms and privacy policy";
   - the Turnstile widget and the button "Email me a code".
2. **Request.** The client sends `POST /auth/v1/otp` with `{ email, create_user: true, gotrue_meta_security: { captcha_token } }`. Supabase allows one request per address every 60 seconds.
3. **Wait for the code.** The screen asks for the six-digit code, shows the address, and offers "Resend" after 60 seconds.
4. **Verify.**
   - By code: `POST /auth/v1/verify` with `{ type: 'email', email, token }`.
   - By link: at start-up the app sees `?signin=` and sends `POST /auth/v1/verify` with `{ type: 'email', token_hash }`. `history.replaceState` then drops the query and the app routes to `#market`.
5. **Store the session.** The access token, refresh token, expiry and user id go under the `localStorage` key `mk-market-auth`, outside `state.js`. A backup, an export or a Travel circle share can therefore never include them.
6. **First sign-in.** RPC `market_join(display_name, avatar, terms_version, adult: true)` creates the profile and records the consent version and time.
7. **Refresh.** `POST /auth/v1/token?grant_type=refresh_token` runs when under 60 seconds remain, on resume, and after a 401. If refresh fails, the app returns to the signed-out state with the on-phone board intact.
8. **Sign out.** The client deletes this device's push subscription row, calls `POST /auth/v1/logout`, clears `mk-market-auth` and closes the socket.
9. **Delete account.** Market, then Account, then "Delete my account" asks through `confirmAction`. RPC `market_delete_account` runs, then the device signs out.

**Supabase Auth settings** (owner, in the dashboard)
- Site URL `https://www.mekonging.com`; Redirect URLs list the same and nothing else. Development signs in by code.
- Email OTP expiry 900 seconds (the default is 3,600).
- SMTP through Resend, sender `Mekonging <signin@mekonging.com>`.
- Email sending rate limit: 30 an hour.
- Captcha: Turnstile on.
- Providers other than email: off. Anonymous sign-ins: off.
- The "Magic Link" and "Confirm signup" templates both get this text:

```text
Subject: Your Mekonging sign-in code

Your code is {{ .Token }}. It works for 15 minutes.
Or open this link on this device: {{ .SiteURL }}/?signin={{ .TokenHash }}
If you did not ask for this, ignore this email.
```

**Failure messages**
- Code requested within the last 60 seconds.
- Daily email quota spent: "Sign-in emails have run out for today. Try again tomorrow."
- Wrong or expired code.
- Offline.

**Fixture mode.** On `127.0.0.1` and `localhost` only, `?market=fixture` makes `market-api.js` answer from canned data. The signed-in screens can then be captured at 375 px without real accounts. Production hosts ignore the flag, and M3 adds a test that proves it.

## 6. Matching rule
Two open listings A and B match when all of the following hold:
1. They have different owners, and there is no block between them.
2. They are the same kind.
3. They name the same city. For rides, both the departure city and the destination match.
4. Their intents complement each other (table below).
5. For items, the category is the same.
6. **Their date windows overlap or touch:** `A.starts_on ≤ B.ends_on + 1` and `B.starts_on ≤ A.ends_on + 1`. A window ending on the 10th touches one starting on the 11th; a one-day gap does not match. Dates are calendar days in UTC+7.
7. Neither has ended: `ends_on ≥ today()`.

| Kind | New listing | Matches |
|---|---|---|
| item | give, sell, trade | request |
| item | request | give, sell, trade |
| item | trade | trade |
| meetup | join | join |
| room | offer | seek |
| room | seek | offer |
| ride | offer | seek |
| ride | seek | offer, seek (two people can split a taxi) |
| cash | have X, want Y | have Y, want X |

```sql
-- specification for private.match_candidates(a); a = the new listing, b = a candidate
b.id <> a.id and b.owner <> a.owner
and b.status = 'open' and b.ends_on >= private.today()
and b.kind = a.kind and b.city = a.city
and b.to_city is not distinct from a.to_city
and (a.kind <> 'item' or b.category = a.category)
and a.starts_on <= b.ends_on + 1 and b.starts_on <= a.ends_on + 1
and private.intents_match(a.kind, a.intent, b.intent)
and (a.kind <> 'cash' or (b.have_currency = a.want_currency and b.want_currency = a.have_currency))
and not private.blocked(a.owner, b.owner)
-- index: listings (kind, city, status, ends_on)
```

**When matching runs**
- An AFTER INSERT trigger on `listings` takes up to 20 candidates. Each one writes a `match` notification for B's owner.
- The new listing's poster sees matches on the confirmation screen through `market_matches`, without a notification.
- **Cap:** at most 10 match notifications per recipient per day (UTC+7). Further matches still appear under My listings but raise no alert.
- Editing does not re-run matching, because only the title and body are editable.
- A hidden listing, or one by a user under review, never matches.

## 7. Alert delivery
**One source.** Every message and every match writes a `notifications` row by trigger. Both delivery paths read that table.

| App state | Delivery |
|---|---|
| Open and visible | Realtime |
| Open in the background | Web Push if enabled; catch-up on return |
| Closed | Web Push if enabled |
| iOS wrapper (WKWebView) | Realtime while open, catch-up on open. No Web Push in a WKWebView |
| iPhone Safari tab, not installed | No Web Push; the opt-in explains Add to Home Screen |

**Realtime while the app is open (M5)**
- **Connection.** One WebSocket per open app joins one channel: Postgres Changes, INSERT on `public.notifications`, filtered `recipient=eq.<uid>`. The access token is sent on join and again after each refresh.
- **Client.** `js/market-realtime.js` handles join, a heartbeat every 25 seconds, token refresh and rejoin with backoff. After three failed connections it polls `GET /rest/v1/notifications?seen_at=is.null` every 60 seconds while the app is visible.
- **On receipt.** The client sets `seen_at`, updates the tab badge and shows a toast ("New message" or "New match").
- **Catch-up.** When the app becomes visible again, the client fetches unseen notifications, because browsers drop sockets in the background.
- **Budget.** The free plan allows 200 concurrent connections and 2 million messages a month. Clients beyond 200 fall back to polling.

**Web Push while the app is closed (M8)**
- **Opt-in.** Push starts only when the traveller taps "Alerts when the app is closed" under Market and then Account, never on first load. The permission prompt runs inside that tap, which iOS requires.
- **iOS.** Web Push works only in a home-screen app on iOS 16.4 or later. The button explains Add to Home Screen otherwise. The client feature-detects `PushManager`.
- **Subscribe.** `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: <VAPID public key> })`, then an insert into `push_subscriptions`. A user may have at most 5 subscriptions.
- **Send.**
  1. Every minute, `pg_cron` checks for notifications with `seen_at` null and `pushed_at` null that are more than 60 seconds and less than 24 hours old.
  2. If any exist, `pg_net` posts to the Edge Function `market-push` with the shared secret from Vault. Otherwise it makes no call.
  3. The function sends at most one push per recipient every 10 minutes, to each of the recipient's subscriptions. It sets `pushed_at` and deletes any subscription that answers 404 or 410.
- **Why wait 60 seconds.** Realtime marks a delivered notification seen within seconds, so an open app never also gets a system alert.
- **Why send no payload.**
  - No name, city or date reaches a lock screen or a push service.
  - Payload encryption (RFC 8291) is not needed.
  - The service worker shows fixed text: title "Mekonging Market", body "You have something new.", tag `market` so repeats collapse. A tap focuses an open window, or opens one, at `#market-inbox`.
- **Budget.** The cron makes at most 1,440 calls a day, about 44,600 a month, against 500,000 Edge Function calls.
- **Email never carries alerts.** Resend's 100 emails a day are kept for sign-in.

## 8. Moderation
1. **Text check at write time.** A server trigger runs on listing titles and bodies, message bodies and display names. The client cannot skip it.
   - Normalisation:
     - NFKC, lower case, and zero-width characters removed.
     - Vietnamese diacritics folded (`đ` to `d`).
     - Look-alike characters mapped: `0→o 1→i 3→e 4→a 5→s @→a $→s`.
     - Runs of three or more of one letter collapsed to two.
   - Latin-script terms match on word boundaries. Thai, Lao and Khmer terms match as substrings, because those scripts do not separate words with spaces.
   - A `block` term rejects the text with "This breaks the market rules." The term itself is not echoed.
   - A `flag` term accepts the text and files a system report (reason `filter`, weight 1).
   - **Listings reject contact details** with "Keep contact details for messages":
     - phone numbers (8 or more digits once spaces, dots and dashes are removed);
     - email addresses, URLs and bare domains;
     - `@handles`, and the words `line id`, `whatsapp`, `telegram`, `wa.me` and `t.me`.
   - **Messages reject URLs**, the main phishing route. They allow phone numbers, because people arranging to meet will swap them. The thread shows a safety line when it detects one.
2. **Reports by people.**
   - Report is on every listing card (the ⋯ menu), on the listing page and in every thread.
   - Reasons: scam, drugs, unsafe, harassment, spam, under 18, other.
   - A thread offers "Report and block" as one action.
3. **Auto-hide.**
   - A listing's `report_weight` counts distinct human reporters whose accounts are at least 24 hours old, plus system flags.
   - At 3 the listing becomes `hidden`, and its owner is notified "Hidden after reports. Under review."
4. **Users under review.**
   - When 3 distinct eligible reporters report one user's content within 7 days, that profile moves to `review`.
   - Under review, the user's open listings are hidden and they cannot post, start threads or send messages until the owner rules.
5. **Owner review queue** (`#market-review`; no navigation entry; admin RPCs; enforced by RLS).
   - It lists open reports grouped by target, with the snapshot, the reasons, the count and the reporters' account ages.
   - Actions: dismiss (restoring a hidden listing), remove, suspend for 7 days, ban, or lift.
   - Every action writes a row to `private.sanctions`.
6. **Appeals.** The owner of a hidden listing sees its state under My listings and can write through the existing `#feedback` screen. v1 has no appeal workflow.

**The word list.** It seeds `private.filter_terms`, and the owner extends it with SQL. The policy bans drug listings "of any kind", so the list blocks kratom although Thailand allows it.

| Category | Block | Flag (common innocent uses) |
|---|---|---|
| Drugs, English | cannabis, marijuana, weed, ganja, hashish, kush, thc, cbd, pre-roll, preroll, mdma, ecstasy, xtc, cocaine, ketamine, lsd, shrooms, magic mushroom, psilocybin, dmt, ayahuasca, opium, heroin, meth, methamphetamine, yaba, kratom, happy shake, happy pizza, nitrous, laughing gas | hash, joint, blunt, edibles, gummies, molly, coke, acid, ice, 420, pills, poppers, bud, grass |
| Drugs, Thai | กัญชา, ยาบ้า, ยาไอซ์, ยาอี, เคตามีน, โคเคน, เฮโรอีน, ฝิ่น, เห็ดขี้ควาย, ใบกระท่อม | ไอซ์ (also a common nickname), กระท่อม (also "hut") |
| Drugs, Vietnamese (matched after folding) | cần sa, bồ đà, thuốc lắc, ma túy, nấm thần | |
| Drugs, Khmer | កញ្ឆា, យ៉ាម៉ា, ម៉ាទឹកកក | |
| Drugs, Lao | ກັນຊາ, ຢາບ້າ | |
| Prescription drugs | tramadol, xanax, alprazolam, valium, diazepam, codeine, oxycodone | antibiotics, prescription, oxy |
| Weapons | gun, pistol, rifle, firearm, ammo, ammunition, taser, stun gun, brass knuckles | knife, machete, pepper spray |
| Wildlife | ivory, pangolin, rhino horn, tiger bone, tiger skin, bear bile | shark fin, turtle shell, coral |
| Documents and money | fake id, fake passport, fake licence, fake license, counterfeit, bank account for rent | passport, western union, moneygram, gift card, usdt, crypto, bitcoin, deposit first, advance payment, wire transfer |
| Sex work | escort, happy ending, sexual service, sugar daddy | |
| Display names only | mekonging, admin, moderator, support, official, staff | |

- **Not yet checked by a native speaker.** The Thai, Vietnamese, Khmer and Lao entries come from general knowledge, not from a checked source. A native-speaker check is part of M4's done-when.
- **Slurs and sexual-harassment terms are not printed here.** M4 seeds them from a maintained open list (candidate: the LDNOOBW lists, CC BY 4.0) and records which of the four languages that list covers. These terms block in display names and flag in messages.

## 9. Rate limits
BEFORE INSERT triggers enforce these by counting the caller's own rows in the window. Indexes on (`owner` or `sender`, `created_at`) keep the count cheap. A breach raises `rate_limited:<action>`, which the client maps to plain copy. "New account" means under 24 hours old.

| Action | Limit | New account |
|---|---|---|
| Post a listing | 5 a day | 2 a day |
| Open listings at once | 10 | 3 |
| Same title again | Rejected within 24 hours | Same |
| Start a thread (first message to someone) | 10 a day | 3 a day |
| Send a message | 60 an hour, 300 a day | 20 an hour |
| File a report | 10 a day | 3 a day |
| Change display name | 3 a day | Same |
| Push subscriptions | 5 per user | Same |
| Sign-in email (Supabase Auth) | 1 a minute per address; 30 an hour for the project; Turnstile on | Same |
| Read a page of listings | PostgREST max rows 50 per request | Same |

## 10. Data retention
Nightly `pg_cron` jobs run at 03:00 UTC+7.

| Data | Kept until | Then |
|---|---|---|
| Listing | `ends_on` passes: drops out of every view | Purged 30 days after `ends_on`, or 7 days after the owner deletes it |
| Listing under an open report | The report is resolved | Purged 90 days after resolution |
| Thread and messages | 60 days after the last message | Purged, unless an open report references them |
| Notification | 30 days | Purged |
| Report and its snapshot | 180 days after resolution | Purged |
| Sanction record | While the account exists | Deleted with the account |
| Push subscription | Sign-out, a 404 or 410 from the push service, or 60 days without a delivery | Deleted |
| Account (profile, auth user) | Deletion request (immediate), or 12 months without sign-in | Deleted. Rows cascade; reports against the user keep only their snapshot |
| Session on the phone | Sign-out | `mk-market-auth` cleared |

- **Never stored:** coordinates, exact addresses, phone numbers in listings, photos and identity documents.
- **Supabase's own logs** keep request metadata, including IP addresses, for the platform's log window. The privacy policy has to say so.
- **Legal review.** These periods go to legal with the privacy policy (§14).

## 11. Screens and navigation
**The bottom bar (owner ruling).**
- `TABS` in `js/main.js` gains a sixth entry, `{ id: 'market', hash: '#market', label: 'Market' }`, after Explore. The five existing tabs keep their order and their muscle memory.
- The CSS already plans for six tabs: the `.tabbar` label rule reads "Six tabs share the bar".
- **Icon.** A new `ICON_PATH` entry: a market stall.
- **Active tab.** `TAB_FOR_HEAD` maps `market`, `exchange` and `swap` to `#market`, and the root gets `data-tab="market"`.
- **Badge.** The tab shows the count of unseen notifications. It is a new `.tab-badge`, with the count also in the button's accessible name.

**`js/nav-groups.js`.**
- Remove "Traveller board" from People, and "Cash swap" and "Gear market" from Money.
- No tab destination appears in `NAV_GROUPS` (Talk, Places, Explore and You do not), so the Market tab becomes the feature's one home.
- The currency screen's "Swap cash with a traveller" button points at `#market-cash`.

**Routes.** Every route uses the head `market`, so the router gains one case.

| Route | Screen |
|---|---|
| `#market` | Market home: kind chips, city and dates, listings |
| `#market-<kind>` | One kind: `items`, `meetups`, `rooms`, `rides`, `cash` |
| `#market-new-<kind>` | Post form for that kind |
| `#market-l-<id>` | Listing page: Message, Report, Block |
| `#market-mine` | My listings, with matches under each |
| `#market-inbox` | Conversations and match alerts |
| `#market-t-<id>` | One conversation |
| `#market-me` | Account: name, alerts on this device, blocked people, terms, sign out, delete account |
| `#market-signin` | Email, then code |
| `#market-review` | Owner's queue; no navigation entry |

**Legacy routes redirect.**
- `#exchange` goes to `#market`.
- `#exchange-swap` and `#swap` go to `#market-cash`.
- `#exchange-ride` goes to `#market-rides`, and `#exchange-house` to `#market-rooms`.
- `#exchange-kids`, `#exchange-gear`, `#exchange-other` and `#market-gear` go to `#market-items`.
- Shared `#in-` board links keep importing into the on-phone board.

**Market home at 375 px**, top to bottom:
1. Topbar "Market".
2. One state line.
3. Kind chips: Items, Meetups, Rooms, Rides (and Cash, once cleared).
4. City picker and date range.
5. "＋ Post".
6. Listing cards.
7. A folded "On this phone" section holding the link-based board.

**An anonymous listing card** shows the kind emoji and headline, the subline, and the city with the date window. It then reads "A traveller · member since Oct 2026", followed by a ⋯ menu with Report and Block. A tap opens the listing page, which has "Message".

**Every gate still renders something** (the `check-net-gates` rule):

| Gate | What renders |
|---|---|
| `netMode` offline, or no connection | "The shared market needs internet." and the on-phone board |
| Online, signed out | Sign-in card and the on-phone board |
| Signed in, market not open, not a tester | "The shared market opens soon." and the on-phone board |
| Signed in, under review or suspended | "Your account is under review." and the on-phone board |
| Signed in, member | The shared market |

**Changes to `main.js`** are registration lines only: the router case and legacy redirects, `screenMod` loaders, the preload map, `TABS`, `TAB_FOR_HEAD`, and the accent and back-target maps. M1 first moves about 230 lines of board code out.

## 12. Moving on-device listings
- **Never automatic, never silent.**
- **Eligible:** only the traveller's own posts (`mine: true`) from the last 14 days. On-phone listings have no end date, so age stands in for one.
- **Never uploaded:** copies of other people's listings (`mine: false`).
- **Flow.**
  1. After the first sign-in, a card offers "Move N of your posts to the shared market?"
  2. Each post opens the post form, prefilled. The traveller confirms the city from the picker (fuzzy-matched from the old free text), the dates and the intent.
  3. Saving runs a normal insert, so every check and limit applies.
  4. On success the on-phone record gains `movedTo: <listing id>` and shows "On the shared market".
- **Schema.** `state.js` goes from version 16 to 17 for `movedTo`. No place record changes, so `place-merges.js` needs no line.

| Old category | New kind | Intent | Notes |
|---|---|---|---|
| swap | cash | offer | Only after cash swap clears legal; until then it stays on the phone |
| ride | ride | offer if `seats > 0`, else seek | From and to text go to the city picker; "When" becomes a date |
| house | room | `g = looking` gives seek, otherwise offer | `room` gives `private`, `place` gives `whole` |
| kids | item | sell if priced, else give | `g` maps to `carseat`, `stroller`, `carrier`, `toys`, `kids-clothing` or `other` |
| gear | item | sell if priced, else give | `motorbike` waits for legal; `sim` cannot move |
| other | item | `free` gives give, `sale` sell, `wanted` request; `other` by price | |

The old `contact` field is dropped. `note` becomes `body` only if it passes the text check.

## 13. Threat model
- **Assets:** a traveller's whereabouts and dates; their email and session; their money and belongings; the owner's free quotas; the app's standing under the four countries' laws.
- **Actors:** spammer, scammer, stalker, harasser, seller of banned goods, scraper, someone abusing reports, and an attacker after tokens.

| Threat | How it would happen here | Controls | What remains |
|---|---|---|---|
| **Spam** | Bulk or repeated posts; advertising | Sign-in with Turnstile; Resend's 100 a day caps new accounts; 5 posts a day and 10 open; repeat titles rejected; no URLs or contact details in listings; text check; auto-hide at 3 reports | A patient spammer with many addresses still gets 2 posts a day per new account; the owner removes them from the queue |
| **Scams** | A deposit for a room that does not exist; a passport left as motorbike deposit; counterfeit notes or robbery at a cash swap; phishing links; moving to WhatsApp and then asking for payment | No contact details in listings; no URLs in messages; payment terms flagged into the queue; the safety line for each kind on forms and listing pages; cash swap off until legal clears it, then capped; report reason "scam"; no payments through the app | The app cannot prevent fraud in person; the copy says so plainly |
| **Stalking** | Following one traveller across cities; learning when a solo traveller is alone in a town; contact after a block; lock-screen leaks; scraping | Owner ids unreadable, so posts by one person cannot be linked; anonymous cards; city and date window only, and the server never receives coordinates; profiles visible only to conversation partners; immediate, silent, two-way block; 10 new threads a day (3 for new accounts); push with no payload; sign-in required to read; 50 rows per request | Free text can still identify someone, and anyone can reply to a meetup. Meetup copy: meet in public, tell someone, the app never shares your location |
| **Harassment** | Unwanted or sexual messages; slurs; mass messaging; a fresh account after a block; abusive names; false reports against a victim | Block and report in every thread; text check on messages and names; message limits; review after 3 reporters; report weight only from distinct accounts over 24 hours old; the owner can restore | Evading a block with a new email stays possible, limited by Turnstile, the email quota and new-account limits. Banning by email hash is a question for legal |
| **Banned goods** (drugs, weapons, wildlife, documents) | Listing them, or coding them in slang | Fixed kinds and categories; block lists in five languages; report reason "drugs"; owner removal; no photos in v1 | New slang; the owner extends the list |
| **Minors** | Someone under 18 joins meetups or room shares | 18+ confirmation at sign-up; report reason "under 18" sends the account to review | Self-attestation only |
| **Account takeover, token theft** | A stolen code; script injected into the page | Email-only sign-in; codes expire in 15 minutes; tokens in their own key, never in backups; refresh-token rotation (Supabase default); text-only rendering of remote data; CSP; sign-out clears the device | `localStorage` is readable by any script on the origin. `script-src` still allows unpkg.com and cdn.jsdelivr.net (tesseract); open decision 3 |
| **Email bombing, quota exhaustion** | Requesting codes for a victim's address, or spending the 100 a day | Turnstile; 1 a minute per address; 30 an hour for the project | 100 a day is a low ceiling: a busy day stops new sign-ins, though existing sessions continue |
| **Scraping** | A signed-in account pages through a city | Sign-in; 50 rows per request; no owner ids; coarse data only | Someone with an account can still read a city's open listings |
| **Key leakage** | A secret committed or pasted | Only public values in the repo; `check-secrets` guard; GitHub push protection (owner); secrets entered in dashboards by the owner only | Human error in a dashboard |
| **Admin compromise** | The owner's Supabase or email account is taken over | Admin rights come from `private.admins` only; MFA on the Supabase account and the owner's email; every action logged in `sanctions` | Depends on the owner's own account security |
| **Data breach** | The database is exposed | Data minimised (no coordinates, no phone numbers, no photos); short retention; email held only in `auth.users` | Display names, cities, dates and message text |

## 14. Questions for legal
These questions go to Omer Hanegbi or Omri Siri. This document gives no legal answers. The slice that waits on each answer is in brackets.
1. Cash swap between travellers in Thailand, Vietnam, Cambodia and Laos: is it allowed, and up to what amount? [M10]
2. Private motorbike sales between foreigners: registration transfer and liability. [the `motorbike` category]
3. Room share, meaning a shared room or a short sublet: hotel licensing rules in each country. [the `room` kind, M4]
4. Liability for meetups and rides between strangers, and the disclaimers needed. [M9]
5. Terms of use and privacy policy, including:
   - the retention periods in §10;
   - the consent record;
   - account deletion;
   - Thailand's PDPA and the data-protection rules of Vietnam, Cambodia and Laos, given storage in Singapore. [M9, launch]
6. Keeping a hashed email of banned users to stop them signing up again. [after launch]
7. Whether a self-confirmed 18+ check is enough. [M3]

## 15. Owner actions by slice
Every key and password stays in a dashboard or a password manager. None goes in the repo or in chat.

| Before | Action |
|---|---|
| M3 | Create the Supabase project (Free, Singapore) and turn on MFA for the Supabase account |
| M3 | Create the Resend account; verify mekonging.com with Resend's DNS records in Cloudflare; enter the Resend SMTP details in Supabase Auth |
| M3 | Create a Turnstile widget for www.mekonging.com in Cloudflare; enter its secret in Supabase's captcha settings |
| M3 | Apply the Auth settings and email templates in §5 |
| M3 | Send the project URL and the publishable key (both public) for `js/market-config.js` |
| M3 onward | Run each slice's migration and RLS test in the SQL editor; add your own account to `private.admins` and `private.testers` |
| M7 | Turn on GitHub secret-scanning push protection; add the publishable key as a repository variable for the keep-awake workflow |
| M8 | Generate a VAPID key pair; store the private key and a push-trigger secret as Edge Function secrets and in Vault; send the public key; deploy `market-push` |
| M9 | Get legal sign-off on the terms and privacy policy; then set `market_open = true` |
| M10 | Get legal's written answer on cash swap; then set `cash_open = true` |

## 16. Open decisions (need the owner)
1. **The publishable key in git.**
   - The organisation rule bars access keys from commits. A publishable key, however, is a public identifier by design, and RLS, not secrecy, protects the data.
   - **(a) Recommended:** commit it in `js/market-config.js`, with the guard allowing that prefix in that file only.
   - **(b)** Inject it at deploy time. That needs a Pages build workflow, and the key is still published on the site.
2. **The cash-swap amount cap**, and whether cash swap ships at all. This waits on legal.
3. **Tighten the CSP before tokens exist on the origin.** Recommended in M3: self-host tesseract, or pin its exact URL, so `script-src` can drop unpkg.com and cdn.jsdelivr.net.

## 17. Slices
**How every slice runs:**
- One PR into `feat/scaffold-bangkok-slice`.
- Stacked, because each one bumps `APP_VERSION` and `CACHE_VERSION`.
- Proof at 375 px through headless Chrome over CDP. Signed-in screens use fixture mode, plus a live check by the owner where an account is needed.
- All guards pass.

### M1: Move the board out of `main.js`
- **Scope.**
  - Move `BB_CATS`, `bbCat`, `bbSubKinds`, `HOUSE_KIND`, `bbHeadline`, `bbSubline`, `bbSafety`, `swapCalcNodes`, `guessCityName`, `pasteLinkBox`, `BB_STALE_DAYS`, `listingIsStale`, `listingCard`, `buildBBForm` and `bulletinScreen` into `js/screens/board.js`.
  - `circle.js` and the currency screen import from it. No behaviour changes.
- **Done when:**
  - A computed-style digest of `#exchange`, `#exchange-swap`, `#exchange-kids` and an `#in-` board link is identical before and after at 375 px.
  - `js/main.js` is at least 200 lines shorter.
  - All guards pass.

### M2: The Market tab
- **Scope.**
  - Add the sixth tab, its icon, `TAB_FOR_HEAD` entries and the legacy redirects.
  - Remove the three `nav-groups.js` entries and repoint the currency button.
  - `#market` shows the on-phone board under the title "Market", with chips for the new kinds.
- **Done when:**
  - At 375 px the bar shows six tabs and the measured width of the "Market" label fits its slot.
  - The Market tab is highlighted on `#market`, `#exchange-gear` and `#swap`.
  - The Money and People hubs no longer list the three items.
  - A route sweep shows every legacy route landing on its new tab.

### M3: Accounts and sign-in (closed beta)
- **Scope.**
  - Owner actions for M3 come first.
  - Migration 001: `profiles`, `cities` (seeded), the `private` schema and helpers, `market_join` and `market_delete_account`, and display-name filter terms.
  - The `check-secrets` guard, `js/market-config.js` and `js/market-api.js` (with fixture mode).
  - Sign-in and account screens, CSP changes, Turnstile, and open decision 3.
- **Done when:**
  - The RLS test prints only PASS, and the Security Advisor shows no errors.
  - At 375 px the signed-out, code-entry, signed-in and offline states render.
  - The owner signs in on an iPhone home-screen app by code and in Safari by link, then deletes a test account.
  - `check-secrets` fails on a planted fake secret key and passes on the tree, including this document.

### M4: Listings (items, meetups, rooms, rides)
- **Scope.**
  - Migration 002: `listings` and `reports`, with the text check, contact-detail rules, rate limits, auto-hide and `market_my_listings`.
  - Screens: browse with city and dates, a post form for each kind, the listing page, My listings, and Report.
- **Done when:**
  - The RLS tests show a stranger cannot read `owner`, cannot see ended or hidden listings, and cannot change another person's listing.
  - A SQL test shows each seeded block term, and a phone number in a listing, rejected.
  - At 375 px, browse, post, the listing page and My listings render for all four kinds.
  - The owner and a tester see each other's listings.
  - The PR records a native speaker's check of the Thai, Vietnamese, Khmer and Lao terms.

### M5: Messages, block and live alerts
- **Scope.**
  - Migration 003: `threads`, `messages`, `blocks` and `notifications` (added to the publication), `market_start_thread`, `market_block_owner`, and the message triggers.
  - `js/market-realtime.js`; the inbox, conversation and blocked-people screens; the tab badge.
- **Done when:**
  - The RLS tests show a non-participant reads nothing and a blocked pair cannot message.
  - A tester's message reaches the owner's open app in under 5 seconds without a reload, and the tab badge shows 1 at 375 px.
  - After a block, neither side can send and the conversation shows as closed.

### M6: Matching and match alerts
- **Scope.**
  - Migration 004: `intents_match`, the matching trigger, the daily cap and `market_matches`.
  - Matches on the post confirmation screen and under My listings; match alerts in the inbox.
- **Done when:**
  - A SQL test proves the rule on fixtures: overlapping and touching windows match; a one-day gap, the wrong intent, a blocked pair, another city and the wrong ride direction do not.
  - A tester's request alerts the owner's open app within 5 seconds.
  - The match screens render at 375 px.

### M7: Review queue, retention and keep-awake
- **Scope.**
  - Migration 005: admin RPCs, `sanctions`, review of users, and the `pg_cron` retention jobs.
  - The `#market-review` screen.
  - A weekly keep-awake workflow. It first confirms which request Supabase counts as activity; the candidate is an RPC `market_ping()`.
- **Done when:**
  - On fixtures, 3 eligible reports hide a listing, and the owner restores it from the queue at 375 px.
  - The RLS test shows a non-admin gets nothing from the review RPCs.
  - A dry run of each retention job lists the rows it would delete.
  - The keep-awake workflow's first run succeeds.

### M8: Web Push
- **Scope.**
  - Owner actions for M8.
  - The Edge Function `market-push`, the `pg_cron` and `pg_net` trigger, and the `push` and `notificationclick` handlers in `sw.js`.
  - The opt-in on Account, and unsubscribe on sign-out.
- **Done when:**
  - With the app closed, a message raises "You have something new." within 2 minutes, both on an iPhone home-screen app (iOS 16.4 or later) and on Android Chrome. Tapping it opens `#market-inbox`.
  - An open app gets no duplicate alert.
  - An endpoint answering 410 is deleted.
  - The opt-in screen renders at 375 px.

### M9: Move on-device posts, then launch
- **Scope.**
  - The move flow from §12, and `state.js` version 17 with `movedTo`.
  - Terms and privacy screens with legal-approved text.
  - A launch checklist, then `market_open = true`.
- **Done when:**
  - At 375 px, a device holding posts in every old category moves each one as §12 describes, and nothing moves without a tap to confirm.
  - Legal's written approval of the terms and privacy text is recorded in the PR.
  - After opening, a new account that is not a tester can post.

### M10: Cash swap (only after legal clears it)
- **Scope.**
  - The `cash` kind with the amount cap from legal.
  - `swapCalcNodes` on cards, and the cash safety copy.
- **Done when:**
  - `cash_open` is set only after legal's written answer.
  - A SQL test proves the reciprocal have-and-want match.
  - The cash card shows the fair value at 375 px.
