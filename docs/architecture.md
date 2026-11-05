# Architecture

Take the Floor reads a note, has pandoc make slides of it, and shows those in a window of their own,
with the notes in a pane in the main window. It writes nothing in the vault, and talks to nothing but
pandoc and, on niri, `niri`, except to download the built-in pandoc, once, when there's none installed.

## Layers

Every decision about a note, its citations and pandoc's command line is in
[obsidian-citation-core](https://codeberg.org/BW20/obsidian-citation-core), which Take the Floor shares
with its sibling plugins and bundles into `main.js`. That includes where one slide ends (`slidesOf`), and
what goes at a slide's foot (`pandoc/slides.lua`). The core's
[pipeline](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/docs/pipeline.md#a-note-as-slides)
describes those steps.

| Path | What it holds |
| --- | --- |
| `src/core/settings.ts` | The settings shape, defaults and loading. |
| `src/core/talk.ts` | Pairing slides with notes, moving through them, scaling, what each key does, what counts as too long, and which note gets a button. |
| `src/core/screens.ts` | How a window gets to another screen here, and which screen. |
| `src/commands/render.ts` | A note as slides: checks the settings, picks the pandoc, lists lost citations, runs pandoc and pairs the result with the notes. |
| `src/commands/presentation.ts` | A talk in progress: its two windows, keys, idle block, hiding and editing, and screens coming and going. |
| `src/commands/placement.ts` | Moving the window, through niri or the window itself. |
| `src/commands/pdf.ts` | The PDF. |
| `src/ui/views.ts` | The slideshow and the notes pane. |
| `src/ui/preview.ts` | The tab with every slide. |
| `src/ui/stage.ts` | A slide laid out at 1920 by 1080 and scaled, and measuring whether it fits. |
| `src/ui/title-bar.ts` | The Present button. |
| `src/ui/screen-picker.ts`, `src/ui/confirm.ts`, `src/ui/settings-tab.ts` | The dialogs and the settings tab. |
| `src/context.ts` | What a command gets from the plugin. |
| `src/main.ts` | Registers the views, commands and menu items. |
| `src/modules.d.ts` | What esbuild bundles from the core, and the part of Electron used here. |

`src/core/` is pure, and each file there has a test named after it. `src/commands/` and `src/ui/` wire it to
Obsidian and decide nothing.

## Pressing Present

1. `renderTalk` does everything that can fail, before a window opens. `slidesOf` takes the speaker notes out
   and marks the breaks, `prepare` reads the rest, and pandoc runs with `slideArgs`.
2. `withNotes` pairs pandoc's slides with the notes. If the counts differ it stops, because a note would show
   over the wrong slide.
3. `chooseScreen` finds where the slides go, and asks if there's more than one place.
4. `Presentation` opens the popout and the notes pane, and `place` moves the window. Focus then goes back to the
   main window.

## Why it's built this way

- **The slideshow is on the popout's `<body>`, and not in its view.** A theme draws frames and margins on the
  containers around a view: Border does. Lying over all of it means no theme shows around the slides. For the
  same reason its CSS never uses a class on `<body>`, which spreads to the main window.
- **The popout is an Obsidian window** because that's how the theme and CSS snippets reach it.
- **Keys are caught with a capture listener, not a `Scope`.** An editor that takes the focus puts its own scope on
  top of a pushed one, so the keys would go into the note. `keyAction` says which keys are the talk's.
- **Talk messages go in the notes pane.** A `Notice` lands in the active window, which can be the slideshow, behind
  the slides.
- **Fullscreen goes through Electron.** Niri's action is a toggle, and its window list doesn't say which state a
  window is in. Niri only moves it.
- **The window is found by its title** in niri's list, because the popout has the main window's process id.
- **Timers are on the main window.** Obsidian's `debounce` stopped for good after a talk ended, which closes the
  window that was active.
- **A popout comes back on the next launch,** so `onLayoutReady` closes the plugin's views.
- **The PDF is printed from the main window** with the class `print`, because Obsidian's print styles hide everything
  else. The page size is an option to `printToPDF`, since `@page` in the stylesheet would change Obsidian's own Export
  to PDF.
- **`Slide.html` goes through `sanitizeHTMLToDom`,** as a note can hold raw HTML.
