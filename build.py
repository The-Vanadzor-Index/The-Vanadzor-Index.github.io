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
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "src" / "index.template.html"
CARDS_DIR = ROOT / "src" / "cards"
JS_DIR = ROOT / "src" / "js"
I18N_DIR = ROOT / "src" / "i18n"
OUTPUT = ROOT / "index.html"

# English is the source language: it is what the sources are written in and what
# a reader without JavaScript gets, so it has no file of its own. Order here is
# the order the language picker offers them in.
LANGS = ["hy", "ru", "fr", "es"]

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


def mark_duplicates(markup):
    """Stamp data-duplicate="true" on every cross-referenced copy.

    Which cards are duplicates is stated in a comment above each one, which
    the counts here already read -- but a comment is not something the page
    can act on, so the result counter in the controls bar counted the copies
    and disagreed with the masthead. This carries the same fact into the DOM.
    Written into the built page only, never back into src/cards/, and it
    leaves the class attribute alone so CARD_RE and the counts above are
    unaffected.
    """
    out, pos = [], 0
    for mark in re.finditer(re.escape(DUPLICATE_MARK), markup):
        card = CARD_RE.search(markup, mark.end())
        if card is None:
            raise BuildError(f"a {DUPLICATE_MARK!r} comment has no card after it")
        out.append(markup[pos : card.end()])
        out.append(' data-duplicate="true"')
        pos = card.end()
    out.append(markup[pos:])
    return "".join(out)


def read_script(prelude=""):
    """The JS modules, in filename order, re-indented to sit inside <script>.

    They are concatenated into one block, so they go on sharing a single scope
    -- which is what lets 03-chips.js call applyFilters() out of 02-filtering.js
    and what makes filename order part of the contract.
    """
    paths = sorted(JS_DIR.glob("*.js"))
    if not paths:
        raise BuildError(f"no JS modules in {JS_DIR}")

    modules = []
    for path in [None] + paths:
        body = prelude if path is None else path.read_text(encoding="utf-8")
        if not body:
            continue
        if path is not None and not body.endswith("\n"):
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
            r'<a class="chip[^"]*" data-cat="([^"]*)"[^>]*? href="#([^"]*)"', row.group(0)
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
        r'(<div class="stamp"[^>]*>)\d+( entries on file</div>)',
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


# ---------------------------------------------------------------- i18n ------
#
# Translations live in src/i18n/<lang>.json and are keyed by the English source
# string, so the JSON is readable on its own and a card edit that does not touch
# wording needs no i18n edit at all. The build carries them into the page as
# data-t-<lang> attributes beside the English text rather than emitting one file
# per language: the offline-download button serializes the live DOM, so a single
# document is also what lets a saved copy come out in the language the reader
# was actually reading (04-offline-download.js drops the other four on the way
# out).
#
# Two ways in. Cards are uniform, so the build finds their translatable text by
# shape -- .card-name, .card-tag, the glyph rows -- and never needs marking up
# by hand. The template is prose and is marked instead: an element opts in with
# a bare data-t (its own text is the key), data-th (its own inner HTML is the
# key, for a sentence with links in it), or data-ta / data-tp / data-tt for the
# aria-label, placeholder and title attributes.
#
# The English original is deliberately *not* written into the page. The runtime
# remembers it in a Map the first time it swaps an element, which keeps ~90KB of
# duplicated English out of the document.

MARKERS = {
    "data-t": ("t", "text"),
    "data-th": ("th", "html"),
    "data-ta": ("ta", "aria-label"),
    "data-tp": ("tp", "placeholder"),
    "data-tt": ("tt", "title"),
}

# A marker may name the table to look its key up in -- data-t="cat" on a chip,
# whose wording is the category's, not a string of its own. Bare means "ui".
# The name is stripped on the way out: the runtime only ever asks for [data-t].
MARKER_TABLE = re.compile(r'^="([a-z]+)"')

# Counts are stamped into the page by the build, so "393 entries on file" is not
# a string anyone can put in a table. data-tn keys on the shape instead -- runs
# of digits stand in as {n} -- and the digits are put back on the way out.
NUMBER_RUN = re.compile(r"\d[\d,\u202f ]*\d|\d")

# Card text the build finds by shape. Each is (pattern, table) where the pattern
# captures the open tag's end and the inner text, and table names the i18n
# section the inner text is looked up in.
CARD_SHAPES = [
    (re.compile(r'(<div class="card-name")(>)(.*?)(</div>)', re.S), "name"),
    (re.compile(r'(<span class="card-tag")(>)(.*?)(</span)', re.S), "sub"),
    (re.compile(r'(<div class="subgroup-label")(>)(.*?)(</div>)', re.S), "sub"),
    (re.compile(r"(<h2)(>)(.*?)(</h2>)", re.S), "cat"),
]
GLYPH_TABLES = {"\u2302": "addr", "\u270e": "note", "\u20b3": "price"}

