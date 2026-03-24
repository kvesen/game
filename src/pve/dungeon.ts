import { PlayerProfile, DungeonRun, DungeonTier } from '../progression/player-profile';
import { getLevelFromXp, MAX_LEVEL } from '../progression/leveling';

export { DungeonRun, DungeonTier } from '../progression/player-profile';

export interface DungeonReward {
  aetherShards: number;
  veilstone: number;
  xp: number;
}

const DUNGEON_CONFIG: Record<DungeonTier, { duration: number; reward: DungeonReward }> = {
  EASY: {
    duration: 15 * 60 * 1000,
    reward: { aetherShards: 20, veilstone: 10, xp: 50 },
  },
  MEDIUM: {
    duration: 45 * 60 * 1000,
    reward: { aetherShards: 60, veilstone: 25, xp: 120 },
  },
  HARD: {
    duration: 2 * 60 * 60 * 1000,
    reward: { aetherShards: 150, veilstone: 60, xp: 300 },
  },
};

export function startDungeon(
  player: PlayerProfile,
  tier: DungeonTier,
  now: Date = new Date()
): PlayerProfile {
  if (player.activeDungeon && !player.activeDungeon.completed) {
    throw new Error('Already in a dungeon');
  }
  const config = DUNGEON_CONFIG[tier];
  const run: DungeonRun = {
    tier,
    startedAt: now,
    duration: config.duration,
    completed: false,
  };
  return { ...player, activeDungeon: run };
}

export function completeDungeon(
  player: PlayerProfile,
  heroId: string,
  now: Date = new Date()
): { player: PlayerProfile; rewards: DungeonReward } {
  if (!player.activeDungeon) {
    throw new Error('No active dungeon');
  }
  const elapsed = now.getTime() - player.activeDungeon.startedAt.getTime();
  if (elapsed < player.activeDungeon.duration) {
    throw new Error('Dungeon not yet complete');
  }
  const heroIndex = player.heroes.findIndex(h => h.archetypeId === heroId);
  if (heroIndex === -1) {
    throw new Error(`Hero '${heroId}' not found`);
  }
  const rewards = DUNGEON_CONFIG[player.activeDungeon.tier].reward;
  const updatedHeroes = [...player.heroes];
  const hero = { ...updatedHeroes[heroIndex] };
  hero.xp += rewards.xp;
  const newLevel = Math.min(MAX_LEVEL, getLevelFromXp(hero.xp));
  if (newLevel > hero.level) {
    const levelsGained = newLevel - hero.level;
    hero.bonusAtk += levelsGained;
    hero.bonusDef += levelsGained;
    hero.bonusSpd += levelsGained;
    hero.level = newLevel;
  }
  updatedHeroes[heroIndex] = hero;
  const updatedPlayer: PlayerProfile = {
    ...player,
    aetherShards: player.aetherShards + rewards.aetherShards,
    veilstone: (player.veilstone ?? 0) + rewards.veilstone,
    heroes: updatedHeroes,
    activeDungeon: undefined,
  };
  return { player: updatedPlayer, rewards };
}
