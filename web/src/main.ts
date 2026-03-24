import './styles/main.css';
import type { ArchetypeId } from '@engine/heroes/hero-definitions';
import { createTitleScreen } from './screens/title';
import { createHeroSelectScreen } from './screens/hero-select';
import { createLoadoutScreen } from './screens/loadout';
import type { LoadoutSelection } from './screens/loadout';
import { createCombatScreen } from './screens/combat';
import { createResultScreen } from './screens/result';

const app = document.getElementById('app')!;

// Register game-end callback used by combat screen
(window as any).__aetherveilGameEnd = (winner: 'player1' | 'player2' | 'draw', rounds: number) => {
  showResultScreen(winner, rounds);
};

let currentScreen: HTMLElement | null = null;

function transition(newScreen: HTMLElement): void {
  if (currentScreen) {
    currentScreen.classList.add('fade-out');
    const old = currentScreen;
    setTimeout(() => {
      old.remove();
    }, 350);
  }

  app.appendChild(newScreen);
  newScreen.classList.add('fade-in');
  currentScreen = newScreen;
}

// ---- Screen builders ----

function showTitleScreen(): void {
  const screen = createTitleScreen(() => {
    showHeroSelectScreen();
  });
  transition(screen);
}

function showHeroSelectScreen(): void {
  const screen = createHeroSelectScreen((archetypeId: ArchetypeId) => {
    showLoadoutScreen(archetypeId);
  });
  transition(screen);
}

function showLoadoutScreen(archetypeId: ArchetypeId): void {
  const screen = createLoadoutScreen(
    archetypeId,
    (selection: LoadoutSelection) => {
      showCombatScreen(selection);
    },
    () => {
      showHeroSelectScreen();
    }
  );
  transition(screen);
}

function showCombatScreen(selection: LoadoutSelection): void {
  const screen = createCombatScreen(selection, (winner, rounds) => {
    showResultScreen(winner, rounds);
  });
  transition(screen);
}

function showResultScreen(winner: 'player1' | 'player2' | 'draw', rounds: number): void {
  const screen = createResultScreen(winner, rounds, () => {
    showTitleScreen();
  });
  transition(screen);
}

// ---- Boot ----
showTitleScreen();
