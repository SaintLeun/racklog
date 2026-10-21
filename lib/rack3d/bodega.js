// Escena 3D del planificador: piso con la forma de la bodega, muros bajos, elementos (pilares, oficinas,
// andenes, portones, zonas, pasillos y grúas) y los racks en su lugar.
// Planta 2D → 3D: x se mantiene y la y del plano es la z de la escena.
import * as THREE from 'three';
import { construirSelectivo, construirAnra, construirDriveIn } from './construir.js';
import { medidasRack, contorno, caja, rectangulo, rectElemento, puntoDentro } from './planificador.js';
import { grua, persona, materialesEquipos } from './equipos.js';
import { animarFlota } from './operar3d.js';
import { crearFlota } from './flota.js';
import { pasillos, franjaPasillo } from './pasillos.js';
import { proponerAccesorios, aplicarAjustes, marcoLocal } from './accesorios.js';
import { CAPACIDADES } from './parametrosTecnicos.js';

const PISO = '#fbfbfc';
const MURO = '#dfe3e8';
const LINEA = '#c3cad3';

const CONSTRUIR = { selectivo: construirSelectivo, anra: construirAnra, drivein: construirDriveIn };

// Cuadricula de 1 m como textura: el piso usa coordenadas en metros, asi se repite una vez por metro
function texturaGrilla() {
  const n = 256, cv = document.createElement('canvas');
  cv.width = cv.height = n;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = PISO;
  ctx.fillRect(0, 0, n, n);
  // Concreto pulido: moteado muy tenue
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(120,124,130,0.05)' : 'rgba(255,255,255,0.35)';
    const r = 0.5 + Math.random() * 1.6;
    ctx.fillRect(Math.random() * n, Math.random() * n, r, r);
  }
  ctx.fillStyle = LINEA;
  ctx.fillRect(0, 0, n, 6);
  ctx.fillRect(0, 0, 6, n);
  const tx = new THREE.CanvasTexture(cv);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}

/**
 * Escena de la bodega. opciones (todas opcionales):
 * - accesorios: { quitados, cantidades } del paso 4 (sin esto se muestran todos los propuestos)
 * - pallets: tipologias de pallet (para proponer los accesorios igual que el paso 4)
 * userData: animar(dt) y camaraOperacion si opera una flota; vistaOperador() a 1,6 m en un pasillo
 */
