// GR Intelligence: pedidos del motor de alta (vE, 27-nov-2026). Mike: «que me pida los requerimientos o las dudas antes de empezar a
// construir, las contestamos dentro del portal y despues empezamos a construir».
// - MP.formulario: al pedir una funcion, las preguntas del catalogo (las comunes del tipo de pedido y las de la funcion), los datos que
//   le faltan a la compania y las conexiones que hace en su portal, con lo obligatorio marcado y validado junto a cada campo.
// - MP.lista: los pedidos por etapa (te toca contestar, en curso, cerrados), con su avance y las dudas de Great Revenue para contestar.
// Todo se guarda en el motor (alta_pedir, alta_responder). Sin recarga automatica. Usa MF (motor_funciones.js) para estilos y chips.
// vB (ronda 1 de auditoria): preguntas de seguimiento (requerida_si), conexiones aparte, letra de 14 px, avance con texto y no solo
// color, campos con aria-required y su error ligado, una sola accion principal, fechas en palabras, colores propios por etapa,
// textos segun el tipo de pedido y aviso cuando hay mas de 50.
// vE (ronda 4): "Lo hace Great Revenue" tambien al agregar una que no aplica y al encender o reanudar.
// vD (ronda 3): "Lo hace Great Revenue" con los pasos por construir o encender; pedidos repetidos marcados.
// vC (ronda 2): Reanudar con sus preguntas y textos, "te toca contestar" solo con dudas sin respuesta, estado de hoy en el formulario.
(function () {
  var MP = {};
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  MP.EST = { pendiente: ['Por revisar', 'mp-c-rev'], por_aclarar: ['Tiene dudas para ti', 'mf-falta'], listo: ['Listo para construir', 'mf-azul'], en_construccion: ['En construcción', 'mp-c-con'], aplicado: ['Hecho', 'mf-ok'], hecho: ['Hecho', 'mf-ok'], descartado: ['Descartado', 'mp-c-des'], rechazado: ['Descartado', 'mp-c-des'] };
  MP.ABIERTOS = (window.MF && window.MF.ABIERTOS) || ['pendiente', 'por_aclarar', 'listo', 'en_construccion'];
  MP.abierto = function (p) { return MP.ABIERTOS.indexOf(String(p.estado)) >= 0; };
  // Te toca contestar: el pedido tiene dudas sin respuesta (no basta la etapa).
  MP.tocaContestar = function (p) { return p.estado === 'por_aclarar' && ((p.detalle || {}).dudas || []).some(function (q) { return !q.respuesta; }); };
  MP.chip = function (e) { var x = MP.EST[e] || [e || 'Sin estado', 'mp-c-des']; return '<span class="mf-chip ' + x[1] + '">' + h(x[0]) + '</span>'; };
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  MP.fecha = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? Number(m[3]) + ' ' + MES[Number(m[2]) - 1] + ' ' + m[1] : String(s || ''); };
  MP.css = function () {
    if (document.getElementById('mp-css')) return;
    var s = document.createElement('style'); s.id = 'mp-css';
    s.textContent = ''
      + '.mp-c-rev{background:#eef2ff;color:#3730a3}.mp-c-con{background:#e0f2f1;color:#0f5e57}.mp-c-des{background:#ececec;color:#454545}'
      + '.mp-form{grid-column:1/-1;display:grid;gap:14px;margin-top:8px;padding:14px;border:1px solid var(--osc,#111);border-radius:12px;background:#fff;font-size:14px}'
      + '.mp-form h4{margin:0;font-size:16px}.mp-intro{font-size:14px;color:var(--g,#5f5f5a);margin:0}'
      + '.mp-q{display:grid;gap:6px}.mp-q[hidden]{display:none}.mp-q>label,.mp-q>.mp-lbl{display:block;font-weight:600;font-size:15px;color:var(--ink,#111)}.mp-ob{color:#b42318;margin-left:2px}'
      + '.mp-q input[type=text],.mp-q textarea{border:1px solid #d4d4d0;border-radius:8px;padding:10px;font:inherit;font-size:15px;width:100%;box-sizing:border-box;min-height:44px}.mp-q textarea{min-height:72px;resize:vertical}'
      + '.mp-ayuda{font-size:14px;color:var(--g,#5f5f5a)}.mp-err{font-size:14px;color:#b42318;font-weight:600}.mp-q.mal input[type=text],.mp-q.mal textarea,.mp-q.mal .mp-ops{outline:2px solid #f04438;outline-offset:2px;border-radius:8px}'
      + '.mp-ops{display:flex;flex-wrap:wrap;gap:8px}.mp-ops label{position:relative;display:inline-flex;align-items:center;gap:6px;border:1px solid #d4d4d0;border-radius:999px;padding:8px 14px;font-size:15px;cursor:pointer;min-height:44px;box-sizing:border-box}'
      + '.mp-ops input{position:absolute;opacity:0;width:1px;height:1px}.mp-ops label.on{background:var(--osc,#111);color:#fff;border-color:var(--osc,#111)}.mp-ops label.on:before{content:"✓"}.mp-ops label:focus-within{outline:2px solid #1d4ed8;outline-offset:2px}'
      + '.mp-sec{font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--g,#5f5f5a);margin:4px 0 0;font-weight:700}'
      + '.mp-gr{font-size:14px;background:#fafaf8;border-radius:8px;padding:10px 12px;margin:0}.mp-gr ul{margin:4px 0 0 18px;padding:0}'
      + '.mp-pie{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.mp-pie .mf-btn{min-height:44px;padding:8px 18px;font-size:15px}.mp-msg{font-size:14px}.mp-msg.bad{color:#b42318;font-weight:600}.mp-msg.ok{color:#17723a;font-weight:600}'
      + '.mp-aviso{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:#fff4e0;border:1px solid #f5c26b;border-radius:12px;padding:12px 14px;font-size:15px}.mp-aviso .mf-btn{min-height:44px;font-size:15px;padding:8px 18px}'
      + '.mp-grupo{display:grid;gap:10px}.mp-grupo>h3{margin:4px 0 0;font-size:14px;text-transform:uppercase;letter-spacing:.04em}'
      + '.mp-ped{border:1px solid var(--line,#e4e4df);border-radius:12px;padding:12px 14px;display:grid;gap:8px;background:#fff;font-size:15px}.mp-ped.toca{border-color:#f5c26b;box-shadow:0 0 0 3px #fff4e0}'
      + '.mp-cab{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline}.mp-cab b{font-size:16px}.mp-cab .mf-sub{font-size:14px}'
      + '.mp-pasos{display:flex;gap:6px 4px;align-items:center;flex-wrap:wrap;font-size:14px;color:var(--g,#5f5f5a);margin:0;padding:0;list-style:none}.mp-pasos li{display:inline-flex;align-items:center;gap:4px}.mp-pasos li+li:before{content:"›";color:#bbb;margin-right:4px}.mp-pasos .si{color:#17723a}.mp-pasos .ya{color:#111;font-weight:700}'
      + '.mp-res{font-size:14px;margin:0;padding:0;list-style:none;display:grid;gap:6px}.mp-res span{color:var(--g,#5f5f5a)}'
      + '.mp-ped details summary{cursor:pointer;font-size:14px;color:#1d4ed8;min-height:40px;display:flex;align-items:center}.mp-mas{font-size:14px;color:var(--g,#5f5f5a);margin:0}';
    document.head.appendChild(s);
  };
  // Tipo de pedido: Completar pregunta lo de Agregar y Reanudar lo de Encender; el pedido guarda lo que se toco.
  var TIPO = { agregar: 'agregar', completar: 'agregar', quitar: 'quitar', encender: 'encender', reanudar: 'reanudar', apagar: 'apagar' };
  MP.preguntas = function (pa, f, que) { var t = TIPO[que] || que; return ((pa || {})[t] || []).concat(t === 'agregar' ? (f.preguntas || []) : []); };
  var INTRO = {
    agregar: 'Antes de construir, contesta lo que sepas. Si Great Revenue tiene más dudas, te aparecen en Pedidos; se construye cuando todo está contestado.',
    quitar: 'Antes de quitarla, dinos por qué y qué hacemos con lo que ya generó. Great Revenue lo revisa antes de tocar nada.',
    apagar: 'Antes de apagarla, dinos por qué y desde cuándo. Se puede volver a encender después.',
    encender: 'Antes de encenderla, dinos desde cuándo y si algo cambió. Great Revenue revisa que siga lista.',
    reanudar: 'Antes de reanudarla, dinos desde cuándo y si algo cambió desde que se pausó. Great Revenue revisa que siga lista.'
  };
  var campo = function (q, pref, forzarLargo) {
    var id = pref + q.id, ob = q.obligatoria ? '<span class="mp-ob" aria-hidden="true">*</span>' : '';
    var dep = q.requerida_si ? ' data-mp-si="' + h(q.requerida_si.id) + '" data-mp-si-valor="' + h(q.requerida_si.valor) + '" hidden' : '';
    var desc = [q.ayuda ? id + '-a' : '', id + '-e'].filter(Boolean).join(' ');
    var ayuda = q.ayuda ? '<span class="mp-ayuda" id="' + id + '-a">' + h(q.ayuda) + '</span>' : '';
    var err = '<span class="mp-err" id="' + id + '-e" hidden></span>';
    var req = q.obligatoria ? ' aria-required="true"' : '';
    if (q.tipo === 'opcion') return '<div class="mp-q" data-mp-q="' + h(q.id) + '" data-mp-ob="' + (q.obligatoria ? 1 : 0) + '" data-mp-tipo="opcion"' + dep + '><span class="mp-lbl" id="' + id + '-l">' + h(q.texto) + ob + '</span><div class="mp-ops" role="radiogroup" aria-labelledby="' + id + '-l" aria-describedby="' + desc + '"' + req + '>'
      + (q.opciones || []).map(function (o) { return '<label><input type="radio" name="' + id + '" value="' + h(o) + '">' + h(o) + '</label>'; }).join('') + '</div>' + ayuda + err + '</div>';
    var largo = forzarLargo || /nota|más|explica|temas|casos|especiales|depende|razón/i.test(q.id + ' ' + q.texto), max = forzarLargo ? 2000 : 1000;
    var attrs = ' id="' + id + '" maxlength="' + max + '" aria-describedby="' + desc + '"' + req;
    return '<div class="mp-q" data-mp-q="' + h(q.id) + '" data-mp-ob="' + (q.obligatoria ? 1 : 0) + '" data-mp-tipo="texto"' + dep + '><label for="' + id + '">' + h(q.texto) + ob + '</label>'
      + (largo ? '<textarea' + attrs + '></textarea>' : '<input type="text"' + attrs + '>') + ayuda + err + '</div>';
  };
  var valor = function (q) {
    if (q.getAttribute('data-mp-tipo') === 'opcion') { var r = q.querySelector('input:checked'); return r ? r.value : ''; }
    var x = q.querySelector('input,textarea'); return x ? x.value.trim() : '';
  };
  var marcar = function (q, txt) {
    var e = q.querySelector('.mp-err'); q.classList.toggle('mal', !!txt); if (e) { e.hidden = !txt; e.textContent = txt || ''; }
    Array.prototype.forEach.call(q.querySelectorAll('input[type=text],textarea,.mp-ops'), function (x) { if (txt) x.setAttribute('aria-invalid', 'true'); else x.removeAttribute('aria-invalid'); });
  };
  // Preguntas de seguimiento: visibles (y obligatorias) solo si se eligio la opcion que las pide.
  var seguir = function (raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-mp-si]'), function (q) {
      var base = raiz.querySelector('[data-mp-q="' + q.getAttribute('data-mp-si') + '"]:not([data-mp-si])');
      var on = !!base && valor(base) === q.getAttribute('data-mp-si-valor');
      q.hidden = !on; q.setAttribute('data-mp-ob', on ? '1' : '0');
      var lbl = q.querySelector('label,.mp-lbl'); if (lbl && on && !lbl.querySelector('.mp-ob')) lbl.insertAdjacentHTML('beforeend', '<span class="mp-ob" aria-hidden="true">*</span>');
      Array.prototype.forEach.call(q.querySelectorAll('input[type=text],textarea'), function (x) { if (on) x.setAttribute('aria-required', 'true'); else x.removeAttribute('aria-required'); });
      if (!on) marcar(q, '');
    });
  };
  var activarOps = function (raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('.mp-ops input'), function (i) {
      i.onchange = function () { Array.prototype.forEach.call(i.closest('.mp-ops').querySelectorAll('label'), function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); marcar(i.closest('.mp-q'), ''); seguir(raiz); };
    });
    Array.prototype.forEach.call(raiz.querySelectorAll('.mp-q input[type=text],.mp-q textarea'), function (i) { i.oninput = function () { if (i.value.trim()) marcar(i.closest('.mp-q'), ''); }; });
    seguir(raiz);
  };
  // Formulario de un pedido. o: { caja, cia (nombre), f (funcion evaluada), que, etiqueta, pa (preguntas por accion), enviar(cuerpo) -> Promise, alCancelar, alTerminar }
  MP.formulario = function (o) {
    MP.css();
    var f = o.f, qs = MP.preguntas(o.pa, f, o.que), t = TIPO[o.que] || o.que;
    var pedir = t === 'agregar' ? (f.pedir || []) : [], conectar = t === 'agregar' ? (f.conectar || []) : [];
    // Lo que hace Great Revenue: lo pendiente de la funcion y sus pasos. Agregar una que no aplica: activar todos sus pasos;
    // completar: construir lo que falta y encender lo apagado; encender o reanudar: los pasos apagados o pausados.
    var pz = f.piezas || [], gr = [];
    if (t === 'agregar') {
      gr = (f.faltan || []).filter(function (x) { return x.quien === 'GR'; }).map(function (x) { return x.texto; });
      if (f.estado === 'no_aplica') gr = gr.concat(pz.map(function (z) { return 'Activar: ' + z.nombre; }));
      else gr = gr.concat(pz.filter(function (z) { return z.estado === 'falta'; }).map(function (z) { return 'Construir: ' + z.nombre; }), pz.filter(function (z) { return z.estado === 'apagada'; }).map(function (z) { return 'Encender: ' + z.nombre; }));
    } else if (t === 'encender' || t === 'reanudar') gr = pz.filter(function (z) { return z.estado === 'apagada' || z.estado === 'suspendida'; }).map(function (z) { return (t === 'reanudar' ? 'Reanudar: ' : 'Encender: ') + z.nombre; });
    var obl = qs.some(function (q) { return q.obligatoria; });
    o.caja.className = 'mp-form'; o.caja.hidden = false; o.caja.setAttribute('role', 'form'); o.caja.setAttribute('aria-label', o.etiqueta + ' ' + f.nombre);
    o.caja.innerHTML = '<h4>' + h(o.etiqueta) + ' «' + h(f.nombre) + '» para ' + h(o.cia) + '</h4>'
      + (o.estadoHoy ? '<p class="mp-intro"><b>Hoy:</b> ' + h(o.estadoHoy) + '. Great Revenue revisa el estado al recibir el pedido.</p>' : '')
      + '<p class="mp-intro">' + h(INTRO[t] || INTRO.agregar) + (obl ? ' Lo marcado con <span class="mp-ob">*</span> es obligatorio.' : '') + '</p>'
      + (qs.length ? '<p class="mp-sec">Preguntas</p>' + qs.map(function (q) { return campo(q, 'mpq-' + f.id + '-'); }).join('') : '')
      + (pedir.length ? '<p class="mp-sec">Datos que da la compañía</p>' + pedir.map(function (x) { return campo({ id: x.k, texto: x.texto, tipo: 'texto', obligatoria: false, ayuda: x.comprobado ? 'Todavía no está en su configuración. Escríbelo si ya lo tienes; si no, déjalo vacío y se lo pedimos a la compañía.' : 'Si la compañía ya lo dio, déjalo vacío.' }, 'mpr-' + f.id + '-').replace('data-mp-q=', 'data-mp-r="1" data-mp-q='); }).join('') : '')
      + (conectar.length ? '<div class="mp-gr"><b>La compañía lo conecta en su portal</b><ul>' + conectar.map(function (x) { return '<li>' + h(x.texto) + '</li>'; }).join('') + '</ul></div>' : '')
      + (gr.length ? '<div class="mp-gr"><b>Lo hace Great Revenue</b><ul>' + gr.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul></div>' : '')
      + '<div class="mp-pie"><button class="mf-btn p" data-mp-enviar>Enviar pedido</button><button class="mf-btn" data-mp-cancelar>Cancelar</button><span class="mp-msg" role="status" aria-live="polite"></span></div>';
    activarOps(o.caja);
    var bE = o.caja.querySelector('[data-mp-enviar]'), bC = o.caja.querySelector('[data-mp-cancelar]'), msg = o.caja.querySelector('.mp-msg');
    var primero = o.caja.querySelector('input,textarea'); if (primero) primero.focus({ preventScroll: true });
    o.caja.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    bC.onclick = function () { o.caja.hidden = true; o.caja.innerHTML = ''; if (o.alCancelar) o.alCancelar(); };
    bE.onclick = function () {
      var resp = {}, req = {}, malo = null;
      seguir(o.caja);
      Array.prototype.forEach.call(o.caja.querySelectorAll('[data-mp-q]'), function (q) {
        if (q.hidden) return;
        var v = valor(q), id = q.getAttribute('data-mp-q');
        if (q.hasAttribute('data-mp-r')) { if (v) req[id] = v; return; }
        if (q.getAttribute('data-mp-ob') === '1' && !v) { marcar(q, 'Contesta esta pregunta.'); if (!malo) malo = q; return; }
        marcar(q, ''); if (v) resp[id] = v;
      });
      if (malo) { msg.className = 'mp-msg bad'; msg.textContent = 'Falta contestar lo marcado en rojo.'; malo.scrollIntoView({ block: 'center', behavior: 'smooth' }); var x = malo.querySelector('input,textarea'); if (x) x.focus({ preventScroll: true }); return; }
      bE.disabled = true; bC.disabled = true; msg.className = 'mp-msg'; msg.textContent = 'Enviando...';
      o.enviar({ respuestas: resp, requisitos: req }).then(function (r) {
        if (!r || !r.ok) {
          bE.disabled = false; bC.disabled = false; msg.className = 'mp-msg bad'; msg.textContent = (r && r.error) || 'No se pudo registrar. Intenta otra vez.';
          if (r && r.pregunta) { var q = o.caja.querySelector('[data-mp-q="' + r.pregunta + '"]:not([data-mp-r])'); if (q) { q.hidden = false; marcar(q, 'Contesta esta pregunta.'); q.scrollIntoView({ block: 'center' }); } }
          return;
        }
        msg.className = 'mp-msg ok'; msg.textContent = r.mensaje || 'Pedido registrado.';
        setTimeout(function () { if (o.alTerminar) o.alTerminar(); }, 1600);
      }, function () { bE.disabled = false; bC.disabled = false; msg.className = 'mp-msg bad'; msg.textContent = 'Sin conexión. Revisa tu internet e intenta otra vez.'; });
    };
  };
  // Avance de un pedido: cada paso dice en texto si ya paso (✓), si es el actual (●) o si falta; no depende solo del color.
  var PASOS = ['Pedido', 'Revisión', 'Tus respuestas', 'Construcción', 'Hecho'];
  var pasoDe = { pendiente: 1, por_aclarar: 2, listo: 3, en_construccion: 3, aplicado: 5, hecho: 5 };
  var pasos = function (p) {
    var n = pasoDe[p.estado]; if (n == null) return '';
    var conDudas = ((p.detalle || {}).dudas || []).length > 0 || p.estado === 'por_aclarar';
    return '<ol class="mp-pasos" aria-label="Avance del pedido">' + PASOS.map(function (x, i) {
      if (i === 2 && !conDudas) return '';
      var hecho = i < n, actual = i === n;
      return '<li class="' + (hecho ? 'si' : actual ? 'ya' : '') + '">' + (hecho ? '✓ ' : actual ? '● ' : '') + h(x) + '<span style="position:absolute;left:-9999px">' + (hecho ? ' (hecho)' : actual ? ' (paso actual)' : ' (falta)') + '</span></li>';
    }).join('') + '</ol>';
  };
  // «Encender «X» (Modulo) para Compania [funcion=x]» -> «Encender «X»» (la compania va en el encabezado de la tarjeta).
  var titulo = function (p) { return String(p.instruccion || '').replace(/\s*\[funcion=[^\]]+\]/, '').replace(/\. Nota: .*$/, '').replace(/(»)\s*\(.*$/, '$1'); };
  var resumen = function (p) {
    var d = p.detalle || {}, xs = [];
    (d.respuestas || []).forEach(function (r) { xs.push('<li><span>' + h(r.pregunta) + '</span> ' + h(r.respuesta) + '</li>'); });
    (d.requisitos || []).forEach(function (r) { xs.push('<li><span>' + h(r.texto) + ':</span> ' + h(r.respuesta) + '</li>'); });
    (d.dudas || []).filter(function (q) { return q.respuesta; }).forEach(function (q) { xs.push('<li><span>' + h(q.pregunta) + '</span> ' + h(q.respuesta) + '</li>'); });
    return xs.length ? '<details><summary>Ver lo que contestaste (' + xs.length + ')</summary><ul class="mp-res" style="margin-top:6px">' + xs.join('') + '</ul></details>' : '';
  };
  var tarjeta = function (p, nombre, principal, repetido) {
    var d = p.detalle || {}, abiertas = (d.dudas || []).filter(function (q) { return !q.respuesta; }), toca = MP.tocaContestar(p);
    var dudas = toca ? '<div data-mp-dudas="' + h(p.id) + '"><p class="mp-sec" style="margin:0 0 6px">' + (abiertas.length === 1 ? 'Great Revenue tiene 1 duda' : 'Great Revenue tiene ' + abiertas.length + ' dudas') + '</p>'
      + abiertas.map(function (q) { return campo({ id: q.id, texto: q.pregunta, tipo: 'texto', obligatoria: false, ayuda: q.ayuda || '' }, 'mpd-' + p.id + '-', true); }).join('')
      + '<div class="mp-pie" style="margin-top:8px"><button class="mf-btn' + (principal ? ' p' : '') + '" data-mp-responder="' + h(p.id) + '">Enviar respuestas</button><span class="mp-msg" role="status" aria-live="polite"></span></div></div>' : '';
    return '<div class="mp-ped' + (toca ? ' toca' : '') + '"><div class="mp-cab"><span>' + MP.chip(p.estado) + ' <b>' + h(nombre) + '</b></span><span class="mf-sub">' + h(MP.fecha(p.fecha)) + '</span></div>'
      + '<div>' + h(p.origen === 'cliente' ? 'Lo pidió la compañía: ' + (p.instruccion || '') : titulo(p)) + '</div>'
      + (repetido ? '<div class="mp-err" style="font-weight:600">Pedido repetido: ya hay otro abierto de esta función. Great Revenue descarta uno.</div>' : '')
      + (p.origen === 'cliente' ? '' : pasos(p)) + (p.respuesta ? '<div><b>Great Revenue:</b> ' + h(p.respuesta) + '</div>' : '') + dudas + resumen(p) + '</div>';
  };
  // Lista de pedidos por etapa. o: { pedidos, nombreDe(tenant) }. El primer pedido con dudas lleva la accion principal.
  MP.lista = function (o) {
    MP.css();
    var ps = o.pedidos || [];
    if (!ps.length) return '<p class="mf-vacio" style="margin:0">Aún no hay pedidos. Abre una compañía y usa el botón de cada función: antes de construir te pregunta lo necesario.</p>';
    var g = { toca: [], curso: [], cerrados: [] }, LIM = 50, vistos = {}, rep = {};
    // Dos pedidos abiertos de la misma funcion (p. ej. enviados desde dos pestanas): el mas viejo se marca como repetido.
    ps.slice().reverse().forEach(function (p) { var m = /\[funcion=([a-z0-9_]+)\]/.exec(p.instruccion || ''); if (!m || !MP.abierto(p) || p.origen === 'cliente') return; var k = p.tenant + '|' + m[1]; if (vistos[k]) rep[vistos[k]] = 1; vistos[k] = p.id; });
    ps.forEach(function (p) { (MP.tocaContestar(p) ? g.toca : MP.abierto(p) ? g.curso : g.cerrados).push(p); });
    var bloque = function (t, xs, vacio, conPrincipal) {
      return '<div class="mp-grupo"><h3>' + t + ' (' + xs.length + ')</h3>' + (xs.length ? xs.slice(0, LIM).map(function (p, i) { return tarjeta(p, o.nombreDe(p.tenant), conPrincipal && i === 0, !!rep[p.id]); }).join('') : '<p class="mf-vacio" style="margin:0">' + vacio + '</p>')
        + (xs.length > LIM ? '<p class="mp-mas">Se muestran los ' + LIM + ' más recientes de ' + xs.length + '.</p>' : '') + '</div>';
    };
    return (g.toca.length ? bloque('Te toca contestar', g.toca, '', true) : '') + bloque('En curso', g.curso, 'Nada en curso.') + (g.cerrados.length ? bloque('Cerrados', g.cerrados, '') : '');
  };
  MP.activarLista = function (raiz, o) {
    activarOps(raiz);
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-mp-responder]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-mp-responder'), caja = raiz.querySelector('[data-mp-dudas="' + id + '"]'), msg = caja.querySelector('.mp-msg'), resp = {}, n = 0;
        Array.prototype.forEach.call(caja.querySelectorAll('[data-mp-q]'), function (q) { var v = valor(q); if (v) { resp[q.getAttribute('data-mp-q')] = v; n++; } });
        if (!n) { msg.className = 'mp-msg bad'; msg.textContent = 'Escribe al menos una respuesta.'; var x = caja.querySelector('textarea,input'); if (x) x.focus(); return; }
        b.disabled = true; msg.className = 'mp-msg'; msg.textContent = 'Enviando...';
        o.responder(id, resp).then(function (r) {
          if (!r || !r.ok) { b.disabled = false; msg.className = 'mp-msg bad'; msg.textContent = (r && r.error) || 'No se pudo guardar. Intenta otra vez.'; return; }
          msg.className = 'mp-msg ok'; msg.textContent = r.mensaje || 'Guardado.'; setTimeout(function () { if (o.alTerminar) o.alTerminar(); }, 1400);
        }, function () { b.disabled = false; msg.className = 'mp-msg bad'; msg.textContent = 'Sin conexión. Revisa tu internet e intenta otra vez.'; });
      };
    });
  };
  window.MP = MP;
})();
