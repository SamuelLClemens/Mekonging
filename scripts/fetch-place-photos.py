#!/usr/bin/env python3
"""Fill place photos from each place's own Wikipedia article (plan slice D3).

The sibling of scripts/fetch-identify-photos.py, which covers the identify guide. Places need
their own tool because the hard part is different: a species has one unambiguous article title
(its binomial), and a place does not. "Wat Mahathat" is a temple in Ayutthaya, another in
Sukhothai and a third in Bangkok, and a keyword image search for any of them returns whichever
is most photographed. So the article for each place is chosen by a person, from candidates this
script suggests, and recorded in scripts/place-photo-articles.json. Only those reviewed
articles are ever fetched.

THE FOUR STEPS, one run each:

    python3 scripts/fetch-place-photos.py --country th --report
        Coverage only, no network: how many places have a photo, and which do not.

    python3 scripts/fetch-place-photos.py --country th --suggest OUT.json
        For every photo-less place: the Wikipedia articles its own sources cite, plus the top
        search hits for its name, each with the distance from the place's coordinates to the
        article's. A temple 0.3 km away is the same temple; one 400 km away is its namesake.
        Review OUT.json by hand and copy the right titles into place-photo-articles.json.

    python3 scripts/fetch-place-photos.py --country th --fetch STAGE_DIR
        Downloads the lead image of every reviewed article whose place still has no photo,
        openly licensed only, resized to about 800 px and about 60 KB, into STAGE_DIR with a
        stage.json of credits. Nothing in the repo changes yet.

    python3 scripts/fetch-place-photos.py --sheet STAGE_DIR
        Contact sheets (3 x 3, labelled) of everything staged, so a person LOOKS AT EVERY IMAGE.
        A wrong one goes into "rejected" in place-photo-articles.json with the reason, which
        also stops a later run fetching it again.

    python3 scripts/fetch-place-photos.py --install STAGE_DIR
        Copies the staged images that were not rejected into img/places/ and appends their
        entries to js/data/photos.js. Then run scripts/build-pack-sizes.py --write.

LICENSING. Public domain, CC0, CC BY, CC BY-SA and GFDL only, checked on the Commons file
itself. The credit is the file's own attribution text (or its author field), HTML stripped but
otherwise verbatim and never truncated, then the licence short name, then "via Wikimedia
Commons" — the format photos.js already uses.
"""
import argparse
import html
import io
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS_JS = os.path.join(ROOT, 'js', 'data', 'photos.js')
ARTICLES = os.path.join(ROOT, 'scripts', 'place-photo-articles.json')
IMG_DIR = os.path.join(ROOT, 'img', 'places')
PLACE_FILES = {cc: ['js/data/places.%s.js' % cc, 'js/data/places.%s.ext.js' % cc]
               for cc in ('th', 'vi', 'kh', 'la')}

# docs/PLAN.md D3: the first 140 place photos average 180 KB, which would put the 743 missing
# ones at about 133 MB on a traveller's phone. About 800 px wide and about 60 KB each keeps the
# whole set near 45 MB. A card is ~343 CSS px wide at 375 px, so 800 px is sharp at 2x.
#
# Portraits are bounded by height as well: the card renders at the image's own aspect ratio
# (.id-photo img is height:auto), so an 800 x 1200 chedi would fill two phone screens.
MAX_W, MAX_H = 800, 900
TARGET_BYTES = 60 * 1024
# Wikimedia serves a fixed ladder of thumbnail widths and may refuse others, so fetch the
# nearest step above MAX_W and scale down locally.
FETCH_W = 960

UA = 'Mekonging/1.0 (+https://github.com/SamuelLClemens/Mekonging; offline travel guide, place-photo fetch)'
THROTTLE = 1.1

# Matched against the WHOLE licence name. fetch-identify-photos.py's pattern is anchored only at
# the start, so "CC BY-NC 2.0" would pass there as "CC BY"; Commons does not host NC or ND files,
# but a place photo can come from en.wikipedia too, so this one is strict.
OK_LICENCE = re.compile(
    r'(cc0( 1\.0)?|public domain|pd(-\w+)?|gfdl( [\d.]+)?'
    r'|cc by(-sa)? \d\.\d( [a-z]{2,3}(-[a-z]+)?)?'
    r'|cc by(-sa)? [\d.]+(,\s*[\d.]+)*'
    r'|cc-by(-sa)?-\d\.\d)', re.I)
