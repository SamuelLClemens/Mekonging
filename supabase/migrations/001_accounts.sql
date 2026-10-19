-- Migration 001: accounts and sign-in, closed beta (docs/EXCHANGE.md §3, §4, §5, §8 and §17, M3).
--
-- Run it once, whole, in the Supabase SQL editor (which runs as `postgres`). It is one
-- transaction and assumes the fresh project: a second run fails at `create schema private`
-- and changes nothing. supabase/tests/001_rls.sql proves it afterwards.
--
-- Ground rules (§4):
--   * RLS is on for every table here, in `public` and in `private`.
--   * `anon` has no grant on anything here: reading the market requires sign-in.
--   * Every function loses the default PUBLIC EXECUTE (and Supabase's default anon and
--     authenticated EXECUTE in `public`), then gets exactly the grants it needs.
--   * Helpers live in `private`, which the Data API does not expose. Every function pins
--     `search_path = ''`, so each name inside it is schema-qualified.
--
-- What this migration does not hold: listings, reports, rate limits (M4), threads, messages,
-- blocks, notifications (M5), sanctions and the review queue (M7).

begin;

-- ---- schemas ----------------------------------------------------------------------------------
create schema private;
revoke all on schema private from public;
-- A policy runs as the caller, and the profiles policy calls private.is_admin(), so the signed-in
-- role must be able to reach the schema. USAGE alone reads nothing: no table in it is granted.
grant usage on schema private to authenticated;

-- ---- types ------------------------------------------------------------------------------------
create type public.profile_status as enum ('active', 'review', 'suspended');

-- ---- tables -----------------------------------------------------------------------------------
-- One row per account. The email stays in auth.users only.
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null
    constraint profiles_name_length  check (char_length(display_name) between 1 and 40)
    constraint profiles_name_trimmed check (display_name = btrim(display_name))
    constraint profiles_name_plain   check (display_name !~ '[[:cntrl:]]'),
  -- One emoji: small, and no letters, digits or spaces in any script.
  avatar             text
    constraint profiles_avatar_emoji check (avatar is null or (octet_length(avatar) between 1 and 16 and avatar !~ '[[:alnum:][:space:]]')),
  adult_confirmed_at timestamptz not null,
  terms_version      text not null,
  status             public.profile_status not null default 'active',
  suspended_until    timestamptz,
  created_at         timestamptz not null default now()
);

-- The only places a listing can name. Seeded below from scripts/build-market-cities.py.
create table public.cities (
  id      text primary key
    constraint cities_id_shape check (id ~ '^(th|vi|kh|la)-[a-z0-9]+(-[a-z0-9]+)*$'),
  country char(2) not null
    constraint cities_country check (country in ('th', 'vi', 'kh', 'la')),
  name    text not null
    constraint cities_name_length check (char_length(name) between 1 and 60),
  constraint cities_id_country check (left(id, 2) = country)
);

