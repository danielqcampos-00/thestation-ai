// post-view.js — Renderiza post individual a partir do slug na URL

import { getPostBySlug } from './firestore.js';
import { injectPostSEO }  from './seo.js';
import { renderContent }  from './renderer.js';

// Detecta tipo pelo pathname
const type = window.location.pathname.includes('/noticias') ? 'news' : 'blog';
const listHref = type === 'news' ? '/noticias' : '/blog';
const listLabel = type === 'news' ? 'Notícias' : 'Blog';

const container = document.getElementById('post-container');

// ─── Lê slug da URL ───────────────────────────────────────────────────────────

function getSlug() {
  // Suporta /blog/nome-do-post (rewrite Firebase) e /blog/post.html?slug=nome
  const params = new URLSearchParams(window.location.search);
  if (params.get('slug')) return params.get('slug');

  // Extrai do path: /blog/nome-do-post → nome-do-post
  const parts = window.location.pathname.replace(/\/$/, '').split('/');
  const last = parts[parts.length - 1];
  return last !== 'post.html' ? last : null;
}

// ─── Formata data ─────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Render ───────────────────────────────────────────────────────────────────

async function renderPost(post) {
  const date = formatDate(post.publishedAt);
  const html  = await renderContent(post.content, post.contentFormat || 'markdown');

  const image = post.featuredImageUrl
    ? `<div class="post__featured-image">
         <img src="${post.featuredImageUrl}" alt="${post.title}" width="1200" height="675">
       </div>`
    : '';

  container.innerHTML = `
    <article class="post">
      <header class="post__header">
        <nav class="post__breadcrumb breadcrumb" aria-label="Caminho da página">
          <a href="/">Início</a>
          <span><a href="${listHref}">${listLabel}</a></span>
          <span>${post.title}</span>
        </nav>

        <div class="post__meta">
          <span class="badge ${type === 'news' ? 'badge--news' : 'badge--blog'}">
            ${post.category || listLabel}
          </span>
          ${date ? `<time datetime="${post.publishedAt?.toDate?.()?.toISOString?.() || ''}">${date}</time>` : ''}
          ${post.tags?.length ? `<span>${post.tags.map(t => `#${t}`).join(' ')}</span>` : ''}
        </div>

        <h1 class="post__title">${post.title}</h1>

        ${post.excerpt ? `<p class="post__excerpt">${post.excerpt}</p>` : ''}

        <div class="post__author">
          <div>
            <span class="post__author-name">${post.authorName || 'thestation.ai'}</span>
          </div>
        </div>
      </header>

      ${image}

      <div class="post__content prose">${html}</div>

      <div class="post__share">
        <span class="post__share-label">Compartilhar:</span>
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}"
           target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm">Twitter / X</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}"
           target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm">LinkedIn</a>
        <a href="https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}"
           target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm">WhatsApp</a>
      </div>
    </article>
  `;
}

function renderNotFound() {
  container.innerHTML = `
    <div class="post">
      <div class="post__not-found">
        <h1>Post não encontrado</h1>
        <p>O conteúdo que você procura não existe ou foi removido.</p>
        <a href="${listHref}" class="btn btn--primary">Voltar para ${listLabel}</a>
      </div>
    </div>
  `;
}

function renderLoading() {
  container.innerHTML = `
    <div class="post">
      <div class="post__loading" style="text-align:center; padding:5rem 0;">
        <div class="spinner" aria-label="Carregando post..."></div>
      </div>
    </div>
  `;
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const slug = getSlug();

  if (!slug) { renderNotFound(); return; }

  renderLoading();

  try {
    const post = await getPostBySlug(slug);

    if (!post || post.status !== 'published') {
      renderNotFound();
      return;
    }

    injectPostSEO(post, type);
    await renderPost(post);
  } catch (err) {
    console.error('Erro ao carregar post:', err);
    renderNotFound();
  }
}

init();
