#!/usr/bin/env node
// Candado de menus (29 oct 2026): ninguna pagina del sitio debe traer escrita una lista de productos, etapas, personas,
// origenes, canales, tipos, partners o resultados del toque. Todas leen catalogos.json (que copia Configuracion al guardar).
// Busca en cada renglon de las paginas 3 o mas opciones de un mismo menu del catalogo (por su id o su nombre). Si una
// regla de negocio de verdad necesita nombrarlas (por ejemplo un plazo por etapa), el renglon lleva el comentario
// "candado-menus: regla" y se acepta.
// Uso: node scripts/candado_menus.js [archivos...]   (sin archivos revisa todos los .html y .js del sitio)
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const cat = JSON.parse(fs.readFileSync(path.join(raiz, 'catalogos.json'), 'utf8'));

// Menus y sus opciones (ids y nombres). Se ignoran textos de 1 o 2 letras y palabras comunes que no delatan una lista.
const COMUNES = new Set(['Otro', 'otro', 'Todos', 'Todas', 'Interno', 'interno', 'Perdida', 'perdida', 'Hoy', 'hoy', 'Reply', 'reply', 'Correo', 'correo', 'WhatsApp', 'whatsapp', 'LinkedIn', 'linkedin', 'GR']);
const menus = {};
const agrega = (menu, valores) => { menus[menu] = menus[menu] || new Set(); for (const v of valores) if (v && String(v).length > 2 && !COMUNES.has(String(v))) menus[menu].add(String(v)); };
for (const p of cat.productos || []) agrega('productos', [p.id, p.label]);
for (const s of cat.stages || []) agrega('etapas', [s.id, s.idCli, s.label, s.corto, s.nombre]);
for (const p of cat.personas || []) agrega('personas', [p.id].concat(p.ownerId ? [p.ownerId] : []));
for (const k of ['origenes', 'comoLlego', 'tiposOportunidad', 'partners', 'tiposInteres', 'canales', 'origenesConversacion', 'resultadosToque', 'estadosToque', 'categoriasAlerta'])
  for (const x of cat[k] || []) agrega(k, [x.id, x.label]);

// Paginas de Great Revenue: la raiz del sitio y la carpeta gr/. Las de otros clientes (stil, cencosud, scania, itera) tienen
// su propio catalogo y no entran.
const paginas = dir => fs.readdirSync(path.join(raiz, dir)).filter(f => /\.(html|js)$/.test(f) && !/^(stil\.html|ruta\.js|404\.html)$/.test(f)).map(f => path.join(raiz, dir, f));
const archivos = process.argv.slice(2).length ? process.argv.slice(2) : paginas('.').concat(paginas('gr'));

// Textos entre comillas y llaves de objeto sin comillas (TW: ..., '360': ...).
const piezas = renglon => {
  const r = [];
  renglon.replace(/'([^'\\\n]{1,60})'|"([^"\\\n]{1,60})"|`([^`\\\n$]{1,60})`/g, (m, a, b, c) => { r.push(a || b || c); return m; });
  renglon.replace(/[{,]\s*([A-Za-z_][\w]*)\s*:/g, (m, k) => { r.push(k); return m; });
  return r;
};

const hallazgos = [];
// El catalogo mismo: cada menu existe y cada opcion tiene id, nombre, orden y texto de ayuda.
const MENUS = ['productos', 'stages', 'personas', 'grupos', 'segmentos', 'origenes', 'comoLlego', 'tiposOportunidad', 'partners', 'tiposSenal', 'tiposInteres',
  'motivosPerdida', 'canales', 'origenesConversacion', 'resultadosToque', 'estadosToque', 'categoriasAlerta', 'urgencias'];
