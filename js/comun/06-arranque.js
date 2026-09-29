/* ---------------------------------------------------------------- arranque */
function pintarFiltros(){
  const fr = document.getElementById('cl-ramos');
  fr.innerHTML = ramosBase().map(r =>
    '<label><input type="checkbox"' + (ramosFiltro.has(r.codigo) ? ' checked' : '') + ' data-ramo="' + r.codigo + '">' +
    '<i class="cuadro" style="background:' + colorDe(r.codigo) + '"></i>' + esc(r.alias) + '</label>').join('');
  fr.querySelectorAll('input').forEach(i => i.onchange = () => {
    i.checked ? ramosFiltro.add(i.dataset.ramo) : ramosFiltro.delete(i.dataset.ramo);
    renderSemestre();
  });
  // El filtro por tipo de evento ahora tiene recuadro visible: la seccion "Eventos" de la barra
  // lateral, abajo de "Ramos". Ahi vive el catalogo propio del usuario (cumpleanos, personales,
  // etc.): cada tipo es una casilla que muestra u esconde sus eventos en el calendario.
  const ft = document.getElementById('cl-eventos');
  const tipos = tiposDe();
  if (ft) {
    if (!Object.keys(tipos).length) {
      ft.innerHTML = '<p class="ayuda">Cuando crees un evento sin ramo y le pongas un tipo ' +
        '(ej. "Cumpleaños"), aparecerá aquí para filtrarlo.</p>';
    } else {
      ft.innerHTML = Object.keys(tipos).map(t =>
        '<label><input type="checkbox"' + (tiposFiltro.has(t) ? ' checked' : '') + ' data-tipo="' + t + '">' +
        esc(tipos[t]) + '</label>').join('');
      ft.querySelectorAll('input').forEach(i => i.onchange = () => {
        i.checked ? tiposFiltro.add(i.dataset.tipo) : tiposFiltro.delete(i.dataset.tipo);
        renderSemestre();
      });
    }
  }
}
function arranque(){
  // El cartel de 'esto es una muestra' es solo para el archivo de ejemplo: la version
  // limpia ya es la aplicacion de verdad, asi que se lo quita de encima al arrancar.
  if (D.limpio) { const m = document.getElementById('aviso-muestra'); if (m) m.remove(); }
  memoEstados = null;    // repintado completo: los estados de la malla se recalculan desde cero
  aplicarAvanzado();
  // Repara el estado ya guardado: si se importo un respaldo con codigo viejo, E.tipos quedo vacio
  // y el calendario no pinta eventos. Al arrancar se rescatan de nuevo y se persisten.
  if (restaurarTipos()) guardar();
  if (!ramosFiltro.size) resetFiltros();
  renderSemActivo();
  pintarFiltros();
  renderSemestre(); renderEstudio(); renderLista(); renderDetalle();
  renderAjustes(); renderTiempo(); renderMalla();
  estilizarSelects(document);
}
// Navegación entre secciones: el motor del marco G1 (el que venía del prototipo
// salida/panel/g1-navegacion.js). Las siete secciones viven dentro del mismo
// index.html como <section class="seccion" data-seccion="...">, y esta es la
// función que muestra una y esconde el resto. Se usa el atributo data-seccion y
// no el texto del botón: el botón lleva el icono adentro y el texto depende del
// idioma. El dato, no.
const SECCIONES = ['calendario', 'estudio', 'malla', 'notas', 'tiempo', 'tareas', 'ajustes'];
const CLAVE_SECCION = 'mimo-seccion-actual';
const cuerpos = SECCIONES.map(s => document.querySelector('.seccion[data-seccion="' + s + '"]')).filter(Boolean);
const navs = document.querySelectorAll('.nav');

