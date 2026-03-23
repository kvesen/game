import { PlayerProfile, TrainingSession } from './player-profile';

export const TRAINING_CONFIG = {
  ATK: { duration: 60 * 60 * 1000, cost: 50, bonus: 2 },
  DEF: { duration: 60 * 60 * 1000, cost: 50, bonus: 2 },
  SPD: { duration: 60 * 60 * 1000, cost: 50, bonus: 2 },
};

export function startTraining(
  player: PlayerProfile,
  heroId: string,
  stat: 'ATK' | 'DEF' | 'SPD',
  now: Date = new Date()
): PlayerProfile {
  if (player.activeTraining && !player.activeTraining.completed) {
    throw new Error('Already training');
  }
  const config = TRAINING_CONFIG[stat];
  if (player.aetherShards < config.cost) {
    throw new Error('Insufficient aether shards');
  }
  const heroIndex = player.heroes.findIndex(h => h.archetypeId === heroId);
  if (heroIndex === -1) {
    throw new Error(`Hero ${heroId} not found`);
  }
  const session: TrainingSession = {
    stat,
    startedAt: now,
    duration: config.duration,
    cost: config.cost,
    bonus: config.bonus,
    completed: false,
  };
  return {
    ...player,
    aetherShards: player.aetherShards - config.cost,
    activeTraining: session,
  };
}

export function collectTraining(
  player: PlayerProfile,
  heroId: string,
  now: Date = new Date()
): PlayerProfile {
  if (!player.activeTraining) {
    throw new Error('No active training session');
  }
  const elapsed = now.getTime() - player.activeTraining.startedAt.getTime();
  if (elapsed < player.activeTraining.duration) {
    throw new Error('Training session not yet complete');
  }
  const heroIndex = player.heroes.findIndex(h => h.archetypeId === heroId);
  if (heroIndex === -1) {
    throw new Error(`Hero ${heroId} not found`);
  }
  const stat = player.activeTraining.stat;
  const bonus = player.activeTraining.bonus;
  const updatedHeroes = [...player.heroes];
  const hero = { ...updatedHeroes[heroIndex] };
  if (stat === 'ATK') hero.bonusAtk += bonus;
  else if (stat === 'DEF') hero.bonusDef += bonus;
  else if (stat === 'SPD') hero.bonusSpd += bonus;
  updatedHeroes[heroIndex] = hero;
  return {
    ...player,
    heroes: updatedHeroes,
    activeTraining: undefined,
  };
}
