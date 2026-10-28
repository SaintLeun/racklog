// Estado compartido del asistente (el robot de Racklog): cada paso publica lo que el asistente necesita para avisar
// (layout: demanda, pasillos, pilares, espacio libre) y el asistente le pide acciones al paso (p. ej. abrir el
// autollenado con "solo un área"). Un solo estado para toda la página
import { reactive } from 'vue';

const estado = reactive({
  abierto: false,
  layout: null as null | Record<string, any>,
  // Acción pedida desde un aviso; el paso que la sabe hacer la toma y la limpia
  accion: null as null | { id: string; t: number },
});

export function useAsistente() {
  return {
    estado,
    pedir(id: string) { estado.accion = { id, t: Date.now() }; estado.abierto = false; },
  };
}