PHOTO_EXT = re.compile(r'\.(jpe?g|png|tiff?|webp)$', re.I)

# AN AUTHOR FIELD THAT IS A NOTE, NOT A NAME. Commons shows some photographers' usage notes in
# the Artist field, and printed verbatim that is a 600-character caption under a card. Where the
# note itself says how to credit, the credit is the name as the note writes it. The first fetcher
# cut these at 60 characters instead, which left "This Photo was taken by Supanut Arunoprayote.
# Feel free to u" under the Chiang Dao Cave photo. Any other author field over CREDIT_MAX is
# reported by --fetch for a person to read, not shortened.
CREDIT_NOTES = [
    # "...please mention me as the author..."
    (re.compile(r'^This Photo was taken by (Supanut Arunoprayote)\. Feel free to use any of my images', re.S), r'\1'),
]
CREDIT_MAX = 100


def credit_name(who):
    for pat, name in CREDIT_NOTES:
        m = pat.match(who)
        if m:
            return m.expand(name)
    return who


# ---- transport ----------------------------------------------------------------------------

def get(url, binary=False, tries=3):
    """curl, because Python's TLS stack fails against these hosts here and curl does not."""
    last = ''
    for n in range(tries):
        time.sleep(THROTTLE)
        out = subprocess.run(['curl', '-sS', '-L', '--max-time', '60', '-H', 'User-Agent: ' + UA, url],
                             capture_output=True)
        if out.returncode == 0:
            if binary:
                return out.stdout
            try:
                return json.loads(out.stdout.decode('utf-8'))
            except ValueError:
                last = 'non-JSON response (%s)' % out.stdout[:60]
        else:
            last = out.stderr.decode('utf-8', 'replace').strip()[:120]
        time.sleep(3.0 * (n + 1))
    raise RuntimeError(last or 'request failed')


