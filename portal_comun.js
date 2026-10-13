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
  // Vista previa: todos los tipos de correo del catalogo (tipos_correo.json), cada uno con sus 3 disenos
  // (correo_estilos.js, el mismo codigo que viste los envios reales) y el correo actual cuando ya existe.
  P.catalogo = null;
  P.cargarCatalogo = function () {
    if (P.catalogo) return Promise.resolve(P.catalogo);
    return fetch('tipos_correo.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) { P.catalogo = c; return c; });
  };
  var ESTADO = { opera: ['Opera hoy', 'aplicado'], construir: ['Por construir', 'pendiente'], distinto: ['Opera distinto', 'descartado'] };
  P.vistaPrevia = function (c, actuales, editable) {
    var d = c.datos, elegidos = {}; try { elegidos = JSON.parse(d.marca_estilos || '{}'); } catch (e) { elegidos = {}; }
    var esGR = c.tenant === 'GR', grupos = [], html = '';
    (P.catalogo || []).forEach(function (t) { if (grupos.indexOf(t.objetivo) < 0) grupos.push(t.objetivo); });
    if (esGR) html += '<p class="nota" style="margin:0">Great Revenue envía hoy con su formato propio (la opción «Actual»). Lo que elijas aquí aplica cuando GR pase al motor común.</p>';
    grupos.forEach(function (g) {
      var tipos = P.catalogo.filter(function (t) { return t.objetivo === g; }), nombre = tipos[0].objetivo_nombre, sec = 'Vista previa · ' + nombre;
      html += '<div class="grupo" data-grupo="' + P.h(g) + '"><div class="grupo-h"><h3>' + P.h(nombre) + '</h3><small>' + tipos.length + (tipos.length === 1 ? ' tipo de correo' : ' tipos de correo') + '</small></div>';
      tipos.forEach(function (t) {
        var est = ESTADO[esGR ? t.estado.GR : t.estado.MOTOR] || ESTADO.construir, sel = elegidos[t.id] || 'A';
        html += '<div class="tipo"><div class="tipo-h"><b>' + P.h(t.nombre) + '</b><span class="chip ' + est[1] + '">' + est[0] + '</span><small>' + P.h(t.cuando) + '</small></div><p class="vacio" style="margin:0 0 6px">' + P.h(t.diferencia) + '</p><div class="muestras">';
        if (actuales && actuales[t.id]) html += '<div class="muestra"><div class="mh"><b>Actual</b><small>Como sale hoy</small></div><div class="marco"><iframe sandbox="" loading="lazy" title="Actual" data-actual="' + P.h(t.id) + '"></iframe></div><button data-ver-actual="' + P.h(t.id) + '">Ver completo</button></div>';
        ['A', 'B', 'C'].forEach(function (e) {
          var info = window.CorreoEstilos.ESTILOS[e];
          html += '<label class="muestra opcion' + (sel === e ? ' elegida' : '') + '"><div class="mh"><span><input type="radio" name="op-' + P.h(t.id) + '" value="' + e + '"' + (sel === e ? ' checked' : '') + (editable ? '' : ' disabled') + '> <b>Opción ' + e + ' · ' + P.h(info.nombre) + '</b></span><small>' + P.h(info.descripcion) + '</small></div><div class="marco"><iframe sandbox="" loading="lazy" title="Opción ' + e + '" data-op="' + P.h(t.id) + ':' + e + '"></iframe></div><button type="button" data-ver-op="' + P.h(t.id) + ':' + e + '">Ver completo</button></label>';
        });
        html += '</div></div>';
      });
      if (editable) html += '<div class="pie-sec"><button class="p" data-guardar-diseno="' + P.h(g) + '">Guardar diseño de ' + P.h(nombre) + '</button><span class="msg" id="md-' + P.h(g) + '"></span></div>';
      html += P.pedir('g-' + g, sec, 'Ej.: en estos correos usa el logo a color y más espacio entre secciones') + P.solicitudes(c.solicitudes, sec) + '</div>';
    });
    return html;
  };
  P.llenarVistaPrevia = function (c, actuales) {
    var porTipo = {}; (P.catalogo || []).forEach(function (t) { porTipo[t.id] = t; });
    var render = function (id, e) { var t = porTipo[id]; return window.CorreoEstilos.vestir(c.datos, { etiqueta: t.etiqueta, html: t.ejemplo.html, asunto: t.ejemplo.asunto }, e).html; };
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-op]'), function (f) { var x = f.getAttribute('data-op').split(':'); f.srcdoc = render(x[0], x[1]); });
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-actual]'), function (f) { var a = actuales[f.getAttribute('data-actual')]; if (a) f.srcdoc = a.html; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ver-op]'), function (b) { b.onclick = function (ev) { ev.preventDefault(); var x = b.getAttribute('data-ver-op').split(':'); P.abrirHtml(render(x[0], x[1])); }; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ver-actual]'), function (b) { b.onclick = function () { var a = actuales[b.getAttribute('data-ver-actual')]; if (a) P.abrirHtml(a.html); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.opcion input[type=radio]'), function (r) { r.onchange = function () { var caja = r.closest('.muestras'); Array.prototype.forEach.call(caja.querySelectorAll('.opcion'), function (o) { o.classList.toggle('elegida', o.contains(r)); }); }; });
  };
  // Elecciones de un grupo, mezcladas con las que ya estaban guardadas.
  P.disenoDeGrupo = function (c, g) {
    var e = {}; try { e = JSON.parse(c.datos.marca_estilos || '{}'); } catch (x) { e = {}; }
    Array.prototype.forEach.call(document.querySelectorAll('[data-grupo="' + g + '"] input[type=radio]:checked'), function (r) { e[r.name.replace(/^op-/, '')] = r.value; });
    return JSON.stringify(e);
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
