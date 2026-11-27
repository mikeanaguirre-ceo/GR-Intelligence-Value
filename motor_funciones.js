// GR Intelligence: motor de alta (vB, 27-nov-2026). Pinta el arbol modulo > funcion > pieza con su estado, para:
// - la pestana Funciones del portal de cada compania (solo lectura) y
// - el portal de alta de GR (todas las companias, con botones para pedir agregar, quitar, encender o apagar).
// Sin datos propios: todo lo calcula el motor (accion funciones o alta_funciones). Sin recarga automatica.
(function () {
  var MF = {};
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  MF.EST = { lista: ['Lista', 'mf-ok'], apagada: ['Apagada', 'mf-off'], suspendida: ['Suspendida por decisión', 'mf-sus'], falta: ['Le falta algo', 'mf-falta'], no_aplica: ['No aplica', 'mf-na'] };
  MF.css = function () {
    if (document.getElementById('mf-css')) return;
    var s = document.createElement('style'); s.id = 'mf-css';
    s.textContent = '.mf-k{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.mf-k div{flex:1;min-width:92px;background:#fff;border:1px solid #e5e5e5;border-radius:10px;padding:8px 10px}.mf-k b{display:block;font-size:22px}.mf-k span{font-size:12px;color:#555}'
      + '.mf-chip{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;margin-left:6px;vertical-align:middle;white-space:nowrap}'
      + '.mf-ok{background:#e6f6ec;color:#17723a}.mf-off{background:#eef0f3;color:#4b5563}.mf-sus{background:#f3e8ff;color:#6b21a8}.mf-falta{background:#fff4e0;color:#9a5b00}.mf-na{background:#f5f5f5;color:#8a8a8a}'
      + '.mf-mod{border:1px solid #e5e5e5;border-radius:12px;background:#fff;margin:0 0 12px;overflow:hidden}.mf-mod>summary{cursor:pointer;padding:12px 14px;font-weight:700;list-style:none}.mf-mod>summary::-webkit-details-marker{display:none}'
      + '.mf-mod .mf-in{padding:0 14px 12px}.mf-para{font-size:13px;color:#555;margin:0 0 8px}.mf-req{font-size:13px;margin:6px 0 10px;padding:8px 10px;background:#fafafa;border-radius:8px}.mf-req li{margin:2px 0}'
      + '.mf-fn{border-top:1px solid #eee;padding:8px 0}.mf-fn>summary{cursor:pointer;list-style:none;font-size:14px}.mf-fn>summary::-webkit-details-marker{display:none}.mf-fn p{margin:4px 0;font-size:13px}'
      + '.mf-pz{margin:6px 0 0 0;padding:0;list-style:none;font-size:13px}.mf-pz li{padding:3px 0}.mf-falta-l{margin:4px 0 0 18px;font-size:13px}.mf-quien{color:#777;font-size:12px;margin-left:6px}'
      + '.mf-nota{font-size:12px;color:#777}.mf-acc{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}.mf-acc button{border:1px solid #ccc;background:#fff;border-radius:8px;padding:5px 10px;font:inherit;font-size:13px;cursor:pointer}.mf-acc input{flex:1;min-width:160px;border:1px solid #ddd;border-radius:8px;padding:5px 8px;font:inherit;font-size:13px}'
      + '.mf-f{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.mf-f button{border:1px solid #ddd;background:#fff;border-radius:999px;padding:5px 11px;font:inherit;font-size:13px;cursor:pointer}.mf-f button.on{background:#111;color:#fff;border-color:#111}'
      + '.mf-tabla{width:100%;border-collapse:collapse;font-size:13px;background:#fff}.mf-tabla th,.mf-tabla td{border-bottom:1px solid #eee;padding:6px 6px;text-align:left;vertical-align:top}.mf-tabla th{font-size:12px;position:sticky;top:0;background:#fff}.mf-tabla td.c{text-align:center}'
      + '.mf-dot{display:inline-block;width:12px;height:12px;border-radius:50%}.mf-dot.mf-ok{background:#22a55a}.mf-dot.mf-off{background:#9ca3af}.mf-dot.mf-sus{background:#a855f7}.mf-dot.mf-falta{background:#f59e0b}.mf-dot.mf-na{background:#e5e5e5}'
      + '.mf-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid #eee;border-radius:10px}.mf-modrow td{background:#f7f7f7;font-weight:700}';
    document.head.appendChild(s);
  };
  MF.chip = function (e) { var x = MF.EST[e] || [e, 'mf-na']; return '<span class="mf-chip ' + x[1] + '">' + h(x[0]) + '</span>'; };
  MF.resumen = function (cu) {
    cu = cu || {};
    return '<div class="mf-k">' + [['lista', 'Listas'], ['falta', 'Les falta algo'], ['apagada', 'Apagadas'], ['suspendida', 'Suspendidas'], ['no_aplica', 'No aplican']].map(function (x) { return '<div><b>' + (cu[x[0]] || 0) + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>';
  };
  var NOMBRE = { ITERA: 'IT Institute', '*': 'el motor común', GR: 'GR' };
  // Arbol de una compania. op: { filtro, pedir: function(funcion, que, nota, boton), pedidos: [...] }
  MF.arbol = function (c, op) {
    op = op || {}; var filtro = op.filtro || 'todas';
    var pend = {}; (op.pedidos || []).forEach(function (p) { if (p.tenant === c.tenant && p.estado === 'pendiente') { var m = /\[funcion=([a-z0-9_]+)\]/.exec(p.instruccion || ''); if (m) pend[m[1]] = p; } });
    return (c.modulos || []).map(function (m) {
      var fns = (m.funciones || []).filter(function (f) { return filtro === 'todas' || f.estado === filtro; });
      if (!fns.length && filtro !== 'todas') return '';
      var req = (m.requisitos || []).length ? '<div class="mf-req"><b>Para dar de alta este módulo</b><ul style="margin:4px 0 0 18px;padding:0">' + m.requisitos.map(function (q) { return '<li>' + (q.ok === true ? '✓ ' : q.ok === false ? '✗ ' : '· ') + h(q.texto) + '<span class="mf-quien">' + (q.quien === 'GR' ? 'lo da Great Revenue' : 'lo da la compañía') + (q.ok === null || q.ok === undefined ? ' · se revisa a mano' : '') + '</span></li>'; }).join('') + '</ul></div>' : '';
      var cuerpo = fns.map(function (f) {
        var piezas = '<ul class="mf-pz">' + (f.piezas || []).map(function (p) {
          var de = p.prestada ? '<span class="mf-quien">usa la de ' + h(NOMBRE[p.prestada] || p.prestada) + '</span>' : '';
          return '<li>' + h(p.nombre) + MF.chip(p.estado) + (p.a_mano ? '<span class="mf-quien">se corre con botón o a mano</span>' : '') + de + ((p.faltan || []).length ? '<div class="mf-falta-l">' + p.faltan.map(function (x) { return h(x.texto); }).join('<br>') + '</div>' : '') + (p.motivo ? '<div class="mf-nota">' + h(p.motivo) + '</div>' : '') + '</li>';
        }).join('') + '</ul>';
        var falta = (f.faltan || []).length ? '<ul class="mf-falta-l" style="padding:0">' + f.faltan.map(function (x) { return '<li>' + h(x.texto) + '<span class="mf-quien">' + (x.quien === 'GR' ? 'lo da Great Revenue' : 'lo da la compañía') + '</span></li>'; }).join('') + '</ul>' : '';
        var acc = '';
        if (op.pedir) {
          var p = pend[f.id];
          if (p) acc = '<div class="mf-acc"><span class="mf-chip mf-falta">Pedido pendiente</span><span class="mf-nota">' + h(p.instruccion.replace(/\s*\[funcion=[^\]]+\]/, '')) + ' · ' + h(p.fecha) + '</span></div>';
          else {
            var bs = f.estado === 'lista' ? [['quitar', 'Pedir que se quite'], ['apagar', 'Pedir que se apague']] : f.estado === 'apagada' || f.estado === 'suspendida' ? [['encender', 'Pedir que se encienda'], ['quitar', 'Pedir que se quite']] : [['agregar', 'Pedir que se agregue']];
            acc = '<div class="mf-acc"><input placeholder="Nota (opcional)" data-mf-nota="' + h(f.id) + '">' + bs.map(function (b) { return '<button data-mf-pedir="' + h(f.id) + '" data-mf-que="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '<span class="mf-nota" data-mf-msg="' + h(f.id) + '"></span></div>';
          }
        }
        return '<details class="mf-fn"' + (op.abierto ? ' open' : '') + '><summary>' + h(f.nombre) + MF.chip(f.estado) + (pend[f.id] ? '<span class="mf-chip mf-falta">pedido</span>' : '') + '</summary><p>' + h(f.resuelve) + '</p>' + (f.motivo ? '<p class="mf-nota">' + h(f.motivo) + '</p>' : '') + falta + piezas + (f.nota ? '<p class="mf-nota">' + h(f.nota) + '</p>' : '') + acc + '</details>';
      }).join('') || '<p class="mf-nota">Nada con este filtro.</p>';
      return '<details class="mf-mod"' + (m.estado !== 'no_aplica' ? ' open' : '') + '><summary>' + h(m.nombre) + MF.chip(m.estado) + '</summary><div class="mf-in"><p class="mf-para">' + h(m.para_que) + '</p>' + req + cuerpo + '</div></details>';
    }).join('');
  };
  MF.filtros = function (actual, attr) {
    return '<div class="mf-f">' + [['todas', 'Todas'], ['lista', 'Listas'], ['falta', 'Les falta algo'], ['apagada', 'Apagadas'], ['suspendida', 'Suspendidas'], ['no_aplica', 'No aplican']].map(function (b) { return '<button ' + attr + '="' + b[0] + '" class="' + (actual === b[0] ? 'on' : '') + '">' + b[1] + '</button>'; }).join('') + '</div>';
  };
  // Matriz de todas las companias: una fila por funcion, una columna por compania (punto de color con su estado).
  MF.matriz = function (cs) {
    if (!cs.length) return '';
    var head = '<tr><th>Función</th>' + cs.map(function (c) { return '<th class="c"><a href="#" data-mf-cia="' + h(c.tenant) + '">' + h(c.nombre) + '</a></th>'; }).join('') + '</tr>';
    var filas = (cs[0].modulos || []).map(function (m, i) {
      var r = '<tr class="mf-modrow"><td colspan="' + (cs.length + 1) + '">' + h(m.nombre) + '</td></tr>';
      return r + (m.funciones || []).map(function (f, j) {
        return '<tr><td>' + h(f.nombre) + '</td>' + cs.map(function (c) { var g = ((c.modulos[i] || {}).funciones || [])[j] || {}; var e = MF.EST[g.estado] || ['', 'mf-na']; return '<td class="c" title="' + h(c.nombre + ': ' + e[0]) + '"><span class="mf-dot ' + e[1] + '"></span></td>'; }).join('') + '</tr>';
      }).join('');
    }).join('');
    return '<div class="mf-scroll"><table class="mf-tabla"><thead>' + head + '</thead><tbody>' + filas + '</tbody></table></div>'
      + '<p class="mf-nota">' + ['lista', 'falta', 'apagada', 'suspendida', 'no_aplica'].map(function (e) { return '<span class="mf-dot ' + MF.EST[e][1] + '"></span> ' + MF.EST[e][0]; }).join(' &nbsp; ') + '</p>';
  };
  window.MF = MF;
})();
