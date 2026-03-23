import { Hero } from '../heroes/hero';
import { ActionSelection, CombatState, RoundRecord } from './combat-state';
import { AbilityDefinition } from '../heroes/ability';

const OVERCHARGE_EXTRA_COST = 3;

function getAbilityOrThrow(hero: Hero, abilityId: string): AbilityDefinition {
  const ability = hero.getAbility(abilityId);
  if (!ability) throw new Error(`Ability ${abilityId} not found on hero ${hero.definition.id}`);
  return ability;
}

function applyDamageToHero(
  target: Hero,
  rawDamage: number,
  events: string[],
  targetLabel: string,
  ignoreShield = false,
  rng: () => number = Math.random
): void {
  // Check dodge
  if (target.dodgePending) {
    target.dodgePending = false;
    events.push(`${targetLabel} dodged the attack!`);
    return;
  }

  // Check mirror image (50% chance to miss)
  const mirrorIdx = target.buffs.findIndex(b => b.type === 'MIRROR_IMAGE');
  if (mirrorIdx !== -1) {
    target.buffs.splice(mirrorIdx, 1);
    if (rng() < 0.5) {
      events.push(`${targetLabel}'s Mirror Image caused the attack to miss!`);
      return;
    }
  }

  let damage = rawDamage;

  // Apply DAMAGE_TAKEN_INCREASE from attunement
  const takenIncrease = target.attunement?.effects.find(e => e.type === 'DAMAGE_TAKEN_INCREASE_PERCENT');
  if (takenIncrease) {
    damage *= (1 + takenIncrease.value);
  }

  // Apply single-use DAMAGE_REDUCE debuff (opponent-applied, e.g. Entangling Bloom)
  const dmgReduceDebuffIdx = target.debuffs.findIndex(d => d.type === 'DAMAGE_REDUCE');
  if (dmgReduceDebuffIdx !== -1) {
    const reduction = target.debuffs[dmgReduceDebuffIdx].value;
    damage = damage * (1 - reduction);
    target.debuffs.splice(dmgReduceDebuffIdx, 1);
    events.push(`${targetLabel}'s damage reduced by ${Math.round(reduction * 100)}%`);
  }

  // Apply self-applied DAMAGE_REDUCE buff (duration-based, e.g. Bark Armor)
  const dmgReduceBuffIdx = target.buffs.findIndex(b => b.type === 'DAMAGE_REDUCE');
  if (dmgReduceBuffIdx !== -1) {
    const reduction = target.buffs[dmgReduceBuffIdx].value;
    damage = damage * (1 - reduction);
    events.push(`${targetLabel}'s damage reduced by ${Math.round(reduction * 100)}% (Bark Armor)`);
  }

  // Check DAMAGE_REFLECT buff — store reflect amount on target to be applied back to attacker
  const reflectIdx = target.buffs.findIndex(b => b.type === 'DAMAGE_REFLECT');
  if (reflectIdx !== -1) {
    const reflectValue = target.buffs[reflectIdx].value;
    target.buffs.splice(reflectIdx, 1);
    (target as any)._reflectDamage = Math.round(rawDamage * reflectValue);
  }

  // Check shield (skipped for DAMAGE_IGNORE_SHIELD)
  if (!ignoreShield && target.shieldCharges > 0) {
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
  p2Action: ActionSelection,
  rng: () => number = Math.random
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
    if (action.overcharge) {
      let extraCost = OVERCHARGE_EXTRA_COST;
      const costReduction = hero.attunement?.effects.find(e => e.type === 'OVERCHARGE_COST_REDUCTION');
      if (costReduction) extraCost = Math.max(0, extraCost - costReduction.value);
      cost += extraCost;
    }
    if (resonance < cost) {
      throw new Error(`${playerLabel}: insufficient resonance (need ${cost}, have ${resonance})`);
    }
    return resonance - cost;
  }

  state.player1Resonance = validateAndCharge(p1Hero, p1Action, 'Player1', state.player1Resonance);
  state.player2Resonance = validateAndCharge(p2Hero, p2Action, 'Player2', state.player2Resonance);

  // Gather actions by type for priority ordering
  type ActionEntry = {
    hero: Hero;
    opponent: Hero;
    action: ActionSelection;
    opponentAction: ActionSelection;
    playerLabel: string;
    abilityType: string;
  };

  function getActionType(hero: Hero, action: ActionSelection): string {
    if (action.abilityId === 'basic_attack') return 'OFFENSIVE';
    const ability = hero.getAbility(action.abilityId);
    return ability ? ability.type : 'OFFENSIVE';
  }

  const p1Type = getActionType(p1Hero, p1Action);
  const p2Type = getActionType(p2Hero, p2Action);

  const allActions: ActionEntry[] = [
    { hero: p1Hero, opponent: p2Hero, action: p1Action, opponentAction: p2Action, playerLabel: 'Player1', abilityType: p1Type },
    { hero: p2Hero, opponent: p1Hero, action: p2Action, opponentAction: p1Action, playerLabel: 'Player2', abilityType: p2Type },
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
    executeAction(entry.hero, entry.opponent, entry.action, entry.opponentAction, entry.playerLabel, round, events, rng);

    // Handle shatter damage (if opponent's shield shattered, deal back to attacker)
    if ((entry.opponent as any)._shatterDamage) {
      const shatter = (entry.opponent as any)._shatterDamage;
      delete (entry.opponent as any)._shatterDamage;
      entry.hero.currentHp = Math.max(0, entry.hero.currentHp - shatter);
      events.push(`${entry.playerLabel} takes ${shatter} shatter damage (HP: ${entry.hero.currentHp}/${entry.hero.maxHp})`);
    }

    // Handle reflect damage (deal back to attacker)
    if ((entry.opponent as any)._reflectDamage) {
      const reflect = (entry.opponent as any)._reflectDamage;
      delete (entry.opponent as any)._reflectDamage;
      entry.hero.currentHp = Math.max(0, entry.hero.currentHp - reflect);
      events.push(`${entry.playerLabel} takes ${reflect} reflected damage (HP: ${entry.hero.currentHp}/${entry.hero.maxHp})`);
    }

    // Handle resonance steal
    if ((entry.hero as any)._resonanceSteal) {
      const steal = (entry.hero as any)._resonanceSteal as number;
      delete (entry.hero as any)._resonanceSteal;
      const isP1 = entry.hero === state.player1Hero;
      if (isP1) {
        const actualSteal = Math.min(steal, state.player2Resonance);
        state.player2Resonance -= actualSteal;
        state.player1Resonance += actualSteal;
        events.push(`Player1 steals ${actualSteal} Resonance from Player2`);
      } else {
        const actualSteal = Math.min(steal, state.player1Resonance);
        state.player1Resonance -= actualSteal;
        state.player2Resonance += actualSteal;
        events.push(`Player2 steals ${actualSteal} Resonance from Player1`);
      }
    }
  }

  // Tick poison damage (before debuff expiry tick)
  function tickPoison(hero: Hero, label: string) {
    for (const d of hero.debuffs) {
      if (d.type === 'POISON') {
        const damage = Math.round(hero.maxHp * d.value);
        hero.currentHp = Math.max(0, hero.currentHp - damage);
        events.push(`${label} takes ${damage} poison damage (HP: ${hero.currentHp}/${hero.maxHp})`);
      }
    }
  }
  tickPoison(p1Hero, 'Player1');
  tickPoison(p2Hero, 'Player2');

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

  // Tick down buff durations
  function tickBuffs(hero: Hero) {
    hero.buffs = hero.buffs
      .map(b => ({ ...b, turnsRemaining: b.turnsRemaining - 1 }))
      .filter(b => b.turnsRemaining > 0);
  }
  tickBuffs(p1Hero);
  tickBuffs(p2Hero);

  // Set cooldowns for used abilities FIRST
  function setCooldownAfterUse(hero: Hero, action: ActionSelection) {
    if (action.abilityId === 'basic_attack') return;
    const ability = hero.getAbility(action.abilityId);
    if (!ability) return;

    let cd = ability.cooldown;

    // Self cooldown penalty from ability effects (e.g. Quake Stomp)
    for (const eff of ability.effects) {
      if (eff.type === 'SELF_COOLDOWN_PENALTY') {
        cd += eff.value ?? 1;
      }
    }

    // Attunement cooldown penalty (e.g. Stabilized Shard)
    const attunementPenalty = hero.attunement?.effects.find(e => e.type === 'COOLDOWN_PENALTY');
    if (attunementPenalty) cd += attunementPenalty.value;

    hero.cooldowns.set(ability.id, cd);
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

  // Resonance gain: +1 base per round + attunement bonus
  const p1ResonanceBonus = p1Hero.attunement?.effects.find(e => e.type === 'RESONANCE_PER_TURN_BONUS')?.value ?? 0;
  const p2ResonanceBonus = p2Hero.attunement?.effects.find(e => e.type === 'RESONANCE_PER_TURN_BONUS')?.value ?? 0;
  state.player1Resonance += 1 + p1ResonanceBonus;
  state.player2Resonance += 1 + p2ResonanceBonus;

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
  opponentAction: ActionSelection,
  playerLabel: string,
  round: number,
  events: string[],
  rng: () => number
): void {
  if (action.abilityId === 'basic_attack') {
    const damage = hero.effectiveAttack;
    events.push(`${playerLabel} uses basic attack for ${damage} damage`);
    applyDamageToHero(opponent, damage, events, `${playerLabel === 'Player1' ? 'Player2' : 'Player1'}`, false, rng);
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
        // Attunement heal bonus (e.g. Resonant Shard)
        const healBonus = hero.attunement?.effects.find(e => e.type === 'HEAL_BONUS_PERCENT');
        const healMultiplier = 1 + (healBonus?.value ?? 0);
        const healAmount = Math.round(hero.maxHp * healPercent * healMultiplier);
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

      case 'MIRROR_IMAGE': {
        // duration + 1 so buff survives end-of-round tick
        const duration = (effect.duration ?? 1) + 1;
        hero.buffs.push({ type: 'MIRROR_IMAGE', value: effect.value ?? 0.5, turnsRemaining: duration });
        events.push(`${playerLabel} creates a Mirror Image`);
        break;
      }

      case 'COOLDOWN_REDUCE': {
        const reduction = effect.value ?? 1;
        if (effect.targetAbilityId) {
          // Reduce a specific ability's cooldown (e.g. Blink Strike -> Phase Slip)
          const cd = hero.cooldowns.get(effect.targetAbilityId) ?? 0;
          if (cd > 0) hero.cooldowns.set(effect.targetAbilityId, Math.max(0, cd - reduction));
        } else {
          for (const [abilityId, cd] of hero.cooldowns.entries()) {
            if (cd > 0) hero.cooldowns.set(abilityId, Math.max(0, cd - reduction));
          }
        }
        events.push(`${playerLabel}'s cooldowns reduced by ${reduction}`);
        break;
      }

      case 'COOLDOWN_LOCK': {
        // Locks opponent's highest-cooldown ability for extra turns
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
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0) + 1;
        if (effect.target === 'SELF') {
          // Self-applied damage reduction buff (e.g. Bark Armor, Granite Skin)
          hero.buffs.push({ type: 'DAMAGE_REDUCE', value: effect.value ?? 0.3, turnsRemaining: duration });
          events.push(`${playerLabel} gains ${Math.round((effect.value ?? 0.3) * 100)}% damage reduction for ${duration} turns`);
        } else {
          // Opponent-applied single-use debuff (e.g. Entangling Bloom)
          opponent.debuffs.push({ type: 'DAMAGE_REDUCE', value: effect.value ?? 0.4, turnsRemaining: duration });
          events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'} has damage reduced by ${Math.round((effect.value ?? 0.4) * 100)}% for ${duration} turns`);
        }
        break;
      }

      case 'STAT_DEBUFF': {
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0);
        opponent.debuffs.push({ type: 'STAT_DEBUFF', value: effect.value ?? 1, turnsRemaining: duration });
        events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'} has stat debuff for ${duration} turns`);
        break;
      }

      case 'ATK_DEBUFF': {
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0) + 1;
        opponent.debuffs.push({ type: 'ATK_DEBUFF', value: effect.value ?? 0.25, turnsRemaining: duration });
        events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'}'s ATK reduced by ${Math.round((effect.value ?? 0.25) * 100)}% for ${duration} turns`);
        break;
      }

      case 'DEF_BUFF': {
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0) + 1;
        hero.buffs.push({ type: 'DEF_BUFF', value: effect.value ?? 3, turnsRemaining: duration });
        events.push(`${playerLabel} gains +${effect.value} DEF for ${duration} turns`);
        break;
      }

      case 'SPD_BUFF': {
        const duration = (effect.duration ?? 1) + (action.overcharge ? 1 : 0) + 1;
        hero.buffs.push({ type: 'SPD_BUFF', value: effect.value ?? 2, turnsRemaining: duration });
        events.push(`${playerLabel} gains +${effect.value} SPD for ${duration} turns`);
        break;
      }

      case 'DAMAGE_REFLECT': {
        // duration + 1 so buff survives end-of-round tick
        const duration = (effect.duration ?? 1) + 1;
        hero.buffs.push({ type: 'DAMAGE_REFLECT', value: effect.value ?? 0.3, turnsRemaining: duration });
        events.push(`${playerLabel} activates Thornwall (reflects ${Math.round((effect.value ?? 0.3) * 100)}% damage)`);
        break;
      }

      case 'POISON': {
        const duration = (effect.duration ?? 3) + (action.overcharge ? 1 : 0) + 1;
        opponent.debuffs.push({ type: 'POISON', value: effect.value ?? 0.03, turnsRemaining: duration });
        events.push(`${playerLabel === 'Player1' ? 'Player2' : 'Player1'} is poisoned for ${Math.round((effect.value ?? 0.03) * 100)}% HP/turn for ${duration} turns`);
        break;
      }

      case 'RESONANCE_STEAL': {
        // Handled in resolveRound via _resonanceSteal flag after action
        (hero as any)._resonanceSteal = effect.value ?? 2;
        break;
      }

      case 'CLEANSE': {
        const count = hero.debuffs.length;
        hero.debuffs = [];
        events.push(`${playerLabel} cleanses ${count} debuff(s)`);
        break;
      }

      case 'DAMAGE': {
        let multiplier = effect.value ?? 1.0;

        // Overcharge damage bonus (with optional attunement penalty)
        if (action.overcharge) {
          let overchargeMultiplier = 1.5;
          const dmgPenalty = hero.attunement?.effects.find(e => e.type === 'OVERCHARGE_DAMAGE_PENALTY');
          if (dmgPenalty) overchargeMultiplier = Math.max(1, overchargeMultiplier - dmgPenalty.value);
          multiplier *= overchargeMultiplier;
        }

        // Chain Surge bonus: +50% if used within 1 turn of cooldown reset
        if (ability.id === 'chain_surge') {
          const cdValue = ability.cooldown;
          if (hero.chainSurgeLastUsedTurn >= 0 && round - hero.chainSurgeLastUsedTurn === cdValue + 1) {
            multiplier *= 1.5;
            events.push(`${playerLabel}'s Chain Surge bonus activated!`);
          }
          hero.chainSurgeLastUsedTurn = round;
        }

        // Thunderclap bonus: double damage if opponent used DEFENSIVE this round
        if (ability.id === 'thunderclap') {
          const opponentAbility = opponent.getAbility(opponentAction.abilityId);
          if (opponentAbility?.type === 'DEFENSIVE') {
            multiplier *= 2;
            events.push(`${playerLabel}'s Thunderclap deals double damage against DEFENSIVE ability!`);
          }
        }

        // Root Slam bonus: +25% if opponent is debuffed
        if (ability.id === 'root_slam' && opponent.debuffs.length > 0) {
          multiplier *= 1.25;
          events.push(`${playerLabel}'s Root Slam deals bonus damage to debuffed opponent!`);
        }

        // Nature's Wrath: removes all own buffs before dealing damage
        if (ability.id === 'natures_wrath') {
          hero.buffs = [];
          events.push(`${playerLabel}'s Nature's Wrath consumed all buffs!`);
        }

        // Attunement damage bonus (e.g. Fractured Shard)
        const dmgBonus = hero.attunement?.effects.find(e => e.type === 'DAMAGE_BONUS_PERCENT');
        const dmgMultiplier = 1 + (dmgBonus?.value ?? 0);

        // Attunement crit chance (e.g. Prismatic Shard)
        let critMultiplier = 1;
        const critEffect = hero.attunement?.effects.find(e => e.type === 'CRIT_CHANCE');
        if (critEffect && rng() < critEffect.value) {
          critMultiplier = 1.5;
          events.push(`${playerLabel}'s ability crits!`);
        }

        const rawDamage = hero.effectiveAttack * multiplier * dmgMultiplier * critMultiplier;
        const opponentLabel = playerLabel === 'Player1' ? 'Player2' : 'Player1';
        applyDamageToHero(opponent, rawDamage, events, opponentLabel, false, rng);
        break;
      }

      case 'DAMAGE_IGNORE_SHIELD': {
        let multiplier = effect.value ?? 1.0;
        if (action.overcharge) {
          let overchargeMultiplier = 1.5;
          const dmgPenalty = hero.attunement?.effects.find(e => e.type === 'OVERCHARGE_DAMAGE_PENALTY');
          if (dmgPenalty) overchargeMultiplier = Math.max(1, overchargeMultiplier - dmgPenalty.value);
          multiplier *= overchargeMultiplier;
        }
        const dmgBonus = hero.attunement?.effects.find(e => e.type === 'DAMAGE_BONUS_PERCENT');
        const dmgMultiplier = 1 + (dmgBonus?.value ?? 0);
        let critMultiplier = 1;
        const critEffect = hero.attunement?.effects.find(e => e.type === 'CRIT_CHANCE');
        if (critEffect && rng() < critEffect.value) {
          critMultiplier = 1.5;
          events.push(`${playerLabel}'s ability crits!`);
        }
        const rawDamage = hero.effectiveAttack * multiplier * dmgMultiplier * critMultiplier;
        const opponentLabel = playerLabel === 'Player1' ? 'Player2' : 'Player1';
        applyDamageToHero(opponent, rawDamage, events, opponentLabel, true, rng);
        break;
      }

      case 'REGEN': {
        hero.regenActive = true;
        hero.regenTurnsLeft = (effect.duration ?? 3) + (action.overcharge ? 1 : 0);
        events.push(`${playerLabel} enters regen state`);
        break;
      }

      case 'SELF_COOLDOWN_PENALTY':
        // Handled in setCooldownAfterUse — no runtime action needed here
        break;
    }
  }
}