export function construirBodega(bodega, racks, opciones = {}) {
  const g = new THREE.Group();
  const poly = contorno(bodega);

  // Piso: la forma en XY con y negativa; al acostarlo (−90° en X) la y del plano queda como z
  const forma = new THREE.Shape(poly.map((p) => new THREE.Vector2(p.x, -p.y)));
  const geoPiso = new THREE.ShapeGeometry(forma);
  geoPiso.rotateX(-Math.PI / 2);
  // ShapeGeometry da UV = coordenadas de la forma (m): la textura se repite cada metro
  const piso = new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: texturaGrilla(), roughness: 0.9 }));
  piso.position.y = 0.005;
  piso.receiveShadow = true;
  g.add(piso);

  // Muros a la altura de la bodega: zocalo solido de 1,2 m y panel translucido arriba (dan escala
  // sin tapar los racks), con una solera en el borde superior
  const H = bodega.altura > 0 ? bodega.altura : 6, zocalo = 1.2, esp = 0.15;
  const matZocalo = new THREE.MeshStandardMaterial({ color: MURO, roughness: 0.95 });
  const matPanel = new THREE.MeshStandardMaterial({ color: '#e8ecf1', roughness: 0.9, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  const matSolera = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.6, metalness: 0.3 });
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    if (largo < 0.01) return;
    const muro = new THREE.Group();
    muro.position.set((a.x + b.x) / 2, 0, (a.y + b.y) / 2);
    muro.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
    const z = new THREE.Mesh(new THREE.BoxGeometry(largo + esp, zocalo, esp), matZocalo);
    z.position.y = zocalo / 2;
    z.receiveShadow = true;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(largo, H - zocalo), matPanel);
    panel.position.y = zocalo + (H - zocalo) / 2;
    panel.renderOrder = 3;
    const solera = new THREE.Mesh(new THREE.BoxGeometry(largo + esp, 0.12, esp + 0.04), matSolera);
    solera.position.y = H - 0.06;
    muro.add(z, panel, solera);
    g.add(muro);
  });

  // Demarcacion de los pasillos de carga en el piso: lineas amarillas en los bordes (como en bodega)
  const matLinea = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  pasillos(racks, bodega).forEach((q) => {
    // Solo el ancho de pasillo que pide el equipo, pegado a la cara del rack
    const p = { ...q, ...franjaPasillo(q) };
    const largoX = p.x1 - p.x0, largoZ = p.y1 - p.y0;
    const bordes = p.eje === 'x'
      ? [[p.x0 + 0.06, (p.y0 + p.y1) / 2, 0.1, largoZ], [p.x1 - 0.06, (p.y0 + p.y1) / 2, 0.1, largoZ]]
      : [[(p.x0 + p.x1) / 2, p.y0 + 0.06, largoX, 0.1], [(p.x0 + p.x1) / 2, p.y1 - 0.06, largoX, 0.1]];
    bordes.forEach(([x, z, w, d]) => {
      const geo = new THREE.PlaneGeometry(w, d);
      geo.rotateX(-Math.PI / 2);
      const l = new THREE.Mesh(geo, matLinea);
      l.position.set(x, 0.012, z);
      l.receiveShadow = true;
      g.add(l);
    });
  });

  const elementos = bodega.elementos ?? [];
  const mats = materiales();
  // Flota de grúas (lib/rack3d/flota.js): cada una con su pasillo, su hueco y sin choques. Si no hay
  // ningun pasillo donde operar queda una grua estacionada y una persona junto al porton
  let flota = null;
  try { flota = crearFlota(bodega, racks); } catch { flota = null; }
  const huecos = new Map((flota?.gruas ?? []).map((x) => [x.rackId, x.hueco]));
  // Las grúas dibujadas en el plano son la flota (no se dibujan quietas encima)
  elementos.forEach((e) => {
    if (flota && e.clase === 'grua') return;
    const o = elemento3D(e, bodega.altura, mats);
    if (o) g.add(o);
  });
  const porton = elementos.find((e) => e.clase === 'porton' || e.clase === 'anden');
  const c0 = caja(poly);
  const ref = porton ? { x: porton.x, y: porton.y } : { x: c0.x0, y: c0.y1 };
  if (!flota) {
    const yo = persona(mats);
    const pYo = lugarLibre3D(poly, racks, elementos, ref, 0.6);
    if (pYo) { yo.position.set(pYo.x, 0, pYo.y); g.add(yo); }
    const pGrua = elementos.some((e) => e.clase === 'grua') ? null : lugarLibre3D(poly, racks, elementos, pYo ?? ref, 1.6, pYo);
    if (pGrua) {
      const montacargas = grua(bodega.grua, mats);
      montacargas.position.set(pGrua.x, 0, pGrua.y);
      const centro = { x: (c0.x0 + c0.x1) / 2, y: (c0.y0 + c0.y1) / 2 };
      // Horquillas (−z local) mirando al centro de la bodega
      montacargas.rotation.y = Math.atan2(pGrua.x - centro.x, pGrua.y - centro.y);
      g.add(montacargas);
    }
  }

  const racks3d = new Map();
  racks.forEach((r) => {
    const m = medidasRack(r);
    if (huecos.has(r.id)) m.hueco = huecos.get(r.id);
    const rack = CONSTRUIR[m.tipo](m);
    rack.position.set(r.x, 0, r.y);
    rack.rotation.y = -((r.rot || 0) * Math.PI) / 180;
    rack.userData.rackId = r.id;   // el visor lo usa para arrastrarlo
    g.add(rack);
    racks3d.set(r.id, rack);
  });
  if (flota) {
    const animar = animarFlota(g, flota, racks3d, mats);
    // El visor la llama en cada cuadro mientras la operacion este encendida
    g.userData.animar = animar;
    g.userData.camaraOperacion = animar.camara;
    g.userData.gruasOperando = animar.cantidad;
    g.userData.gruaPosicion = animar.gruaPosicion;
  }
  g.userData.vistaOperador = flota?.gruas.length ? () => g.userData.animar.vistaOperador() : () => vistaEnPasillo(bodega, racks);

  // Accesorios de seguridad (paso 4) en su lugar
  try {
    const lista = aplicarAjustes(proponerAccesorios({ bodega, racks, pallets: opciones.pallets ?? [] }), opciones.accesorios ?? {});
    g.add(accesorios3D(lista.filter((a) => a.incluido), racks, mats));
  } catch { /* sin accesorios si los datos vienen incompletos */ }
  return g;
}

