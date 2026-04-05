// Abstração de acesso ao Firestore
// Todas as páginas devem usar estas funções — nunca acessar db diretamente

import { db } from './firebase-config.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const POSTS_COL     = 'posts';
const SETTINGS_COL  = 'settings';
const CONTACTS_COL  = 'contact_submissions';

// ─── Posts públicos ──────────────────────────────────────────────────────────

/**
 * Retorna posts publicados de um tipo, ordenados por data decrescente.
 * @param {'blog'|'news'} type
 * @param {number} limitCount
 * @param {import('firebase/firestore').DocumentSnapshot|null} cursor
 */
export async function getPublishedPosts(type, limitCount = 10, cursor = null) {
  let q = query(
    collection(db, POSTS_COL),
    where('type',   '==', type),
    where('status', '==', 'published'),
    orderBy('publishedAt', 'desc'),
    limit(limitCount),
  );
  if (cursor) q = query(q, startAfter(cursor));

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), _snap: d }));
}

/**
 * Retorna um post publicado por slug.
 * @param {string} slug
 */
export async function getPostBySlug(slug) {
  const q    = query(collection(db, POSTS_COL), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Retorna os N posts mais recentes publicados de um tipo.
 * @param {'blog'|'news'} type
 * @param {number} n
 */
export async function getRecentPosts(type, n = 3) {
  return getPublishedPosts(type, n);
}

// ─── Admin: CRUD de posts ─────────────────────────────────────────────────────

/**
 * Retorna TODOS os posts (qualquer status) para o admin.
 */
export async function getAllPostsAdmin() {
  const snap = await getDocs(
    query(collection(db, POSTS_COL), orderBy('updatedAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Cria um novo post. Retorna o ID gerado.
 * @param {object} data
 */
export async function createPost(data) {
  const ref = await addDoc(collection(db, POSTS_COL), {
    ...data,
    publishedAt: data.status === 'published' ? serverTimestamp() : (data.publishedAt || null),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Atualiza um post existente.
 * @param {string} id
 * @param {object} data
 */
export async function updatePost(id, data) {
  await updateDoc(doc(db, POSTS_COL, id), {
    ...data,
    publishedAt: data.status === 'published' ? serverTimestamp() : (data.publishedAt || null),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Exclui um post.
 * @param {string} id
 */
export async function deletePost(id) {
  await deleteDoc(doc(db, POSTS_COL, id));
}

/**
 * Verifica se um slug já existe. Retorna true se existir.
 * @param {string} slug
 * @param {string|null} excludeId ID do post atual (para edição)
 */
export async function slugExists(slug, excludeId = null) {
  const q    = query(collection(db, POSTS_COL), where('slug', '==', slug), limit(2));
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (excludeId) return snap.docs.some((d) => d.id !== excludeId);
  return true;
}

// ─── Configurações do site ────────────────────────────────────────────────────

export async function getSiteSettings() {
  const snap = await getDoc(doc(db, SETTINGS_COL, 'site'));
  return snap.exists() ? snap.data() : {};
}

export async function saveSiteSettings(data) {
  await setDoc(doc(db, SETTINGS_COL, 'site'), data, { merge: true });
}

// ─── Categorias ──────────────────────────────────────────────────────────────

const CATEGORIES_COL = 'categories';

export async function getCategories(type = null) {
  let q = collection(db, CATEGORIES_COL);
  if (type) {
    q = query(q, where('type', 'in', [type, 'both']), orderBy('name'));
  } else {
    q = query(q, orderBy('name'));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createCategory(data) {
  const ref = await addDoc(collection(db, CATEGORIES_COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCategory(id) {
  await deleteDoc(doc(db, CATEGORIES_COL, id));
}

// ─── Contato ──────────────────────────────────────────────────────────────────

export async function submitContactForm(data) {
  await addDoc(collection(db, CONTACTS_COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