function mostrarSeccion(nombre, guardar) {
  // Una sola visible; las demás llevan el atributo hidden (que respeta la
  // accesibilidad, a diferencia de display:none directo) y pierden .on.
  cuerpos.forEach(c => {
    const suya = c.getAttribute('data-seccion') === nombre;
    if (suya) { c.removeAttribute('hidden'); c.classList.add('on'); }
    else { c.setAttribute('hidden', ''); c.classList.remove('on'); }
  });
  navs.forEach(n => n.classList.toggle('on', n.getAttribute('data-seccion') === nombre));
  if (guardar) { try { localStorage.setItem(CLAVE_SECCION, nombre); } catch (e) {} }
  // Las secciones que dibujan al aparecer (malla, tiempo, estudio) se enteran:
  // medir un elemento oculto da 0 y el dibujo sale mal. Se conserva la lógica
  // de render que ya tenía mimo, disparada por este evento en vez de por el
  // clic directo en cada pestaña.
  if (nombre === 'tiempo') renderTiempo();
  if (nombre === 'estudio') renderPuntos();
  if (nombre === 'malla') { memoEstados = null; renderMalla(); }
  if (nombre === 'tareas') renderTareas();
  try { document.dispatchEvent(new CustomEvent('mimo:seccion', { detail: { seccion: nombre } })); } catch (e) {}
}

navs.forEach(n => {
  n.addEventListener('click', () => {
    const sec = n.getAttribute('data-seccion');
    if (sec && SECCIONES.indexOf(sec) !== -1) mostrarSeccion(sec, true);
  });
});

// El orden de los apartados lo decide el usuario: arrastra el boton en la barra y se guarda.
// El orden vive en el DOM (appendChild mueve el boton), no en SECCIONES: asi el motor de arriba
// no tiene que cambiar. SECCIONES sigue siendo la lista valida de secciones.
const CLAVE_ORDEN = 'mimo-orden-secciones';
let navArrastrado = null;
function ordenNavs(){
  return [].slice.call(document.querySelectorAll('.navs .nav')).map(n => n.getAttribute('data-seccion'));
}
function aplicarOrdenNavs(){
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_ORDEN) || 'null');
    if (!Array.isArray(g)) return;
    const caja = document.querySelector('.navs');
    if (!caja) return;
    g.forEach(sec => {
      const b = caja.querySelector('.nav[data-seccion="' + sec + '"]');
      if (b && SECCIONES.indexOf(sec) !== -1) caja.appendChild(b);
    });
  } catch (e) {}
}
function guardarOrdenNavs(){ try { localStorage.setItem(CLAVE_ORDEN, JSON.stringify(ordenNavs())); } catch (e) {} }
navs.forEach(n => {
  n.setAttribute('draggable', 'true');
  n.addEventListener('dragstart', e => { navArrastrado = n; e.dataTransfer.effectAllowed = 'move'; });
  n.addEventListener('dragover', e => {
    if (!navArrastrado || navArrastrado === n) return;
    e.preventDefault();
    const caja = n.parentNode, r = n.getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) caja.insertBefore(navArrastrado, n);
    else caja.insertBefore(navArrastrado, n.nextSibling);
  });
  n.addEventListener('drop', e => { e.preventDefault(); guardarOrdenNavs(); });
  n.addEventListener('dragend', () => { navArrastrado = null; guardarOrdenNavs(); });
});

