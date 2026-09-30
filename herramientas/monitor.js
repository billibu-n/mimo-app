/* Monitor de Mimo: mide QUE red hace la aplicacion y QUE tan fluida va.

   Por que existe: el dueno reporto que la aplicacion le come internet sin motivo y que el
   movimiento es torpe, y la version web no. Eso hay que MEDIRLO, no suponerlo. Este monitor
   abre la aplicacion en un Chromium de verdad (por el protocolo de depuracion) y devuelve:

     1. RED  : cada peticion (local o de internet), su tipo, su tamano y su host.
     2. FLUIDEZ: tiempo de cada cuadro (frame) durante 4 s: mediana, p95, peor, fps y cuadros
        perdidos. Tambien las tareas largas, que son las que "congelan" el movimiento.
     3. CPU  : cuanto tiempo de CPU gasta la pagina por segundo (tareas, guion, estilo, dibujo).

   Uso:
     node monitor.js [ruta-al-index.html] [segundos-de-red]
   Ajuste por defecto: /projects/mimo-app/index.html y 12 s de observacion de red.
*/
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL = process.argv[2] || 'file:///projects/mimo-app/index.html';
const SEG_RED = Number(process.argv[3] || 12);

let proceso = null, puerto = null;
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function puertoLibre() {
  for (let p = 9410; p < 9500; p++) {
    try { await (await fetch('http://127.0.0.1:' + p + '/json/version')).text(); continue; }
    catch (e) { return p; }
  }
  throw new Error('sin puerto libre');
}

async function levantar() {
  puerto = await puertoLibre();
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'mon-'));
  proceso = spawn('chromium', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--allow-file-access-from-files', '--remote-debugging-port=' + puerto,
    '--user-data-dir=' + perfil, '--window-size=1600,1200', 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try { await (await fetch('http://127.0.0.1:' + puerto + '/json/version')).text(); return; }
    catch (e) { await esperar(250); }
  }
  throw new Error('el navegador no respondio');
}

function conectar(ws) {
  let id = 1;
  const pend = new Map();
  const eventos = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method) eventos.push(m);
  });
  const enviar = (method, params) => new Promise((res, rej) => {
    const mio = id++;
    const reloj = setTimeout(() => { pend.delete(mio); rej(new Error('CDP ' + method)); }, 60000);
    pend.set(mio, m => { clearTimeout(reloj); res(m); });
    ws.send(JSON.stringify({ id: mio, method, params: params || {} }));
  });
  return { enviar, eventos };
}

