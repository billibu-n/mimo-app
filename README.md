# Mimo Academics

[![Version](https://img.shields.io/github/v/release/billibu-n/mimo-app?label=version&color=16a34a)](https://github.com/billibu-n/mimo-app/releases/latest)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-2563eb)](#installation)
[![License](https://img.shields.io/badge/license-MIT-3da639)](LICENSE)

**A university semester panel that works offline.** It brings your course map, calendar, grades,
study time and timer into one application, and **it does not send your data anywhere**: it stays
on your machine.

## Download

<h3 align="center">
  <a href="https://github.com/billibu-n/mimo-app/releases/latest">
    <img alt="Download the latest version" src="https://img.shields.io/badge/Download_the_latest_version-16a34a?style=for-the-badge&logo=github&logoColor=white">
  </a>
</h3>

<p align="center"><b>Download → install → open.</b> That is all it takes.<br>
No account, no sign-up, and nothing is uploaded: your data stays on your computer.</p>

**How to install it, in three steps:**

1. **Download.** Click the button above (or open the [latest release](https://github.com/billibu-n/mimo-app/releases/latest)). On that page, the files are inside a collapsible section called **Assets** — if you only see a long text and no files, click *Assets* to unfold it.
2. **Pick your file** using the table below and download it.
3. **Install and open.** Double-click it on Windows, or run the one-line command from the table on Linux.

> **Windows tip:** the installer is not digitally signed (a certificate costs money every year), so
> Windows shows a SmartScreen warning. Click *More info*, then *Run anyway*. [Why is it safe?](#windows)

Here is the file for each system:

| Your system | Download this file | Then |
|---|---|---|
| **Fedora**, openSUSE, RHEL | `mimo-academics-1.1.2-desktop-1.x86_64.rpm` | `sudo dnf install <file>` |
| **Debian**, Ubuntu, Mint | `mimo-academics_1.1.2-desktop_amd64.deb` | `sudo apt install ./<file>` |
| **Any Linux**, no install | `mimo-academics_1.1.2-desktop_amd64.AppImage` | `chmod +x <file>` and open it |
| **Windows 10 / 11** | `mimo-academics_1.1.2-desktop_x64-setup.exe` | double-click it |
| **Any system**, web version | `mimo-v1.1.2-desktop.zip` | unzip and open `mimo/index.html` |

**Your data is kept on your machine** in every case, and you can take it with you using the backup
in **Settings**. Nothing is uploaded anywhere.

### Linux

The desktop version is tested on **Fedora**, and works on any distribution with WebKitGTK 4.1
(Debian, Ubuntu, Arch, openSUSE...).

**With an installer**:

```bash
# Fedora, openSUSE and derivatives
sudo dnf install mimo-academics-1.1.2-desktop-1.x86_64.rpm

# Debian, Ubuntu and derivatives
sudo apt install ./mimo-academics_1.1.2-desktop_amd64.deb
```

If the app does not show up in the menu right away, log out and back in: the menu is cached.

**Without installing anything** (the AppImage):

```bash
chmod +x mimo-academics_1.1.2-desktop_amd64.AppImage
./mimo-academics_1.1.2-desktop_amd64.AppImage
```

The AppImage is about **100 MB** (it carries its own runtime) against about **4 MB** for the
`.rpm` and `.deb`. It needs FUSE, which Fedora, Ubuntu and Debian include by default.

> **About the file names.** The version in the name is the one of the release you are
> downloading. They have no spaces, so nothing needs quoting. The `-desktop` suffix
> is not decoration: with the previous `1.0.0` the package managers answered *"already installed"*
> even after the contents changed, because they compare numbers, not contents. With the suffix
> they update properly.

### Windows

Download **`mimo-academics_1.1.2-desktop_x64-setup.exe`** and double-click it. It installs for
your user and creates a Start Menu entry, so you do not need administrator rights.

> **Windows will warn you** that the publisher is unknown (SmartScreen), because the installer
> **is not digitally signed**: signing costs money every year, so... To continue: click *More info* and
> then *Run anyway*. It's clearly safe btw -_-

> **The `.exe` is built after the Linux files.** A Tauri application links against the system's
> graphics libraries, so a Windows installer **cannot be built from Linux**: GitHub Actions builds
> it on a real Windows machine when the release is published, and attaches it here a few minutes
> later. Compiling it takes around ten minutes. If you only see the Linux files, reload the page
> in a little while. You can watch the progress under the *Actions* tab.

### macOS

Pending. Building for macOS requires a Mac... Maybe you already know the issue.

### Android, iPhone and tablets

Pending, and it is last on the list **on purpose**: the current interface is designed for a large
screen and needs a redesign before it fits on a phone. A tablet is the same as a phone: it runs
Android or iOS... But I'm working on it as fast as I can.

### From the source code (for development)

See **[DEVELOPMENT.md](DEVELOPMENT.md)**. In short:

```bash
cd escritorio
./preparar-frontend.sh      # copies the app into app/
cd src-tauri
cargo tauri build           # the packages end up in target/release/bundle/
```

The web version needs nothing at all: open `index.html` by double-clicking it, or run
`./abrir.sh`. 

## How to use it

The application is a semester panel. The bar on the left has seven sections:

- **Calendar** — the calendar of the current semester: events, exams and deadlines.
- **Study** — how many hours you study, week by week, against your goal.
- **Degree map** — the courses, their credits and which ones are prerequisites.
- **Courses** — your subjects and their grades: what you need in each assessment to reach the
  grade you want.
- **Time** — stopwatch, timer and pomodoro, with the time charged to a course.
- **Tasks** — everything pending, joined to your courses and your calendar.
- **Settings** — colour theme, backup folder, other options and updates.

**Nothing is sent to a server.**

## What it includes

- **Offline from the first second.** No connection, no account, no sign-up.
- **Course map with prerequisites.** It draws itself, level by level, from the courses you enter.
- **Imports a course list from a PDF.** It reads the map many universities publish.
- **Grades by weighting.** It tells you what you need in the next assessment.
- **Eight colour themes**, including a high-contrast one.
- **Automatic backup** to a folder you choose, keeping the last three copies.
- **A sync button in the header**, pressing it syncs right away.
- **The version button updates on press.** If a newer version exists, it downloads and opens the
  installer on Windows, or opens the release page on Linux and in the browser.
- **The interface is translated** (Spanish and English), starting with the top menu and the
  header.
- **Desktop application** with its own window and its own icon (Linux `.rpm`, `.deb` and
  AppImage; Windows `.exe`).
- **Stopwatch, timer and pomodoro**, with the duration typed straight into the clock and the
  day you are on set apart at the top of the session list.
- **It asks before deleting.** Every destructive action opens an in-app confirmation that says
  what will be lost, and the focus starts on *Cancel*.

## Project status

Version 1.1.2-desktop. The desktop application is **usable and stable**, and it keeps growing:
synchronisation, mobile and the rest of the translations are still on the list (the top menu and
the header already speak Spanish and English). **Bug reports and ideas are welcome** — see
[CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

- Found a bug? Open an issue with the error template.
- Have an idea? Open an issue with the proposal template, or use *Discussions*.
- Want to write code? Read [CONTRIBUTING.md](CONTRIBUTING.md) first.
- Want to translate it? That work is planned but not started; say so in *Discussions*.

## Structure

```
index.html      the web application (built from html/ + js/; do not edit by hand)
css/            styles: structure (general.css, aviso.css) and themes (tema-*.css)
js/             the code, by sections (see js/orden.txt for the load order)
html/           one piece per tab
iconos/         the icons and the interface sprite
sonido/         the timer alarm
vendor/         PDF reader engine (pdf.js)
manifest.json   PWA manifest
sw.js           the service worker (works offline)
version.json    version number, for the update button (written by the builder)
escritorio/     the desktop application (Tauri): its own window and installers
construir/      the builder's own sources (page shell, service worker template)
herramientas/   the browser launcher, the diagnosis and the repair page
abrir.sh        shortcut: opens the app in the browser
```

## License

[MIT](LICENSE): you may use, copy, modify and redistribute Mimo, including for commercial
purposes, as long as you keep the copyright notice. It comes **with no warranty**: check it
before trusting it with your grades.

## Version

1.1.2-desktop — the details of each version are in [`CHANGELOG.md`](CHANGELOG.md).

## Credits

Mimo uses work from other people, and they are named here. The full licences, with the notices
that must be kept, are in **[CREDITS.md](CREDITS.md)**.

- **Interface icons** from [Lucide](https://lucide.dev) (ISC licence; 147 of them are also
  derived from **Feather**, under the MIT licence).
- **PDF reader**: [pdf.js](https://mozilla.github.io/pdf.js/), by Mozilla Foundation
  (Apache 2.0, included in `vendor/`).
- **Desktop application**: [Tauri](https://v2.tauri.app/), by Tauri Programmes Ltd
  (MIT or Apache 2.0).
- **AI tools** that assisted the development: **DeepSeek** and **OpenHands**.
  The design, the decisions and the contents are **Billibu**'s.

## Support the Project

If Mimo Academics has been helpful to you and you'd like to support its continued development, consider supporting via "Buy Me a Coffee" or...  "Buy Me a Completo" 🌭 :)

[![](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-yellow?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/billibu)

Every contribution helps cover development time and future improvements. Thank you for being part of this journey!
