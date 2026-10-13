// GR Intelligence: piezas comunes de los portales (alta y compania).
// Entrada con Google, llamada a la API del motor, marca de la compania, vista previa por grupos y pedir cambios.
(function () {
  var API = 'https://mikea.app.n8n.cloud/webhook/motor-portal-api';
  var CLIENT_ID = '984882033131-fc761rdsqc65vks90b4mt0sfhbkj1gbl.apps.googleusercontent.com';
  var P = {};
  P.$ = function (id) { return document.getElementById(id); };
  P.h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  P.msg = function (id, clase, texto) { var m = P.$(id); if (m) { m.className = 'msg ' + (clase || ''); m.textContent = texto; } };
  P.color = function (v, d) { return /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d; };
  P.sesion = function (llave, valor) {
    try { if (valor === undefined) return sessionStorage.getItem(llave); if (valor) sessionStorage.setItem(llave, valor); else sessionStorage.removeItem(llave); } catch (e) { return null; }
    return valor;
  };
  P.api = function (cuerpo) {
    return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json().catch(function () { return { error: 'Respuesta no valida' }; }).then(function (d) { d._codigo = r.status; return d; }); });
  };
  P.google = function (contenedor, alEntrar, tema) {
    var intentar = function () {
      if (!window.google || !google.accounts) { setTimeout(intentar, 300); return; }
      google.accounts.id.initialize({ client_id: CLIENT_ID, callback: alEntrar, ux_mode: 'popup' });
      google.accounts.id.renderButton(P.$(contenedor), { theme: tema || 'outline', size: 'large', text: 'signin_with', locale: 'es' });
    };
    intentar();
  };
  // Marca de la compania en la barra y la franja: logo sobre blanco, color principal como superficie, nombre del cliente.
  P.aplicarMarca = function (d, titulo, bajada) {
    var r = document.documentElement.style;
    var prim = P.color(d.marca_color_primario, '#7c3aed'), osc = P.color(d.marca_color_oscuro, '#111827');
    r.setProperty('--prim', prim); r.setProperty('--osc', osc);
    if (d.marca_fuente_interna) r.setProperty('--body', d.marca_fuente_interna);
    var n = parseInt(prim.slice(1), 16), luz = ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
    P.$('banda').className = 'banda' + (luz < 140 ? ' oscura' : '');
    P.$('logo').innerHTML = d.marca_logo_url ? '<img src="' + P.h(d.marca_logo_url) + '" alt="' + P.h(d.marca_nombre) + '"><b>' + P.h(d.portal_nombre || d.marca_nombre) + '</b>' : '<b>' + P.h(d.marca_nombre) + '</b>';
    if (titulo) P.$('titulo').textContent = titulo;
    if (bajada) P.$('bajada').textContent = bajada;
  };
  P.solicitudes = function (sol, filtro) {
    var xs = (sol || []).filter(function (s) { return !filtro || String(s.seccion).indexOf(filtro) === 0; });
    if (!xs.length) return '';
    return '<ul class="sol">' + xs.map(function (s) { return '<li><span><span class="chip ' + P.h(s.estado) + '">' + P.h(s.estado) + '</span><b>' + P.h(s.seccion) + '</b> · ' + P.h(s.fecha) + (s.por ? ' · ' + P.h(s.por) : '') + '</span><span>' + P.h(s.instruccion) + '</span>' + (s.respuesta ? '<span style="color:var(--g)">Respuesta: ' + P.h(s.respuesta) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
  };
  // Recuadro de cambios de una seccion: escribe la instruccion y se registra con su seccion.
  P.pedir = function (id, seccion, ejemplo) {
    return '<div class="pedir"><label for="pi-' + id + '">Cambios para «' + P.h(seccion) + '»</label><textarea id="pi-' + id + '" data-seccion="' + P.h(seccion) + '" placeholder="' + P.h(ejemplo || 'Escribe qué quieres cambiar') + '"></textarea>'
      + '<div class="acciones"><button class="s" data-pedir="' + id + '">Enviar cambio</button><span class="msg" id="pm-' + id + '"></span></div></div>';
  };
  P.activarPedir = function (sesion, tenant, alTerminar) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-pedir]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-pedir'), t = P.$('pi-' + id), ins = t.value.trim();
        if (ins.length < 5) { P.msg('pm-' + id, 'bad', 'Escribe qué quieres cambiar.'); return; }
        b.disabled = true; P.msg('pm-' + id, '', 'Enviando...');
        P.api({ accion: 'pedir_cambio', sesion: sesion(), tenant: tenant, seccion: t.getAttribute('data-seccion'), instruccion: ins }).then(function (d) {
          b.disabled = false;
          if (!d.ok) { P.msg('pm-' + id, 'bad', d.error || 'No se pudo enviar.'); return; }
          t.value = ''; P.msg('pm-' + id, 'ok', d.mensaje || 'Recibido.'); if (alTerminar) setTimeout(alTerminar, 900);
        });
      };
    });
  };
  // Vista previa: un ejemplo real de cada tipo de correo, agrupado por objetivo, con su recuadro de cambios.
  P.muestras = function (doc, marca, sol) {
    var html = '';
    (doc.grupos || []).forEach(function (g) {
      var sec = 'Vista previa · ' + g.nombre;
      html += '<div class="grupo"><div class="grupo-h"><h3>' + P.h(g.nombre) + '</h3><small>' + (g.muestras.length ? g.muestras.length + (g.muestras.length === 1 ? ' tipo de correo' : ' tipos de correo') : 'sin envíos aún') + '</small></div>';
      html += g.muestras.length ? '<div class="muestras">' + g.muestras.map(function (m, i) {
        return '<div class="muestra"><div class="mh"><b>' + P.h(m.titulo) + '</b><small>' + P.h(m.para) + ' · ' + P.h(m.cuando) + '</small></div><div class="marco"><iframe title="' + P.h(m.titulo) + '" sandbox="" loading="lazy" data-m="' + P.h(g.id) + ':' + i + '"></iframe></div><button data-ver="' + P.h(g.id) + ':' + i + '">Ver completo</button></div>';
      }).join('') + '</div>' : '<p class="vacio">' + P.h(marca) + ' todavía no envía este tipo de correo. Cuando salga el primero aparece aquí.</p>';
      html += P.pedir('g-' + g.id, sec, 'Ej.: en este grupo usa el logo a color y sube el tamaño del título') + P.solicitudes(sol, sec) + '</div>';
    });
    return html;
  };
  P.llenarMuestras = function (doc) {
    var mapa = {};
    (doc.grupos || []).forEach(function (g) { g.muestras.forEach(function (m, i) { mapa[g.id + ':' + i] = m; }); });
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-m]'), function (f) { var m = mapa[f.getAttribute('data-m')]; if (m) f.srcdoc = m.html || '<p>Sin contenido</p>'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ver]'), function (b) {
      b.onclick = function () { var m = mapa[b.getAttribute('data-ver')]; if (m) window.open(URL.createObjectURL(new Blob([m.html], { type: 'text/html' })), '_blank'); };
    });
  };
  P.abrirHtml = function (html) { window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank'); };
  // Aviso de ejemplo con la marca (cambia en vivo cuando se edita la marca).
  P.aviso = function (d) {
    var Y = P.color(d.marca_color_primario, '#cccccc'), K = P.color(d.marca_color_oscuro, '#111111');
    var mezcla = function (hex, a) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; var f = function (c) { return Math.round(c + (255 - c) * (1 - a)).toString(16).padStart(2, '0'); }; return '#' + f(r) + f(g) + f(b); };
    return '<div class="prev" style="font-family:' + P.h(d.marca_fuente_interna || 'Calibri, Arial, sans-serif').replace(/&quot;/g, "'") + '"><div class="ptop">' + (d.marca_logo_url ? '<img src="' + P.h(d.marca_logo_url) + '" alt="">' : '<b>' + P.h(d.marca_nombre) + '</b>') + '</div>'
      + '<div class="band" style="background:' + Y + ';color:' + K + '">Resumen del pipeline</div>'
      + '<div class="body" style="color:' + K + '"><b>16 oportunidades abiertas por 628,000.</b><div class="kpis">'
      + '<div class="kpi" style="background:' + Y + '"><b>16</b>Abiertas</div><div class="kpi" style="background:' + mezcla(Y, .45) + '"><b>628,000</b>Valor</div><div class="kpi" style="background:' + mezcla(Y, .18) + '"><b>2</b>Sin atender</div></div>'
      + '<div style="font-size:12px;color:#666">Asunto: ' + P.h(d.marca_prefijo_asunto) + ' Pipeline · Remitente: ' + P.h(d.marca_remitente_interno) + '</div></div>'
      + '<div class="pie" style="background:' + K + '">' + P.h(d.marca_pie) + '</div></div>';
  };
  P.correos = function (v) { return String(v || '').split(/[,;\s]+/).filter(Boolean); };
  window.GRP = P;
})();
