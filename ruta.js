// GR Intelligence: rutas por compania. Toda liga es intelligence.greatrevenue.com/<clave>/<pagina>:
//   /<clave>/portal   portal de la compania        /<clave>/tablero  tablero del pipeline (lleva ?t=)
//   /<clave>/marca    documento completo de marca  /<clave>/conectar alta de cuentas (Google, Zoho, Amplemarket)
//   /<clave>/whatsapp portal de conversaciones de WhatsApp (lleva ?k=; hoy solo GR)
// La pagina de cada ruta es la misma para todas las companias; esta pieza la carga sin cambiar la direccion.
(function () {
  var m = /^\/([a-z0-9]+)\/(portal|tablero|marca|conectar|whatsapp)\/?$/.exec(location.pathname);
  function cargar(url) {
    fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) { document.open(); document.write(html); document.close(); })
      .catch(function () { noEncontrada(); });
  }
  function noEncontrada() {
    document.title = 'Página no encontrada';
    document.body.innerHTML = '<main style="max-width:560px;margin:60px auto;font-family:Arial,sans-serif;padding:0 16px"><h1>Página no encontrada</h1><p>La dirección no existe. Revisa la liga que te enviaron.</p></main>';
  }
  if (!m) { noEncontrada(); return; }
  var clave = m[1], pagina = m[2];
  if (pagina === 'portal') return cargar('/compania.html');
  if (pagina === 'marca') return cargar('/marca.html');
  if (pagina === 'conectar') return cargar('/conectar.html');
  if (pagina === 'whatsapp') return cargar('/whatsapp.html');
  // Tablero: la pagina propia de la compania (la crea el alta; si la compania tiene tablero propio, esa pagina lo carga).
  return cargar('/' + clave + '.html');
})();
