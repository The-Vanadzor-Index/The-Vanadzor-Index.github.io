# The Vanadzor Index

A single-file, offline-friendly local directory for **Vanadzor, Armenia** — doctors, government services, taxis, repair services, restaurants, hotels, and things to do, all in one searchable page.

Built for volunteers, newcomers, and long-time residents who need a quick, no-nonsense way to find a phone number, a map link, or a place to eat, without digging through scattered group chats and notion pages.

## Features

- **388+ entries** across 7 categories, organized into subcategories
- **Instant search** — filter by name, address, or keyword as you type
- **Category chips** to jump straight to what you need
- **Personal contacts toggle** — hide individuals' personal numbers by default, show them only when needed
- **Light / dark theme**, following system preference or manual override
- **Offline download** — save a self-contained snapshot of the whole directory as a single HTML file, no internet required to use it later
- **No build step, no dependencies** — it's one HTML file with inline CSS and vanilla JS

## Categories

- Medicine (dentistry, doctors, clinics, lab tests, pharmacies)
- Government Services
- Transport & Delivery (taxis, shared taxis, transfers, minibuses, freight, vehicle rental)
- Services & Tradespeople (plumbing, repairs, self-care, shops, cleaning, moving, pet care)
- Food (restaurants, cafés, fast food, food courts, delivery)
- Hotels (hotels, guesthouses, hostels, glamping)
- Leisure (museums, theaters, fitness, parks, activities for kids)

## Usage

This is a static, single-file website — no server or build process required.

- **Open locally:** download `The_Vanadzor_Index-vX.X.html` and open it in any browser.
- **Save an offline copy:** use the "Download the index for offline use" button at the bottom of the page to save a snapshot for use without internet access. Offline copies are timestamped and won't receive future updates.

## Updating entries

All content lives directly in the HTML as `.card` elements grouped into `.subgroup` and `.category` sections. To add or edit an entry:

1. Find the relevant category/subgroup.
2. Copy an existing `.card` block as a template.
3. Fill in the name, address, phone, map link, and any social links.
4. Update the `data-search` attribute so the entry stays searchable.

## Sources & attribution

Entries are compiled in collaboration with:
- [Контакты и база знаний](https://etonawa.notion.site/3332f9074e57803491e5f2449cdd8480) and [Транспорт и доставка](https://etonawa.notion.site/3392f9074e578082bd22e06251706381) — etonawa.notion.site, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), with no warranties given
- The index's own entries, added and verified independently

Entries taken from those databases are translated, edited and extended here.

## Disclaimer

This directory is a community-maintained, best-effort resource. Entries may become outdated, inaccurate, or incomplete over time, and inclusion in this index is not an endorsement. Nobody involved in compiling or maintaining this index is responsible for the accuracy of any listing, or for the quality, safety, or conduct of any business, service, or individual listed here. Use your own judgment, and verify details independently before relying on them.

## License

Not one work — three parts, three sets of terms.
**[`LICENSES.md`](LICENSES.md) is the map;** this is the short version.

| Part | Terms |
| --- | --- |
| **Directory content** — the entries and their arrangement | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — [`LICENSE`](LICENSE) |
| **Code** — the CSS and page structure, the JavaScript | [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) — [`LICENSE-CODE`](LICENSE-CODE) |
| **The name "The Vanadzor Index", the masthead and the site icon** | All rights reserved |

Everything is noncommercial. For commercial use of any part, ask:
<kocharyan.armen@protonmail.com>.

**Forking.** You may take the entries and the code on the terms above. The name
and the artwork are not licensed by either — a fork renames. You may of course
say your work is derived from The Vanadzor Index; that credit is required, not
merely allowed.

**Attribution** has a specified form — see [`LICENSES.md`](LICENSES.md) §1. It
credits the two upstream databases as well as this index, and it has to be
visible to a reader in the same view as the content.

## Acknowledgments

With ❤️ for [Birthright Armenia](https://www.birthrightarmenia.org/), [AVC](https://armenianvolunteer.org/), and all visitors to Vanadzor.
