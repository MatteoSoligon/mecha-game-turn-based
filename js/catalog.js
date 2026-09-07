/**
 * Shop catalog for every equippable part.
 *
 * Each entry pairs a part class with the progression data the campaign needs:
 * which slot it fills, how much scrap it costs, and how many quest levels must
 * be cleared before it appears in the workshop. Unlock levels rise with the
 * tier so the player's gear grows alongside the enemies they face.
 */

import {
  ShortRangeArm, ShortRangeArmAdvanced, ShortRangeArmLegend,
  MediumRangeArm, MediumRangeArmAdvanced, MediumRangeArmLegend,
  LongRangeArm, LongRangeArmAdvanced, LongRangeArmLegend,
  BulwarkTorso, BulwarkTorsoAdvanced, BulwarkTorsoLegend,
  AegisTorso, AegisTorsoAdvanced, AegisTorsoLegend,
  MenderTorso, MenderTorsoAdvanced, MenderTorsoLegend,
  SprinterLegs, SprinterLegsAdvanced, SprinterLegsLegend,
  RaiderLegs, RaiderLegsAdvanced, RaiderLegsLegend,
  EvaderLegs, EvaderLegsAdvanced, EvaderLegsLegend,
} from "./parts.js";

export const SLOTS = [
  { key: "arm", label: "Arm", accent: "attack-icon" },
  { key: "torso", label: "Torso", accent: "parry-icon" },
  { key: "legs", label: "Legs", accent: "move-icon" },
];

export const SLOT_KEYS = SLOTS.map((slot) => slot.key);

export const TIERS = {
  base: { key: "base", label: "Base" },
  advanced: { key: "advanced", label: "Advanced" },
  legend: { key: "legend", label: "Legend" },
};

