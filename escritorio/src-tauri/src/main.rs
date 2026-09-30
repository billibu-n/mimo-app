// Mimo Academics para escritorio (Tauri v2).
//
// Este caparazon NO reescribe la aplicacion: carga el `index.html` que ya existe. Lo unico que
// anade son dos capacidades que el navegador no daba o daba distinto:
//
//   1. La CARPETA de respaldo, con el dialogo del sistema (el webview de Linux no trae
//      `showDirectoryPicker`).
//   2. La MIGRACION de los datos del lanzador: el `localStorage` pertenece a un origen, y dentro
//      de Tauri el origen es `tauri://localhost`, distinto de `http://127.0.0.1:8734`. Sin esto
//      la app de escritorio arrancaria VACIA aunque los datos esten en el disco.
//
// La migracion se hace en RUST y no en JavaScript a proposito: asi el permiso de lectura del
// disco lo resuelve el sistema operativo y no hay que abrirle la carpeta del usuario a la pagina.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::{Path, PathBuf};

/// Resultado de buscar los datos de la version anterior.
#[derive(serde::Serialize)]
struct Migracion {
    encontrado: bool,
    origen: Option<String>,
    datos: Option<String>,
    motivo: Option<String>,
    /// Donde se miro, para poder explicar por que no se encontro nada.
    buscado: Vec<String>,
}

fn perfil_del_lanzador() -> PathBuf {
    // Espeja `carpeta_datos()` de lanzador.py: XDG_DATA_HOME (o ~/.local/share) + /mimo
    let base = std::env::var("XDG_DATA_HOME")
        .ok()
        .filter(|s| !s.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
            Path::new(&home).join(".local").join("share")
        });
    base.join("mimo")
}

/// Saca el JSON de la clave pedida de un fichero de `Local Storage` de Chromium (leveldb).
///
/// Formato MEDIDO, no supuesto. La entrada de una clave de un origen es:
///     <longitud> '_' <origen> 0x00 0x01 <clave> <longitud_del_valor> <MARCADOR> <valor>
/// y por medio se cuelan los registros de control de leveldb.
///
/// DOS TRAMPAS que se midieron y costaron dos intentos fallidos:
///
///  1. La clave NO va precedida de un NUL a secas: los bytes reales son
///     `...origen 0x00 0x01 clave...`. Una primera version buscaba `0x00` + clave, no
///     encontraba NADA y la migracion decia "no hay datos" con los datos delante. La clave
///     sola ya es suficientemente distintiva.
///
///  2. **El valor puede estar en DOS codificaciones.** Chromium guarda el texto en Latin-1
///     cuando todos sus caracteres caben, y en **UTF-16LE** cuando no. Lo indica el byte
///     MARCADOR que va justo antes del valor (`0x01` = Latin-1, `0x00` = UTF-16LE).
///     Exigir UTF-8 (como hacia la primera version) descartaba el valor EN SILENCIO, y los
///     datos reales de la app casi seguro no son Latin-1: llevan comillas tipograficas y
///     guiones largos. Hay que leer los dos casos.
fn extraer_datos(bytes: &[u8], clave: &str) -> Option<String> {
    let aguja = clave.as_bytes();

    let mut desde = 0usize;
    while let Some(pos) = encontrar(bytes, aguja, desde) {
        desde = pos + 1;
        // El valor empieza en la primera llave que aparece tras la clave.
        let mut i = pos + aguja.len();
        while i < bytes.len() && bytes[i] != b'{' {
            // Si aparece otro texto de control antes de la llave, se corta esta vuelta.
            if i - (pos + aguja.len()) > 64 {
                break;
            }
            i += 1;
        }
        if i >= bytes.len() {
            continue;
        }
        // El marcador de codificacion va pegado delante del valor.
        let marcador = if i > 0 { bytes[i - 1] } else { 1 };

        let candidato: Option<String> = if marcador == 0x00 {
            // UTF-16LE: se decodifica la cola entera y se corta el JSON equilibrado.
            let cola = &bytes[i..];
            let unidades: Vec<u16> = cola
                .chunks_exact(2)
                .map(|p| u16::from_le_bytes([p[0], p[1]]))
                .collect();
            json_equilibrado(&String::from_utf16_lossy(&unidades))
        } else {
            // Latin-1 / bytes: cada byte es un caracter (es lo que Chromium escribio).
            let texto: String = bytes[i..].iter().map(|b| *b as char).collect();
            json_equilibrado(&texto)
        };

        if let Some(t) = candidato {
            return Some(t);
        }
    }
    None
}

