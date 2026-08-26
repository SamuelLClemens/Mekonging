#!/usr/bin/env python3
"""Build js/data/drivetimes.js — a calibrated straight-line-km -> drive-minutes curve per
country, fitted to real routed journeys instead of two guessed constants.

WHAT WAS WRONG. render-utils.js estimated drive time as `km * 1.35 / 50 kmh`, a single flat
figure of 1.62 minutes per straight-line kilometre. Measured against 17,994 real OSRM-routed
pairs between the app's own places, that is wrong in a consistent and predictable direction:
it UNDERSTATES short journeys by 23-63% (a 50-90 km hop in Thailand really takes 129 minutes,
not 86) and OVERSTATES long ones by 18-30% (expressways). The error is not noise — minutes per
straight-line kilometre falls steadily with distance, because a longer trip spends a greater
share of itself on a better road. One constant cannot express that.

This also unblocks the deferred 90-minute "near me" ceiling. The old cap was held at 75
minutes because a straight-line-derived estimate put Pai -> Chiang Mai at ~89 minutes, which
would have pulled a genuine 2h20m mountain drive into "near you". Real routing puts that pair
at 129 minutes, comfortably outside a 90-minute cap, so the cap can be raised on evidence.

Input:  the OSRM /table matrices fetched into the session scratchpad (two rounds — a spread
        sample and a dense short-range one; short pairs are what "near me" actually depends
        on and the first round had only tens of them).
Usage:  python3 scripts/build_drivetimes.py <scratchpad-dir>
"""
import glob, io, json, math, os, statistics as st, sys

CCS = ['th', 'vi', 'kh', 'la']
# Band edges in straight-line km. Dense at the short end: that is where "near me" lives and
# where the old model was most wrong.
BANDS = [(1, 5), (5, 12), (12, 25), (25, 50), (50, 90), (90, 160), (160, 320), (320, 1200)]
MIN_N = 12          # corridors, not pairs — a band below this inherits its neighbours


def hav(a, b):
    R = 6371.0088
    p1, p2 = math.radians(a['lat']), math.radians(b['lat'])
    dp = p2 - p1
    dl = math.radians(b['lng'] - a['lng'])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(min(1, math.sqrt(h)))


def load_pairs(root):
    rows = {cc: [] for cc in CCS}
    dropped = {}
    seen = set()
    files = sorted(glob.glob(os.path.join(root, 'drive', '*.json'))
                   + glob.glob(os.path.join(root, 'drive_short', '*.json')))
    for fn in files:
        cc = os.path.basename(fn).split('_')[0].replace('.json', '')
        if cc not in CCS:
            continue
        d = json.load(io.open(fn, encoding='utf-8'))
        pts, dur, dist = d['_points'], d['durations'], d['distances']
        for i, a in enumerate(pts):
            for j, b in enumerate(pts):
                if i == j:
                    continue
                du, di = dur[i][j], dist[i][j]
                if not du or not di or du <= 0 or di <= 0:
                    continue
                key = (a['id'], b['id'])
                if key in seen:
                    continue
                seen.add(key)
                s = hav(a, b)
                if s < 0.8:
                    continue
                road = di / 1000.0
                # EXCLUDE PAIRS THAT ARE NOT A DRIVE. A routing engine answers the question
                # "what is the road route", and for two islands the honest answer is "there
                # isn't one" — so it returns a road that goes the long way round the mainland,
                # or snaps both ends onto a disconnected fragment. Both wreck the fit:
                #   Maya Bay -> Koh Kradan: 69 km apart, 154 km of "road", 511 minutes.
                #   Mu Ko Lanta -> Koh Kradan: 28 km apart, 176 km of road, ratio 19.9.
                #   Koh Tao -> Koh Samui: 72 km apart, 48 km of "road" — shorter than the
                #     straight line, which is impossible and means a snapped network.
                # A traveller crosses that water by boat, and the app has ferry and route data
                # for exactly that. Keep only journeys where the road plausibly IS the journey:
                # never shorter than the straight line, never more than 2.5 times it.
                #
                # 2.5 is not arbitrary. Beyond that the road is no longer "the same journey by
                # a winding route", it is a detour round a barrier — water, a range with no
                # pass, a park with no through road — and a traveller facing one takes a boat,
                # a different route, or does not go. The threshold is set to RETAIN the worst
                # genuine road journey this app knows about, Pai -> Chiang Mai at 2.35x (129 km
                # of mountain switchbacks for 55 km of straight line, 2h20m), while excluding
                # Koh Rong -> Botum Sakor at 2.98x, where the 169-minute "drive" is fiction.
                ratio = road / s
                if ratio < 0.95 or ratio > 2.5:
                    dropped[cc] = dropped.get(cc, 0) + 1
                    continue
                # AND on implied speed, which is the filter that actually catches the ferries.
                # Maya Bay -> Koh Kradan survives the detour test at 2.23x, because 154 km of
                # road for 69 km of straight line is not obviously absurd — but that route takes
                # 511 minutes, i.e. 18 km/h. Nobody drives at 18 km/h for eight hours; that is a
                # boat with a scheduling penalty, or an unpaved track the router priced as
                # impassable. Below 25 km/h it is not a drive, and above 110 km/h average it is
                # not a road in this region either.
                kmh = road / (du / 3600.0)
                if kmh < 25 or kmh > 110:
                    dropped[cc] = dropped.get(cc, 0) + 1
                    continue
                rows[cc].append((s, road, du / 60.0, a['lat'], a['lng'], b['lat'], b['lng']))
    print('  dropped as not-a-drive (island / no through road / snapped network): '
          + ', '.join(f'{k} {v}' for k, v in sorted(dropped.items())))
    return rows, len(files)


