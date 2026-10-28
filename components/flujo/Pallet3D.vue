<template>
  <div class="relative h-full w-full overflow-hidden rounded-xl bg-[#f6f7f9]">
    <div ref="lienzo" class="h-full w-full cursor-grab active:cursor-grabbing" role="img" :aria-label="etiqueta" />
    <!-- Pallet (o bandeja de angulo ranurado) armado caja por caja en 3D, con sus cotas. three.js se carga solo al mostrarse -->
    <div v-if="cargando" class="absolute inset-0 animate-pulse bg-neutral-100" aria-hidden="true" />
    <template v-if="!cargando">
      <!-- Vistas: de lado (con perspectiva) o desde arriba -->
      <div class="absolute left-2 top-2 flex gap-1 rounded-lg bg-white/90 p-0.5 text-xs font-medium shadow-sm ring-1 ring-black/10" role="group" :aria-label="base === 'bandeja' ? 'Vista de la bandeja' : 'Vista del pallet'">
        <button v-for="v in VISTAS" :key="v.k" type="button" :aria-pressed="vista === v.k" :class="['min-h-8 rounded-md px-2.5', vista === v.k ? 'bg-neutral-900 text-white' : 'text-neutral-700']" @click="verDesde(v.k)">{{ v.t }}</button>
      </div>
      <!-- Estante: con o sin cajas (para ver la estructura sola) -->
      <div v-if="base === 'estante'" class="absolute bottom-2 left-2 flex gap-1 rounded-lg bg-white/90 p-0.5 text-xs font-medium shadow-sm ring-1 ring-black/10" role="group" aria-label="Cajas en el estante">
        <button v-for="o in [{ v: true, t: 'Con cajas' }, { v: false, t: 'Sin cajas' }]" :key="o.t" type="button" :aria-pressed="conCajas === o.v" :class="['min-h-8 rounded-md px-2.5', conCajas === o.v ? 'bg-neutral-900 text-white' : 'text-neutral-700']" @click="conCajas = o.v; armar(o.v)">{{ o.t }}</button>
      </div>
      <div class="absolute right-2 top-2 flex gap-1">
        <button type="button" class="min-h-8 rounded-lg bg-white/90 px-2.5 text-xs font-medium text-neutral-700 shadow-sm ring-1 ring-black/10 hover:bg-white" :aria-label="'Armar de nuevo'" title="Armar de nuevo" @click="armar(true)">↻</button>
      </div>
      <!-- Acercar y alejar a la vista (la rueda o el pellizco también sirven; girar: arrastrar) -->
      <div class="absolute bottom-2 right-2 flex flex-col overflow-hidden rounded-lg bg-white/90 shadow-sm ring-1 ring-black/10">
        <button type="button" class="h-9 w-9 text-lg font-semibold text-neutral-700 hover:bg-white" aria-label="Acercar" title="Acercar" @click="visor?.acercar(0.75)">+</button>
        <button type="button" class="h-9 w-9 border-t border-black/10 text-lg font-semibold text-neutral-700 hover:bg-white" aria-label="Alejar" title="Alejar" @click="visor?.acercar(1.33)">−</button>
      </div>
    </template>
    <!-- Cotas en texto (tambien para lectores de pantalla y si no hay 3D) -->
    <p class="sr-only">frente {{ fm(frente) }} m, fondo {{ fm(fondo) }} m<template v-if="alto">, alto {{ fm(alto) }} m</template>, {{ camas }} {{ camas === 1 ? 'cama' : 'camas' }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = withDefaults(defineProps<{
  frente: number; fondo: number;
  caja: { largo: number; ancho: number; alto: number };
  cols: number; filas: number; camas: number; largoEnFrente: boolean;
  etiqueta?: string; alto?: number;
  // 'pallet': tarima de madera; 'bandeja': bandeja de angulo ranurado (galvanizada, con sus 4 angulos);
  // 'estante': el modulo entero de angulo ranurado (estante), con sus bandejas y las cajas en cada nivel
  base?: 'pallet' | 'bandeja' | 'estante';
  // Estante: alto del angulo, base de cada bandeja (m, la ultima es el tope), espesor y niveles que llevan cajas
  estante?: { alto: number; bandejasY: number[]; espesor: number; carga: number } | null;
}>(), { base: 'pallet', etiqueta: undefined, alto: undefined, estante: null });
const fm = (v: number) => (+(+v).toFixed(2)).toLocaleString('es-CL', { minimumFractionDigits: 2 });
const VISTAS = [{ k: 'lado', t: 'De lado' }, { k: 'arriba', t: 'Desde arriba' }] as const;
const vista = ref<'lado' | 'arriba'>('lado');
const conCajas = ref(true);
// Encuadre: de lado en diagonal (frente a la derecha) o desde arriba (frente abajo, como en el pasillo)
const DIRECCION = { lado: [1, 0.8, 1.35], arriba: [0, 1, 0.001] };
const lienzo = ref<HTMLElement | null>(null);
const cargando = ref(true);
let visor: any = null, construir: any = null, THREE: any = null, reloj: ReturnType<typeof setTimeout> | null = null;
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ALTO_BANDEJA = 0.03;

// Etiqueta de cota: texto oscuro sobre fondo blanco, siempre de frente a la camara y encima de todo
function etiquetaCota(lineas: string[], alturaMundo: number) {
  const fs = 44, pad = 14, c = document.createElement('canvas'), x = c.getContext('2d')!;
  x.font = `600 ${fs}px Inter, "Helvetica Neue", Arial, sans-serif`;
  const w = Math.ceil(Math.max(...lineas.map((l) => x.measureText(l).width)) + pad * 2), h = Math.ceil(lineas.length * fs * 1.15 + pad * 1.4);
  c.width = w; c.height = h;
  x.font = `600 ${fs}px Inter, "Helvetica Neue", Arial, sans-serif`;
  x.fillStyle = 'rgba(255,255,255,0.94)';
  x.strokeStyle = 'rgba(15,23,42,0.18)'; x.lineWidth = 3;
  x.beginPath(); x.roundRect(1.5, 1.5, w - 3, h - 3, 14); x.fill(); x.stroke();
  x.fillStyle = '#0f172a'; x.textAlign = 'center'; x.textBaseline = 'middle';
  lineas.forEach((l, i) => { x.fillStyle = i ? '#475569' : '#0f172a'; x.fillText(l, w / 2, pad * 0.7 + fs * 1.15 * (i + 0.5)); });
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, depthTest: false, transparent: true, fog: false, toneMapped: false }));
  const k = alturaMundo / (fs * 1.15);
  s.scale.set(w * k, h * k, 1);
  s.renderOrder = 20;
  return s;
}

