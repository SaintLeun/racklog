// Tipos de lib/flujo/recomendacion.js para los componentes Vue
type Obj = Record<string, any>;
export const UMBRALES: Record<string, number | boolean>;
export const NOMBRE_SISTEMA: Record<string, string>;
export function recomendarProductos(datos: { pallets?: Obj[]; cajas?: Obj[]; respuestas?: Obj; bodega?: Obj; flags?: string[] }): { productos: any[]; flags: string[]; modelos: any[] };
