import { craft, CRAFTING_RECIPES } from '../crafting';
import { PlayerProfile } from '../player-profile';

function makeProfile(): PlayerProfile {
  return {
    id: 'p1',
    username: 'TestPlayer',
    aetherShards: 500,
    veilstone: 500,
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

describe('crafting', () => {
  describe('CRAFTING_RECIPES', () => {
    it('has at least 4 recipes', () => {
      expect(Object.keys(CRAFTING_RECIPES).length).toBeGreaterThanOrEqual(4);
    });

    it('SHARD_EDGE gives +3 ATK', () => {
      expect(CRAFTING_RECIPES.SHARD_EDGE.result).toEqual({
        type: 'STAT_BOOST',
        stat: 'ATK',
        value: 3,
      });
    });

    it('STONE_AEGIS gives +3 DEF', () => {
      expect(CRAFTING_RECIPES.STONE_AEGIS.result).toEqual({
        type: 'STAT_BOOST',
        stat: 'DEF',
        value: 3,
      });
    });

    it('SWIFT_RUNE gives +3 SPD', () => {
      expect(CRAFTING_RECIPES.SWIFT_RUNE.result).toEqual({
        type: 'STAT_BOOST',
        stat: 'SPD',
        value: 3,
      });
    });

    it('ECHO_TOME gives +200 XP', () => {
      expect(CRAFTING_RECIPES.ECHO_TOME.result).toEqual({
        type: 'XP_BOOST',
        value: 200,
      });
    });
  });

  describe('craft', () => {
    it('applies ATK boost', () => {
      const p = makeProfile();
      const result = craft(p, 'SHARDWARDEN', 'SHARD_EDGE');
      expect(result.heroes[0].bonusAtk).toBe(3);
    });

    it('applies DEF boost', () => {
      const p = makeProfile();
      const result = craft(p, 'SHARDWARDEN', 'STONE_AEGIS');
      expect(result.heroes[0].bonusDef).toBe(3);
    });

    it('applies SPD boost', () => {
      const p = makeProfile();
      const result = craft(p, 'SHARDWARDEN', 'SWIFT_RUNE');
      expect(result.heroes[0].bonusSpd).toBe(3);
    });

    it('applies XP boost', () => {
      const p = makeProfile();
      const result = craft(p, 'SHARDWARDEN', 'ECHO_TOME');
      expect(result.heroes[0].xp).toBe(200);
    });

    it('deducts aetherShards and veilstone', () => {
      const p = makeProfile();
      const result = craft(p, 'SHARDWARDEN', 'SHARD_EDGE');
      expect(result.aetherShards).toBe(400);
      expect(result.veilstone).toBe(450);
    });

    it('throws if insufficient aether shards', () => {
      const p = { ...makeProfile(), aetherShards: 50 };
      expect(() => craft(p, 'SHARDWARDEN', 'SHARD_EDGE')).toThrow('Insufficient Aether Shards');
    });

    it('throws if insufficient veilstone', () => {
      const p = { ...makeProfile(), veilstone: 10 };
      expect(() => craft(p, 'SHARDWARDEN', 'SHARD_EDGE')).toThrow('Insufficient Veilstone');
    });

    it('throws if hero not found', () => {
      const p = makeProfile();
      expect(() => craft(p, 'NONEXISTENT', 'SHARD_EDGE')).toThrow("Hero 'NONEXISTENT' not found");
    });

    it('throws if recipe not found', () => {
      const p = makeProfile();
      expect(() => craft(p, 'SHARDWARDEN', 'INVALID')).toThrow("Crafting recipe 'INVALID' not found");
    });

    it('does not mutate the original player', () => {
      const p = makeProfile();
      craft(p, 'SHARDWARDEN', 'SHARD_EDGE');
      expect(p.aetherShards).toBe(500);
      expect(p.heroes[0].bonusAtk).toBe(0);
    });

    it('xp boost can trigger level up', () => {
      const p = { ...makeProfile(), veilstone: 500, aetherShards: 500 };
      const result = craft(p, 'SHARDWARDEN', 'ECHO_TOME');
      expect(result.heroes[0].level).toBe(2);
    });
  });
});
