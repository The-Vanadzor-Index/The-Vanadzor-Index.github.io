# Favicon sources

The drawings the site's icons are rasterized from. Nothing in this directory
(`favicon_assets/favicon_src/`) is served — `_config.yml` excludes it. The
site references only files one level up, in `favicon_assets/`:

| File | Drawn from | Where it is used |
| --- | --- | --- |
| the `rel="icon"` data URI in `index.html` | `favicon.svg` | every browser that takes an SVG favicon; the only icon an offline snapshot keeps |
| `/favicon.ico` (16, 32, 48) | `favicon-small.svg` | anything that requests `/favicon.ico` blindly — older browsers, Windows pins, link scrapers. Stays at the repo root: that blind request never looks in `favicon_assets/` |
| `favicon_assets/apple-touch-icon.png` (180) | `favicon-bleed.svg` | iOS "Add to Home Screen" |
| `favicon_assets/icon-192.png`, `favicon_assets/icon-512.png` | `favicon.svg` | Android home-screen shortcuts, install prompts |

## Why three drawings and not one

**The "V" is a path, not a `<text>` element.** It was live text until the
outline replaced it, which meant the icon was only the right shape on machines
carrying Georgia — Android and most Linux fell back to a generic serif with
different widths, and the letter drifted off-centre. The outline is Georgia
Bold's own `V`, extracted with fontTools at the size and position the old
`<text>` had, so the icon is unchanged where Georgia existed and finally
correct where it didn't. Re-cut it the same way if the letter ever changes;
don't put text back.

**`favicon-small.svg` is not `favicon.svg` scaled down.** The full drawing is
laid out on a 64-unit grid, so at 16px its 2px border lands on half a pixel and
the red dot on about two thirds of one — both dissolve into grey. The small
drawing is on a 16-unit grid instead: whole-pixel border, no dot, no rule, and a
much larger V. Compare them at 32px and the difference is not subtle.

**`favicon-bleed.svg` has no border or rounded corners** because iOS applies its
own mask; a second rounding inside it reads as a mistake. It is also the one
drawing saved without alpha, which iOS prefers.

## Regenerating

Rasterize each SVG at the sizes in the table (any renderer that handles
`clip-path` will do), then pack 16/32/48 into `favicon.ico`. If the artwork
changes, the data URI in `index.html` has to be rebuilt from `favicon.svg` too —
it is a base64 copy, not a reference.
