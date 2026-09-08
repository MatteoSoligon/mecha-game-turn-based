import { Battle } from "./battle.js";
import { EnergyBooster, RepairKit, Teleporter } from "./item.js";
import { Robot } from "./robot.js";
import { FloodedCity, Sand, Steel } from "./terrain.js";
import { normalizeAction, resolveDirection } from "./actions.js";
import { PASSIVE_EFFECTS_BY_KEY } from "./effects.js";
import { runMiniGame } from "./minigame.js";
import {
  LEVELS_BY_ID,
  computeRewards,
  createEnemyForLevel,
} from "./campaign.js";
import {
  addRewards,
  buildLoadoutParts,
  clearedCount,
  completeLevel,
  getProgress,
  isLevelCleared,
  partsUnlockedBetween,
} from "./progress.js";
import { eventQuip, roundQuip } from "./quips.js";
import { registerScreen, showScreen } from "./screens.js";
import { initTopBar } from "./ui/topbar.js";
import { initQuests, renderQuests } from "./ui/quests.js";
import { initBriefing, renderBriefing } from "./ui/briefing.js";
import { initResults, renderResults } from "./ui/results.js";

const PLAYER_ENERGY_STOCKS = { attack: 0.4, parry: 0.5, move: 0.1 };
const ACTION_SPRITE_EFFECTS = {
  attack: "sprite-blink-red",
  parry: "sprite-blink-blue",
  move: "sprite-blink-yellow",
};
// Symbols in images/action-effects.svg played over the sprite for each action.
const ACTION_FX_SYMBOLS = {
  attack: "fx-laser",
  parry: "fx-shield",
  move: "fx-dust",
};

/** Live battle state; rebuilt from scratch every time a mission is deployed. */
const state = {
  levelId: null,
  robot1: null,
  robot2: null,
  battle: null,
  rounds: 0,
  finished: true,
  pendingLoser: null,
};

function barWidth(value, max) {
  if (!max) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
}

