-- RLS test for migration 002 (docs/EXCHANGE.md sections 4, 8, 9 and 17; the M4a done-when).
--
-- Paste the whole file into the Supabase SQL editor and press Run. It prints one PASS or FAIL
-- line per check, and a summary line last. Run it after 001, 001b and 002.
--
-- It leaves nothing behind. Every fixture (users, profiles, listings, reports, blocks, a changed
-- setting) is made inside one block that ends by raising an exception, which rolls the whole
-- block back. The result lines survive because they are kept in a variable, not a table.
--
-- Roles are switched the way PostgREST switches them for a real request: set_config('role') and
-- set_config('request.jwt.claims'), both local to the transaction. So `anon` below is a visitor
-- with no session, and `authenticated` with a `sub` is that signed-in user.
--
-- This file is pure ASCII on purpose (CLAUDE.md): non-ASCII text is written as U&'...' escapes
-- and chr(). Do not retype it through a clipboard without LANG=en_US.UTF-8.

create or replace function pg_temp.rls_002()
returns setof text
language plpgsql
as $test$
declare
  lines      text[] := '{}';
  dbg        text;
  owner_role text := current_user;
  d0         date := private.today();
  m          text := 'rlstest' || translate(substr(md5(random()::text), 1, 8), '0123456789', 'ghijklmnop');
  m3         text := 'rlsextra' || translate(substr(md5(random()::text), 1, 8), '0123456789', 'ghijklmnop');
  m2         text := 'rlsbulk' || translate(substr(md5(random()::text), 1, 8), '0123456789', 'ghijklmnop');
  terms      text;
  ins        constant text := 'insert into public.listings (kind, intent, category, city, to_city, starts_on, ends_on, title, body, price_amount, price_currency, seats, room_type, activity) values ';
  n          int;
  i          int;
  t          text;
  j          jsonb;
  rs         jsonb;
  failed     int;
  thai_digits text;
  blockterms text[];
  labels     text[];
  bodies     text[];
  ids        uuid[];
  want_ids   uuid[];
  bulk_ids   uuid[];
  pf         numeric;
  pl         numeric;
  poster uuid := gen_random_uuid();   asker    uuid := gen_random_uuid();   stranger uuid := gen_random_uuid();
  boss   uuid := gen_random_uuid();   newbie   uuid := gen_random_uuid();   seller   uuid := gen_random_uuid();
  seller2 uuid := gen_random_uuid();  seller3  uuid := gen_random_uuid();   susp     uuid := gen_random_uuid();
  lapsed uuid := gen_random_uuid();   rp1      uuid := gen_random_uuid();   rp2      uuid := gen_random_uuid();
  rp3    uuid := gen_random_uuid();   rnew     uuid := gen_random_uuid();   rate_old uuid := gen_random_uuid();
  rate_new uuid := gen_random_uuid(); open_old uuid := gen_random_uuid();   open_new uuid := gen_random_uuid();
  title_u uuid := gen_random_uuid();  namer    uuid := gen_random_uuid();   deleter  uuid := gen_random_uuid();
  rep_old uuid := gen_random_uuid();
  t_tent uuid; c_cash uuid;
  p_item uuid; p_item2 uuid; p_flag uuid; l_hide uuid; l_vis uuid; l_end uuid; l_del uuid;
  s1 uuid; s2 uuid; s3 uuid; s4 uuid; s5 uuid; s6 uuid; s7 uuid; s8 uuid; s9 uuid; s10 uuid; s11 uuid;
  l1 uuid; a1x uuid; b1 uuid; h1 uuid; e1 uuid; c1 uuid; rm1 uuid; d1 uuid; u1 uuid;
