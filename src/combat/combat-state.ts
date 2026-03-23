import { Hero } from '../heroes/hero';

export type ActionSelection = {
  abilityId: string | 'basic_attack';
  overcharge: boolean;
};

export interface RoundAction {
  playerId: 'player1' | 'player2';
  selection: ActionSelection;
}

export interface RoundRecord {
  round: number;
  player1Action: ActionSelection;
  player2Action: ActionSelection;
  events: string[];
}

export interface CombatState {
  player1Hero: Hero;
  player2Hero: Hero;
  player1Resonance: number;
  player2Resonance: number;
  roundNumber: number;
  actionHistory: RoundRecord[];
  isOver: boolean;
  winner: 'player1' | 'player2' | 'draw' | null;
}