(async () => {
  try {
    await levantar();
    const lista = await (await fetch('http://127.0.0.1:' + puerto + '/json/new?' + encodeURIComponent(URL),
                                     { method: 'PUT' })).json();
    const ws = new WebSocket(lista.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
    const { enviar, eventos } = conectar(ws);

    await enviar('Network.enable');
    await enviar('Page.enable');
    await enviar('Performance.enable');
    await enviar('Runtime.enable');

    // Mientras se observa la red, se recorren las pestanas: asi tambien se cazan las peticiones
    // que solo salen AL INTERACTUAR (que es lo que sospecha el usuario).
    await enviar('Runtime.evaluate', { expression: `(function(){
      const navs = [...document.querySelectorAll('button.nav[data-seccion]')];
      navs.forEach((b,i) => setTimeout(() => b.click(), 400 + i*700));
    })()`, returnByValue: true });

    // ---- 1. RED: se observa durante SEG_RED segundos ----
    await esperar(SEG_RED * 1000);

    const peticiones = new Map();   // requestId -> {url, tipo, bytes, estado, cache}
    for (const ev of eventos) {
      const p = ev.params || {};
      if (ev.method === 'Network.requestWillBeSent') {
        peticiones.set(p.requestId, { url: p.request.url, tipo: p.type, bytes: 0, estado: null, cache: false });
      } else if (ev.method === 'Network.responseReceived') {
        const it = peticiones.get(p.requestId); if (it) { it.estado = p.response.status; it.mime = p.response.mimeType; }
      } else if (ev.method === 'Network.loadingFinished') {
        const it = peticiones.get(p.requestId); if (it) it.bytes = p.encodedDataLength || 0;
      }
    }
    // Peticiones que salen a INTERNET (no locales: file://, data:, blob:, tauri:, 127.0.0.1).
    const esLocal = u => /^(file:|data:|blob:|tauri:|chrome-extension:|about:)/.test(u) ||
                         /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:|\/|$)/.test(u);
    const todas = [...peticiones.values()];
    const internet = todas.filter(x => !esLocal(x.url));

    // ---- 2. FLUIDEZ: se mide dentro de la pagina ----
    const exprFrames = `(async () => {
      const deltas = []; let last = performance.now(); const t0 = last;
      await new Promise(res => {
        function tick(t){ deltas.push(t - last); last = t;
          if (performance.now() - t0 < 4000) requestAnimationFrame(tick); else res(); }
        requestAnimationFrame(tick);
      });
      deltas.shift();
      const n = deltas.length, orden = deltas.slice().sort((a,b) => a-b);
      const seg = (performance.now() - t0) / 1000;
      return JSON.stringify({
        n, fps: +(n/seg).toFixed(1),
        med: +orden[Math.floor(n*0.5)].toFixed(1),
        p95: +orden[Math.floor(n*0.95)].toFixed(1),
        peor: +Math.max.apply(null, deltas).toFixed(1),
        perdidos: deltas.filter(d => d > 33.4).length,
        congelados: deltas.filter(d => d > 100).length,
      });
    })()`;
    const rFrames = await enviar('Runtime.evaluate', { expression: exprFrames, returnByValue: true, awaitPromise: true });
    const frames = JSON.parse((rFrames.result && rFrames.result.result.value) || '{}');

    // ---- 3. CPU: diferencia de metricas en 5 s ----
    const m1 = await enviar('Performance.getMetrics');
    await esperar(5000);
    const m2 = await enviar('Performance.getMetrics');
    const val = (m, n) => { const x = (m.result.metrics || []).find(k => k.name === n); return x ? x.value : 0; };
    const cpu = {
      tareas: +(val(m2,'TaskDuration') - val(m1,'TaskDuration')).toFixed(2),
      guion:  +(val(m2,'ScriptDuration') - val(m1,'ScriptDuration')).toFixed(2),
      estilo: +(val(m2,'RecalcStyleDuration') - val(m1,'RecalcStyleDuration')).toFixed(2),
      dibujo: +(val(m2,'LayoutDuration') - val(m1,'LayoutDuration')).toFixed(2),
    };

    // ---- informe ----
    console.log('=== MONITOR DE MIMO ===');
    console.log('pagina: ' + URL + '   (red observada ' + SEG_RED + ' s, fluidez 4 s, CPU 5 s)\\n');

    console.log('--- RED ---');
    console.log('  peticiones totales: ' + todas.length + '   a INTERNET: ' + internet.length);
    const porHost = {};
    for (const x of internet) {
      let h = '?'; try { h = new URL(x.url).host; } catch (e) {}
      porHost[h] = porHost[h] || { n: 0, bytes: 0 };
      porHost[h].n++; porHost[h].bytes += x.bytes;
    }
    for (const h of Object.keys(porHost)) {
      console.log('    ' + h.padEnd(28) + porHost[h].n + ' peticiones, ' + (porHost[h].bytes/1024).toFixed(1) + ' KB');
    }
    if (!internet.length) console.log('    (ninguna: la aplicacion NO toco internet en esta ventana)');
    for (const x of internet.slice(0, 12)) {
      console.log('    - ' + (x.tipo||'').padEnd(8) + ' ' + ((x.bytes/1024).toFixed(1)+'KB').padStart(9) + '  ' + x.url.slice(0, 90));
    }

    console.log('\\n--- FLUIDEZ (cuadros) ---');
    console.log('  cuadros: ' + frames.n + '   fps: ' + frames.fps);
    console.log('  mediana: ' + frames.med + ' ms   p95: ' + frames.p95 + ' ms   peor: ' + frames.peor + ' ms');
    console.log('  perdidos (>33 ms): ' + frames.perdidos + '   congelados (>100 ms): ' + frames.congelados);

    console.log('\\n--- CPU de la pagina (por 5 s) ---');
    console.log('  tareas: ' + cpu.tareas + ' s   guion: ' + cpu.guion + ' s   estilo: ' + cpu.estilo + ' s   dibujo: ' + cpu.dibujo + ' s');

    ws.close();
  } catch (e) {
    console.log('MONITOR: no pudo correr: ' + e.message);
  } finally {
    if (proceso) proceso.kill('SIGKILL');
  }
})();
