"""Build the Phu Quoc (Vietnam) bus stop layer, with real route numbers.

Phu Quoc is the one place outside Bangkok in this app's region where OpenStreetMap carries
proper `type=route, route=bus` relations AND the stop nodes they serve, so a stop can be told
which routes call at it without the guesswork that made that join unavailable for Hanoi,
Phnom Penh and Vientiane (see scripts/build_bus_osm.py).

The island's network is VinBus: routes 17 and 19 (Duong Dong / the airport / GrandWorld /
InterContinental), route 20 (GrandWorld to the Bai Vong ferry port) and PQ3.5 (the Safari).
Each direction is mapped as its own relation, so route NUMBERS are deduplicated per stop -
a traveller wants to know "the 19 stops here", not that both directions of it do.

No timetables: OSM does not carry them (its own wiki calls GTFS-style timetables de facto
impossible to maintain there), and VinBus publishes none in machine-readable form. Route
numbers change far less often than departure times, so numbers are what ships.

Data: OpenStreetMap contributors, ODbL 1.0.
"""

import json
import os
import time
import urllib.parse
import urllib.request

# overpass-api.de answers HTTP 406 to this environment; these two answer normally, and both
# are listed because public mirrors return dispatcher timeouts under load often enough that a
# single endpoint makes the build unreproducible.
ENDPOINTS = (
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
)

# The whole island plus a margin, so a stop just offshore of the tight coastline is not clipped.
BBOX = (9.90, 103.75, 10.50, 104.15)