export const PARTS_CATALOG = [
  /* ── Arms ────────────────────────────────────────────────────────────── */
  {
    id: "short-range-arm", slot: "arm", tier: "base", family: "Short Range",
    label: "Short Range Arm", ctor: ShortRangeArm, cost: 0, unlockLevel: 0,
    blurb: "Brutal at point blank, useless from afar. Grants Lethal Attack.",
  },
  {
    id: "medium-range-arm", slot: "arm", tier: "base", family: "Medium Range",
    label: "Medium Range Arm", ctor: MediumRangeArm, cost: 60, unlockLevel: 0,
    blurb: "Steady damage in the mid band. Grants Efficiency Damage + Paralize.",
  },
  {
    id: "long-range-arm", slot: "arm", tier: "base", family: "Long Range",
    label: "Long Range Arm", ctor: LongRangeArm, cost: 70, unlockLevel: 1,
    blurb: "Rewards keeping your distance. Grants Paralize.",
  },
  {
    id: "short-range-arm-advanced", slot: "arm", tier: "advanced", family: "Short Range",
    label: "Short Range Arm", ctor: ShortRangeArmAdvanced, cost: 160, unlockLevel: 3,
    blurb: "Reinforced piston. Heavier hits and two Lethal Attack charges.",
  },
  {
    id: "medium-range-arm-advanced", slot: "arm", tier: "advanced", family: "Medium Range",
    label: "Medium Range Arm", ctor: MediumRangeArmAdvanced, cost: 170, unlockLevel: 5,
    blurb: "Tuned barrel. Two charges of both attack effects.",
  },
  {
    id: "long-range-arm-advanced", slot: "arm", tier: "advanced", family: "Long Range",
    label: "Long Range Arm", ctor: LongRangeArmAdvanced, cost: 170, unlockLevel: 6,
    blurb: "Extended rail. More damage and two Paralize charges.",
  },
  {
    id: "short-range-arm-legend", slot: "arm", tier: "legend", family: "Short Range",
    label: "Short Range Arm", ctor: ShortRangeArmLegend, cost: 420, unlockLevel: 8,
    blurb: "Executioner-grade. The hardest hit in the game, three charges.",
  },
  {
    id: "medium-range-arm-legend", slot: "arm", tier: "legend", family: "Medium Range",
    label: "Medium Range Arm", ctor: MediumRangeArmLegend, cost: 430, unlockLevel: 9,
    blurb: "Master-crafted. Strong everywhere, three charges of each effect.",
  },
  {
    id: "long-range-arm-legend", slot: "arm", tier: "legend", family: "Long Range",
    label: "Long Range Arm", ctor: LongRangeArmLegend, cost: 430, unlockLevel: 11,
    blurb: "Siege cannon. Locks the enemy down from max range, three charges.",
  },

  /* ── Torsos ──────────────────────────────────────────────────────────── */
  {
    id: "bulwark-torso", slot: "torso", tier: "base", family: "Bulwark",
    label: "Bulwark Torso", ctor: BulwarkTorso, cost: 0, unlockLevel: 0,
    blurb: "Heavy plating, best shield. Grants Counter Attack.",
  },
  {
    id: "aegis-torso", slot: "torso", tier: "base", family: "Aegis",
    label: "Aegis Torso", ctor: AegisTorso, cost: 80, unlockLevel: 1,
    blurb: "Balanced frame with a big reactor. Grants Efficiency Fix + HP Recover.",
  },
  {
    id: "mender-torso", slot: "torso", tier: "base", family: "Mender",
    label: "Mender Torso", ctor: MenderTorso, cost: 80, unlockLevel: 2,
    blurb: "Field-medic core. Huge energy pool. Grants HP Recover.",
  },
  {
    id: "bulwark-torso-advanced", slot: "torso", tier: "advanced", family: "Bulwark",
    label: "Bulwark Torso", ctor: BulwarkTorsoAdvanced, cost: 180, unlockLevel: 4,
    blurb: "Layered armour. More HP, more shield, two counters.",
  },
  {
    id: "aegis-torso-advanced", slot: "torso", tier: "advanced", family: "Aegis",
    label: "Aegis Torso", ctor: AegisTorsoAdvanced, cost: 190, unlockLevel: 5,
    blurb: "Adaptive plating. Two charges of self-repair and recalibration.",
  },
  {
    id: "mender-torso-advanced", slot: "torso", tier: "advanced", family: "Mender",
    label: "Mender Torso", ctor: MenderTorsoAdvanced, cost: 190, unlockLevel: 7,
    blurb: "Extended nanite tanks. Long fights become winnable.",
  },
  {
    id: "bulwark-torso-legend", slot: "torso", tier: "legend", family: "Bulwark",
    label: "Bulwark Torso", ctor: BulwarkTorsoLegend, cost: 450, unlockLevel: 8,
    blurb: "Warlord chassis. Punishing to attack into, three counters.",
  },
  {
    id: "aegis-torso-legend", slot: "torso", tier: "legend", family: "Aegis",
    label: "Aegis Torso", ctor: AegisTorsoLegend, cost: 460, unlockLevel: 10,
    blurb: "Perfect balance of armour, energy and self-repair.",
  },
  {
    id: "mender-torso-legend", slot: "torso", tier: "legend", family: "Mender",
    label: "Mender Torso", ctor: MenderTorsoLegend, cost: 460, unlockLevel: 11,
    blurb: "Endless reactor. Three heals and energy for days.",
  },

  /* ── Legs ────────────────────────────────────────────────────────────── */
  {
    id: "sprinter-legs", slot: "legs", tier: "base", family: "Sprinter",
    label: "Sprinter Legs", ctor: SprinterLegs, cost: 0, unlockLevel: 0,
    blurb: "Fastest frame. Grants Dodge Attack.",
  },
  {
    id: "raider-legs", slot: "legs", tier: "base", family: "Raider",
    label: "Raider Legs", ctor: RaiderLegs, cost: 60, unlockLevel: 2,
    blurb: "Aggressive footwork. Grants Flank Attack + Escape.",
  },
  {
    id: "evader-legs", slot: "legs", tier: "base", family: "Evader",
    label: "Evader Legs", ctor: EvaderLegs, cost: 60, unlockLevel: 3,
    blurb: "Slow but slippery. Grants Escape.",
  },
  {
    id: "sprinter-legs-advanced", slot: "legs", tier: "advanced", family: "Sprinter",
    label: "Sprinter Legs", ctor: SprinterLegsAdvanced, cost: 150, unlockLevel: 4,
    blurb: "Servo-boosted. Faster, with two dodges.",
  },
  {
    id: "raider-legs-advanced", slot: "legs", tier: "advanced", family: "Raider",
    label: "Raider Legs", ctor: RaiderLegsAdvanced, cost: 160, unlockLevel: 6,
    blurb: "Predatory stride. Two flanks and two escapes.",
  },
  {
    id: "evader-legs-advanced", slot: "legs", tier: "advanced", family: "Evader",
    label: "Evader Legs", ctor: EvaderLegsAdvanced, cost: 150, unlockLevel: 7,
    blurb: "Phase-step actuators. Nobody pins you down.",
  },
  {
    id: "sprinter-legs-legend", slot: "legs", tier: "legend", family: "Sprinter",
    label: "Sprinter Legs", ctor: SprinterLegsLegend, cost: 380, unlockLevel: 9,
    blurb: "Blink-speed frame. Three dodges, top speed in the game.",
  },
  {
    id: "raider-legs-legend", slot: "legs", tier: "legend", family: "Raider",
    label: "Raider Legs", ctor: RaiderLegsLegend, cost: 400, unlockLevel: 10,
    blurb: "Executioner stride. Three flanks, three escapes.",
  },
  {
    id: "evader-legs-legend", slot: "legs", tier: "legend", family: "Evader",
    label: "Evader Legs", ctor: EvaderLegsLegend, cost: 390, unlockLevel: 12,
    blurb: "Phantom rig. The final unlock: movement becomes untouchable.",
  },
];

export const PARTS_BY_ID = Object.fromEntries(
  PARTS_CATALOG.map((entry) => [entry.id, entry]),
);

/** Parts the player owns from the very first battle. */
export const STARTER_PART_IDS = PARTS_CATALOG
  .filter((entry) => entry.cost === 0)
  .map((entry) => entry.id);

export const STARTER_LOADOUT = {
  arm: "short-range-arm",
  torso: "bulwark-torso",
  legs: "sprinter-legs",
};

export function createPart(id) {
  const entry = PARTS_BY_ID[id];
  return entry ? new entry.ctor() : null;
}

export function partsForSlot(slot) {
  return PARTS_CATALOG.filter((entry) => entry.slot === slot);
}
