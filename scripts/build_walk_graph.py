"""Build compact offline walking-routing graphs from OpenStreetMap.

Why this exists: a full offline turn-by-turn engine (Valhalla compiled to WASM) was measured
and rejected for this app - the WASM binary alone is 10.0 MB, and its graph tiles cannot be
generated without Docker and a large build host. Walking inside a city the traveller has
already downloaded is the common case, and it needs none of that: a pedestrian graph for a
city core is small enough to ship and A* over it runs fine in plain JavaScript.

Data: OpenStreetMap via Overpass, ODbL 1.0. Note overpass-api.de returns HTTP 406 to this
environment; overpass.kumi.systems answers normally, so that is the default endpoint.

Coordinates are stored as integers in units of 1e-5 degrees (about 1.1 m at the equator),
delta-encoded so consecutive values stay small in the emitted JavaScript.
"""

import json
import math
import os
import time
import urllib.parse
import urllib.request

# overpass-api.de answers HTTP 406 to this environment; these two answer normally. Both are
# listed because public Overpass mirrors return 504 under load often enough that a single
# endpoint makes the build unreproducible.
ENDPOINTS = (
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
)
SCALE = 100000.0

# One tight, genuinely walkable core per city rather than whole-city coverage: the graph must
# stay small enough to ship, and a traveller walks within a district, not across a metropolis.
AREAS = {
    "bangkok": {
        "label": "Bangkok (Siam / Sukhumvit)",
        "bbox": (13.735, 100.520, 13.765, 100.560),
    },
}

WALKABLE = ("footway|path|pedestrian|steps|living_street|residential|service|"
            "unclassified|tertiary|secondary|primary|track|cycleway|road")

QUERY = """[out:json][timeout:180];
(
  way["highway"~"^(%s)$"]["foot"!~"^(no|private)$"]["access"!~"^(private|no)$"](%f,%f,%f,%f);
);
out geom;"""


# Ways are fetched from a slightly larger box than the area we serve. Without this, ways are
# clipped at the boundary and the network fragments into islands that cannot route to each
# other - which is exactly how a plausible-looking graph silently fails on real journeys.
FETCH_BUFFER_DEG = 0.006  # roughly 650 m


def fetch(bbox):
    s, w, n, e = bbox
    b = FETCH_BUFFER_DEG
    q = QUERY % ((WALKABLE,) + (s - b, w - b, n + b, e + b))
    body = urllib.parse.urlencode({"data": q}).encode()

    last = None
    for attempt in range(3):
        for endpoint in ENDPOINTS:
            try:
                req = urllib.request.Request(endpoint, data=body)
                return json.loads(urllib.request.urlopen(req, timeout=300).read())
            except Exception as exc:  # 504s and resets are routine on public mirrors
                last = exc
                print("    %s failed (%s), trying next" % (endpoint.split("/")[2], exc))
        wait = 15 * (attempt + 1)
        print("    all endpoints failed, waiting %ds" % wait)
        time.sleep(wait)
    raise SystemExit("Overpass unavailable after retries: %s" % last)


def haversine(a_lat, a_lon, b_lat, b_lon):
    r = 6371000.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp = math.radians(b_lat - a_lat)
    dl = math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def build(doc):
    ways = [e for e in doc.get("elements", [])
            if e.get("type") == "way" and e.get("geometry") and e.get("nodes")
            and len(e["geometry"]) == len(e["nodes"])]

    # A node shared by two or more ways is a junction; a way's own ends are always junctions.
    usage = {}
    for w in ways:
        for nid in w["nodes"]:
            usage[nid] = usage.get(nid, 0) + 1

    junction = set()
    for w in ways:
        junction.add(w["nodes"][0])
        junction.add(w["nodes"][-1])
    for nid, count in usage.items():
        if count >= 2:
            junction.add(nid)

    vindex = {}
    vlat, vlon = [], []
    names, nindex = [], {}
    edges, glat, glon = [], [], []

    def vertex(nid, lat, lon):
        if nid not in vindex:
            vindex[nid] = len(vlat)
            vlat.append(int(round(lat * SCALE)))
            vlon.append(int(round(lon * SCALE)))
        return vindex[nid]

    def name_id(tags):
        nm = tags.get("name") or ""
        if not nm:
            return -1
        if nm not in nindex:
            nindex[nm] = len(names)
            names.append(nm)
        return nindex[nm]

    for w in ways:
        tags = w.get("tags", {})
        nid_list, geom = w["nodes"], w["geometry"]
        nm = name_id(tags)
        steps = 1 if tags.get("highway") == "steps" else 0

        start = 0
        while start < len(nid_list) - 1:
            end = start + 1
            while end < len(nid_list) - 1 and nid_list[end] not in junction:
                end += 1

            dist = 0.0
            for i in range(start, end):
                dist += haversine(geom[i]["lat"], geom[i]["lon"],
                                  geom[i + 1]["lat"], geom[i + 1]["lon"])

            if dist > 0:
                a = vertex(nid_list[start], geom[start]["lat"], geom[start]["lon"])
                b = vertex(nid_list[end], geom[end]["lat"], geom[end]["lon"])
                if a != b:
                    goff, glen = len(glat), 0
                    for i in range(start + 1, end):
                        glat.append(int(round(geom[i]["lat"] * SCALE)))
                        glon.append(int(round(geom[i]["lon"] * SCALE)))
                        glen += 1
                    edges.append([a, b, int(round(dist)), nm, steps, goff, glen])
            start = end

    return {"vlat": vlat, "vlon": vlon, "names": names,
            "edges": edges, "glat": glat, "glon": glon}


