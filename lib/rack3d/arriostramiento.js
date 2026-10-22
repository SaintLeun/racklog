// Arriostramiento del bastidor del selectivo, sin three.js: lo usan el 3D (lib/rack3d/construir.js)
// y la vista lateral 2D (components/flujo/LateralRack.vue), que no debe arrastrar three al cargar.

// Tramos en zigzag de ~0,9 m entre 80 mm del piso y 80 mm del tope
export function zigzagBastidor(alto) {
  const tramos = Math.max(4, Math.round(alto / 0.9)), y0 = 0.08;
  return { tramos, y0, dy: (alto - 2 * y0) / tramos };
}
/** Alturas (m) de los separadores de una fila doble: 2 por marco hasta 6 m, 3 si es más alto, en los
 *  nudos del lado del separador (donde las diagonales de los dos bastidores forman el rombo) */
export function alturasSeparadores(alto) {
  const { tramos, y0, dy } = zigzagBastidor(alto);
  const n = alto <= 6 ? 2 : 3;
  const nudos = [];
  for (let k = 1; k <= tramos; k += 2) nudos.push(y0 + k * dy);   // nudos del lado de adentro
  const usados = new Set();
  return Array.from({ length: n }, (_, i) => {
    const meta = alto * (i + 0.5) / n;
    const j = nudos.map((y, q) => [Math.abs(y - meta) + (usados.has(q) ? 99 : 0), q]).sort((a, b) => a[0] - b[0])[0][1];
    usados.add(j);
    return nudos[j];
  }).sort((a, b) => a - b);
}
