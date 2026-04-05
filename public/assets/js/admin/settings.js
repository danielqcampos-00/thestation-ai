// admin/settings.js — Configurações do site

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { getSiteSettings, saveSiteSettings } from '/assets/js/firestore.js';

await requireAuth();

// ─── Sidebar/Topbar ───────────────────────────────────────────────────────────

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

document.getElementById('admin-sidebar').innerHTML = buildSidebar();
document.getElementById('admin-topbar').innerHTML = `
  <span style="font-size:0.8rem; color:var(--text-muted);">${getCurrentUser()?.email || ''}</span>
  <button class="btn btn--ghost btn--sm" id="logout-btn">Sair</button>`;

document.addEventListener('click', async (e) => {
  if (e.target.closest('#logout-btn')) { await logout(); window.location.href = '/admin/login.html'; }
});

// ─── Carrega configurações ────────────────────────────────────────────────────

const form     = document.getElementById('settings-form');
const feedback = document.getElementById('settings-feedback');

async function loadSettings() {
  try {
    const settings = await getSiteSettings();
    if (!settings) return;
    Object.entries(settings).forEach(([key, val]) => {
      const el = form.elements[key];
      if (el) el.value = val;
    });
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
  }
}

// ─── Salva configurações ──────────────────────────────────────────────────────

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  try {
    await saveSiteSettings(data);
    feedback.innerHTML = `<span class="form-feedback form-feedback--success">Configurações salvas!</span>`;
    setTimeout(() => { feedback.innerHTML = ''; }, 4000);
  } catch (err) {
    console.error(err);
    feedback.innerHTML = `<span class="form-feedback form-feedback--error">Erro ao salvar.</span>`;
  }
});

// ─── Botão sitemap ────────────────────────────────────────────────────────────

document.getElementById('regenerate-sitemap-btn')?.addEventListener('click', () => {
  const fb = document.getElementById('sitemap-feedback');
  if (fb) fb.innerHTML = `<span class="form-feedback" style="color:var(--text-muted)">Sitemap manual disponível na Fase 5.</span>`;
});

// ─── Init ─────────────────────────────────────────────────────────────────────

loadSettings();
