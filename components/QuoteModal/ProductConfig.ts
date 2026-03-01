export type ProductType = 'AR' | 'RS';

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

export type ProductConfig = AnguloRanuradoConfig | RackSelectivoConfig;
