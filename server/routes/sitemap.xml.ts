import products from '../../stores/products.json';
import services from '../../stores/services.json';
import blog from '../../stores/blog.json';

// Se genera en el build (prerender) a partir de los mismos datos del sitio
export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig().public;
  const today = new Date().toISOString().slice(0, 10);

  const pages: { path: string; lastmod?: string; priority: string }[] = [
    { path: '/', priority: '1.0' },
    { path: '/productos', priority: '0.9' },
    ...products.map((p) => ({ path: `/productos/${p.slug}`, priority: '0.9' })),
    ...services.map((s) => ({ path: `/servicios/${s.slug}`, priority: '0.8' })),
    { path: '/blog', priority: '0.7' },
    ...blog.map((b) => ({ path: `/blog/${b.slug}`, lastmod: b.date?.slice(0, 10), priority: '0.6' })),
    { path: '/nosotros', priority: '0.6' },
    { path: '/politica-privacidad', priority: '0.2' },
    { path: '/politica-cookies', priority: '0.2' },
    { path: '/terminos', priority: '0.2' },
  ];

  // Con barra final: es la URL que sirve el hosting sin redirigir
  const urls = pages
    .map((p) => `  <url>\n    <loc>${siteUrl}${p.path.replace(/\/?$/, '/')}</loc>\n    <lastmod>${p.lastmod || today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`)
    .join('\n');

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
});
