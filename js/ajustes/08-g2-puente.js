/* ---------------------------------------------------- ajustes-g2-puente.js
   El puente entre la propuesta G2 de Ajustes y el motor de mimo.

   POR QUE HACE FALTA ESTE ARCHIVO
   El exterior cambio (renglones con titulo, pastillas de dos estados, los tres
   modos de la barra a la vista) pero el MOTOR es el mismo y no se toca: el sigue
   buscando sus controles por id (#aj-ver-hechas, #aj-sonido) y guardando en
   E.ajustes. Este archivo es lo unico que los une:

     - la pastilla visible escribe en la casilla real y dispara su 'change', que es
       lo que el motor ya escuchaba: asi no hay dos fuentes de verdad;
     - cuando el motor pinta (renderAjustes), la pastilla se sincroniza desde la
       casilla, para que al recargar muestre el estado guardado y no "No";
     - los tres botones de modo de barra llaman a avSeg('barra', ...) y a
       window.mimoBarra.ponerModo(), que es exactamente lo que hacia el
       desplegable anterior.

   REGLA: si manana se agrega un ajuste nuevo, se agrega al motor y aqui solo se
   sincroniza su cara. Este archivo NO guarda por su cuenta.
   ===================================================================== */
(function () {
  /* ---- una pastilla por cada casilla que el motor maneja ------------------ */
  // [id de la pastilla visible, id de la casilla real]
  const PASTILLAS = [
    ['aj-tildes-pastilla',   'aj-tildes'],
    ['aj-compacto-pastilla', 'aj-compacto'],
    ['aj-hechas-pastilla',   'aj-ver-hechas'],
    ['aj-sonido-pastilla',   'aj-sonido'],
    ['aj-recordar-pastilla', 'aj-recordar'],
  ];

  function sincronizar(pastillaId, casillaId) {
    const p = document.getElementById(pastillaId);
    const c = document.getElementById(casillaId);
    if (!p || !c) return;
    // la cara dice el estado de la casilla; el texto es la ultima pastilla
    const on = !!c.checked;
    p.setAttribute('aria-pressed', on ? 'true' : 'false');
    const texto = p.lastElementChild;
    if (texto) texto.textContent = on ? 'Sí' : 'No';
    // un clic en la pastilla mueve la casilla y avisa al motor por su via de siempre
    p.onclick = () => {
      c.checked = !c.checked;
      c.dispatchEvent(new Event('change', { bubbles: true }));
      sincronizar(pastillaId, casillaId);
    };
  }

  function sincronizarTodo() {
    PASTILLAS.forEach(par => sincronizar(par[0], par[1]));
    pintarModos();
    pintarTitulos();
  }

  /* ---- como se abrevian los titulos -------------------------------------
     La cara visible son tres botones (data-titulo: envuelto/puntos/iniciales).
     El motor guarda en E.ajustes.titulos.modo y lo aplica renderEstudio. Se marca
     el elegido desde formatoTitulo(), con soporte null: si no hay nada guardado,
     queda 'envuelto' (el de fabrica). */
  var bTitulos = document.querySelectorAll('#p-ajustes button[data-titulo]');
  function pintarTitulos() {
    var modo = 'envuelto';
    try { if (typeof formatoTitulo === 'function') modo = formatoTitulo().modo || 'envuelto'; } catch (e) {}
    bTitulos.forEach(function (b) { b.classList.toggle('on', b.dataset.titulo === modo); });
  }
  bTitulos.forEach(function (b) {
    b.onclick = function () {
      // null-safe: si no hay titulos guardados, se parte del de fabrica.
      if (!E.ajustes) E.ajustes = {};
      if (!E.ajustes.titulos) E.ajustes.titulos = { modo: 'envuelto', largo: 12 };
      var base = (typeof formatoTitulo === 'function') ? formatoTitulo() : { modo: 'envuelto', largo: 12 };
      E.ajustes.titulos = Object.assign({}, base, { modo: b.dataset.titulo });
      if (typeof guardar === 'function') guardar();
      if (typeof renderEstudio === 'function') renderEstudio();
      pintarTitulos();
    };
  });
  pintarTitulos();

  /* ---- formato de las horas -----------------------------------------------
     El motor guarda E.ajustes.formatos como LISTA (se pueden marcar varios formatos
     a la vez). La cara visible son tres botones (data-formato: hm/hdec/min); un clic
     alterna ese formato en la lista. Null-safe: sin datos, queda ['hm'] de fabrica. */
  var bFormatos = document.querySelectorAll('#p-ajustes button[data-formato]');
  function pintarFormatos() {
    var elegidos = (E.ajustes && E.ajustes.formatos && E.ajustes.formatos.length)
      ? E.ajustes.formatos : ['hm'];
    bFormatos.forEach(function (b) {
      b.classList.toggle('on', elegidos.indexOf(b.dataset.formato) >= 0);
    });
  }
  bFormatos.forEach(function (b) {
    b.onclick = function () {
      if (!E.ajustes) E.ajustes = {};
      var elegidos = (E.ajustes.formatos && E.ajustes.formatos.length)
        ? E.ajustes.formatos.slice() : ['hm'];
      var k = b.dataset.formato;
      var i = elegidos.indexOf(k);
      if (i >= 0) elegidos.splice(i, 1); else elegidos.push(k);
      // No dejar cero formatos: dejaria las horas en blanco en todo el panel.
      if (!elegidos.length) elegidos = ['hm'];
      E.ajustes.formatos = elegidos;
      if (typeof guardar === 'function') guardar();
      if (typeof renderTodo === 'function') renderTodo();
      pintarFormatos();
    };
  });
  pintarFormatos();

  /* ---- los tres modos de la barra lateral --------------------------------
     El elegido se marca leyendo av().barra, que es la unica fuente de verdad. */
  function pintarModos() {
    let actual = 'manual';
    // avVista() lee el BORRADOR si hay uno abierto, y si no lo guardado: asi el boton recien
    // pulsado se marca al instante (antes se leia av(), que ignora el borrador y quedaba estatico).
    try {
      if (typeof avVista === 'function' && avVista()) actual = avVista().barra || 'manual';
      else if (typeof av === 'function' && av()) actual = av().barra || 'manual';
    } catch (e) {}
    document.querySelectorAll('#p-ajustes .modo[data-barra]').forEach(b => {
      b.classList.toggle('on', b.dataset.barra === actual);
    });
  }

  document.querySelectorAll('#p-ajustes .modo[data-barra]').forEach(b => {
    b.onclick = () => {
      const valor = b.dataset.barra;
      // el mismo camino que el tema: al borrador, aplicar, repintar. avSeg dibuja un
      // segmento y NO guarda; aqui se escribe el borrador directo, que es lo que
      // avSeg('barra') simulaba mal (espera un array, no un string).
      if (typeof abrirBorrador === 'function') abrirBorrador();
      if (avBorrador) avBorrador.barra = valor;
      if (typeof aplicarAvanzado === 'function') aplicarAvanzado();
      if (window.mimoBarra) window.mimoBarra.ponerModo(valor);
      pintarModos();
      if (typeof renderTodo === 'function') renderTodo(true);
      if (typeof pintarBarraAjustes === 'function') pintarBarraAjustes();
    };
  });

  /* ---- posicion y estilo de la barra (P7) --------------------------------
     Mismo camino que el modo: borrador -> aplicar -> repintar. La posicion y el estilo
     son clases del marco; el motor de la barra (08-barra.js) las pone. */
  function leerAv(k, def) {
    try {
      if (typeof avVista === 'function' && avVista()) return avVista()[k] || def;
      if (typeof av === 'function' && av()) return av()[k] || def;
    } catch (e) {}
    return def;
  }
  function pintarBarraPos() {
    const actual = leerAv('barraPos', 'izquierda');
    document.querySelectorAll('#p-ajustes .modo[data-pos]').forEach(b =>
      b.classList.toggle('on', b.dataset.pos === actual));
  }
  function pintarBarraEstilo() {
    const actual = leerAv('barraEstilo', 'clasica');
    document.querySelectorAll('#p-ajustes .modo[data-estilo]').forEach(b =>
      b.classList.toggle('on', b.dataset.estilo === actual));
  }
  // Tras cada clic hay que repintar TAMBIEN la barra de cambios: si no, el aviso de
  // "N cambios sin guardar" se queda con el recuento del clic anterior y parece que la
  // eleccion no se registra (era parte de la queja "queda en blanco").
  function refrescarTrasCambio(){
    if (typeof pintarBarraAjustes === 'function') pintarBarraAjustes();
  }
  document.querySelectorAll('#p-ajustes .modo[data-pos]').forEach(b => {
    b.onclick = () => {
      if (typeof abrirBorrador === 'function') abrirBorrador();
      if (avBorrador) avBorrador.barraPos = b.dataset.pos;
      if (typeof aplicarAvanzado === 'function') aplicarAvanzado();
      pintarBarraPos();
      if (typeof renderTodo === 'function') renderTodo(true);
      refrescarTrasCambio();
    };
  });
  document.querySelectorAll('#p-ajustes .modo[data-estilo]').forEach(b => {
    b.onclick = () => {
      if (typeof abrirBorrador === 'function') abrirBorrador();
      if (avBorrador) avBorrador.barraEstilo = b.dataset.estilo;
      if (typeof aplicarAvanzado === 'function') aplicarAvanzado();
      pintarBarraEstilo();
      if (typeof renderTodo === 'function') renderTodo(true);
      refrescarTrasCambio();
    };
  });
  pintarBarraPos(); pintarBarraEstilo();

  /* ---- la cara de la version ---------------------------------------------
     La pastilla de estado muestra lo mismo que el semaforo, sin repetir la
     logica: solo copia el texto que el motor ya escribio en #bv-etq. */
  function sincronizarVersion() {
    const pastilla = document.getElementById('aj-version-pastilla');
    const etq = document.getElementById('bv-etq');
    const caja = document.getElementById('barra-version');
    if (!pastilla || !etq || !caja) return;
    const texto = document.getElementById('aj-version-estado');
    if (texto) texto.textContent = etq.textContent;
    pastilla.setAttribute('aria-pressed', caja.classList.contains('al-dia') ? 'true' : 'false');
  }

  /* ---- el boton visible del semaforo dispara el del motor ------------------
     La propuesta muestra #bv-buscar. mimo escucha #btn-actualizar (que esta
     oculto). Se unen: pulsar la cara visible es pulsar el del motor. */
  const bvBuscar = document.getElementById('bv-buscar');
  const btnActualizar = document.getElementById('btn-actualizar');
  if (bvBuscar && btnActualizar) {
    bvBuscar.onclick = () => btnActualizar.click();
  }

  /* ---- la galeria de temas del boceto aplica el tema real -----------------
     El motor dibuja el tema en #av-tema (oculto). La cara visible son las
     tarjetas .tema[data-tema] del boceto. Al pulsar una, se aplica el tema por el
     mismo camino que avSeg (borrador + aplicarAvanzado + repintar), y se marca
     "elegido" en esa tarjeta. En "Según el sistema" no existe en mimo (los 9
     temas son fijos), asi que esa tarjeta se quita del flujo o se ignora. */
  var tarjetas = document.querySelectorAll('#p-ajustes .tema[data-val]');
  function pintarTemaElegido() {
    var actual = 'clasico';
    try {
      if (typeof avVista === 'function' && avVista()) actual = avVista().tema || 'clasico';
      else if (typeof av === 'function' && av()) actual = av().tema || 'clasico';
    } catch (e) {}
    // SOLO la clase .on manda; el CSS (.tema .tm-marca{opacity:0},
    // .tema.on .tm-marca{opacity:1}) muestra "elegido" en el activo. No se toca
    // style inline, que fue lo que dejo "elegido" pegado en todos los temas.
    document.querySelectorAll('#p-ajustes .tema[data-val]').forEach(function (t) {
      var activo = t.dataset.val === actual;
      t.classList.toggle('on', activo);
      // El visto es decorativo: el estado tiene que ir tambien en el boton, o el lector de
      // pantalla no sabe cual esta elegido (antes lo decia la palabra "elegido").
      t.setAttribute('aria-pressed', activo ? 'true' : 'false');
      var marca = t.querySelector('.tm-marca');
      if (marca) marca.style.opacity = '';
    });
  }
  tarjetas.forEach(function (t) {
    // "sistema" no es un tema de mimo: se ignora (no hace nada).
    if (t.dataset.val === 'sistema') return;
    t.onclick = function () {
      // El MISMO camino que el motor: escribir en el BORRADOR, no aplicar directo.
      // Asi el tema se previsualiza y aparece la barra "N cambios sin guardar"
      // con Descartar/Guardar. Nada se guarda hasta aceptar.
      if (typeof abrirBorrador === 'function') abrirBorrador();
      if (avBorrador) avBorrador.tema = t.dataset.val;
      if (typeof aplicarAvanzado === 'function') aplicarAvanzado();
      if (typeof renderTodo === 'function') renderTodo(true);
      if (typeof pintarBarraAjustes === 'function') pintarBarraAjustes();
      pintarTemaElegido();
    };
  });
  pintarTemaElegido();

  /* ---- engancharse a lo que ya corre -------------------------------------- */
  // renderAjustes() pinta la pestana; el semaforo pinta el aviso. En los dos casos
  // hay que volver a sincronizar la cara, o queda mostrando un estado viejo.
  const original = window.renderAjustes;
  if (typeof original === 'function') {
    window.renderAjustes = function () {
      original.apply(this, arguments);
      sincronizarTodo();
      sincronizarVersion();
    };
  }
  // 06-actualizar.js corre al cargar y escribe el semaforo cuando termina: se
  // observa el texto, que es la via que no depende de tocar ese archivo.
  const etq = document.getElementById('bv-etq');
  if (etq && window.MutationObserver) {
    new MutationObserver(sincronizarVersion)
      .observe(etq, { childList: true, characterData: true, subtree: true });
  }

  sincronizarTodo();
  sincronizarVersion();
})();
