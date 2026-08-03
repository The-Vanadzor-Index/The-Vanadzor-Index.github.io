#!/usr/bin/env python3
"""Assemble index.html from src/.

index.html is generated. Edit one of

    src/index.template.html   the page itself: <head>, <style>, masthead, footer
    src/cards/*.html          the directory entries, one file per category
    src/js/*.js               the behaviour, one file per feature, in name order

then run:

    python3 build.py            # rebuild index.html
    python3 build.py --check    # verify index.html is up to date; write nothing

The JS is concatenated back into the single inline <script> block it has always
been, in filename order -- so the files share one scope exactly as the original
top-to-bottom block did, and order is load-bearing: 02-filtering.js defines the
applyFilters() that 03-chips.js calls. Sources are stored unindented and the
build re-indents them to sit inside the <script> tag.

The entry counts that used to be maintained by hand -- each category's
<span class="cat-count">, the masthead stamp, and the two meta descriptions --
are computed here from the cards themselves and written into both the card
sources and index.html, so the four totals cannot drift apart again. Cards
marked with a "is a duplicate copy" comment are cross-references rather than
real entries and are subtracted, exactly as the counts always excluded them.

Standard library only, by design: the repo has no build tooling and this must
run anywhere python3 does.
"""

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "src" / "index.template.html"
CARDS_DIR = ROOT / "src" / "cards"
JS_DIR = ROOT / "src" / "js"
OUTPUT = ROOT / "index.html"

CARDS_SLOT = "      <!-- @@CARDS@@ -->\n"
SCRIPT_SLOT = "      <!-- @@SCRIPT@@ -->\n"
SCRIPT_INDENT = "      "

# A directory entry is a .card element. It carries a second class when it is a
# personal contact hidden by default, so match the class list, not the string.
CARD_RE = re.compile(r'class="(?:card|card personal-off)"')
DUPLICATE_MARK = "is a duplicate copy"


class BuildError(Exception):
    pass


def card_count(markup):
    """Real entries in a chunk of markup: .card elements less cross-references."""
    return len(CARD_RE.findall(markup)) - markup.count(DUPLICATE_MARK)


def read_script():
    """The JS modules, in filename order, re-indented to sit inside <script>.

    They are concatenated into one block, so they go on sharing a single scope
    -- which is what lets 03-chips.js call applyFilters() out of 02-filtering.js
    and what makes filename order part of the contract.
    """
    paths = sorted(JS_DIR.glob("*.js"))
    if not paths:
        raise BuildError(f"no JS modules in {JS_DIR}")

    modules = []
    for path in paths:
        body = path.read_text(encoding="utf-8")
        if not body.endswith("\n"):
            raise BuildError(f"{path.name}: must end with a newline")
        # Prepend the indent to every line that has content; a blank line stays
        # genuinely empty rather than becoming six spaces of trailing space.
        lines = [
            SCRIPT_INDENT + line if line.strip() else ""
            for line in body.rstrip("\n").split("\n")
        ]
        modules.append("\n".join(lines))
    # One blank line between modules, matching how the block was spaced when it
    # was written out longhand.
    return "\n\n".join(modules) + "\n"


def read_sections():
    """Card files in cat-N order, with the counts they should be stamped with."""
    paths = sorted(CARDS_DIR.glob("*.html"), key=lambda p: int(p.name.split("-", 1)[0]))
    if not paths:
        raise BuildError(f"no card files in {CARDS_DIR}")

    sections = []
    for index, path in enumerate(paths):
        markup = path.read_text(encoding="utf-8")
        cat = re.search(r'data-cat="([^"]*)"', markup)
        ident = re.search(r'id="(cat-\d+)"', markup)
        if not cat or not ident:
            raise BuildError(f"{path.name}: no data-cat/id on the section element")
        if ident.group(1) != f"cat-{index}":
            raise BuildError(
                f"{path.name}: id is {ident.group(1)} but it is file {index} in "
                f"order; the ids must run cat-0.. with no gaps, since the chips "
                f"link to them"
            )
        sections.append(
            {
                "path": path,
                "cat": cat.group(1),
                "id": ident.group(1),
                "markup": markup,
                "count": card_count(markup),
            }
        )
    return sections