/// Devuelve el primer objeto JSON equilibrado de `texto` que sea valido de verdad.
fn json_equilibrado(texto: &str) -> Option<String> {
    let mut i = texto.find('{')?;
    let bytes: Vec<char> = texto.chars().collect();
    let mut nivel = 0i32;
    let mut en_cadena = false;
    let mut escape = false;
    while i < bytes.len() {
        let c = bytes[i];
        if en_cadena {
            if escape {
                escape = false;
            } else if c == '\\' {
                escape = true;
            } else if c == '"' {
                en_cadena = false;
            }
        } else if c == '"' {
            en_cadena = true;
        } else if c == '{' || c == '[' {
            nivel += 1;
        } else if c == '}' || c == ']' {
            nivel -= 1;
            if nivel == 0 {
                let trozo: String = bytes[..=i].iter().collect();
                if serde_json::from_str::<serde_json::Value>(&trozo).is_ok() {
                    return Some(trozo);
                }
                return None;
            }
        }
        i += 1;
    }
    None
}

fn encontrar(pajar: &[u8], aguja: &[u8], desde: usize) -> Option<usize> {
    if aguja.is_empty() || pajar.len() < aguja.len() {
        return None;
    }
    (desde..=pajar.len() - aguja.len()).find(|&i| &pajar[i..i + aguja.len()] == aguja)
}

/// Busca los datos del lanzador en el perfil del navegador y los devuelve SIN escribirlos.
#[tauri::command]
fn migrar_desde_lanzador() -> Migracion {
    const CLAVE: &str = "mimo-limpio-v1";
    let perfil = perfil_del_lanzador();
    let mut buscado = vec![perfil.display().to_string()];

    if !perfil.is_dir() {
        return Migracion {
            encontrado: false,
            origen: None,
            datos: None,
            motivo: Some("no hay una instalacion anterior del lanzador".into()),
            buscado,
        };
    }

    // Los datos viven en el almacenamiento local del PERFIL DE USUARIO. Chromium puede tener
    // varios ("Default", "Profile 1"...), asi que se recorren todos los que aparezcan.
    let mut candidatos: Vec<PathBuf> = Vec::new();
    let mut pilas = vec![perfil.clone()];
    while let Some(d) = pilas.pop() {
        let Ok(entradas) = fs::read_dir(&d) else { continue };
        for e in entradas.flatten() {
            let p = e.path();
            if p.is_dir() {
                let nombre = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
                if nombre == "Local Storage" {
                    candidatos.push(p);
                } else if nombre != "Cache" && nombre != "Code Cache"
                    && nombre != "Service Worker" && nombre != "GPUCache" {
                    // No se baja por las caches: no hay datos de la app ahi.
                    pilas.push(p);
                }
            }
        }
    }

    for carpeta in &candidatos {
        // El fichero de escritura actual y los compactados: se miran todos, por si acaso.
        let mut ficheros: Vec<PathBuf> = Vec::new();
        if let Ok(entradas) = fs::read_dir(carpeta) {
            for e in entradas.flatten() {
                let p = e.path();
                if p.is_file() {
                    ficheros.push(p);
                } else if p.is_dir() {
                    if let Ok(hijos) = fs::read_dir(&p) {
                        for h in hijos.flatten() {
                            if h.path().is_file() {
                                ficheros.push(h.path());
                            }
                        }
                    }
                }
            }
        }
        // El log mas reciente primero: es donde Chromium escribe lo ultimo.
        ficheros.sort();
        ficheros.reverse();
        for f in &ficheros {
            buscado.push(format!(
                "{} ({} bytes)",
                f.display(),
                fs::metadata(f).map(|m| m.len()).unwrap_or(0)
            ));
        }
        for f in ficheros {
            let Ok(bytes) = fs::read(&f) else { continue };
            if let Some(datos) = extraer_datos(&bytes, CLAVE) {
                buscado.push(f.display().to_string());
                return Migracion {
                    encontrado: true,
                    origen: Some(f.display().to_string()),
                    datos: Some(datos),
                    motivo: None,
                    buscado,
                };
            }
        }
        buscado.push(carpeta.display().to_string());
    }

    Migracion {
        encontrado: false,
        origen: None,
        datos: None,
        motivo: Some("la instalacion anterior no tenia datos guardados".into()),
        buscado,
    }
}

/// Recibe el informe de la sonda de verificacion y lo deja en disco. Solo se registra para medir.
#[tauri::command]
fn sonda_informe(payload: String) {
    let _ = fs::write("/tmp/tauri-real/informe-tauri.json", &payload);
    println!("__MIMO_INFORME__{}", payload);
    std::process::exit(0);
}

