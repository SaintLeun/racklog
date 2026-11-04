export const URL_LEAD: string;
export const URL_LEAD_PRUEBA: string;
export const CORREO_PRUEBA: string;
export function esCorreoPrueba(correo: unknown): boolean;
export function esSitioPrueba(host?: string): boolean;
export function urlLead(host?: string): string;
export const MENSAJES_PRUEBA: Record<'correo_prueba' | 'prueba_sin_envio', string>;
export function errorEnvio(status: number, datos: { error?: string } | null, host?: string): 'correo_prueba' | 'prueba_sin_envio' | null;
export function origenPublico(host?: string): string;
