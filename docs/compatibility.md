# Compatibility

Take the Floor's settings live in other people's vaults, people bind hotkeys to its commands, write talks with its
conventions, and style their slides with CSS snippets. This page says what a release may and may not change, so all
of that keeps working across updates. Changes are listed in [CHANGELOG.md](../CHANGELOG.md).

The version is `MAJOR.MINOR.PATCH`. A minor or patch release breaks nothing below. A major release may, and the
changelog then says what changed and what to do.

## Settings

They're in the plugin's `data.json`, in the shape in [Settings](settings.md#shape), and `loadSettings` reads them.

- **Renaming a key, or changing what a value means**, is breaking unless `loadSettings` reads the old one and carries
  it over, with `SETTINGS_VERSION` raised.
- **Adding** a key with a default isn't breaking, and neither is **removing** one: the loader drops keys it doesn't know.
- **A value of the wrong type** reads as its default.

## Your notes

- **Nothing is written in the vault** but the plugin's own settings. A change to that goes in the README's disclosure and
  `SECURITY.md` in the same release.
- **`---`:** alone at the start of a line, with a blank line or a heading above it or at the start of the note, starts a
  slide. Reading it differently is breaking, because a talk would fall apart differently. So is `***` starting one.
- **`%%comments%%`** are the speaker notes. They never reach a slide or a file, and letting one out is breaking and a
  security problem. So is showing an `<!-- HTML comment -->` anywhere.
- **The property `presentation: true`** gives a note its Present button. Renaming it is breaking, as templates hold it.
  **Present** keeps working on any note.
- **Citations** read as the core reads them, and Due Credit's
  [Citations](https://codeberg.org/BW20/obsidian-due-credit/src/branch/main/docs/citations.md) lists every form.

## CSS snippets

The names in [section 6.3 of the README](../README.md#63-changing-how-slides-look) are promised: `.take-the-floor-stage`,
`.slide`, `.slide.references`, `.slide-foot`, `.slide-reference` and `.slide-note`, and that a slide is laid out at 1920 by
1080 pixels. Renaming one, or changing that size, is breaking. Any other class can change.

## Commands

- **The plugin ID** `take-the-floor` never changes. It's the plugin's folder, where `data.json` lives, and the start of every
  command ID.
- **Command IDs** are `present`, `preview`, `export-pdf`, `next-slide`, `previous-slide`, `blank` and `end`. People bind hotkeys
  to them, so renaming or removing one is breaking. A command's name may change.
- **The keys during a talk** (`keyAction` in `src/core/talk.ts`) are in the README. People learn them, and clickers send them, so
  changing what one does is breaking. Adding one isn't, unless it takes a key from typing while the slides are hidden.
- There are no `obsidian://` URIs to keep.

## Obsidian and pandoc

- **`minAppVersion`** is 1.13.0. Raising it isn't breaking, because `versions.json` tells an older Obsidian which release it can
  still install.
- **Desktop only** (`isDesktopOnly`), because slides run pandoc and use Electron's windows.
- **Pandoc:** the oldest that works is 3.6.4 (the core's `OLDEST_PANDOC`). An older one from 3.0 on still runs, with a notice once a
  session. Needing a newer pandoc for something that already worked is breaking. An installed pandoc keeps coming first.

## Not covered

These can change in any release:

- How slides look by default: sizes, spacing and the layout of the notes pane.
- The wording of commands, notices and the settings tab.
- The code in `src/`, and the core's.

## The core

Most of how a note is read is the core's doing, so these promises hold for the core version a release bundles. A release that
moves to a new one reads the core's
[`CHANGELOG.md`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/CHANGELOG.md) since the last, checks each change
against this page, and writes what users notice under `## Unreleased`.