for (const k of MENUS) {
  if (!Array.isArray(cat[k]) || !cat[k].length) { hallazgos.push(`catalogos.json: falta el menu ${k}`); continue; }
  cat[k].forEach((x, i) => { for (const c of ['id', 'label', 'orden', 'ayuda']) if (x[c] === undefined || x[c] === '') hallazgos.push(`catalogos.json: ${k}[${i}] (${x.id}) no tiene ${c}`); });
}
for (const f of archivos) {
  const lineas = fs.readFileSync(f, 'utf8').split('\n');
  lineas.forEach((l, i) => {
    if (/candado-menus:\s*regla/.test(l)) return;
    const p = piezas(l);
    for (const [menu, opciones] of Object.entries(menus)) {
      const vistos = [...new Set(p.filter(x => opciones.has(x)))];
      if (vistos.length >= 3) hallazgos.push(`${path.relative(raiz, f)}:${i + 1}  lista de ${menu} escrita a mano: ${vistos.slice(0, 6).join(', ')}${vistos.length > 6 ? '…' : ''}`);
    }
  });
}
// ==== Candado de productos (16 nov 2026, decision de Mike) ====
// La lista oficial de productos son los del catalogo con grupo GR y activos, en su orden; lo demas va en «Otros». Cada pagina
// la arma en UNA sola funcion, marcada con el comentario "candado-productos: oficial" (PRODUCTOS_OFICIALES en el tablero y
// en Conocimiento, lineasConocidas en WhatsApp). Aqui se rechaza:
//  a) leer los productos del catalogo fuera de esa funcion (CAT().productos, CAT_SITIO.productos, CAT.productos,
//     catLista('productos')). Un uso que no arma un filtro (el grupo o el monto de un producto) lleva
//     "candado-productos: <para que>" en el renglon;
//  b) armar un filtro o un menu de producto (chip, boton u opcion) sin pasar por la lista oficial;
//  c) las funciones viejas que dejaban pasar Pintaando, IMMMU o Excepciones como producto;
//  d) listas escritas a mano en varios renglones (4 o mas codigos de producto en 12 renglones seguidos), como un objeto
//     de clientes o un arreglo de productos.
// Configuracion (compania.html) es donde se edita la ficha de productos: ahi se ven todos y no entra en a) ni b).
const LEE_CATALOGO = /\b(?:CAT\(\)|CAT_SITIO|CAT)\s*\.\s*productos\b|catLista\(\s*['"]productos['"]/;
const ARMA_FILTRO = [
  /\b(?:chip|_chip|_chipR|_cf|_cfn|reuChips|mtChips|fila)\(\s*(?:menu\s*,\s*)?['"](?:prod|producto|prodMovido|PRODUCTO|Producto|linea)['"]/,
  /setAmFilter\(\s*'producto'/, /data-fprod=/, /\bk:\s*'linea'/, /\blineasF\b/,
  /['"](?:tm-prod|grf-prod|grmd-c-gr_producto)['"]\s*\)\s*\.innerHTML/, /grmdOpc\(\s*'grmd-c-gr_producto'/, /id="grf-prod"/
];
const USA_OFICIAL = /PRODUCTOS_OFICIALES\(|prodOpciones\(|prodOpcionesFijar\(|prodChipTexto\(|prodEtiqueta\(|grfProductos\(|lineasConocidas\(|lineaOficial\(/;
const VIEJAS = /\b(?:prodsConCatalogo|catProdsPresentes|prodsPresentesDe)\b/;
const CODIGOS = new Set();
for (const p of cat.productos || []) for (const v of [p.id, p.label]) if (v && !COMUNES.has(String(v))) CODIGOS.add(String(v));
const esConfig = f => path.basename(f) === 'compania.html';
for (const f of archivos) {
  const rel = path.relative(raiz, f), lineas = fs.readFileSync(f, 'utf8').split('\n');
  const marcado = l => /candado-productos:/.test(l);
  lineas.forEach((l, i) => {
    if (VIEJAS.test(l)) hallazgos.push(`${rel}:${i + 1}  usa una funcion vieja de productos (deja pasar Pintaando, IMMMU o Excepciones). Usa la lista oficial.`);
    if (esConfig(f) || marcado(l)) return;
    if (LEE_CATALOGO.test(l)) hallazgos.push(`${rel}:${i + 1}  lee los productos del catalogo fuera de la lista oficial. Usa PRODUCTOS_OFICIALES() o marca el renglon con "candado-productos: <para que>".`);
    if (ARMA_FILTRO.some(r => r.test(l))) {
      const ventana = lineas.slice(Math.max(0, i - 3), i + 7).join('\n');
      if (!USA_OFICIAL.test(ventana)) hallazgos.push(`${rel}:${i + 1}  arma un filtro o menu de producto sin pasar por la lista oficial de productos.`);
    }
  });
  // d) listas en varios renglones
  for (let i = 0; i < lineas.length; i++) {
    const vistos = new Set();
    for (let j = i; j < Math.min(lineas.length, i + 12); j++) {
      if (/candado-menus:\s*regla|candado-productos:/.test(lineas[j])) continue;
      const llave = /^\s*['"]?([A-Za-z0-9_]+)['"]?\s*:/.exec(lineas[j]);
      for (const x of piezas(lineas[j]).concat(llave ? [llave[1]] : [])) if (CODIGOS.has(x)) vistos.add(x);
    }
    if (vistos.size >= 4) { hallazgos.push(`${rel}:${i + 1}  lista de productos escrita a mano en varios renglones: ${[...vistos].slice(0, 6).join(', ')}`); i += 11; }
  }
}
if (hallazgos.length) {
  console.error('Candado de menus: estas paginas traen listas escritas a mano o filtros de producto fuera de la lista oficial. Deben leer catalogos.json.\n' + hallazgos.join('\n'));
  process.exit(1);
}
console.log('Candado de menus: ninguna pagina trae listas escritas a mano y todo filtro de producto pasa por la lista oficial (' + archivos.length + ' archivos revisados).');
