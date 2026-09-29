/* ---------------------------------------------------- ajustes avanzados
   Todo lo de esta parte es aspecto: no cambia ni un dato. Los colores de estado se derivan del color
   fuerte que elige el usuario: el fondo suave, el borde y el texto se calculan mezclando. Asi con un
   solo selector por estado queda coherente en los dos temas. */
const AV_FABRICA = {
  tema:'clasico', relleno:'suave', densidad:'normal', grosor:'normal', esquinas:'redondeadas',
  candado:true, creditos:true, barra:'manual',
  colores:{aprobado:'#16a34a', curso:'#eab308', disponible:'#2563eb', bloqueado:'#94a3b8'}
};
/* Los temas que existen, en el orden en que salen en Ajustes.

   PARA AGREGAR UN TEMA HACEN FALTA CINCO COSAS, no dos. Tres de ellas no dan error: el tema
   entra en la lista, se deja elegir, y se ve mal. Medido al agregar 'pinky' (2026-09-27):
     1. un archivo css/tema-<nombre>.css con la paleta completa (copiar uno y cambiar colores);
     2. una linea aqui abajo, en TEMAS;
     3. una linea en FONDO_TEMA (mas abajo). Sin ella, fondoTema() cae a blanco y los colores
        de estado se mezclan contra el fondo equivocado;
     4. la lista de temas CLAROS, escrita A MANO DOS VECES: en aplicarAvanzado() y en
        renderAvanzado() (buscar 'const oscuro ='). Un tema CLARO que falte ahi se trata como
        OSCURO, y sus textos de estado salen claros sobre fondo claro, SIN error en consola;
     5. el <link a css/tema-<nombre>.css> en index.html y plantilla.html, y los botones
        <button class="tema" data-val="<nombre>"> en index.html y html/ajustes.html.
   La clase del <body> SI se recorre desde esta lista: eso ya no se puede olvidar. */

/* Esto es una limitacion de fondo, no un olvido de quien anadio el tema: hay cuatro listas
   paralelas del mismo concepto. Candidato a unificar en la rama de normalizacion. */
const TEMAS = [['clasico', 'Clásico'], ['negro', 'Negro'],
               ['medianoche', 'Medianoche'], ['deepsea', 'DeepSea'], ['bosque', 'Bosque'],
               ['sepia', 'Sepia'], ['vino', 'Vino'], ['pinky', 'Pinky'], ['alto-contraste', 'Alto contraste']];
const NOMBRES_TEMA = TEMAS.map(t => t[0]);

// El fondo de cada tema. El resto de los colores se calculan mezclando contra este.
const FONDO_TEMA = {clasico:'#ffffff', negro:'#1e1e1e', medianoche:'#131314',
                    deepsea:'#071a2b', bosque:'#eef4ee', sepia:'#f4ecd8',
                    vino:'#150a0c', pinky:'#ffffff', 'alto-contraste':'#000000'};
function fondoTema(a){ return FONDO_TEMA[a.tema] || '#ffffff'; }
const AV_DENSIDAD = {
  compacta:{pad:'4px 7px',  fuente:'.72rem', mgap:'26px', cgap:'6px'},
  normal:  {pad:'7px 9px',  fuente:'.78rem', mgap:'40px', cgap:'8px'},
  amplia:  {pad:'10px 12px', fuente:'.86rem', mgap:'54px', cgap:'11px'}
};
const AV_GROSOR = {fina:1, normal:1.6, gruesa:2.6};
const AV_ESTADOS = [['aprobado','--malla-aprobado','Aprobado'], ['curso','--malla-curso','En curso'],
                    ['disponible','--malla-disponible','Disponible'], ['bloqueado','--malla-bloqueado','Bloqueado']];
