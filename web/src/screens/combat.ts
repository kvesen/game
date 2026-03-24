import '../styles/combat.css';
import { Hero } from '@engine/heroes/hero';
import type { HeroDefinition, ArchetypeId } from '@engine/heroes/hero-definitions';
import { HERO_DEFINITIONS } from '@engine/heroes/hero-definitions';
import { CombatEngine } from '@engine/combat/combat-engine';
import type { ActionSelection, RoundRecord } from '@engine/combat/combat-state';
import { ATTUNEMENT_DEFINITIONS } from '@engine/heroes/attunement';
import type { AttunementId } from '@engine/heroes/attunement';
import { createDefaultLoadout } from '@engine/heroes/loadout';
import type { AbilityLoadout } from '@engine/heroes/loadout';
import { selectAiAction } from '../ai/simple-ai';
import { div, btn, clearElement } from '../utils/dom';
import { triggerAnimation, animateHpBar, delay } from '../utils/animations';
import type { LoadoutSelection } from './loadout';

const HERO_ICONS: Record<ArchetypeId, string> = {
  SHARDWARDEN: '🛡️',
  AETHERSPARK: '⚡',
  ROOTCALLER: '🌿',
};

const AI_ARCHETYPE_ORDER: ArchetypeId[] = ['AETHERSPARK', 'SHARDWARDEN', 'ROOTCALLER'];

type GameEvent = { type: string; text: string };

interface CombatState {
  engine: CombatEngine;
  playerHero: Hero;
  aiHero: Hero;
  playerAiArchetype: ArchetypeId;
  pendingAction: ActionSelection | null;
  overchargeActive: boolean;
  log: GameEvent[];
  processing: boolean;
}