function showBarDelta(barEl, delta, type) {
  if (Math.abs(delta) < 0.5) return;
  const rect = barEl.parentElement.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'bar-delta';
  el.textContent = delta > 0 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;
  el.dataset.type = type;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function blinkSprite(sprite, effectClass) {
  if (!sprite || !effectClass) {
    return;
  }

  sprite.classList.remove(...Object.values(ACTION_SPRITE_EFFECTS));
  void sprite.offsetWidth;
  sprite.classList.add(effectClass);
  sprite.addEventListener("animationend", () => sprite.classList.remove(effectClass), { once: true });
}

// Plays the laser/shield/dust SVG sprite over the mecha performing the action.
function playActionEffect(sprite, actionType) {
  console.log(`Preparing to play action effect: ${actionType} on sprite`, sprite);
  const symbolId = ACTION_FX_SYMBOLS[actionType];
  const host = sprite && sprite.parentElement;
  if (!symbolId || !host) {
    return;
  }

  const mount = document.createElement("div");
  mount.className = "action-fx";
  if (sprite === player2Sprite) {
    mount.classList.add("fx-flip");
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add(symbolId);
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `images/action-effects.svg#${symbolId}`);
  svg.appendChild(use);
  mount.appendChild(svg);
  host.appendChild(mount);
  mount.addEventListener("animationend", () => mount.remove(), { once: true });
}

// Clears leftover blink classes/FX mounts so a hidden screen can't replay last battle's action.
function resetSpriteFx(sprite) {
  if (!sprite) {
    return;
  }

  sprite.classList.remove(...Object.values(ACTION_SPRITE_EFFECTS));
  sprite.parentElement?.querySelectorAll(".action-fx").forEach((mount) => mount.remove());
}

function spriteForRobot(robot) {
  if (robot === state.robot1) {
    return player1Sprite;
  }
  if (robot === state.robot2) {
    return player2Sprite;
  }
  return null;
}

// Floats the icon + label of a just-consumed passive effect above the robot.
function showEffectConsumed(robot, effectKey) {
  const sprite = spriteForRobot(robot);
  const effect = PASSIVE_EFFECTS_BY_KEY[effectKey];
  if (!sprite || !effect) {
    return;
  }

  const host = sprite.parentElement;
  if (!host) {
    return;
  }

  const badge = document.createElement("div");
  badge.className = `effect-pop ${effect.class}`;
  if (sprite === player1Sprite) {
    badge.classList.add("effect-pop--left");
  }

  const icon = document.createElement("img");
  icon.src = effect.icon;
  icon.alt = effect.label;
  icon.width = 16;
  icon.height = 16;

  const label = document.createElement("span");
  label.textContent = effect.label;

  badge.append(icon, label);
  host.appendChild(badge);
  badge.addEventListener("animationend", () => badge.remove());
}

const actionInput = document.getElementById("robot1-action");
const fightBtn = document.getElementById("fight-btn");
const repairKitBtn = document.getElementById("repair-kit-btn");
const energyBoosterBtn = document.getElementById("energy-booster-btn");
const teleporterBtn = document.getElementById("teleporter-btn");
const robot1PassiveEffects = document.getElementById("robot1-passive-effects");
const battleScreen = document.getElementById("screen-battle");
const battleMission = document.getElementById("battle-mission");
const retreatBtn = document.getElementById("retreat-btn");
const monitorLog = document.getElementById("monitor-log");
const monitorScreen = document.getElementById("monitor-screen");
const aiAvatar = document.getElementById("ai-avatar");
const monitorStatus = document.getElementById("monitor-status");

const MAX_LOG_LINES = 24;
const MOOD_STATUS = {
  idle: "HAL-9K online",
  happy: "HAL-9K pleased",
  smug: "HAL-9K smug",
  worried: "HAL-9K concerned",
  alarm: "HAL-9K alarmed",
};
let moodResetTimer = null;

function pushLog(text, kind = "system") {
  const line = document.createElement("span");
  line.className = `log-line log-line--${kind}`;
  line.textContent = text;
  monitorLog.appendChild(line);
  while (monitorLog.children.length > MAX_LOG_LINES) {
    monitorLog.removeChild(monitorLog.firstChild);
  }
  monitorScreen.scrollTop = monitorScreen.scrollHeight;
}

/** Sets the lens animation, then drifts back to idle so moods stay reactive. */
function setAiMood(mood) {
  aiAvatar.dataset.mood = mood;
  monitorStatus.textContent = MOOD_STATUS[mood] || MOOD_STATUS.idle;
  clearTimeout(moodResetTimer);
  if (mood !== "idle") {
    moodResetTimer = setTimeout(() => setAiMood("idle"), 4000);
  }
}

function speak(quip) {
  pushLog(quip.text, "ai");
  setAiMood(quip.mood);
}

const robot1HpBar = document.getElementById("robot1-hp");
const robot1EnergyBar = document.getElementById("robot1-energy");
const robot1Parts = document.getElementById("robot1-parts");
const robot1Efficiency = document.getElementById("robot1-efficiency");
const robot1SpecialStats = document.getElementById("robot1-special-stats");

const robot2HpBar = document.getElementById("robot2-hp");
const robot2EnergyBar = document.getElementById("robot2-energy");
const robot2Parts = document.getElementById("robot2-parts");
const robot2Efficiency = document.getElementById("robot2-efficiency");
const robot2SpecialStats = document.getElementById("robot2-special-stats");
const distanceContainer = document.getElementById("distance-container");
const distanceText = document.getElementById("distance-text");
const player1Sprite = document.getElementById("player1-sprite");
const player2Sprite = document.getElementById("player2-sprite");

const robot1AttackStrength = document.getElementById("robot1-attack-strength");
const robot1ParryStrength = document.getElementById("robot1-parry-strength");
const robot1MoveSpeed = document.getElementById("robot1-move-speed");
const robot2AttackStrength = document.getElementById("robot2-attack-strength");
const robot2ParryStrength = document.getElementById("robot2-parry-strength");
const robot2MoveSpeed = document.getElementById("robot2-move-speed");

function renderSpecialStatIcons(container, stats) {
  container.replaceChildren();

  if (!stats.length) {
    container.textContent = "-";
    return;
  }

  const iconNodes = stats.map((stat) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("special-stat-icon");
    wrapper.classList.add(stat.class);
    const icon = document.createElement("img");
    icon.src = stat.icon;
    icon.alt = stat.label;
    icon.title = `${stat.label}: ${stat.value}`;
    icon.width = 18;
    icon.height = 18;
    icon.style.verticalAlign = "middle";
    wrapper.appendChild(icon);
    return wrapper;
  });

  container.append(...iconNodes);
}