create table private.admins (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table private.testers (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

create table private.settings (
  key   text primary key
    constraint settings_key check (key in ('market_open', 'cash_open', 'terms_version')),
  value jsonb not null
);

-- The text check's word list (§8). `block` rejects the text; `flag` accepts it and, once the
-- reports table exists (M4), files a system report. Category `name` applies to display names only.
create table private.filter_terms (
  term     text not null constraint filter_terms_term check (char_length(btrim(term)) between 2 and 60),
  level    text not null constraint filter_terms_level check (level in ('block', 'flag')),
  category text not null,
  lang     text not null constraint filter_terms_lang check (lang in ('en', 'th', 'vi', 'km', 'lo')),
  primary key (term, category)
);

alter table public.profiles      enable row level security;
alter table public.cities        enable row level security;
alter table private.admins       enable row level security;
alter table private.testers      enable row level security;
alter table private.settings     enable row level security;
alter table private.filter_terms enable row level security;

-- ---- table grants -----------------------------------------------------------------------------
-- Supabase grants every new table in `public` to anon and authenticated; take that back first.
revoke all on table public.profiles, public.cities from public, anon, authenticated;
revoke all on table private.admins, private.testers, private.settings, private.filter_terms from public, anon, authenticated;
grant select on table public.profiles to authenticated;
-- The column-restricted UPDATE (§4): a traveller changes their name and avatar, nothing else.
grant update (display_name, avatar) on table public.profiles to authenticated;
grant select on table public.cities to authenticated;

-- ---- settings and word list -------------------------------------------------------------------
insert into private.settings (key, value) values
  ('market_open',   'false'),
  ('cash_open',     'false'),
  -- The closed-beta terms. Legal sign-off on the real terms gates M9, not this migration.
  ('terms_version', '"beta-2026-10"');

-- §8 word list. The Thai, Vietnamese, Khmer and Lao entries are not yet checked by a native
-- speaker; that check is part of M4's done-when.
insert into private.filter_terms (term, level, category, lang)
select t, 'block', c, l from (values
  ('drugs', 'en', array['cannabis', 'marijuana', 'weed', 'ganja', 'hashish', 'kush', 'thc', 'cbd', 'pre-roll', 'preroll',
    'mdma', 'ecstasy', 'xtc', 'cocaine', 'ketamine', 'lsd', 'shrooms', 'magic mushroom', 'psilocybin', 'dmt', 'ayahuasca',
    'opium', 'heroin', 'meth', 'methamphetamine', 'yaba', 'kratom', 'happy shake', 'happy pizza', 'nitrous', 'laughing gas']),
  ('drugs', 'th', array['กัญชา', 'ยาบ้า', 'ยาไอซ์', 'ยาอี', 'เคตามีน', 'โคเคน', 'เฮโรอีน', 'ฝิ่น', 'เห็ดขี้ควาย', 'ใบกระท่อม']),
  ('drugs', 'vi', array['cần sa', 'bồ đà', 'thuốc lắc', 'ma túy', 'nấm thần']),
  ('drugs', 'km', array['កញ្ឆា', 'យ៉ាម៉ា', 'ម៉ាទឹកកក']),
  ('drugs', 'lo', array['ກັນຊາ', 'ຢາບ້າ']),
  ('prescription', 'en', array['tramadol', 'xanax', 'alprazolam', 'valium', 'diazepam', 'codeine', 'oxycodone']),
  ('weapons', 'en', array['gun', 'pistol', 'rifle', 'firearm', 'ammo', 'ammunition', 'taser', 'stun gun', 'brass knuckles']),
  ('wildlife', 'en', array['ivory', 'pangolin', 'rhino horn', 'tiger bone', 'tiger skin', 'bear bile']),
  ('documents', 'en', array['fake id', 'fake passport', 'fake licence', 'fake license', 'counterfeit', 'bank account for rent']),
  ('sex', 'en', array['escort', 'happy ending', 'sexual service', 'sugar daddy']),
  ('name', 'en', array['mekonging', 'admin', 'moderator', 'support', 'official', 'staff'])
) as lists (c, l, terms), unnest(terms) as t;

insert into private.filter_terms (term, level, category, lang)
select t, 'flag', c, l from (values
  ('drugs', 'en', array['hash', 'joint', 'blunt', 'edibles', 'gummies', 'molly', 'coke', 'acid', 'ice', '420', 'pills', 'poppers', 'bud', 'grass']),
  ('drugs', 'th', array['ไอซ์', 'กระท่อม']),
  ('prescription', 'en', array['antibiotics', 'prescription', 'oxy']),
  ('weapons', 'en', array['knife', 'machete', 'pepper spray']),
  ('wildlife', 'en', array['shark fin', 'turtle shell', 'coral']),
  ('documents', 'en', array['passport', 'western union', 'moneygram', 'gift card', 'usdt', 'crypto', 'bitcoin', 'deposit first',
    'advance payment', 'wire transfer'])
) as lists (c, l, terms), unnest(terms) as t;

-- ---- the text check (§8) ----------------------------------------------------------------------
-- Normalisation, applied to the text and to each term alike: NFKC, zero-width characters
-- removed, Vietnamese diacritics folded (đ to d), lower case, look-alikes mapped
-- (0→o 1→i 3→e 4→a 5→s @→a $→s), and runs of three or more of one character cut to two.
-- Lower case comes after the folding, so it works on plain letters whatever the database locale.
create function private.normalise(t text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select regexp_replace(
           translate(
             lower(
               regexp_replace(
                 normalize(regexp_replace(normalize(coalesce(t, ''), NFKC), '[\u00ad\u200b-\u200f\u2060\ufeff]', '', 'g'), NFD),
                 '[\u0300-\u036f]', '', 'g')),
             'đĐ01345@$', 'ddoieasas'),
           '(.)\1{2,}', '\1\1', 'g');
$$;

-- The level of the strongest term in `t` ('block', 'flag') or null. Thai, Lao and Khmer terms
-- match as substrings (no spaces between words); every other term matches whole words only.
-- `for_name` adds the display-name-only terms.
create function private.text_hit(t text, for_name boolean)
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
    and case
          when ft.term ~ '[\u0e00-\u0eff\u1780-\u17ff]'
            then strpos(s.n, private.normalise(ft.term)) > 0
          else strpos(s.words, ' ' || regexp_replace(private.normalise(ft.term), '[^[:alnum:]]+', ' ', 'g') || ' ') > 0
        end
  order by (ft.level = 'block') desc
  limit 1;
$$;

-- ---- helpers (§4) -----------------------------------------------------------------------------
create function private.setting_on(setting text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select s.value = 'true'::jsonb from private.settings s where s.key = setting), false);
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()));
$$;