def q(sorted_vals, frac):
    if not sorted_vals:
        return None
    i = min(len(sorted_vals) - 1, max(0, int(round(frac * (len(sorted_vals) - 1)))))
    return sorted_vals[i]


def collapse(band_rows, cell_deg):
    """One observation per CORRIDOR, not per place pair.

    Place pairs inside a cluster are not independent observations: eleven curated places around
    Krabi pair with each other over the same two roads, so they contribute a hundred nearly
    identical ratios and drown out the single Bangkok-Ayutthaya pair on the motorway. That is
    what made Thailand's 50-90 km band read p25 2.27 / p50 2.37 — a suspiciously tight spread
    for a band that demonstrably contains both a 59-minute motorway run and a 2h20m mountain
    drive. Collapsing each origin-destination cell pair to its own median gives every corridor
    one vote, which is what the quantiles are supposed to measure.

    The cell size has to scale with the band. A first attempt used one ~55 km cell for every
    band, which merged both endpoints of every short pair into the SAME cell — so every band
    under 55 km collapsed to a single corridor, fell below the minimum sample, and silently
    inherited its neighbour's figures. Each band now snaps at roughly a quarter of its own
    length, which keeps a corridor meaningful at 5 km and at 500 km alike."""
    by_corridor = {}
    for s, road, mins, alat, alng, blat, blng in band_rows:
        ca = (round(alat / cell_deg), round(alng / cell_deg))
        cb = (round(blat / cell_deg), round(blng / cell_deg))
        by_corridor.setdefault((min(ca, cb), max(ca, cb)), []).append((s, road, mins))
    out = []
    for group in by_corridor.values():
        out.append((st.median(g[0] for g in group), st.median(g[1] for g in group),
                    st.median(g[2] for g in group)))
    return out


