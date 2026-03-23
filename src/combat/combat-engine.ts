import { Hero } from '../heroes/hero';
import { ActionSelection, CombatState, RoundRecord } from './combat-state';
import { resolveRound } from './resolution';

export { ActionSelection, RoundRecord, CombatState };

export class CombatEngine {
  private state: CombatState;

  constructor(player1Hero: Hero, player2Hero: Hero) {
    this.state = {
      player1Hero,
      player2Hero,
      player1Resonance: 0,
      player2Resonance: 0,
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

    const record = resolveRound(this.state, p1Action, p2Action);
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
