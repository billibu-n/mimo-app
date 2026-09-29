## Como se abre la aplicacion de escritorio

Hay **dos maneras**, y es importante no confundirlas:

| | como | para quien |
|---|---|---|
| **`cargo run`** | desde una terminal, dentro de `escritorio/src-tauri` | **desarrollo**: para probar un cambio |
| **instalable** | se instala y sale **en el menu de aplicaciones**, con su icono | **el usuario final** |

`cargo run` **no instala nada**: GNOME no sabe que ese binario existe, asi que le pone su icono
generico y no aparece en el menu. Eso es lo que se veia en las capturas. **No es un fallo del
icono**: es que el programa no estaba instalado.

## El instalable de Linux: lo que hace por ti

```bash
cd ~/projects/mimo-academics/escritorio
./preparar-frontend.sh
cd src-tauri
cargo tauri build --bundles deb,rpm      # deja los paquetes en target/release/bundle/
```

(La primera vez, si no tienes el comando: `cargo install tauri-cli --version "^2.0.0"`.)

Salen dos paquetes: `.rpm` (Fedora) y `.deb` (Debian/Ubuntu), unos 8 MB cada uno. Ademas el
`AppImage` esta en la lista de `targets`, si se pide.

**Lo que llevan dentro (comprobado):**

| donde va | que es |
|---|---|
| `usr/bin/mimo-escritorio` | el programa |
| `usr/share/applications/Mimo Academics.desktop` | **la ficha que hace que aparezca en el menu de aplicaciones** |
| `usr/share/icons/hicolor/{32x32,128x128,512x512}/apps/mimo-escritorio.png` | los iconos, en RGBA (el logo real) |

Y la ficha dice:

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

Eso es lo que pinta el icono bueno y la entrada en el menu. `Categories=Education` coloca Mimo en
la seccion de Educacion del menu.

## Instalarlo en tu Fedora

```bash
sudo dnf install ~/projects/mimo-academics/escritorio/src-tauri/target/release/bundle/rpm/'Mimo Academics-1.0.0-1.x86_64.rpm'
```

Despues, en el menu de aplicaciones busca **Mimo Academics**. Si no aparece al momento, cierra
sesion y vuelve a entrar (GNOME cachea el menu).

### Ojo con las comillas

El nombre del fichero **lleva un espacio** (`Mimo Academics-1.0.0-1.x86_64.rpm`). Hay que
entrecomillarlo o el `sudo` intentara instalar dos cosas.

## Desinstalar

```bash
sudo dnf remove mimo-escritorio
```

Los **datos no se borran**: el progreso vive en tu carpeta de respaldo y en el almacenamiento de
la aplicacion, no dentro del paquete.

## Windows y macOS

- **Windows**: `cargo tauri build` en Windows produce el instalador `.exe`. Sale con aviso de
  "editor desconocido" hasta que se firme (firmar cuesta dinero al ano).
- **macOS**: hace falta un Mac. Desde Linux no se puede.
