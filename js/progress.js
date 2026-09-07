/**
 * Player progression: scrap, XP, cleared quest levels, owned parts and the
 * equipped loadout. Persisted to localStorage so the campaign survives a
 * reload. Every mutator saves and notifies subscribers.
 */

import {
  PARTS_BY_ID,
  PARTS_CATALOG,
  STARTER_LOADOUT,
  STARTER_PART_IDS,
  SLOT_KEYS,
  createPart,
} from "./catalog.js";
import { TOTAL_LEVELS } from "./campaign.js";

const STORAGE_KEY = "mecha-campaign-v1";

function defaultState() {
  return {
    version: 1,
    scrap: 0,
    xp: 0,
    owned: [...STARTER_PART_IDS],
    loadout: { ...STARTER_LOADOUT },
    cleared: [],
  };
}

function sanitize(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const owned = Array.isArray(raw.owned)
    ? raw.owned.filter((id) => PARTS_BY_ID[id])
    : [];
  base.owned = [...new Set([...STARTER_PART_IDS, ...owned])];

  base.scrap = Number.isFinite(raw.scrap) ? Math.max(0, Math.floor(raw.scrap)) : 0;
  base.xp = Number.isFinite(raw.xp) ? Math.max(0, Math.floor(raw.xp)) : 0;

  base.cleared = Array.isArray(raw.cleared)
    ? [...new Set(raw.cleared.filter((id) => Number.isInteger(id) && id >= 1 && id <= TOTAL_LEVELS))]
    : [];

  for (const slot of SLOT_KEYS) {
    const candidate = raw.loadout && raw.loadout[slot];
    const entry = PARTS_BY_ID[candidate];
    if (entry && entry.slot === slot && base.owned.includes(candidate)) {
      base.loadout[slot] = candidate;
    }
  }

  return base;
}

function read() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultState();
  }
}

let state = read();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode / quota): keep playing in memory.
  }
  for (const listener of listeners) {
    listener(state);
  }
}

export function onProgressChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProgress() {
  return state;
}

/* ── Quest levels ─────────────────────────────────────────────────────── */

export function clearedCount() {
  return state.cleared.length;
}

export function isLevelCleared(levelId) {
  return state.cleared.includes(levelId);
}

/** Linear path: level 1 is always open, the rest need the previous clear. */
export function isLevelUnlocked(levelId) {
  return levelId === 1 || isLevelCleared(levelId - 1);
}

export function nextLevelId() {
  for (let id = 1; id <= TOTAL_LEVELS; id += 1) {
    if (!isLevelCleared(id)) {
      return id;
    }
  }
  return null;
}

/** Records a clear. Returns true only the first time this level is beaten. */
export function completeLevel(levelId) {
  if (isLevelCleared(levelId)) {
    return false;
  }
  state.cleared.push(levelId);
  state.cleared.sort((a, b) => a - b);
  persist();
  return true;
}

/* ── Economy ──────────────────────────────────────────────────────────── */

export function addRewards({ scrap = 0, xp = 0 }) {
  state.scrap += Math.max(0, Math.round(scrap));
  state.xp += Math.max(0, Math.round(xp));
  persist();
}

/* ── Parts ────────────────────────────────────────────────────────────── */

export function ownsPart(id) {
  return state.owned.includes(id);
}

/** A part is purchasable once enough quest levels have been cleared. */
export function isPartUnlocked(id) {
  const entry = PARTS_BY_ID[id];
  return Boolean(entry) && clearedCount() >= entry.unlockLevel;
}

export function partStatus(id) {
  const entry = PARTS_BY_ID[id];
  if (!entry) {
    return "missing";
  }
  if (state.loadout[entry.slot] === id) {
    return "equipped";
  }
  if (ownsPart(id)) {
    return "owned";
  }
  if (!isPartUnlocked(id)) {
    return "locked";
  }
  return state.scrap >= entry.cost ? "buyable" : "unaffordable";
}

export function buyPart(id) {
  const entry = PARTS_BY_ID[id];
  if (!entry || ownsPart(id) || !isPartUnlocked(id) || state.scrap < entry.cost) {
    return false;
  }
  state.scrap -= entry.cost;
  state.owned.push(id);
  persist();
  return true;
}

export function equipPart(id) {
  const entry = PARTS_BY_ID[id];
  if (!entry || !ownsPart(id)) {
    return false;
  }
  state.loadout[entry.slot] = id;
  persist();
  return true;
}

export function equippedIds() {
  return SLOT_KEYS.map((slot) => state.loadout[slot]);
}

/** Fresh Part instances for the equipped loadout, ready for a new Robot. */
export function buildLoadoutParts() {
  return equippedIds().map((id) => createPart(id)).filter(Boolean);
}

/**
 * Catalog entries that became purchasable when the cleared count went from
 * `before` to `after` — used to celebrate new unlocks on the results screen.
 */
export function partsUnlockedBetween(before, after) {
  if (after <= before) {
    return [];
  }
  return PARTS_CATALOG.filter(
    (entry) => entry.unlockLevel > before && entry.unlockLevel <= after,
  );
}

export function resetProgress() {
  state = defaultState();
  persist();
}