create function private.is_tester()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.testers t where t.user_id = (select auth.uid()));
$$;

-- A profile exists for the caller, it is active (or its suspension has lapsed), and the market is
-- open or the caller is a tester.
create function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.profiles p
           where p.id = (select auth.uid())
             and (p.status = 'active'
                  or (p.status = 'suspended' and p.suspended_until is not null and p.suspended_until <= now())))
     and (private.setting_on('market_open') or private.is_tester());
$$;

-- ---- the display-name trigger -----------------------------------------------------------------
-- Runs on every insert and on every change of the name, whoever makes it; the client cannot skip it.
create function private.profiles_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.display_name := btrim(new.display_name);
  if private.text_hit(new.display_name, true) = 'block' then
    raise exception using errcode = 'P0001', message = 'name_rejected';
  end if;
  return new;
end;
$$;

create trigger profiles_check
  before insert or update of display_name on public.profiles
  for each row execute function private.profiles_check();

-- ---- policies (§4) ----------------------------------------------------------------------------
-- "A profile the caller shares a thread with" joins this policy in M5, with the threads table.
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy cities_select on public.cities
  for select to authenticated
  using (true);

-- No INSERT or DELETE policy on profiles: market_join creates the row and market_delete_account
-- removes the account. The private tables have no policy at all.

