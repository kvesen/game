import { HERO_DEFINITIONS } from '../hero-definitions';
import { Hero } from '../hero';
import {
  validateLoadout,
  getAvailableAbilities,
  createDefaultLoadout,
  AbilityLoadout,
} from '../loadout';

describe('validateLoadout', () => {
  it('accepts a valid loadout with 3 unique abilities from the pool', () => {
    const result = validateLoadout('SHARDWARDEN', ['fracture_wall', 'tectonic_grip', 'shard_slam']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a loadout with fewer than 3 abilities', () => {
    const result = validateLoadout('SHARDWARDEN', ['fracture_wall', 'shard_slam']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exactly 3'))).toBe(true);
  });

  it('rejects a loadout with more than 3 abilities', () => {
    const result = validateLoadout('SHARDWARDEN', ['fracture_wall', 'tectonic_grip', 'shard_slam', 'crystal_barrage']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('exactly 3'))).toBe(true);
  });

  it('rejects a loadout with duplicate ability IDs', () => {
    const result = validateLoadout('SHARDWARDEN', ['fracture_wall', 'fracture_wall', 'shard_slam']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
  });

  it('rejects abilities not in the archetype pool', () => {
    const result = validateLoadout('SHARDWARDEN', ['fracture_wall', 'tectonic_grip', 'chain_surge']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('chain_surge'))).toBe(true);
  });

  it('accepts new P1 abilities from the archetype pool', () => {
    const result = validateLoadout('SHARDWARDEN', ['crystal_barrage', 'shard_nova', 'granite_skin']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts Aetherspark loadout with new abilities', () => {
    const result = validateLoadout('AETHERSPARK', ['arcane_siphon', 'thunderclap', 'evasive_maneuver']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts Rootcaller loadout with new abilities', () => {
    const result = validateLoadout('ROOTCALLER', ['thornwall', 'spore_cloud', 'root_slam']);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('getAvailableAbilities', () => {
  it('returns 10 abilities for Shardwarden', () => {
    const pool = getAvailableAbilities('SHARDWARDEN');
    expect(pool).toHaveLength(10);
  });

  it('returns 10 abilities for Aetherspark', () => {
    const pool = getAvailableAbilities('AETHERSPARK');
    expect(pool).toHaveLength(10);
  });

  it('returns 10 abilities for Rootcaller', () => {
    const pool = getAvailableAbilities('ROOTCALLER');
    expect(pool).toHaveLength(10);
  });

  it('includes all original P0 abilities', () => {
    const sw = getAvailableAbilities('SHARDWARDEN');
    expect(sw.some(a => a.id === 'fracture_wall')).toBe(true);
    expect(sw.some(a => a.id === 'tectonic_grip')).toBe(true);
    expect(sw.some(a => a.id === 'shard_slam')).toBe(true);
  });

  it('includes new P1 abilities for Shardwarden', () => {
    const sw = getAvailableAbilities('SHARDWARDEN');
    expect(sw.some(a => a.id === 'crystal_barrage')).toBe(true);
    expect(sw.some(a => a.id === 'shard_nova')).toBe(true);
    expect(sw.some(a => a.id === 'granite_skin')).toBe(true);
  });

  it('includes new P1 abilities for Aetherspark', () => {
    const ae = getAvailableAbilities('AETHERSPARK');
    expect(ae.some(a => a.id === 'arcane_siphon')).toBe(true);
    expect(ae.some(a => a.id === 'thunderclap')).toBe(true);
    expect(ae.some(a => a.id === 'evasive_maneuver')).toBe(true);
  });

  it('includes new P1 abilities for Rootcaller', () => {
    const rc = getAvailableAbilities('ROOTCALLER');
    expect(rc.some(a => a.id === 'thornwall')).toBe(true);
    expect(rc.some(a => a.id === 'spore_cloud')).toBe(true);
    expect(rc.some(a => a.id === 'root_slam')).toBe(true);
  });
});

describe('createDefaultLoadout', () => {
  it('returns the first 3 abilities for Shardwarden', () => {
    const loadout = createDefaultLoadout('SHARDWARDEN');
    expect(loadout.archetypeId).toBe('SHARDWARDEN');
    expect(loadout.selectedAbilityIds).toEqual(['fracture_wall', 'tectonic_grip', 'shard_slam']);
  });

  it('returns the first 3 abilities for Aetherspark', () => {
    const loadout = createDefaultLoadout('AETHERSPARK');
    expect(loadout.archetypeId).toBe('AETHERSPARK');
    expect(loadout.selectedAbilityIds).toEqual(['chain_surge', 'phase_slip', 'spark_bolt']);
  });

  it('returns the first 3 abilities for Rootcaller', () => {
    const loadout = createDefaultLoadout('ROOTCALLER');
    expect(loadout.archetypeId).toBe('ROOTCALLER');
    expect(loadout.selectedAbilityIds).toEqual(['verdant_mend', 'entangling_bloom', 'vine_lash']);
  });

  it('produces a valid loadout', () => {
    const loadout = createDefaultLoadout('SHARDWARDEN');
    const result = validateLoadout(loadout.archetypeId, [...loadout.selectedAbilityIds]);
    expect(result.valid).toBe(true);
  });
});

describe('Hero with custom loadout', () => {
  it('hero with custom loadout only has those 3 abilities available', () => {
    const loadout: AbilityLoadout = {
      archetypeId: 'SHARDWARDEN',
      selectedAbilityIds: ['crystal_barrage', 'shard_nova', 'granite_skin'],
    };
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout);
    expect(hero.activeAbilities).toHaveLength(3);
    expect(hero.activeAbilities.some(a => a.id === 'crystal_barrage')).toBe(true);
    expect(hero.activeAbilities.some(a => a.id === 'shard_nova')).toBe(true);
    expect(hero.activeAbilities.some(a => a.id === 'granite_skin')).toBe(true);
    // Original abilities not in loadout should not be available
    expect(hero.getAbility('fracture_wall')).toBeUndefined();
    expect(hero.getAbility('shard_slam')).toBeUndefined();
  });

  it('hero without loadout has the default 3 abilities (backward compat)', () => {
    const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK);
    expect(hero.activeAbilities).toHaveLength(3);
    expect(hero.getAbility('chain_surge')).toBeDefined();
    expect(hero.getAbility('phase_slip')).toBeDefined();
    expect(hero.getAbility('spark_bolt')).toBeDefined();
  });

  it('cooldowns are only initialized for active abilities', () => {
    const loadout: AbilityLoadout = {
      archetypeId: 'SHARDWARDEN',
      selectedAbilityIds: ['crystal_barrage', 'shard_nova', 'granite_skin'],
    };
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout);
    expect(hero.cooldowns.has('crystal_barrage')).toBe(true);
    expect(hero.cooldowns.has('shard_nova')).toBe(true);
    expect(hero.cooldowns.has('granite_skin')).toBe(true);
    expect(hero.cooldowns.has('fracture_wall')).toBe(false);
    expect(hero.cooldowns.has('shard_slam')).toBe(false);
  });

  it('isAbilityReady returns false for abilities not in active loadout', () => {
    const loadout: AbilityLoadout = {
      archetypeId: 'SHARDWARDEN',
      selectedAbilityIds: ['crystal_barrage', 'shard_nova', 'granite_skin'],
    };
    const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout);
    expect(hero.isAbilityReady('fracture_wall')).toBe(false);
    expect(hero.isAbilityReady('crystal_barrage')).toBe(true);
  });

  it('throws when loadout contains ability not in pool', () => {
    const loadout: AbilityLoadout = {
      archetypeId: 'SHARDWARDEN',
      selectedAbilityIds: ['crystal_barrage', 'chain_surge', 'granite_skin'] as [string, string, string],
    };
    expect(() => new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout)).toThrow();
  });
});
