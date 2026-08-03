"""Step 2 — parse every .card in index.html into structured JSON.

The site has no data file; the DOM is the data. This is what lets a change described in
prose ("added Van Boulangerie") be filled in with the address, phone and links the card
already carries. Needs beautifulsoup4 + lxml; nothing else in the pipeline does.
"""
import json
from collections import Counter

from bs4 import BeautifulSoup, Comment

import config


def parse():
    soup = BeautifulSoup(config.INDEX_HTML.read_text(encoding="utf-8"), "lxml")
    cards = []
    for sec in soup.select("section.category"):
        cat = sec.get("data-cat", "")
        for sub in sec.select(".subgroup"):
            subname = sub.get("data-sub", "")
            for card in sub.select(".card"):
                comment = ""
                for node in card.previous_siblings:
                    if isinstance(node, Comment):
                        comment = str(node).strip()
                        break
                    if getattr(node, "name", None):
                        break
                name_el = card.select_one(".card-name")
                rows = []
                for r in card.select(".card-row"):
                    glyph = r.select_one(".glyph")
                    rows.append({
                        "glyph": glyph.get_text(strip=True) if glyph else "",
                        "text": r.get_text(" ", strip=True),
                        "links": [(a.get_text(strip=True), a.get("href", ""))
                                  for a in r.select("a")],
                    })
                cards.append({
                    "name": name_el.get_text(strip=True) if name_el else "",
                    "cat": cat,
                    "sub": subname,
                    "tags": [t.get_text(strip=True) for t in card.select(".card-tag")],
                    "geo": card.get("data-geo", ""),
                    "personal": card.get("data-personal", "") == "true",
                    "duplicate": "is a duplicate copy" in comment,
                    "search": card.get("data-search", ""),
                    "rows": rows,
                })
    return cards


if __name__ == "__main__":
    cards = parse()
    config.SITE_CARDS.write_text(
        json.dumps(cards, ensure_ascii=False, indent=1), encoding="utf-8")
    dupes = sum(c["duplicate"] for c in cards)
    print(f"cards parsed: {len(cards)}  (cross-referenced duplicates: {dupes}"
          f"  -> {len(cards) - dupes} countable entries)")
    print(f"personal contacts: {sum(c['personal'] for c in cards)}")
    for cat, n in Counter(c["cat"] for c in cards).items():
        print(f"   {cat}: {n}")
