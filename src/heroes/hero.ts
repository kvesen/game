import { HeroDefinition } from './hero-definitions';
import { AbilityDefinition } from './ability';

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

  constructor(definition: HeroDefinition, bonusAtk = 0, bonusDef = 0, bonusSpd = 0) {
    this.definition = definition;
    this.maxHp = definition.baseStats.hp;
    this.currentHp = definition.baseStats.hp;
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
    this.bonusAtk = bonusAtk;
    this.bonusDef = bonusDef;
    this.bonusSpd = bonusSpd;

    for (const ability of definition.abilities) {
      this.cooldowns.set(ability.id, 0);
    }
  }

  get effectiveAttack(): number {
    return this.definition.baseStats.attack + this.bonusAtk;
  }

  get effectiveDefense(): number {
    return this.definition.baseStats.defense + this.bonusDef;
  }

  get effectiveSpeed(): number {
    return this.definition.baseStats.speed + this.bonusSpd;
  }

  isAbilityReady(abilityId: string): boolean {
    const cd = this.cooldowns.get(abilityId) ?? 0;
    const locked = this.lockedAbilities.get(abilityId) ?? 0;
    return cd === 0 && locked === 0;
  }

  getAbility(abilityId: string): AbilityDefinition | undefined {
    return this.definition.abilities.find(a => a.id === abilityId);
  }

  isAlive(): boolean {
    return this.currentHp > 0;
  }

  hpPercent(): number {
    return this.currentHp / this.maxHp;
  }
}
