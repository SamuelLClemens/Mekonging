#!/usr/bin/env python3
"""Fill the identify guide's missing photos from openly-licensed sources.

WHY THIS EXISTS AS A SCRIPT. img/ already holds 400 self-hosted photos and
js/data/photos.js already maps record ids to them, but the tool that produced
them was never committed — so when nature.js and produce.js grew, 161 records
(38%) fell back to the "Photo coming soon" placeholder with no way to fix them
short of rewriting the fetcher. This is that fetcher, committed.

HOW IT PICKS AN IMAGE. Wikipedia's lead image for the article, not a Commons
keyword search. That matters for identification: a Commons search for "Naja
kaouthia" returns range maps, museum specimens, skulls and venom vials
alongside live animals, and a field guide that shows a traveller a skull has
failed. The lead image of a species article is chosen by editors to depict the
living organism. Attribution and licence then come from Commons for that exact
file.

LICENSING. Only public domain, CC0, CC BY, CC BY-SA and GFDL are accepted; the
licence short-name is recorded verbatim in the credit shown under the photo.
Anything non-free, unknown or fair-use is skipped and reported, because a
missing photo is a gap and a wrongly-licensed one is a problem.

OFFLINE-FIRST. Images are downloaded and committed under img/ — never hot-linked.
An external image URL is exactly the runtime CDN dependency the project rules
forbid, and it would also mean no photos at all on a plane.

Usage:
    python3 scripts/fetch-identify-photos.py --dry-run     # report the gap, fetch nothing
    python3 scripts/fetch-identify-photos.py --limit 20    # fetch the first 20 missing
    python3 scripts/fetch-identify-photos.py               # fetch everything missing

Re-runnable: records that already have a photo are skipped, so an interrupted
run resumes where it stopped.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS_JS = os.path.join(ROOT, 'js', 'data', 'photos.js')
IMG_DIR = os.path.join(ROOT, 'img')

# Width to store. The photo renders in a card about 340px wide on a phone and is
# never full-screen, so 900px covers a 2x display with headroom and keeps the
# average file near 130KB — the size the existing 400 images already average.
STORE_WIDTH = 900
JPEG_QUALITY = 82

OK_LICENCE = re.compile(r'^(cc[ -]?by(-sa)?([ -]?\d(\.\d)?)?|cc0|public domain|pd|gfdl|cc[ -]?pd)',
                        re.I)
# Wikimedia's API policy asks for a descriptive User-Agent with a contact, and answers
# requests that lack one with a rate-limit page instead of JSON. THROTTLE is the pause
# between calls: the search endpoint is limited far more tightly than the query endpoint,
# and the first run of this script was being refused mid-batch.
UA = ('Mekonging/1.0 (+https://github.com/SamuelLClemens/Mekonging; offline travel guide, identify-photo fetch)')
THROTTLE = 1.1

# NOT EVERY LEAD IMAGE IS A PHOTOGRAPH, and the wrong one is worse than none. The first run
# of this script gave the deadly Amanita exitialis a map of Guangdong province, because that
# is that article's lead image — a field guide that shows a traveller a choropleth where a
# lethal mushroom should be has actively misinformed them.
#
# Two rules catch it. First, the file must be a raster photograph: distribution maps, range
# maps, cladograms, charts and logos are drawn, and drawn images on Commons are SVG or PNG
# with a telling name. Second, a name blocklist for the raster ones that slip through
# (scanned plates of maps, specimen labels, museum drawer shots).
PHOTO_EXT = re.compile(r'\.(jpe?g|tiff?)$', re.I)
NOT_A_PHOTO = re.compile(
    r'(map|range|distribution|locator|_area|chart|diagram|cladogram|phylogen|graph'
    r'|logo|icon|symbol|flag|coat[_ ]of[_ ]arms|stamp|banner'
    r'|label|herbarium|specimen|skull|skeleton|holotype|type[_ ]specimen'
    r'|illustration|drawing|engraving|plate[_ ]\d|sketch|painting)', re.I)


def looks_like_a_photo(filename):
    return bool(PHOTO_EXT.search(filename)) and not NOT_A_PHOTO.search(filename)


def api(url, tries=3):
    """GET JSON via curl. Python's TLS stack fails against these hosts in this
    environment where curl succeeds, so curl is the transport throughout.

    Retried, because these APIs intermittently answer with an HTML error page
    rather than JSON under load — which read as "this species has no photo" on
    the first run and silently left records empty."""
    last = ''
    for n in range(tries):
        time.sleep(THROTTLE)
        out = subprocess.run(
            ['curl', '-sS', '-L', '--max-time', '40', '-H', 'User-Agent: ' + UA, url],
            capture_output=True, text=True)
        if out.returncode == 0:
            try:
                return json.loads(out.stdout)
            except ValueError:
                last = 'non-JSON response (%s…)' % out.stdout.strip()[:60].replace('\n', ' ')
        else:
            last = (out.stderr or '').strip()[:120]
        time.sleep(3.0 * (n + 1))
    raise RuntimeError(last or 'request failed')


def wiki_lead_file(title):
    """The Commons file name of the article's lead image, or None."""
    q = ('https://en.wikipedia.org/w/api.php?action=query&format=json&maxlag=5&redirects=1'
         '&prop=pageimages&piprop=name&titles=' + subprocess.list2cmdline([title]).strip('"').replace(' ', '%20'))
    d = api(q)
    pages = (d.get('query') or {}).get('pages') or {}
    for p in pages.values():
        if p.get('pageimage'):
            return p['pageimage']
    return None


