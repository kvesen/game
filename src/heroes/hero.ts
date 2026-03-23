import { HeroDefinition } from './hero-definitions';
import { AbilityDefinition } from './ability';
import { AbilityLoadout } from './loadout';
import { AttunementDefinition } from './attunement';

export interface ActiveBuff {
  type: string;
  value: number;
  turnsRemaining: number;
}

export interface ActiveDebuff {
  type: string;
  value: number;
  turnsRemaining: number;
}

export class Hero {
  readonly definition: HeroDefinition;
  /** The 3 abilities available in combat (determined by loadout or default to first 3). */
  activeAbilities: AbilityDefinition[];
  /** Optional attunement passive applied to this hero. */
  attunement?: AttunementDefinition;
  currentHp: number;
  maxHp: number;
  cooldowns: Map<string, number>;
  buffs: ActiveBuff[];
  debuffs: ActiveDebuff[];
  shieldCharges: number;
  dodgePending: boolean;
  regenActive: boolean;
  regenTurnsLeft: number;
  chainSurgeLastUsedTurn: number;
  lockedAbilities: Map<string, number>;
  damageAbsorbed: number;
  bonusAtk: number;
  bonusDef: number;
  bonusSpd: number;

  constructor(
    definition: HeroDefinition,
    bonusAtk = 0,
    bonusDef = 0,
    bonusSpd = 0,
    loadout?: AbilityLoadout,
    attunement?: AttunementDefinition
  ) {
    this.definition = definition;
    this.bonusAtk = bonusAtk;
    this.bonusDef = bonusDef;
    this.bonusSpd = bonusSpd;
    this.cooldowns = new Map();
    this.buffs = [];
    this.debuffs = [];
    this.shieldCharges = 0;
    this.dodgePending = false;
    this.regenActive = false;
    this.regenTurnsLeft = 0;
    this.chainSurgeLastUsedTurn = -99;
    this.lockedAbilities = new Map();
    this.damageAbsorbed = 0;

    // Determine active abilities from loadout (or default to first 3)
    if (loadout) {
      this.activeAbilities = loadout.selectedAbilityIds.map(id => {
        const ability = definition.abilityPool.find(a => a.id === id);
        if (!ability) throw new Error(`Ability '${id}' not found in ${definition.id}'s ability pool`);
        return ability;
      });
    } else {
      this.activeAbilities = definition.abilities.slice(0, 3);
    }

    // Initialize cooldowns only for active abilities
    for (const ability of this.activeAbilities) {
      this.cooldowns.set(ability.id, 0);
    }

    // Apply attunement passive
    this.attunement = attunement;
    this.maxHp = definition.baseStats.hp;
    if (attunement) {
      const hpPenalty = attunement.effects.find(e => e.type === 'MAX_HP_PENALTY_PERCENT');
      if (hpPenalty) {
        this.maxHp = Math.round(definition.baseStats.hp * (1 - hpPenalty.value));
      }
    }
    this.currentHp = this.maxHp;
  }

  get effectiveAttack(): number {
    let atk = this.definition.baseStats.attack + this.bonusAtk;
    for (const d of this.debuffs) {
      if (d.type === 'ATK_DEBUFF') atk = Math.round(atk * (1 - d.value));
    }
    return atk;
  }

  get effectiveDefense(): number {
    let def = this.definition.baseStats.defense + this.bonusDef;
    for (const b of this.buffs) {
      if (b.type === 'DEF_BUFF') def += b.value;
    }
    return def;
  }

  get effectiveSpeed(): number {
    let spd = this.definition.baseStats.speed + this.bonusSpd;
    for (const b of this.buffs) {
      if (b.type === 'SPD_BUFF') spd += b.value;
    }
    return spd;
  }

  isAbilityReady(abilityId: string): boolean {
    if (!this.activeAbilities.some(a => a.id === abilityId)) return false;
    const cd = this.cooldowns.get(abilityId) ?? 0;
    const locked = this.lockedAbilities.get(abilityId) ?? 0;
    return cd === 0 && locked === 0;
  }

  getAbility(abilityId: string): AbilityDefinition | undefined {
    return this.activeAbilities.find(a => a.id === abilityId);
  }

  isAlive(): boolean {
    return this.currentHp > 0;
  }

  hpPercent(): number {
    return this.currentHp / this.maxHp;
  }
}
