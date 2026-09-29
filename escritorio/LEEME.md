# Mimo Academics para ESCRITORIO (Tauri v2)

Esta carpeta convierte Mimo en una **aplicacion de escritorio de verdad** (ventana propia, icono
propio, instalable), sin reescribir la aplicacion. El `index.html` que se abre es **el mismo**
que el del navegador.

Estado: **EN PRUEBA, todavia NO forma parte del lanzamiento**. Vive en su rama.

## Que hay aqui

| ruta | que es |
|---|---|
| `src-tauri/` | el caparazon: configuracion, permisos y el codigo Rust |
| `preparar-frontend.sh` | copia la app a `app/` (generado; no se edita a mano) |
| `app/` | **GENERADO** por el script. Esta en `.gitignore` |

`src-tauri/src/main.rs` es lo unico con logica propia, y hace dos cosas:

1. **El comando de MIGRACION.** Los datos del usuario viven en el `localStorage`, y eso pertenece
   a un ORIGEN: en el lanzador es `http://127.0.0.1:8734` y dentro de Tauri es `tauri://localhost`.
   Son origenes distintos, asi que **sin migrar, la app de escritorio arrancaria vacia**. El
   comando busca el perfil del lanzador y trae los datos. Se hace en Rust para que el permiso de
   lectura del disco lo resuelva el sistema operativo, y no haya que abrirle la carpeta del
   usuario a la pagina.
2. **La sonda de medicion** (solo con `MIMO_SONDA=1`): mide el motor dentro de la ventana real y
   deja el informe en disco. En el uso normal no corre.

La **carpeta de guardado** no necesita codigo de Rust: se resuelve en
`js/comun/10a-carpeta-tauri.js`, que le da al resto de la app un objeto con la misma forma que un
`FileSystemDirectoryHandle` pero apoyado en el dialogo y los ficheros de Tauri.

## Requisitos (Fedora)

**La lista mas facil: un script.** Instala todo y comprueba que quedo bien:

```bash
sh ~/projects/mimo-academics/escritorio/instalar-fedora.sh
```

A mano seria:

```bash
# Las librerias de desarrollo. OJO: la lista OFICIAL de Tauri le falta `dbus-devel`, y sin el
# la compilacion se cae a mitad con "failed to run custom build command for libdbus-sys".
# (Medido: la lista de abajo es la que funciona.)
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel dbus-devel
sudo dnf group install -y "c-development"
sudo dnf install -y nodejs          # lo piden las 39 pruebas de la app

# Rust (no viene en dnf)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
. "$HOME/.cargo/env"
```

En Debian/Ubuntu los paquetes son otros: `libwebkit2gtk-4.1-dev`, `libxdo-dev`, `libdbus-1-dev`.

## Como se compila y se prueba

Desde `~/projects/mimo-academics` en tu equipo (**sin `sudo`**: son tus ficheros):

```bash
cd ~/projects/mimo-academics/escritorio
./preparar-frontend.sh                  # la app -> app/
cd src-tauri
cargo run --release                     # compila y ABRE la ventana
```

Para que quede como aplicacion instalable, en vez de `cargo run`:

```bash
cargo install tauri-cli --version "^2.0.0"     # una sola vez
cd ~/projects/mimo-academics/escritorio/src-tauri
cargo tauri build                              # paquetes en target/release/bundle/
```

## Como se mide (sin pantalla)

En un servidor no hay pantalla, asi que la evidencia sale del DOM, no de los pixeles:

```bash
MIMO_SONDA=1 xvfb-run -a ./target/release/mimo-escritorio
```

## Dos trampas que costaron tiempo (no repetirlas)

1. **El icono TIENE que ser RGBA.** Un PNG sin canal alfa hace que Tauri **no compile**
   (`icon ... is not RGBA`). Para generarlos bien: `cargo tauri icon <png-de-origen>`.
2. **No declarar la ventana dos veces** (`app.windows` en la configuracion **y** en el `setup` de
   Rust): da `a webview with label 'main' already exists`. En un solo sitio.

## Que NO resuelve esto

- **El binario definitivo se compila en tu maquina.** Una app Tauri en Linux enlaza contra el
  WebKitGTK del sistema: un binario hecho en Debian no sirve en Fedora.
- **macOS** necesita un Mac o CI.
- El **movil** es otro trabajo (rediseno de interfaz).
