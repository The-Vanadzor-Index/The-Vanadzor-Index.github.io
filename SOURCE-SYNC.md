# Source sync log

`index.html` is downstream of two Notion databases (see the footer/README links). Entries are
added or corrected here first, which means the upstream databases drift out of date unless the
same edits are replayed there by hand.

**Every content change to `index.html` — a card added, edited, or removed — gets an entry in this
file**, with enough detail to reproduce it in Notion without re-reading the HTML diff. Structural,
styling, and JS changes do not belong here.

## Which database

| Site categories | Notion database |
| --- | --- |
| Taxis, shared taxis, transfers, marshrutkas, freight, vehicle rental, delivery | **Транспорт и доставка** |
| Everything else (medicine, government services, repair services, food, hotels, things to do) | **Контакты и база знаний** |

## Format

One `###` heading per change, newest first, under a `##` date heading (ISO, `YYYY-MM-DD`). Give the
Notion field values in Russian, matching the column names in that database — not the English site
labels — so a row can be pasted in directly. Leave out fields that are empty.

Mark a change `Synced: yes` once it has been applied upstream; entries default to `Synced: no`.
Changes that intentionally live only on the site (cross-referenced duplicate cards, English-only
wording) are `Synced: n/a` with a one-line reason.

An **added** entry creates a new row in a database whose sole maintainer is etonawa, so it is
pushed only once etonawa has agreed to it — log it here as usual, and leave it `Synced: no` until
then.
**Edited** entries are corrections to rows that already exist upstream and need no such agreement.

```markdown
## 2026-08-01

### Added — Example Business (Контакты и база знаний)
Synced: no

- Заголовок: Example Business
- Категория: Мастера и услуги
- Подкатегория: Ремонт техники
- Адрес: https://yandex.com/maps/org/000000000000
- Телефон: +37400000000
- Метки: (none)

### Edited — Other Business (Транспорт и доставка)
Synced: no

- Телефон: +37411111111 → +37422222222 (old number disconnected)
```

---

## 2026-08-04

### Removed — Авиадоставка в Армению, Никита Почукалин (Транспорт и доставка)
Synced: no

- Name: Авиадоставка в Армению, Никита Почукалин
- Категория: Грузоперевозки
- Детали: РФ
- Ссылка: https://t.me/NPochukalin

## 2026-08-01

### Edited — Dr. Sara — массаж, косметология (Контакты и база знаний)
Synced: no

The row existed with nothing but a map link. Details taken from the organisation's
Yandex Maps page.

- Адрес: `https://yandex.com/maps/org/87870673206` → `Мовсес Хоренаци, 8; https://yandex.com/maps/org/dr_sara/87870673206`
- Телефон: (пусто) → `+37493036906`
- Ссылка: (пусто) → `https://www.instagram.com/dr.sara_aesthetic`

### Edited — 88 entries, notes carried over from the Notion page bodies (both databases)
Synced: n/a — the information already exists upstream, in the body of each row's Notion page.

The CSV columns carry only the structured properties, so the free text on each Notion page
(opening hours, prices, caveats, who answers which phone) had never reached the site. It is now
rendered on the matching cards as a `✎` note, a `₳` price, an extra number in the `☎` row, or a
link, and added to `data-search`. Nothing here needs replaying into Notion — this brings the site
level with what the databases already say.

Not carried over, deliberately: links to chat threads a recommendation came from (Ремонт
холодильников, Aghababyan dental clinic, Эдгар Варосян, Optimum Dental Clinic, Клиника Оганян,
Автошкола Elite Drive, Joy Cafe), the Автовокзал page's internal Notion links and image, and the
editorial note on Арен about a possible duplicate row.

Also not carried over: the notes on **Ванмед** and **Клиника Ами дент**, which rate named
individual doctors against each other. Both cards are left with no note at all rather than with the
favourable half of the remark. This drops the nurse Kristina booking number `+37494914100` from the
Ванмед card along with the rest of the note — it is not on the site in any form.

Six phone numbers that lived only in page prose are now on their cards: Дворец культуры имени
Шарля Азнавура `+37491340282` / `+37493340282`, Нотариусы `+37496999102`, Dens Clinic
`+37477951093`, Газовая служба `+37432230494` / `+37410294904`, Маршрутка Ереван – Тбилиси
`+995593229554` / `+995592408800`, Ванадзор – Ташир `+37495175195`.

### Edited — Forest 1961 Boutique Hotel & Restaurant (Контакты и база знаний)
Synced: n/a — restores a tag the site was already carrying upstream.

- Метки: `💯 Рекомендуем` now renders as the `💯 Recommended` badge on the `Еда / Ресторан` card,
  matching the upstream row. The `Гостиницы / Отель` row is untagged upstream, so its card is
  unchanged.