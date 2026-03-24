# AETHERVEIL ⚔️

**A multiplayer hero combat game — now playable in your browser!**

Aetherveil is a strategic hero combat game featuring three distinct archetypes, a resonance-based combat system, ability loadout customization, and shard attunements. Battle an AI opponent in a fully animated browser UI.

---

## 🎮 Playing in the Browser

### Quick Start

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Production Build

```bash
npm run build:web
```

Output goes to `dist/web/`.

---

## 🗺️ Game Screens

### 1. Title Screen
- Animated logo with glowing particle effects
- Dark fantasy atmosphere with floating particles and star field

### 2. Hero Selection
- Pick from **Shardwarden** 🛡️, **Aetherspark** ⚡, or **Rootcaller** 🌿
- Visual stat bars, flavor text, role tags
- Hover effects and selection glow

### 3. Loadout Customization
- Choose **3 abilities** from your hero's pool of 10
- Select an **Attunement** passive (Volatile, Stabilized, Fractured, Resonant, Prismatic)
- Real-time validation and slot display

### 4. Combat
- Animated HP bars, resonance crystal display, status effects
- Action buttons with cooldown overlays, resonance costs, type-colored borders
- **Overcharge toggle** — spend +3 resonance for 1.5× effect
- AI opponent with adaptive strategy (defensive when low HP, aggressive when you're low)
- Color-coded combat log (damage=red, heal=green, shield=blue, utility=gold, dodge=purple)

### 5. Victory / Defeat Screen
- Animated result with XP gained, round count
- Celebration particle effects on victory

---

## 🏟️ Gameplay

### Heroes

| Archetype | HP | ATK | DEF | SPD | Role |
|-----------|-----|-----|-----|-----|------|
| **Shardwarden** 🛡️ | 120 | 8 | 14 | 6 | Tank / Defensive |
| **Aetherspark** ⚡ | 80 | 16 | 6 | 14 | Glass Cannon / Speed |
| **Rootcaller** 🌿 | 100 | 10 | 10 | 10 | Sustain / Balanced |

### Combat System
- Simultaneous action selection each round
- **Priority Resolution**: DEFENSIVE → UTILITY → OFFENSIVE
- **Resonance**: Gain +1 per round; spend to use abilities
- **Overcharge**: Pay 3 extra Resonance for 1.5× effect
- **Basic Attack**: Free action; ATK damage minus half opponent DEF
- Round limit: 25 rounds (higher HP% wins at timeout)

### Attunements
| Shard | Effect |
|-------|--------|
| **Volatile** 💥 | Overcharges cost −1 Resonance, but −15% overcharge bonus DMG |
| **Stabilized** 🔷 | +1 Resonance/turn, but +1 all cooldowns |
| **Fractured** 🔥 | +20% damage dealt, but −15% max HP |
| **Resonant** 💚 | +30% healing, but +10% damage taken |
| **Prismatic** ✨ | Start with 3 Resonance + 10% crit chance |

---

## 🛠️ Development

### Tech Stack
- **Engine**: TypeScript (CommonJS, tested with Jest)
- **Browser UI**: Vanilla TypeScript + CSS, bundled with **Vite**
- **Fonts**: Cinzel (headers) + Merriweather (body) via Google Fonts
- **No frameworks** — pure DOM manipulation for maximum performance

### Project Structure

```
src/                      — Game engine (TypeScript, CommonJS)
├── heroes/               — Hero definitions, loadouts, attunements
├── combat/               — Combat engine and resolution
├── progression/          — Mining, training, leveling, crafting
├── matchmaking/          — Elo, queue, leaderboard
├── pve/                  — Dungeon system
└── social/               — Friends, alliances, friend battles

web/                      — Browser UI (Vite + ESM TypeScript)
├── index.html
├── vite.config.ts
└── src/
    ├── main.ts           — Entry point, screen transitions
    ├── screens/          — Title, Hero Select, Loadout, Combat, Result
    ├── ai/               — AI opponent logic
    ├── styles/           — CSS per screen + global theme
    └── utils/            — DOM helpers, animation utilities
```

### Running Tests

```bash
npm test              # Run all 223 tests
npm run test:watch    # Watch mode
npm run build         # Compile TypeScript engine
```

---

## P0 Features

### Three Hero Archetypes

| Archetype | HP | ATK | DEF | SPD |
|-----------|-----|-----|-----|-----|
| Shardwarden | 120 | 8 | 14 | 6 |
| Aetherspark | 80 | 16 | 6 | 14 |
| Rootcaller | 100 | 10 | 10 | 10 |

### Combat System

- Simultaneous action selection each round
- **Priority Resolution**: DEFENSIVE → UTILITY → OFFENSIVE
- **Resonance**: Start at 0, gain +1 per round; spend to use abilities
- **Overcharge**: Pay 3 extra Resonance to supercharge any ability (1.5x effect)
- **Basic Attack**: Free action dealing ATK damage
- Round limit: 25 rounds (higher HP% wins at timeout)

### Resources

- **Aether Shards**: Currency earned through gameplay, spent on upgrades
- **Resonance**: Combat-only resource; earned per round, spent on abilities

### Progression

- **Mining Expeditions**: Timed resource collection (Quick/Standard/Deep)
- **Training Sessions**: Improve ATK/DEF/SPD stats over time
- **Leveling**: Gain XP and level up heroes
- **Matchmaking**: ELO-based rating system and leaderboard

---

## P1 Features

### Feature 1: Ability Loadout Customization

Each archetype now has a **full pool of 10 abilities**. Players select exactly **3 abilities** to bring into combat, enabling build diversity.

#### Expanded Ability Pools

**Shardwarden** (10 abilities):
- `fracture_wall` — Shield: absorbs 2 attacks, shatters for 50% reflected damage
- `tectonic_grip` — UTILITY: lock opponent's highest-cooldown ability
- `shard_slam` — OFFENSIVE: ATK x 1.2 damage
- `crystal_barrage` — OFFENSIVE: ATK x 1.0 damage, **ignores shields**
- `seismic_pulse` — UTILITY: reduce opponent ATK by 25% for 2 turns
- `petrify` — UTILITY: increase all opponent cooldowns by 1
- `stoneheart` — DEFENSIVE: heal 15% HP + gain +3 DEF for 2 turns
- `quake_stomp` — OFFENSIVE: ATK x 1.5 damage, but self +1 cooldown penalty
- `granite_skin` — DEFENSIVE: 50% damage reduction for 2 turns
- `shard_nova` — OFFENSIVE: ATK x 2.0 damage (high-cost finisher)

**Aetherspark** (10 abilities):
- `chain_surge` — OFFENSIVE: ATK x 1.3; +50% bonus if used soon after cooldown reset
- `phase_slip` — UTILITY: dodge next attack + reduce all cooldowns by 1
- `spark_bolt` — OFFENSIVE: ATK x 0.8 damage
- `overload` — OFFENSIVE: ATK x 1.0 damage
- `mirror_image` — DEFENSIVE: 50% chance next attack misses
- `static_field` — UTILITY: ATK x 0.5 damage + slow opponent cooldown recovery
- `blink_strike` — OFFENSIVE: ATK x 1.1 damage + reduce Phase Slip cooldown by 1
- `arcane_siphon` — UTILITY: steal 2 Resonance from opponent
- `thunderclap` — OFFENSIVE: ATK x 1.4; double damage if opponent used DEFENSIVE
- `evasive_maneuver` — DEFENSIVE: dodge next attack + gain +2 SPD for 3 turns

**Rootcaller** (10 abilities):
- `verdant_mend` — DEFENSIVE: heal 20% HP; triggers regen if HP < 30%
- `entangling_bloom` — UTILITY: 40% damage reduction debuff + slow cooldowns
- `vine_lash` — OFFENSIVE: ATK x 1.1 damage
- `thornwall` — DEFENSIVE: reflect 30% of next incoming damage back to attacker
- `spore_cloud` — UTILITY: poison opponent (3% max HP/turn for 3 turns)
- `bark_armor` — DEFENSIVE: 30% damage reduction for 2 turns
- `root_slam` — OFFENSIVE: ATK x 1.3; +25% bonus if opponent is debuffed
- `natures_wrath` — OFFENSIVE: ATK x 1.8 damage, but removes all own buffs
- `rejuvenate` — DEFENSIVE: cleanse all debuffs + heal 10% HP
- `symbiosis` — UTILITY: heal 10% HP + deal ATK x 0.5 damage

#### Loadout API (`src/heroes/loadout.ts`)

```typescript
import { validateLoadout, getAvailableAbilities, createDefaultLoadout } from './src/heroes/loadout';

// Validate a player's selected loadout
const result = validateLoadout('SHARDWARDEN', ['crystal_barrage', 'shard_nova', 'fracture_wall']);
// { valid: true, errors: [] }

// Get all abilities available for an archetype (10 abilities)
const pool = getAvailableAbilities('AETHERSPARK');

// Create the default P0-compatible loadout (first 3 abilities)
const loadout = createDefaultLoadout('ROOTCALLER');
// { archetypeId: 'ROOTCALLER', selectedAbilityIds: ['verdant_mend', 'entangling_bloom', 'vine_lash'] }
```

#### Hero Construction with Loadout

```typescript
import { Hero } from './src/heroes/hero';
import { HERO_DEFINITIONS } from './src/heroes/hero-definitions';

// Custom loadout (3 chosen abilities)
const loadout = {
  archetypeId: 'SHARDWARDEN' as const,
  selectedAbilityIds: ['crystal_barrage', 'shard_nova', 'granite_skin'] as [string, string, string],
};
const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout);

// Default loadout (backward-compatible with P0)
const defaultHero = new Hero(HERO_DEFINITIONS.SHARDWARDEN);
```

---

### Feature 2: Shard Attunement Passive System

Players equip one of **5 Shard Attunements** before combat that permanently modify their hero's mechanics for that match.

#### Five Attunements (`src/heroes/attunement.ts`)

| Attunement | Effect |
|-----------|--------|
| **Volatile Shard** | Overcharges cost 1 less Resonance, but deal 15% less bonus damage |
| **Stabilized Shard** | Gain +1 Resonance/turn bonus, but all abilities have +1 cooldown |
| **Fractured Shard** | All damage +20%, but max HP -15% |
| **Resonant Shard** | All healing +30%, but damage taken +10% |
| **Prismatic Shard** | Start with 3 Resonance; 10% chance to crit for 1.5x damage |

#### Attunement Usage

```typescript
import { ATTUNEMENT_DEFINITIONS } from './src/heroes/attunement';
import { Hero } from './src/heroes/hero';
import { HERO_DEFINITIONS } from './src/heroes/hero-definitions';
import { CombatEngine } from './src/combat/combat-engine';

const attunement = ATTUNEMENT_DEFINITIONS.PRISMATIC;
const hero = new Hero(HERO_DEFINITIONS.AETHERSPARK, 0, 0, 0, undefined, attunement);

// Inject a deterministic RNG for testing
const engine = new CombatEngine(hero1, hero2, () => 0.05); // always crits (< 0.10 threshold)
```

#### Attunement + Loadout Combined

```typescript
const loadout = {
  archetypeId: 'SHARDWARDEN' as const,
  selectedAbilityIds: ['shard_nova', 'granite_skin', 'seismic_pulse'] as [string, string, string],
};
const attunement = ATTUNEMENT_DEFINITIONS.FRACTURED;
const hero = new Hero(HERO_DEFINITIONS.SHARDWARDEN, 0, 0, 0, loadout, attunement);
```

---

## Project Structure

```
src/
├── index.ts
├── heroes/
│   ├── ability.ts           — AbilityType, EffectType, AbilityEffect, AbilityDefinition
│   ├── hero-definitions.ts  — ArchetypeId, HeroDefinition, HERO_DEFINITIONS (3 archetypes, 10 abilities each)
│   ├── hero.ts              — Hero class (loadout + attunement support)
│   ├── loadout.ts           — AbilityLoadout, validateLoadout, getAvailableAbilities, createDefaultLoadout
│   ├── attunement.ts        — AttunementDefinition, ATTUNEMENT_DEFINITIONS (5 attunements)
│   └── __tests__/
│       ├── heroes.test.ts
│       ├── loadout.test.ts
│       └── attunement.test.ts
├── combat/
│   ├── combat-engine.ts     — CombatEngine (injectable RNG, START_RESONANCE attunement)
│   ├── combat-state.ts      — ActionSelection, RoundRecord, CombatState
│   ├── resolution.ts        — resolveRound() with all effect types + attunement modifiers
│   └── __tests__/
│       ├── combat.test.ts
│       ├── loadout-combat.test.ts
│       └── attunement-combat.test.ts
├── progression/
│   ├── player-profile.ts    — PlayerProfile, PlayerHero (with loadout + attunementId)
│   ├── leveling.ts
│   ├── mining.ts
│   ├── training.ts
│   └── __tests__/
└── matchmaking/
    ├── elo.ts
    ├── queue.ts
    ├── leaderboard.ts
    └── __tests__/
```

---

## Running Tests

```bash
npm test            # run all 143 tests across 8 test suites
npm run build       # compile TypeScript
npm run test:watch  # watch mode
```
