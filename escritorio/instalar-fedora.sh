#!/bin/sh
# Instala TODO lo que hace falta para compilar la version de escritorio de Mimo en Fedora.
#
# Por que este script si la documentacion de Tauri ya trae una lista: la lista OFICIAL esta
# incompleta para Fedora. Medido: el crate `libdbus-sys` exige DBus de desarrollo y la lista
# oficial no lo trae, asi que la compilacion se cae a mitad con
#   "failed to run custom build command for `libdbus-sys`" / "Package 'dbus-1' not found".
# Aqui estan las dos: la oficial + dbus-devel.
#
# Este script NO toca tu carpeta de Mimo. Solo instala paquetes del sistema.
# Se ejecuta a mano, porque pide tu contrasena:
#     sh ~/projects/mimo-academics/escritorio/instalar-fedora.sh

set -e

if [ "$(id -u)" = "0" ]; then
  echo "No lo ejecutes con sudo: el propio script pide lo que necesita."
  echo "Usa:  sh $0"
  exit 1
fi

if ! command -v dnf >/dev/null 2>&1; then
  echo "Esto es para Fedora (no encuentro 'dnf')."
  echo "En Debian/Ubuntu los paquetes se llaman distinto: libwebkit2gtk-4.1-dev, libxdo-dev..."
  exit 1
fi

echo "== 1/3. Librerias de desarrollo que Tauri necesita =="
# dbus-devel va APARTE de la lista oficial a proposito: sin el, el build se cae (medido).
sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file \
    libappindicator-gtk3-devel librsvg2-devel libxdo-devel dbus-devel

echo "== 2/3. Compilador de C =="
sudo dnf group install -y "c-development"

echo "== 3/3. Node y Chromium =="
# Node: lo piden las 39 pruebas de la app (sin el, salen "sin veredicto").
# Chromium: la carpeta de guardado no funciona en Brave, que la trae desactivada.
sudo dnf install -y nodejs chromium

echo
echo "== Comprobacion =="
for c in cargo rustc node; do
  if command -v "$c" >/dev/null 2>&1; then
    printf '  %-8s %s\n' "$c" "$($c --version 2>&1 | head -1)"
  else
    printf '  %-8s FALTA\n' "$c"
  fi
done

if ! command -v cargo >/dev/null 2>&1; then
  echo
  echo "Todavia falta Rust, que no viene en dnf. Instalalo con:"
  echo '  curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal'
  echo '  . "$HOME/.cargo/env"'
fi

echo
echo "Listo. Para compilar:"
echo "  cd ~/projects/mimo-academics/escritorio && ./preparar-frontend.sh"
echo "  cd src-tauri && cargo run --release"
