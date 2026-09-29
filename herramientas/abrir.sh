#!/bin/sh
# Abre Mimo Academics en el navegador. Doble clic en este fichero (o ./abrir.sh).
#
# No necesita instalar nada: usa el Python y el navegador que ya tienes.
# Se ubica solo, asi que la carpeta de Mimo se puede mover o renombrar.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 lanzador.py "$@"
else
  echo "No encuentro python3. Instalalo y vuelve a intentarlo."
  exit 1
fi