# The text of a link in a card row. Most are a brand or a bare domain and stay
# as they are; only the few in the "link" table get attributes, so this pass
# needs no list of what to skip -- an absent key simply leaves the link alone.
LINK_SHAPE = re.compile(r'(<a\b[^>]*)(>)(.*?)(</a\s*>)', re.S)
# The ">" of a tag can sit on the next line -- prettier breaks a long row that
# way -- so every bracket here tolerates whitespace before it. A tighter pattern
# silently skips exactly the longest notes, which are the ones most worth having.
GLYPH_SHAPE = re.compile(
    r'(<span class="glyph">(.)</span\s*>\s*<span)(\s*>)(.*?)(</span\s*>)', re.S
)


def plural_form(lang, n):
    """Index of the plural form `n` takes. Mirrors 00-i18n.js's pluralForm."""
    if lang == "ru":
        last, tens = n % 10, n % 100
        if last == 1 and tens != 11:
            return 0
        if 2 <= last <= 4 and not 12 <= tens <= 14:
            return 1
        return 2
    return 0 if n == 1 else 1


class Translations:
    """The four language tables, plus the lookup and escaping around them."""

    def __init__(self, tables):
        self.tables = tables

    @classmethod
    def load(cls):
        tables = {}
        for lang in LANGS:
            path = I18N_DIR / f"{lang}.json"
            if not path.exists():
                raise BuildError(
                    f"no {path.relative_to(ROOT)}; every language in LANGS needs one"
                )
            try:
                tables[lang] = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:
                raise BuildError(f"{path.relative_to(ROOT)}: {exc}") from exc
        return cls(tables)

    def get(self, lang, table, key):
        return self.tables[lang].get(table, {}).get(key)

    def counted(self, prefix, table, key, missing=None):
        """data-<prefix>-<lang> for a string whose digits the build supplies.

        A value may carry its plural forms separated by "|", in the order the
        language's own rule numbers them -- Russian has three and picks by the
        last digit, which is the difference between "391 записей" and the
        correct "391 запись". A value with no "|" has one form and is used as
        it stands, which is what Armenian needs: it does not inflect after a
        numeral. This mirrors pluralForm() in src/js/00-i18n.js; the two have
        to agree, since the same tables feed both.
        """
        numbers = NUMBER_RUN.findall(key)
        shape = NUMBER_RUN.sub("{n}", key)
        count = int(re.sub(r"\D", "", numbers[0])) if numbers else 0
        out = []
        for lang in LANGS:
            value = self.get(lang, table, shape)
            if value is None:
                if missing is not None:
                    missing.setdefault((table, shape), []).append(lang)
                continue
            forms = value.split("|")
            value = forms[min(plural_form(lang, count), len(forms) - 1)]
            for number in numbers:
                value = value.replace("{n}", number, 1)
            out.append(f' data-{prefix}-{lang}="{html.escape(value, quote=True)}"')
        return "".join(out)

    def attrs(self, prefix, table, key, missing=None):
        """The data-<prefix>-<lang> attributes for one English string.

        Returns "" when no language has it, so an untranslated string simply
        stays English rather than becoming a marked element with nothing behind
        it. Anything missing is recorded for the build's own report.
        """
        out = []
        for lang in LANGS:
            value = self.get(lang, table, key)
            if value is None:
                if missing is not None:
                    missing.setdefault((table, key), []).append(lang)
                continue
            out.append(f' data-{prefix}-{lang}="{html.escape(value, quote=True)}"')
        return "".join(out)


def element_inner(markup, open_tag_start):
    """Range of an element's inner HTML, counting same-name tags to stay level.

    Needed because a data-th block is a sentence with <a> and <strong> in it and
    may nest the tag it is itself made of; a non-greedy match would stop at the
    first inner close tag.
    """
    name = re.match(r"<([A-Za-z][\w-]*)", markup[open_tag_start:]).group(1)
    open_end = markup.index(">", open_tag_start) + 1
    depth, i = 1, open_end
    step = re.compile(rf"</?{re.escape(name)}\b", re.I)
    while depth:
        m = step.search(markup, i)
        if not m:
            raise BuildError(f"unclosed <{name}> at offset {open_tag_start}")
        depth += -1 if m.group(0)[1] == "/" else 1
        i = m.end()
    return open_end, markup.rindex("</", open_end, i)


