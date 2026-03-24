import { PlayerProfile } from './player-profile';
import { getLevelFromXp, MAX_LEVEL } from './leveling';

export type CraftingResult =
  | { type: 'STAT_BOOST'; stat: 'ATK' | 'DEF' | 'SPD'; value: number }
  | { type: 'XP_BOOST'; value: number };

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  aetherShardsCost: number;
  veilstoneCost: number;
  result: CraftingResult;
}

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  SHARD_EDGE: {
    id: 'SHARD_EDGE',
    name: 'Shard Edge',
    description: 'A razor-sharp crystalline blade edge that permanently augments your hero\'s attack.',
    aetherShardsCost: 100,
    veilstoneCost: 50,
    result: { type: 'STAT_BOOST', stat: 'ATK', value: 3 },
  },
  STONE_AEGIS: {
    id: 'STONE_AEGIS',
    name: 'Stone Aegis',
    description: 'A veilstone-reinforced shield that permanently bolsters your hero\'s defense.',
    aetherShardsCost: 100,
    veilstoneCost: 50,
    result: { type: 'STAT_BOOST', stat: 'DEF', value: 3 },
  },
  SWIFT_RUNE: {
    id: 'SWIFT_RUNE',
    name: 'Swift Rune',
    description: 'An ancient rune that permanently increases your hero\'s speed.',
    aetherShardsCost: 100,
    veilstoneCost: 50,
    result: { type: 'STAT_BOOST', stat: 'SPD', value: 3 },
  },
  ECHO_TOME: {
    id: 'ECHO_TOME',
    name: 'Echo Tome',
    description: 'A tome resonating with echoes of past battles, granting your hero a surge of experience.',
    aetherShardsCost: 75,
    veilstoneCost: 100,
    result: { type: 'XP_BOOST', value: 200 },
  },
};

export function craft(player: PlayerProfile, heroId: string, recipeId: string): PlayerProfile {
  const recipe = CRAFTING_RECIPES[recipeId];
  if (!recipe) {
    throw new Error(`Crafting recipe '${recipeId}' not found`);
  }
  const heroIndex = player.heroes.findIndex(h => h.archetypeId === heroId);
  if (heroIndex === -1) {
    throw new Error(`Hero '${heroId}' not found`);
  }
  const currentShards = player.aetherShards;
  const currentVeilstone = player.veilstone ?? 0;
  if (currentShards < recipe.aetherShardsCost) {
    throw new Error(
      `Insufficient Aether Shards: need ${recipe.aetherShardsCost}, have ${currentShards}`
    );
  }
  if (currentVeilstone < recipe.veilstoneCost) {
    throw new Error(
      `Insufficient Veilstone: need ${recipe.veilstoneCost}, have ${currentVeilstone}`
    );
  }
  const updatedHeroes = [...player.heroes];
  const hero = { ...updatedHeroes[heroIndex] };
  const { result } = recipe;
  if (result.type === 'STAT_BOOST') {
    if (result.stat === 'ATK') hero.bonusAtk += result.value;
    else if (result.stat === 'DEF') hero.bonusDef += result.value;
    else if (result.stat === 'SPD') hero.bonusSpd += result.value;
  } else if (result.type === 'XP_BOOST') {
    hero.xp += result.value;
    const newLevel = Math.min(MAX_LEVEL, getLevelFromXp(hero.xp));
    if (newLevel > hero.level) {
      const levelsGained = newLevel - hero.level;
      hero.bonusAtk += levelsGained;
      hero.bonusDef += levelsGained;
      hero.bonusSpd += levelsGained;
      hero.level = newLevel;
    }
  }
  updatedHeroes[heroIndex] = hero;
  return {
    ...player,
    aetherShards: currentShards - recipe.aetherShardsCost,
    veilstone: currentVeilstone - recipe.veilstoneCost,
    heroes: updatedHeroes,
  };
}
