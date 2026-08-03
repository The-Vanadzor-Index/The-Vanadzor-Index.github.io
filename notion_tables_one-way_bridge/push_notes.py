"""Step 7 — carry a card's free-text note into its Notion page body.

Upstream keeps prose (opening hours, prices, caveats) in the page body, not in a property,
and a CSV cannot represent that — which is why notes were dropped by the CSV pipeline.

**Only writes to pages whose body is empty.** Existing rows often carry hand-written notes
richer than anything the site holds, and appending blindly would either clobber them or
duplicate them on every run. The empty-body check is also what makes this idempotent: once
a note is written, the page is no longer empty and is skipped.

Notes are taken from the site card's ✎ row, via the same explicit title -> card mapping
apply_changes.py uses. Run with --commit; the default is a dry run.
"""
import csv
import json
import sys

import config
from apply_changes import CONTACTS_NEW
from notion_api import api

# title -> note, for rows whose note should not come from the card's ✎ row verbatim.
OVERRIDES = {}


def site_note(cards, card_name):
    parts = [r["text"].lstrip("✎ ").strip()
             for r in cards.get(card_name, {}).get("rows", [])
             if r["glyph"] == "✎"]
    return " ".join(p for p in parts if p).strip()


def body_is_empty(page_id):
    kids = api(f"https://api.notion.com/v1/blocks/{page_id}/children?page_size=5")
    return not kids["results"]


def main(commit):
    with open(config.SITE_CARDS, encoding="utf-8") as f:
        cards = {c["name"]: c for c in json.load(f)}
    keys = {r["Заголовок"]: r[config.KEY]
            for r in csv.DictReader(config.CONTACTS_FINAL.open(encoding="utf-8"))}

    planned, skipped = [], []
    for title, card_name, *_ in CONTACTS_NEW:
        note = OVERRIDES.get(title) or site_note(cards, card_name)
        if not note:
            continue
        key = keys.get(title)
        if not key:
            skipped.append((title, "no bridge key — not synced yet"))
            continue
        if not body_is_empty(key):
            skipped.append((title, "page body not empty — left alone"))
            continue
        planned.append((key, title, note))

    for _key, title, note in planned:
        print(f"  + {title:<34} {note[:70]!r}")
    for title, why in skipped:
        print(f"  · {title:<34} skipped: {why}")
    print(f"\n{len(planned)} to write, {len(skipped)} skipped")

    if not commit:
        print("\nDRY RUN — nothing written. Re-run with --commit.")
        return

    for key, title, note in planned:
        api(f"https://api.notion.com/v1/blocks/{key}/children",
            {"children": [{"object": "block", "type": "paragraph",
                           "paragraph": {"rich_text": [{"type": "text",
                                                        "text": {"content": note}}]}}]},
            "PATCH")
    print(f"written: {len(planned)}")


if __name__ == "__main__":
    main("--commit" in sys.argv)
