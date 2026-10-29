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

## 2026-10-29

### Edited — Yandex Maps refresh across 199 linked entries

Every Yandex Maps link on the site was re-read and compared with what the card already says — a
refresh this time, not only a gap fill. Values the 2026-08-14 pass took from Yandex were replaced
where Yandex has since changed them; values from the Notion rows were left alone, as before.

The upstream Contacts schema has changed since the last sync: the Yandex link now lives in
`Локация` (`url`), and the street address in `Адрес` (text, formerly `Адрес текстом`). The
entries below use the new names. Addresses are given in the Russian form upstream already uses.

What did not change, for the record: no linked org has moved more than 20 m except Glamping
Park, and no org has gone away. Yandex now lists **Gandzak Food Court as temporarily
closed** (it was open on 2026-08-14); the five closures noted then are unchanged. No card is
changed for either — it wants a local check. Yandex has also dropped opening hours for Compliment,
Gandzak Food Court and Cinema Zone, and both phone numbers for Cinema Zone; the cards keep them.

Coordinates (`data-geo`) were refreshed on six cards — Медцентр Вардананц, Red Mobile, Compliment,
Bar B.Q., Glamping Park (≈480 m) and Elite Gym. They have no upstream column. Synced: n/a.

### Edited — Yandex Maps refresh, 10 entries (Контакты и база знаний)
Synced: no

- **Пром-тест** — Телефон: + `8599` (short number, listed by Yandex alongside the two already on
  the card)
- **Изагри** — Телефон: + `+79889523242`
- **Domus — мебельный и строительный магазин** — Часы работы: Пн–Сб 10:00–20:30, Вс 11:00–20:00
  (was Пн–Сб 10:00–19:00, Вс 11:00–18:30). Ссылка: https://www.instagram.com/domus_stores/ —
  the site card also gained https://www.facebook.com/domushipermarket/, which has no second
  column to go to.
- **Elite Gym** — Часы работы: Пн–Пт 09:00–22:00, Сб 09:00–21:00, Вс 10:00–21:00 (was Пн–Пт
  08:00–22:00, Сб 09:00–21:00).
- **1-я поликлиника** — Часы работы: Пн–Пт 09:00–18:00.
- **Food Garden** — Адрес: Карена Демирчяна, 1/7 (Yandex had only the region on 2026-08-14).
- **Compliment** — Адрес: Тигран Мец, 38/1 (was 38). Yandex has renamed this org "Tasty
  Compliment" and gives it the Instagram of the separate **Tasty Compliment — кондитерская,
  изготовление на заказ** row (Тигран Мец, 38/2), at identical coordinates to a second org of
  that name. The two rows are very likely one business; not merged, since that is etonawa's call.
- **KFC** — the site card gained
  https://www.facebook.com/pages/category/American-Restaurant/KFC-Vanadzor-1073039119386373/;
  Ссылка already holds the website.
- **Jazz Cafe** — the site card gained
  https://www.facebook.com/pages/category/Restaurant/Jazzcafe-Vanadzor-1582854848625347/;
  Ссылка already holds the Instagram.
- **Apart Hotel Sayat-Nova** — Ссылка: https://www.facebook.com/people/Hotel-apart-Sayat-Nova/100064167819619/

### Edited — building-page contamination from 2026-08-14 removed, 8 entries (Контакты и база знаний)
Synced: n/a — the removed values were never pushed upstream; this only stops them being replayed.

