/** DOM utility helpers */

export function el<T extends HTMLElement>(tag: string, classes?: string | string[], attrs?: Record<string, string>): T {
  const element = document.createElement(tag) as T;
  if (classes) {
    const cls = Array.isArray(classes) ? classes : classes.split(' ');
    element.classList.add(...cls.filter(Boolean));
  }
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
  }
  return element;
}

export function div(classes?: string | string[]): HTMLDivElement {
  return el<HTMLDivElement>('div', classes);
}

export function span(classes?: string | string[], text?: string): HTMLSpanElement {
  const s = el<HTMLSpanElement>('span', classes);
  if (text !== undefined) s.textContent = text;
  return s;
}

export function btn(classes?: string | string[], text?: string): HTMLButtonElement {
  const b = el<HTMLButtonElement>('button', classes);
  b.type = 'button';
  if (text !== undefined) b.textContent = text;
  return b;
}

export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function setHTML(element: HTMLElement, html: string): void {
  element.innerHTML = html;
}

export function show(element: HTMLElement): void {
  element.style.display = '';
  element.hidden = false;
}

export function hide(element: HTMLElement): void {
  element.hidden = true;
}

export function fadeTransition(
  outEl: HTMLElement,
  inEl: HTMLElement,
  container: HTMLElement,
  duration = 350
): Promise<void> {
  return new Promise(resolve => {
    outEl.classList.add('fade-out');
    setTimeout(() => {
      outEl.remove();
      container.appendChild(inEl);
      inEl.classList.add('fade-in');
      setTimeout(resolve, duration);
    }, duration);
  });
}

export function animateNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration: number,
  format: (n: number) => string = n => String(Math.round(n))
): void {
  const start = performance.now();
  const diff = to - from;

  function update(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = format(from + diff * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
