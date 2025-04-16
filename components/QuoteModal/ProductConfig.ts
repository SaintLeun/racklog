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
}

export type ProductConfig = AnguloRanuradoConfig | RackSelectivoConfig;