export function createCombatScreen(
  playerSelection: LoadoutSelection,
  onGameEnd: (winner: 'player1' | 'player2' | 'draw', rounds: number) => void
): HTMLElement {
  // --- Setup heroes ---
  const playerDef = HERO_DEFINITIONS[playerSelection.archetypeId];
  const playerAttunement = ATTUNEMENT_DEFINITIONS[playerSelection.attunementId];
  const playerLoadout: AbilityLoadout = {
    archetypeId: playerSelection.archetypeId,
    selectedAbilityIds: playerSelection.selectedAbilityIds,
  };

  // AI picks a different archetype
  const aiArchetypeId = AI_ARCHETYPE_ORDER.find(id => id !== playerSelection.archetypeId) || 'AETHERSPARK';
  const aiDef = HERO_DEFINITIONS[aiArchetypeId];
  const aiLoadout = createDefaultLoadout(aiArchetypeId);
  const aiAttunement = ATTUNEMENT_DEFINITIONS['VOLATILE'];

  const playerHero = new Hero(playerDef, 0, 0, 0, playerLoadout, playerAttunement);
  const aiHero = new Hero(aiDef, 0, 0, 0, aiLoadout, aiAttunement);

  const engine = new CombatEngine(playerHero, aiHero);

  const state: CombatState = {
    engine,
    playerHero,
    aiHero,
    playerAiArchetype: aiArchetypeId,
    pendingAction: null,
    overchargeActive: false,
    log: [],
    processing: false,
  };

  // --- Build DOM ---
  const screen = div('screen');
  screen.id = 'combat-screen';

  const stars = div('bg-stars');
  screen.appendChild(stars);

  // Header
  const header = div('combat-header');
  const roundBadge = div('combat-round-badge');
  roundBadge.innerHTML = `ROUND <span class="round-num" id="round-num">1</span> / 25`;
  header.appendChild(roundBadge);
  screen.appendChild(header);

  // Arena
  const arena = div('combat-arena');

  // Player panel
  const playerPanel = createHeroPanel(playerHero, playerDef, playerSelection.archetypeId, true, playerSelection.attunementId);
  const vsDiv = div('combat-vs-divider');
  vsDiv.innerHTML = `
    <div class="vs-divider-line"></div>
    <span class="vs-label">VS</span>
    <div class="vs-divider-line"></div>
  `;
  const aiPanel = createHeroPanel(aiHero, aiDef, aiArchetypeId, false);

  arena.appendChild(playerPanel);
  arena.appendChild(vsDiv);
  arena.appendChild(aiPanel);
  screen.appendChild(arena);

  // Combat log
  const logContainer = div('combat-log-container');
  logContainer.innerHTML = `
    <div class="combat-log-header">
      <span>Combat Log</span>
      <span id="log-round-indicator">Round 1</span>
    </div>
    <div class="combat-log-entries" id="combat-log-entries"></div>
  `;
  screen.appendChild(logContainer);

  // Actions bar
  const actionsBar = div('combat-actions');

  const actionsLabel = div('actions-label');
  actionsLabel.textContent = '🎮 Choose your action';
  actionsBar.appendChild(actionsLabel);

  const abilityButtons = div('ability-buttons');
  abilityButtons.id = 'ability-buttons';

  // Build ability buttons
  buildAbilityButtons(abilityButtons, state, () => renderAbilityButtons(abilityButtons, state));

  actionsBar.appendChild(abilityButtons);

  const confirmRow = div('combat-confirm-row');

  const overchargeToggle = div(['overcharge-toggle']);
  overchargeToggle.id = 'overcharge-toggle';
  overchargeToggle.innerHTML = `<span class="overcharge-spark">⚡</span> Overcharge (+3💎, ×1.5 effect)`;
  overchargeToggle.title = 'Toggle overcharge — costs 3 extra resonance for 50% stronger effects';
  overchargeToggle.addEventListener('click', () => {
    state.overchargeActive = !state.overchargeActive;
    overchargeToggle.classList.toggle('active', state.overchargeActive);
    renderAbilityButtons(abilityButtons, state);
  });

  const actionStatus = div('combat-action-status');
  actionStatus.id = 'action-status';
  actionStatus.textContent = 'Select an ability to queue your action';

  const submitBtn = btn(['btn', 'btn-gold'], '⚔️  Resolve Round');
  submitBtn.id = 'submit-btn';
  submitBtn.disabled = true;
  submitBtn.addEventListener('click', () => resolveRound(screen, state, submitBtn, overchargeToggle));

  confirmRow.appendChild(overchargeToggle);
  confirmRow.appendChild(actionStatus);
  confirmRow.appendChild(submitBtn);
  actionsBar.appendChild(confirmRow);
  screen.appendChild(actionsBar);

  // Initial render
  setTimeout(() => {
    updateHeroPanel(screen, playerHero, true, engine.getState().player1Resonance);
    updateHeroPanel(screen, aiHero, false, engine.getState().player2Resonance);
    addLogEntry(screen, { type: 'system', text: '⚔️ Combat begins! Choose your action.' });
  }, 100);

  return screen;
}

