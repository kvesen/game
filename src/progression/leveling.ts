import { PlayerProfile, PlayerHero } from './player-profile';
import { BaseStats } from '../heroes/hero-definitions';

export const MAX_LEVEL = 20;
export const XP_WIN = 100;
export const XP_LOSS = 40;

// Level N requires N * 100 XP total (accumulated)
export function xpForLevel(level: number): number {
  return level * 100;
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}

export function addMatchXp(
  player: PlayerProfile,
  heroId: string,
  won: boolean
): PlayerProfile {
  const heroIndex = player.heroes.findIndex(h => h.archetypeId === heroId);
  if (heroIndex === -1) {
    throw new Error(`Hero ${heroId} not found`);
  }
  const xpGain = won ? XP_WIN : XP_LOSS;
  const updatedHeroes = [...player.heroes];
  const hero = { ...updatedHeroes[heroIndex] };
  const oldLevel = hero.level;
  hero.xp += xpGain;
  const newLevel = Math.min(MAX_LEVEL, getLevelFromXp(hero.xp));

  if (newLevel > oldLevel) {
    const levelsGained = newLevel - oldLevel;
    hero.bonusAtk += levelsGained;
    hero.bonusDef += levelsGained;
    hero.bonusSpd += levelsGained;
  }
  hero.level = newLevel;
  updatedHeroes[heroIndex] = hero;
  return { ...player, heroes: updatedHeroes };
}

export function getEffectiveStats(
  player: PlayerProfile,
  heroId: string,
  baseStats: BaseStats
): BaseStats & { currentLevel: number } {
  const hero = player.heroes.find(h => h.archetypeId === heroId);
  if (!hero) {
    throw new Error(`Hero ${heroId} not found`);
  }
  const levelBonus = hero.level - 1;
  return {
    hp: baseStats.hp + levelBonus * 3,
    attack: baseStats.attack + hero.bonusAtk,
    defense: baseStats.defense + hero.bonusDef,
    speed: baseStats.speed + hero.bonusSpd,
    currentLevel: hero.level,
  };
}
