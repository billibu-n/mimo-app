# Icons

All of Mimo's icons, in their own folder. The PNGs are used by the application, the PWA manifest,
the desktop launcher and the Tauri shell; the SVG is the interface's symbol sheet.

| file | where it is used |
|---|---|
| `icon-16.png` | smallest favicon size |
| `icon-32.png` | browser tab favicon (declared in `plantilla.html`) |
| `icon-64.png` | sidebar logo and PWA manifest |
| `icon-512.png` | PWA manifest (regular and `maskable`) and launcher icon |
| `iconos.svg` | the interface's SVG symbol sheet. The builder **inlines** it into `index.html` |

The app inlines the sprite on purpose: an external `<use href="iconos.svg#X">` **does not load**
when you open the file by double-clicking it (`file://` is a different origin), so the symbols
travel inside.

## If an icon has to be moved or renamed

An icon's path is written in **several places that share nothing**. Moving the file is not enough:
you have to change it in all of them and **rebuild**. This is the list (verified in the code, not
from memory):

**In this repository (the app):**

| place | what |
|---|---|
| `plantilla.html` | the favicon (`<link rel="icon">`) and the sidebar logo (`<img class="marca-ic">`) |
| `manifest.json` | the three `icons` entries (PWA) |
| `mimo.desktop` | `Icon=`, the launcher's icon path (relative to the `.desktop`) |
| `escritorio/preparar-frontend.sh` | the list of what gets copied into Tauri's frontend |

**In the builder (`~/projects/mimo_config/construir/`):**

| place | what |
|---|---|
| `index.py` | where it reads the sprite from (`iconos/iconos.svg`) |
| `index.py` | the **service worker cache** list: it **discovers** the files in `iconos/`, it does not enumerate them |
| `empaquetar.py` | includes the `iconos/` folder in the release `.zip` |

That second point is an improvement from this reorganisation: the cache used to have the four
names **hard-coded** at the root, so moving an icon or adding one left the cache short and, with
no internet, the icon was missing. Now it looks at what is really in the folder.

## How to check they are still fine

Checking that the file exists is not enough: an `<img>` whose file is missing **is in the DOM** and
reports a width of 0. What gets measured is whether it **loads**:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8734/iconos/icon-64.png
```

And, in the page, that the logo has `naturalWidth > 0` and that the favicon points where it should.