def check_cards_match_section(section):
    """Every card in a file must claim the category of its enclosing section."""
    stray = {c for c in re.findall(r'<div\s+class="card[^"]*"\s+data-cat="([^"]*)"', section["markup"])}
    stray -= {section["cat"]}
    if stray:
        raise BuildError(
            f"{section['path'].name}: cards carry data-cat {sorted(stray)} but the "
            f"section is {section['cat']!r}; chip filtering matches the two"
        )


def check_chips(template, sections):
    """The chip row and the sections must agree in category, order and count."""
    row = re.search(r'id="chipRow".*?</div>', template, re.S)
    if not row:
        raise BuildError("no #chipRow in the template")
    chips = [
        (cat, target)
        for cat, target in re.findall(
            r'<a class="chip[^"]*" data-cat="([^"]*)" href="#([^"]*)"', row.group(0)
        )
        if cat != "all"
    ]
    expected = [(s["cat"], s["id"]) for s in sections]
    if chips != expected:
        raise BuildError(
            "the chip row does not match the card files.\n"
            f"  chips:    {chips}\n"
            f"  sections: {expected}\n"
            "Chips filter by data-cat and scroll to the section id, so both the "
            "order and the spelling have to line up."
        )


def stamp_counts(sections, write):
    """Put each section's own count into its card file. Returns what changed."""
    changed = []
    for section in sections:
        markup, n = section["markup"], section["count"]
        updated, hits = re.subn(
            r'(<span class="cat-count">)\d+(&nbsp;| )entries</span>',
            lambda m: f"{m.group(1)}{n}{m.group(2)}entries</span>",
            markup,
        )
        if hits != 1:
            raise BuildError(
                f"{section['path'].name}: expected exactly one cat-count span, found {hits}"
            )
        if updated != markup:
            was = re.search(r'<span class="cat-count">(\d+)', markup).group(1)
            changed.append(f"{section['path'].name}: {was} -> {n} entries")
            if write:
                section["path"].write_text(updated, encoding="utf-8")
        section["markup"] = updated
    return changed


def apply_total(template, total):
    """Stamp the whole-index total into the masthead and both meta descriptions."""
    out, hits = re.subn(
        r'(<div class="stamp">)\d+( entries on file</div>)',
        lambda m: f"{m.group(1)}{total}{m.group(2)}",
        template,
    )
    if hits != 1:
        raise BuildError(f"expected one masthead stamp in the template, found {hits}")

    out, hits = re.subn(
        r"(&mdash;|—) \d+( entries on file\.)",
        lambda m: f"{m.group(1)} {total}{m.group(2)}",
        out,
    )
    if hits != 2:
        raise BuildError(
            f"expected the total in both meta descriptions, found {hits} occurrences"
        )
    return out


def build(write=True):
    template = TEMPLATE.read_text(encoding="utf-8")
    for slot in (CARDS_SLOT, SCRIPT_SLOT):
        if slot not in template:
            raise BuildError(f"{TEMPLATE.name} has no {slot.strip()} line")

    sections = read_sections()
    for section in sections:
        check_cards_match_section(section)
    check_chips(template, sections)

    restamped = stamp_counts(sections, write)
    total = sum(s["count"] for s in sections)

    body = "".join(s["markup"] for s in sections)
    document = (
        apply_total(template, total)
        .replace(CARDS_SLOT, body)
        .replace(SCRIPT_SLOT, read_script())
    )
    return document, sections, total, restamped


def main(argv):
    check_only = "--check" in argv[1:]
    unknown = [a for a in argv[1:] if a != "--check"]
    if unknown:
        sys.exit(f"unknown argument(s): {' '.join(unknown)}\n\n{__doc__}")

    try:
        document, sections, total, restamped = build(write=not check_only)
    except BuildError as exc:
        sys.exit(f"build failed: {exc}")

    for line in restamped:
        print(f"  {'stale count' if check_only else 'recounted'} {line}")

    current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else None
    if check_only:
        if current != document:
            sys.exit("index.html is out of date -- run: python3 build.py")
        print(f"index.html is up to date ({total} entries)")
        return

    if current == document:
        print(f"index.html already current ({total} entries, {len(sections)} categories)")
        return

    OUTPUT.write_text(document, encoding="utf-8")
    for section in sections:
        print(f"  {section['id']:6} {html.unescape(section['cat']):24} {section['count']:>4}")
    print(f"wrote {OUTPUT.name}: {total} entries in {len(sections)} categories")


if __name__ == "__main__":
    main(sys.argv)