// Linea de cota con remates (segmentos entre pares de puntos)
function lineaCota(puntos: number[][]) {
  const geo = new THREE.BufferGeometry().setFromPoints(puntos.map((p) => new THREE.Vector3(...p)));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x1e293b, depthTest: false, transparent: true, fog: false }));
  l.renderOrder = 19;
  return l;
}

function cotas(g: any, top: number, baseAlto: number) {
  const f = props.frente, d = props.fondo, S = Math.max(f, d, top), off = S * 0.08, t = S * 0.03, letra = S * ((lienzo.value?.clientWidth ?? 600) < 500 ? 0.12 : 0.085) * (props.base === 'estante' ? 0.6 : 1);
  const zf = d / 2 + off, xd = f / 2 + off, xa = -f / 2 - off;
  // Frente (a lo largo del pasillo), al pie
  g.add(lineaCota([[-f / 2, 0.003, zf], [f / 2, 0.003, zf], [-f / 2, 0.003, zf - t], [-f / 2, 0.003, zf + t], [f / 2, 0.003, zf - t], [f / 2, 0.003, zf + t]]));
  const ef = etiquetaCota([`frente ${fm(f)} m`], letra);
  ef.position.set(0, letra * 0.6, zf + off * 0.9);
  g.add(ef);
  // Fondo, al costado derecho
  g.add(lineaCota([[xd, 0.003, -d / 2], [xd, 0.003, d / 2], [xd - t, 0.003, -d / 2], [xd + t, 0.003, -d / 2], [xd - t, 0.003, d / 2], [xd + t, 0.003, d / 2]]));
  const ed = etiquetaCota([`fondo ${fm(d)} m`], letra);
  ed.position.set(xd + off * 0.6 + ed.scale.x / 2, letra * 0.6, 0);
  g.add(ed);
  // Estante: alto del angulo, con una marca en cada bandeja
  if (props.base === 'estante' && props.estante) {
    const e = props.estante, pts: number[][] = [[xa, 0, zf], [xa, e.alto, zf], [xa - t, 0, zf], [xa + t, 0, zf], [xa - t, e.alto, zf], [xa + t, e.alto, zf]];
    e.bandejasY.slice(1, -1).forEach((yb) => pts.push([xa - t * 0.6, yb, zf], [xa + t * 0.6, yb, zf]));
    g.add(lineaCota(pts));
    const ea = etiquetaCota([`ángulo ${fm(e.alto)} m`, `${e.carga} ${e.carga === 1 ? 'nivel' : 'niveles'} de bandeja`], letra);
    ea.position.set(xa - off * 0.4 - ea.scale.x / 2, e.alto / 2, zf);
    g.add(ea);
    return;
  }
  // Alto, en la esquina de adelante a la izquierda, con una marca por cama
  if (props.camas > 0) {
    const pts: number[][] = [[xa, 0, zf], [xa, top, zf], [xa - t, 0, zf], [xa + t, 0, zf], [xa - t, top, zf], [xa + t, top, zf]];
    for (let c = 1; c < props.camas; c++) { const yc = baseAlto + c * props.caja.alto; pts.push([xa - t * 0.6, yc, zf], [xa + t * 0.6, yc, zf]); }
    g.add(lineaCota(pts));
    const altoTxt = props.base === 'bandeja' ? `${fm(top - baseAlto)} m de cajas` : `alto ${fm(top)} m`;
    const ea = etiquetaCota([altoTxt, `${props.camas} ${props.camas === 1 ? (props.base === 'bandeja' ? 'caja de alto' : 'cama') : (props.base === 'bandeja' ? 'cajas de alto' : 'camas')}`], letra);
    ea.position.set(xa - off * 0.4 - ea.scale.x / 2, top / 2, zf);
    g.add(ea);
  }
}

