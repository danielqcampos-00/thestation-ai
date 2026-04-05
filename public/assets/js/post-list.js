// post-list.js — Listagem paginada de posts (notícias ou blog)
// Detecta o tipo pela URL: /noticias → news, /blog → blog

import { getPublishedPosts } from './firestore.js';

const PAGE_SIZE = 9;

// Detecta tipo pelo pathname
const type = window.location.pathname.includes('/noticias') ? 'news' : 'blog';

const grid       = document.getElementById('posts-grid');
const pagination = document.getElementById('pagination');
const searchInput    = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');

let allPosts   = [];
let filtered   = [];
let currentPage = 1;

// ─── Formata data ─────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Card de post ─────────────────────────────────────────────────────────────

function buildCard(post) {
  const href   = `/${type === 'news' ? 'noticias' : 'blog'}/${post.slug}`;
  const date   = formatDate(post.publishedAt);
  const label  = type === 'news' ? 'Notícia' : 'Blog';
  const badgeCls = type === 'news' ? 'badge--news' : 'badge--blog';

  const image = post.featuredImageUrl
    ? `<div class="post-card__image">
         <img src="${post.featuredImageUrl}" alt="${post.title}" loading="lazy" width="600" height="338">
       </div>`
    : '';

  const category = post.category
    ? `<span class="badge ${badgeCls}">${post.category || label}</span>`
    : `<span class="badge ${badgeCls}">${label}</span>`;

  return `
    <article class="post-card">
      ${image}
      <div class="post-card__body">
        <div class="post-card__meta">
          ${category}
          ${date ? `<time datetime="${post.publishedAt?.toDate?.()?.toISOString?.() || ''}">${date}</time>` : ''}
        </div>
        <h2 class="post-card__title">
          <a href="${href}">${post.title}</a>
        </h2>
        ${post.excerpt ? `<p class="post-card__excerpt">${post.excerpt}</p>` : ''}
        <div class="post-card__footer">
          <span>${post.authorName || 'thestation.ai'}</span>
          <a href="${href}" class="btn btn--ghost btn--sm">Ler mais →</a>
        </div>
      </div>
    </article>
  `;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderPage(page) {
  currentPage = page;
  const start = (page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  if (slice.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 0; color:var(--text-muted);">
        Nenhum conteúdo encontrado.
      </div>`;
    pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = slice.map(buildCard).join('');
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  if (total <= 1) { pagination.innerHTML = ''; return; }

  const pages = Array.from({ length: total }, (_, i) => i + 1);
  pagination.innerHTML = pages.map(p => `
    <button class="pagination__btn${p === currentPage ? ' pagination__btn--active' : ''}"
            data-page="${p}" aria-label="Página ${p}" ${p === currentPage ? 'aria-current="page"' : ''}>
      ${p}
    </button>
  `).join('');
}

pagination.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-page]');
  if (btn) renderPage(Number(btn.dataset.page));
});

// ─── Filtros ──────────────────────────────────────────────────────────────────

function applyFilters() {
  const q   = (searchInput?.value || '').toLowerCase();
  const cat = categoryFilter?.value || '';

  filtered = allPosts.filter(p => {
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      (p.excerpt || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q));
    const matchCat = !cat || p.category === cat;
    return matchSearch && matchCat;
  });

  renderPage(1);
}

searchInput?.addEventListener('input', applyFilters);
categoryFilter?.addEventListener('change', applyFilters);

// ─── Carrega categorias no select ─────────────────────────────────────────────

function populateCategories(posts) {
  const cats = [...new Set(posts.map(p => p.category).filter(Boolean))].sort();
  if (!cats.length || !categoryFilter) return;
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function showSkeletons(count = 6) {
  grid.innerHTML = Array.from({ length: count }, () => `
    <article class="post-card post-card--skeleton" aria-hidden="true">
      <div class="post-card__image skeleton-box"></div>
      <div class="post-card__body">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
      </div>
    </article>
  `).join('');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  showSkeletons();

  try {
    allPosts = await getPublishedPosts(type, 100);
    filtered = allPosts;
    populateCategories(allPosts);
    renderPage(1);
  } catch (err) {
    console.error('Erro ao carregar posts:', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 0; color:var(--text-muted);">
        Erro ao carregar o conteúdo. Tente novamente.
      </div>`;
  }
}

init();