Салон красоты И. Саакян, Парикмахер, Мужские стрижки, Армен, Материалы для рукоделия, Материалы
для рукоделия, ткани, Травы и специи, Изготовление ключей, Эдгар and FightLife — кросс-фит, бокс
link to a Yandex building page, not an org, and the 2026-08-14 pass filled them from the first
business that building lists. Their opening hours were removed from the site, as were
`+37493388672` and `+37491388672` on Мужские стрижки, Армен (a real-estate agency's numbers).
`+37491023706`, which came from the Notion row, stays. The addresses are the building's own and
were kept. Their coordinates are the building's and were never wrong.

### Added — Panorama Kids / V Play (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3ea2f9074e57806d9faceaef99a66926`).
Yandex supplied the extras below, which the row does not have yet (Synced: no):

- Адрес: Тигран Мец, 81
- Телефон: +37493901199
- Часы работы: ежедневно 12:00–22:00

### Added — Школа №18 — 1-9 классы на русском (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3e22f9074e5780d8afa2f05d4a8eaa0f`).
Filed on the site under Leisure › For Kids beside Schools No. 4 and No. 11. Yandex extras
(Synced: no):

- Адрес: Ереванское шоссе, 151
- Телефон: +37432237809
- Ссылка: https://www.facebook.com/Vanadzor18school/

### Added — CasaVana (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3bd2f9074e578097a9fee1f82ea6a77f`).
Yandex extras (Synced: no):

- Локация: https://maps.app.goo.gl/EgFXixMequxg433C6 → https://yandex.com/maps/org/173869740651/
  (the same place, Гарегина Нжде, 14/2; a Yandex link is what gives the card exact coordinates)
- Телефон 2: +37455011052
- Часы работы: ежедневно 11:00–23:00
- The site card also carries https://www.facebook.com/Casavana.am, which has no second column.

### Added — Ringo (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3b72f9074e578059aaa9c7d7a6f4f017`).
Yandex extras (Synced: no):

- Часы работы: ежедневно 10:00–22:00

Yandex has no street address for it, only the region, so the card carries none.

### Added — Eva Kitchen Delivery (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3b92f9074e57805c85a4d8e5527459a0`).
Not on Yandex Maps.

### Added — Детский невролог Алвард Костанян (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3b92f9074e5780eeb8c7cf9d10d4cab2`),
including its page-body note (works at Медцентр Вардананц; book in person, not by phone). Filed as
an individual's contact.

### Added — Реставрация мебели, Альбина (Контакты и база знаний)
Synced: n/a — ported from the existing upstream row (page `3b72f9074e578026bad5f9f5fb2df2a8`).
Filed under Services › Other Repairs as an individual's contact. Not on Yandex Maps.

### Edited — Ванадзор – Дилижан (Транспорт и доставка)
Synced: yes — the change originated upstream.

- Name: Дилижан – Ванадзор → Ванадзор – Дилижан (the card moved beside the other Vanadzor – X
  routes)

### Edited — Ванадзор – Степанаван (Транспорт и доставка)
Synced: yes — the change originated upstream.

- Цены: 400 драм → 450 драм

## 2026-08-14

### Edited — Yandex Maps field fill across 184 linked entries

Every card carrying a Yandex Maps link was re-read from that org's own Yandex page and given
whatever the page held that the card did not: 189 phone numbers, 120 street addresses, 164
opening-hours notes and 72 social links. Nothing already on a card was overwritten — only gaps
were filled — and the two tables below are the field values, per entry, in the two databases.

How these map upstream, which is not one-to-one:

- **Телефон** — Contacts ships `Телефон`/`Телефон 2`; `Телефон 3`/`Телефон 4` were added to it
  earlier. Entries below with more than four numbers have nowhere upstream for the rest.
- **Адрес текстом** — the street address, not `Адрес`, which is a `url` column holding the
  Yandex link.
- **Ссылка** — a single column, so an entry that gained more than one social link can only carry
  the first upstream. The site card keeps them all.
- **Часы работы** — no column exists for this at all. It is page-body prose upstream, so it
  travels via `push_notes.py`, which writes only onto pages with an empty body.

Caveats worth carrying, since they are the reason this was not applied blindly:

- Yandex's `socialLinks` are contaminated by directory aggregators — it attributed
  `instagram.com/spyur.am` and `twitter.com/spyuram` to the Gugark hotel, and
  `youtube.com/Wildberriesshop` to a key cutter. Only links whose handle echoes the entry's own
  name were kept; 111 were discarded. The kept ones are still Yandex's claim, not a verified one.
- Opening hours are the fastest-staling field here and are a snapshot of 2026-08-14.
- 15 entries had no usable street address (Yandex gave only "Lori Region, Vanadzor", or named a
  park or a quarter rather than a street) and were left without one.
- Yandex reports 5 of these entries as closed — Gugark permanently; Apart Hotel Sayat-Nova,
  Central Library, Charles Aznavour Palace of Culture and Vanadzor American Corner temporarily.
  No card was changed for this; it wants a human check.
- Yandex holds no website for any of these orgs — the org page carries social links only — so no
  `Ссылка` value below is a business's own site.
- **Corrected on 2026-10-29 — do not replay these rows as written.** Eight entries linked to a
  Yandex *building* page (`/maps/…/house/…`) rather than an org were filled from whichever
  business that building's page listed first: Салон красоты И. Саакян, Парикмахер, Мужские
  стрижки, Армен, Материалы для рукоделия, Материалы для рукоделия, ткани, Травы и специи,
  Изготовление ключей, Эдгар and FightLife. Their Часы работы below belong to a post office,
  a shoe shop, a supermarket, a Wildberries pickup point and so on, and Мужские стрижки, Армен's
  two numbers belong to a real-estate agency. The addresses are the building's own and stand.
  See the 2026-10-29 entry.

### Edited — Yandex Maps field fill, 181 entries (Контакты и база знаний)
Synced: no

| Заголовок / Name | Телефон(ы) | Адрес текстом | Ссылка | Часы работы |
| --- | --- | --- | --- | --- |
| Aghababyan dental clinic | +37432222636, +37493922636, +37495700100 | Vardanants St. 23 | — | Open Mon–Sat 10:00–18:00. |
| Alpha Educational Center | — | Vardanants St. 11A | https://www.instagram.com/alpha.educentre | — |
| Ami Dent Clinic | +37494753727 | Yerevan Highway 103Ա | — | Open Daily 09:00–19:00. |
| Angine Resort | +37494899997 | — | — | Open daily, 24 hours. |
| Antarain Dzayner Pet Store | +37493272703 | Taterakan St. 4 | — | Open Daily 10:00–19:00. |
| Apart Hotel Sayat-Nova | +37455309999 | Sayat Nova St. 14 | — | — |
| Argishti | +37495442556 | — | https://www.facebook.com/argishtihotel | Open daily, 24 hours. |
| Arm Food | +37493022099 | Tumanyan St. 8Դ/3 | — | Open Daily 09:00–23:00. |
| Arsego | +37498751530 | Nzhdeh St. 9Ա | — | Open daily, 24 hours. |
| Asteri | +37499171760, +37432221229 | — | https://www.facebook.com/AsteriCafeRestaurant, https://www.instagram.com/asterigreekbakery | Open Daily 09:00–21:00. |
| AuRoom | +37498044011 | Boshyan St. | — | Open daily, 24 hours. |
| Bar B.Q. | — | — | — | Open Daily 11:00–00:00. |
| Barber, David Poghosyan | +37493210217 | Tigran Mets St. 48 | — | Open Daily 10:00–18:00. |
| Baron | +37494098840 | Halabyan St. 1-1 | https://www.facebook.com/hotelbaronvanadzor, https://www.instagram.com/baron_hotel_vanadzor | Open daily, 24 hours. |
| Bazum Passport Office | — | Rustavi St. 1 | — | Open Mon–Fri 09:00–17:00. |
| Best Start Driving School | +37455730010 | Tigran Mets St. 18 | https://facebook.com/beststart.avtodproc | Open Mon–Sat 09:00–18:00. |
| Best Step — leather shoe making | — | Vardanants St. 35Z | — | Open Daily 08:00–20:00. |
| Bon Appetit | +37495505094, +37477077134 | Vardanants St. 37-1 | https://www.facebook.com/bonappetitvanadzor, https://www.instagram.com/bonappetitvanadzor | Open Daily 10:00–22:00. |
| Bonm Ascota Pet Store | +37493560993 | Movses Khorenatsi St. 1Г | — | Open Daily 10:00–18:00. |
| Boo Alternative House | +37495794029 | — | — | Open Daily 09:00–17:00. |
| Bubble House | +37493108555 | — | https://www.facebook.com/pages/Bubble-House/104030458473248 | Open Daily 12:00–23:00. |
| Caramel Cafe | — | Demirchyan St. 28 | — | Open Tue–Sun 11:00–20:00. |
| Central Library | +37432245126 | Vardanants St. 25 | — | — |
| Church of St. Grigor Narekatsi | — | — | — | Open Daily 08:30–18:30. |
| Cinema Zone | +37433098849, +37491233119 | — | https://www.instagram.com/cinemazonevanadzor | Open Daily 13:00–01:00. |
| Compliment | — | Tigran Mets St. 38 | — | Open Mon 08:30–22:00; Tue–Fri 08:00–22:00; Sat 09:00–22:00; Sun 11:00–22:00. |
| Computer repair, used equipment | — | Tigran Mets St. 34/9-12 | — | Open Daily 10:00–18:00. |
| Craft supplies | — | Myasnikyan St. 8 | — | Open Daily 09:00–23:00. |
| Craft supplies, fabrics | — | Myasnikyan St. 13A | — | Open Daily 10:00–19:00. |
| Custom computer desks, Ovik | — | Vardanants St. 43 | — | Open Daily 10:00–17:00. |
| Danielyan Sweets/Bakery | +37477642642 | — | — | Open Daily 08:00–22:00. |
| Davas | +37493577944 | Shinararner St. 19Բ | — | Open daily, 24 hours. |
| Davidyants Laboratories | +37494230163 | Myasnikyan St. 19 | — | Open Mon–Fri 09:00–16:00; Sat 09:00–12:00. |
| Davinci Clinic, Dr. Iskandaryan | +37493333170 | Tumanyan St. 5 | — | Open Mon–Fri 09:30–18:30; Sat 09:30–15:00. |
| Dens Clinic, Vagram Nikoghosyan | +37432246664, +37491475552, +37432240780 | Vardanants St. 80 | — | Open Mon–Fri 10:00–20:00; Sat 11:00–16:00. |
| Department store, Mari (household goods), Ideal (construction
                materials) | — | Tigran Mets St. 81 | — | — |
| Dolcebox, Crepe Station | +37444544923 | — | https://www.instagram.com/dolcebox_arm | Open Daily 10:00–22:00. |
| Domus — furniture and construction store | +37412657657 | Marshal Baghramyan St. 60 | https://www.youtube.com/c/Domus_stores/videos | Open Mon–Sat 10:00–19:00; Sun 11:00–18:30. |
| Downtown | +37477020299, +37494020299 | — | — | Open daily, 24 hours. |
| Dr. Sara — massage, cosmetology | +37496036900 | — | https://www.instagram.com/dr.sara_.vanadzor | Open Daily 10:00–20:00. |
| Dry Cleaning | +37493360913 | Tigran Mets St. 11 | — | Open Daily 10:00–18:00. |
| EcoSense | +37432242442 | Tigran Mets St. 26 | — | Open Mon–Fri 09:00–17:00. |
| Edgar Varosyan, "Varosyan Dent" | +37432225445, +37494520403, +37495920403 | Vardanants St. 36 | — | Open Mon, Tue 10:00–20:00; Wed 10:00–18:00; Thu 10:00–20:00; Fri 10:00–18:00; Sat 10:00–14:00. |
| Elite Drive Driving School | +37455000095, +37496929494 | — | — | Open Daily 09:00–19:00. |
| Elite Gym | +37496445558 | — | https://www.instagram.com/elitegym.am | Open Mon–Fri 08:00–22:00; Sat 09:00–21:00. |
| Eva Lab | +37499942200, +37432242200 | Tumanyan St. 3 | — | Open Daily 09:00–18:00. |
| Family Food | +37494500222 | Demirchyan St. 26 | — | Open Daily 09:00–22:00. |
| Ferma — fresh chicken, frozen foods | — | Nzhdeh St. 9/2 | — | Open Daily 09:00–20:00. |
| FightLife — CrossFit, boxing | — | — | — | Open Daily 08:30–23:30. |
| Fish shop | — | Tumanyan St. 4 | — | Open Daily 10:00–20:00. |
| Fish'ka — seafood store | +37444477400, +37444733744 | Tigran Mets St. 48 | — | Open Daily 10:00–23:00. |
| Fleyta — musical instruments | +37493926928 | Myasnikyan St. 18Դ | https://www.facebook.com/fleytaerjshtakanxanut | Open Daily 11:00–18:00. |
| Food Garden | +37498978388 | — | https://www.facebook.com/food.garden.vanadzor, https://www.instagram.com/food.garden.vanadzor?utm_source=ig_web_button_share_sheet | Open daily, 24 hours. |
| Food House | — | Grigor Lusavorich St. 54/1Գ | — | Open Daily 10:00–18:00. |
| Forest 1961 Boutique Hotel & Restaurant | +37441200029 | — | — | — |
| Forest 1961 Boutique Hotel & Restaurant | +37441200029 | — | — | — |
| Gandzak Food Court | +37443412106 | Shirak St. | — | Open Daily 08:00–23:00. |
| Gayanna Center — multifunctional leisure and education center | +37455898799 | Tigran Mets St. 17 | https://instagram.com/gayanna_armenia_wedding_show, https://www.facebook.com/GayannaArmenia | Open Daily 10:00–20:00. |
| Glamping Park | +37455515254 | — | https://instagram.com/glampingpark.am | Open daily, 24 hours. |
| Glass and mirror cutting | — | Shirvanzade St. 3 | — | Open Daily 09:00–18:30. |
| Green House | +37491310070 | Banak St. 8 | https://www.facebook.com/GreenHouseHyuratun | — |
| Grifus — computer equipment, used, repair | +37494130170, +37499130170, +37455250850 | Tigran Mets St. 32 | https://www.facebook.com/grifusarmenia | Open Mon–Fri 10:00–19:00; Sat 10:00–18:00. |
| Guesthouse Dacha | +37498333329 | Shahumyan Village | — | Open daily, 24 hours. |
| Gugark | +37432241519 | Tigran Mets St. 20/1 | — | — |
| Hairdresser | — | Grigor Lusavorich St. 52 | — | Open Mon–Fri 10:00–18:00; Sat 10:00–16:00. |
| Helsinki Citizens' Assembly — human rights advocacy | +37432242268 | Tigran Mets St. 59 | — | Open Mon–Fri 09:30–18:30. |
| Herbs and spices | — | Mkhitar Gosh St. 2-6 | — | Open Daily 10:00–18:00. |
| Holy Mother of God Church | — | — | — | Open Daily 09:30–19:00. |
| Hovhannisyan Clinic, Dr. Vanik Hovhannisyan, Dr. Armen | +37496089979, +37495089979 | Vardanants St. 45 | — | Open Mon–Fri 09:00–18:00; Sat 10:00–15:00. |
| Hovhannisyan Diagnostic Center — massage, ultrasound, ECHO,
                duplex scan | — | Myasnikyan St. 23 | — | Open Mon–Fri 09:00–18:00. |
| I. Sahakyan Beauty Salon | — | Grigor Lusavorich St. 52 | — | Open Mon–Fri 10:00–18:00; Sat 10:00–16:00. |
| Invitro | +37460651010 | Vardanants St. 19 | https://youtube.com/@invitroarmenia9182, https://facebook.com/invitro.armenia, https://www.instagram.com/invitroarmenia | Open Mon–Fri 08:00–16:00; Sat 08:00–13:00. |
| Izagri | +37477042218 | — | — | Open Daily 10:00–22:00. |
| J&S Hotel | +37477551714 | Sasuntsiner St. 32-2 | — | Open daily, 24 hours. |
| Jazz Cafe | +37498117282 | — | — | Open Daily 10:30–22:30. |
| Kamila — bakery and homemade pelmeni | — | Usanoghakan St. 12-6 | — | Open Daily 09:00–22:00. |
| Karhanyan School — private kindergarten | — | Taterakan St. 5/1 | — | — |
| KaVo dental clinic, Dr. Karen | +37441470705 | Tigran Mets St. 46-1/2 | — | Open Mon–Sat 10:00–18:00. |
| Key cutting, Edgar | — | Grigor Lusavorich St. 43 | — | Open Daily 10:00–21:00. |
| KFC | +37460500505 | Tigran Mets St. 73 | — | Open Daily 10:00–23:00. |
| Kiddi City — private kindergarten | — | Abovyan St. 21 | — | Open Mon–Fri 08:30–18:00. |
| KinoLori | +37494725878 | — | https://t.me/kinoloriam, https://www.instagram.com/kino_lori_, https://www.youtube.com/@KinoLori | Open Daily 10:00–21:00. |
| Kirovakan | +37499417010, +37498417010 | — | https://t.me/kirovakan_hotel | Open daily, 24 hours. |
| Kzher — vintage knick-knacks shop | — | Azatamartikner St. | — | Open daily, 24 hours. |
| L'avenue Café/Bakery | +37444701818 | — | — | Open Daily 09:00–22:00. |
| Laguna | +37493877222, +37499877222 | — | https://facebook.com/lagunahotelvanadzor | Open daily, 24 hours. |
| Lara — craft supplies | — | Tigran Mets St. 75 | — | Open Daily 10:00–19:00. |
| Little Dragon | +37444323424 | — | https://instagram.com/littledragon_vanadzor | Open Daily 10:00–22:30. |
| LOFT Coworking Place/Gamezone | +37441408835 | — | https://instagram.com/loft.vanadzor | Open Mon–Sat 10:00–19:00. |
| Loft — coworking space | +37441408835 | Tigran Mets St. 24 | https://instagram.com/loft.vanadzor | Open Mon–Sat 10:00–19:00. |
| Lori Guest House | +37493202055, +37498423504 | — | https://www.instagram.com/lori_guest_house_pandok?utm_source=qr | Open daily, 24 hours. |
| Lori Pandok Guest House Taverna | +37493202055 | Batumi St. 10 | — | Open Daily 10:30–22:30. |
| Lori-Pambak Regional Museum | +37493021027, +37455140031 | — | https://www.facebook.com/loripambakgeologicalmuseum | Open Tue–Fri 10:00–18:00; Sat 10:00–17:00. |
| Lorimed Medical Center | +37432223111 | Taterakan St. 6 | — | Open Mon–Fri 09:00–17:00; Sat 09:00–13:00. |
| Lumo by Salori | — | — | — | Open Daily 09:00–22:00. |
| Lusia Food — frozen ready meals | +37477848429, +37494400760, +37498840760 | — | — | Open Daily 09:00–21:00. |
| Madera | +37498822234, +37433822234 | — | https://t.me/maderavanadzor, https://www.facebook.com/maderavanadzor | Open Daily 11:00–22:00. |
| MagHay B&B | +37477094029, +37491380305 | — | https://www.facebook.com/BB.MagHay | — |
| MagHay B&B | +37477094029, +37491380305 | — | https://www.facebook.com/BB.MagHay | — |
| Mamurr Pottery — pottery studio | — | Myasnikyan St. 19 | — | Open Daily 09:00–21:00. |
| Mandala Yoga and Health Center | +37455044464 | — | https://www.facebook.com/YogaAndPilatesstudioVanadzor | Open Mon–Sat 09:30–22:30. |
| Maran | +37432277777 | — | https://www.facebook.com/MaranBeerHouse | Open Daily 10:00–22:30. |
| Masoor | +37460515515 | — | https://www.instagram.com/masoorvanadzor | Open Daily 09:00–23:00. |
| Mega Profile — glass tempering | +37494020685 | Stepan Zoryan St. 15 | — | Open Daily 10:00–18:00. |
| Men's haircuts, Armen | +37493388672, +37491388672 | Tigran Mets St. 27 | — | Open Mon–Fri 09:00–18:00. |
| Mineral Fountain Tetuh Djour | — | — | — | Open daily, 24 hours. |
| Mir Tkani — bedding tailoring | — | Grigor Lusavorich St. 50/17 | — | Open Daily 10:00–18:00. |
| Mon Paris | — | Myasnikyan St. 12 | — | — |
| Museum of Fine Arts | +37432243938 | — | https://www.facebook.com/pages/%D5%8E%D5%A1%D5%B6%D5%A1%D5%B1%D5%B8%D6%80%D5%AB-%D5%AF%D5%A5%D6%80%D5%BA%D5%A1%D6%80%D5%BE%D5%A5%D5%BD%D5%BF%D5%AB-%D5%A9%D5%A1%D5%B6%D5%A3%D5%A1%D6%80%D5%A1%D5%B6-Vanadzor-Fine-Arts-Museum/274788065899556 | Open Tue–Sat 09:00–18:30. |
| MushMar — computer equipment | +37432244510 | Nzhdeh St. 11 | — | Open Daily 10:00–18:00. |
| Music School No. 1 | +37432220956, +37432244932 | Vardanants St. 41 | — | Open Mon–Fri 09:00–18:00. |
| Music School No. 1 | +37432220956, +37432244932 | Vardanants St. 41 | — | Open Mon–Fri 09:00–18:00. |
| My Boots — shoes | — | Tigran Mets St. 77 | — | Open Daily 10:00–19:00. |
| Nairi | +37477360360 | Nairi St. 10/2 | — | Open daily, 24 hours. |
| National Aesthetics Center | — | Myasnikyan St. 19A | — | Open Mon–Fri 10:00–18:00. |
| Nectaro Tea House | +37477775585 | — | https://www.facebook.com/nectarotea | Open Daily 09:00–22:00. |
| Normed Medical Center | +37432224090, +37432241164, +37455422211, +37410542424, +374322422211, +37431232733, +37455422206, +37410289528, +37432289528, +37455422201 | Nzhdeh St. 24 | https://facebook.com/normedmedicalcenter, https://instagram.com/normed_medical_center | Open Mon–Fri 08:30–17:00; Sat 08:30–14:00. |
| Notaries | +37499996611, +37432220121, +37477934541 | Tigran Mets St. 22 | — | — |
| Noy | +37493749702 | — | — | Open daily, 24 hours. |
| Ocean Fish — seafood store | +37499977797 | Vardanants St. 49 | — | Open Daily 10:00–22:00. |
| Ophthalmology Clinic, eye doctor | — | Nzhdeh St. 11 | — | — |
| Optimist — printing house | +37477404051 | Tigran Mets St. 63 | — | Open Daily 10:00–20:00. |
| Optimum Dental Clinic | +37432223115, +37498323115 | Tigran Mets St. 29 | https://www.facebook.com/pages/Optimum/1412736418997656 | Open Mon–Sat 10:00–19:00. |
| Palermo | +37498758875 | Demirchyan St. 1/35 | https://www.facebook.com/Palermo-Hotel%D5%8A%D5%A1%D5%AC%D5%A5%D6%80%D5%B4%D5%B8-%D5%B0%D5%B5%D5%B8%D6%82%D6%80%D5%A1%D5%B6%D5%B8%D6%81-112922931397946 | Open daily, 24 hours. |
| Panorama | +37493554488 | — | https://www.facebook.com/PanoramaVanadzor | Open Daily 11:00–23:00. |
| Pastel — bedding | +37432221811, +37455950953 | Grigor Lusavorich St. 49 | — | Open Daily 09:30–18:00. |
| Pet Store | — | Nzhdeh St. 6 | — | Open Daily 10:00–21:00. |
| Pharmacy (open until midnight) | — | Tigran Mets St. 55 | — | Open Daily 09:00–00:00. |
| Phone, computer, and electronics repair | — | Vardanants St. 35Z | — | Open Daily 11:00–18:00. |
| Planta Sana Orthopedic Salon | +37495778383 | Ghazaros Aghayan St. 82-3 | — | Open Mon–Sat 10:00–19:00. |
| Polyclinic No. 1 | +37432220414 | Myasnikyan St. 17 | — | — |
| Poodle Coffee | — | — | — | Open Daily 09:00–21:00. |
| Post Office, Public Services Center, Civil Registry Office | +37410514514, +37410544444 | Tigran Mets St. 18 | — | Open Mon–Fri 09:00–18:00; Sat 10:00–14:00. |
| Prom-Test | +37411585858, +37495445858 | Myasnikyan St. 1st Lane 2/2 | https://www.facebook.com/promtestlaboratories.am, https://www.instagram.com/promtestlaboratories, https://www.youtube.com/@prom-test | Open Mon–Sat 08:30–18:00. |
| Puppet Theater | +37477070293 | — | — | Open Daily 10:00–17:00. |
| Red Mobile — phone, computer, and electronics repair | — | Tigran Mets St. 65A | — | Open Daily 09:00–23:00. |
| Royal Gym | +37477709100 | — | https://instagram.com/royal_gym_vanadzor | Open Mon–Sat 10:00–22:00. |
| Royal Palace | +37441858080, +37443858080 | — | — | Open daily, 24 hours. |
| Russian Orthodox Church | +37410284212 | — | — | — |
| Salori | +37498311155 | — | — | Open Daily 11:00–23:00. |
| Sana Medical Center | — | Tumanyan St. 6 | — | Open Mon–Fri 10:00–18:00. |
| Sanatorium Vanadzor Armenia | +37496362222, +37496361111 | — | https://instagram.com/vanadzor_armenia_health_resort, https://www.youtube.com/@vanadzorarmeniahealthresor1425 | Open daily, 24 hours. |
| School No. 11 — grades 10-12 in Russian | +37432220937 | — | — | Open Mon–Fri 08:00–18:00. |
| School No. 4 — grades 1-9 in Russian | +37432225450, +37432225460 | Tigran Mets St. 23 | — | Open Mon–Fri 08:00–17:00. |
| Shamam's Macarons | +37493788083 | — | https://facebook.com/shamamsmacaroons, https://www.instagram.com/shamams_macarons | Open Tue–Sun 10:00–20:00. |
| Shunn u Katun Veterinary Clinic | +37455895495 | Tumanyan St. 7 | https://t.me/shunnukatun_am, https://www.facebook.com/shunn.u.katun.am | Open Tue–Sat 11:00–19:00. |
| Skutegh Cafe-Restaurant | +37455550601 | — | https://www.instagram.com/skutegh | Open Daily 10:00–22:00. |
| Sparta | +37455910591, +37455444045, +37494443229 | — | https://www.facebook.com/Sparta.vanadzor | Open Daily 10:00–22:00. |
| Stepan Zoryan House-Museum | +37432243093 | — | https://www.facebook.com/StepanZoryanHouseMuseum | Open Mon–Sat 12:00–18:00. |
| Stimul (open until 1:00 AM) | — | Tigran Mets St. 34B/2 | — | Open Daily 08:00–02:00. |
| Store | — | Halabyan St. 6 | — | Open Daily 10:00–20:00. |
| Super Lahmajo | +37477202125, +37495212125, +37499302125 | Myasnikyan St. 18Ա | — | Open Daily 10:00–19:00. |
| Taron Passport Office | — | — | — | Open Mon–Fri 09:00–17:00. |
| Tashir Pizza, Suteki Sushi | +37432244401 | Tigran Mets St. 44/1 | — | Open Daily 10:00–00:00. |
| Tatev Dance Studio | — | Taterakan St. 9 | — | Open Daily 10:00–18:00. |
| Tax Inspectorate | +37432225479, +37460849969 | Vardanants St. 11 | — | Open Mon–Fri 09:00–18:00 (break 13:00–14:00). |
| Tiflis | +37455442929 | Grigor Lusavorich St. 48 | https://www.instagram.com/tiflis_restaurant | Open Daily 09:00–23:00. |
| Tokyo NB | — | Tigran Mets St. 41 | — | — |
| Tutto Pizza | +37494122155 | Vardanants St. 122 | — | — |
| Uno Shoes — shoes | +37460529903 | Tigran Mets St. 67Բ | — | Open Daily 10:00–20:00. |
| V&V Hotel | +37498445959 | — | https://www.facebook.com/vvhotelarmenia | Open daily, 24 hours. |
| Van Boulangerie | — | — | — | Open daily, 24 hours. |
| Van Garden | — | Lalvar St. | — | Open daily, 24 hours. |
| Van Hotel & Resort | +37477550770 | Abovyan St. 104 | — | Open daily, 24 hours. |
| Van Restaurant | +37477550770 | — | — | Open Daily 10:00–22:00. |
| Vanadzor American Corner — library, conversation club | +37432245126 | Vardanants St. 25 | — | — |
| Vanadzor City Hall | +37432222648 | Tigran Mets St. 22 | — | Open Mon–Fri 09:00–18:00 (break 13:00–14:00). |
| Vanadzor Medical Center | — | — | — | Open daily, 24 hours. |
| Vanadzor Tennis Academy | — | — | — | Open Daily 10:00–20:00. |
| Vanill Aesthetics Studio | +37498419030 | Yerevan Highway 103Ա | — | Open Daily 09:00–19:00. |
| VanMax Ray — CT | +37499075575, +37432275757 | Vardanants St. 122 | https://www.facebook.com/Vanmaxray | Open Mon–Sat 09:00–19:00. |
| Vanmed | +37432222401, +37432244328, +37432244606, +37498662401 | Zaqaryan St. 29 | https://www.facebook.com/vanmedmsc | Open Mon–Fri 10:00–18:00. |
| Vardanants Medical Center | +37412592100, +37410592100, +37498592100 | Taterakan St. 2 | — | Open Mon–Sat 08:30–18:00. |
| Vernatun | +37477400581 | Tumanyan St. | https://www.facebook.com/pages/Restoran%20Vernatun/151581215513685 | Open Daily 10:00–23:00. |
| Viewpoint Cafe / Boo Cafe | +37433808069 | — | https://www.instagram.com/the_boo_cafe | Open Daily 10:00–22:00. |
| Vitadent, Sargis | +37432241119 | Vardanants St. 49 | — | Open Mon–Fri 10:00–19:00; Sat 10:00–14:00. |
| VNS Fitness, yoga | +37491712555 | — | — | — |
| X Drive Driving School | +37455792222, +37410572222 | Tigran Mets St. 59 | https://www.facebook.com/xdrivevanadzor | Open Mon–Fri 10:00–18:00. |
| Yan Clinic — CT, MRI, ultrasound | +37495388800 | Vardanants St. 30/5 | https://www.instagram.com/yanclinic_vanadzor | Open Mon–Sat 09:00–21:00. |
| Zhpit Clinic, Irina Gambaryan | +37455020502 | Grigor Lusavorich St. 54Դ/2 | — | Open Mon–Sat 10:00–18:00. |
| Zoo Market | +37498036080 | Vardanants St. 116B/8 | — | Open Daily 10:00–18:30. |

### Edited — Yandex Maps field fill, 3 entries (Транспорт и доставка)
Synced: no

| Заголовок / Name | Телефон(ы) | Адрес текстом | Ссылка | Часы работы |
| --- | --- | --- | --- | --- |
| Amtrans | +37494893333 | Myasnikyan St. 18Բ | — | Open Daily 10:00–19:00. |
| Boo Mountain Bike Park | — | — | https://www.facebook.com/Boomountainbikepark | Open Daily 10:00–22:00. |
| Shared taxi to Tbilisi | — | Lori Highway | — | Open daily, 24 hours. |

### Edited — KaVo dental clinic, доктор Карен (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/8188915913

The Yandex listing carries `+374 77 509086`, which the site card already had as its second
number — that is what identifies this org as the right one.

### Edited — VNS Fitness, йога (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/169266453085

### Edited — Van Restaurant (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/6256539972

### Edited — Skutegh Cafe-Restaurant (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/52368770931

### Edited — L'avenue Café/Bakery (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/207750558924

### Edited — Danielyan Sweets/Bakery (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/239516089728

Yandex carries two listings for this confectionery at Тигран Мец 77, one filed as
«Confectionary» and one as «Cake orders, bakery»; the first was taken.

### Edited — V&V Hotel (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/208792496324

### Edited — Angine Resort (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/92472907565

### Edited — Sayat Nova Park (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/162876053012

### Edited — Solidarity Park (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/95251605151

### Edited — Mineral Fountain Tetuh Djour (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/217411552462

Yandex files the fountain on улица Бошяна; the site card says Тигран Мец 52, about 270 m west.
The name on the listing is verbatim identical, so the link is the fountain.

### Edited — Artsakh Square (Контакты и база знаний)
Synced: no

- Адрес: (none) → https://yandex.com/maps/org/65925105240

Yandex has two orgs named Artsakh Square at this spot — the square itself and a bus stop of the
same name. The square (a `Park, square`) is the one linked.

### Edited — LOFT Coworking Place/Gamezone (Контакты и база знаний)
Synced: n/a — a site-only cross-reference; «Loft — коворкинг» already carries this Адрес upstream

- Адрес: (none) → https://yandex.com/maps/org/37978917509

The site lists this venue twice — as "Loft — coworking space" under Services & Tradespeople,
which already had the link, and as "LOFT Coworking Place/Gamezone" under Leisure, which did not.
Linking the second one showed both are the same Yandex org at the same coordinates, so the
Leisure card is now marked a duplicate copy and is out of the counts (392 → 391). Without that it
would have put a second marker on the map at a point already occupied by the first.

Ten of the twelve rows above are not in the 2026-08 export (`Контакты и база знаний.zip`) — only
«KaVo dental clinic, доктор Карен», «VNS Fitness, йога» and «Loft — коворкинг» are. For the rest
the Адрес belongs to a row that has to be created upstream first, which needs etonawa's
go-ahead; the site card is what holds the link until then. The links were read off each org's own
Yandex page and checked against the card's name, address and, where the card had one, its phone
number.

### Edited — Церковь Святого Григора Нарекаци (Контакты и база знаний)
Synced: no

- Категория: Досуг → Мастера и услуги
- Подкатегория: Достопримечательность / Туризм → Религия

### Edited — Храм Пресвятой Богородицы (Старая Церковь) (Контакты и база знаний)
Synced: no

- Категория: Досуг → Мастера и услуги
- Подкатегория: Достопримечательность / Туризм → Религия

### Edited — Русская Православная Церковь (Контакты и база знаний)
Synced: no

- Категория: Досуг → Мастера и услуги
- Подкатегория: Достопримечательность / Туризм → Религия

The site's Leisure catch-all subgroup filed all three churches next to a cinema, a pub and a
library. They now sit in a new Religion subgroup under Services & Tradespeople, alongside the
site's other "an institution, not an activity" cards.

## 2026-08-04

### Removed — Авиадоставка в Армению, Никита Почукалин (Транспорт и доставка)
Synced: no

- Name: Авиадоставка в Армению, Никита Почукалин
- Категория: Грузоперевозки
- Детали: РФ
- Ссылка: https://t.me/NPochukalin

## 2026-08-01

### Added — Александр — химчистка мебели, матрасов, автомобильных сидений (Контакты и база знаний)
Synced: yes (2026-08-04)

Professional deep dry cleaning of upholstered furniture (sofas, armchairs, chairs), mattresses,
and textile car seats. A master relocated from Saint Petersburg, now working in Armenia; contact
is over Telegram only, price quoted from photos. Source: his Telegram announcement post.

- Заголовок: Александр — химчистка мебели, матрасов, автомобильных сидений
- Категория: Мастера и услуги
- Подкатегория: Клининг
- Ссылка: https://t.me/divanvesna

The before/after portfolio channel `https://t.me/divanlcean` is on the site card as a second link,
but the database has a single `Ссылка` column, so it has nowhere to go upstream.

### Added — Lumo by Salori (Контакты и база знаний)
Synced: yes (2026-08-04)

Added as a site card; the row already existed upstream, so this created nothing — only the
missing phone number was filled in.

- Заголовок: Lumo by Salori
- Категория: Еда
- Подкатегория: Кафе
- Адрес: https://yandex.com/maps/org/lumo_by_salori/203623324666
- Телефон: (пусто) → +37477444049
- Ссылка: https://www.instagram.com/lumobysalori

The site card also carries the street address `Azatamartikner St. 10`, which is still blank in
the upstream `Адрес текстом` column — a correction worth making on a later run.

### Added — Bar B.Q. (Контакты и база знаний)
Synced: yes (2026-08-04)

Added as a site card; the row already existed upstream, so this created nothing — only the
missing address fields were filled in.

- Заголовок: Bar B.Q.
- Категория: Еда
- Подкатегория: Кафе, Фастфуд
- Адрес: (пусто) → https://yandex.com/maps/org/bar_b_q_vanadzor/171378021289
- Адрес текстом: (пусто) → Тигран Мец, 36
- Телефон: +37441333022
- Ссылка: https://www.instagram.com/barbq.evn

### Edited — Dr. Sara — массаж, косметология (Контакты и база знаний)
Synced: yes (2026-08-04)

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