// Al abrir, vuelve a donde quedó el alumno; si es la primera vez o el valor no
// sirve, arranca en la primera: nunca en blanco.
{
  let inicial = SECCIONES[0];
  try { const g = localStorage.getItem(CLAVE_SECCION); if (g && SECCIONES.indexOf(g) !== -1) inicial = g; } catch (e) {}
  mostrarSeccion(inicial, false);
  aplicarOrdenNavs();
}
const botonesVista = {todo:'cl-ver-todo', prox:'cl-ver-prox', pend:'cl-ver-pend'};
Object.keys(botonesVista).forEach(k => {
  const btn = document.getElementById(botonesVista[k]);
  btn.onclick = () => {
    vista = k;
    Object.values(botonesVista).forEach(id => document.getElementById(id).classList.remove('on'));
    btn.classList.add('on');
    renderSemestre();
  };
});
document.getElementById('malla-buscar').oninput = ev => {
  mallaBuscaTexto = ev.target.value;
  mallaBusca = sinTildes(mallaBuscaTexto);
  renderMalla();
};
document.getElementById('malla-rapido').onchange = ev => { mallaRapido = ev.target.checked; };
document.getElementById('malla-limpiar').onclick = () => {
  mallaSel = null; mallaBusca = ''; mallaBuscaTexto = ''; renderMalla();
};
document.getElementById('malla-nuevo-ramo').onclick = () => modalRamo(null);
document.getElementById('malla-reordenar').onclick = modalReordenarMalla;
document.getElementById('malla-exportar').onclick = exportarMalla;
document.getElementById('malla-simular').onclick = modalSimular;
document.getElementById('malla-importar').onclick = modalImportarMalla;
document.getElementById('cl-nuevo').onclick = nuevaTarea;
document.getElementById('btn-nuevo-sem').onclick = modalNuevoSemestre;
document.getElementById('btn-edit-sem').onclick = modalEditarSemestre;
document.getElementById('btn-borrar-sem').onclick = borrarSemestre;
document.getElementById('modal').onclick = ev => { if (ev.target.id === 'modal') cerrarEditor(); };
document.getElementById('es-meta').oninput = ev => {
  est().metas.semanal = Number(ev.target.value) || 0;
  guardar(); renderEstudio(); renderSemestre(); renderPuntos();
};
document.getElementById('es-meta-max').onchange = ev => {
  E.usarMetaMaxima = ev.target.checked;
  guardar('Meta cambiada a ' + (ev.target.checked ? 'máximo histórico' : 'número fijo'));
  renderEstudio(); renderSemestre(); renderPuntos();
};
document.getElementById('aj-ver-hechas').onchange = ev => {
  E.ajustes.verHechasPorHacer = ev.target.checked; guardar(); renderSemestre();
};
document.getElementById('crono-play').onclick = cronoPlay;
document.getElementById('crono-pausa').onclick = cronoPausa;
document.getElementById('crono-parar').onclick = cronoParar;
document.getElementById('crono-aviso-si').onclick = avisoRegistrarSi;
document.getElementById('crono-aviso-no').onclick = avisoRegistrarNo;
document.getElementById('crono-ramo').onchange = ev => { E.tiempo.ramo = ev.target.value; guardar(); };
document.getElementById('crono-semana').onchange = ev => {
  E.tiempo.semana = ev.target.value;
  E.tiempo.dia = null;   // se recalcula: si la semana nueva contiene hoy, queda hoy; si no, el lunes
  guardar(); renderTiempo();
};
document.getElementById('crono-dia').onchange = ev => { E.tiempo.dia = ev.target.value; guardar(); };
document.getElementById('crono-objetivo').onchange = ev => {
  E.tiempo.objetivo = Math.max(1, Math.min(600, Number(ev.target.value) || 25));
  guardar(); renderTiempo();
};
document.querySelectorAll('.seccion[data-seccion="tiempo"] .modo').forEach(b => b.onclick = () => {
  E.tiempo.modo = b.dataset.modo;
  document.querySelectorAll('.seccion[data-seccion="tiempo"] .modo').forEach(x => x.classList.toggle('on', x === b));
  guardar(); renderTiempo();
});
// El respaldo AUTOSUFICIENTE, en el formato 2 (el canonico desde la version 1.0.1). Trae la capa
// de estado E (notas, metas, colores, eventos y ramos agregados, tiempos, aprobados) MAS la capa
// estructural que la app trae dentro del HTML (catalogo, niveles, semestres con sus semanas). Asi
// un respaldo se restaura integro en cualquier version, tambien en la vacia. NOTA: las franjas
// horarias de D.horario NO se guardan porque la app 1.0.1 no las lee en ningun sitio (dato muerto
// heredado de la version vieja); guardarlas seria arrastrar basura que nada consume.
function respaldoActual(){
  const r = {
    formato: 2,
    estado: Object.assign({}, E),
    catalogo: D.catalogo || {},
    niveles: D.niveles || [],
    semestres: D.semestres || []
  };
  delete r.estado.guardadoEn;
  return r;
}

