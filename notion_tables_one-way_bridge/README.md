# notion_tables_one-way_bridge

Pushes content changes made on the site back into the two upstream Notion databases.

The site is edited faster than Notion is, so the databases drift. These scripts replay a
batch of site-side changes upstream: they update the rows that changed and create the ones
that never made it there, without duplicating anything.

Excluded from the published site by `_config.yml`, so nothing here is served by GitHub Pages.

## Requirements

- Python 3.11+. Standard library only, except `parse_site.py`, which needs
  `beautifulsoup4` and `lxml` (`python3 -m venv venv && ./venv/bin/pip install beautifulsoup4 lxml`).
- A Notion **integration token** (`ntn_…`) from <https://www.notion.so/my-integrations>.
  Put it in `$NOTION_TOKEN`, or in a `notion_token` file in this directory — that filename
  is git-excluded. Never pass it on a command line; it lands in shell history and in `ps`.
- Both databases **connected to the integration**: open each one, `⋯` → Connections → add
  it. A new integration reaches nothing and every call 404s until this is done. Adding a
  connection needs *Full access* on the page — "Can edit" is not enough — and a workspace
  whose *Who can manage page access* is set to Workspace owners blocks members entirely.

`config.py` defaults `DB_CONTACTS`/`DB_TRANSPORT` to the **test duplicates**. Override with
`NOTION_DB_CONTACTS` / `NOTION_DB_TRANSPORT` to hit the real databases.

## Before a batch that creates rows

**etonawa** is the databases' sole maintainer, and this site is downstream of them. Corrections
to rows that already exist upstream — a fixed phone number, a completed address, a tag, a note —
are pushed on sight: they repair data etonawa already maintains rather than add to it.

**Rows this batch would *create* are different.** Any site card with no upstream row (a blank
bridge key) adds a new entry to a database someone else maintains, so before running the pipeline
against the real databases, confirm with etonawa that those specific entries may be pushed. List
them by name and get an answer per batch — an earlier batch's approval does not carry over. If
some are not cleared, push the rest and leave those for a later run rather than holding the whole
sync.

Nothing local is gated by this: editing cards, writing `SOURCE-SYNC.md`, and every dry run —
including runs against the beta duplicates — are unaffected.

## Running it

```bash
python3 extract_exports.py     # 1. export .zip -> work/*_raw.csv
python3 parse_site.py          # 2. index.html -> work/site_cards.json
python3 apply_changes.py       # 3. apply this batch's edits -> work/*_edited.csv
python3 add_bridge_key.py      # 4. assign keys -> contacts_final.csv, transport_final.csv
python3 backfill_keys.py       # 5. FIRST RUN PER DATABASE ONLY (see below)
python3 upsert.py              # 6. dry run — read the diff
python3 upsert.py --commit     #    push it
python3 upsert.py              #    must now report zero changes
python3 push_notes.py          # 7. carry card notes into page bodies (--commit)
```

Steps 1–4 touch nothing but local files. Steps 5 and 6 are dry runs unless given `--commit`.

## What each step does

| Script | Role |
| --- | --- |
| `config.py` | Paths, database IDs, token loading. No network. |
| `notion_api.py` | Notion REST client, property conversion, row-similarity scoring. |
| `extract_exports.py` | Reads the nested export `.zip`s in memory (`unzip` mangles the UTF-8 filenames) and strips the header BOM. |
| `parse_site.py` | Parses every `.card` out of `index.html` — the site has no data file, the DOM is the data. |
| `apply_changes.py` | Applies one batch of changes. **Its two tables are a per-batch payload, not config** — replace their contents next time. |
| `add_bridge_key.py` | Assigns each row its bridge key and writes the push files. |
| `backfill_keys.py` | One-time per database: creates the new properties and fills in keys, then re-reads them and rewrites any that did not land. |
| `upsert.py` | PATCHes changed fields, creates blank-key rows, writes new keys back. |
| `push_notes.py` | Writes a card's ✎ note into the Notion page body — **only if that body is empty**. |

## The bridge key

`The-Vanadzor-Index_Bridge_Key` holds each row's own Notion page ID.

**Never key on the title.** Both databases contain rows sharing a `Заголовок`/`Name` — 7
pairs in Contacts. Anything matching on title lands both CSV rows on one Notion row and
leaves the other stale; measured on a duplicate table, that silently destroyed data in 4 of
the 7, with no error raised. Four of those pairs are genuinely different businesses that
share a name (two washing-machine repairmen, two Эдгар plumbers, two pools, two freight
numbers); three are one business filed under two `Категория` values (Forest 1961, MagHay
B&B, Музыкальная школа №1). Since `Категория` is a single-select, **none of them can be
deduplicated** — they are all legitimate rows.

Because the key *is* the page's own ID, backfilling it is self-referential and cannot
mis-assign. Rows sharing a title are told apart by their other field values.

### `contacts_final.csv` and `transport_final.csv` are the key store — keep them committed

A row created by a sync gets its key stamped in only after Notion assigns the page ID, so
that key exists **nowhere else**. Delete or regenerate these files from the export alone and
those rows go back to a blank key — which means "create" — and every one of them is
duplicated upstream. `add_bridge_key.py` reads the existing file first for exactly this
reason; its output should report keys *carried over*, not rebuilt from the export.

## Safety

- **Every write is a dry run first.** Read the diff; it is the review.
- **Only changed fields are written.** A full-row overwrite is far more destructive when a
  mapping is wrong.
- **Rehearse on a duplicate database**, and re-duplicate between attempts — a corrupted
  test table makes the next diff unreadable.
- **Verify from outside the script.** Re-query and check row count, key uniqueness, and
  that the 7 duplicate-title pairs still hold *distinct* values. A second dry run must
  report zero changes; anything else means the comparison is lying. Do not trust an
  importer's own success message — the run that flattened rows reported success.
- **Notion itself will occasionally answer a PATCH `200` and not persist it.** Measured on
  a beta run: one key in 303, at write #59, no error raised anywhere. `backfill_keys.py`
  therefore re-reads every key it wrote and rewrites the ones that are missing, up to
  `VERIFY_ROUNDS` times, and exits non-zero rather than print `written N` for keys that are
  not there. `upsert.py` needs no equivalent because the mandated second dry run is already
  that check — but it only covers *its own* writes, which is why step 5 carries its own.
  A `key missing upstream` count on the **first** upsert dry run after a fresh backfill
  means a key never landed, not a stale CSV.

Two normalisations exist for that reason: the export writes an unchecked checkbox as `No`
where the API reports `false`, and multi-select order carries no meaning. Without both,
every row shows a phantom change.

## Known limits

- **Schema.** `Адрес` is a `url` property, so street addresses live in `Адрес текстом`.
  Contacts ships with `Телефон`/`Телефон 2` only; `Телефон 3`/`Телефон 4` were added.
  One `Ссылка` column means a second link (a Facebook page beside a website) has nowhere
  to go.
- **Page-body prose** — opening hours, prices, caveats — cannot travel in a CSV at all.
  `push_notes.py` pushes it over the API instead, but only onto pages with an empty body,
  so notes written by hand upstream are never clobbered. Nothing pulls prose back down.
- **Translation is manual.** Turning `Sayat Nova Park — Leisure/Park` into
  `Парк Саят-Нова / Досуг / Достопримечательность / Туризм` is a judgement call, which is
  why `apply_changes.py` carries a hand-written payload rather than diffing the site.
- **Off-the-shelf CSV importers cannot do this.** They merge only on the database's
  `title` property and reject any other key column, which is the one key that corrupts
  rows here. They remain fine for a first bulk load into an empty database.