def run(query, attempts=6):
    body = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for i in range(attempts):
        for ep in ENDPOINTS:
            try:
                req = urllib.request.Request(ep, data=body)
                raw = urllib.request.urlopen(req, timeout=180).read()
                # A busy mirror answers 200 with an HTML error body rather than a status code.
                if b"runtime error" in raw or b"Dispatcher_Client" in raw:
                    last = "busy: " + ep.split("/")[2]
                    continue
                return json.loads(raw)
            except Exception as exc:
                last = "%s: %s" % (ep.split("/")[2], exc)
        wait = 10 * (i + 1)
        print("   all endpoints busy (%s), waiting %ds" % (last, wait))
        time.sleep(wait)
    raise SystemExit("Overpass unavailable after retries: %s" % last)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(os.path.dirname(here), "js", "data", "bus.pq.js")

    print("fetching route relations with members ...")
    rels = run("""[out:json][timeout:120];
relation["type"="route"]["route"="bus"](%f,%f,%f,%f);
out body;""" % BBOX).get("elements", [])

    print("fetching route line geometry ...")
    # `out geom` on the relations returns each member way's coordinates inline, which is what
    # lets the map draw the routes themselves rather than only the stops. This is affordable
    # here precisely because Phu Quoc has four route numbers; Bangkok's 708 would be an
    # unreadable tangle on a phone, which is why route lines are an island-only feature.
    geom_rels = run("""[out:json][timeout:180];
relation["type"="route"]["route"="bus"](%f,%f,%f,%f);
out geom;""" % BBOX).get("elements", [])

    print("fetching stop nodes ...")
    nodes = run("""[out:json][timeout:120];
(
  node["highway"="bus_stop"](%f,%f,%f,%f);
  node["public_transport"="platform"]["bus"="yes"](%f,%f,%f,%f);
);
out body;""" % (BBOX + BBOX)).get("elements", [])

    # node id -> set of route numbers, from each relation's own member list
    serves = {}
    refs_seen = set()
    for rel in rels:
        ref = (rel.get("tags", {}).get("ref") or "").strip()
        if not ref:
            continue
        refs_seen.add(ref)
        for mem in rel.get("members", []):
            if mem.get("type") != "node":
                continue
            # Roles vary across mappers: stop, stop_entry_only, platform, platform_exit_only.
            if "stop" not in (mem.get("role") or "") and "platform" not in (mem.get("role") or ""):
                continue
            serves.setdefault(mem["ref"], set()).add(ref)

    def sort_key(r):
        # Plain numbers first and numerically (17, 19, 20), then lettered refs like PQ3.5.
        return (0, int(r), "") if r.isdigit() else (1, 0, r)

    rows = []
    for n in nodes:
        tags = n.get("tags", {})
        name = (tags.get("name") or "").strip()
        route_list = sorted(serves.get(n["id"], set()), key=sort_key)
        rows.append([round(n["lat"], 5), round(n["lon"], 5), name, ", ".join(route_list)])

    rows.sort(key=lambda r: (r[0], r[1]))
    with_routes = sum(1 for r in rows if r[3])

    # One colour per route number, held here rather than in the map code so the legend, the
    # lines and the stop dots cannot drift apart. Chosen to stay legible over BOTH the street
    # basemap and satellite imagery, and to avoid the colours already spoken for by other
    # layers (ATMs #0A84FF, bus default #5E5CE6, walking route #30D158).
    PALETTE = ["#FF9F0A", "#FF375F", "#64D2FF", "#BF5AF2", "#FFD60A", "#32D74B"]

    lines_by_ref = {}
    for rel in geom_rels:
        ref = (rel.get("tags", {}).get("ref") or "").strip()
        if not ref:
            continue
        for mem in rel.get("members", []):
            geom = mem.get("geometry")
            if mem.get("type") != "way" or not geom or len(geom) < 2:
                continue
            line = [[round(pt["lat"], 5), round(pt["lon"], 5)] for pt in geom]
            lines_by_ref.setdefault(ref, []).append(line)

    ordered_refs = sorted(refs_seen, key=sort_key)
    colors = {ref: PALETTE[i % len(PALETTE)] for i, ref in enumerate(ordered_refs)}
    routes_out = [
        {"ref": ref, "color": colors[ref], "lines": lines_by_ref.get(ref, [])}
        for ref in ordered_refs
    ]

    header = (
        "// Phu Quoc island bus stops, with the VinBus route numbers serving each one.\n"
        "// Generated by scripts/build_bus_phuquoc.py - do not edit by hand.\n"
        "// OpenStreetMap contributors, ODbL 1.0. Fetched %s.\n"
        "//\n"
        "// Unlike Hanoi/Phnom Penh/Vientiane, OSM carries real bus route relations here, so\n"
        "// stops can name the routes that call at them. No timetables: neither OSM nor VinBus\n"
        "// publishes them in machine-readable form, and a fabricated headway would read as\n"
        "// precise and be wrong.\n"
        % time.strftime("%Y-%m-%d")
    )
    body = [
        header,
        'export const BUS_SOURCE_PQ = "Phu Quoc island, VinBus routes %s (OpenStreetMap)";\n'
        % ", ".join(sorted(refs_seen, key=sort_key)),
        "\n// Packed row -> [lat, lng, name, routeNumbers]\n",
        "export const BUS_STOPS_PQ = %s;\n" % json.dumps(rows, ensure_ascii=False),
        "\n// One entry per route number: its colour and its drawn line segments ([lat, lng] pairs).\n"
        "// Colours live here, not in the map code, so the lines, the stop dots and the legend\n"
        "// cannot drift apart.\n",
        "export const BUS_ROUTES_PQ = %s;\n" % json.dumps(routes_out, ensure_ascii=False),
    ]
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write("".join(body))

    print("\nroute relations: %d, distinct route numbers: %s"
          % (len(rels), ", ".join(sorted(refs_seen, key=sort_key))))
    print("stops: %d (%d carry route numbers, %d do not)"
          % (len(rows), with_routes, len(rows) - with_routes))
    for r in routes_out:
        pts = sum(len(l) for l in r["lines"])
        print("  route %-6s %s  %d segments, %d points"
              % (r["ref"], r["color"], len(r["lines"]), pts))
    print("wrote %s (%.0f KB)" % (out_path, os.path.getsize(out_path) / 1024.0))


if __name__ == "__main__":
    main()
