import { AbilityDefinition } from './ability';
import { ArchetypeId, HERO_DEFINITIONS } from './hero-definitions';

export interface AbilityLoadout {
  archetypeId: ArchetypeId;
  selectedAbilityIds: [string, string, string];
}

/**
 * Validates that a loadout is legal:
 * - exactly 3 ability IDs
 * - no duplicates
 * - all IDs belong to the given archetype's ability pool
 */
export function validateLoadout(
  archetypeId: ArchetypeId,
  abilityIds: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const definition = HERO_DEFINITIONS[archetypeId];

  if (abilityIds.length !== 3) {
    errors.push(`Loadout must contain exactly 3 abilities, got ${abilityIds.length}`);
  }

  const seen = new Set<string>();
  for (const id of abilityIds) {
    if (seen.has(id)) {
      errors.push(`Duplicate ability ID: ${id}`);
    }
    seen.add(id);
  }

  const poolIds = new Set(definition.abilityPool.map(a => a.id));
  for (const id of abilityIds) {
    if (!poolIds.has(id)) {
      errors.push(`Ability '${id}' does not belong to ${archetypeId}'s ability pool`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Returns the full ability pool for an archetype. */
export function getAvailableAbilities(archetypeId: ArchetypeId): AbilityDefinition[] {
  return HERO_DEFINITIONS[archetypeId].abilityPool;
}

/** Returns a loadout using the first 3 abilities of the archetype (P0 default). */
export function createDefaultLoadout(archetypeId: ArchetypeId): AbilityLoadout {
  const pool = HERO_DEFINITIONS[archetypeId].abilityPool;
  return {
    archetypeId,
    selectedAbilityIds: [pool[0].id, pool[1].id, pool[2].id],
  };
}
