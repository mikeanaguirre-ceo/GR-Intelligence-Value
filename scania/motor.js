/* Motor del Portal de crédito Scania (demo de Great Revenue).
 * Reglas del metodizado (mapeo-campos.md), controles, cotización (réplica de CRONO y SEGUROS
 * de la PCA) y correo (texto de la macro completo_2). Corre en el navegador y en node (pruebas).
 */
(function (raiz) {
  'use strict';

  var CRITERIOS = { deuda409: 'tercio', casilla389: 'largo_plazo' };

  var FILAS = [
    [6, 'Caja y bancos', 'Cash'], [7, 'Valores negociables', 'Marketable securities'],
    [8, 'Cuentas por cobrar comerciales', 'Account receivables'], [9, 'Inventarios', 'Inventory'],
    [10, 'CxC relacionadas', 'Intercompany AR'], [12, 'Otras CxC no operativas', 'Other AR non-op.'],
    [13, 'Activo corriente', 'Total Current Assets', 'total'],
    [15, 'Activo fijo neto', 'Net Fixed Asset'], [16, 'Inversiones en relacionadas', 'Intercompany investments'],
    [18, 'Otros activos de largo plazo', 'Other long term assets'], [19, 'Intangibles', 'Intangibles'],
    [20, 'Activo diferido', 'Deferred Assets'], [22, 'Total activo', 'Total Assets', 'total'],
    [25, 'Deuda financiera de corto plazo', 'Financial short term debt'],
    [26, 'Porción corriente deuda LP', 'Current portion of LTD'], [27, 'Cuentas por pagar comerciales', 'Account Payables'],
    [28, 'CxP relacionadas', 'Intercompany AP'], [29, 'Tributos por pagar', 'Taxes'],
    [31, 'Otras CxP no operativas', 'Other AP non-op.'], [32, 'Pasivo corriente', 'Total Current Liabilities', 'total'],
    [34, 'Deuda de largo plazo', 'Long term debts'], [36, 'Provisiones', 'Provisions'], [37, 'Impuesto diferido', 'Deferred taxes'],
    [40, 'Total pasivo', 'Total Liabilities', 'total'],
    [44, 'Capital', 'Shared Capital'], [45, 'Capital adicional', 'Additional Paid in Capital'],
    [46, 'Acciones de inversión', 'Investments in stocks'], [47, 'Reservas', 'Reserves'],
    [48, 'Resultados acumulados', 'Retained Earnings'], [49, 'Utilidad del ejercicio', 'Net Profit'],
    [50, 'Revaluación', 'Capital revaluation'], [51, 'Total patrimonio', 'Total Net Equity', 'total'],
    [61, 'Ventas netas', 'Net Sales'], [62, 'Costo de ventas', 'Cost of goods sold'], [63, 'Depreciación', 'Depreciation'],
    [66, 'Gastos de administración y ventas', 'Adm. & Sales expenses'], [67, 'Utilidad operativa', 'Operating Income', 'total'],
    [68, 'EBITDA', 'EBITDA', 'total'], [69, 'Ingresos financieros', 'Financial Income'], [70, 'Gastos financieros', 'Financial Expenses'],
    [72, 'Otros ingresos (gastos)', 'Other Income / (Expenses)'], [74, 'REI', 'Earnings by Inflation'],
    [76, 'Otros no operativos', 'Other non operative'], [78, 'Extraordinarios', 'Extraordinary'],
    [81, 'Impuesto a la renta', 'Taxes'], [82, 'Utilidad neta', 'Net profit', 'total']
  ];
  var FILAS_ENTRADA = [6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 25, 26, 27, 28, 29, 30, 31, 34, 35, 36, 37,
    38, 44, 45, 46, 47, 48, 49, 50, 61, 62, 63, 66, 69, 70, 72, 73, 74, 75, 76, 77, 78, 81];
  var MESES = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
  var CIIU_A_SECTOR = { '4923': 'GENERAL CARGO', '4921': 'PASSENGER TRANSPORT (PUBLIC)', '4922': 'PASSENGER TRANSPORT (PRIVATE)',
    '05': 'MINING', '06': 'MINING', '07': 'MINING', '08': 'MINING', '09': 'MINING', '41': 'BUILDING & CONSTRUCTION',
    '42': 'BUILDING & CONSTRUCTION', '43': 'BUILDING & CONSTRUCTION', '01': 'AGRICULTURE', '02': 'FOREST & PAPER',
    '16': 'FOREST & PAPER', '17': 'FOREST & PAPER', '10': 'FOOD & GROCERY', '11': 'FOOD & GROCERY' };

  function sumar(c, ks) { var t = 0; ks.forEach(function (k) { t += Number(c[String(k)] || 0); }); return t; }
  function rango(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }

  /* ---------- Metodizado (miles de soles) ---------- */
  function metodizar(c, cPrev, crit) {
    crit = crit || CRITERIOS;
    var g = function () { return sumar(c, Array.prototype.slice.call(arguments)); };
    var f = {
      6: g(359), 7: g(360), 8: g(361, 367), 9: sumar(c, rango(368, 376)), 10: g(362, 363),
      12: g(364, 365, 366, 377, 378), 15: g(380, 381, 382, 383, 385, 386, 387), 16: g(379), 18: 0, 19: g(384), 20: g(388),
      25: g(401), 27: g(404), 28: g(405), 29: g(402), 31: g(403, 406, 407, 408), 36: g(410), 37: g(411),
      44: g(414), 45: g(416, 417), 46: g(415), 47: g(420), 48: g(421, 422), 49: g(492, 493), 50: g(418, 419),
      61: g(463), 62: g(464), 66: g(468, 469), 69: g(473), 70: g(472), 72: g(475, 480), 74: g(481),
      76: g(476), 78: g(477, 478), 81: g(490, 351)
    };
    if (crit.casilla389 === 'largo_plazo') f[18] += g(389); else f[12] += g(389);
    if (c.deuda_cp != null || c.deuda_lp != null) { f[26] = Number(c.deuda_cp || 0); f[34] = Number(c.deuda_lp || 0); }  // estados financieros con la deuda separada
    else if (crit.deuda409 === 'tercio') { f[26] = g(409) / 3; f[34] = g(409) * 2 / 3; } else { f[25] += g(409); f[26] = 0; f[34] = 0; }
    f[63] = cPrev ? g(383) - Number(cPrev['383'] || 0) : null;
    var m = {};
    Object.keys(f).forEach(function (k) { m[k] = f[k] === null ? null : f[k] / 1000; });
    return completar(m);
  }

  function completar(m) {
    var v = function (k) { return Number(m[k] || 0); };
    m[13] = v(6) + v(7) + v(8) + v(9) + v(10) + v(11) + v(12);
    m[21] = v(15) + v(16) + v(17) + v(18) + v(19) + v(20);
    m[22] = m[13] + m[21];
    m[32] = v(25) + v(26) + v(27) + v(28) + v(29) + v(30) + v(31);
    m[39] = v(34) + v(35) + v(36) + v(37) + v(38);
    m[40] = m[32] + m[39];
    m[51] = v(44) + v(45) + v(46) + v(47) + v(48) + v(49) + v(50);
    m[65] = v(62) - v(63);
    m[67] = v(61) + v(62) + v(66);
    m[68] = v(61) + m[65] + v(66);
    m[79] = m[67] + v(69) + v(70) + v(72) + v(73) + v(74) + v(75) + v(76) + v(77) + v(78);
    m[82] = m[79] + v(80) + v(81);
    m.cuadre = m[22] - m[40] - m[51];
    return m;
  }

  function indicadores(m, mes) {
    mes = mes || 12;
    var deuda = Number(m[25] || 0) + Number(m[26] || 0) + Number(m[34] || 0);
    var ebitdaAnual = m[68] * 12 / mes;
    return {
      ebitda: m[68],
      deudaEbitda: ebitdaAnual ? deuda / ebitdaAnual : null,
      pasivoPatrimonio: m[51] ? m[40] / m[51] : null,
      margenEbitda: m[61] ? m[68] / m[61] : null
    };
  }

  /* ---------- Controles ---------- */
  function controles(f710, rt, metod, mesCorte, crit, corte) {
    crit = crit || CRITERIOS;
    var a = [];
    function add(estado, nombre, detalle) { a.push({ estado: estado, nombre: nombre, detalle: detalle || '' }); }
    var fmt = function (n) { return Number(n).toLocaleString('es-PE', { maximumFractionDigits: 0 }); };
    f710.forEach(function (d) {
      var y = d.ejercicio, c = d.casillas, g = function (k) { return Number(c[String(k)] || 0); }, m = metod[y];
      if (rt && rt.ruc && d.ruc && String(d.ruc) !== String(rt.ruc)) add('bloquea', y + ' · RUC', 'El 710 es del RUC ' + d.ruc + ' y el Reporte Tributario de ' + rt.ruc);
      add(Math.abs(m[22] * 1000 - g(390)) < 2 ? 'ok' : 'bloquea', y + ' · Activo = casilla 390', fmt(m[22] * 1000) + ' vs ' + fmt(g(390)));
      add(Math.abs(m[40] * 1000 - g(412)) < 2 ? 'ok' : 'bloquea', y + ' · Pasivo = casilla 412', fmt(m[40] * 1000) + ' vs ' + fmt(g(412)));
      if (Math.abs(g(423) + g(424) - g(492) - g(493)) >= 1) {
        add('bloquea', y + ' · Utilidad', 'El balance dice ' + fmt(g(423)) + ' (casilla 423) y el estado de resultados ' + fmt(g(492)) +
          ' (casilla 492). Se usa la 492; el balance no cuadra por ' + (m.cuadre).toFixed(1) + ' mil. Pedir la declaración rectificatoria.');
      } else add('ok', y + ' · Utilidad balance = resultados', fmt(g(492)));
      add(Math.abs(m.cuadre) < 0.002 ? 'ok' : 'bloquea', y + ' · Cuadre del balance', 'Activo − pasivo − patrimonio = ' + m.cuadre.toFixed(1) + ' mil');
      if (m[63] === null) add('alerta', y + ' · Depreciación', 'Falta el 710 de ' + (y - 1) + ': la depreciación y el EBITDA de ' + y + ' quedan incompletos');
      var r = rt && rt.resumen_710 && rt.resumen_710[String(y)];
      if (r) {
        var dif = false;
        [['ingresos_netos', 463, 'Ingresos'], ['total_activos', 390, 'Activo'], ['total_pasivo', 412, 'Pasivo'], ['total_patrimonio', 425, 'Patrimonio']].forEach(function (x) {
          if (!r[x[0]]) return;
          if (Math.abs(r[x[0]][0] - g(x[1])) >= 1) {
            dif = true;
            add(r[x[0]][1] === 'R' ? 'bloquea' : 'alerta', y + ' · ' + x[2] + ' vs SUNAT',
              '710 subido ' + fmt(g(x[1])) + ', SUNAT ' + fmt(r[x[0]][0]) + (r[x[0]][1] === 'R' ? ' (rectificado)' : ''));
          }
        });
        if (!dif) add('ok', y + ' · 710 = Reporte Tributario');
      }
      if (g(389)) add('alerta', y + ' · Casilla 389', fmt(g(389)) + ' de otros activos no corrientes cargados como ' +
        (crit.casilla389 === 'largo_plazo' ? 'largo plazo' : 'activo corriente') + ' (criterio por confirmar con Scania)');
    });
    if (rt) {
      if (rt.estado && (rt.estado !== 'ACTIVO' || rt.condicion !== 'HABIDO')) add('bloquea', 'Estado en SUNAT', rt.estado + ' / ' + rt.condicion);
      else if (rt.estado) add('ok', 'Estado en SUNAT', 'ACTIVO / HABIDO');
      if (rt.comportamiento_12_meses && rt.comportamiento_12_meses.meses_con_deuda > 0) add('alerta', 'Deuda tributaria', rt.comportamiento_12_meses.meses_con_deuda + ' meses con deuda declarada');
      if (mesCorte && !(corte && corte.metod)) add('alerta', 'Corte del año en curso', 'Solo hay ventas de enero a ' + MESES[mesCorte] + ' (Reporte Tributario); para el balance al corte sube los estados financieros de corte del cliente');
    } else add('alerta', 'Reporte Tributario', 'No se subió: faltan los datos de identificación y las ventas del año en curso');
    if (corte && corte.metod) {
      add(Math.abs(corte.metod.cuadre) < 0.002 ? 'ok' : 'bloquea', 'Corte ' + MESES[corte.mes] + ' ' + corte.anio + ' · Cuadre del balance', 'Activo − pasivo − patrimonio = ' + corte.metod.cuadre.toFixed(1) + ' mil');
      var vRt = rt && rt.ventas_mensuales && rt.ventas_mensuales[String(corte.anio)];
      if (vRt && vRt.length >= corte.mes) {
        var sRt = vRt.slice(0, corte.mes).reduce(function (s, x) { return s + Number(x || 0); }, 0), sEf = corte.metod[61] * 1000;
        add(Math.abs(sRt - sEf) <= 0.05 * Math.max(sRt, 1) ? 'ok' : 'alerta', 'Corte · Ventas vs SUNAT',
          'Estados financieros ' + fmt(sEf) + ', SUNAT enero a ' + MESES[corte.mes] + ' ' + fmt(sRt));
      }
    }
    var orden = { bloquea: 0, alerta: 1, ok: 2 };
    return a.sort(function (x, y) { return orden[x.estado] - orden[y.estado]; });
  }

  var ACTIVIDAD_A_SECTOR = [[/CARGA/, 'GENERAL CARGO'], [/PASAJEROS|BUSES|OMNIBUS/, 'PASSENGER TRANSPORT (PUBLIC)'],
    [/MINER|MINA|CANTERA/, 'MINING'], [/CONSTRUC|OBRAS/, 'BUILDING & CONSTRUCTION'], [/AGRIC|CULTIVO|GANAD/, 'AGRICULTURE'],
    [/FORESTAL|MADERA|PAPEL/, 'FOREST & PAPER'], [/ALIMENT|BEBIDA/, 'FOOD & GROCERY'], [/INDUSTR|FABRICA|MANUFACT/, 'INDUSTRY']];

  // Sector de la PCA por el código CIIU de la consulta RUC; si el reporte no trae código, por el texto de la actividad.
  function sectorPorCiiu(ciiu, actividad) {
    if (ciiu) {
      var claves = Object.keys(CIIU_A_SECTOR).sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < claves.length; i++) if (String(ciiu).indexOf(claves[i]) === 0) return CIIU_A_SECTOR[claves[i]];
    }
    var texto = String(actividad || '').toUpperCase().split(',')[0];
    for (var j = 0; j < ACTIVIDAD_A_SECTOR.length; j++) if (ACTIVIDAD_A_SECTOR[j][0].test(texto)) return ACTIVIDAD_A_SECTOR[j][1];
    return null;
  }

  /* ---------- Cotización: réplica de CRONO (francés) y SEGUROS ---------- */
  function fechaUTC(y, m, d) { return new Date(Date.UTC(y, m, d)); }
  function dias(a, b) { return Math.round((b - a) / 86400000); }
  function sumarMeses(f, n) { return fechaUTC(f.getUTCFullYear(), f.getUTCMonth() + n, 15); }

  function pmt(tasa, n, va, vf) {
    if (tasa === 0) return (va - (vf || 0)) / n;
    var f = Math.pow(1 + tasa, n);
    return (va * f - (vf || 0)) * tasa / (f - 1);
  }

  // Hasta 5 líneas de unidades (filas 20 a 24 de DATOS). Si no vienen, se arma una con modelo, precio y unidades.
  function lineasDe(op) {
    var l = (op.lineas && op.lineas.length ? op.lineas : [{ modelo: op.modelo, tipo: op.tipo, precio: op.precio, unidades: op.unidades, tasaSeguro: op.tasaSeguro }])
      .filter(function (x) { return x && Number(x.precio) > 0 && Number(x.unidades) > 0; }).slice(0, 5);
    return l.map(function (x) { return { modelo: String(x.modelo || ''), tipo: x.tipo || '', precio: Number(x.precio), unidades: Number(x.unidades),
      tasaSeguro: x.tasaSeguro == null || x.tasaSeguro === '' ? Number(op.tasaSeguro || 0) : Number(x.tasaSeguro) }; });
  }

  function cotizar(op) {
    var IGV = 0.18;
    var lineas = lineasDe(op);
    var total = lineas.reduce(function (s, x) { return s + x.precio * x.unidades; }, 0);
    var inicial = op.montoInicial != null && op.montoInicial !== '' ? Number(op.montoInicial) : op.pctInicial * total;
    var tem = Math.pow(1 + op.tea, 1 / 12) - 1;
    var periodos = op.pagos + op.gracia;
    var activ = op.activacion;
    var primera = activ.getUTCDate() > 15 ? sumarMeses(activ, 2) : sumarMeses(activ, 1);
    var fechas = [];
    for (var i = 0; i < periodos; i++) fechas.push(sumarMeses(primera, i));
    var balloon = (op.balloonPct || 0) * total;

    // Seguro (hoja SEGUROS, un bloque por línea): por año, sobre el valor depreciado; + 3 % de derecho de emisión + IGV.
    var seguro = 0, detalleSeguro = [];
    if (op.seguro === 'Financiado') {
      var fin = new Date(fechas[fechas.length - 1].getTime() + 30 * 86400000);
      var d = dias(activ, fin), anios = Math.floor(d / 365), extra = d % 365;
      lineas.forEach(function (ln, k) {
        var base = ln.precio * ln.unidades, acumulado = 0, e = 1;
        while (true) {
          var prima = anios >= e ? ln.tasaSeguro * base : ln.tasaSeguro * base * extra / 365;
          acumulado += prima;
          detalleSeguro.push({ linea: k + 1, anio: e, base: base, prima: prima });
          if (!(anios >= e && extra > 0) || e >= 6) break;
          e += 1;
          base = base * (1 - (e <= 4 ? 0.10 : 0.05));
        }
        seguro += acumulado * 1.03 * (1 + IGV);
      });
    }
    var gps = 0;
    var financiado = total + seguro + gps - inicial;
    var cuota = pmt(tem, op.pagos, financiado, balloon);

    var c0 = sumarMeses(primera, -1);
    var corrido = dias(activ, c0) * (tem / 30) * financiado;
    var filas = [{ n: 'Int. corridos', fecha: c0, saldoIni: 0, interes: corrido, amort: 0, saldoFin: financiado, intIgv: corrido * (1 + IGV), total: corrido * (1 + IGV) }];
    var saldo = financiado, cuotaTotalTipica = null;
    for (var b = 1; b <= periodos; b++) {
      var interes = saldo * tem;
      var pago = op.gracia >= b ? interes : cuota;
      var amort = pago - interes;
      var ini = saldo;
      saldo = op.gracia >= b ? saldo : saldo - amort;
      var fila = { n: b, fecha: fechas[b - 1], saldoIni: ini, interes: interes, amort: amort, saldoFin: saldo, intIgv: interes * (1 + IGV), total: interes * (1 + IGV) + amort };
      if (cuotaTotalTipica === null && b > op.gracia) cuotaTotalTipica = fila.total;
      filas.push(fila);
    }
    var estructuracion = (op.comisionEstructura == null ? 0.01 : op.comisionEstructura) * (1 + IGV) * total;
    return {
      lineas: lineas, total: total, inicial: inicial, pctInicial: total ? inicial / total : 0, tem: tem, periodos: periodos,
      seguro: seguro, detalleSeguro: detalleSeguro, financiado: financiado, cuota: cuota, cuotaConIgv: cuotaTotalTipica,
      estructuracion: estructuracion, garantiaMobiliaria: 120 * (1 + IGV), lecturaPoderes: 37.39 * (1 + IGV),
      cronograma: filas, totalIntereses: filas.reduce(function (s, f) { return s + f.interes; }, 0)
    };
  }

  /* ---------- Celdas de la PCA que escribe n8n ---------- */
  function serialExcel(f) { return dias(fechaUTC(1899, 11, 30), f); }

  function celdasPca(exp) {
    var datos = {}, met = {}, cols = ['B', 'C', 'D'];
    var anios = exp.f710.map(function (d) { return d.ejercicio; });
    anios.forEach(function (y, i) {
      FILAS_ENTRADA.forEach(function (fila) {
        var v = exp.metod[y][fila];
        met[cols[i] + fila] = v === undefined || v === null ? null : Math.round(v * 1e6) / 1e6;
      });
      datos[cols[i] + '51'] = serialExcel(fechaUTC(y, 11, 31));
    });
    FILAS_ENTRADA.forEach(function (fila) { met['E' + fila] = null; });
    if (exp.corte) {
      // Con estados financieros de corte se llena toda la columna E; si no, solo las ventas del Reporte Tributario.
      if (exp.corte.metod) FILAS_ENTRADA.forEach(function (fila) {
        var v = exp.corte.metod[fila];
        met['E' + fila] = v === undefined || v === null ? null : Math.round(v * 1e6) / 1e6;
      });
      else met.E61 = exp.corte.ventas / 1000;
      datos.E51 = serialExcel(fechaUTC(exp.corte.anio, exp.corte.mes, 0));
    }
    var rt = exp.rt || {}, op = exp.op || {}, cl = exp.cliente || {};
    var ident = { C4: rt.nombre, C5: [rt.domicilio_fiscal, rt.domicilio_distrito].filter(Boolean).join(' '),
      I5: rt.domicilio_distrito ? rt.domicilio_distrito.split(' - ').pop().trim() : null,
      C7: rt.ruc ? Number(rt.ruc) : null, I8: sectorPorCiiu(rt.ciiu_principal, rt.actividad_principal) };
    if (rt.fecha_inicio_actividades) {
      var p = rt.fecha_inicio_actividades.split('/');
      ident.I7 = serialExcel(fechaUTC(+p[2], +p[1] - 1, +p[0]));
    }
    Object.keys(ident).forEach(function (k) { if (ident[k] !== null && ident[k] !== undefined && ident[k] !== '') datos[k] = ident[k]; });
    var lineas = lineasDe(op);
    if (lineas.length) {
      for (var k = 0; k < 5; k++) {
        var ln = lineas[k], fila = 20 + k;
        datos['B' + fila] = ln ? ln.modelo : null; datos['C' + fila] = ln ? (ln.tipo || null) : null;
        datos['E' + fila] = ln ? ln.precio : null; datos['F' + fila] = ln ? ln.unidades : null; datos['K' + fila] = ln ? ln.tasaSeguro : null;
      }
      Object.assign(datos, {
        F26: op.pctInicial, F27: op.tea, F39: op.comisionEstructura == null ? 0.01 : op.comisionEstructura,
        I29: serialExcel(op.activacion), I30: op.pagos, I31: op.gracia, A82: op.moneda === 'S/' ? 2 : 1,
        A34: op.seguro === 'Financiado' ? 1 : 2, F45: op.seguro, F44: 'CREDITO DIRECTO', F49: op.notaria || null,
        C6: cl.contacto || null, I6: cl.correo || null, C8: cl.telefono || null, C10: cl.analista || null, C11: cl.vendedor || null,
        C17: op.garantias || 'NA', C18: op.avales || 'NA'
      });
    }
    return { 'xl/worksheets/sheet1.xml': datos, 'xl/worksheets/sheet12.xml': met };
  }

  /* ---------- Correo (texto de la macro completo_2) ---------- */
  function n2(x) { return Number(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function n0(x) { return Number(x).toLocaleString('en-US', { maximumFractionDigits: 0 }); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function correo(exp, cot) {
    var op = exp.op, cl = exp.cliente || {}, rt = exp.rt || {};
    var pref = op.moneda === 'S/' ? 'S/ ' : 'US$ ', mon = op.moneda === 'S/' ? 'MN' : 'ME';
    var monedaTxt = op.moneda === 'S/' ? 'Soles' : 'Dólares americanos';
    var plazo = op.pagos + op.gracia;
    var unidades = cot.lineas.map(function (ln) {
      return '• (' + ln.unidades + ' unidad' + (ln.unidades > 1 ? 'es' : '') + ') ' + esc(ln.tipo || '') + ' - ' + esc(ln.modelo) + ' x ' + n0(ln.precio) + ' = ' + n0(ln.precio * ln.unidades) + '<br>';
    }).join('');
    var html = '<font face="calibri" style="font-size:10pt;"><b><i>Estimado ' + esc(cl.contacto || rt.nombre) + ',</i></b><br><br>' +
      'Sirva la presente para remitirles las condiciones de crédito (sujeto a evaluación), bajo las siguientes condiciones:<br><br>' +
      '<b>Descripción de la(s) unidad(es):</b><br><br>' + unidades + '<br>' +
      '<u><b>Estructura financiamiento</b></u><br>' +
      '<b>o Producto:</b> Credito Directo<br><b>o Moneda:</b> ' + monedaTxt + '<br>' +
      '<b>o Importe Total:</b> ' + pref + n2(cot.total) + '<br>' +
      '<b>o Cuota Inicial:</b> ' + pref + n2(cot.inicial) + ' (' + (cot.pctInicial * 100).toFixed(2) + '%)<br>' +
      '<b>o Plazo:</b> ' + plazo + ' meses (inc.' + op.gracia + ' mes(es) de gracia)<br>' +
      '<b>o Cuota Mensual:</b> ' + pref + n2(cot.cuotaConIgv) + ' inc. IGV' + (op.seguro === 'Financiado' ? ' y prima de seguro' : '') + ' (Ver Cronograma adjunto)<br>' +
      '<b>o TEA (' + mon + ') :</b> ' + (op.tea * 100).toFixed(2) + '%<br>' +
      '<b>o Gastos de Estructuración:</b> ' + pref + n2(cot.estructuracion) + '<br>' +
      '<b>o Comisión por el servicio de anotación de Garantía Mobiliaria:</b> US$ ' + n2(cot.garantiaMobiliaria) + '<br>' +
      '<b>o Gastos Notariales : </b> S/ ' + n2(op.gastosNotariales || 0) + ' aprox. <i>(*)El monto deberá ser abonado directamente a las cuentas de Notaria, el día de firmas.</i><br>' +
      '<b>o Comisión de lectura de poderes:</b> US$ ' + n2(cot.lecturaPoderes) + '<br>' +
      '<b>o Seguro:</b> ' + esc(op.seguro) + ' ' + (op.tasaSeguro * 100).toFixed(2) + '% + 30 días<br>' +
      '<i>(*) En caso de desistimiento de financiamiento, los Comisión de Estructuración no estará sujeto a devolución</i><br>' +
      '<i>(*) TEA preferencial sujeta a la toma del seguro por parte de la financiera.</i><br>' +
      '<i>(*) Los gastos notariales pueden variar en función del número de contratos.</i><br><br>' +
      '<u><b>Garantías:</b></u><br>- Fianza Solidaria Sr. Representante Legal + cónyuge, de ser el caso.<br>' +
      '- Prenda sobre vehículo financiado<br>- Garantías adicionales: ' + esc(op.garantias || 'NA') + '<br><br>' +
      "<span style='font-size:10pt;'><u><b>Consideraciones:</b></u><br>" +
      '• Las condiciones financieras deben ser revalidadas 15 días antes de la firma del contrato.<br>' +
      '• Cualquier evento que afecte el riesgo país puede significar la revisión de las condiciones aprobadas.<br>' +
      '• La cuota mensual incluye seguro. (*)<br>' +
      '• Se considera el pago a los proveedores y la activación del contrato cuando los vehículos se encuentren fabricados y puestos en el país (sin trámite de placas).<br>' +
      '• Nos reservamos el derecho de continuar con el desembolso en caso de que el onboarding del proveedor no sea satisfactorio.<br>' +
      '• Nos reservamos el derecho de cambiar las condiciones antes referidas en caso de que ocurran cambios normativos, políticos o tributarios aplicables.<br>' +
      '• La presente cotización puede cambiar en caso de ocurrir eventos de fuerza mayor o caso fortuito.<br>' +
      '• Scania Services del Perú podrá solicitar información financiera actualizada, la cual deberá ser enviada a sola solicitud.<br>' +
      '• No se trata de un leasing, sino de un préstamo de mediano plazo con la garantía prendaria del bien.<br>' +
      '• Las cuotas mensuales no están afectas al IGV, pero la parte de la cuota correspondiente a los intereses sí lo está.<br><br></span></font>';
    return {
      asunto: 'Cotización - ' + (rt.nombre || ''),
      adjunto: 'Cotización - ' + (rt.nombre || '') + ' - ' + plazo + ' meses (inc. ' + op.gracia + ' mes(es) de gracia).pdf',
      html: html
    };
  }

  var api = { lineasDe: lineasDe, CRITERIOS: CRITERIOS, FILAS: FILAS, FILAS_ENTRADA: FILAS_ENTRADA, MESES: MESES, metodizar: metodizar,
    completar: completar, indicadores: indicadores, controles: controles, sectorPorCiiu: sectorPorCiiu, cotizar: cotizar,
    celdasPca: celdasPca, correo: correo, fechaUTC: fechaUTC, serialExcel: serialExcel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else raiz.MotorScania = api;
})(this);
