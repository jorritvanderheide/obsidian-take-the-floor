# Take the Floor

**Present a note as slides, with its links turned into real citations and your speaker notes on your own screen.**

Works well with [Due Credit](https://community.obsidian.md/plugins/due-credit),
which exports a note to Word, PDF, Markdown or LaTeX with the same citations,
and [Paper Trail](https://community.obsidian.md/plugins/paper-trail), which
turns your Zotero library into a reading queue, with a note for each paper. See
[Works well with](#9-works-well-with).

<br/>

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=Downloads&query=%24%5B%22take-the-floor%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![Obsidian Compatibility](https://img.shields.io/badge/Obsidian-v1.13.0+-483699?logo=obsidian&style=flat-square)
![Desktop only](https://img.shields.io/badge/platform-desktop-483699?style=flat-square)
[![Checks](https://github.com/jorritvanderheide/obsidian-take-the-floor/actions/workflows/ci.yml/badge.svg)](https://github.com/jorritvanderheide/obsidian-take-the-floor/actions/workflows/ci.yml)
[![License: EUPL-1.2](https://img.shields.io/badge/license-EUPL--1.2-blue?style=flat-square)](LICENSE)

<!-- SCREENSHOT images/hero: a slide with a citation and its reference at the foot on the external screen, and Obsidian on the laptop with the notes pane open -->

You wrote the talk in your vault, with your citations as links and your thoughts
next to them. Then the conference asks for slides, and all of it gets typed
again in another program, where `[[marsh2024]]` means nothing and the reference
list is something you do by hand on the last evening.

Take the Floor shows the note itself. A line of `---` starts a new slide, your
`%%comments%%` are your speaker notes, and each citation shows its full reference
at the foot of the slide. You press **Present**, the slides fill the other screen,
and your notes stay on yours.

<br/>

## 1 Installation

In Obsidian, go to Settings → Community plugins → Browse, search for
"Take the Floor", and install and enable it. You can also find it on
[its page in the plugin directory](https://community.obsidian.md/plugins/take-the-floor).

Take the Floor needs Obsidian 1.13 or later, on desktop. Two things are optional:

- **Pandoc** makes the slides. If you have it installed, Take the Floor uses it.
  It needs pandoc 3.6.4 or later, and it's tested with 3.13. If you don't have it,
  Take the Floor offers to download pandoc for you the first time you present. This
  built-in pandoc is a 17 MB download that runs inside Obsidian.
- **For citations, export a `.bib` file from Zotero** with
  [Better BibTeX](https://retorque.re/zotero-better-bibtex/)'s auto-export turned
  on, so it stays up to date as you add papers. Without one, links show as plain
  text.

<br/>

## 2 Getting started

1. **Write a talk.** Any note works. Put a line of `---` between slides, with a
   blank line above it:

   ```markdown
   # Reading in public

   A claim about reading [[marsh2024]]. %%Say hello first.%%

   ---

   ## The second slide

   Words for the room. %%And something only you can see.%%
   ```

2. **Look at it.** Run **Preview slides** to see every slide in a tab, which updates
   when the note is saved.
3. **Present it.** Run **Present**. To have a button for it in the note's title bar,
   give the note the property `presentation: true`.

With a second screen, the slides fill it and your notes open in a pane next to your
note. With one screen, the slides stay in a window, so you can rehearse. Before a
talk, try it once on the computer you'll use, so that pandoc is there when the room
has no internet.

<!-- SCREENSHOT images/notes: the notes pane, with the slide on the screen, the next one, the timer and the notes -->

<br/>

## 3 Safety and quality

Take the Floor writes nothing in your vault. Presenting reads your note and shows it.
The only file it writes for you is a PDF you ask for, in a place you pick outside the
vault. Your speaker notes are taken out of the note before anything else happens, so
they can't end up on a slide or in a PDF. [Section 10](#10-network-and-file-disclosure)
lists exactly what it reads and writes.

It only connects to the internet to download the built-in pandoc, when you have no
pandoc installed and say yes, and to show what a slide has from the web, like an image.
The programs it starts are an installed pandoc and, when you use the niri window
manager, `niri`, to put the slides on the other screen.

The health report in Obsidian's plugin directory warns about two things. Both are part
of how it works:

- *Shell Execution* is pandoc and `niri`. Take the Floor starts them directly, without
  a shell in between, and starts nothing else.
- *Direct Filesystem Access* is for what Obsidian can't do for a plugin. Take the Floor
  reads your bibliography and citation style wherever you keep them, and checks that
  the files in your settings exist. It puts the files pandoc needs in a temporary
  folder, keeps the built-in pandoc in your cache folder, and writes the PDF you asked
  for.

Every change is tested. Every release is built in public on GitHub, and you
can check that the file you installed is the one GitHub built.
[Section 10.5](#105-how-releases-are-built) shows how.

<br/>

## Table of contents

- [4 Documentation](#4-documentation)
- [5 Features](#5-features)
- [6 How it works](#6-how-it-works)
- [7 Commands](#7-commands)
- [8 Settings](#8-settings)
- [9 Works well with](#9-works-well-with)
- [10 Network and file disclosure](#10-network-and-file-disclosure)
- [11 Questions or issues?](#11-questions-or-issues)
- [12 Support](#12-support)
- [13 License](#13-license)

<br/>

## 4 Documentation

If you want to work on the plugin:

- [**Architecture**](docs/architecture.md) - How the code is layered, and what happens
  when you press Present.
- [**Settings**](docs/settings.md) - How settings are stored.
- [**Development**](docs/development.md) - Setup, tests, and releases.
- [**Compatibility**](docs/compatibility.md) - What a release may and may not change,
  so your settings, hotkeys, notes and CSS snippets keep working.

<br/>

## 5 Features

### 5.1 Writing a talk

- **A talk is a normal note** - It needs no special format, and it reads fine without
  the plugin. Due Credit can export it as it is.
- **Speaker notes that stay yours** - A `%%comment%%` on a slide is what you say over it.
- **A preview as you write** - **Preview slides** shows every slide, and marks one that's
  too long to fit.
- **Your look** - Slides follow your Obsidian theme, and your CSS snippets reach them.
  [Section 6.3](#63-changing-how-slides-look) has the names.

### 5.2 Citations

- **Links are citations** - `[[marsh2024]]` shows as "(Marsh 2024)", in the citation style
  you choose.
- **The reference at the foot** - Each slide has the full reference of what it cites, since
  nobody can turn back to an earlier slide. A closing slide lists them all.
- **Before you start** - A link that would come out as plain text is listed first.

### 5.3 During the talk

- **Your notes on your screen** - The pane shows the slide on the screen, the next one, a
  timer and your notes. A link in your notes opens that note, such as a paper during the
  questions.
- **A clicker just works** - Its keys change slides wherever your cursor is, and they
  never type into a note.
- **Fix something in the middle** - Hide the slides, edit your note, and watch the slide
  change in the pane. When you show them again, the room sees the new version.
- **No lock screen** - Your computer stays awake while the talk runs.
- **A cable that comes out** - The slides drop into a window so that they don't cover your
  notes, on the same slide, and go back when the screen does.

### 5.4 For after the talk

- **A PDF** - **Export slides to PDF** makes one with a slide to a page, without your notes.
  It needs no LaTeX, and it's also a good backup for a room where your laptop can't connect.

<br/>

## 6 How it works

### 6.1 What happens to your note

| In your note | On the slides |
| --- | --- |
| `---` alone on a line, with a blank line above | A new slide. |
| `%%comment%%` | Your speaker notes, in the pane. Never on a slide. |
| `<!-- comment -->` | Left out, and not in your notes either. |
| `[[marsh2024]]` | "(Marsh 2024)", and the full reference at the foot of the slide. |
| `[^1]` footnotes | At the foot of their slide, numbered from 1 on each. |
| `![[figure.png\|300]]` | The image, 300 pixels wide. |
| `$E=mc^2$` and `$$` math | The math. |
| A callout | A quote, with its title in bold. |
| `***` | A line on the slide. Only `---` starts a new one. |
| Other embeds, such as a note or a PDF | Left out. |
| A Mermaid diagram | Its code, as written. |

Directly under a line of text, `---` makes that line a heading, as it does in Obsidian, so
it needs the blank line. Indented, or in a `:::` block, it stays a line on the slide. At
the very top of a note, it starts the note's properties.

A slide with too much on it is cut off at the bottom. The notes pane and the preview say
which one it is.

### 6.2 Keys during a talk

| Key | |
| --- | --- |
| Page Down, Right, Down, Space | The next slide |
| Page Up, Left, Up | The previous slide |
| B, full stop | Hide the slides |
| F | Fill the screen, or stop |
| Esc | End the talk |

While the slides are hidden, the keyboard is yours for editing. Esc, Page Up, Page Down or
the eye button bring the slides back on the same slide, so a clicker does too. Other keys
go to whatever has the cursor, and a dialog you open keeps its keys.

### 6.3 Changing how slides look

Slides follow your theme. To change them, add a
[CSS snippet](https://help.obsidian.md/snippets) with these names:

| Name | What it is |
| --- | --- |
| `.take-the-floor-stage` | The slide's 1920 by 1080 pixel area, scaled to the screen |
| `.take-the-floor-stage .slide` | One slide |
| `.take-the-floor-stage .slide.references` | The closing slide |
| `.slide-foot` | The foot of a slide |
| `.slide-reference` | A reference there |
| `.slide-note` | A footnote there |

For example, to make your slides light on a dark theme, which is easier to read on many
projectors, set your theme's colours for them:

```css
.take-the-floor-stage {
  background: white;
  color: black;
  --text-normal: black;
  --text-muted: #444;
  --link-color: #0645ad;
  --link-external-color: #0645ad;
  --code-background: #eee;
  --h1-color: black;
  --h2-color: black;
  --h3-color: black;
  --blockquote-color: #333;
  --list-marker-color: #444;
}
```

A theme can have more colours of its own, so check a slide with everything on it in **Preview
slides**. I tried this one on the Border theme, where inline code keeps its colour.

### 6.4 Getting to the other screen

- **On niri, Windows, macOS and X11,** the slides go to the other screen by themselves and
  fill it. With more than one other screen, it asks which. I test this on niri. I haven't
  tried it on a real second screen on the others yet.
- **On other Wayland desktops,** an app can't move its own window. Drag the slideshow to the
  other screen, and press F.
- **With one screen,** the slideshow is a normal window.

<br/>

## 7 Commands

None of the commands come with a hotkey, so they won't clash with the ones
you already use. You can set your own in Settings → Hotkeys.

- `Take the Floor: Present` - Shows the open note as slides. It's also on the ribbon and on a
  note's right-click menu.
- `Take the Floor: Preview slides` - Opens a tab with every slide of the open note.
- `Take the Floor: Export slides to PDF` - Makes a PDF, with a slide to a page. It's also on a
  note's right-click menu.

During a talk:

- `Take the Floor: Next slide`
- `Take the Floor: Previous slide`
- `Take the Floor: Hide or show the slides`
- `Take the Floor: End presentation`

<br/>

## 8 Settings

**Pandoc**

| Setting | Default | |
| --- | --- | --- |
| **Pandoc** | `pandoc` | If you installed pandoc, this can usually stay `pandoc`. If Take the Floor doesn't find it, give its full path. Without pandoc installed, Take the Floor offers to download a copy that runs inside Obsidian. |

**Citations**

| Setting | Default | |
| --- | --- | --- |
| **Bibliography** | None | The .bib file that Better BibTeX's auto-export keeps up to date. A link to one of its keys, like `[[marsh2024]]`, shows as a citation on your slide, and any other link as its text. The file can be in your vault, or outside it with a path starting with `/` or `~`. Leave it empty to present without citations. |
| **Papers folder** | `Literature` | The folder with your paper notes. Before you present, Take the Floor lists every link to a paper note whose key isn't in your bibliography, because it would show as plain text. |
| **Citation key property** | `citekey` | The property that holds a paper note's citation key. A link to a note with one cites that key, whatever the note is called. When Better BibTeX changes a key, your links keep working once the property has the new one. Paper Trail writes `citekey`. |
| **Citation style** | Chicago author-date | The name of a style Zotero has installed, such as `apa` or `ieee`, or the path to a .csl file. Leave it empty for Chicago author-date. |

<br/>

## 9 Works well with

I made these too. Each one does one thing and works on its own, but they fit
together nicely.

### 9.1 Due Credit

[Due Credit](https://community.obsidian.md/plugins/due-credit) exports a note to Word, PDF,
Markdown or LaTeX. It reads a note the same way Take the Floor does, with the same code. Its
**Insert citation** writes the links that Take the Floor shows as citations.

Give both plugins the same **Bibliography** and **Citation style**. Your talk and your chapter
then cite the same way, and your comments stay behind in both.

### 9.2 Paper Trail

[Paper Trail](https://community.obsidian.md/plugins/paper-trail) turns your Zotero library into
a reading queue, with a note for each paper. With Better BibTeX, those notes have the `citekey`
property, so a link to one of them cites that paper on your slide.

### 9.3 Loose Ends

[Loose Ends](https://community.obsidian.md/plugins/loose-ends) makes new notes from templates.
A template with `presentation: true` in its properties gives every new talk its Present button.

<br/>

## 10 Network and file disclosure

Take the Floor runs entirely on your computer, and doesn't send anything of yours
anywhere. It connects to the internet for two things:

- **The built-in pandoc:** When you have no pandoc installed and agree to download it, it gets
  `pandoc-3.13-wasm.zip` from pandoc's release on GitHub. Before keeping it, Take the Floor checks
  that the download is exactly the file it was tested with, by comparing its SHA-256 hash, a
  fingerprint of the file's contents.
- **Something from the web on a slide:** With `![](https://…/figure.png)` in your note, the slideshow
  window loads it from that site, as any web page would, and the same goes for a video, an embedded
  page or a style in HTML you wrote in your note. That site can see your address. A talk's images
  load when it starts, to measure the slides, and when you preview or export. Images in your vault
  stay on your computer.

### 10.1 What it reads

- **Notes:** The note you present, preview or export, as far as you've typed it. Also the citation
  keys of the notes it links to, and the images it shows.
- **Bibliography:** The `.bib` file you set in **Bibliography**.
- **Citation style:** From Zotero's styles folder (`~/Zotero/styles`), or the `.csl` file you set.
- **Obsidian's settings:** Whether strict line breaks are on, from the vault's `app.json`.
- **The settings tab:** The path and properties of every note, while it's open, to say when your
  **Papers folder** has no notes or no note has your **Citation key property**.
- **Open notes:** The properties of each open note, to see whether it has `presentation: true`.
- **Your screens:** The screens Obsidian can see, when you press Present and when one comes or goes.
- **On niri:** The list of screens, workspaces and windows, with each window's title, of all your
  apps, to find the slideshow and the screen it goes to. Nothing keeps them.
- **Your PATH:** each folder on it, for a pandoc installed there.
- **The built-in pandoc:** `pandoc-3.13.wasm` in your cache folder, when there's no pandoc installed.
  Once a session, Take the Floor checks its hash to make sure the file hasn't changed. A file that
  doesn't match is deleted, and downloaded again if you agree.

### 10.2 What it writes

Take the Floor writes nothing in your vault, apart from its settings.

- **The PDF:** Only the file you pick in the save dialog, never inside your vault.
- **The built-in pandoc:** when you agree to download it, `pandoc-3.13.wasm` in your user cache
  folder, outside the vault. The 17 MB download unpacks to this 62 MB file. It goes in
  `~/.cache/obsidian-citation-core` on Linux (or in `$XDG_CACHE_HOME`),
  `~/Library/Caches/obsidian-citation-core` on macOS, and `obsidian-citation-core\Cache` in
  `%LOCALAPPDATA%` on Windows. If you also use Due Credit or In the Open, they use the same file.
  You can delete it. It's downloaded again, if you agree, the next time it's needed.
- **Temporary files:** Each time it makes slides, the files that come with it (pandoc's filters, a
  template and a font), the note's properties and pandoc's result go in a temporary folder. With the built-in pandoc, the note's text
  goes in a second one. Both are removed afterwards.

### 10.3 What it stores

- **Settings:** Its own `data.json` in the plugin folder.
- **Your layout:** Obsidian saves its open windows in the vault's `workspace.json`, the slideshow and
  the notes pane too. They close at the next start, and they hold no slides or notes.

### 10.4 What it runs

- **Pandoc:** The one you set in **Pandoc**. Take the Floor first asks it its version
  (`pandoc --version`). An installed pandoc can read and write anything you can.
- **The built-in pandoc,** when there's no pandoc installed. It runs inside Obsidian, and Take the
  Floor only gives it your vault, the folders of the files in your settings, and its temporary
  folders. Node, which runs it inside Obsidian, doesn't guarantee that a program can't get past those
  folders, for example through a link in your vault to a folder outside it. So don't rely on those
  folders to keep a file private from it.
- **Niri:** `niri msg`, only when niri is running, to read the lists above, move the slideshow to the
  other screen and give the focus back to Obsidian.

Nothing else runs. While a talk runs, it also asks your system to keep the screen awake, and it
stops asking when the talk ends.

### 10.5 How releases are built

Every change I push is built, checked with [ESLint](https://eslint.org/) and
the official [Obsidian ESLint plugin](https://github.com/obsidianmd/eslint-plugin),
and tested with [Vitest](https://vitest.dev/). Nix builds it a second time,
on its own.

Releases are built by GitHub Actions from the tagged code, after the same
checks. A release only goes out when its tag matches the version in
`manifest.json`, and every action it uses is pinned to an exact version. Each
release comes with a signed attestation from GitHub, which records what it
was built from. To check that the `main.js` you installed is the one GitHub
built:

```sh
gh attestation verify main.js --repo jorritvanderheide/obsidian-take-the-floor
```

The citation tests run through a real pandoc, always the same version, in
[obsidian-citation-core](https://codeberg.org/BW20/obsidian-citation-core),
which holds the citation code. A release only uses a version of it that
passed them, so a change in pandoc's output shows up as a failing test before
it reaches you.

<br/>

## 11 Questions or issues?

Have a look at the [FAQ](FAQ.md) first. It covers the things people run into
most, like a slideshow that stays on the wrong screen. If something still doesn't
work, or you have an idea, please
[open an issue](https://github.com/jorritvanderheide/obsidian-take-the-floor/issues/new/choose).
Found a security problem? Please report it privately, the way the
[security policy](SECURITY.md) explains.

The code lives on [Codeberg](https://codeberg.org/BW20/obsidian-take-the-floor),
with a copy on [GitHub](https://github.com/jorritvanderheide/obsidian-take-the-floor).

<br/>

## 12 Support

Take the Floor is free. If it's useful to you and you'd like to give something
back, you can do that on Liberapay:

[![Donate](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/BW20)

<br/>

## 13 License

Copyright © 2026 Jorrit van der Heide. Licensed under the [EUPL-1.2](LICENSE).
Open Sans, from [`fonts/`](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts) in obsidian-citation-core, is under the
[SIL Open Font License 1.1](https://codeberg.org/BW20/obsidian-citation-core/src/branch/main/fonts/OFL.txt).
