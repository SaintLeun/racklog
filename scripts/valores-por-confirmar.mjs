// Lista en un solo archivo todo valor tecnico que Racklog aun no confirma (confirmado: false) y que el
// flujo muestra como "referencial". Se lee del codigo, asi que nunca queda desfasada:
//   node scripts/valores-por-confirmar.mjs        → escribe docs/VALORES-POR-CONFIRMAR.md
//   node scripts/valores-por-confirmar.mjs --check → falla si el archivo no esta al dia (para CI)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cargar = (f) => import(pathToFileURL(path.join(raiz, f)).href);

const pt = await cargar('lib/rack3d/parametrosTecnicos.js');
const acc = await cargar('lib/rack3d/accesorios.js');
const rutas = await cargar('lib/rack3d/rutas.js');
const rec = await cargar('lib/flujo/recomendacion.js');
const via = await cargar('lib/rack3d/viabilidad.js');

const FUENTES = [
  ['Equipos (pasillo m, levante m, kg nominal, curva de capacidad residual)', 'lib/rack3d/parametrosTecnicos.js', 'GRUAS', pt.GRUAS],
  ['Grúa dentro del drive-in (holgura y medidas típicas, m)', 'lib/rack3d/parametrosTecnicos.js', 'GRUA_DRIVE_IN', pt.GRUA_DRIVE_IN],
  ['Distancias de seguridad (m)', 'lib/rack3d/parametrosTecnicos.js', 'DISTANCIAS', pt.DISTANCIAS],
  ['Capacidades por nivel (kg)', 'lib/rack3d/parametrosTecnicos.js', 'CAPACIDADES', pt.CAPACIDADES],
  ['Accesorios y seguridad', 'lib/rack3d/accesorios.js', 'PARAMETROS_ACCESORIOS', acc.PARAMETROS_ACCESORIOS],
  ['Radio de giro de cada equipo (m)', 'lib/rack3d/rutas.js', 'RADIO_GIRO', rutas.RADIO_GIRO],
  ['Umbrales de la recomendación de sistema', 'lib/flujo/recomendacion.js', 'UMBRALES', rec.UMBRALES],
];

const valor = (v) => {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const { confirmado, nombre, ...resto } = v;
    if ('valor' in resto && Object.keys(resto).length === 1) return JSON.stringify(resto.valor);
    return Object.entries(resto).map(([k, x]) => `${k}: ${JSON.stringify(x)}`).join(' · ');
  }
  return JSON.stringify(v);
};

const filas = [];
for (const [titulo, archivo, nombre, obj] of FUENTES) {
  const items = [];
  if (obj.confirmado === false) {
    // Bloque entero sin confirmar (ej. UMBRALES, GRUA_DRIVE_IN)
    for (const [k, v] of Object.entries(obj)) if (k !== 'confirmado') items.push([k, valor(v)]);
  } else {
    for (const [k, v] of Object.entries(obj)) if (v && v.confirmado === false) items.push([k + (v.nombre ? ` (${v.nombre})` : ''), valor(v)]);
  }
  if (items.length) filas.push({ titulo, archivo, nombre, items });
}
// Constantes sueltas sin bandera confirmado
filas.push({ titulo: 'Capacidad por marco (kg)', archivo: 'lib/rack3d/viabilidad.js', nombre: 'CAPACIDAD_MARCO_KG', items: [['CAPACIDAD_MARCO_KG', String(via.CAPACIDAD_MARCO_KG)]] });

const total = filas.reduce((s, f) => s + f.items.length, 0);
let md = `# Valores técnicos por confirmar\n\n`
  + `Archivo generado por \`node scripts/valores-por-confirmar.mjs\` a partir del código: **no editar a mano**.\n`
  + `Cada valor de esta lista se muestra en el flujo con la etiqueta **referencial**. Para confirmarlo, Técnica Racklog\n`
  + `corrige el valor en el archivo indicado, cambia \`confirmado: false\` por \`confirmado: true\` y se vuelve a correr el script.\n\n`
  + `Pendientes: **${total}**.\n`;
for (const f of filas) {
  md += `\n## ${f.titulo}\n\n\`${f.archivo}\` → \`${f.nombre}\`\n\n| Dato | Valor actual | Confirmado por Racklog |\n|---|---|---|\n`;
  for (const [k, v] of f.items) md += `| ${k} | ${v.replace(/\|/g, '\\|')} | ☐ |\n`;
}

const destino = path.join(raiz, 'docs/VALORES-POR-CONFIRMAR.md');
if (process.argv.includes('--check')) {
  const actual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
  if (actual !== md) { console.error('docs/VALORES-POR-CONFIRMAR.md no está al día: node scripts/valores-por-confirmar.mjs'); process.exit(1); }
  console.log(`ok valores por confirmar al día (${total})`);
} else {
  fs.writeFileSync(destino, md);
  console.log(`docs/VALORES-POR-CONFIRMAR.md: ${total} valores por confirmar`);
}
