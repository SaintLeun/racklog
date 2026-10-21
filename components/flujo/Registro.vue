<template>
  <!-- Registro: se pide cuando el cliente ya vio valor, antes del resultado detallado -->
  <form class="fl-card" novalidate @submit.prevent="enviar">
    <p class="text-sm font-semibold uppercase tracking-wider text-brand-700">Tu diseño está listo</p>
    <h2 class="mt-1 text-[22px] font-bold leading-tight text-neutral-900">¿A quién le enviamos los resultados?</h2>
    <p class="mt-1 text-neutral-600">Ves tu revisión, el 3D y la lista para cotizar. Sin costo.</p>
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <label class="fl-campo"><span>Nombre</span><input v-model.trim="p.lead.nombre" autocomplete="name" class="form-input" :class="e.nombre && 'fl-error'"><small v-if="e.nombre" class="fl-msg">{{ e.nombre }}</small></label>
      <label class="fl-campo"><span>Empresa</span><input v-model.trim="p.lead.empresa" autocomplete="organization" class="form-input" :class="e.empresa && 'fl-error'"><small v-if="e.empresa" class="fl-msg">{{ e.empresa }}</small></label>
      <label class="fl-campo"><span>RUT de la empresa</span><input v-model="p.lead.rut" placeholder="76.123.456-7" class="form-input" :class="e.rut && 'fl-error'" @blur="p.lead.rut = formatearRut(p.lead.rut)"><small v-if="e.rut" class="fl-msg">{{ e.rut }}</small></label>
      <label class="fl-campo"><span>Correo</span><input v-model.trim="p.lead.correo" type="email" autocomplete="email" placeholder="tu@empresa.cl" class="form-input" :class="e.correo && 'fl-error'"><small v-if="e.correo" class="fl-msg">{{ e.correo }}</small><em v-else class="text-sm not-italic text-neutral-500">Correo de empresa o Gmail.</em></label>
      <label class="fl-campo"><span>Celular</span><input v-model="p.lead.telefono" type="tel" autocomplete="tel" placeholder="9 1234 5678" class="form-input" :class="e.telefono && 'fl-error'"><small v-if="e.telefono" class="fl-msg">{{ e.telefono }}</small></label>
      <label class="fl-campo">
        <span>Tu rol</span>
        <select v-model="p.lead.perfil" class="form-input" :class="e.perfil && 'fl-error'">
          <option value="" disabled>Elige uno</option>
          <option v-for="r in PERFILES" :key="r.v" :value="r.v">{{ r.t }}</option>
        </select>
        <small v-if="e.perfil" class="fl-msg">{{ e.perfil }}</small>
      </label>
      <label class="fl-campo sm:col-span-2">
        <span>Industria</span>
        <select v-model="p.lead.industria" class="form-input" :class="e.industria && 'fl-error'">
          <option value="" disabled>Elige una</option>
          <option v-for="i in INDUSTRIAS" :key="i">{{ i }}</option>
        </select>
        <small v-if="e.industria" class="fl-msg">{{ e.industria }}</small>
      </label>
    </div>
    <button type="submit" class="fl-btn mt-6 w-full">Ver mi revisión</button>
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

function enviar() {
  Object.keys(e).forEach((k) => delete e[k]);
  const l = p.lead;
  if (l.nombre.length < 2) e.nombre = 'Escribe tu nombre.';
  if (l.empresa.length < 2) e.empresa = 'Escribe el nombre de tu empresa.';
  const rut = validarRut(l.rut); if (!rut.ok) e.rut = rut.msg!;
  const correo = validarCorreo(l.correo); if (!correo.ok) e.correo = correo.msg!;
  const tel = validarTelefono(l.telefono); if (!tel.ok) e.telefono = tel.msg!;
  if (!l.perfil) e.perfil = 'Elige tu rol.';
  if (!l.industria) e.industria = 'Elige tu industria.';
  if (Object.keys(e).length) return;
  l.rut = formatearRut(l.rut);
  l.telefono = tel.valor!;
  p.flags = [...new Set([...p.flags.filter((f) => f !== 'persona_natural_con_giro'), ...(rut.personaNatural ? ['persona_natural_con_giro'] : [])])];
  p.registrado = true;
  if (!p.rol) p.rol = l.perfil;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'registro_ok', event_category: 'Planifica tu bodega', rol: l.perfil, industria: l.industria });
  emit('listo');
}
</script>