// Punto libre mas cercano a `ref`: dentro de la bodega, a `radio` m de racks, elementos, muros y de `evitar`
function lugarLibre3D(poly, racks, elementos, ref, radio, evitar = null) {
  const c = caja(poly), rects = [...racks.map(rectangulo), ...elementos.map(rectElemento)];
  const libre = (x, y) => puntoDentro({ x, y }, poly)
    && [[radio, 0], [-radio, 0], [0, radio], [0, -radio]].every(([dx, dy]) => puntoDentro({ x: x + dx, y: y + dy }, poly))
    && rects.every((q) => x < q.x0 - radio || x > q.x0 + q.ancho + radio || y < q.y0 - radio || y > q.y0 + q.alto + radio)
    && (!evitar || Math.hypot(evitar.x - x, evitar.y - y) > radio + 1.2);
  // Paso de 0,5 m en bodegas normales; mas grueso en las muy grandes (a lo mas ~80 × 80 puntos)
  const paso = Math.max(0.5, Math.max(c.x1 - c.x0, c.y1 - c.y0) / 80);
  let mejor = null, dMejor = Infinity;
  for (let y = c.y0 + paso / 2; y < c.y1; y += paso) {
    for (let x = c.x0 + paso / 2; x < c.x1; x += paso) {
      const d = Math.hypot(x - ref.x, y - ref.y);
      if (d < dMejor && libre(x, y)) { mejor = { x, y }; dMejor = d; }
    }
  }
  return mejor;
}

// Vista a 1,6 m (ojos de un operador) dentro del pasillo de carga mas largo, mirando a lo largo de el
function vistaEnPasillo(bodega, racks) {
  const lista = pasillos(racks, bodega);
  const largo = (p) => (p.eje === 'x' ? p.y1 - p.y0 : p.x1 - p.x0);
  const p = lista.sort((a, b) => largo(b) - largo(a))[0];
  if (!p) {
    const c = caja(contorno(bodega));
    return { posicion: new THREE.Vector3(c.x0 + 1, 1.6, c.y1 - 1), objetivo: new THREE.Vector3((c.x0 + c.x1) / 2, 1.4, (c.y0 + c.y1) / 2) };
  }
  const f = franjaPasillo(p), cx = (f.x0 + f.x1) / 2, cz = (f.y0 + f.y1) / 2;
  return p.eje === 'x'
    ? { posicion: new THREE.Vector3(cx, 1.6, f.y1 - 0.5), objetivo: new THREE.Vector3(cx, 1.4, f.y0) }
    : { posicion: new THREE.Vector3(f.x1 - 0.5, 1.6, cz), objetivo: new THREE.Vector3(f.x0, 1.4, cz) };
}

// ─── Accesorios de seguridad en 3D (marcas de lib/rack3d/accesorios.js, en planta) ───
const NORMAL_FRENTE = { 0: [0, -1], 90: [1, 0], 180: [0, 1], 270: [-1, 0] };

function placaCapacidad(r) {
  const kg = r.tipo === 'DI' ? CAPACIDADES.driveInPallet.valor : r.tipo === 'AR' ? CAPACIDADES.bandejaAngulo.valor : CAPACIDADES.selectivoParVigas.valor;
  const por = r.tipo === 'DI' ? 'por pallet' : r.tipo === 'AR' ? 'por bandeja' : 'por nivel';
  return texturaCanvas(256, (c, n) => {
    c.fillStyle = '#facc15'; c.fillRect(0, 0, n, n);
    c.fillStyle = '#111827'; c.fillRect(n * 0.04, n * 0.04, n * 0.92, n * 0.92);
    c.fillStyle = '#ffffff'; c.fillRect(n * 0.08, n * 0.08, n * 0.84, n * 0.84);
    c.fillStyle = '#111827';
    c.textAlign = 'center';
    c.font = `bold ${n * 0.12}px sans-serif`;
    c.fillText('CARGA MÁXIMA', n / 2, n * 0.3);
    c.font = `bold ${n * 0.2}px sans-serif`;
    c.fillText(`${kg.toLocaleString('es-CL')} kg`, n / 2, n * 0.58);
    c.font = `${n * 0.1}px sans-serif`;
    c.fillText(por, n / 2, n * 0.78);
  }, { repetir: false });
}

