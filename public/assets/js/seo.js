// Injeção dinâmica de SEO para páginas de posts
// Chamado por post-view.js após carregar o documento do Firestore

const SITE_NAME = 'thestation.ai';
const SITE_URL  = 'https://thestation.ai';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/og-default.jpg`;

/**
 * Injeta todas as meta tags SEO, OG, Twitter Cards e JSON-LD para um post.
 * @param {object} post - Documento do Firestore
 * @param {'blog'|'news'} type
 */
export function injectPostSEO(post, type) {
  const seo  = post.seo || {};
  const base = type === 'blog' ? 'blog' : 'noticias';

  const title       = seo.metaTitle       || post.title;
  const description = seo.metaDescription || post.excerpt || '';
  const canonical   = seo.canonicalUrl    || `${SITE_URL}/${base}/${post.slug}`;
  const ogTitle     = seo.ogTitle         || title;
  const ogDesc      = seo.ogDescription   || description;
  const ogImage     = seo.ogImage         || post.featuredImageUrl || DEFAULT_OG_IMAGE;
  const twitterCard = seo.twitterCard     || 'summary_large_image';

  // Título da página
  document.title = `${title} — ${SITE_NAME}`;

  // Remove tags dinâmicas anteriores
  document.querySelectorAll('[data-dynamic-seo]').forEach((el) => el.remove());

  // Helper para criar meta tags
  const meta = (attrs) => {
    const el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute('data-dynamic-seo', '');
    return el;
  };
  const link = (attrs) => {
    const el = document.createElement('link');
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    el.setAttribute('data-dynamic-seo', '');
    return el;
  };

  const head = document.head;

  // Primary SEO
  head.appendChild(meta({ name: 'description', content: description }));
  head.appendChild(link({ rel: 'canonical', href: canonical }));

  // Open Graph
  head.appendChild(meta({ property: 'og:type',        content: 'article' }));
  head.appendChild(meta({ property: 'og:url',         content: canonical }));
  head.appendChild(meta({ property: 'og:title',       content: ogTitle }));
  head.appendChild(meta({ property: 'og:description', content: ogDesc }));
  head.appendChild(meta({ property: 'og:image',       content: ogImage }));
  head.appendChild(meta({ property: 'og:locale',      content: 'pt_BR' }));
  head.appendChild(meta({ property: 'og:site_name',   content: SITE_NAME }));

  // Twitter Card
  head.appendChild(meta({ name: 'twitter:card',        content: twitterCard }));
  head.appendChild(meta({ name: 'twitter:title',       content: ogTitle }));
  head.appendChild(meta({ name: 'twitter:description', content: ogDesc }));
  head.appendChild(meta({ name: 'twitter:image',       content: ogImage }));

  // JSON-LD
  const schema = post.schema ? JSON.parse(post.schema) : buildArticleSchema(post, canonical, ogImage);
  const scriptEl = document.createElement('script');
  scriptEl.type = 'application/ld+json';
  scriptEl.textContent = JSON.stringify(schema);
  scriptEl.setAttribute('data-dynamic-seo', '');
  head.appendChild(scriptEl);
}

/**
 * Gera automaticamente um Article schema se o admin não preencheu o campo.
 */
function buildArticleSchema(post, url, image) {
  const publishedAt = post.publishedAt?.toDate?.()?.toISOString() || new Date().toISOString();
  const updatedAt   = post.updatedAt?.toDate?.()?.toISOString()   || publishedAt;

  return {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:        post.title,
    description:     post.excerpt || '',
    image:           image,
    url:             url,
    datePublished:   publishedAt,
    dateModified:    updatedAt,
    author: {
      '@type': 'Person',
      name:    post.authorName || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name:    SITE_NAME,
      url:     SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url:     `${SITE_URL}/assets/img/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id':   url,
    },
  };
}
