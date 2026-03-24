import '../styles/title.css';
import { div, btn } from '../utils/dom';

export function createTitleScreen(onPlay: () => void): HTMLElement {
  const screen = div('screen');
  screen.id = 'title-screen';

  // Stars background
  const stars = div('bg-stars');
  const nebula = div('bg-nebula');

  // Floating glow rings
  const ring1 = div('title-glow-ring');
  ring1.style.cssText = 'width: 600px; height: 600px; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(0deg);';
  const ring2 = div('title-glow-ring');
  ring2.style.cssText = 'width: 400px; height: 400px; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(0deg); animation-direction: reverse; border-color: rgba(155,89,245,0.1);';

  // Particles
  const particlesEl = div('title-particles');
  const particleConfigs = [
    { size: 4, color: '#4a9eff', x: 15, delay: 0, dur: 5 },
    { size: 3, color: '#c77dff', x: 30, delay: 1, dur: 4 },
    { size: 5, color: '#f0c040', x: 50, delay: 0.5, dur: 6 },
    { size: 3, color: '#7be495', x: 65, delay: 2, dur: 4.5 },
    { size: 4, color: '#4a9eff', x: 80, delay: 1.5, dur: 5.5 },
    { size: 2, color: '#c77dff', x: 20, delay: 3, dur: 4 },
    { size: 3, color: '#f0c040', x: 70, delay: 2.5, dur: 5 },
    { size: 4, color: '#4a9eff', x: 90, delay: 0.8, dur: 4.8 },
    { size: 2, color: '#7be495', x: 40, delay: 3.5, dur: 3.8 },
    { size: 3, color: '#ff8fa0', x: 55, delay: 1.2, dur: 5.2 },
  ];

  for (const cfg of particleConfigs) {
    const p = div('title-particle');
    const bottom = 10 + Math.random() * 30;
    p.style.cssText = `
      width: ${cfg.size}px; height: ${cfg.size}px;
      background: ${cfg.color};
      left: ${cfg.x}%;
      bottom: ${bottom}%;
      animation-duration: ${cfg.dur}s;
      animation-delay: ${cfg.delay}s;
      --dx: ${(Math.random() - 0.5) * 40}px;
      box-shadow: 0 0 ${cfg.size * 2}px ${cfg.color};
    `;
    particlesEl.appendChild(p);
  }

  // Main content
  const content = div('title-content');

  // Logo
  const logo = div('title-logo');

  const logoIcon = div('title-logo-icon');
  logoIcon.textContent = '⚔️';

  const titleMain = document.createElement('h1');
  titleMain.className = 'title-main';
  titleMain.textContent = 'AETHERVEIL';

  const subtitle = div('title-subtitle');
  subtitle.textContent = 'Multiplayer Hero Combat';

  logo.appendChild(logoIcon);
  logo.appendChild(titleMain);
  logo.appendChild(subtitle);

  // Divider
  const divider = div('title-divider');
  divider.innerHTML = `
    <div class="title-divider-line"></div>
    <span class="title-divider-gem">◆</span>
    <div class="title-divider-line"></div>
  `;

  // Flavor text
  const flavor = div('title-flavor');
  flavor.textContent = '"Three archetypes. Infinite strategies. One champion rises."';

  // Hero chips
  const heroes = div('title-heroes');
  const heroChips = [
    { icon: '🛡️', name: 'Shardwarden' },
    { icon: '⚡', name: 'Aetherspark' },
    { icon: '🌿', name: 'Rootcaller' },
  ];
  for (const h of heroChips) {
    const chip = div('title-hero-chip');
    chip.innerHTML = `<span class="chip-icon">${h.icon}</span><span>${h.name}</span>`;
    heroes.appendChild(chip);
  }

  // Play button
  const playBtn = btn(['btn', 'title-play-btn'], '⚔️  Enter the Veil');
  playBtn.addEventListener('click', onPlay);

  content.appendChild(logo);
  content.appendChild(divider);
  content.appendChild(flavor);
  content.appendChild(heroes);
  content.appendChild(playBtn);

  // Footer
  const footer = div('title-footer');
  footer.innerHTML = `
    <span class="title-version">v1.0.0 — AETHERVEIL</span>
    <span class="title-credits">Built with the Aetherveil Combat Engine</span>
  `;

  screen.appendChild(stars);
  screen.appendChild(nebula);
  screen.appendChild(ring1);
  screen.appendChild(ring2);
  screen.appendChild(particlesEl);
  screen.appendChild(content);
  screen.appendChild(footer);

  return screen;
}
