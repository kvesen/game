import { AbilityLoadout } from '../heroes/loadout';
import { AttunementId } from '../heroes/attunement';

export interface MiningExpedition {
  tier: 'QUICK' | 'STANDARD' | 'DEEP';
  startedAt: Date;
  duration: number;
  reward: number;
  completed: boolean;
}

export interface TrainingSession {
  stat: 'ATK' | 'DEF' | 'SPD';
  startedAt: Date;
  duration: number;
  cost: number;
  bonus: number;
  completed: boolean;
}

export interface PlayerHero {
  archetypeId: string;
  level: number;
  xp: number;
  bonusAtk: number;
  bonusDef: number;
  bonusSpd: number;
  loadout?: AbilityLoadout;
  attunementId?: AttunementId;
}

export interface PlayerProfile {
  id: string;
  username: string;
  aetherShards: number;
  heroes: PlayerHero[];
  activeMining?: MiningExpedition;
  activeTraining?: TrainingSession;
}
