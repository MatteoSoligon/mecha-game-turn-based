/**
 * Campaign definition: a linear 12-level quest path grouped in 4 chapters.
 *
 * Every level points at one of the existing faction robots in robots.js, and
 * the order escalates from scout-tier machines to faction bosses so difficulty
 * climbs in step with the parts the workshop unlocks.
 */

import { FACTIONS } from "./robots.js";

export const CHAPTERS = [
  {
    id: 1,
    name: "First Contact",
    subtitle: "Scout patrols on the rust perimeter.",
  },
  {
    id: 2,
    name: "Escalation",
    subtitle: "The factions notice you. They send better machines.",
  },
  {
    id: 3,
    name: "Deep Strike",
    subtitle: "Push into hostile territory. The first warlord waits.",
  },
  {
    id: 4,
    name: "Final War",
    subtitle: "Three faction champions stand between you and the wastes.",
  },
];

/** Human-readable label for the three enemy power tiers. */
export const TIER_LABELS = {
  weak: "Scout",
  medium: "Elite",
  boss: "Boss",
};

export const QUEST_LEVELS = [
  {
    id: 1, chapter: 1, faction: "sentinels", tier: "weak",
    title: "Perimeter Sweep",
    intel: "A lone Sentinel picket guards the outer wall. Slow, heavily shielded, and content to trade at range.",
    tactic: "Its shield is high but its long-range arm is weak up close. Close the distance and swing.",
    baseScrap: 70,
  },
  {
    id: 2, chapter: 1, faction: "reavers", tier: "weak",
    title: "Scrapyard Ambush",
    intel: "Reaver raiders hunt in the scrapyard. This one is fast, fragile, and allergic to patience.",
    tactic: "It commits hard to attacks. Parry once and its opening is yours.",
    baseScrap: 85,
  },
  {
    id: 3, chapter: 1, faction: "technomancers", tier: "weak",
    title: "Signal Tower",
    intel: "A Technomancer calibrator holds the relay. It fights from the middle band and chips away at your efficiency.",
    tactic: "Deny its favourite range: fight at point blank or from max distance.",
    baseScrap: 120,
  },

  {
    id: 4, chapter: 2, faction: "nomads", tier: "weak",
    title: "Dust Run",
    intel: "A Nomad scout refuses to stand still. Light armour, but it will run the clock on your energy.",
    tactic: "Bring Paralize or Escape charges, or you will never land a clean hit.",
    baseScrap: 140,
  },
  {
    id: 5, chapter: 2, faction: "sentinels", tier: "medium",
    title: "The Iron Gate",
    intel: "A Sentinel Guardian: advanced plating, advanced rail, and a counter-attack that punishes greed.",
    tactic: "Attacking into its parry hurts. Move, bait, then punish.",
    baseScrap: 160,
  },
  {
    id: 6, chapter: 2, faction: "reavers", tier: "medium",
    title: "Blood Furnace",
    intel: "A Reaver Slayer with a self-repairing Aegis core. It heals what you take off it.",
    tactic: "Burst it down. Long fights favour the Slayer.",
    baseScrap: 220,
  },

  {
    id: 7, chapter: 3, faction: "technomancers", tier: "medium",
    title: "Fracture Lab",
    intel: "The Techno Architect wrecks your efficiency before it wrecks your hull.",
    tactic: "Pack an Efficiency Fix charge and parry to recalibrate.",
    baseScrap: 250,
  },
  {
    id: 8, chapter: 3, faction: "nomads", tier: "medium",
    title: "Ghost Convoy",
    intel: "A Nomad Ranger on legend-grade raider legs. It flanks, escapes, and never lets you set the range.",
    tactic: "Win the movement war or you lose the fight.",
    baseScrap: 280,
  },
  {
    id: 9, chapter: 3, faction: "sentinels", tier: "boss",
    title: "Sentinel Warlord",
    intel: "Legend plating, legend rail, and enough shield to shrug off a base loadout entirely.",
    tactic: "You need advanced gear minimum. Stack Lethal Attack and commit.",
    baseScrap: 380,
  },

  {
    id: 10, chapter: 4, faction: "reavers", tier: "boss",
    title: "Reaver Executioner",
    intel: "The hardest hitter in the wastes. Legend short-range arm, legend raider legs, and it heals.",
    tactic: "Never let it sit at point blank. Kite, parry, counter.",
    baseScrap: 420,
  },
  {
    id: 11, chapter: 4, faction: "technomancers", tier: "boss",
    title: "Techno Mastermind",
    intel: "Perfectly balanced. It reads your action pattern and answers it.",
    tactic: "Vary your actions: repeating the same one costs extra energy anyway.",
    baseScrap: 460,
  },
  {
    id: 12, chapter: 4, faction: "nomads", tier: "boss",
    title: "Nomad Phantom",
    intel: "The final machine. It will not be where you aim, and it hits from the far edge of the arena.",
    tactic: "Full legend loadout recommended. Control the distance or die tired.",
    baseScrap: 600,
  },
];

