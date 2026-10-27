// Globo de ayuda ("?" e "ingeniería lo valida") que nunca tapa un campo de la pantalla (dueño 27-10): se mide
// y se prueba arriba, abajo, a la derecha y a la izquierda del botón; gana el primer lugar que no pisa ningún
// campo (input, select, textarea, "No sé") ni queda bajo el encabezado fijo. Va fijo a la ventana (Teleport a
// body): no lo corta una tarjeta con overflow y se cierra al hacer scroll para no quedar lejos de su pregunta.
import { nextTick, onBeforeUnmount, ref } from 'vue';

const ANCHO = 240, M = 6;
type Caja = { x0: number; y0: number; x1: number; y1: number };
const pisa = (a: Caja, b: Caja) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

export function useGlobo() {
  const abierto = ref(false);
  const estilo = ref<Record<string, string>>({});
  const boton = ref<HTMLElement | null>(null);
  const globo = ref<HTMLElement | null>(null);
  const cerrar = () => { abierto.value = false; window.removeEventListener('scroll', cerrar, true); };
  async function alternar() {
    if (abierto.value) return cerrar();
    const r = boton.value?.getBoundingClientRect();
    if (!r) return;
    // Se dibuja escondido para medir su alto
    estilo.value = { left: '0px', top: '0px', width: `${ANCHO}px`, visibility: 'hidden' };
    abierto.value = true;
    window.addEventListener('scroll', cerrar, true);
    await nextTick();
    const alto = globo.value?.offsetHeight ?? 100;
    const W = window.innerWidth, H = window.innerHeight;
    // Lo que tapa el encabezado fijo (sitio y pasos, [data-fijo-arriba]) no cuenta como espacio libre
    const tope = Math.max(64, ...[...document.querySelectorAll('[data-fijo-arriba]')].map((e) => e.getBoundingClientRect().bottom));
    const campos: Caja[] = [...document.querySelectorAll('input:not([type=hidden]), select, textarea, .fl-nose')]
      .map((e) => e.getBoundingClientRect()).filter((q) => q.width && q.height && q.bottom > 0 && q.top < H)
      .map((q) => ({ x0: q.left, y0: q.top, x1: q.right, y1: q.bottom }));
    const enX = (x: number) => Math.min(Math.max(8, x), W - ANCHO - 8);
    const cx = enX(r.left + r.width / 2 - ANCHO / 2), cy = Math.min(Math.max(tope + M, r.top + r.height / 2 - alto / 2), H - alto - M);
    // Arriba y abajo (centrado y corrido a cada orilla), luego a los lados; gana el primero que no pisa nada
    const arriba = r.top - M - alto, abajo = r.bottom + M, orillas = [cx, enX(r.left), enX(r.right - ANCHO)];
    const opciones = [
      ...orillas.map((x) => ({ x, y: arriba })), ...orillas.map((x) => ({ x, y: abajo })),
      { x: r.right + M, y: cy }, { x: r.left - M - ANCHO, y: cy },
    ].map((o) => {
      const c = { x0: o.x, y0: o.y, x1: o.x + ANCHO, y1: o.y + alto };
      const fuera = c.y0 < tope || c.y1 > H || c.x0 < 4 || c.x1 > W - 4;
      return { ...o, costo: (fuera ? 1e9 : 0) + campos.reduce((t, q) => t + pisa(c, q), 0) };
    });
    const mejor = opciones.find((o) => o.costo === 0) ?? opciones.reduce((a, o) => (o.costo < a.costo ? o : a));
    estilo.value = { left: `${mejor.x}px`, top: `${mejor.y}px`, width: `${ANCHO}px` };
  }
  onBeforeUnmount(cerrar);
  return { abierto, estilo, boton, globo, alternar, cerrar };
}
