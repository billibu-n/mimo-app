# Iconos

Todos los iconos de Mimo, en su carpeta. Los PNG los usan la aplicacion, el manifiesto PWA, el
lanzador de escritorio y el caparazon de Tauri; el SVG es la hoja de simbolos de la interfaz.

| fichero | donde se usa |
|---|---|
| `icon-16.png` | tamano menor del favicon |
| `icon-32.png` | favicon de la pestana (lo declara `plantilla.html`) |
| `icon-64.png` | logo de la barra lateral y manifiesto PWA |
| `icon-512.png` | manifiesto PWA (normal y `maskable`) e icono del lanzador |
| `iconos.svg` | hoja de simbolos SVG de la interfaz. El armador la **incrusta** en el `index.html` |

La app incrusta el sprite a proposito: un `<use href="iconos.svg#X">` externo **no carga** al
abrir el archivo con doble clic (`file://` es otro origen), asi que los simbolos van dentro.

## Si hay que mover o renombrar un icono

La ruta de un icono esta escrita en **varios sitios que no comparten nada**. No basta con mover el
fichero: hay que cambiarlo en todos y **rearmar**. Esta es la lista (verificada en el codigo, no
de memoria):

**En este repositorio (la app):**

| sitio | que |
|---|---|
| `plantilla.html` | el favicon (`<link rel="icon">`) y el logo de la barra (`<img class="marca-ic">`) |
| `manifest.json` | las tres entradas de `icons` (PWA) |
| `mimo.desktop` | `Icon=`, la ruta del icono del lanzador (relativa al `.desktop`) |
| `escritorio/preparar-frontend.sh` | la lista de lo que se copia al frontend de Tauri |

**En el armador (`~/projects/mimo_config/construir/`):**

| sitio | que |
|---|---|
| `index.py` | de donde lee el sprite (`iconos/iconos.svg`) |
| `index.py` | la lista de la **cache del service worker**: **descubre** los ficheros de `iconos/`, no los enumera |
| `empaquetar.py` | incluye la carpeta `iconos/` en el `.zip` del release |

Ese segundo punto es una mejora de esta reorganizacion: antes la cache tenia los cuatro nombres
**fijos** en la raiz, asi que mover un icono o anadir uno dejaba la cache corta y, sin internet,
faltaba el icono. Ahora se mira lo que hay de verdad en la carpeta.

## Como se comprueba que siguen bien

No basta con mirar que el fichero exista: un `<img>` cuyo archivo falta **esta en el DOM** y da
ancho 0. Lo que se mide es si **carga**:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8734/iconos/icon-64.png
```

Y en la pagina, que el logo tenga `naturalWidth > 0` y que el favicon apunte donde toca.
