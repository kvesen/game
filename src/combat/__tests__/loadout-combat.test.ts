import { CombatEngine } from '../combat-engine';
import { Hero } from '../../heroes/hero';
import { HERO_DEFINITIONS } from '../../heroes/hero-definitions';
import { AbilityLoadout } from '../../heroes/loadout';

describe('Combat with custom loadouts', () => {
  describe('Crystal Barrage (DAMAGE_IGNORE_SHIELD)', () => {
    it('deals damage even when opponent has shield charges', () => {
      // Shardwarden with crystal_barrage vs Shardwarden with fracture_wall
      const loadout1: AbilityLoadout = {
        archetypeId: 'SHARDWARDEN',
        selectedAbilityIds: ['crystal_barrage', 'tectonic_grip', 'shard_slam'],
      };
      const loadout2: AbilityLoadout = {
        archetypeId: 'SHARDWARDEN',
        selectedAbilityIds: ['fracture_wall', 'tectonic_grip', 'shard_slam'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout1);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout2);
      const engine = new CombatEngine(p1, p2);

      // Give p2 resonance for fracture_wall and p1 resonance for crystal_barrage
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2 uses fracture_wall (DEFENSIVE), p1 uses crystal_barrage (OFFENSIVE, ignores shield)
      const p2HpBefore = p2.currentHp;
      engine.submitRound(
        { abilityId: 'crystal_barrage', overcharge: false },
        { abilityId: 'fracture_wall', overcharge: false }
      );

      // Crystal barrage should deal damage even through the shield
      expect(p2.currentHp).toBeLessThan(p2HpBefore);
      // Shield still went up (DEFENSIVE resolves first)
      expect(p2.shieldCharges).toBeGreaterThan(0);
    });
  });

  describe('Thornwall (DAMAGE_REFLECT)', () => {
    it('reflects 30% of incoming damage back to attacker', () => {
      const loadout1: AbilityLoadout = {
        archetypeId: 'ROOTCALLER',
        selectedAbilityIds: ['thornwall', 'entangling_bloom', 'vine_lash'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 0, 0, loadout1);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN); // ATK 8

      const engine = new CombatEngine(p1, p2);
      // Give p1 resonance for thornwall
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      const p2HpBefore = p2.currentHp;
      // p1 uses thornwall (DEFENSIVE, activates reflect), p2 uses basic attack (OFFENSIVE)
      engine.submitRound(
        { abilityId: 'thornwall', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );

      // p2 attacked with ATK 8, so 30% reflected = Math.round(8 * 0.3) = 2
      const expectedReflect = Math.round(8 * 0.3);
      expect(p2.currentHp).toBeLessThanOrEqual(p2HpBefore - expectedReflect);
    });
  });

  describe('Spore Cloud (POISON)', () => {
    it('applies poison that ticks each round', () => {
      const loadout1: AbilityLoadout = {
        archetypeId: 'ROOTCALLER',
        selectedAbilityIds: ['spore_cloud', 'verdant_mend', 'vine_lash'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 0, 0, loadout1);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const engine = new CombatEngine(p1, p2);

      // Give p1 resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // Use spore_cloud
      engine.submitRound({ abilityId: 'spore_cloud', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2 should have a POISON debuff
      expect(p2.debuffs.some(d => d.type === 'POISON')).toBe(true);

      // In the next round, poison ticks
      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2 should have taken poison damage (3% of 120 = 4) plus regular attack damage
      const expectedPoisonDmg = Math.round(p2.maxHp * 0.03);
      expect(p2HpBefore - p2.currentHp).toBeGreaterThanOrEqual(expectedPoisonDmg);
    });
  });

  describe('Arcane Siphon (RESONANCE_STEAL)', () => {
    it('transfers resonance from opponent to caster', () => {
      const loadout1: AbilityLoadout = {
        archetypeId: 'AETHERSPARK',
        selectedAbilityIds: ['arcane_siphon', 'chain_surge', 'spark_bolt'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, loadout1);
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const engine = new CombatEngine(p1, p2);

      // Build up resonance for both players (need 2 for arcane_siphon)
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // p1: 2 resonance, p2: 2 resonance

      const p1ResBeforeSteal = engine.getState().player1Resonance;
      const p2ResBeforeSteal = engine.getState().player2Resonance;

      // p1 uses arcane_siphon (costs 2)
      engine.submitRound({ abilityId: 'arcane_siphon', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // After using arcane_siphon: p1 cost 2, then steals 2 from p2, then +1 regen = (2 - 2 + 2 + 1)
      // p2: gained nothing, lost 2, +1 regen
      const state = engine.getState();
      // p1 resonance should be higher relative to p2 after steal
      // Before: p1=2, p2=2. After round: p1 spends 2 (= 0), steals 2 from p2, gains +1 = 3
      // p2: gains +1 normally, loses 2 from steal = 2+1-2 = 1
      // Actual steal limited to p2's current resonance at time of steal
      expect(state.player1Resonance).toBeGreaterThan(state.player2Resonance);
    });
  });

  describe('Root Slam bonus vs debuffed opponent', () => {
    it('deals 25% bonus damage when opponent has a debuff', () => {
      const loadout1: AbilityLoadout = {
        archetypeId: 'ROOTCALLER',
        selectedAbilityIds: ['root_slam', 'spore_cloud', 'vine_lash'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 0, 0, loadout1); // ATK 10
      const p2 = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
      const engine = new CombatEngine(p1, p2);

      // Build resonance
      for (let i = 0; i < 3; i++) {
        engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }

      // Apply debuff via spore_cloud (costs 2)
      engine.submitRound({ abilityId: 'spore_cloud', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      expect(p2.debuffs.some(d => d.type === 'POISON')).toBe(true);

      // Now use root_slam (costs 2) — p2 is debuffed so should get +25% bonus
      const p2HpBefore = p2.currentHp;
      engine.submitRound({ abilityId: 'root_slam', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // root_slam: ATK * 1.3 * 1.25 = 10 * 1.625 = 16.25 -> 16
      const expectedDamage = Math.round(10 * 1.3 * 1.25);
      // Compare: some damage from root_slam + poison tick happened, so just verify combat resolves
      expect(p2.currentHp).toBeLessThan(p2HpBefore);
      // Exact damage should equal expectedDamage (no other sources since p2 basic attacks p1)
      // Actually p2 also basic-attacked p1, not p2, so p2's HP change is from root_slam + poison
      const poisonDmg = Math.round(p2.maxHp * 0.03);
      expect(p2HpBefore - p2.currentHp).toBe(expectedDamage + poisonDmg);
    });
  });

  describe('Seismic Pulse (ATK_DEBUFF)', () => {
    it('reduces opponent ATK by 25%', () => {
      const loadout1: AbilityLoadout = {
        archetypeId: 'SHARDWARDEN',
        selectedAbilityIds: ['seismic_pulse', 'fracture_wall', 'shard_slam'],
      };
      const p1 = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout1);
      const p2 = new Hero(HERO_DEFINITIONS.AETHERSPARK); // ATK 16

      const engine = new CombatEngine(p1, p2);
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // Use seismic_pulse
      engine.submitRound({ abilityId: 'seismic_pulse', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      expect(p2.debuffs.some(d => d.type === 'ATK_DEBUFF')).toBe(true);
      // p2 effective ATK should be reduced
      const reducedAtk = Math.round(16 * (1 - 0.25)); // 12
      expect(p2.effectiveAttack).toBe(reducedAtk);
    });
  });
});
