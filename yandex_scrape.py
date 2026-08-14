#!/usr/bin/env python3
"""Look up a place on Yandex Maps and print card-ready data for it.

Two ways in:

    python3 yandex_scrape.py --search "Vardanants Street 23, Vanadzor"
    python3 yandex_scrape.py --url https://yandex.com/maps/org/7900884792/
    python3 yandex_scrape.py --oid 7900884792

--search hits Yandex's own search inside the Vanadzor region and lists what
it finds; add --pick N (1-based) to scrape one of several matches in the
same run. --url/--oid go straight to an org page when the link is already
known and only the rest of the fields are missing.

Prints a human-readable summary plus a ready-to-paste `.card` block in the
same shape as src/cards/*.html. Nothing is written to the repo — copy the
block into the right category file and subgroup by hand, the way every
other card is added (see CLAUDE.md), fill in data-cat and trim rows to
match house style (a card with a Map row usually skips inline phone/address
since the map panel already has them), and log the addition in
SOURCE-SYNC.md. --json prints the normalized fields instead, for scripting.
"""
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126 Safari/537.36"
)
VANADZOR_SEARCH_BASE = "https://yandex.com/maps/10258/vanadzor/search/"
ORG_BASE = "https://yandex.com/maps/org/"
# Vanadzor sits near 40.81, 44.49 -- anything outside this box is a bad
# parse, not a distant entry (same box CLAUDE.md's coordinate snippet uses).
VANADZOR_BOX = (38.8, 41.4, 43.4, 46.7)
# Tighter box for sieving search hits: Vanadzor plus the Lori villages the
# index reaches into (Gyulagarak, Arjut, Gugark, Darpas). lat_lo, lat_hi,
# lon_lo, lon_hi.
REGION_BOX = (40.74, 40.99, 44.30, 44.60)

OID_RE = re.compile(r"(\d{6,})")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8", "replace")


def iter_business_objects(html: str):
    """Every embedded org record on the page, in document order.

    Yandex ships the page's own data as one giant JSON blob inline. Rather
    than parse that whole blob (its shape is undocumented and changes),
    anchor on the literal `{"type":"business"` that opens each org record
    and let json.JSONDecoder read one well-formed value from there -- it
    already understands string escaping, so this doesn't break on an
    address or a review that happens to contain a brace.
    """
    dec = json.JSONDecoder()
    for m in re.finditer(r'\{"type":"business"', html):
        try:
            obj, _ = dec.raw_decode(html, m.start())
        except json.JSONDecodeError:
            continue
        yield obj


def org_url(oid: str) -> str:
    return f"{ORG_BASE}{oid}/"


def normalize(obj: dict) -> dict:
    oid = obj.get("id", "")
    coords = obj.get("displayCoordinates") or obj.get("coordinates")
    geo = None
    if coords and len(coords) == 2:
        lon, lat = coords  # Yandex prints [lon, lat]; data-geo wants lat,lon
        geo = f"{lat},{lon}"
    categories = [c["name"] for c in obj.get("categories", []) if c.get("name")]
    phones = [p["number"] for p in obj.get("phones", []) if p.get("number")]
    social = [
        {"type": s.get("type"), "href": s.get("href")}
        for s in obj.get("socialLinks", [])
        if s.get("href")
    ]
    return {
        "oid": oid,
        "map_url": org_url(oid) if oid else None,
        "name": obj.get("title") or obj.get("shortTitle"),
        "address": obj.get("fullAddress") or obj.get("address"),
        "geo": geo,
        "categories": categories,
        "phones": phones,
        "hours_text": obj.get("workingTimeText"),
        "status": obj.get("status"),
        "rating": obj.get("ratingData"),
        "social": social,
    }


def geo_warning(geo: str) -> str | None:
    if not geo:
        return None
    lat, lon = (float(x) for x in geo.split(","))
    lat_lo, lat_hi, lon_lo, lon_hi = VANADZOR_BOX
    if not (lat_lo <= lat <= lat_hi and lon_lo <= lon <= lon_hi):
        return f"coordinates {geo} fall outside the Vanadzor box -- likely a bad parse"
    return None


