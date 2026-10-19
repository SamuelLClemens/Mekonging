-- Migration 002: listings, reports and search (docs/EXCHANGE.md sections 3, 4, 8, 9 and 17, M4a).
--
-- Run it once, whole, in the Supabase SQL editor (which runs as `postgres`), after 001 and 001b. It is
-- one transaction: a second run fails at `create type public.market_kind` and changes nothing.
-- supabase/tests/002_rls.sql proves it afterwards.
--
-- This file is pure ASCII on purpose (CLAUDE.md): non-ASCII characters are built with chr(), so it
-- survives any clipboard. scripts/check-market-sql.py fails the build if one appears.
--
-- Clients must send an explicit column list (`select=id,kind,...`, js/market-listings.js
-- LISTING_COLUMNS) with every read: `select=*` asks for `owner`, which no role may read, and
-- fails with "permission denied". They must also not use INSERT ... RETURNING: PostgreSQL checks
-- the SELECT policy against a new row before it exists, so a policy that looks the row up cannot
-- find it. A client therefore picks the listing's `id` itself (a uuid), inserts with
-- `Prefer: return=minimal`, and reads the row back with market_listing(id).
--
-- Decisions (each is checked by 002_rls.sql):
--   * Visitors browse without an account (owner ruling 2026-10-19, section 16 ruling 5), through two RPCs
--     only: market_search and market_listing. `anon` holds no table grant and no other function.
--   * Until `market_open` is true, both RPCs answer `market_closed` to visitors and to signed-in
--     people who are not members (owner ruling 2026-10-19, M4a): the privacy policy must say that
--     listings are public before visitors read them, and that gates M9.
--   * SECURITY DEFINER for the three read RPCs, not invoker. An invoker search would need a table
--     grant to `anon`, which the ruling forbids. Each RPC applies the visibility rules itself
--     (open, not ended, owner in good standing, no block either way, the gate), the same rules as
--     the listings SELECT policy; the test compares the two row for row.
--   * The policies never name `owner`: they call the definer helpers private.owns(id) and
--     private.can_see(id). Whether a policy expression needs privilege on a column no role may
--     select is not settled by the PostgreSQL documentation, and nothing here bets on it. The
--     price is the INSERT ... RETURNING rule above.
--   * Every row the RPCs return is built by private.listing_json(), the one list of columns that
--     leave the server. It has no `owner`, `report_weight` or search columns, and neither do the
--     column grants, so two listings by one person cannot be linked (section 4).
--   * Clients write listings and reports through the tables, under RLS and column grants. The
--     BEFORE triggers run every rule and raise a plain code the client maps to copy.
--     private.by_client() tells a request from the API (role `authenticated` or `anon`, top-level
--     trigger) from the database owner and from triggers inside triggers: rate limits, the owner
--     stamp and the status rules apply to requests; the text, contact and shape rules apply to all.
--   * The search vector is a plain column the BEFORE trigger fills, not a generated column: a
--     generated column runs private.normalise() as the inserting role, which 001 denies.
--   * Free text: a `simple` tsvector over folded title and body (GIN, private.search_fold), prefix matching per
--     word; Thai, Lao and Khmer queries match as substrings (no spaces between words); pg_trgm in
--     `extensions` adds typo tolerance per word, for words of 4 or more letters.
--   * `blocks` is created here, as a table with its section 4 policies and no client grant, so search can
--     leave out blocked pairs and the test can prove it. M5 adds the grants and market_block_owner.
--   * "Kush" and "gun" no longer block display names; they still block listings (owner ruling
--     2026-10-19). No native speaker was available to check the Thai, Vietnamese, Khmer and Lao
--     terms (owner, 2026-10-19); they ship as written in section 8, still marked unchecked.
--
-- Error codes raised (P0001 unless noted): not_signed_in (28000), not_member, market_closed,
-- cash_closed, account_too_new, city_invalid, to_city_invalid, kind_intent, kind_fields,
-- category_invalid, activity_invalid, room_type_invalid, seats_invalid, price_invalid,
-- currency_invalid, dates_required, window_order, window_past, window_too_long, starts_too_late,
-- title_length, title_invalid, body_length, body_invalid, text_rejected, contact_details,
-- status_invalid, not_owner, rate_limited:post, rate_limited:open, rate_limited:same_title,
-- rate_limited:report, rate_limited:name, report_reason_invalid, report_target_invalid,
-- own_listing, already_reported, note_length, sort_invalid, page_invalid, currency_required.
--
-- What this migration does not hold: photos and Storage (M4c); threads, messages, notifications
-- and the block RPC (M5); matching (M6); the review queue, sanctions and retention jobs (M7).

begin;

-- ---- pg_trgm, for typo tolerance (into `extensions`, never `public`) -------------------------
do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_trgm') then
    raise exception 'pg_trgm_unavailable';
  end if;
end $$;
create extension if not exists pg_trgm with schema extensions;
do $$
begin
  if (select n.nspname from pg_extension e join pg_namespace n on n.oid = e.extnamespace
      where e.extname = 'pg_trgm') is distinct from 'extensions' then
    raise exception 'pg_trgm_outside_extensions';
  end if;
end $$;

-- ---- types (section 3) --------------------------------------------------------------------------------
create type public.market_kind    as enum ('item', 'meetup', 'room', 'ride', 'cash');
create type public.market_intent  as enum ('give', 'sell', 'trade', 'request', 'offer', 'seek', 'join');
create type public.listing_status as enum ('open', 'closed', 'hidden', 'removed', 'deleted');
create type public.report_reason  as enum ('scam', 'drugs', 'unsafe', 'harassment', 'spam', 'minor', 'other', 'filter');