begin
  begin
    select s.value #>> '{}' into terms from private.settings s where s.key = 'terms_version';
    select array_agg(ft.term order by ft.term) into blockterms
      from private.filter_terms ft where ft.level = 'block' and ft.category <> 'name';
    select string_agg(chr(3664 + g), '' order by g) into thai_digits from generate_series(0, 9) as g;

    -- ==== catalogue: the ground rules of section 4, read from the system tables ====
    -- Event-trigger functions are left out: they cannot be called through the API, and Supabase
    -- owns one in public (rls_auto_enable, its automatic-RLS option chosen at project creation).
    select count(*) into n
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname in ('public', 'private') and c.relkind in ('r', 'p') and not c.relrowsecurity;
    lines := lines || case when (n = 0) then 'PASS ' || 'catalogue: RLS is on for every table in public and private' else 'FAIL ' || 'catalogue: RLS is on for every table in public and private' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select count(*) into n
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname in ('public', 'private') and c.relkind in ('r', 'p', 'v', 'm')
      and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger')
           or has_any_column_privilege('anon', c.oid, 'select, insert, update, references'));
    lines := lines || case when (n = 0) then 'PASS ' || 'catalogue: anon holds no grant on any table or column' else 'FAIL ' || 'catalogue: anon holds no grant on any table or column' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select string_agg(s.nspname || '.' || p.proname, ', ' order by s.nspname, p.proname) into t
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and (has_function_privilege('anon', p.oid, 'execute')
           or p.proacl is null
           or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'));
    dbg := t;
    lines := lines || case when (t = 'public.market_listing, public.market_search') then 'PASS ' || 'catalogue: anon executes exactly the two read RPCs, nothing is PUBLIC' else 'FAIL ' || 'catalogue: anon executes exactly the two read RPCs, nothing is PUBLIC' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select string_agg(s.nspname || '.' || p.proname, ', ' order by s.nspname, p.proname) into t
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and has_function_privilege('authenticated', p.oid, 'execute');
    dbg := t;
    lines := lines || case when (t = 'private.can_post, private.can_see, private.is_admin, private.is_member, private.owns, public.market_delete_account, public.market_join, public.market_listing, public.market_me, public.market_my_listings, public.market_search') then 'PASS ' || 'catalogue: authenticated executes exactly the eleven granted functions' else 'FAIL ' || 'catalogue: authenticated executes exactly the eleven granted functions' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and not coalesce(p.proconfig @> array['search_path=""'], false);
    lines := lines || case when (n = 0) then 'PASS ' || 'catalogue: every function pins search_path to empty' else 'FAIL ' || 'catalogue: every function pins search_path to empty' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select n2.nspname into t from pg_extension e join pg_namespace n2 on n2.oid = e.extnamespace where e.extname = 'pg_trgm';
    dbg := t;
    lines := lines || case when (t = 'extensions') then 'PASS ' || 'catalogue: pg_trgm lives in the extensions schema, not public' else 'FAIL ' || 'catalogue: pg_trgm lives in the extensions schema, not public' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    lines := lines || case when (not has_any_column_privilege('authenticated', 'public.listings', 'references') and not has_column_privilege('authenticated', 'public.listings', 'owner', 'select, insert, update') and not has_column_privilege('authenticated', 'public.listings', 'report_weight', 'select, insert, update') and not has_column_privilege('authenticated', 'public.listings', 'search', 'select, insert, update') and not has_column_privilege('authenticated', 'public.listings', 'search_text', 'select, insert, update')) then 'PASS ' || 'catalogue: no role can select, set or sort by owner, report_weight or the search columns' else 'FAIL ' || 'catalogue: no role can select, set or sort by owner, report_weight or the search columns' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (has_column_privilege('authenticated', 'public.listings', 'title', 'select') and has_column_privilege('authenticated', 'public.listings', 'title', 'insert') and has_column_privilege('authenticated', 'public.listings', 'id', 'insert') and not has_column_privilege('authenticated', 'public.listings', 'id', 'update') and has_column_privilege('authenticated', 'public.listings', 'status', 'update') and not has_column_privilege('authenticated', 'public.listings', 'status', 'insert') and not has_column_privilege('authenticated', 'public.listings', 'kind', 'update') and not has_table_privilege('authenticated', 'public.listings', 'delete')) then 'PASS ' || 'catalogue: listings grants are exactly select, the insert columns, update of title body status, and no delete' else 'FAIL ' || 'catalogue: listings grants are exactly select, the insert columns, update of title body status, and no delete' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (not has_any_column_privilege('authenticated', 'public.reports', 'select, update') and not has_table_privilege('authenticated', 'public.reports', 'delete') and has_column_privilege('authenticated', 'public.reports', 'reason', 'insert') and not has_column_privilege('authenticated', 'public.reports', 'snapshot', 'insert, update') and not has_column_privilege('authenticated', 'public.reports', 'target_user', 'insert, update') and not has_column_privilege('authenticated', 'public.reports', 'reporter', 'insert, update') and not has_column_privilege('authenticated', 'public.reports', 'status', 'insert, update')) then 'PASS ' || 'catalogue: reports are insert-only for clients, on listing_id, reason and note' else 'FAIL ' || 'catalogue: reports are insert-only for clients, on listing_id, reason and note' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (not has_any_column_privilege('authenticated', 'public.blocks', 'select, insert, update') and not has_table_privilege('authenticated', 'public.blocks', 'delete') and not has_any_column_privilege('authenticated', 'private.name_changes', 'select, insert, update')) then 'PASS ' || 'catalogue: blocks and name_changes are closed to clients until M5' else 'FAIL ' || 'catalogue: blocks and name_changes are closed to clients until M5' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename in ('listings', 'reports', 'blocks') and (coalesce(qual, '') || coalesce(with_check, '')) ~ '[[:<:]]owner[[:>:]]';
    lines := lines || case when (n = 0) then 'PASS ' || 'catalogue: no policy names the owner column (they call private.owns and private.can_see)' else 'FAIL ' || 'catalogue: no policy names the owner column (they call private.owns and private.can_see)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename = 'listings';
    lines := lines || case when (n = 3) then 'PASS ' || 'catalogue: listings has its three policies (select, insert, update)' else 'FAIL ' || 'catalogue: listings has its three policies (select, insert, update)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from pg_policies where schemaname = 'public' and tablename in ('reports', 'blocks');
    lines := lines || case when (n = 4) then 'PASS ' || 'catalogue: reports has one policy and blocks three' else 'FAIL ' || 'catalogue: reports has one policy and blocks three' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from private.settings s
    where (s.key = 'market_open' and s.value = 'false'::jsonb) or (s.key = 'cash_open' and s.value = 'false'::jsonb);
    lines := lines || case when (n = 2) then 'PASS ' || 'settings: market_open and cash_open are false' else 'FAIL ' || 'settings: market_open and cash_open are false' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (cardinality(blockterms) >= 83) then 'PASS ' || 'word list: at least 83 block terms are seeded' else 'FAIL ' || 'word list: at least 83 block terms are seeded' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from private.filter_terms where term in ('kush', 'gun') and in_names;
    lines := lines || case when (n = 0) then 'PASS ' || 'word list: kush and gun no longer block display names' else 'FAIL ' || 'word list: kush and gun no longer block display names' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from private.filter_terms where term ~ '[^ -~]' and lang in ('th', 'vi', 'km', 'lo');
    lines := lines || case when (n = 22) then 'PASS ' || 'word list: the 22 Thai, Vietnamese, Khmer and Lao terms are intact (001b)' else 'FAIL ' || 'word list: the 22 Thai, Vietnamese, Khmer and Lao terms are intact (001b)' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- ==== fixtures: users, profiles (old and new), testers, an admin ====
    insert into auth.users (id, aud, role, email, created_at, updated_at)
    select u, 'authenticated', 'authenticated', 'rls2-' || u || '@example.invalid', now(), now()
    from unnest(array[poster, asker, stranger, boss, newbie, seller, seller2, seller3, susp, lapsed, rp1, rp2, rp3,
                      rnew, rate_old, rate_new, open_old, open_new, title_u, namer, deleter, rep_old]) as u;
    insert into public.profiles (id, display_name, adult_confirmed_at, terms_version, created_at, status, suspended_until)
    select v.u, v.nm, now(), terms,
           case when v.fresh then now() else now() - interval '10 days' end,
           v.st::public.profile_status, v.su
    from (values
      (poster,   'Poster',    false, 'active',    null::timestamptz),
      (asker,    'Asker',     false, 'active',    null),
      (stranger, 'Stranger',  false, 'active',    null),
      (boss,     'Boss',      false, 'active',    null),
      (newbie,   'Newbie',    true,  'active',    null),
      (seller,   'Seller',    false, 'active',    null),
      (seller2,  'Sellertwo', false, 'active',    null),
      (seller3,  'Sellerthree', false, 'active',  null),
      (susp,     'Susp',      false, 'review',    null),
      (lapsed,   'Lapsed',    false, 'suspended', now() - interval '1 hour'),
      (rp1,      'Reporterone', false, 'active',  null),
      (rp2,      'Reportertwo', false, 'active',  null),
      (rp3,      'Reporterthree', false, 'active', null),
      (rnew,     'Reporternew', true,  'active',  null),
      (rate_old, 'Rateold',   false, 'active',    null),
      (rate_new, 'Ratenew',   true,  'active',    null),
      (open_old, 'Openold',   false, 'active',    null),
      (open_new, 'Opennew',   true,  'active',    null),
      (title_u,  'Titleu',    false, 'active',    null),
      (namer,    'Namer',     false, 'active',    null),
      (deleter,  'Deleter',   false, 'active',    null),
      (rep_old,  'Reporterold', false, 'active',  null)
    ) as v(u, nm, fresh, st, su);
    insert into private.testers (user_id)
    select u from unnest(array[poster, asker, newbie, seller, seller2, seller3, rp1, rp2, rp3, rnew, rate_old, rate_new,
                               open_old, open_new, title_u, namer, deleter, rep_old]) as u;
    insert into private.admins (user_id) values (boss);
    update private.settings set value = 'false'::jsonb where key = 'market_open';

    -- Bulk listings (55, by seller2) for paging and for the report limits. Rows from the database
    -- owner skip the client rules, so backdating and statuses are possible.
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, body, price_amount, price_currency, created_at)
    select seller2, 'item', 'sell', 'books', 'th-bangkok', d0, d0 + 5, 'Bulk item ' || g || ' ' || m2, '', 100, 'THB',
           now() - (g || ' minutes')::interval
    from generate_series(1, 55) as g;
    select array_agg(l.id order by l.created_at desc) into bulk_ids from public.listings l where l.title like '%' || m2;
    lines := lines || case when (cardinality(bulk_ids) = 55) then 'PASS ' || 'fixtures: 55 bulk listings seeded' else 'FAIL ' || 'fixtures: 55 bulk listings seeded' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- ==== the closed-beta gate: nothing is readable while market_open is false ====
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('role', 'anon', true);
    begin
      execute 'select * from public.market_search()';
      lines := lines || ('FAIL ' || 'gate: a visitor searching is told the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'market_closed' then 'PASS ' || 'gate: a visitor searching is told the market is closed' else 'FAIL ' || 'gate: a visitor searching is told the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute 'select public.market_listing(gen_random_uuid())';
      lines := lines || ('FAIL ' || 'gate: a visitor opening a listing is told the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'market_closed' then 'PASS ' || 'gate: a visitor opening a listing is told the market is closed' else 'FAIL ' || 'gate: a visitor opening a listing is told the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute 'select * from public.market_search()';
      lines := lines || ('FAIL ' || 'gate: a signed-in non-tester searching is told the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'market_closed' then 'PASS ' || 'gate: a signed-in non-tester searching is told the market is closed' else 'FAIL ' || 'gate: a signed-in non-tester searching is told the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute 'select public.market_listing(gen_random_uuid())';
      lines := lines || ('FAIL ' || 'gate: a signed-in non-tester opening a listing is told the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'market_closed' then 'PASS ' || 'gate: a signed-in non-tester opening a listing is told the market is closed' else 'FAIL ' || 'gate: a signed-in non-tester opening a listing is told the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute 'select * from public.market_search()';
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'gate: a tester may search while the market is closed' else 'FAIL ' || 'gate: a tester may search while the market is closed' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute 'select public.market_listing(gen_random_uuid())';
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'gate: a tester may open a listing while the market is closed' else 'FAIL ' || 'gate: a tester may open a listing while the market is closed' || ' [' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- ==== anon: a visitor holds no table and cannot post, report, block or read a profile ====
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('role', 'anon', true);
    begin
      execute 'select 1 from public.listings limit 1';
      lines := lines || ('FAIL ' || 'anon: listings denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: listings denied');
      when others then lines := lines || ('FAIL ' || 'anon: listings denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.reports limit 1';
      lines := lines || ('FAIL ' || 'anon: reports denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: reports denied');
      when others then lines := lines || ('FAIL ' || 'anon: reports denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.blocks limit 1';
      lines := lines || ('FAIL ' || 'anon: blocks denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: blocks denied');
      when others then lines := lines || ('FAIL ' || 'anon: blocks denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.profiles limit 1';
      lines := lines || ('FAIL ' || 'anon: profiles denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: profiles denied');
      when others then lines := lines || ('FAIL ' || 'anon: profiles denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.cities limit 1';
      lines := lines || ('FAIL ' || 'anon: cities denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: cities denied');
      when others then lines := lines || ('FAIL ' || 'anon: cities denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.listings (kind, intent, category, city, starts_on, ends_on, title) values (''item'', ''give'', ''toys'', ''th-bangkok'', private.today(), private.today() + 1, ''Anon toy'')';
      lines := lines || ('FAIL ' || 'anon: cannot post a listing' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: cannot post a listing');
      when others then lines := lines || ('FAIL ' || 'anon: cannot post a listing' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.reports (listing_id, reason) values (gen_random_uuid(), ''spam'')';
      lines := lines || ('FAIL ' || 'anon: cannot report' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: cannot report');
      when others then lines := lines || ('FAIL ' || 'anon: cannot report' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.blocks (blocker, blocked) values (gen_random_uuid(), gen_random_uuid())';
      lines := lines || ('FAIL ' || 'anon: cannot block' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: cannot block');
      when others then lines := lines || ('FAIL ' || 'anon: cannot block' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select * from public.market_my_listings()';
      lines := lines || ('FAIL ' || 'anon: market_my_listings denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: market_my_listings denied');
      when others then lines := lines || ('FAIL ' || 'anon: market_my_listings denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select public.market_me()';
      lines := lines || ('FAIL ' || 'anon: market_me denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: market_me denied');
      when others then lines := lines || ('FAIL ' || 'anon: market_me denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select private.today()';
      lines := lines || ('FAIL ' || 'anon: private.today denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: private.today denied');
      when others then lines := lines || ('FAIL ' || 'anon: private.today denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select private.contact_hit(''x'')';
      lines := lines || ('FAIL ' || 'anon: private.contact_hit denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'anon: private.contact_hit denied');
      when others then lines := lines || ('FAIL ' || 'anon: private.contact_hit denied' || ' [' || sqlerrm || ']');
    end;
    perform set_config('role', owner_role, true);

    -- ==== signed in: owner is unreadable and unsettable, deletes and report reads are denied ====
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute 'select owner from public.listings limit 1';
      lines := lines || ('FAIL ' || 'read: select owner from listings denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: select owner from listings denied');
      when others then lines := lines || ('FAIL ' || 'read: select owner from listings denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select * from public.listings limit 1';
      lines := lines || ('FAIL ' || 'read: select * from listings denied (it asks for owner)' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: select * from listings denied (it asks for owner)');
      when others then lines := lines || ('FAIL ' || 'read: select * from listings denied (it asks for owner)' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select report_weight from public.listings limit 1';
      lines := lines || ('FAIL ' || 'read: report_weight denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: report_weight denied');
      when others then lines := lines || ('FAIL ' || 'read: report_weight denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select search from public.listings limit 1';
      lines := lines || ('FAIL ' || 'read: the search vector denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: the search vector denied');
      when others then lines := lines || ('FAIL ' || 'read: the search vector denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select search_text from public.listings limit 1';
      lines := lines || ('FAIL ' || 'read: the search text denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: the search text denied');
      when others then lines := lines || ('FAIL ' || 'read: the search text denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.reports limit 1';
      lines := lines || ('FAIL ' || 'read: reports denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: reports denied');
      when others then lines := lines || ('FAIL ' || 'read: reports denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.blocks limit 1';
      lines := lines || ('FAIL ' || 'read: blocks denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: blocks denied');
      when others then lines := lines || ('FAIL ' || 'read: blocks denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from private.name_changes limit 1';
      lines := lines || ('FAIL ' || 'read: name_changes denied' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'read: name_changes denied');
      when others then lines := lines || ('FAIL ' || 'read: name_changes denied' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title) values (gen_random_uuid(), ''item'', ''give'', ''toys'', ''th-bangkok'', private.today(), private.today() + 1, ''Spoofed owner'')';
      lines := lines || ('FAIL ' || 'write: a client cannot set owner on insert' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot set owner on insert');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot set owner on insert' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.listings (status, kind, intent, category, city, starts_on, ends_on, title) values (''hidden'', ''item'', ''give'', ''toys'', ''th-bangkok'', private.today(), private.today() + 1, ''Spoofed status'')';
      lines := lines || ('FAIL ' || 'write: a client cannot set status on insert' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot set status on insert');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot set status on insert' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.listings (report_weight, kind, intent, category, city, starts_on, ends_on, title) values (0, ''item'', ''give'', ''toys'', ''th-bangkok'', private.today(), private.today() + 1, ''Spoofed weight'')';
      lines := lines || ('FAIL ' || 'write: a client cannot set report_weight on insert' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot set report_weight on insert');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot set report_weight on insert' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'delete from public.listings where title = ''nothing''';
      lines := lines || ('FAIL ' || 'write: a client cannot delete a listing' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot delete a listing');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot delete a listing' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.blocks (blocked) values (gen_random_uuid())';
      lines := lines || ('FAIL ' || 'write: a client cannot insert a block (M5)' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot insert a block (M5)');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot insert a block (M5)' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.reports (message_id, reason) values (1, ''spam'')';
      lines := lines || ('FAIL ' || 'write: a client cannot name a message or profile in a report' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot name a message or profile in a report');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot name a message or profile in a report' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.reports (listing_id, reason, snapshot) values (gen_random_uuid(), ''spam'', ''{}'')';
      lines := lines || ('FAIL ' || 'write: a client cannot write a report snapshot' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot write a report snapshot');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot write a report snapshot' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'insert into public.reports (listing_id, reason, target_user) values (gen_random_uuid(), ''spam'', gen_random_uuid())';
      lines := lines || ('FAIL ' || 'write: a client cannot write a report target_user' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'write: a client cannot write a report target_user');
      when others then lines := lines || ('FAIL ' || 'write: a client cannot write a report target_user' || ' [' || sqlerrm || ']');
    end;
    perform set_config('role', owner_role, true);

    -- ==== posting: a valid listing, as the poster ====
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    p_item := gen_random_uuid();
    insert into public.listings (id, kind, intent, category, city, starts_on, ends_on, title, body, price_amount, price_currency)
    values (p_item, 'item', 'sell', 'stroller', 'th-bangkok', d0, d0 + 10, '  Stroller for sale  ', 'Lightly used.', 1500, 'THB');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings l
    where l.id = p_item and l.owner = poster and l.status = 'open' and l.title = 'Stroller for sale'
      and l.report_weight = 0 and l.price_amount = 1500 and l.search_text like '%stroller for sale%';
    lines := lines || case when (n = 1) then 'PASS ' || 'post: the row is stamped with the caller, trimmed and open, with its search text' else 'FAIL ' || 'post: the row is stamped with the caller, trimmed and open, with its search text' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);

    -- Kind, intent, field, price, window and length rules. Each is refused with a plain code.
    begin
      execute ins || $v$('item','offer','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'kind: an item cannot be offered' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_intent' then 'PASS ' || 'kind: an item cannot be offered' else 'FAIL ' || 'kind: an item cannot be offered' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','give',null,'th-bangkok',null,private.today(),private.today()+1,'Lunch walk','',null,null,4,null,'food')$v$;
      lines := lines || ('FAIL ' || 'kind: a meetup cannot be given' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_intent' then 'PASS ' || 'kind: a meetup cannot be given' else 'FAIL ' || 'kind: a meetup cannot be given' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','join',null,'th-bangkok','th-pai',private.today(),private.today()+1,'Lift north','',null,null,2,null,null)$v$;
      lines := lines || ('FAIL ' || 'kind: a ride cannot be joined' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_intent' then 'PASS ' || 'kind: a ride cannot be joined' else 'FAIL ' || 'kind: a ride cannot be joined' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','sell',null,'th-bangkok',null,private.today(),private.today()+5,'Spare room','',null,null,null,'private',null)$v$;
      lines := lines || ('FAIL ' || 'kind: a room cannot be sold' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_intent' then 'PASS ' || 'kind: a room cannot be sold' else 'FAIL ' || 'kind: a room cannot be sold' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok','th-pai',private.today(),private.today()+5,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'fields: an item with a second city' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_fields' then 'PASS ' || 'fields: an item with a second city' else 'FAIL ' || 'fields: an item with a second city' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',0,null,2,null,null)$v$;
      lines := lines || ('FAIL ' || 'fields: an item with seats' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_fields' then 'PASS ' || 'fields: an item with seats' else 'FAIL ' || 'fields: an item with seats' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join','toys','th-bangkok',null,private.today(),private.today()+1,'Lunch walk','',null,null,4,null,'food')$v$;
      lines := lines || ('FAIL ' || 'fields: a meetup with a category' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_fields' then 'PASS ' || 'fields: a meetup with a category' else 'FAIL ' || 'fields: a meetup with a category' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','offer',null,'th-bangkok',null,private.today(),private.today()+5,'Spare room','',null,null,null,'private','food')$v$;
      lines := lines || ('FAIL ' || 'fields: a room with an activity' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_fields' then 'PASS ' || 'fields: a room with an activity' else 'FAIL ' || 'fields: a room with an activity' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','offer','toys','th-bangkok','th-pai',private.today(),private.today()+1,'Lift north','',null,null,2,null,null)$v$;
      lines := lines || ('FAIL ' || 'fields: a ride with a category' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'kind_fields' then 'PASS ' || 'fields: a ride with a category' else 'FAIL ' || 'fields: a ride with a category' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give',null,'th-bangkok',null,private.today(),private.today()+5,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'category: an item needs one' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'category_invalid' then 'PASS ' || 'category: an item needs one' else 'FAIL ' || 'category: an item needs one' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','weapons','th-bangkok',null,private.today(),private.today()+5,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'category: an unknown one is refused' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm like '%"listings_category"%' then 'PASS ' || 'category: an unknown one is refused' else 'FAIL ' || 'category: an unknown one is refused' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+1,'Lunch walk','',null,null,4,null,null)$v$;
      lines := lines || ('FAIL ' || 'activity: a meetup needs one' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'activity_invalid' then 'PASS ' || 'activity: a meetup needs one' else 'FAIL ' || 'activity: a meetup needs one' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+1,'Lunch walk','',null,null,1,null,'food')$v$;
      lines := lines || ('FAIL ' || 'seats: a meetup of one' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'seats_invalid' then 'PASS ' || 'seats: a meetup of one' else 'FAIL ' || 'seats: a meetup of one' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+1,'Lunch walk','',null,null,null,null,'food')$v$;
      lines := lines || ('FAIL ' || 'seats: a meetup without a group size' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'seats_invalid' then 'PASS ' || 'seats: a meetup without a group size' else 'FAIL ' || 'seats: a meetup without a group size' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','offer',null,'th-bangkok','th-pai',private.today(),private.today()+1,'Lift north','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'seats: a ride offer needs seats' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'seats_invalid' then 'PASS ' || 'seats: a ride offer needs seats' else 'FAIL ' || 'seats: a ride offer needs seats' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','offer',null,'th-bangkok',null,private.today(),private.today()+5,'Spare room','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'room: a room needs a type' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'room_type_invalid' then 'PASS ' || 'room: a room needs a type' else 'FAIL ' || 'room: a room needs a type' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok',null,private.today(),private.today()+1,'Lift north','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'ride: a ride needs a destination' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'to_city_invalid' then 'PASS ' || 'ride: a ride needs a destination' else 'FAIL ' || 'ride: a ride needs a destination' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok','th-bangkok',private.today(),private.today()+1,'Lift north','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'ride: the destination cannot be the start' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'to_city_invalid' then 'PASS ' || 'ride: the destination cannot be the start' else 'FAIL ' || 'ride: the destination cannot be the start' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok','xx-nowhere',private.today(),private.today()+1,'Lift north','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'ride: an unknown destination' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'to_city_invalid' then 'PASS ' || 'ride: an unknown destination' else 'FAIL ' || 'ride: an unknown destination' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','xx-nowhere',null,private.today(),private.today()+5,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'city: an unknown city' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'city_invalid' then 'PASS ' || 'city: an unknown city' else 'FAIL ' || 'city: an unknown city' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('cash','offer',null,'th-bangkok',null,private.today(),private.today()+5,'Swap baht','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'cash: closed until legal clears it' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'cash_closed' then 'PASS ' || 'cash: closed until legal clears it' else 'FAIL ' || 'cash: closed until legal clears it' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: a sale needs a price' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'price_invalid' then 'PASS ' || 'price: a sale needs a price' else 'FAIL ' || 'price: a sale needs a price' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',0,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: a sale at zero' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'price_invalid' then 'PASS ' || 'price: a sale at zero' else 'FAIL ' || 'price: a sale at zero' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: a gift with a price' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'price_invalid' then 'PASS ' || 'price: a gift with a price' else 'FAIL ' || 'price: a gift with a price' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','','NaN'::numeric,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: NaN is not a price' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'price_invalid' then 'PASS ' || 'price: NaN is not a price' else 'FAIL ' || 'price: NaN is not a price' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',-5,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: a negative price' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'price_invalid' then 'PASS ' || 'price: a negative price' else 'FAIL ' || 'price: a negative price' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',100,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: an amount without a currency' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'currency_invalid' then 'PASS ' || 'price: an amount without a currency' else 'FAIL ' || 'price: an amount without a currency' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','',100,'XXX',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'price: an unknown currency' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'currency_invalid' then 'PASS ' || 'price: an unknown currency' else 'FAIL ' || 'price: an unknown currency' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today()+5,private.today()+2,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: ends before it starts' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_order' then 'PASS ' || 'window: ends before it starts' else 'FAIL ' || 'window: ends before it starts' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,null,null,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: no dates' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'dates_required' then 'PASS ' || 'window: no dates' else 'FAIL ' || 'window: no dates' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today()-5,private.today()-1,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: already over' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_past' then 'PASS ' || 'window: already over' else 'FAIL ' || 'window: already over' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today()+91,private.today()+92,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: starts more than 90 days out' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'starts_too_late' then 'PASS ' || 'window: starts more than 90 days out' else 'FAIL ' || 'window: starts more than 90 days out' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+30,'Toy box','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: an item over 30 days' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_too_long' then 'PASS ' || 'window: an item over 30 days' else 'FAIL ' || 'window: an item over 30 days' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+7,'Lunch walk','',null,null,4,null,'food')$v$;
      lines := lines || ('FAIL ' || 'window: a meetup over 7 days' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_too_long' then 'PASS ' || 'window: a meetup over 7 days' else 'FAIL ' || 'window: a meetup over 7 days' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','offer',null,'th-bangkok',null,private.today(),private.today()+30,'Spare room','',null,null,null,'private',null)$v$;
      lines := lines || ('FAIL ' || 'window: a room over 30 days' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_too_long' then 'PASS ' || 'window: a room over 30 days' else 'FAIL ' || 'window: a room over 30 days' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok','th-pai',private.today(),private.today()+3,'Lift north','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'window: a ride over 3 days' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'window_too_long' then 'PASS ' || 'window: a ride over 3 days' else 'FAIL ' || 'window: a ride over 3 days' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'ab','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'text: a title of 2 characters' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'title_length' then 'PASS ' || 'text: a title of 2 characters' else 'FAIL ' || 'text: a title of 2 characters' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,repeat('a',81),'',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'text: a title of 81 characters' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'title_length' then 'PASS ' || 'text: a title of 81 characters' else 'FAIL ' || 'text: a title of 81 characters' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box',repeat('b',401),0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'text: a body of 401 characters' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'body_length' then 'PASS ' || 'text: a body of 401 characters' else 'FAIL ' || 'text: a body of 401 characters' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Bad' || chr(7) || 'title','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'text: a control character in a title' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'title_invalid' then 'PASS ' || 'text: a control character in a title' else 'FAIL ' || 'text: a control character in a title' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box','Bad' || chr(7) || 'body',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'text: a control character in a body' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'body_invalid' then 'PASS ' || 'text: a control character in a body' else 'FAIL ' || 'text: a control character in a body' || ' [got ' || sqlerrm || ']' end;
    end;

    -- The edges that are allowed (each insert is rolled back at once).
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+29,'Edge toy thirty','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: an item window of exactly 30 days' else 'FAIL ' || 'edge: an item window of exactly 30 days' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+6,'Edge walk seven','',null,null,2,null,'sights')$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a meetup window of exactly 7 days' else 'FAIL ' || 'edge: a meetup window of exactly 7 days' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','offer',null,'th-bangkok','th-pai',private.today(),private.today()+2,'Edge lift three','',300,'THB',3,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a ride window of exactly 3 days' else 'FAIL ' || 'edge: a ride window of exactly 3 days' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','offer',null,'th-bangkok',null,private.today(),private.today()+29,'Edge room thirty','',9000,'THB',null,'private',null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a room window of exactly 30 days' else 'FAIL ' || 'edge: a room window of exactly 30 days' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today()+90,private.today()+90,'Edge toy ninety','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a start exactly 90 days out' else 'FAIL ' || 'edge: a start exactly 90 days out' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,repeat('t',80),repeat('b',400),0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a title of 80 and a body of 400 characters' else 'FAIL ' || 'edge: a title of 80 and a body of 400 characters' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'abc','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a title of 3 characters' else 'FAIL ' || 'edge: a title of 3 characters' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','trade','toys','th-bangkok',null,private.today(),private.today()+5,'Edge trade toy','',null,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a trade without a price' else 'FAIL ' || 'edge: a trade without a price' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+1,'Edge walk eight','',null,null,8,null,'cowork')$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a meetup with a group size of 8' else 'FAIL ' || 'edge: a meetup with a group size of 8' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok','th-pai',private.today(),private.today()+1,'Edge lift seek','',null,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'edge: a ride request without seats' else 'FAIL ' || 'edge: a ride request without seats' || ' [' || sqlerrm || ']' end;
    end;

    -- ==== contact details are refused in listings (section 8; app links only) ====
    labels := array[
      'a dashed phone number', 'a phone number without separators', 'an international phone number', 'a bracketed phone number',
      'a dotted phone number', 'a phone number in Thai digits', 'a phone number followed by a unit', 'an email address',
      'an https URL', 'a www address', 'a bare domain', 'a bare domain on a new suffix', 'a wa.me link', 'a t.me link',
      'an @handle', 'line id', 'whatsapp', 'telegram', 'whats app (two words)', 'a look-alike whatsapp', 'a look-alike line id', 'zalo'];
    bodies := array[
      'Call me 081-234-5678', 'Call 0812345678', 'Call +66 81 234 5678', 'Call (081) 234 5678',
      'Call 081.234.5678', 'Call ' || translate('0812345678', '0123456789', thai_digits), 'Call 081 234 5678 per night', 'Mail me sam@example.com',
      'See https://example.com/page', 'See www.example.com', 'See example.com', 'See my.site.travel', 'Message wa.me/66812345678', 'Message t.me/samtravel',
      'Find me @samtravel', 'My line id is sam', 'Message me on WhatsApp', 'Message me on Telegram', 'Message me on Whats App', 'Message me on Wh@tsapp', 'L1ne id: sam', 'Zalo me'];
    for i in 1 .. array_length(bodies, 1) loop
      begin
        execute format(ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box',%L,0,null,null,null,null)$v$, bodies[i]);
        lines := lines || ('FAIL ' || 'contact: ' || labels[i] || ' in a body' || ' (accepted)');
      exception when others then
        lines := lines || case when sqlerrm = 'contact_details' then 'PASS ' || 'contact: ' || labels[i] || ' in a body' else 'FAIL ' || 'contact: ' || labels[i] || ' in a body' || ' [got ' || sqlerrm || ']' end;
      end;
    end loop;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Call 0812345678 now','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'contact: a phone number in a title' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'contact_details' then 'PASS ' || 'contact: a phone number in a title' else 'FAIL ' || 'contact: a phone number in a title' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Mail sam@example.com','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'contact: an email in a title' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'contact_details' then 'PASS ' || 'contact: an email in a title' else 'FAIL ' || 'contact: an email in a title' || ' [got ' || sqlerrm || ']' end;
    end;
    bodies := array[
      'Available 2026-10-20 to 2026-10-25', 'Available 20/10/2026 to 25/10/2026', 'About 15,000,000 VND a month', 'About 15.000.000 VND',
      'About 15000000 VND', 'Price 1,500 baht per night', '1500-2000 baht per night', 'Sizes 38 and 40', 'Room for 2, 3 nights, 2 beds, 1 bathroom',
      'Pickup 7:30, 25 km, 4 seats', 'Pipeline identifier', 'Go online and ask', chr(3647) || '1,500/night', 'Price 3,500,000 dong', 'Free, no fee, collect soon',
      'Gunnar tent from Iceland', 'Pickup @8am, meet @ the pier', 'Tent for 3.5 persons'];
    for i in 1 .. array_length(bodies, 1) loop
      begin
        execute format(ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Toy box',%L,0,null,null,null,null)$v$, bodies[i]);
        raise exception using message = 'ok_rollback';
      exception when others then
        lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'contact: an ordinary body passes (' || left(bodies[i], 40) || ')' else 'FAIL ' || 'contact: an ordinary body passes (' || left(bodies[i], 40) || ')' || ' [' || sqlerrm || ']' end;
      end;
    end loop;

    -- ==== the text check: every seeded block term is refused in a listing ====
    n := 0; dbg := null;
    foreach t in array blockterms loop
      begin
        execute format(ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,%L,'',0,null,null,null,null)$v$, 'Selling my ' || t || ' today');
        n := n + 1; dbg := left(coalesce(dbg || ', ', '') || t, 200);
        raise exception using message = 'ok_rollback';
      exception when others then
        if sqlerrm <> 'text_rejected' and sqlerrm <> 'ok_rollback' then
          n := n + 1; dbg := left(coalesce(dbg || '; ', '') || t || ' gave ' || sqlerrm, 200);
        end if;
      end;
    end loop;
    lines := lines || case when (n = 0) then 'PASS ' || 'text: every seeded block term is rejected in a title' else 'FAIL ' || 'text: every seeded block term is rejected in a title' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    n := 0; dbg := null;
    foreach t in array blockterms loop
      begin
        execute format(ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Nice thing',%L,0,null,null,null,null)$v$, 'I am selling my ' || t || ' and more');
        n := n + 1; dbg := left(coalesce(dbg || ', ', '') || t, 200);
        raise exception using message = 'ok_rollback';
      exception when others then
        if sqlerrm <> 'text_rejected' and sqlerrm <> 'ok_rollback' then
          n := n + 1; dbg := left(coalesce(dbg || '; ', '') || t || ' gave ' || sqlerrm, 200);
        end if;
      end;
    end loop;
    lines := lines || case when (n = 0) then 'PASS ' || 'text: every seeded block term is rejected in a body' else 'FAIL ' || 'text: every seeded block term is rejected in a body' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- Evasions, and words that only contain a term.
    labels := array['upper case', 'a look-alike digit', 'a zero-width space', 'a stretched word', 'a Thai term inside a Thai word', 'Vietnamese capitals', 'a Vietnamese term with an accented d'];
    bodies := array['WEED', 'W33d', 'we' || chr(8203) || 'ed', 'Weeeeed', U&'\0E23\0E49\0E32\0E19\0E01\0E31\0E0D\0E0A\0E32\0E14\0E35', U&'C\1EA6N SA', U&'b\1ED3 \0111\00E0'];
    for i in 1 .. array_length(bodies, 1) loop
      begin
        execute format(ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,%L,'',0,null,null,null,null)$v$, 'Fresh ' || bodies[i]);
        lines := lines || ('FAIL ' || 'text: an evasion is caught (' || labels[i] || ')' || ' (accepted)');
      exception when others then
        lines := lines || case when sqlerrm = 'text_rejected' then 'PASS ' || 'text: an evasion is caught (' || labels[i] || ')' else 'FAIL ' || 'text: an evasion is caught (' || labels[i] || ')' || ' [got ' || sqlerrm || ']' end;
      end;
    end loop;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Gunnar tent','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'text: a name that holds a block term passes (Gunnar)' else 'FAIL ' || 'text: a name that holds a block term passes (Gunnar)' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Admin guide book','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'text: display-name-only terms are fine in a listing (admin)' else 'FAIL ' || 'text: display-name-only terms are fine in a listing (admin)' || ' [' || sqlerrm || ']' end;
    end;

    -- ==== a flag term is accepted and files one system report ====
    p_flag := gen_random_uuid();
    insert into public.listings (id, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values (p_flag, 'item', 'sell', 'camping', 'th-bangkok', d0, d0 + 5, 'Cheap hash bowl set', 200, 'THB');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.reports r
    where r.listing_id = p_flag and r.reporter is null and r.reason = 'filter' and r.status = 'open'
      and r.target_user = poster and r.snapshot ->> 'title' = 'Cheap hash bowl set';
    lines := lines || case when (n = 1) then 'PASS ' || 'flag: a flag term files one system report with a snapshot and the owner as target' else 'FAIL ' || 'flag: a flag term files one system report with a snapshot and the owner as target' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.listings l where l.id = p_flag and l.report_weight = 1 and l.status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'flag: the system report weighs 1 and the listing stays open' else 'FAIL ' || 'flag: the system report weighs 1 and the listing stays open' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.listings set title = 'Cheap hash bowl set, boxed' where id = p_flag;
    perform set_config('role', owner_role, true);
    select count(*) into n from public.reports r where r.listing_id = p_flag and r.reporter is null;
    lines := lines || case when (n = 1) then 'PASS ' || 'flag: editing a flagged title does not file a second system report' else 'FAIL ' || 'flag: editing a flagged title does not file a second system report' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- ==== editing, status changes, other people's rows, an admin ====
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.listings set title = 'Stroller, barely used', body = 'Lightly used.' where id = p_item;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'edit: the owner changes the title and body' else 'FAIL ' || 'edit: the owner changes the title and body' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute format($v$update public.listings set title = 'Selling kush' where id = %L$v$, p_item);
      lines := lines || ('FAIL ' || 'edit: a blocked word in a new title' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'text_rejected' then 'PASS ' || 'edit: a blocked word in a new title' else 'FAIL ' || 'edit: a blocked word in a new title' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute format($v$update public.listings set body = 'Call 0812345678' where id = %L$v$, p_item);
      lines := lines || ('FAIL ' || 'edit: a phone number in a new body' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'contact_details' then 'PASS ' || 'edit: a phone number in a new body' else 'FAIL ' || 'edit: a phone number in a new body' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute 'update public.listings set kind = ''room'' where id = gen_random_uuid()';
      lines := lines || ('FAIL ' || 'edit: the kind is not editable' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'edit: the kind is not editable');
      when others then lines := lines || ('FAIL ' || 'edit: the kind is not editable' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'update public.listings set owner = gen_random_uuid() where id = gen_random_uuid()';
      lines := lines || ('FAIL ' || 'edit: the owner is not editable' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'edit: the owner is not editable');
      when others then lines := lines || ('FAIL ' || 'edit: the owner is not editable' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'update public.listings set price_amount = 1 where id = gen_random_uuid()';
      lines := lines || ('FAIL ' || 'edit: the price is not editable' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'edit: the price is not editable');
      when others then lines := lines || ('FAIL ' || 'edit: the price is not editable' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'update public.listings set report_weight = 0 where id = gen_random_uuid()';
      lines := lines || ('FAIL ' || 'edit: report_weight is not editable' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'edit: report_weight is not editable');
      when others then lines := lines || ('FAIL ' || 'edit: report_weight is not editable' || ' [' || sqlerrm || ']');
    end;
    p_item2 := gen_random_uuid();
    insert into public.listings (id, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values (p_item2, 'item', 'sell', 'carrier', 'th-bangkok', d0, d0 + 5, 'Baby carrier for sale', 700, 'THB');
    begin
      execute format($v$update public.listings set status = 'hidden' where id = %L$v$, p_item2);
      lines := lines || ('FAIL ' || 'status: a client cannot hide its own listing' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'status_invalid' then 'PASS ' || 'status: a client cannot hide its own listing' else 'FAIL ' || 'status: a client cannot hide its own listing' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute format($v$update public.listings set status = 'removed' where id = %L$v$, p_item2);
      lines := lines || ('FAIL ' || 'status: a client cannot mark its own listing removed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'status_invalid' then 'PASS ' || 'status: a client cannot mark its own listing removed' else 'FAIL ' || 'status: a client cannot mark its own listing removed' || ' [got ' || sqlerrm || ']' end;
    end;
    update public.listings set status = 'closed' where id = p_item2;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'status: the owner closes a listing' else 'FAIL ' || 'status: the owner closes a listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute format($v$update public.listings set status = 'open' where id = %L$v$, p_item2);
      lines := lines || ('FAIL ' || 'status: a closed listing cannot be reopened' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'status_invalid' then 'PASS ' || 'status: a closed listing cannot be reopened' else 'FAIL ' || 'status: a closed listing cannot be reopened' || ' [got ' || sqlerrm || ']' end;
    end;
    update public.listings set title = 'Baby carrier, closed sale' where id = p_item2;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'status: a closed listing can still be edited' else 'FAIL ' || 'status: a closed listing can still be edited' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.listings set status = 'deleted' where id = p_item2;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'status: the owner deletes a listing' else 'FAIL ' || 'status: the owner deletes a listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.market_my_listings() x where (x ->> 'id')::uuid = p_item2;
    lines := lines || case when (n = 0) then 'PASS ' || 'status: a deleted listing drops out of market_my_listings' else 'FAIL ' || 'status: a deleted listing drops out of market_my_listings' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.listings set title = 'Hijacked' where id = p_item;
    get diagnostics n = row_count;
    lines := lines || case when (n = 0) then 'PASS ' || 'other people: a tester changes 0 rows of another person''s listing' else 'FAIL ' || 'other people: a tester changes 0 rows of another person''s listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.listings set status = 'closed' where id = p_item;
    get diagnostics n = row_count;
    lines := lines || case when (n = 0) then 'PASS ' || 'other people: a tester cannot close another person''s listing' else 'FAIL ' || 'other people: a tester cannot close another person''s listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = p_item and title = 'Stroller, barely used' and status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'other people: the listing is unchanged underneath' else 'FAIL ' || 'other people: the listing is unchanged underneath' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute format($v$update public.listings set title = 'Edited by admin' where id = %L$v$, p_item);
      lines := lines || ('FAIL ' || 'admin: an admin cannot edit a title' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'not_owner' then 'PASS ' || 'admin: an admin cannot edit a title' else 'FAIL ' || 'admin: an admin cannot edit a title' || ' [got ' || sqlerrm || ']' end;
    end;
    update public.listings set status = 'removed' where id = p_item;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'admin: an admin removes a listing' else 'FAIL ' || 'admin: an admin removes a listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.listings set title = 'Edit after removal' where id = p_item;
    get diagnostics n = row_count;
    lines := lines || case when (n = 0) then 'PASS ' || 'status: the owner cannot edit a removed listing' else 'FAIL ' || 'status: the owner cannot edit a removed listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);

    -- ==== the gate for posting: a non-tester, a new account ====
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Stranger toy','',0,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'gate: a non-tester cannot post while the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'not_member' then 'PASS ' || 'gate: a non-tester cannot post while the market is closed' else 'FAIL ' || 'gate: a non-tester cannot post while the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', newbie, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute ins || $v$('meetup','join',null,'th-bangkok',null,private.today(),private.today()+1,'New walk','',null,null,4,null,'food')$v$;
      lines := lines || ('FAIL ' || 'new account: no meetup in the first 24 hours' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'account_too_new' then 'PASS ' || 'new account: no meetup in the first 24 hours' else 'FAIL ' || 'new account: no meetup in the first 24 hours' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('room','offer',null,'th-bangkok',null,private.today(),private.today()+5,'New room','',null,null,null,'private',null)$v$;
      lines := lines || ('FAIL ' || 'new account: no room in the first 24 hours' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'account_too_new' then 'PASS ' || 'new account: no room in the first 24 hours' else 'FAIL ' || 'new account: no room in the first 24 hours' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('ride','seek',null,'th-bangkok','th-pai',private.today(),private.today()+1,'New lift','',null,null,null,null,null)$v$;
      lines := lines || ('FAIL ' || 'new account: no ride in the first 24 hours' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'account_too_new' then 'PASS ' || 'new account: no ride in the first 24 hours' else 'FAIL ' || 'new account: no ride in the first 24 hours' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'New toy box','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'new account: an item is fine' else 'FAIL ' || 'new account: an item is fine' || ' [' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- ==== rate limits, each at its edge (section 9) ====
    perform set_config('request.jwt.claims', json_build_object('sub', rate_old, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      for i in 1 .. 5 loop
        insert into public.listings (kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
        values ('item', 'sell', 'books', 'th-bangkok', d0, d0 + 3, 'Rate old book ' || i, 100, 'THB');
      end loop;
      lines := lines || 'PASS rate: an established account posts 5 in a day';
    exception when others then
      lines := lines || ('FAIL rate: an established account could not post 5 in a day [' || sqlerrm || ']');
    end;
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Rate old book six','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'rate: the 6th post in a day' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:post' then 'PASS ' || 'rate: the 6th post in a day' else 'FAIL ' || 'rate: the 6th post in a day' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', rate_new, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      for i in 1 .. 2 loop
        insert into public.listings (kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
        values ('item', 'sell', 'books', 'th-bangkok', d0, d0 + 3, 'Rate new book ' || i, 100, 'THB');
      end loop;
      lines := lines || 'PASS rate: a new account posts 2 in a day';
    exception when others then
      lines := lines || ('FAIL rate: a new account could not post 2 in a day [' || sqlerrm || ']');
    end;
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Rate new book three','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'rate: a new account''s 3rd post in a day' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:post' then 'PASS ' || 'rate: a new account''s 3rd post in a day' else 'FAIL ' || 'rate: a new account''s 3rd post in a day' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency, created_at)
    select open_old, 'item', 'sell', 'books', 'th-bangkok', d0, d0 + 20, 'Open old ' || g, 100, 'THB', now() - interval '3 days'
    from generate_series(1, 9) as g;
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency, created_at)
    select open_new, 'item', 'sell', 'books', 'th-bangkok', d0, d0 + 20, 'Open new ' || g, 100, 'THB', now() - interval '3 days'
    from generate_series(1, 2) as g;
    perform set_config('request.jwt.claims', json_build_object('sub', open_old, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Open old ten','',100,'THB',null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'open: the 10th open listing is accepted for an established account' else 'FAIL ' || 'open: the 10th open listing is accepted for an established account' || ' [' || sqlerrm || ']' end;
    end;
    insert into public.listings (kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values ('item', 'sell', 'books', 'th-bangkok', d0, d0 + 3, 'Open old ten', 100, 'THB');
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Open old eleven','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'open: the 11th open listing is refused' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:open' then 'PASS ' || 'open: the 11th open listing is refused' else 'FAIL ' || 'open: the 11th open listing is refused' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', open_new, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.listings (kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values ('item', 'sell', 'books', 'th-bangkok', d0, d0 + 3, 'Open new three', 100, 'THB');
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Open new four','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'open: a new account''s 4th open listing is refused' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:open' then 'PASS ' || 'open: a new account''s 4th open listing is refused' else 'FAIL ' || 'open: a new account''s 4th open listing is refused' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', title_u, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.listings (kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values ('item', 'sell', 'books', 'th-bangkok', d0, d0 + 3, 'Same Title Test', 100, 'THB');
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'same title test','',100,'THB',null,null,null)$v$;
      lines := lines || ('FAIL ' || 'title: the same title within 24 hours (case aside)' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:same_title' then 'PASS ' || 'title: the same title within 24 hours (case aside)' else 'FAIL ' || 'title: the same title within 24 hours (case aside)' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','sell','books','th-bangkok',null,private.today(),private.today()+3,'Another title test','',100,'THB',null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'title: a different title is fine' else 'FAIL ' || 'title: a different title is fine' || ' [' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- ==== the display-name limit (section 9) and the two names (owner ruling 2026-10-19) ====
    perform set_config('request.jwt.claims', json_build_object('sub', namer, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.profiles set display_name = 'Gun' where id = namer;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'name: Gun is allowed as a display name' else 'FAIL ' || 'name: Gun is allowed as a display name' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.profiles set display_name = 'Kush' where id = namer;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'name: Kush is allowed as a display name' else 'FAIL ' || 'name: Kush is allowed as a display name' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute format($v$update public.profiles set display_name = 'Mekonging Support' where id = %L$v$, namer);
      lines := lines || ('FAIL ' || 'name: a filtered name is still refused, and does not count' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'name_rejected' then 'PASS ' || 'name: a filtered name is still refused, and does not count' else 'FAIL ' || 'name: a filtered name is still refused, and does not count' || ' [got ' || sqlerrm || ']' end;
    end;
    update public.profiles set display_name = 'Namer Three' where id = namer;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'name: the third change in a day is accepted' else 'FAIL ' || 'name: the third change in a day is accepted' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.profiles set display_name = 'Namer Three' where id = namer;
    get diagnostics n = row_count;
    lines := lines || case when (n = 1) then 'PASS ' || 'name: saving the same name again is not a change' else 'FAIL ' || 'name: saving the same name again is not a change' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute format($v$update public.profiles set display_name = 'Namer Four' where id = %L$v$, namer);
      lines := lines || ('FAIL ' || 'name: the fourth change in a day' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:name' then 'PASS ' || 'name: the fourth change in a day' else 'FAIL ' || 'name: the fourth change in a day' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    select count(*) into n from private.name_changes c where c.user_id = namer;
    lines := lines || case when (n = 3) then 'PASS ' || 'name: exactly three changes were counted' else 'FAIL ' || 'name: exactly three changes were counted' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', newbie, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    update public.profiles set display_name = 'Newbie One' where id = newbie;
    update public.profiles set display_name = 'Newbie Two' where id = newbie;
    update public.profiles set display_name = 'Newbie Three' where id = newbie;
    begin
      execute format($v$update public.profiles set display_name = 'Newbie Four' where id = %L$v$, newbie);
      lines := lines || ('FAIL ' || 'name: a new account has the same limit of three' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:name' then 'PASS ' || 'name: a new account has the same limit of three' else 'FAIL ' || 'name: a new account has the same limit of three' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- ==== reports: weight, eligibility, the snapshot, auto-hide at exactly 3 (section 8) ====
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, body, price_amount, price_currency)
    values (seller, 'item', 'sell', 'toys', 'th-bangkok', d0, d0 + 10, 'Report target alpha', 'Original text.', 400, 'THB')
    returning id into l_hide;
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values (seller, 'item', 'sell', 'toys', 'th-bangkok', d0, d0 + 10, 'Report target beta', 400, 'THB')
    returning id into l_vis;
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values (seller, 'item', 'sell', 'toys', 'th-bangkok', d0 - 5, d0 - 1, 'Report target ended', 400, 'THB')
    returning id into l_end;
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency)
    values (deleter, 'item', 'sell', 'toys', 'th-bangkok', d0, d0 + 10, 'Deleter item', 400, 'THB')
    returning id into l_del;
    perform set_config('request.jwt.claims', json_build_object('sub', rp1, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason, note) values (l_hide, 'scam', 'Looks fake');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.reports r
    where r.listing_id = l_hide and r.reporter = rp1 and r.target_user = seller and r.reason = 'scam' and r.status = 'open'
      and r.snapshot ->> 'title' = 'Report target alpha' and r.snapshot ->> 'body' = 'Original text.';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: the row holds the reporter, the target user and a snapshot set by the trigger' else 'FAIL ' || 'report: the row holds the reporter, the target user and a snapshot set by the trigger' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.listings where id = l_hide and report_weight = 1 and status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: one eligible report weighs 1' else 'FAIL ' || 'report: one eligible report weighs 1' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', rp1, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, l_hide);
      lines := lines || ('FAIL ' || 'report: the same person cannot report a listing twice' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'already_reported' then 'PASS ' || 'report: the same person cannot report a listing twice' else 'FAIL ' || 'report: the same person cannot report a listing twice' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', rp2, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (l_hide, 'scam');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = l_hide and report_weight = 2 and status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: two eligible reports weigh 2 and the listing stays open' else 'FAIL ' || 'report: two eligible reports weigh 2 and the listing stays open' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', rnew, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (l_hide, 'scam');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = l_hide and report_weight = 2 and status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: a report from an account under 24 hours old is filed but does not count' else 'FAIL ' || 'report: a report from an account under 24 hours old is filed but does not count' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', rp3, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (l_hide, 'scam');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = l_hide and report_weight = 3 and status = 'hidden';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: exactly 3 eligible reports hide the listing' else 'FAIL ' || 'report: exactly 3 eligible reports hide the listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.listings set title = 'Report target alpha, reworded' where id = l_hide;
    select count(*) into n from public.reports r where r.listing_id = l_hide and r.snapshot ->> 'title' = 'Report target alpha';
    lines := lines || case when (n = 4) then 'PASS ' || 'report: editing the listing later does not change the four snapshots' else 'FAIL ' || 'report: editing the listing later does not change the four snapshots' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', seller, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select x ->> 'status' into t from public.market_my_listings() x where (x ->> 'id')::uuid = l_hide;
    lines := lines || case when (t = 'hidden') then 'PASS ' || 'report: the owner sees the hidden state under My listings' else 'FAIL ' || 'report: the owner sees the hidden state under My listings' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.listings set title = 'Trying to edit' where id = l_hide;
    get diagnostics n = row_count;
    lines := lines || case when (n = 0) then 'PASS ' || 'report: the owner cannot edit a hidden listing' else 'FAIL ' || 'report: the owner cannot edit a hidden listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);

    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, l_hide);
      lines := lines || ('FAIL ' || 'report: a hidden listing cannot be reported by a stranger' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'report_target_invalid' then 'PASS ' || 'report: a hidden listing cannot be reported by a stranger' else 'FAIL ' || 'report: a hidden listing cannot be reported by a stranger' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, l_end);
      lines := lines || ('FAIL ' || 'report: an ended listing cannot be reported' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'report_target_invalid' then 'PASS ' || 'report: an ended listing cannot be reported' else 'FAIL ' || 'report: an ended listing cannot be reported' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'filter')$v$, l_vis);
      lines := lines || ('FAIL ' || 'report: the reason filter is for the system' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'report_reason_invalid' then 'PASS ' || 'report: the reason filter is for the system' else 'FAIL ' || 'report: the reason filter is for the system' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute format($v$insert into public.reports (listing_id, reason, note) values (%L, 'spam', repeat('n', 301))$v$, l_vis);
      lines := lines || ('FAIL ' || 'report: a note of 301 characters' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'note_length' then 'PASS ' || 'report: a note of 301 characters' else 'FAIL ' || 'report: a note of 301 characters' || ' [got ' || sqlerrm || ']' end;
    end;
    insert into public.reports (listing_id, reason, note) values (l_vis, 'spam', repeat('n', 300));
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, p_flag);
      lines := lines || ('FAIL ' || 'report: an owner cannot report their own listing' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'own_listing' then 'PASS ' || 'report: an owner cannot report their own listing' else 'FAIL ' || 'report: an owner cannot report their own listing' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, l_vis);
      lines := lines || ('FAIL ' || 'report: a non-tester cannot report while the market is closed' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'not_member' then 'PASS ' || 'report: a non-tester cannot report while the market is closed' else 'FAIL ' || 'report: a non-tester cannot report while the market is closed' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- A system flag counts with two people: 1 + 2 = 3 hides the flagged listing.
    perform set_config('request.jwt.claims', json_build_object('sub', rp1, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (p_flag, 'drugs');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = p_flag and report_weight = 2 and status = 'open';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: a flag and one person weigh 2' else 'FAIL ' || 'report: a flag and one person weigh 2' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('request.jwt.claims', json_build_object('sub', rp2, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (p_flag, 'drugs');
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = p_flag and report_weight = 3 and status = 'hidden';
    lines := lines || case when (n = 1) then 'PASS ' || 'report: a flag and two people hide the listing' else 'FAIL ' || 'report: a flag and two people hide the listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- Report limits: 3 a day for a new account, 10 for an established one.
    perform set_config('request.jwt.claims', json_build_object('sub', rnew, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (bulk_ids[1], 'spam');
    insert into public.reports (listing_id, reason) values (bulk_ids[2], 'spam');
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, bulk_ids[3]);
      lines := lines || ('FAIL ' || 'report: a new account''s 4th report in a day' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:report' then 'PASS ' || 'report: a new account''s 4th report in a day' else 'FAIL ' || 'report: a new account''s 4th report in a day' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', rep_old, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      for i in 1 .. 10 loop
        insert into public.reports (listing_id, reason) values (bulk_ids[10 + i], 'spam');
      end loop;
      lines := lines || 'PASS report: an established account files 10 in a day';
    exception when others then
      lines := lines || ('FAIL report: an established account could not file 10 in a day [' || sqlerrm || ']');
    end;
    begin
      execute format($v$insert into public.reports (listing_id, reason) values (%L, 'spam')$v$, bulk_ids[30]);
      lines := lines || ('FAIL ' || 'report: the 11th report in a day' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'rate_limited:report' then 'PASS ' || 'report: the 11th report in a day' else 'FAIL ' || 'report: the 11th report in a day' || ' [got ' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = any (bulk_ids[11:20]) and report_weight = 1 and status = 'open';
    lines := lines || case when (n = 10) then 'PASS ' || 'report: single reports weigh 1 and hide nothing' else 'FAIL ' || 'report: single reports weigh 1 and hide nothing' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- ==== search fixtures: 14 listings everyone can see, 6 that nobody can ====
    insert into public.listings (owner, kind, intent, category, city, to_city, starts_on, ends_on, title, body, price_amount, price_currency,
                                 seats, room_type, activity, status, created_at)
    values
      (seller,  'item',   'sell',    'carseat', 'th-bangkok',      null,     d0,      d0 + 10, 'Child car seat ' || m,            'Fits most cars.', 800, 'THB', null, null, null, 'open', now() - interval '1 hour'),
      (seller,  'item',   'give',    'stroller','th-chiang-mai',   null,     d0 + 1,  d0 + 20, 'Free baby stroller ' || m,        '', null, null, null, null, null, 'open', now() - interval '2 hours'),
      (seller2, 'item',   'sell',    'bicycle', 'th-chiang-mai',   null,     d0,      d0 + 5,  'Folding bicycle ' || m,           '', 3500, 'THB', null, null, null, 'open', now() - interval '3 hours'),
      (seller2, 'room',   'offer',   null,      'vi-hanoi',        null,     d0 + 20, d0 + 25, 'Room near the old quarter ' || m, 'Quiet street.', 4500000, 'VND', null, 'private', null, 'open', now() - interval '4 hours'),
      (seller2, 'ride',   'offer',   null,      'th-chiang-mai',   'th-pai', d0 + 2,  d0 + 2,  'Lift to Pai ' || m,              '', 300, 'THB', 3, null, null, 'open', now() - interval '5 hours'),
      (seller,  'meetup', 'join',    null,      'th-bangkok',      null,     d0 + 1,  d0 + 3,  'Dinner meetup ' || m,            '', null, null, 4, null, 'food', 'open', now() - interval '6 hours'),
      (seller2, 'item',   'trade',   'camping', 'la-luang-prabang',null,     d0,      d0 + 29, 'Trade camping stove ' || m,      '', null, null, null, null, null, 'open', now() - interval '7 hours'),
      (seller,  'item',   'request', 'books',   'kh-siem-reap',    null,     d0,      d0 + 10, 'Wanted kids books ' || m,         '', null, null, null, null, null, 'open', now() - interval '8 hours'),
      (seller2, 'room',   'seek',    null,      'vi-hanoi',        null,     d0 + 3,  d0 + 32, 'Ph' || U&'\00F2' || 'ng ' || U&'\0111\1EB9' || 'p H' || U&'\00E0' || ' N' || U&'\1ED9' || 'i ' || m, '', null, null, null, 'shared', null, 'open', now() - interval '9 hours'),
      (seller,  'room',   'offer',   null,      'th-bangkok',      null,     d0 + 5,  d0 + 34, U&'\0E2B\0E49\0E2D\0E07\0E1E\0E31\0E01' || ' ' || m, '', 12000, 'THB', null, 'whole', null, 'open', now() - interval '10 hours'),
      (seller2, 'item',   'sell',    'camping', 'th-bangkok',      null,     d0,      d0 + 10, 'Backpack 45L ' || m,              '', 900, 'THB', null, null, null, 'open', now() - interval '11 hours'),
      (lapsed,  'item',   'sell',    'clothing','th-bangkok',      null,     d0,      d0 + 5,  'Lapsed owner jacket ' || m,       '', 200, 'THB', null, null, null, 'open', now() - interval '12 hours'),
      (asker,   'item',   'give',    'toys',    'th-chiang-mai',   null,     d0,      d0 + 5,  'Asker toy box ' || m,             '', null, null, null, null, null, 'open', now() - interval '13 hours'),
      (seller3, 'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Blocked pair book ' || m,         '', 100, 'THB', null, null, null, 'open', now() - interval '14 hours'),
      (seller,  'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Hidden book ' || m,               '', 100, 'THB', null, null, null, 'hidden', now() - interval '15 hours'),
      (seller,  'item',   'sell',    'books',   'th-bangkok',      null,     d0 - 5,  d0 - 1,  'Ended book ' || m,                '', 100, 'THB', null, null, null, 'open', now() - interval '16 hours'),
      (seller,  'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Closed book ' || m,               '', 100, 'THB', null, null, null, 'closed', now() - interval '17 hours'),
      (seller,  'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Removed book ' || m,              '', 100, 'THB', null, null, null, 'removed', now() - interval '18 hours'),
      (seller,  'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Deleted book ' || m,              '', 100, 'THB', null, null, null, 'deleted', now() - interval '19 hours'),
      (susp,    'item',   'sell',    'books',   'th-bangkok',      null,     d0,      d0 + 5,  'Under review owner book ' || m,   '', 100, 'THB', null, null, null, 'open', now() - interval '20 hours');
    select id into s1  from public.listings where title = 'Child car seat ' || m;
    select id into s2  from public.listings where title = 'Free baby stroller ' || m;
    select id into s3  from public.listings where title = 'Folding bicycle ' || m;
    select id into s4  from public.listings where title = 'Room near the old quarter ' || m;
    select id into s5  from public.listings where title = 'Lift to Pai ' || m;
    select id into s6  from public.listings where title = 'Dinner meetup ' || m;
    select id into s7  from public.listings where title = 'Trade camping stove ' || m;
    select id into s8  from public.listings where title = 'Wanted kids books ' || m;
    select id into s9  from public.listings where title like 'Ph%' and title like '% ' || m and owner = seller2 and kind = 'room';
    select id into s10 from public.listings where title like '%' || m and owner = seller and kind = 'room' and city = 'th-bangkok';
    select id into s11 from public.listings where title = 'Backpack 45L ' || m;
    select id into l1  from public.listings where title = 'Lapsed owner jacket ' || m;
    select id into a1x from public.listings where title = 'Asker toy box ' || m;
    select id into b1  from public.listings where title = 'Blocked pair book ' || m;
    select id into h1  from public.listings where title = 'Hidden book ' || m;
    select id into e1  from public.listings where title = 'Ended book ' || m;
    select id into c1  from public.listings where title = 'Closed book ' || m;
    select id into rm1 from public.listings where title = 'Removed book ' || m;
    select id into d1  from public.listings where title = 'Deleted book ' || m;
    select id into u1  from public.listings where title = 'Under review owner book ' || m;
    select count(*) into n from public.listings where title like '%' || m;
    lines := lines || case when (n = 20) then 'PASS ' || 'fixtures: 20 search fixtures seeded (14 visible to a stranger, 6 never)' else 'FAIL ' || 'fixtures: 20 search fixtures seeded (14 visible to a stranger, 6 never)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (s1 is not null and s2 is not null and s3 is not null and s4 is not null and s5 is not null and s6 is not null and s7 is not null and s8 is not null and s9 is not null and s10 is not null and s11 is not null and l1 is not null and a1x is not null and b1 is not null and h1 is not null and e1 is not null and c1 is not null and rm1 is not null and d1 is not null and u1 is not null) then 'PASS ' || 'fixtures: every fixture id was found' else 'FAIL ' || 'fixtures: every fixture id was found' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    insert into public.blocks (blocker, blocked, blocked_name) values (asker, seller3, 'Sellerthree');
    -- Two more rows under their own marker: a dotted number in a title, and a cash listing (cash is
    -- closed to clients, so only the database owner can seed one).
    insert into public.listings (owner, kind, intent, category, city, starts_on, ends_on, title, price_amount, price_currency, created_at)
    values (seller, 'item', 'sell', 'camping', 'th-bangkok', d0, d0 + 5, 'Tent 3.5 persons ' || m3, 500, 'THB', now() - interval '21 hours')
    returning id into t_tent;
    insert into public.listings (owner, kind, intent, city, starts_on, ends_on, title, have_currency, have_amount, want_currency, created_at)
    values (seller, 'cash', 'offer', 'th-bangkok', d0, d0 + 5, 'Cash fixture ' || m3, 'THB', 5000, 'USD', now() - interval '22 hours')
    returning id into c_cash;

    -- ==== search, as a tester (the market is still closed) ====
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]) as u;
    dbg := 'got ' || cardinality(ids) || ' rows';
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'search: a tester sees the 13 listings that are open, unended, unblocked and from owners in good standing' else 'FAIL ' || 'search: a tester sees the 13 listings that are open, unended, unblocked and from owners in good standing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (not (h1 = any (ids) or e1 = any (ids) or c1 = any (ids) or rm1 = any (ids) or d1 = any (ids) or u1 = any (ids) or b1 = any (ids))) then 'PASS ' || 'search: hidden, ended, closed, removed, deleted, under-review and blocked listings never appear' else 'FAIL ' || 'search: hidden, ended, closed, removed, deleted, under-review and blocked listings never appear' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when ((select count(*) from jsonb_array_elements(rs) e(x) where (x ->> 'total')::int = 13) = 13) then 'PASS ' || 'search: every row carries the total of matching rows' else 'FAIL ' || 'search: every row carries the total of matching rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from jsonb_array_elements(rs) as e(x), jsonb_object_keys(e.x) as k(k) where k.k <> all (array['id','kind','intent','category','city','to_city','starts_on','ends_on','title','body','price_amount','price_currency','seats','room_type','activity','have_currency','have_amount','want_currency','created_at','total']);
    lines := lines || case when n = 0 then 'PASS ' || 'search: a row holds only the public columns' else 'FAIL ' || 'search: a row holds only the public columns' || ' [' || n || ' unexpected keys]' end;
    lines := lines || case when (position(seller::text in rs::text) = 0 and position(seller2::text in rs::text) = 0 and position(lapsed::text in rs::text) = 0 and position(asker::text in rs::text) = 0) then 'PASS ' || 'search: no owner id appears anywhere in the result' else 'FAIL ' || 'search: no owner id appears anywhere in the result' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m || ' hidden') with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 0) then 'PASS ' || 'search: a hidden listing is not found by its own words' else 'FAIL ' || 'search: a hidden listing is not found by its own words' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => 'zzzzqqqq ' || m) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 0) then 'PASS ' || 'search: a word nobody used finds nothing' else 'FAIL ' || 'search: a word nobody used finds nothing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => upper(m)) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 13) then 'PASS ' || 'search: the query is case-insensitive' else 'FAIL ' || 'search: the query is case-insensitive' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => '   ' || m || '   ') with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 13) then 'PASS ' || 'search: the query is trimmed' else 'FAIL ' || 'search: the query is trimmed' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => 'baby strol ' || m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s2]) then 'PASS ' || 'search: words match by prefix, all of them (baby strol)' else 'FAIL ' || 'search: words match by prefix, all of them (baby strol)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => 'stroler') with ordinality as s(x, ord);
    lines := lines || case when (exists (select 1 from jsonb_array_elements(rs) e(x) where (x ->> 'id')::uuid = s2)) then 'PASS ' || 'search: a typo still finds the stroller (pg_trgm)' else 'FAIL ' || 'search: a typo still finds the stroller (pg_trgm)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => '45l ' || m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s11]) then 'PASS ' || 'search: a digit stays a digit (45l finds the 45 litre pack)' else 'FAIL ' || 'search: a digit stays a digit (45l finds the 45 litre pack)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => 'phong dep ha noi ' || m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s9]) then 'PASS ' || 'search: Vietnamese accents fold (plain letters find the accented title)' else 'FAIL ' || 'search: Vietnamese accents fold (plain letters find the accented title)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => 'Ph' || U&'\00F2' || 'ng ' || m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s9]) then 'PASS ' || 'search: an accented query finds it too' else 'FAIL ' || 'search: an accented query finds it too' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => U&'\0E2B\0E49\0E2D\0E07\0E1E\0E31\0E01') with ordinality as s(x, ord);
    lines := lines || case when (exists (select 1 from jsonb_array_elements(rs) e(x) where (x ->> 'id')::uuid = s10)) then 'PASS ' || 'search: a Thai query matches as a substring' else 'FAIL ' || 'search: a Thai query matches as a substring' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- Filters (as the tester; the 13 visible rows).
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, kind => 'item') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s7, s8, s11, l1, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: kind item' else 'FAIL ' || 'filter: kind item' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, kind => 'room') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s4, s9, s10]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: kind room' else 'FAIL ' || 'filter: kind room' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, kind => 'ride') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s5]) then 'PASS ' || 'filter: kind ride' else 'FAIL ' || 'filter: kind ride' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, kind => 'meetup') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s6]) then 'PASS ' || 'filter: kind meetup' else 'FAIL ' || 'filter: kind meetup' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m3, kind => 'cash') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[c_cash]) then 'PASS ' || 'filter: kind cash finds the cash listing and nothing else' else 'FAIL ' || 'filter: kind cash finds the cash listing and nothing else' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m3, kind => 'item') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[t_tent]) then 'PASS ' || 'filter: kind item leaves the cash listing out' else 'FAIL ' || 'filter: kind item leaves the cash listing out' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m3) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 2) then 'PASS ' || 'filter: without a kind both rows are found' else 'FAIL ' || 'filter: without a kind both rows are found' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => '3.5 ' || m3) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[t_tent]) then 'PASS ' || 'search: a dotted number is one word on both sides (3.5 finds the tent)' else 'FAIL ' || 'search: a dotted number is one word on both sides (3.5 finds the tent)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, category => 'camping') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s7, s11]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: category camping' else 'FAIL ' || 'filter: category camping' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, city => 'th-bangkok') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s6, s10, s11, l1]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: city Bangkok (b1 is blocked for this tester)' else 'FAIL ' || 'filter: city Bangkok (b1 is blocked for this tester)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, city => 'th-chiang-mai') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s2, s3, s5, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: city Chiang Mai (a ride is found by its departure city)' else 'FAIL ' || 'filter: city Chiang Mai (a ride is found by its departure city)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, city => 'th-pai') with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 0) then 'PASS ' || 'filter: a ride is not found by its destination' else 'FAIL ' || 'filter: a ride is not found by its destination' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, date_from => d0 + 20, date_to => d0 + 25) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s2, s4, s7, s9, s10]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: a window that ends on the first day overlaps (touching counts)' else 'FAIL ' || 'filter: a window that ends on the first day overlaps (touching counts)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, date_from => d0 + 21, date_to => d0 + 25) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s4, s7, s9, s10]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: a window that ended the day before does not overlap' else 'FAIL ' || 'filter: a window that ended the day before does not overlap' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, date_to => d0) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s3, s7, s8, s11, l1, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: a window that starts on the last day overlaps' else 'FAIL ' || 'filter: a window that starts on the last day overlaps' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, date_to => d0 - 1) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 0) then 'PASS ' || 'filter: nothing starts before today' else 'FAIL ' || 'filter: nothing starts before today' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, price_max => 1000, currency => 'THB') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s5, s11, l1, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: up to 1000 baht includes free listings, excludes other currencies and no-price listings' else 'FAIL ' || 'filter: up to 1000 baht includes free listings, excludes other currencies and no-price listings' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, price_min => 500, currency => 'THB') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s3, s10, s11]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: from 500 baht excludes free listings' else 'FAIL ' || 'filter: from 500 baht excludes free listings' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, price_min => 500, price_max => 1000, currency => 'THB') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s11]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: 500 to 1000 baht' else 'FAIL ' || 'filter: 500 to 1000 baht' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, price_min => 1000000, currency => 'VND') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s4]) then 'PASS ' || 'filter: a dong range' else 'FAIL ' || 'filter: a dong range' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute $v$select * from public.market_search(q => 'x', price_max => 100)$v$;
      lines := lines || ('FAIL ' || 'filter: a price range needs a currency' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'currency_required' then 'PASS ' || 'filter: a price range needs a currency' else 'FAIL ' || 'filter: a price range needs a currency' || ' [got ' || sqlerrm || ']' end;
    end;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, free_only => true) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s2, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'filter: free only' else 'FAIL ' || 'filter: free only' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, kind => 'item', category => 'camping', city => 'th-bangkok', price_max => 1000, currency => 'THB') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = array[s11]) then 'PASS ' || 'filter: filters combine' else 'FAIL ' || 'filter: filters combine' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    -- Sorts. The expected order is computed here from the fixture rows with the rule stated in the migration.
    perform set_config('role', owner_role, true);
    select array_agg(l.id order by l.created_at desc, l.id desc) into want_ids from public.listings l where l.id = any (array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, sort => 'newest') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by ord), '{}') into ids from jsonb_array_elements(rs) with ordinality as e(x, ord);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'sort: newest first' else 'FAIL ' || 'sort: newest first' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    select array_agg(l.id order by greatest(l.starts_on, d0), l.ends_on, l.created_at desc, l.id desc) into want_ids from public.listings l where l.id = any (array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, sort => 'soonest') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by ord), '{}') into ids from jsonb_array_elements(rs) with ordinality as e(x, ord);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'sort: soonest first (a window already open counts from today)' else 'FAIL ' || 'sort: soonest first (a window already open counts from today)' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    select array_agg(l.id order by l.price_amount asc nulls last, l.created_at desc, l.id desc) into want_ids from public.listings l where l.id = any (array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, sort => 'price_up') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by ord), '{}') into ids from jsonb_array_elements(rs) with ordinality as e(x, ord);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'sort: price up, free first, no price last' else 'FAIL ' || 'sort: price up, free first, no price last' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select (x ->> 'price_amount')::numeric into pf from jsonb_array_elements(rs) with ordinality as e(x, ord) where ord = 1;
    select (x ->> 'price_amount')::numeric into pl from jsonb_array_elements(rs) with ordinality as e(x, ord) where ord = jsonb_array_length(rs);
    lines := lines || case when (pf = 0 and pl is null) then 'PASS ' || 'sort: price up starts at a free listing and ends at one with no price' else 'FAIL ' || 'sort: price up starts at a free listing and ends at one with no price' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    select array_agg(l.id order by l.price_amount desc nulls last, l.created_at desc, l.id desc) into want_ids from public.listings l where l.id = any (array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, sort => 'price_down') with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by ord), '{}') into ids from jsonb_array_elements(rs) with ordinality as e(x, ord);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'sort: price down, the largest amount first' else 'FAIL ' || 'sort: price down, the largest amount first' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute $v$select * from public.market_search(sort => 'bogus')$v$;
      lines := lines || ('FAIL ' || 'sort: an unknown sort' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'sort_invalid' then 'PASS ' || 'sort: an unknown sort' else 'FAIL ' || 'sort: an unknown sort' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute $v$select * from public.market_search(page => -1)$v$;
      lines := lines || ('FAIL ' || 'page: a negative page' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'page_invalid' then 'PASS ' || 'page: a negative page' else 'FAIL ' || 'page: a negative page' || ' [got ' || sqlerrm || ']' end;
    end;
    begin
      execute $v$select * from public.market_search(page => 200)$v$;
      lines := lines || ('FAIL ' || 'page: page 200' || ' (accepted)');
    exception when others then
      lines := lines || case when sqlerrm = 'page_invalid' then 'PASS ' || 'page: page 200' else 'FAIL ' || 'page: page 200' || ' [got ' || sqlerrm || ']' end;
    end;

    -- Paging, over the 55 bulk listings.
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m2, page_size => 1000) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 50) then 'PASS ' || 'paging: a page never holds more than 50 rows' else 'FAIL ' || 'paging: a page never holds more than 50 rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when ((select count(*) from jsonb_array_elements(rs) e(x) where (x ->> 'total')::int = 55) = 50) then 'PASS ' || 'paging: the total counts every match, not just the page' else 'FAIL ' || 'paging: the total counts every match, not just the page' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m2, page => 1, page_size => 50) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 5) then 'PASS ' || 'paging: the second page holds the remaining 5' else 'FAIL ' || 'paging: the second page holds the remaining 5' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m2, page_size => 0) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 1) then 'PASS ' || 'paging: a page size of 0 is raised to 1' else 'FAIL ' || 'paging: a page size of 0 is raised to 1' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m2, page => 3, page_size => 20) with ordinality as s(x, ord);
    lines := lines || case when (jsonb_array_length(rs) = 0) then 'PASS ' || 'paging: a page past the end is empty' else 'FAIL ' || 'paging: a page past the end is empty' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m2, page_size => 10) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (cardinality(ids) = 10 and (select count(distinct x) from unnest(ids) x) = 10) then 'PASS ' || 'paging: a page of 10 holds 10 distinct rows' else 'FAIL ' || 'paging: a page of 10 holds 10 distinct rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);

    -- ==== one listing, and my listings ====
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select public.market_listing(s1) into j;
    lines := lines || case when (j ->> 'id' = s1::text and j ->> 'title' = 'Child car seat ' || m and j ->> 'mine' = 'false' and j ->> 'status' = 'open' and j ->> 'member_since' ~ '^[0-9]{4}-[0-9]{2}$') then 'PASS ' || 'listing: a visible listing opens with its status, mine=false and the owner''s month' else 'FAIL ' || 'listing: a visible listing opens with its status, mine=false and the owner''s month' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (position(seller::text in j::text) = 0) then 'PASS ' || 'listing: the owner id is not in the row' else 'FAIL ' || 'listing: the owner id is not in the row' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from jsonb_object_keys(j) k where k <> all (array['id','kind','intent','category','city','to_city','starts_on','ends_on','title','body','price_amount','price_currency','seats','room_type','activity','have_currency','have_amount','want_currency','created_at','status','mine','member_since']);
    lines := lines || case when (n = 0) then 'PASS ' || 'listing: a row holds only the public columns plus status, mine and member_since' else 'FAIL ' || 'listing: a row holds only the public columns plus status, mine and member_since' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(h1) into j;
    lines := lines || case when (j is null) then 'PASS ' || 'listing: a hidden listing is null for another tester' else 'FAIL ' || 'listing: a hidden listing is null for another tester' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(e1) into j;
    lines := lines || case when (j is null) then 'PASS ' || 'listing: an ended listing is null' else 'FAIL ' || 'listing: an ended listing is null' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(b1) into j;
    lines := lines || case when (j is null) then 'PASS ' || 'listing: a listing by someone the caller blocked is null' else 'FAIL ' || 'listing: a listing by someone the caller blocked is null' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(a1x) into j;
    lines := lines || case when (j ->> 'mine' = 'true') then 'PASS ' || 'listing: the caller''s own listing says mine=true' else 'FAIL ' || 'listing: the caller''s own listing says mine=true' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', seller, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select public.market_listing(h1) into j;
    lines := lines || case when (j ->> 'status' = 'hidden' and j ->> 'mine' = 'true') then 'PASS ' || 'listing: the owner opens their own hidden listing' else 'FAIL ' || 'listing: the owner opens their own hidden listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(d1) into j;
    lines := lines || case when (j is null) then 'PASS ' || 'listing: even the owner gets null for a deleted listing' else 'FAIL ' || 'listing: even the owner gets null for a deleted listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]') into rs from public.market_my_listings() with ordinality as e(x, ord);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s6, s8, s10, h1, e1, c1, rm1, l_hide, l_vis, l_end, t_tent, c_cash]) as u;
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'my listings: all of the caller''s rows except deleted ones, never anyone else''s' else 'FAIL ' || 'my listings: all of the caller''s rows except deleted ones, never anyone else''s' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from jsonb_array_elements(rs) as e(x), jsonb_object_keys(e.x) as k(k) where k.k <> all (array['id','kind','intent','category','city','to_city','starts_on','ends_on','title','body','price_amount','price_currency','seats','room_type','activity','have_currency','have_amount','want_currency','created_at','status','updated_at']);
    lines := lines || case when n = 0 then 'PASS ' || 'my listings: a row holds only the public columns plus status and updated_at' else 'FAIL ' || 'my listings: a row holds only the public columns plus status and updated_at' || ' [' || n || ' unexpected keys]' end;
    lines := lines || case when (position(seller::text in rs::text) = 0) then 'PASS ' || 'my listings: not even the caller''s own id appears' else 'FAIL ' || 'my listings: not even the caller''s own id appears' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);

    -- ==== the table policy agrees with the RPCs (the market opens) ====
    update private.settings set value = 'true'::jsonb where key = 'market_open';
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(array_agg(l.id order by l.id), '{}') into ids from public.listings l where l.title like '%' || m;
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x, b1]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'table: once the market is open a member sees exactly the 14 visible rows' else 'FAIL ' || 'table: once the market is open a member sees exactly the 14 visible rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'search: the RPC returns the same 14 rows as the table policy' else 'FAIL ' || 'search: the RPC returns the same 14 rows as the table policy' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    update public.listings set title = 'Hijacked by a stranger' where id = s1;
    get diagnostics n = row_count;
    lines := lines || case when (n = 0) then 'PASS ' || 'table: a stranger changes 0 rows of another person''s listing' else 'FAIL ' || 'table: a stranger changes 0 rows of another person''s listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.listings where id in (h1, e1, c1, rm1, d1, u1);
    lines := lines || case when (n = 0) then 'PASS ' || 'table: a stranger cannot see hidden, ended, closed, removed, deleted or under-review rows' else 'FAIL ' || 'table: a stranger cannot see hidden, ended, closed, removed, deleted or under-review rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(array_agg(l.id order by l.id), '{}') into ids from public.listings l where l.title like '%' || m;
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'table: a blocker does not see the blocked owner''s listing' else 'FAIL ' || 'table: a blocker does not see the blocked owner''s listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'search: the RPC agrees for the blocker' else 'FAIL ' || 'search: the RPC agrees for the blocker' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', seller3, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, b1]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'search: the blocked owner does not see the blocker''s listing, and sees their own' else 'FAIL ' || 'search: the blocked owner does not see the blocker''s listing, and sees their own' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(a1x) into j;
    lines := lines || case when (j is null) then 'PASS ' || 'listing: the blocked owner gets null for the blocker''s listing' else 'FAIL ' || 'listing: the blocked owner gets null for the blocker''s listing' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select count(*) into n from public.listings where title like '%' || m;
    lines := lines || case when (n = 20) then 'PASS ' || 'table: an admin sees all 20 fixtures' else 'FAIL ' || 'table: an admin sees all 20 fixtures' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', seller, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    select count(*) into n from public.listings where id in (h1, c1, rm1, e1);
    lines := lines || case when (n = 4) then 'PASS ' || 'table: an owner sees their own hidden, closed, removed and ended rows' else 'FAIL ' || 'table: an owner sees their own hidden, closed, removed and ended rows' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    perform set_config('role', owner_role, true);

    -- ==== visitors browse once the market is open ====
    perform set_config('request.jwt.claims', '{"role":"anon"}', true); perform set_config('role', 'anon', true);
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, l1, a1x, b1]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'visitor: search returns the 14 visible listings, the same as for a stranger' else 'FAIL ' || 'visitor: search returns the 14 visible listings, the same as for a stranger' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (not (h1 = any (ids) or e1 = any (ids) or c1 = any (ids) or rm1 = any (ids) or d1 = any (ids) or u1 = any (ids))) then 'PASS ' || 'visitor: hidden, ended, closed, removed, deleted and under-review listings never appear' else 'FAIL ' || 'visitor: hidden, ended, closed, removed, deleted and under-review listings never appear' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from jsonb_array_elements(rs) as e(x), jsonb_object_keys(e.x) as k(k) where k.k <> all (array['id','kind','intent','category','city','to_city','starts_on','ends_on','title','body','price_amount','price_currency','seats','room_type','activity','have_currency','have_amount','want_currency','created_at','total']);
    lines := lines || case when n = 0 then 'PASS ' || 'visitor: a row holds only the public columns' else 'FAIL ' || 'visitor: a row holds only the public columns' || ' [' || n || ' unexpected keys]' end;
    lines := lines || case when (position(seller::text in rs::text) = 0 and position(seller2::text in rs::text) = 0 and position(seller3::text in rs::text) = 0 and position(lapsed::text in rs::text) = 0 and position(asker::text in rs::text) = 0) then 'PASS ' || 'visitor: no owner id appears anywhere in the result' else 'FAIL ' || 'visitor: no owner id appears anywhere in the result' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select coalesce(jsonb_agg(x order by ord), '[]'::jsonb) into rs from public.market_search(q => m, sort => 'price_up', kind => 'item', free_only => true) with ordinality as s(x, ord);
    select coalesce(array_agg((x ->> 'id')::uuid order by (x ->> 'id')::uuid), '{}'::uuid[]) into ids from jsonb_array_elements(rs) as e(x);
    select array_agg(u order by u) into want_ids from unnest(array[s2, a1x]) as u;
    lines := lines || case when (ids = want_ids) then 'PASS ' || 'visitor: filters and sorts work the same' else 'FAIL ' || 'visitor: filters and sorts work the same' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select public.market_listing(s1) into j;
    lines := lines || case when (j ->> 'id' = s1::text and j ->> 'mine' = 'false' and j ->> 'member_since' ~ '^[0-9]{4}-[0-9]{2}$') then 'PASS ' || 'visitor: one listing opens, mine=false' else 'FAIL ' || 'visitor: one listing opens, mine=false' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    lines := lines || case when (position(seller::text in j::text) = 0) then 'PASS ' || 'visitor: the listing row carries no owner id' else 'FAIL ' || 'visitor: the listing row carries no owner id' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from (select public.market_listing(x) as r from unnest(array[h1, e1, c1, rm1, d1, u1]) as x) q where q.r is not null;
    lines := lines || case when (n = 0) then 'PASS ' || 'visitor: hidden, ended, closed, removed, deleted and under-review listings open as null' else 'FAIL ' || 'visitor: hidden, ended, closed, removed, deleted and under-review listings open as null' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    begin
      execute 'insert into public.listings (kind, intent, category, city, starts_on, ends_on, title) values (''item'', ''give'', ''toys'', ''th-bangkok'', private.today(), private.today() + 1, ''Anon toy'')';
      lines := lines || ('FAIL ' || 'visitor: still cannot post once the market is open' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'visitor: still cannot post once the market is open');
      when others then lines := lines || ('FAIL ' || 'visitor: still cannot post once the market is open' || ' [' || sqlerrm || ']');
    end;
    begin
      execute 'select 1 from public.listings limit 1';
      lines := lines || ('FAIL ' || 'visitor: still holds no table once the market is open' || ' (allowed)');
    exception
      when insufficient_privilege then lines := lines || ('PASS ' || 'visitor: still holds no table once the market is open');
      when others then lines := lines || ('FAIL ' || 'visitor: still holds no table once the market is open' || ' [' || sqlerrm || ']');
    end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    begin
      execute 'select * from public.market_search()';
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'open: a signed-in non-tester may search once the market is open' else 'FAIL ' || 'open: a signed-in non-tester may search once the market is open' || ' [' || sqlerrm || ']' end;
    end;
    begin
      execute ins || $v$('item','give','toys','th-bangkok',null,private.today(),private.today()+5,'Stranger toy','',0,null,null,null,null)$v$;
      raise exception using message = 'ok_rollback';
    exception when others then
      lines := lines || case when sqlerrm = 'ok_rollback' then 'PASS ' || 'open: once the market is open any active account may post an item' else 'FAIL ' || 'open: once the market is open any active account may post an item' || ' [' || sqlerrm || ']' end;
    end;
    perform set_config('role', owner_role, true);

    -- ==== account deletion keeps the report snapshot and removes the listings ====
    perform set_config('request.jwt.claims', json_build_object('sub', rp1, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    insert into public.reports (listing_id, reason) values (l_del, 'scam');
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', deleter, 'role', 'authenticated')::text, true); perform set_config('role', 'authenticated', true);
    perform public.market_delete_account();
    perform set_config('role', owner_role, true);
    select count(*) into n from public.listings where id = l_del;
    lines := lines || case when (n = 0) then 'PASS ' || 'delete: the account''s listings are removed with it' else 'FAIL ' || 'delete: the account''s listings are removed with it' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.reports r
    where r.reporter = rp1 and r.listing_id is null and r.target_user is null and r.snapshot ->> 'title' = 'Deleter item';
    lines := lines || case when (n = 1) then 'PASS ' || 'delete: the report stays, with its snapshot, and loses only its links' else 'FAIL ' || 'delete: the report stays, with its snapshot, and loses only its links' || coalesce(' [' || dbg || ']', '') end; dbg := null;
    select count(*) into n from public.profiles where id = deleter;
    lines := lines || case when (n = 0) then 'PASS ' || 'delete: the profile is gone' else 'FAIL ' || 'delete: the profile is gone' || coalesce(' [' || dbg || ']', '') end; dbg := null;

    raise exception 'rls_002_rollback';
  exception
    when raise_exception then
      if sqlerrm <> 'rls_002_rollback' then lines := lines || ('FAIL test aborted: ' || sqlerrm); end if;
    when others then
      lines := lines || ('FAIL test aborted: ' || sqlstate || ' ' || sqlerrm);
  end;

  select count(*) into failed from unnest(lines) l where l not like 'PASS %';
  lines := lines || format('%s summary: %s checks, %s failed, nothing kept',
                           case when failed = 0 then 'PASS' else 'FAIL' end, array_length(lines, 1), failed);
  return query select l from unnest(lines) with ordinality as u(l, ord) order by ord;
end;
$test$;

select * from pg_temp.rls_002() as line;
