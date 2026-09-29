# Mimo Academics

![Versión](https://img.shields.io/badge/versión-1.0.0-16a34a)
![Plataforma](https://img.shields.io/badge/escritorio-Linux%20%7C%20Windows-2563eb)
![Licencia](https://img.shields.io/badge/licencia-MIT-3da639)

**Panel de semestre universitario que funciona sin conexion.** Reune la malla de ramos, el
calendario, las notas, el estudio y el tiempo en una sola aplicacion, y **no manda tus datos a
ningun sitio**: se quedan en tu equipo.

## Instalacion

Elige tu sistema. En todos los casos, **tus datos se guardan en tu equipo** y puedes llevarlos
contigo con el respaldo de **Ajustes**.

### Linux

La version de escritorio esta probada en **Fedora** (y sirve en cualquier distribucion con
WebKitGTK 4.1: Debian, Ubuntu, Arch, openSUSE...). Descarga el instalable desde
**[Releases](https://github.com/billibu-n/mimo-app/releases)** y:

```bash
# Fedora, openSUSE y derivados (.rpm)
sudo dnf install 'Mimo Academics-1.0.0-1.x86_64.rpm'

# Debian, Ubuntu y derivados (.deb)
sudo apt install './Mimo Academics_1.0.0_amd64.deb'
```

> **Ojo**: el nombre del fichero **lleva un espacio**, por eso va entre comillas.

Despues, en el menu de aplicaciones busca **Mimo Academics** (aparece en *Educacion*). Si no lo ves
al momento, cierra sesion y vuelve a entrar: el menu se guarda en cache.

Tambien hay un **AppImage**, que no necesita instalacion: se le dan permisos de ejecucion y se abre.

### Windows

Descarga el instalador `.exe` desde
**[Releases](https://github.com/billibu-n/mimo-app/releases)** y ejecutalo.

> Windows avisara de que es de un "editor desconocido" (SmartScreen) porque el instalador **no
> esta firmado digitalmente**: firmarlo cuesta dinero al ano. Para continuar: *Mas informacion*
> -> *Ejecutar de todas formas*.

> El instalador de Windows **todavia no esta publicado**: se compila en Windows. Si te manejas,
> en `escritorio/` estan las instrucciones.

### macOS

Pendiente. Compilar para macOS necesita un Mac; desde Linux no es posible. Anunciado aqui cuando
este.

### Android, iPhone y tablet

Pendiente, y es lo ultimo de la lista **a proposito**: la interfaz actual esta pensada para
pantalla grande y necesita un rediseno antes de caber en un telefono. Una tablet es lo mismo que
un telefono: corre Android o iOS.

### Desde el codigo (para desarrollo)

```bash
cd escritorio && ./preparar-frontend.sh
cd src-tauri && cargo run --release
```

Esto **no instala nada**: abre la aplicacion en una ventana, para probar cambios. El detalle esta
en [`escritorio/INSTALAR.md`](escritorio/INSTALAR.md).

## Como se usa

1. Abre **Mimo Academics** desde el menu de aplicaciones.
2. La primera vez te pedira elegir una **carpeta para las copias de seguridad** (por ejemplo,
   dentro de *Documentos*). Ahi se guarda tu progreso, con tres copias que rotan solas: asi **no
   se pierde aunque desinstales la aplicacion**.
3. Si venias de una version anterior, Mimo **recupera tus datos sola** al abrirla y te lo avisa.

En **Ajustes** tienes ademas *Descargar mis datos*, que genera un `.json` que puedes guardar donde
quieras y volver a cargar en cualquier equipo.

## Que trae

- **Malla curricular**: importa tu malla desde PDF o editala a mano, con simulador de ramos.
- **Notas**: calcula promedios y escenarios por ramo y por semestre.
- **Calendario**: vistas Mes / Ano / Semestre; eventos academicos y personales.
- **Tareas** y **Estudio**: pendientes y bloques de tiempo con temporizador y alarma.
- **Tiempo**: temporizador de estudio con alarma.
- **Ajustes**: 9 temas de color, la carpeta de respaldo y las actualizaciones.

## Estado del proyecto

Esta **en construccion**: hay herramientas incompletas y detalles visuales por pulir. Se usa a
diario, pero conviene **hacer copias de seguridad** y no confiarle todavia lo unico importante.

El proyecto se ha construido con ayuda de herramientas de IA, dado su tamano y mi poca experiencia
previa en desarrollo de aplicaciones; ha sido tambien una forma de pasar de la teoria a algo util.

## Contribuir

Las ideas, los reportes de errores y los cambios de codigo son bienvenidos: Mimo se hizo para
estudiantes y mejora mas rapido con mas gente mirandolo.

- ¿Encontraste algo roto? Abre un *issue* (hay plantillas para errores, propuestas y preguntas).
- ¿Tienes una duda de uso o una idea? Pasa por [Discussions](https://github.com/billibu-n/mimo-app/discussions).
- ¿Vas a tocar codigo? **Lee antes [`CONTRIBUTING.md`](CONTRIBUTING.md)**: explica como esta armado
  el proyecto y que cambios necesitan reensamblado.

Lo mas util ahora mismo: instalarla y contar **que se rompe o que estorba**. Ese aviso vale tanto
como un parche.

## Estructura

```
escritorio/     la aplicacion de escritorio (Tauri): ventana propia e instalables
index.html      la aplicacion web (se arma a partir de html/ + js/; no se edita a mano)
css/            estilos: estructura (general.css) y temas de color (tema-*.css)
js/             el codigo, por secciones (ver js/orden.txt para el orden de carga)
html/           una pieza por pestana
iconos/         los iconos y el sprite de la interfaz
sonido/         alarma del temporizador
vendor/         motor de lectura de PDF (pdf.js)
plantilla.html  armazon de la pagina (cabecera, barra lateral, modales)
version.json    numero de version, para el boton de actualizacion (lo escribe el armador)
```

## Licencia

[MIT](LICENSE): puedes usar, copiar, modificar y redistribuir Mimo, tambien con fines
comerciales, siempre que conserves el aviso de copyright. Se entrega **sin garantia**: revisalo
antes de confiarle tus notas.

## Version

1.0.0 — el detalle de cada version esta en [`CHANGELOG.md`](CHANGELOG.md).

## Creditos

Mimo usa trabajo de otros, y se nombra aqui. Las licencias completas, con los textos que hay que
conservar, estan en **[CREDITOS.md](CREDITOS.md)**.

- **Iconos** de la interfaz: [Lucide](https://lucide.dev) (licencia ISC; 147 de ellos derivan
  ademas de **Feather**, con licencia MIT).
- **Lector de PDF**: [pdf.js](https://mozilla.github.io/pdf.js/), de Mozilla Foundation
  (Apache 2.0, incluido en `vendor/`).
- **Aplicacion de escritorio**: [Tauri](https://v2.tauri.app/), de Tauri Programmes Ltd
  (MIT o Apache 2.0).
- **Herramientas de IA** que han asistido en el desarrollo: **DeepSeek** y **OpenHands**.
  El diseno, las decisiones y el contenido son de **Billibu**.
