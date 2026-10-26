<template>
  <form class="fl-card" novalidate @submit.prevent="enviar">
    <!-- Registro al inicio: solo la variante 'inicio' del A/B 'registro' (el control lo pide al final, en Cotiza) -->
    <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Antes de empezar</p>
    <h2 class="mt-1 text-[22px] font-bold leading-tight text-neutral-900">¿A quién le enviamos los resultados?</h2>
    <p class="mt-1 text-neutral-600">Te guardamos el diseño y te enviamos la cotización en máximo 24 horas. Sin costo.</p>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <label class="fl-campo"><span>Nombre</span><input id="rg-nombre" v-model.trim="p.lead.nombre" autocomplete="name" class="form-input" :class="e.nombre && 'fl-error'" @blur="revisar('nombre')" @input="corregir('nombre')"><small v-if="e.nombre" class="fl-msg">{{ e.nombre }}</small></label>
      <label class="fl-campo"><span>Empresa</span><input id="rg-empresa" v-model.trim="p.lead.empresa" autocomplete="organization" class="form-input" :class="e.empresa && 'fl-error'" @blur="revisar('empresa')" @input="corregir('empresa')"><small v-if="e.empresa" class="fl-msg">{{ e.empresa }}</small></label>
      <label class="fl-campo"><span>RUT de la empresa <span class="font-normal text-neutral-500">(opcional)</span> <FlujoInfo>Lo encuentras en cualquier factura de tu empresa. Si trabajas como persona natural con giro, usa tu RUT.</FlujoInfo></span><input id="rg-rut" v-model="p.lead.rut" placeholder="76.123.456-7" inputmode="text" class="form-input" :class="e.rut && 'fl-error'" @blur="p.lead.rut = formatearRut(p.lead.rut); revisar('rut')" @input="corregir('rut')"><small v-if="e.rut" class="fl-msg">{{ e.rut }}</small></label>
      <label class="fl-campo"><span>Correo</span><input id="rg-correo" v-model.trim="p.lead.correo" type="email" autocomplete="email" placeholder="tu@empresa.cl" class="form-input" :class="e.correo && 'fl-error'" @blur="revisar('correo')" @input="corregir('correo')"><small v-if="e.correo" class="fl-msg">{{ e.correo }}</small><em v-else class="text-sm not-italic text-neutral-500">Correo de empresa o Gmail.</em></label>
      <label class="fl-campo"><span>Celular</span><input id="rg-telefono" v-model="p.lead.telefono" type="tel" autocomplete="tel" placeholder="9 1234 5678" class="form-input" :class="e.telefono && 'fl-error'" @blur="revisar('telefono')" @input="corregir('telefono')"><small v-if="e.telefono" class="fl-msg">{{ e.telefono }}</small></label>
      <label class="fl-campo">
        <span>Tu rol</span>
        <select id="rg-perfil" v-model="p.lead.perfil" class="form-input" :class="e.perfil && 'fl-error'" @blur="revisar('perfil')" @change="revisar('perfil')">
          <option value="" disabled>Elige uno</option>
          <option v-for="r in PERFILES" :key="r.v" :value="r.v">{{ r.t }}</option>
        </select>
        <small v-if="e.perfil" class="fl-msg">{{ e.perfil }}</small>
      </label>
      <label class="fl-campo sm:col-span-2">
        <span>Industria</span>
        <select id="rg-industria" v-model="p.lead.industria" class="form-input" :class="e.industria && 'fl-error'" @blur="revisar('industria')" @change="revisar('industria')">
          <option value="" disabled>Elige una</option>
          <option v-for="i in INDUSTRIAS" :key="i">{{ i }}</option>
        </select>
        <small v-if="e.industria" class="fl-msg">{{ e.industria }}</small>
      </label>
    </div>
    <button type="submit" class="fl-btn mt-6 w-full">Empezar mi diseño</button>
    <p class="mt-3 text-center text-sm text-neutral-500">No publicamos precios: un ejecutivo revisa tu diseño y te envía la cotización en máximo 24 horas.</p>
  </form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { useProyecto } from '~/stores/proyecto';
import { PERFILES } from '~/lib/rack3d/planificador.js';
import { validarCorreo, validarRut, validarTelefono, formatearRut } from '~/lib/tour/reglas.js';

const emit = defineEmits<{ listo: [] }>();
const p = useProyecto();
const INDUSTRIAS = ['Logística', 'Minería', 'Alimentos', 'Retail', 'Construcción', 'Salud', 'Manufactura', 'Otra'];
const e = reactive<Record<string, string>>({});

// Cada campo se revisa al salir de él (y se limpia apenas se corrige); al enviar se muestra solo el
// primero que falta, con el foco en él: nunca los 7 errores juntos
const CAMPOS = ['nombre', 'empresa', 'rut', 'correo', 'telefono', 'perfil', 'industria'] as const;
type Campo = typeof CAMPOS[number];
function error(c: Campo): string | null {
  const l = p.lead;
  if (c === 'nombre') return l.nombre.length < 2 ? 'Escribe tu nombre.' : null;
  if (c === 'empresa') return l.empresa.length < 2 ? 'Escribe el nombre de tu empresa.' : null;
  if (c === 'rut') { if (!l.rut.trim()) return null; const r = validarRut(l.rut); return r.ok ? null : r.msg!; }
  if (c === 'correo') { const r = validarCorreo(l.correo); return r.ok ? null : r.msg!; }
  if (c === 'telefono') { const r = validarTelefono(l.telefono); return r.ok ? null : r.msg!; }
  if (c === 'perfil') return l.perfil ? null : 'Elige tu rol.';
  return l.industria ? null : 'Elige tu industria.';
}
const tocados = new Set<Campo>();
function revisar(c: Campo) {
  // Un campo vacío que el cliente solo cruzó no se marca hasta que intente enviar
  const vacio = !String((p.lead as any)[c] ?? '').trim();
  if (vacio && !tocados.has(c)) { delete e[c]; return; }
  tocados.add(c);
  const m = error(c); if (m) e[c] = m; else delete e[c];
}
function corregir(c: Campo) { if (e[c] && !error(c)) delete e[c]; tocados.add(c); }

function enviar() {
  const l = p.lead;
  const primero = CAMPOS.find((c) => error(c));
  if (primero) {
    e[primero] = error(primero)!;
    tocados.add(primero);
    document.getElementById(`rg-${primero}`)?.focus();
    return;
  }
  const rut = l.rut.trim() ? validarRut(l.rut) : { ok: false, personaNatural: false }, tel = validarTelefono(l.telefono);
  l.rut = l.rut.trim() ? formatearRut(l.rut) : '';
  l.telefono = tel.valor!;
  p.flags = [...new Set([...p.flags.filter((f) => f !== 'persona_natural_con_giro'), ...(rut.personaNatural ? ['persona_natural_con_giro'] : [])])];
  p.registrado = true;
  if (!p.rol) p.rol = l.perfil;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'registro_ok', event_category: 'Planifica tu bodega', rol: l.perfil, industria: l.industria });
  emit('listo');
}
</script>
