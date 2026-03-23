import { startMining, collectMining, MINING_TIERS } from '../mining';
import { startTraining, collectTraining, TRAINING_CONFIG } from '../training';
import { addMatchXp, getEffectiveStats, getLevelFromXp } from '../leveling';
import { PlayerProfile } from '../player-profile';
import { HERO_DEFINITIONS } from '../../heroes/hero-definitions';

function makeProfile(): PlayerProfile {
  return {
    id: 'p1',
    username: 'TestPlayer',
    aetherShards: 200,
    heroes: [
      {
        archetypeId: 'SHARDWARDEN',
        level: 1,
        xp: 0,
        bonusAtk: 0,
        bonusDef: 0,
        bonusSpd: 0,
      },
    ],
  };
}

describe('Mining', () => {
  it('startMining creates expedition with correct duration and reward', () => {
    const profile = makeProfile();
    const now = new Date('2024-01-01T00:00:00Z');
    const updated = startMining(profile, 'QUICK', now);
    expect(updated.activeMining).toBeDefined();
    expect(updated.activeMining!.tier).toBe('QUICK');
    expect(updated.activeMining!.duration).toBe(MINING_TIERS.QUICK.duration);
    expect(updated.activeMining!.reward).toBe(MINING_TIERS.QUICK.reward);
  });

  it('startMining errors if already mining', () => {
    const profile = makeProfile();
    const now = new Date();
    const updated = startMining(profile, 'QUICK', now);
    expect(() => startMining(updated, 'STANDARD', now)).toThrow();
  });

  it('collectMining errors if timer not elapsed', () => {
    const profile = makeProfile();
    const start = new Date('2024-01-01T00:00:00Z');
    const updated = startMining(profile, 'QUICK', start);
    const tooSoon = new Date('2024-01-01T00:10:00Z'); // 10 min, need 30
    expect(() => collectMining(updated, tooSoon)).toThrow();
  });

  it('collectMining awards shards when timer elapsed', () => {
    const profile = makeProfile();
    const start = new Date('2024-01-01T00:00:00Z');
    const updated = startMining(profile, 'QUICK', start);
    const afterDone = new Date(start.getTime() + MINING_TIERS.QUICK.duration + 1000);
    const collected = collectMining(updated, afterDone);
    expect(collected.aetherShards).toBe(profile.aetherShards + MINING_TIERS.QUICK.reward);
    expect(collected.activeMining).toBeUndefined();
  });

  it('collectMining errors if no active expedition', () => {
    const profile = makeProfile();
    expect(() => collectMining(profile)).toThrow();
  });
});

describe('Training', () => {
  it('startTraining deducts shards and creates session', () => {
    const profile = makeProfile();
    const now = new Date();
    const updated = startTraining(profile, 'SHARDWARDEN', 'ATK', now);
    expect(updated.aetherShards).toBe(profile.aetherShards - TRAINING_CONFIG.ATK.cost);
    expect(updated.activeTraining).toBeDefined();
    expect(updated.activeTraining!.stat).toBe('ATK');
  });

  it('startTraining errors if insufficient shards', () => {
    const profile = { ...makeProfile(), aetherShards: 10 };
    expect(() => startTraining(profile, 'SHARDWARDEN', 'ATK')).toThrow();
  });

  it('startTraining errors if already training', () => {
    const profile = makeProfile();
    const updated = startTraining(profile, 'SHARDWARDEN', 'ATK');
    expect(() => startTraining(updated, 'SHARDWARDEN', 'DEF')).toThrow();
  });

  it('collectTraining applies stat bonus when timer elapsed', () => {
    const profile = makeProfile();
    const start = new Date('2024-01-01T00:00:00Z');
    const updated = startTraining(profile, 'SHARDWARDEN', 'ATK', start);
    const afterDone = new Date(start.getTime() + TRAINING_CONFIG.ATK.duration + 1000);
    const collected = collectTraining(updated, 'SHARDWARDEN', afterDone);
    expect(collected.heroes[0].bonusAtk).toBe(TRAINING_CONFIG.ATK.bonus);
    expect(collected.activeTraining).toBeUndefined();
  });

  it('collectTraining errors if timer not elapsed', () => {
    const profile = makeProfile();
    const start = new Date('2024-01-01T00:00:00Z');
    const updated = startTraining(profile, 'SHARDWARDEN', 'ATK', start);
    const tooSoon = new Date(start.getTime() + 1000);
    expect(() => collectTraining(updated, 'SHARDWARDEN', tooSoon)).toThrow();
  });
});

describe('Leveling', () => {
  it('addMatchXp adds 100 XP for a win', () => {
    const profile = makeProfile();
    const updated = addMatchXp(profile, 'SHARDWARDEN', true);
    expect(updated.heroes[0].xp).toBe(100);
  });

  it('addMatchXp adds 40 XP for a loss', () => {
    const profile = makeProfile();
    const updated = addMatchXp(profile, 'SHARDWARDEN', false);
    expect(updated.heroes[0].xp).toBe(40);
  });

  it('levels up at correct XP threshold', () => {
    // Level 2 requires 200 XP total
    const profile = makeProfile();
    // Add 200 XP (2 wins)
    let updated = addMatchXp(profile, 'SHARDWARDEN', true);
    updated = addMatchXp(updated, 'SHARDWARDEN', true);
    expect(updated.heroes[0].level).toBe(2);
  });

  it('getLevelFromXp returns correct level', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(199)).toBe(1);
    expect(getLevelFromXp(200)).toBe(2);
    expect(getLevelFromXp(300)).toBe(3);
  });

  it('getEffectiveStats includes level and training bonuses', () => {
    const profile = makeProfile();
    // Level up twice
    let updated = addMatchXp(profile, 'SHARDWARDEN', true);
    updated = addMatchXp(updated, 'SHARDWARDEN', true);
    // Now at level 2 (1 level gained: +1 atk, +1 def, +1 spd, +3 hp)
    const stats = getEffectiveStats(updated, 'SHARDWARDEN', HERO_DEFINITIONS.SHARDWARDEN.baseStats);
    expect(stats.currentLevel).toBe(2);
    expect(stats.hp).toBe(120 + 3); // +3 per level gained (1 level)
    expect(stats.attack).toBe(8 + 1); // +1 per level
  });
});
