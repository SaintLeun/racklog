// Proyecto del flujo "Planifica tu bodega" (/planifica-tu-bodega/disena): un solo estado que recorren
// los pasos. Primero se dibuja la bodega, despues se define el rack (modelos) y el cliente lo ubica en ella.
// Se guarda solo en este navegador (localStorage) con un id de sesion para "Continuar donde quede".
import { defineStore } from 'pinia';
import { nuevoTipo } from '~/lib/rack3d/mezcla.js';
import { consulta } from '~/lib/flujo/consulta.js';
import { palletsSinCajas } from '~/lib/tour/pallet.js';

export const PASOS = [
  // 'bodega' es "Arma tu layout": primero dibuja la bodega y después ubica sus racks, en el mismo paso (dueño
  // 28-10; antes la bodega era el paso 2 y repetía el plano). Los accesorios van después del layout porque
  // dependen de pasillos y cabeceras reales
  { k: 'operacion', t: 'Tu operación', min: 1 },
  { k: 'pallets', t: 'Tus pallets', min: 1 },
  { k: 'rack', t: 'Arma tu rack', min: 1 },
  { k: 'bodega', t: 'Arma tu layout', min: 2 },
  { k: 'accesorios', t: 'Accesorios y seguridad', min: 0.5 },
  { k: 'revisa', t: 'Revisa', min: 0.5 },
  { k: 'cotiza', t: 'Cotiza', min: 0.5 },
] as const;
export type Paso = typeof PASOS[number]['k'];
export type Sistema = 'RS' | 'DI' | 'AR';

export interface Lead {
  nombre: string; empresa: string; rut: string; correo: string; telefono: string;
  perfil: string; industria: string;
  // Comuna de la bodega: distingue RM (visita técnica) de regiones (videollamada o fotos)
  comuna: string;
}
// Tipo de pallet del cliente (selectivo y drive-in). Medidas en m y kg
export interface TipoPallet {
  id: string; nombre: string; frente: number; fondo: number; alto: number; peso: number;
  cantidad: number; rotacion: 'alta' | 'media' | 'baja'; color: string;
  sinPallet?: boolean; sobresale?: number;
  // Productos distintos (SKU) que comparten este tipo de pallet (pallets por SKU = cantidad / skus)
  skus?: number;
  // Armado desde la caja: ya no se usa en selectivo ni drive-in (solo alto y peso del pallet cargado, dueño
  // 27-10). Queda por los diseños guardados antes; al cargarlos pasan a alto y peso directos (palletsSinCajas)
  desdeCaja?: boolean;
  caja?: { largo: number; ancho: number; alto: number; peso: number; apilable: number; orientacion: 'auto' | 'largo' | 'ancho' };
  // Cantidad desde importaciones (contenedor, cuantos por llegada, semanas entre llegadas y en bodega)
  importacion?: { contenedor: string; n: number; entre: number; bodega: number; actuales: number; margen: number; crecimiento: number };
  // Campos que el cliente dejo en "No sé": se usa el valor tipico y el ejecutivo lo confirma
  noSe?: string[];
  // Recien creado con datos de ejemplo: se avisa hasta que el cliente cambie algo
  ejemplo?: boolean;
}
// Caja del cliente (angulo ranurado)
export interface TipoCaja {
  id: string; nombre: string; largo: number; ancho: number; alto: number; peso: number;
  cantidad: number; apilable: number; noSe?: string[];
}
// Modelo de rack: lo que el cliente arma en el paso 3; los racks del plano son copias ubicadas
export interface Modelo {
  id: string; nombre: string; tipo: Sistema;
  doble: boolean; niveles: number;
  porViga?: number; mezcla?: (string | null)[]; sobrante?: number; planos?: (string | null)[];
  tunel?: { cuerpo: number | null; altoLibre: number } | null;
  fondos?: number; techoGrua?: number | null; mastilGrua?: number | null; anchoGrua?: number | null;
  bandeja?: number; frente?: number;
  // Angulo ranurado (paso 4): `niveles` son los niveles de carga (+ la bandeja del tope que cierra el estante),
  // alto del ángulo (m), orientación de la caja (null = la que pone más) y carro de carga (m). Las cajas apiladas
  // salen de lo que aguanta la caja (paso 3), acotado por el espacio entre bandejas
  altoEntre?: number | null; altoAngulo?: number | null; anchoCarro?: number | null; largoEnFrente?: boolean | null;
  propuestaAR?: string | null;
  // Vigas movidas a mano (m, centro de cada viga; selectivo)
  vigasY?: number[] | null;
  // Primer nivel sobre viga a piso (selectivo). null/ausente = lo que pide el equipo (GRUAS.vigaPiso)
  vigaPiso?: boolean | null;
  // Cuantos de cada tipo (pallet o caja) van en este modelo
  cantidades: Record<string, number>;
}

