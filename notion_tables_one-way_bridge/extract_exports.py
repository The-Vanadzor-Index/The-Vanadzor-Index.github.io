"""Step 1 — read the two Notion export .zip files into plain CSVs.

`unzip` mangles the UTF-8 filenames under a non-UTF-8 locale and aborts, so the nested
archives are read in memory instead. The BOM on the first column header is stripped: left
in place, Notion reads `﻿Заголовок` as a different column from `Заголовок`.
"""
import csv
import io
import zipfile

import config


def extract(zip_path, out_path):
    outer = zipfile.ZipFile(zip_path)
    inner = zipfile.ZipFile(io.BytesIO(outer.read(outer.namelist()[0])))
    name = [n for n in inner.namelist() if n.endswith("_all.csv")][0]
    text = inner.read(name).decode("utf-8")
    had_bom = text.startswith("﻿")
    text = text.lstrip("﻿")
    out_path.write_text(text, encoding="utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    print(f"{out_path.name}: {len(rows)} rows, {len(rows[0])} columns, BOM stripped: {had_bom}")
    return rows


if __name__ == "__main__":
    extract(config.CONTACTS_ZIP, config.CONTACTS_RAW)
    extract(config.TRANSPORT_ZIP, config.TRANSPORT_RAW)
