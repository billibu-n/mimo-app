/* ------------------------------- dónde viven los datos -------------------------------
   Archivo suelto: en el navegador de este aparato.
   Con el servidor local: en un archivo del disco, compartido por todos los aparatos de la red. */
const SERVIDOR = {activo:false, version:'', caido:false, ultimo:0};
let tGuardar = null, tMirar = null;

async function guardarEnServidor(){
  SERVIDOR.ultimo = Date.now();
  try {
    const r = await fetch('api/datos', {method:'POST', headers:{'Content-Type':'application/json'},
                                       body: JSON.stringify(E), cache:'no-store'});
    const j = await r.json();
    if (j && j.version) SERVIDOR.version = j.version;
    SERVIDOR.caido = false;
  } catch (err) { SERVIDOR.caido = true; }   // igual quedó guardado en este navegador
  pintarGuardado();
}

function pintarGuardado(){
  const el = document.getElementById('chip-guardado');
  if (!el) return;
  if (ALMACEN.fallo) {
    el.textContent = '¡No se pudo guardar aquí!';
    el.className = 'guardado mal';
    el.title = 'Este navegador no deja guardar en este aparato (' + ALMACEN.fallo + '): ' +
               'puede ser almacenamiento lleno o modo privado. Los cambios se perderán al ' +
               'cerrar. Usa "Descargar mis datos" para conservarlos.';
    return;
  }
  if (!SERVIDOR.activo) {
    el.textContent = 'Guardado aquí';
    el.className = 'guardado';
    el.title = 'Tus datos viven en este navegador. Para verlos desde otro aparato, abre el panel ' +
               'con el servidor local (ABRIR.sh) o usa "Descargar mis datos".';
  } else if (SERVIDOR.caido) {
    el.textContent = 'Servidor sin respuesta';
    el.className = 'guardado mal';
    el.title = 'Se perdió la conexión con el servidor. Tus cambios siguen guardados en este navegador ' +
               'y se enviarán cuando vuelva.';
  } else {
    el.textContent = 'Guardado en el servidor';
    el.className = 'guardado bien';
    el.title = 'Tus datos están en el disco del computador donde corre el servidor, y los ve ' +
               'cualquier aparato de la misma red.';
  }
}

async function conectarServidor(){
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  let v = null, remoto = null;
  try {
    v = await (await fetch('api/version', {cache:'no-store'})).json();
    remoto = await (await fetch('api/datos', {cache:'no-store'})).json();
  } catch (err) { return; }                        // sin servidor: se sigue como archivo suelto
  if (!v || typeof v.version !== 'string') return;
  SERVIDOR.activo = true;
  SERVIDOR.version = v.version;
  const tLocal = Number(E.guardadoEn) || 0;
  const tRemoto = Number((remoto || {}).guardadoEn) || 0;
  if (!remoto || !Object.keys(remoto).length) {
    guardarEnServidor();                            // el servidor está vacío: le mando lo mío
  } else if (tRemoto > tLocal) {
    E = Object.assign(estadoInicial(), remoto);      // el servidor tiene lo más nuevo
    aplicarAvanzado(); arranque();
    mostrarAviso('Datos cargados del servidor');
  } else if (tLocal > tRemoto) {
    guardarEnServidor();
  }
  pintarGuardado();
  clearInterval(tMirar);
  tMirar = setInterval(mirarServidor, 8000);
}

// Si otro aparato guardó algo, se avisa para no pisarlo sin querer
async function mirarServidor(){
  if (!SERVIDOR.activo || document.hidden) return;
  if (Date.now() - SERVIDOR.ultimo < 6000) return;   // acabo de guardar yo
  try {
    const j = await (await fetch('api/version', {cache:'no-store'})).json();
    if (j && j.version && SERVIDOR.version && j.version !== SERVIDOR.version) {
      const b = document.getElementById('banner-remoto');
      if (b) { b.classList.add('on'); document.getElementById('banner-texto').textContent =
        'Otro dispositivo guardó cambios en el servidor.'; }
    }
    SERVIDOR.caido = false;
  } catch (err) {
    if (!SERVIDOR.caido) { SERVIDOR.caido = true; pintarGuardado(); }
  }
}
let E = cargar();

/* Recuperar los ramos que se perdieron de la lista del semestre.
 *
 * Las horas, las notas y las metas se guardan POR CODIGO ("MA2002"), no por nombre. Si la lista de
 * ramos del semestre se pierde pero el resto de los datos sigue ahi, la aplicacion suma los totales
 * y no muestra ninguna columna: el alumno la ve vacia aunque sus datos esten enteros, y no hay
 * ningun aviso de que falte algo.
 *
 * Aqui se reconstruye esa lista con el catalogo, que ya viene dentro de la aplicacion. Solo se
 * AGREGA lo que los propios datos del alumno nombran (una meta, una nota, horas), y solo si el ramo
 * esta en el catalogo y no lo habia quitado a proposito. No se puede inventar un ramo que el alumno
 * no tenga ni perder nada de lo suyo. Si no falta nada, no hace nada.
 */
