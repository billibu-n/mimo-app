## How the desktop application is opened

There are **two ways**, and it is important not to confuse them:

| | how | for whom |
|---|---|---|
| **`cargo run`** | from a terminal, inside `escritorio/src-tauri` | **development**: to try out a change |
| **installer** | installed, it shows up in the **applications menu**, with its icon | **the end user** |

`cargo run` **installs nothing**: GNOME does not know that binary exists, so it gives it its
generic icon and it does not appear in the menu. **It is not an icon bug**: the program simply is
not installed.

## The Linux installer: what it does for you

```bash
cd ~/projects/mimo-app/escritorio
./preparar-frontend.sh
cd src-tauri
cargo tauri build --bundles deb,rpm,appimage   # packages end up in target/release/bundle/
```

(The first time, if you do not have the command: `cargo install tauri-cli --version "^2.0.0"`.)

It produces:

| package | size | notes |
|---|---|---|
| `.rpm` (Fedora) | ~4 MB | installs into the applications menu |
| `.deb` (Debian/Ubuntu) | ~4 MB | installs into the applications menu |
| `.AppImage` | ~100 MB | no installation; carries its own runtime |

> **The AppImage needs the `file` command.** Without it, `linuxdeploy` stops with
> `file command is missing but required`. On Fedora and Debian it is normally present; if it is
> not: `sudo dnf install file` or `sudo apt install file`. It also needs **FUSE** to run.

**What they contain (verified):**

| where it goes | what it is |
|---|---|
| `usr/bin/mimo-escritorio` | the program |
| `usr/share/applications/Mimo Academics.desktop` | **the entry that makes it appear in the applications menu** |
| `usr/share/icons/hicolor/{32x32,128x128,512x512}/apps/mimo-escritorio.png` | the icons, in RGBA (the real logo) |

And the entry says:

```
[Desktop Entry]
Categories=Education;
Comment=Panel universitario: malla, calendario, notas y estudio, sin conexion.
Exec=mimo-escritorio
Icon=mimo-escritorio
Name=Mimo Academics
Terminal=false
Type=Application
```

That is what draws the proper icon and the menu entry. `Categories=Education` places Mimo under
the Education section of the menu.

> Note: `Name` and `Comment` come from `escritorio/src-tauri/tauri.conf.json`. The interface is
> currently in Spanish, so the comment is too; it changes with the language work.

## Installing it on your Fedora

```bash
sudo dnf install ~/projects/mimo-app/escritorio/src-tauri/target/release/bundle/rpm/mimo-academics-1.0.0-desktop-1.x86_64.rpm
```

Then look for **Mimo Academics** in the applications menu. If it does not show up right away, log
out and back in (GNOME caches the menu).

### Careful with the quotes

The file name has **no spaces** (`mimo-academics-1.0.0-desktop-1.x86_64.rpm`): write it straight, without quotes.

## Uninstalling

```bash
sudo dnf remove mimo-escritorio
```

**Your data is not deleted**: your progress lives in your backup folder and in the application's
storage, not inside the package.

## Windows and macOS

- **Windows**: `cargo tauri build` on Windows produces the `.exe` installer. It comes with an
  "unknown publisher" warning until it is signed (signing costs money every year).
- **macOS**: it needs a Mac. It cannot be done from Linux.
