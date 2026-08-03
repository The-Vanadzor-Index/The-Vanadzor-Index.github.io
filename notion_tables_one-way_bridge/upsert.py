"""Step 6 — push the CSVs into Notion, keyed on the bridge key.

Matched rows are PATCHed with **only the fields that actually differ** — a full-row
overwrite is far more destructive when a mapping is wrong, and the diff is the review.
Blank-key rows are created, then stamped with their own new page ID, which is written back
into the CSV so the next run recognises them.

Run with --commit; the default is a dry run. Read the dry run before committing: a second
dry run straight after a commit must report zero changes.
"""
import csv
import sys

import config
from notion_api import api, query_all, read, same, write


def main(commit):
    for t in config.TABLES:
        print(f"\n=== {t['name']}")
        schema = api(f"https://api.notion.com/v1/databases/{t['db']}")["properties"]
        if config.KEY not in schema:
            raise SystemExit(f"{t['name']} has no {config.KEY} column — run backfill_keys.py first")

        live = {}
        for p in query_all(t["db"]):
            props = {c: read(v) for c, v in p["properties"].items()}
            live[props[config.KEY]] = (p["id"], props)

        rows = list(csv.DictReader(t["csv"].open(encoding="utf-8")))
        cols = [c for c in rows[0] if c in schema and c != config.KEY]

        updates, creates, missing = [], [], []
        for r in rows:
            if not r[config.KEY]:
                creates.append(r)
            elif r[config.KEY] not in live:
                missing.append(r[t["title"]])
            else:
                pid, current = live[r[config.KEY]]
                diff = {c: r[c] for c in cols
                        if not same(schema[c]["type"], r[c], current.get(c, ""))}
                if diff:
                    updates.append((pid, r[t["title"]], diff))

        print(f"  CSV rows {len(rows)} | update {len(updates)} | create {len(creates)}"
              f" | key missing upstream {len(missing)}")
        if missing:
            # a key present in the CSV but not in Notion means the row was deleted
            # upstream, or the CSV is pointed at the wrong database
            print(f"  KEY NOT FOUND: {missing[:10]}")
        for _pid, name, diff in updates:
            shown = ", ".join(f"{k}={v[:28]!r}" for k, v in diff.items())
            print(f"   upd {name[:34]:<36} {shown[:104]}")
        for r in creates:
            print(f"   NEW {r[t['title']][:34]:<36} {r.get('Категория', '')}")

        if not commit:
            continue

        for pid, _name, diff in updates:
            api(f"https://api.notion.com/v1/pages/{pid}",
                {"properties": {c: write(schema[c]["type"], v) for c, v in diff.items()}},
                "PATCH")
        print(f"  updated {len(updates)}")

        for r in creates:
            props = {c: write(schema[c]["type"], r[c]) for c in cols if (r[c] or "").strip()}
            props[t["title"]] = write("title", r[t["title"]])
            page = api("https://api.notion.com/v1/pages",
                       {"parent": {"database_id": t["db"]}, "properties": props}, "POST")
            new_key = page["id"].replace("-", "")
            api(f"https://api.notion.com/v1/pages/{page['id']}",
                {"properties": {config.KEY: write("rich_text", new_key)}}, "PATCH")
            r[config.KEY] = new_key
        print(f"  created {len(creates)} (each stamped with its own new page ID)")

        if creates:
            with t["csv"].open("w", encoding="utf-8", newline="") as f:
                w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
                w.writeheader()
                w.writerows(rows)
            print(f"  wrote new keys back into {t['csv'].name} — commit this file")

    if not commit:
        print("\nDRY RUN — nothing written. Re-run with --commit.")


if __name__ == "__main__":
    main("--commit" in sys.argv)
