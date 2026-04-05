// admin/categories.js — CRUD de categorias

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { getCategories, createCategory, deleteCategory } from '/assets/js/firestore.js';
import { initAdminUI } from '/assets/js/admin/ui.js';

await requireAuth();
initAdminUI(logout);

// ─── Refs ─────────────────────────────────────────────────────────────────────

const nameInput  = document.getElementById('cat-name');
const slugInput  = document.getElementById('cat-slug');
const typeSelect = document.getElementById('cat-type');
const descInput  = document.getElementById('cat-desc');
const saveBtn    = document.getElementById('save-cat-btn');
const feedback   = document.getElementById('cat-feedback');
const listEl     = document.getElementById('categories-list');

// ─── Slug automático ──────────────────────────────────────────────────────────

let slugEdited = false;

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

nameInput?.addEventListener('input', () => {
  if (!slugEdited) slugInput.value = toSlug(nameInput.value);
});

slugInput?.addEventListener('input', () => {
  slugEdited = true;
  slugInput.value = toSlug(slugInput.value);
});

// ─── Feedback ─────────────────────────────────────────────────────────────────

function showFeedback(msg, type = 'success') {
  feedback.innerHTML = `<span class="form-feedback form-feedback--${type}">${msg}</span>`;
  if (type === 'success') setTimeout(() => { feedback.innerHTML = ''; }, 4000);
}

// ─── Render lista ─────────────────────────────────────────────────────────────

const typeLabel = { both: 'Blog e Notícias', blog: 'Blog', news: 'Notícias' };

function renderList(cats) {
  if (!cats.length) {
    listEl.innerHTML = `<p style="color:var(--text-muted)">Nenhuma categoria criada ainda.</p>`;
    return;
  }

  listEl.innerHTML = cats.map(c => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--border-light)">
      <div>
        <strong>${c.name}</strong>
        <small style="color:var(--text-muted);margin-left:0.5rem">/${c.slug}</small>
        <br>
        <small style="color:var(--text-muted)">${typeLabel[c.type] || c.type}</small>
      </div>
      <button class="btn btn--danger btn--sm" data-delete="${c.id}" data-name="${c.name}">Excluir</button>
    </div>
  `).join('');
}

// ─── Carrega categorias ────────────────────────────────────────────────────────

let categories = [];

async function loadCategories() {
  try {
    categories = await getCategories();
    renderList(categories);
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:var(--error)">Erro ao carregar categorias.</p>`;
  }
}

// ─── Criar categoria ──────────────────────────────────────────────────────────

saveBtn?.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  const slug = slugInput.value.trim();
  const type = typeSelect.value;
  const desc = descInput.value.trim();

  if (!name) { showFeedback('O nome é obrigatório.', 'error'); return; }
  if (!slug) { showFeedback('O slug é obrigatório.', 'error'); return; }

  if (categories.some(c => c.slug === slug)) {
    showFeedback('Já existe uma categoria com este slug.', 'error');
    return;
  }

  saveBtn.disabled = true;
  try {
    await createCategory({ name, slug, type, description: desc });
    showFeedback(`Categoria "${name}" criada!`);
    nameInput.value = slugInput.value = descInput.value = '';
    slugEdited = false;
    await loadCategories();
  } catch (err) {
    console.error(err);
    showFeedback('Erro ao criar categoria.', 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

// ─── Excluir categoria ────────────────────────────────────────────────────────

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-delete]');
  if (!btn) return;

  const id   = btn.dataset.delete;
  const name = btn.dataset.name;

  if (!confirm(`Excluir a categoria "${name}"? Os posts não serão afetados.`)) return;

  btn.disabled = true;
  try {
    await deleteCategory(id);
    await loadCategories();
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir categoria.');
    btn.disabled = false;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

loadCategories();