def collapse(text):
    """The lookup key for a run of markup: entities resolved, spaces squeezed."""
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def collapse_html(markup):
    """The lookup key for a data-th block: its markup on one line.

    The template writes tags broken across lines (prettier's doing), which would
    make a key nobody could type into a JSON file by hand. Squeezing runs of
    whitespace and closing up the space before every ">" turns
    `<a\n  href="..."\n  >Vanadzor</a\n>` back into `<a href="...">Vanadzor</a>`,
    which is what a translator writes and what innerHTML puts back.
    """
    out = re.sub(r"\s+", " ", markup).strip()
    return re.sub(r"\s+>", ">", out)


def translate_cards(markup, tr, missing):
    """Add data-t-<lang> to every card element the build can recognise by shape."""

    def shape(pattern, table):
        def repl(m):
            open_tag, gt, inner, close = m.groups()
            key = collapse(inner)
            attrs = tr.attrs("t", table, key, missing)
            return f"{open_tag}{' data-t' if attrs else ''}{attrs}{gt}{inner}{close}"

        return pattern.sub(repl, markup)

    for pattern, table in CARD_SHAPES:
        markup = shape(pattern, table)

    # "40 entries" carries a number the build itself stamps in, so it is keyed
    # on its shape and the digits are put back per language.
    def count_repl(m):
        open_tag, gt, inner, close = m.groups()
        attrs = tr.counted("t", "ui", collapse(inner), missing)
        return f"{open_tag}{' data-t' if attrs else ''}{attrs}{gt}{inner}{close}"

    markup = re.compile(
        r'(<span class="cat-count")(>)(.*?)(</span>)', re.S
    ).sub(count_repl, markup)

    def link_repl(m):
        open_tag, gt, inner, close = m.groups()
        key = collapse(inner)
        if not any(tr.get(lang, "link", key) for lang in LANGS):
            return m.group(0)
        attrs = tr.attrs("t", "link", key, missing)
        return f"{open_tag}{' data-t' if attrs else ''}{attrs}{gt}{inner}{close}"

    markup = LINK_SHAPE.sub(link_repl, markup)

    def glyph_repl(m):
        head, glyph, gt, inner, close = m.groups()
        table = GLYPH_TABLES.get(glyph)
        if not table:
            return m.group(0)
        # A handful of notes carry a <br /> between two sentences. Swapping
        # those through textContent would print the tag, so they translate as
        # HTML instead -- keyed on the same collapsed markup a data-th block is.
        markup_inside = "<" in inner
        prefix = "th" if markup_inside else "t"
        key = collapse_html(inner) if markup_inside else collapse(inner)
        attrs = tr.attrs(prefix, table, key, missing)
        marker = f" data-{prefix}" if attrs else ""
        return f"{head}{marker}{attrs}{gt}{inner}{close}"

    return GLYPH_SHAPE.sub(glyph_repl, markup)


def translate_marked(markup, tr, missing):
    """Fill in every element that opted in with a data-t/-th/-ta/-tp/-tt marker.

    The marker may name the table to look in (data-t="cat" on a category chip,
    whose wording belongs to the category and not to the chip) and may ask for
    the counted form (data-tn, for the strings the build stamps a number into).
    Whatever it said, what is left in the page is the bare marker: the runtime
    only ever asks for [data-t].
    """
    for marker, (prefix, kind) in MARKERS.items():
        pattern = re.compile(
            rf'<[A-Za-z][\w-]*[^>]*?\s{marker}(?P<spec>n?)(?:="(?P<table>[a-z]+)")?(?=[\s/>])'
        )
        out, pos = [], 0
        for m in pattern.finditer(markup):
            if m.start() < pos:
                continue
            open_tag_end = markup.index(">", m.start()) + 1
            if kind in ("text", "html"):
                inner_a, inner_b = element_inner(markup, m.start())
                raw = markup[inner_a:inner_b]
                key = collapse_html(raw) if kind == "html" else collapse(raw)
            else:
                found = re.search(rf'{kind}="([^"]*)"', markup[m.start() : open_tag_end])
                if not found:
                    raise BuildError(
                        f"{marker} on an element with no {kind}: "
                        f"{markup[m.start():open_tag_end][:120]}"
                    )
                key = collapse(found.group(1))
            table = m.group("table") or ("html" if kind == "html" else "ui")
            if m.group("spec") == "n":
                attrs = tr.counted(prefix, table, key, missing)
            else:
                attrs = tr.attrs(prefix, table, key, missing)
            # Rewrite the marker without its spec so the page carries the short
            # form, then hang the translations off it. The offset is computed
            # rather than searched for: an element carrying both data-ta and
            # data-t would otherwise have its data-ta eaten by the search for
            # the shorter name.
            tail = len(marker) + len(m.group("spec"))
            if m.group("table"):
                tail += len(m.group("table")) + 3
            out.append(markup[pos : m.end() - tail])
            out.append(marker)
            out.append(attrs)
            pos = m.end()
        out.append(markup[pos:])
        markup = "".join(out)
    return markup


