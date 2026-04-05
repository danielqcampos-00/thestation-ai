// admin/news-import.js — Importador de notícias via RSS (proxy CORS)

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { createPost, getPublishedPosts } from '/assets/js/firestore.js';
import { initAdminUI } from '/assets/js/admin/ui.js';

await requireAuth();
initAdminUI(logout);

// ─── Fontes RSS de IA ─────────────────────────────────────────────────────────

const SOURCES = [
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'Notícias',
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'Notícias',
  },
  {
    id: 'mit-tech',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'Análises',
  },
  {
    id: 'theverge-ai',
    name: 'The Verge — AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    category: 'Notícias',
  },
  {
    id: 'wired-ai',
    name: 'Wired — AI',
    url: 'https://www.wired.com/feed/tag/artificial-intelligence/latest/rss',
    category: 'Notícias',
  },
  {
    id: 'deepmind',
    name: 'Google DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    category: 'Pesquisa',
  },
  {
    id: 'openai',
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    category: 'Pesquisa',
  },
];

// Proxy CORS para RSS → JSON
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─── Refs DOM ─────────────────────────────────────────────────────────────────

const fetchBtn        = document.getElementById('fetch-btn');
const resultsEl       = document.getElementById('results-container');
const importFeedback  = document.getElementById('import-feedback');
const importActions   = document.getElementById('import-actions');
const importBtn       = document.getElementById('import-selected-btn');
const selectedCount   = document.getElementById('selected-count');
const sourcesList     = document.getElementById('sources-list');

let articles   = [];
let selected   = new Set();
let existingSlugs = new Set();

// ─── Render fontes ────────────────────────────────────────────────────────────

function renderSources() {
  sourcesList.innerHTML = SOURCES.map(s => `
    <span style="
      display:inline-flex;align-items:center;gap:0.4rem;
      padding:0.2rem 0.75rem;border-radius:100px;font-size:0.75rem;font-weight:600;
      background:var(--accent-glow);color:var(--accent);border:1px solid rgba(99,102,241,0.3)
    ">${s.name}</span>
  `).join('');
}

// ─── Busca RSS ────────────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 80);
}