function accesorios3D(lista, racks, mats) {
  const g = new THREE.Group();
  g.name = 'accesorios';
  const porId = Object.fromEntries(lista.map((a) => [a.id, a]));
  const Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const instancias = (geo, mat, matrices, sombra = true) => {
    if (!matrices.length) return;
    const im = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.castShadow = sombra;
    im.receiveShadow = true;
    g.add(im);
  };

  // Canilleras: protector amarillo de 0,4 m al pie de cada pilar que da al pasillo
  const can = porId.canilleras;
  if (can) {
    const tx = texSeguridad();
    tx.repeat.set(1, 1.6);
    const mat = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5, metalness: 0.2 });
    const geo = new THREE.BoxGeometry(0.2, 0.4, 0.18);
    geo.translate(0, 0.2, 0);
    instancias(geo, [mat, mat, mats.amarillo, mats.amarillo, mat, mat], can.marcas.filter((k) => k.tipo === 'punto')
      .map((k) => new THREE.Matrix4().makeTranslation(k.x, 0, k.y)));
    const base = new THREE.BoxGeometry(0.28, 0.012, 0.26);
    base.translate(0, 0.006, 0);
    instancias(base, mats.placa, can.marcas.filter((k) => k.tipo === 'punto').map((k) => new THREE.Matrix4().makeTranslation(k.x, 0, k.y)), false);
  }

  // Proteccion de bastidor: perfil amarillo/negro de 0,4 m de alto a lo largo del bastidor
  const pb = porId.proteccionBastidor;
  if (pb) {
    pb.marcas.filter((k) => k.tipo === 'barra').forEach((k) => {
      const L = Math.hypot(k.x2 - k.x1, k.y2 - k.y1);
      if (L < 0.05) return;
      const tx = texSeguridad();
      tx.repeat.set(Math.max(1, Math.round(L / 0.3)), 1);
      const mat = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5, metalness: 0.2 });
      const b = new THREE.Group();
      b.position.set((k.x1 + k.x2) / 2, 0, (k.y1 + k.y2) / 2);
      b.rotation.y = -Math.atan2(k.y2 - k.y1, k.x2 - k.x1);
      bloque(b, L, 0.3, 0.1, 0, 0.25, 0, [mats.amarillo, mats.amarillo, mats.amarillo, mats.amarillo, mat, mat]);
      [-1, 1].forEach((sg) => bloque(b, 0.08, 0.1, 0.12, sg * (L / 2 - 0.06), 0.05, 0, mats.negro, false));
      g.add(b);
    });
  }

  // Barandas: tubo amarillo de 1,1 m con postes cada ~1,5 m; las piezas de ajuste en naranjo
  const bar = porId.barandas;
  if (bar) {
    const postes = { amarillo: [], naranjo: [] };
    const tubos = { amarillo: [], naranjo: [] };
    bar.marcas.filter((k) => k.tipo === 'linea').forEach((k) => {
      const L = Math.hypot(k.x2 - k.x1, k.y2 - k.y1);
      if (L < 0.05) return;
      const color = k.ajuste ? 'naranjo' : 'amarillo';
      const n = Math.max(1, Math.ceil(L / 1.5));
      for (let i = 0; i <= n; i++) {
        const f = i / n;
        postes[color].push(new THREE.Matrix4().makeTranslation(k.x1 + (k.x2 - k.x1) * f, 0, k.y1 + (k.y2 - k.y1) * f));
      }
      // Pasamanos (1,1 m), travesano (0,55 m) y rodapie (0,12 m)
      const ang = Math.atan2(k.y2 - k.y1, k.x2 - k.x1);
      Q.setFromAxisAngle(Y, -ang);
      [1.1, 0.55, 0.12].forEach((y) => {
        tubos[color].push(new THREE.Matrix4().compose(new THREE.Vector3((k.x1 + k.x2) / 2, y, (k.y1 + k.y2) / 2), Q, new THREE.Vector3(L, 1, 1)));
      });
    });
    const poste = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 10);
    poste.translate(0, 0.55, 0);
    const tubo = new THREE.CylinderGeometry(0.025, 0.025, 1, 10);
    tubo.rotateZ(Math.PI / 2);
    ['amarillo', 'naranjo'].forEach((c) => {
      const mat = c === 'amarillo' ? mats.amarilloSeg : mats.naranjo;
      instancias(poste, mat, postes[c]);
      instancias(tubo, mat, tubos[c]);
      const pie = new THREE.BoxGeometry(0.16, 0.012, 0.16);
      pie.translate(0, 0.006, 0);
      instancias(pie, mats.placa, postes[c], false);
    });
  }

  // Placa de capacidad: una por fila, en la cabecera del frente a 1,5 m
  if (porId.placaCapacidad) {
    const geo = new THREE.PlaneGeometry(0.3, 0.3);
    racks.filter((r) => !r.existente && ['RS', 'DI', 'AR'].includes(r.tipo)).forEach((r) => {
      const { aPlanta } = marcoLocal(r);
      const [nx, nz] = NORMAL_FRENTE[r.rot] ?? NORMAL_FRENTE[0];
      const p = aPlanta(0.3, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: placaCapacidad(r), roughness: 0.4, metalness: 0.1 }));
      m.position.set(p.x + nx * 0.03, 1.5, p.y + nz * 0.03);
      m.rotation.y = Math.atan2(nx, nz);
      g.add(m);
    });
  }
  return g;
}

