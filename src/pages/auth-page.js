// BATAILLE — page d'authentification
import { signUp, signIn, continueAsGuest, onAuthChange } from '../services/auth.js';

const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');
const errorBox = document.getElementById('auth-error');

// Si déjà connecté, pas besoin de rester sur cette page.
onAuthChange((user) => {
  if (user) window.location.href = '/index.html';
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add('is-visible');
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.remove('is-visible');
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    clearError();
    tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    forms.forEach((form) => {
      form.classList.toggle('is-active', form.dataset.form === tab.dataset.tab);
    });
  });
});

function setSubmitting(form, submitting) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = submitting;
  btn.textContent = submitting ? 'Un instant…' : btn.dataset.label;
}

const signinForm = document.getElementById('form-signin');
signinForm.querySelector('button[type="submit"]').dataset.label = 'Se connecter';
signinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  setSubmitting(signinForm, true);
  const result = await signIn(email, password);
  setSubmitting(signinForm, false);
  if (result.error) showError(result.error);
});

const signupForm = document.getElementById('form-signup');
signupForm.querySelector('button[type="submit"]').dataset.label = 'Créer mon compte';
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const pseudo = document.getElementById('signup-pseudo').value.trim();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  setSubmitting(signupForm, true);
  const result = await signUp(pseudo, email, password);
  setSubmitting(signupForm, false);
  if (result.error) showError(result.error);
});

document.getElementById('btn-guest').addEventListener('click', async () => {
  clearError();
  const result = await continueAsGuest();
  if (result.error) showError(result.error);
});