def in_region(entry: dict) -> bool:
    """Is this hit anywhere near Vanadzor?

    The /10258/vanadzor/ prefix on the search URL is a hint, not a filter --
    a query Yandex can't place locally happily comes back with results in
    Yerevan, or in Dubai. Anything outside REGION_BOX is noise.
    """
    if not entry["geo"]:
        return False
    lat, lon = (float(x) for x in entry["geo"].split(","))
    lat_lo, lat_hi, lon_lo, lon_hi = REGION_BOX
    return lat_lo <= lat <= lat_hi and lon_lo <= lon <= lon_hi


def search(query: str, all_regions: bool = False):
    # safe="" matters: the query is a path segment, and Vanadzor house
    # numbers are full of slashes ("Myasnikyan St. 3A/1"). quote()'s default
    # safe="/" would leave those alone, splitting the query across path
    # segments and 404ing.
    url = VANADZOR_SEARCH_BASE + urllib.parse.quote(query, safe="") + "/"
    html = fetch(url)
    hits, seen = [], set()
    for obj in iter_business_objects(html):
        entry = normalize(obj)
        # Yandex repeats a business across result blocks; one row per org.
        if entry["oid"] in seen:
            continue
        seen.add(entry["oid"])
        if all_regions or in_region(entry):
            hits.append(entry)
    return hits


def scrape_one(oid: str):
    html = fetch(org_url(oid))
    for obj in iter_business_objects(html):
        if obj.get("id") == oid:
            return normalize(obj)
    # org page embeds exactly one business in practice; fall back to the
    # first match if the id ever doesn't line up (e.g. a redirected oid)
    for obj in iter_business_objects(html):
        return normalize(obj)
    return None


def scrape_page(url: str):
    """Whatever business a Yandex Maps URL of any shape resolves to.

    The index links to more than bare /org/<id>/ pages: /org/<slug>/<id>,
    the short /maps/-/<code> form, /geo/<id>, /<region>/<city>/house/<code>
    and /stops/<code>. Only some of those name a business at all -- a house
    or a stop is a place, not an org -- so this returns None rather than
    guessing when the page carries no org record.
    """
    html = fetch(url)
    for obj in iter_business_objects(html):
        return normalize(obj)
    return None


def oid_from(url_or_oid: str) -> str:
    m = OID_RE.search(url_or_oid)
    if not m:
        raise SystemExit(f"couldn't find an org id in {url_or_oid!r}")
    return m.group(1)


def print_summary(entry: dict):
    print(f"{entry['name']}  ({entry['oid']})")
    if entry["categories"]:
        print(f"  category   {', '.join(entry['categories'])}")
    if entry["address"]:
        print(f"  address    {entry['address']}")
    if entry["geo"]:
        print(f"  data-geo   {entry['geo']}")
        warn = geo_warning(entry["geo"])
        if warn:
            print(f"  WARNING    {warn}")
    if entry["phones"]:
        print(f"  phones     {', '.join(entry['phones'])}")
    if entry["hours_text"]:
        print(f"  hours      {entry['hours_text']}")
    if entry["status"]:
        print(f"  status     {entry['status']}")
    if entry["rating"] and entry["rating"].get("reviewCount"):
        r = entry["rating"]
        print(f"  rating     {r.get('ratingValue')} ({r.get('reviewCount')} reviews)")
    for s in entry["social"]:
        print(f"  {s['type']:<10} {s['href']}")
    print(f"  map        {entry['map_url']}")


GLYPH = {"map": "↳", "address": "⌂", "phone": "☎", "link": "⌁"}