function renderPassiveEffectsWorkshop(container, robot) {
  if (!container || !robot) {
    return;
  }

  container.replaceChildren();

  const effectNodes = robot.availableEffects.map((effect) => {
    const armed = robot[effect.key] || 0;
    const remaining = robot.effectUses[effect.key] || 0;
    const capacity = robot.effectCapacity[effect.key] || 0;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `special-stat-icon ${effect.class}`;
    button.title = `${effect.label}: ${effect.description} (${remaining}/${capacity} uses left)`;
    button.disabled = remaining <= 0;

    const icon = document.createElement("img");
    icon.src = effect.icon;
    icon.alt = effect.label;
    icon.width = 18;
    icon.height = 18;
    icon.style.verticalAlign = "middle";

    const count = document.createElement("span");
    count.textContent = ` x${armed} (${remaining}/${capacity})`;
    count.style.marginLeft = "4px";
    count.style.fontSize = "12px";

    button.addEventListener("click", () => {
      if (!robot.armEffect(effect.key)) {
        return;
      }
      renderPassiveEffectsWorkshop(container, robot);
      renderStats();
      pushLog(`${robot.name} armed passive effect: ${effect.label}`);
      speak(eventQuip("effect"));
    });

    button.append(icon, count);
    return button;
  });

  container.append(...effectNodes);
}

function renderStats() {
  const { robot1, robot2, battle } = state;
  if (!robot1 || !robot2 || !battle) {
    return;
  }

  robot1HpBar.style.width = barWidth(robot1.currentHP, robot1.maxHP);
  robot1EnergyBar.style.width = barWidth(robot1.globalEnergy, robot1.maxEnergy);

  robot1Parts.textContent = robot1.parts.map(p => p.name).join(", ");
  robot1Efficiency.textContent = robot1.efficiency.toFixed(2);

  renderSpecialStatIcons(robot1SpecialStats, robot1.specialStats);

  robot2HpBar.style.width = barWidth(robot2.currentHP, robot2.maxHP);
  robot2EnergyBar.style.width = barWidth(robot2.globalEnergy, robot2.maxEnergy);

  robot2Parts.textContent = robot2.parts.map(p => p.name).join(", ");
  robot2Efficiency.textContent = robot2.efficiency.toFixed(2);

  renderSpecialStatIcons(robot2SpecialStats, robot2.specialStats);

  distanceContainer.style.gap = `${battle.distance * 60}px`;
  distanceText.textContent = "Distance: " + battle.distance.toFixed(2);

  robot1AttackStrength.textContent = robot1.attackStrength(battle.distance).toFixed(1);
  robot1ParryStrength.textContent = robot1.parryStrength().toFixed(1);
  robot1MoveSpeed.textContent = robot1.moveSpeed().toFixed(2);
  robot2AttackStrength.textContent = robot2.attackStrength(battle.distance).toFixed(1);
  robot2ParryStrength.textContent = robot2.parryStrength().toFixed(1);
  robot2MoveSpeed.textContent = robot2.moveSpeed().toFixed(2);
}

/* ----------------------------------------------------------------------------
 * Mission lifecycle
 * ------------------------------------------------------------------------- */

