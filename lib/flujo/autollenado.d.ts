type Obj = Record<string, any>;
type Area = { x0: number; y0: number; x1: number; y1: number };
export type Variante = { orientacion: 'ancho' | 'largo'; perimetral: boolean; cabecera: string };
export function bodegaDeArea(bodega: Obj, area: Area): Obj | null;
export function evaluarLayout(bodega: Obj, racks: Obj[]): { racks: Obj[]; posiciones: number; choques: number; angostos: number; sinSalida: number; valido: boolean };
export function autollenar(bodega: Obj, modelo: Obj, opciones?: {
  pallets?: Obj[]; cajas?: Obj[]; nuevoId?: () => string; existentes?: Obj[]; area?: Area | null;
  orientacion?: 'auto' | 'ancho' | 'largo'; perimetral?: 'auto' | boolean;
}): { racks: any[]; posiciones: number; valido: boolean; variante: Variante; probadas: number };
export function racksFueraDeArea<T extends Obj>(racks: T[], area: Area): T[];
