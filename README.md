# thestation.ai

Plataforma educacional sobre Inteligência Artificial em Português (PT-BR).

Site com notícias curadas, blog editorial e painel admin estilo WordPress.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (para firebase-tools)
- [Firebase CLI](https://firebase.google.com/docs/cli)

```bash
npm install -g firebase-tools
firebase login
```

---

## Rodando Localmente

```bash
firebase serve
```

Acesse `http://localhost:5000`

---

## Deploy

```bash
firebase deploy
```

---

## Configuração Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Firestore Database** e **Authentication** (email/password)
3. Atualize o Project ID em `.firebaserc`
4. Atualize as credenciais do SDK em `public/assets/js/firebase-config.js`

---

## Estrutura do Projeto

Ver [CLAUDE.md](CLAUDE.md) para documentação técnica completa.

---

## Fases

| # | Fase | Status |
|---|------|--------|
| 1 | Scaffold e Infraestrutura | 🔄 Em andamento |
| 2 | Design System e Páginas | ⏳ |
| 3 | Firebase e Conteúdo | ⏳ |
| 4 | Painel Admin | ⏳ |
| 5 | SEO Hardening | ⏳ |
| 6 | Stubs de IA | ⏳ |