// ─── Materiales compartidos de una escena (se liberan junto con ella) ───
function materiales() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    ...materialesEquipos(),
    naranjo: std({ color: 0xf97316, roughness: 0.55 }),
    amarillo: std({ color: 0xfacc15, roughness: 0.55 }),
    negro: std({ color: 0x27272a, roughness: 0.7 }),
    goma: std({ color: 0x18181b, roughness: 0.95 }),
    acero: std({ color: 0x8b9099, metalness: 0.6, roughness: 0.4 }),
    asiento: std({ color: 0x3f3f46, roughness: 0.8 }),
    hormigon: std({ color: 0x9ca3af, roughness: 0.95 }),
    hormigonClaro: std({ color: 0xc7cbd1, roughness: 0.92 }),
    placa: std({ color: 0x6b7280, metalness: 0.7, roughness: 0.45 }),
    muro: std({ color: 0xf1f2f4, roughness: 0.9 }),
    zocalo: std({ color: 0x64748b, roughness: 0.8 }),
    marco: std({ color: 0x475569, metalness: 0.5, roughness: 0.45 }),
    techo: std({ color: 0xe5e7eb, roughness: 0.85 }),
    vidrio: new THREE.MeshPhysicalMaterial({ color: 0x9ec9e6, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false }),
    puerta: std({ color: 0x7c3aed, roughness: 0.6 }),
    madera: std({ color: 0xba8a4e, roughness: 0.85, metalness: 0.02 }),
    carton: std({ color: 0xcaa46a, roughness: 0.85, metalness: 0.02 }),
  };
}

// ─── Texturas de canvas ───
function texturaCanvas(n, dibujar, { repetir = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = n;
  dibujar(cv.getContext('2d'), n);
  const tx = new THREE.CanvasTexture(cv);
  if (repetir) tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  return tx;
}
// Franjas diagonales a 45° que empalman al repetir (n franjas por cuadro)
function franjasDiagonales(ctx, n, fondo, franja, k = 4, ancho = 0.5) {
  if (fondo) { ctx.fillStyle = fondo; ctx.fillRect(0, 0, n, n); } else ctx.clearRect(0, 0, n, n);
  ctx.fillStyle = franja;
  const p = n / k;
  for (let i = -k; i <= 2 * k; i++) {
    ctx.beginPath();
    ctx.moveTo(i * p, 0);
    ctx.lineTo(i * p + p * ancho, 0);
    ctx.lineTo(i * p + p * ancho - n, n);
    ctx.lineTo(i * p - n, n);
    ctx.closePath();
    ctx.fill();
  }
}
const texSeguridad = () => texturaCanvas(64, (c, n) => franjasDiagonales(c, n, '#facc15', '#111827', 2));

// Plano horizontal marcado en el piso. Ejes locales: x = largo (sentido de marcha), z = ancho
function planoPiso(largo, ancho, material, y = 0.012) {
  const geo = new THREE.PlaneGeometry(largo, ancho);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.y = y;
  m.receiveShadow = true;
  m.renderOrder = 1;
  return m;
}
const matMarca = (o) => new THREE.MeshStandardMaterial({
  roughness: 0.85, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, ...o,
});

// Grupo orientado por el lado largo del elemento: devuelve { g, largo, ancho } con x local = lado largo
function orientado(e) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const vertical = e.alto > e.ancho;
  if (vertical) g.rotation.y = Math.PI / 2;
  return { g, largo: Math.max(e.ancho, e.alto), ancho: Math.min(e.ancho, e.alto) };
}