export const LEVELS_BY_ID = Object.fromEntries(
  QUEST_LEVELS.map((level) => [level.id, level]),
);

export const TOTAL_LEVELS = QUEST_LEVELS.length;

/** Builds the AI opponent for a quest level. */
export function createEnemyForLevel(levelId) {
  const level = LEVELS_BY_ID[levelId];
  if (!level) {
    return null;
  }
  return FACTIONS[level.faction][level.tier]();
}

export function factionInfo(level) {
  return FACTIONS[level.faction];
}

const FACTION_SPRITE = {
  sentinels: "sentinel",
  reavers: "reaver",
  technomancers: "techno",
  nomads: "nomad",
};

export function levelPortrait(level) {
  return `images/${FACTION_SPRITE[level.faction]}-${level.tier}.png`;
}

export function levelsForChapter(chapterId) {
  return QUEST_LEVELS.filter((level) => level.chapter === chapterId);
}

/* ----------------------------------------------------------------------------
 * Pilot ranks — a prestige track fed by XP. Ranks are cosmetic progression
 * feedback; unlocking parts is gated by cleared quest levels + scrap.
 * ------------------------------------------------------------------------- */

export const RANKS = [
  { xp: 0, name: "Cadet" },
  { xp: 200, name: "Pilot" },
  { xp: 600, name: "Lieutenant" },
  { xp: 1200, name: "Captain" },
  { xp: 2000, name: "Major" },
  { xp: 3200, name: "Commander" },
  { xp: 5000, name: "Ace" },
  { xp: 8000, name: "Legend" },
];

export function rankForXp(xp) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (xp >= RANKS[i].xp) {
      index = i;
    }
  }
  const current = RANKS[index];
  const next = RANKS[index + 1] || null;
  const span = next ? next.xp - current.xp : 1;
  return {
    index,
    name: current.name,
    nextName: next ? next.name : null,
    xpIntoRank: xp - current.xp,
    xpForNextRank: next ? span : 0,
    ratio: next ? Math.min(1, (xp - current.xp) / span) : 1,
  };
}

/* ----------------------------------------------------------------------------
 * Rewards
 * ------------------------------------------------------------------------- */

export const REWARD_RULES = {
  replayMultiplier: 0.4,
  defeatMultiplier: 0.25,
  flawlessHpRatio: 0.8,
  flawlessBonus: 0.5,
  swiftRoundLimit: 6,
  swiftBonus: 0.25,
  xpRatio: 0.6,
};

/**
 * Turns a finished battle into a reward breakdown. Each line is surfaced
 * individually on the results screen so the payout feels earned.
 */
export function computeRewards({ levelId, victory, hpRatio, rounds, firstClear }) {
  const level = LEVELS_BY_ID[levelId];
  const base = level ? level.baseScrap : 0;
  const lines = [];

  if (!victory) {
    const salvage = Math.round(base * REWARD_RULES.defeatMultiplier);
    lines.push({ label: "Salvage recovered", scrap: salvage });
    return { lines, scrap: salvage, xp: Math.round(salvage * 0.3), firstClear: false };
  }

  const payout = firstClear ? base : Math.round(base * REWARD_RULES.replayMultiplier);
  lines.push({
    label: firstClear ? "Mission cleared" : "Mission cleared (replay)",
    scrap: payout,
  });

  let bonus = 0;
  if (hpRatio >= REWARD_RULES.flawlessHpRatio) {
    const amount = Math.round(base * REWARD_RULES.flawlessBonus);
    bonus += amount;
    lines.push({ label: "Flawless hull", scrap: amount, highlight: true });
  }
  if (rounds > 0 && rounds <= REWARD_RULES.swiftRoundLimit) {
    const amount = Math.round(base * REWARD_RULES.swiftBonus);
    bonus += amount;
    lines.push({ label: "Swift takedown", scrap: amount, highlight: true });
  }

  const scrap = payout + bonus;
  return { lines, scrap, xp: Math.round(scrap * REWARD_RULES.xpRatio), firstClear };
}