def commons_info(filename):
    """(url, artist, licence) for a Commons file, or None if not openly licensed."""
    q = ('https://commons.wikimedia.org/w/api.php?action=query&format=json'
         '&maxlag=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=%d&titles=File:%s'
         % (STORE_WIDTH, filename.replace(' ', '_').replace('&', '%26')))
    d = api(q)
    pages = (d.get('query') or {}).get('pages') or {}
    for p in pages.values():
        for ii in (p.get('imageinfo') or []):
            meta = ii.get('extmetadata') or {}
            lic = (meta.get('LicenseShortName') or {}).get('value', '')
            lic = re.sub(r'<[^>]+>', '', lic).strip()
            if not OK_LICENCE.match(lic):
                return ('SKIP_LICENCE', lic or 'unknown', '')
            artist = (meta.get('Artist') or {}).get('value', '')
            artist = re.sub(r'<[^>]+>', '', artist)
            artist = re.sub(r'\s+', ' ', artist).strip() or 'Unknown'
            if len(artist) > 60:
                artist = artist[:60].rstrip()
            return (ii.get('thumburl') or ii.get('url'), artist, lic)
    return None


def commons_search(term, limit=10):
    """Candidate Commons photo filenames for a term, best match first.

    The fallback when an article's lead image is not a photograph (or the article
    has none). Restricted to bitmaps, then put through the same photo test — a
    bare keyword search returns maps and specimen shots freely."""
    q = ('https://commons.wikimedia.org/w/api.php?action=query&format=json'
         '&maxlag=5&generator=search&gsrnamespace=6&gsrlimit=%d&gsrsearch=%s'
         % (limit, ('filetype:bitmap ' + term).replace(' ', '%20').replace('&', '%26')))
    d = api(q)
    pages = (d.get('query') or {}).get('pages') or {}
    names = [re.sub(r'^File:', '', p.get('title', '')) for p in pages.values()]
    return [n for n in names if looks_like_a_photo(n)]


