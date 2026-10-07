// RUT chileno: cuerpo + digito verificador (modulo 11). Auto-importado por Nuxt.
export function cleanRut(rut: string) {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function validateRut(rut: string) {
  const clean = cleanRut(rut);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const expected = 11 - (sum % 11);
  const dv = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return clean.slice(-1) === dv;
}

export function formatRut(rut: string) {
  const clean = cleanRut(rut);
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${body}-${clean.slice(-1)}`;
}
