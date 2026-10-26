// Reglas del tour logístico: qué sistema recomendar según los datos del cliente.
// Lógica de asesoría basada en Frazelle (uso interno, no se cita en la web).
// Sin Vue: se puede probar sola.

// ─── Registro ───
const WEBMAIL_NO = ['hotmail.', 'outlook.', 'live.', 'yahoo.', 'icloud.', 'msn.', 'aol.', 'proton', 'yandex.', 'gmx.'];
const DESECHABLES = ['mailinator', 'tempmail', 'temp-mail', '10minutemail', 'guerrillamail', 'yopmail', 'trashmail', 'sharklasers', 'getnada', 'dispostable', 'maildrop'];

export function validarCorreo(correo) {
  const c = String(correo || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(c)) return { ok: false, msg: 'Escribe un correo válido.' };
  const dom = c.split('@')[1];
  if (DESECHABLES.some((d) => dom.includes(d))) return { ok: false, msg: 'Ese correo es temporal. Usa tu correo de empresa o Gmail.' };
  if (WEBMAIL_NO.some((d) => dom.startsWith(d))) return { ok: false, msg: 'Usa tu correo de empresa o Gmail.' };
  return { ok: true, gmail: dom === 'gmail.com' };
}

export function limpiarRut(rut) {
  return String(rut || '').replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatearRut(rut) {
  const r = limpiarRut(rut);
  if (r.length < 2) return r;
  const cuerpo = r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${r.slice(-1)}`;
}

// Módulo 11
export function validarRut(rut) {
  const r = limpiarRut(rut);
  if (r.length < 8 || r.length > 9) return { ok: false, msg: 'RUT incompleto.' };
  const cuerpo = r.slice(0, -1), dv = r.slice(-1);
  let suma = 0, m = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) { suma += +cuerpo[i] * m; m = m === 7 ? 2 : m + 1; }
  const res = 11 - (suma % 11);
  const esperado = res === 11 ? '0' : res === 10 ? 'K' : String(res);
  if (dv !== esperado) return { ok: false, msg: 'El RUT no es válido. Revisa el dígito verificador.' };
  // Empresas parten sobre 50.000.000; bajo eso es persona natural (se acepta, se marca)
  return { ok: true, personaNatural: +cuerpo < 50_000_000 };
}

export function validarTelefono(tel) {
  const t = String(tel || '').replace(/\D/g, '');
  const n = t.startsWith('56') ? t.slice(2) : t;
  return /^9\d{8}$/.test(n) ? { ok: true, valor: `+56${n}` } : { ok: false, msg: 'Celular de 9 dígitos, ej. 9 1234 5678.' };
}

// ─── Preguntas del tour ───
export const PREGUNTAS = [
  {
    clave: 'unidad', corta: 'Cómo mueves la mercadería', texto: '¿Cómo mueves tu mercadería?',
    tip: 'Define si necesitas rack para pallets o estantería para cajas.',
    opciones: [
      { v: 'pallet', t: 'En pallets, con grúa o apilador' },
      { v: 'cajas', t: 'Cajas o bultos, a mano' },
      { v: 'ambas', t: 'Las dos cosas' },
    ],
  },
  {
    clave: 'kg_nivel', corta: 'Peso por repisa', texto: '¿Cuánto pesa lo que pondrías en cada repisa?', soloSi: (r) => r.unidad === 'cajas',
    tip: 'La estantería de ángulo ranurado es para carga liviana; si es pesado conviene rack.',
    opciones: [
      { v: 'liviano', t: 'Hasta 150 kg' },
      { v: 'medio', t: '150 a 300 kg' },
      { v: 'pesado', t: 'Más de 300 kg' },
    ],
  },
  {
    clave: 'n_sku', corta: 'Productos distintos', texto: '¿Cuántos productos distintos guardas?',
    tip: 'Muchos productos distintos piden llegar fácil a cada uno.',
    opciones: [
      { v: 'pocos', t: 'Pocos (hasta 10)' },
      { v: 'varios', t: '10 a 50' },
      { v: 'muchos', t: 'Más de 50' },
    ],
  },
  {
    clave: 'pallets_sku', corta: 'Pallets de un mismo producto', texto: '¿Cuántos pallets de un mismo producto tienes a la vez?', soloSi: (r) => r.unidad !== 'cajas',
    tip: 'Si hay muchos pallets iguales, se pueden guardar uno detrás de otro y ahorrar espacio.',
    opciones: [
      { v: '1-2', t: '1 o 2' },
      { v: '3-5', t: '3 a 5' },
      { v: '6-10', t: '6 a 10' },
      { v: '10+', t: 'Más de 10' },
    ],
  },
  {
    clave: 'rotacion', corta: 'Veces que sale un producto por semana', texto: '¿Cuántas veces a la semana sacas un mismo producto?',
    tip: 'Cuenta las veces que vas a buscarlo, no las unidades. Lo que más sale debe quedar más a mano.',
    opciones: [
      { v: 'baja', t: 'Menos de 1 vez' },
      { v: 'media', t: '1 a 5 veces' },
      { v: 'alta', t: 'Más de 5 veces' },
    ],
  },
  {
    clave: 'salida', corta: 'Cómo despachas', texto: '¿Despachas pallets completos o cajas sueltas?', soloSi: (r) => r.unidad !== 'cajas',
    tip: 'Si sacas cajas sueltas, se arma abajo en el rack y la reserva va arriba.',
    opciones: [
      { v: 'pallet', t: 'Pallet completo' },
      { v: 'cajas', t: 'Cajas sueltas' },
      { v: 'ambos', t: 'De las dos formas' },
    ],
  },
  {
    clave: 'fifo', corta: 'Vencimiento', texto: '¿Tu producto vence o despachas por lote?',
    tip: 'Algunos racks entregan primero lo último que entró. Si el producto vence pronto, eso importa.',
    opciones: [
      { v: 'no', t: 'No vence' },
      { v: 'holgura', t: 'Vence, pero dura mucho más de lo que pasa en bodega' },
      { v: 'estricto', t: 'Vence pronto: debe salir lo primero que entra' },
      { v: 'lote', t: 'Despacho un lote específico' },
    ],
  },
  {
    clave: 'equipo', corta: 'Equipo', texto: '¿Con qué equipo mueves los pallets?', soloSi: (r) => r.unidad !== 'cajas',
    tip: 'Tu equipo define hasta qué altura puedes guardar y qué tan ancho debe ser el pasillo.',
    opciones: [
      { v: 'manual', t: 'Apilador manual' },
      { v: 'electrico', t: 'Apilador eléctrico' },
      { v: 'grua', t: 'Grúa horquilla' },
      { v: 'retractil', t: 'Grúa retráctil' },
      { v: 'ninguno', t: 'Todavía no tengo' },
    ],
  },
  {
    clave: 'espacio', corta: 'Espacio en tu bodega', texto: '¿Cómo estás de espacio en tu bodega?',
    tip: 'Si te falta espacio buscamos más densidad; si te sobra, más acceso.',
    opciones: [
      { v: 'sobra', t: 'Me sobra' },
      { v: 'justo', t: 'Estoy justo' },
      { v: 'falta', t: 'Me falta' },
    ],
  },
];

export const preguntasActivas = (r) => PREGUNTAS.filter((p) => !p.soloSi || p.soloSi(r));

// ─── Motor de recomendación ───
// Devuelve { sistema: 'RS'|'DI'|'AR', alternativa, porque: [], notas: [], flags: [] }
export function recomendar(r) {
  const porque = [], notas = [], flags = [];
  const fifoEstricto = r.fifo === 'estricto' || r.fifo === 'lote';
  // Drive-in solo con más de 10 pallets por producto; de 6 a 10 conviene doble profundidad o push-back (dueño 21-10-2026)
  const muchos = r.pallets_sku === '10+';

  if (r.rotacion === 'baja' && r.pallets_sku === '10+')
    notas.push('¿Todo ese stock es necesario? A veces el problema no es el espacio sino el inventario que se mueve poco.');

  // 1. Cajas a mano
  if (r.unidad === 'cajas') {
    if (r.kg_nivel === 'pesado') {
      porque.push('Tus cajas son pesadas para una estantería: conviene rack selectivo con repisas o pallet.');
      return { sistema: 'RS', alternativa: 'AR', porque, notas, flags };
    }
    porque.push('Mueves cajas a mano y la carga por repisa es liviana: la estantería de ángulo ranurado es lo justo.');
    if (r.kg_nivel === 'medio') notas.push('Con 150 a 300 kg por repisa revisamos el refuerzo de las bandejas.');
    if (r.rotacion === 'alta') notas.push('Lo que más sale va entre la cintura y los hombros.');
    return { sistema: 'AR', alternativa: null, porque, notas, flags };
  }

  if (r.unidad === 'ambas') notas.push('Para las cajas sueltas puedes sumar ángulo ranurado; en el planificador combinas los dos.');
  if (r.salida === 'cajas' || r.salida === 'ambos') notas.push('Niveles bajos para sacar cajas a mano y niveles altos para la reserva de pallets.');
  if (r.rotacion === 'alta') notas.push('Lo que más sale va en los niveles bajos y cerca del andén.');

  // 2. Pocos pallets por producto → selectivo
  if (r.pallets_sku === '1-2' || r.pallets_sku === '3-5' && r.espacio !== 'falta') {
    porque.push(r.pallets_sku === '1-2'
      ? 'Tienes pocos pallets de cada producto: necesitas llegar a cualquiera sin mover otros.'
      : 'Tienes pocos pallets por producto y espacio suficiente: el acceso directo vale más que la densidad.');
    if (r.n_sku === 'muchos') porque.push('Con muchos productos distintos, el selectivo es el único con acceso al 100 % de los pallets.');
    return { sistema: 'RS', alternativa: null, porque, notas, flags };
  }

  // 2b. 6 a 10 pallets por producto: poco para llenar calles de drive-in → selectivo y un ingeniero evalúa
  // doble profundidad o push-back
  if (r.pallets_sku === '6-10') {
    porque.push('Tienes 6 a 10 pallets de cada producto: no alcanzan a llenar las calles de un drive-in.');
    porque.push('Te diseñamos un selectivo, que llega a cualquier pallet sin mover otros.');
    if (r.rotacion !== 'alta' && !fifoEstricto) {
      flags.push('revisar_asesor');
      notas.push('También evaluamos doble profundidad o push-back: guardan 2 a 4 pallets por producto uno detrás de otro y ahorran pasillos.');
    }
    return { sistema: 'RS', alternativa: null, porque, notas, flags };
  }

  // 3. Candidato a drive-in: muchos pallets iguales, rotación lenta o media, sin FIFO estricto
  const motivosNo = [];
  if (fifoEstricto) motivosNo.push(r.fifo === 'lote' ? 'despachas por lote específico' : 'necesitas que salga primero lo primero que entra');
  if (r.rotacion === 'alta') motivosNo.push('sacas el producto muy seguido');
  if (r.equipo === 'manual') motivosNo.push('con apilador manual el operador tendría que caminar dentro del rack');
  if (r.equipo === 'ninguno') motivosNo.push('todavía no tienes equipo para entrar al rack');
  if (r.n_sku === 'muchos') motivosNo.push('tienes muchos productos distintos y cada calle guarda uno solo');

  if (muchos && motivosNo.length === 0) {
    porque.push('Tienes más de 10 pallets de cada producto y no los sacas tan seguido.');
    porque.push('El drive-in los guarda uno detrás de otro y elimina pasillos: más pallets en menos metros.');
    if (r.fifo === 'holgura') notas.push('Como el producto vence con holgura: un producto y un lote por calle, y vaciar la calle antes de volver a cargarla.');
    notas.push('Lo confirmamos con el plano: deben caber más calles que productos.');
    return { sistema: 'DI', alternativa: 'RS', porque, notas, flags };
  }

  // 4. Muchos pallets pero algo descarta el drive-in → selectivo
  if (muchos || r.pallets_sku === '3-5') {
    porque.push(`Tienes varios pallets por producto, pero el drive-in no conviene porque ${motivosNo.join(' y ') || 'te falta espacio para calles completas'}.`);
    porque.push('El selectivo te deja sacar cualquier pallet en cualquier orden.');
    if (fifoEstricto && r.espacio === 'falta') {
      flags.push('revisar_asesor');
      notas.push('Por espacio y vencimiento, revisamos también si te conviene otra solución de alta densidad.');
    }
    return { sistema: 'RS', alternativa: muchos && !fifoEstricto ? 'DI' : null, porque, notas, flags };
  }

  porque.push('El rack selectivo es la opción más versátil para tu operación.');
  return { sistema: 'RS', alternativa: null, porque, notas, flags };
}
