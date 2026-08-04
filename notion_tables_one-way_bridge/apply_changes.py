"""Step 3 — apply a batch of site-side changes to the extracted CSVs.

THE TWO TABLES BELOW ARE A PER-BATCH PAYLOAD, NOT PERMANENT CONFIGURATION. They hold the
2026-08 batch (from `что изменилось.txt`) as a worked example of the shape. For the next
sync, replace their contents with that batch's changes and re-run; the surrounding code
does not change.

Everything is declared as data so the diff can be audited without reading logic. Each edit
is matched against exactly one existing row — a title matching zero or several rows is
reported as SKIPPED rather than guessed at.
"""
import csv
import json

import config

with open(config.SITE_CARDS, encoding="utf-8") as f:
    SITE = {c["name"]: c for c in json.load(f)}
report = []


def site_links(name):
    """{map: url, web: [url, ...]} for a site card."""
    out = {"map": "", "web": []}
    for r in SITE.get(name, {}).get("rows", []):
        for _text, href in r["links"]:
            if href.startswith("tel:"):
                continue
            if "yandex.com/maps" in href or "goo.gl" in href:
                out["map"] = out["map"] or href
            else:
                out["web"].append(href)
    return out


def site_phones(name):
    seen = []
    for r in SITE.get(name, {}).get("rows", []):
        for _text, href in r["links"]:
            if href.startswith("tel:") and href[4:] not in seen:
                seen.append(href[4:])
    return seen


# --------------------------------------------------------------- Контакты
# Адрес is a `url` property in Notion, so a street address cannot share it with a map
# link — hence the separate `Адрес текстом`. Contacts ships with only Телефон/Телефон 2;
# Телефон 3/4 are added to match the Транспорт schema.
CONTACTS_FIELDS = [
    "Заголовок", "Адрес", "Адрес текстом", "Для туристов", "Категория", "Метки",
    "Подкатегория", "Ссылка", "Телефон", "Телефон 2", "Телефон 3", "Телефон 4",
]

CONTACTS_EDITS = {
    "Государственный драматический театр": {
        "Адрес": "https://yandex.com/maps/-/CTrovMOs",
        "Телефон": "+37498821244",
        "Ссылка": "https://abelyantheatre.am",
    },
    "Дворец культуры имени Шарля Азнавура": {
        "Адрес текстом": "Тигран Мец, 2",
        "Телефон": "+37432220505",
        "Телефон 2": "+37491340282",
        "Телефон 3": "+37493340282",
        "Ссылка": "https://www.facebook.com/779718618741686",
    },
    "Zeppelin": {
        "Адрес": "https://yandex.com/maps/-/CTvVu21e",
        "Адрес текстом": "пр. Тигран Мец, 20/1",
        "Телефон": "+37498279193",
        "Ссылка": "https://www.instagram.com/zeppubarmenia",
    },
    "Lumo by Salori": {"Телефон": "+37477444049"},
    "Bar B.Q.": {
        "Адрес": "https://yandex.com/maps/org/bar_b_q_vanadzor/171378021289",
        "Адрес текстом": "Тигран Мец, 36",
    },
    "Dr. Sara — массаж, косметология": {
        "Адрес": "https://yandex.com/maps/org/dr_sara/87870673206",
        "Адрес текстом": "Мовсес Хоренаци, 8",
        "Телефон": "+37493036906",
        "Ссылка": "https://www.instagram.com/dr.sara_aesthetic",
    },
    "Нотариусы": {
        "Адрес": "https://yandex.com/maps/org/176804040579",
        "Адрес текстом": "Тигран Мец, 22",
        "Телефон": "+37496999102",
        "Ссылка": "https://www.e-notary.am/ru/staff/browse",
    },
    "Dens Clinic, Ваграм Никогосян": {"Телефон": "+37477951093"},
    "Газовая служба": {"Телефон 3": "+37432230494", "Телефон 4": "+37410294904"},
    "VNS Fitness, йога": {"Подкатегория": "Фитнес"},
    "Mandala Yoga and Health Center": {"Подкатегория": "Фитнес"},
}

