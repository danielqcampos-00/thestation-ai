// admin/editor.js — Editor completo de posts (criar e editar)

import { requireAuth, logout, getCurrentUser } from '/assets/js/auth.js';
import { createPost, updatePost, getAllPostsAdmin, slugExists, getCategories } from '/assets/js/firestore.js';
import { generateExcerpt, suggestTags } from '/assets/js/ai/gemini-stub.js';
import { initAdminUI } from '/assets/js/admin/ui.js';

await requireAuth();

initAdminUI(logout);

// ─── Estado ───────────────────────────────────────────────────────────────────

const params  = new URLSearchParams(window.location.search);
const editId  = params.get('id');
let contentMode = 'richtext';
let quill       = null;
let slugEdited  = false;

// ─── Refs DOM ─────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const titleInput    = $('post-title');
const slugInput     = $('post-slug');
const slugPrefix    = $('slug-prefix');
const typeSelect    = $('post-type');
const statusSelect  = $('post-status');
const scheduleWrap  = $('schedule-wrap');
const scheduleInput = $('post-scheduled-at');
const categoryInput = $('post-category');
const tagsInput     = $('post-tags');
const imageInput    = $('post-image');
const imagePreview  = $('image-preview');
const aiReadable    = $('post-ai-readable');
const quillWrap     = $('quill-wrap');
const markdownWrap  = $('markdown-wrap');
const markdownArea  = $('markdown-content');
const mdPreview     = $('markdown-preview');
const feedbackEl    = $('editor-feedback');
const saveDraftBtn  = $('save-draft-btn');
const publishBtn    = $('publish-btn');
const seoMetaTitle  = $('seo-meta-title');
const seoMetaDesc   = $('seo-meta-desc');
const seoCanonical  = $('seo-canonical');
const seoOgTitle    = $('seo-og-title');
const seoOgDesc     = $('seo-og-desc');
const seoOgImage    = $('seo-og-image');
const seoTwitter    = $('seo-twitter-card');
const schemaField   = $('post-schema');
const pageTitle     = document.querySelector('.admin-page-title');

// ─── Quill init ───────────────────────────────────────────────────────────────

function initQuill() {
  if (quill) return;
  quill = new Quill('#quill-editor', {
    theme: 'snow',
    placeholder: 'Escreva o conteúdo aqui...',
    modules: {
      toolbar: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
    },
  });
}

initQuill();

// ─── Toggle de modo de conteúdo ───────────────────────────────────────────────

document.querySelectorAll('.content-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    if (mode === contentMode) return;

    document.querySelectorAll('.content-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    contentMode = mode;

    if (mode === 'richtext') {
      quillWrap.classList.remove('hidden');
      markdownWrap.classList.add('hidden');
    } else {
      quillWrap.classList.add('hidden');
      markdownWrap.classList.remove('hidden');
    }
  });
});

// ─── Markdown preview em tempo real ──────────────────────────────────────────

markdownArea?.addEventListener('input', () => {
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    mdPreview.innerHTML = DOMPurify.sanitize(marked.parse(markdownArea.value));
  }
});

// ─── Slug automático ──────────────────────────────────────────────────────────

function toSlug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

titleInput?.addEventListener('input', () => {
  if (!slugEdited) slugInput.value = toSlug(titleInput.value);
});

slugInput?.addEventListener('input', () => {
  slugEdited = true;
  slugInput.value = toSlug(slugInput.value);
});

// Atualiza prefixo do slug conforme tipo
typeSelect?.addEventListener('change', () => {
  const section = typeSelect.value === 'news' ? 'noticias' : 'blog';
  if (slugPrefix) slugPrefix.textContent = `thestation.ai/${section}/`;
});

// ─── Status → agendamento ─────────────────────────────────────────────────────

statusSelect?.addEventListener('change', () => {
  scheduleWrap?.classList.toggle('hidden', statusSelect.value !== 'scheduled');
});

// ─── Preview imagem ───────────────────────────────────────────────────────────

