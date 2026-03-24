import '../styles/loadout.css';
import { HERO_DEFINITIONS } from '@engine/heroes/hero-definitions';
import type { ArchetypeId } from '@engine/heroes/hero-definitions';
import { ATTUNEMENT_DEFINITIONS } from '@engine/heroes/attunement';
import type { AttunementId } from '@engine/heroes/attunement';
import type { AbilityDefinition } from '@engine/heroes/ability';
import { div, btn } from '../utils/dom';

export interface LoadoutSelection {
  archetypeId: ArchetypeId;
  selectedAbilityIds: [string, string, string];
  attunementId: AttunementId;
}

const ATTUNEMENT_ICONS: Record<AttunementId, string> = {
  VOLATILE: '💥',
  STABILIZED: '🔷',
  FRACTURED: '🔥',
  RESONANT: '💚',
  PRISMATIC: '✨',
};

const ATTUNEMENT_EFFECT_LABELS: Record<string, string> = {
  OVERCHARGE_COST_REDUCTION: '−1 Overcharge Cost',
  OVERCHARGE_DAMAGE_PENALTY: '−15% Overcharge Bonus DMG',
  RESONANCE_PER_TURN_BONUS: '+1 Resonance/Turn',
  COOLDOWN_PENALTY: '+1 All Cooldowns',
  DAMAGE_BONUS_PERCENT: '+20% Damage Dealt',
  MAX_HP_PENALTY_PERCENT: '−15% Max HP',
  HEAL_BONUS_PERCENT: '+30% Healing',
  DAMAGE_TAKEN_INCREASE_PERCENT: '+10% Damage Taken',
  CRIT_CHANCE: '10% Crit Chance',
  START_RESONANCE: 'Start with 3 Resonance',
};

const POSITIVE_EFFECTS = new Set([
  'OVERCHARGE_COST_REDUCTION',
  'RESONANCE_PER_TURN_BONUS',
  'DAMAGE_BONUS_PERCENT',
  'HEAL_BONUS_PERCENT',
  'CRIT_CHANCE',
  'START_RESONANCE',
]);

export function createLoadoutScreen(
  archetypeId: ArchetypeId,
  onConfirm: (selection: LoadoutSelection) => void,
  onBack: () => void
): HTMLElement {
  const def = HERO_DEFINITIONS[archetypeId];
  const pool = def.abilityPool;

  let selectedIds: string[] = [];
  let selectedAttunement: AttunementId = 'PRISMATIC';

  const screen = div('screen');
  screen.id = 'loadout-screen';

  const stars = div('bg-stars');
  const nebula = div('bg-nebula');

  const content = div('loadout-content');

  // Header
  const header = div('loadout-header');
  const headerTitle = div('loadout-header-title');
  headerTitle.innerHTML = `
    <h2>Build Your Loadout</h2>
    <p>Select 3 abilities from ${def.name}'s arsenal, then choose an Attunement</p>
  `;

  const countDisplay = div('loadout-selected-count');
  countDisplay.innerHTML = `<span class="count-num" id="loadout-count">0</span> / 3 abilities selected`;

  header.appendChild(headerTitle);
  header.appendChild(countDisplay);
  content.appendChild(header);

  // --- Ability Pool ---
  const abilitySectionLabel = div('loadout-section-title');
  abilitySectionLabel.textContent = '⚔️  Ability Pool';
  content.appendChild(abilitySectionLabel);

  const abilityGrid = div('ability-pool-grid');
  const abilityCardEls = new Map<string, HTMLElement>();

  function updateAbilityCards() {
    for (const [id, card] of abilityCardEls) {
      const isSelected = selectedIds.includes(id);
      const isDisabled = !isSelected && selectedIds.length >= 3;
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('disabled', isDisabled);
    }

    const countEl = document.getElementById('loadout-count');
    if (countEl) {
      countEl.textContent = String(selectedIds.length);
      countEl.classList.toggle('valid', selectedIds.length === 3);
    }

    // Update slot displays
    for (let i = 0; i < 3; i++) {
      const slotEl = document.getElementById(`loadout-slot-${i}`);
      if (!slotEl) continue;
      const abilId = selectedIds[i];
      if (abilId) {
        const ab = pool.find(a => a.id === abilId);
        slotEl.classList.add('filled');
        slotEl.textContent = ab ? ab.name : abilId;
      } else {
        slotEl.classList.remove('filled');
        slotEl.textContent = `Slot ${i + 1}`;
      }
    }

    // Update confirm button
    const confirmBtn = document.getElementById('loadout-confirm-btn') as HTMLButtonElement | null;
    if (confirmBtn) {
      confirmBtn.disabled = selectedIds.length !== 3;
    }

    // Validation
    const valMsg = document.getElementById('loadout-validation-msg');
    if (valMsg) {
      if (selectedIds.length === 3) {
        valMsg.textContent = '✓ Loadout ready — choose an attunement';
        valMsg.className = 'loadout-validation-msg valid';
      } else {
        valMsg.textContent = `Select ${3 - selectedIds.length} more abilit${3 - selectedIds.length === 1 ? 'y' : 'ies'}`;
        valMsg.className = 'loadout-validation-msg';
      }
    }
  }

  for (const ability of pool) {
    const card = createAbilityCard(ability);
    card.addEventListener('click', () => {
      const idx = selectedIds.indexOf(ability.id);
      if (idx >= 0) {
        selectedIds.splice(idx, 1);
      } else if (selectedIds.length < 3) {
        selectedIds.push(ability.id);
      }
      updateAbilityCards();
    });
    abilityCardEls.set(ability.id, card);
    abilityGrid.appendChild(card);
  }

  content.appendChild(abilityGrid);

  // --- Attunement Section ---
  const attuneSectionLabel = div('loadout-section-title');
  attuneSectionLabel.innerHTML = '✨  Attunement — choose your passive shard';
  content.appendChild(attuneSectionLabel);

  const attuneGrid = div('attunement-grid');
  const attuneCardEls = new Map<AttunementId, HTMLElement>();

  function updateAttuneCards() {
    for (const [id, card] of attuneCardEls) {
      card.classList.toggle('selected', id === selectedAttunement);
    }
  }

  for (const [id, attuneDef] of Object.entries(ATTUNEMENT_DEFINITIONS) as [AttunementId, typeof ATTUNEMENT_DEFINITIONS[AttunementId]][]) {
    const card = createAttunementCard(id, attuneDef);
    card.addEventListener('click', () => {
      selectedAttunement = id;
      updateAttuneCards();
    });
    if (id === selectedAttunement) card.classList.add('selected');
    attuneCardEls.set(id, card);
    attuneGrid.appendChild(card);
  }

  content.appendChild(attuneGrid);

  // --- Action Bar ---
  const actionsBar = div('loadout-actions');

  // Slots summary
  const slotsDiv = div('loadout-summary');
  for (let i = 0; i < 3; i++) {
    const slot = div('loadout-slot');
    slot.id = `loadout-slot-${i}`;
    slot.textContent = `Slot ${i + 1}`;
    slotsDiv.appendChild(slot);
  }

  const rightSide = div();
  rightSide.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; gap: 8px;';

  const valMsg = div('loadout-validation-msg');
  valMsg.id = 'loadout-validation-msg';
  valMsg.textContent = 'Select 3 abilities';

  const buttonsRow = div();
  buttonsRow.style.cssText = 'display: flex; gap: 12px;';

  const backBtn = btn(['btn', 'btn-secondary'], '← Back');
  backBtn.addEventListener('click', onBack);

  const confirmBtn = btn(['btn', 'btn-gold'], '⚔️  Enter Combat');
  confirmBtn.id = 'loadout-confirm-btn';
  confirmBtn.disabled = true;
  confirmBtn.addEventListener('click', () => {
    if (selectedIds.length !== 3) return;
    onConfirm({
      archetypeId,
      selectedAbilityIds: selectedIds as [string, string, string],
      attunementId: selectedAttunement,
    });
  });

  buttonsRow.appendChild(backBtn);
  buttonsRow.appendChild(confirmBtn);
  rightSide.appendChild(valMsg);
  rightSide.appendChild(buttonsRow);

  actionsBar.appendChild(slotsDiv);
  actionsBar.appendChild(rightSide);
  content.appendChild(actionsBar);

  screen.appendChild(stars);
  screen.appendChild(nebula);
  screen.appendChild(content);

  return screen;
}