SEARCH_SOURCES = (
    (re.compile(r'<div class="card-name"[^>]*>(.*?)</div>', re.S), "name"),
    (re.compile(r'<span class="card-tag"[^>]*>(.*?)</span', re.S), "sub"),
    (
        re.compile(
            r'<span class="glyph">\u2302</span\s*>\s*<span[^>]*?\s*>(.*?)</span\s*>', re.S
        ),
        "addr",
    ),
)


def augment_search(markup, tr):
    """Fold each card's translated name, tag and address into its data-search.

    Search is a substring match against that one attribute, so a reader typing
    \u0561\u057f\u0561\u0574 or \u0441\u0442\u043e\u043c\u0430\u0442\u043e\u043b\u043e\u0433 finds nothing unless the translations are in
    there beside the English. They are appended rather than swapped so that a
    Latin-keyboard search keeps working on every language.
    """
    cards = list(re.finditer(r'<div\n\s+class="card[^"]*"', markup))
    out, pos = [], 0
    for start in cards:
        _, end = element_inner(markup, start.start())
        body = markup[start.start() : end]
        blob = re.search(r'data-search="([^"]*)"', body)
        if not blob:
            continue
        terms = []
        for pattern, table in SEARCH_SOURCES:
            for hit in pattern.finditer(body):
                key = collapse(hit.group(1))
                for lang in LANGS:
                    value = tr.get(lang, table, key)
                    if value:
                        terms.append(value.lower())
        extra = " ".join(dict.fromkeys(t for t in terms if t))
        if not extra:
            continue
        at = start.start() + blob.start(1)
        to = start.start() + blob.end(1)
        out.append(markup[pos:to])
        out.append(" " + html.escape(extra, quote=True))
        pos = to
    out.append(markup[pos:])
    return "".join(out)


def i18n_module(tr, total, counts):
    """The generated JS table: runtime strings, metadata, and the two counts.

    Emitted as the first module in the script block so that t() is defined
    before 09-map.js and the rest reach for it, exactly the way filename order
    orders the hand-written files.
    """
    payload = {}
    for lang in LANGS:
        table = tr.tables[lang]
        payload[lang] = {
            "meta": table.get("meta", {}),
            "js": table.get("js", {}),
            # The map popup's head strip names the category of the marker it
            # is about, and it builds that strip at runtime, so the seven
            # category names have to travel with the script and not only sit
            # in the chip row's attributes.
            "cat": table.get("cat", {}),
            # The description carries the entry total, so it picks a plural
            # form the same way a cat-count does -- "391 записей" is wrong
            # where "391 запись" is right, and a bare replace() cannot know.
            "doc": {
                key: value.split("|")[
                    min(plural_form(lang, total), len(value.split("|")) - 1)
                ].replace("{n}", str(total))
                for key, value in table.get("doc", {}).items()
            },
        }
    literal = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    return (
        "// Generated by build.py from src/i18n/*.json -- do not edit here.\n"
        f"var I18N_LANGS = {json.dumps(LANGS)};\n"
        f"var I18N = {literal};\n"
    )


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

    tr = Translations.load()
    missing = {}

    body = "".join(s["markup"] for s in sections)
    body = translate_cards(body, tr, missing)
    body = augment_search(body, tr)
    body = mark_duplicates(body)

    page = translate_marked(apply_total(template, total), tr, missing)
    counts = {s["id"]: s["count"] for s in sections}
    document = page.replace(CARDS_SLOT, body).replace(
        SCRIPT_SLOT, read_script(i18n_module(tr, total, counts))
    )
    return document, sections, total, restamped, missing


def main(argv):
    check_only = "--check" in argv[1:]
    unknown = [a for a in argv[1:] if a not in ("--check", "--strings")]
    if unknown:
        sys.exit(f"unknown argument(s): {' '.join(unknown)}\n\n{__doc__}")

    try:
        document, sections, total, restamped, missing = build(write=not check_only)
    except BuildError as exc:
        sys.exit(f"build failed: {exc}")

    for line in restamped:
        print(f"  {'stale count' if check_only else 'recounted'} {line}")

    if missing:
        by_lang = {}
        for (table, key), langs in missing.items():
            for lang in langs:
                by_lang.setdefault(lang, []).append(f"{table}: {key}")
        print(
            "  untranslated (left in English): "
            + ", ".join(f"{lang} {len(v)}" for lang, v in sorted(by_lang.items()))
        )
        if "--strings" in argv[1:]:
            for lang, keys in sorted(by_lang.items()):
                for key in keys:
                    print(f"    {lang}  {key}")

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
