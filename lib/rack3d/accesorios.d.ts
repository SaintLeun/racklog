// Tipos de lib/rack3d/accesorios.js para los componentes Vue
type Obj = Record<string, any>;
export const PARAMETROS_ACCESORIOS: Record<string, any>;
export const mmTexto: (v: number) => string;
export const numTexto: (v: number) => string;
export function marcoLocal(r: Obj): any;
export function marcosS(r: Obj): number[];
export function cabeceras(r: Obj): any[];
export function libreHacia(r: Obj, lado: string, racks: Obj[], bodega: Obj): number;
export function cabecerasExpuestas(r: Obj, racks: Obj[], bodega: Obj): any[];
export function caraConPasillo(...a: any[]): any;
export function tipoEnAltura(r: Obj, i: number, pallets?: Obj[]): Obj | null;
export function planosDe(r: Obj, pallets?: Obj[]): (string | null)[];
export function tramosBaranda(e: Obj, bodega: Obj): { tramos: any[]; aberturas: number; largo: number };
export function piezasBaranda(largo: number): { modulos: number; ajuste: number };
export function proponerAccesorios(datos: { bodega: Obj; racks?: Obj[]; pallets?: Obj[] }): any[];
export function aplicarAjustes(lista: any[], ajustes?: { quitados?: string[]; cantidades?: Record<string, number> }): any[];
export function textoAccesorios(lista: any[]): string;
