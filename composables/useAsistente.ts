// Estado compartido del asistente (el robot de Racklog): cada paso publica lo que el asistente necesita para avisar
// (layout: demanda, pasillos, pilares, espacio libre) y el asistente le pide acciones al paso (p. ej. abrir el
// autollenado con "solo un área"). Un solo estado para toda la página
import { reactive, ref } from 'vue';

const estado = reactive({
  abierto: false,
  layout: null as null | Record<string, any>,
  // Parte del paso "Arma tu layout" en que va: 'bodega' (la dibuja) o 'racks' (los ubica)
  fase: null as null | string,
  // Acción pedida desde un aviso; el paso que la sabe hacer la toma y la limpia
  accion: null as null | { id: string; t: number },
  // "¿Por qué?" de un resultado: qué explicar y con qué números (FlujoPorQue)
  explicar: null as null | { id: string; datos: Record<string, any>; t: number },
});

// Cerrado con la × (dueño 04-11): RACKLOG no vuelve a aparecer en este navegador, ni en el inicio ni en el flujo.
// Se lee al montar (no al renderizar en el servidor) para no descuadrar la hidratación
const CLAVE_CERRADO = 'racklog_robot_cerrado';
const cerrado = ref(false);
function cargarCerrado() {
  try { cerrado.value = localStorage.getItem(CLAVE_CERRADO) === '1'; } catch { /* sin almacenamiento */ }
  return cerrado.value;
}
function cerrarRobot() {
  cerrado.value = true;
  estado.abierto = false;
  try { localStorage.setItem(CLAVE_CERRADO, '1'); } catch { /* sin almacenamiento: se cierra solo por esta visita */ }
}

export function useAsistente() {
  return {
    estado,
    cerrado,
    cargarCerrado,
    cerrarRobot,
    pedir(id: string) { estado.accion = { id, t: Date.now() }; estado.abierto = false; },
    explicar(id: string, datos: Record<string, any> = {}) { estado.explicar = { id, datos, t: Date.now() }; },
  };
}