function createHeroPanel(
  hero: Hero,
  def: HeroDefinition,
  archetypeId: ArchetypeId,
  isPlayer: boolean,
  attunementId?: AttunementId
): HTMLElement {
  const panel = div('hero-panel');

  const inner = div(['hero-panel-inner', isPlayer ? 'player' : 'enemy']);
  inner.id = isPlayer ? 'player-panel-inner' : 'ai-panel-inner';

  // Portrait row
  const portraitRow = div('hero-portrait-row');

  const portrait = div('hero-portrait');
  portrait.textContent = HERO_ICONS[archetypeId];
  if (!isPlayer) portrait.classList.add('enemy-portrait');

  const info = div('hero-portrait-info');
  if (!isPlayer) info.classList.add('enemy-info');

  const nameEl = div('hero-portrait-name');
  nameEl.textContent = def.name;

  const archetypeEl = div('hero-portrait-archetype');
  archetypeEl.textContent = def.archetype;

  const labelTag = div(['hero-label-tag', isPlayer ? 'player-tag' : 'enemy-tag']);
  labelTag.textContent = isPlayer ? 'YOU' : 'ENEMY';

  info.appendChild(nameEl);
  info.appendChild(archetypeEl);
  info.appendChild(labelTag);

  if (isPlayer) {
    portraitRow.appendChild(portrait);
    portraitRow.appendChild(info);
  } else {
    portraitRow.appendChild(info);
    portraitRow.appendChild(portrait);
  }
  inner.appendChild(portraitRow);

  // HP bar
  const hpContainer = div('hero-hp-container');
  hpContainer.innerHTML = `
    <div class="hero-hp-label">
      <span class="hp-text">HP</span>
      <span class="hp-value" id="${isPlayer ? 'player' : 'ai'}-hp-value">${hero.currentHp} / ${hero.maxHp}</span>
    </div>
    <div class="hp-bar-track">
      <div class="hp-bar-fill" id="${isPlayer ? 'player' : 'ai'}-hp-bar"></div>
    </div>
  `;
  inner.appendChild(hpContainer);

  // Resonance
  const resonanceDiv = div('hero-resonance');
  resonanceDiv.innerHTML = `
    <span class="resonance-label">RESONANCE</span>
    <div class="resonance-crystals" id="${isPlayer ? 'player' : 'ai'}-resonance-crystals"></div>
    <span class="resonance-count" id="${isPlayer ? 'player' : 'ai'}-resonance-count">0</span>
  `;
  inner.appendChild(resonanceDiv);

  // Status effects
  const statusDiv = div('hero-status-effects');
  statusDiv.id = `${isPlayer ? 'player' : 'ai'}-status`;
  inner.appendChild(statusDiv);

  // Attunement display
  if (attunementId) {
    const attuneDef = ATTUNEMENT_DEFINITIONS[attunementId];
    const attuneDisplay = div('attunement-display');
    attuneDisplay.innerHTML = `✨ <em>${attuneDef.name}</em>`;
    inner.appendChild(attuneDisplay);
  }

  panel.appendChild(inner);
  return panel;
}

function buildAbilityButtons(
  container: HTMLElement,
  state: CombatState,
  onChange: () => void
): void {
  clearElement(container);

  const { playerHero, engine, overchargeActive } = state;
  const combatState = engine.getState();
  const resonance = combatState.player1Resonance;

  // Basic attack
  const basicBtn = createAbilityBtn(
    'basic_attack',
    '🗡️',
    'Basic Attack',
    'basic',
    0,
    0,
    false,
    resonance,
    state,
    () => {
      state.pendingAction = { abilityId: 'basic_attack', overcharge: false };
      highlightSelected(container, 'basic_attack');
      updateSubmitBtn();
      updateActionStatus('basic_attack', false);
    }
  );
  container.appendChild(basicBtn);

  // Active abilities
  for (const ability of playerHero.activeAbilities) {
    const isReady = playerHero.isAbilityReady(ability.id);
    const cooldown = playerHero.cooldowns.get(ability.id) ?? 0;
    const isLocked = (playerHero.lockedAbilities.get(ability.id) ?? 0) > 0;
    const actualCd = isLocked ? (playerHero.lockedAbilities.get(ability.id) ?? 0) : cooldown;
    const onCooldown = !isReady;
    const overchargeCost = ability.resonanceCost + 3;
    const canAfford = resonance >= (overchargeActive ? overchargeCost : ability.resonanceCost);

    const abilBtn = createAbilityBtn(
      ability.id,
      getAbilityIcon(ability.type),
      ability.name,
      ability.type.toLowerCase(),
      onCooldown ? actualCd : 0,
      ability.resonanceCost,
      overchargeActive,
      resonance,
      state,
      () => {
        if (onCooldown || !canAfford) return;
        state.pendingAction = { abilityId: ability.id, overcharge: overchargeActive };
        highlightSelected(container, ability.id);
        updateSubmitBtn();
        updateActionStatus(ability.name, overchargeActive);
      }
    );

    if (onCooldown || !canAfford || isLocked) {
      abilBtn.disabled = true;
      if (onCooldown) abilBtn.classList.add('on-cooldown');
      if (!canAfford) abilBtn.classList.add('no-resonance');
    }

    container.appendChild(abilBtn);
  }
}

