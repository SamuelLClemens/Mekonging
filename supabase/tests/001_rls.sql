-- RLS test for migration 001 (docs/EXCHANGE.md section 4, "Proof"; the M3b done-when).
--
-- Pure ASCII on purpose: non-ASCII sample text is written as U&'...' escapes, so the file
-- survives any clipboard (migration 001 did not; see 001b_fix_text_encoding.sql).
--
-- Paste the whole file into the Supabase SQL editor and press Run. It prints one PASS or FAIL
-- line per check, and a summary line last.
--
-- It leaves nothing behind. Every fixture (four test users, their profiles, a tester row, a
-- changed setting) is made inside one block that ends by raising an exception, which rolls the
-- whole block back. The result lines survive because they are kept in a variable, not a table.
--
-- Roles are switched the way PostgREST switches them for a real request: set_config('role')
-- and set_config('request.jwt.claims'), both local to the transaction. So `anon` below is a
-- visitor with no session, and `authenticated` with a `sub` is that signed-in user.

create or replace function pg_temp.rls_001()
returns setof text
language plpgsql
as $test$
declare
  lines           text[] := '{}';
  expected_cities int := 174;   -- written by scripts/build-market-cities.py
  owner_role      text := current_user;
  poster          uuid := gen_random_uuid();
  asker           uuid := gen_random_uuid();
  stranger        uuid := gen_random_uuid();
  boss            uuid := gen_random_uuid();
  terms           text;
  n               int;
  j               jsonb;
  t               text;
  names           text[];
  labels          text[];
  failed          int;
