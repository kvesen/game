import { HERO_DEFINITIONS } from '../hero-definitions';
import { Hero } from '../hero';

describe('Hero Definitions', () => {
  describe('Shardwarden', () => {
    const def = HERO_DEFINITIONS.SHARDWARDEN;

    it('has correct base stats', () => {
      expect(def.baseStats.hp).toBe(120);
      expect(def.baseStats.attack).toBe(8);
      expect(def.baseStats.defense).toBe(14);
      expect(def.baseStats.speed).toBe(6);
    });

    it('has 3 abilities', () => {
      expect(def.abilities).toHaveLength(3);
    });

    it('Fracture Wall is DEFENSIVE with 3 CD and 2 resonance', () => {
      const fw = def.abilities.find(a => a.id === 'fracture_wall')!;
      expect(fw.type).toBe('DEFENSIVE');
      expect(fw.cooldown).toBe(3);
      expect(fw.resonanceCost).toBe(2);
      expect(fw.effects[0].type).toBe('SHIELD');
    });

    it('Tectonic Grip is UTILITY with 5 CD and 3 resonance', () => {
      const tg = def.abilities.find(a => a.id === 'tectonic_grip')!;
      expect(tg.type).toBe('UTILITY');
      expect(tg.cooldown).toBe(5);
      expect(tg.resonanceCost).toBe(3);
    });

    it('Shard Slam is OFFENSIVE with 2 CD and 1 resonance', () => {
      const ss = def.abilities.find(a => a.id === 'shard_slam')!;
      expect(ss.type).toBe('OFFENSIVE');
      expect(ss.cooldown).toBe(2);
      expect(ss.resonanceCost).toBe(1);
      expect(ss.effects[0].value).toBe(1.2);
    });
  });

  describe('Aetherspark', () => {
    const def = HERO_DEFINITIONS.AETHERSPARK;

    it('has correct base stats', () => {
      expect(def.baseStats.hp).toBe(80);
      expect(def.baseStats.attack).toBe(16);
      expect(def.baseStats.defense).toBe(6);
      expect(def.baseStats.speed).toBe(14);
    });

    it('has 3 abilities', () => {
      expect(def.abilities).toHaveLength(3);
    });

    it('Chain Surge has DAMAGE effect with value 1.3', () => {
      const cs = def.abilities.find(a => a.id === 'chain_surge')!;
      expect(cs.type).toBe('OFFENSIVE');
      expect(cs.effects[0].value).toBe(1.3);
    });

    it('Phase Slip is UTILITY with DODGE + COOLDOWN_REDUCE effects', () => {
      const ps = def.abilities.find(a => a.id === 'phase_slip')!;
      expect(ps.type).toBe('UTILITY');
      expect(ps.effects.some(e => e.type === 'DODGE')).toBe(true);
      expect(ps.effects.some(e => e.type === 'COOLDOWN_REDUCE')).toBe(true);
    });

    it('Spark Bolt is OFFENSIVE with 1 CD and 0.8 multiplier', () => {
      const sb = def.abilities.find(a => a.id === 'spark_bolt')!;
      expect(sb.cooldown).toBe(1);
      expect(sb.effects[0].value).toBe(0.8);
    });
  });

  describe('Rootcaller', () => {
    const def = HERO_DEFINITIONS.ROOTCALLER;

    it('has correct base stats', () => {
      expect(def.baseStats.hp).toBe(100);
      expect(def.baseStats.attack).toBe(10);
      expect(def.baseStats.defense).toBe(10);
      expect(def.baseStats.speed).toBe(10);
    });

    it('has 3 abilities', () => {
      expect(def.abilities).toHaveLength(3);
    });

    it('Verdant Mend is DEFENSIVE with HEAL effect', () => {
      const vm = def.abilities.find(a => a.id === 'verdant_mend')!;
      expect(vm.type).toBe('DEFENSIVE');
      expect(vm.effects[0].type).toBe('HEAL');
      expect(vm.effects[0].value).toBe(0.2);
    });

    it('Entangling Bloom has DAMAGE_REDUCE and STAT_DEBUFF effects', () => {
      const eb = def.abilities.find(a => a.id === 'entangling_bloom')!;
      expect(eb.type).toBe('UTILITY');
      expect(eb.effects.some(e => e.type === 'DAMAGE_REDUCE')).toBe(true);
      expect(eb.effects.some(e => e.type === 'STAT_DEBUFF')).toBe(true);
    });

    it('Vine Lash is OFFENSIVE with 1.1 multiplier', () => {
      const vl = def.abilities.find(a => a.id === 'vine_lash')!;
      expect(vl.effects[0].value).toBe(1.1);
    });
  });
});

describe('Hero Class', () => {
  it('initializes with full HP', () => {
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
    expect(hero.currentHp).toBe(hero.maxHp);
    expect(hero.currentHp).toBe(120);
  });

  it('initializes all cooldowns to 0', () => {
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
    for (const ability of hero.definition.abilities) {
      expect(hero.cooldowns.get(ability.id)).toBe(0);
    }
  });

  it('isAbilityReady returns true initially', () => {
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK);
    expect(hero.isAbilityReady('chain_surge')).toBe(true);
    expect(hero.isAbilityReady('phase_slip')).toBe(true);
    expect(hero.isAbilityReady('spark_bolt')).toBe(true);
  });

  it('effectiveAttack includes bonuses', () => {
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 5, 0, 0);
    expect(hero.effectiveAttack).toBe(8 + 5);
  });

  it('effectiveDefense includes bonuses', () => {
    const hero = new Hero(HERO_DEFINITIONS.ROOTCALLER, 0, 3, 0);
    expect(hero.effectiveDefense).toBe(10 + 3);
  });

  it('effectiveSpeed includes bonuses', () => {
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 4);
    expect(hero.effectiveSpeed).toBe(14 + 4);
  });

  it('isAlive returns false at 0 HP', () => {
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK);
    hero.currentHp = 0;
    expect(hero.isAlive()).toBe(false);
  });

  it('hpPercent returns correct ratio', () => {
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK);
    hero.currentHp = 40;
    expect(hero.hpPercent()).toBe(0.5);
  });
});