async function fetchSource(source) {
  const url = `${RSS_PROXY}${encodeURIComponent(source.url)}&count=10`;
  const res  = await fetch(url);
  const data = await res.json();

  if (data.status !== 'ok' || !data.items?.length) return [];

  return data.items.map(item => ({
    sourceId:    source.id,
    sourceName:  source.name,
    category:    source.category,
    title:       item.title || '',
    slug:        toSlug(item.title || ''),
    excerpt:     stripHtml(item.description || item.content || '').slice(0, 200),
    content:     item.content || item.description || '',
    link:        item.link || item.url || '',
    image:       item.thumbnail || item.enclosure?.link || '',
    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    tags:        (item.categories || []).map(t => t.toLowerCase()),
  }));
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

async function fetchAll() {
  fetchBtn.disabled = true;
  fetchBtn.textContent = 'Buscando…';
  resultsEl.innerHTML = `<div style="text-align:center;padding:3rem"><div class="spinner"></div><p style="color:var(--text-muted);margin-top:1rem">Buscando artigos de ${SOURCES.length} fontes…</p></div>`;
  importActions.classList.add('hidden');
  selected.clear();
  articles = [];

  // Carrega slugs já existentes para evitar duplicatas
  try {
    const existing = await getPublishedPosts('news', 200);
    existingSlugs = new Set(existing.map(p => p.slug));
  } catch (_) {}

  const results = await Promise.allSettled(SOURCES.map(fetchSource));

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') articles.push(...r.value);
    else console.warn(`Falha ao buscar ${SOURCES[i].name}:`, r.reason);
  });

  // Remove duplicatas por slug e já importados
  const seen = new Set();
  articles = articles.filter(a => {
    if (!a.slug || seen.has(a.slug) || existingSlugs.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  fetchBtn.disabled = false;
  fetchBtn.textContent = '↓ Buscar Agora';

  renderResults();
}

// ─── Render resultados ────────────────────────────────────────────────────────

function renderResults() {
  if (!articles.length) {
    resultsEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:3rem">Nenhum artigo novo encontrado.</p>`;
    return;
  }

  importActions.classList.remove('hidden');
  updateSelectedCount();

  resultsEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <span style="color:var(--text-muted);font-size:0.875rem">${articles.length} artigos encontrados</span>
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn--ghost btn--sm" id="select-all-btn">Selecionar todos</button>
        <button class="btn btn--ghost btn--sm" id="deselect-all-btn">Desmarcar todos</button>
      </div>
    </div>
    <div class="admin-table-wrapper">
      <table class="admin-table">
        <thead><tr>
          <th style="width:40px"><input type="checkbox" id="check-all"></th>
          <th>Título</th>
          <th>Fonte</th>
          <th>Categoria</th>
          <th>Data</th>
        </tr></thead>
        <tbody>
          ${articles.map((a, i) => `
            <tr>
              <td><input type="checkbox" class="article-check" data-index="${i}"></td>
              <td>
                <strong>${a.title}</strong>
                ${a.excerpt ? `<br><small style="color:var(--text-muted)">${a.excerpt.slice(0, 100)}…</small>` : ''}
                <br><a href="${a.link}" target="_blank" rel="noopener" style="font-size:0.75rem;color:var(--accent)">Ver original ↗</a>
              </td>
              <td><span class="badge badge--news">${a.sourceName}</span></td>
              <td>${a.category}</td>
              <td style="white-space:nowrap;font-size:0.8rem">${a.publishedAt.toLocaleDateString('pt-BR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Eventos de seleção
  document.getElementById('select-all-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.article-check').forEach(cb => { cb.checked = true; selected.add(Number(cb.dataset.index)); });
    document.getElementById('check-all').checked = true;
    updateSelectedCount();
  });

  document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
    document.querySelectorAll('.article-check').forEach(cb => { cb.checked = false; });
    document.getElementById('check-all').checked = false;
    selected.clear();
    updateSelectedCount();
  });

  document.getElementById('check-all')?.addEventListener('change', (e) => {
    document.querySelectorAll('.article-check').forEach(cb => {
      cb.checked = e.target.checked;
      e.target.checked ? selected.add(Number(cb.dataset.index)) : selected.delete(Number(cb.dataset.index));
    });
    updateSelectedCount();
  });

  resultsEl.addEventListener('change', (e) => {
    const cb = e.target.closest('.article-check');
    if (!cb) return;
    const idx = Number(cb.dataset.index);
    cb.checked ? selected.add(idx) : selected.delete(idx);
    updateSelectedCount();
  });
}

function updateSelectedCount() {
  selectedCount.textContent = `${selected.size} selecionado${selected.size !== 1 ? 's' : ''}`;
}

// ─── Importar selecionados ────────────────────────────────────────────────────

importBtn?.addEventListener('click', async () => {
  if (!selected.size) {
    importFeedback.innerHTML = `<span class="form-feedback form-feedback--error">Selecione ao menos um artigo.</span>`;
    return;
  }

  importBtn.disabled = true;
  importBtn.textContent = 'Importando…';
  importFeedback.innerHTML = '';

  const toImport = [...selected].map(i => articles[i]);
  let ok = 0, fail = 0;

  for (const a of toImport) {
    try {
      const content = `> **Fonte:** [${a.sourceName}](${a.link})\n\n${stripHtml(a.content)}`;
      await createPost({
        type:            'news',
        status:          'draft',
        title:           a.title,
        slug:            a.slug,
        excerpt:         a.excerpt,
        content,
        contentFormat:   'markdown',
        category:        a.category,
        tags:            a.tags,
        featuredImageUrl: a.image || '',
        aiReadable:      true,
        publishedAt:     null,
        authorName:      a.sourceName,
        authorId:        getCurrentUser()?.uid || '',
        sourceUrl:       a.link,
        seo: {
          metaTitle:       a.title,
          metaDescription: a.excerpt,
          canonicalUrl:    '',
          ogTitle:         a.title,
          ogDescription:   a.excerpt,
          ogImage:         a.image || '',
          twitterCard:     'summary_large_image',
        },
        schema: '',
      });
      ok++;
    } catch (err) {
      console.error('Erro ao importar:', a.title, err);
      fail++;
    }
  }

  importBtn.disabled = false;
  importBtn.textContent = 'Importar Selecionados como Rascunho';

  const msg = `${ok} importado${ok !== 1 ? 's' : ''} com sucesso${fail ? `, ${fail} com erro` : ''}.`;
  importFeedback.innerHTML = `<span class="form-feedback form-feedback--${fail && !ok ? 'error' : 'success'}">${msg} <a href="/admin/posts.html" style="color:inherit;text-decoration:underline">Ver no Conteúdo →</a></span>`;

  // Remove importados da lista
  const importedSlugs = new Set(toImport.map(a => a.slug));
  articles = articles.filter(a => !importedSlugs.has(a.slug));
  selected.clear();
  renderResults();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

renderSources();
fetchBtn?.addEventListener('click', fetchAll);
