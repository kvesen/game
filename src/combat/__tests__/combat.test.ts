import { CombatEngine } from '../combat-engine';
import { Hero } from '../../heroes/hero';
import { HERO_DEFINITIONS } from '../../heroes/hero-definitions';

function makeShardwarden() { return new Hero(HERO_DEFINITIONS.SHARDWARDEN); }
function makeAetherspark() { return new Hero(HERO_DEFINITIONS.AETHERSPARK); }
function makeRootcaller() { return new Hero(HERO_DEFINITIONS.ROOTCALLER); }

describe('Combat Engine', () => {
  describe('Basic mechanics', () => {
    it('basic attacks deal damage to both heroes', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);

      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );

      expect(p1.currentHp).toBeLessThan(p1.maxHp);
      expect(p2.currentHp).toBeLessThan(p2.maxHp);
    });

    it('basic attack deals effectiveAttack damage', () => {
      const p1 = makeShardwarden(); // ATK 8
      const p2 = makeAetherspark(); // ATK 16
      const engine = new CombatEngine(p1, p2);

      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );

      expect(p2.currentHp).toBe(p2.maxHp - 8);  // p1 ATK = 8
      expect(p1.currentHp).toBe(p1.maxHp - 16); // p2 ATK = 16
    });
  });

  describe('Cooldown mechanics', () => {
    it('ability goes on cooldown after use', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      // Round 1: give resonance
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // Now p1 has 1 resonance. Use shard_slam costs 1
      engine.submitRound(
        { abilityId: 'shard_slam', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // shard_slam cooldown = 2, should be on cooldown
      expect(p1.isAbilityReady('shard_slam')).toBe(false);
    });

    it('cooldown decrements each round', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      // Round 1: gain resonance
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // Round 2: use shard_slam
      engine.submitRound(
        { abilityId: 'shard_slam', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      const cdAfterUse = p1.cooldowns.get('shard_slam')!;
      expect(cdAfterUse).toBe(1); // set to 2, ticked to 1 in same round
      // Round 3: tick
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      expect(p1.cooldowns.get('shard_slam')).toBe(0);
      expect(p1.isAbilityReady('shard_slam')).toBe(true);
    });
  });

  describe('Resonance', () => {
    it('gains +1 resonance per round', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      expect(engine.getState().player1Resonance).toBe(1);
      expect(engine.getState().player2Resonance).toBe(1);
    });

    it('resonance accumulates over rounds', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      for (let i = 0; i < 3; i++) {
        engine.submitRound(
          { abilityId: 'basic_attack', overcharge: false },
          { abilityId: 'basic_attack', overcharge: false }
        );
      }
      expect(engine.getState().player1Resonance).toBe(3);
    });
  });

  describe('Overcharge mechanics', () => {
    it('overcharge costs 3 extra resonance', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      // Gain 4 resonance over 4 rounds
      for (let i = 0; i < 4; i++) {
        engine.submitRound(
          { abilityId: 'basic_attack', overcharge: false },
          { abilityId: 'basic_attack', overcharge: false }
        );
      }
      // shard_slam costs 1 + 3 = 4 resonance overcharged
      const resonanceBefore = engine.getState().player1Resonance;
      engine.submitRound(
        { abilityId: 'shard_slam', overcharge: true },
        { abilityId: 'basic_attack', overcharge: false }
      );
      expect(engine.getState().player1Resonance).toBe(resonanceBefore - 4 + 1);
    });

    it('overcharge offensive does 50% more damage', () => {
      const p1 = makeShardwarden(); // ATK 8
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);
      // Gain enough resonance
      for (let i = 0; i < 4; i++) {
        engine.submitRound(
          { abilityId: 'basic_attack', overcharge: false },
          { abilityId: 'basic_attack', overcharge: false }
        );
      }
      const p2HpBefore = p2.currentHp;
      engine.submitRound(
        { abilityId: 'shard_slam', overcharge: true },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // shard_slam overcharge: 8 * 1.2 * 1.5 = 14.4 -> 14 (rounded)
      const overchargeDmg = Math.round(8 * 1.2 * 1.5); // 14
      expect(p2HpBefore - p2.currentHp).toBe(overchargeDmg);
    });
  });

  describe('Fracture Wall', () => {
    it('absorbs incoming attacks', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);

      // Give p1 resonance (need 2 for fracture_wall)
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // Now p1 has 2 resonance
      // Use fracture_wall - shield goes up (DEFENSIVE) before p2's basic attack (OFFENSIVE)
      const p1HpBeforeShield = p1.currentHp;
      engine.submitRound(
        { abilityId: 'fracture_wall', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // The shield should absorb the basic attack (first charge used)
      expect(p1.currentHp).toBe(p1HpBeforeShield); // HP unchanged
      expect(p1.shieldCharges).toBe(1); // one charge used, 1 remaining
    });

    it('shatters after 2 charges and deals back 50%', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark(); // ATK 16
      const engine = new CombatEngine(p1, p2);

      // Gain 2 resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // Use fracture_wall (p2 basic attack absorbed - first charge)
      engine.submitRound({ abilityId: 'fracture_wall', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.shieldCharges).toBe(1);

      // Second hit - shield shatters (p2 deals 16, absorbed total = 16+16=32, shatter = 16)
      const p2HpBeforeShatter = p2.currentHp;
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      expect(p1.shieldCharges).toBe(0);
      // p2 should take shatter damage (50% of 32 = 16)
      expect(p2.currentHp).toBeLessThan(p2HpBeforeShatter);
    });
  });

  describe('Phase Slip', () => {
    it('sets dodgePending flag and dodge absorbs the attack in the same round', () => {
      const p1 = makeAetherspark();
      const p2 = makeShardwarden();
      const engine = new CombatEngine(p1, p2);

      // Gain 2 resonance for phase_slip
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p1 took 8 damage each round = 16 total
      const p1HpBeforePhaseSlip = p1.currentHp;
      // Use phase_slip - UTILITY resolves before OFFENSIVE, so dodge absorbs p2's basic
      engine.submitRound({ abilityId: 'phase_slip', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // p1 should NOT have taken damage this round (dodge absorbed p2's attack)
      expect(p1.currentHp).toBe(p1HpBeforePhaseSlip);
    });

    it('reduces cooldowns by 1', () => {
      const p1 = makeAetherspark();
      const p2 = makeShardwarden();
      const engine = new CombatEngine(p1, p2);

      // r1: gain resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // r2: use spark_bolt (costs 1 resonance, CD=1 -> set 1 -> tick 0 = ready)
      engine.submitRound({ abilityId: 'spark_bolt', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.isAbilityReady('spark_bolt')).toBe(true);

      // r3: basic
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // r4: use spark_bolt again (costs 1, resonance: r1=1, used in r2->0+1=1 at end r2, r3->2, r4 cost 1 -> 1)
      engine.submitRound({ abilityId: 'spark_bolt', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.isAbilityReady('spark_bolt')).toBe(true);

      // Now use chain_surge (costs 2): after r4 resonance = 2, use chain_surge
      // r5: chain_surge costs 2 (have 2). CD=2 -> set 2 -> tick 1
      engine.submitRound({ abilityId: 'chain_surge', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.cooldowns.get('chain_surge')).toBe(1);

      // r6: basic (chain_surge ticks to 0, now ready; resonance: 0+1=1)
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.isAbilityReady('chain_surge')).toBe(true);

      // r7: use phase_slip (costs 2, have 2). COOLDOWN_REDUCE fires during UTILITY phase.
      // chain_surge is already at 0, so reduce has no effect on it - still ready.
      engine.submitRound({ abilityId: 'phase_slip', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.isAbilityReady('chain_surge')).toBe(true);
    });
  });

  describe('Verdant Mend', () => {
    it('heals 20% max HP', () => {
      const p1 = makeRootcaller(); // HP 100
      const p2 = makeShardwarden();
      const engine = new CombatEngine(p1, p2);

      // Take some damage first
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // p1 took 8 damage (shardwarden ATK=8)

      // Gain more resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      const hpBeforeHeal = p1.currentHp;
      // Use verdant_mend (costs 2 resonance, have 2 now)
      engine.submitRound({ abilityId: 'verdant_mend', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      const expectedHeal = Math.round(100 * 0.2); // 20
      // verdant_mend is DEFENSIVE, resolves FIRST, then p2's basic attack (OFFENSIVE)
      expect(p1.currentHp).toBe(Math.min(100, hpBeforeHeal + expectedHeal) - 8);
    });

    it('triggers regen when HP below 30%', () => {
      const p1 = makeRootcaller(); // HP 100
      const p2 = makeShardwarden();
      p1.currentHp = 25; // below 30%
      const engine = new CombatEngine(p1, p2);

      // Give p1 resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      engine.submitRound({ abilityId: 'verdant_mend', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      expect(p1.regenActive).toBe(true);
      expect(p1.regenTurnsLeft).toBeGreaterThan(0);
    });
  });

  describe('Tectonic Grip', () => {
    it('locks opponent ability for 2 extra turns', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);

      // Put p2's chain_surge on cooldown first - need 2 resonance for p2
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // P2 uses chain_surge (costs 2 resonance)
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'chain_surge', overcharge: false });
      // chain_surge set to 2, ticked to 1

      // Give p1 enough resonance for tectonic_grip (need 3)
      // After r1: p1=1, after r2: p1=2, after r3: p1=3
      // Use tectonic_grip - should lock p2's highest CD ability
      engine.submitRound({ abilityId: 'tectonic_grip', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2's chain_surge (or whatever has highest CD) should be locked
      const totalLock = (p2.lockedAbilities.get('chain_surge') ?? 0) + (p2.cooldowns.get('chain_surge') ?? 0);
      expect(totalLock).toBeGreaterThan(0);
    });
  });

  describe('Entangling Bloom', () => {
    it('applies 40% damage reduction debuff to opponent', () => {
      const p1 = makeRootcaller();
      const p2 = makeShardwarden();
      const engine = new CombatEngine(p1, p2);

      // Give p1 resonance (need 3 for entangling_bloom)
      for (let i = 0; i < 3; i++) {
        engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      }
      // Use entangling_bloom
      engine.submitRound({ abilityId: 'entangling_bloom', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      // p2 should have DAMAGE_REDUCE debuff
      expect(p2.debuffs.some(d => d.type === 'DAMAGE_REDUCE')).toBe(true);
    });
  });

  describe('Priority resolution', () => {
    it('DEFENSIVE resolves before OFFENSIVE', () => {
      const p1 = makeShardwarden();
      const p2 = makeAetherspark();
      const engine = new CombatEngine(p1, p2);

      // Give p1 2 resonance
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      engine.submitRound({ abilityId: 'basic_attack', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });

      const p1HpBefore = p1.currentHp;
      engine.submitRound({ abilityId: 'fracture_wall', overcharge: false }, { abilityId: 'basic_attack', overcharge: false });
      // If shield resolved first, p1 should have taken no HP damage (absorbed)
      expect(p1.currentHp).toBe(p1HpBefore);
    });
  });

  describe('End conditions', () => {
    it('combat ends when a hero reaches 0 HP', () => {
      const p1 = makeAetherspark(); // ATK 16
      p1.currentHp = 1;
      const p2 = makeShardwarden();
      const engine = new CombatEngine(p1, p2);

      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );

      expect(engine.getState().isOver).toBe(true);
    });

    it('player2 wins when player1 hero dies', () => {
      const p1 = makeAetherspark();
      p1.currentHp = 1;
      const p2 = makeShardwarden(); // ATK 8, will kill p1 (1 HP), p1 ATK=16 won't kill p2 (120 HP)
      p2.currentHp = 120;
      const engine = new CombatEngine(p1, p2);
      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );
      // p1 (1 HP) takes 8 from shardwarden -> dead
      // p2 (120 HP) takes 16 from aetherspark -> 104 HP, still alive
      expect(engine.getState().isOver).toBe(true);
      expect(engine.getState().winner).toBe('player2');
    });

    it('round limit at 25 rounds: higher HP% wins', () => {
      const p1 = makeShardwarden();
      const p2 = makeRootcaller();
      const engine = new CombatEngine(p1, p2);

      for (let i = 0; i < 25; i++) {
        if (engine.getState().isOver) break;
        engine.submitRound(
          { abilityId: 'basic_attack', overcharge: false },
          { abilityId: 'basic_attack', overcharge: false }
        );
      }

      expect(engine.getState().isOver).toBe(true);
      expect(engine.getState().winner).not.toBeNull();
    });

    it('draw when both heroes die simultaneously', () => {
      const p1 = makeAetherspark(); // ATK 16
      p1.currentHp = 8; // will die from p2's 8 ATK
      const p2 = makeShardwarden(); // ATK 8
      p2.currentHp = 16; // will die from p1's 16 ATK
      const engine = new CombatEngine(p1, p2);

      engine.submitRound(
        { abilityId: 'basic_attack', overcharge: false },
        { abilityId: 'basic_attack', overcharge: false }
      );

      expect(engine.getState().isOver).toBe(true);
      expect(engine.getState().winner).toBe('draw');
    });
  });
});
