// Header e footer compartilhados entre todas as páginas públicas
// Injetados via innerHTML nos elementos #site-header e #site-footer

const NAV_LINKS = [
  { href: '/',            label: 'Início' },
  { href: '/noticias',    label: 'Notícias' },
  { href: '/blog',        label: 'Blog' },
  { href: '/quem-somos',  label: 'Quem Somos' },
  { href: '/contato',     label: 'Contato' },
];

function buildHeader() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  const navItems = NAV_LINKS.map(({ href, label }) => {
    const active = currentPath === href || (href !== '/' && currentPath.startsWith(href));
    return `<li><a href="${href}" class="nav__link${active ? ' nav__link--active' : ''}">${label}</a></li>`;
  }).join('');

  return `
    <div class="header__inner container">
      <a href="/" class="header__logo" aria-label="thestation.ai — Início">
        <img src="/assets/img/logo.svg" alt="" width="32" height="32" aria-hidden="true">
        <span>thestation<span class="logo__dot">.</span>ai</span>
      </a>

      <nav class="nav" aria-label="Navegação principal">
        <ul class="nav__list">${navItems}</ul>
      </nav>

      <div class="header__actions">
        <button class="theme-toggle" id="theme-toggle" aria-label="Alternar tema" title="Alternar dark/light mode">
          <span class="theme-toggle__icon" aria-hidden="true"></span>
        </button>
        <button class="nav-mobile-toggle" id="nav-mobile-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-nav">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- Menu mobile -->
    <nav class="nav-mobile" id="mobile-nav" aria-hidden="true">
      <ul class="nav-mobile__list">${navItems}</ul>
    </nav>
  `;
}

function buildFooter() {
  const year = new Date().getFullYear();
  return `
    <div class="footer__inner container">
      <div class="footer__brand">
        <a href="/" class="header__logo" aria-label="thestation.ai">
          <img src="/assets/img/logo.svg" alt="" width="24" height="24" aria-hidden="true">
          <span>thestation<span class="logo__dot">.</span>ai</span>
        </a>
        <p class="footer__tagline">Inteligência Artificial para todos.</p>
      </div>

      <nav class="footer__nav" aria-label="Links do rodapé">
        <ul>
          <li><a href="/noticias">Notícias</a></li>
          <li><a href="/blog">Blog</a></li>
          <li><a href="/quem-somos">Quem Somos</a></li>
          <li><a href="/contato">Contato</a></li>
        </ul>
      </nav>

      <p class="footer__copy">&copy; ${year} thestation.ai — Todos os direitos reservados.</p>
    </div>
  `;
}

// ─── Injeção ──────────────────────────────────────────────────────────────────

const headerEl = document.getElementById('site-header');
const footerEl = document.getElementById('site-footer');

if (headerEl) headerEl.innerHTML = buildHeader();
if (footerEl) footerEl.innerHTML = buildFooter();

// ─── Toggle de tema ───────────────────────────────────────────────────────────

const THEME_KEY = 'ts-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro');
}

// Aplica tema salvo ou default dark
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedTheme);

document.addEventListener('click', (e) => {
  if (e.target.closest('#theme-toggle')) {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }
});

// ─── Menu mobile ─────────────────────────────────────────────────────────────

document.addEventListener('click', (e) => {
  const toggle  = document.getElementById('nav-mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggle || !mobileNav) return;

  if (e.target.closest('#nav-mobile-toggle')) {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.setAttribute('aria-hidden', String(isOpen));
    mobileNav.classList.toggle('nav-mobile--open', !isOpen);
    toggle.classList.toggle('nav-mobile-toggle--open', !isOpen);
  } else if (!e.target.closest('#mobile-nav')) {
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileNav.classList.remove('nav-mobile--open');
    toggle.classList.remove('nav-mobile-toggle--open');
  }
});