# (Заголовок, matching site card name, Категория, Подкатегория, street address)
CONTACTS_NEW = [
    ("Van Boulangerie", "Van Boulangerie", "Еда", "Кафе", "Лазян, 33А"),
    ("Van Restaurant", "Van Restaurant", "Еда", "Ресторан", "Абовян, 104"),
    ("Skutegh Cafe-Restaurant", "Skutegh Cafe-Restaurant", "Еда", "Ресторан", "Григор Лусаворич, 53"),
    ("Second Floor by Asteri", "Second Floor by Asteri", "Еда", "Ресторан", "Мясникян, 5/5"),
    ("L'avenue Café/Bakery", "L'avenue Café/Bakery", "Еда", "Кафе", "Тигран Мец, 41"),
    ("Danielyan Sweets/Bakery", "Danielyan Sweets/Bakery", "Еда", "Кафе", "Тигран Мец, 77/7"),
    ("Artsakh Café", "Artsakh Café", "Еда", "Кафе", "М. Мкртчян, 4, Арцах Пурак"),
    ("Artsakh Café 3rd Floor (бар)", "Artsakh Café 3rd Floor (Bar)", "Еда", "Кафе, Бар", "М. Мкртчян, 4, Арцах Пурак"),
    ("Venezia Café", "Venezia Café", "Еда", "Кафе", "Саят Нова, 24"),
    ("V&V Hotel", "V&V Hotel", "Гостиницы", "Отель", "Гюлагарак"),
    ("Angine Resort", "Angine Resort", "Гостиницы", "Отель", "село Арджут"),
    ("Salute A Frame House / Cottage", "Salute A Frame House / Cottage", "Гостиницы", "Гестхаус", "село Дарпас, 7-я улица"),
    ("Lakes (катание на лодке)", "Lakes (riding a boat)", "Досуг", "Досуг", "Зоравар Андраник"),
    ("LOFT Coworking Place/Gamezone", "LOFT Coworking Place/Gamezone", "Досуг", "Досуг", "Тигран Мец, 24"),
    ("Tonus Fitness", "Tonus Fitness", "Досуг", "Фитнес", "Вардананц, 35"),
    ("Lady Fit (только для женщин)", "Lady Fit (only women)", "Досуг", "Фитнес", "Вардананц, 122/7"),
    ("Парк Саят-Нова", "Sayat Nova Park", "Досуг", "Достопримечательность / Туризм", "Мхитар Гераци, 17"),
    ("Парк химиков", "Chemical Worker's Park", "Досуг", "Достопримечательность / Туризм", "проспект Тигран Мец"),
    ("Парк Солидарности", "Solidarity Park", "Досуг", "Достопримечательность / Туризм", "Тигран Мец, 14"),
    ("Привокзальный парк", "Station Park", "Досуг", "Достопримечательность / Туризм", "Гр. Лусаворич, 32"),
    ("Минеральный источник Тту Джур", "Mineral Fountain Tetuh Djour", "Досуг", "Достопримечательность / Туризм", "Тигран Мец, 52"),
    ("Площадь Арцаха", "Artsakh Square", "Досуг", "Достопримечательность / Туризм", "Тигран Мец, 34"),
    # 2026-08-04. Added to the site on 2026-08-01 but left out of the batch above, because it
    # was never written into SOURCE-SYNC.md and so was invisible when that batch was compiled.
    ("Александр — химчистка мебели, матрасов, автомобильных сидений",
     "Alexander — furniture, mattress, and car-seat dry cleaning",
     "Мастера и услуги", "Клининг", ""),
]

