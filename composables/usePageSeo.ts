interface PageSeo {
  title: string;
  description: string;
  /** Ruta de imagen dentro del sitio (ej. /assets/images/x.webp) o URL absoluta */
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

/** Titulo, descripcion y metadatos Open Graph / Twitter de una pagina. */
export function usePageSeo(seo: PageSeo) {
  const { siteUrl } = useRuntimeConfig().public;
  const description = seo.description.length > 160
    ? seo.description.slice(0, 157).replace(/\s+\S*$/, '') + '…'
    : seo.description;
  const image = seo.image
    ? (seo.image.startsWith('http') ? seo.image : siteUrl + seo.image)
    : undefined;

  useSeoMeta({
    title: seo.title,
    description,
    ogTitle: `${seo.title} | Racklog`,
    ogDescription: description,
    ogType: seo.type === 'article' ? 'article' : 'website',
    ...(image ? { ogImage: image, twitterImage: image } : {}),
    twitterTitle: `${seo.title} | Racklog`,
    twitterDescription: description,
    ...(seo.noindex ? { robots: 'noindex, follow' } : {}),
  });
}
