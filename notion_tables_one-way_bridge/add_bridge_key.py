"""Step 4 — give every row a The-Vanadzor-Index_Bridge_Key and write the push files.

The key is the row's own Notion page ID. Two sources, in this order:

1. **The previous final CSV.** Rows created by an earlier sync got their key stamped in
   after Notion assigned the page ID — that key exists nowhere else. Regenerating from the
   export alone would leave them blank, and a blank key means "create", so every one of
   them would be duplicated upstream. This file is the key store; keep it committed.
2. **The export's .md filenames**, whose 32-hex suffix is the page ID, for rows that were
   in the export.

Rows sharing a title are told apart by their other field values. Anything still unmatched
gets a blank key and will be created upstream.
"""
import csv
import io
import re
import zipfile

import config
from notion_api import score


def export_pages(zip_path):
    """title -> [(page_id, {prop: value}), ...] from the export's per-row .md pages."""
    outer = zipfile.ZipFile(zip_path)
    inner = zipfile.ZipFile(io.BytesIO(outer.read(outer.namelist()[0])))
    out = {}
    for n in inner.namelist():
        m = re.search(r"([0-9a-f]{32})\.md$", n)
        if not n.endswith(".md") or not m:
            continue
        lines = [l.strip() for l in inner.read(n).decode("utf-8").splitlines() if l.strip()]
        title = lines[0].lstrip("# ").strip() if lines else ""
        props = {}
        for l in lines[1:]:
            kv = re.match(r"^([А-Яа-яA-Za-z0-9 ]+):\s*(.*)$", l)
            if kv:
                props[kv.group(1).strip()] = kv.group(2).strip()
        out.setdefault(title.strip(), []).append((m.group(1), props))
    return out


def previous_keys(csv_path, title_col):
    """title -> [(key, row), ...] from the last run's push file, if there is one."""
    out = {}
    if not csv_path.exists():
        return out
    for r in csv.DictReader(csv_path.open(encoding="utf-8")):
        if r.get(config.KEY):
            out.setdefault(r[title_col].strip(), []).append((r[config.KEY], r))
    return out


def annotate(src, dest, zip_path, title_col, match_cols):
    rows = list(csv.DictReader(src.open(encoding="utf-8")))
    fields = [config.KEY] + list(rows[0].keys())

    prev = previous_keys(dest, title_col)
    # export .md headings are stripped; four CSV titles carry a trailing space
    exported = export_pages(zip_path)

    groups = {}
    for r in rows:
        groups.setdefault(r[title_col].strip(), []).append(r)

    used, from_prev, from_export, blank = set(), 0, 0, 0
    for title, group in groups.items():
        cands = [(k, props, "prev") for k, props in prev.get(title, [])]
        seen = {k for k, _, _ in cands}
        cands += [(pid, props, "export") for pid, props in exported.get(title, [])
                  if pid not in seen]
        cands = [c for c in cands if c[0] not in used]

        pairs = sorted(
            ((score(r, props, match_cols), i, j)
             for i, r in enumerate(group)
             for j, (_k, props, _src) in enumerate(cands)),
            key=lambda t: -t[0])
        taken_r, taken_c = set(), set()
        for _s, i, j in pairs:
            if i in taken_r or j in taken_c:
                continue
            key, _props, origin = cands[j]
            group[i][config.KEY] = key
            used.add(key)
            taken_r.add(i)
            taken_c.add(j)
            if origin == "prev":
                from_prev += 1
            else:
                from_export += 1
        for i, r in enumerate(group):
            if i not in taken_r:
                r[config.KEY] = ""
                blank += 1

    with dest.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    keys = [r[config.KEY] for r in rows if r[config.KEY]]
    unique = len(set(keys)) == len(keys)
    print(f"{dest.name}: {len(rows)} rows | keyed {len(keys)}"
          f" (carried over {from_prev}, from export {from_export}) | blank {blank}")
    print(f"   unique keys: {len(set(keys))} of {len(keys)} -> {'OK' if unique else 'COLLISION'}")
    if not unique:
        raise SystemExit("duplicate keys — refusing to write a file that would corrupt rows")


if __name__ == "__main__":
    annotate(config.CONTACTS_EDITED, config.CONTACTS_FINAL, config.CONTACTS_ZIP,
             "Заголовок", config.TABLES[0]["match"])
    annotate(config.TRANSPORT_EDITED, config.TRANSPORT_FINAL, config.TRANSPORT_ZIP,
             "Name", config.TABLES[1]["match"])
