/**
 * Persistent resource bar: scrap, pilot rank + XP progress, and navigation.
 * Re-renders automatically whenever progression changes.
 */

import { rankForXp } from "../campaign.js";
import { getProgress, onProgressChange, resetProgress } from "../progress.js";

let els = null;
let navigate = null;

export function initTopBar({ onNavigateQuests }) {
  navigate = onNavigateQuests;

  els = {
    root: document.getElementById("top-bar"),
    back: document.getElementById("topbar-back"),
    scrap: document.getElementById("topbar-scrap"),
    rank: document.getElementById("topbar-rank"),
    rankNext: document.getElementById("topbar-rank-next"),
    xpFill: document.getElementById("topbar-xp-fill"),
    reset: document.getElementById("topbar-reset"),
  };

  els.back.addEventListener("click", () => navigate());
  els.reset.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Reset all campaign progress? Scrap, unlocked parts and cleared missions will be lost.",
    );
    if (confirmed) {
      resetProgress();
      navigate();
    }
  });

  onProgressChange(renderTopBar);
  renderTopBar();
}

export function renderTopBar() {
  if (!els) {
    return;
  }

  const progress = getProgress();
  const rank = rankForXp(progress.xp);

  els.scrap.textContent = progress.scrap.toLocaleString();
  els.rank.textContent = rank.name;
  els.rankNext.textContent = rank.nextName
    ? `${rank.xpIntoRank}/${rank.xpForNextRank} to ${rank.nextName}`
    : "Max rank";
  els.xpFill.style.width = `${Math.round(rank.ratio * 100)}%`;
}

/** Flashes the scrap counter so spending/earning is impossible to miss. */
export function pulseScrap() {
  if (!els) {
    return;
  }
  els.scrap.classList.remove("resource-value--pulse");
  void els.scrap.offsetWidth;
  els.scrap.classList.add("resource-value--pulse");
}
