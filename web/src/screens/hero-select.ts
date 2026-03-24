import '../styles/hero-select.css';
import { HERO_DEFINITIONS } from '@engine/heroes/hero-definitions';
import type { ArchetypeId } from '@engine/heroes/hero-definitions';
import { div, btn } from '../utils/dom';

interface HeroConfig {
  id: ArchetypeId;
  cssClass: string;
  icon: string;
  flavor: string;
  roles: { label: string; cls: string }[];
}

const HERO_CONFIGS: HeroConfig[] = [
  {
    id: 'SHARDWARDEN',
    cssClass: 'shardwarden',
    icon: '🛡️',
    flavor: '"Forged from living crystal, the Shardwarden stands unyielding. Where others crumble, the Warden endures — and strikes back."',
    roles: [
      { label: 'Tank', cls: 'tag-tank' },
      { label: 'Defensive', cls: 'tag-tank' },
    ],
  },
  {
    id: 'AETHERSPARK',
    cssClass: 'aetherspark',
    icon: '⚡',
    flavor: '"Raw aetheric energy given form. The Aetherspark strikes before most can blink — a glass cannon that trades durability for devastating power."',
    roles: [
      { label: 'Glass Cannon', cls: 'tag-dps' },
      { label: 'Speed', cls: 'tag-dps' },
    ],
  },
  {
    id: 'ROOTCALLER',
    cssClass: 'rootcaller',
    icon: '🌿',
    flavor: '"Nature\'s voice made flesh. The Rootcaller sustains, entangles, and overwhelms — resilient as the ancient forest itself."',
    roles: [
      { label: 'Sustain', cls: 'tag-sustain' },
      { label: 'Balanced', cls: 'tag-sustain' },
    ],
  },
];

export function createHeroSelectScreen(onSelect: (archetypeId: ArchetypeId) => void): HTMLElement {
  const screen = div('screen');
  screen.id = 'hero-select-screen';

  const stars = div('bg-stars');
  const nebula = div('bg-nebula');

  const content = div('hero-select-content');

  // Header
  const header = div('hero-select-header');
  header.innerHTML = `
    <h2>Choose Your Champion</h2>
    <p>Each hero brings a unique playstyle, ability pool, and strategic depth</p>
  `;
  content.appendChild(header);

  // Cards grid
  const grid = div('hero-cards-grid');

  for (const cfg of HERO_CONFIGS) {
    const def = HERO_DEFINITIONS[cfg.id];
    const card = createHeroCard(def, cfg, () => {
      onSelect(cfg.id);
    });
    grid.appendChild(card);
  }

  content.appendChild(grid);

  screen.appendChild(stars);
  screen.appendChild(nebula);
  screen.appendChild(content);

  return screen;
}

function createHeroCard(
  def: typeof HERO_DEFINITIONS[ArchetypeId],
  cfg: HeroConfig,
  onSelect: () => void
): HTMLElement {
  const card = div(['hero-card', cfg.cssClass, 'card']);

  // Selected check
  const check = div('hero-card-check');
  check.textContent = '✓';
  card.appendChild(check);

  // Header row
  const header = div('hero-card-header');

  const icon = div('hero-card-icon');
  icon.textContent = cfg.icon;

  const titleDiv = div('hero-card-title');
  const h3 = document.createElement('h3');
  h3.textContent = def.name;
  const archBadge = div('hero-archetype-badge');
  archBadge.textContent = def.archetype;
  titleDiv.appendChild(h3);
  titleDiv.appendChild(archBadge);

  header.appendChild(icon);
  header.appendChild(titleDiv);
  card.appendChild(header);

  // Role tags
  const roleDiv = div('hero-card-role');
  for (const role of cfg.roles) {
    const tag = div(['role-tag', role.cls]);
    tag.textContent = role.label;
    roleDiv.appendChild(tag);
  }
  card.appendChild(roleDiv);

  // Flavor
  const flavor = div('hero-card-flavor');
  flavor.textContent = cfg.flavor;
  card.appendChild(flavor);

  // Stats
  const statsDiv = div('hero-card-stats');
  const stats: [string, number, string][] = [
    ['HP', def.baseStats.hp, 'hp'],
    ['ATK', def.baseStats.attack, 'atk'],
    ['DEF', def.baseStats.defense, 'def'],
    ['SPD', def.baseStats.speed, 'spd'],
  ];

  for (const [label, value, cls] of stats) {
    const row = div('stat-row');

    const lbl = div('stat-label');
    lbl.textContent = label;

    const bar = div('stat-bar');
    const fill = div(['stat-bar-fill', cls]);
    const maxMap: Record<string, number> = { hp: 150, atk: 20, def: 20, spd: 20 };
    const maxVal = maxMap[cls] || 20;
    fill.style.width = `${(value / maxVal) * 100}%`;
    bar.appendChild(fill);

    const val = div('stat-value');
    val.textContent = String(value);

    row.appendChild(lbl);
    row.appendChild(bar);
    row.appendChild(val);
    statsDiv.appendChild(row);
  }
  card.appendChild(statsDiv);

  // Select button
  const selectBtn = btn(['btn', 'hero-select-btn'], `Select ${def.name}`);
  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelect();
  });
  card.appendChild(selectBtn);

  // Card click
  card.addEventListener('click', onSelect);

  // Animate stat bars on hover
  let animated = false;
  card.addEventListener('mouseenter', () => {
    if (!animated) {
      animated = true;
      // Bars already set
    }
  });

  return card;
}
