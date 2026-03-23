import { CombatEngine } from '../combat-engine';
import { Hero } from '../../heroes/hero';
import { HERO_DEFINITIONS } from '../../heroes/hero-definitions';
import { ATTUNEMENT_DEFINITIONS } from '../../heroes/attunement';

describe('Attunement combat effects', () => {
  describe('Volatile Shard', () => {
    it('overcharge costs 2 extra resonance instead of 3', () => {
      const att = ATTUNEMENT_DEFINITIONS.VOLATILE;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      // Gain 3 resonance (3 rounds)
      for (let i = 0; i < 3; i++) {
        engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }
      // shard_slam costs 1, overcharge with Volatile should cost 1 + (3-1) = 3 total, not 4
      const resBefore = engine.getState().player1Resonance; // should be 3
      expect(resBefore).toBe(3);

      // shard_slam overcharge: 1 + 2 (Volatile reduced from 3) = 3 total
      engine.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false });
      // Should succeed (spent 3, gained 1 = 1)
      expect(engine.getState().player1Resonance).toBe(resBefore - 3 + 1);
    });

    it('overcharge damage bonus is reduced by 15% (1.35x instead of 1.5x)', () => {
      const att = ATTUNEMENT_DEFINITIONS.VOLATILE;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      // Gain enough resonance (need 3: 1 cost + 2 overcharge)
      for (let i = 0; i < 3; i++) {
        engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }

      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam overcharge with Volatile: ATK * 1.2 * (1.5 - 0.15) = 8 * 1.2 * 1.35 = 12.96 -> 13
      const expectedDmg = Math.round(8 * 1.2 * 1.35);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });

    it('overcharge damage is less than standard 1.5x', () => {
      const att = ATTUNEMENT_DEFINITIONS.VOLATILE;
      const p1Volatile = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const p1Normal = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const p2a = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const p2b = new Hero(HERO_DEFINITIONS.AETHERSPARK);

      const engVolatile = new CombatEngine(p1Volatile, p2a);
      const engNormal = new CombatEngine(p1Normal, p2b);

      // Gain 4 resonance for normal overcharge
      for (let i = 0; i < 4; i++) {
        engNormal.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }
      // Gain 3 resonance for volatile overcharge
      for (let i = 0; i < 3; i++) {
        engVolatile.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }

      const p2aHpBefore = p2a.currentHp;
      const p2bHpBefore = p2b.currentHp;
      engVolatile.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false });
      engNormal.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false });

      const volatileDmg = p2aHpBefore - p2a.currentHp;
      const normalDmg = p2bHpBefore - p2b.currentHp;
      expect(volatileDmg).toBeLessThan(normalDmg);
    });
  });

  describe('Stabilized Shard', () => {
    it('grants +2 resonance per turn (1 base + 1 bonus)', () => {
      const att = ATTUNEMENT_DEFINITIONS.STABILIZED;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(engine.getState().player1Resonance).toBe(2); // 1 base + 1 bonus

      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(engine.getState().player1Resonance).toBe(4); // 4 after 2 rounds
    });

    it('p2 without attunement still only gets +1 resonance per turn', () => {
      const att = ATTUNEMENT_DEFINITIONS.STABILIZED;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(engine.getState().player2Resonance).toBe(1);
    });

    it('abilities have +1 cooldown penalty', () => {
      const att = ATTUNEMENT_DEFINITIONS.STABILIZED;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      // Gain resonance (2 rounds = 4 resonance with stabilized)
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam has base cooldown 2, with Stabilized it should be 3
      engine.submitRound({ abilityId: 'shard_slam', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // cooldown set to 2+1=3, then ticked to 2
      expect(p1.cooldowns.get('shard_slam')).toBe(2);
    });
  });

  describe('Fractured Shard', () => {
    it('reduces starting max HP by 15%', () => {
      const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
      const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const expectedHp = Math.round(120 * (1 - 0.15)); // 102
      expect(hero.maxHp).toBe(expectedHp);
      expect(hero.currentHp).toBe(expectedHp);
    });

    it('increases all damage output by 20%', () => {
      const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      // Gain resonance, then use shard_slam
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'shard_slam', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam: ATK * 1.2 * 1.2 (fractured bonus) = 8 * 1.44 = 11.52 -> 12
      const expectedDmg = Math.round(8 * 1.2 * 1.2);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });

    it('Fractured Shard + Overcharge: both multipliers applied', () => {
      const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2);

      // Need 4 resonance for overcharge (1 + 3)
      for (let i = 0; i < 4; i++) {
        engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }
      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam overcharge: ATK * 1.2 * 1.5 (overcharge) * 1.2 (fractured) = 8 * 2.16 = 17.28 -> 17
      const expectedDmg = Math.round(8 * 1.2 * 1.5 * 1.2);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });
  });

  describe('Resonant Shard', () => {
    it('increases healing by 30%', () => {
      const att = ATTUNEMENT_DEFINITIONS.RESONANT;
      const p1 = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 0, 0, undefined, att); // maxHp 100
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const engine = new CombatEngine(p1, p2);

      // Take damage first
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      const hpBeforeHeal = p1.currentHp;
      // Use verdant_mend (costs 2)
      engine.submitRound({ abilityId: 'verdant_mend', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // Verdant Mend heals 20% * 1.30 (resonant) = 26% of 100 = 26
      // Then p2 basic attacks for 8 * 1.10 (resonant DAMAGE_TAKEN_INCREASE) = 8.8 -> 9
      const expectedHeal = Math.round(100 * 0.20 * 1.30); // 26
      const attackDmg = Math.round(8 * 1.10); // 9
      expect(p1.currentHp).toBe(Math.min(100, hpBeforeHeal + expectedHeal) - attackDmg);
    });

    it('increases damage taken by 10%', () => {
      const att = ATTUNEMENT_DEFINITIONS.RESONANT;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 0, 0, undefined, att); // takes 10% more
      const engine = new CombatEngine(p1, p2);

      const p2HpBefore = p2.currentHp;
      // p1 basic attacks p2 with Resonant Shard
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2 takes 8 * 1.10 = 8.8 -> 9
      const expectedDmg = Math.round(8 * 1.10);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });
  });

  describe('Prismatic Shard', () => {
    it('player starts combat with 3 resonance', () => {
      const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
      const p1 = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, att);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const engine = new CombatEngine(p1, p2);

      expect(engine.getState().player1Resonance).toBe(3);
      expect(engine.getState().player2Resonance).toBe(0);
    });

    it('crit mechanic works with injectable RNG — always crits when rng returns 0', () => {
      const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
      const alwaysCrit = () => 0; // always below 0.10 threshold
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2, alwaysCrit);

      // Has 3 resonance to start + shard_slam costs 1
      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'shard_slam', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam + crit: 8 * 1.2 * 1.5 = 14.4 -> 14
      const expectedDmg = Math.round(8 * 1.2 * 1.5);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });

    it('crit mechanic works with injectable RNG — never crits when rng returns 1', () => {
      const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
      const neverCrit = () => 1; // always above 0.10 threshold
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att); // ATK 8
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK);
      const engine = new CombatEngine(p1, p2, neverCrit);

      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'shard_slam', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // shard_slam no crit: 8 * 1.2 = 9.6 -> 10
      const expectedDmg = Math.round(8 * 1.2);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });

    it('both players can have different attunements simultaneously', () => {
      const p1Att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
      const p2Att = ATTUNEMENT_DEFINITIONS.FRACTURED;
      const p1 = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, p1Att);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, p2Att);
      const engine = new CombatEngine(p1, p2);

      expect(engine.getState().player1Resonance).toBe(3); // Prismatic
      expect(p2.maxHp).toBe(Math.round(120 * 0.85)); // Fractured 15% HP penalty
    });
  });

  describe('Attunement effects compose with Overcharge', () => {
    it('Volatile + Overcharge: reduced cost AND reduced bonus', () => {
      const att = ATTUNEMENT_DEFINITIONS.VOLATILE;
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
      const p2Normal = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const p2NoAtt = new Hero(HERO_DEFINITIONS.AETHERSPARK);

      const engVolatile = new CombatEngine(p1, p2NoAtt);
      for (let i = 0; i < 3; i++) {
        engVolatile.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }
      // Volatile overcharge: shard_slam 1 + 2 = 3 total (instead of 4)
      // Should not throw (have 3 resonance, need exactly 3)
      expect(() =>
        engVolatile.submitRound({ abilityId: 'shard_slam', overcharge: true }, { abilityId: 'basic_attack', overcharge: false })
      ).not.toThrow();
    });

    it('Fractured Shard + Chain Surge bonus: both multipliers applied', () => {
      const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
      const p1 = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, att); // ATK 16
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      // Give p2 extra HP so they survive the buildup rounds
      p2.maxHp = 500;
      p2.currentHp = 500;
      const engine = new CombatEngine(p1, p2);

      // chain_surge has CD=2. The chain_surge bonus fires when used exactly cdValue+1=3 rounds
      // after the previous use (i.e., 1 round after the first available opportunity).

      // r1, r2: gain resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // r3: use chain_surge (costs 2 resonance). chainSurgeLastUsedTurn = 3.
      engine.submitRound({ abilityId: 'chain_surge', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // After r3: resonance = 0 + 1 = 1, CD = 1

      // r4: basic_attack. CD ticks to 0. resonance = 1 + 1 = 2.
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // r5: basic_attack. resonance = 2 + 1 = 3. (chain_surge ready but we skip to trigger bonus)
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // r6: use chain_surge. round=6, lastUsed=3. 6-3=3 = cdValue+1=3. BONUS fires!
      expect(engine.getState().player1Resonance).toBe(3);

      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'chain_surge', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // chain_surge + bonus + fractured: 16 * 1.3 * 1.5 * 1.2 = 37.44 -> 37
      const expectedDmg = Math.round(16 * 1.3 * 1.5 * 1.2);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDmg);
    });
  });
});
