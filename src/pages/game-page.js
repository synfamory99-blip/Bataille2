// BATAILLE — page de jeu
import { onAuthChange } from '../services/auth.js';
import { submitAnswer, finishGame } from '../services/game.js';
import { iconMarkup } from '../utils/icons.js';

const DIFFICULTY_LABEL = { easy: 'Facile', medium: 'Moyen', hard: 'Difficile' };

let state = null;
try {
  state = JSON.parse(sessionStorage.getItem('bataille_game'));
} catch (e) {
  state = null;
}

if (!state || !state.gameId || !Array.isArray(state.questions) || state.questions.length === 0) {
  window.location.href = '/theme-select.html';
}

onAuthChange((user) => {
  if (!user) window.location.href = '/auth.html';
});

const els = {
  progress: document.getElementById('progress'),
  progressFill: document.getElementById('progress-fill'),
  difficultyTag: document.getElementById('difficulty-tag'),
  difficultyLabel: document.getElementById('difficulty-label'),
  questionBlock: document.getElementById('question-block'),
  question: document.getElementById('question-text'),
  options: document.getElementById('options'),
  explanation: document.getElementById('explanation'),
  continueBtn: document.getElementById('btn-continue'),
  gameScreen: document.getElementById('game-screen'),
  endScreen: document.getElementById('end-screen'),
  endIcon: document.getElementById('end-icon'),
  endTitleText: document.getElementById('end-title-text'),
  endScoreNum: document.getElementById('end-score-num'),
  endScoreTotal: document.getElementById('end-score-total'),
  endPointsNum: document.getElementById('end-points-num'),
  endXp: document.getElementById('end-xp'),
  streakIcon: document.getElementById('streak-icon'),
  endStreakText: document.getElementById('end-streak-text'),
  btnChallengeFriend: document.getElementById('btn-challenge-friend'),
};

els.streakIcon.innerHTML = iconMarkup('flame');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let currentIndex = 0;
let questionStartedAt = Date.now();
let answering = false;

// Anime un nombre de 0 jusqu'à `target`, pour que le score se "révèle"
// plutôt que d'apparaître brut. Respecte prefers-reduced-motion.
function animateCount(el, target, duration = 900) {
  if (!el) return;
  if (prefersReducedMotion || target === 0) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress); // ease-out-expo
    el.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderQuestionContent() {
  const q = state.questions[currentIndex];
  const total = state.questions.length;

  els.progress.textContent = `Question ${currentIndex + 1} / ${total}`;
  els.progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;
  els.difficultyTag.dataset.level = q.difficulty;
  els.difficultyLabel.textContent = DIFFICULTY_LABEL[q.difficulty] || '';

  els.question.textContent = q.question;
  els.explanation.textContent = '';
  els.explanation.classList.remove('is-visible');
  els.continueBtn.hidden = true;
  els.options.innerHTML = '';
  answering = false;
  questionStartedAt = Date.now();

  q.options.forEach((optionText, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn';

    const label = document.createElement('span');
    label.textContent = optionText;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'option-icon';

    btn.append(label, iconSpan);
    btn.addEventListener('click', () => handleAnswer(index));
    els.options.appendChild(btn);
  });
}

// Petite transition de sortie/entrée entre deux questions plutôt qu'un
// remplacement instantané du contenu. Retrigger l'animation CSS d'entrée
// à chaque appel.
function renderQuestion({ transition = false } = {}) {
  if (!transition || prefersReducedMotion) {
    renderQuestionContent();
    return;
  }
  els.questionBlock.classList.add('is-leaving');
  window.setTimeout(() => {
    renderQuestionContent();
    els.questionBlock.classList.remove('game-question-block', 'is-leaving');
    void els.questionBlock.offsetWidth; // force le reflow pour rejouer l'animation CSS
    els.questionBlock.classList.add('game-question-block');
  }, 160);
}

async function handleAnswer(selectedIndex) {
  if (answering) return;
  answering = true;
  const timeMs = Date.now() - questionStartedAt;
  const q = state.questions[currentIndex];
  const buttons = [...els.options.children];
  buttons.forEach((b) => { b.disabled = true; });

  try {
    const result = await submitAnswer(state.gameId, q.id, selectedIndex, timeMs);
    const selectedBtn = buttons[selectedIndex];
    const selectedIconEl = selectedBtn.querySelector('.option-icon');

    selectedBtn.classList.add(result.correct ? 'is-correct' : 'is-wrong');
    selectedIconEl.innerHTML = iconMarkup(result.correct ? 'checkCircle' : 'xCircle');

    if (!result.correct) {
      const correctBtn = buttons[result.correctAnswer];
      correctBtn.classList.add('is-correct');
      correctBtn.querySelector('.option-icon').innerHTML = iconMarkup('checkCircle');
    }

    els.explanation.textContent = result.explanation;
    els.explanation.classList.add('is-visible');
    els.continueBtn.hidden = false;
  } catch (error) {
    alert(error.message);
    buttons.forEach((b) => { b.disabled = false; });
    answering = false;
  }
}

async function endGame() {
  sessionStorage.removeItem('bataille_game');

  if (state.mode === 'challenge') {
    // Le résultat s'affiche sur l'écran de comparaison dédié, pas ici.
    try {
      await finishGame(state.gameId);
    } catch (error) {
      // On tente quand même d'aller à l'écran de bataille : s'il y a un
      // vrai problème, il s'affichera là-bas avec plus de contexte.
      console.error(error);
    }
    window.location.href = `/battle-result.html?code=${encodeURIComponent(state.code)}`;
    return;
  }

  // L'écran de jeu disparaît complètement : le résultat arrive seul,
  // jamais superposé (voir le correctif [hidden] dans base.css).
  els.gameScreen.hidden = true;
  els.endScreen.hidden = false;
  els.endIcon.innerHTML = '';
  els.endTitleText.textContent = 'Calcul du score…';

  try {
    const result = await finishGame(state.gameId);
    const won = result.correctCount >= Math.ceil(result.totalQuestions / 2);
    els.endIcon.innerHTML = iconMarkup('trophy');
    els.endTitleText.textContent = won ? 'BRAVO !' : 'Bien joué !';
    els.endScoreTotal.textContent = String(result.totalQuestions);
    els.endXp.textContent = `+${result.xpEarned} XP · Niveau ${result.level}`;
    els.endStreakText.textContent = result.streakCount > 1
      ? `Série : ${result.streakCount} jours`
      : 'Série : 1 jour';
    // Les nombres se comptent plutôt que d'apparaître bruts.
    animateCount(els.endScoreNum, result.correctCount, 700);
    animateCount(els.endPointsNum, result.score, 900);
  } catch (error) {
    els.endTitleText.textContent = error.message;
    els.endScoreTotal.textContent = '';
    els.endPointsNum.textContent = '';
    els.endXp.textContent = 'Une erreur est survenue.';
  }
}

els.btnChallengeFriend?.addEventListener('click', () => {
  window.location.href = '/challenge.html';
});

els.continueBtn.addEventListener('click', () => {
  currentIndex += 1;
  if (currentIndex >= state.questions.length) {
    endGame();
  } else {
    renderQuestion({ transition: true });
  }
});

if (state) renderQuestion();
