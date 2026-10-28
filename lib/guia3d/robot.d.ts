export type Robot = { pose(nombre: string): Promise<void>; caminar(ms?: number): Promise<void>; hablar(si: boolean): void; destruir(): void };
export function crearRobot(canvas: HTMLCanvasElement, opciones?: { pose?: string }): Robot;
