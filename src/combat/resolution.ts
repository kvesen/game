import { Hero } from '../heroes/hero';
import { ActionSelection, CombatState, RoundRecord } from './combat-state';
import { AbilityDefinition } from '../heroes/ability';

const OVERCHARGE_EXTRA_COST = 3;

function getAbilityOrThrow(hero: Hero, abilityId: string): AbilityDefinition {
  const ability = hero.getAbility(abilityId);
  if (!ability) throw new Error(`Ability ${abilityId} not found on hero ${hero.definition.id}`);
  return ability;
}

function applyDamageToHero(target: Hero, rawDamage: number, events: string[], targetLabel: string): void {
  // Check dodge
  if (target.dodgePending) {
    target.dodgePending = false;
    events.push(`${targetLabel} dodged the attack!`);
    return;
  }

  // Check damage_reduce debuff
  let damage = rawDamage;
  const dmgReduceIdx = target.debuffs.findIndex(d => d.type === 'DAMAGE_REDUCE');
  if (dmgReduceIdx !== -1) {
    const reduction = target.debuffs[dmgReduceIdx].value;
    damage = damage * (1 - reduction);
    target.debuffs.splice(dmgReduceIdx, 1);
    events.push(`${targetLabel}'s damage reduced by ${Math.round(reduction * 100)}%`);
  }

  // Check shield
  if (target.shieldCharges > 0) {
    target.shieldCharges--;
    target.damageAbsorbed += damage;
    events.push(`${targetLabel}'s shield absorbed ${Math.round(damage)} damage (${target.shieldCharges} charges left)`);
    // If both charges consumed, deal back 50% of absorbed
    if (target.shieldCharges === 0) {
      const shatterDamage = Math.round(target.damageAbsorbed * 0.5);
      events.push(`${targetLabel}'s Fracture Wall shatters! Deals ${shatterDamage} damage back!`);
      (target as any)._shatterDamage = shatterDamage;
      target.damageAbsorbed = 0;
    }
    return;
  }

  // Apply damage
  const actualDamage = Math.max(0, Math.round(damage));
  target.currentHp = Math.max(0, target.currentHp - actualDamage);
  events.push(`${targetLabel} takes ${actualDamage} damage (HP: ${target.currentHp}/${target.maxHp})`);
}

