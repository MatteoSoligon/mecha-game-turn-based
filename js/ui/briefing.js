/**
 * Battle briefing screen: enemy intel on one side, the mecha workshop on the
 * other. The player buys and equips parts here, watching their own stat block
 * update live, then deploys into the battle.
 */

import {
  TIER_LABELS,
  createEnemyForLevel,
  factionInfo,
  levelPortrait,
  LEVELS_BY_ID,
} from "../campaign.js";
import { PARTS_BY_ID, SLOTS, TIERS, partsForSlot } from "../catalog.js";
import { PASSIVE_EFFECTS_BY_KEY } from "../effects.js";
import {
  buildLoadoutParts,
  buyPart,
  clearedCount,
  equipPart,
  getProgress,
  partStatus,
} from "../progress.js";
import { Robot } from "../robot.js";
import { pulseScrap } from "./topbar.js";

const SAMPLE_DISTANCES = [
  { key: "Close", distance: 0.5 },
  { key: "Mid", distance: 1.5 },
  { key: "Far", distance: 3 },
];

let els = null;
let onDeploy = null;
let currentLevelId = null;
let cachedEnemy = null;

export function initBriefing({ onDeploy: deployHandler }) {
  onDeploy = deployHandler;
  els = {
    title: document.getElementById("briefing-title"),
    subtitle: document.getElementById("briefing-subtitle"),
    enemy: document.getElementById("briefing-enemy"),
    player: document.getElementById("briefing-player"),
    workshop: document.getElementById("briefing-workshop"),
    deploy: document.getElementById("deploy-btn"),
  };

  els.deploy.addEventListener("click", () => onDeploy(currentLevelId));
}

export function renderBriefing(levelId) {
  currentLevelId = levelId;
  const level = LEVELS_BY_ID[levelId];
  if (!level || !els) {
    return;
  }

  cachedEnemy = createEnemyForLevel(levelId);

  els.title.textContent = `Mission ${String(level.id).padStart(2, "0")} — ${level.title}`;
  els.subtitle.textContent = level.intel;
  els.deploy.textContent = `Deploy ▶`;

  renderEnemyCard(level);
  renderPlayerCard();
  renderWorkshop();
}

/* ── Stat helpers ─────────────────────────────────────────────────────── */

function statRow(label, value) {
  const row = document.createElement("div");
  row.className = "stat-row";
  const name = document.createElement("span");
  name.className = "stat-label";
  name.textContent = label;
  const val = document.createElement("span");
  val.className = "stat-value";
  val.textContent = value;
  row.append(name, val);
  return row;
}

function effectIcons(robot) {
  const wrap = document.createElement("div");
  wrap.className = "effect-icon-row";
  const effects = robot.availableEffects;
  if (!effects.length) {
    wrap.textContent = "-";
    return wrap;
  }
  for (const effect of effects) {
    const chip = document.createElement("span");
    chip.className = `special-stat-icon ${effect.class}`;
    chip.title = `${effect.label}: ${effect.description}`;
    const img = document.createElement("img");
    img.src = effect.icon;
    img.alt = effect.label;
    img.width = 14;
    img.height = 14;
    const count = document.createElement("span");
    count.className = "effect-chip-count";
    count.textContent = `x${robot.effectCapacity[effect.key] || 0}`;
    chip.append(img, count);
    wrap.appendChild(chip);
  }
  return wrap;
}

function damageProfile(robot) {
  return SAMPLE_DISTANCES
    .map(({ key, distance }) => `${key} ${robot.attackStrength(distance).toFixed(1)}`)
    .join("  ");
}

function renderRobotStats(host, robot) {
  const body = document.createElement("div");
  body.className = "robot-card-body";
  body.append(
    statRow("HP", robot.maxHP.toFixed(0)),
    statRow("Energy", robot.maxEnergy.toFixed(0)),
    statRow("DEF", robot.parryStrength().toFixed(1)),
    statRow("SPD", robot.moveSpeed().toFixed(2)),
    statRow("ATK", damageProfile(robot)),
  );

  const fxRow = document.createElement("div");
  fxRow.className = "stat-row";
  const fxLabel = document.createElement("span");
  fxLabel.className = "stat-label";
  fxLabel.textContent = "FX";
  fxRow.append(fxLabel, effectIcons(robot));
  body.appendChild(fxRow);

  const partsRow = statRow("Parts", robot.parts.map((part) => part.name).join(", "));
  body.appendChild(partsRow);

  host.appendChild(body);
}

/* ── Enemy card ───────────────────────────────────────────────────────── */

function renderEnemyCard(level) {
  els.enemy.replaceChildren();

  const header = document.createElement("div");
  header.className = "robot-card-header";
  header.textContent = `◀ ${cachedEnemy.name}`;
  els.enemy.appendChild(header);

  const hero = document.createElement("div");
  hero.className = "briefing-hero";

  const img = document.createElement("img");
  img.src = levelPortrait(level);
  img.alt = cachedEnemy.name;
  hero.appendChild(img);

  const tags = document.createElement("div");
  tags.className = "briefing-tags";

  const tierTag = document.createElement("span");
  tierTag.className = `tier-badge tier-badge--${level.tier}`;
  tierTag.textContent = TIER_LABELS[level.tier];

  const factionTag = document.createElement("span");
  factionTag.className = "faction-badge";
  factionTag.textContent = factionInfo(level).name;

  tags.append(tierTag, factionTag);
  hero.appendChild(tags);
  els.enemy.appendChild(hero);

  const lore = document.createElement("p");
  lore.className = "briefing-lore";
  lore.textContent = factionInfo(level).description;
  els.enemy.appendChild(lore);

  const tactic = document.createElement("p");
  tactic.className = "briefing-tactic";
  tactic.textContent = `Tactical note: ${level.tactic}`;
  els.enemy.appendChild(tactic);

  renderRobotStats(els.enemy, cachedEnemy);
}