// Bandeja de angulo ranurado: plancha galvanizada y los 4 angulos (cortos, para no tapar las cajas)
function bandeja(g: any, top: number) {
  const f = props.frente, d = props.fondo;
  const galv = new THREE.MeshStandardMaterial({ color: 0xb4bac1, metalness: 0.7, roughness: 0.38 });
  const plancha = new THREE.Mesh(new THREE.BoxGeometry(f, ALTO_BANDEJA, d), galv);
  plancha.position.y = ALTO_BANDEJA / 2;
  plancha.castShadow = true; plancha.receiveShadow = true;
  g.add(plancha);
  const azul = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 });
  const a = 0.035, h = top + 0.08;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(a, h, a), azul);
    p.position.set(sx * (f / 2 + a / 2), h / 2, sz * (d / 2 + a / 2));
    p.castShadow = true;
    g.add(p);
  });
}

// Estante de angulo ranurado: 4 angulos, una bandeja galvanizada en cada altura (la de arriba cierra) y las
// cajas de cada nivel, que se llenan de abajo hacia arriba
function estante() {
  const e = props.estante!, f = props.frente, d = props.fondo;
  // El estante es el mismo del 3D de la bodega: angulos L de 38 × 38 × 2 mm perforados cada 20 mm y bandejas
  const g = construir.construirAnra({
    tipo: 'anra', cuerpos: 1, doble: false, galvanizado: true, frente: f, fondo: d, frenteExt: f + 0.004, fondoExt: d + 0.004,
    alto: e.alto, nivelesY: e.bandejasY.map((y) => y + e.espesor / 2),
  });
  const niveles: any[] = [];
  e.bandejasY.slice(0, e.carga).forEach((y0) => {
    if (!(props.camas > 0) || !conCajas.value) return;
    const c = construir.palletArmado({ ...props, altoTarima: e.espesor });
    const tarima = c.children[0];
    c.remove(tarima); tarima.geometry?.dispose(); tarima.material?.dispose?.();
    // Contra el frente de la bandeja (el pasillo): se sacan por ahi
    const dz = props.largoEnFrente ? props.caja.ancho : props.caja.largo;
    c.position.set(0, y0, (d - props.filas * dz) / 2);
    g.add(c);
    niveles.push(c);
  });
  g.userData.animar = (dt: number) => niveles.some((c) => c.userData.animar?.(dt));
  g.userData.reiniciar = () => niveles.forEach((c) => c.userData.reiniciar?.());
  g.userData.completar = () => niveles.forEach((c) => c.userData.completar?.());
  return g;
}

