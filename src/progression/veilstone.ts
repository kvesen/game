import { PlayerProfile, DungeonTier } from './player-profile';

export function addPvpVeilstone(player: PlayerProfile, won: boolean): PlayerProfile {
  const earned = won ? 15 : 5;
  return { ...player, veilstone: (player.veilstone ?? 0) + earned };
}

export function addDungeonVeilstone(player: PlayerProfile, tier: DungeonTier): PlayerProfile {
  const REWARDS: Record<DungeonTier, number> = {
    EASY: 10,
    MEDIUM: 25,
    HARD: 60,
  };
  return { ...player, veilstone: (player.veilstone ?? 0) + REWARDS[tier] };
}