function createAbilityCard(ability: AbilityDefinition): HTMLElement {
  const card = div(['ability-card', ability.type.toLowerCase()]);

  const header = div('ability-card-header');

  const nameEl = div('ability-card-name');
  nameEl.textContent = ability.name;

  const meta = div('ability-card-meta');

  const typeIcon = { OFFENSIVE: '⚔️', DEFENSIVE: '🛡️', UTILITY: '✨' }[ability.type];
  const typeBadge = div(['badge', `badge-${ability.type.toLowerCase()}`]);
  typeBadge.textContent = `${typeIcon} ${ability.type}`;

  const cdChip = div(['ability-meta-chip', 'meta-cd']);
  cdChip.innerHTML = `⏱ CD:${ability.cooldown}`;

  const costChip = div(['ability-meta-chip', 'meta-cost']);
  costChip.innerHTML = `💎 ${ability.resonanceCost}`;

  meta.appendChild(cdChip);
  meta.appendChild(costChip);

  header.appendChild(nameEl);
  header.appendChild(meta);
  card.appendChild(header);

  card.appendChild(typeBadge);

  const desc = div('ability-card-desc');
  desc.textContent = ability.description;
  card.appendChild(desc);

  return card;
}

function createAttunementCard(
  id: AttunementId,
  def: typeof ATTUNEMENT_DEFINITIONS[AttunementId]
): HTMLElement {
  const card = div('attunement-card');

  const icon = div('attunement-icon');
  icon.textContent = ATTUNEMENT_ICONS[id];

  const name = div('attunement-name');
  name.textContent = def.name;

  const desc = div('attunement-desc');
  desc.textContent = def.description;

  const effectsDiv = div('attunement-effects');
  for (const effect of def.effects) {
    const pill = div(['attunement-effect-pill', POSITIVE_EFFECTS.has(effect.type) ? 'effect-positive' : 'effect-negative']);
    const label = ATTUNEMENT_EFFECT_LABELS[effect.type] || effect.type;
    pill.textContent = `${POSITIVE_EFFECTS.has(effect.type) ? '▲' : '▼'} ${label}`;
    effectsDiv.appendChild(pill);
  }

  card.appendChild(icon);
  card.appendChild(name);
  card.appendChild(desc);
  card.appendChild(effectsDiv);

  return card;
}