// ─── Cajas del pallet (selectivo): carton corrugado con su junta, cinta arriba y una etiqueta al frente ───
// Antes cada caja llevaba el logo grande en las 4 caras y el pallet se veia como un muro de logos sin
// juntas. Ahora cada caja tiene el borde marcado (se cuentan a simple vista), un tono apenas distinto y la
// cinta de embalaje arriba; la etiqueta va solo en las caras que dan al frente y al costado.
const KRAFT = '#c99a5b';
const texturas = new Map<string, any>();
function caraCaja(anchoM: number, altoM: number, tipo: 'tapa' | 'lado' | 'frente') {
  const clave = [anchoM.toFixed(3), altoM.toFixed(3), tipo].join();
  if (texturas.has(clave)) return texturas.get(clave);
  const ppm = Math.min(700, 512 / Math.max(anchoM, altoM));
  const c = document.createElement('canvas');
  const w = c.width = Math.max(24, Math.round(anchoM * ppm)), h = c.height = Math.max(16, Math.round(altoM * ppm));
  const x = c.getContext('2d')!;
  x.fillStyle = KRAFT; x.fillRect(0, 0, w, h);
  // Corrugado: lineas finas en el sentido de la onda
  x.fillStyle = 'rgba(110,72,30,0.06)';
  for (let i = 0; i < h; i += 3) x.fillRect(0, i, w, 1);
  const borde = Math.max(2, Math.round(Math.min(w, h) * 0.035));
  if (tipo === 'tapa') {
    // Solapas que se juntan al medio y la cinta encima, a lo largo del lado mayor
    const largoX = w >= h, cinta = Math.max(4, Math.round((largoX ? h : w) * 0.16));
    x.fillStyle = 'rgba(80,50,20,0.35)';
    if (largoX) x.fillRect(0, h / 2 - 1, w, 2); else x.fillRect(w / 2 - 1, 0, 2, h);
    x.fillStyle = 'rgba(214,180,128,0.95)';
    if (largoX) x.fillRect(0, h / 2 - cinta / 2, w, cinta); else x.fillRect(w / 2 - cinta / 2, 0, cinta, h);
  } else {
    // Cinta que baja por el lado (solo en la cara donde termina)
    if (tipo === 'frente') {
      const cinta = Math.max(4, Math.round(w * 0.12));
      x.fillStyle = 'rgba(214,180,128,0.95)';
      x.fillRect(w / 2 - cinta / 2, 0, cinta, Math.min(h * 0.22, cinta * 2.2));
      // Etiqueta blanca abajo a la derecha, con el logo si cabe
      const ew = Math.min(w * 0.42, h * 0.9), eh = Math.min(h * 0.32, ew * 0.55);
      if (ew > 18 && eh > 9) {
        const ex = w - ew - w * 0.08, ey = h - eh - h * 0.12;
        x.fillStyle = '#f7f5f0'; x.fillRect(ex, ey, ew, eh);
        x.fillStyle = 'rgba(30,30,30,0.55)';
        if (logo3d) {
          const lw = ew * 0.8, lh = Math.min(eh * 0.45, lw * logo3d.naturalHeight / logo3d.naturalWidth);
          x.drawImage(logo3d, ex + (ew - lw) / 2, ey + eh * 0.12, lw, lh);
        }
        // Codigo de barras
        for (let i = 0, bx = ex + ew * 0.1; bx < ex + ew * 0.9; i++) { const bw = (i % 3 === 0 ? 2 : 1); x.fillRect(bx, ey + eh * 0.62, bw, eh * 0.26); bx += bw + 1.5; }
      }
    }
  }
  // Junta: borde oscuro para que cada caja se distinga de la vecina
  x.strokeStyle = 'rgba(70,44,16,0.55)'; x.lineWidth = borde;
  x.strokeRect(borde / 2, borde / 2, w - borde, h - borde);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  const mt = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.88, metalness: 0 });
  mt.userData.compartido = true;
  texturas.set(clave, mt);
  return mt;
}
let logo3d: HTMLImageElement | null = null;
function cajasPallet(g: any, altoTarima: number) {
  const { caja, cols, filas, camas, largoEnFrente } = props;
  const n = cols * filas * camas;
  if (!(n > 0)) return;
  const dx = largoEnFrente ? caja.largo : caja.ancho, dz = largoEnFrente ? caja.ancho : caja.largo;
  const j = Math.min(0.006, Math.min(dx, dz, caja.alto) * 0.04);   // junta entre cajas
  const ax = dx - j, ay = caja.alto - j, az = dz - j;
  const lado = caraCaja(az, ay, 'lado'), frente = caraCaja(ax, ay, 'frente'), tapa = caraCaja(ax, az, 'tapa');
  // Orden de BoxGeometry: +x, −x, +y, −y, +z, −z (el frente del pallet es +z)
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(ax, ay, az), [lado, lado, tapa, tapa, frente, lado], n);
  const x0 = -(cols * dx) / 2 + dx / 2, z0 = -(filas * dz) / 2 + dz / 2;
  const m = new THREE.Matrix4(), col = new THREE.Color();
  let k = 0;
  for (let c = 0; c < camas; c++) for (let f = 0; f < filas; f++) for (let i = 0; i < cols; i++) {
    m.makeTranslation(x0 + i * dx, altoTarima + c * caja.alto + caja.alto / 2, z0 + f * dz);
    im.setMatrixAt(k, m);
    // Tono apenas distinto por caja (determinista: no cambia al rearmar)
    const v = 0.9 + ((((i * 7 + f * 13 + c * 5) % 9) / 8) * 0.12);
    im.setColorAt(k++, col.setRGB(v, v, v));
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  im.castShadow = true; im.receiveShadow = true;
  g.add(im);
  // Se arma cama por cama en ~1,6 s
  let puestas = 0;
  const porSegundo = Math.max(12, n / 1.6);
  g.userData.animar = (dt: number) => {
    if (puestas >= n) return false;
    puestas = Math.min(n, puestas + porSegundo * dt + (puestas ? 0 : 1));
    im.count = Math.floor(puestas);
    return true;
  };
  g.userData.reiniciar = () => { puestas = 0; im.count = 0; };
  g.userData.completar = () => { puestas = n; im.count = n; };
}