imageInput?.addEventListener('input', () => {
  const url = imageInput.value.trim();
  imagePreview?.classList.toggle('hidden', !url);
  const img = imagePreview?.querySelector('img');
  if (img) img.src = url;
});

// ─── Char counters SEO ────────────────────────────────────────────────────────

function updateCounter(inputEl, countEl, max) {
  if (!inputEl || !countEl) return;
  const len = inputEl.value.length;
  countEl.textContent = `${len}/${max}`;
  countEl.className = 'char-counter' +
    (len > max ? ' char-counter--error' : len > max * 0.85 ? ' char-counter--warn' : '');
}

seoMetaTitle?.addEventListener('input', () => updateCounter(seoMetaTitle, $('seo-meta-title-count'), 60));
seoMetaDesc?.addEventListener('input',  () => updateCounter(seoMetaDesc,  $('seo-meta-desc-count'),  160));

// ─── Botões IA ────────────────────────────────────────────────────────────────

$('ai-suggest-excerpt')?.addEventListener('click', async () => {
  const content = contentMode === 'richtext' ? quill?.getText() : markdownArea?.value;
  const result = await generateExcerpt(content || '');
  if (result) $('post-excerpt').value = result;
});

// ─── Feedback ─────────────────────────────────────────────────────────────────

function showFeedback(msg, type = 'success') {
  feedbackEl.innerHTML = `<span class="form-feedback form-feedback--${type}">${msg}</span>`;
  if (type === 'success') setTimeout(() => { feedbackEl.innerHTML = ''; }, 5000);
}

// ─── Coleta dados ─────────────────────────────────────────────────────────────

