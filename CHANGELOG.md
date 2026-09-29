# Changelog

This document describes **what changed**, in words. Downloads are in
[Releases](https://github.com/billibu-n/mimo-app/releases), and inside the app
**Settings -> Update -> Check for updates** tells you if a newer version exists.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Downloadable
versions start at 1.0.2; 1.0.0 is the first official release, with the desktop application.

## [1.0.0] — 2026-09-29

First **official** release, and the first one with a **desktop application**. The version jumps to
`1.0.0` because the program is already in use and its contents are stable; what is added is
**another way of opening it**, not another application.

### Added

- **Desktop version (Tauri).** Mimo now opens in its **own window**, with no browser involved: its
  own icon, its own window and installers for Linux (`.rpm`, `.deb`, `AppImage`). The `index.html`
  it opens is **the same** as the browser's.
- **The version, written in one place only.** The builder propagates it to the application, to
  `version.json` and to the desktop project. Before, the desktop version was declared separately
  and could drift out of sync.
- **Linux installers** (`.rpm`, `.deb` and `AppImage`). Installing them puts Mimo in the
  **applications menu** under *Education*, with its icon and its description; no more opening it
  from a terminal.
- **Your data is not lost when you uninstall**: the backup lives in the folder you choose, outside
  the application.
- **A theme that no longer lies.** The "According to the system" theme option was **removed**: it
  promised to follow the system's light/dark preference and did nothing, because the application
  has fixed themes. A button that does nothing is worse than no button.
- **Third-party credits and licences**, in [`CREDITS.md`](CREDITS.md): the icons are **Lucide**
  (ISC, and 147 of them derived from **Feather**, MIT) and the PDF reader is **Mozilla**'s (Apache
  2.0). They were not declared before.

### Fixed

- **The backup folder also works in the desktop application.** It used to depend on a browser
  function that Brave does not ship; in the desktop version the system asks for it, and it works
  the same on Linux, Windows and macOS.
- **Your data survives the change of application.** Progress is stored per origin, and the desktop
  version's origin is different from the launcher's: on first open, Mimo **recovers the previous
  version's data by itself** and says so.
- **The icons, in their own folder** (`iconos/`), with every path updated. And the offline copy no
  longer runs out of icons: the cache list **discovers** them instead of having them enumerated.
- **The licence is recognised again.** A block of third-party notices had been appended to
  `LICENSE`, which made GitHub stop recognising it as MIT. That content belongs in `CREDITS.md`,
  and that is where it is, complete.
- **The backup warning says what to do.** Before, if the browser did not allow choosing the
  folder, the message did not explain why or how to continue.
- **Labels and buttons:** "Play" became "Iniciar" (Start) in the timer, which was the only English
  label among "Pausa" and "Parar"; and the Courses tab no longer shows an empty subtitle.

## [1.0.6] — 2026-09-28

### Fixed

- **The save notice no longer lies.** Before, if the browser could not save (storage full or
  private mode), the application kept saying "Saved here" and the changes were lost on close
  without warning. It now checks and warns instead of pretending it saved.
- Accents and spelling in the application text and in the documentation.
- References to the old repository point to the current one, and the page source
  (`plantilla.html`) matches what is published again: the icons would no longer break on rebuild.

## Earlier versions

The earlier history (1.0.2, 1.0.4 and 1.0.5) and the versions published under the project's
previous name are documented in the **old repository**:
[`billibu-n/Mimo-Academics`](https://github.com/billibu-n/Mimo-Academics). This repository starts
clean, with a single initial commit, so the detailed history is not duplicated here.
