type Obj = Record<string, any>;
type Guia = { x1: number; y1: number; x2: number; y2: number };
export function imanRack(r: Obj, racks: Obj[], bodega: Obj, x: number, y: number): { x: number; y: number; guias: Guia[] };
export function ordenarPasillos<T extends Obj>(racks: T[], bodega: Obj): { racks: T[]; movidos: number; avisos: string[] };
export function pasillosSinSalida(racks: Obj[], bodega: Obj): { filas: string[]; lado: 'inicio' | 'fin' }[];
export function abrirConexion<T extends Obj>(racks: T[], bodega: Obj, ids: string[], lado?: 'inicio' | 'fin'): T[];
export function distanciaFrente(r: Obj, racks: Obj[], bodega: Obj): { valor: number | null; dx: number; dy: number; a: 'rack' | 'muro' };
