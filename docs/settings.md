# Settings

The settings shape, defaults and loading are in `src/core/settings.ts`.

## Shape

| Key | Default | Empty means |
| --- | --- | --- |
| `version` | `1` | |
| `pandocPath` | `pandoc` | The default |
| `bibliography` | `Literature/library.bib` | Present without citations |
| `literatureFolder` | `Literature` | The default |
| `keyProperty` | `citekey` | The default |
| `csl` | `''` | Pandoc's default, Chicago author-date |

`loadSettings` builds a fresh object from the keys it knows, so a key nothing reads any more is dropped. It trims,
because a stray space in a path is a silent miss. A value of the wrong type reads as its default.

## What isn't a setting

Settings are addresses: where pandoc is, which bibliography, which papers folder, which key property, which style.
They stay separate from Due Credit's, because each plugin has to work alone. How a note becomes slides is the
product and stays in code. How slides look is the theme's and CSS snippets'.
