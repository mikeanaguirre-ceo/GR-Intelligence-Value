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
if (hallazgos.length) {
  console.error('Candado de menus: estas paginas traen listas escritas a mano. Deben leer catalogos.json.\n' + hallazgos.join('\n'));
  process.exit(1);
}
console.log('Candado de menus: ninguna pagina trae listas escritas a mano (' + archivos.length + ' archivos revisados).');
