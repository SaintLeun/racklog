type Obj = Record<string, any>;
export type Tema = { pose: string; titulo: string; texto: string };
export type Aviso = Tema & { tono: 'alerta' | 'bien' | 'info'; accion?: { id: string; texto: string } };
export const POSES: string[];
export function imagenPose(pose: string): string;
export const SALUDO: Tema;
export function temasDe(paso: string, p?: Obj): Tema[];
export function avisosDe(paso: string, p?: Obj, estado?: Obj): Aviso[];