function createAbilityBtn(
  id: string,
  icon: string,
  name: string,
  type: string,
  cooldown: number,
  resonanceCost: number,
  overchargeActive: boolean,
  resonance: number,
  state: CombatState,
  onClick: () => void
): HTMLButtonElement {
  const b = btn(['ability-btn', type]);
  b.dataset.abilityId = id;

  const iconEl = div('ability-btn-icon');
  iconEl.textContent = icon;

  const nameEl = div('ability-btn-name');
  nameEl.textContent = name;

  const infoEl = div('ability-btn-info');

  if (resonanceCost > 0) {
    const costChip = div('ability-btn-cost');
    const actualCost = overchargeActive && id !== 'basic_attack' ? resonanceCost + 3 : resonanceCost;
    costChip.textContent = `💎${actualCost}`;
    infoEl.appendChild(costChip);
  }

  b.appendChild(iconEl);
  b.appendChild(nameEl);
  b.appendChild(infoEl);

  if (cooldown > 0) {
    const overlay = div('ability-btn-cooldown-overlay');
    const cdNum = div('cooldown-turns-left');
    cdNum.textContent = String(cooldown);
    overlay.appendChild(cdNum);
    b.appendChild(overlay);
  }

  b.addEventListener('click', onClick);
  return b;
}

function renderAbilityButtons(container: HTMLElement, state: CombatState): void {
  const previousSelected = state.pendingAction?.abilityId;
  buildAbilityButtons(container, state, () => {});
  if (previousSelected) {
    highlightSelected(container, previousSelected);
  }
}

function highlightSelected(container: HTMLElement, abilityId: string): void {
  container.querySelectorAll('.ability-btn').forEach(btn => {
    btn.classList.toggle('selected-action', (btn as HTMLElement).dataset.abilityId === abilityId);
  });
}

function updateSubmitBtn(): void {
  const btn = document.getElementById('submit-btn') as HTMLButtonElement | null;
  if (btn) btn.disabled = false;
}

function updateActionStatus(name: string, overcharge: boolean): void {
  const el = document.getElementById('action-status');
  if (el) {
    el.textContent = overcharge
      ? `⚡ OVERCHARGING: ${name}`
      : `Queued: ${name}`;
  }
}

async function resolveRound(
  screen: HTMLElement,
  state: CombatState,
  submitBtn: HTMLButtonElement,
  overchargeToggle: HTMLElement
): Promise<void> {
  if (!state.pendingAction || state.processing) return;

  state.processing = true;
  submitBtn.disabled = true;

  // Show processing overlay
  const overlay = div('combat-processing');
  overlay.innerHTML = `
    <div class="combat-processing-inner">
      <div class="combat-spinner"></div>
      <div class="combat-processing-text">⚔️ RESOLVING...</div>
    </div>
  `;
  screen.appendChild(overlay);

  await delay(400);

  // AI action
  const combatState = state.engine.getState();
  const aiAction = selectAiAction(
    state.aiHero,
    state.playerHero,
    combatState.player2Resonance
  );

  // Execute round
  const record = state.engine.submitRound(state.pendingAction, aiAction);

  // Remove overlay
  overlay.remove();

  // Update round indicator
  const roundNum = document.getElementById('round-num');
  if (roundNum) roundNum.textContent = String(state.engine.getState().roundNumber);

  const logIndicator = document.getElementById('log-round-indicator');
  if (logIndicator) logIndicator.textContent = `Round ${state.engine.getState().roundNumber}`;

  // Add round separator
  addLogEntry(screen, {
    type: 'round',
    text: `── Round ${record.round} ──`,
  });

  // Process events with delays
  for (const event of record.events) {
    const logEvent = parseEventToLog(event);
    addLogEntry(screen, logEvent);
    await delay(120);
  }

  // Animate hero panels
  const newState = state.engine.getState();
  await updateHeroPanelAnimated(
    screen,
    state.playerHero,
    true,
    newState.player1Resonance,
    record
  );
  await updateHeroPanelAnimated(
    screen,
    state.aiHero,
    false,
    newState.player2Resonance,
    record
  );

  // Reset action state
  state.pendingAction = null;
  state.overchargeActive = false;
  overchargeToggle.classList.remove('active');

  const actionStatus = document.getElementById('action-status');
  if (actionStatus) actionStatus.textContent = 'Select an ability to queue your action';

  // Rebuild ability buttons
  const abilityButtons = document.getElementById('ability-buttons');
  if (abilityButtons) {
    renderAbilityButtons(abilityButtons, state);
  }

  state.processing = false;

  // Check game over
  if (state.engine.getState().isOver) {
    const winner = state.engine.getState().winner;
    await delay(800);

    const finalState = state.engine.getState();
    const rounds = finalState.roundNumber;

    if (winner === 'player1') {
      addLogEntry(screen, { type: 'heal', text: '🏆 VICTORY! You have defeated your opponent!' });
    } else if (winner === 'player2') {
      addLogEntry(screen, { type: 'damage', text: '💀 DEFEAT! You have been vanquished...' });
    } else {
      addLogEntry(screen, { type: 'utility', text: '⚖️ DRAW! Both warriors fall...' });
    }

    await delay(1200);
    (window as any).__aetherveilGameEnd?.(winner ?? 'draw', rounds);
  } else {
    submitBtn.disabled = false;
  }
}