function bloque(grupo, w, h, d, x, y, z, mat, sombra = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  m.receiveShadow = true;
  grupo.add(m);
  return m;
}
// ─── Elementos de la bodega ───
function elemento3D(e, altura, mats = materiales()) {
  const H = altura > 0 ? altura : 6;
  switch (e.clase) {
    case 'pilar': {
      // Columna de hormigon (cuadrada o circular) o perfil H de acero, con placa base y protector
      // amarillo/negro hasta 1 m
      const g = new THREE.Group();
      g.position.set(e.x, 0, e.y);
      const tx = texSeguridad();
      tx.repeat.set(Math.max(1, Math.round((e.ancho + e.alto) * 2 / 0.25)) / 2, 2);
      const prot = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 });
      if (e.forma === 'circular') {
        const r = Math.max(e.ancho, e.alto) / 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, 24), mats.hormigon);
        col.position.y = H / 2; col.castShadow = true; col.receiveShadow = true; g.add(col);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 1.0, 24, 1, true), prot);
        p.position.y = 0.53; g.add(p);
        bloque(g, r * 2 + 0.12, 0.03, r * 2 + 0.12, 0, 0.015, 0, mats.placa, false);
        return g;
      }
      if (e.forma === 'H') {
        // Alas a lo largo de x, alma en el centro
        const ala = Math.max(0.012, e.alto * 0.08), alma = Math.max(0.01, e.ancho * 0.06);
        [-1, 1].forEach((sg) => bloque(g, e.ancho, H, ala, 0, H / 2, sg * (e.alto / 2 - ala / 2), mats.acero));
        bloque(g, alma, H, e.alto - 2 * ala, 0, H / 2, 0, mats.acero);
        bloque(g, e.ancho + 0.12, 0.03, e.alto + 0.12, 0, 0.015, 0, mats.placa, false);
        bloque(g, e.ancho + 0.04, 1.0, e.alto + 0.04, 0, 0.53, 0, [prot, prot, mats.amarillo, mats.amarillo, prot, prot]);
        return g;
      }
      bloque(g, e.ancho, H, e.alto, 0, H / 2, 0, mats.hormigon);
      bloque(g, e.ancho + 0.12, 0.03, e.alto + 0.12, 0, 0.015, 0, mats.placa, false);
      bloque(g, e.ancho + 0.04, 1.0, e.alto + 0.04, 0, 0.53, 0, [prot, prot, mats.amarillo, mats.amarillo, prot, prot]);
      return g;
    }
    case 'oficina':
      return oficina(e, mats);
    case 'anden':
      return anden(e, mats);
    case 'porton':
      return porton(e, H, mats);
    case 'zona': {
      const { g, largo, ancho } = orientado(e);
      if (e.padre) {
        // Zona de maniobra de un porton o anden: se circula, solo se demarca (amarillo/negro suave)
        const tx = texturaCanvas(128, (c, n) => franjasDiagonales(c, n, 'rgba(254,240,138,0.35)', 'rgba(17,24,39,0.18)', 4, 0.22));
        tx.repeat.set(largo / 1.5, ancho / 1.5);
        g.add(planoPiso(largo, ancho, matMarca({ map: tx }), 0.0105));
        const borde = matMarca({ color: 0xeab308 });
        [-1, 1].forEach((sg) => {
          const a = planoPiso(largo, 0.08, borde, 0.013);
          a.position.z = sg * (ancho / 2 - 0.04);
          const b = planoPiso(0.08, ancho - 0.16, borde, 0.013);
          b.position.x = sg * (largo / 2 - 0.04);
          g.add(a, b);
        });
        return g;
      }
      const tx = texturaCanvas(128, (c, n) => {
        franjasDiagonales(c, n, 'rgba(254,226,226,0.55)', 'rgba(220,38,38,0.75)', 4, 0.32);
      });
      tx.repeat.set(largo / 1.2, ancho / 1.2);
      g.add(planoPiso(largo, ancho, matMarca({ map: tx })));
      const borde = matMarca({ color: 0xdc2626 });
      [-1, 1].forEach((s) => {
        const a = planoPiso(largo, 0.08, borde, 0.014);
        a.position.z = s * (ancho / 2 - 0.04);
        const b = planoPiso(0.08, ancho - 0.16, borde, 0.014);
        b.position.x = s * (largo / 2 - 0.04);
        g.add(a, b);
      });
      return g;
    }
    case 'pasilloGrua': {
      const { g, largo, ancho } = orientado(e);
      // Relleno ambar tenue con flechas de sentido por el centro
      const tx = texturaCanvas(128, (c, n) => {
        c.fillStyle = 'rgba(253,230,138,0.35)';
        c.fillRect(0, 0, n, n);
        c.strokeStyle = 'rgba(217,119,6,0.75)';
        c.lineWidth = n * 0.07;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(n * 0.38, n * 0.3); c.lineTo(n * 0.62, n * 0.5); c.lineTo(n * 0.38, n * 0.7);
        c.stroke();
      });
      tx.wrapT = THREE.ClampToEdgeWrapping;
      tx.repeat.set(Math.max(1, Math.round(largo / 3)), 1);
      // Las flechas ocupan ~1 m al centro: la textura cubre una franja central y el resto es relleno
      g.add(planoPiso(largo, ancho, matMarca({ color: 0xfde68a, opacity: 0.35 }), 0.011));
      g.add(planoPiso(largo, Math.min(ancho * 0.6, 1.2), matMarca({ map: tx }), 0.012));
      const linea = matMarca({ color: 0xf59e0b, roughness: 0.6 });
      [-1, 1].forEach((s) => {
        const l = planoPiso(largo, 0.1, linea, 0.013);
        l.position.z = s * (ancho / 2 - 0.08);
        g.add(l);
      });
      return g;
    }
    case 'pasilloPeatonal': {
      const { g, largo, ancho } = orientado(e);
      // Cebra perpendicular al sentido de marcha (franjas cada 0,5 m) sobre verde
      const tx = texturaCanvas(64, (c, n) => {
        c.fillStyle = 'rgba(34,197,94,0.55)';
        c.fillRect(0, 0, n, n);
        c.fillStyle = 'rgba(240,253,244,0.95)';
        c.fillRect(n * 0.5, n * 0.0, n * 0.5, n);
      });
      tx.repeat.set(largo / 1.0, 1);
      g.add(planoPiso(largo, ancho - 0.16, matMarca({ map: tx }), 0.012));
      // Cruces (aberturas, posiciones a lo largo del pasillo desde su inicio): tramo amarillo de 1,2 m
      const vertical = e.alto > e.ancho;
      const matCruce = matMarca({ color: 0xfacc15, opacity: 0.85 });
      (Array.isArray(e.aberturas) ? e.aberturas : []).forEach((a) => {
        const c = planoPiso(1.2, ancho - 0.16, matCruce, 0.0125);
        // orientado(): x local = lado largo; en vertical el giro de 90° invierte el sentido
        c.position.x = vertical ? largo / 2 - a : a - largo / 2;
        g.add(c);
      });
      const linea = matMarca({ color: 0x16a34a, roughness: 0.6 });
      [-1, 1].forEach((s) => {
        const l = planoPiso(largo, 0.08, linea, 0.013);
        l.position.z = s * (ancho / 2 - 0.04);
        g.add(l);
      });
      return g;
    }
    case 'grua': {
      const { g, largo, ancho } = orientado(e);
      // El modelo se arma a lo largo de z: se gira para que su largo quede en el x local (lado largo)
      const m = grua(e.modelo, mats, { ancho, largo });
      m.rotation.y = Math.PI / 2;   // horquillas (−z) hacia −x local
      g.add(m);
      return g;
    }
  }
  return null;
}

