// GR Intelligence: alta de cuentas (Google, Zoho, Amplemarket) desde el sitio, con la marca de cada compania.
// La persona solo ve intelligence.greatrevenue.com/<clave>/conectar y /conectar/regreso; el motor trabaja por detras.
(function () {
  var MOTOR = 'https://mikea.app.n8n.cloud/webhook/';
  var P = window.GRP, $ = P.$, h = P.h;
  var q = new URLSearchParams(location.search);
  function marca(m) {
    if (!m || !m.nombre) return;
    P.aplicarMarca({ marca_nombre: m.nombre, portal_nombre: m.nombre, marca_logo_url: m.logo, marca_color_primario: m.primario, marca_color_oscuro: m.oscuro, marca_fuente_interna: m.fuente }, m.nombre, '');
    document.title = m.nombre;
  }
  function tarjeta(html) { $('panel').innerHTML = '<div class="card conectar">' + html + '</div>'; }
  function error(t, m, volver) { tarjeta('<p data-titular class="mal">' + h(t || 'No se pudo conectar') + '</p><p>' + h(m || 'Intenta de nuevo en unos minutos.') + '</p>' + (volver ? '<div class="acciones"><a class="p" href="' + h(volver) + '">Volver al portal</a></div>' : '')); }
  function pedir(ruta, params) {
    params.set('modo', 'json');
    return fetch(MOTOR + ruta + '?' + params.toString(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { return JSON.parse(t); });
  }
  // Paso 1: /<clave>/conectar?s=google&p=... -> pide al motor la liga oficial del servicio y lleva a la persona alla.
  P.conectarIr = function (clave) {
    var s = q.get('s') || 'google';
    $('bajada').textContent = s === 'google' ? 'Alta de tu correo, calendario y Drive' : 'Alta de ' + (s === 'zoho' ? 'Zoho CRM' : 'Amplemarket');
    tarjeta('<p data-titular>Te llevamos a la página oficial de ' + (s === 'google' ? 'Google' : s === 'zoho' ? 'Zoho' : 'Amplemarket') + '...</p><p class="vacio">Ahí inicias sesión y das el permiso. Great Revenue nunca ve tu contraseña.</p>');
    P.marcaPublica('{nombre}', $('bajada').textContent);
    var otra = q.get('otra') === '1';
    // Otra cuenta de Zoho o Amplemarket: el servicio entra solo con la sesion que ya esta abierta en este navegador,
    // asi que primero se cierra esa sesion y despues se continua.
    var SALIR = { zoho: ['Zoho', 'https://accounts.zoho.com/logout'], amplemarket: ['Amplemarket', 'https://app.amplemarket.com'] };
    if (otra && SALIR[s] && q.get('listo') !== '1') {
      var x = SALIR[s], sigue = new URLSearchParams(location.search); sigue.set('listo', '1');
      tarjeta('<p data-titular>Conectar otra cuenta de ' + x[0] + '</p>'
        + '<p>' + x[0] + ' entra con la cuenta que ya está abierta en este navegador. Para usar otra:</p>'
        + '<ol class="altas"><li>' + (s === 'zoho' ? 'Cierra la sesión de Zoho con el botón de abajo (se abre en otra pestaña).' : 'Abre Amplemarket con el botón de abajo y cierra sesión desde tu perfil.') + '</li><li>Regresa a esta pestaña y dale «Continuar».</li><li>Inicia sesión con la otra cuenta y da el permiso.</li></ol>'
        + '<div class="acciones"><a class="s" href="' + h(x[1]) + '" target="_blank" rel="noopener">' + (s === 'zoho' ? 'Cerrar sesión de Zoho' : 'Abrir Amplemarket') + '</a><a class="p" href="?' + h(sigue.toString()) + '">Continuar</a></div>'
        + '<p class="vacio">Tip: también puedes abrir esta liga en una ventana de incógnito.</p>');
      return;
    }
    var params = new URLSearchParams({ c: clave, s: s, p: q.get('p') || '' });
    if (otra) params.set('otra', '1');
    pedir('motor-conectar-ir', params).then(function (d) {
      marca(d.marca);
      if (d.ok && d.ir) { location.replace(d.ir); return; }
      error(d.titulo, d.mensaje);
    }).catch(function () { error('No se pudo abrir', 'Revisa tu conexión e intenta de nuevo.'); });
  };
  // Paso 2: /conectar/regreso -> el servicio regresa aqui; el motor crea la conexion y aqui se muestra el resultado.
  P.conectarRegreso = function () {
    tarjeta('<p data-titular>Dando de alta tu cuenta...</p><p class="vacio">Esto toma unos segundos.</p>');
    pedir('motor-conectar-regreso', new URLSearchParams(location.search)).then(function (d) {
      marca(d.marca);
      if (d.pagina) tarjeta(d.pagina + (d.volver ? '<div class="acciones"><a class="p" href="' + h(d.volver) + '">Volver al portal</a></div>' : '<p class="vacio">Ya puedes cerrar esta ventana.</p>'));
      else error(d.titulo, d.mensaje, d.volver);
    }).catch(function () { error('No se pudo terminar', 'Vuelve a abrir la liga e intenta de nuevo.'); });
  };
})();