function av(){
  if (!E.ajustes.av) E.ajustes.av = {};
  const a = E.ajustes.av;
  for (const k in AV_FABRICA) if (a[k] === undefined) a[k] = AV_FABRICA[k];
  // Quien haya guardado el tema con el nombre viejo conserva su eleccion.
  if (a.tema === 'gemini') a.tema = 'medianoche';
  a.colores = Object.assign({}, AV_FABRICA.colores, a.colores || {});
  return a;
}
/* Los ajustes que se ven en pantalla: el borrador si hay uno abierto, y si no lo guardado. */
function avVista(){ return avBorrador || av(); }
function abrirBorrador(){
  if (!avBorrador) avBorrador = JSON.parse(JSON.stringify(av()));
  if (!coloresBorrador) coloresBorrador = JSON.parse(JSON.stringify(est().colores || {}));
}
const AV_ETIQUETAS = {tema:'Tema', relleno:'Relleno de los estados', densidad:'Densidad',
                      grosor:'Grosor de las líneas', esquinas:'Esquinas',
                      candado:'Candado en la malla', creditos:'Créditos en la malla',
                      // barra/barraPos/barraEstilo faltaban aqui. AV_ETIQUETAS es la lista que
                      // cambiosDeAjustes() recorre para decidir si hay algo sin guardar; al no
                      // estar, pintarBarraAjustes() veia "0 cambios", anulaba el borrador y
                      // descartaba en silencio lo elegido en Navegacion (quedaba "en blanco").
                      barra:'Modo de la barra', barraPos:'Posición de la barra',
                      barraEstilo:'Estilo de la barra'};
function valorLegible(k, v){ return typeof v === 'boolean' ? (v ? 'sí' : 'no') : String(v); }
/* Que cambio y en que, para el resumen de la barra. Sin esto, "hay cambios" es un numero que no dice
   nada y el usuario tiene que acordarse de lo que toco. */
function cambiosDeAjustes(){
  const guardado = av(), trabajo = avBorrador || guardado, filas = [];
  Object.keys(AV_ETIQUETAS).forEach(k => {
    if (guardado[k] !== trabajo[k]) {
      filas.push(AV_ETIQUETAS[k] + ': ' + valorLegible(k, guardado[k]) + ' -> ' + valorLegible(k, trabajo[k]));
    }
  });
  (AV_ESTADOS || []).forEach(x => {
    if (guardado.colores[x[0]] !== trabajo.colores[x[0]]) {
      filas.push(x[2] + ': ' + guardado.colores[x[0]] + ' -> ' + trabajo.colores[x[0]]);
    }
  });
  if (coloresBorrador) {
    // Se compara contra el color que el ramo tiene de verdad (el guardado, y si no lo trae de
    // fabrica). Comparar contra el guardado a secas contaba como cambio elegir el color que ya era.
    const guardados = est().colores || {};
    const n = Object.keys(coloresBorrador).filter(k => {
      const r = ramosH().find(x => x.codigo === k) || cursoDe(k) || {};
      const antes = guardados[k] || r.color;
      return coloresBorrador[k] !== antes;
    }).length;
    if (n) filas.push(n + (n === 1 ? ' color de ramo cambiado' : ' colores de ramos cambiados'));
  }
  return filas;
}
function tirarBorrador(){
  avBorrador = null; coloresBorrador = null;
  aplicarAvanzado(); renderTodo();
}
function guardarBorrador(){
  if (avBorrador) E.ajustes.av = JSON.parse(JSON.stringify(avBorrador));
  if (coloresBorrador) est().colores = JSON.parse(JSON.stringify(coloresBorrador));
  avBorrador = null; coloresBorrador = null;
  guardar('Ajustes guardados'); aplicarAvanzado(); renderTodo();
}
/* Barra fija al final de la pestaña: mientras haya cambios sin guardar, dice cuales y ofrece
   aceptarlos o descartarlos. Sin cambios, desaparece. */