export function resolveRound(
  state: CombatState,
  p1Action: ActionSelection,
  p2Action: ActionSelection
): RoundRecord {
  const events: string[] = [];
  const round = state.roundNumber + 1;

  const p1Hero = state.player1Hero;
  const p2Hero = state.player2Hero;

  // Validate and charge resonance cost
  function validateAndCharge(hero: Hero, action: ActionSelection, playerLabel: string, resonance: number): number {
    if (action.abilityId === 'basic_attack') return resonance;
    const ability = getAbilityOrThrow(hero, action.abilityId);
    if (!hero.isAbilityReady(action.abilityId)) {
      throw new Error(`${playerLabel}: ability ${action.abilityId} is not ready`);
    }
    let cost = ability.resonanceCost;
    if (action.overcharge) cost += OVERCHARGE_EXTRA_COST;
    if (resonance < cost) {
      throw new Error(`${playerLabel}: insufficient resonance (need ${cost}, have ${resonance})`);
    }
    return resonance - cost;
  }

  state.player1Resonance = validateAndCharge(p1Hero, p1Action, 'Player1', state.player1Resonance);
  state.player2Resonance = validateAndCharge(p2Hero, p2Action, 'Player2', state.player2Resonance);

  // Gather actions by type for priority ordering
  type ActionEntry = { hero: Hero; opponent: Hero; action: ActionSelection; playerLabel: string; abilityType: string };

  function getActionType(hero: Hero, action: ActionSelection): string {
    if (action.abilityId === 'basic_attack') return 'OFFENSIVE';
    const ability = hero.getAbility(action.abilityId);
    return ability ? ability.type : 'OFFENSIVE';
  }

  const p1Type = getActionType(p1Hero, p1Action);
  const p2Type = getActionType(p2Hero, p2Action);

  const allActions: ActionEntry[] = [
    { hero: p1Hero, opponent: p2Hero, action: p1Action, playerLabel: 'Player1', abilityType: p1Type },
    { hero: p2Hero, opponent: p1Hero, action: p2Action, playerLabel: 'Player2', abilityType: p2Type },
  ];

  // Sort by priority: DEFENSIVE first, UTILITY second, OFFENSIVE last
  const priority: Record<string, number> = { DEFENSIVE: 0, UTILITY: 1, OFFENSIVE: 2 };
  allActions.sort((a, b) => priority[a.abilityType] - priority[b.abilityType]);

  // Capture alive status before any actions execute (for simultaneous resolution)
  const aliveAtRoundStart = new Map<Hero, boolean>([
    [p1Hero, p1Hero.isAlive()],
    [p2Hero, p2Hero.isAlive()],
  ]);

  // Execute each action
  for (const entry of allActions) {
    if (!aliveAtRoundStart.get(entry.hero)) continue;
    executeAction(entry.hero, entry.opponent, entry.action, entry.playerLabel, round, events);

    // Handle shatter damage (if opponent's shield shattered, deal back to attacker)
    if ((entry.opponent as any)._shatterDamage) {
      const shatter = (entry.opponent as any)._shatterDamage;
      delete (entry.opponent as any)._shatterDamage;
      entry.hero.currentHp = Math.max(0, entry.hero.currentHp - shatter);
      events.push(`${entry.playerLabel} takes ${shatter} shatter damage (HP: ${entry.hero.currentHp}/${entry.hero.maxHp})`);
    }
  }

  // Tick regen
  function tickRegen(hero: Hero, label: string) {
    if (hero.regenActive && hero.regenTurnsLeft > 0) {
      const regenAmount = Math.round(hero.maxHp * 0.05);
      hero.currentHp = Math.min(hero.maxHp, hero.currentHp + regenAmount);
      hero.regenTurnsLeft--;
      if (hero.regenTurnsLeft === 0) hero.regenActive = false;
      events.push(`${label} regenerates ${regenAmount} HP (HP: ${hero.currentHp}/${hero.maxHp})`);
    }
  }
  tickRegen(p1Hero, 'Player1');
  tickRegen(p2Hero, 'Player2');

  // Tick down debuff durations
  function tickDebuffs(hero: Hero) {
    hero.debuffs = hero.debuffs
      .map(d => ({ ...d, turnsRemaining: d.turnsRemaining - 1 }))
      .filter(d => d.turnsRemaining > 0);
  }
  tickDebuffs(p1Hero);
  tickDebuffs(p2Hero);

  // Set cooldowns for used abilities FIRST
  function setCooldownAfterUse(hero: Hero, action: ActionSelection) {
    if (action.abilityId === 'basic_attack') return;
    const ability = hero.getAbility(action.abilityId);
    if (ability) hero.cooldowns.set(ability.id, ability.cooldown);
  }
  setCooldownAfterUse(p1Hero, p1Action);
  setCooldownAfterUse(p2Hero, p2Action);

  // Tick down cooldowns AFTER setting them
  function tickCooldowns(hero: Hero) {
    for (const [abilityId, cd] of hero.cooldowns.entries()) {
      if (cd > 0) hero.cooldowns.set(abilityId, cd - 1);
    }
    for (const [abilityId, locked] of hero.lockedAbilities.entries()) {
      if (locked > 0) hero.lockedAbilities.set(abilityId, locked - 1);
    }
  }
  tickCooldowns(p1Hero);
  tickCooldowns(p2Hero);

  // Resonance gain: +1 base per round for each player
  state.player1Resonance += 1;
  state.player2Resonance += 1;

  // Update round number
  state.roundNumber = round;

  const record: RoundRecord = {
    round,
    player1Action: p1Action,
    player2Action: p2Action,
    events,
  };
  state.actionHistory.push(record);

  return record;
}