-- ---- tables (section 3) -------------------------------------------------------------------------------
-- Prices: price_amount 0 is free; null is "no price" (a trade, a request, offers). A price above 0
-- names its currency. Dates are whole days in UTC+7 (private.today()).
create table public.listings (
  id             uuid primary key default gen_random_uuid(),
  owner          uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind           public.market_kind not null,
  intent         public.market_intent not null,
  category       text
    constraint listings_category check (category in ('carseat', 'stroller', 'carrier', 'toys', 'kids-clothing',
                                                     'bicycle', 'camping', 'clothing', 'books', 'other')),
  city           text not null references public.cities (id),
  to_city        text references public.cities (id),
  starts_on      date not null,
  ends_on        date not null,
  title          text not null
    constraint listings_title_length check (char_length(title) between 3 and 80),
  body           text not null default ''
    constraint listings_body_length check (char_length(body) <= 400),
  price_amount   numeric(14, 2)
    constraint listings_price_amount check (price_amount >= 0),
  price_currency text
    constraint listings_price_currency check (price_currency in ('THB', 'VND', 'KHR', 'LAK', 'USD')),
  seats          smallint
    constraint listings_seats check (seats between 1 and 8),
  room_type      text
    constraint listings_room_type check (room_type in ('private', 'shared', 'whole')),
  activity       text
    constraint listings_activity check (activity in ('food', 'sights', 'outdoors', 'cowork', 'sport', 'other')),
  have_currency  text
    constraint listings_have_currency check (have_currency in ('THB', 'VND', 'KHR', 'LAK', 'USD')),
  have_amount    numeric(14, 2)
    constraint listings_have_amount check (have_amount > 0),
  want_currency  text
    constraint listings_want_currency check (want_currency in ('THB', 'VND', 'KHR', 'LAK', 'USD')),
  status         public.listing_status not null default 'open',
  report_weight  smallint not null default 0,
  -- Filled by the BEFORE trigger: normalised title and body, and their tsvector. Never granted.
  search_text    text not null default '',
  search         tsvector not null default ''::tsvector,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint listings_window check (ends_on >= starts_on)
);

create index listings_owner_created on public.listings (owner, created_at);
create index listings_open_created  on public.listings (created_at desc) where status = 'open';
create index listings_search        on public.listings using gin (search);