function parseEventToLog(event: string): GameEvent {
  const lower = event.toLowerCase();

  if (lower.includes('deals') || lower.includes('damage') || lower.includes('hit')) {
    if (lower.includes('critical') || lower.includes('crit')) {
      return { type: 'crit', text: `⚡ ${event}` };
    }
    return { type: 'damage', text: `⚔️ ${event}` };
  }
  if (lower.includes('heal') || lower.includes('regen')) {
    return { type: 'heal', text: `💚 ${event}` };
  }
  if (lower.includes('shield') || lower.includes('barrier') || lower.includes('absorb')) {
    return { type: 'shield', text: `🛡️ ${event}` };
  }
  if (lower.includes('dodge') || lower.includes('miss') || lower.includes('evad')) {
    return { type: 'dodge', text: `🌀 ${event}` };
  }
  if (lower.includes('poison')) {
    return { type: 'poison', text: `☠️ ${event}` };
  }
  if (lower.includes('resonance') || lower.includes('cooldown') || lower.includes('lock') || lower.includes('debuff') || lower.includes('buff')) {
    return { type: 'utility', text: `✨ ${event}` };
  }
  return { type: 'system', text: event };
}

function addLogEntry(screen: HTMLElement, event: GameEvent): void {
  const entries = screen.querySelector('#combat-log-entries');
  if (!entries) return;

  const entry = div(['log-entry', event.type]);
  entry.textContent = event.text;
  entries.appendChild(entry);

  // Scroll to bottom
  entries.scrollTop = entries.scrollHeight;

  // Keep only last 80 entries
  while (entries.children.length > 80) {
    entries.removeChild(entries.firstChild!);
  }
}

function updateHeroPanel(
  screen: HTMLElement,
  hero: Hero,
  isPlayer: boolean,
  resonance: number
): void {
  const prefix = isPlayer ? 'player' : 'ai';

  // HP
  const hpBar = screen.querySelector<HTMLElement>(`#${prefix}-hp-bar`);
  const hpValue = screen.querySelector<HTMLElement>(`#${prefix}-hp-value`);
  if (hpBar) animateHpBar(hpBar, hero.currentHp, hero.maxHp);
  if (hpValue) hpValue.textContent = `${Math.max(0, hero.currentHp)} / ${hero.maxHp}`;

  // Resonance
  updateResonanceDisplay(screen, prefix, resonance);

  // Status
  updateStatusDisplay(screen, prefix, hero);
}

