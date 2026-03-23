import { PlayerProfile, MiningExpedition } from './player-profile';

export const MINING_TIERS = {
  QUICK: { duration: 30 * 60 * 1000, reward: 10 },
  STANDARD: { duration: 2 * 60 * 60 * 1000, reward: 50 },
  DEEP: { duration: 8 * 60 * 60 * 1000, reward: 250 },
};

export function startMining(
  player: PlayerProfile,
  tier: 'QUICK' | 'STANDARD' | 'DEEP',
  now: Date = new Date()
): PlayerProfile {
  if (player.activeMining && !player.activeMining.completed) {
    throw new Error('Already mining');
  }
  const config = MINING_TIERS[tier];
  const expedition: MiningExpedition = {
    tier,
    startedAt: now,
    duration: config.duration,
    reward: config.reward,
    completed: false,
  };
  return { ...player, activeMining: expedition };
}

export function collectMining(player: PlayerProfile, now: Date = new Date()): PlayerProfile {
  if (!player.activeMining) {
    throw new Error('No active mining expedition');
  }
  const elapsed = now.getTime() - player.activeMining.startedAt.getTime();
  if (elapsed < player.activeMining.duration) {
    throw new Error('Mining expedition not yet complete');
  }
  return {
    ...player,
    aetherShards: player.aetherShards + player.activeMining.reward,
    activeMining: undefined,
  };
}