def prune_to_largest(g):
    """Keep only the largest connected component.

    A pedestrian network extracted from OSM always contains islands: mall walkways with no
    mapped link to the street, paths severed by a canal or an expressway, stubs clipped at the
    fetch boundary. If an endpoint snaps onto one of those, routing simply fails. Dropping them
    means we snap to a slightly more distant but genuinely reachable path instead, which is the
    honest behaviour - and it shrinks the shipped file.
    """
    n = len(g["vlat"])
    adj = [[] for _ in range(n)]
    for i in range(0, len(g["edges"])):
        a, b = g["edges"][i][0], g["edges"][i][1]
        adj[a].append(b)
        adj[b].append(a)

    seen = [False] * n
    best = []
    for s in range(n):
        if seen[s]:
            continue
        comp, stack = [], [s]
        seen[s] = True
        while stack:
            u = stack.pop()
            comp.append(u)
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append(v)
        if len(comp) > len(best):
            best = comp

    keep = set(best)
    remap = {}
    vlat, vlon = [], []
    for old in sorted(keep):
        remap[old] = len(vlat)
        vlat.append(g["vlat"][old])
        vlon.append(g["vlon"][old])

    edges, glat, glon = [], [], []
    for a, b, dist, nm, steps, goff, glen in g["edges"]:
        if a not in keep or b not in keep:
            continue
        new_off = len(glat)
        for i in range(goff, goff + glen):
            glat.append(g["glat"][i])
            glon.append(g["glon"][i])
        edges.append([remap[a], remap[b], dist, nm, steps, new_off, glen])

    used = sorted({e[3] for e in edges if e[3] >= 0})
    nmap = {old: i for i, old in enumerate(used)}
    names = [g["names"][old] for old in used]
    for e in edges:
        if e[3] >= 0:
            e[3] = nmap[e[3]]

    dropped = n - len(vlat)
    return ({"vlat": vlat, "vlon": vlon, "names": names,
             "edges": edges, "glat": glat, "glon": glon}, dropped)


def delta(xs):
    out, prev = [], 0
    for x in xs:
        out.append(x - prev)
        prev = x
    return out


def served_bbox(bbox):
    """The graph covers the buffered extent, not the nominal core, so declare that.

    The app decides "is this point covered?" from these bounds; understating them would
    refuse to route for journeys the data can actually handle.
    """
    s, w, n, e = bbox
    b = FETCH_BUFFER_DEG
    return (s - b, w - b, n + b, e + b)


def emit(key, area, g, out_dir):
    flat = []
    for e in g["edges"]:
        flat.extend(e)

    lines = [
        "// Generated by scripts/build_walk_graph.py - do not edit by hand.",
        "// %s. OpenStreetMap contributors, ODbL 1.0. Fetched %s."
        % (area["label"], time.strftime("%Y-%m-%d")),
        "// Coordinates are delta-encoded integers in units of 1e-5 degrees (~1.1 m).",
        "// Edges are flat groups of 7: [a, b, metres, nameIndex, isSteps, geomOffset, geomCount].",
        "// nameIndex -1 means the path genuinely has no name in OSM - most footways do not,",
        "// so directions must say \"turn left\" without inventing a street name.",
        "export const WALK_AREA = %s;" % json.dumps(
            {"key": key, "label": area["label"],
             "bbox": [round(v, 6) for v in served_bbox(area["bbox"])]},
            ensure_ascii=False),
        "export const WALK_NAMES = %s;" % json.dumps(g["names"], ensure_ascii=False),
        "export const WALK_VLAT = %s;" % json.dumps(delta(g["vlat"])),
        "export const WALK_VLON = %s;" % json.dumps(delta(g["vlon"])),
        "export const WALK_EDGES = %s;" % json.dumps(flat),
        "export const WALK_GLAT = %s;" % json.dumps(delta(g["glat"])),
        "export const WALK_GLON = %s;" % json.dumps(delta(g["glon"])),
        "",
    ]
    path = os.path.join(out_dir, "walk.%s.js" % key)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))
    return path


def emit_index(out_dir):
    """A tiny index so the app can answer "is this point covered?" without loading a graph.

    Generated rather than hand-kept: the bounds here must always match what the area files
    actually contain, and a stale copy would refuse or accept journeys incorrectly.
    """
    rows = [{"key": k, "label": a["label"],
             "bbox": [round(v, 6) for v in served_bbox(a["bbox"])]}
            for k, a in sorted(AREAS.items())]
    path = os.path.join(out_dir, "walk-index.js")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("// Generated by scripts/build_walk_graph.py - do not edit by hand.\n")
        fh.write("// Coverage index only. The graphs themselves load on demand.\n")
        fh.write("export const WALK_INDEX = %s;\n"
                 % json.dumps(rows, ensure_ascii=False, indent=2))
    return path


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(os.path.dirname(here), "js", "data")

    for key, area in AREAS.items():
        print("fetching %s ..." % key)
        doc = fetch(area["bbox"])
        g = build(doc)
        g, dropped = prune_to_largest(g)
        path = emit(key, area, g, out_dir)
        size = os.path.getsize(path)
        print("  dropped %d disconnected vertices" % dropped)
        print("  vertices: %d  edges: %d  names: %d  geometry points: %d"
              % (len(g["vlat"]), len(g["edges"]), len(g["names"]), len(g["glat"])))
        print("  wrote %s  (%.0f KB)" % (path, size / 1024.0))

    idx = emit_index(out_dir)
    print("wrote %s (%.1f KB)" % (idx, os.path.getsize(idx) / 1024.0))


if __name__ == "__main__":
    main()
