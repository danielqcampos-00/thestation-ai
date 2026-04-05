// admin/dashboard.js — Sidebar, topbar e stats do dashboard

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { getAllPostsAdmin } from '/assets/js/firestore.js';

// ─── Auth guard ───────────────────────────────────────────────────────────────

await requireAuth();

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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
    </div>
  `;
}

function buildTopbar() {
  const user = getCurrentUser();
  const email = user?.email || '';
  return `
    <span style="font-size:0.8rem; color:var(--text-muted);">${email}</span>
    <button class="btn btn--ghost btn--sm" id="logout-btn">Sair</button>
  `;
}

const sidebar = document.getElementById('admin-sidebar');
const topbar  = document.getElementById('admin-topbar');

if (sidebar) sidebar.innerHTML = buildSidebar();
if (topbar)  topbar.innerHTML  = buildTopbar();

document.addEventListener('click', async (e) => {
  if (e.target.closest('#logout-btn')) {
    await logout();
    window.location.href = '/admin/login.html';
  }
});

// ─── Stats (só no dashboard) ──────────────────────────────────────────────────

const statsGrid = document.getElementById('stats-grid');
const recentDiv = document.getElementById('recent-activity');

if (statsGrid) {
  try {
    const posts = await getAllPostsAdmin();

    const total     = posts.length;
    const published = posts.filter(p => p.status === 'published').length;
    const drafts    = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const news      = posts.filter(p => p.type === 'news').length;
    const blog      = posts.filter(p => p.type === 'blog').length;

    statsGrid.innerHTML = [
      { label: 'Total de Posts', value: total },
      { label: 'Publicados',     value: published },
      { label: 'Rascunhos',      value: drafts },
      { label: 'Agendados',      value: scheduled },
      { label: 'Notícias',       value: news },
      { label: 'Blog Posts',     value: blog },
    ].map(({ label, value }) => `
      <div class="stat-card">
        <div class="stat-card__label">${label}</div>
        <div class="stat-card__value">${value}</div>
      </div>
    `).join('');

    // Atividade recente — últimos 8 posts por updatedAt
    if (recentDiv) {
      const recent = [...posts]
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
        .slice(0, 8);

      if (!recent.length) {
        recentDiv.innerHTML = `<p style="color:var(--text-muted)">Nenhum post criado ainda.</p>`;
      } else {
        const statusBadge = s => {
          const map = { published: 'badge--published', draft: 'badge--draft', scheduled: 'badge--scheduled' };
          const label = { published: 'Publicado', draft: 'Rascunho', scheduled: 'Agendado' };
          return `<span class="badge ${map[s] || ''}">${label[s] || s}</span>`;
        };

        recentDiv.innerHTML = `
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead><tr>
                <th>Título</th><th>Tipo</th><th>Status</th><th>Atualizado</th><th>Ação</th>
              </tr></thead>
              <tbody>
                ${recent.map(p => {
                  const date = p.updatedAt?.toDate
                    ? p.updatedAt.toDate().toLocaleDateString('pt-BR')
                    : '—';
                  const typeLabel = p.type === 'news' ? 'Notícia' : 'Blog';
                  return `<tr>
                    <td>${p.title}</td>
                    <td>${typeLabel}</td>
                    <td>${statusBadge(p.status)}</td>
                    <td>${date}</td>
                    <td><a href="/admin/editor.html?id=${p.id}" class="btn btn--ghost btn--sm">Editar</a></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>`;
      }
    }

  } catch (err) {
    console.error('Erro ao carregar stats:', err);
    statsGrid.innerHTML = `<p style="color:var(--text-muted)">Erro ao carregar dados.</p>`;
  }
}
