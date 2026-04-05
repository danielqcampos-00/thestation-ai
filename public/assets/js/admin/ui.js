// admin/ui.js — Componentes compartilhados do painel admin

export const NAV = [
  { href: '/admin/index.html',       icon: '▦', label: 'Dashboard' },
  { href: '/admin/posts.html',       icon: '✦', label: 'Conteúdo' },
  { href: '/admin/editor.html',      icon: '+', label: 'Novo Post' },
  { href: '/admin/categories.html',  icon: '⊞', label: 'Categorias' },
  { href: '/admin/news-import.html', icon: '↓', label: 'Importar Notícias' },
  { href: '/admin/settings.html',    icon: '⚙', label: 'Configurações' },
];

export function buildSidebar() {
  const current = window.location.pathname;
  const links = NAV.map(({ href, icon, label }) => {
    const base   = href.split('/').pop();
    const active = current.endsWith(base) || current === href;
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
    <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--border)">
      <a href="/" class="admin-nav__link" target="_blank">↗ Ver site</a>
    </div>`;
}

export function buildTopbar(email = '') {
  return `
    <span style="font-size:0.8rem;color:var(--text-muted)">${email}</span>
    <button class="btn btn--ghost btn--sm" id="logout-btn">Sair</button>`;
}

export function initAdminUI(logoutFn) {
  const sidebar = document.getElementById('admin-sidebar');
  const topbar  = document.getElementById('admin-topbar');
  if (sidebar) sidebar.innerHTML = buildSidebar();
  if (topbar)  topbar.innerHTML  = buildTopbar();

  document.addEventListener('click', async (e) => {
    if (e.target.closest('#logout-btn')) {
      await logoutFn();
      window.location.href = '/admin/login.html';
    }
  });
}
