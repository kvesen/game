import { ATTUNEMENT_DEFINITIONS, AttunementDefinition } from '../attunement';
import { Hero } from '../hero';
import { HERO_DEFINITIONS } from '../hero-definitions';

describe('Attunement Definitions', () => {
  it('defines all 5 attunements', () => {
    const ids = Object.keys(ATTUNEMENT_DEFINITIONS);
    expect(ids).toHaveLength(5);
    expect(ids).toContain('VOLATILE');
    expect(ids).toContain('STABILIZED');
    expect(ids).toContain('FRACTURED');
    expect(ids).toContain('RESONANT');
    expect(ids).toContain('PRISMATIC');
  });

  describe('Volatile Shard', () => {
    const att = ATTUNEMENT_DEFINITIONS.VOLATILE;
    it('has correct ID and name', () => {
      expect(att.id).toBe('VOLATILE');
      expect(att.name).toBe('Volatile Shard');
    });
    it('has OVERCHARGE_COST_REDUCTION of 1', () => {
      const eff = att.effects.find(e => e.type === 'OVERCHARGE_COST_REDUCTION')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(1);
    });
    it('has OVERCHARGE_DAMAGE_PENALTY of 0.15', () => {
      const eff = att.effects.find(e => e.type === 'OVERCHARGE_DAMAGE_PENALTY')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.15);
    });
  });

  describe('Stabilized Shard', () => {
    const att = ATTUNEMENT_DEFINITIONS.STABILIZED;
    it('has correct ID and name', () => {
      expect(att.id).toBe('STABILIZED');
      expect(att.name).toBe('Stabilized Shard');
    });
    it('has RESONANCE_PER_TURN_BONUS of 1', () => {
      const eff = att.effects.find(e => e.type === 'RESONANCE_PER_TURN_BONUS')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(1);
    });
    it('has COOLDOWN_PENALTY of 1', () => {
      const eff = att.effects.find(e => e.type === 'COOLDOWN_PENALTY')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(1);
    });
  });

  describe('Fractured Shard', () => {
    const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
    it('has DAMAGE_BONUS_PERCENT of 0.20', () => {
      const eff = att.effects.find(e => e.type === 'DAMAGE_BONUS_PERCENT')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.20);
    });
    it('has MAX_HP_PENALTY_PERCENT of 0.15', () => {
      const eff = att.effects.find(e => e.type === 'MAX_HP_PENALTY_PERCENT')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.15);
    });
  });

  describe('Resonant Shard', () => {
    const att = ATTUNEMENT_DEFINITIONS.RESONANT;
    it('has HEAL_BONUS_PERCENT of 0.30', () => {
      const eff = att.effects.find(e => e.type === 'HEAL_BONUS_PERCENT')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.30);
    });
    it('has DAMAGE_TAKEN_INCREASE_PERCENT of 0.10', () => {
      const eff = att.effects.find(e => e.type === 'DAMAGE_TAKEN_INCREASE_PERCENT')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.10);
    });
  });

  describe('Prismatic Shard', () => {
    const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
    it('has START_RESONANCE of 3', () => {
      const eff = att.effects.find(e => e.type === 'START_RESONANCE')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(3);
    });
    it('has CRIT_CHANCE of 0.10', () => {
      const eff = att.effects.find(e => e.type === 'CRIT_CHANCE')!;
      expect(eff).toBeDefined();
      expect(eff.value).toBe(0.10);
    });
  });
});

describe('Hero with no attunement', () => {
  it('behaves identically to P0 (no HP modification)', () => {
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
    expect(hero.maxHp).toBe(120);
    expect(hero.currentHp).toBe(120);
    expect(hero.attunement).toBeUndefined();
  });

  it('effectiveAttack unaffected without attunement', () => {
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
    expect(hero.effectiveAttack).toBe(8);
  });
});

describe('Hero with Fractured Shard attunement', () => {
  it('reduces max HP by 15%', () => {
    const att = ATTUNEMENT_DEFINITIONS.FRACTURED;
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, undefined, att);
    const expectedHp = Math.round(120 * (1 - 0.15)); // 102
    expect(hero.maxHp).toBe(expectedHp);
    expect(hero.currentHp).toBe(expectedHp);
  });
});

describe('Hero with Prismatic Shard attunement', () => {
  it('stores attunement on hero', () => {
    const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, att);
    expect(hero.attunement).toBe(att);
  });

  it('does not change HP', () => {
    const att = ATTUNEMENT_DEFINITIONS.PRISMATIC;
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, att);
    expect(hero.maxHp).toBe(80);
    expect(hero.currentHp).toBe(80);
  });
});
