// BATAILLE — écran de résultat de bataille
import { onAuthChange } from '../services/auth.js';
import { getChallenge, createChallenge } from '../services/game.js';
import { iconMarkup } from '../utils/icons.js';

onAuthChange((user) => {
  if (!user) window.location.href = '/auth.html';
});

const params = new URLSearchParams(window.location.search);
const code = params.get('code');

const els = {
  titleIcon: document.getElementById('battle-icon'),
  titleText: document.getElementById('battle-title-text'),
  players: document.getElementById('battle-players'),
  waiting: document.getElementById('battle-waiting'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnRematch: document.getElementById('btn-rematch'),
};

let lastCategory = null;

function renderPlayerRow(player, isWinner) {
  const row = document.createElement('div');
  row.className = 'card battle-player-row' + (isWinner ? ' is-winner' : '');
  const name = document.createElement('span');
  name.className = 'battle-player-name';
  name.textContent = player ? player.pseudo : 'En attente…';
  const score = document.createElement('span');
  score.className = 'battle-player-score';
  score.textContent = player && player.score !== null ? `${player.score} pts` : (player ? '…' : '');
  row.append(name, score);
  return row;
}

function setTitle(iconName, text) {
  els.titleIcon.innerHTML = iconName ? iconMarkup(iconName) : '';
  els.titleText.textContent = text;
}

async function load() {
  if (!code) {
    setTitle('xCircle', 'Code manquant');
    return;
  }
  try {
    const result = await getChallenge(code);
    lastCategory = result.category;

    els.players.innerHTML = '';
    const bothFinished = result.player1?.status === 'finished' && result.player2?.status === 'finished';

    const p1Winner = bothFinished && !result.isDraw && (
      (result.youAre === 'player1' && result.youWon) || (result.youAre === 'player2' && result.youWon === false)
    );
    const p2Winner = bothFinished && !result.isDraw && !p1Winner;

    els.players.appendChild(renderPlayerRow(result.player1, bothFinished && p1Winner));
    els.players.appendChild(renderPlayerRow(result.player2, bothFinished && p2Winner));

    if (result.status === 'finished') {
      if (result.isDraw) {
        setTitle('pennant', 'Égalité !');
      } else if (result.youWon) {
        setTitle('trophy', 'Tu as gagné !');
      } else {
        setTitle('xCircle', 'Tu as perdu cette fois');
      }
      els.waiting.hidden = true;
      els.btnRefresh.hidden = true;
      els.btnRematch.hidden = false;
    } else {
      setTitle('sword', 'Bataille en cours');
      els.waiting.hidden = false;
      els.btnRefresh.hidden = false;
      els.btnRematch.hidden = true;
    }
  } catch (error) {
    setTitle('xCircle', 'Erreur');
    els.players.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = error.message;
    els.players.appendChild(p);
  }
}

els.btnRefresh.addEventListener('click', load);

els.btnRematch.addEventListener('click', async () => {
  if (!lastCategory) return;
  els.btnRematch.disabled = true;
  els.btnRematch.textContent = 'Un instant…';
  try {
    const { gameId, questions, code: newCode } = await createChallenge(lastCategory);
    sessionStorage.setItem('bataille_game', JSON.stringify({
      gameId, questions, category: lastCategory, mode: 'challenge', code: newCode,
    }));
    window.location.href = '/game.html';
  } catch (error) {
    els.btnRematch.disabled = false;
    els.btnRematch.textContent = 'Revanche';
    alert(error.message);
  }
});

load();
