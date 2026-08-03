"""Step 5 — one-time per database: create the new properties and fill in the bridge keys.

Only needed the first time a database is synced (or after it is re-duplicated for a
rehearsal). Until Notion rows carry the key, step 6 would match nothing and create a
second copy of every row.

Live rows are matched to CSV rows by title, and for titles shared by several rows by their
other field values. Run with --commit; the default is a dry run.

Every key written is then **re-read and re-written until it sticks** — see verify(). This is
the one step with no verification of its own downstream: upsert.py's mandated second dry run
would catch a key it had dropped, but nothing catches a key this step dropped except the
`KEY NOT FOUND` line on the *first* upsert dry run, which is easy to read as a stale CSV.
"""
import csv
import sys

import config
from notion_api import api, query_all, read, score, write

# How many times to re-read and re-PATCH keys that did not land before giving up.
VERIFY_ROUNDS = 3

NEW_PROPS = {
    "Контакты и база знаний": {
        config.KEY: {"rich_text": {}},
        "Адрес текстом": {"rich_text": {}},
        "Телефон 3": {"phone_number": {}},
        "Телефон 4": {"phone_number": {}},
    },
    "Транспорт и доставка": {config.KEY: {"rich_text": {}}},
}


def verify(db, plan, rounds=VERIFY_ROUNDS):
    """Re-read every key that was written, and re-write the ones that did not land.

    Notion answers a PATCH 200 and then occasionally does not persist it: measured once in
    303 writes on a beta table, at write #59 — mid-run, so not a just-created-property lag —
    with no error raised anywhere. A write's own response is therefore not evidence that it
    took; only a later read is. That row kept a blank key, and step 6 declined to update or
    create it, so it would simply have gone unsynced.

    The check is a whole-database re-query (a few paginated reads) rather than one GET per
    page, so it costs almost nothing next to the writes it is checking. Anything still
    missing after the retries stops the script — reporting "written N" for keys that are not
    there is the failure this exists to prevent.
    """
    want = dict(plan)
    for attempt in range(rounds + 1):
        live = {p["id"]: read(p["properties"][config.KEY])
                for p in query_all(db) if config.KEY in p["properties"]}
        bad = [(pid, key) for pid, key in want.items() if live.get(pid, "") != key]
        if not bad:
            print(f"  verified {len(want)}/{len(want)} keys by re-reading them")
            return
        if attempt == rounds:
            break
        print(f"  {len(bad)} key(s) did not land — rewriting"
              f" (round {attempt + 1}/{rounds}): {[p for p, _ in bad[:5]]}")
        for pid, key in bad:
            api(f"https://api.notion.com/v1/pages/{pid}",
                {"properties": {config.KEY: write("rich_text", key)}}, "PATCH")
    raise SystemExit(
        f"{len(bad)} key(s) still absent after {rounds} rewrites: {[p for p, _ in bad[:10]]}\n"
        "Do not run upsert.py until this is resolved — those rows would go unsynced.")


def main(commit):
    for t in config.TABLES:
        print(f"\n=== {t['name']}")
        schema = api(f"https://api.notion.com/v1/databases/{t['db']}")["properties"]
        todo = {k: v for k, v in NEW_PROPS[t["name"]].items() if k not in schema}
        if todo:
            print(f"  properties to create: {list(todo)}")
            if commit:
                api(f"https://api.notion.com/v1/databases/{t['db']}",
                    {"properties": todo}, "PATCH")
                print("  created")
        else:
            print("  properties already present")

        live = [(p["id"], {c: read(v) for c, v in p["properties"].items()})
                for p in query_all(t["db"])]
        rows = [r for r in csv.DictReader(t["csv"].open(encoding="utf-8")) if r[config.KEY]]

        live_by, csv_by = {}, {}
        for pid, props in live:
            live_by.setdefault(props[t["title"]].strip(), []).append((pid, props))
        for r in rows:
            csv_by.setdefault(r[t["title"]].strip(), []).append(r)

        plan, unmatched = [], []
        for title, group in live_by.items():
            cands = csv_by.get(title, [])
            if not cands:
                unmatched += [title for _ in group]
                continue
            pairs = sorted(((score(c, props, t["match"]), i, j)
                            for i, (_pid, props) in enumerate(group)
                            for j, c in enumerate(cands)), key=lambda x: -x[0])
            taken_r, taken_c = set(), set()
            for _s, i, j in pairs:
                if i in taken_r or j in taken_c:
                    continue
                plan.append((group[i][0], cands[j][config.KEY]))
                taken_r.add(i)
                taken_c.add(j)
            unmatched += [title for i in range(len(group)) if i not in taken_r]

        keys = [k for _, k in plan]
        print(f"  live rows {len(live)} | will key {len(plan)} | unmatched {len(unmatched)}")
        print(f"  distinct keys: {len(set(keys))} of {len(keys)}"
              f" -> {'OK' if len(set(keys)) == len(keys) else 'COLLISION'}")
        if unmatched:
            print(f"  UNMATCHED (will stay blank): {unmatched[:10]}")
        if len(set(keys)) != len(keys):
            raise SystemExit("refusing to write duplicate keys")

        if commit:
            for n, (pid, key) in enumerate(plan, 1):
                api(f"https://api.notion.com/v1/pages/{pid}",
                    {"properties": {config.KEY: write("rich_text", key)}}, "PATCH")
                if n % 50 == 0:
                    print(f"    {n}/{len(plan)}")
            print(f"  PATCHed {len(plan)} — verifying")
            verify(t["db"], plan)

    if not commit:
        print("\nDRY RUN — nothing written. Re-run with --commit.")


if __name__ == "__main__":
    main("--commit" in sys.argv)
