import { Hero } from '../heroes/hero';
import type { ActionSelection, CombatState, RoundRecord } from './combat-state';
import { resolveRound } from './resolution';

export type { ActionSelection, RoundRecord, CombatState };

export class CombatEngine {
  private state: CombatState;
  private rng: () => number;

  constructor(player1Hero: Hero, player2Hero: Hero, rng: () => number = Math.random) {
    this.rng = rng;

    // Apply START_RESONANCE attunement effect
    let p1StartResonance = 0;
    let p2StartResonance = 0;
    const p1StartEffect = player1Hero.attunement?.effects.find(e => e.type === 'START_RESONANCE');
    if (p1StartEffect) p1StartResonance = p1StartEffect.value;
    const p2StartEffect = player2Hero.attunement?.effects.find(e => e.type === 'START_RESONANCE');
    if (p2StartEffect) p2StartResonance = p2StartEffect.value;

    this.state = {
      player1Hero,
      player2Hero,
      player1Resonance: p1StartResonance,
      player2Resonance: p2StartResonance,
      roundNumber: 0,
      actionHistory: [],
      isOver: false,
      winner: null,
    };
  }

  getState(): Readonly<CombatState> {
    return this.state;
  }

  submitRound(p1Action: ActionSelection, p2Action: ActionSelection): RoundRecord {
    if (this.state.isOver) {
      throw new Error('Combat is already over');
    }

    const record = resolveRound(this.state, p1Action, p2Action, this.rng);
    this.checkEndConditions();

    return record;
  }

  private checkEndConditions(): void {
    const p1Alive = this.state.player1Hero.isAlive();
    const p2Alive = this.state.player2Hero.isAlive();

    if (!p1Alive && !p2Alive) {
      this.state.isOver = true;
      this.state.winner = 'draw';
    } else if (!p1Alive) {
      this.state.isOver = true;
      this.state.winner = 'player2';
    } else if (!p2Alive) {
      this.state.isOver = true;
      this.state.winner = 'player1';
    } else if (this.state.roundNumber >= 25) {
      this.state.isOver = true;
      const p1HpPct = this.state.player1Hero.hpPercent();
      const p2HpPct = this.state.player2Hero.hpPercent();
      if (Math.abs(p1HpPct - p2HpPct) < 0.001) {
        this.state.winner = 'draw';
      } else if (p1HpPct > p2HpPct) {
        this.state.winner = 'player1';
      } else {
        this.state.winner = 'player2';
      }
    }
  }
}
