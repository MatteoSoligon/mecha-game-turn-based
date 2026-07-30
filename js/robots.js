/**
 * Robot Lore Factory - Creates thematic robot configurations
 * Each lore has 3 tiers: Weak, Medium, Boss
 */

import { Robot, AIRobot } from "./robot.js";
import {
  LongRangeArm, LongRangeArmAdvanced, LongRangeArmLegend,
  ShortRangeArm, ShortRangeArmAdvanced, ShortRangeArmLegend,
  MediumRangeArm, MediumRangeArmAdvanced, MediumRangeArmLegend,
  BulwarkTorso, BulwarkTorsoAdvanced, BulwarkTorsoLegend,
  AegisTorso, AegisTorsoAdvanced, AegisTorsoLegend,
  MenderTorso, MenderTorsoAdvanced, MenderTorsoLegend,
  SprinterLegs, SprinterLegsAdvanced, SprinterLegsLegend,
  RaiderLegs, RaiderLegsAdvanced, RaiderLegsLegend,
  EvaderLegs, EvaderLegsAdvanced, EvaderLegsLegend,
} from "./parts.js";

// ============================================================================
// THE SENTINELS — Ancient Guardian Faction
// Heavy defenders focused on protection and durability. They absorb damage
// and counter-strike with overwhelming force.
// ============================================================================

export function createSentinelWeak() {
  const parts = [
    new BulwarkTorso(),
    new LongRangeArm(),
    new EvaderLegs(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.3, parry: 0.6, move: 0.1 },
    "Sentinel Scout",
    undefined,
    "images/sentinel-weak.png"
  );
}

export function createSentinelMedium() {
  const parts = [
    new BulwarkTorsoAdvanced(),
    new LongRangeArmAdvanced(),
    new SprinterLegs(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.4, parry: 0.65, move: 0.15 },
    "Sentinel Guardian",
    undefined,
    "images/sentinel-medium.png"
  );
}

export function createSentinelBoss() {
  const parts = [
    new BulwarkTorsoLegend(),
    new LongRangeArmLegend(),
    new SprinterLegsAdvanced(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.5, parry: 0.75, move: 0.25 },
    "Sentinel Warlord",
    undefined,
    "images/sentinel-boss.png"
  );
}

// ============================================================================
// THE REAVERS — Aggressive Striker Faction
// Fast, aggressive close-range fighters that deal heavy burst damage and
// self-repair in combat. Relentless offense with tactical healing.
// ============================================================================

export function createReaverWeak() {
  const parts = [
    new AegisTorso(),
    new ShortRangeArm(),
    new RaiderLegs(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.65, parry: 0.25, move: 0.1 },
    "Reaver Scout",
    undefined,
    "images/reaver-weak.png"
  );
}

export function createReaverMedium() {
  const parts = [
    new AegisTorsoAdvanced(),
    new ShortRangeArmAdvanced(),
    new RaiderLegsAdvanced(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.7, parry: 0.3, move: 0.2 },
    "Reaver Slayer",
    undefined,
    "images/reaver-medium.png"
  );
}

export function createReaverBoss() {
  const parts = [
    new AegisTorsoLegend(),
    new ShortRangeArmLegend(),
    new RaiderLegsLegend(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.8, parry: 0.4, move: 0.3 },
    "Reaver Executioner",
    undefined,
    "images/reaver-boss.png"
  );
}

// ============================================================================
// THE TECHNOMANCERS — Balanced Hybrid Tactician Faction
// Versatile mid-range specialists with balanced offense/defense and
// efficiency management. Masters of tactical adaptation.
// ============================================================================

export function createTechnoWeak() {
  const parts = [
    new MenderTorso(),
    new MediumRangeArm(),
    new SprinterLegs(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.45, parry: 0.35, move: 0.2 },
    "Techno Calibrator",
    undefined,
    "images/techno-weak.png"
  );
}

export function createTechnoMedium() {
  const parts = [
    new MenderTorsoAdvanced(),
    new MediumRangeArmAdvanced(),
    new SprinterLegsAdvanced(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.5, parry: 0.4, move: 0.25 },
    "Techno Architect",
    undefined,
    "images/techno-medium.png"
  );
}

export function createTechnoBoss() {
  const parts = [
    new MenderTorsoLegend(),
    new MediumRangeArmLegend(),
    new SprinterLegsLegend(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.6, parry: 0.5, move: 0.35 },
    "Techno Mastermind",
    undefined,
    "images/techno-boss.png"
  );
}

// ============================================================================
// THE NOMADS — Evasive Scout Faction
// Highly mobile hit-and-run specialists that prioritize speed, escape, and
// self-healing over armor. Masters of positioning and retreat.
// ============================================================================

export function createNomadWeak() {
  const parts = [
    new MenderTorso(),
    new LongRangeArm(),
    new SprinterLegsAdvanced(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.35, parry: 0.2, move: 0.45 },
    "Nomad Scout",
    undefined,
    "images/nomad-weak.png"
  );
}

export function createNomadMedium() {
  const parts = [
    new AegisTorsoAdvanced(),
    new MediumRangeArmAdvanced(),
    new RaiderLegsLegend(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.45, parry: 0.25, move: 0.55 },
    "Nomad Ranger",
    undefined,
    "images/nomad-medium.png"
  );
}

export function createNomadBoss() {
  const parts = [
    new MenderTorsoAdvanced(),
    new LongRangeArmLegend(),
    new RaiderLegsLegend(),
  ];
  return new AIRobot(
    parts,
    { attack: 0.5, parry: 0.3, move: 0.65 },
    "Nomad Phantom",
    undefined,
    "images/nomad-boss.png"
  );
}

// ============================================================================
// Faction Summary / Index
// ============================================================================

export const FACTIONS = {
  sentinels: {
    name: "The Sentinels",
    description: "Ancient Guardians - Heavy defenders focused on protection and counter-strikes",
    weak: createSentinelWeak,
    medium: createSentinelMedium,
    boss: createSentinelBoss,
  },
  reavers: {
    name: "The Reavers",
    description: "Aggressive Strikers - Fast close-range fighters with high offense and self-repair",
    weak: createReaverWeak,
    medium: createReaverMedium,
    boss: createReaverBoss,
  },
  technomancers: {
    name: "The Technomancers",
    description: "Balanced Tacticians - Mid-range specialists with versatile offense/defense",
    weak: createTechnoWeak,
    medium: createTechnoMedium,
    boss: createTechnoBoss,
  },
  nomads: {
    name: "The Nomads",
    description: "Evasive Scouts - Mobile hit-and-run specialists prioritizing speed and escape",
    weak: createNomadWeak,
    medium: createNomadMedium,
    boss: createNomadBoss,
  },
};

// Helper function to get a random robot from any faction
export function getRandomRobot(factionKey = null) {
  const factionKeys = Object.keys(FACTIONS);
  const selectedFaction = factionKey || factionKeys[Math.floor(Math.random() * factionKeys.length)];
  const faction = FACTIONS[selectedFaction];
  const tiers = ["weak", "medium", "boss"];
  const tier = tiers[Math.floor(Math.random() * tiers.length)];
  return faction[tier]();
}

// Helper function to get a specific faction robot
export function getFactionRobot(factionKey, tier = "medium") {
  return FACTIONS[factionKey]?.[tier]?.();
}