function startBattle(levelId) {
  const level = LEVELS_BY_ID[levelId];
  if (!level) {
    return;
  }

  state.levelId = levelId;
  state.robot1 = new Robot(buildLoadoutParts(), PLAYER_ENERGY_STOCKS, "player");
  state.robot2 = createEnemyForLevel(levelId);
  const TERRAINS = [FloodedCity, Sand, Steel];
  const terrain = new TERRAINS[Math.floor(Math.random() * TERRAINS.length)]();
  state.battle = new Battle(terrain);
  state.rounds = 0;
  state.finished = false;
  state.pendingLoser = null;

  state.battle.setupBattle(state.robot1, state.robot2);
  document.body.style.backgroundColor = state.battle.terrain.themeColor || "";
  battleScreen.style.backgroundImage = state.battle.terrain.image
    ? `url("${state.battle.terrain.image}")`
    : state.battle.terrain.backgroundGradient;

  battleMission.textContent =
    `Mission ${String(levelId).padStart(2, "0")} — ${level.title} vs ${state.robot2.name}`;

  monitorLog.replaceChildren();
  pushLog(`Deployed. Target: ${state.robot2.name}.`);
  speak(eventQuip("deploy"));

  fightBtn.disabled = false;
  resetSpriteFx(player1Sprite);
  resetSpriteFx(player2Sprite);
  player1Sprite.src = state.robot1.image || "images/player1.png";
  player2Sprite.src = state.robot2.image || "images/player2.png";

  renderStats();
  renderPassiveEffectsWorkshop(robot1PassiveEffects, state.robot1);
  showScreen("battle");
}

function resetBattleBackground() {
  document.body.style.backgroundColor = "";
  battleScreen.style.backgroundImage = "";
}

function endBattle(victory) {
  if (state.finished) {
    return;
  }
  state.finished = true;
  fightBtn.disabled = true;
  resetBattleBackground();
  speak(eventQuip(victory ? "victory" : "defeat"));

  const { levelId, robot1, rounds } = state;
  const hpRatio = robot1.maxHP ? robot1.currentHP / robot1.maxHP : 0;
  const firstClear = victory && !isLevelCleared(levelId);
  const rewards = computeRewards({ levelId, victory, hpRatio, rounds, firstClear });

  const prevXp = getProgress().xp;
  const prevCleared = clearedCount();

  if (victory) {
    completeLevel(levelId);
  }
  addRewards(rewards);

  showScreen("results", {
    levelId,
    victory,
    rounds,
    hpRatio,
    rewards,
    prevXp,
    newXp: getProgress().xp,
    unlocked: partsUnlockedBetween(prevCleared, clearedCount()),
  });
}

/** Resolves the outcome after a round, if either machine is out of the fight. */
function checkBattleEnd() {
  const loser = state.pendingLoser;
  if (!loser) {
    return;
  }
  endBattle(loser === state.robot2);
}

/* ----------------------------------------------------------------------------
 * Battle interaction
 * ------------------------------------------------------------------------- */

