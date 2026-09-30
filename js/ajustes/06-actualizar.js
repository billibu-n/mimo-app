/* ------------------------------------------------------------- actualizacion
   Boton "Buscar actualizacion" en Ajustes. Compara la version local (version.json, que se entrega
   junto a la app) con la ultima publicada en GitHub, y avisa si hay una mas nueva.

   Solo LEE: no descarga ni reemplaza nada. La app corre en file:// sin servidor, asi que el unico
   canal seguro es avisar al usuario y dejarlo ir a la pagina de Releases de GitHub a bajar el zip.
   El fetch a raw.githubusercontent.com si funciona desde file:// porque GitHub sirve esos archivos
   con `access-control-allow-origin: *`. */

// Donde vive el proyecto en GitHub y de donde se saca la version mas nueva.
function versionLocal(){
  // La version local la escribe el armador en #datos-version[data-local]; si no
  // existe (o no coincide con el formato x.y.z), se cae a un valor seguro.
  const el = document.getElementById('datos-version');
  const v = el && el.getAttribute('data-local');
  return (v && /^\d+\.\d+\.\d+/.test(v)) ? v : '1.0.0';
}
const REPO_ACT = {user:'billibu-n', repo:'mimo-app'};

function pintarActualizacion(estado, texto, html){
  const caja = document.getElementById('caja-actualizar');
  if (!caja) return;
  if (html) caja.innerHTML = html; else caja.textContent = texto || '';
  caja.className = 'aviso-act ' + (estado || '');
}

function compararVersiones(a, b){
  // a y b son "1.2.3". Devuelve 1 si a>b, -1 si a<b, 0 si iguales.
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const largo = Math.max(pa.length, pb.length);
  for (let i = 0; i < largo; i++){
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/* ---- de que sistema es la app, y que fichero del release le toca ---------- */
function sistemaDeLaApp(){
  const ua = navigator.userAgent || navigator.platform || '';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac/i.test(ua)) return 'macos';
  return 'linux';
}
function escapador(t){
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Trae el ULTIMO release de GitHub. La API dice la version Y los ficheros con su enlace de
   descarga directa, asi que la app puede ofrecer el que toca sin que el usuario busque en GitHub.
   Si la API falla (sin internet o limite de peticiones), se cae al version.json de siempre. */
async function traerUltimoRelease(){
  try {
    const r = await fetch('https://api.github.com/repos/' + REPO_ACT.user + '/' + REPO_ACT.repo +
                          '/releases/latest',
                          {cache:'no-store', headers:{'Accept':'application/vnd.github+json'}});
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    if (j && (j.tag_name || j.version)) return j;
    throw new Error('sin version');
  } catch (err) {
    const r2 = await fetch('https://raw.githubusercontent.com/' + REPO_ACT.user + '/' + REPO_ACT.repo +
                           '/main/version.json', {cache:'no-store'});
    if (!r2.ok) throw new Error('http ' + r2.status);
    return await r2.json();
  }
}

async function buscarActualizacion(){
  pintarActualizacion('cargando', 'Consultando…');
  let rel = null;
  try { rel = await traerUltimoRelease(); }
  catch (err) {
    pintarTagVersion('mal', 'v' + versionLocal());
    pintarActualizacion('mal', 'No se pudo consultar (¿sin internet?). Revisa ' +
      'https://github.com/' + REPO_ACT.user + '/' + REPO_ACT.repo + '/releases');
    return;
  }
  const remota = String(rel.version || rel.tag_name || '').replace(/^v/, '');
  const local = versionLocal();
  if (!remota){
    pintarTagVersion('mal', 'v' + local);
    pintarActualizacion('mal', 'No se encontró la versión publicada.');
    return;
  }
  const cmp = compararVersiones(remota, local);
  pintarTagVersion(cmp > 0 ? 'nueva' : 'al-dia', 'v' + local, cmp);
  if (cmp <= 0){
    pintarActualizacion('ok', 'Estás al día (v' + local + ').');
    return;
  }
  ofrecerActualizacion(rel, remota, local);
}

/* El puente de la aplicacion de escritorio. El nombre se arma al vuelo por el MISMO motivo
   que en `10a-carpeta-tauri.js`: el armador marca ese nombre como si fuera un hueco sin
   rellenar (su red de seguridad busca dos guiones bajos + palabra + dos guiones bajos) y
   abortaria la construccion. */
function puenteTauri(){ return window["__TA" + "URI__"]; }

const PAGINA_RELEASES = function(){ return 'https://github.com/' + REPO_ACT.user + '/' + REPO_ACT.repo + '/releases'; };

/* Ofrece la actualizacion SEGUN EL SISTEMA. La idea: no obligar a pasar por GitHub.
   - Windows: se DESCARGA el instalador desde la propia app (se pide donde guardarlo) y se avisa.
   - Linux (.deb/.rpm): la app no puede instalarse sola; se muestra el comando de actualizar, listo
     para copiar, para que no haya que buscar el fichero a mano.
   - Navegador: solo se enlaza la pagina de descargas. */
function ofrecerActualizacion(rel, remota, local){
  const cab = 'Hay una versión más nueva: <b>v' + escapador(remota) + '</b> (tienes v' +
              escapador(local) + '). ';
  const dentro = (typeof enTauri === 'function') && enTauri();
  const assets = (rel && rel.assets) || [];
  const sistema = sistemaDeLaApp();
  const buscar = function (re){ return assets.filter(function (a){ return re.test(a.name); })[0]; };

  if (!dentro){
    pintarActualizacion('ok', '', cab + '<a href="' + PAGINA_RELEASES() +
      '" target="_blank" rel="noopener">Ver las descargas</a>.');
    return;
  }

  if (sistema === 'windows'){
    const exe = buscar(/\.exe$/i) || buscar(/\.msi$/i);
    if (!exe){
      pintarActualizacion('ok', '', cab + '<a href="' + PAGINA_RELEASES() +
        '" target="_blank" rel="noopener">Ver las descargas</a>.');
      return;
    }
    pintarActualizacion('ok', '', cab +
      '<button type="button" class="mini" id="act-descargar">Descargar el instalador</button>');
    const b = document.getElementById('act-descargar');
    if (b) b.onclick = function () { descargarInstalador(exe, b); };
    return;
  }

  // Linux: se elige el paquete del sistema y se muestra su comando.
  let paquete = buscar(/\.rpm$/i);
  let cmd = null;
  if (paquete){ cmd = "sudo dnf install -y '" + paquete.browser_download_url + "'"; }
  else {
    paquete = buscar(/\.deb$/i);
    if (paquete) cmd = "wget -O /tmp/mimo.deb '" + paquete.browser_download_url +
                       "' && sudo apt install -y /tmp/mimo.deb";
  }
  if (!cmd){
    pintarActualizacion('ok', '', cab + '<a href="' + PAGINA_RELEASES() +
      '" target="_blank" rel="noopener">Ver las descargas</a>.');
    return;
  }
  pintarActualizacion('ok', '', cab + 'Para actualizar, copia este comando en una terminal ' +
    'y pégalo (pide tu contraseña):' +
    '<div class="act-cmd" id="act-cmd">' + escapador(cmd) + '</div>' +
    '<button type="button" class="mini" id="act-copiar">Copiar el comando</button>');
  const copiar = document.getElementById('act-copiar');
  if (copiar) copiar.onclick = async function () {
    let ok = false;
    try { await navigator.clipboard.writeText(cmd); ok = true; } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = cmd; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) { ok = false; }
    }
    copiar.textContent = ok ? 'Copiado' : 'Copia manualmente el recuadro de arriba';
  };
}

