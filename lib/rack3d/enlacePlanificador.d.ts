export const RUTA_PLANIFICADOR: string;
export const LARGO_MAXIMO: number;
export function enlacePlanificador(diseno: { bodega: unknown; racks: unknown[] }, origen: string): Promise<string>;
export function planificadorDesdeTexto(texto: string | null | undefined): Promise<{ bodega: any; racks: any[] } | null>;
