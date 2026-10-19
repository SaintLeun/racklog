export type ProductType = 'AR' | 'RS' | 'DI';

export interface AnguloRanuradoConfig {
    tipo: string;
    niveles: number;
    cuerpos: number;
    pintado: string;
    carga: string;
    bandeja: string;
}

export interface RackSelectivoConfig  {
    tipo: string;
    niveles: number;
    cuerpos: number;
    frentePallet: string;
    fondoPallet: string;
    altoPallet: string;
    carga: string;
    palletsPerBeam: number; // 2 or 3 pallets per beam level
}

// Drive-in: cuerpos = calles; pallet fijo de 1000 × 1200 × 1200 mm (como en el visor 3D)
export interface DriveInConfig {
    tipo: string;
    niveles: number;
    cuerpos: number;
    fondos: number;
    carga: string;
}

export type ProductConfig = AnguloRanuradoConfig | RackSelectivoConfig | DriveInConfig;

// Producto que se adjunta al formulario de cotizacion: config con etiquetas legibles
export interface QuoteItem {
    name: string;
    config?: Record<string, string | number>;
}
