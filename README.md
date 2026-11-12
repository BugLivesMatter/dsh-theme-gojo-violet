# Gojo Violet Nebula

[![test](https://github.com/BugLivesMatter/dsh-theme-gojo-violet/actions/workflows/test.yml/badge.svg)](https://github.com/BugLivesMatter/dsh-theme-gojo-violet/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A DeepSeek Harness Web GUI theme bundle: violet-and-lavender palette in both
appearance modes, the Gojo Satoru artwork as a fixed wallpaper behind a violet
scrim, a solid violet sidebar and softer radii.

The theme is a pure client bundle: it overrides `--dsw-*` design tokens at
runtime, so no host code, build step or dependency is required to use it.

## Install

```bash
git clone https://github.com/BugLivesMatter/dsh-theme-gojo-violet.git
```

From a DSH session:

```
plugin_manager action=install_bundle target="<absolute path>/dsh-theme-gojo-violet"
```

The install result must report `application: applied`; the open page picks the
plugin up through HMR. Disable it from Settings → Plugins (or
`plugin_manager action=set_plugin`) to return to the stock theme.

Installation links this directory, so keep it in place: the browser bundle and
the wallpaper are served from here.

## What it changes

- **Palette.** Overrides the shipped `--dsw-*` design tokens through
  `ctx.theme.overrideTokens(...)`: a violet-tinted neutral ramp (surfaces, text,
  borders), an electric-violet accent family (links, focus ring, selection,
  business state), a periwinkle blue, rose/mint states, source-code syntax
  colours, menu glass fills and scrollbars. Light and dark values are both
  supplied, so Settings → Appearance keeps working.
- **Wallpaper.** Adds one plugin-owned stylesheet: a fixed, cover-sized
  wallpaper behind a violet scrim, transparent shell columns so it shows through,
  and the sidebar keeps its solid violet fill. In light appearance the same image
  is washed out to a pale lavender paper. `prefers-reduced-transparency` falls
  back to flat surfaces.
- **Radii.** Slightly rounder `--dsw-radius-*` scale.

The theme does not change typography: DSH's shipped Settings → General font rows
(text/code/terminal family and size, behind the chevron on the "Font size" row)
keep working and override the theme's font tokens.

The theme is applied as an override layer on top of the active built-in theme
(light/dark), not as a registered third-party theme id — the preference stays
persisted, and disabling the plugin restores the stock look completely.

## Layout

| File | Purpose |
|---|---|
| `package.json` | bundle + client manifest (`dsh.bundle.patch`, `dsh.client`) |
| `cordis.patch.yml` | inserts the `theme-gojo-violet` Loader row |
| `index.js` | Host half (empty `apply`; the bundle only needs a row) |
| `client.js` | generated browser half: token overrides + wallpaper stylesheet |
| `assets/gojo-wallpaper.<hash12>.jpg` | 2560×1440 wallpaper, content-revisioned so `/plugins` caches stay valid |
| `locale/*.json` | Plugin Manager title/description (en, ru) |
| `icon.svg` | plugin icon |
| `_build/` | palette source of truth, generator, audit helpers |

## Rebuild / re-tint

`_build/build.mjs` holds the palette ladders (`neutral`, `accent`, `blue`,
`green`, `red`, `violet`) and the literal alias `pairs`. After editing it:

```
node _build/build.mjs
```

This regenerates `client.js`, re-emits the wallpaper under a fresh
content-revisioned name and refreshes `_build/tokens.json`. The open page only
picks a changed bundle up after the Loader row restarts: toggle the
`include:theme-gojo-violet` plugin off/on (Settings → Plugins, or
`plugin_manager action=set_plugin`), or restart DSH. A plain page refresh is not
enough because the Host keeps the previously published bundle bytes.

The wallpaper itself comes from `_build/gojo-source.jpg`; re-deriving it needs
Python with Pillow and `node _build/make-wallpaper.py` (it writes
`_build/wallpaper-raw.jpg`, which `build.mjs` then re-emits under the
content-revisioned asset name). `_build/wallpaper-raw.jpg` is a build
intermediate and is git-ignored.

## Verification

`_build/smoke-test.mjs` executes the generated bundle against DOM/ui-theme stubs
and checks registration, token pairs, wallpaper URL and disposal; CI runs it on
every push. `_build/contrast.mjs` prints WCAG contrast for the key
foreground/background pairs in both palettes.

```bash
node --check client.js && node --check index.js
node _build/smoke-test.mjs
node _build/contrast.mjs
```

## Notes

- The wallpaper CSS targets the shell class names of the DSH release this theme
  was built on (`.mP3x-q_frame/_centerCol/_bottomRow` from `ui-layout`,
  `.an3WzG_root` from `ui-conversation`). A DSH update that renames those
  CSS-module hashes needs the selector list in `_build/wallpaper.css` refreshed;
  when that happens the theme still applies its palette and only the artwork
  stops showing.
- Do not add `backdrop-filter` to `.mP3x-q_sidebarCol`. The collapsed sidebar
  renders its open/close toggles with `position: fixed`; a filter on that column
  becomes their containing block and clips them (this caused the missing
  sidebar buttons during development). The sidebar keeps its own opaque violet
  fill instead.
- The artwork is the author's own file. It is included so that a fresh clone
  renders correctly, but it is **not** covered by the MIT license and is not
  cleared for redistribution by third parties; replace
  `_build/gojo-source.jpg` with your own image if you republish the theme.
- Only colours, radii and the background are themed; product icon artwork is
  left to the shipped set.
- Verification screenshots from the live GUI (`_verify/`) contain session
  content, so they are git-ignored and never published.

## License

Code: MIT — see [LICENSE](./LICENSE). Artwork: author's own, all rights
reserved, not part of the MIT grant — see [ARTWORK.md](./ARTWORK.md).
Русская версия: [README.ru.md](./README.ru.md).
