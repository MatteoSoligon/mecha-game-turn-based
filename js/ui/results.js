/**
 * Post-battle results screen. Rewards are revealed one line at a time with a
 * counting scrap total, an animated XP bar, and a callout for any parts the
 * clear just unlocked, so progression always lands with a beat.
 */

import { LEVELS_BY_ID, rankForXp } from "../campaign.js";
import { TIERS } from "../catalog.js";
import { nextLevelId } from "../progress.js";

const REVEAL_STEP_MS = 420;
const COUNT_MS = 700;

let els = null;
let handlers = null;
let timers = [];

export function initResults({ onReplay, onNext, onQuests, onWorkshop }) {
  handlers = { onReplay, onNext, onQuests, onWorkshop };
  els = {
    banner: document.getElementById("results-banner"),
    title: document.getElementById("results-title"),
    summary: document.getElementById("results-summary"),
    lines: document.getElementById("results-lines"),
    total: document.getElementById("results-total"),
    totalRow: document.querySelector(".reward-total"),
    xpText: document.getElementById("results-xp-text"),
    xpFill: document.getElementById("results-xp-fill"),
    rankUp: document.getElementById("results-rankup"),
    unlocks: document.getElementById("results-unlocks"),
    actions: document.getElementById("results-actions"),
  };
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function after(ms, fn) {
  timers.push(setTimeout(fn, ms));
}

function countUp(el, to) {
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / COUNT_MS);
    const eased = 1 - (1 - t) * (1 - t);
    el.textContent = String(Math.round(to * eased));
    if (t < 1) {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

function actionButton(label, variant, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `results-btn results-btn--${variant}`;
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

export function renderResults(payload) {
  if (!els) {
    return;
  }

  clearTimers();

  const {
    levelId, victory, rounds, hpRatio, rewards, prevXp, newXp, unlocked,
  } = payload;
  const level = LEVELS_BY_ID[levelId];

  els.banner.dataset.outcome = victory ? "victory" : "defeat";
  els.banner.textContent = victory ? "VICTORY" : "DEFEAT";
  els.title.textContent = `Mission ${String(levelId).padStart(2, "0")} — ${level.title}`;
  els.summary.textContent = victory
    ? `Cleared in ${rounds} round${rounds === 1 ? "" : "s"} · Hull ${Math.round(hpRatio * 100)}%`
    : `Fell after ${rounds} round${rounds === 1 ? "" : "s"} · Salvage recovered`;

  /* Reward lines, revealed in sequence. */
  els.lines.replaceChildren();
  rewards.lines.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "reward-line";
    if (line.highlight) {
      row.classList.add("reward-line--bonus");
    }
    const label = document.createElement("span");
    label.textContent = line.label;
    const value = document.createElement("span");
    value.className = "reward-line-value";
    value.textContent = `+${line.scrap}`;
    row.append(label, value);
    els.lines.appendChild(row);
    after(index * REVEAL_STEP_MS, () => row.classList.add("reward-line--in"));
  });

  const revealDelay = rewards.lines.length * REVEAL_STEP_MS;

  els.total.textContent = "0";
  els.totalRow.classList.remove("reward-total--in");
  after(revealDelay, () => {
    els.totalRow.classList.add("reward-total--in");
    countUp(els.total, rewards.scrap);
  });

  /* XP bar animates from the pre-battle rank position to the new one. */
  const before = rankForXp(prevXp);
  const now = rankForXp(newXp);
  els.xpFill.style.transition = "none";
  els.xpFill.style.width = `${Math.round(before.ratio * 100)}%`;
  els.xpText.textContent = `${now.name} · +${rewards.xp} XP`;
  els.rankUp.hidden = true;

  after(revealDelay + 120, () => {
    els.xpFill.style.transition = "width 900ms ease-out";
    // A rank-up resets the bar, so fill it to the top before showing the new one.
    els.xpFill.style.width = now.index > before.index ? "100%" : `${Math.round(now.ratio * 100)}%`;
  });

  if (now.index > before.index) {
    after(revealDelay + 1100, () => {
      els.rankUp.hidden = false;
      els.rankUp.textContent = `★ RANK UP — ${now.name}`;
      els.xpFill.style.transition = "none";
      els.xpFill.style.width = "0%";
      after(60, () => {
        els.xpFill.style.transition = "width 700ms ease-out";
        els.xpFill.style.width = `${Math.round(now.ratio * 100)}%`;
      });
    });
  }

  /* Newly unlocked parts. */
  els.unlocks.replaceChildren();
  els.unlocks.hidden = !unlocked.length;
  if (unlocked.length) {
    const heading = document.createElement("h3");
    heading.className = "unlock-heading";
    heading.textContent = "New blueprints available in the workshop";
    els.unlocks.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "unlock-grid";
    unlocked.forEach((entry, index) => {
      const chip = document.createElement("div");
      chip.className = "unlock-chip";
      const name = document.createElement("span");
      name.className = "unlock-chip-name";
      name.textContent = entry.label;
      const tier = document.createElement("span");
      tier.className = `tier-badge tier-badge--${entry.tier}`;
      tier.textContent = TIERS[entry.tier].label;
      const cost = document.createElement("span");
      cost.className = "unlock-chip-cost";
      cost.textContent = `${entry.cost} scrap`;
      chip.append(name, tier, cost);
      grid.appendChild(chip);
      after(revealDelay + 400 + index * 140, () => chip.classList.add("unlock-chip--in"));
    });
    els.unlocks.appendChild(grid);
  }

  /* Actions. */
  els.actions.replaceChildren();
  const next = nextLevelId();
  if (victory && next) {
    els.actions.appendChild(actionButton("Next Mission ▶", "primary", () => handlers.onNext(next)));
  } else if (victory) {
    els.actions.appendChild(actionButton("Campaign Complete", "primary", handlers.onQuests));
  } else {
    els.actions.appendChild(actionButton("Retry ↻", "primary", () => handlers.onReplay(levelId)));
  }
  els.actions.appendChild(actionButton("Workshop", "ghost", () => handlers.onWorkshop(levelId)));
  els.actions.appendChild(actionButton("Quest Path", "ghost", handlers.onQuests));
}
