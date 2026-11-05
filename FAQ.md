# Frequently asked questions

Can't find your answer here? Please
[open an issue](https://github.com/jorritvanderheide/obsidian-take-the-floor/issues/new/choose).

- [Getting it to run](#getting-it-to-run)
- [The other screen](#the-other-screen)
- [Slides](#slides)
- [During a talk](#during-a-talk)
- [The PDF](#the-pdf)

## Getting it to run

### "Download pandoc?"

Take the Floor can't find pandoc on your computer, so it offers to download the built-in pandoc,
a version that runs inside Obsidian. It's a 17 MB download from pandoc's release on GitHub, kept
outside your vault. Do this before you travel, because the room may have no internet.

If pandoc is installed and Take the Floor still asks, Obsidian may not see the same PATH as your
terminal. Run `which pandoc` (macOS, Linux) or `where pandoc` (Windows) in a terminal, and set
**Pandoc** in Settings → Take the Floor to the path it shows.

### "Couldn't find pandoc at "…". Check the path in Settings → Take the Floor, or set it back to "pandoc"."

The path in **Pandoc** doesn't lead to a pandoc. Fix the path, or set it back to `pandoc`. Take the
Floor then uses the pandoc on your PATH, or offers the built-in one if there isn't one.

### "Your pandoc is version …, and it needs to be 3.6.4 or later. Update pandoc, or set the full path to a newer one in Settings → Take the Floor."

This pandoc is too old to read a note. Update it, or clear the path and remove it from your PATH, and
Take the Floor offers the built-in one.

### "Your pandoc is version …, which turns some citations into plain text. Update it to 3.6.4 or later."

This pandoc still works, but a key with a colon or a link to a heading can come out as plain text.
Ubuntu 24.04 and Debian 13 install a pandoc like this. Your slides still show.

### "Couldn't download pandoc: …"

The download didn't work, usually because there's no internet. Try again, or install pandoc.

### "There's no bibliography at …"

The file in **Bibliography** isn't there. Point the setting at your Better BibTeX export, or clear it
to present without citations. A path in your vault is relative to the vault, and one outside it starts
with `/` or `~`.

### "There's no citation style at …"

Use the name of a style Zotero has installed, such as `apa`, or the full path to a `.csl` file.

### "The properties of … have a mistake in them, so Take the Floor can't present it."

The block at the top of your note isn't valid. Open the note in source mode, where Obsidian shows
what's wrong. A `---` on the very first line starts that block, so a first line of `---` meant as a
slide break does this too.

## The other screen

### The slides stay on my laptop

Take the Floor only sees one screen, or your desktop doesn't let an app move its window. Check that
your system sees the other screen. Then drag the slideshow across, and press F to make it fill the
screen. On Wayland desktops other than niri, this is the only way.

### "Take the Floor can't move windows on this desktop. Drag the slideshow to the other screen, and press F to make it fill the screen."

You're on a Wayland desktop other than niri, where an app can't place its own window. Drag it as the
message says. This shows in the notes pane, and the talk runs normally.

### "Take the Floor couldn't move the slideshow to the other screen, so it stays in a window here. …"

Something went wrong while moving it, and the brackets at the end say what. The talk runs normally:
drag the window across, and press F. If it keeps happening, please open an issue with that text.

### The slides are on the wrong screen

The slides go to the screen Obsidian isn't on. So if Obsidian is on the big monitor, the slides go to
your laptop. Move Obsidian to the screen you want to keep, end the talk, and press Present again.

### "The other screen is gone, so the slideshow is in a window here, on the same slide."

The cable came out, or the screen turned off. The slides leave fullscreen so that they don't cover your
notes, and they go back by themselves when the screen returns. Press F if they don't fill it.

### The other screen says "no signal" for a moment

That's the screen finding the signal after you plug it in, and it usually passes. Wait a few seconds
between unplugging and plugging in.

## Slides

### My `---` didn't start a new slide

It needs a blank line above it, or a heading. Directly under a line of text, `---` makes that line a
heading, as it does in Obsidian. It also has to start at the beginning of the line, and it does nothing
in a code block, a quote, a list or a `:::` block. `***` is a line on the slide and never a new one.

### My `---` is only a divider. Can I keep it out of the slides?

A normal note can have `---` in it, and nothing happens unless you press **Present**. To keep a line in a
talk, write `***`.

### Why has this note no Present button?

The button shows on a note with the property `presentation: true`, because plenty of notes have a `---`
that's only a divider. **Present** still works on any note, from the command palette, the ribbon or the
note's right-click menu.

### "Take the Floor found … slides in …, and pandoc made a different number, so your notes could show over the wrong slide."

This usually means a line of `---` inside an HTML block, such as a `<div>`, which can't end a slide. Move
it out of the block. If there's none, it's a bug, so please open an issue with the note.

### "Slide … is too long, so its end is cut off."

There's more on that slide than fits. The notes pane, the preview and the PDF's message say which one. Split
it with a `---`. A slide that cites many works has a long foot too.

### A link came out as plain text

The link's key isn't in your bibliography, or the note it links to has no key. Before a talk, Take the
Floor lists those. Usually Better BibTeX changed the key, or its auto-export hasn't run since you added
the paper. A link to a note of your own is meant to show as its words.

### My Mermaid diagram, embedded note or Dataview table doesn't show

Slides are made by pandoc, which doesn't know these. A Mermaid diagram shows as its code, and embedded
notes, PDFs and Dataview, Tasks and Bases blocks are left out. An image of the diagram works.

### How do I make my slides light on a dark theme, or add a logo?

Add a CSS snippet with the names in [section 6.3 of the README](README.md#63-changing-how-slides-look).
Slides follow your theme, which may be hard to read on a projector, so check it in the room.

### Why does the reference appear twice?

Each slide shows the reference of what it cites, because nobody can turn back, and a closing slide
lists them all. Under a style that cites in footnotes, a slide shows the footnote, and a work cited again
gets the style's short form, with the full one on the closing slide.

## During a talk

### My clicker doesn't change slides

A clicker sends Page Down and Page Up, which should work wherever your cursor is. Check that the talk is
still running, and that no dialog is open, since a dialog keeps its keys. If yours sends something else,
please open an issue with what it sends.

### Can I edit a slide during the talk?

Yes. Hide the slides with B, the full stop or the eye button. The keyboard is then yours for your note, and
the slide changes in the notes pane about a second after you stop typing. Esc, your clicker or the eye button
brings the slides back, with your changes. While they show, the slides don't change, so nobody watches
you type.

### "Your last change didn't work, so the slides stay as they were."

Pandoc couldn't make slides from the note as it is now. The brackets say why. Fix it and carry on, or
show the slides: the last ones that worked stay.

### Esc ended my talk

While the slides show, Esc ends the talk. Press **Present** to start again. It starts from the first slide,
and any changes since are in it.

### Will my computer lock during a long answer?

Take the Floor asks your system to stay awake for as long as the talk runs. I've tested this on Linux, and
it can't overrule every company's policy, so try it on your own computer first.

### Do notifications show on the screen?

The slides have a window of their own, and Take the Floor doesn't control your system's notifications. Turn
on do not disturb before a talk.

## The PDF

### Why can't I save the PDF inside my vault?

Take the Floor writes nothing in your vault. Save it somewhere else, and drag it in if you want it there.

### Does the PDF have my notes in it?

No. They're taken out before the slides are made.

### The PDF is dark

It follows your theme, as your slides do. To change it, use a CSS snippet, or switch your theme before you
export.