def wp(params):
    base = {'action': 'query', 'format': 'json', 'formatversion': '2', 'maxlag': '5'}
    base.update(params)
    return get('https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode(base))


# ---- the records --------------------------------------------------------------------------

def _q(key):
    return r'["\']?%s["\']?\s*:\s*' % key


ID_RE = re.compile(r'(?<![A-Za-z_])' + _q('id') + r'([\'"])([a-z0-9-]+)\1')


def load_places(cc):
    """[{id, name, city, cats, lat, lng, wiki}] parsed from the country's place files.

    Regex, not a JS engine, so the script runs anywhere Python does (CI has Node, this machine
    has only jsc). Each record runs from its id to the next id; the fields read here are all
    single-line scalars, which is how every place file writes them."""
    out = []
    for rel in PLACE_FILES[cc]:
        src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
        ms = list(ID_RE.finditer(src))
        for i, m in enumerate(ms):
            body = src[m.end():ms[i + 1].start() if i + 1 < len(ms) else len(src)]

            def s(key):
                f = re.search(_q(key) + r'([\'"])((?:\\.|(?!\1).)*)\1', body)
                return f.group(2) if f else ''

            lat = re.search(_q('lat') + r'(-?[\d.]+)', body)
            lng = re.search(_q('lng') + r'(-?[\d.]+)', body)
            cats = re.search(_q('categories') + r'\[([^\]]*)\]', body)
            out.append({
                'id': m.group(2), 'name': s('name'), 'city': s('city'),
                'cats': re.findall(r'[\'"]([^\'"]+)[\'"]', cats.group(1)) if cats else [],
                'lat': float(lat.group(1)) if lat else None,
                'lng': float(lng.group(1)) if lng else None,
                'wiki': [urllib.parse.unquote(u.split('/wiki/', 1)[1]).replace('_', ' ')
                         for u in re.findall(r'https?://en\.wikipedia\.org/wiki/[^\'"\s#?]+', body)],
            })
    return out


def photo_ids():
    return set(re.findall(r'^  "([^"]+)":', open(PHOTOS_JS, encoding='utf-8').read(), re.M))


def load_articles():
    with open(ARTICLES, encoding='utf-8') as fh:
        return json.load(fh)


def km(a_lat, a_lng, b_lat, b_lng):
    if None in (a_lat, a_lng, b_lat, b_lng):
        return None
    p = math.pi / 180
    h = (math.sin((b_lat - a_lat) * p / 2) ** 2
         + math.cos(a_lat * p) * math.cos(b_lat * p) * math.sin((b_lng - a_lng) * p / 2) ** 2)
    return round(12742 * math.asin(math.sqrt(h)), 1)


# ---- --suggest ----------------------------------------------------------------------------

def search_variants(name):
    """The place name as a search, then its parenthetical alone and the name without it:
    "Wat Rong Suea Ten (Blue Temple)" is filed under the Thai name, "The Golden Mount (Wat
    Saket)" under the parenthetical."""
    paren = re.findall(r'\(([^)]*)\)', name)
    bare = re.sub(r'\s*\([^)]*\)', '', name).strip()
    seen, out = set(), []
    for v in [name.replace('(', ' ').replace(')', ' ')] + paren + [bare]:
        v = re.sub(r'\s+', ' ', v).strip(' -–—&')
        if v and v.lower() not in seen:
            seen.add(v.lower())
            out.append(v)
    return out[:3]


def article_info(titles):
    """{title: {lat, lng, image, desc}} for a set of article titles, redirects followed."""
    if not titles:
        return {}
    d = wp({'titles': '|'.join(titles), 'redirects': '1', 'prop': 'coordinates|pageimages|description',
            'piprop': 'name', 'pilicense': 'free'})
    return _pages(d)


def _pages(d):
    out = {}
    for p in (d.get('query') or {}).get('pages') or []:
        if p.get('missing') is not None or 'title' not in p:
            continue
        c = (p.get('coordinates') or [{}])[0]
        out[p['title']] = {'lat': c.get('lat'), 'lng': c.get('lon'), 'image': p.get('pageimage'),
                           'desc': p.get('description', ''), 'rank': p.get('index', 99)}
    return out


def suggest(cc, dest):
    have = photo_ids()
    arts = load_articles()
    done = set(arts.get(cc, {})) | set(arts.get('rejected', {})) | set(arts.get('no_article', {}).get(cc, []))
    todo = [p for p in load_places(cc) if p['id'] not in have and p['id'] not in done]
    print('%d places without a photo still to review' % len(todo))
    rows = []
    for i, p in enumerate(todo, 1):
        cands = {}
        try:
            for t, v in article_info(p['wiki']).items():
                v['via'] = 'source'
                cands[t] = v
            for q in search_variants(p['name']):
                d = wp({'generator': 'search', 'gsrsearch': q, 'gsrlimit': '4',
                        'prop': 'coordinates|pageimages|description', 'piprop': 'name', 'pilicense': 'free'})
                for t, v in _pages(d).items():
                    v['via'] = 'search'
                    cands.setdefault(t, v)
        except Exception as e:                              # noqa: BLE001
            print('  ! %s: %s' % (p['id'], e))
        ranked = []
        for t, v in cands.items():
            ranked.append({'title': t, 'km': km(p['lat'], p['lng'], v['lat'], v['lng']),
                           'image': v['image'], 'desc': v['desc'], 'via': v['via']})
        ranked.sort(key=lambda r: (r['via'] != 'source', r['km'] is None, r['km'] or 0))
        rows.append({'id': p['id'], 'name': p['name'], 'city': p['city'], 'cats': p['cats'], 'cands': ranked[:6]})
        best = ranked[0] if ranked else None
        print('[%d/%d] %-44s %s' % (i, len(todo), p['id'][:44],
                                    '%s (%s km)' % (best['title'], best['km']) if best else '-'))
    with open(dest, 'w', encoding='utf-8') as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
    print('wrote %s' % dest)


# ---- --fetch ------------------------------------------------------------------------------

def commons_file(filename):
    """(thumb_url, credit, licence, page_url) for an openly licensed file, else (None, reason)."""
    title = 'File:' + filename.replace('_', ' ')
    for host in ('commons.wikimedia.org', 'en.wikipedia.org'):
        d = get('https://%s/w/api.php?' % host + urllib.parse.urlencode({
            'action': 'query', 'format': 'json', 'formatversion': '2', 'maxlag': '5', 'titles': title,
            'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': str(FETCH_W)}))
        for p in (d.get('query') or {}).get('pages') or []:
            for ii in p.get('imageinfo') or []:
                meta = ii.get('extmetadata') or {}

                # Hidden spans go before the tags: Commons' {{Unknown|author}} renders
                # 'Unknown author<span style="display: none;">Unknown author</span>', which
                # otherwise strips to a doubled name.
                def m(key):
                    v = (meta.get(key) or {}).get('value', '')
                    v = re.sub(r'<(\w+)[^>]*display:\s*none[^>]*>.*?</\1>', '', v, flags=re.S)
                    v = html.unescape(re.sub(r'<[^>]+>', '', v))
                    return re.sub(r'\s+', ' ', v).strip()

                lic = m('LicenseShortName')
                if not OK_LICENCE.fullmatch(lic) or m('NonFree').lower() == 'true':
                    return None, 'licence "%s"' % (lic or 'unknown')
                who = credit_name(m('Attribution') or m('Artist') or 'Unknown')
                return ((ii.get('thumburl') or ii.get('url'), who, lic,
                         ii.get('descriptionurl', '')), ii.get('mime', ''))
    return None, 'file not found on Commons or en.wikipedia'


def shrink(raw):
    """JPEG bytes inside MAX_W x MAX_H at about TARGET_BYTES.

    Quality gives way before size does: a busy waterfall or a temple roof at 800 px needs
    quality near 50 to reach 60 KB, which still reads cleanly on a phone, whereas dropping to
    525 px (what a size-first ladder did to Wat Mahathat) is visibly soft at 2x. One step down
    to 90% of the width is allowed; past that the file is kept slightly over target instead."""
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    scale = min(1.0, MAX_W / im.width, MAX_H / im.height)
    for step in (1.0, 0.9):
        w, h = round(im.width * scale * step), round(im.height * scale * step)
        sized = im.resize((w, h), Image.LANCZOS) if (w, h) != im.size else im
        for q in (80, 76, 72, 68, 64, 60, 56, 52, 48):
            buf = io.BytesIO()
            sized.save(buf, 'JPEG', quality=q, optimize=True, progressive=True)
            if buf.tell() <= TARGET_BYTES * 1.1:
                return buf.getvalue(), (w, h, q)
    return buf.getvalue(), (w, h, q)


def fetch(cc, stage):
    have = photo_ids()
    arts = load_articles()
    rejected = arts.get('rejected', {})
    places = {p['id']: p for p in load_places(cc)}
    todo = [(pid, t) for pid, t in arts.get(cc, {}).items()
            if pid in places and pid not in have and pid not in rejected]
    os.makedirs(stage, exist_ok=True)
    manifest_path = os.path.join(stage, 'stage.json')
    staged = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    skipped = []
    for i, (pid, title) in enumerate(todo, 1):
        if pid in staged:
            continue
        try:
            found = article_info([title])                  # keyed by the redirect target
            info = found.get(title) or next(iter(found.values()), None)
            fn = info and info.get('image')
            if not fn:
                skipped.append((pid, title, 'article has no free lead image'))
                continue
            if not PHOTO_EXT.search(fn):
                skipped.append((pid, title, 'lead image is not a raster photo: %s' % fn))
                continue
            got, why = commons_file(fn)
            if not got:
                skipped.append((pid, title, why))
                continue
            url, who, lic, page = got
            # The download is kept beside the stage, so retuning shrink() never re-fetches.
            raw_path = os.path.join(stage, 'raw', pid + os.path.splitext(url.split('?')[0])[1].lower())
            if not os.path.exists(raw_path):
                os.makedirs(os.path.dirname(raw_path), exist_ok=True)
                with open(raw_path, 'wb') as fh:
                    fh.write(get(url, binary=True))
            jpg, (w, h, q) = shrink(open(raw_path, 'rb').read())
        except Exception as e:                              # noqa: BLE001
            skipped.append((pid, title, 'error: %s' % e))
            continue
        with open(os.path.join(stage, pid + '.jpg'), 'wb') as fh:
            fh.write(jpg)
        staged[pid] = {'article': title, 'file': fn, 'page': page, 'w': w, 'h': h, 'q': q,
                       'bytes': len(jpg), 'credit': '%s, %s, via Wikimedia Commons' % (who, lic)}
        print('[%d/%d] %-44s %4d KB %dx%d q%d  %s' % (i, len(todo), pid[:44], len(jpg) // 1024, w, h, q, lic))
        if len(who) > CREDIT_MAX:
            print('    ! author field is %d characters; read it and add a CREDIT_NOTES entry if it is a note'
                  % len(who))
        with open(manifest_path, 'w', encoding='utf-8') as fh:
            json.dump(staged, fh, ensure_ascii=False, indent=1)
    print('\nstaged %d in %s' % (len(staged), stage))
    for pid, title, why in skipped:
        print('  skipped %-44s %s: %s' % (pid, title, why))


# ---- --sheet ------------------------------------------------------------------------------

def sheets(stage):
    """3 x 3 labelled contact sheets of the staged images, sheet-NN.jpg in STAGE_DIR."""
    from PIL import Image, ImageDraw, ImageFont
    staged = json.load(open(os.path.join(stage, 'stage.json'), encoding='utf-8'))
    rejected = load_articles().get('rejected', {})
    ids = [k for k in staged if k not in rejected]
    try:
        font = ImageFont.load_default(size=15)
    except TypeError:
        font = ImageFont.load_default()
    cw, ch, lab = 420, 300, 54
    for n in range(0, len(ids), 9):
        sheet = Image.new('RGB', (cw * 3, (ch + lab) * 3), 'white')
        d = ImageDraw.Draw(sheet)
        for k, pid in enumerate(ids[n:n + 9]):
            x, y = (k % 3) * cw, (k // 3) * (ch + lab)
            im = Image.open(os.path.join(stage, pid + '.jpg'))
            im.thumbnail((cw - 8, ch - 8))
            sheet.paste(im, (x + (cw - im.width) // 2, y + 4))
            d.text((x + 4, y + ch), '%d. %s' % (n + k + 1, pid[:46]), fill='black', font=font)
            d.text((x + 4, y + ch + 18), staged[pid]['article'][:48], fill='#035', font=font)
            d.text((x + 4, y + ch + 35), staged[pid]['file'][:52], fill='#666', font=font)
        out = os.path.join(stage, 'sheet-%02d.jpg' % (n // 9 + 1))
        sheet.save(out, 'JPEG', quality=80)
        print(out)


# ---- --install ----------------------------------------------------------------------------

def install(stage):
    staged = json.load(open(os.path.join(stage, 'stage.json'), encoding='utf-8'))
    rejected = load_articles().get('rejected', {})
    have = photo_ids()
    added = []
    for pid, s in staged.items():
        if pid in rejected or pid in have:
            continue
        shutil.copyfile(os.path.join(stage, pid + '.jpg'), os.path.join(IMG_DIR, pid + '.jpg'))
        added.append('  %s: { src: %s, credit: %s },\n'
                     % (json.dumps(pid), json.dumps('img/places/%s.jpg' % pid), json.dumps(s['credit'], ensure_ascii=False)))
    if not added:
        print('nothing to install')
        return
    src = open(PHOTOS_JS, encoding='utf-8').read()
    assert src.rstrip().endswith('};'), 'photos.js does not end as expected'
    head = src.rstrip()[:-2].rstrip()
    if not head.endswith(','):
        head += ','
    with open(PHOTOS_JS, 'w', encoding='utf-8') as fh:
        fh.write(head + '\n' + ''.join(added) + '};\n')
    print('installed %d photos into img/places/ and js/data/photos.js' % len(added))


# ---- --report -----------------------------------------------------------------------------

def report(cc):
    have = photo_ids()
    places = load_places(cc)
    arts = load_articles()
    missing = [p for p in places if p['id'] not in have]
    print('%s: %d places, %d with a photo, %d without' % (cc, len(places), len(places) - len(missing), len(missing)))
    no_art = set(arts.get('no_article', {}).get(cc, []))
    rej = arts.get('rejected', {})
    print('  of the %d without: %d have no article of their own, %d had their image rejected, %d unreviewed'
          % (len(missing), sum(p['id'] in no_art for p in missing), sum(p['id'] in rej for p in missing),
             sum(p['id'] not in no_art and p['id'] not in rej and p['id'] not in arts.get(cc, {}) for p in missing)))


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--country', choices=sorted(PLACE_FILES), default='th')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--report', action='store_true')
    g.add_argument('--suggest', metavar='OUT.json')
    g.add_argument('--fetch', metavar='STAGE_DIR')
    g.add_argument('--sheet', metavar='STAGE_DIR')
    g.add_argument('--install', metavar='STAGE_DIR')
    a = ap.parse_args()
    if a.report:
        report(a.country)
    elif a.suggest:
        suggest(a.country, a.suggest)
    elif a.fetch:
        fetch(a.country, a.fetch)
    elif a.sheet:
        sheets(a.sheet)
    else:
        install(a.install)
    return 0


if __name__ == '__main__':
    sys.exit(main())