const CLAVE = 'racklog-proyecto-v1';
const id = () => Math.random().toString(36).slice(2, 9);

function inicial() {
  return {
    version: 1,
    sesion: id() + Date.now().toString(36),
    paso: 'operacion' as Paso,
    // Pasos a los que ya llego (el stepper deja volver a cualquiera de ellos)
    alcanzado: 0,
    rol: '' as string,
    lead: { nombre: '', empresa: '', rut: '', correo: '', telefono: '', perfil: '', industria: '', comuna: '' } as Lead,
    registrado: false,
    // Se fue del paso de medidas sin completarlas (cuenta para ofrecer la visita técnica como rescate)
    abandonoMedidas: false,
    flags: [] as string[],
    // Paso 1
    sabe: null as boolean | null,
    respuestas: {} as Record<string, string>,
    pregunta: 0,
    sistema: null as Sistema | null,
    alternativa: null as Sistema | null,
    porque: [] as string[],
    notas: [] as string[],
    // Paso 2
    pallets: [] as TipoPallet[],
    cajas: [] as TipoCaja[],
    // Paso 3
    modelos: [] as Modelo[],
    modeloSel: null as string | null,
    // Paso 4: los propuestos que el cliente quito y las cantidades que cambio a mano
    // manuales: los que el cliente arrastro al 3D (lib/rack3d/accesorios.js, encajarAccesorio)
    // desea: respuesta a "¿Deseas agregar accesorios de seguridad?" (null = no ha respondido); con No, quitados lleva
    // todos los opcionales y previos guarda lo que habia por si vuelve a decir Sí
    accesorios: { quitados: [] as string[], cantidades: {} as Record<string, number>, medidas: {} as Record<string, number>, manuales: [] as any[], desea: null as boolean | null, previos: null as string[] | null },
    // Paso 5: misma forma que el planificador (lib/rack3d/planificador.js)
    bodega: {
      ancho: 20, largo: 30, altura: 8 as number | null, forma: null as { x: number; y: number }[] | null,
      // Plantilla de la forma ('L', 'T' o 'libre'; null = rectángulo)
      tipoForma: null as string | null,
      elementos: [] as any[], grua: 'contrapeso', pesoPallet: null as number | null,
      // Placa de su grúa (si la sabe): altura máxima de horquilla (m) y capacidad nominal (kg)
      gruaLevante: null as number | null, gruaKg: null as number | null, pesoBandeja: null as number | null,
      // Factor de ocupación (60–85 %): posiciones necesarias = pallets ÷ factor (prompt v3 §6)
      ocupacion: 0.8,
      pallets: [] as any[],
      // Pasillos cerrados que el cliente marcó "por aquí no circula la grúa" (clave: ids de sus filas, ordenados).
      // No se avisan más y le llegan al ejecutivo en el lead (dueño 27-10)
      sinGrua: [] as string[],
    },
    racks: [] as any[],
    // Layout de hoy (antes/después): se dibuja aparte, no se cotiza
    racksHoy: [] as any[],
    // Posiciones que el cliente ya tiene hoy (para el antes / despues)
    posicionesHoy: 0,
    // Crecimiento anual de su operación (gerencia: posiciones en 1 y 2 años)
    crecimiento: 0.1,
    // Medicion
    inicio: Date.now(),
    tiempos: {} as Record<string, number>,
    utm: {} as Record<string, string>,
    // Modo prueba (?prueba=1): el lead llega a Kommo con la etiqueta PRUEBA, sin vendedor ni tarea
    prueba: false,
    enviado: false,
  };
}
export type Proyecto = ReturnType<typeof inicial>;

