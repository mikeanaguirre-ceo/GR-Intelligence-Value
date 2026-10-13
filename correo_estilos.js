// GR Intelligence: estilos de los correos del motor. FUENTE UNICA.
// Lo usan el portal (vista previa) y MOTOR - Correo con marca (base) (envio real); el nodo de n8n se genera
// de este archivo con scripts/generar_vestir.py. No editar el nodo a mano.
// Entrada: cfg (claves marca_* de la compania), p ({etiqueta, html, asunto, prueba}), estilo ('A' | 'B' | 'C').
// El cuerpo usa marcas semanticas; aqui se les da forma segun el estilo:
//   <p data-titular> <p data-nota> <p data-alerta> <h3>
//   <span data-st="bad|warn|ok">Atender hoy</span>
//   <table data-kpis><tr><td data-kpi><b data-n>16</b><span data-l>Abiertas</span></td>...
//   <table data-tabla><tr><th>..</th></tr><tr><td>..</td></tr></table>
//   <div data-caja="neutro|marca|alerta|oscuro"><div data-t>Titulo</div>contenido</div>
//   <a data-btn href="..">  <a data-btn2 href="..">
//   <span data-area="#30f0cf"> o <span data-area="2"> (color secundario numero 2 de la compania)
(function (raiz) {
  var ESTILOS = {
    A: { nombre: 'Franja', descripcion: 'Logo sobre blanco y franja del color principal con el título. Sobrio y claro.' },
    B: { nombre: 'Color', descripcion: 'Encabezado de color principal y cifras con los colores secundarios. El más vivo.' },
    C: { nombre: 'Ejecutivo', descripcion: 'Encabezado oscuro con barra de colores secundarios. Elegante para reportes.' }
  };
  function mezcla(hex, a) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; var f = function (c) { return Math.round(c + (255 - c) * (1 - a)).toString(16).padStart(2, '0'); }; return '#' + f(r) + f(g) + f(b); }
  function luz(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  function hx(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function vestir(cfg, p, estilo) {
    estilo = ESTILOS[estilo] ? estilo : 'A';
    var Y = cfg.marca_color_primario, K = cfg.marca_color_oscuro, F = String(cfg.marca_fuente_interna || 'Arial, sans-serif').replace(/"/g, "'");
    var SEC = String(cfg.marca_colores_secundarios || '').split(/[,\s]+/).filter(function (c) { return /^#[0-9a-fA-F]{6}$/.test(c); });
    if (!SEC.length) SEC = [mezcla(Y, 0.7), mezcla(K, 0.6)];
    var GRIS = '#5c5c5c', LINEA = '#e5e5e5', FONDO = '#f4f4f1';
    var sobre = function (hex) { return luz(hex) > 0.6 ? K : '#ffffff'; };
    var sobreY = sobre(Y);
    var sec = function (i) { return SEC[i % SEC.length]; };
    var areaColor = function (v) { return /^#/.test(v) ? v : sec(Math.max(0, parseInt(v, 10) - 1) || 0); };
    var ST = { bad: ['#fbe4e2', '#b3261e', '&#9632;'], warn: ['#fff1cc', '#8a5a00', '&#9670;'], ok: ['#e6f3e7', '#2e7d32', '&#9679;'] };
    var kpi = 0, h3 = 0;
    // Piezas que cambian segun el estilo.
    var kpiFondo = function (i) {
      if (estilo === 'A') return [Y, mezcla(Y, 0.45), mezcla(Y, 0.18), mezcla(Y, 0.18)][Math.min(i, 3)];
      if (estilo === 'B') return mezcla(sec(i), 0.28);
      return '#ffffff';
    };
    var kpiBorde = function (i) { return estilo === 'C' ? 'border-top:5px solid ' + sec(i) + ';box-shadow:0 1px 0 ' + LINEA + ' inset,0 0 0 1px ' + LINEA + ' inset;' : ''; };
    var h3Estilo = function (i) {
      if (estilo === 'A') return 'border-left:6px solid ' + Y + ';padding-left:10px';
      if (estilo === 'B') return 'border-left:6px solid ' + sec(i) + ';padding-left:10px';
      return 'border-bottom:3px solid ' + Y + ';padding-bottom:6px';
    };
    var th = estilo === 'B' ? 'background:' + Y + ';color:' + sobreY : 'background:' + K + ';color:' + (luz(Y) > 0.35 ? Y : '#ffffff');
    var cajaFondo = function (k) { return k === 'marca' ? (estilo === 'B' ? mezcla(sec(0), 0.18) : mezcla(Y, 0.18)) : '#ffffff'; };
    var cajaBorde = function (k) { return { neutro: '#bdbdb8', marca: estilo === 'B' ? sec(0) : Y, alerta: '#b3261e', oscuro: K }[k]; };
    var b = String(p.html || '')
      .replace(/<p data-titular>/g, '<p style="font-size:17px;line-height:1.4;font-weight:700;margin:0 0 14px;color:' + K + '">')
      .replace(/<p data-nota>/g, '<p style="font-size:12.5px;color:' + GRIS + ';margin:12px 0">')
      .replace(/<p data-alerta>/g, '<p style="font-size:14px;color:#b3261e;margin:12px 0">')
      .replace(/<h3>/g, function () { return '<h3 style="font-size:14px;margin:26px 0 10px;color:' + K + ';text-transform:uppercase;letter-spacing:.05em;' + h3Estilo(h3++) + '">'; })
      .replace(/<span data-st="(bad|warn|ok)">/g, function (m, k) { return '<span style="display:inline-block;background:' + ST[k][0] + ';color:' + ST[k][1] + ';font-weight:700;font-size:12px;line-height:18px;padding:1px 8px;border-radius:4px;white-space:nowrap">' + ST[k][2] + ' '; })
      .replace(/<span data-area="(#[0-9a-fA-F]{6}|\d{1,2})">/g, function (m, v) { var c = areaColor(v); return '<span style="display:inline-block;font-size:11.5px;font-weight:700;padding:2px 10px;border-radius:99px;background:' + c + ';color:' + sobre(c) + ';white-space:nowrap">'; })
      .replace(/<table data-kpis>/g, '<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;margin:0 0 8px">')
      .replace(/<td data-kpi>/g, function () { var i = kpi++, f = kpiFondo(i); return '<td style="background:' + f + ';color:' + sobre(f) + ';' + kpiBorde(i) + 'border-radius:8px;padding:12px 14px;vertical-align:top">'; })
      .replace(/<b data-n>/g, '<b style="display:block;font-size:24px;line-height:1.15;color:inherit">')
      .replace(/<span data-l>/g, '<span style="font-size:12px;color:inherit">')
      .replace(/<table data-tabla>/g, '<table cellpadding="7" style="border-collapse:collapse;font-size:13.5px;width:100%">')
      .replace(/<th>/g, '<th align="left" style="' + th + ';font-size:11.5px;text-transform:uppercase;letter-spacing:.04em">')
      .replace(/<td>/g, '<td style="border-bottom:1px solid ' + LINEA + ';vertical-align:top">')
      .replace(/<div data-caja="(neutro|marca|alerta|oscuro)">/g, function (m, k) { return '<div style="border:1px solid ' + (k === 'marca' ? cajaBorde(k) : LINEA) + ';border-left:6px solid ' + cajaBorde(k) + ';border-radius:6px;padding:12px 14px;margin:12px 0;font-size:14px;line-height:1.5;background:' + cajaFondo(k) + '">'; })
      .replace(/<div data-t>/g, '<div style="font-size:11.5px;color:' + GRIS + ';text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">')
      .replace(/<a data-btn href=/g, '<a style="display:inline-block;background:' + Y + ';color:' + sobreY + ';font-weight:700;text-decoration:none;padding:10px 18px;border-radius:6px" href=')
      .replace(/<a data-btn2 href=/g, '<a style="display:inline-block;background:' + K + ';color:#ffffff;font-weight:700;text-decoration:none;padding:10px 18px;border-radius:6px" href=');
    var etiqueta = hx(p.etiqueta || 'Aviso');
    var logo = '<img src="' + hx(cfg.marca_logo_url) + '" alt="' + hx(cfg.marca_nombre) + '" width="140" style="display:block;width:140px;height:auto;border:0">';
    var barra = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + SEC.slice(0, 10).map(function (c) { return '<td style="background:' + c + ';height:6px;font-size:0;line-height:0">&nbsp;</td>'; }).join('') + '</tr></table>';
    var cabeza;
    if (estilo === 'A') cabeza = '<tr><td style="padding:16px 24px">' + logo + '</td></tr>'
      + '<tr><td style="background:' + Y + ';padding:12px 24px;font-size:18px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:' + sobreY + '">' + etiqueta + '</td></tr>';
    else if (estilo === 'B') cabeza = '<tr><td style="background:' + Y + ';padding:18px 24px">'
      + '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#ffffff;border-radius:8px;padding:8px 12px">' + logo + '</td></tr></table>'
      + '<div style="font-size:24px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;color:' + sobreY + ';margin-top:14px">' + etiqueta + '</div></td></tr>'
      + '<tr><td>' + barra + '</td></tr>';
    else cabeza = '<tr><td style="background:' + K + ';padding:16px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
      + '<td style="width:160px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#ffffff;border-radius:6px;padding:6px 10px">' + logo + '</td></tr></table></td>'
      + '<td align="right" style="font-size:16px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#ffffff">' + etiqueta + '</td></tr></table></td></tr>'
      + '<tr><td style="background:' + Y + ';height:4px;font-size:0;line-height:0">&nbsp;</td></tr><tr><td>' + barra + '</td></tr>';
    var pie = estilo === 'B'
      ? '<tr><td style="background:' + mezcla(Y, 0.18) + ';color:' + K + ';padding:14px 24px;font-size:11.5px;line-height:1.5">' + hx(cfg.marca_pie) + '<br><span style="color:' + GRIS + '">Aviso interno del motor comercial. No se reenvia a prospectos.</span></td></tr>'
      : '<tr><td style="background:' + K + ';color:#d8d8d2;padding:14px 24px;font-size:11.5px;line-height:1.5">' + hx(cfg.marca_pie) + '<br><span style="color:#9a9a94">Aviso interno del motor comercial. No se reenvia a prospectos.</span></td></tr>';
    var html = '<div style="background:' + FONDO + ';padding:20px 10px;font-family:' + F + ';color:' + K + '">'
      + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;background:#ffffff;border-collapse:collapse">'
      + cabeza + '<tr><td style="padding:22px 24px;font-size:14px;line-height:1.55;color:' + K + '">' + b + '</td></tr>' + pie + '</table></div>';
    var asunto = (p.prueba === true ? '[PRUEBA] ' : '') + (cfg.marca_prefijo_asunto || '') + ' ' + String(p.asunto || '').trim();
    return { html: html, asunto: asunto.trim(), remitente: cfg.marca_remitente_interno };
  }
  // Estilo elegido para un tipo de correo (clave marca_estilos: {"tipo":"A|B|C"}). Sin eleccion: A.
  function estiloDe(cfg, tipo) {
    var e = {}; try { e = JSON.parse(cfg.marca_estilos || '{}'); } catch (x) { e = {}; }
    return ESTILOS[e[tipo]] ? e[tipo] : (ESTILOS[e['*']] ? e['*'] : 'A');
  }
  var api = { ESTILOS: ESTILOS, vestir: vestir, estiloDe: estiloDe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.CorreoEstilos = api;
})(typeof window !== 'undefined' ? window : this);
