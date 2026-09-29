# Mimo Academics — guia de DESARROLLO

> Para **instalar** la aplicacion, mira el [README](README.md). Esta guia es para **trabajar
> en el codigo**: compilar, correr las pruebas y comprobar cambios.

## Rutas: donde esta cada cosa segun donde estes

| | Tu equipo (Fedora) | El contenedor del agente |
|---|---|---|
| la app | `~/projects/mimo-academics` | `/projects/mimo-academics` |
| el armador | `~/projects/mimo_config` | `/projects/mimo_config` |

Son la **misma** carpeta: `~/projects` del host es lo que el contenedor monta en `/projects`.
**En tu equipo NO hace falta `sudo`** para trabajar con estos ficheros: son tuyos. (Si `sudo` te
pide contrasena es porque tu usuario no tiene `NOPASSWD`; es normal. Solo hace falta para
instalar paquetes.)

## 0. Antes de nada: dependencias que faltan

Estos tres programas son necesarios y **no** venian instalados. Los tres se instalan con `dnf`:

| falta | para que | sintoma si no esta |
|---|---|---|
| `dbus-devel` | **compilar** Tauri (el crate `libdbus-sys` lo exige) | `failed to run custom build command for libdbus-sys` |
| `nodejs` | correr las 39 pruebas de la app | 39 lineas `node: orden no encontrada` y "sin veredicto" |
| `chromium` | probar la carpeta de guardado (Brave no la trae) | la app no abre el dialogo de carpeta |

```bash
sudo dnf install -y dbus-devel nodejs chromium
```

Y ademas, **los paquetes de desarrollo del webview**, que son los que Tauri necesita para
compilar. La lista de la documentacion oficial de Tauri **esta incompleta** en Fedora: falta
`dbus-devel`. Esta es la lista que funciona (medida):

```bash
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel dbus-devel
sudo dnf group install -y "c-development"
```

## 1. Ponerse en la rama (en tu equipo, sin sudo)

```bash
cd ~/projects/mimo-academics
git fetch origin
git checkout main
```

## 2. Que la app de siempre sigue bien (lo mas rapido)

```bash
cd ~/projects/mimo_config
python3 construir/index.py --proyecto ~/projects/mimo-academics

cd ~/projects/mimo-academics
./abrir.sh
bash ~/projects/mimo_config/pruebas/app/correr_pruebas.sh
```

Esperado con `nodejs` instalado: **43 en verde / 1 en rojo** (el rojo es `pdfplumber`, de siempre).
Si te salen **39 "sin veredicto"**, es que falta `node`.

### Que navegador usar

Tu navegador por defecto es **Brave Origin Nightly**. Brave trae **desactivada** la API de
carpetas, asi que **la carpeta de guardado no funciona ahi** (la app lo explica en Ajustes). El
lanzador te lo avisa al arrancar y te dice con cual abrir:

```bash
./abrir.sh --navegador /usr/bin/chromium-browser
```

Si ese binario no existe, mira cual tienes: `./diagnostico.sh`.

## 3. La aplicacion de escritorio

**Dos formas, y no son lo mismo** (el detalle, en `escritorio/INSTALAR.md`):

**a) Como desarrollador (`cargo run`)** — para probar un cambio. **No instala nada**: GNOME no
sabe que ese binario existe, asi que **le pone su icono generico y no sale en el menu**. Es normal,
no es un fallo del icono.

```bash
cd ~/projects/mimo-academics/escritorio
./preparar-frontend.sh          # copia la app a app/
cd src-tauri
cargo run --release             # compila y abre la ventana
```

**b) Como aplicacion de verdad (el instalable)** — esta **si aparece en el menu de aplicaciones,
con su icono propio**:

```bash
cargo install tauri-cli --version "^2.0.0"     # una sola vez
cd ~/projects/mimo-academics/escritorio
./preparar-frontend.sh
cd src-tauri
cargo tauri build --bundles deb,rpm            # ~8 MB, en target/release/bundle/

# y se instala (ojo: el nombre del fichero LLEVA UN ESPACIO, hay que entrecomillarlo)
sudo dnf install ~/projects/mimo-academics/escritorio/src-tauri/target/release/bundle/rpm/'Mimo Academics-1.0.0-1.x86_64.rpm'
```

Despues, en el menu de aplicaciones: **Mimo Academics**, dentro de Educacion. Si no aparece al
momento, cierra sesion y vuelve a entrar (GNOME guarda el menu en cache).

Para quitarlo: `sudo dnf remove mimo-escritorio`. **Los datos no se borran.**

## 4. Lo que hay que mirar con atencion

- **Tus datos aparecen.** Al abrir la version de escritorio por primera vez, la app deberia
  recuperar sola el progreso de la version anterior (el lanzador) y avisarlo. Si aparece **vacia**,
  es el fallo mas importante que puede tener esta rama: dilo.
- **La carpeta de guardado.** En la version de escritorio tiene que funcionar **con cualquier
  navegador instalado**, porque la carpeta la pide el sistema, no el navegador.
- **El aviso de migracion no debe repetirse** en cada arranque.
- **Descargar mis datos** y la alarma del temporizador: **esto NO lo he podido probar.**

## Estructura del repositorio

| ruta | que es |
|---|---|
| `index.html` | **PRODUCTO ENSAMBLADO.** No se edita a mano: se rearma |
| `plantilla.html`, `html/`, `css/`, `js/` | las FUENTES de la app |
| `js/orden.txt` | el indice autoritativo de que JS entra, y en que orden |
| `sw.js` / `plantilla-sw.js` | service worker: producto / fuente |
| `manifest.json` | manifiesto PWA |
| `iconos/` | los iconos y el sprite de la interfaz (ver `ICONOS.md`) |
| `lanzador.py`, `abrir.sh`, `mimo.desktop` | el lanzador de escritorio clasico |
| `diagnostico.sh` | dice que navegador encuentra el lanzador y por que |
| `fix.html` | pagina de reparacion (borra service worker y cache; no toca los datos) |
| `escritorio/` | **el caparazon Tauri** (en prueba en esta rama) |
| `_trabajo/` | notas de trabajo. **No se versiona** |

## Si algo sale mal

| sintoma | causa y arreglo |
|---|---|
| `fatal: cannot change to '/projects/...'` | esa es la ruta del **contenedor**. En tu equipo: `~/projects/...` |
| `node: orden no encontrada` (39 pruebas sin veredicto) | falta Node: `sudo dnf install nodejs` |
| `failed to run custom build command for libdbus-sys` | falta DBus de desarrollo: `sudo dnf install dbus-devel` |
| No abre el dialogo de carpeta | estas en Brave, que la trae desactivada: usa Chromium o la version de escritorio |
| La app se ve con una version vieja | `./abrir.sh --reparar` |
| El navegador no encuentra la carpeta | `./diagnostico.sh` |
| `cargo: instruccion no encontrada` | falta Rust: `curl ... https://sh.rustup.rs \| sh -s -- -y` y recarga la terminal |

## Aviso de asistencia de IA

Esta rama fue preparada por un agente de IA (OpenHands) a partir de mediciones y pruebas
registradas. El autor del proyecto es **Billibu**.
