export type AttunementId = 'VOLATILE' | 'STABILIZED' | 'FRACTURED' | 'RESONANT' | 'PRISMATIC';

export type AttunementEffectType =
  | 'OVERCHARGE_COST_REDUCTION'
  | 'OVERCHARGE_DAMAGE_PENALTY'
  | 'RESONANCE_PER_TURN_BONUS'
  | 'COOLDOWN_PENALTY'
  | 'DAMAGE_BONUS_PERCENT'
  | 'MAX_HP_PENALTY_PERCENT'
  | 'HEAL_BONUS_PERCENT'
  | 'DAMAGE_TAKEN_INCREASE_PERCENT'
  | 'CRIT_CHANCE'
  | 'START_RESONANCE';

export interface AttunementEffect {
  type: AttunementEffectType;
  value: number;
}

export interface AttunementDefinition {
  id: AttunementId;
  name: string;
  description: string;
  effects: AttunementEffect[];
}

export const ATTUNEMENT_DEFINITIONS: Record<AttunementId, AttunementDefinition> = {
  VOLATILE: {
    id: 'VOLATILE',
    name: 'Volatile Shard',
    description: 'Your Overcharges cost 1 less Resonance but deal 15% less bonus damage.',
    effects: [
      { type: 'OVERCHARGE_COST_REDUCTION', value: 1 },
      { type: 'OVERCHARGE_DAMAGE_PENALTY', value: 0.15 },
    ],
  },
  STABILIZED: {
    id: 'STABILIZED',
    name: 'Stabilized Shard',
    description: 'Gain +1 Resonance per turn but all abilities have +1 cooldown.',
    effects: [
      { type: 'RESONANCE_PER_TURN_BONUS', value: 1 },
      { type: 'COOLDOWN_PENALTY', value: 1 },
    ],
  },
  FRACTURED: {
    id: 'FRACTURED',
    name: 'Fractured Shard',
    description: 'All damage dealt increased by 20% but max HP reduced by 15%.',
    effects: [
      { type: 'DAMAGE_BONUS_PERCENT', value: 0.20 },
      { type: 'MAX_HP_PENALTY_PERCENT', value: 0.15 },
    ],
  },
  RESONANT: {
    id: 'RESONANT',
    name: 'Resonant Shard',
    description: 'All healing increased by 30% but damage taken increased by 10%.',
    effects: [
      { type: 'HEAL_BONUS_PERCENT', value: 0.30 },
      { type: 'DAMAGE_TAKEN_INCREASE_PERCENT', value: 0.10 },
    ],
  },
  PRISMATIC: {
    id: 'PRISMATIC',
    name: 'Prismatic Shard',
    description: 'Start combat with 3 Resonance and 10% chance for abilities to crit for 1.5x damage.',
    effects: [
      { type: 'START_RESONANCE', value: 3 },
      { type: 'CRIT_CHANCE', value: 0.10 },
    ],
  },
};
