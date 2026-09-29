#!/bin/sh
# Prepara el frontend que consume Tauri: copia a `app/` SOLO lo que la aplicacion necesita.
#
# Por que copiar y no apuntar Tauri a la raiz del repositorio: si `frontendDist` fuera la raiz,
# Tauri empaquetaria TAMBIEN `.git`, `_trabajo/` y `escritorio/` dentro del binario. Aqui se copia
# con LISTA BLANCA, igual que hace `mimo_config/construir/empaquetar.py` para el .zip.
#
# `app/` es GENERADO: no se edita a mano y esta en .gitignore. La fuente de verdad sigue siendo
# la raiz del repositorio (una sola), y este script no inventa nada: solo copia.
#
# FALLA EN VOZ ALTA si la app no esta donde se espera. Antes solo AVISABA y seguia, y eso dejo
# pasar una compilacion con el frontend a medias (medido: "archivos: 1" y el build "termino bien").

set -e
AQUI=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$AQUI/.." && pwd)
DESTINO="$AQUI/app"

ARCHIVOS="index.html version.json manifest.json sw.js"
CARPETAS="css html js sonido vendor iconos"
# Sin estos no es la aplicacion: si falta uno, se para. No se sigue con un frontend a medias.
IMPRESCINDIBLES="index.html"

echo "origen : $REPO"
echo "destino: $DESTINO"

for f in $IMPRESCINDIBLES; do
  if [ ! -f "$REPO/$f" ]; then
    echo
    echo "ALTO: no encuentro $f en $REPO"
    echo "Eso significa que $REPO no es la carpeta de la aplicacion."
    echo "Este script vive en <app>/escritorio/ y espera la app en <app>/."
    exit 1
  fi
done

rm -rf "$DESTINO"
mkdir -p "$DESTINO"

for f in $ARCHIVOS; do
  if [ -f "$REPO/$f" ]; then
    cp "$REPO/$f" "$DESTINO/$f"
  else
    echo "AVISO: falta $f en la raiz (¿rearmaste con el armador?)"
  fi
done

for c in $CARPETAS; do
  if [ -d "$REPO/$c" ]; then
    cp -r "$REPO/$c" "$DESTINO/$c"
  else
    echo "AVISO: falta la carpeta $c"
  fi
done

N=$(find "$DESTINO" -type f | wc -l)
echo "frontend listo: $N archivos"

# Una app de Mimo son decenas de archivos (js, css, html, vendor, sonido...). Si salen muy pocos,
# el frontend esta a medias y el binario saldria roto o en blanco: mejor parar aqui.
if [ "$N" -lt 40 ]; then
  echo
  echo "ALTO: solo $N archivos. El frontend esta INCOMPLETO."
  echo "Mira que $REPO sea la carpeta de la aplicacion (con css/, js/, html/, vendor/...)."
  exit 1
fi
