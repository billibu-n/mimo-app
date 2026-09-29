# Cómo contribuir a Mimo

Gracias por el interés. Mimo nace como una herramienta para estudiantes y **la ayuda es
bienvenida**: reportar fallos, proponer ideas, traducir, escribir documentación o mandar
código.

Antes de nada: este proyecto lo mantiene una persona, así que la respuesta puede tardar.
Ten paciencia y no dupliques un reporte: si ya existe, súmate a la conversación.

## Por dónde empezar

- **¿Encontraste un fallo?** Abre un *issue* con la plantilla de errores. Si puedes,
  incluye qué esperabas, qué pasó y cómo reproducirlo.
- **¿Tienes una idea?** Abre un *issue* con la plantilla de propuestas (o usa
  *Discussions*, si está disponible). Cuenta **qué problema resuelve**, no solo cómo
  debería verse.
- **¿Quieres escribir código?** Mira los issues abiertos. Si es un cambio grande,
  comenta primero en un issue para no trabajar en vano.

## Lo más importante de esta página: cómo está armado el proyecto

Mimo se publica como **una sola página**: `index.html`. Esa página **no se edita a mano**:
se **ensambla** a partir de las piezas de `html/` (una por pestaña) y de los scripts de
`js/`, en el orden que dicta `js/orden.txt`.

El programa que hace ese ensamblado **no es público** (vive aparte, en el entorno del
autor). Esto tiene una consecuencia práctica que conviene saber **antes** de empezar, para
no perder la mañana:

| Si tu cambio toca… | Qué se necesita |
|---|---|
| `css/`, `js/`, `sonido/`, `vendor/` | Nada especial: la app carga esos ficheros por rutas relativas. Basta recargar. |
| `html/*.html` (estructura de una pestaña) | Tu cambio **no se verá** hasta que el autor reensamble `index.html`. Abre el PR igualmente y **dilo en el mensaje** ("este PR necesita reensamblado"). |
| `index.html` directamente | No hagas eso: al próximo reensamblado tu edición se pierde. Edita las fuentes. |
| `js/orden.txt` | Igual que `html/`: es un índice autoritativo. Un fichero `.js` que no esté listado **no entra** en la app. |

Si dudas de si tu cambio cae en la columna "necesita reensamblado", pregúntalo en el issue
antes de escribir código.

## Cómo se prueba (y qué nos sirve de ti)

- Hay **dos formas** de abrirla, y no son lo mismo:
  - **la aplicación instalada** (lo que usa la gente): se instala desde `escritorio/` y aparece en
    el menú de aplicaciones. Es la que hay que cuidar;
  - **`index.html` con doble clic**, o con `./abrir.sh`, que sirve para probar cambios de CSS y de
    JS sin compilar nada. Con eso basta para la mayoría de los retoques.
- Ojo: la aplicación de escritorio **empaqueta su propia copia** de la web (`escritorio/app/`, que
  se genera con `escritorio/preparar-frontend.sh`). Si cambias `js/` o `css/`, para verlo en la
  aplicación de escritorio hay que **volver a preparar el frontend** (y no hace falta recompilar el
  caparazón de Rust).
- Prueba en **más de un tema de color** (hay 9) y en **más de un tamaño de ventana**. Mimo
  se usa en computadores modestos y en pantallas pequeñas.
- Cuéntanos **cómo comprobaste** el cambio. "Lo probé y se ve bien" no permite revisarlo;
  "abrí Ajustes, cambié a tema oscuro, el número quedaba cortado" sí.

## Cómo mandar un cambio (pull request)

1. Haz un *fork* (o una rama, si tienes permiso).
2. Un PR = **una cosa**. Es más fácil de revisar y de explicar.
3. En el mensaje, di **qué cambia y por qué**, y cómo lo probaste.
4. Si el cambio toca `html/`, avísalo (ver la tabla de arriba).
5. No subas capturas con tus datos personales ni con tu malla curricular real: Mimo guarda
   datos de estudio y eso es tuyo.

## Estilo del proyecto

- **El código y los comentarios, en español, con tildes.** El proyecto entero está en
  español (los textos de la interfaz también).
- Los comentarios explican **el por qué**, no el qué. El código ya dice qué hace; lo que
  hace falta saber es por qué se hizo así (una decisión, una trampa del navegador, un
  caso raro que rompió algo).
- Nada de dependencias ni de *builds*: Mimo no usa frameworks a propósito. Es HTML, CSS y
  JavaScript que se abren con doble clic. Ahí está buena parte de su valor: funciona sin
  internet y sin instalar nada.
- Cuida **los datos del alumno**: no los envíes a ningún servidor. Todo se guarda en su
  navegador.

## Licencia de tu aporte

Al mandar un cambio aceptas que se publique bajo la licencia del proyecto (ver `LICENSE`).

Y si algo de esto te resultó confuso, dilo también: la documentación de Mimo se mejora
igual que el código.