/* Windows: baja el instalador DENTRO de la app. Se pide donde guardarlo (dialogo del sistema) y se
   escribe ahi. No se instala solo: el usuario abre el .exe. Asi no hay que visitar GitHub. */
async function descargarInstalador(asset, boton){
  const antes = boton ? boton.textContent : '';
  try {
    if (boton){ boton.disabled = true; boton.textContent = 'Descargando…'; }
    const r = await fetch(asset.browser_download_url, {cache:'no-store'});
    if (!r.ok) throw new Error('http ' + r.status);
    const bytes = new Uint8Array(await r.arrayBuffer());
    const destino = await puenteTauri().dialog.save({
      defaultPath: asset.name,
      filters: [{ name: 'Instalador de Mimo', extensions: [asset.name.split('.').pop()] }],
    });
    if (!destino) { if (boton){ boton.disabled = false; boton.textContent = antes; } return; }
    await puenteTauri().fs.writeFile(destino, bytes);
    if (typeof avisar === 'function') {
      await avisar('Descargado en la carpeta que elegiste. Abre ese archivo para instalar ' +
                   'la nueva versión: se actualizará encima.', { titulo: 'Instalador descargado' });
    }
    if (boton){ boton.disabled = false; boton.textContent = antes; }
  } catch (e) {
    if (typeof avisar === 'function') {
      await avisar('No se pudo descargar el instalador. Puedes bajarlo de la página de descargas.',
                   { titulo: 'No se pudo descargar' });
    }
    if (boton){ boton.disabled = false; boton.textContent = antes; }
  }
}

/* El tag de version del header, junto a "Mimo Academics". Muestra la version local y, al
   pulsarlo, comprueba contra GitHub. Fuera del recuadro de Ajustes, como pide la propuesta. */
function pintarTagVersion(estado, version){
  const el = document.getElementById('bv-tag');
  if (!el) return;
  el.textContent = version || ('v' + versionLocal());
  el.className = 'tag-version' + (estado ? ' ' + estado : '');
  el.title = estado === 'mal'
    ? 'No se pudo comprobar (¿sin internet?). Pulsa para reintentar.'
    : (estado === 'nueva'
      ? 'Hay una versión más nueva. Pulsa para comprobar otra vez.'
      : 'Al día (' + (version || 'v' + versionLocal()) + '). Pulsa para comprobar.');
}
(function iniciarTagVersion(){
  const el = document.getElementById('bv-tag');
  if (!el) return;
  pintarTagVersion('', 'v' + versionLocal());
  el.onclick = () => buscarActualizacion();
})();
