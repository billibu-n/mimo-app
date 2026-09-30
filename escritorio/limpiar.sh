#!/bin/sh
# Borra lo que NO es fuente y se puede regenerar. Deja la carpeta en "justo lo necesario".
#
# QUE ES ESTO: al compilar, Rust deja su cache en `src-tauri/target/`. No son datos de la
# aplicacion ni nada que el usuario haya escrito: son los ficheros intermedios de la compilacion
# de las ~431 dependencias (Tauri, WebKitGTK, serde...). Cargo los reutiliza para no recompilar
# de cero las siguientes veces, y ocupan gigabytes. Ese es TODO el peso.
#
# NO guarda lo que haces en la aplicacion: lo que la aplicacion guarda (tus datos) vive en el
# `localStorage` del webview, en tu carpeta de usuario, nunca aqui.
#
# Uso:
#   sh escritorio/limpiar.sh          -> borra todo el cache (la proxima compilacion es lenta)
#   sh escritorio/limpiar.sh --dev    -> borra SOLO el cache de desarrollo y CONSERVA el
#                                        instalable ya construido (target/release)
#
# NO toca: la app de la raiz (index.html, js/, css/, html/, iconos/, sonido/, vendor/), ni el
# codigo de escritorio (src/, Cargo.toml, tauri.conf.json, icons/), ni la documentacion.

set -e
AQUI=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$AQUI/.." && pwd)
OBJ="$AQUI/src-tauri/target"

antes=$(du -sm "$REPO" | cut -f1)

if [ "$1" = "--dev" ]; then
  echo "Borrando solo el cache de DESARROLLO (se conserva target/release y su instalable) ..."
  rm -rf "$OBJ/debug"
  rm -rf "$AQUI/src-tauri/gen"
  rm -rf "$AQUI/app"
else
  echo "Borrando todo el cache de compilacion de $REPO ..."
  # `cargo clean` es la via oficial y ademas revisa lo que borra. Si no hay cargo a mano
  # (pasa fuera de tu equipo), se borra la carpeta, que es exactamente lo que el hace.
  if [ -d "$OBJ" ]; then
    if command -v cargo >/dev/null 2>&1; then
      ( cd "$AQUI/src-tauri" && cargo clean )
    else
      rm -rf "$OBJ"
    fi
  fi
  rm -rf "$AQUI/src-tauri/gen"
  rm -rf "$AQUI/app"
fi

despues=$(du -sm "$REPO" | cut -f1)
echo "listo: $((antes - despues)) MB liberados (de $antes MB a $despues MB)."
if [ "$1" = "--dev" ]; then
  echo "El instalable de target/release sigue ahi. Solo pagas recompilar el modo desarrollo."
else
  echo "La proxima compilacion tarda mas (vuelve a crear el cache), pero el resultado es el mismo."
  echo "Si no quieres que vuelva a crecer, mira la nota 'Weight' de escritorio/README.md."
fi
