// GR Intelligence: motor de alta (vE, 27-nov-2026: pedidos con preguntas antes de construir, ver motor_pedidos.js).
// vD: ronda 1 de auditoria corregida. Vista ejecutiva de las funciones de cada compania:
// - tarjetas por compania con su avance, lo que falta en corto y un boton por funcion para pedir cambios (portal de alta, solo GR);
// - el mismo detalle sin botones en la pestana Funciones del portal de cada compania.
// Todo lo calcula el motor (accion funciones o alta_funciones). Sin recarga automatica.
(function () {
  var MF = {};
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  MF.EST = { lista: ['Lista', 'mf-ok'], apagada: ['Apagada', 'mf-off'], suspendida: ['Pausada por decisión', 'mf-sus'], falta: ['Por completar', 'mf-falta'], no_aplica: ['No aplica', 'mf-na'] };
  // Pedidos abiertos (por revisar, con dudas, listos o en construccion): la funcion no muestra botones mientras tanto.
  var ABIERTOS = ['pendiente', 'por_aclarar', 'listo', 'en_construccion'];
  var abierto = function (x) { return ABIERTOS.indexOf(String(x.estado)) >= 0; };
  MF.ABIERTOS = ABIERTOS;
  MF.MODELO = { completo: 'Prospección y venta', solo_prospeccion: 'Solo prospección' };
  MF.css = function () {
    if (document.getElementById('mf-css')) return;
    var s = document.createElement('style'); s.id = 'mf-css';
    s.textContent = ''
      + '.mf-wrap [hidden],.mf-wrap[hidden]{display:none!important}' // lo oculto se oculta aunque su clase diga display (pasos, confirmaciones, formularios)
      + '.mf-wrap{display:grid;gap:16px;min-width:0}'
      + '.mf-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.mf-kpi{background:#fff;border:1px solid var(--line,#e4e4df);border-radius:12px;padding:12px 14px}.mf-kpi b{display:block;font:800 26px/1.1 var(--disp,Arial)}.mf-kpi span{font-size:14px;color:var(--g,#5f5f5a)}'
      + '.mf-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}'
      + '.mf-card{background:#fff;border:1px solid var(--line,#e4e4df);border-radius:14px;padding:16px;display:grid;gap:10px;text-align:left;font:inherit;color:inherit;cursor:pointer;transition:box-shadow .15s,border-color .15s}.mf-card:hover{border-color:var(--osc,#111);box-shadow:0 4px 14px rgba(0,0,0,.06)}'
      + '.mf-card h3{font:800 17px/1.2 var(--disp,Arial);margin:0}.mf-sub{font-size:14px;color:var(--g,#5f5f5a)}'
      + '.mf-bar{height:8px;background:#eee;border-radius:99px;overflow:hidden}.mf-bar i{display:block;height:100%;background:#22a55a;border-radius:99px}'
      + '.mf-pct{display:flex;justify-content:space-between;align-items:baseline;font-size:14px}.mf-pct b{font:800 22px var(--disp,Arial)}'
      + '.mf-mini{display:flex;flex-wrap:wrap;gap:6px}.mf-chip{display:inline-block;font-size:14px;font-weight:700;border-radius:999px;padding:3px 9px;white-space:nowrap}'
      + '.mf-ok{background:#e6f6ec;color:#17723a}.mf-off{background:#eef0f3;color:#4b5563}.mf-sus{background:#f3e8ff;color:#6b21a8}.mf-falta{background:#fff4e0;color:#9a5b00}.mf-na{background:#f3f3f3;color:#555}.mf-azul{background:#e8f1ff;color:#1d4ed8}.mf-curso{background:#eef2ff;color:#3730a3}'
      + '.mf-box{background:#fff;border:1px solid var(--line,#e4e4df);border-radius:14px;padding:16px;display:grid;gap:10px;min-width:0}'
      + '.mf-box h2{margin:0}.mf-dos{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:760px){.mf-dos{grid-template-columns:1fr}}'
      + '.mf-col{background:#fafaf8;border-radius:10px;padding:12px}.mf-col h4{margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.04em}.mf-col ul{margin:0;padding-left:18px;font-size:14px;display:grid;gap:3px}'
      + '.mf-volver{background:none;border:0;padding:0;min-height:40px;font:inherit;font-size:14px;cursor:pointer;color:var(--g,#5f5f5a)}.mf-volver:hover{color:var(--osc,#111)}'
      + '.mf-mod{border:1px solid var(--line,#e4e4df);border-radius:12px;background:#fff;overflow:hidden}.mf-mod>summary{cursor:pointer;padding:12px 14px;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:10px}.mf-mod>summary::-webkit-details-marker{display:none}'
      + '.mf-mod>summary b{font-size:15px}.mf-mod[open]>summary{border-bottom:1px solid #eee}.mf-mod .mf-in{padding:4px 14px 12px}.mf-para{font-size:14px;color:var(--g,#5f5f5a);margin:8px 0}'
      + '.mf-req{font-size:14px;margin:4px 0 8px;padding:8px 10px;background:#fafaf8;border-radius:8px}.mf-req ul{margin:4px 0 0 18px;padding:0}'
      + '.mf-fn{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:start;padding:10px 0;border-top:1px solid #f0f0f0}.mf-fn:first-of-type{border-top:0}'
      + '.mf-dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-top:5px}.mf-dot.mf-ok{background:#22a55a}.mf-dot.mf-off{background:#9ca3af}.mf-dot.mf-sus{background:#a855f7}.mf-dot.mf-falta{background:#f59e0b}.mf-dot.mf-na{background:#d4d4d4}'
      + '.mf-fn .t{font-weight:600;font-size:14px}.mf-fn .d{font-size:14px;color:var(--g,#5f5f5a)}.mf-fn .q{font-size:14px;color:#9a5b00;margin-top:2px}'
      + '.mf-btn{min-height:40px;border:1px solid var(--osc,#111);background:#fff;color:var(--osc,#111);border-radius:8px;padding:6px 12px;font:600 14px var(--body,Arial);cursor:pointer;white-space:nowrap}.mf-btn.p{background:var(--osc,#111);color:#fff}.mf-btn:disabled{opacity:.5;cursor:default}'
      + '.mf-acc{display:flex;flex-direction:column;align-items:flex-end}@media(max-width:560px){.mf-fn{grid-template-columns:auto 1fr}.mf-acc{grid-column:2;flex-direction:row;flex-wrap:wrap;align-items:center}.mf-acc .mf-btn{margin:4px 6px 0 0!important}}'
      + '.mf-link{background:none;border:0;padding:0;min-height:40px;color:#1d4ed8;font:inherit;font-size:14px;cursor:pointer;text-decoration:underline}'
      + '.mf-pz{grid-column:2/4;margin:4px 0 0;padding:8px 10px;background:#fafaf8;border-radius:8px;list-style:none;font-size:14px;display:grid;gap:4px}'
      + '.mf-conf{grid-column:2/4;display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px}.mf-conf input{flex:1;min-width:180px;border:1px solid #ddd;border-radius:8px;padding:6px 8px;font:inherit;font-size:14px}.mf-msg{font-size:14px;color:var(--g,#5f5f5a)}'
      + '.mf-tabs{display:flex;gap:6px;flex-wrap:wrap}.mf-tabs button{min-height:40px;border:1px solid #ddd;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:14px;cursor:pointer}.mf-tabs button.on{background:var(--osc,#111);color:#fff;border-color:var(--osc,#111)}'
      + '.mf-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #eee;border-radius:10px}.mf-tabla{width:100%;border-collapse:collapse;font-size:14px;background:#fff}.mf-tabla th,.mf-tabla td{border-bottom:1px solid #f0f0f0;padding:6px 8px;text-align:left}.mf-tabla th{font-size:14px;background:#fafaf8}.mf-tabla td.c,.mf-tabla th.c{text-align:center}.mf-modrow td{background:#f6f6f4;font-weight:700}'
      + '.mf-ped{display:grid;gap:6px;margin:0;padding:0;list-style:none;font-size:14px}.mf-ped li{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}'
      + '.mf-sim{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-weight:800;font-size:14px}'
      + '.mf-okline{display:flex;gap:8px;align-items:center;font-size:14px}.mf-vacio{font-size:14px;color:var(--g,#5f5f5a)}';
    document.head.appendChild(s);
  };
  MF.chip = function (e, txt) { var x = MF.EST[e] || [e, 'mf-na']; return '<span class="mf-chip ' + x[1] + '">' + h(txt || x[0]) + '</span>'; };
  // Avance: funciones listas sobre las que le aplican (sin contar las que no aplican).
  MF.avance = function (cu) { cu = cu || {}; var ap = (cu.lista || 0) + (cu.falta || 0) + (cu.apagada || 0); // las pausadas por decision no cuentan
    return { listas: cu.lista || 0, aplican: ap, pct: ap ? Math.round(100 * (cu.lista || 0) / ap) : 0 }; };
  MF.barra = function (cu) { var a = MF.avance(cu); return '<div class="mf-pct"><span><b>' + a.pct + '%</b> listo</span><span class="mf-sub">' + a.listas + ' de ' + a.aplican + (a.aplican === 1 ? ' función' : ' funciones') + ((cu || {}).suspendida ? ' · ' + cu.suspendida + ' pausada' + (cu.suspendida > 1 ? 's' : '') + ' por decisión' : '') + '</span></div><div class="mf-bar"><i style="width:' + a.pct + '%"></i></div>'; };
  var tipo = function (c) { return c.fuente === 'servicio_sdr' ? 'Servicio de prospección de GR' : (MF.MODELO[c.modelo] || c.modelo); };
  // Lo que falta, en corto: lo que da la compania (datos y conexiones) y lo que construye o enciende GR.
  MF.pendientes = function (c) {
    var cli = [], gr = [], enc = [], otros = [], vistos = {};
    var llave = function (x) { return x.k || x.texto; };
    (c.modulos || []).forEach(function (m) {
      (m.requisitos || []).forEach(function (q) { if (q.ok === false && !vistos[llave(q)]) { vistos[llave(q)] = 1; (q.quien === 'GR' ? otros : cli).push(q.texto); } });
      (m.funciones || []).forEach(function (f) {
        (f.faltan || []).forEach(function (x) { if (x.quien !== 'GR' && !vistos[llave(x)]) { vistos[llave(x)] = 1; cli.push(x.texto); } });
        if (f.estado === 'suspendida' || f.estado === 'no_aplica') return;
        if ((f.faltan || []).some(function (x) { return x.quien === 'GR'; }) || (f.piezas || []).some(function (p) { return p.estado === 'falta'; })) gr.push(f.nombre);
        else if ((f.piezas || []).some(function (p) { return p.estado === 'apagada'; })) enc.push(f.nombre);
      });
    });
    return { cliente: cli, construir: gr.concat(otros), encender: enc };
  };
  MF.tarjetas = function (cs, pedidos) {
    return '<div class="mf-cards">' + cs.map(function (c) {
      var p = MF.pendientes(c), mis = (pedidos || []).filter(function (x) { return x.tenant === c.tenant && abierto(x); }), np = mis.length, nd = mis.filter(function (x) { return x.estado === 'por_aclarar'; }).length;
      var mini = [];
      if (p.construir.length) mini.push('<span class="mf-chip mf-falta">' + p.construir.length + ' por construir</span>');
      if (p.encender.length) mini.push('<span class="mf-chip mf-off">' + p.encender.length + ' por encender</span>');
      if (p.cliente.length) mini.push('<span class="mf-chip mf-azul">' + p.cliente.length + (p.cliente.length > 1 ? ' datos' : ' dato') + ' de la compañía</span>');
      if (nd) mini.push('<span class="mf-chip mf-falta">' + nd + (nd > 1 ? ' pedidos con dudas' : ' pedido con dudas') + '</span>');
      if (np - nd) mini.push('<span class="mf-chip mf-curso">' + (np - nd) + (np - nd > 1 ? ' pedidos en curso' : ' pedido en curso') + '</span>');
      if (!mini.length) mini.push('<span class="mf-chip mf-ok">Completa</span>');
      return '<button class="mf-card" data-mf-cia="' + h(c.tenant) + '"><div><h3>' + h(c.nombre) + '</h3><div class="mf-sub">' + h(tipo(c)) + (c.crm ? ' · ' + h(c.crm) : '') + '</div></div>' + MF.barra(c.cuenta) + '<div class="mf-mini">' + mini.join('') + '</div></button>';
    }).join('') + '</div>';
  };
  var ACCIONES = { lista: [['apagar', 'Apagar'], ['quitar', 'Quitar']], apagada: [['encender', 'Encender'], ['quitar', 'Quitar']], suspendida: [['reanudar', 'Reanudar']], falta: [['completar', 'Completar'], ['quitar', 'Quitar']], no_aplica: [['agregar', 'Agregar']] };
  // Detalle de una compania. op: { pedir: bool, pedidos: [...], abiertos: {modulo: true} }
  MF.detalle = function (c, op) {
    op = op || {};
    var pend = {}; (op.pedidos || []).forEach(function (p) { if (p.tenant === c.tenant && abierto(p)) { var m = /\[funcion=([a-z0-9_]+)\]\s*$/.exec(p.instruccion || ''); if (m && !pend[m[1]]) pend[m[1]] = p; } /* el mas reciente: vienen del mas nuevo al mas viejo */ });
    var p = MF.pendientes(c);
    var lst = function (xs, vacio) { return xs.length ? '<ul>' + xs.map(function (x) { return '<li>' + h(x) + '</li>'; }).join('') + '</ul>' : '<p class="mf-vacio" style="margin:0">' + vacio + '</p>'; };
    var resumen = '<div class="mf-box"><div>' + MF.barra(c.cuenta) + '</div>'
      + (c.nota ? '<p class="mf-vacio" style="margin:0">' + h(c.nota) + '</p>' : '')
      + '<div class="mf-dos"><div class="mf-col"><h4>Lo da la compañía</h4>' + lst(p.cliente, 'Nada pendiente.') + '</div>'
      + '<div class="mf-col"><h4>Lo hace Great Revenue</h4>' + (p.construir.length ? '<p class="mf-sub" style="margin:0 0 4px">Construir</p>' + lst(p.construir, '') : '') + (p.encender.length ? '<p class="mf-sub" style="margin:6px 0 4px">Encender</p>' + lst(p.encender, '') : '') + (!p.construir.length && !p.encender.length ? lst([], 'Nada pendiente.') : '') + '</div></div></div>';
    var mods = (c.modulos || []).map(function (m) {
      var fs = m.funciones || [], ap = fs.filter(function (f) { return f.estado !== 'no_aplica'; }), ok = ap.filter(function (f) { return f.estado === 'lista'; });
      var cab = m.estado === 'no_aplica' ? MF.chip('no_aplica') : '<span class="mf-sub">' + ok.length + ' de ' + ap.length + '</span>' + (ok.length === ap.length ? MF.chip('lista') : '');
      var req = (m.requisitos || []).length ? '<div class="mf-req"><b>Para activar este módulo</b><ul>' + m.requisitos.map(function (q) { return '<li>' + (q.ok === true ? '✓ ' : q.ok === false ? '✗ ' : '') + h(q.texto) + '</li>'; }).join('') + '</ul></div>' : '';
      var filas = fs.map(function (f) {
        var e = MF.EST[f.estado] || ['', 'mf-na'], pd = pend[f.id];
        var q = (f.faltan || []).map(function (x) { return x.texto; });
        var accion = '';
        if (op.pedir) accion = pd ? (window.MP ? window.MP.chip(pd.estado) : '<span class="mf-chip mf-sus">Pedido</span>') : (f.fija ? [] : (ACCIONES[f.estado] || [])).map(function (a, i) { return '<button class="mf-btn" style="margin:0 0 4px 4px;min-height:40px" data-mf-pedir="' + h(f.id) + '" data-mf-que="' + a[0] + '">' + a[1] + '</button>'; }).join('');
        var piezas = '<ul class="mf-pz" data-mf-pz="' + h(f.id) + '" hidden>' + (f.piezas || []).map(function (z) { return '<li>' + MF.chip(z.estado) + ' ' + h(z.nombre) + (z.prestada ? ' <span class="mf-sub">· usa ' + (z.prestada === '*' ? 'la del motor común' : 'la de ' + h(z.prestada_nombre || z.prestada)) + '</span>' : '') + (z.motivo ? ' <span class="mf-sub">· ' + h(z.motivo) + '</span>' : '') + '</li>'; }).join('') + '</ul>';
        return '<div class="mf-fn"><span class="mf-dot ' + e[1] + '" title="' + h(e[0]) + '"></span><div><div class="t">' + h(f.nombre) + ' <span class="mf-sub">· ' + h(e[0]) + '</span></div><div class="d">' + h(f.resuelve) + '</div>'
          + (f.motivo ? '<div class="d">' + h(f.motivo) + '</div>' : '') + (f.nota ? '<div class="d">' + h(f.nota) + '</div>' : '') + (q.length && f.estado !== 'no_aplica' ? '<div class="q">Falta: ' + h(q.join(' · ')) + '</div>' : '')
          + (pd ? '<div class="d">Pedido el ' + h(window.MP ? window.MP.fecha(pd.fecha) : pd.fecha) + ': ' + h(String(pd.instruccion || '').replace(/\s*\[funcion=[^\]]+\]/, '').replace(/\. Nota: .*$/, '')) + (pd.estado === 'por_aclarar' ? ' · <b>tiene dudas para ti en Pedidos</b>' : '') + '</div>' : '')
          + '<button class="mf-link" data-mf-ver="' + h(f.id) + '">Ver cómo funciona</button></div><div class="mf-acc">' + accion + '</div>' + piezas
          + (op.pedir ? '<div class="mf-conf" data-mf-conf="' + h(f.id) + '" hidden></div>' : '') + '</div>';
      }).join('');
      var abierto = op.abiertos ? !!op.abiertos[m.id] : false;
      return '<details class="mf-mod" data-mf-mod="' + h(m.id) + '"' + (abierto ? ' open' : '') + '><summary><b>' + h(m.nombre) + '</b><span>' + cab + '</span></summary><div class="mf-in"><p class="mf-para">' + h(m.para_que) + '</p>' + req + filas + '</div></details>';
    }).join('');
    return '<div class="mf-wrap">' + resumen + '<div class="mf-box"><h2>Funciones por módulo</h2>' + mods + '</div></div>';
  };
  // En Comparar todas cada estado lleva su simbolo (no depende solo del color).
  var SIM = { lista: '✓', falta: '!', apagada: '○', suspendida: 'Ⅱ', no_aplica: '–' };
  MF.matriz = function (cs) {
    if (!cs.length) return '';
    var head = '<tr><th>Función</th>' + cs.map(function (c) { return '<th class="c"><button class="mf-link" data-mf-cia="' + h(c.tenant) + '">' + h(c.nombre) + '</button></th>'; }).join('') + '</tr>';
    var filas = (cs[0].modulos || []).map(function (m, i) {
      return '<tr class="mf-modrow"><td colspan="' + (cs.length + 1) + '">' + h(m.nombre) + '</td></tr>' + (m.funciones || []).map(function (f, j) {
        return '<tr><td>' + h(f.nombre) + '</td>' + cs.map(function (c) { var g = (((c.modulos || [])[i] || {}).funciones || [])[j] || {}; var e = MF.EST[g.estado] || ['', 'mf-na']; return '<td class="c" title="' + h(c.nombre + ': ' + e[0]) + '"><span class="mf-sim ' + e[1] + '" aria-label="' + h(e[0]) + '">' + (SIM[g.estado] || '·') + '</span></td>'; }).join('') + '</tr>';
      }).join('');
    }).join('');
    return '<div class="mf-scroll"><table class="mf-tabla"><thead>' + head + '</thead><tbody>' + filas + '</tbody></table></div><p class="mf-sub">' + ['lista', 'falta', 'apagada', 'suspendida', 'no_aplica'].map(function (e) { return '<span class="mf-sim ' + MF.EST[e][1] + '" style="margin-right:4px">' + SIM[e] + '</span>' + MF.EST[e][0]; }).join(' &nbsp; ') + '</p>';
  };
  // Mostrar u ocultar los pasos de una funcion (sin pedir nada al motor).
  MF.activarVer = function (raiz) {
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-mf-ver]'), function (b) {
      b.onclick = function () { var z = raiz.querySelector('[data-mf-pz="' + b.getAttribute('data-mf-ver') + '"]'); if (z) { z.hidden = !z.hidden; b.textContent = z.hidden ? 'Ver cómo funciona' : 'Ocultar'; } };
    });
  };
  window.MF = MF;
})();
