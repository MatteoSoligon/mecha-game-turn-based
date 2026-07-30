import { Battle } from "./battle.js";
import { getRandomRobot } from "./robots.js";
import { EnergyBooster, RepairKit, Teleporter } from "./item.js";
import {
  ShortRangeArm,
  MediumRangeArm,
  BulwarkTorso,
  AegisTorso,
  SprinterLegs,
  RaiderLegs,
} from "./parts.js";
import { Robot, AIRobot } from "./robot.js";
import { FloodedCity } from "./terrain.js";
import { normalizeAction, resolveDirection } from "./actions.js";
import { PASSIVE_EFFECTS_BY_KEY } from "./effects.js";
import { runMiniGame } from "./minigame.js";

function absoluteWidth(value, cap = 110) {
  return Math.max(0, Math.min(cap, Math.round(value * 2)));
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
  if (!sprite) {
    return;
  }

  sprite.classList.remove("sprite-blink-red", "sprite-blink-blue");
  void sprite.offsetWidth;
  sprite.classList.add(effectClass);
}

function spriteForRobot(robot) {
  if (robot === robot1) {
    return player1Sprite;
  }
  if (robot === robot2) {
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

const robot1 = new Robot([
  new ShortRangeArm(),
  new BulwarkTorso(),
  new SprinterLegs(),
], {
  attack: 0.4,
  parry: 0.5,
  move: 0.1,
}, 'player');

const robot2 = getRandomRobot();



const battle = new Battle(new FloodedCity());
const actionInput = document.getElementById("robot1-action");
const fightBtn = document.getElementById("fight-btn");
const repairKitBtn = document.getElementById("repair-kit-btn");
const energyBoosterBtn = document.getElementById("energy-booster-btn");
const teleporterBtn = document.getElementById("teleporter-btn");
const resultText = document.getElementById("round-result");
const robot1PassiveEffects = document.getElementById("robot1-passive-effects");

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
  if (!container) {
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
      resultText.textContent = `${robot.name} armed passive effect: ${effect.label}`;
    });

    button.append(icon, count);
    return button;
  });

  container.append(...effectNodes);
}

function renderStats() {
  const robot1MaxEnergy = robot1.maxEnergy;
  const robot2MaxEnergy = robot2.maxEnergy;

  robot1HpBar.style.width = `${absoluteWidth(robot1.currentHP)}px`;

  robot1EnergyBar.style.width = `${absoluteWidth(robot1.globalEnergy)}px`;

  robot1Parts.textContent = robot1.parts.map(p => p.name).join(", ");
  robot1Efficiency.textContent = robot1.efficiency.toFixed(2);

  renderSpecialStatIcons(robot1SpecialStats, robot1.specialStats);

  robot2HpBar.style.width = `${absoluteWidth(robot2.currentHP)}px`;

  robot2EnergyBar.style.width = `${absoluteWidth(robot2.globalEnergy)}px`;

  robot2Parts.textContent = robot2.parts.map(p => p.name).join(", ");
  robot2Efficiency.textContent = robot2.efficiency.toFixed(2);

  renderSpecialStatIcons(robot2SpecialStats, robot2.specialStats);

  distanceContainer.style.gap = `${battle.distance * 60}px`;
  distanceText.textContent = "Distance: " + battle.distance.toFixed(2);

  robot1AttackStrength.textContent = robot1.attackStrength(battle.distance);
  robot1ParryStrength.textContent = robot1.parryStrength();
  robot1MoveSpeed.textContent = robot1.moveSpeed().toFixed(2);
  robot2AttackStrength.textContent = robot2.attackStrength(battle.distance);
  robot2ParryStrength.textContent = robot2.parryStrength();
  robot2MoveSpeed.textContent = robot2.moveSpeed().toFixed(2);
}


battle.setupBattle(robot1, robot2);
document.body.style.background = battle.terrain.backgroundGradient;
console.log("Battle setup complete. Terrain: " + battle.terrain.constructor.name);

fightBtn.addEventListener("click", async function () {
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
  fightBtn.disabled = false;

  console.log(
    "Robot 2 chose: " + robot2Turn.action + " with direction ",
    robot2Turn.direction,
  );
  const winner = battle.fight(
    robot1,
    robot2,
    { action1Type: normalizedAction1, direction1: robot1Direction },
    { action2Type: normalizedAction2, direction2: robot2Turn.direction },
  );

  if (robot1.currentHP < robot1HpBefore) {
    blinkSprite(player1Sprite, "sprite-blink-red");
  }

  if (robot2.currentHP < robot2HpBefore) {
    blinkSprite(player2Sprite, "sprite-blink-red");
  }

  if (normalizedAction1 === "parry" && winner === "Robot 1 wins!") {
    blinkSprite(player1Sprite, "sprite-blink-blue");
  }

  if (normalizedAction2 === "parry" && winner === "Robot 2 wins!") {
    blinkSprite(player2Sprite, "sprite-blink-blue");
  }

  renderStats();
  renderPassiveEffectsWorkshop(robot1PassiveEffects, robot1);

  showBarDelta(robot1HpBar, robot1.currentHP - robot1HpBefore, 'hp');
  showBarDelta(robot1EnergyBar, robot1.globalEnergy - robot1EnergyBefore, 'energy');
  showBarDelta(robot2HpBar, robot2.currentHP - robot2HpBefore, 'hp');
  showBarDelta(robot2EnergyBar, robot2.globalEnergy - robot2EnergyBefore, 'energy');

  resultText.textContent =
    "Robot 1 -> " +
    action1Type +
    " | Robot 2 -> " +
    robot2Turn.action +
    " | " +
    (winner || "Round resolved.");
});

repairKitBtn.addEventListener("click", function () {
  new RepairKit(robot1).run();
  renderStats();
  resultText.textContent = "Robot 1 used Repair Kit.";
});

energyBoosterBtn.addEventListener("click", function () {
  new EnergyBooster(robot1).run();
  renderStats();
  resultText.textContent = "Robot 1 used Energy Booster.";
});

teleporterBtn.addEventListener("click", function () {
  new Teleporter(battle).run();
  renderStats();
  resultText.textContent = "Teleporter activated.";
});

window.addEventListener(Robot.SURRENDER_FOR_ENERGY_EVENT, (event) => {
  alert("Robot surrendered due to low energy! " + event.detail.robot.name);
});
window.addEventListener(Robot.SURRENDER_FOR_HP_EVENT, (event) => {
  alert("Robot surrendered due to low HP! " + event.detail.robot.name);
});
window.addEventListener(Robot.EFFECT_CONSUMED_EVENT, (event) => {
  showEffectConsumed(event.detail.robot, event.detail.effect);
});

renderStats();
renderPassiveEffectsWorkshop(robot1PassiveEffects, robot1);
player1Sprite.src = robot1.image || "images/player1.png"; // fallback
player2Sprite.src = robot2.image || "images/player2.png"; // fallback