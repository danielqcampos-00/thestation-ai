// contact.js — Formulário de contato → salva no Firestore

import { submitContactForm } from './firestore.js';

const form     = document.getElementById('contact-form');
const feedback = document.getElementById('contact-feedback');
const submit   = document.getElementById('contact-submit');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    feedback.innerHTML = '';

    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const subject = form.subject.value;
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      feedback.innerHTML = `<p class="form-feedback form-feedback--error">Preencha os campos obrigatórios.</p>`;
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.innerHTML = `<p class="form-feedback form-feedback--error">E-mail inválido.</p>`;
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Enviando…';

    try {
      await submitContactForm({ name, email, subject, message });
      feedback.innerHTML = `<p class="form-feedback form-feedback--success">Mensagem enviada! Responderemos em breve.</p>`;
      form.reset();
    } catch (err) {
      console.error(err);
      feedback.innerHTML = `<p class="form-feedback form-feedback--error">Erro ao enviar. Tente novamente.</p>`;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Enviar mensagem';
    }
  });
}
