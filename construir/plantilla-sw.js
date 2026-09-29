/* Service worker de Mimo Academics.

   QUE HACE
   Guarda la aplicacion en la cache del navegador para que funcione SIN INTERNET y para que el
   navegador la pueda INSTALAR (PWA).

   ESTE FICHERO NO SE EDITA A MANO. Es la salida de `plantilla-sw.js`: lo escribe el armador
   (mimo_config/construir/index.py), que sustituye __VERSION__ por la version, __HUELLA__ por un
   sello del contenido y __LISTA__ por la lista COMPLETA de archivos.

   DOS REGLAS QUE IMPORTAN (las dos costaron un fallo real)
   -------------------------------------------------------
   1) EL HTML VA "RED PRIMERO", NO "CACHE PRIMERO". El index.html es el unico archivo cuyo
      contenido decide COMO es la app. Si se sirve desde la cache (cache primero), el usuario que
      ya tenia la app abierta se queda viendo la version VIEJA indefinidamente: se cambio la app,
      se rearmo, y el seguia viendo el HTML de antes. Se midio: metiendo un index.html viejo en la
      cache, tras recargar seguia saliendo el viejo. Con "red primero" siempre se ve lo ultimo, y
      la copia cacheada solo se usa si NO hay red (que es justo cuando se quiere).
   2) LA CACHE SE RENUEVA CON CADA REARMADO. El nombre lleva una HUELLA del contenido, no solo el
      numero de version: si se rearma la app sin subir la version (lo normal mientras se trabaja),
      antes la cache no cambiaba y se seguia sirviendo lo viejo. Con la huella, cada rearmado
      estrena cache y borra la anterior.

   OJO: un service worker SOLO se registra en http(s), NUNCA en file:// (medido: "origin 'null'
   is not supported"). Al abrir el index.html con doble clic este fichero ni se usa.
 */
const VERSION = '__VERSION__';
const HUELLA = '__HUELLA__';
const CACHE = 'mimo-' + VERSION + '-' + HUELLA;

// La aplicacion COMPLETA, la escribio el armador al construir.
const ARCHIVOS = __LISTA__;

// Lo que NUNCA se sirve de la cache: el propio service worker y el HTML.
function vaSiempreARed(url){
  return /\/sw\.js$/.test(url.pathname) || /\/index\.html$/.test(url.pathname) ||
         url.pathname.endsWith('/');
}

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // addAll es todo-o-nada: si un solo archivo falla, no se instala NADA y quedaria una cache a
    // medias. Por eso se anade uno a uno: si a alguno le va mal, se sigue.
    await Promise.all(ARCHIVOS.map(u => c.add(u).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  // Borra las cache de versiones/huellas anteriores: si no, se acumulan y sirven lo viejo.
  e.waitUntil((async () => {
    const ks = await caches.keys();
    // Si YA habia otra cache, esto es una ACTUALIZACION (no la primera instalacion).
    const esActualizacion = ks.some(k => k !== CACHE);
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // En una ACTUALIZACION, se recargan las ventanas abiertas. Sin esto, quien tuviera la app
    // abierta seguiria viendo la copia vieja hasta cerrarla y volver a abrirla: el service worker
    // nuevo quedaba activo pero la pagina ya cargada no se enteraba. Es la diferencia entre "se
    // actualiza solo" y "hay que decirle al usuario que recargue a mano".
    if (esActualizacion) {
      const ventanas = await self.clients.matchAll({ type: 'window' });
      for (const v of ventanas) { try { await v.navigate(v.url); } catch (err) { /* da igual */ } }
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Solo lo propio de la app. Lo de fuera (p. ej. GitHub, para buscar actualizacion) va directo
  // a la red, sin pasar por aqui.
  if (url.origin !== location.origin) return;

  if (vaSiempreARed(url)) {
    // RED PRIMERO para el HTML: lo ultimo manda; si no hay red, la copia cacheada.
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r && r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
        return r;
      } catch (err) {
        const copia = await caches.match(req, { ignoreSearch: true });
        return copia || Response.error();
      }
    })());
    return;
  }

  // El resto (js, css, iconos): CACHE PRIMERO. Responde al instante y sin internet; por detras
  // se actualiza la copia si hay red.
  e.respondWith((async () => {
    const enCache = await caches.match(req, { ignoreSearch: true });
    if (enCache) {
      const red = fetch(req).then(r => {
        if (r && r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => null);
      e.waitUntil(red);
      return enCache;
    }
    try {
      const r = await fetch(req);
      if (r && r.ok) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
      return r;
    } catch (err) {
      // Sin copia y sin red: vacio, NO el index.html (servir HTML donde se espera un .js
      // envenena la app con errores de sintaxis, que es peor que un fallo limpio).
      return Response.error();
    }
  })());
});