def find_image(titles, log):
    """(url, artist, licence, filename) for the best openly-licensed PHOTOGRAPH."""
    # 1. The article's lead image — chosen by editors to depict the subject, so it
    #    is right far more often than any keyword search.
    for title in titles:
        try:
            fn = wiki_lead_file(title)
        except Exception as e:                              # noqa: BLE001
            log('    ! wiki lookup failed (%s): %s' % (title, e))
            continue
        if not fn:
            continue
        if not looks_like_a_photo(fn):
            log('    - lead image is not a photograph: %s' % fn[:60])
            continue
        got = _vet(fn, log)
        if got:
            return got
    # 2. Commons search — but only for a file that NAMES THE SAME ORGANISM.
    #
    #    This guard is not defensive tidiness. Without it the search handed
    #    Amanita exitialis — one of the deadliest mushrooms in the region — a
    #    photograph of Amanita verna, a different species on a different
    #    continent, because the names are close and Commons ranks on text. That
    #    record's own text tells the reader that deadly and edible Amanitas
    #    cannot be told apart by eye; illustrating it with the wrong species
    #    would be the single most harmful thing this script could do.
    #
    #    So a search hit must contain the specific epithet ("exitialis"), which
    #    is the part of a binomial that identifies the species. Where there is no
    #    binomial to check against (market produce, named by its English name),
    #    the longest word of the name must appear instead.
    for title in titles:
        # SEARCH ONLY ON A SCIENTIFIC NAME. Two rounds of tightening the filters could not make
        # a keyword search on a COMMON name safe, and the misses were not near-misses: "Rattan"
        # returned a portrait of a man named Volney Rattan, "Flying Lizard" a motorsport pit
        # (twice), "Anopheles"'s common name a mosquito trap, "Water Mimosa" a park's water
        # testing, "Edible Insects" Malawi and then Angola. Commons ranks on text and English
        # produce names are ordinary English words, so there is no filter that separates the
        # organism from everything else called the same thing.
        #
        # A binomial has no such collisions: "Termitomyces", "Coccinia grandis" and
        # "Betta splendens" mean one organism and nothing else, and every search result that
        # survived review was keyed on one. So the fallback is now limited to titles that ARE
        # binomials. A produce record whose article has no lead image keeps its placeholder —
        # which is the correct outcome: a gap is honest, and a photo of the wrong thing in a
        # field guide is not.
        if not _is_binomial(title):
            continue
        key = _identity_key(title)
        try:
            cands = commons_search(title)
        except Exception as e:                              # noqa: BLE001
            log('    ! commons search failed (%s): %s' % (title, e))
            continue
        for fn in cands[:8]:
            name = fn.lower().replace('_', ' ')
            if key and key not in name:
                continue
            if not search_hit_is_credible(fn, title, False):
                log('    - search hit rejected as a different subject: %s' % fn[:56])
                continue
            got = _vet(fn, log)
            if got:
                log('    · via search, name-checked on "%s" + all words + region/dish test' % key)
                return got
    return None


def _identity_key(title):
    """The word a candidate filename must contain to be the same organism.

    For a binomial, the specific epithet ("exitialis" from "Amanita exitialis"),
    skipping rank markers so "Abies delavayi subsp. fansipanensis" keys on
    "fansipanensis"."""
    words = _words(title)
    if len(words) >= 2 and words[0][:1].isupper() and words[1][:1].islower():
        return words[-1].lower()
    return max(words, key=len).lower() if words else ''


def _is_binomial(title):
    """True for "Genus epithet" — capitalised genus followed by a lowercase epithet."""
    w = _words(title)
    return len(w) >= 2 and w[0][:1].isupper() and w[1][:1].islower()


def _words(title):
    return [w for w in re.findall(r"[A-Za-z'-]+", title)
            if w.lower() not in ('subsp', 'var', 'ssp', 'f', 'sp', 'the', 'and', 'of', 'a')]


# THE SEARCH FALLBACK NEEDS MORE THAN ONE MATCHING WORD. Keying on the longest word of an
# English name let a run of confidently wrong images through, every one of which would have
# shipped in a field guide: "Edible Insects" matched edible insects in MALAWI; "Fish Mint"
# matched Congo Fiesta Latina mint FISH TACOS; "Flying Lizard" matched the pit garage of
# Flying Lizard Motorsports; Anopheles matched a WWII anti-malaria PROPAGANDA POSTER; and
# Amanita brunneitoxicaria matched a 1908 portrait of a man named Browning.
#
# Three rules, all cheap, all of which those failures trip:
#   * every significant word of the name must appear in the filename, not just one;
#   * a filename naming a place outside this region is a different organism or a different
#     subject entirely — nothing in this guide is illustrated from Malawi or Tacoma;
#   * a filename naming a PREPARED DISH is not a picture of the raw ingredient, which is what
#     a market-produce record is about.
OFF_REGION = re.compile(
    r'\b(malawi|kenya|nigeria|congo|ghana|uganda|tanzania|ethiopia|senegal|morocco'
    r'|brazil|mexico|peru|chile|argentina|colombia|cuba|jamaica'
    r'|australia|zealand|hawaii|florida|texas|california|tacoma|oregon|canada|alaska'
    r'|kew|europe|england|britain|france|germany|spain|italy|greece|poland|russia'
    r'|japan|korea|taiwan|mongolia|nepal|pakistan|bangladesh|srilanka|maldives'
    r'|cebu|luzon|mindanao|philippin|borneo|papua|fiji|samoa)\b', re.I)
