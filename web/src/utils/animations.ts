/** Animation helpers */

export function triggerAnimation(element: HTMLElement, className: string, duration = 500): void {
  element.classList.remove(className);
  void element.offsetWidth; // reflow
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), duration);
}

export function spawnParticle(
  container: HTMLElement,
  x: number,
  y: number,
  color: string,
  size = 6,
  duration = 800
): void {
  const particle = document.createElement('div');
  particle.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: ${color};
    border-radius: 50%;
    pointer-events: none;
    z-index: 999;
    --dx: ${(Math.random() - 0.5) * 60}px;
    animation: particle-rise ${duration}ms ease-out forwards;
  `;
  container.appendChild(particle);
  setTimeout(() => particle.remove(), duration + 100);
}

export function spawnDamageNumber(
  container: HTMLElement,
  x: number,
  y: number,
  value: number | string,
  isCrit = false,
  isHeal = false
): void {
  const el = document.createElement('div');
  const color = isHeal ? '#7be495' : isCrit ? '#f0c040' : '#ff8fa0';
  const size = isCrit ? '22px' : '16px';
  el.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    font-family: 'Cinzel', serif;
    font-size: ${size};
    font-weight: 700;
    color: ${color};
    pointer-events: none;
    z-index: 999;
    text-shadow: 0 2px 6px rgba(0,0,0,0.8);
    --dx: ${(Math.random() - 0.5) * 30}px;
    animation: particle-rise 1.2s ease-out forwards;
    white-space: nowrap;
  `;
  el.textContent = isHeal ? `+${value}` : isCrit ? `💥${value}` : `-${value}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

export function celebrationParticles(container: HTMLElement, count = 30): void {
  const colors = ['#f0c040', '#fde68a', '#c77dff', '#4a9eff', '#7be495', '#ff8fa0'];
  const rect = container.getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = Math.random() * rect.width;
      const y = rect.height * 0.3 + Math.random() * rect.height * 0.4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 4 + Math.random() * 8;
      const duration = 1500 + Math.random() * 1500;
      spawnParticle(container, x, y, color, size, duration);
    }, i * 80);
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function animateHpBar(
  barFill: HTMLElement,
  currentHp: number,
  maxHp: number
): void {
  const pct = Math.max(0, currentHp / maxHp) * 100;
  barFill.style.width = `${pct}%`;

  barFill.classList.remove('hp-medium', 'hp-low');
  if (pct <= 25) {
    barFill.classList.add('hp-low');
  } else if (pct <= 50) {
    barFill.classList.add('hp-medium');
  }
}

export function pulseResonance(crystalContainer: HTMLElement): void {
  const crystals = crystalContainer.querySelectorAll('.resonance-crystal.active');
  crystals.forEach(c => {
    (c as HTMLElement).style.transform = 'scale(1.4)';
    setTimeout(() => {
      (c as HTMLElement).style.transform = '';
    }, 300);
  });
}
