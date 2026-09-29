# Changelog

This document describes **what changed**, in words. Downloads are in
[Releases](https://github.com/billibu-n/mimo-app/releases), and inside the app
**Settings -> Update -> Check for updates** tells you if a newer version exists.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Downloadable
versions start at 1.0.2; 1.0.0 is the first official release, with the desktop application.

## [Unreleased]

### Added

- **The *Support us* window now shows the ways to help that cost nothing**, and the coffee is
  optional and set apart. Before it was a button to buy a coffee and little else. Now it offers
  **three cards** (the same card as the rest of the app: icon, title, description below):
  **Report a bug** (opens the repository's own `bug.md` template in Issues, already filled with
  the app version and the browser and system, so the report is useful from the first line),
  **Suggest an idea** (opens a new discussion in the *Ideas* category) and **Tell someone about
  it** (shares the project; on desktop, where there is no system share sheet, it copies the link).
  Under the cards sits the **coffee**, marked as optional and with the note that the app charges
  nothing inside, and a **collapsible FAQ** with five questions (among them: *will my data be
  visible if I report?* — no: the report carries version, system and browser only).

  **GitHub only, and no personal email.** The repository already ships issue templates
  (`bug.md`, `feature-request.md`, `question.md`), the *Ideas* discussion category and a
  `config.yml` that routes questions to Discussions, so nothing had to be created on GitHub and
  **no email address is published anywhere** — which is what keeps the app from collecting spam
  bots. The whole window is translated with the language engine (Spanish and English), and the
  report body is written in the language the app is *in* at that moment.
- **Language engine (i18n)**: the app can now translate its own texts, not just list languages.
  A small engine built on the *format of the standard* (i18next-style keys such as
  `ajustes.apariencia`, one dictionary file per language, fallback to Spanish): adding a language
  later is *one file and one line*, without touching any screen. Dates, times and numbers are
  handled by the browser's own `Intl`, so no hand-written month names survive in another language.
  Spanish is the base; **English is the first finished translation** (the app screen is translated
  as a pilot, the rest follows section by section). Nothing changes for whoever keeps Spanish.
- **Eight languages listed in *Language***, each written in its own language and with its flag:
  Español · English · Deutsch · Français · Italiano · Português · 简体中文 · 繁體中文. French,
  Italian and Portuguese share the row of the Romance languages; the two Chinese close the grid,
  so it is a clean four-by-two. **Spanish is complete and English is under way** (the app screen is
  already translated); the rest are shown switched off, marked *"en preparación"* — a button that
  translates nothing would be a lie. The
  flags are drawn inside the app (the project has no country flags in its icon set).
- **Keyboard shortcuts** to move between sections, in *Navigation*. Seven come from the factory
  (`Ctrl + 1` … `Ctrl + 7`, in the order of the bar) and can be **changed or turned off**. The
  list lives inside a **collapsible entry** — "Customise the shortcuts" — so the window does not
  grow unless you want to go through it. While a text field has the focus, or a window is open,
  the shortcuts stay out of the way. A combination already in use is refused with a warning, and
  so are the ones the browser or the system already take (`Ctrl + T`, `Ctrl + W`, `F5`…).
- **Font size**, in *General*: small / normal / large / very large. It is **global** and scales
  the whole app — letters, spacing, blocks and the header — not just the text. It was checked on
  the app engine itself (WebKitGTK), where the sidebar goes from 155 to 202 px: the text alone
  would have left the boxes behind.

### Changed

- **"General" is now its own set of apartados.** One line per apartado with the control on the
  right: *Abreviación de texto* (with the **recorte example** underneath — a fixed box that does
  not change, while the name fits inside it), *Tamaño de la fuente*, *Formato de las horas* and
  *Actualización* (the version plus a *Buscar* button).
- **Every apartado sits in two columns**: the name on the left with a fixed width and the options
  on the right, always starting at the same point, so more options never push into the title. It
  is alignment, not a dividing line. Applied to **all** the windows, so the view does not jump
  from one to another.
- **The Navigation texts were cleaned up.** The description now says *"Ubicación y navegación de
  las secciones"*, and no line explains a choice by referring to an old version ("like 1.0.0") or
  to a symbol with no context (the ☰). Whoever reads them has not lived through the project's
  history.
- **Settings is a set of buttons.** Each entry is a small card — icon, bold title and a single
  line underneath, next to the icon — and opens its own window, following the approved sketch.
  The backup entry is highlighted the same way (2-px border), with the same shape.
- **Appearance works in two steps**: first light / dark / system, then the theme of that kind.
- **"System" shows only the themes of the current system setting**, instead of both lists at
  once. In light mode it offers the four light themes; in dark mode, the four dark ones.
- **The theme cards carry a colour bar** with the theme's own background and accent, plus its
  name and a one-line description.
- **"Vino" is out of the Appearance view** (4 light + 4 dark, as approved); the theme itself is
  untouched, so a saved selection is not lost.
- The **version/update block left the Appearance window** — it has nothing to do with looks. Its
  controls stay for the app to work, and the version notice lives in the header tag.

### Fixed

- **The "System" icon was invisible.** Its monitor rectangle had lost its width and height, so
  only the stand was drawn (7×3 px inside a 20-px box). The value is restored from the healthy
  copy of the same icon. The sprite has **31 more symbols with the same missing-geometry
  defect**; they are not used by the app yet, and are pending a full cleanup.

### Removed

- **"Accents in titles" and "Compact mode" are gone.** They were listed in the window but
  **nothing read them**: the engine ignored them, so they were dead switches. Removing them also
  cleans the bridge that painted them.

## [1.0.0-desktop] — 2026-09-29

The first release with the **desktop application** on all three platforms, and the first with a
version number that makes the package managers actually update.

### Why the version says `-desktop`

It is not decoration. With plain `1.0.0`, `dnf` answered **"already installed"** even when the
contents had changed, because it compares **numbers, not contents**. With the suffix,
`rpm.vercmp('1.0.0', '1.0.0-desktop')` is `-1` (the new one is greater) and the package updates.
The same was checked on Debian with `dpkg --compare-versions`.

### Added

- **It asks before deleting, in its own window.** The application used the browser's dialogs
  (`confirm`, `alert`, `prompt`). In the desktop application those are **not shown**: the engine
  blocks the page and the action runs anyway, so "Reset everything" wiped the data with no
  warning. All **13** native dialogs are now an in-app dialog that behaves the same on every
  system. On a destructive action the focus starts on *Cancel*, so Enter cannot confirm by
  accident, and the accept button is in the danger colour.
- **AppImage** for Linux: no installation, just run it.
- **Windows installer (`.exe`)**, built on a Windows machine by GitHub Actions and attached to the
  release.

### Fixed

- **Event text is shortened** to two lines with an ellipsis, and the day cell has a maximum
  height. With several events in one day the month piled up and became unreadable; the full title
  is still available on hover. This is the default, so nobody has to go looking for an option.
- **The selected button in Settings is visible.** It used to be marked with a 4-pixel dot inside
  a ring, which at real size was invisible; now the circle is filled and the button is tinted.
- **The installers have no spaces in their names** (`mimo-academics-1.0.0-desktop-1.x86_64.rpm`),
  so nothing needs quoting. The applications menu still says **Mimo Academics**.
- **The repository root only holds what the user needs.** The builder's sources moved to
  `construir/` and the browser launcher, the diagnosis and the repair page to `herramientas/`.
  The release `.zip` no longer ships `plantilla.html`: it is the builder's template, of no use to
  the user.

## [1.0.0] — 2026-09-29 (superseded)

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
[`billibu-n/Mimo-Academics`](https://github.com/billibu-n/Mimo-Academics) (QUIROFANO). This repository starts
clean, with a single initial commit, so the detailed history is not duplicated here.
