#!/usr/bin/env python3
"""Generate (or verify) the field guide's per-tier byte sizes in js/offline-pack.js.

    python3 scripts/build-pack-sizes.py            # verify; exit 1 if stale
    python3 scripts/build-pack-sizes.py --write    # regenerate the block

WHY THIS EXISTS. The app states the size of a download before it starts ("88 MB more — on
Wi-Fi?", audit F-03), and the photos are not fetched until then, so the size has to ship with the
code. A hand-kept number drifts the first time a photo is added. These are summed from the files,
and scripts/check-cache-version.py runs this in verify mode.

The tier rules mirror packManifest() in js/offline-pack.js: a photo of a species marked
dangerous (or in the danger group) is SAFETY; other nature, food and produce photos plus every
call are GUIDE; place photos are PLACES. Change both together.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, 'js', 'offline-pack.js')
BEGIN = '// ---- BEGIN GENERATED PACK SIZES — scripts/build-pack-sizes.py ----'
END = '// ---- END GENERATED PACK SIZES ----'


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as fh:
        return fh.read()


def tier_bytes():
    nature = read('js/data/nature.js')
    ids = list(re.finditer(r'"id":\s*"([^"]+)"', nature))
    danger = set()
    for i, m in enumerate(ids):
        end = ids[i + 1].start() if i + 1 < len(ids) else len(nature)
        if re.search(r'"dangerous":\s*true|"group":\s*"danger"', nature[m.start():end]):
            danger.add(m.group(1))
    sizes = {'safety': 0, 'guide': 0, 'places': 0}
    missing = []

    def add(tier, src):
        path = os.path.join(ROOT, src)
        if os.path.isfile(path):
            sizes[tier] += os.path.getsize(path)
        else:
            missing.append(src)

    for pid, src in re.findall(r'"([^"]+)":\s*\{\s*src:\s*"([^"]+)"', read('js/data/photos.js')):
        if pid in danger:
            add('safety', src)
        elif src.startswith(('img/nature/', 'img/food/', 'img/produce/')):
            add('guide', src)
        elif src.startswith('img/places/'):
            add('places', src)
    for src in re.findall(r'src:\s*"([^"]+)"', read('js/data/sounds.js')):
        add('guide', src)
    return sizes, missing


def main():
    sizes, missing = tier_bytes()
    if missing:
        print(f'FAIL — {len(missing)} registered file(s) do not exist, e.g. {missing[0]}')
        return 1
    block = '\n'.join([BEGIN, 'export const PACK_BYTES = { safety: %d, guide: %d, places: %d };'
                       % (sizes['safety'], sizes['guide'], sizes['places']), END])
    src = read('js/offline-pack.js')
    pattern = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
    found = pattern.search(src)
    if not found:
        print(f'FAIL — no generated block in js/offline-pack.js. Expected a line reading:\n  {BEGIN}')
        return 1
    mb = ', '.join(f'{t} {b / 1048576:.1f} MB' for t, b in sizes.items())
    if found.group(0) == block:
        print(f'PASS — pack sizes match the files ({mb})')
        return 0
    if '--write' in sys.argv:
        with open(PACK, 'w', encoding='utf-8') as fh:
            fh.write(pattern.sub(lambda _: block, src, count=1))
        print(f'pack sizes rewritten ({mb})')
        return 0
    print(f'FAIL — js/offline-pack.js PACK_BYTES is stale ({mb} on disk).\n'
          'The app would state the wrong download size. Run: python3 scripts/build-pack-sizes.py --write')
    return 1


if __name__ == '__main__':
    sys.exit(main())