// Muro de largo L (x local, centrado) y alto H con huecos { a, b, y0, y1 }; los de y0 > 0 llevan vidrio
function muro(L, H, esp, huecos, mats) {
  const g = new THREE.Group();
  const cortes = [...new Set([-L / 2, L / 2, ...huecos.flatMap((h) => [h.a, h.b])])].sort((p, q) => p - q);
  for (let i = 0; i < cortes.length - 1; i++) {
    const a = cortes[i], b = cortes[i + 1], xm = (a + b) / 2;
    if (b - a < 1e-3) continue;
    const tapa = huecos.filter((h) => h.a <= xm && xm <= h.b).sort((p, q) => p.y0 - q.y0);
    let y = 0;
    [...tapa, { y0: H, y1: H }].forEach((h) => {
      if (h.y0 - y > 1e-3) bloque(g, b - a, h.y0 - y, esp, xm, (y + h.y0) / 2, 0, mats.muro);
      y = Math.max(y, h.y1);
    });
  }
  huecos.filter((h) => h.y0 > 0).forEach((h) => {
    const v = bloque(g, h.b - h.a, h.y1 - h.y0, 0.02, (h.a + h.b) / 2, (h.y0 + h.y1) / 2, 0, mats.vidrio, false);
    v.receiveShadow = false;
    bloque(g, h.b - h.a + 0.04, 0.04, esp + 0.04, (h.a + h.b) / 2, h.y0, 0, mats.marco, false);   // alfeizar
    // montantes cada ~1,2 m
    const n = Math.max(1, Math.round((h.b - h.a) / 1.2));
    for (let k = 1; k < n; k++) bloque(g, 0.04, h.y1 - h.y0, esp * 0.6, h.a + (h.b - h.a) * k / n, (h.y0 + h.y1) / 2, 0, mats.marco, false);
  });
  bloque(g, L, 0.1, esp + 0.01, 0, 0.05, 0, mats.zocalo, false);
  return g;
}

