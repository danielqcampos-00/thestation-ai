// admin/post-manager.js — Tabela CRUD de posts com busca e filtros

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { getAllPostsAdmin, deletePost } from '/assets/js/firestore.js';

await requireAuth();

// ─── Sidebar/Topbar (reutiliza lógica do dashboard) ──────────────────────────

const NAV = [
  { href: '/admin/index.html',    icon: '▦', label: 'Dashboard' },
  { href: '/admin/posts.html',    icon: '✦', label: 'Conteúdo' },
  { href: '/admin/editor.html',   icon: '+', label: 'Novo Post' },
  { href: '/admin/settings.html', icon: '⚙', label: 'Configurações' },
];

function buildSidebar() {
  const current = window.location.pathname;
  const links = NAV.map(({ href, icon, label }) => {
    const active = current === href || current.endsWith(href.split('/').pop());
    return `<a href="${href}" class="admin-nav__link${active ? ' admin-nav__link--active' : ''}">
      <span aria-hidden="true">${icon}</span> ${label}
    </a>`;
  }).join('');
  return `
    <div class="admin-sidebar__logo">
      <img src="/assets/img/logo.svg" alt="thestation.ai" width="28" height="28">
      <span>thestation<span style="color:var(--accent)">.</span>ai</span>
    </div>
    ${links}
    <div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--border);">
      <a href="/" class="admin-nav__link" target="_blank">↗ Ver site</a>
    </div>`;
}

const sidebar = document.getElementById('admin-sidebar');
const topbar  = document.getElementById('admin-topbar');
if (sidebar) sidebar.innerHTML = buildSidebar();
if (topbar) topbar.innerHTML = `
  <span style="font-size:0.8rem; color:var(--text-muted);">${getCurrentUser()?.email || ''}</span>
  <button class="btn btn--ghost btn--sm" id="logout-btn">Sair</button>`;

document.addEventListener('click', async (e) => {
  if (e.target.closest('#logout-btn')) { await logout(); window.location.href = '/admin/login.html'; }
});

// ─── Estado ───────────────────────────────────────────────────────────────────

let allPosts = [];
let filtered = [];

const tbody       = document.getElementById('posts-tbody');
const searchInput = document.getElementById('search-input');
const typeFilter  = document.getElementById('type-filter');
const statusFilter = document.getElementById('status-filter');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR');
}

function statusBadge(s) {
  const map   = { published: 'badge--published', draft: 'badge--draft', scheduled: 'badge--scheduled' };
  const label = { published: 'Publicado', draft: 'Rascunho', scheduled: 'Agendado' };
  return `<span class="badge ${map[s] || ''}">${label[s] || s}</span>`;
}

function typeBadge(t) {
  return t === 'news'
    ? `<span class="badge badge--news">Notícia</span>`
    : `<span class="badge badge--blog">Blog</span>`;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">
      Nenhum post encontrado.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>
        <strong>${p.title}</strong>
        <br><small style="color:var(--text-muted)">${p.slug}</small>
      </td>
      <td>${typeBadge(p.type)}</td>
      <td>${statusBadge(p.status)}</td>
      <td>${p.category || '—'}</td>
      <td>${formatDate(p.publishedAt)}</td>
      <td>
        <div class="admin-table__actions">
          <a href="/admin/editor.html?id=${p.id}" class="btn btn--ghost btn--sm">Editar</a>
          <button class="btn btn--danger btn--sm" data-delete="${p.id}" data-title="${p.title}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

function applyFilters() {
  const q      = (searchInput?.value || '').toLowerCase();
  const type   = typeFilter?.value   || '';
  const status = statusFilter?.value || '';

  filtered = allPosts.filter(p => {
    const matchQ      = !q      || p.title.toLowerCase().includes(q) || p.slug.includes(q);
    const matchType   = !type   || p.type === type;
    const matchStatus = !status || p.status === status;
    return matchQ && matchType && matchStatus;
  });

  render();
}

searchInput?.addEventListener('input', applyFilters);
typeFilter?.addEventListener('change', applyFilters);
statusFilter?.addEventListener('change', applyFilters);

// ─── Delete ───────────────────────────────────────────────────────────────────

tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;

  const id    = btn.dataset.delete;
  const title = btn.dataset.title;

  if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;

  btn.disabled = true;
  btn.textContent = '…';

  try {
    await deletePost(id);
    allPosts = allPosts.filter(p => p.id !== id);
    applyFilters();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir. Tente novamente.');
    btn.disabled = false;
    btn.textContent = 'Excluir';
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem;">
    <div class="spinner" aria-label="Carregando..."></div></td></tr>`;

  try {
    allPosts = await getAllPostsAdmin();
    filtered = allPosts;
    render();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">
      Erro ao carregar posts.</td></tr>`;
  }
}

init();
