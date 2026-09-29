# Historial de cambios

Este documento cuenta **qué cambió**, en palabras. Las descargas están en
[Releases](https://github.com/billibu-n/Mimo-Academics/releases), y dentro de la app
**Ajustes → Actualización → Buscar actualización** avisa si hay una versión más nueva.

El formato sigue, con holgura, [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/);
las versiones empiezan en la 1.0.2. La 1.0.0 es el primer lanzamiento oficial, con
version de escritorio.

## [1.0.0] — 2026-09-29

Primer lanzamiento **oficial**, y el primero con **aplicacion de escritorio**. La version salta
a `1.0.0` porque el programa ya se usa y su contenido es estable; lo que se anade es **otra
forma de abrirlo**, no otra aplicacion.

### Anadido

- **Version de escritorio (Tauri).** Mimo se abre ahora en su **propia ventana**, sin depender
  del navegador: icono propio, ventana propia e instalable para Linux (`.rpm`, `.deb`,
  `AppImage`). El `index.html` que se abre es **el mismo** que el del navegador.
- **La version, escrita en un solo sitio.** El armador la propaga a la aplicacion, al
  `version.json` y al proyecto de escritorio. Antes la version de escritorio estaba declarada
  aparte y podia desincronizarse.

- **Instalables de Linux** (`.rpm`, `.deb` y `AppImage`). Al instalarlos, Mimo aparece en el
  **menu de aplicaciones** dentro de *Educacion*, con su icono y su descripcion; ya no hace falta
  abrirlo desde una terminal.
- **Los datos no se pierden al desinstalar**: el respaldo vive en la carpeta que elijas, fuera de
  la aplicacion.

- **Creditos y licencias de terceros**, en [`CREDITOS.md`](CREDITOS.md): los iconos son de
  **Lucide** (ISC, y 147 derivados de **Feather**, MIT) y el lector de PDF de **Mozilla** (Apache
  2.0). Antes no estaban declarados.

### Corregido

- **La carpeta de guardado funciona tambien en la aplicacion de escritorio.** Antes dependia de
  una funcion del navegador que Brave no trae; en la version de escritorio la pide el sistema, y
  funciona igual en Linux, Windows y macOS.
- **Los datos no se pierden al cambiar de aplicacion.** El progreso se guarda por origen, y el de
  la version de escritorio es distinto del del lanzador: al abrirla por primera vez, Mimo
  **recupera sola** los datos de la version anterior y lo avisa.
- **Los iconos, en su carpeta** (`iconos/`), con todas las rutas actualizadas. Y la copia sin
  conexion ya no se queda sin iconos: la lista de la cache los **descubre** en vez de tenerlos
  enumerados.
- **El aviso de la carpeta de respaldo dice que hacer.** Antes, si el navegador no permitia
  elegirla, el mensaje no explicaba por que ni como seguir.

## [1.0.6] — 2026-09-28

### Corregido

- **El aviso de guardado ya no miente.** Antes, si el navegador no podía guardar (almacenamiento
  lleno o modo privado), la aplicación seguía diciendo «Guardado aquí» y los cambios se perdían
  al cerrar sin avisar. Ahora lo comprueba y avisa en vez de fingir que guardó.
- Tildes y ortografía en el texto de la aplicación y en la documentación.
- Las referencias al repositorio antiguo apuntan al actual, y la fuente de la página
  (`plantilla.html`) vuelve a coincidir con lo publicado: los iconos ya no se romperían al
  rearmar.

### Nota

- Esta versión abre el trabajo de **normalización de los textos** (llevarlos a un único sitio,
  para poder traducir la aplicación más adelante) y de **mejora de la sincronización**. Esos
  trabajos van por fases y no están cerrados todavía.

## [1.0.5] — 2026-09-27

### Añadido

- **Tema Pinky**: rosas claros (fondo blanco, superficies rosadas, acento frambuesa
  `#b5226b`). Es el tema claro con carácter. No confundir con Vino, que es oscuro.
  Mismos colores que el `pinky` del kit `norma-web`.

### Corregido

- El número de versión estaba escrito a mano en varios ficheros y podía quedar
  desincronizado: el título de la pestaña o el semáforo de actualización podían anunciar
  una versión vieja sin que nada avisara. Ahora la versión se declara una sola vez al
  construir la aplicación, y una prueba falla si vuelve a aparecer escrita a mano.
- La marca estaba mal escrita en inglés: el título de la pestaña y la cabecera decían
  «Mimo Achademics». Ahora dicen «Mimo Academics».

## [1.0.4] — 2026-09-25

### Añadido

- **Calendario comercial**, sin necesidad de tener un semestre creado: vistas Mes / Año /
  Semestre, con navegación y un botón de salto rápido (Este mes / Este año / Esta semana).
  La vista de año muestra los 12 meses completos.
- **Eventos personales**: cumpleaños, citas, trámites o cualquier cosa que no pertenezca a
  un semestre. Se guardan por fecha y conviven con los eventos académicos.
- **El semestre se pinta encima del calendario**: con un semestre activo, marca las semanas
  de clase (con su número), los recesos y los exámenes, tanto en mes como en año.
- **Vínculo bidireccional con Evaluaciones**: cambiar la fecha de un evento de un ramo se
  refleja en su evaluación, y al revés.
- **Pestañas Tareas y Estudio**, con temporizador y alarma.

### Cambios

- El calendario ya no se encoge al alternar de vista: Mes y Año ocupan el mismo ancho fijo
  (se corrigió un error de centrado que las dejaba a la mitad).
- La etiqueta del botón de navegación se adapta a la vista activa.

### Corregido

- En Ajustes, el grupo "Semestre" (lista de semestres y metas por ramo) salía cortado: ahora
  se ve completo.
- Al crear un evento en una instalación recién hecha, el evento no se dibujaba porque su
  tipo quedaba sin registrar.

### Publicación

- La entrega se limita a **la aplicación** (código y recursos). El repositorio público no
  incluye los documentos de trabajo internos.

## [1.0.2] — 2026-09-20

Primera versión pública.

- Panel de semestre: malla curricular (importación desde PDF o edición a mano) con
  simulador de ramos, notas por ramo y por semestre, calendario, tareas y estudio.
- 8 temas de color, barra lateral extraíble, avisos.
- Comprobación de actualizaciones desde **Ajustes → Actualización**.
- Los datos del alumno se guardan en su propio navegador; respaldo e importación en JSON
  desde **Ajustes → Mis datos**.
