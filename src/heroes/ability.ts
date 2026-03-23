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
  | 'DODGE'
  | 'DAMAGE_REFLECT'
  | 'POISON'
  | 'RESONANCE_STEAL'
  | 'CLEANSE'
  | 'ATK_DEBUFF'
  | 'DEF_BUFF'
  | 'SPD_BUFF'
  | 'DAMAGE_IGNORE_SHIELD'
  | 'SELF_COOLDOWN_PENALTY'
  | 'MIRROR_IMAGE';

export interface AbilityEffect {
  type: EffectType;
  value?: number;
  duration?: number;
  target?: 'SELF' | 'OPPONENT';
  /** For COOLDOWN_REDUCE: reduce a specific ability's cooldown instead of all */
  targetAbilityId?: string;
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
