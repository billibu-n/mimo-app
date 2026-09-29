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

function pintarActualizacion(estado, texto){
  const caja = document.getElementById('caja-actualizar');
  if (caja){ caja.textContent = texto || ''; caja.className = 'aviso-act ' + (estado || ''); }
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

async function buscarActualizacion(){
  pintarActualizacion('cargando', 'Consultando…');
  let remota = null;
  try {
    const url = 'https://raw.githubusercontent.com/' + REPO_ACT.user + '/' + REPO_ACT.repo +
                '/main/version.json';
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error('http ' + r.status);
    remota = await r.json();
  } catch (err) {
    pintarTagVersion('mal', 'v' + versionLocal());
    pintarActualizacion('mal', 'No se pudo consultar (¿sin internet?). Revisa ' +
      'https://github.com/' + REPO_ACT.user + '/' + REPO_ACT.repo + '/releases');
    return;
  }
  if (!remota || typeof remota.version !== 'string'){
    pintarTagVersion('mal', 'v' + versionLocal());
    pintarActualizacion('mal', 'No se encontró la versión en GitHub.');
    return;
  }
  const local = versionLocal();
  const cmp = compararVersiones(remota.version, local);
  pintarTagVersion(cmp > 0 ? 'nueva' : (cmp < 0 ? 'al-dia' : 'al-dia'), 'v' + local, cmp);
  if (cmp > 0){
    pintarActualizacion('ok', 'Hay una versión más nueva: v' + remota.version +
      ' (tienes v' + local + ').');
    const enlace = document.getElementById('enlace-actualizar');
    if (enlace){
      enlace.href = 'https://github.com/' + REPO_ACT.user + '/' + REPO_ACT.repo + '/releases';
      enlace.style.display = '';
    }
  } else if (cmp < 0){
    pintarActualizacion('ok', 'Estás en una versión más nueva (v' + local + ') que la publicada.');
  } else {
    pintarActualizacion('ok', 'Estás al día (v' + local + ').');
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
