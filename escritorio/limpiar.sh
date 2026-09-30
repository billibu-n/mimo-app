#!/bin/sh
# Borra lo que NO es fuente y se puede regenerar. Deja la carpeta en "justo lo necesario".
#
# Por que existe: la cache de Rust (`src-tauri/target`) llega a 4,5 GB y se ve como si la
# aplicacion pesara eso, cuando la aplicacion son ~12 MB. Esa cache la regenera la proxima
# compilacion (mas lenta la primera vez), y estos ficheros NO se versionan (estan en .gitignore).
#
# Uso:
#   sh escritorio/limpiar.sh            -> borra lo generado y dice cuanto se libero
#   sh escritorio/limpiar.sh --todo     -> ademas borra los instalables guardados en _archivo
#
# NO toca: la app de la raiz (index.html, js/, css/, html/, iconos/, sonido/, vendor/), ni el
# codigo de escritorio (src/, Cargo.toml, tauri.conf.json, icons/), ni la documentacion.

set -e
AQUI=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$AQUI/.." && pwd)

antes=$(du -sm "$REPO" | cut -f1)

echo "Borrando lo regenerable de $REPO ..."
# 1. La cache de compilacion de Rust (lo que pesa de verdad).
rm -rf "$AQUI/src-tauri/target"
# 2. Los esquemas que Tauri regenera en cada build.
rm -rf "$AQUI/src-tauri/gen"
# 3. La copia del frontend que arma preparar-frontend.sh antes de compilar.
rm -rf "$AQUI/app"

if [ "$1" = "--todo" ]; then
  # 4. Instalables guardados a mano (opcional: solo si ya estan publicados).
  rm -f "$REPO"/_archivo/*/instalables/*.rpm "$REPO"/_archivo/*/instalables/*.deb 2>/dev/null || true
  echo "  (tambien los instalables de _archivo)"
fi

despues=$(du -sm "$REPO" | cut -f1)
echo "listo: $((antes - despues)) MB liberados (de $antes MB a $despues MB)."
echo "La proxima compilacion tarda mas (vuelve a crear la cache), pero el resultado es el mismo."
