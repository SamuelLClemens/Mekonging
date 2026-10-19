-- Migration 001b: repair the text that reached the database garbled (M3b, 2026-10-19).
--
-- What happened: migration 001 reached the SQL editor through a clipboard that read UTF-8 as
-- Mac Roman, so every character outside plain ASCII arrived garbled. ASCII text arrived intact,
-- which covers the tables, the policies, the grants, the settings and the 174 city rows. Two
-- things held non-ASCII text and are repaired here:
--   1. private.normalise(): its look-alike map started with the two Vietnamese letters for "d",
--      so after the garbling every later entry was shifted ("1" mapped to "a", not "i").
--   2. private.filter_terms: the 22 Thai, Vietnamese, Khmer and Lao terms.
--
-- This file is pure ASCII on purpose. Non-ASCII text is written as U&'...' escapes and chr(),
-- so it survives any clipboard. It is safe to run more than once, and harmless after a clean 001.

begin;

-- 1. The look-alike map, with the two letters written as chr(273) and chr(272).
create or replace function private.normalise(t text)
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
             chr(273) || chr(272) || '01345@$', 'ddoieasas'),
           '(.)\1{2,}', '\1\1', 'g');
$$;

-- 2. The non-ASCII terms: drop whatever arrived garbled, then insert them as escapes.
delete from private.filter_terms where term ~ '[^ -~]';

insert into private.filter_terms (term, level, category, lang) values
  (U&'\0E01\0E31\0E0D\0E0A\0E32', 'block', 'drugs', 'th'),
  (U&'\0E22\0E32\0E1A\0E49\0E32', 'block', 'drugs', 'th'),
  (U&'\0E22\0E32\0E44\0E2D\0E0B\0E4C', 'block', 'drugs', 'th'),
  (U&'\0E22\0E32\0E2D\0E35', 'block', 'drugs', 'th'),
  (U&'\0E40\0E04\0E15\0E32\0E21\0E35\0E19', 'block', 'drugs', 'th'),
  (U&'\0E42\0E04\0E40\0E04\0E19', 'block', 'drugs', 'th'),
  (U&'\0E40\0E2E\0E42\0E23\0E2D\0E35\0E19', 'block', 'drugs', 'th'),
  (U&'\0E1D\0E34\0E48\0E19', 'block', 'drugs', 'th'),
  (U&'\0E40\0E2B\0E47\0E14\0E02\0E35\0E49\0E04\0E27\0E32\0E22', 'block', 'drugs', 'th'),
  (U&'\0E43\0E1A\0E01\0E23\0E30\0E17\0E48\0E2D\0E21', 'block', 'drugs', 'th'),
  (U&'c\1EA7n sa', 'block', 'drugs', 'vi'),
  (U&'b\1ED3 \0111\00E0', 'block', 'drugs', 'vi'),
  (U&'thu\1ED1c l\1EAFc', 'block', 'drugs', 'vi'),
  (U&'ma t\00FAy', 'block', 'drugs', 'vi'),
  (U&'n\1EA5m th\1EA7n', 'block', 'drugs', 'vi'),
  (U&'\1780\1789\17D2\1786\17B6', 'block', 'drugs', 'km'),
  (U&'\1799\17C9\17B6\1798\17C9\17B6', 'block', 'drugs', 'km'),
  (U&'\1798\17C9\17B6\1791\17B9\1780\1780\1780', 'block', 'drugs', 'km'),
  (U&'\0E81\0EB1\0E99\0E8A\0EB2', 'block', 'drugs', 'lo'),
  (U&'\0EA2\0EB2\0E9A\0EC9\0EB2', 'block', 'drugs', 'lo'),
  (U&'\0E44\0E2D\0E0B\0E4C', 'flag', 'drugs', 'th'),
  (U&'\0E01\0E23\0E30\0E17\0E48\0E2D\0E21', 'flag', 'drugs', 'th')
on conflict (term, category) do nothing;

commit;
