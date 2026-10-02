import tailwindcss from "@tailwindcss/vite";
import products from "./stores/products.json";
import services from "./stores/services.json";
import blog from "./stores/blog.json";

const SITE_URL = "https://racklog.cl";

// Todas las rutas se generan como HTML estatico (SSG) al compilar
const prerenderRoutes = [
  "/",
  "/nosotros",
  "/productos",
  "/blog",
  "/carrito",
  "/politica-privacidad",
  "/politica-cookies",
  "/terminos",
  "/sitemap.xml",
  ...products.map((p) => `/productos/${p.slug}`),
  ...services.map((s) => `/servicios/${s.slug}`),
  ...blog.map((b) => `/blog/${b.slug}`),
];

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  css: ["~/assets/css/main.css"],

  // Contenido estatico: se renderiza en build (SSG) para que buscadores y
  // redes sociales reciban el HTML completo de cada pagina
  ssr: true,

  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
    },
  },

  // El hosting sirve cada pagina como carpeta (/productos/), asi que los
  // enlaces llevan barra final para evitar un 301 en cada clic
  experimental: {
    defaults: {
      nuxtLink: { trailingSlash: "append" },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: "es-CL" },
      titleTemplate: "%s | Racklog",
      title: "Racks y estanterías industriales en Chile",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Racklog fabrica e instala racks selectivos, ángulo ranurado, mini racks y soluciones de almacenamiento industrial en Chile. Cotiza en línea.",
        },
        { name: "theme-color", content: "#262626" },
        { property: "og:site_name", content: "Racklog" },
        { property: "og:locale", content: "es_CL" },
        { property: "og:type", content: "website" },
        { property: "og:image", content: `${SITE_URL}/assets/images/og-racklog.jpg` },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  nitro: {
    preset: "static",
    prerender: {
      routes: prerenderRoutes,
      crawlLinks: true,
      failOnError: true,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
