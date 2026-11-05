# Security policy

## Supported versions

Security fixes go into the latest release of Take the Floor. Older releases don't
get separate fixes, so please update before you report.

## Reporting a problem

Please don't open a public issue for a security problem. Report it privately
through GitHub instead:

https://github.com/jorritvanderheide/obsidian-take-the-floor/security/advisories/new

Include the Take the Floor, Obsidian and pandoc versions, your operating system,
and the steps to reproduce it. I'll look into your report before anything about
it is made public.

## What counts

Take the Floor does only a few things:

- It runs pandoc on the note you present, preview or export. That's the pandoc you
  installed, which it first asks for its version, or without one, the built-in pandoc.
  Take the Floor downloads that once, when you agree, checks it against a SHA-256 hash it
  carries, and runs it inside Obsidian.
- It runs `niri msg`, only when niri is running, to read your screens, workspaces and the
  titles of your windows, move the slideshow, and give the focus back to Obsidian.
- It shows slides in a window of Obsidian's, with what's in your note made safe by Obsidian's
  own HTML sanitizer. An image from the web on a slide is loaded from that site.
- It reads that note and the citation keys of the notes it links to, your bibliography, your
  citation style, whether strict line breaks are on in your vault's settings, the properties of
  your open notes, and the folders on your PATH, to find pandoc. The settings tab reads the path
  and properties of every note.
- It writes a PDF to the file you pick in the save dialog, never inside your vault. Each time it
  makes slides, it writes the files pandoc needs to a temporary folder and removes them
  afterwards. When you agree to download the built-in pandoc, it also writes that to your cache
  folder, and deletes it again if it ever stops matching its hash.
- It stores its settings in its own `data.json`.

[Section 10 of the README](README.md#10-network-and-file-disclosure) has the details. Anything
that does one of these is a security problem:

- makes Take the Floor run a program other than pandoc and `niri`,
- makes it write somewhere you didn't choose, or anything in your vault but its settings,
- lets the text of a note change what pandoc reads, writes or runs,
- runs a script from a note in the slideshow window or the preview,
- puts your speaker notes or HTML comments on a slide or in a PDF,
- keeps or runs a built-in pandoc that doesn't match its hash,
- gives the built-in pandoc more of your disk than the vault, the folders of the files it's given
  and its temporary folders,
- or makes Take the Floor connect anywhere other than pandoc's release on GitHub and the address of
  an image in your own note.

The plugin directory's health report warns that Take the Floor executes programs and uses the
filesystem directly. Those are pandoc, `niri` and the files above, as
[section 3 of the README](README.md#3-safety-and-quality) explains.

A site you link an image from can see that a slide loaded it: that's how images on the web work. Problems
in pandoc itself aren't covered: please report those to [pandoc](https://github.com/jgm/pandoc).

A bug that shows the wrong text, or leaves something out, is serious too, but it isn't secret. Please
report it as a normal issue, so others can see it.