function recuperarRamosPerdidos(){
  const cat = CAT(), recuperados = [];
  Object.keys(E.sem || {}).forEach(id => {
    const s = E.sem[id];
    if (!s) return;
    const fuera = E.fuera[id] || [];
    // Los ramos del semestre viven en el semestre de DATOS (D.semestres / E.extras), NO en el
    // objeto de estado E.sem[id] (que solo guarda metas, notas, horas y demas por codigo). Leer
    // s.ramos aqui devolvia undefined y dejaba "tiene" vacio: creia perdidos los ramos que ya
    // estaban y los "recuperaba" duplicados. Se usa el semestre de datos que corresponda al id.
    const sem = semestres().find(x => x.id === id);
    const tiene = {};
    ((sem && sem.ramos) || []).forEach(r => { tiene[r.codigo] = 1; });
    (E.agregados[id] || []).forEach(r => { tiene[r.codigo] = 1; });
    const citados = {};
    ['metas_ramo', 'cats', 'comps', 'examen', 'exim', 'descartes'].forEach(k => {
      Object.keys(s[k] || {}).forEach(c => { citados[c] = 1; });
    });
    Object.keys(s.minutos || {}).forEach(lu => {
      Object.keys(s.minutos[lu] || {}).forEach(c => {
        if (Number(s.minutos[lu][c])) citados[c] = 1;
      });
    });
    const faltan = Object.keys(citados).filter(c =>
      c !== OTROS.codigo && !tiene[c] && cat[c] && fuera.indexOf(c) < 0);
    if (!faltan.length) return;
    E.agregados[id] = (E.agregados[id] || []).concat(faltan.map(cod => ramoNuevo(cod)));
    recuperados.push(faltan);
  });
  return recuperados;
}
const RAMOS_RECUPERADOS = recuperarRamosPerdidos();
if (RAMOS_RECUPERADOS.length) {
  guardar();                    // que la reparacion quede guardada, no solo en memoria
  const cuantos = RAMOS_RECUPERADOS.reduce((n, l) => n + l.length, 0);
  // Se avisa recien cuando la pantalla esta dibujada; antes no existe el cartel del aviso.
  setTimeout(() => {
    try {
      mostrarAviso('Se recuperaron ' + cuantos + ' ramos que estaban en tus horas, notas y metas ' +
                   'pero no en la lista del semestre. Si alguno no va, quitalo desde Malla.', 9000);
    } catch (err) { /* sin cartel en pantalla: lo importante ya se hizo */ }
  }, 1500);
}

function colorDe(cod){
  const s = est();
  const col = coloresBorrador || (s && s.colores);   // con borrador abierto, se previsualiza
  if (col && col[cod]) return col[cod];
  const r = ramosH().find(x => x.codigo === cod) || cursoDe(cod);
  return r ? r.color : '#94a3b8';
}
// Todos los eventos del calendario: los del semestre activo (de fabrica + creados por el usuario)
// MAS los personales. Cuando no hay semestre, est() devuelve E.personal, asi que est().nuevas son
// los eventos personales y el calendario funciona sin haber creado ningun semestre.
function todosEventos(){
  const s = semActivo();
  return (s.eventos || []).concat(est().nuevas || []);
}
function eventoPorId(id){ return todosEventos().find(e => String(e.id) === String(id)); }
// "Sin asignar" no se guarda como un numero fijo: es lo que sobra de las horas que traia el Excel
// una vez que repartes minutos entre los ramos. Al escribir en un ramo, el gris baja y el color sube.
// Si repartes mas de lo registrado, el resto queda en 0 y la barra de la semana crece con lo real.
function minutosDe(lunes){
  const m = est().minutos[lunes] || {};
  let repartido = 0;
  ramosBase().forEach(r => { repartido += Number(m[r.codigo]) || 0; });
  const registrado = Number(m.OTROS) || 0;
  return Object.assign({}, m, {OTROS: Math.max(0, registrado - repartido)});
}
// Horas de una semana: TODO lo que registraste, ya sea repartido entre ramos o todavia sin repartir.
// Lo que aun no repartes tambien es tiempo estudiado, asi que suma en el total y en las barras va
// pintado aparte, en gris, para que se vea cuanto te queda por asignar.
function horasSemana(lunes){
  const m = minutosDe(lunes);
  let t = Number(m.OTROS) || 0;
  ramosBase().forEach(r => { t += Number(m[r.codigo]) || 0; });
  return t / 60;
}
// Horas de una semana que SI estan repartidas entre los ramos. Es lo unico que se dibuja como barra:
// asi ninguna barra queda gris ni representa algo que no sea un ramo.
function horasAsignadas(lunes){
  const m = minutosDe(lunes);
  let t = 0;
  ramosBase().forEach(r => { t += Number(m[r.codigo]) || 0; });
  return t / 60;
}
function sinRepartir(lunes){
  if (lunes) return (Number(minutosDe(lunes).OTROS) || 0) / 60;
  return Object.keys(est().minutos).reduce((a, k) => a + (Number(minutosDe(k).OTROS) || 0), 0) / 60;
}
// La semana mas cargada del semestre, en minutos. Es el tope contra el que se dibuja cada barrita.
function totalSemanaMax(){
  const semanas = semActivo().semanas || [];
  return Math.max.apply(null, semanas.map(w => horasSemana(w.lunes) * 60).concat([0]));
}
// La meta base EFECTIVA: si el alumno eligio "mi meta = mi maximo historico", la meta es la
// semana en la que mas estudio hasta ahora y se actualiza sola; si no, el numero fijo que puso.
function usarMetaMaxima(){ return !!E.usarMetaMaxima; }
function metaBaseEfectiva(){
  if (usarMetaMaxima()) return totalSemanaMax() / 60;
  return Number(est().metas.semanal) || 0;
}
function totalHoras(lunes){
  if (!lunes) return Object.keys(est().minutos).reduce((a, k) => a + horasSemana(k), 0);
  return Object.keys(lunes).reduce((a, k) => a + horasSemana(lunes[k]), 0);
}
function objetivoSemanal(){
  const s = est();
  return ramosBase().reduce((a, r) => a + ((s.metas_ramo[r.codigo] || {}).horas || 0), 0);
}
/* Como se escriben las horas. El usuario elige cuales quiere ver; se pueden varios a la vez
   mientras no se estorben, y salen juntos: "2h 30m · 2:30".
   El nombre de cada uno es el que se guarda, asi que no conviene cambiarlo. */