function collectData(forcedStatus) {
  const status = forcedStatus || statusSelect.value;

  const content = contentMode === 'richtext'
    ? (quill?.root.innerHTML || '')
    : (markdownArea?.value || '');

  const tags = (tagsInput?.value || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  const scheduledAt = status === 'scheduled' && scheduleInput?.value
    ? new Date(scheduleInput.value) : null;

  return {
    title:            titleInput?.value.trim()    || '',
    slug:             slugInput?.value.trim()     || '',
    type:             typeSelect?.value           || 'blog',
    status,
    category:         categoryInput?.value.trim() || '',
    tags,
    excerpt:          $('post-excerpt')?.value.trim() || '',
    content,
    contentFormat:    contentMode === 'richtext' ? 'html' : 'markdown',
    featuredImageUrl: imageInput?.value.trim()   || '',
    aiReadable:       aiReadable?.checked        || false,
    scheduledAt,
    seo: {
      metaTitle:       seoMetaTitle?.value.trim()  || '',
      metaDescription: seoMetaDesc?.value.trim()   || '',
      canonicalUrl:    seoCanonical?.value.trim()  || '',
      ogTitle:         seoOgTitle?.value.trim()    || '',
      ogDescription:   seoOgDesc?.value.trim()     || '',
      ogImage:         seoOgImage?.value.trim()    || '',
      twitterCard:     seoTwitter?.value           || 'summary_large_image',
    },
    schema:     schemaField?.value.trim() || '',
    authorName: getCurrentUser()?.displayName || getCurrentUser()?.email || 'thestation.ai',
    authorId:   getCurrentUser()?.uid || '',
  };
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function save(forcedStatus) {
  const data = collectData(forcedStatus);

  if (!data.title) { showFeedback('O título é obrigatório.', 'error'); return; }
  if (!data.slug)  { showFeedback('O slug é obrigatório.', 'error'); return; }

  const taken = await slugExists(data.slug, editId || null);
  if (taken) { showFeedback('Este slug já está em uso. Escolha outro.', 'error'); return; }

  saveDraftBtn.disabled = publishBtn.disabled = true;
  showFeedback('Salvando…', 'success');

  try {
    if (editId) {
      await updatePost(editId, data);
      showFeedback('Post atualizado com sucesso!');
    } else {
      const newId = await createPost(data);
      showFeedback('Post criado! Redirecionando…');
      setTimeout(() => { window.location.href = `/admin/editor.html?id=${newId}`; }, 1200);
    }
  } catch (err) {
    console.error(err);
    showFeedback('Erro ao salvar. Tente novamente.', 'error');
  } finally {
    saveDraftBtn.disabled = publishBtn.disabled = false;
  }
}

saveDraftBtn?.addEventListener('click', () => save('draft'));
publishBtn?.addEventListener('click',   () => save('published'));

// ─── Carrega post para edição ─────────────────────────────────────────────────

async function loadForEdit(id) {
  if (pageTitle) pageTitle.textContent = 'Editar Post';

  const posts = await getAllPostsAdmin();
  const post = posts.find(p => p.id === id);
  if (!post) { showFeedback('Post não encontrado.', 'error'); return; }

  titleInput.value    = post.title    || '';
  slugInput.value     = post.slug     || '';
  typeSelect.value    = post.type     || 'blog';
  statusSelect.value  = post.status   || 'draft';
  categoryInput.value = post.category || '';
  tagsInput.value     = (post.tags || []).join(', ');
  imageInput.value    = post.featuredImageUrl || '';
  if ($('post-excerpt')) $('post-excerpt').value = post.excerpt || '';
  if (aiReadable) aiReadable.checked = !!post.aiReadable;
  if (schemaField) schemaField.value = post.schema || '';

  // Prefixo do slug
  const section = post.type === 'news' ? 'noticias' : 'blog';
  if (slugPrefix) slugPrefix.textContent = `thestation.ai/${section}/`;

  // Agendamento
  if (post.status === 'scheduled') {
    scheduleWrap?.classList.remove('hidden');
    if (post.scheduledAt && scheduleInput) {
      scheduleInput.value = post.scheduledAt.toDate().toISOString().slice(0, 16);
    }
  }

  // Conteúdo
  if (post.contentFormat === 'html' || !post.contentFormat) {
    if (quill) quill.root.innerHTML = post.content || '';
  } else {
    document.querySelector('[data-mode="markdown"]')?.click();
    if (markdownArea) markdownArea.value = post.content || '';
  }

  // Preview imagem
  if (post.featuredImageUrl) {
    imagePreview?.classList.remove('hidden');
    const img = imagePreview?.querySelector('img');
    if (img) img.src = post.featuredImageUrl;
  }

  // SEO
  if (post.seo) {
    if (seoMetaTitle) seoMetaTitle.value = post.seo.metaTitle       || '';
    if (seoMetaDesc)  seoMetaDesc.value  = post.seo.metaDescription || '';
    if (seoCanonical) seoCanonical.value = post.seo.canonicalUrl    || '';
    if (seoOgTitle)   seoOgTitle.value   = post.seo.ogTitle         || '';
    if (seoOgDesc)    seoOgDesc.value    = post.seo.ogDescription   || '';
    if (seoOgImage)   seoOgImage.value   = post.seo.ogImage         || '';
    if (seoTwitter)   seoTwitter.value   = post.seo.twitterCard     || 'summary_large_image';
  }

  slugEdited = true;
  updateCounter(seoMetaTitle, $('seo-meta-title-count'), 60);
  updateCounter(seoMetaDesc,  $('seo-meta-desc-count'),  160);
}

// ─── Carrega categorias no dropdown ───────────────────────────────────────────

async function loadCategories(selectedValue = '') {
  try {
    const cats = await getCategories();
    const select = $('post-category');
    if (!select) return;

    const currentVal = selectedValue || select.value;
    select.innerHTML = `<option value="">Sem categoria</option>` +
      cats.map(c => `<option value="${c.slug}"${c.slug === currentVal ? ' selected' : ''}>${c.name}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

if (editId) {
  // Carrega categorias e post em paralelo
  const [_, post] = await Promise.all([loadCategories(), (async () => {
    const posts = await getAllPostsAdmin();
    return posts.find(p => p.id === editId) || null;
  })()]);
  if (post) {
    await loadCategories(post.category || '');
    await loadForEdit(editId);
  }
} else {
  await loadCategories();
}