begin
  begin
    select s.value #>> '{}' into terms from private.settings s where s.key = 'terms_version';

    -- ==== catalogue: the ground rules of section 4, read from the system tables ====
    -- Event-trigger functions are left out: they cannot be called through the API, and Supabase
    -- owns one in public (rls_auto_enable, its automatic-RLS option chosen at project creation).
    select count(*) into n
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname in ('public', 'private') and c.relkind in ('r', 'p') and not c.relrowsecurity;
    lines := lines || case when n = 0 then 'PASS catalogue: RLS is on for every table in public and private'
                           else format('FAIL catalogue: %s tables without RLS', n) end;

    select count(*) into n
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname in ('public', 'private') and c.relkind in ('r', 'p', 'v', 'm')
      and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate, references, trigger')
           or has_any_column_privilege('anon', c.oid, 'select, insert, update, references'));
    lines := lines || case when n = 0 then 'PASS catalogue: anon holds no grant on any table or column'
                           else format('FAIL catalogue: anon holds grants on %s tables', n) end;

    select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and (has_function_privilege('anon', p.oid, 'execute')
           or p.proacl is null
           or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'));
    lines := lines || case when n = 0 then 'PASS catalogue: no function is executable by anon or PUBLIC'
                           else format('FAIL catalogue: %s functions executable by anon or PUBLIC', n) end;

    select string_agg(s.nspname || '.' || p.proname, ', ' order by s.nspname, p.proname) into t
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and has_function_privilege('authenticated', p.oid, 'execute');
    lines := lines || case when t = 'private.is_admin, private.is_member, public.market_delete_account, public.market_join, public.market_me'
                           then 'PASS catalogue: authenticated executes exactly the five granted functions'
                           else 'FAIL catalogue: authenticated executes ' || coalesce(t, 'nothing') end;

    select count(*) into n
    from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and p.prorettype <> 'event_trigger'::regtype
      and not coalesce(p.proconfig @> array['search_path=""'], false);
    lines := lines || case when n = 0 then 'PASS catalogue: every function pins search_path to empty'
                           else format('FAIL catalogue: %s functions without search_path=""', n) end;

    select count(*) into n from private.settings s
    where (s.key = 'market_open' and s.value = 'false'::jsonb) or (s.key = 'cash_open' and s.value = 'false'::jsonb);
    lines := lines || case when n = 2 then 'PASS settings: market_open and cash_open are false'
                           else 'FAIL settings: market_open or cash_open is not false' end;

    select count(*) into n from public.cities;
    lines := lines || case when n = expected_cities then format('PASS cities: %s seeded, as generated', n)
                           else format('FAIL cities: %s seeded, %s generated', n, expected_cities) end;

    -- ==== fixtures: four users, as the owner ====
    insert into auth.users (id, aud, role, email, created_at, updated_at) values
      (poster,   'authenticated', 'authenticated', 'rls-poster-'   || poster   || '@example.invalid', now(), now()),
      (asker,    'authenticated', 'authenticated', 'rls-asker-'    || asker    || '@example.invalid', now(), now()),
      (stranger, 'authenticated', 'authenticated', 'rls-stranger-' || stranger || '@example.invalid', now(), now()),
      (boss,     'authenticated', 'authenticated', 'rls-boss-'     || boss     || '@example.invalid', now(), now());
    insert into private.admins (user_id) values (boss);

    -- ==== anon: a visitor with no session reads and calls nothing ====
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('role', 'anon', true);
    begin
      perform 1 from public.profiles limit 1;
      lines := lines || 'FAIL anon: reads profiles'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: profiles denied'::text;
    end;
    begin
      perform 1 from public.cities limit 1;
      lines := lines || 'FAIL anon: reads cities'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: cities denied'::text;
    end;
    begin
      perform 1 from private.settings limit 1;
      lines := lines || 'FAIL anon: reads private.settings'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: private.settings denied'::text;
    end;
    begin
      perform public.market_me();
      lines := lines || 'FAIL anon: calls market_me'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: market_me denied'::text;
    end;
    begin
      perform public.market_join('Visitor', null, terms, true);
      lines := lines || 'FAIL anon: calls market_join'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: market_join denied'::text;
    end;
    begin
      perform public.market_delete_account();
      lines := lines || 'FAIL anon: calls market_delete_account'::text;
    exception when insufficient_privilege then lines := lines || 'PASS anon: market_delete_account denied'::text;
    end;
    perform set_config('role', owner_role, true);

    -- ==== market_join, as the stranger (signed in, no profile yet) ====
    perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->'profile' = 'null'::jsonb and j->>'member' = 'false'
                           then 'PASS join: before joining, market_me shows no profile and no membership'
                           else 'FAIL join: before joining, market_me returned ' || j::text end;
    begin
      perform public.market_join('Sam', null, terms, false);
      lines := lines || 'FAIL join: adult=false accepted'::text;
    exception when others then
      lines := lines || case when sqlerrm = 'adult_required' then 'PASS join: adult=false rejected'
                             else 'FAIL join: adult=false gave ' || sqlerrm end;
    end;
    begin
      perform public.market_join('Sam', null, terms, null);
      lines := lines || 'FAIL join: adult=null accepted'::text;
    exception when others then
      lines := lines || case when sqlerrm = 'adult_required' then 'PASS join: adult=null rejected'
                             else 'FAIL join: adult=null gave ' || sqlerrm end;
    end;
    begin
      perform public.market_join('Sam', null, 'some-old-version', true);
      lines := lines || 'FAIL join: an unknown terms version accepted'::text;
    exception when others then
      lines := lines || case when sqlerrm = 'terms_outdated' then 'PASS join: an unknown terms version rejected'
                             else 'FAIL join: an unknown terms version gave ' || sqlerrm end;
    end;
    names  := array['   ', repeat('x', 41)];
    labels := array['a blank name', 'a 41-character name'];
    for i in 1 .. array_length(names, 1) loop
      begin
        perform public.market_join(names[i], null, terms, true);
        lines := lines || ('FAIL join: ' || labels[i] || ' accepted');
      exception when others then
        lines := lines || case when sqlerrm = 'name_length' then 'PASS join: ' || labels[i] || ' rejected'
                               else 'FAIL join: ' || labels[i] || ' gave ' || sqlerrm end;
      end;
    end loop;
    begin
      perform public.market_join('Sam', 'hi', terms, true);
      lines := lines || 'FAIL join: a text avatar accepted'::text;
    exception when others then
      lines := lines || case when sqlerrm = 'avatar_invalid' then 'PASS join: a text avatar rejected'
                             else 'FAIL join: a text avatar gave ' || sqlerrm end;
    end;
    -- Filtered names: a display-name term, case and look-alikes, a zero-width space, a stretched
    -- word, Vietnamese with and without capitals, Thai inside a longer word, and a block term
    -- inside a longer English name.
    names  := array['admin', 'ADM1N', 'ad' || chr(8203) || 'min', 'Weeeed Guy', U&'C\1EA7n Sa', U&'C\1EA6N SA',
                    U&'\0E23\0E49\0E32\0E19\0E01\0E31\0E0D\0E0A\0E32\0E14\0E35', 'Official Mekonging', 'Happy Ending Tours'];
    labels := array['admin', 'ADM1N (case, look-alike)', 'ad+zero-width+min', 'Weeeed Guy (stretched)',
                    'can sa (Vietnamese, with diacritics)', 'CAN SA (Vietnamese capitals, with diacritics)', 'Thai term inside a word',
                    'Official Mekonging', 'Happy Ending Tours'];
    for i in 1 .. array_length(names, 1) loop
      begin
        perform public.market_join(names[i], null, terms, true);
        lines := lines || ('FAIL join: name "' || labels[i] || '" accepted');
      exception when others then
        lines := lines || case when sqlerrm = 'name_rejected' then 'PASS join: name "' || labels[i] || '" rejected'
                               else 'FAIL join: name "' || labels[i] || '" gave ' || sqlerrm end;
      end;
    end loop;
    -- Whole words only: "Gunnar" holds "gun" and "Iceland" holds "ice", and neither is a word here.
    j := public.market_join('  Gunnar from Iceland ', U&'\+01F9ED', terms, true);
    lines := lines || case when j->'profile'->>'display_name' = 'Gunnar from Iceland' and j->'profile'->>'terms_version' = terms
                           then 'PASS join: an ordinary name joins, trimmed, with the terms version recorded'
                           else 'FAIL join: an ordinary name returned ' || j::text end;
    j := public.market_join('Somebody Else', null, terms, true);
    lines := lines || case when j->'profile'->>'display_name' = 'Gunnar from Iceland'
                           then 'PASS join: a second call changes nothing'
                           else 'FAIL join: a second call changed the profile to ' || j::text end;
    begin
      insert into public.profiles (id, display_name, adult_confirmed_at, terms_version) values (stranger, 'Direct', now(), terms);
      lines := lines || 'FAIL join: a direct INSERT into profiles succeeded'::text;
    exception when insufficient_privilege then lines := lines || 'PASS join: a direct INSERT into profiles is denied'::text;
    end;
    perform set_config('role', owner_role, true);
    select count(*) into n from public.profiles p where p.id = stranger and p.adult_confirmed_at is not null and p.status = 'active';
    lines := lines || case when n = 1 then 'PASS join: the profile records the 18+ confirmation, status active'
                           else 'FAIL join: no complete profile row for the stranger' end;

    -- The other three join as themselves. "Ice" is a flag term: a flag does not block a name.
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.market_join('Poster', U&'\+01F392', terms, true);
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
    j := public.market_join('Ice', null, terms, true);
    lines := lines || case when j->'profile'->>'display_name' = 'Ice' then 'PASS join: a flag term ("Ice") does not block a name'
                           else 'FAIL join: "Ice" returned ' || j::text end;
    perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
    perform public.market_join('Boss', null, terms, true);
    perform set_config('role', owner_role, true);

    -- ==== cross-user reads and updates, as the poster ====
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.profiles;
    lines := lines || case when n = 1 then 'PASS read: a user sees exactly one profile, their own'
                           else format('FAIL read: a user sees %s profiles', n) end;
    select count(*) into n from public.profiles p where p.id = asker;
    lines := lines || case when n = 0 then 'PASS read: another user''s profile is invisible'
                           else 'FAIL read: another user''s profile is visible' end;
    update public.profiles set display_name = 'Hijacked' where id = asker;
    get diagnostics n = row_count;
    lines := lines || case when n = 0 then 'PASS update: another user''s profile changes 0 rows'
                           else format('FAIL update: another user''s profile changed %s rows', n) end;
    select count(*) into n from public.cities;
    lines := lines || case when n = expected_cities then 'PASS read: a signed-in user reads every city'
                           else format('FAIL read: a signed-in user reads %s cities', n) end;
    foreach t in array array['admins', 'testers', 'settings', 'filter_terms'] loop
      begin
        execute format('select 1 from private.%I limit 1', t);
        lines := lines || ('FAIL read: a user reads private.' || t);
      exception when insufficient_privilege then lines := lines || ('PASS read: private.' || t || ' denied to a user');
      end;
    end loop;
    begin
      perform private.setting_on('market_open');
      lines := lines || 'FAIL read: a user calls private.setting_on'::text;
    exception when insufficient_privilege then lines := lines || 'PASS read: private.setting_on denied to a user'::text;
    end;
    perform set_config('role', owner_role, true);
    select count(*) into n from public.profiles p where p.id = asker and p.display_name = 'Ice';
    lines := lines || case when n = 1 then 'PASS update: the other user''s name is unchanged underneath'
                           else 'FAIL update: the other user''s name was changed' end;

    perform set_config('request.jwt.claims', json_build_object('sub', boss, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    select count(*) into n from public.profiles p where p.id in (poster, asker, stranger, boss);
    lines := lines || case when n = 4 then 'PASS read: an admin sees every profile'
                           else format('FAIL read: an admin sees %s of 4 profiles', n) end;
    perform set_config('role', owner_role, true);

    -- ==== the column-restricted UPDATE, as the poster on their own row ====
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    update public.profiles set display_name = 'Poster Two', avatar = U&'\+01F6FA' where id = poster;
    get diagnostics n = row_count;
    lines := lines || case when n = 1 then 'PASS update: a user changes their own name and avatar'
                           else format('FAIL update: own name and avatar changed %s rows', n) end;
    foreach t in array array['status', 'suspended_until', 'terms_version', 'adult_confirmed_at', 'created_at', 'id'] loop
      begin
        execute format('update public.profiles set %I = %I where id = $1', t, t) using poster;
        lines := lines || ('FAIL update: a user changes their own ' || t);
      exception when insufficient_privilege then lines := lines || ('PASS update: own ' || t || ' denied');
      end;
    end loop;
    begin
      update public.profiles set display_name = 'Mekonging Support' where id = poster;
      lines := lines || 'FAIL update: a filtered name accepted on UPDATE'::text;
    exception when others then
      lines := lines || case when sqlerrm = 'name_rejected' then 'PASS update: a filtered name is rejected on UPDATE too'
                             else 'FAIL update: a filtered name gave ' || sqlerrm end;
    end;
    begin
      delete from public.profiles where id = poster;
      lines := lines || 'FAIL update: a user deletes their profile row directly'::text;
    exception when insufficient_privilege then lines := lines || 'PASS update: a direct DELETE on profiles is denied'::text;
    end;
    perform set_config('role', owner_role, true);

    -- ==== the tester gate while market_open is false ====
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'false' and j->>'open' = 'false'
                           then 'PASS gate: market closed, a non-tester is not a member'
                           else 'FAIL gate: market closed, non-tester got ' || j::text end;
    perform set_config('role', owner_role, true);
    insert into private.testers (user_id) values (asker);
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'true' then 'PASS gate: market closed, a tester is a member'
                           else 'FAIL gate: market closed, tester got ' || j::text end;
    perform set_config('role', owner_role, true);
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'false' then 'PASS gate: the tester row admits only that tester'
                           else 'FAIL gate: a non-tester got ' || j::text end;
    perform set_config('role', owner_role, true);
    update private.settings set value = 'true'::jsonb where key = 'market_open';
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'true' and j->>'open' = 'true' then 'PASS gate: market open, every active profile is a member'
                           else 'FAIL gate: market open, non-tester got ' || j::text end;
    perform set_config('role', owner_role, true);
    update private.settings set value = 'false'::jsonb where key = 'market_open';
    perform set_config('request.jwt.claims', json_build_object('sub', asker, 'role', 'authenticated')::text, true);
    update public.profiles set status = 'review' where id = asker;
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'false' then 'PASS gate: a tester under review is not a member'
                           else 'FAIL gate: a tester under review got ' || j::text end;
    perform set_config('role', owner_role, true);
    update public.profiles set status = 'suspended', suspended_until = now() + interval '1 day' where id = asker;
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'false' then 'PASS gate: a suspended tester is not a member'
                           else 'FAIL gate: a suspended tester got ' || j::text end;
    perform set_config('role', owner_role, true);
    update public.profiles set suspended_until = now() - interval '1 minute' where id = asker;
    perform set_config('role', 'authenticated', true);
    j := public.market_me();
    lines := lines || case when j->>'member' = 'true' then 'PASS gate: a lapsed suspension restores a tester'
                           else 'FAIL gate: a lapsed suspension got ' || j::text end;
    lines := lines || case when private.is_admin() then 'FAIL gate: a tester is an admin' else 'PASS gate: a tester is not an admin' end;
    perform set_config('role', owner_role, true);

    -- ==== the delete cascade, as the poster ====
    insert into private.testers (user_id) values (poster);
    insert into private.admins (user_id) values (poster);
    perform set_config('request.jwt.claims', json_build_object('sub', poster, 'role', 'authenticated')::text, true);
    perform set_config('role', 'authenticated', true);
    perform public.market_delete_account();
    perform set_config('role', owner_role, true);
    select count(*) into n from auth.users u where u.id = poster;
    lines := lines || case when n = 0 then 'PASS delete: the auth user is gone' else 'FAIL delete: the auth user remains' end;
    select (select count(*) from public.profiles p where p.id = poster)
         + (select count(*) from private.testers x where x.user_id = poster)
         + (select count(*) from private.admins a where a.user_id = poster) into n;
    lines := lines || case when n = 0 then 'PASS delete: the profile, tester and admin rows cascaded'
                           else format('FAIL delete: %s rows remain', n) end;
    select (select count(*) from auth.users u where u.id = asker) + (select count(*) from public.profiles p where p.id = asker) into n;
    lines := lines || case when n = 2 then 'PASS delete: only the caller''s account is deleted'
                           else 'FAIL delete: another account was touched' end;

    raise exception 'rls_001_rollback';
  exception
    when raise_exception then
      if sqlerrm <> 'rls_001_rollback' then lines := lines || ('FAIL test aborted: ' || sqlerrm); end if;
    when others then
      lines := lines || ('FAIL test aborted: ' || sqlstate || ' ' || sqlerrm);
  end;

  select count(*) into failed from unnest(lines) l where l not like 'PASS %';
  lines := lines || format('%s summary: %s checks, %s failed, nothing kept',
                           case when failed = 0 then 'PASS' else 'FAIL' end, array_length(lines, 1), failed);
  return query select l from unnest(lines) with ordinality as u(l, i) order by i;
end;
$test$;

select * from pg_temp.rls_001() as line;
