#!/usr/bin/env python3
"""Lanzador de escritorio de Mimo.

QUE HACE
--------
Levanta un servidor local que sirve la carpeta de la aplicacion y abre la app en el navegador
que el usuario ya tiene, EN SU PROPIA VENTANA (sin pestanas ni barra de direcciones), como una
aplicacion. Eso lo hace el "modo aplicacion" de los navegadores Chromium (`--app=`).

Al servirla en `http://127.0.0.1`, el navegador la trata como CONTEXTO SEGURO igual que si fuera
HTTPS: se desbloquean el service worker (offline / instalable) y la lectura de ficheros hermanos.
Con `file://` eso NO funciona (medido: el service worker da "origin 'null' is not supported").

NO es Electron ni Tauri: no lleva ningun navegador dentro ni pesa 150 MB. Usa el que ya hay.

USO
---
    python3 lanzador.py                 abre la app en su ventana (modo aplicacion)
    ./abrir.sh                          lo mismo, para doble clic
    python3 lanzador.py --pestana       si prefieres una pestana normal del navegador
    python3 lanzador.py --simular       muestra el comando que usaria, sin abrir nada
    python3 lanzador.py --no-abrir      solo el servidor (pruebas)
    python3 lanzador.py --puerto 9000

Se cierra con Ctrl+C, o al cerrar la ventana de la app.

POR QUE EL PUERTO ES FIJO
-------------------------
El navegador guarda los datos del usuario POR ORIGEN (esquema + puerto). Si el puerto cambiara
en cada arranque, el origen cambiaria y la app pareceria VACIA. Con el puerto fijo el origen es
siempre `http://127.0.0.1:8734` y sus datos siguen ahi.

Si ya hay una copia de Mimo corriendo, NO se levanta un segundo servidor: se abre otra ventana
apuntando al que ya esta (levantar otro en otro puerto partiria los datos en dos orígenes).
"""
from __future__ import annotations

import argparse
import functools
import http.server
import os
import shutil
import socket
import socketserver
import subprocess
import sys
import threading
import webbrowser

AQUI = os.path.dirname(os.path.abspath(__file__))
PUERTO_FIJO = 8734

# Navegadores basados en Chromium: son los unicos que saben abrir una ventana de aplicacion
# (--app=). Firefox no (solo --kiosk, que es pantalla completa y no es lo mismo).
# Navegadores de la familia Chromium (los UNICOS con modo aplicacion: --app=). No se usa una
# lista como unica via: se combina con el navegador QUE EL SISTEMA DICE que es el del usuario, y con
# globs sobre las carpetas de binarios. Una lista cerrada envejece: "brave-origin" no estaba y por
# eso no se encontraba (fallo real medido con el dueno, que tiene Brave Origin).
NAVEGADORES_APP = ['brave-origin', 'brave-browser', 'brave', 'brave-browser-beta',
                   'brave-browser-nightly', 'chromium', 'chromium-browser', 'google-chrome',
                   'google-chrome-stable', 'microsoft-edge', 'microsoft-edge-stable',
                   'vivaldi', 'vivaldi-stable', 'opera', 'opera-stable']
# Globs: cubren variantes que no estan en la lista sin tener que adivinarlas.
PATRONES_APP = ['brave-*', 'brave', 'chromium-*', 'chromium', 'google-chrome*',
                'microsoft-edge*', 'vivaldi*', 'opera-*', 'opera']
DIRS_BIN = ['/usr/bin', '/usr/local/bin',
            os.path.join(os.path.expanduser('~'), '.local/bin'),
            '/opt/brave.com/brave', '/opt/brave.com', '/opt/google/chrome', '/opt/microsoft/msedge']
# Palabras que delatan a un navegador Chromium (soporta --app=). Se mira el nombre del binario o
# del paquete, no la pantalla.
PALABRAS_CHROMIUM = ('brave', 'chrom', 'chrome', 'edge', 'vivaldi', 'opera')
FLATPAK_APP = ['com.brave.Browser', 'org.chromium.Chromium', 'com.google.Chrome',
               'com.microsoft.Edge', 'com.vivaldi.Vivaldi', 'com.opera.Opera']