function armar(animar: boolean) {
  if (!visor || !construir) return;
  if (props.base === 'estante' && props.estante) {
    const g = estante();
    cotas(g, props.estante.alto, 0);
    visor.reservar?.(44, 6);
    visor.mostrar(g, { direccion: DIRECCION[vista.value], animar: false });
    if (animar && !quieto()) { g.userData.reiniciar(); visor.operar(true); } else { g.userData.completar(); visor.operar(false); }
    return;
  }
  const enBandeja = props.base === 'bandeja';
  const altoBase = enBandeja ? ALTO_BANDEJA : 0.15;
  // Pallet: la tarima sale de construir.js y las cajas se dibujan aqui (cajasPallet)
  const g = construir.palletArmado({ ...props, camas: enBandeja ? props.camas : 0, altoTarima: altoBase });
  if (!enBandeja) cajasPallet(g, altoBase);
  if (enBandeja) {
    // Sin tarima de madera: la bandeja la reemplaza
    const tarima = g.children[0];
    g.remove(tarima); tarima.geometry?.dispose(); tarima.material?.dispose?.();
  }
  const top = altoBase + Math.max(0, props.camas) * props.caja.alto;
  if (enBandeja) bandeja(g, top);
  cotas(g, top, altoBase);
  // Encuadre: el modelo con sus cotas llena el visor (solo se reserva la franja de los botones de arriba)
  visor.reservar?.(44, 6);
  visor.mostrar(g, { direccion: DIRECCION[vista.value], animar: false });
  if (animar && !quieto()) { g.userData.reiniciar?.(); visor.operar(true); } else { g.userData.completar?.(); visor.operar(false); }
}

function verDesde(v: 'lado' | 'arriba') {
  vista.value = v;
  armar(false);
}

onMounted(async () => {
  const [v, c, t] = await Promise.all([import('~/lib/rack3d/visor.js'), import('~/lib/rack3d/construir.js'), import('three')]);
  if (!lienzo.value || !v.webglDisponible()) return;
  const logoListo = new Promise<void>((ok) => { const img = new Image(); img.onload = () => { logo3d = img; ok(); }; img.onerror = () => ok(); img.src = '/assets/images/logo.webp'; });
  await Promise.race([Promise.all([c.cargarLogo(), logoListo]), new Promise((ok) => setTimeout(ok, 1200))]);
  if (!lienzo.value) return;
  construir = c; THREE = t;
  visor = v.crearVisor(lienzo.value);
  cargando.value = false;
  armar(true);
});
// Cada cambio se ve al instante (se rearma, sin esperar a que termine la animacion anterior)
watch(() => JSON.stringify(props), () => {
  if (reloj) clearTimeout(reloj);
  reloj = setTimeout(() => armar(true), 180);
});
onBeforeUnmount(() => { if (reloj) clearTimeout(reloj); visor?.destruir(); visor = null; });
</script>
