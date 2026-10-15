// GR Intelligence: piezas comunes de los portales (alta y compania).
// Entrada con Google, llamada a la API del motor, marca de la compania, vista previa por grupos y pedir cambios.
(function () {
  var API = 'https://mikea.app.n8n.cloud/webhook/motor-portal-api';
  var CLIENT_ID = '984882033131-fc761rdsqc65vks90b4mt0sfhbkj1gbl.apps.googleusercontent.com';
  var P = {};
  // Paginas de una compania (<html class="esperando-marca">): el encabezado se muestra hasta tener su marca,
  // para que nadie vea un instante otra marca. Si la marca no llega, se muestra igual a los 12 s.
  P.revelar = function () { document.documentElement.classList.remove('esperando-marca'); };
  setTimeout(function () { P.revelar(); }, 12000);
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
    P.revelar();
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
    return fetch('/tipos_correo.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (c) { P.catalogo = c; return c; });
  };
  var ESTADO = { opera: ['Opera hoy', 'aplicado'], construir: ['Por construir', 'pendiente'], distinto: ['Opera distinto', 'descartado'] };
  // Como esta hoy cada tipo en esta compania: nativo = sale con el formato propio de su motor (motor=propio);
  // si no, sale del motor comun con el diseno guardado (A si no hay eleccion).
  P.elegidos = function (d) { try { var e = JSON.parse(d.marca_estilos || '{}'); return e && typeof e === 'object' ? e : {}; } catch (x) { return {}; } };
  P.estadoTipo = function (c, t) {
    var est = t.estado[c.tenant] || t.estado.MOTOR, opera = est !== 'construir', nativo = opera && c.datos.motor === 'propio' && !t.siempre_comun;
    var guardado = P.elegidos(c.datos)[t.id], hoy = nativo ? 'actual' : (['A', 'B', 'C'].indexOf(guardado) >= 0 ? guardado : 'A');
    return { est: est, opera: opera, nativo: nativo, hoy: hoy, sel: nativo ? (guardado || 'actual') : hoy };
  };
  P.vistaPrevia = function (c, actuales, editable) {
    var grupos = [], html = '';
    (P.catalogo || []).forEach(function (t) { if (grupos.indexOf(t.objetivo) < 0) grupos.push(t.objetivo); });
    html += '<p class="nota" style="margin:0"><b>Qué cambia y qué no.</b> El diseño solo cambia cómo se ve el correo: encabezado, colores, cajas y botones. La redacción, las secciones, el orden y los datos de cada correo se quedan igual. Para dejar un correo como está, deja marcada la opción que dice «Así sale hoy».'
      + (c.datos.motor === 'propio' ? ' ' + P.h(c.datos.marca_nombre) + ' envía hoy con el formato de su propio motor («Actual»); un diseño A, B o C aplica cuando ese correo pase al motor común.' : '') + '</p>';
    grupos.forEach(function (g) {
      var tipos = P.catalogo.filter(function (t) { return t.objetivo === g; }), nombre = tipos[0].objetivo_nombre, sec = 'Vista previa · ' + nombre;
      html += '<div class="grupo" data-grupo="' + P.h(g) + '"><div class="grupo-h"><h3>' + P.h(nombre) + '</h3><small>' + tipos.length + (tipos.length === 1 ? ' tipo de correo' : ' tipos de correo') + '</small></div>';
      tipos.forEach(function (t) {
        var e = P.estadoTipo(c, t), chip = ESTADO[e.est] || ESTADO.construir, real = actuales && actuales[t.id];
        var nota = e.nativo ? 'Hoy sale con su formato propio.' : (e.opera ? 'Hoy sale con la opción ' + e.hoy + '.' : 'Aún no se envía: nacerá con la opción que elijas.');
        html += '<div class="tipo" data-tipo="' + P.h(t.id) + '" data-hoy="' + e.sel + '"><div class="tipo-h"><b>' + P.h(t.nombre) + '</b><span class="chip ' + chip[1] + '">' + chip[0] + '</span><small>' + P.h(t.cuando) + '</small></div>'
          + '<p class="vacio" style="margin:0 0 6px">' + P.h(nota) + ' ' + P.h(t.diferencia) + (real && !e.nativo ? ' <a href="#" data-ver-actual="' + P.h(t.id) + '">Ver el correo real de hoy</a>' : '') + '</p><div class="muestras">';
        var opcion = function (v, titulo, desc, marco, ver) {
          var hoy = v === e.hoy && e.opera;
          return '<label class="muestra opcion' + (e.sel === v ? ' elegida' : '') + '"><div class="mh"><span><input type="radio" name="op-' + P.h(t.id) + '" value="' + v + '"' + (e.sel === v ? ' checked' : '') + (editable ? '' : ' disabled') + '> <b>' + titulo + '</b>' + (hoy ? '<span class="chip aplicado">Así sale hoy</span>' : '') + '</span><small>' + desc + '</small></div><div class="marco">' + marco + '</div>' + ver + '</label>';
        };
        if (e.nativo) html += opcion('actual', 'Actual · formato propio', 'Sigue saliendo como hoy, sin cambios.',
          real ? '<iframe sandbox="" loading="lazy" title="Actual" data-actual="' + P.h(t.id) + '"></iframe>' : '<p class="vacio" style="padding:12px">Sin ejemplo guardado. Sigue saliendo igual que hoy.</p>',
          real ? '<button type="button" data-ver-actual="' + P.h(t.id) + '">Ver completo</button>' : '');
        ['A', 'B', 'C'].forEach(function (v) {
          var info = window.CorreoEstilos.ESTILOS[v];
          html += opcion(v, 'Opción ' + v + ' · ' + P.h(info.nombre), P.h(info.descripcion), '<iframe sandbox="" loading="lazy" title="Opción ' + v + '" data-op="' + P.h(t.id) + ':' + v + '"></iframe>', '<button type="button" data-ver-op="' + P.h(t.id) + ':' + v + '">Ver completo</button>');
        });
        html += '</div></div>';
      });
      if (editable) html += '<div class="pie-sec"><button class="p" data-guardar-diseno="' + P.h(g) + '">Guardar diseño de ' + P.h(nombre) + '</button><button class="s" data-deshacer-diseno="' + P.h(g) + '">Deshacer</button><span class="msg" id="md-' + P.h(g) + '"></span></div>';
      html += P.pedir('g-' + g, sec, 'Ej.: en estos correos usa el logo a color y más espacio entre secciones') + P.solicitudes(c.solicitudes, sec) + '</div>';
    });
    return html;
  };
  P.ejemplo = function (c, t) { return (t.ejemplos && t.ejemplos[c.tenant]) || t.ejemplo; };
  P.llenarVistaPrevia = function (c, actuales) {
    var porTipo = {}; (P.catalogo || []).forEach(function (t) { porTipo[t.id] = t; });
    var render = function (id, e) { var t = porTipo[id], x = P.ejemplo(c, t); return window.CorreoEstilos.vestir(c.datos, { etiqueta: t.etiqueta, html: x.html, asunto: x.asunto }, e).html; };
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-op]'), function (f) { var x = f.getAttribute('data-op').split(':'); f.srcdoc = render(x[0], x[1]); });
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-actual]'), function (f) { var a = actuales[f.getAttribute('data-actual')]; if (a) f.srcdoc = a.html; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ver-op]'), function (b) { b.onclick = function (ev) { ev.preventDefault(); var x = b.getAttribute('data-ver-op').split(':'); P.abrirHtml(render(x[0], x[1])); }; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ver-actual]'), function (b) { b.onclick = function (ev) { ev.preventDefault(); var a = actuales[b.getAttribute('data-ver-actual')]; if (a) P.abrirHtml(a.html); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.opcion input[type=radio]'), function (r) { r.onchange = function () { P.marcarOpcion(r); }; });
  };
  P.marcarOpcion = function (r) { var caja = r.closest('.muestras'); Array.prototype.forEach.call(caja.querySelectorAll('.opcion'), function (o) { o.classList.toggle('elegida', o.contains(r)); }); };
  // Elecciones de un grupo, mezcladas con las que ya estaban guardadas. «Actual» no se guarda: es no cambiar.
  P.disenoDeGrupo = function (c, g) {
    var e = P.elegidos(c.datos);
    Array.prototype.forEach.call(document.querySelectorAll('[data-grupo="' + g + '"] input[type=radio]:checked'), function (r) { var id = r.name.replace(/^op-/, ''); if (r.value === 'actual') delete e[id]; else e[id] = r.value; });
    return JSON.stringify(e);
  };
  // Deshacer un grupo: vuelve a marcar lo que esta guardado.
  P.deshacerGrupo = function (c, g) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-grupo="' + g + '"] .tipo'), function (div) {
      var t = (P.catalogo || []).filter(function (x) { return x.id === div.getAttribute('data-tipo'); })[0]; if (!t) return;
      var r = div.querySelector('input[value="' + P.estadoTipo(c, t).sel + '"]'); if (r) { r.checked = true; P.marcarOpcion(r); }
    });
  };
  P.abrirHtml = function (html) { if (!/<meta[^>]+charset/i.test(html.slice(0, 2000))) html = '<meta charset="utf-8">' + html; window.open(URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })), '_blank'); };
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
  // Para que sirve cada campo: se muestra al pasar el cursor o al tocar el signo «?».
  P.AYUDA = {
    crm: 'El sistema donde viven las oportunidades y contactos de la compañía (HubSpot, Zoho...).',
    motor: 'Motor común: sus correos salen de este motor con el diseño que se elige aquí. Motor propio: la compañía tiene su motor y sus correos salen con su formato hasta que pasen al común.',
    motor_propio: 'Dónde corren hoy sus avisos y con qué herramientas. Es una descripción para el equipo.',
    marca_diferencias_manual: 'Lo que hoy usan sus correos contra lo que pide su manual de identidad, y lo que ya se decidió.',
    operacion_actual: 'Quiénes participan y cómo trabaja hoy el equipo comercial.',
    sitio_web: 'Sitio público de la compañía. Sirve de referencia para la marca.',
    marca_manual_url: 'Liga al manual de identidad en Drive. De ahí salen colores, tipografía y reglas.',
    marca_logos_carpeta: 'Carpeta de Drive con los logos y archivos de marca.',
    marca_vitrina_url: 'Documento que compara su manual contra los correos reales. Es de consulta.',
    marca_nombre: 'Nombre que aparece en los correos y en el portal.',
    marca_logo_url: 'Dirección pública (https) de la imagen del logo. Va en el encabezado de cada correo.',
    marca_color_primario: 'Color principal: franjas, encabezados y botones de los correos.',
    marca_color_oscuro: 'Color del texto y del pie de los correos.',
    marca_colores_secundarios: 'Colores de apoyo: cifras, áreas y barras de los diseños B y C. El orden importa: el primero se usa más.',
    marca_fuente_interna: 'Tipografía de los avisos internos. Si el correo no la tiene, usa la siguiente de la lista.',
    marca_pie: 'Texto al final de cada aviso.',
    marca_remitente_interno: 'Nombre con el que llegan los avisos a la bandeja.',
    marca_prefijo_asunto: 'Texto que va al inicio del asunto para reconocer los avisos, por ejemplo [IT Institute].',
    aviso_fallas_correos: 'Quién recibe el aviso cuando un proceso del motor falla y hay que revisarlo.',
    llaves_avisar_a: 'Quién recibe el aviso cuando alguien de la compañía conecta una cuenta nueva al motor (su correo, CRM o Amplemarket) desde su liga de conexiones.',
    portal_nombre: 'Nombre que ve la compañía arriba de su portal.',
    portal_admins: 'Quien administra el portal de la compañía. Recibe la invitación y entra con su cuenta de Google.',
    usuarios_max: 'Cuántas personas pueden usar el portal, contando a la administradora. Lo puedes subir cuando lo necesiten.',
    modo: 'Prueba: lo que crea el motor se marca como prueba. Real: opera en firme.',
    portal_usuarios: 'Correos de Google de quienes pueden entrar al portal de la compañía.',
    tablero_url: 'Liga del tablero del pipeline de la compañía. Si usa su propio tablero, pega aquí su liga; si no, se usa el tablero del motor común.',
    invitacion: 'Correo para que la persona dé de alta su Google (correo, calendario y Drive) con un clic, sin entrar al portal. Si ya lo dio de alta, el correo se lo dice. También se la puede enviar quien administra a sí mismo.',
    google: 'Correo, calendario y Drive de la persona. Con eso el motor envía las minutas y seguimientos desde su correo y lee sus reuniones y notas. Cada quien conecta el suyo al entrar al portal.'
  };
  P.ayuda = function (k) { var t = P.AYUDA[k]; return t ? ' <span class="ayuda" tabindex="0" role="note" aria-label="' + P.h(t) + '" data-ayuda="' + P.h(t) + '">?</span>' : ''; };
  // Mejoras contra el manual (clave marca_mejoras): cada una con sus cambios de configuracion y un boton para aplicarla o revertirla.
  P.mejoras = function (d) { try { var m = JSON.parse(d.marca_mejoras || '[]'); return Array.isArray(m) ? m : []; } catch (x) { return []; } };
  P.listaMejoras = function (c, editable) {
    var ms = P.mejoras(c.datos);
    if (!ms.length) return '<p class="vacio">Sin mejoras pendientes contra el manual.</p>';
    return '<div class="mejoras">' + ms.map(function (m, i) {
      var tiene = m.cambios && Object.keys(m.cambios).length;
      var accion = !editable ? '' : (!tiene ? '<small>Se resuelve al elegir diseño en la vista previa.</small>' : '<button class="' + (m.aplicada ? 's' : 'p') + '" data-mejora="' + i + '">' + (m.aplicada ? 'Revertir' : 'Aplicar') + '</button>');
      return '<div class="mejora"><span class="chip ' + (m.aplicada ? 'aplicado' : 'pendiente') + '">' + (m.aplicada ? 'Aplicada' : 'Posible') + '</span><span>' + P.h(m.texto) + '</span>' + accion + '</div>';
    }).join('') + '</div>';
  };
  // Marca de la compania de la ruta (/<clave>/...) antes de iniciar sesion: nombre, logo y colores publicos.
  P.claveDeRuta = function () { return ((/^\/([a-z0-9]+)\//.exec(location.pathname) || [])[1] || (/[?&]c=([A-Za-z0-9]+)/.exec(location.search) || [])[1] || '').toUpperCase(); };
  P.marcaPublica = function (titulo, bajada) {
    var t = P.claveDeRuta(); if (!t) return Promise.resolve(null);
    return P.api({ accion: 'marca', tenant: t }).then(function (d) {
      var m = d && d.marca; if (!m) { P.revelar(); return null; }
      P.aplicarMarca({ marca_nombre: m.nombre, portal_nombre: m.portal, marca_logo_url: m.logo, marca_color_primario: m.primario, marca_color_oscuro: m.oscuro, marca_fuente_interna: m.fuente }, (titulo || '').replace('{nombre}', m.nombre), bajada);
      document.title = (titulo || m.nombre).replace('{nombre}', m.nombre);
      return m;
    }).catch(function () { P.revelar(); return null; });
  };
  P.correos = function (v) { return String(v || '').split(/[,;\s]+/).filter(Boolean); };
  window.GRP = P;
})();