PREPARED_DISH = re.compile(
    r'\b(taco|croquette|omelette|omelet|burger|pizza|sandwich|curry|soup|salad|stew|pie'
    r'|cake|dessert|smoothie|cocktail|breakfast|lunch|dinner|brunch|buffet|platter'
    r'|recipe|cooking|cooked|fried|grilled|roasted|steamed|restaurant|menu|cafe'
    r'|selfie|portrait|poster|nara|museum|motorsport|garage|crafts|furniture)\b', re.I)


def search_hit_is_credible(filename, title, is_produce):
    name = filename.lower().replace('_', ' ').replace('-', ' ')
    if OFF_REGION.search(name):
        return False
    if PREPARED_DISH.search(name):
        return False
    return all(w.lower().strip("'") in name for w in _words(title))


def _vet(fn, log):
    try:
        got = commons_info(fn)
    except Exception as e:                                  # noqa: BLE001
        log('    ! commons lookup failed: %s' % e)
        return None
    if not got:
        return None
    if got[0] == 'SKIP_LICENCE':
        log('    - rejected licence "%s" for %s' % (got[1], fn[:50]))
        return None
    return (got[0], got[1], got[2], fn)


def download(url, dest):
    tmp = dest + '.part'
    out = subprocess.run(
        ['curl', '-sS', '-L', '--max-time', '90', '-H', 'User-Agent: ' + UA, '-o', tmp, url],
        capture_output=True, text=True)
    if out.returncode != 0 or not os.path.exists(tmp) or os.path.getsize(tmp) < 3000:
        if os.path.exists(tmp):
            os.remove(tmp)
        return False
    # Normalise to a baseline JPEG at STORE_WIDTH. Wikimedia's thumbnailer already
    # scales, but it hands back PNG for PNG originals (a 2MB PNG of a mushroom is
    # not worth 15x the bytes of the same photo as JPEG) and occasionally ignores
    # the width for small files.
    try:
        from PIL import Image
        im = Image.open(tmp)
        im = im.convert('RGB')
        if im.width > STORE_WIDTH:
            im = im.resize((STORE_WIDTH, round(im.height * STORE_WIDTH / im.width)), Image.LANCZOS)
        im.save(dest, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
        os.remove(tmp)
        return True
    except Exception as e:                                  # noqa: BLE001
        print('    ! image convert failed: %s' % e)
        if os.path.exists(tmp):
            os.remove(tmp)
        return False


# ---- the records ------------------------------------------------------------

def load_photos():
    src = open(PHOTOS_JS, encoding='utf-8').read()
    return set(re.findall(r'^  "([^"]+)":', src, re.M)), src


def nature_records():
    src = open(os.path.join(ROOT, 'js', 'data', 'nature.js'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r'"id":\s*"(nat-[a-z0-9\-]+)"(.{0,3000}?)"emoji"', src, re.S):
        body = m.group(2)
        sci = re.search(r'"sciName":\s*"([^"]*)"', body)
        com = re.search(r'"commonName":\s*"([^"]*)"', body)
        out.append({
            'id': m.group(1),
            'dir': 'nature',
            # Scientific name first: it is unambiguous and is the English Wikipedia
            # article title for almost every organism here.
            'titles': [t for t in [sci.group(1) if sci else '', com.group(1) if com else ''] if t],
        })
    return out


# Produce records carry no scientific name — they are named the way a stall names them — so
# the binomial path above never ran for any of them, which is why every remaining produce gap
# was a produce gap. These are the accepted botanical names for the ones the English name
# alone could not resolve, so each gets a search key that means exactly one plant.
PRODUCE_SCINAME = {
    'sator': 'Parkia speciosa',
    'cha-om': 'Senegalia pennata',
    'pea-eggplant': 'Solanum torvum',
    'sawtooth-coriander': 'Eryngium foetidum',
    'rice-paddy-herb': 'Limnophila aromatica',
    'fish-mint': 'Houttuynia cordata',
    'water-mimosa': 'Neptunia oleracea',
    'chinese-cabbage': 'Brassica rapa subsp. pekinensis',
    'tam-hoa-plum': 'Prunus salicina',
    'sapa-peach': 'Prunus persica',
    'shan-tuyet-tea': 'Camellia sinensis',
    'perilla': 'Perilla frutescens',
    'rau-ram': 'Persicaria odorata',
    'betel-leaf': 'Piper betle',
    'winged-bean': 'Psophocarpus tetragonolobus',
    'yardlong-bean': 'Vigna unguiculata',
    'bitter-melon': 'Momordica charantia',
    'morning-glory': 'Ipomoea aquatica',
    'thai-eggplant': 'Solanum melongena',
    'daikon': 'Raphanus sativus',
}
# Non-plant records — a paste, a preserved egg, a fermented sauce — have no organism to look
# up. Their subject is a PREPARED product, exactly the thing the search filters reject, and
# there is no honest automated route to a photograph of it. They keep the placeholder until
# someone photographs a stall.
NO_ORGANISM = {'padaek', 'nam-phrik-phao', 'century-egg', 'shrimp-paste', 'edible-insects',
               'palm-sugar', 'coconut-milk', 'tamarind-paste', 'jasmine-rice', 'rice-noodles',
               'sticky-rice', 'dried-shrimp', 'tofu'}

# Records where an automated fetch found the right SPECIES but the wrong FORM, and a field
# guide needs the form: a flowering Brassica rapa field is not the napa head on the stall,
# peach blossom is not a peach, a man drinking from a coconut is not coconut milk, and
# turmeric on a stall is a rhizome, not a leafy plant. Each was reviewed as an image and
# deleted; listing them here stops a later run silently restoring the same picture.
WRONG_FORM = {'chinese-cabbage', 'sapa-peach', 'coconut-milk', 'turmeric'}


def produce_records():
    src = open(os.path.join(ROOT, 'js', 'data', 'produce.js'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r'"id":\s*"([a-z0-9\-]+)",\s*"name":\s*"([^"]*)"', src):
        rid = m.group(1)
        sci = PRODUCE_SCINAME.get(rid)
        # Scientific name FIRST where there is one: it is the only key the search fallback
        # will accept, and it is the more reliable Wikipedia article title besides.
        out.append({'id': rid, 'dir': 'produce',
                    'titles': ([sci] if sci else []) + [m.group(2)]})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--only', default='', help='comma-separated record ids')
    args = ap.parse_args()

    have, src = load_photos()
    recs = nature_records() + produce_records()
    missing = [r for r in recs if r['id'] not in have
               and r['id'] not in NO_ORGANISM and r['id'] not in WRONG_FORM]
    if args.only:
        want = set(args.only.split(','))
        missing = [r for r in missing if r['id'] in want]
    print('%d records, %d already have a photo, %d missing'
          % (len(recs), len(recs) - len([r for r in recs if r['id'] not in have]), len(missing)))
    if args.dry_run:
        for r in missing:
            print('  %-46s %s' % (r['id'], ' / '.join(r['titles'])))
        return 0
    if args.limit:
        missing = missing[:args.limit]

    added, failed = [], []
    for i, r in enumerate(missing, 1):
        print('[%d/%d] %s' % (i, len(missing), r['id']))
        info = find_image(r['titles'], print)
        if not info:
            failed.append((r['id'], 'no openly-licensed photograph found'))
            continue
        print('    · %s (%s, %s)' % (info[3][:56], info[1][:28], info[2]))
        d = os.path.join(IMG_DIR, r['dir'])
        os.makedirs(d, exist_ok=True)
        dest = os.path.join(d, r['id'] + '.jpg')
        if not download(info[0], dest):
            failed.append((r['id'], 'download failed'))
            continue
        kb = os.path.getsize(dest) // 1024
        print('    ✓ img/%s/%s.jpg  %dKB' % (r['dir'], r['id'], kb))
        added.append((r['id'], 'img/%s/%s.jpg' % (r['dir'], r['id']),
                      '%s, %s, via Wikimedia Commons' % (info[1], info[2])))
        time.sleep(0.4)                                     # on top of the per-call THROTTLE

    if added:
        lines = ''.join(
            '  %s: { src: %s, credit: %s },\n'
            % (json.dumps(i), json.dumps(s), json.dumps(c)) for i, s, c in added)
        assert src.rstrip().endswith('};'), 'photos.js does not end as expected'
        head = src.rstrip()[:-2].rstrip()
        if not head.endswith(','):
            head += ','
        open(PHOTOS_JS, 'w', encoding='utf-8').write(head + '\n' + lines + '};\n')
        print('\nwrote %d entries into js/data/photos.js' % len(added))
    if failed:
        print('\n%d could not be filled:' % len(failed))
        for i, why in failed:
            print('  %-46s %s' % (i, why))
    return 0


if __name__ == '__main__':
    sys.exit(main())