function descargarRespaldo(nombre){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(respaldoActual(), null, 1)], {type:'application/json'}));
  a.download = nombre || ('respaldo-mimo-' + new Date().toISOString().slice(0, 10) + '.json');
  a.click();
}

// Al importar, los tipos de evento VIVEN en E.tipos (los crea el usuario en Ajustes; la version
// vacia no trae ninguno de fabrica). Un respaldo hecho en la version CON ejemplo no trae E.tipos
// (ahi los tipos venian de la constante TIPOS), pero sus eventos SI usan esos tipos. Sin esto,
// tiposDe() quedaria vacio y el filtro del calendario descartaria TODOS los eventos: el usuario
// cargaba su respaldo y el calendario salia sin una sola actividad. Se rescatan los tipos que de
// verdad aparecen en los eventos, con la etiqueta canonica de TIPOS; los que no estan en TIPOS se
// dejan con la etiqueta en mayusculas que usaban.
function restaurarTipos(datos){
  // Junta los tipos de evento de TODOS los semestres conocidos: los del respaldo recien cargado
  // (datos.semestres) y los que ya estan en el estado E (E.extras + E.sem). Asi sirve tanto al
  // importar como al arrancar: si el estado en localStorage quedo sin E.tipos (por un import hecho
  // con codigo viejo), se repara solo al recargar, y el calendario deja de salir vacio.
  const usados = {};
  const cadaEvento = e => { if (e && e.tipo) usados[e.tipo] = 1; };
  (datos && datos.semestres || []).forEach(sem => (sem.eventos || []).forEach(cadaEvento));
  (E.extras || []).forEach(sem => (sem.eventos || []).forEach(cadaEvento));
  Object.values(E.sem || {}).forEach(s => (s.eventos || []).forEach(cadaEvento));
  // Los eventos personales (sin semestre) tambien definen tipos en uso.
  (E.personal && E.personal.nuevas || []).forEach(cadaEvento);
  (E.eventos || []).forEach(cadaEvento);
  const era = Object.keys(E.tipos || {}).length;
  E.tipos = E.tipos || {};
  Object.keys(usados).forEach(t => {
    if (E.tipos[t]) return;                       // ya lo tiene el usuario
    E.tipos[t] = TIPOS[t] || t.toUpperCase();     // etiqueta canonica, o mayuscula si no la hay
  });
  return Object.keys(E.tipos).length !== era;     // true si se rescato algun tipo nuevo
}

