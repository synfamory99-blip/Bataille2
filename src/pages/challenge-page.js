// BATAILLE — page de défi (créer / rejoindre)
import { onAuthChange } from '../services/auth.js';
import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { createChallenge, joinChallenge } from '../services/game.js';

mountHeader();
mountFooter();

onAuthChange((user) => {
  if (!user) window.location.href = '/auth.html';
});

const errorBox = document.getElementById('challenge-error');
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add('is-visible');
}
function clearError() {
  errorBox.textContent = '';
  errorBox.classList.remove('is-visible');
}

// --- Onglets ---
const tabs = document.querySelectorAll('.challenge-tab');
const panels = document.querySelectorAll('.challenge-panel');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    clearError();
    tabs.forEach((t) => t.setAttribute('aria-selected', 'false'));
    tab.setAttribute('aria-selected', 'true');
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  });
});

// --- Créer une bataille ---
let selectedCategory = null;
const themeCards = document.querySelectorAll('#create-theme-grid .mini-theme-card');
const btnCreate = document.getElementById('btn-create-challenge');

themeCards.forEach((card) => {
  card.addEventListener('click', () => {
    themeCards.forEach((c) => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    selectedCategory = card.dataset.category;
    btnCreate.disabled = false;
  });
});

btnCreate.addEventListener('click', async () => {
  if (!selectedCategory) return;
  clearError();
  btnCreate.disabled = true;
  btnCreate.textContent = 'Un instant…';
  try {
    const { gameId, questions, code } = await createChallenge(selectedCategory);
    sessionStorage.setItem('bataille_game', JSON.stringify({
      gameId, questions, category: selectedCategory, mode: 'challenge', code,
    }));
    window.location.href = '/game.html';
  } catch (error) {
    showError(error.message);
    btnCreate.disabled = false;
    btnCreate.textContent = 'Créer la bataille';
  }
});

// --- Rejoindre une bataille ---
const joinForm = document.getElementById('form-join');
joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!code) return;
  const submitBtn = joinForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const { gameId, questions, category, code: confirmedCode } = await joinChallenge(code);
    sessionStorage.setItem('bataille_game', JSON.stringify({
      gameId, questions, category, mode: 'challenge', code: confirmedCode,
    }));
    window.location.href = '/game.html';
  } catch (error) {
    showError(error.message);
    submitBtn.disabled = false;
  }
});
