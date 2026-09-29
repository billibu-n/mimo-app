#!/bin/sh
# Diagnostico del lanzador de Mimo Academics.
#
# Explica que navegador encuentra el lanzador y por que, sin adivinar. Ejecutalo si la app no se
# abre en ventana propia y pega la salida completa:
#
#     ./diagnostico.sh
#
# No cambia nada: solo informa.

cd "$(dirname "$0")" || exit 1
echo "Diagnostico de Mimo Academics"
echo "============================="
echo
echo "sistema   : $(uname -sr)"
echo "python    : $(command -v python3 || echo NO ENCONTRADO)"
echo "xdg-utils : $(command -v xdg-settings || echo 'NO ENCONTRADO (es lo que lee tu navegador por defecto)')"
echo
echo "1) Navegador por defecto del sistema (xdg-settings):"
if command -v xdg-settings >/dev/null 2>&1; then
  xdg-settings get default-web-browser 2>&1 | sed 's/^/   /'
else
  echo "   (no esta xdg-settings; en Fedora: sudo dnf install xdg-utils)"
fi
echo
echo "2) Binarios de navegador que el lanzador encuentra (en orden):"
python3 - <<'PY'
import sys, os
sys.path.insert(0, os.getcwd())
try:
    import lanzador
except Exception as e:
    print('   ERROR al cargar lanzador.py:', e)
    sys.exit(0)
cands = lanzador.candidatos_navegador()
if not cands:
    print('   NINGUNO. El sistema dice que tu navegador es:')
    print('     ', lanzador.navegador_del_sistema() or '(nada)')
    print('   Si tu navegador es Chromium/Brave/Chrome/Edge/Vivaldi/Opera, dime su ruta y lo cubro.')
else:
    for base, nombre in cands:
        print('   - %s' % nombre)
    print('   -> el lanzador usaria: %s' % cands[0][1])
PY
echo
echo "3) Ficheros .desktop de navegadores instalados (para ver rutas exactas):"
for d in /usr/share/applications "$HOME/.local/share/applications" /var/lib/flatpak/exports/share/applications "$HOME/.local/share/flatpak/exports/share/applications"; do
  [ -d "$d" ] || continue
  grep -l -i -E 'brave|chrom|chrome|edge|vivaldi|opera' "$d"/*.desktop 2>/dev/null | while read -r f; do
    printf '   %s -> ' "$f"
    grep -m1 '^Exec=' "$f" | cut -d= -f2-
  done
done
echo
echo "Pega TODA esta salida si el lanzador sigue sin abrir en ventana propia."
