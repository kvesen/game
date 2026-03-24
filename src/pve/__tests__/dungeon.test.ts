import { startDungeon, completeDungeon } from '../dungeon';
import { PlayerProfile } from '../../progression/player-profile';

function makeProfile(): PlayerProfile {
  return {
    id: 'p1',
    username: 'TestPlayer',
    aetherShards: 0,
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

const now = new Date('2024-01-01T00:00:00Z');

describe('dungeon', () => {
  describe('startDungeon', () => {
    it('starts an EASY dungeon', () => {
      const p = makeProfile();
      const result = startDungeon(p, 'EASY', now);
      expect(result.activeDungeon).toBeDefined();
      expect(result.activeDungeon!.tier).toBe('EASY');
      expect(result.activeDungeon!.completed).toBe(false);
      expect(result.activeDungeon!.duration).toBe(15 * 60 * 1000);
    });

    it('starts a MEDIUM dungeon', () => {
      const p = makeProfile();
      const result = startDungeon(p, 'MEDIUM', now);
      expect(result.activeDungeon!.duration).toBe(45 * 60 * 1000);
    });

    it('starts a HARD dungeon', () => {
      const p = makeProfile();
      const result = startDungeon(p, 'HARD', now);
      expect(result.activeDungeon!.duration).toBe(2 * 60 * 60 * 1000);
    });

    it('throws if already in a dungeon', () => {
      const p = startDungeon(makeProfile(), 'EASY', now);
      expect(() => startDungeon(p, 'MEDIUM', now)).toThrow('Already in a dungeon');
    });

    it('does not mutate the original player', () => {
      const p = makeProfile();
      startDungeon(p, 'EASY', now);
      expect(p.activeDungeon).toBeUndefined();
    });
  });

  describe('completeDungeon', () => {
    it('completes an EASY dungeon and awards correct rewards', () => {
      const p = startDungeon(makeProfile(), 'EASY', now);
      const laterTime = new Date(now.getTime() + 15 * 60 * 1000 + 1);
      const { player: result, rewards } = completeDungeon(p, 'SHARDWARDEN', laterTime);
      expect(result.aetherShards).toBe(20);
      expect(result.veilstone).toBe(10);
      expect(result.heroes[0].xp).toBe(50);
      expect(rewards.aetherShards).toBe(20);
      expect(rewards.veilstone).toBe(10);
      expect(rewards.xp).toBe(50);
      expect(result.activeDungeon).toBeUndefined();
    });

    it('completes a MEDIUM dungeon', () => {
      const p = startDungeon(makeProfile(), 'MEDIUM', now);
      const laterTime = new Date(now.getTime() + 45 * 60 * 1000 + 1);
      const { player: result, rewards } = completeDungeon(p, 'SHARDWARDEN', laterTime);
      expect(result.aetherShards).toBe(60);
      expect(result.veilstone).toBe(25);
      expect(result.heroes[0].xp).toBe(120);
      expect(rewards.xp).toBe(120);
    });

    it('completes a HARD dungeon', () => {
      const p = startDungeon(makeProfile(), 'HARD', now);
      const laterTime = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 1);
      const { player: result, rewards } = completeDungeon(p, 'SHARDWARDEN', laterTime);
      expect(result.aetherShards).toBe(150);
      expect(result.veilstone).toBe(60);
      expect(result.heroes[0].xp).toBe(300);
      expect(rewards.xp).toBe(300);
    });

    it('throws if no active dungeon', () => {
      const p = makeProfile();
      expect(() => completeDungeon(p, 'SHARDWARDEN', now)).toThrow('No active dungeon');
    });

    it('throws if dungeon not yet complete', () => {
      const p = startDungeon(makeProfile(), 'EASY', now);
      const tooSoon = new Date(now.getTime() + 5 * 60 * 1000);
      expect(() => completeDungeon(p, 'SHARDWARDEN', tooSoon)).toThrow('Dungeon not yet complete');
    });

    it('throws if hero not found', () => {
      const p = startDungeon(makeProfile(), 'EASY', now);
      const laterTime = new Date(now.getTime() + 15 * 60 * 1000 + 1);
      expect(() => completeDungeon(p, 'NONEXISTENT', laterTime)).toThrow("Hero 'NONEXISTENT' not found");
    });

    it('does not mutate the original player', () => {
      const p = startDungeon(makeProfile(), 'EASY', now);
      const laterTime = new Date(now.getTime() + 15 * 60 * 1000 + 1);
      completeDungeon(p, 'SHARDWARDEN', laterTime);
      expect(p.aetherShards).toBe(0);
    });

    it('can trigger level up from xp rewards', () => {
      const p = startDungeon(makeProfile(), 'HARD', now);
      const laterTime = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 1);
      const { player: result } = completeDungeon(p, 'SHARDWARDEN', laterTime);
      expect(result.heroes[0].level).toBeGreaterThan(1);
    });
  });
});
