export type AbilityType = 'OFFENSIVE' | 'DEFENSIVE' | 'UTILITY';

export type EffectType =
  | 'DAMAGE'
  | 'HEAL'
  | 'SHIELD'
  | 'COOLDOWN_LOCK'
  | 'COOLDOWN_REDUCE'
  | 'STAT_DEBUFF'
  | 'REGEN'
  | 'DAMAGE_REDUCE'
  | 'DODGE';

export interface AbilityEffect {
  type: EffectType;
  value?: number;
  duration?: number;
  target?: 'SELF' | 'OPPONENT';
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  type: AbilityType;
  cooldown: number;
  resonanceCost: number;
  effects: AbilityEffect[];
  overchargeEffects?: AbilityEffect[];
}
