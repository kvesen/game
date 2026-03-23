import { AbilityDefinition } from './ability';

export type ArchetypeId = 'SHARDWARDEN' | 'AETHERSPARK' | 'ROOTCALLER';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface HeroDefinition {
  id: ArchetypeId;
  name: string;
  archetype: ArchetypeId;
  baseStats: BaseStats;
  abilities: AbilityDefinition[];
}

export const HERO_DEFINITIONS: Record<ArchetypeId, HeroDefinition> = {
  SHARDWARDEN: {
    id: 'SHARDWARDEN',
    name: 'Shardwarden',
    archetype: 'SHARDWARDEN',
    baseStats: { hp: 120, attack: 8, defense: 14, speed: 6 },
    abilities: [
      {
        id: 'fracture_wall',
        name: 'Fracture Wall',
        description: 'Creates barrier absorbing next 2 incoming attacks. If both charges consumed, deals AoE damage back (50% of absorbed).',
        type: 'DEFENSIVE',
        cooldown: 3,
        resonanceCost: 2,
        effects: [{ type: 'SHIELD', value: 2, target: 'SELF' }],
      },
      {
        id: 'tectonic_grip',
        name: 'Tectonic Grip',
        description: "Locks opponent's highest-cooldown ability for 2 extra turns.",
        type: 'UTILITY',
        cooldown: 5,
        resonanceCost: 3,
        effects: [{ type: 'COOLDOWN_LOCK', value: 2, duration: 2, target: 'OPPONENT' }],
      },
      {
        id: 'shard_slam',
        name: 'Shard Slam',
        description: 'ATK * 1.2 damage.',
        type: 'OFFENSIVE',
        cooldown: 2,
        resonanceCost: 1,
        effects: [{ type: 'DAMAGE', value: 1.2, target: 'OPPONENT' }],
      },
    ],
  },
  AETHERSPARK: {
    id: 'AETHERSPARK',
    name: 'Aetherspark',
    archetype: 'AETHERSPARK',
    baseStats: { hp: 80, attack: 16, defense: 6, speed: 14 },
    abilities: [
      {
        id: 'chain_surge',
        name: 'Chain Surge',
        description: 'ATK * 1.3 damage, bonus 50% if used within 1 turn of cooldown reset.',
        type: 'OFFENSIVE',
        cooldown: 2,
        resonanceCost: 2,
        effects: [{ type: 'DAMAGE', value: 1.3, target: 'OPPONENT' }],
      },
      {
        id: 'phase_slip',
        name: 'Phase Slip',
        description: 'Dodges next attack, reduces all current cooldowns by 1.',
        type: 'UTILITY',
        cooldown: 4,
        resonanceCost: 2,
        effects: [
          { type: 'DODGE', duration: 1, target: 'SELF' },
          { type: 'COOLDOWN_REDUCE', value: 1, target: 'SELF' },
        ],
      },
      {
        id: 'spark_bolt',
        name: 'Spark Bolt',
        description: 'ATK * 0.8 damage.',
        type: 'OFFENSIVE',
        cooldown: 1,
        resonanceCost: 1,
        effects: [{ type: 'DAMAGE', value: 0.8, target: 'OPPONENT' }],
      },
    ],
  },
  ROOTCALLER: {
    id: 'ROOTCALLER',
    name: 'Rootcaller',
    archetype: 'ROOTCALLER',
    baseStats: { hp: 100, attack: 10, defense: 10, speed: 10 },
    abilities: [
      {
        id: 'verdant_mend',
        name: 'Verdant Mend',
        description: 'Heals 20% max HP. If HP below 30%, also grants regen (5% max HP per turn for 3 turns).',
        type: 'DEFENSIVE',
        cooldown: 3,
        resonanceCost: 2,
        effects: [{ type: 'HEAL', value: 0.2, target: 'SELF' }],
      },
      {
        id: 'entangling_bloom',
        name: 'Entangling Bloom',
        description: "Reduces opponent's next attack damage by 40%, slows their cooldown recovery by 1 turn.",
        type: 'UTILITY',
        cooldown: 4,
        resonanceCost: 3,
        effects: [
          { type: 'DAMAGE_REDUCE', value: 0.4, duration: 1, target: 'OPPONENT' },
          { type: 'STAT_DEBUFF', value: 1, duration: 1, target: 'OPPONENT' },
        ],
      },
      {
        id: 'vine_lash',
        name: 'Vine Lash',
        description: 'ATK * 1.1 damage.',
        type: 'OFFENSIVE',
        cooldown: 2,
        resonanceCost: 1,
        effects: [{ type: 'DAMAGE', value: 1.1, target: 'OPPONENT' }],
      },
    ],
  },
};