class ServidorMimo(http.server.SimpleHTTPRequestHandler):
    """Sirve sin cache (para ver la version recien armada) y sin listar carpetas."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, 'No se listan directorios')
        return None

    def log_message(self, formato, *args):
        pass   # sin ruido en la consola del usuario


def puerto_ocupado(puerto):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', puerto)) == 0


def puerto_libre():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def es_mimo_el_que_escucha(puerto):
    """Dice si lo que hay en el puerto es OTRA copia de Mimo (y no cualquier otra cosa)."""
    import urllib.request
    try:
        with urllib.request.urlopen('http://127.0.0.1:%d/index.html' % puerto, timeout=2) as r:
            return b'Mimo Academics' in r.read(20000)
    except Exception:
        return False


def _es_chromium(nombre):
    n = (nombre or '').lower()
    return any(p in n for p in PALABRAS_CHROMIUM)


def _exe_util(ruta):
    """Es un ejecutable de navegador de verdad (no un driver ni un script de ayuda)."""
    if not (os.path.isfile(ruta) and os.access(ruta, os.X_OK)):
        return False
    base = os.path.basename(ruta).lower()
    if 'driver' in base or base.endswith('-shell') or base.startswith('chromedriver'):
        return False
    return True


def _primer_token_exec(cmd):
    partes = [p for p in cmd.split() if not p.startswith('%')]
    if not partes:
        return None
    base = partes[0]
    return base if base.startswith('/') else (shutil.which(base) or base)


def navegador_del_sistema():
    """El navegador por defecto DEL USUARIO, segun el sistema (no una lista nuestra).

    Es la via UNIVERSAL en Linux: `xdg-settings get default-web-browser` da el fichero .desktop del
    navegador elegido; de ahi se lee su `Exec=` y se saca el ejecutable. Asi no hay que adivinar
    nombres, que es lo que fallaba.
    """
    try:
        salida = subprocess.run(['xdg-settings', 'get', 'default-web-browser'],
                                capture_output=True, text=True, timeout=5)
        desktop = (salida.stdout or '').strip()
    except Exception:
        return None
    if not desktop:
        return None
    bases = ['/usr/share/applications', '/usr/local/share/applications',
             os.path.join(os.path.expanduser('~'), '.local/share/applications'),
             '/var/lib/flatpak/exports/share/applications',
             os.path.join(os.path.expanduser('~'), '.local/share/flatpak/exports/share/applications')]
    for base in bases:
        ruta = os.path.join(base, desktop)
        if not os.path.isfile(ruta):
            continue
        try:
            with open(ruta, encoding='utf-8', errors='ignore') as f:
                for linea in f:
                    if linea.startswith('Exec='):
                        exe = _primer_token_exec(linea[5:].strip())
                        if exe:
                            return exe
        except OSError:
            pass
    return None


def candidatos_navegador():
    """Navegadores Chromium utilizables, como (comando, nombre). El ORDEN es la preferencia.

    Se combinan tres fuentes, de mas a menos fiable: (1) lo que el sistema dice que es tu
    navegador por defecto; (2) una lista de nombres conocidos; (3) globs sobre las carpetas de
    binarios, mas Flatpak y Snap. Asi se cubre tanto lo tipico como lo que no esta en la lista.
    """
    encontrados, vistos = [], set()
    def anade(base, nombre):
        clave = os.path.realpath(base[0]) if base else None
        if base and clave not in vistos:
            vistos.add(clave)
            encontrados.append((base, nombre))

    # (1) El del sistema, si es Chromium (es el que el usuario eligio).
    exe = navegador_del_sistema()
    if exe and _es_chromium(os.path.basename(exe)) and _exe_util(exe):
        anade([exe], '%s (tu navegador por defecto)' % os.path.basename(exe))

    # (2) nombres conocidos en el PATH
    for nombre in NAVEGADORES_APP:
        ruta = shutil.which(nombre)
        if ruta and _exe_util(ruta):
            anade([ruta], os.path.basename(ruta))

    # (3) globs en las carpetas de binarios (cubre variantes sin enumerarlas)
    import glob as _glob
    for d in DIRS_BIN:
        if not os.path.isdir(d):
            continue
        for patron in PATRONES_APP:
            for ruta in sorted(_glob.glob(os.path.join(d, patron))):
                if _exe_util(ruta):
                    anade([ruta], ruta)

    # (4) Flatpak y Snap: no dejan el binario en el PATH.
    bases = ['/var/lib/flatpak/exports/bin',
             os.path.join(os.path.expanduser('~'), '.local/share/flatpak/exports/bin')]
    for appid in FLATPAK_APP:
        for base in bases:
            lanzador = os.path.join(base, appid)
            if os.path.isfile(lanzador) and os.access(lanzador, os.X_OK):
                anade([lanzador], appid + ' (flatpak)')
    for nombre in ('brave', 'chromium', 'google-chrome'):
        ruta = os.path.join('/snap/bin', nombre)
        if os.path.isfile(ruta):
            anade([ruta], nombre + ' (snap)')
    return encontrados


def detectar_navegador():
    """El primer navegador Chromium utilizable, como (comando, nombre); (None, None) si no hay."""
    c = candidatos_navegador()
    return c[0] if c else (None, None)


def encontrar_proyecto(ruta):
    """Acepta la carpeta de la app (con index.html) o una que lo tenga en `mimo/`."""
    madre = os.path.dirname(ruta)
    for candidata in (ruta, os.path.join(ruta, 'mimo'), madre):
        if os.path.isfile(os.path.join(candidata, 'index.html')):
            return os.path.abspath(candidata)
    sys.exit('No encuentro index.html en:\n  %s\n  %s' %
             (ruta, os.path.join(ruta, 'mimo')))


def carpeta_datos():
    """Carpeta propia de Mimo para el perfil del navegador (datos separados de tu navegacion).

    Se usa un perfil PROPIO y no el del navegador del usuario por dos razones: los datos de
    Mimo quedan aislados de su navegacion normal, y el navegador arranca como instancia nueva
    (sin "entregar" la ventana a un navegador ya abierto), lo que permite atar el servidor a la
    vida de esa ventana: al cerrarla, el servidor se apaga solo.
    """
    base = os.environ.get('XDG_DATA_HOME') or os.path.join(os.path.expanduser('~'), '.local', 'share')
    return os.path.join(base, 'mimo')


def comando_app(base, url, perfil):
    # Los flags van DESPUES del comando base: para Flatpak, primero va el lanzador y los flags
    # tienen que ir despues del nombre del paquete, no antes.
    cmd = list(base) + ['--app=' + url, '--class=Mimo', '--window-size=1280,900',
                        '--no-first-run', '--no-default-browser-check']
    if perfil:
        cmd.append('--user-data-dir=' + perfil)
    return cmd


def main():
    ap = argparse.ArgumentParser()
    # La aplicacion vive en la RAIZ del repositorio y este lanzador en `herramientas/`:
    # por defecto se apunta a la raiz (la carpeta madre de este fichero), no a la propia.
    raiz_repo = os.path.dirname(AQUI)
    ap.add_argument('--proyecto', default=raiz_repo,
                    help='carpeta de la aplicacion (con index.html)')
    ap.add_argument('--puerto', type=int, default=PUERTO_FIJO)
    ap.add_argument('--pestana', action='store_true', help='abrir en una pestana normal')
    ap.add_argument('--reparar', action='store_true',
                    help='abrir la pagina de reparacion (borra la copia vieja que el navegador '
                         'guarda y entra limpio). Usalo si la app se sigue viendo como antes')
    ap.add_argument('--limpio', action='store_true',
                    help='empezar de cero: borra el perfil del navegador de Mimo (cache y service '
                         'worker incluidos). Usalo si la app se ve vieja o si se queda una ventana '
                         'abierta que no deja abrir la nueva')
    ap.add_argument('--perfil-navegador', action='store_true',
                    help='usar el perfil de tu navegador (mismos datos que abriendola ahi) en vez '
                         'del perfil propio de Mimo (limpio y aislado, sin tus datos de navegacion)')
    ap.add_argument('--navegador', default=None,
                    help='ruta exacta del navegador a usar (si la deteccion no acierta)')
    ap.add_argument('--simular', action='store_true', help='mostrar el comando y salir')
    ap.add_argument('--no-abrir', action='store_true', help='no abrir el navegador')
    a = ap.parse_args()

    raiz = encontrar_proyecto(os.path.abspath(a.proyecto))
    puerto = a.puerto
    # --reparar abre la pagina que limpia la copia vieja del navegador y luego entra sola.
    # `fix.html` se mudo con este lanzador a `herramientas/`: se sirve desde su ruta,
    # no desde la raiz del proyecto (donde ya no esta).
    pagina = ('herramientas/fix.html' if a.reparar else 'index.html')
    url = 'http://127.0.0.1:%d/%s' % (puerto, pagina)

    # Si ya hay una copia de Mimo corriendo en el puerto fijo, NO se levanta otro servidor: se
    # abre otra ventana contra el que ya esta. Levantar un segundo servidor en otro puerto seria
    # otro ORIGEN, y la app pareceria vacia (los datos no son los mismos).
    if puerto_ocupado(puerto) and es_mimo_el_que_escucha(puerto):
        print('Mimo ya esta abierto; se abre otra ventana.')
        abrir_ventana(url, a.pestana, a.simular, a.perfil_navegador, a.navegador)
        return

    if puerto_ocupado(puerto):
        print('AVISO: el puerto %d esta ocupado por otra cosa. Se usara otro; los datos guardados' % puerto)
        print('       en el puerto anterior no se veran aqui.')
        puerto = puerto_libre()
        url = 'http://127.0.0.1:%d/index.html' % puerto

    if a.limpio and not a.perfil_navegador:
        # Borra la sesion del navegador de Mimo: se lleva la cache y el service worker, que son los
        # que dejaban la app clavada en una version vieja. NO toca los datos del usuario (esos
        # viven en la carpeta de respaldo y en el propio navegador por origen, no aqui).
        perfil = carpeta_datos()
        try:
            shutil.rmtree(perfil)
            print('Empezando de cero: borrada la sesion del navegador de Mimo.')
        except FileNotFoundError:
            pass
        except OSError as e:
            print('AVISO: no pude borrar la sesion (%s).' % e)
            print('       Cierra TODAS las ventanas de Mimo y vuelve a intentarlo.')

    manejador = functools.partial(ServidorMimo, directory=raiz)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(('127.0.0.1', puerto), manejador)

    print('Mimo Academics')
    print('  sirviendo : %s' % raiz)
    print('  abriendo  : http://127.0.0.1:%d' % puerto)
    print('  (cierra la ventana de Mimo para salir, o Ctrl+C)')
    sys.stdout.flush()

    if a.no_abrir:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\ncerrado')
        return

    proceso = abrir_ventana(url, a.pestana, a.simular, a.perfil_navegador, a.navegador)
    if a.simular:
        return   # --simular solo muestra el comando; no se queda sirviendo
    if proceso is None:
        # Sin navegador Chromium (o modo pestana): se sirve y se deja abierto hasta Ctrl+C.
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\ncerrado')
        return

    # Con ventana propia: el servidor vive lo que viva la ventana. Al cerrarla, se apaga solo.
    hilo = threading.Thread(target=httpd.serve_forever, daemon=True)
    hilo.start()
    try:
        proceso.wait()
    except KeyboardInterrupt:
        pass
    httpd.shutdown()
    print('\ncerrado')


def abrir_ventana(url, pestana=False, simular=False, perfil_navegador=False, forzar=None):
    """Abre la app en su propia ventana (modo aplicacion). Devuelve el proceso, o None.

    Dice en voz alta QUE navegador encontro y como va a abrir: sin esto, si no encuentra un
    navegador de la familia Chromium (Firefox no vale), cae a abrir una pestana normal y el usuario
    no sabe por que no ve la ventana de aplicacion."""
    if pestana:
        base, nombre = None, None
    elif forzar:
        base, nombre = [forzar], forzar
    else:
        base, nombre = detectar_navegador()
    if not base:
        print('  navegador : NO encontre un navegador de la familia Chromium')
        print('              (se mira el PATH, las rutas tipicas, Flatpak y Snap).')
        print('              Se abrira en tu navegador de siempre, en una pestana normal.')
        print('              Firefox no tiene modo aplicacion: no puede abrir ventana propia.')
        print('              Para tener ventana propia, instala uno (Fedora):')
        print('                  sudo dnf install chromium')
        print('              o si usas Brave por Flatpak:  flatpak install flathub com.brave.Browser')
        if simular:
            return None
        webbrowser.open(url)
        return None
    print('  navegador : %s (se abre en ventana propia, modo aplicacion)' % nombre)
    # Aviso honesto: algunos Chromium (Brave) traen DESACTIVADA la API de carpetas, y con ella la
    # "copia automatica en una carpeta" no puede funcionar. Chromium de fabrica SI la trae. La app
    # ahora lo dice dentro de Ajustes; aqui se anticipa para que no sorprenda.
    if 'brave' in nombre.lower():
        print('  OJO       : Brave trae desactivada la API de carpetas, asi que la "copia automatica')
        print('              en una carpeta" no funcionara (la app lo explicara en Ajustes).')
        # Si hay otro Chromium sin esa limitacion, se dice la ruta exacta para usarlo.
        alterno = next((b[0] for b, n in candidatos_navegador()
                        if 'brave' not in n.lower() and not n.endswith('(flatpak)')), None)
        if alterno:
            print('              Para tenerla, abre con:  ./abrir.sh --navegador %s' % alterno)
        else:
            print('              Para tenerla, instala chromium:  sudo dnf install chromium')
    # Flatpak y Snap encierran al navegador en una "caja": una carpeta de perfil propia puede no
    # ser accesible desde dentro. Ahi se usa SU perfil, que es lo que la caja si permite. Se
    # pierde el aislamiento y el cierre automatico del servidor, pero ABRE, que es lo primero.
    es_encajado = nombre.endswith('(flatpak)') or nombre.endswith('(snap)')
    if es_encajado:
        print('              (Flatpak/Snap: se usa tu perfil del navegador, no uno aparte)')
    perfil = None if (perfil_navegador or es_encajado) else carpeta_datos()
    if perfil:
        print('  sesion    : %s' % perfil)
        print('              (si ya tienes una ventana de Mimo abierta, la nueva orden va a ESA;')
        print('               cierrala entera o usa --limpio)')
    else:
        print('  sesion    : la de tu navegador (mismos datos que abriendola ahi)')
    cmd = comando_app(base, url, perfil)
    if simular:
        print('  comando   : ' + ' '.join(cmd))
        return None
    if perfil:
        os.makedirs(perfil, exist_ok=True)
    return subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
