import '../styles/result.css';
import { div, btn } from '../utils/dom';
import { celebrationParticles, delay } from '../utils/animations';

export function createResultScreen(
  winner: 'player1' | 'player2' | 'draw',
  rounds: number,
  onPlayAgain: () => void
): HTMLElement {
  const screen = div('screen');
  screen.id = 'result-screen';

  const stars = div('bg-stars');
  screen.appendChild(stars);

  const overlayBg = div('result-overlay-bg');
  const resultClass = winner === 'player1' ? 'victory' : winner === 'player2' ? 'defeat' : 'draw';
  overlayBg.classList.add(resultClass);
  screen.appendChild(overlayBg);

  // Particles
  const particles = div('result-particles');
  particles.id = 'result-particles';
  screen.appendChild(particles);

  const content = div('result-content');

  // Icon
  const icon = div('result-icon');
  icon.classList.add(resultClass);
  icon.textContent = winner === 'player1' ? '🏆' : winner === 'player2' ? '💀' : '⚖️';
  content.appendChild(icon);

  // Title
  const title = document.createElement('h1');
  title.className = `result-title ${resultClass}`;
  title.textContent = winner === 'player1' ? 'VICTORY!' : winner === 'player2' ? 'DEFEAT' : 'DRAW';
  content.appendChild(title);

  // Subtitle
  const subtitle = div('result-subtitle');
  subtitle.textContent = winner === 'player1'
    ? 'You have bested your opponent in glorious combat!'
    : winner === 'player2'
    ? 'Your opponent proved stronger this day... but there is always tomorrow.'
    : 'Both warriors fell in a titanic clash — no clear victor!';
  content.appendChild(subtitle);

  // Divider
  const dividerEl = div('result-divider');
  content.appendChild(dividerEl);

  // Stats
  const xpGained = winner === 'player1' ? 100 : winner === 'draw' ? 60 : 40;
  const statsGrid = div('result-stats');
  statsGrid.innerHTML = `
    <div class="result-stat-card">
      <div class="result-stat-icon">⚔️</div>
      <div class="result-stat-label">Rounds</div>
      <div class="result-stat-value">${rounds}</div>
    </div>
    <div class="result-stat-card">
      <div class="result-stat-icon">⭐</div>
      <div class="result-stat-label">XP Gained</div>
      <div class="result-stat-value">${xpGained}</div>
    </div>
    <div class="result-stat-card">
      <div class="result-stat-icon">🏅</div>
      <div class="result-stat-label">Result</div>
      <div class="result-stat-value" style="font-size: 14px; color: ${resultClass === 'victory' ? '#f0c040' : resultClass === 'defeat' ? '#e84060' : '#4a9eff'}">${resultClass.toUpperCase()}</div>
    </div>
  `;
  content.appendChild(statsGrid);

  // XP bar
  const xpSection = div('result-xp-section');
  xpSection.innerHTML = `
    <div class="result-xp-label">
      <span>Experience</span>
      <span class="result-xp-gained">+${xpGained} XP</span>
    </div>
    <div class="result-xp-bar-track">
      <div class="result-xp-bar-fill" id="xp-bar-fill"></div>
    </div>
  `;
  content.appendChild(xpSection);

  // Buttons
  const actions = div('result-actions');

  const againBtn = btn(['btn', 'btn-gold'], '⚔️  Play Again');
  againBtn.addEventListener('click', onPlayAgain);

  actions.appendChild(againBtn);
  content.appendChild(actions);

  screen.appendChild(content);

  // Animations after mount
  setTimeout(() => {
    // Animate XP bar
    const xpFill = screen.querySelector<HTMLElement>('#xp-bar-fill');
    if (xpFill) {
      const pct = Math.min(100, (xpGained / 100) * 70 + 20);
      xpFill.style.width = `${pct}%`;
    }

    // Celebration particles for victory
    if (winner === 'player1') {
      celebrationParticles(particles, 40);
    }
  }, 200);

  return screen;
}
