// home.js — Hero com partículas + seções de posts do Firestore

import { getRecentPosts } from './firestore.js';

// ─── Hero ─────────────────────────────────────────────────────────────────────

function renderHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  hero.innerHTML = `
    <canvas class="hero__canvas" id="particles-canvas" aria-hidden="true"></canvas>
    <div class="container">
      <div class="hero__content">
        <span class="hero__eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V15a1 1 0 0 0-2 0v1.93A6 6 0 0 1 6.07 13H8a1 1 0 0 0 0-2H6.07A6 6 0 0 1 11 6.07V8a1 1 0 0 0 2 0V6.07A6 6 0 0 1 17.93 11H16a1 1 0 0 0 0 2h1.93A6 6 0 0 1 13 16.93z"/>
          </svg>
          Plataforma de IA em Português
        </span>

        <h1 class="hero__title">
          Entenda a IA que está<br>
          <span class="hero__title-gradient">transformando o mundo</span>
        </h1>

        <p class="hero__subtitle">
          Notícias precisas, análises aprofundadas e conteúdo educacional sobre
          Inteligência Artificial — tudo em português, sem jargão desnecessário.
        </p>

        <div class="hero__actions">
          <a href="/noticias" class="btn btn--primary">Ver Notícias</a>
          <a href="/blog" class="btn btn--outline">Explorar Blog</a>
        </div>
      </div>
    </div>
  `;

  initParticles();
}

// ─── Animação de partículas ───────────────────────────────────────────────────

function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId;
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  function randomParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, randomParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const color = isDark() ? '99,102,241' : '79,70,229';

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color},${p.alpha})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${color},${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  init();
  draw();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animId);
    init();
    draw();
  });
}

// ─── Cards de post ────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildCard(post, type) {
  const href     = `/${type === 'news' ? 'noticias' : 'blog'}/${post.slug}`;
  const badgeCls = type === 'news' ? 'badge--news' : 'badge--blog';
  const label    = post.category || (type === 'news' ? 'Notícia' : 'Blog');
  const date     = formatDate(post.publishedAt);

  const image = post.featuredImageUrl
    ? `<div class="post-card__image">
         <img src="${post.featuredImageUrl}" alt="${post.title}" loading="lazy" width="600" height="338">
       </div>`
    : '';

  return `
    <article class="post-card">
      ${image}
      <div class="post-card__body">
        <div class="post-card__meta">
          <span class="badge ${badgeCls}">${label}</span>
          ${date ? `<time>${date}</time>` : ''}
        </div>
        <h3 class="post-card__title"><a href="${href}">${post.title}</a></h3>
        ${post.excerpt ? `<p class="post-card__excerpt">${post.excerpt}</p>` : ''}
        <div class="post-card__footer">
          <span>${post.authorName || 'thestation.ai'}</span>
          <a href="${href}" class="btn btn--ghost btn--sm">Ler →</a>
        </div>
      </div>
    </article>
  `;
}

function showSkeletons(id, count = 3) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () => `
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

async function loadSection(containerId, type) {
  const el = document.getElementById(containerId);
  if (!el) return;

  try {
    const posts = await getRecentPosts(type, 3);
    if (!posts.length) {
      el.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1">Em breve novos conteúdos por aqui.</p>`;
      return;
    }
    el.innerHTML = posts.map(p => buildCard(p, type)).join('');
  } catch (err) {
    console.error(`Erro ao carregar ${type}:`, err);
    el.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1">Não foi possível carregar o conteúdo.</p>`;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

renderHero();
showSkeletons('news-grid', 3);
showSkeletons('blog-grid', 3);

loadSection('news-grid', 'news');
loadSection('blog-grid', 'blog');
