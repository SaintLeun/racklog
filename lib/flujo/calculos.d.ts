// Tipos de lib/flujo/calculos.js para los componentes Vue (el .js manda; esto solo evita que
// TypeScript deduzca tipos demasiado estrictos desde los valores por defecto)
type Obj = Record<string, any>;
export const MAX_CUERPOS_FILA: number;
export function mezclaPorDefecto(modelo: Obj, pallets: Obj[]): (string | null)[];
export function altoEntreRepisas(modelo: Obj, cajas?: Obj[]): number | null;
export function rackDeModelo(modelo: Obj, opciones?: { pallets?: Obj[]; cajas?: Obj[]; cuerpos?: number }): Obj;
export function conteoRack(r: Obj): { cuerpos: number; marcos: number; paresVigas: number; posiciones: number; bandejas: number };
export function conteoTotal(racks: Obj[]): { cuerpos: number; marcos: number; paresVigas: number; posiciones: number; bandejas: number };
export function resultadoModelo(modelo: Obj, opciones?: { pallets?: Obj[]; cajas?: Obj[]; grua?: string }): any;
export function nivelesMaximos(modelo: Obj, opciones?: { pallets?: Obj[]; altura?: number | null; grua?: string }): number;
export function ubicarModelos(bodega: Obj, modelos: Obj[], cuerposPorModelo: Record<string, number>, opciones?: { pallets?: Obj[]; cajas?: Obj[]; nuevoId: () => string; existentes?: Obj[] }): { racks: any[]; faltan: Record<string, number> };
export function racksAlDia(racks: Obj[], modelos: Obj[], opciones?: { pallets?: Obj[]; cajas?: Obj[]; grua?: string }): { racks: any[]; huellaCambio: boolean };
export function queCotizar(modelos: Obj[], racks: Obj[]): any[];
export function repetirBloque(r: Obj, opciones: { largo?: number; profundidad?: number; espalda?: boolean }, racks: Obj[], bodega: Obj, nuevoId: () => string): { nuevos: any[]; omitidos: number };
export function enMuro(bodega: Obj, datos: { muro?: string; dist?: number; ancho?: number; fondo?: number }): { x: number; y: number; ancho: number; alto: number };
export function muroDe(bodega: Obj, e: Obj): { muro: string; dist: number; ancho: number; fondo: number };
export function zonaManiobra(bodega: Obj, e: Obj): Obj | null;
export function conManiobras(bodega: Obj): any[];
export function bandejaCajas(datos: { frente?: number; fondo?: number; altoEntre?: number; caja: Obj; largoEnFrente?: boolean }): { cols: number; filas: number; camas: number; cajas: number; kg: number; largoEnFrente: boolean; limite: 'apilable' | 'altura' | 'peso' | null };
export function firmaCajasAR(modelo: Obj, cajas?: Obj[]): string;
export function mejorBandeja(modelo: Obj, opciones?: { cajas?: Obj[]; altura?: number | null }): { bandeja: number; frente: number; niveles: number; camasRepisa: number; cuerpos: number; m2: number; alto: number; porBandeja: number } | null;