fightBtn.addEventListener("click", async function () {
  const { robot1, robot2, battle } = state;
  if (state.finished || !robot1) {
    return;
  }

  const robot1HpBefore = robot1.currentHP;
  const robot2HpBefore = robot2.currentHP;
  const robot1EnergyBefore = robot1.globalEnergy;
  const robot2EnergyBefore = robot2.globalEnergy;
  const action1Type = actionInput.value;

  const normalizedAction1 = normalizeAction(action1Type);
  const robot1Direction = resolveDirection(action1Type);
  robot1.allocateEnergy(normalizedAction1);

  const robot2Turn = robot2.chooseTurn(battle.distance, robot1);
  const normalizedAction2 = normalizeAction(robot2Turn.action);
  robot2.allocateEnergy(normalizedAction2);

  fightBtn.disabled = true;
  robot1._miniGameResult = await runMiniGame(robot1.efficiency);
  fightBtn.disabled = state.finished;

  const winner = battle.fight(
    robot1,
    robot2,
    { action1Type: normalizedAction1, direction1: robot1Direction },
    { action2Type: normalizedAction2, direction2: robot2Turn.direction },
  );

  state.rounds += 1;
  console.log(`Round ${state.rounds} resolved. Winner: ${winner || "None"}`);
  blinkSprite(player1Sprite, ACTION_SPRITE_EFFECTS[normalizedAction1]);
  blinkSprite(player2Sprite, ACTION_SPRITE_EFFECTS[normalizedAction2]);
  playActionEffect(player1Sprite, normalizedAction1);
  playActionEffect(player2Sprite, normalizedAction2);

  renderStats();
  renderPassiveEffectsWorkshop(robot1PassiveEffects, robot1);

  showBarDelta(robot1HpBar, robot1.currentHP - robot1HpBefore, 'hp');
  showBarDelta(robot1EnergyBar, robot1.globalEnergy - robot1EnergyBefore, 'energy');
  showBarDelta(robot2HpBar, robot2.currentHP - robot2HpBefore, 'hp');
  showBarDelta(robot2EnergyBar, robot2.globalEnergy - robot2EnergyBefore, 'energy');

  pushLog(
    `Robot 1 -> ${action1Type} | Robot 2 -> ${robot2Turn.action} | ${winner || "Round resolved."}`,
  );

  speak(roundQuip({
    playerAction: action1Type,
    enemyAction: robot2Turn.action,
    playerHpDelta: robot1.currentHP - robot1HpBefore,
    enemyHpDelta: robot2.currentHP - robot2HpBefore,
    playerHpRatio: robot1.maxHP ? robot1.currentHP / robot1.maxHP : 0,
    enemyHpRatio: robot2.maxHP ? robot2.currentHP / robot2.maxHP : 0,
    playerEnergyRatio: robot1.maxEnergy ? robot1.globalEnergy / robot1.maxEnergy : 0,
  }));

  checkBattleEnd();
});

repairKitBtn.addEventListener("click", function () {
  if (state.finished) return;
  new RepairKit(state.robot1).run();
  renderStats();
  pushLog("Robot 1 used Repair Kit.");
  speak(eventQuip("repair"));
});

energyBoosterBtn.addEventListener("click", function () {
  if (state.finished) return;
  new EnergyBooster(state.robot1).run();
  renderStats();
  pushLog("Robot 1 used Energy Booster.");
  speak(eventQuip("energy"));
});

teleporterBtn.addEventListener("click", function () {
  if (state.finished) return;
  new Teleporter(state.battle).run();
  renderStats();
  pushLog("Teleporter activated.");
  speak(eventQuip("teleport"));
});

retreatBtn.addEventListener("click", function () {
  if (!state.finished && !window.confirm("Retreat? The mission is abandoned and you earn nothing.")) {
    return;
  }
  state.finished = true;
  resetBattleBackground();
  showScreen("quests");
});

// A surrender means that machine is out of the fight. The round finishes
// resolving first, then checkBattleEnd() decides the winner.
window.addEventListener(Robot.SURRENDER_FOR_ENERGY_EVENT, (event) => {
  if (!state.pendingLoser) {
    state.pendingLoser = event.detail.robot;
  }
});
window.addEventListener(Robot.SURRENDER_FOR_HP_EVENT, (event) => {
  if (!state.pendingLoser) {
    state.pendingLoser = event.detail.robot;
  }
});
window.addEventListener(Robot.EFFECT_CONSUMED_EVENT, (event) => {
  showEffectConsumed(event.detail.robot, event.detail.effect);
});

/* ----------------------------------------------------------------------------
 * Boot
 * ------------------------------------------------------------------------- */

const goToQuests = () => {resetBattleBackground(); showScreen("quests")};

initTopBar({ onNavigateQuests: goToQuests });
initQuests({ onSelect: (levelId) => showScreen("briefing", levelId) });
initBriefing({ onDeploy: startBattle });
initResults({
  onReplay: startBattle,
  onNext: (levelId) => showScreen("briefing", levelId),
  onWorkshop: (levelId) => showScreen("briefing", levelId),
  onQuests: goToQuests,
});

registerScreen("quests", renderQuests);
registerScreen("briefing", renderBriefing);
registerScreen("results", renderResults);

showScreen("quests");
