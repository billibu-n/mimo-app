# Mimo Academics for DESKTOP (Tauri v2)

This folder turns Mimo into a **real desktop application** (its own window, its own icon,
installers) without rewriting the application. The `index.html` that opens is **the same** as the
one in the browser.

## What is in here

| path | what it is |
|---|---|
| `src-tauri/` | the shell: configuration, permissions and the Rust code |
| `preparar-frontend.sh` | copies the app into `app/` (generated; do not edit by hand) |
| `app/` | **GENERATED** by the script. It is in `.gitignore` |
| `generar-iconos.py` | builds the icons for Tauri from `iconos/icon-512.png` |
| `instalar-fedora.sh` | installs every dependency on Fedora, and checks the result |

`src-tauri/src/main.rs` is the only file with logic of its own, and it does two things:

1. **The MIGRATION command.** Your data lives in `localStorage`, and that belongs to an ORIGIN: in
   the launcher it is `http://127.0.0.1:8734` and inside Tauri it is `tauri://localhost`. They are
   different origins, so **without migrating, the desktop app would start up empty**. The command
   looks for the launcher's profile and brings the data across. It is done in Rust so that the
   disk read permission is resolved by the operating system, and the user's folder does not have
   to be opened up to the page.
2. **The measurement probe** (only with `MIMO_SONDA=1`): it measures the engine inside the real
   window and leaves the report on disk. It does not run in normal use.

The **backup folder** needs no Rust code: it is handled in `js/comun/10a-carpeta-tauri.js`, which
gives the rest of the app an object shaped like a `FileSystemDirectoryHandle` but backed by
Tauri's dialog and file APIs.

## Requirements (Fedora)

**The easiest list: one script.** It installs everything and checks that it went well:

```bash
sh ~/projects/mimo-app/escritorio/instalar-fedora.sh
```

By hand it would be:

```bash
# The development libraries. CAREFUL: Tauri's OFFICIAL list is missing `dbus-devel`, and
# without it the build dies halfway with "failed to run custom build command for libdbus-sys".
# (Measured: the list below is the one that works.)
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel dbus-devel
sudo dnf group install -y "c-development"
sudo dnf install -y nodejs          # required by the app's test suite

# Rust (not available through dnf)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
. "$HOME/.cargo/env"
```

On Debian/Ubuntu the packages are different: `libwebkit2gtk-4.1-dev`, `libxdo-dev`, `libdbus-1-dev`.

## How it is built and tested

From `~/projects/mimo-app` on your machine (**no `sudo`**: these are your files):

```bash
cd ~/projects/mimo-app/escritorio
./preparar-frontend.sh                  # the app -> app/
cd src-tauri
cargo run --release                     # builds and OPENS the window
```

To get a real installable application instead of `cargo run`:

```bash
cargo install tauri-cli --version "^2.0.0"     # once only
cd ~/projects/mimo-app/escritorio/src-tauri
cargo tauri build                              # packages in target/release/bundle/
```

## How it is measured (no screen)

On a server there is no screen, so the evidence comes from the DOM, not from the pixels:

```bash
MIMO_SONDA=1 xvfb-run -a ./target/release/mimo-escritorio
```

## Two traps that cost time (do not repeat them)

1. **The icon HAS to be RGBA.** A PNG without an alpha channel makes Tauri **fail to build**
   (`icon ... is not RGBA`). To generate them correctly: `cargo tauri icon <source.png>`.
2. **Do not declare the window twice** (`app.windows` in the config **and** in the Rust `setup`):
   that gives `a webview with label 'main' already exists`. Keep it in one place only.

## What this does not solve

- **The final binary is built on your machine.** A Tauri app on Linux links against the system's
  WebKitGTK: a binary built on Debian will not work on Fedora, and vice versa. That is why the
  installers are published built for the target system.
- **macOS** needs a Mac or CI.
- **Mobile** is a separate job (interface redesign).