function pintarBarraAjustes(){
  const z = document.getElementById('aj-bar');
  if (!z) return;
  const filas = cambiosDeAjustes();
  if (!filas.length) { avBorrador = null; coloresBorrador = null; z.className = 'aj-bar'; z.innerHTML = ''; return; }
  z.className = 'aj-bar on';
  z.innerHTML = '<div class="aj-caja"><div class="aj-tit"><b>' + filas.length +
    (filas.length === 1 ? ' cambio sin guardar' : ' cambios sin guardar') + '</b>' +
    '<span class="sm">Nada de esto se ha escrito todavía. Acepta para dejarlo, o descarta para ' +
    'volver como estaba.</span></div><ul>' + filas.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' +
    '<div class="fila" style="gap:8px"><button class="btn" id="aj-tirar">Descartar</button>' +
    '<button class="btn primario" id="aj-guardar">Aceptar y guardar</button></div></div>';
  document.getElementById('aj-tirar').onclick = tirarBorrador;
  document.getElementById('aj-guardar').onclick = guardarBorrador;
}
function aRGB(h){
  const s = String(h).replace('#','');
  const x = s.length === 3 ? s.split('').map(y => y + y).join('') : s;
  return [parseInt(x.slice(0,2),16) || 0, parseInt(x.slice(2,4),16) || 0, parseInt(x.slice(4,6),16) || 0];
}
function aHex(r,g,b){
  return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
}
// mezcla dos colores: t=0 deja a, t=1 deja b
function aMezcla(c1, c2, s){
  const a = aRGB(c1), b = aRGB(c2);
  return aHex(a[0]+(b[0]-a[0])*s, a[1]+(b[1]-a[1])*s, a[2]+(b[2]-a[2])*s);
}
function aLuminancia(h){
  const c = aRGB(h).map(v => { const x = v/255; return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); });
  return .2126*c[0] + .7152*c[1] + .0722*c[2];
}
// contraste de la WCAG: 4.5 es legible, 3 es el minimo para texto grande
function aContraste(c1, c2){
  const l1 = aLuminancia(c1), l2 = aLuminancia(c2);
  return (Math.max(l1,l2) + .05) / (Math.min(l1,l2) + .05);
}
function aplicarAvanzado(){
  const a = avVista(), d = AV_DENSIDAD[a.densidad] || AV_DENSIDAD.normal;
  const oscuro = (a.tema !== 'clasico' && a.tema !== 'bosque' && a.tema !== 'sepia' && a.tema !== 'pinky');   // Clasico, Bosque, Sepia y Pinky son claros
  const base = fondoTema(a);
  const suave = (c, t) => aMezcla(c, base, t);
  const vars = ['--nodo-pad:' + d.pad, '--nodo-fuente:' + d.fuente, '--malla-gap:' + d.mgap,
                '--col-gap:' + d.cgap, '--linea:' + (AV_GROSOR[a.grosor] || 1.6),
                '--radio:' + (a.esquinas === 'rectas' ? '2px' : '9px')];
  AV_ESTADOS.forEach(x => {
    const c = a.colores[x[0]], v = x[1];
    vars.push(v + ':' + c);
    vars.push(v + '-bg:' + suave(c, oscuro ? .80 : .86));                     // fondo suave
    vars.push(v + '-bd:' + suave(c, oscuro ? .38 : .45));                     // borde
    // En tema oscuro el texto se aclara hacia el blanco. Mezclarlo contra el fondo oscuro (como se
    // hacia antes) daba texto del mismo tono que el recuadro: contraste 1,1 sobre 4,5 recomendado.
    vars.push(v + '-fg:' + (oscuro ? aMezcla(c, '#ffffff', .58) : aMezcla(c, '#000000', .5)));  // texto
    // Texto sobre relleno solido. Antes se decidia con 'luminancia > 0.5', y ese umbral
    // deja fuera al amarillo: #eab308 da 0.498, por un pelo, y le tocaba texto BLANCO.
    // El resultado eran 1.92 de contraste en 'en curso' y 2.56 en 'bloqueado', o sea
    // ilegible, y solo en el modo de relleno solido. Ahora se elige el blanco solo si de
    // verdad se lee (3.0 es el piso de la WCAG para texto grande); si no, va oscuro.
    vars.push(v + '-sol:' + (aContraste(c, '#ffffff') >= 3.0 ? '#ffffff' : '#101828'));
  });
  NOMBRES_TEMA.forEach(n => document.body.classList.toggle('tema-' + n, a.tema === n));
  document.body.classList.toggle('relleno-solido', a.relleno === 'solido');
  // El modo de la barra lateral lo aplica el motor de la barra (comun/08-barra.js),
  // que vive en window.mimoBarra. Se le pasa el valor elegido en Ajustes.
  if (window.mimoBarra) {
    window.mimoBarra.ponerModo(a.barra || 'manual');
    if (window.mimoBarra.ponerPos) window.mimoBarra.ponerPos(a.barraPos || 'izquierda');
    if (window.mimoBarra.ponerEstilo) window.mimoBarra.ponerEstilo(a.barraEstilo || 'clasica');
  }
  // La hoja #av-vars se escribe en dos ambitos, y cada uno por una razon:
  //   - :root lleva TODAS las variables. Es lo que pinta a los temas que no definen colores de
  //     estado (negro, medianoche, deepsea) y el unico ambito que ve el tema clasico.
  //   - body.tema-<X> lleva SOLO los colores de estado, y SOLO si el usuario cambio alguno. Si no
  //     lo toco, manda el tema: bosque, sepia, vino y alto contraste traen a proposito su propia
  //     paleta de estados, y pisarla seria cambiarle el diseno a quien no pidio nada.
  // El fallo que esto arregla: esos mismos cuatro temas definen los estados en su body.tema-*, que
  // tiene MAS especificidad que :root. Escribirlos en :root hacia que se perdiera el color elegido
  // EN SILENCIO. Con el mismo selector del tema y la hoja despues en el documento, gana el usuario.
  const FORMA = ['--nodo-pad', '--nodo-fuente', '--malla-gap', '--col-gap', '--linea', '--radio'];
  const deColor = vars.filter(v => !FORMA.some(f => v.indexOf(f + ':') === 0));
  const colorTocado = AV_ESTADOS.some(x => (a.colores || {})[x[0]] !== AV_FABRICA.colores[x[0]]);
  const hoja = document.getElementById('av-vars');
  if (hoja) {
    hoja.textContent = ':root{' + vars.join(';') + '}' +
      (colorTocado ? 'body.tema-' + a.tema + '{' + deColor.join(';') + '}' : '');
  }
}
function avSeg(clave, opciones){
  const a = avVista();
  return '<div class="seg" data-av="' + clave + '">' + opciones.map(o =>
    '<button data-val="' + o[0] + '"' + (a[clave] === o[0] ? ' class="on"' : '') + '>' + o[1] +
    '</button>').join('') + '</div>';
}
function renderAvanzado(){
  const a = avVista();
  const oscuro = (a.tema !== 'clasico' && a.tema !== 'bosque' && a.tema !== 'sepia' && a.tema !== 'pinky');   // mismo criterio que aplicarAvanzado
  const muestra = (estado) => {
    const c = a.colores[estado];
    const fondo = a.relleno === 'solido' ? c : aMezcla(c, fondoTema(a), .86);
    const borde = a.relleno === 'solido' ? c : aMezcla(c, fondoTema(a), .45);
    const texto = a.relleno === 'solido'
      ? (aLuminancia(c) > .5 ? '#101828' : '#ffffff')
      : (oscuro ? aMezcla(c, '#ffffff', .58) : aMezcla(c, '#000000', .5));
    return '<i style="background:' + fondo + ';border-color:' + borde + '"></i>' +
      '<span style="color:' + ('"' + texto + '"') + '">no marca</span>';
  };
  const contra = (estado) => {
    const c = a.colores[estado];
    const fondo = a.relleno === 'solido' ? c : aMezcla(c, fondoTema(a), .86);
    const texto = a.relleno === 'solido'
      ? (aLuminancia(c) > .5 ? '#101828' : '#ffffff')
      : (oscuro ? aMezcla(c, '#ffffff', .58) : aMezcla(c, '#000000', .5));
    return aContraste(fondo, texto);
  };
  // "?" junto al nombre: la explicacion larga va en el title del icono, no como parrafo suelto
  // que empuja y dispersa la fila.
  const pista = t => '<span class="ayuda-ico" title="' + esc(t) + '">?</span>';
  document.getElementById('avanzado').innerHTML =
    '<div class="av-fila"><span class="eti">Relleno de los estados</span>' + pista('Con "todo pintado", un ramo aprobado es un recuadro verde entero en vez de un fondo pálido con borde de color.') +
      avSeg('relleno', [['suave','Suave'], ['solido','Todo pintado']]) + '</div>' +
    '<div class="av-fila"><span class="eti">Colores de los estados</span>' + pista('De este color se calculan solos el fondo, el borde y el texto, en los dos temas. Abajo, el contraste de cada uno (sobre 4.5 se lee bien).') +
      '<span style="display:flex;gap:12px;flex-wrap:wrap">' +
      AV_ESTADOS.map(x => '<span class="av-color"><input type="color" data-avcolor="' + x[0] +
        '" value="' + a.colores[x[0]] + '" title="' + x[2] + '"><span>' + x[2] + '</span></span>').join('') +
      '</span><button class="mini" id="av-fabrica">Volver al diseño de fábrica</button></div>' +
    '<div class="av-fila"><span class="eti">Cómo se verían</span><span class="av-muestra">' +
      AV_ESTADOS.map(x => '<span style="display:flex;align-items:center;gap:4px">' + muestra(x[0]) +
        '<b style="color:var(--fg)">' + x[2] + '</b> <span>(' + contra(x[0]).toFixed(1) + ':1)</span></span>').join('') +
      '</span></div>' +
    '<div class="av-fila"><span class="eti">Tamaño de las tarjetas</span>' + pista('Más compacto entra más malla en pantalla; más amplio se lee más cómodo.') +
      avSeg('densidad', [['compacta','Compacta'], ['normal','Normal'], ['amplia','Amplia']]) + '</div>' +
    '<div class="av-fila"><span class="eti">Grosor de las líneas</span>' + pista('Sólo afecta a las líneas de prerrequisito de la malla.') +
      avSeg('grosor', [['fina','Fina'], ['normal','Normal'], ['gruesa','Gruesa']]) + '</div>' +
    '<div class="av-fila"><span class="eti">Esquinas</span>' + pista('La forma de las tarjetas de la malla.') +
      avSeg('esquinas', [['redondeadas','Redondeadas'], ['rectas','Rectas']]) + '</div>' +
    '<div class="av-fila"><span class="eti">Icono de estado</span>' + pista('El candadito, el lápiz o el visto bueno en la esquina de cada ramo.') +
      '<input type="checkbox" id="av-candado"' + (a.candado ? ' checked' : '') + '></div>' +
    '<div class="av-fila"><span class="eti">Créditos en las tarjetas</span>' + pista('Los "6 cr" al pie de cada ramo.') +
      '<input type="checkbox" id="av-creditos"' + (a.creditos ? ' checked' : '') + '></div>' +
    '<div class="av-fila"><span class="eti">Sumar un ramo</span>' + pista('Cada tarjeta de la malla trae un + para agregar ese ramo a tu semestre en curso (queda "en curso", con su columna de horas y su espacio en Notas), y un − para sacarlo. Los ramos que ya están en el semestre muestran la resta.') +
      '</div>';
  document.getElementById('av-fabrica').onclick = () => {
    abrirBorrador();
    avBorrador = JSON.parse(JSON.stringify(AV_FABRICA));
    aplicarAvanzado(); renderTodo(true); renderAvanzado(); pintarBarraAjustes();
  };
  // Se convierte aca, no en renderAjustes: hay varios sitios que repintan este bloque (el tema,
  // el relleno, las esquinas) llamando a esta funcion a secas, y si la conversion viviera mas
  // arriba, el ? desaparecia y volvian las explicaciones largas.
  convertirPistas();
}
/* Nada de esto guarda: todo va al borrador y la barra de abajo es la que decide. */
document.getElementById('avanzado').addEventListener('click', ev => {
  const b = ev.target.closest('.seg button');
  if (!b) return;
  abrirBorrador();
  avBorrador[b.parentNode.dataset.av] = b.dataset.val;
  aplicarAvanzado(); renderTodo(true); renderAvanzado(); pintarBarraAjustes();
});
document.getElementById('avanzado').addEventListener('input', ev => {
  const c = ev.target.closest('[data-avcolor]');
  if (!c) return;                       // mientras se arrastra el selector, solo se repinta la malla
  abrirBorrador();
  avBorrador.colores[c.dataset.avcolor] = c.value;
  aplicarAvanzado(); renderMalla(); renderAvanzado(); pintarBarraAjustes();
});
document.getElementById('avanzado').addEventListener('change', ev => {
  const c = ev.target.closest('[data-avcolor]');
  if (c) { renderAvanzado(); pintarBarraAjustes(); return; }
  if (ev.target.id === 'av-candado' || ev.target.id === 'av-creditos') {
    abrirBorrador();
    avBorrador[ev.target.id === 'av-candado' ? 'candado' : 'creditos'] = ev.target.checked;
    aplicarAvanzado(); renderMalla(); renderAvanzado(); pintarBarraAjustes();
  }
});
