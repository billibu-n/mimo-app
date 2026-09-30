# Changelog

This document describes **what changed**, in words. Downloads are in
[Releases](https://github.com/billibu-n/mimo-app/releases), and inside the app
**Settings -> Update -> Check for updates** tells you if a newer version exists.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Downloadable
versions start at 1.0.2; 1.0.0 is the first official release, with the desktop application.

## [Unreleased]

(nothing yet)

## [1.1.0-desktop] — 2026-09-30

Settings, section by section, now holds the settings that belong to each section, and the
texts stopped pretending. See the entries below (they were the *Unreleased* block).


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

- **You can now update from inside the app, without going through GitHub.** In
  *Settings → Update*, the app asks GitHub for the **latest release** and acts by itself: on
  **Windows** it offers a **Download the installer** button that saves the `.exe` where you choose;
  on **Linux** it shows the **update command ready to copy** (`sudo dnf install -y '<rpm url>'`,
  or `wget` + `apt install` for the `.deb`); in the browser it only links the downloads page.
  Linux is left as a warning **and not a silent self-install** on purpose: a `.deb`/`.rpm` cannot
  be replaced from inside the app. Read on a real page served locally (not simulated): the app
  **is allowed** to read the GitHub release, so the check and the download work.
- **Sound of the reminder also offers a plain beep, named for what it is.** *Time → Reminder
  sound* had an option called *"From the browser"*; the beep is generated by the app itself, so it
  is now called **Pitido**. Only the label changed; the sound is the same.
- **The shortcuts warning no longer blames the browser.** When a chosen key combination is taken,
  it now says it **may be used by the system or the browser**, which is true on the desktop too.


- **Your current session now comes first.** In *Time*, the sessions of the week are grouped by day;
  the week used to be read from Monday to Sunday, always. Now the **day it is today** heads the
  list and the week is read **from today onwards** (today Wednesday: Wednesday, Thursday, Friday,
  Saturday, Sunday, Monday, Tuesday). The day picker follows the same order and starts with today
  as well. When today does not fall inside the week you are looking at, nothing changes. Confirmed
  in the application with sessions: today's group sits at the top of the list.
- **The day picker no longer lies when you change week.** It used to be rebuilt only when the
  *number* of days changed — which is always seven — so switching weeks kept the **old labels** on
  screen while the dates behind them were the new ones. It is now rebuilt from the real dates.
- **The "Nuevo evento" button no longer hides at the bottom of the column.** In *Semestre* the
  button lived at the end of the left column, after the whole list of events. Since that column is
  stuck to the window, a long list pushed the button **out of view with no way to reach it** —
  exactly the bother described. The button now sits **at the top of the column**, and the column
  never grows taller than the window: it keeps its own scroll. Measured with a 600 px-high window:
  the column was 682 px tall and the button ended up 162 px below the screen; now the column fits
  the window and the button is reachable.

- **The Import window follows the approved sketch, class by class.** The sketch built it with the
  Settings face by putting its content **inside a `.aj-panel`**, using the house classes
  (`.ic`, `.eti`, `.archivo`, `.nombre`). The first implementation instead dropped the content
  straight into the shared `.modal-caja` and **invented its own classes** (`.imp-ic`, `.imp-eti`,
  `.imp-archivo`, `.imp-nombre`), because the panel-scoped rules did not reach it: that is why the
  text sat tighter and the window did not follow the same rules. Content now lives in an
  `.aj-panel` (as in the sketch) and uses the house classes, with the CSS scoped to `.imp-caja` so
  the Settings windows are untouched. Measured: panel 640 px (was 620), icon tile 38 px (was 40),
  icon header as in the sketch. The other windows on `#modal-caja` (Simulator, ramo editor, alerts)
  are unchanged.
- **The *Import* window (Plan) now says only what it has to say, and looks like the rest.** It used
  to be a wall of text — four paragraphs plus a box with the CSV and JSON examples — and it showed
  the browser's own file button. Now it carries the **same face as the Settings windows**: an icon
  and a short title (*Import*), the formats underneath (*JSON, CSV, TSV or PDF*), an **X in the top
  right corner** (**replacing the "Cerrar" text button**) and a footer with *Cancel* / *Import*. The
  four paragraphs and the example box are gone. Measured in the real application: the window went
  from **555 px to 255 px** tall. The file reader is untouched: same ids, same PDF/JSON/CSV paths.
- **Picking a file no longer shows the browser's own button.** The `<input type="file">` carries a
  button and a text that belong to the **browser**: they cannot be styled or translated (the browser
  writes them in *its* language, not the one the app is set to). It is now hidden — invisible but
  alive — and a **button of the house** ("Elegir archivo", with its icon) opens it, followed by the
  chosen file's name. It is the **same pattern the Backup window in Settings already used**; the Plan
  import was the only place still showing the native control.
- **The Import window is translated.** Its texts no longer live hard-coded in the code: they come
  from the language dictionaries (`malla.importar.*`, `boton.*`), like the rest of the interface, so
  the window redraws itself if the language is changed while it is open.

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

### Changed

- **The per-section cards no longer carry a tag or the old explanatory band.** The *section
  settings* cards (Calendario, Ramos, Tareas, Estudio, Malla, Tiempo) are now a plain card, like
  the rest: **icon, bold title and a short line**. The little tag they carried (*format of hours*,
  *accents · titles*, *what is done*…) and the band that said these settings *"are not general:
  they belong to a single section…"* are gone. The section card is opened from Settings, but the
  settings themselves live in their own section.
- **Each section card says what it is about**: Calendario *hours, events and dates*; **Ramos**
  *assessments and courses* (was labelled *Notas*); Tareas *to-dos and commitments*; Estudio
  *study time log*; Malla *degree courses*; Tiempo *stopwatches, timer and more*.

### Added

- **The Time section now has its real settings, and they work.** The *Time* panel in Settings used
  to be a description with invented labels (*yes*, *no*, *1h 30m*). It now holds the controls that
  actually drive the app: **alerts when the timer ends** (formerly parked in *General*), the
  **system notification** (asks for permission once, and says whether it is allowed or blocked),
  and the **ringtone**.
- **The ringtone can be your own file.** *Time → Ringtone* offers the **Mimo alarm**, a **device
  beep** or an **audio file of your own**; picking the last one reveals a picker (double-quaver
  button) that shows the chosen file's name.
- **Time format notice.** The panel says plainly that **the time format is global**: it is changed
  in *General* and applies to every section, so it is not repeated as if it belonged to one section
  only.

### Fixed

- **The panel no longer flickers as much on Linux, where the app runs on WebKitGTK.** The desktop
  app on Linux uses WebKitGTK, and its DMA-BUF renderer disagrees with some graphics drivers —
  **NVIDIA above all** — which shows up as flicker (specially when the side panel animates) and
  white windows. The app now starts with `__NV_DISABLE_EXPLICIT_SYNC=1`, the Tauri-documented fix
  that removes the flicker **without giving up speed**. The heavier switches
  (`WEBKIT_DISABLE_DMABUF_RENDERER=1`, `WEBKIT_DISABLE_COMPOSITING_MODE=1`) are **not** forced,
  because they would slow the app down for everyone; a team that needs them can start the app with
  the variable set.
- **Nothing in the app talks about "the browser" any more.** It is a desktop application, and its
  texts said things like *saved in this browser* or *synced to… the browser*. They now talk about
  **your device** and **your computer**. The notices that only appear **when the app runs in a
  browser** are kept, because there "browser" is the right word.
- **The backup no longer promises a file name it does not use.** The panel said the app was
  *"saved as mimo-limpio-v1"*, which is an internal storage key, not a backup file. It now says
  what is true: your data lives **on this computer**, and the backup is a **`.json` file** you can
  carry to another computer.

- **The "System" icon was invisible.** Its monitor rectangle had lost its width and height, so
  only the stand was drawn (7×3 px inside a 20-px box). The value is restored from the healthy
  copy of the same icon. The sprite has **31 more symbols with the same missing-geometry
  defect**; they are not used by the app yet, and are pending a full cleanup.

### Removed

- **"Accents in titles" and "Compact mode" are gone.** They were listed in the window but
  **nothing read them**: the engine ignored them, so they were dead switches. Removing them also
  cleans the bridge that painted them.

- **The attendance block is gone from *Ramos*.** *Asistencia* (the attendance pie, the minimum and
  the class-by-class marks) and the weekly schedule that lived with it were removed from the course
  card, along with every link behind them: the engine that computed it, the bridges that fed it into
  the grades, and the stored data. It was a feature nobody used in that place, and it will come back
  as **a section of its own** later; nothing of it is half-alive in the meantime.

### Changed (Malla window)

- **The *Malla* window is now the approved sketch, and it stops being a wall of text.** The middle
  column that used to describe every switch is gone; the window is now **one column**, like the rest
  of Settings, with six labelled rows (fill, card size, corners, state colours, line thickness,
  details) and, **below them and across the whole width, a live preview of the four grid states**
  (passed, in progress, available, locked). The preview is not a drawing: it is painted with the
  *same* colours, border and text recipe the real grid uses, and it **updates as you touch the
  controls**, so you see the change before saving. The preview sits below the rows on purpose: in a
  side column it fought the labels for the width and broke on narrow screens.

### Fixed (Malla: the card detail and the sections)

- **The course pills are separated and readable.** In *Malla*, the *Before you need* and *This
  course unlocks* blocks listed the courses with no space at all between them: they ran together
  into one line (measured: 0 px between pills), so two codes read as a single word. They did not
  even have a rule of their own. They are now pills, **8 px apart**, that wrap onto the next line,
  each painted with the colour of that course's state — the same colour as its node in the grid —
  and a long name is **cut with an ellipsis** instead of stretching the pill forever. The full name
  stays in the tooltip.
- **The buttons no longer touch the block above them.** At the foot of the card detail, the row of
  buttons sat flush against the last block (measured: 0 px). It now has separation, and so does the
  *Edit this course* button, which no longer sticks to the *Equivalent course* block above it.
- **The course sections are readable fields, each one labelled.** In *Settings → Malla → Course
  sections*, creating a section was **one unlabelled row**: the name field stretched across the
  whole width (measured: **877 px**) while *Sigla* was squeezed into 76 px, **cutting its own
  text**, and it was not clear which box was which, nor what the colour was for. Now each field
  **has its label** — *Nombre*, *Sigla*, *Color*, *Rango* — over it, with proportional widths
  (sigla 110 px, colour 96 px, range 130 px), and nothing is cut. The same layout is used both for
  the sections that already exist and for the one being created, so the row does not jump when you
  add one.

### Added (right-click menu)

- **Right-clicking a card now offers what you can do with it.** One menu for the whole app
  (`js/comun/12-contexto.js`), opened where the pointer is and closed with Esc or by clicking away.
  On a **course card** in *Malla*: add it to the semester (or remove it), mark it passed (or undo),
  open its card and edit it. On a **calendar event** and on a **task**: mark it done (or put it back
  to pending), set its priority, or open it. It only replaces the system menu when the thing under
  the pointer has actions; elsewhere the right-click behaves as always. The menu is the same one
  Estudio already used for its quick-add, now shared.

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
