#!/bin/sh
# Atajo: abre la aplicacion web (Mimo) en el navegador.
#
# Este fichero se queda en la raiz a proposito: es la via mas comoda para probar un cambio, y
# mucha gente y muchos documentos escriben `./abrir.sh` desde aqui. El lanzador de verdad vive
# en `herramientas/`, junto con el resto de herramientas de escritorio.
exec "$(dirname "$0")/herramientas/abrir.sh" "$@"