/* ── Player card ──────────────────────────────────────────────────────── */

function renderPlayerCard() {
  els.player.replaceChildren();

  const header = document.createElement("div");
  header.className = "robot-card-header";
  header.textContent = "▶ Your Mecha";
  els.player.appendChild(header);

  const preview = new Robot(buildLoadoutParts(), { attack: 0.4, parry: 0.5, move: 0.1 }, "player");
  renderRobotStats(els.player, preview);
}

/* ── Workshop ─────────────────────────────────────────────────────────── */

function partStatLine(entry) {
  const part = new entry.ctor();
  const bits = [];
  if (part.damage) bits.push(`DMG ${part.damage}`);
  if (part.shield) bits.push(`DEF ${part.shield}`);
  if (part.speed) bits.push(`SPD ${part.speed}`);
  if (part.totHP) bits.push(`HP ${part.totHP}`);
  if (part.totEnergy) bits.push(`EN ${part.totEnergy}`);
  return bits.join(" · ");
}

function partEffectChips(entry) {
  const part = new entry.ctor();
  const wrap = document.createElement("div");
  wrap.className = "effect-icon-row";
  for (const [key, uses] of Object.entries(part.passiveEffects || {})) {
    const effect = PASSIVE_EFFECTS_BY_KEY[key];
    if (!effect) continue;
    const chip = document.createElement("span");
    chip.className = `special-stat-icon ${effect.class}`;
    chip.title = `${effect.label}: ${effect.description}`;
    const img = document.createElement("img");
    img.src = effect.icon;
    img.alt = effect.label;
    img.width = 14;
    img.height = 14;
    const count = document.createElement("span");
    count.className = "effect-chip-count";
    count.textContent = `x${uses}`;
    chip.append(img, count);
    wrap.appendChild(chip);
  }
  return wrap;
}

function buildPartCard(entry) {
  const status = partStatus(entry.id);
  const card = document.createElement("article");
  card.className = "part-card";
  card.dataset.status = status;
  card.dataset.tier = entry.tier;

  const head = document.createElement("header");
  head.className = "part-card-head";

  const name = document.createElement("span");
  name.className = "part-card-name";
  name.textContent = entry.label;

  const tier = document.createElement("span");
  tier.className = `tier-badge tier-badge--${entry.tier}`;
  tier.textContent = TIERS[entry.tier].label;

  head.append(name, tier);

  const stats = document.createElement("p");
  stats.className = "part-card-stats";
  stats.textContent = partStatLine(entry);

  const blurb = document.createElement("p");
  blurb.className = "part-card-blurb";
  blurb.textContent = entry.blurb;

  const action = document.createElement("button");
  action.type = "button";
  action.className = "part-card-action";

  if (status === "locked") {
    const remaining = entry.unlockLevel - clearedCount();
    action.disabled = true;
    action.textContent = `🔒 ${remaining} more mission${remaining === 1 ? "" : "s"}`;
    card.title = `Unlocks after clearing ${entry.unlockLevel} missions`;
  } else if (status === "equipped") {
    action.disabled = true;
    action.textContent = "Equipped";
  } else if (status === "owned") {
    action.textContent = "Equip";
    action.addEventListener("click", () => {
      equipPart(entry.id);
      refreshAfterChange();
    });
  } else {
    action.textContent = `Buy — ${entry.cost} scrap`;
    action.disabled = status === "unaffordable";
    action.addEventListener("click", () => {
      if (!buyPart(entry.id)) {
        return;
      }
      equipPart(entry.id);
      pulseScrap();
      refreshAfterChange(entry.id);
    });
  }

  card.append(head, stats, partEffectChips(entry), blurb, action);
  return card;
}

function refreshAfterChange(purchasedId) {
  renderPlayerCard();
  renderWorkshop();
  if (purchasedId) {
    const node = els.workshop.querySelector(`[data-part-id="${purchasedId}"]`);
    if (node) {
      node.classList.add("part-card--just-bought");
    }
  }
}

function renderWorkshop() {
  els.workshop.replaceChildren();

  for (const slot of SLOTS) {
    const column = document.createElement("section");
    column.className = "workshop-column";

    const header = document.createElement("h3");
    header.className = `workshop-slot-title ${slot.accent}`;
    const equippedId = getProgress().loadout[slot.key];
    const equipped = PARTS_BY_ID[equippedId];
    header.textContent = `${slot.label} — ${equipped ? equipped.label : "none"}`;

    const list = document.createElement("div");
    list.className = "workshop-list";

    for (const entry of partsForSlot(slot.key)) {
      const card = buildPartCard(entry);
      card.dataset.partId = entry.id;
      list.appendChild(card);
    }

    column.append(header, list);
    els.workshop.appendChild(column);
  }
}