document.getElementById('restablecer').onclick = () => {
  if (!confirm('Se borrara TODO lo que hiciste: semestres, eventos, notas, colores, tiempos y ' +
               'ajustes. Antes se descargara un respaldo por si fue un error.\n\n' +
               'No se borra la malla que trae la aplicacion (eso es parte del archivo).\n\n' +
               '¿Seguir?')) return;
  // 1. respaldo de seguridad ANTES de borrar, por si el clic fue un error
  descargarRespaldo('respaldo-antes-de-restablecer-' + new Date().toISOString().slice(0, 10) + '.json');
  // 2. limpiar la cache de verdad (no solo en memoria): se borra la clave del localStorage
  try { localStorage.removeItem(CLAVE); } catch (err) { /* sin almacenamiento: igual se sigue */ }
  // 3. estado de fabrica y repintado, SIN volver a guardar: el almacen queda limpio de verdad,
  //    como recien abierta la aplicacion (no se persiste un estado de fabrica que ya viene por defecto).
  E = estadoInicial();
  invalidarCatalogo();
  resetFiltros(); arranque();
  mostrarAviso('Todo restablecido');
};
document.getElementById('exportar').onclick = () => { descargarRespaldo(); };
document.getElementById('importar').onclick = () => document.getElementById('archivo').click();
document.getElementById('btn-actualizar').onclick = buscarActualizacion;
document.getElementById('exportar-ical').onclick = exportarIcal;
document.getElementById('importar-ical').onclick = () => document.getElementById('archivo-ical').click();
document.getElementById('archivo-ical').onchange = ev => {
  const f = ev.target.files[0];
  if (f) importarIcal(f);
  ev.target.value = '';
};
document.getElementById('archivo').onchange = ev => {
  const f = ev.target.files[0];
  if (!f) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      if (!datos || typeof datos !== 'object') { alert('Ese archivo no es un respaldo de tu Mimo.'); return; }

      // FORMATO 2 (respaldo autosuficiente): trae 'estado' (la capa E) mas la capa estructural
      // (catalogo, niveles, semestres). Se fusiona para que un respaldo del ejemplo de Minas se
      // restaure integro en la version vacia.
      if (datos.formato === 2 && datos.estado && typeof datos.estado === 'object') {
        // 1. el estado del usuario
        E = Object.assign(estadoInicial(), datos.estado);
        // Fusion PROFUNDA de las capas que crecieron entre versiones: igual que cargar(). Asi un
        // respaldo de la 1.0.2 (sin recordatorios, sin pomodoro, sin av.barra) no borra esos campos
        // nuevos; quedan con su valor de fabrica y el usuario solo llena lo que le falte.
        E.ajustes = Object.assign(estadoInicial().ajustes, datos.estado.ajustes || {});
        E.tiempo = Object.assign(estadoInicial().tiempo, datos.estado.tiempo || {});
        E.asistencia = Object.assign({pesoParcial:{}, minimo:{}, clases:{}, reglas:{}, horario:{}}, datos.estado.asistencia || {});
        migrarTiempo(E);   // pone el tiempo viejo (raiz) en crono/temp, si el respaldo es anterior
        // 2. la malla (catalogo y niveles) que el respaldo traiga: entra por E.catalogo, porque
        //    D es la capa fija que trae el HTML y no se puede reescribir. CAT() ya combina ambas.
        const catTraido = datos.catalogo || {};
        E.catalogo = Object.assign({}, E.catalogo || {}, catTraido);
        // 3. los semestres que el respaldo trajera y que esta version no tiene, van a E.extras.
        const ya = {}; semestres().forEach(x => { ya[x.id] = 1; });
        (datos.semestres || []).forEach(sem => {
          if (sem && sem.id && !ya[sem.id]) {
            E.extras = (E.extras || []).concat([sem]);
            ya[sem.id] = 1;
            E.sem[sem.id] = E.sem[sem.id] || estadoSemestre(sem);
          }
        });
        invalidarCatalogo();
        restaurarTipos(datos);
        guardar('Datos cargados'); resetFiltros(); arranque();
        return;
      }

      // FORMATO VIEJO (solo E): el .json de la 1.0.0. Se carga el estado, pero ese archivo NO
      // traia la malla ni los semestres del ejemplo, asi que se avisa para que no parezca perdido.
      if ('sem' in datos || 'v' in datos || 'activo' in datos) {
        E = Object.assign(estadoInicial(), datos);
        migrarTiempo(E);   // lo mismo: respaldo viejo con tiempo en la raiz
        guardar('Datos cargados'); resetFiltros(); arranque();
        mostrarAviso('Se cargaron tus datos. Si la malla no aparece, importa tu malla de nuevo ' +
                     '(Ajustes > Malla > Importar malla desde un archivo).');
        return;
      }

      alert('Ese archivo no es un respaldo de tu Mimo.');
    }
    catch (err) { alert('No pude leer ese archivo.'); }
    ev.target.value = '';   // permite volver a elegir el mismo archivo mas tarde
  };
  lector.readAsText(f);
};
document.getElementById('estado-guardado').textContent = 'Guardado en este navegador como "' + CLAVE + '".';
document.getElementById('banner-recargar').onclick = () => location.reload();
document.getElementById('banner-cerrar').onclick = () =>
  document.getElementById('banner-remoto').classList.remove('on');