const FORMATOS_HORA = [
  ['hm',        'Horas y minutos',  '2h 30m'],
  ['reloj',     'Como un reloj',    '2:30'],
  ['apostrofe', 'Con apóstrofo',    "2'30"],
  ['min',       'Solo minutos',     '150m'],
  ['hdec',      'Horas decimales',  '2,5h'],
];
function unaHora(k, min){
  const h = Math.floor(min / 60), m = min % 60;
  if (k === 'reloj') return h + ':' + dos(m);
  if (k === 'apostrofe') return h + "'" + dos(m);
  if (k === 'min') return min + 'm';
  if (k === 'hdec') return (Math.round(min / 6) / 10).toString().replace('.', ',') + 'h';
  return (h ? h + 'h' : '') + (h && m ? ' ' : '') + (m ? m + 'm' : '');
}
// Tiempo en texto, segun los formatos elegidos. Devuelve "" cuando no hay nada que mostrar.
function fmtHM(min){
  min = Math.round(min || 0);
  if (!min) return '';
  const elegidos = (E.ajustes && E.ajustes.formatos && E.ajustes.formatos.length)
    ? E.ajustes.formatos : ['hm'];
  const partes = elegidos.map(k => unaHora(k, min)).filter(Boolean);
  return partes.length ? partes.join(' · ') : unaHora('hm', min);
}
// Lo inverso: "2h 15m", "2h15", "45m", "2h" o un numero suelto (que se lee en horas) -> minutos.
function parseHM(txt){
  const s = String(txt || '').trim().toLowerCase().replace(/[ ,]/g, '');
  if (!s) return 0;
  let min = 0, algo = false;
  const mreloj = s.match(/^(\d+)[:'](\d{1,2})$/);         // 2:30 o 2'30
  if (mreloj) return Math.max(0, Math.round(parseInt(mreloj[1], 10) * 60 + parseInt(mreloj[2], 10)));
  const mh = s.match(/(\d+(?:\.\d+)?)h/);
  if (mh) { min += parseFloat(mh[1]) * 60; algo = true; }
  const mm = s.match(/(\d+(?:\.\d+)?)m/);
  if (mm) { min += parseFloat(mm[1]); algo = true; }
  if (!algo) { const n = parseFloat(s); if (!isNaN(n)) min = n * 60; }
  return Math.max(0, Math.round(min));
}
function semanaDe(fecha){
  const semanas = semActivo().semanas || [];
  if (!semanas.length) return null;          // sin semestre no hay semana a la cual pertenecer
  const dentro = semanas.find(w => fecha >= w.lunes && fecha <= sumaDias(w.lunes, 6));
  if (dentro) return dentro.lunes;
  const previas = semanas.filter(w => w.lunes <= fecha);
  return previas.length ? previas[previas.length - 1].lunes : semanas[0].lunes;
}
