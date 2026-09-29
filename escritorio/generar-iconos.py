#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera los iconos que Tauri necesita, a partir del logo REAL de Mimo.

Por que hace falta un script y no basta con copiar el PNG:
  1. Tauri EXIGE PNG con canal alfa de verdad (RGBA, colorType 6). El `iconos/icon-512.png`
     de la app usa PALETA (colorType 3): tiene transparencia, pero Tauri lo rechaza con
     "icon ... is not RGBA" y **no compila**.
  2. Tauri pide varios tamanos y con nombres fijos.
  3. Hay que reducirlos con calidad: un icono de 32 px no puede ser el de 512 encogido a lo bruto.

Uso:
    python3 ~/projects/mimo-academics/escritorio/generar-iconos.py
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Falta Pillow. Instalalo con:  python3 -m pip install --user Pillow')

AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, '..', 'iconos', 'icon-512.png')
DESTINO = os.path.join(AQUI, 'src-tauri', 'icons')

# Los que pide la configuracion de Tauri y los que usan los instaladores.
TAMANOS = [
    ('32x32.png', 32),
    ('128x128.png', 128),
    ('128x128@2x.png', 256),
    ('icon.png', 512),
    # Windows pide un .ico. Se genera aqui para no dejarlo para el final.
    ('icon.ico', 256),
]


def main():
    if not os.path.isfile(ORIGEN):
        sys.exit('No encuentro el logo de origen: %s' % ORIGEN)
    os.makedirs(DESTINO, exist_ok=True)

    base = Image.open(ORIGEN).convert('RGBA')
    print('origen: %s (%dx%d, modo %s -> RGBA)'
          % (os.path.basename(ORIGEN), base.size[0], base.size[1],
             Image.open(ORIGEN).mode))

    for nombre, lado in TAMANOS:
        # LANCZOS es el remuestreo bueno para reducir; con el de por defecto salen dientes.
        img = base.resize((lado, lado), Image.LANCZOS)
        ruta = os.path.join(DESTINO, nombre)
        if nombre.endswith('.ico'):
            # ICO guarda varios tamanos dentro; Windows elige el que necesita.
            img.save(ruta, format='ICO', sizes=[(16, 16), (32, 32), (48, 48),
                                                (64, 64), (128, 128), (256, 256)])
        else:
            img.save(ruta, format='PNG')
        print('  %-16s %dx%d' % (nombre, lado, lado))

    # Comprobacion: que TODOS tengan alfa de verdad. Es la causa de que Tauri no compile.
    print('\ncomprobacion (Tauri exige RGBA, colorType 6, o no compila):')
    import struct
    for nombre, lado in TAMANOS:
        ruta = os.path.join(DESTINO, nombre)
        if nombre.endswith('.png'):
            d = open(ruta, 'rb').read()
            tipo = d[25]
            print('  %-16s colorType=%d %s' % (nombre, tipo, 'OK' if tipo == 6 else 'MAL'))
    print('\niconos en %s' % DESTINO)
    print('Nota: para .icns (macOS) hace falta un Mac o `cargo tauri icon`.')


if __name__ == '__main__':
    main()
