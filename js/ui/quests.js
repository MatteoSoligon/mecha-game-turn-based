/**
 * Quest path screen: chapters of mission nodes on a linear campaign track.
 * Cleared nodes are marked, the next playable node is highlighted, and later
 * nodes stay locked until the previous mission is beaten.
 */

import {
  CHAPTERS,
  TIER_LABELS,
  TOTAL_LEVELS,
  levelPortrait,
  levelsForChapter,
  factionInfo,
} from "../campaign.js";
import {
  clearedCount,
  isLevelCleared,
  isLevelUnlocked,
  nextLevelId,
} from "../progress.js";

let container = null;
let onSelectLevel = null;
let progressLabel = null;

export function initQuests({ onSelect }) {
  container = document.getElementById("quest-chapters");
  progressLabel = document.getElementById("quest-progress");
  onSelectLevel = onSelect;
}

function buildNode(level) {
  const cleared = isLevelCleared(level.id);
  const unlocked = isLevelUnlocked(level.id);
  const isNext = nextLevelId() === level.id;

  const node = document.createElement("button");
  node.type = "button";
  node.className = "quest-node";
  node.dataset.state = cleared ? "cleared" : unlocked ? "open" : "locked";
  if (isNext) {
    node.classList.add("quest-node--next");
  }
  node.disabled = !unlocked;

  const index = document.createElement("span");
  index.className = "quest-node-index";
  index.textContent = String(level.id).padStart(2, "0");

  const portrait = document.createElement("div");
  portrait.className = "quest-node-portrait";
  if (unlocked) {
    const img = document.createElement("img");
    img.src = levelPortrait(level);
    img.alt = "";
    portrait.appendChild(img);
  } else {
    portrait.textContent = "?";
  }

  const title = document.createElement("span");
  title.className = "quest-node-title";
  title.textContent = unlocked ? level.title : "Classified";

  const meta = document.createElement("span");
  meta.className = "quest-node-meta";
  meta.textContent = unlocked
    ? `${factionInfo(level).name} · ${TIER_LABELS[level.tier]}`
    : `Clear mission ${String(level.id - 1).padStart(2, "0")}`;

  const reward = document.createElement("span");
  reward.className = "quest-node-reward";
  reward.textContent = unlocked ? `${level.baseScrap} scrap` : "";

  const badge = document.createElement("span");
  badge.className = "quest-node-badge";
  badge.textContent = cleared ? "CLEARED" : isNext ? "NEXT" : unlocked ? "OPEN" : "LOCKED";

  node.append(index, portrait, title, meta, reward, badge);
  node.addEventListener("click", () => onSelectLevel(level.id));
  return node;
}

export function renderQuests() {
  if (!container) {
    return;
  }

  progressLabel.textContent = `${clearedCount()} / ${TOTAL_LEVELS} missions cleared`;
  container.replaceChildren();

  for (const chapter of CHAPTERS) {
    const levels = levelsForChapter(chapter.id);
    const done = levels.filter((level) => isLevelCleared(level.id)).length;

    const block = document.createElement("section");
    block.className = "quest-chapter";
    if (!isLevelUnlocked(levels[0].id)) {
      block.classList.add("quest-chapter--locked");
    }

    const header = document.createElement("div");
    header.className = "quest-chapter-header";

    const name = document.createElement("h2");
    name.className = "quest-chapter-name";
    name.textContent = `Chapter ${chapter.id} — ${chapter.name}`;

    const count = document.createElement("span");
    count.className = "quest-chapter-count";
    count.textContent = `${done}/${levels.length}`;

    const sub = document.createElement("p");
    sub.className = "quest-chapter-sub";
    sub.textContent = chapter.subtitle;

    header.append(name, count);

    const track = document.createElement("div");
    track.className = "quest-track";
    track.append(...levels.map(buildNode));

    block.append(header, sub, track);
    container.appendChild(block);
  }
}
