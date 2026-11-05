// Candado de JavaScript (5 nov 2026): revisa que el JavaScript escrito dentro de cada pagina del sitio se pueda leer
// (sin errores de sintaxis). Un error de sintaxis deja la pagina entera sin funcionar: el 5 nov el portal de WhatsApp se
// quedo en «Cargando…» por un `else` fuera de lugar. Corre en cada PR y en cada push a main (candado-menus.yml).
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const paginas = [];
(function buscar(dir) {
  for (const n of fs.readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules') continue;
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) buscar(p);
    else if (n.endsWith('.html')) paginas.push(p);
  }
})(raiz);
const malas = [];
for (const p of paginas) {
  const html = fs.readFileSync(p, 'utf8');
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    const attrs = m[1] || '';
    if (/\bsrc=/.test(attrs) || /type=["'](application\/(ld\+)?json|text\/template|module)["']/i.test(attrs) || !m[2].trim()) continue;
    try { new Function(m[2]); } catch (e) { malas.push(path.relative(raiz, p) + ' (script ' + i + '): ' + e.message); }
  }
}
if (malas.length) { console.log('Candado de JavaScript: estas paginas tienen errores de sintaxis y no funcionarian:\n' + malas.join('\n')); process.exit(1); }
console.log('Candado de JavaScript: ' + paginas.length + ' paginas sin errores de sintaxis.');
