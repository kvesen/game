import { addPvpVeilstone, addDungeonVeilstone } from '../veilstone';
import { PlayerProfile } from '../player-profile';

function makeProfile(): PlayerProfile {
  return {
    id: 'p1',
    username: 'TestPlayer',
    aetherShards: 100,
    heroes: [],
  };
}

describe('veilstone', () => {
  describe('addPvpVeilstone', () => {
    it('awards 15 veilstone for a win', () => {
      const p = makeProfile();
      const result = addPvpVeilstone(p, true);
      expect(result.veilstone).toBe(15);
    });

    it('awards 5 veilstone for a loss', () => {
      const p = makeProfile();
      const result = addPvpVeilstone(p, false);
      expect(result.veilstone).toBe(5);
    });

    it('accumulates veilstone correctly', () => {
      const p = { ...makeProfile(), veilstone: 10 };
      const result = addPvpVeilstone(p, true);
      expect(result.veilstone).toBe(25);
    });

    it('does not mutate the original player', () => {
      const p = makeProfile();
      addPvpVeilstone(p, true);
      expect(p.veilstone).toBeUndefined();
    });
  });

  describe('addDungeonVeilstone', () => {
    it('awards 10 veilstone for EASY', () => {
      const p = makeProfile();
      expect(addDungeonVeilstone(p, 'EASY').veilstone).toBe(10);
    });

    it('awards 25 veilstone for MEDIUM', () => {
      const p = makeProfile();
      expect(addDungeonVeilstone(p, 'MEDIUM').veilstone).toBe(25);
    });

    it('awards 60 veilstone for HARD', () => {
      const p = makeProfile();
      expect(addDungeonVeilstone(p, 'HARD').veilstone).toBe(60);
    });

    it('accumulates veilstone correctly', () => {
      const p = { ...makeProfile(), veilstone: 5 };
      expect(addDungeonVeilstone(p, 'MEDIUM').veilstone).toBe(30);
    });

    it('does not mutate the original player', () => {
      const p = makeProfile();
      addDungeonVeilstone(p, 'EASY');
      expect(p.veilstone).toBeUndefined();
    });
  });
});
