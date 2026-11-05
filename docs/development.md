# Development

## Setup

Take the Floor's core is a library of its own,
[obsidian-citation-core](https://codeberg.org/BW20/obsidian-citation-core),
which npm takes from its GitHub mirror, at the commit `package.json` pins, so
a checkout of this repository builds on its own:

```sh
nix develop     # or any Node.js 20+
npm install
npm run dev     # rebuild on change
```

To try a change in the core before it is pushed, with it checked out next to
this folder: `npm install --no-save ../obsidian-citation-core`. `npm ci` goes
back to the pinned one. The core's own checks, and what to run before a change
there is done, are in its README.

To try it in a vault, copy or link `main.js`, `manifest.json` and `styles.css` into
`<vault>/.obsidian/plugins/take-the-floor/` and reload Obsidian, or turn the plugin
off and on again.

## Checks

```sh
npm test        # vitest
npm run lint    # eslint, with the Obsidian plugin's rules, failing on any warning
npm run build   # type check and production build
```

CI runs all three, on Node 24, for every push to `main` and every pull
request, and again before every release (`.github/workflows/ci.yml`). It also
runs `nix flake check`, which builds the plugin with Nix and runs its tests:
after a change to `package-lock.json`, update `npmDepsHash` in `flake.nix`, as
its comment says.

## The core's version

The core is pinned once, in `package.json`, which npm builds with. A plugin
pins only a tagged core version, and the core's own checks, its filter tests
through a real pandoc among them, pass on a commit before it is tagged, so
they don't run again here. To move to a newer one, once its tag is on Codeberg
and the GitHub mirror:

```sh
rev=$(git ls-remote https://codeberg.org/BW20/obsidian-citation-core.git refs/tags/<x.y.z> | cut -f1)
npm install "git+https://github.com/jorritvanderheide/obsidian-citation-core.git#$rev"
nix run nixpkgs#prefetch-npm-deps -- package-lock.json   # the new npmDepsHash
```

Then build and test here, read the core's `CHANGELOG.md` since the last version, and write what users notice
under `## Unreleased`.

## Tests

Tests are in `tests/`, one per file in `src/core/`, named after it. What decides how a note reads, and the
filters through a real pandoc, are tested in the core.

The windows can't be unit tested. To test them, start Obsidian with its own data folder and a throwaway vault, and
drive it through its debugging port:

```sh
obsidian --user-data-dir=/tmp/test/data --remote-debugging-port=9333
```

Under `xvfb-run`, with `--ozone-platform=x11` and without `WAYLAND_DISPLAY` and `NIRI_SOCKET`, it opens nothing on your
screens. Placement needs real screens, so that part needs a person watching. Try these before a release that touches
them: placing the slides, a clicker with the cursor in a note, hiding and editing, and pulling the cable and plugging it
back.

## Releases

Release with `scripts/release.sh <x.y.z> "<what the release is>"`, from an empty working-copy change on top of the
commits to release, with the notes under `## Unreleased` in `CHANGELOG.md`. It stops before anything is pushed when
something is wrong. `--dry-run` shows that a release is ready without pushing anything. Have the unreleased commits
reviewed adversarially by a fresh agent first.