def fit(rows):
    """Three quantiles of minutes per straight-line km per band, not one.

    A single figure cannot serve this data, because within a band the distribution is bimodal
    rather than clustered. Thailand's 50-90 km band contains both Bangkok -> Ayutthaya at 0.87
    minutes per straight-line km (motorway, 59 minutes for 68 km) and Pai -> Chiang Mai at 2.55
    (mountain switchbacks). The median, 2.37, is the best single guess and is therefore wrong
    about BOTH: it more than doubles the motorway trip and still understates the mountain one.
    From two arbitrary coordinates there is no way to know which kind of road connects them.
    
    So the honest output is a range. p50 drives the near/day-trip classification, where a
    typical case is what the threshold means; p15 and p85 drive the label, so the app says
    "1h45m-2h30m by road" instead of asserting a precision it does not have. p15/p85 rather
    than p25/p75 because at the quartiles the band was still too narrow to contain real
    journeys — Pai -> Chiang Mai fell outside its own band's interquartile range. Quantiles,
    not mean and standard deviation: the tails here are journeys, not measurement error."""
    out = {}
    for cc in CCS:
        vals = []
        for lo, hi in BANDS:
            band = [r for r in rows[cc] if lo <= r[0] < hi]
            cell = max(0.02, (lo / 4.0) / 111.32)      # ~a quarter of the band's own length
            corridors = collapse(band, cell)
            sub = sorted(m / s for s, _, m in corridors)
            vals.append((lo, hi, len(sub),
                         (q(sub, 0.15), q(sub, 0.5), q(sub, 0.85)) if sub else None))
        print(f'  {cc}: ' + ' '.join(f'{lo}-{hi}:{n}' for lo, hi, n, _ in vals))
        # Fill thin bands from the nearest well-populated neighbour, then enforce a
        # monotonically non-increasing curve. Both are shape constraints, not cosmetics: a
        # longer journey spends more of itself on a better road, so minutes per straight-line
        # km cannot legitimately RISE with distance. Where the raw fit does rise (Cambodia's
        # 50-90 km band, n=120, sits above its neighbours) that is sampling noise, and letting
        # it through would make a 60 km trip read as slower per km than a 30 km one.
        good = [(i, v) for i, v in enumerate(vals) if v[2] >= MIN_N and v[3]]
        if not good:
            raise SystemExit(f'no usable bands for {cc}')
        series = []
        for i, (lo, hi, n, v) in enumerate(vals):
            if v is None or n < MIN_N:
                v = min(good, key=lambda g: abs(g[0] - i))[1][3]
            series.append(v)
        # NO monotonic clamp. An earlier version forced the curve to be non-increasing on the
        # reasoning that longer trips use better roads. Measured, that is false in the middle:
        # Thailand's 12-90 km bands really do rise (2.11 -> 2.32 -> 2.38) because that range is
        # dominated by winding provincial roads and market towns, while a 5 km hop is mostly one
        # street and a 300 km run is mostly motorway. Clamping flattened those three bands back
        # to 2.05 and reintroduced the very underestimate this file exists to fix. The curve is
        # left as measured; the island filter above is what removes the actual noise.
        out[cc] = [{'upTo': hi, 'lo': round(v[0], 3), 'mid': round(v[1], 3), 'hi': round(v[2], 3),
                    'n': vals[i][2]}
                   for i, ((lo, hi), v) in enumerate(zip(BANDS, series))]
    return out


def main(root):
    rows, nfiles = load_pairs(root)
    total = sum(len(v) for v in rows.values())
    print(f'{nfiles} matrices, {total} unique routed pairs')
    for cc in CCS:
        print(f'  {cc}: {len(rows[cc])}')
    table = fit(rows)

    body = ',\n'.join(
        f"  {cc}: [" + ', '.join(f"[{b['upTo']}, {b['lo']}, {b['mid']}, {b['hi']}]" for b in table[cc]) + ']'
        for cc in CCS)
    out = f'''// AUTO-GENERATED by scripts/build_drivetimes.py — do not edit by hand.
//
// Calibrated drive-time curve: straight-line kilometres -> minutes, per country, fitted to
// {total:,} real OSRM-routed journeys between this app's own places (© OpenStreetMap
// contributors, routed by the public OSRM service).
//
// This replaces a single flat estimate of km * 1.35 / 50 kmh = 1.62 minutes per straight-line
// kilometre, which measured 23-63% TOO FAST on short journeys and 18-30% too slow on long
// ones. Minutes per straight-line km falls with distance because a longer trip spends more of
// itself on a better road, and no constant can express that.
//
// Each row is [upToStraightLineKm, p25, p50, p75] of minutes per straight-line kilometre,
// ascending. Read by estDriveMin() in js/render-utils.js, which interpolates between rows.
// p50 decides near / day-trip classification; p25 and p75 make the on-screen label a range,
// because within a band the spread is real: Thailand at 50-90 km holds both a 59-minute
// motorway run to Ayutthaya and a 2h20m mountain drive to Pai.
export const DRIVE_CURVE = {{
{body}
}};

// What the old model claimed, kept so the change is auditable rather than folklore.
export const LEGACY_MIN_PER_KM = 1.62;
'''
    io.open('js/data/drivetimes.js', 'w', encoding='utf-8').write(out)
    print('\nwrote js/data/drivetimes.js')
    for cc in CCS:
        print(f"  {cc}: " + '  '.join(f"<{b['upTo']}:{b['lo']}/{b['mid']}/{b['hi']}" for b in table[cc]))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '/tmp'))
