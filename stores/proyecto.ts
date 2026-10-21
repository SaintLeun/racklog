// Proyecto del flujo "Planifica tu bodega" (/planifica-tu-bodega/disena): un solo estado que recorren
// los 7 pasos. Primero se define el rack (modelos) y despues se ubica en la bodega.
// Se guarda solo en este navegador (localStorage) con un id de sesion para "Continuar donde quede".
import { defineStore } from 'pinia';
import { nuevoTipo } from '~/lib/rack3d/mezcla.js';

export const PASOS = [
  { k: 'operacion', t: 'Tu operación', min: 1 },
  { k: 'pallets', t: 'Tus pallets', min: 1 },
  { k: 'rack', t: 'Arma tu rack', min: 1 },
  { k: 'accesorios', t: 'Accesorios y seguridad', min: 0.5 },
  { k: 'bodega', t: 'Tu bodega', min: 1 },
  { k: 'revisa', t: 'Revisa', min: 0.5 },
  { k: 'cotiza', t: 'Cotiza', min: 0.5 },
] as const;
export type Paso = typeof PASOS[number]['k'];
export type Sistema = 'RS' | 'DI' | 'AR';

export interface Lead {
  nombre: string; empresa: string; rut: string; correo: string; telefono: string;
  perfil: string; industria: string;
}
// Tipo de pallet del cliente (selectivo y drive-in). Medidas en m y kg
export interface TipoPallet {
  id: string; nombre: string; frente: number; fondo: number; alto: number; peso: number;
  cantidad: number; rotacion: 'alta' | 'media' | 'baja'; color: string;
  sinPallet?: boolean; sobresale?: number;
  // Armado desde la caja (paso 2): medidas en m, kg por caja, cuantas aguanta apiladas y orientacion
  desdeCaja?: boolean;
  caja?: { largo: number; ancho: number; alto: number; peso: number; apilable: number; orientacion: 'auto' | 'largo' | 'ancho' };
  // Cantidad desde importaciones (contenedor, cuantos por llegada, semanas entre llegadas y en bodega)
  importacion?: { contenedor: string; n: number; entre: number; bodega: number; actuales: number; margen: number; crecimiento: number };
  // Campos que el cliente dejo en "No sé": se usa el valor tipico y el ejecutivo lo confirma
  noSe?: string[];
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
  tunel?: { cuerpo: number; altoLibre: number } | null;
  fondos?: number; techoGrua?: number | null; mastilGrua?: number | null; anchoGrua?: number | null;
  bandeja?: number; frente?: number;
  // Vigas movidas a mano (m, centro de cada viga; selectivo)
  vigasY?: number[] | null;
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
    lead: { nombre: '', empresa: '', rut: '', correo: '', telefono: '', perfil: '', industria: '' } as Lead,
    registrado: false,
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
    accesorios: { quitados: [] as string[], cantidades: {} as Record<string, number> },
    // Paso 5: misma forma que el planificador (lib/rack3d/planificador.js)
    bodega: {
      ancho: 20, largo: 30, altura: 8 as number | null, forma: null as { x: number; y: number }[] | null,
      elementos: [] as any[], grua: 'contrapeso', pesoPallet: null as number | null, pesoBandeja: null as number | null,
      pallets: [] as any[],
    },
    racks: [] as any[],
    // Medicion
    inicio: Date.now(),
    tiempos: {} as Record<string, number>,
    utm: {} as Record<string, string>,
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
        if (g && g.version === 1) this.$patch({ ...inicial(), ...g, bodega: { ...inicial().bodega, ...g.bodega } });
      } catch { /* sin almacenamiento */ }
      // Atribucion: se guarda la primera vez que llega con parametros
      try {
        const q = new URLSearchParams(location.search);
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
      // Por defecto se arma desde una caja tipica (60 × 40 × 30 cm, 15 kg, aguanta 5 apiladas)
      const t = {
        ...nuevoTipo(this.pallets.length), frente: 1.0, fondo: 1.2, alto: 1.2, peso: 800, cantidad: 100,
        desdeCaja: true, caja: { largo: 0.6, ancho: 0.4, alto: 0.3, peso: 15, apilable: 5, orientacion: 'auto' }, ...base,
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
      const nombre = { RS: 'Selectivo', DI: 'Drive-in', AR: 'Ángulo ranurado' }[tipo] + (n > 1 ? ` ${n}` : '');
      const base: Modelo = tipo === 'RS'
        ? { id: 'm' + id(), nombre, tipo, doble: true, niveles: 3, porViga: 2, sobrante: 0.3, mezcla: [], planos: [], tunel: null, cantidades: {} }
        : tipo === 'DI'
          ? { id: 'm' + id(), nombre, tipo, doble: false, niveles: 3, fondos: 5, techoGrua: null, mastilGrua: null, anchoGrua: null, cantidades: {} }
          : { id: 'm' + id(), nombre, tipo, doble: false, niveles: 5, bandeja: 0.4, frente: 0.92, cantidades: {} };
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
  return { ...resto, modelo: m.id };
}