/// Sonda de verificacion. Solo corre cuando se pide con la variable MIMO_SONDA=1: en el uso
/// normal no se ejecuta nada de esto. Sirve para medir el motor dentro de la ventana real.
fn lanzar_sonda(app: &tauri::AppHandle) {
    if std::env::var("MIMO_SONDA").as_deref() != Ok("1") {
        return;
    }
    use tauri::Manager;
    let app = app.clone();
    std::thread::spawn(move || {
        // Se le da tiempo a la app a arrancar (la sonda mide despues del `load`).
        std::thread::sleep(std::time::Duration::from_millis(8000));
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.eval(GUION_SONDA);
        }
        // Si en 60 s no llego el informe, se avisa y se sale con error.
        std::thread::sleep(std::time::Duration::from_millis(60000));
        let _ = fs::write(
            "/tmp/tauri-real/informe-tauri.json",
            "{\"error\":\"la sonda no respondio\"}",
        );
        std::process::exit(2);
    });
}

/// El guion que se evalua DENTRO de la ventana. Mide lo mismo que la medicion del motor, para
/// poder comparar, y devuelve el resultado por el comando `sonda_informe`.
const GUION_SONDA: &str = r#"
(function () {
  function sonda() {
    var r = {};
    r.origen = location.origin;
    r.protocolo = location.protocol;
    r.hostname = location.hostname;
    r.motor = (navigator.userAgent.match(/AppleWebKit\/[0-9.]+/) || ['?'])[0];
    r.titulo = document.title;
    r.tauri = !!window.__TAURI__;
    r.tauri_fs = !!(window.__TAURI__ && window.__TAURI__.fs);
    r.tauri_dialog = !!(window.__TAURI__ && window.__TAURI__.dialog);
    r.tauri_path = !!(window.__TAURI__ && window.__TAURI__.path);

    r.apis = {
      showDirectoryPicker: typeof window.showDirectoryPicker,
      indexedDB: typeof window.indexedDB,
      localStorage: typeof window.localStorage,
      crypto_subtle: (window.crypto && typeof window.crypto.subtle) || 'no'
    };
    r.css_color_mix = CSS.supports('color', 'color-mix(in srgb, red 50%, blue)');
    r.css_has = (function () {
      try {
        var s = document.createElement('style');
        s.textContent = '#__x:has(span){background-color:rgb(1,2,3)}';
        document.head.appendChild(s);
        var d = document.createElement('div');
        d.id = '__x'; d.style.cssText = 'display:block;width:8px;height:8px';
        d.appendChild(document.createElement('span'));
        document.body.appendChild(d);
        var ok = window.getComputedStyle(d).backgroundColor === 'rgb(1, 2, 3)';
        d.parentNode.removeChild(d); s.parentNode.removeChild(s);
        return ok;
      } catch (e) { return false; }
    })();

    // La app, con la misma vara que la prueba de PWA.
    r.app_titulo = document.title;
    r.app_navs = document.querySelectorAll('.nav[data-seccion]').length;
    r.app_guardar = typeof window.guardar;
    r.app_hojas = document.styleSheets.length;
    r.app_errores = window.__errorCount === undefined ? null : window.__errorCount;
    var m = document.querySelector('.marco');
    if (m) { var b = m.getBoundingClientRect(); r.marco = { w: Math.round(b.width), h: Math.round(b.height) }; }
    r.localStorage_n = localStorage.length;
    var claves = [];
    for (var i = 0; i < localStorage.length; i++) claves.push(localStorage.key(i));
    r.claves = claves;

    // Estado REAL de la migracion: si el modulo cargo, si cree que ya migro y por que no lo hizo.
    r.modulos = {
      enTauri: typeof enTauri,
      migrarDesdeLanzador: typeof migrarDesdeLanzador,
      yaMigrado: (typeof yaMigrado === 'function') ? yaMigrado() : 'sin funcion',
      initRespaldoCarpeta: typeof initRespaldoCarpeta,
    };
    r.migracion_js = (typeof MIGRACION !== 'undefined')
      ? { motivo: MIGRACION.motivo, origen: MIGRACION.origen }
      : 'MIGRACION no definida';

    // Los datos MIGRADOS, no solo el hallazgo: se comprueba que la app los ve.
    try {
      var limpio = localStorage.getItem('mimo-limpio-v1');
      r.datos_migrados_largo = limpio ? limpio.length : 0;
      if (limpio) {
        var E = JSON.parse(limpio);
        r.datos_migrados_marca = E.marca_de_prueba;
        r.datos_migrados_version = E.version;
        r.datos_migrados_acentos = E.acentos;
        r.datos_migrados_tema = E.formato && E.formato.tema;
      }
      r.marca_de_migracion = localStorage.getItem('mimo-migrado-desde-lanzador');
      r.seccion_actual = localStorage.getItem('mimo-seccion-actual');
    } catch (e) { r.datos_error = String(e); }

    // Se le pregunta al comando nativo QUE encontro y donde miro: asi el fallo se diagnostica
    // por el dato, no por suposicion.
    return JSON.stringify(r);
  }
  function enviar() {
    var t = window.__TAURI__;
    var inv = t && ((t.core && t.core.invoke) || t.invoke);
    sonda();
    inv('migrar_desde_lanzador', {}).then(function (m) {
      var r = JSON.parse(sonda());
      r.migracion = { encontrado: m.encontrado, motivo: m.motivo, origen: m.origen,
                      largo_datos: m.datos ? m.datos.length : 0,
                      buscado: (m.buscado || []).slice(0, 6),
                      cabeza: m.datos ? m.datos.slice(0, 90) : null };
      inv('sonda_informe', { payload: JSON.stringify(r) });
    }).catch(function (e) {
      var r = JSON.parse(sonda());
      r.migracion = { error: String(e) };
      inv('sonda_informe', { payload: JSON.stringify(r) });
    });
  }
  window.__errorJS = null; window.__errorCount = 0;
  window.addEventListener('error', function (e) {
    window.__errorCount++;
    window.__errorJS = (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || 0);
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    window.__errorCount++;
    window.__errorJS = 'promesa rechazada: ' + ((e.reason && e.reason.message) || String(e.reason));
  });
  setTimeout(enviar, 4000);
})();
"#;