-- One report per reporter and target. `reporter` null is a system report from the text check
-- (reason `filter`), or a person whose account has since been deleted. A purged listing or a
-- deleted account leaves the report and its snapshot (section 10).
create table public.reports (
  id          bigint generated always as identity primary key,
  reporter    uuid default auth.uid() references public.profiles (id) on delete set null,
  listing_id  uuid references public.listings (id) on delete set null,
  message_id  bigint,  -- M5 adds the foreign key to messages
  profile_id  uuid references public.profiles (id) on delete set null,
  target_user uuid references public.profiles (id) on delete set null,
  reason      public.report_reason not null,
  note        text
    constraint reports_note_length check (char_length(note) <= 300),
  snapshot    jsonb,
  status      text not null default 'open'
    constraint reports_status check (status in ('open', 'actioned', 'dismissed')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  -- Exactly one target at filing (the trigger); at most one once a target is purged.
  constraint reports_one_target check (num_nonnulls(listing_id, message_id, profile_id) <= 1)
);

create unique index reports_once_per_listing on public.reports (reporter, listing_id)
  where reporter is not null and listing_id is not null;
create unique index reports_one_filter_flag on public.reports (listing_id)
  where reporter is null and reason = 'filter';
create index reports_reporter_created on public.reports (reporter, created_at);
create index reports_listing          on public.reports (listing_id);

-- Blocks (section 3). The table and its policies only: M5 grants them and adds market_block_owner.
create table public.blocks (
  blocker      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked      uuid not null references public.profiles (id) on delete cascade,
  blocked_name text
    constraint blocks_name_length check (char_length(blocked_name) <= 40),
  created_at   timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint blocks_not_self check (blocker <> blocked)
);

create index blocks_blocked on public.blocks (blocked, blocker);

-- Display-name changes, for the 3-a-day limit (section 9).
create table private.name_changes (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  changed_at timestamptz not null default now()
);

create index name_changes_user on private.name_changes (user_id, changed_at);

alter table public.listings      enable row level security;
alter table public.reports       enable row level security;
alter table public.blocks        enable row level security;
alter table private.name_changes enable row level security;

-- ---- table grants ------------------------------------------------------------------------------
-- Supabase grants every new table and sequence in `public` to anon and authenticated; take that
-- back first. Then column grants only: `owner`, `report_weight` and the search columns are never
-- granted, so a client cannot read, filter or sort by them.
revoke all on table public.listings, public.reports, public.blocks from public, anon, authenticated;
revoke all on table private.name_changes from public, anon, authenticated;
revoke all on sequence public.reports_id_seq from public, anon, authenticated;
revoke all on sequence private.name_changes_id_seq from public, anon, authenticated;

grant select (id, kind, intent, category, city, to_city, starts_on, ends_on, title, body, price_amount,
              price_currency, seats, room_type, activity, have_currency, have_amount, want_currency,
              status, created_at, updated_at)
  on table public.listings to authenticated;
grant insert (id, kind, intent, category, city, to_city, starts_on, ends_on, title, body, price_amount,
              price_currency, seats, room_type, activity, have_currency, have_amount, want_currency)
  on table public.listings to authenticated;
-- section 4: title, body and status (to closed or deleted; the trigger holds the transitions).
grant update (title, body, status) on table public.listings to authenticated;
grant insert (listing_id, reason, note) on table public.reports to authenticated;

-- ---- the word list: two names (owner ruling 2026-10-19) ---------------------------------------
-- "Kush" and "Gun" are real given names and nicknames (Gun is common in Thailand). They stop
-- blocking display names and still block listings.
alter table private.filter_terms add column in_names boolean not null default true;
update private.filter_terms set in_names = false where term in ('kush', 'gun');

-- ---- helpers -----------------------------------------------------------------------------------
-- Today in the four countries (all UTC+7), as regionNow() is on the phone.
create function private.today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Bangkok')::date;
$$;

-- True for a request through the API (role `authenticated` or `anon`) at the top trigger level.
-- False for the database owner (SQL editor, tests, later jobs) and for a trigger fired by another
-- trigger (the system's own writes: report weight, auto-hide, filter reports).
create function private.by_client()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(current_setting('role', true), 'none') in ('authenticated', 'anon')
     and pg_trigger_depth() <= 1;
$$;

-- A block exists in either direction.
create function private.blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select a is not null and b is not null
     and exists (select 1 from public.blocks x
                 where (x.blocker = a and x.blocked = b) or (x.blocker = b and x.blocked = a));
$$;

-- The owner's profile is active, or its suspension has lapsed. A suspended or under-review owner's
-- listings drop out of every view but their own.
create function private.owner_ok(u uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p
                 where p.id = u
                   and (p.status = 'active'
                        or (p.status = 'suspended' and p.suspended_until is not null and p.suspended_until <= now())));
$$;

-- The caller wrote this listing. The policies call this instead of naming `owner`, so they never
-- depend on whether a policy expression needs column privilege on a column no role may select.
create function private.owns(listing uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.listings x where x.id = listing and x.owner = (select auth.uid()));
$$;

-- The listing is open, unended, from an owner in good standing and not blocked either way: the
-- visibility rule market_search and market_listing apply, for the SELECT policy.
create function private.can_see(listing uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.listings x
                 where x.id = listing and x.status = 'open' and x.ends_on >= private.today()
                   and private.owner_ok(x.owner)
                   and not private.blocked(x.owner, (select auth.uid())));
$$;

-- The INSERT policy's rule (section 4): a member; cash only while cash_open; meetups, rooms and rides
-- from accounts at least 24 hours old.
create function private.can_post(k public.market_kind)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_member()
     and (k <> 'cash' or private.setting_on('cash_open'))
     and (k not in ('meetup', 'room', 'ride')
          or exists (select 1 from public.profiles p
                     where p.id = (select auth.uid()) and p.created_at <= now() - interval '24 hours'));
$$;

-- Search folds text more lightly than the text check does: NFKC, zero-width characters out,
-- accents out (Vietnamese included, d-stroke to d), lower case. It keeps digits as digits, so
-- "iphone 15" stays searchable; the moderation map (0 to o, 1 to i ...) is for rejecting text only.
create function private.search_fold(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(translate(
           regexp_replace(
             regexp_replace(normalize(normalize(coalesce(t, ''), NFKC), NFD),
                            '[' || chr(173) || chr(8203) || '-' || chr(8207) || chr(8288) || chr(65279) || ']', '', 'g'),
             '[' || chr(768) || '-' || chr(879) || ']', '', 'g'),
           chr(273) || chr(272), 'dd'));
$$;

-- The one list of listing columns that leave the server. No owner, report weight or search columns.
create function private.listing_json(l public.listings)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', l.id, 'kind', l.kind, 'intent', l.intent, 'category', l.category,
    'city', l.city, 'to_city', l.to_city, 'starts_on', l.starts_on, 'ends_on', l.ends_on,
    'title', l.title, 'body', l.body, 'price_amount', l.price_amount, 'price_currency', l.price_currency,
    'seats', l.seats, 'room_type', l.room_type, 'activity', l.activity,
    'have_currency', l.have_currency, 'have_amount', l.have_amount, 'want_currency', l.want_currency,
    'created_at', l.created_at);
$$;

-- ---- the text check, again: display names skip `in_names = false` terms ----------------------
-- Same body as 001 apart from the `in_names` line; the script range is built with chr() so the
-- file holds no escapes (U+0E00 to U+0EFF is Thai and Lao, U+1780 to U+17FF is Khmer).
create or replace function private.text_hit(t text, for_name boolean)
returns text
language sql
stable
set search_path = ''
as $$
  with s as (
    select private.normalise(t) as n,
           ' ' || regexp_replace(private.normalise(t), '[^[:alnum:]]+', ' ', 'g') || ' ' as words
  )
  select ft.level
  from private.filter_terms ft, s
  where (ft.category <> 'name' or for_name)
    and (ft.in_names or not for_name)
    and case
          when ft.term ~ ('[' || chr(3584) || '-' || chr(3839) || chr(6016) || '-' || chr(6143) || ']')
            then strpos(s.n, private.normalise(ft.term)) > 0
          else strpos(s.words, ' ' || regexp_replace(private.normalise(ft.term), '[^[:alnum:]]+', ' ', 'g') || ' ') > 0
        end
  order by (ft.level = 'block') desc
  limit 1;
$$;

-- ---- contact details in listings (section 8; app links only, owner ruling 2026-10-19) ----------------
-- True when the text holds a phone number, an email address, a URL, a bare domain, an @handle or
-- a messenger name. Phone numbers are 8 or more digits once spaces, dots, dashes and brackets are
-- removed; Thai, Lao and Khmer digits count. Dates and prices are taken out first, so
-- "2026-10-20", "15.000.000 VND" and "1000-1500 per night" pass; a list of sizes such as
-- "38 39 40 41" still reads as a number (known, and the copy says so).
-- BEGIN contact_hit (scripts/check-market-sql.py runs this block's patterns in Python; keep the markers)
create function private.contact_hit(t text)
returns boolean
language plpgsql
immutable
parallel safe
set search_path = ''
as $$
declare
  -- Non-ASCII characters are built with chr() so this file stays ASCII (CLAUDE.md, pbcopy).
  dash       constant text := chr(8211);                                   -- en dash
  symbols    constant text := chr(3647) || chr(8363) || chr(8365) || chr(6107) || '$';  -- baht dong kip riel dollar
  seps       constant text := ' .,()' || chr(8211) || '-';                 -- separators inside a number
  units      constant text := 'k|m|tr|thb|baht|bath|b|vnd|dong|usd|kip|lak|riel|khr|per|each|pp|night|nights|day|days|week|weeks|month|months|' || chr(273);
  local_from constant text := (select string_agg(chr(b + d), '' order by b, d)
                               from unnest(array[3664, 3792, 6112]) as b, generate_series(0, 9) as d);  -- Thai, Lao, Khmer digits
  -- One price amount: no leading zero (a phone number has one), up to 9 digits or groups of
  -- three, optional cents, and not the tail of a longer run of digits.
  amount     constant text := '(?<![0-9+])(?<![0-9][' || seps || '])([1-9][0-9]{0,8}|[1-9][0-9]{0,2}([.,][0-9]{3})+)([.,][0-9]{1,2})?';
  tail       constant text := '( ?[' || dash || '-] ?([1-9][0-9]{0,8}|[1-9][0-9]{0,2}([.,][0-9]{3})+)([.,][0-9]{1,2})?)?';
  unit       constant text := '( ?([' || symbols || '/]|(' || units || ')[[:>:]]))';
  sign       constant text := '(us[$]|[' || symbols || ']) ?';
  iso_date   constant text := '[[:<:]](19|20)[0-9]{2}[-./](0?[1-9]|1[0-2])[-./](0?[1-9]|[12][0-9]|3[01])[[:>:]]';
  dmy_date   constant text := '[[:<:]](0?[1-9]|[12][0-9]|3[01])[-./](0?[1-9]|[12][0-9]|3[01])[-./]((19|20)?[0-9]{2})[[:>:]]';
  domain_re  constant text := '[[:alnum:]-]+[.](com|net|org|info|biz|io|co|app|dev|xyz|link|site|online|store|shop|page|asia|travel|ly|gg|tv|cc|ws|bio|vip|club|me|th|vn|kh|la|mm|sg|ph|uk|de|fr|au|ca|ru|cn|jp|kr)[[:>:]]';
  r          text;
  digits     text;
  words      text;
begin
  r := lower(normalize(coalesce(t, ''), NFKC));
  if r = '' then
    return false;
  end if;
  -- URLs, emails, bare domains and @handles.
  if r ~ '(https?|ftp)://' or r ~ 'www[.][[:alnum:]-]'
     or r ~ '[[:alnum:]._%+-]+@[[:alnum:]-]+([.][[:alnum:]-]+)*[.][[:alpha:]]{2,}'
     or r ~ domain_re
     or r ~ '(^|[^[:alnum:]_.])@[[:alpha:]_][[:alnum:]_.]+' then
    return true;
  end if;
  -- Messenger names and "line id", whole words on the normalised text (so "wh@tsapp" and "l1ne id" count).
  words := ' ' || regexp_replace(private.normalise(t), '[^[:alnum:]]+', ' ', 'g') || ' ';
  if strpos(words, ' line id ') > 0 or strpos(words, ' lineid ') > 0
     or strpos(words, ' whatsapp ') > 0 or strpos(words, ' whats app ') > 0
     or strpos(words, ' telegram ') > 0 or strpos(words, ' zalo ') > 0
     or strpos(words, ' wechat ') > 0 or strpos(words, ' viber ') > 0 or strpos(words, ' kakaotalk ') > 0 then
    return true;
  end if;
  -- Phone numbers: local digits to ASCII, dates and prices out, separators out, 8 digits in a row.
  digits := translate(r, local_from, repeat('0123456789', 3));
  digits := regexp_replace(digits, iso_date, 'x', 'g');
  digits := regexp_replace(digits, dmy_date, 'x', 'g');
  digits := regexp_replace(digits, sign || amount || tail, 'x', 'g');
  digits := regexp_replace(digits, amount || tail || unit, 'x', 'g');
  digits := regexp_replace(digits, '[' || seps || ']', '', 'g');
  return digits ~ '[0-9]{8}';
end;
$$;
-- END contact_hit

-- ---- the display-name trigger, again: the 3-a-day limit on changes (section 9) -----------------------
create or replace function private.profiles_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n       int;
  changed boolean := false;
begin
  new.display_name := btrim(new.display_name);
  if private.text_hit(new.display_name, true) = 'block' then
    raise exception using errcode = 'P0001', message = 'name_rejected';
  end if;
  if tg_op = 'UPDATE' then
    changed := new.display_name is distinct from old.display_name;
  end if;
  if changed and private.by_client() then
    perform pg_advisory_xact_lock(hashtextextended('market:name:' || new.id::text, 0));
    select count(*) into n from private.name_changes c
    where c.user_id = new.id and c.changed_at > now() - interval '24 hours';
    if n >= 3 then
      raise exception using errcode = 'P0001', message = 'rate_limited:name';
    end if;
    insert into private.name_changes (user_id) values (new.id);
  end if;
  return new;
end;
$$;

-- ---- the listings trigger (section 3, section 8, section 9) ---------------------------------------------------------
create function private.listings_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  client   boolean := private.by_client();
  uid      uuid := (select auth.uid());
  d0       date := private.today();
  is_new   boolean := false;
  max_days int;
  n        int;
  texts    boolean;
  currencies constant text[] := array['THB', 'VND', 'KHR', 'LAK', 'USD'];
begin
  if tg_op = 'INSERT' then
    if client then
      if uid is null then
        raise exception using errcode = '28000', message = 'not_signed_in';
      end if;
      if not private.is_member() then
        raise exception using errcode = 'P0001', message = 'not_member';
      end if;
      new.owner := uid;
      new.status := 'open';
      new.report_weight := 0;
      new.created_at := now();
      is_new := exists (select 1 from public.profiles p where p.id = uid and p.created_at > now() - interval '24 hours');
      if new.kind = 'cash' and not private.setting_on('cash_open') then
        raise exception using errcode = 'P0001', message = 'cash_closed';
      end if;
      if new.kind in ('meetup', 'room', 'ride') and is_new then
        raise exception using errcode = 'P0001', message = 'account_too_new';
      end if;
    end if;
    new.updated_at := new.created_at;

    -- Places.
    if not exists (select 1 from public.cities c where c.id = new.city) then
      raise exception using errcode = 'P0001', message = 'city_invalid';
    end if;

    -- Kind and intent (section 3 table); a field that belongs to another kind is refused.
    case new.kind
      when 'item' then
        if new.intent not in ('give', 'sell', 'trade', 'request') then
          raise exception using errcode = 'P0001', message = 'kind_intent';
        end if;
        if num_nonnulls(new.to_city, new.room_type, new.activity, new.seats,
                        new.have_currency, new.have_amount, new.want_currency) > 0 then
          raise exception using errcode = 'P0001', message = 'kind_fields';
        end if;
        if new.category is null then
          raise exception using errcode = 'P0001', message = 'category_invalid';
        end if;
        max_days := 30;
      when 'meetup' then
        if new.intent <> 'join' then
          raise exception using errcode = 'P0001', message = 'kind_intent';
        end if;
        if num_nonnulls(new.category, new.to_city, new.room_type,
                        new.have_currency, new.have_amount, new.want_currency) > 0 then
          raise exception using errcode = 'P0001', message = 'kind_fields';
        end if;
        if new.activity is null then
          raise exception using errcode = 'P0001', message = 'activity_invalid';
        end if;
        if new.seats is null or new.seats < 2 then
          raise exception using errcode = 'P0001', message = 'seats_invalid';
        end if;
        max_days := 7;
      when 'room' then
        if new.intent not in ('offer', 'seek') then
          raise exception using errcode = 'P0001', message = 'kind_intent';
        end if;
        if num_nonnulls(new.category, new.to_city, new.activity, new.seats,
                        new.have_currency, new.have_amount, new.want_currency) > 0 then
          raise exception using errcode = 'P0001', message = 'kind_fields';
        end if;
        if new.room_type is null then
          raise exception using errcode = 'P0001', message = 'room_type_invalid';
        end if;
        max_days := 30;
      when 'ride' then
        if new.intent not in ('offer', 'seek') then
          raise exception using errcode = 'P0001', message = 'kind_intent';
        end if;
        if num_nonnulls(new.category, new.room_type, new.activity,
                        new.have_currency, new.have_amount, new.want_currency) > 0 then
          raise exception using errcode = 'P0001', message = 'kind_fields';
        end if;
        if new.to_city is null or new.to_city = new.city
           or not exists (select 1 from public.cities c where c.id = new.to_city) then
          raise exception using errcode = 'P0001', message = 'to_city_invalid';
        end if;
        if new.intent = 'offer' and new.seats is null then
          raise exception using errcode = 'P0001', message = 'seats_invalid';
        end if;
        max_days := 3;
      when 'cash' then
        if new.intent <> 'offer' then
          raise exception using errcode = 'P0001', message = 'kind_intent';
        end if;
        if num_nonnulls(new.category, new.to_city, new.room_type, new.activity, new.seats,
                        new.price_amount, new.price_currency) > 0 then
          raise exception using errcode = 'P0001', message = 'kind_fields';
        end if;
        new.have_currency := upper(btrim(new.have_currency));
        new.want_currency := upper(btrim(new.want_currency));
        if new.have_amount is null or new.have_amount <= 0 or new.have_amount = 'NaN'::numeric
           or new.have_currency is null or not (new.have_currency = any (currencies))
           or new.want_currency is null or not (new.want_currency = any (currencies))
           or new.have_currency = new.want_currency then
          raise exception using errcode = 'P0001', message = 'currency_invalid';
        end if;
        max_days := 14;
    end case;

    -- Price: give is always free; sell needs a price above 0; a price above 0 names a currency.
    if new.kind <> 'cash' then
      new.price_currency := nullif(upper(btrim(coalesce(new.price_currency, ''))), '');
      if new.intent = 'give' then
        if coalesce(new.price_amount, 0) <> 0 then
          raise exception using errcode = 'P0001', message = 'price_invalid';
        end if;
        new.price_amount := 0;
      end if;
      if new.price_amount < 0 or new.price_amount = 'NaN'::numeric
         or (new.intent = 'sell' and coalesce(new.price_amount, 0) <= 0) then
        raise exception using errcode = 'P0001', message = 'price_invalid';
      end if;
      if coalesce(new.price_amount, 0) > 0 then
        if new.price_currency is null or not (new.price_currency = any (currencies)) then
          raise exception using errcode = 'P0001', message = 'currency_invalid';
        end if;
      else
        new.price_currency := null;
      end if;
    end if;

    -- The window (section 3): an order, a length cap per kind, and (for requests) not past, not too far.
    if new.starts_on is null or new.ends_on is null then
      raise exception using errcode = 'P0001', message = 'dates_required';
    end if;
    if new.ends_on < new.starts_on then
      raise exception using errcode = 'P0001', message = 'window_order';
    end if;
    if client and new.ends_on < d0 then
      raise exception using errcode = 'P0001', message = 'window_past';
    end if;
    if client and new.starts_on > d0 + 90 then
      raise exception using errcode = 'P0001', message = 'starts_too_late';
    end if;
    if (new.ends_on - new.starts_on) + 1 > max_days then
      raise exception using errcode = 'P0001', message = 'window_too_long';
    end if;

  elsif tg_op = 'UPDATE' then
    if client then
      if uid is distinct from old.owner then
        -- Only an admin gets here past the UPDATE policy, and an admin changes the status only.
        if not private.is_admin()
           or new.title is distinct from old.title or new.body is distinct from old.body then
          raise exception using errcode = 'P0001', message = 'not_owner';
        end if;
      elsif new.status is distinct from old.status and new.status not in ('closed', 'deleted') then
        raise exception using errcode = 'P0001', message = 'status_invalid';
      end if;
    end if;
    new.updated_at := now();
  end if;

  -- Title and body: on insert, and when either changes.
  -- OLD is null on INSERT, so the change test is split from the INSERT test.
  if tg_op = 'INSERT' then
    texts := true;
  else
    texts := new.title is distinct from old.title or new.body is distinct from old.body;
  end if;
  if texts then
    new.title := btrim(coalesce(new.title, ''));
    new.body := btrim(replace(replace(coalesce(new.body, ''), chr(13), ''), chr(9), ' '));
    if char_length(new.title) not between 3 and 80 then
      raise exception using errcode = 'P0001', message = 'title_length';
    end if;
    if new.title ~ '[[:cntrl:]]' then
      raise exception using errcode = 'P0001', message = 'title_invalid';
    end if;
    if char_length(new.body) > 400 then
      raise exception using errcode = 'P0001', message = 'body_length';
    end if;
    if replace(new.body, chr(10), '') ~ '[[:cntrl:]]' then
      raise exception using errcode = 'P0001', message = 'body_invalid';
    end if;
    if private.text_hit(new.title, false) = 'block' or private.text_hit(new.body, false) = 'block' then
      raise exception using errcode = 'P0001', message = 'text_rejected';
    end if;
    if private.contact_hit(new.title) or private.contact_hit(new.body) then
      raise exception using errcode = 'P0001', message = 'contact_details';
    end if;
    new.search_text := private.search_fold(new.title) || ' ' || private.search_fold(new.body);
    new.search := to_tsvector('simple'::regconfig, new.search_text);
  end if;

  -- Rate limits (section 9), for requests only, counted over the caller's own rows. The lock makes two
  -- posts at once from one account wait for each other, so both cannot pass the same count.
  if tg_op = 'INSERT' and client then
    perform pg_advisory_xact_lock(hashtextextended('market:listing:' || uid::text, 0));
    select count(*) into n from public.listings l
    where l.owner = uid and l.created_at > now() - interval '24 hours';
    if n >= (case when is_new then 2 else 5 end) then
      raise exception using errcode = 'P0001', message = 'rate_limited:post';
    end if;
    select count(*) into n from public.listings l
    where l.owner = uid and l.status = 'open' and l.ends_on >= d0;
    if n >= (case when is_new then 3 else 10 end) then
      raise exception using errcode = 'P0001', message = 'rate_limited:open';
    end if;
    if exists (select 1 from public.listings l
               where l.owner = uid and l.created_at > now() - interval '24 hours'
                 and private.normalise(l.title) = private.normalise(new.title)) then
      raise exception using errcode = 'P0001', message = 'rate_limited:same_title';
    end if;
  end if;

  return new;
end;
$$;

create trigger listings_check
  before insert or update on public.listings
  for each row execute function private.listings_check();

-- A flag term accepts the text and files one system report (reason `filter`, weight 1, section 8).
create function private.listings_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.text_hit(new.title, false) = 'flag' or private.text_hit(new.body, false) = 'flag' then
    insert into public.reports (reporter, listing_id, reason) values (null, new.id, 'filter')
    on conflict do nothing;
  end if;
  return null;
end;
$$;

create trigger listings_flag
  after insert or update of title, body on public.listings
  for each row execute function private.listings_flag();

-- ---- the reports triggers (section 8, section 9) -------------------------------------------------------------
create function private.reports_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  client boolean := private.by_client();
  uid    uuid := (select auth.uid());
  l      public.listings%rowtype;
  n      int;
begin
  if client then
    if uid is null then
      raise exception using errcode = '28000', message = 'not_signed_in';
    end if;
    if not private.is_member() then
      raise exception using errcode = 'P0001', message = 'not_member';
    end if;
    new.reporter := uid;
    if new.reason = 'filter' then
      raise exception using errcode = 'P0001', message = 'report_reason_invalid';
    end if;
    -- People report listings in M4a; message and profile reports arrive with M5 and M7.
    if new.listing_id is null or new.message_id is not null or new.profile_id is not null then
      raise exception using errcode = 'P0001', message = 'report_target_invalid';
    end if;
    new.note := nullif(btrim(coalesce(new.note, '')), '');
    if char_length(new.note) > 300 then
      raise exception using errcode = 'P0001', message = 'note_length';
    end if;
    new.created_at := now();
  end if;
  if num_nonnulls(new.listing_id, new.message_id, new.profile_id) <> 1 then
    raise exception using errcode = 'P0001', message = 'report_target_invalid';
  end if;

  if new.listing_id is not null then
    select * into l from public.listings x where x.id = new.listing_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'report_target_invalid';
    end if;
    if client then
      if l.owner = uid then
        raise exception using errcode = 'P0001', message = 'own_listing';
      end if;
      -- The reporter must be able to see the listing now.
      if not (l.status = 'open' and l.ends_on >= private.today() and private.owner_ok(l.owner)
              and not private.blocked(l.owner, uid)) then
        raise exception using errcode = 'P0001', message = 'report_target_invalid';
      end if;
    end if;
    new.target_user := l.owner;
    new.snapshot := jsonb_build_object(
      'kind', l.kind, 'intent', l.intent, 'category', l.category, 'city', l.city, 'to_city', l.to_city,
      'starts_on', l.starts_on, 'ends_on', l.ends_on, 'title', l.title, 'body', l.body,
      'price_amount', l.price_amount, 'price_currency', l.price_currency,
      'status', l.status, 'created_at', l.created_at);
  end if;

  if client then
    perform pg_advisory_xact_lock(hashtextextended('market:report:' || uid::text, 0));
    if exists (select 1 from public.reports r where r.reporter = uid and r.listing_id = new.listing_id) then
      raise exception using errcode = 'P0001', message = 'already_reported';
    end if;
    select count(*) into n from public.reports r
    where r.reporter = uid and r.created_at > now() - interval '24 hours';
    if n >= (case when exists (select 1 from public.profiles p
                               where p.id = uid and p.created_at > now() - interval '24 hours')
                  then 3 else 10 end) then
      raise exception using errcode = 'P0001', message = 'rate_limited:report';
    end if;
  end if;

  new.status := 'open';
  new.resolved_at := null;
  return new;
end;
$$;

create trigger reports_check
  before insert on public.reports
  for each row execute function private.reports_check();

-- Report weight and auto-hide (section 8): distinct people whose accounts were at least 24 hours old when
-- they reported, plus system flags, over reports not dismissed. At 3 an open listing is hidden.
-- The "Hidden after reports" notification arrives with the notifications table (M5).
create function private.reports_weigh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  w int;
begin
  if new.listing_id is not null then
    -- One report at a time per listing: two people reporting together would each count the other
    -- as not yet there, and the third report would not hide it.
    perform pg_advisory_xact_lock(hashtextextended('market:weigh:' || new.listing_id::text, 0));
    select count(distinct r.reporter) filter (where r.reporter is not null
                                                and p.created_at <= r.created_at - interval '24 hours')
         + count(*) filter (where r.reporter is null and r.reason = 'filter')
      into w
    from public.reports r
    left join public.profiles p on p.id = r.reporter
    where r.listing_id = new.listing_id and r.status <> 'dismissed';
    update public.listings l
    set report_weight = least(w, 32767),
        status = case when w >= 3 and l.status = 'open' then 'hidden'::public.listing_status else l.status end
    where l.id = new.listing_id;
  end if;
  return null;
end;
$$;

create trigger reports_weigh
  after insert on public.reports
  for each row execute function private.reports_weigh();

-- ---- policies (section 4) -----------------------------------------------------------------------------
create policy listings_select on public.listings
  for select to authenticated
  using (
    private.owns(id)
    or (select private.is_admin())
    or ((select private.is_member()) and private.can_see(id))
  );

-- The owner is stamped by the BEFORE trigger (a client cannot set the column), so the check holds
-- the rest of the section 4 rule: a member, cash only while cash_open, a 24-hour account for
-- meetups, rooms and rides.
create policy listings_insert on public.listings
  for insert to authenticated
  with check (private.can_post(kind));

create policy listings_update on public.listings
  for update to authenticated
  using ((private.owns(id) and status in ('open', 'closed')) or (select private.is_admin()))
  with check (private.owns(id) or (select private.is_admin()));

-- No DELETE policy: the retention job purges rows (section 10, M7).

create policy reports_insert on public.reports
  for insert to authenticated
  with check (
    reporter = (select auth.uid())
    and (select private.is_member())
    and exists (select 1 from public.listings l where l.id = reports.listing_id)
  );

-- No SELECT or UPDATE grant on reports: the admin review RPCs arrive with M7.

create policy blocks_select on public.blocks
  for select to authenticated
  using (blocker = (select auth.uid()));

create policy blocks_insert on public.blocks
  for insert to authenticated
  with check (blocker = (select auth.uid()) and blocked <> (select auth.uid()));

create policy blocks_delete on public.blocks
  for delete to authenticated
  using (blocker = (select auth.uid()));

-- ---- RPCs (section 4) ---------------------------------------------------------------------------------
-- Search (section 17, M4a): open, unended listings whose owner is in good standing and not blocked
-- either way, with free text, filters, four sorts and pages of at most 50. Each row is
-- private.listing_json() plus `total`, the number of rows that match before paging.
--   q          free text over title and body
--   kind, category, city (the departure city for a ride)
--   date_from, date_to   the listing's window overlaps these days
--   price_min, price_max with currency (a free listing is inside any range that starts at 0)
--   free_only  price 0 only
--   sort       newest | soonest | price_up | price_down (price sorts compare amounts, so pair
--              them with a city or a currency)
--   page, page_size      page from 0 to 199; size 1 to 50, default 24
create function public.market_search(
  q         text               default null,
  kind      public.market_kind default null,
  category  text               default null,
  city      text               default null,
  date_from date               default null,
  date_to   date               default null,
  price_min numeric            default null,
  price_max numeric            default null,
  currency  text               default null,
  free_only boolean            default false,
  sort      text               default 'newest',
  page      integer            default 0,
  page_size integer            default 24
)
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_today  date := private.today();
  v_q      text := left(private.search_fold(btrim(coalesce(market_search.q, ''))), 100);
  v_script boolean;
  v_words  text[];
  v_cur    text := nullif(upper(btrim(coalesce(market_search.currency, ''))), '');
  v_sort   text := coalesce(market_search.sort, 'newest');
  v_page   integer := coalesce(market_search.page, 0);
  v_size   integer := least(greatest(coalesce(market_search.page_size, 24), 1), 50);
begin
  if not (private.setting_on('market_open') or private.is_member() or private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'market_closed';
  end if;
  if v_sort not in ('newest', 'soonest', 'price_up', 'price_down') then
    raise exception using errcode = 'P0001', message = 'sort_invalid';
  end if;
  if v_page < 0 or v_page > 199 then
    raise exception using errcode = 'P0001', message = 'page_invalid';
  end if;
  if (market_search.price_min is not null or market_search.price_max is not null) and v_cur is null then
    raise exception using errcode = 'P0001', message = 'currency_required';
  end if;

  v_script := v_q ~ ('[' || chr(3584) || '-' || chr(3839) || chr(6016) || '-' || chr(6143) || ']');
  if not v_script then
    -- The words come from the parser that built the stored vector, so "3.5" is one word on both sides.
    v_words := array(select ts.lexeme from unnest(to_tsvector('simple'::regconfig, v_q)) as ts limit 8);
    if cardinality(v_words) = 0 then
      v_q := '';
    end if;
  end if;

  return query
  select private.listing_json(l) || jsonb_build_object('total', count(*) over ())
  from public.listings l
  join public.profiles p on p.id = l.owner
  where l.status = 'open'
    and l.ends_on >= v_today
    and (p.status = 'active' or (p.status = 'suspended' and p.suspended_until is not null and p.suspended_until <= now()))
    and (v_uid is null or not exists (select 1 from public.blocks b
                                      where (b.blocker = l.owner and b.blocked = v_uid)
                                         or (b.blocker = v_uid and b.blocked = l.owner)))
    and (market_search.kind is null or l.kind = market_search.kind)
    and (market_search.category is null or l.category = market_search.category)
    and (market_search.city is null or l.city = market_search.city)
    and (market_search.date_from is null or l.ends_on >= market_search.date_from)
    and (market_search.date_to is null or l.starts_on <= market_search.date_to)
    and (not coalesce(market_search.free_only, false) or l.price_amount = 0)
    and ((market_search.price_min is null and market_search.price_max is null)
         or (l.price_amount is not null
             and (l.price_amount = 0 or l.price_currency = v_cur)
             and l.price_amount >= coalesce(market_search.price_min, 0)
             and (market_search.price_max is null or l.price_amount <= market_search.price_max)))
    and (v_q = ''
         or (v_script and strpos(l.search_text, v_q) > 0)
         or (not v_script and not exists (
               -- Every word must match, by prefix or, from 4 letters, as a typo of a word in the
               -- text. The typo test is per word: a whole-query similarity would let one long
               -- shared word match everything.
               select 1 from unnest(v_words) as w
               where not (l.search @@ to_tsquery('simple'::regconfig, quote_literal(w) || ':*')
                          or (char_length(w) >= 4 and extensions.word_similarity(w, l.search_text) >= 0.6)))))
  order by
    case when v_sort = 'price_up' then l.price_amount end asc nulls last,
    case when v_sort = 'price_down' then l.price_amount end desc nulls last,
    case when v_sort = 'soonest' then greatest(l.starts_on, v_today) end asc,
    case when v_sort = 'soonest' then l.ends_on end asc,
    l.created_at desc,
    l.id desc
  limit v_size offset v_page * v_size;
end;
$$;

-- One listing for its page: visible as search shows it, or the caller's own in any status but
-- deleted. Adds `status`, `mine` and `member_since` (the owner's month of joining, "YYYY-MM": a
-- month, not a time, so it cannot link two listings by itself). Null when there is nothing to show.
create function public.market_listing(listing_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_row jsonb;
begin
  if not (private.setting_on('market_open') or private.is_member() or private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'market_closed';
  end if;
  select private.listing_json(l) || jsonb_build_object(
           'status', l.status,
           'mine', coalesce(l.owner = v_uid, false),
           'member_since', to_char(p.created_at at time zone 'Asia/Bangkok', 'YYYY-MM'))
    into v_row
  from public.listings l
  join public.profiles p on p.id = l.owner
  where l.id = market_listing.listing_id
    and ((v_uid is not null and l.owner = v_uid and l.status <> 'deleted')
         or (l.status = 'open'
             and l.ends_on >= private.today()
             and (p.status = 'active' or (p.status = 'suspended' and p.suspended_until is not null and p.suspended_until <= now()))
             and (v_uid is null or not exists (select 1 from public.blocks b
                                               where (b.blocker = l.owner and b.blocked = v_uid)
                                                  or (b.blocker = v_uid and b.blocked = l.owner)))));
  return v_row;
end;
$$;

-- The caller's own listings in any status but deleted, newest first (section 4): how the client learns
-- which cards are its own. Adds `status` and `updated_at`.
create function public.market_my_listings()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'not_signed_in';
  end if;
  return query
  select private.listing_json(l) || jsonb_build_object('status', l.status, 'updated_at', l.updated_at)
  from public.listings l
  where l.owner = v_uid and l.status <> 'deleted'
  order by l.created_at desc, l.id desc
  limit 100;
end;
$$;

-- ---- function grants ---------------------------------------------------------------------------
revoke execute on function
  private.today(), private.by_client(), private.blocked(uuid, uuid), private.owner_ok(uuid),
  private.can_post(public.market_kind), private.listing_json(public.listings), private.contact_hit(text),
  private.search_fold(text), private.owns(uuid), private.can_see(uuid),
  private.listings_check(), private.listings_flag(), private.reports_check(), private.reports_weigh()
  from public, anon, authenticated;
-- Policies call these as the caller. The others (today, blocked, owner_ok) run inside the definer
-- helpers and the RPCs, so no role needs them.
grant execute on function
  private.can_post(public.market_kind), private.owns(uuid), private.can_see(uuid)
  to authenticated;

revoke execute on function
  public.market_search(text, public.market_kind, text, text, date, date, numeric, numeric, text, boolean, text, integer, integer),
  public.market_listing(uuid), public.market_my_listings()
  from public, anon, authenticated;
-- Visitors browse (owner ruling 2026-10-19); only the gate above stands between them and the rows.
grant execute on function
  public.market_search(text, public.market_kind, text, text, date, date, numeric, numeric, text, boolean, text, integer, integer),
  public.market_listing(uuid)
  to anon, authenticated;
grant execute on function public.market_my_listings() to authenticated;

notify pgrst, 'reload schema';

commit;