async function updateHeroPanelAnimated(
  screen: HTMLElement,
  hero: Hero,
  isPlayer: boolean,
  resonance: number,
  record: RoundRecord
): Promise<void> {
  const prefix = isPlayer ? 'player' : 'ai';
  const panelInner = screen.querySelector<HTMLElement>(`#${isPlayer ? 'player' : 'ai'}-panel-inner`);

  // Check for damage events
  const wasDamaged = record.events.some(e => {
    const lower = e.toLowerCase();
    return (isPlayer ? lower.includes('player 1') || lower.includes('p1') : lower.includes('player 2') || lower.includes('p2'))
      && lower.includes('damage');
  });

  const wasHealed = record.events.some(e => {
    const lower = e.toLowerCase();
    return (isPlayer ? lower.includes('player 1') || lower.includes('p1') : lower.includes('player 2') || lower.includes('p2'))
      && (lower.includes('heal') || lower.includes('regen'));
  });

  if (panelInner) {
    if (wasDamaged) {
      triggerAnimation(panelInner, 'shake', 450);
      triggerAnimation(panelInner, 'damage-taken', 550);
    }
    if (wasHealed) {
      await delay(200);
      triggerAnimation(panelInner, 'heal', 900);
    }
  }

  updateHeroPanel(screen, hero, isPlayer, resonance);
}

function updateResonanceDisplay(screen: HTMLElement, prefix: string, resonance: number): void {
  const crystals = screen.querySelector<HTMLElement>(`#${prefix}-resonance-crystals`);
  const count = screen.querySelector<HTMLElement>(`#${prefix}-resonance-count`);

  if (crystals) {
    clearElement(crystals);
    const maxDisplay = Math.min(resonance, 10);
    for (let i = 0; i < Math.min(resonance, 10); i++) {
      const crystal = div('resonance-crystal');
      crystal.textContent = '💎';
      crystal.classList.add('active');
      crystals.appendChild(crystal);
    }
    // Show inactive slots if under 5
    const total = Math.max(5, maxDisplay);
    for (let i = maxDisplay; i < total; i++) {
      const crystal = div('resonance-crystal');
      crystal.textContent = '💎';
      crystals.appendChild(crystal);
    }
  }

  if (count) {
    count.textContent = String(resonance);
  }
}

function updateStatusDisplay(screen: HTMLElement, prefix: string, hero: Hero): void {
  const statusDiv = screen.querySelector<HTMLElement>(`#${prefix}-status`);
  if (!statusDiv) return;
  clearElement(statusDiv);

  if (hero.shieldCharges > 0) {
    const badge = div(['status-badge', 'status-shield']);
    badge.textContent = `🛡️ Shield ×${hero.shieldCharges}`;
    statusDiv.appendChild(badge);
  }

  if (hero.dodgePending) {
    const badge = div(['status-badge', 'status-dodge']);
    badge.textContent = '🌀 Dodge';
    statusDiv.appendChild(badge);
  }

  if (hero.regenActive) {
    const badge = div(['status-badge', 'status-regen']);
    badge.textContent = `💚 Regen ${hero.regenTurnsLeft}t`;
    statusDiv.appendChild(badge);
  }

  for (const buff of hero.buffs) {
    if (buff.type === 'MIRROR_IMAGE') {
      const badge = div(['status-badge', 'status-dodge']);
      badge.textContent = `🪞 Mirror ${buff.turnsRemaining}t`;
      statusDiv.appendChild(badge);
    } else if (buff.type === 'DAMAGE_REFLECT') {
      const badge = div(['status-badge', 'status-shield']);
      badge.textContent = `🌪️ Reflect ${buff.turnsRemaining}t`;
      statusDiv.appendChild(badge);
    } else {
      const badge = div(['status-badge', 'status-buff']);
      badge.textContent = `▲ ${buff.type.replace(/_/g, ' ')} ${buff.turnsRemaining}t`;
      statusDiv.appendChild(badge);
    }
  }

  for (const debuff of hero.debuffs) {
    if (debuff.type === 'POISON') {
      const badge = div(['status-badge', 'status-poison']);
      badge.textContent = `☠️ Poison ${debuff.turnsRemaining}t`;
      statusDiv.appendChild(badge);
    } else {
      const badge = div(['status-badge', 'status-debuff']);
      badge.textContent = `▼ ${debuff.type.replace(/_/g, ' ')} ${debuff.turnsRemaining}t`;
      statusDiv.appendChild(badge);
    }
  }
}

function getAbilityIcon(type: string): string {
  const icons: Record<string, string> = {
    OFFENSIVE: '⚔️',
    DEFENSIVE: '🛡️',
    UTILITY: '✨',
  };
  return icons[type] || '🔮';
}