/// Abre una URL con el navegador del sistema. La usa el boton de version: en Linux (donde la app
/// no puede instalar paquetes con privilegios sola) y en la version de navegador, lleva a la
/// pagina del release. Solo se admite http/https: la pagina es la nuestra, pero no cuesta nada
/// cerrar la puerta a que alguien pida abrir otra cosa.
#[tauri::command]
fn abrir_url(url: String) {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return;
    }
    abrir_con_el_sistema(&url);
}

/// Abre un fichero con el programa que le toque. En Windows es lo que hace que el instalador
/// recien bajado se ejecute sin que el usuario tenga que ir a buscarlo a la carpeta.
#[tauri::command]
fn abrir_archivo(ruta: String) {
    if !std::path::Path::new(&ruta).is_file() {
        return;
    }
    abrir_con_el_sistema(&ruta);
}

/// Lanza el programa del sistema que abre `objetivo`, que puede ser una URL o una ruta.
///   Windows -> `cmd /C start "" <objetivo>` (las comillas vacias son el titulo de la ventana;
///              sin ellas, `start` se comeria la ruta como titulo si lleva espacios)
///   macOS   -> `open`
///   Linux   -> `xdg-open`
fn abrir_con_el_sistema(objetivo: &str) {
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", objetivo])
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(objetivo).spawn();
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open").arg(objetivo).spawn();
    }
}

fn main() {
    // Parche de RENDIMIENTO/PESTANEO para Linux con WebKitGTK (el webview de Tauri en Linux).
    // Documentado por Tauri (https://v2.tauri.app/develop/debug/linux-graphics/): el renderizador
    // DMA-BUF de WebKitGTK y los drivers de GPU (sobre todo NVIDIA) no se ponen de acuerdo, y
    // salen pantallas en blanco, pestaneo (sobre todo al animar o redimensionar) o cierres con
    // "Error 71" en Wayland. La solucion ordenada, de menos a mas agresiva:
    //   1. nvidia_drm.modeset=1 (es del sistema, no se toca aqui)
    //   2. __NV_DISABLE_EXPLICIT_SYNC=1  -> arregla el Error 71 de Wayland SIN perder rendimiento
    //   3. WEBKIT_DISABLE_DMABUF_RENDERER=1 -> arregla el pestaneo, a cambio de la via mas rapida
    //   4. WEBKIT_DISABLE_COMPOSITING_MODE=1 -> ultimo recurso (desactiva la composicion acelerada)
    // Aqui se pone la 2, que es la que arregla el pestaneo sin coste de rendimiento. A PROPOSITO
    // NO se fuerza la 3 ni la 4: la propia Tauri avisa de que desactivarian la via rapida para
    // TODO EL MUNDO, tambien para quien no tiene el problema. Si en algun equipo hace falta mas,
    // se arranca con la variable puesta a mano; ver docs/comun/plan-mimo.md.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("__NV_DISABLE_EXPLICIT_SYNC").is_none() {
            std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![migrar_desde_lanzador, sonda_informe, abrir_url, abrir_archivo])
        .setup(|app| {
            lanzar_sonda(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error arrancando Mimo Academics");
}
