# Mimo Academics — development guide

> To **install** the application, see the [README](README.md). This guide is for **working on the
> code**: building, running the tests and checking changes.

## Paths: what is where depends on where you are

| | Your machine (Fedora) | The agent container |
|---|---|---|
| the app | `~/projects/mimo-app` | `/projects/mimo-app` |
| the builder | `~/projects/mimo_config` | `/projects/mimo_config` |

They are the **same** folder: your `~/projects` on the host is what the container mounts at
`/projects`. **On your machine you do NOT need `sudo`** to work with these files: they are yours.
(If `sudo` asks for a password it is because your user has no `NOPASSWD`; that is normal. `sudo` is
only needed to install packages.)

## 0. First of all: the missing dependencies

These three programs are required and did **not** come installed. All three are installed with
`dnf`:

| missing | what for | symptom if absent |
|---|---|---|
| `dbus-devel` | **building** Tauri (the `libdbus-sys` crate demands it) | `failed to run custom build command for libdbus-sys` |
| `nodejs` | running the app's test suite | the 39 tests report "no verdict" |
| `chromium` | testing the backup folder (Brave does not have it) | the app cannot open the folder dialog |

```bash
sudo dnf install -y dbus-devel nodejs chromium
```

On top of that, **the webview development packages**, which Tauri needs to build. The list in
Tauri's official documentation **is incomplete** on Fedora: `dbus-devel` is missing from it. This
is the list that works (measured):

```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel dbus-devel
sudo dnf group install -y "c-development"
```

## 1. Get on the branch (on your machine, without sudo)

```bash
cd ~/projects/mimo-app
git fetch origin
git checkout main
```

## 2. Check the app still works (the quickest loop)

```bash
cd ~/projects/mimo_config
python3 construir/index.py --proyecto ~/projects/mimo-app

cd ~/projects/mimo-app
./abrir.sh
bash ~/projects/mimo_config/pruebas/app/correr_pruebas.sh
```

With `nodejs` installed, expect a few red tests, all of them known: the suite is not currently
100% green (see the note in [CONTRIBUTING.md](CONTRIBUTING.md)). If you get dozens of tests
**without a verdict**, `node` is missing.

### Which browser to use

The default browser is whatever you have set. **Brave ships the folder API disabled**, so **the
backup folder does not work there** (the app explains this in Settings). The launcher warns you
when it starts and tells you which one to open with:

```bash
./abrir.sh --navegador /usr/bin/chromium-browser
```

If that binary does not exist, find out which one you have: `./herramientas/diagnostico.sh`.

## 3. The desktop application

**Two ways, and they are not the same** (details in `escritorio/INSTALL.md`):

**a) As a developer (`cargo run`)** — to try out a change. It **installs nothing**: GNOME has no
idea that binary exists, so it **gives it a generic icon and it does not appear in the menu**.
That is normal; it is not an icon bug.

```bash
cd ~/projects/mimo-app/escritorio
./preparar-frontend.sh          # copies the app into app/
cd src-tauri
cargo run --release             # builds and opens the window
```

**b) As a real application (the installer)** — this one **does appear in the applications menu,
with its own icon**:

```bash
cargo install tauri-cli --version "^2.0.0"     # once only
cd ~/projects/mimo-app/escritorio
./preparar-frontend.sh
cd src-tauri
cargo tauri build --bundles deb,rpm            # ~8 MB, in target/release/bundle/

# and install it (careful: the file name CONTAINS A SPACE, it must be quoted)
sudo dnf install ~/projects/mimo-app/escritorio/src-tauri/target/release/bundle/rpm/mimo-academics-1.0.0-desktop-1.x86_64.rpm
```

Then, in the applications menu: **Mimo Academics**, under Education. If it does not show up right
away, log out and back in (GNOME caches the menu).

To remove it: `sudo dnf remove mimo-escritorio`. **Your data is not deleted.**

## 4. What to look at closely

- **Your data shows up.** The first time you open the desktop version, the app should recover the
  progress from the previous version by itself and say so. If it comes up **empty**, that is the
  most serious bug this branch can have: report it.
- **The backup folder.** In the desktop version it has to work **with any installed browser**,
  because the folder is requested by the system, not by the browser.
- **The migration notice must not repeat** on every start.
- **Downloading my data** and the timer alarm: **these I have not been able to test.**

## Repository layout

| path | what it is |
|---|---|
| `index.html` | **THE ASSEMBLED PRODUCT.** Do not edit it by hand: rebuild it |
| `html/`, `css/`, `js/` | the app's SOURCES |
| `construir/` | the builder's own sources (`plantilla.html`, `plantilla-sw.js`) |
| `js/orden.txt` | the authoritative index of which JS enters, and in what order |
| `sw.js` | service worker: the PRODUCT (rebuilt from `construir/plantilla-sw.js`) |
| `manifest.json` | PWA manifest |
| `iconos/` | the icons and the interface sprite (see `ICONS.md`) |
| `herramientas/` | the browser launcher, the diagnosis and the repair page |
| `abrir.sh` | shortcut: opens the app in the browser (forwards to `herramientas/`) |
| `escritorio/` | **the Tauri shell**: the desktop application |
| `_trabajo/` | working notes. **Not versioned** |

## If something goes wrong

| symptom | cause and fix |
|---|---|
| `fatal: cannot change to '/projects/...'` | that is the **container** path. On your machine: `~/projects/...` |
| many tests "without a verdict" | Node is missing: `sudo dnf install nodejs` |
| `failed to run custom build command for libdbus-sys` | DBus development files are missing: `sudo dnf install dbus-devel` |
| The folder dialog does not open | you are on Brave, which ships it disabled: use Chromium or the desktop version |
| The app shows an old version | `./abrir.sh --reparar` |
| The browser cannot find the folder | `./herramientas/diagnostico.sh` |
| `cargo: command not found` | Rust is missing: `curl ... https://sh.rustup.rs \| sh -s -- -y` and reload the terminal |

## Note on AI assistance

This work was prepared with the help of an AI agent (OpenHands), from recorded measurements and
tests. The author of the project is **Billibu**.
