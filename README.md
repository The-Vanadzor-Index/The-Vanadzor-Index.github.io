# The Vanadzor Index

An offline-friendly local directory for **Vanadzor, Armenia** — doctors, government services, taxis, repair services, restaurants, hotels, and things to do, all in one searchable page.

Built for volunteers, newcomers, and long-time residents who need a quick, no-nonsense way to find a phone number, a map link, or a place to eat, without digging through scattered group chats and notion pages.

## Features

- **388+ entries** across 7 categories, organized into subcategories
- **Instant search** — filter by name, address, or keyword as you type
- **Category chips** to jump straight to what you need
- **Personal contacts toggle** — hide individuals' personal numbers by default, show them only when needed
- **Light / dark theme**, following system preference or manual override
- **Offline download** — save a self-contained snapshot of the whole directory as a single HTML file, no internet required to use it later
- **No dependencies, nothing to resolve at load time** — the published page is one HTML file with inline CSS and vanilla JS, assembled from per-category sources by a stdlib-only build script

## Categories

- Medicine (dentistry, doctors, clinics, lab tests, pharmacies)
- Government Services
- Transport & Delivery (taxis, shared taxis, transfers, minibuses, freight, vehicle rental)
- Services & Tradespeople (plumbing, repairs, self-care, shops, cleaning, moving, pet care)
- Food (restaurants, cafés, fast food, food courts, delivery)
- Hotels (hotels, guesthouses, hostels, glamping)
- Leisure (museums, theaters, fitness, parks, activities for kids)

## Usage

The published site is static — `index.html`, served with its icon set and masthead artwork. No server, framework or package manager is involved at any point.

- **Open locally:** download `The_Vanadzor_Index-vX.X.html` and open it in any browser.
- **Save an offline copy:** use the "Download the index for offline use" button at the bottom of the page to save a snapshot for use without internet access. Offline copies are timestamped and won't receive future updates.

## Project layout

`index.html` is generated — **don't edit it by hand**, the next build overwrites it. `build.py` (stdlib-only Python, nothing to install) assembles it from:

```
src/index.template.html    the page shell: <head>, styles, masthead, footer
src/cards/<n>-<slug>.html  one file per category
src/js/<nn>-<feature>.js   the behaviour, one file per feature
```

```bash
python3 build.py           # rebuild index.html from src/
python3 build.py --check   # verify index.html is current; exits 1 if stale
```

The split keeps a card edit inside a small file instead of an 8,500-line block, and lets the entry counts be computed rather than maintained by hand. It is a plain concatenation into one document — nothing is fetched, included or resolved at runtime, and the offline snapshot is unaffected.

## Updating entries

Entries are `.card` elements grouped into `.subgroup` and `.category` sections, living in `src/cards/` — one file per category. To add or edit one:

1. Open the category's file in `src/cards/`.
2. Copy an existing `.card` block as a template.
3. Fill in the name, address, phone, map link, and any social links.
4. Update the `data-search` attribute so the entry stays searchable.
5. Run `python3 build.py`.

## Sources & attribution

Entries are compiled in collaboration with:
- [Контакты и база знаний](https://etonawa.notion.site/3332f9074e57803491e5f2449cdd8480) and [Транспорт и доставка](https://etonawa.notion.site/3392f9074e578082bd22e06251706381) — etonawa.notion.site, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), with no warranties given
- The index's own entries, added and verified independently

Entries taken from those databases are translated, edited and extended here.

### Giving back

The relationship runs both ways — this index is not a downstream copy that only
takes. Work done here is returned to the upstream databases:

- **Verifying and correcting** entries whose phone numbers, addresses or hours
  turned out to be wrong
- **Adding new entries** found and confirmed independently
- **Filling out existing entries** with detail the source did not carry — exact
  coordinates, map links, socials, second phone numbers
- **Refreshing stale data** as businesses move, change hands or close

Every content change is logged in `SOURCE-SYNC.md` in the upstream schema and
pushed back through the pipeline in `notion_tables_one-way_bridge/`, so a change
made here can be replayed in Notion from the log alone. ShareAlike on both sides
is what makes that possible without a rights negotiation each time.

Map geometry and tiles are © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
licensed [ODbL](https://opendatacommons.org/licenses/odbl/1-0/).

## Disclaimer

This directory is a community-maintained, best-effort resource. Entries may become outdated, inaccurate, or incomplete over time, and inclusion in this index is not an endorsement. Nobody involved in compiling or maintaining this index is responsible for the accuracy of any listing, or for the quality, safety, or conduct of any business, service, or individual listed here. Use your own judgment, and verify details independently before relying on them.

## License

Not one work — three parts, three sets of terms.
**[`LICENSES.md`](LICENSES.md) is the map;** this is the short version.

| Part | Terms |
| --- | --- |
| **Directory content** — the entries and their arrangement | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — [`LICENSE`](LICENSE) |
| **Code** — `build.py`, `src/js/`, the CSS and page structure, the sync pipeline | [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) — [`LICENSE-CODE`](LICENSE-CODE) |
| **The name "The Vanadzor Index", the masthead and the pomegranate mark** | All rights reserved |

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