// Oficina: muros de 2,6 m y 10 cm con ventanales corridos, puerta al frente (+z) y losa liviana
function oficina(e, mats) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const H = 2.6, esp = 0.1, w = e.ancho, d = e.alto;
  const ventana = (L, desde = -L / 2 + 0.5, hasta = L / 2 - 0.5) => (hasta - desde > 0.6 ? [{ a: desde, b: hasta, y0: 1.0, y1: 2.1 }] : []);
  // Frente (+z): puerta de 0,9 m cerca de una esquina y ventana en el resto
  const pa = -w / 2 + 0.35, pb = pa + 0.9;
  const frente = muro(w, H, esp, [{ a: pa, b: pb, y0: 0, y1: 2.1 }, ...ventana(w, pb + 0.5)], mats);
  frente.position.z = d / 2 - esp / 2;
  const fondo = muro(w, H, esp, ventana(w), mats);
  fondo.position.z = -d / 2 + esp / 2;
  const izq = muro(d - esp * 2, H, esp, ventana(d - esp * 2), mats);
  izq.rotation.y = Math.PI / 2;
  izq.position.x = -w / 2 + esp / 2;
  const der = muro(d - esp * 2, H, esp, ventana(d - esp * 2), mats);
  der.rotation.y = Math.PI / 2;
  der.position.x = w / 2 - esp / 2;
  g.add(frente, fondo, izq, der);
  // Marco y hoja de la puerta entreabierta
  const zP = d / 2 - esp / 2;
  bloque(g, 0.05, 2.1, esp + 0.03, pa, 1.05, zP, mats.marco, false);
  bloque(g, 0.05, 2.1, esp + 0.03, pb, 1.05, zP, mats.marco, false);
  bloque(g, 0.95, 0.05, esp + 0.03, (pa + pb) / 2, 2.1, zP, mats.marco, false);
  const hoja = new THREE.Group();
  hoja.position.set(pa + 0.03, 0, zP + esp / 2);
  hoja.rotation.y = -0.6;
  bloque(hoja, 0.86, 2.05, 0.04, 0.43, 1.03, 0.02, mats.puerta);
  g.add(hoja);
  // Losa liviana con un borde
  bloque(g, w + 0.1, 0.1, d + 0.1, 0, H + 0.05, 0, mats.techo);
  bloque(g, w + 0.14, 0.06, d + 0.14, 0, H + 0.13, 0, mats.marco, false);
  return g;
}

// Andén: plataforma de 1,2 m con nivelador, borde de seguridad y topes de goma hacia +z (como el 2D)
function anden(e, mats) {
  const g = new THREE.Group();
  g.position.set(e.x, 0, e.y);
  const H = e.altoAnden > 0 ? e.altoAnden : 1.2, w = e.ancho, d = e.alto;
  bloque(g, w, H, d, 0, H / 2, 0, mats.hormigonClaro);
  // Nivelador: plancha de acero en el borde, 60 % del ancho
  const nw = w * 0.6, nd = Math.min(d * 0.45, 2.5);
  bloque(g, nw, 0.03, nd, 0, H + 0.015, d / 2 - nd / 2, mats.placa, false);
  bloque(g, nw, 0.02, 0.35, 0, H - 0.04, d / 2 + 0.12, mats.placa, false).rotation.x = 0.35;   // labio
  // Franja de seguridad sobre el borde y en el frente
  const tx = texSeguridad();
  tx.repeat.set(w / 0.5, 1);
  const seg = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const borde = planoPiso(w, 0.18, seg, H + 0.004);
  borde.position.z = d / 2 - 0.09;
  g.add(borde);
  [-1, 1].forEach((s) => { const b = planoPiso(0.18, d - 0.2, seg, H + 0.004); b.position.set(s * (w / 2 - 0.09), H + 0.004, -0.1); g.add(b); });
  const tx2 = texSeguridad();
  tx2.repeat.set(w / 0.5, 0.5);
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.2), new THREE.MeshStandardMaterial({ map: tx2, roughness: 0.6 }));
  frente.position.set(0, H - 0.1, d / 2 + 0.003);
  g.add(frente);
  // Topes de goma
  [-1, 1].forEach((s) => bloque(g, 0.25, 0.45, 0.12, s * Math.min(w / 2 - 0.3, nw / 2 + 0.3), Math.max(0.25, H - 0.35), d / 2 + 0.06, mats.goma));
  return g;
}

// Portón enrollable: marco de acero, cortina de lamas y caja del rollo arriba
function porton(e, alturaBodega, mats) {
  const { g, largo } = orientado(e);
  const H = Math.min(e.altoPorton > 0 ? e.altoPorton : 4, Math.max(2.5, alturaBodega - 0.3));
  const tx = texturaCanvas(64, (c, n) => {
    c.fillStyle = '#cbd5e1';
    c.fillRect(0, 0, n, n);
    c.fillStyle = '#94a3b8';
    c.fillRect(0, 0, n, n * 0.12);
    c.fillStyle = '#e2e8f0';
    c.fillRect(0, n * 0.14, n, n * 0.1);
  });
  tx.repeat.set(1, H / 0.1);
  const cortina = new THREE.MeshStandardMaterial({ map: tx, metalness: 0.45, roughness: 0.45 });
  bloque(g, largo - 0.24, H - 0.1, 0.05, 0, (H - 0.1) / 2 + 0.05, 0, cortina);
  // Zocalo de seguridad abajo
  bloque(g, largo - 0.24, 0.1, 0.07, 0, 0.05, 0, mats.amarillo, false);
  // Marco
  [-1, 1].forEach((s) => bloque(g, 0.12, H + 0.3, 0.16, s * (largo / 2 - 0.06), (H + 0.3) / 2, 0, mats.marco));
  bloque(g, largo, 0.45, 0.45, 0, H + 0.15, 0.1, mats.marco);   // caja del rollo
  return g;
}
