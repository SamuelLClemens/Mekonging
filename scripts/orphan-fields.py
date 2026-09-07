#!/usr/bin/env python3
"""Data fields that no renderer reads — content written but never shown.

    python3 scripts/orphan-fields.py                 # the report
    python3 scripts/orphan-fields.py --file nature   # one data module
    python3 scripts/orphan-fields.py --min 5         # only fields on 5+ records
    python3 scripts/orphan-fields.py --verbose       # list every field, read or not

WHY THIS EXISTS. The recurring defect in this app is not a crash — it is content that was
written, committed, and never reached a screen. Every one of these was found by accident:

  * `dangerNote` was populated on 215 species and rendered for 200 of them; 15 records had
    the field silently swallowed by a grouping bug.
  * The etiquette rules existed as prose inside country guides long before any screen showed
    them, so nobody could find out that pointing your feet is an insult in Thailand.
  * A trip plan's `nights` was collected by the editor and discarded on add, so a fortnight
    in Pai saved as one day.

None of those is visible to a test, a linter, or any of the twelve check-*.py guards: the app
renders perfectly, just without the field. The only way to see it is to compare what the data
declares against what the code reads, which is what this does. It is the cheapest audit in the
repo and it is the one that finds missing FEATURES rather than broken ones.

HOW IT READS. Every key on every record in js/data/*.js, against every `.key`, `['key']`,
`{ key }` and `'key'` occurrence anywhere in js/ outside js/data/. A key that appears nowhere
is reported.

WHAT IT IS NOT. It is not a guard and it does not assert. A key can be read in a way this
cannot see — built at runtime (`rec[fieldName]`), spread into a template, or handed to
something generic like an exporter — so a name on this list is a QUESTION, not a defect. The
answer is either "wire it up", "delete it", or "read dynamically, here". Verify before acting:
grep the name, then look at the screen. A key reported here that turns out to be read
dynamically belongs in DYNAMIC below, with the reason.
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# Keys read through a computed access this scan cannot follow. Each needs the reason, because
# suppressing one wrongly re-hides exactly the content this script exists to surface.
DYNAMIC = {
    # Country/language codes used as lookup keys: PHRASEBOOKS[cc], names[lang], STRINGS[key].
    'th', 'vi', 'km', 'lo', 'en',
    # Month-array shorthand read by scripts/check-month-arrays.py and by index, not by name.
    'bestM', 'avoidM',
}

# Structural keys that are the data's own scaffolding rather than content: an id is how a record
# is addressed, not something rendered.
STRUCTURAL = {'id', 'slug', 'key', 'cc', 'code', 'type', 'group', 'category'}

KEY = re.compile(r'^\s*["\']?([A-Za-z_$][\w$]*)["\']?\s*:', re.M)


def data_files(only=None):
    out = []
    for f in sorted(glob.glob('js/data/*.js')):
        base = os.path.basename(f)[:-3]
        if only and only not in base:
            continue
        # The interface dictionaries are 168 English strings as KEYS; every one would read as an
        # unread field, and scripts/check-ui-strings.py already governs them.
        if base.startswith('ui-strings'):
            continue
        out.append(f)
    return out


def strip_comments(src):
    """Line comments FIRST — a path like js/screens/*.js in prose opens a phantom block
    comment and would swallow the rest of the file."""
    src = re.sub(r'(?m)^[ \t]*//.*$', '', src)
    src = re.sub(r'//[^\n"\']*$', '', src, flags=re.M)
    return re.sub(r'/\*.*?\*/', '', src, flags=re.S)


def reader_source():
    """Everything that could render a field: js/ outside js/data/."""
    files = [f for f in glob.glob('js/**/*.js', recursive=True) if not f.startswith('js/data/')]
    return '\n'.join(strip_comments(open(f, encoding='utf-8').read()) for f in files)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--file', help='only this data module (substring of the filename)')
    ap.add_argument('--min', type=int, default=1, help='only fields present on N+ records')
    ap.add_argument('--verbose', action='store_true')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()

    files = data_files(a.file)
    if not files:
        print('No data files matched %r.' % a.file, file=sys.stderr)
        return 1

    readers = reader_source()
    # One pass over the reader corpus per key would be O(keys x MB). Collect the identifiers the
    # code touches once instead, then test membership.
    read_idents = set(re.findall(r'\.([A-Za-z_$][\w$]*)', readers))
    read_idents |= set(re.findall(r'''\[\s*['"]([^'"]+)['"]\s*\]''', readers))
    read_idents |= set(re.findall(r'''['"]([A-Za-z_$][\w$]*)['"]''', readers))
    # Destructuring: `const { blurb, where } = rec`.
    for m in re.finditer(r'\{([^{}]*)\}\s*=', readers):
        read_idents |= {w for w in re.findall(r'[A-Za-z_$][\w$]*', m.group(1))}

    rows, orphan_total, field_total = [], 0, 0
    for f in files:
        src = strip_comments(open(f, encoding='utf-8').read())
        counts = {}
        for m in KEY.finditer(src):
            k = m.group(1)
            counts[k] = counts.get(k, 0) + 1
        orphans = []
        for k, n in sorted(counts.items(), key=lambda kv: -kv[1]):
            if n < a.min or k in DYNAMIC or k in STRUCTURAL:
                continue
            field_total += 1
            if k not in read_idents:
                orphans.append((k, n))
        if orphans or a.verbose:
            rows.append((os.path.basename(f), counts, orphans))
        orphan_total += len(orphans)

    if a.json:
        print(json.dumps([{'file': f, 'orphans': [{'field': k, 'records': n} for k, n in o]}
                          for f, _, o in rows if o], indent=1))
        return 0

    print('Fields declared in js/data/ that no file outside js/data/ reads.\n')
    if not orphan_total:
        print('None — every data field on %d+ records is read somewhere.' % a.min)
    for base, counts, orphans in rows:
        if not orphans and not a.verbose:
            continue
        print('%s' % base)
        for k, n in orphans:
            print('    %-24s on %4d record(s)   NO READER' % (k, n))
        if a.verbose:
            for k, n in sorted(counts.items(), key=lambda kv: -kv[1]):
                if (k, n) not in orphans:
                    print('    %-24s on %4d record(s)   read' % (k, n))
        print()

    print('%d field name(s) with no reader, out of %d checked across %d data modules.'
          % (orphan_total, field_total, len(files)))
    print('\nEach one is a question, not a defect: wire it up, delete it, or record it in')
    print("DYNAMIC at the top of this script if it is read through a computed key.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