let tResize = null;
window.addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(renderPuntos, 200); });

/* ---------------------------------------------------------------- barras extraibles
   El <details> no anima el cierre: al quitarle 'open' el navegador esconde el contenido en el mismo
   cuadro, y ninguna transicion del hijo alcanza a verse. Para que abrir y cerrar se vean igual hay
   que sacarle el control del plegado al navegador:

     1. El <details> se queda SIEMPRE con open. Quien manda es la clase .abierta en la barra.
     2. El .cuerpo se envuelve en .cuerpo-env, que cuelga de la barra y anima su max-height
        (0 -> 2000px). Ese si transiciona, en los dos sentidos y con la misma curva.
     3. El clic en el summary NO cierra el details: alterna .abierta. Se intercepta con
        preventDefault para que el navegador no le quite el open por su cuenta.

   Todo esto es solo pintura: si el JS no corre, el <details> sigue abriendo y cerrando (de golpe,
   como cualquier details), que es lo que debe pasar sin JavaScript.
*/
function envolverCuerpoDeBarras(raiz){
  // querySelectorAll NO incluye al propio nodo, asi que si el que llega YA es una barra hay que
  // atenderlo aparte. Sin esto, una barra creada suelta (el modal de Evento, que se dibuja con un
  // innerHTML) no se envolvia ni recibia .abierta: quedaba plegada y sin animacion.
  const barras = [];
  if (raiz && raiz.nodeType === 1 && raiz.matches('.barra-extraible')) barras.push(raiz);
  (raiz || document).querySelectorAll('.barra-extraible').forEach(b => barras.push(b));
  barras.forEach(barra => {
    // el estado visible vive en la clase; open se deja puesto para que el detalle no se plegue solo
    if (barra.hasAttribute('open') && !barra.classList.contains('abierta')) barra.classList.add('abierta');
    barra.open = true;
    if (barra.querySelector(':scope > .cuerpo-env')) return;       // ya envuelto
    const cuerpo = barra.querySelector(':scope > .cuerpo');
    if (!cuerpo) return;
    const env = document.createElement('div');
    env.className = 'cuerpo-env';
    barra.insertBefore(env, cuerpo);
    env.appendChild(cuerpo);
  });
}
function inicializarBarras(){
  envolverCuerpoDeBarras(document);
  // Las barras que el JS dibuja despues (listas, el modal, la configuracion de la malla) tambien
  // se envuelven al aparecer. Se mira el nodo agregado y, si es una barra, el propio nodo:
  // querySelectorAll ya incluye al elemento mismo si coincide, asi que no hace falta subir al padre.
  new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(n => { if (n.nodeType === 1) { envolverCuerpoDeBarras(n); estilizarSelects(n); } });
    });
  }).observe(document.body, {childList: true, subtree: true});

  // alternar la clase; el details nunca se cierra, para que la animacion pueda correr entera
  document.addEventListener('click', ev => {
    const sum = ev.target.closest('.barra-extraible > summary');
    if (!sum) return;
    ev.preventDefault();
    sum.parentElement.classList.toggle('abierta');
  });
}

arranque();                      // se pinta al tiro con lo que haya guardado en este navegador
inicializarBarras();             // y las barras extraibles quedan animando en los dos sentidos
enlazarCalendario();             // los controles Mes/Año/Semestre y la navegación del calendario
renderCalendario();              // pinta la vista de calendario activa (por defecto, el mes)
conectarServidor();              // y si esto viene del servidor local, manda lo suyo al responder
