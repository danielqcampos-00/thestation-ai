// Gerenciamento de autenticação Firebase
// Usado em todas as páginas do admin

import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

/** Redireciona para login se não autenticado. Chamar no topo de cada página admin. */
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = '/admin/login.html';
    }
  });
}

/** Login com email e senha. Retorna Promise<UserCredential>. */
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/** Logout. */
export async function logout() {
  return signOut(auth);
}

/** Retorna o usuário atual ou null. */
export function getCurrentUser() {
  return auth.currentUser;
}

// Inicializa formulário de login se estiver na página de login
if (document.getElementById('login-form')) {
  const form   = document.getElementById('login-form');
  const errEl  = document.getElementById('login-error');
  const btn    = document.getElementById('login-btn');

  // Se já autenticado, vai direto pro dashboard
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = '/admin/index.html';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      await login(
        document.getElementById('email').value.trim(),
        document.getElementById('password').value,
      );
      window.location.href = '/admin/index.html';
    } catch (err) {
      errEl.textContent = 'E-mail ou senha incorretos.';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
}
