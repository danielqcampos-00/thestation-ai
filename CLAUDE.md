# thestation.ai — Instruções para Claude Code

## Sobre o Projeto

Site educacional sobre Inteligência Artificial em PT-BR. Notícias curadas, blog com conteúdo editorial, painel admin estilo WordPress, SEO robusto e preparação para integração com Google Gemini Nano e VEO 3.

**Domínio:** thestation.ai
**Idioma:** Português (PT-BR) apenas

---

## Stack Técnica

- **Frontend:** HTML puro + JavaScript vanilla (ES Modules, `type="module"`)
- **Backend/DB:** Firebase (Auth + Firestore + Hosting)
- **Editor de conteúdo:** Quill.js (rich text) + marked.js (markdown)
- **SEO libs:** Nenhuma — implementação manual via seo.js
- **Sem frameworks:** Sem React, Vue, Angular ou similares
- **Sem build step** nas fases 1-4 (ES modules nativos no browser)
- **CSS:** BEM naming convention, CSS custom properties para temas

---

## Estrutura de Pastas

```
thestation.ai/
├── public/                    ← raiz do Firebase Hosting
│   ├── index.html             ← Home
│   ├── quem-somos.html        ← Quem Somos
│   ├── contato.html           ← Contato
│   ├── 404.html               ← Erro 404
│   ├── robots.txt
│   ├── sitemap.xml            ← gerado/atualizado via admin ou Cloud Function
│   ├── noticias/
│   │   ├── index.html         ← listagem de notícias
│   │   └── post.html          ← post individual (?slug=...)
│   ├── blog/
│   │   ├── index.html         ← listagem do blog
│   │   └── post.html          ← post individual (?slug=...)
│   ├── admin/
│   │   ├── login.html
│   │   ├── index.html         ← dashboard
│   │   ├── posts.html         ← gerenciar conteúdo
│   │   ├── editor.html        ← criar/editar post
│   │   └── settings.html      ← configurações do site
│   └── assets/
│       ├── css/               ← main, layout, components, home, post, admin
│       ├── js/
│       │   ├── firebase-config.js
│       │   ├── auth.js
│       │   ├── firestore.js   ← CRÍTICO: abstração de dados
│       │   ├── router.js
│       │   ├── renderer.js
│       │   ├── seo.js         ← CRÍTICO: SEO dinâmico
│       │   ├── components.js  ← header/footer injetados
│       │   ├── home.js
│       │   ├── post-list.js
│       │   ├── post-view.js
│       │   ├── contact.js
│       │   ├── admin/
│       │   │   ├── dashboard.js
│       │   │   ├── post-manager.js
│       │   │   └── editor.js  ← CRÍTICO: editor completo
│       │   └── ai/
│       │       ├── gemini-stub.js
│       │       └── veo-stub.js
│       ├── img/               ← logo.svg, og-default.jpg
│       └── lib/               ← marked.min.js, dompurify.min.js, quill.min.js
├── firebase.json
├── .firebaserc                ← atualizar com Project ID real
├── firestore.rules
├── firestore.indexes.json
├── CLAUDE.md                  ← este arquivo
├── README.md
└── plano.prd
```

---

## Firebase

- **Project ID:** `FIREBASE_PROJECT_ID_HERE` ← atualizar após criar projeto
- **Region:** us-central1 (padrão)
- **Serviços usados:** Authentication (email/password), Firestore, Hosting
- **Como rodar local:** `firebase serve` na raiz do projeto
- **Como fazer deploy:** `firebase deploy`

### Instalar firebase-tools (se necessário)
```bash
npm install -g firebase-tools
firebase login
```

---

## Firestore Collections

### `posts`
Armazena blog posts e notícias. Campo `type: "blog" | "news"` diferencia.

Campos principais: `type`, `title`, `slug`, `excerpt`, `content`, `contentFormat`,
`featuredImageUrl`, `category`, `tags[]`, `status`, `publishedAt`, `createdAt`,
`updatedAt`, `authorName`, `seo{}` (metaTitle, metaDescription, canonicalUrl,
ogTitle, ogDescription, ogImage, twitterCard), `schema` (JSON-LD string), `aiReadable`

### `settings/site`
Config global: siteName, siteDescription, siteUrl, defaultOgImage, twitterHandle,
googleAnalyticsId, contactEmail, socialLinks{}

### `contact_submissions`
Envios do formulário de contato.

---

## SEO

- **Páginas estáticas:** meta tags hardcoded no `<head>`
- **Posts dinâmicos:** `seo.js` injeta após carregar Firestore
- **JSON-LD:** auto-gerado (Article schema) se admin não preencher campo custom
- **Sitemap:** atualizado manualmente no admin ou via Cloud Function (Fase 5)
- **Verificação:** Google Search Console + Google Rich Results Test

---

## Tema Dual (Dark/Light)

O site tem toggle dark/light no header. Preferência salva em `localStorage`.
Default: **dark mode**.

```css
:root[data-theme="dark"]  { /* escuro, neon indigo/purple */ }
:root[data-theme="light"] { /* branco, acentos indigo */ }
```

---

## Regras de Código

1. **ES Modules** — sempre `type="module"` nas tags script
2. **async/await** — preferir sobre `.then()`
3. **Sem jQuery** — DOM vanilla apenas
4. **CSS BEM** — `.block__element--modifier`
5. **Sem CDN em produção** — libs ficam em `/assets/lib/` vendorizadas
6. **Sem comentários óbvios** — comentar apenas lógica não-evidente
7. **Sem features extras** — implementar só o que foi pedido

---

## Roteamento de Posts

Posts acessados via query param: `/blog/post.html?slug=nome-do-post`
Firebase Hosting rewrite mapeia `/blog/**` → `/blog/post.html`
`router.js` lê `window.location.search`, busca no Firestore por slug.

---

## Integrações AI (Stubs — Fase 6)

- `assets/js/ai/gemini-stub.js` → `summarizePost()`, `suggestTags()`, `generateExcerpt()`
- `assets/js/ai/veo-stub.js` → `generateCoverVideo()`
- Botões "Sugerir com IA" no editor → tooltip "em breve" até integração real

---

## Status das Fases

- [ ] **Fase 1** — Scaffold e Infraestrutura ← EM ANDAMENTO
- [ ] **Fase 2** — Design System e Páginas Estáticas
- [ ] **Fase 3** — Integração Firebase e Exibição de Conteúdo
- [ ] **Fase 4** — Painel Admin
- [ ] **Fase 5** — SEO Hardening e Sitemap
- [ ] **Fase 6** — Stubs de IA e Documentação Final

---

## SEO Checklist (antes de cada deploy)

- [ ] Todas as páginas têm `<title>` único e descritivo
- [ ] Todas as páginas têm `<meta name="description">`
- [ ] Todas as páginas têm tags Open Graph (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] Todas as páginas têm `<link rel="canonical">`
- [ ] Posts têm JSON-LD Article schema válido
- [ ] `sitemap.xml` atualizado com todos os posts publicados
- [ ] `robots.txt` bloqueia `/admin/`
- [ ] Imagens têm atributo `alt`