function executeAction(
  hero: Hero,
  opponent: Hero,
  action: ActionSelection,
  playerLabel: string,
  round: number,
  events: string[]
): void {
  if (action.abilityId === 'basic_attack') {
    const damage = hero.effectiveAttack;
    events.push(`${playerLabel} uses basic attack for ${damage} damage`);
    applyDamageToHero(opponent, damage, events, `${playerLabel === 'Player1' ? 'Player2' : 'Player1'}`);
    return;
  }

  const ability = hero.getAbility(action.abilityId);
  if (!ability) return;

  events.push(`${playerLabel} uses ${ability.name}`);

  for (const effect of ability.effects) {
    switch (effect.type) {
      case 'SHIELD': {
        let charges = effect.value ?? 2;
        if (action.overcharge) charges = Math.ceil(charges * 1.5);
        hero.shieldCharges += charges;
        hero.damageAbsorbed = 0;
        events.push(`${playerLabel} gains ${charges} shield charges`);
        break;
      }

      case 'HEAL': {
        const hpBeforeHeal = hero.currentHp;
        let healPercent = effect.value ?? 0.2;
        if (action.overcharge) healPercent *= 1.5;
        const healAmount = Math.round(hero.maxHp * healPercent);
        hero.currentHp = Math.min(hero.maxHp, hero.currentHp + healAmount);
        events.push(`${playerLabel} heals ${healAmount} HP (HP: ${hero.currentHp}/${hero.maxHp})`);

        // Verdant Mend low HP trigger - regen if HP < 30% BEFORE heal
        if (ability.id === 'verdant_mend' && hpBeforeHeal / hero.maxHp < 0.3) {
          hero.regenActive = true;
          hero.regenTurnsLeft = action.overcharge ? 4 : 3;
          events.push(`${playerLabel} enters regen state for ${hero.regenTurnsLeft} turns`);
        }
        break;
      }

      case 'DODGE': {
        hero.dodgePending = true;
        events.push(`${playerLabel} enters dodge state`);
        break;
      }

      case 'COOLDOWN_REDUCE': {
        const reduction = effect.value ?? 1;
        for (const [abilityId, cd] of hero.cooldowns.entries()) {
          if (cd > 0) hero.cooldowns.set(abilityId, Math.max(0, cd - reduction));
        }
        events.push(`${playerLabel}'s cooldowns reduced by ${reduction}`);
        break;
      }

      case 'COOLDOWN_LOCK': {
        // Tectonic Grip: lock opponent's highest-cooldown ability
        let highestCd = -1;
        let targetAbilityId = '';
        for (const [abilityId, cd] of opponent.cooldowns.entries()) {
          if (cd > highestCd) {
            highestCd = cd;
            targetAbilityId = abilityId;
          }
        }
        if (targetAbilityId) {
          const extraTurns = (effect.value ?? 2) + (action.overcharge ? 1 : 0);
          opponent.lockedAbilities.set(targetAbilityId, (opponent.lockedAbilities.get(targetAbilityId) ?? 0) + extraTurns);
          events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'}'s ${targetAbilityId} is locked for ${extraTurns} extra turns`);
        }
        break;
      }

      case 'DAMAGE_REDUCE': {
        // duration + 1 so the debuff survives the end-of-round tick and is active in the next round
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0) + 1;
        opponent.debuffs.push({ type: 'DAMAGE_REDUCE', value: effect.value ?? 0.4, turnsRemaining: duration });
        events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'} has damage reduced by ${Math.round((effect.value ?? 0.4) * 100)}% for ${duration} turns`);
        break;
      }

      case 'STAT_DEBUFF': {
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0);
        opponent.debuffs.push({ type: 'STAT_DEBUFF', value: effect.value ?? 1, turnsRemaining: duration });
        events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'} has stat debuff for ${duration} turns`);
        break;
      }

      case 'DAMAGE': {
        let multiplier = effect.value ?? 1.0;
        if (action.overcharge) multiplier *= 1.5;

        // Chain Surge bonus: +50% if used within 1 turn of cooldown reset
        if (ability.id === 'chain_surge') {
          const cdValue = ability.cooldown;
          if (hero.chainSurgeLastUsedTurn >= 0 && round - hero.chainSurgeLastUsedTurn === cdValue + 1) {
            multiplier *= 1.5;
            events.push(`${playerLabel}'s Chain Surge bonus activated!`);
          }
          hero.chainSurgeLastUsedTurn = round;
        }

        const rawDamage = hero.effectiveAttack * multiplier;
        const opponentLabel = playerLabel === 'Player1' ? 'Player2' : 'Player1';
        applyDamageToHero(opponent, rawDamage, events, opponentLabel);
        break;
      }

      case 'REGEN': {
        hero.regenActive = true;
        hero.regenTurnsLeft = (effect.duration ?? 3) + (action.overcharge ? 1 : 0);
        events.push(`${playerLabel} enters regen state`);
        break;
      }
    }
  }
}
