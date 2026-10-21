// Tipos de lib/rack3d/viabilidad.js para los componentes Vue
type Obj = Record<string, any>;
export const CAPACIDAD_MARCO_KG: number;
export const ALTO_PASO_TUNEL: number;
export const ESBELTEZ_MAX: number;
export const REPISA_SIN_ESCALERA: number;
export const cargasRack: (r: Obj, bodega: Obj, pallets?: Obj[]) => { porNivel: number[]; maxViga: number; marco: number };
export function distanciaMuro(r: Obj, bodega: Obj): number;
export function distanciaPilar(r: Obj, bodega: Obj): number;
export function revisarDiseno(datos: { bodega: Obj; racks?: Obj[]; pallets?: Obj[]; accesorios?: any }): any[];
export function resumenViabilidad(lista: any[]): { viable: boolean; bloquea: number; advierte: number; color: string };
export function aplicarArreglo(estado: { bodega: Obj; racks: Obj[]; quitados?: string[] }, arreglo: any): { bodega: Obj; racks: any[]; quitados: string[] };