-- ---- RPCs (§4) --------------------------------------------------------------------------------
-- What the client needs to draw its state: the caller's profile (null before joining), whether
-- the caller can use the market now, whether it is open, and the current terms version.
create function public.market_me()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (select jsonb_build_object(
                         'display_name', p.display_name, 'avatar', p.avatar, 'status', p.status,
                         'suspended_until', p.suspended_until, 'created_at', p.created_at,
                         'terms_version', p.terms_version)
                from public.profiles p where p.id = (select auth.uid())),
    'member', private.is_member(),
    'open', private.setting_on('market_open'),
    'terms_version', (select s.value #>> '{}' from private.settings s where s.key = 'terms_version'));
$$;

-- Creates the caller's profile and records the 18+ confirmation and the terms version. A second
-- call changes nothing. Errors are raised as plain codes the client maps to copy.
create function public.market_join(display_name text, avatar text, terms_version text, adult boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid      uuid := (select auth.uid());
  v_name   text := btrim(coalesce(market_join.display_name, ''));
  v_avatar text := nullif(btrim(coalesce(market_join.avatar, '')), '');
begin
  if uid is null then
    raise exception using errcode = '28000', message = 'not_signed_in';
  end if;
  if market_join.adult is distinct from true then
    raise exception using errcode = 'P0001', message = 'adult_required';
  end if;
  if market_join.terms_version is distinct from
     (select s.value #>> '{}' from private.settings s where s.key = 'terms_version') then
    raise exception using errcode = 'P0001', message = 'terms_outdated';
  end if;
  if char_length(v_name) not between 1 and 40 then
    raise exception using errcode = 'P0001', message = 'name_length';
  end if;
  if v_avatar is not null and (octet_length(v_avatar) > 16 or v_avatar ~ '[[:alnum:][:space:]]') then
    raise exception using errcode = 'P0001', message = 'avatar_invalid';
  end if;
  -- The profiles trigger rejects a blocked name with name_rejected.
  insert into public.profiles (id, display_name, avatar, adult_confirmed_at, terms_version)
  values (uid, v_name, v_avatar, now(), market_join.terms_version)
  on conflict (id) do nothing;
  return public.market_me();
end;
$$;

-- Deletes the caller's auth user. The profile and the admin and tester rows cascade.
create function public.market_delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception using errcode = '28000', message = 'not_signed_in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

-- ---- function grants --------------------------------------------------------------------------
revoke execute on function
  private.normalise(text), private.text_hit(text, boolean), private.setting_on(text),
  private.is_admin(), private.is_tester(), private.is_member(), private.profiles_check()
  from public, anon, authenticated;
-- Policies call these as the caller (is_member from M4 on).
grant execute on function private.is_admin(), private.is_member() to authenticated;

revoke execute on function
  public.market_me(), public.market_join(text, text, text, boolean), public.market_delete_account()
  from public, anon, authenticated;
grant execute on function
  public.market_me(), public.market_join(text, text, text, boolean), public.market_delete_account()
  to authenticated;

-- ---- cities -----------------------------------------------------------------------------------
-- BEGIN GENERATED: cities (scripts/build-market-cities.py --write; do not edit by hand)
insert into public.cities (id, country, name) values
  ('kh-angkor-borei', 'kh', 'Angkor Borei'),
  ('kh-anlong-veng', 'kh', 'Anlong Veng'),
  ('kh-ba-phnom', 'kh', 'Ba Phnom'),
  ('kh-banlung', 'kh', 'Banlung'),
  ('kh-banteay-chhmar', 'kh', 'Banteay Chhmar'),
  ('kh-battambang', 'kh', 'Battambang'),
  ('kh-botum-sakor', 'kh', 'Botum Sakor'),
  ('kh-cardamom-mountains', 'kh', 'Cardamom Mountains'),
  ('kh-kampong-cham', 'kh', 'Kampong Cham'),
  ('kh-kampong-chhnang', 'kh', 'Kampong Chhnang'),
  ('kh-kampong-speu', 'kh', 'Kampong Speu'),
  ('kh-kampong-thom', 'kh', 'Kampong Thom'),
  ('kh-kampong-trach', 'kh', 'Kampong Trach'),
  ('kh-kampot', 'kh', 'Kampot'),
  ('kh-kep', 'kh', 'Kep'),
  ('kh-koh-kong', 'kh', 'Koh Kong'),
  ('kh-koh-rong', 'kh', 'Koh Rong'),
  ('kh-koh-rong-sanloem', 'kh', 'Koh Rong Sanloem'),
  ('kh-koh-sdach', 'kh', 'Koh Sdach'),
  ('kh-kratie', 'kh', 'Kratie'),
  ('kh-oudong', 'kh', 'Oudong'),
  ('kh-pailin', 'kh', 'Pailin'),
  ('kh-phnom-penh', 'kh', 'Phnom Penh'),
  ('kh-preah-rumkel', 'kh', 'Preah Rumkel (Stung Treng)'),
  ('kh-preah-vihear', 'kh', 'Preah Vihear'),
  ('kh-pursat', 'kh', 'Pursat'),
  ('kh-sambor', 'kh', 'Sambor (Kratie)'),
  ('kh-sen-monorom', 'kh', 'Sen Monorom'),
  ('kh-siem-reap', 'kh', 'Siem Reap'),
  ('kh-sihanoukville', 'kh', 'Sihanoukville'),
  ('kh-skun', 'kh', 'Skun'),
  ('kh-stung-treng', 'kh', 'Stung Treng'),
  ('kh-takeo', 'kh', 'Takeo'),
  ('kh-tonle-bati', 'kh', 'Tonle Bati'),
  ('kh-voen-sai', 'kh', 'Voen Sai (Ratanakiri)'),
  ('la-attapeu', 'la', 'Attapeu'),
  ('la-boualapha', 'la', 'Boualapha'),
  ('la-champasak', 'la', 'Champasak'),
  ('la-don-det', 'la', 'Don Det'),
  ('la-don-khon', 'la', 'Don Khon'),
  ('la-houameuang', 'la', 'Houameuang (near Sam Neua)'),
  ('la-huay-xai', 'la', 'Huay Xai'),
  ('la-kiet-ngong', 'la', 'Kiet Ngong'),
  ('la-luang-namtha', 'la', 'Luang Namtha'),
  ('la-luang-prabang', 'la', 'Luang Prabang'),
  ('la-muang-kham', 'la', 'Muang Kham'),
  ('la-muang-khoun', 'la', 'Muang Khoun'),
  ('la-muang-ngoi', 'la', 'Muang Ngoi'),
  ('la-muang-sing', 'la', 'Muang Sing'),
  ('la-muang-sui', 'la', 'Muang Sui'),
  ('la-nakai', 'la', 'Nakai'),
  ('la-nakasang', 'la', 'Nakasang'),
  ('la-nong-khiaw', 'la', 'Nong Khiaw'),
  ('la-oudomxai', 'la', 'Oudomxai (Muang Xai)'),
  ('la-pak-beng', 'la', 'Pak Beng'),
  ('la-pakkading', 'la', 'Pakkading'),
  ('la-paksan', 'la', 'Paksan'),
  ('la-pakse', 'la', 'Pakse'),
  ('la-paksong', 'la', 'Paksong'),
  ('la-phongsali', 'la', 'Phongsali'),
  ('la-phonsavan', 'la', 'Phonsavan'),
  ('la-sainyabuli', 'la', 'Sainyabuli (Xayaboury)'),
  ('la-salavan', 'la', 'Salavan'),
  ('la-sam-neua', 'la', 'Sam Neua'),
  ('la-savannakhet', 'la', 'Savannakhet'),
  ('la-sekong', 'la', 'Sekong'),
  ('la-si-phan-don', 'la', 'Si Phan Don'),
  ('la-tad-lo', 'la', 'Tad Lo'),
  ('la-thakhek', 'la', 'Thakhek'),
  ('la-thaphabat', 'la', 'Thaphabat'),
  ('la-vang-vieng', 'la', 'Vang Vieng'),
  ('la-vieng-xai', 'la', 'Vieng Xai'),
  ('la-viengthong', 'la', 'Viengthong (Muang Hiam)'),
  ('la-vientiane', 'la', 'Vientiane'),
  ('la-xaysetha', 'la', 'Xaysetha'),
  ('th-amphawa', 'th', 'Amphawa'),
  ('th-ayutthaya', 'th', 'Ayutthaya'),
  ('th-ban-phe', 'th', 'Ban Phe (Koh Samet)'),
  ('th-bang-krachao', 'th', 'Bang Krachao'),
  ('th-bangkok', 'th', 'Bangkok'),
  ('th-buriram', 'th', 'Buriram'),
  ('th-chiang-khong', 'th', 'Chiang Khong'),
  ('th-chiang-mai', 'th', 'Chiang Mai'),
  ('th-chiang-rai', 'th', 'Chiang Rai'),
  ('th-chumphon', 'th', 'Chumphon'),
  ('th-hat-yai', 'th', 'Hat Yai'),
  ('th-hua-hin', 'th', 'Hua Hin'),
  ('th-kamphaeng-phet', 'th', 'Kamphaeng Phet'),
  ('th-kanchanaburi', 'th', 'Kanchanaburi'),
  ('th-khao-lak', 'th', 'Khao Lak'),
  ('th-khao-sok', 'th', 'Khao Sok'),
  ('th-khao-yai', 'th', 'Khao Yai'),
  ('th-khon-kaen', 'th', 'Khon Kaen'),
  ('th-khun-yuam', 'th', 'Khun Yuam'),
  ('th-koh-chang', 'th', 'Koh Chang'),
  ('th-koh-kham', 'th', 'Koh Kham'),
  ('th-koh-kood', 'th', 'Koh Kood'),
  ('th-koh-kret', 'th', 'Koh Kret'),
  ('th-koh-lanta', 'th', 'Koh Lanta'),
  ('th-koh-larn', 'th', 'Koh Larn'),
  ('th-koh-mak', 'th', 'Koh Mak'),
  ('th-koh-phangan', 'th', 'Koh Phangan'),
  ('th-koh-samet', 'th', 'Koh Samet'),
  ('th-koh-samui', 'th', 'Koh Samui'),
  ('th-koh-si-chang', 'th', 'Koh Si Chang'),
  ('th-koh-tao', 'th', 'Koh Tao'),
  ('th-koh-wai', 'th', 'Koh Wai'),
  ('th-krabi', 'th', 'Krabi'),
  ('th-lampang', 'th', 'Lampang'),
  ('th-loei', 'th', 'Loei'),
  ('th-lopburi', 'th', 'Lopburi'),
  ('th-mae-chaem', 'th', 'Mae Chaem'),
  ('th-mae-hong-son', 'th', 'Mae Hong Son'),
  ('th-mae-sariang', 'th', 'Mae Sariang'),
  ('th-nakhon-pathom', 'th', 'Nakhon Pathom'),
  ('th-nakhon-ratchasima', 'th', 'Nakhon Ratchasima'),
  ('th-nakhon-si-thammarat', 'th', 'Nakhon Si Thammarat'),
  ('th-nan', 'th', 'Nan'),
  ('th-nong-khai', 'th', 'Nong Khai'),
  ('th-pai', 'th', 'Pai'),
  ('th-pattaya', 'th', 'Pattaya'),
  ('th-phang-nga-bay', 'th', 'Phang Nga Bay'),
  ('th-phetchaburi', 'th', 'Phetchaburi'),
  ('th-phitsanulok', 'th', 'Phitsanulok'),
  ('th-phuket', 'th', 'Phuket'),
  ('th-ratchaburi', 'th', 'Ratchaburi'),
  ('th-samut-songkhram', 'th', 'Samut Songkhram'),
  ('th-satun', 'th', 'Satun'),
  ('th-songkhla', 'th', 'Songkhla'),
  ('th-soppong', 'th', 'Soppong'),
  ('th-sukhothai', 'th', 'Sukhothai'),
  ('th-surat-thani', 'th', 'Surat Thani'),
  ('th-trang', 'th', 'Trang'),
  ('th-trat', 'th', 'Trat'),
  ('th-ubon-ratchathani', 'th', 'Ubon Ratchathani'),
  ('th-udon-thani', 'th', 'Udon Thani'),
  ('vi-an-giang', 'vi', 'An Giang'),
  ('vi-ba-ria-vung-tau', 'vi', 'Ba Ria-Vung Tau'),
  ('vi-ben-tre', 'vi', 'Ben Tre'),
  ('vi-buon-ma-thuot', 'vi', 'Buon Ma Thuot'),
  ('vi-ca-mau', 'vi', 'Ca Mau'),
  ('vi-cai-be', 'vi', 'Cai Be'),
  ('vi-can-tho', 'vi', 'Can Tho'),
  ('vi-cao-bang', 'vi', 'Cao Bang'),
  ('vi-cat-ba', 'vi', 'Cat Ba'),
  ('vi-con-dao', 'vi', 'Con Dao'),
  ('vi-da-lat', 'vi', 'Da Lat'),
  ('vi-da-nang', 'vi', 'Da Nang'),
  ('vi-dien-bien-phu', 'vi', 'Dien Bien Phu'),
  ('vi-duy-phu', 'vi', 'Duy Phu'),
  ('vi-ha-giang', 'vi', 'Ha Giang'),
  ('vi-ha-long', 'vi', 'Ha Long'),
  ('vi-ha-tien', 'vi', 'Ha Tien'),
  ('vi-hanoi', 'vi', 'Hanoi'),
  ('vi-ho-chi-minh-city', 'vi', 'Ho Chi Minh City'),
  ('vi-hoi-an', 'vi', 'Hoi An'),
  ('vi-hue', 'vi', 'Hue'),
  ('vi-lang-co', 'vi', 'Lang Co'),
  ('vi-lao-cai', 'vi', 'Lao Cai'),
  ('vi-ly-son', 'vi', 'Ly Son'),
  ('vi-mai-chau', 'vi', 'Mai Chau'),
  ('vi-moc-chau', 'vi', 'Moc Chau'),
  ('vi-mui-ne', 'vi', 'Mui Ne'),
  ('vi-nha-trang', 'vi', 'Nha Trang'),
  ('vi-ninh-binh', 'vi', 'Ninh Binh'),
  ('vi-phan-thiet', 'vi', 'Phan Thiet'),
  ('vi-phong-nha', 'vi', 'Phong Nha'),
  ('vi-phu-quoc', 'vi', 'Phu Quoc'),
  ('vi-quy-nhon', 'vi', 'Quy Nhon'),
  ('vi-sapa', 'vi', 'Sapa'),
  ('vi-tay-ninh', 'vi', 'Tay Ninh'),
  ('vi-thanh-hoa', 'vi', 'Thanh Hoa'),
  ('vi-vinh-long', 'vi', 'Vinh Long'),
  ('vi-vung-tau', 'vi', 'Vung Tau');
-- END GENERATED: cities

commit;