export const useProyecto = defineStore('proyecto', {
  state: inicial,
  getters: {
    indice: (s) => PASOS.findIndex((p) => p.k === s.paso),
    modeloActual: (s) => s.modelos.find((m) => m.id === s.modeloSel) ?? s.modelos[0] ?? null,
    // El catalogo que ve el rack: pallets (RS/DI) o cajas (AR)
    hayAngulo: (s) => s.modelos.some((m) => m.tipo === 'AR') || s.sistema === 'AR',
  },
  actions: {
    cargar() {
      try {
        const g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
        if (g && g.version === 1) this.$patch({ ...inicial(), ...g, lead: { ...inicial().lead, ...g.lead }, bodega: { ...inicial().bodega, ...g.bodega }, accesorios: { ...inicial().accesorios, ...g.accesorios } });
        palletsSinCajas(this.pallets);
        // Sesiones de antes de la fusión: el paso "Tu bodega" ya no existe; sigue con sus pallets
        if (!PASOS.some((x) => x.k === this.paso)) { this.paso = 'pallets'; this.alcanzado = Math.min(this.alcanzado, 1); }
      } catch { /* sin almacenamiento */ }
      // Atribucion: se guarda la primera vez que llega con parametros
      try {
        const q = new URLSearchParams(consulta());
        const utm: Record<string, string> = {};
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'li_fat_id'].forEach((k) => { const v = q.get(k); if (v) utm[k] = v.slice(0, 120); });
        if (Object.keys(utm).length) this.utm = { ...this.utm, ...utm };
        const rol = q.get('rol');
        if (rol && ['supply', 'bodega', 'compras'].includes(rol)) { this.rol = rol; if (!this.lead.perfil) this.lead.perfil = rol; }
      } catch { /* sin URL */ }
    },
    persistir() {
      try { localStorage.setItem(CLAVE, JSON.stringify(this.$state)); } catch { /* lleno o bloqueado */ }
    },
    reiniciar() {
      this.$reset();
      this.persistir();
    },
    ir(paso: Paso) {
      const ahora = Date.now();
      // Tiempo en el paso que se deja (para atacar el de mas abandono)
      this.tiempos[this.paso] = (this.tiempos[this.paso] ?? 0) + Math.round((ahora - (this.tiempos._desde ?? this.inicio)) / 1000);
      this.tiempos._desde = ahora;
      this.paso = paso;
      this.alcanzado = Math.max(this.alcanzado, PASOS.findIndex((p) => p.k === paso));
    },
    // ─── Paso 2 ───
    agregarPallet(base: Partial<TipoPallet> = {}) {
      // Pallet de ejemplo con alto y peso directos (1,2 m y 800 kg cargado): en selectivo y drive-in no hay cajas
      const t = {
        ...nuevoTipo(this.pallets.length), frente: 1.0, fondo: 1.2, alto: 1.2, peso: 800, cantidad: 100,
        desdeCaja: false, ejemplo: true, ...base,
      } as TipoPallet;
      this.pallets.push(t);
      return t;
    },
    agregarCaja(base: Partial<TipoCaja> = {}) {
      const c: TipoCaja = { id: 'c' + id(), nombre: `Caja ${this.cajas.length + 1}`, largo: 0.6, ancho: 0.4, alto: 0.3, peso: 10, cantidad: 500, apilable: 3, ...base };
      this.cajas.push(c);
      return c;
    },
    // ─── Paso 3 ───
    agregarModelo(tipo: Sistema) {
      const n = this.modelos.filter((m) => m.tipo === tipo).length + 1;
      // Configuraciones del mismo sistema con letra: "Selectivo B", "Selectivo C"…
      const nombre = { RS: 'Selectivo', DI: 'Drive-in', AR: 'Ángulo ranurado' }[tipo] + (n > 1 ? ` ${String.fromCharCode(64 + n)}` : '');
      const base: Modelo = tipo === 'RS'
        ? { id: 'm' + id(), nombre, tipo, doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], tunel: null, cantidades: {} }
        : tipo === 'DI'
          ? { id: 'm' + id(), nombre, tipo, doble: false, niveles: 3, fondos: 5, techoGrua: null, mastilGrua: null, anchoGrua: null, cantidades: {} }
          : { id: 'm' + id(), nombre, tipo, doble: false, niveles: 4, bandeja: 0.4, frente: 0.9, altoAngulo: 2, cantidades: {} };
      // Por defecto lleva todo el catalogo que corresponde
      const lista = tipo === 'AR' ? this.cajas : this.pallets;
      lista.forEach((t) => { base.cantidades[t.id] = this.modelos.length ? 0 : t.cantidad; });
      this.modelos.push(base);
      this.modeloSel = base.id;
      return base;
    },
    cambiarModelo(idModelo: string, cambio: Partial<Modelo>) {
      const i = this.modelos.findIndex((m) => m.id === idModelo);
      if (i >= 0) this.modelos[i] = { ...this.modelos[i], ...cambio };
      // Los racks ya ubicados de ese modelo se actualizan (sin moverlos)
      this.racks = this.racks.map((r) => (r.modelo === idModelo ? { ...r, ...camposDeModelo(this.modelos[i]) } : r));
    },
    quitarModelo(idModelo: string) {
      this.modelos = this.modelos.filter((m) => m.id !== idModelo);
      this.racks = this.racks.filter((r) => r.modelo !== idModelo);
      if (this.modeloSel === idModelo) this.modeloSel = this.modelos[0]?.id ?? null;
    },
  },
});

/** Campos de un modelo que lleva cada rack ubicado (lo demas es posicion y cuerpos) */
export function camposDeModelo(m: Modelo) {
  const { id: _id, nombre: _n, cantidades: _c, ...resto } = m;
  // Angulo ranurado: los niveles del modelo son de carga (el rack lleva además la bandeja del tope)
  return { ...resto, modelo: m.id, ...(m.tipo === 'AR' ? { nivelesCarga: m.niveles, altoAngulo: m.altoAngulo ?? 2 } : {}) };
}
