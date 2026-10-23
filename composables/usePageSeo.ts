interface PageSeo {
  title: string;
  description: string;
  /** Ruta de imagen dentro del sitio (ej. /assets/images/x.webp) o URL absoluta */
  image?: string;
  /** Texto alternativo de la imagen social */
  imageAlt?: string;
  /** Texto propio para Facebook/LinkedIn/WhatsApp (og:description) y para X (twitter:description); por defecto, description */
  ogDescription?: string;
  twitterDescription?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

/** Titulo, descripcion y metadatos Open Graph / Twitter de una pagina. */
export function usePageSeo(seo: PageSeo) {
  const { siteUrl } = useRuntimeConfig().public;
  const corta = (t: string) => t.length > 160 ? t.slice(0, 157).replace(/\s+\S*$/, '') + '…' : t;
  const description = corta(seo.description);
  const image = seo.image
    ? (seo.image.startsWith('http') ? seo.image : siteUrl + seo.image)
    : undefined;

  useSeoMeta({
    title: seo.title,
    description,
    ogTitle: `${seo.title} | Racklog`,
    ogDescription: seo.ogDescription ? corta(seo.ogDescription) : description,
    ogType: seo.type === 'article' ? 'article' : 'website',
    ...(image ? { ogImage: image, twitterImage: image } : {}),
    ...(image && seo.imageAlt ? { ogImageAlt: seo.imageAlt, twitterImageAlt: seo.imageAlt } : {}),
    twitterTitle: `${seo.title} | Racklog`,
    twitterDescription: seo.twitterDescription ? corta(seo.twitterDescription) : description,
    ...(seo.noindex ? { robots: 'noindex, follow' } : {}),
  });
}
