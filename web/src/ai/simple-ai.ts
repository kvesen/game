import { Hero } from '@engine/heroes/hero';
import type { ActionSelection } from '@engine/combat/combat-state';

/**
 * Simple but somewhat intelligent AI opponent.
 * - Prefers defensive/healing when own HP < 30%
 * - Prefers offensive when opponent HP < 30%
 * - Otherwise picks randomly from available abilities
 * - Sometimes uses overcharge when resonance is high
 */
export function selectAiAction(
  hero: Hero,
  opponent: Hero,
  resonance: number,
  rng: () => number = Math.random
): ActionSelection {
  const hpPct = hero.hpPercent();
  const oppHpPct = opponent.hpPercent();

  // Gather available abilities
  const available = hero.activeAbilities.filter(a => {
    return hero.isAbilityReady(a.id) && resonance >= a.resonanceCost;
  });

  let chosenAbility: typeof available[number] | null = null;

  if (hpPct < 0.3) {
    // Low health: prefer defensive or healing
    const defensive = available.filter(a => a.type === 'DEFENSIVE');
    const utility = available.filter(a => a.type === 'UTILITY');
    if (defensive.length > 0) {
      chosenAbility = defensive[Math.floor(rng() * defensive.length)];
    } else if (utility.length > 0 && rng() > 0.4) {
      chosenAbility = utility[Math.floor(rng() * utility.length)];
    }
  } else if (oppHpPct < 0.3) {
    // Opponent low: go aggressive
    const offensive = available.filter(a => a.type === 'OFFENSIVE');
    if (offensive.length > 0) {
      chosenAbility = offensive[Math.floor(rng() * offensive.length)];
    }
  }

  // Fallback: random from available
  if (!chosenAbility) {
    if (available.length > 0) {
      chosenAbility = available[Math.floor(rng() * available.length)];
    }
  }

  // If no abilities available, use basic attack
  if (!chosenAbility) {
    return { abilityId: 'basic_attack', overcharge: false };
  }

  // Decide overcharge: use if resonance is 2+ above cost and 30% chance
  const overchargeCost = chosenAbility.resonanceCost + 3;
  const useOvercharge = resonance >= overchargeCost && rng() < 0.3;

  return {
    abilityId: chosenAbility.id,
    overcharge: useOvercharge,
  };
}