# --------------------------------------------------------------- Транспорт
TRANSPORT_FIELDS = [
    "Name", "Android", "iOS", "Адрес", "Детали", "Категория", "Ссылка",
    "Телефон", "Телефон 2", "Телефон 3", "Телефон 4", "Цены",
]
TRANSPORT_EDITS = {
    "Arpi Taxi": {"Категория": "Такси"},
    "Маршрутка Ереван – Тбилиси": {"Телефон 3": "+995593229554", "Телефон 4": "+995592408800"},
    "Ванадзор – Ташир": {"Телефон 3": "+37495175195"},
}
TRANSPORT_NEW = [{
    "Name": "Yandex Go",
    "Категория": "Такси",
    "Телефон": "+37410770770",
    "Ссылка": "https://go.yandex/en_am/",
    "Android": "https://play.google.com/store/apps/details?id=ru.yandex.taxi",
    "iOS": "https://apps.apple.com/us/app/yandex-go-taxi-food-delivery/id472650686",
    "Детали": "📱 Есть приложение",
}]


def apply_edits(rows, key_col, edits, label=""):
    by_title = {}
    for r in rows:
        by_title.setdefault(r[key_col], []).append(r)
    for title, changes in edits.items():
        hits = by_title.get(title, [])
        if len(hits) != 1:
            report.append(("!! SKIPPED", title, f"matched {len(hits)} rows, expected 1"))
            continue
        for col, new in changes.items():
            old = hits[0].get(col, "")
            if old != new:
                hits[0][col] = new
                report.append((f"edit{label}", title, f"{col}: {old!r} -> {new!r}"))
    return by_title


def main():
    rows = list(csv.DictReader(config.CONTACTS_RAW.open(encoding="utf-8")))
    for r in rows:
        for extra in ("Адрес текстом", "Телефон 3", "Телефон 4"):
            r.setdefault(extra, "")
    by_title = apply_edits(rows, "Заголовок", CONTACTS_EDITS)

    for title, sname, cat, sub, addr in CONTACTS_NEW:
        if title in by_title:
            report.append(("!! SKIPPED", title, "already present in CSV"))
            continue
        links, phones = site_links(sname), site_phones(sname)
        new = {f: "" for f in CONTACTS_FIELDS}
        new.update({"Заголовок": title, "Категория": cat, "Подкатегория": sub,
                    "Адрес": links["map"], "Адрес текстом": addr,
                    "Ссылка": links["web"][0] if links["web"] else "",
                    "Для туристов": "No"})
        for i, p in enumerate(phones[:4]):
            new["Телефон" if i == 0 else f"Телефон {i + 1}"] = p
        rows.append(new)
        extra = f"  [links with no column: {links['web'][1:]}]" if len(links["web"]) > 1 else ""
        report.append(("ADD", title, f"{cat}/{sub} | {(addr or links['map'])[:46]}"
                                     f" | тел={phones or '—'}{extra}"))

    with config.CONTACTS_EDITED.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CONTACTS_FIELDS)
        w.writeheader()
        w.writerows(rows)

    trows = list(csv.DictReader(config.TRANSPORT_RAW.open(encoding="utf-8")))
    tby = apply_edits(trows, "Name", TRANSPORT_EDITS, " (T)")
    for n in TRANSPORT_NEW:
        if n["Name"] in tby:
            report.append(("!! SKIPPED", n["Name"], "already present"))
            continue
        row = {f: "" for f in TRANSPORT_FIELDS}
        row.update(n)
        trows.append(row)
        report.append(("ADD (T)", n["Name"], f"{n['Категория']} | {n['Телефон']}"))

    with config.TRANSPORT_EDITED.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=TRANSPORT_FIELDS)
        w.writeheader()
        w.writerows(trows)

    for kind, title, detail in report:
        print(f"{kind:<12} {title:<38} {detail}")
    skipped = sum(1 for k, _, _ in report if k.startswith("!!"))
    print(f"\nКонтакты: {len(rows)} rows   Транспорт: {len(trows)} rows   skipped: {skipped}")
    if skipped:
        raise SystemExit("some changes did not apply — fix them before syncing")


if __name__ == "__main__":
    main()