def build_card(entry: dict) -> str:
    rows = []
    rows.append(
        f'              <div class="card-row">\n'
        f'                <span class="glyph">{GLYPH["map"]}</span\n'
        f'                ><a\n'
        f'                  href="{entry["map_url"]}"\n'
        f'                  rel="noopener"\n'
        f'                  target="_blank"\n'
        f'                  >Map ↗</a\n'
        f'                >\n'
        f'              </div>'
    )
    if entry["address"]:
        rows.append(
            f'              <div class="card-row">\n'
            f'                <span class="glyph">{GLYPH["address"]}</span\n'
            f'                ><span>{entry["address"]}</span>\n'
            f'              </div>'
        )
    for phone in entry["phones"]:
        rows.append(
            f'              <div class="card-row">\n'
            f'                <span class="glyph">{GLYPH["phone"]}</span\n'
            f'                ><span><a href="tel:{phone.replace(" ", "")}">{phone}</a></span>\n'
            f'              </div>'
        )
    for s in entry["social"]:
        label = s["type"].capitalize()
        rows.append(
            f'              <div class="card-row">\n'
            f'                <span class="glyph">{GLYPH["link"]}</span\n'
            f'                ><a\n'
            f'                  href="{s["href"]}"\n'
            f'                  rel="noopener"\n'
            f'                  target="_blank"\n'
            f'                  >{label} ↗</a\n'
            f'                >\n'
            f'              </div>'
        )

    tag = entry["categories"][0] if entry["categories"] else "TODO"
    search_terms = [entry["name"] or "", entry["map_url"] or "", tag]
    search_terms += entry["phones"]
    if entry["address"]:
        search_terms.append(entry["address"])
    data_search = " ".join(t for t in search_terms if t).lower()

    geo_attr = f'\n              data-geo="{entry["geo"]}"' if entry["geo"] else ""
    return (
        f'            <div\n'
        f'              class="card"\n'
        f'              data-cat="TODO"{geo_attr}\n'
        f'              data-search="{data_search}"\n'
        f'            >\n'
        f'              <div class="card-name">{entry["name"]}</div>\n'
        f'              <span class="card-tag">{tag}</span>\n'
        + "\n".join(rows)
        + "\n            </div>"
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--search", metavar="QUERY", help="address or name to search for, inside Vanadzor")
    src.add_argument("--url", help="a yandex.com/maps/org/... link")
    src.add_argument("--oid", help="a bare Yandex org id")
    ap.add_argument("--pick", type=int, metavar="N", help="with --search: scrape result N (1-based) instead of just listing")
    ap.add_argument("--all-regions", action="store_true", help="with --search: keep hits outside the Vanadzor/Lori box too")
    ap.add_argument("--json", action="store_true", help="print normalized fields as JSON instead of a card block")
    args = ap.parse_args()

    if args.search:
        try:
            results = search(args.search, all_regions=args.all_regions)
        except urllib.error.URLError as e:
            raise SystemExit(f"search failed: {e}")
        if not results:
            raise SystemExit(
                "no results near Vanadzor"
                + ("" if args.all_regions else " (try --all-regions)")
            )
        if args.pick is None:
            for i, r in enumerate(results, 1):
                print(f"{i}. {r['name']} -- {r['address']}  ({r['map_url']})")
            print("\nrerun with --pick N to scrape one of these", file=sys.stderr)
            return
        if not (1 <= args.pick <= len(results)):
            raise SystemExit(f"--pick must be between 1 and {len(results)}")
        entry = results[args.pick - 1]
        # the search snippet is missing fields (e.g. socialLinks) that the
        # org page itself carries -- refetch by oid for the full record
        time.sleep(1)
        entry = scrape_one(entry["oid"]) or entry
    else:
        oid = args.oid or oid_from(args.url)
        entry = scrape_one(oid)
        if entry is None:
            raise SystemExit("couldn't find an org record on that page")

    if args.json:
        print(json.dumps(entry, ensure_ascii=False, indent=2))
    else:
        print_summary(entry)
        print()
        print(build_card(entry))


if __name__ == "__main__":
    main()
