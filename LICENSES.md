# Licensing

The Vanadzor Index is not one work. The published site is a single page —
`index.html` — served alongside the masthead artwork; behind it sits a
pipeline that syncs changes back upstream. Content, code and artwork run
through all of it, they came from different places, and they carry different
terms. This file says which is which.

| Part | Terms | File |
| --- | --- | --- |
| The directory content — the entries and their arrangement | CC BY-NC-SA 4.0 | [`LICENSE`](LICENSE) |
| The code — page structure, CSS, JavaScript, sync pipeline | PolyForm Noncommercial 1.0.0 | [`LICENSE-CODE`](LICENSE-CODE) |
| The name, the masthead and the site icon | All rights reserved | this file, below |
| Map geometry and tiles | © OpenStreetMap contributors, ODbL | this file, below |

Everything here is noncommercial. If you want to use any part of the index
commercially, ask: <kocharyan.armen@protonmail.com>.

---

## 1. The directory content

**Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).**
Full text in [`LICENSE`](LICENSE).

This covers the directory entries — names, addresses, phone numbers, links,
tags and notes — together with the selection, translation, verification and
arrangement of them into categories and subcategories.

### Upstream

The index is compiled in collaboration with two upstream Notion databases,
**Контакты и база знаний** and **Транспорт и доставка**
([etonawa.notion.site](https://etonawa.notion.site/3332f9074e57803491e5f2449cdd8480)),
which are licensed CC BY-NC-SA 4.0. The directory content here is licensed
under the same terms, and anyone redistributing it credits those databases
alongside this index — see Attribution, below.

### Attribution

Under section 3(a)(1)(A)(i) of CC BY-NC-SA 4.0 the licensor may specify the
manner of attribution. **The manner requested is this block, reproduced whole:**

```
The Vanadzor Index — https://the-vanadzor-index.github.io/
Directory content by Armen Kocharyan, licensed CC BY-NC-SA 4.0:
https://creativecommons.org/licenses/by-nc-sa/4.0/
Compiled in collaboration with "Контакты и база знаний" and
"Транспорт и доставка" (etonawa.notion.site), licensed CC BY-NC-SA 4.0.
No warranties are given.
```

Add a line saying what you changed, and keep any note of earlier changes —
section 3(a)(1)(B) requires both.

**Where it has to go.** The block must be legible to a human reader, in text,
in the same view as the content it credits — not in a build artifact, a commit
message, a licence file nobody opens, or a page reachable only by scrolling
past the material. Where the adaptation carries other credits, this one must be
no less prominent than the most prominent of them. Links must be live where the
medium supports links.

**The honest limit on this.** Section 3(a)(2) lets you satisfy the attribution
conditions "in any reasonable manner based on the medium, means, and context",
so what is written above is a request that reasonableness governs, not a
typographic specification the licence will enforce. A credit that a reader
would plainly see and understand meets it. A credit buried where nobody
encounters it does not, and that is the part worth taking seriously.

### Attributing this index upstream

The obligation runs both ways. Anyone redistributing this content is crediting
two upstream databases as well as this index, which is why their names and
licence appear inside the block above rather than as an optional extra.

---

## 2. The code

**Licensed under [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0).**
Full text, with the Required Notice, in [`LICENSE-CODE`](LICENSE-CODE).

This covers the CSS, the page structure and the JavaScript of
`index.html` and everything under `notion_tables_one-way_bridge/` — and the
compiled copies of all of that inside any offline snapshot saved from it.

None of it is derived from the upstream databases, so it is licensed
separately. PolyForm Noncommercial was chosen so
that the code carries the same noncommercial boundary as the content: read it,
run it, fork it, change it, host it, for any noncommercial purpose. Selling it
or building a commercial service on it needs permission.

The licence's Notices section requires that the `Required Notice:` line travel
with every copy. Public deployments must additionally show the attribution
block from section 1 in the manner described there — the code and the content
are credited together, in one place, because readers encounter them as one
page.

Creative Commons licences are not designed for software, which is why the code
does not simply inherit the content licence.

Offline snapshots saved through the download button contain both, under both
sets of terms.

---

## 3. The name, the masthead and the mark

**All rights reserved. Not licensed under either licence above.**

- the name **"The Vanadzor Index"** — in any language, script or
  transliteration, and in any translation, rendering or close variant of it,
  whether or not that form has ever been used here
- the masthead artwork — `vanadzor-masthead.psd`, `vanadzor-masthead.jpg`
- the site icon — the inline SVG favicon in `index.html`

The masthead ships as a published file in its own right — `vanadzor-masthead.jpg` is
served by the site alongside `index.html`. Being served with the page grants
no licence to it.

Section 2(b)(2) of CC BY-NC-SA 4.0 says plainly that trademark rights are not
licensed by it, and the masthead and the icon are original artwork that no
upstream obligation touches. Nothing in either licence above grants any right
to use these.

**So: a fork must rename.** You may take the entries under CC BY-NC-SA 4.0 and
the code under PolyForm Noncommercial, and you may say truthfully that your
work is derived from The Vanadzor Index — that is the attribution required
above, and nominative reference of that kind is fine. You may not call your
version The Vanadzor Index, publish it under the masthead, or use the mark as
its identity, in a way that would leave a reader unsure whose work they are
looking at.

**Translating the name does not get around this.** *L'Index de Vanadzor*,
*El Índice de Vanadzor*, *Ванадзорский индекс*, *Վանաձորի ինդեքս* and anything
else that reads as the same name in another language are the same name for the
purposes above. A reader who would take your title for this project's title is
the test, not whether the strings match.

The index is published in more than one language, so this is the ordinary case
rather than an edge one: the name travels with the translations, and each
translated form is reserved on the same terms as the English.

---

## 4. Third-party material

**OpenStreetMap.** The map panel draws tiles from `tile.openstreetmap.org` and
the city plate is an SVG traced from OpenStreetMap geometry. Both are
*Produced Works* under section 4.4(b) of the
[ODbL](https://opendatacommons.org/licenses/odbl/1-0/) — renderings, not
databases — so they may be published under the terms above provided
OpenStreetMap is credited and the ODbL identified, which the plate credit and
the map panel both do.

**This must stay true.** Extracting coordinates from OpenStreetMap into
`data-geo`, or assembling any coordinate dataset from it, would produce a
*Derivative Database* instead, and section 4.4 would then force ODbL onto it.
ODbL has no noncommercial concept and cannot coexist with the NC element here.
Keep OpenStreetMap on the Produced Work side of that line.

**Nominatim** supplies reverse-geocoded place names at request time, under the
same ODbL data. Nothing is stored.

**Yandex Maps** org URLs come from the upstream databases; the `data-geo`
coordinates are read from the pages those URLs point at. Individual coordinate
pairs are facts, but their systematic collection is governed by Yandex's own
terms rather than by anything in this file, and no licence granted here purports
to cover them.

---

## 5. What this index gives back

Work done here is contributed back to the upstream databases. Entries are verified and corrected, new entries are researched and added,
existing ones are filled out with detail the upstream databases did not
originally have, and stale data is refreshed.

Every content change is logged in
[`SOURCE-SYNC.md`](SOURCE-SYNC.md) in the upstream schema and pushed back
through the pipeline in [`notion_tables_one-way_bridge/`](notion_tables_one-way_bridge/),
so a change made here can be replayed upstream from the log alone.

Matching licences on both sides are what let corrections flow back without a
rights negotiation each time.

---

## 6. Adding new sources later

Every additional copyleft source narrows what the index can do, and the
NonCommercial element is the binding constraint:

- **CC BY-SA 4.0 material cannot be absorbed.** BY-SA requires adaptations
  under BY-SA or GPLv3; BY-NC-SA has different licence elements and is not a
  permitted adapter's licence for it. Keeping such material as a separate,
  separately-marked collection is the only route, and it is fragile once
  directory cards interleave.
- **GPL and AGPL code cannot be combined in.** The GPL forbids adding a
  noncommercial restriction.
- **ODbL data cannot be absorbed as data.** See section 4.

Before taking on a new copyleft source, check it against this list first.

---

*This file describes the licensing intent of the project. It is not legal
advice.*
