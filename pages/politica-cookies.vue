<template>
  <LegalPage
    title="Política de Cookies"
    subtitle="Qué cookies usamos y cómo puedes controlarlas"
    updated="30 de septiembre de 2026"
  >
    <h2>1. Qué son las cookies</h2>
    <p>
      Las cookies y tecnologías similares (como el almacenamiento local del navegador) son pequeños
      archivos que un sitio guarda en tu dispositivo para recordar información entre visitas.
    </p>

    <h2>2. Cookies que usamos</h2>
    <h3>Necesarias (siempre activas)</h3>
    <p>Permiten que el sitio funcione. No requieren consentimiento y no se usan para rastrearte.</p>
    <table>
      <thead>
        <tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr>
      </thead>
      <tbody>
        <tr><td><code>cart</code></td><td>Guarda los productos de tu cotización.</td><td>Hasta que la vacíes</td></tr>
        <tr><td><code>racklog_consent</code></td><td>Recuerda tu decisión sobre las cookies.</td><td>Hasta que la cambies</td></tr>
      </tbody>
    </table>

    <h3>Analítica (solo con tu consentimiento)</h3>
    <p>Nos ayudan a entender cómo se usa el sitio para mejorarlo. No se cargan hasta que las aceptas.</p>
    <table>
      <thead>
        <tr><th>Proveedor</th><th>Cookies</th><th>Finalidad</th><th>Duración</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Google Analytics (vía Google Tag Manager)</td>
          <td><code>_ga</code>, <code>_ga_*</code></td>
          <td>Contar visitas y medir el uso de páginas y formularios.</td>
          <td>Hasta 2 años</td>
        </tr>
        <tr>
          <td>Microsoft Clarity</td>
          <td><code>_clck</code>, <code>_clsk</code>, <code>CLID</code>, <code>MUID</code></td>
          <td>Analizar la interacción con las páginas (clics, desplazamiento).</td>
          <td>Hasta 1 año</td>
        </tr>
      </tbody>
    </table>

    <h3>Contenido de terceros</h3>
    <p>
      El video de fondo de la página de inicio se carga desde YouTube en su modo de privacidad mejorada
      (<code>youtube-nocookie.com</code>), solo en pantallas grandes. YouTube puede guardar
      información en tu navegador según su propia política.
    </p>

    <h2>3. Cómo gestionar tu consentimiento</h2>
    <p>
      La primera vez que visitas el sitio te pedimos que elijas. Puedes cambiar tu decisión cuando
      quieras:
    </p>
    <p>
      <button
        type="button"
        class="min-h-[44px] px-5 py-2.5 rounded-lg bg-brand-700 text-white font-semibold hover:bg-brand-800"
        @click="openSettings"
      >
        Configurar cookies
      </button>
    </p>
    <p>
      Si retiras el consentimiento, eliminamos las cookies de analítica y dejamos de cargar esos
      servicios. También puedes borrar o bloquear cookies desde la configuración de tu navegador.
    </p>

    <h2>4. Más información</h2>
    <p>
      Para saber cómo tratamos tus datos personales, revisa la
      <NuxtLink to="/politica-privacidad">Política de Privacidad</NuxtLink>. Si tienes dudas, escríbenos a
      <a href="mailto:contacto@racklog.cl">contacto@racklog.cl</a>.
    </p>
  </LegalPage>
</template>

<script setup lang="ts">
const { openSettings } = useConsent();

useSeoMeta({
  title: 'Política de Cookies',
  description: 'Qué cookies usa el sitio de Racklog, para qué sirven y cómo aceptar o rechazar las cookies de analítica.',
});
</script>
