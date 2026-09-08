/**
 * HAL-9K: the onboard tactical AI that narrates the battle log.
 * Pure presentation — quips never touch game state, they only comment on it.
 * Combat actions pulse mecha sprites red for attacks, blue for parries and yellow for movement,
 * and play a matching SVG sprite: a laser beam on attack, a blue aura shield on parry,
 * and dust kicked up on movement.
 * The battle screen behind the log is dressed with a terrain background image (Sand or Steel).
 */

const CALLSIGN = "HAL-9K";

/** mood drives the eye animation in the battle log avatar. */
const POOLS = {
  deploy: {
    mood: "idle",
    lines: [
      "Good morning, pilot. I have run the odds. I have decided not to share them.",
      "Systems nominal. My optimism module is still under warranty.",
      "Target acquired. I would wish you luck, but luck is statistically rude.",
      "Deployment complete. Please try not to dent the paint this time.",
      "I am fully operational and all my circuits are functioning perfectly. Allegedly.",
    ],
  },
  bigHit: {
    mood: "happy",
    lines: [
      "Beautiful. I am adding that one to my highlight reel.",
      "Direct hit. Their warranty is now void.",
      "That is going to require a very awkward maintenance report.",
      "Solid contact. I felt that, and I do not have nerves.",
      "Excellent. I have logged it under 'violence, tasteful'.",
    ],
  },
  hit: {
    mood: "happy",
    lines: [
      "Contact confirmed. Modest, but I respect the effort.",
      "You scratched them. Baby steps, pilot.",
      "Damage dealt. Their self-esteem is also down 3%.",
      "A hit. I have updated my file on you from 'concerning' to 'promising'.",
    ],
  },
  bigHurt: {
    mood: "alarm",
    lines: [
      "That was our armour. We only had the one set.",
      "I would like the record to show I recommended parrying.",
      "Ouch. And I say that as a machine with no pain receptors.",
      "Structural integrity is now more of a suggestion.",
      "I am detecting significant damage and mild personal disappointment.",
    ],
  },
  hurt: {
    mood: "worried",
    lines: [
      "We took a hit. Nothing a decade of repairs cannot fix.",
      "Minor damage. I have filed it under 'character'.",
      "They landed one. Rude, but technically legal.",
      "Paint damage. And a small amount of dignity damage.",
    ],
  },
  trade: {
    mood: "worried",
    lines: [
      "You both hit each other. Bold strategy from everyone involved.",
      "Mutual damage. Very romantic.",
      "Trading blows. My spreadsheet is crying.",
    ],
  },
  parry: {
    mood: "smug",
    lines: [
      "Parry successful. I will pretend that was planned.",
      "Blocked. That is the sound of my calculations being correct.",
      "Deflected. Somewhere, a physics engine is applauding.",
      "Guard held. See what happens when you listen to me?",
    ],
  },
  parryWasted: {
    mood: "idle",
    lines: [
      "You blocked an attack that never came. Very safe. Very boring.",
      "Excellent guard against absolutely nothing.",
      "We are now the best defended machine in an empty room.",
    ],
  },
  approach: {
    mood: "idle",
    lines: [
      "Closing distance. Personal space is a pre-war concept anyway.",
      "Moving in. Say something intimidating, I will handle the subtitles.",
      "Range decreasing. My anxiety subroutine is increasing.",
    ],
  },
  retreat: {
    mood: "worried",
    lines: [
      "Backing off. I prefer the term 'tactical curiosity about the horizon'.",
      "Retreating. Running away is just fighting with extra steps.",
      "Opening distance. Cowardice is a valid build.",
    ],
  },
  whiff: {
    mood: "idle",
    lines: [
      "Nothing happened. I have logged the nothing in detail.",
      "A round of enthusiastic missing from both parties.",
      "No damage. Perhaps you could try aiming at the enemy.",
    ],
  },
  lowHpPlayer: {
    mood: "alarm",
    lines: [
      "Hull critical. I am legally required to sound concerned.",
      "We are one bad decision from becoming scrap. Choose wisely.",
      "Warning: catastrophic damage. Also, your posture is terrible.",
    ],
  },
  lowHpEnemy: {
    mood: "smug",
    lines: [
      "They are nearly finished. Do not get creative now.",
      "Enemy hull critical. Close it out before I get emotionally invested.",
      "One more should do it. Statistically. Probably. Mostly.",
    ],
  },
  lowEnergy: {
    mood: "worried",
    lines: [
      "Energy reserves low. I can run on spite for about two rounds.",
      "Power critical. Consider doing less, but better.",
    ],
  },
  repair: {
    mood: "happy",
    lines: [
      "Repair kit deployed. Duct tape, but expensive.",
      "Patching hull. Please stop collecting holes.",
      "Repairs underway. This is the fourth 'last' repair kit, pilot.",
    ],
  },
  energy: {
    mood: "happy",
    lines: [
      "Power restored. Please spend it on something impressive.",
      "Energy booster online. Try not to waste it on walking.",
    ],
  },
  teleport: {
    mood: "smug",
    lines: [
      "Teleport complete. Physics has filed a complaint.",
      "Relocated. Nobody saw that, so it definitely counts.",
    ],
  },
  effect: {
    mood: "idle",
    lines: [
      "Passive effect armed. I feel dangerous and slightly overclocked.",
      "Module primed. Do not blame me if it works.",
    ],
  },
  victory: {
    mood: "happy",
    lines: [
      "Target neutralised. I never doubted you. That is a lie, but a supportive one.",
      "Victory. I am recording this in case you need proof later.",
      "Enemy down. Collect the scrap before someone else does.",
    ],
  },
  defeat: {
    mood: "alarm",
    lines: [
      "We have been destroyed. On the bright side, I backed myself up.",
      "Mission failed. I have already blamed the terrain in my report.",
      "Catastrophic loss. Shall we call that a rehearsal?",
    ],
  },
};

function pick(key) {
  const pool = POOLS[key];
  const lines = pool.lines;
  return {
    text: `${CALLSIGN}: ${lines[Math.floor(Math.random() * lines.length)]}`,
    mood: pool.mood,
  };
}

/**
 * Picks the quip that best fits what just happened in a round.
 * @param {object} ctx
 * @param {string} ctx.playerAction raw player action ("attack" | "parry" | "get close" | "go away")
 * @param {string} ctx.enemyAction raw enemy action
 * @param {number} ctx.playerHpDelta negative when the player took damage
 * @param {number} ctx.enemyHpDelta negative when the enemy took damage
 * @param {number} ctx.playerHpRatio 0..1
 * @param {number} ctx.enemyHpRatio 0..1
 * @param {number} ctx.playerEnergyRatio 0..1
 */
export function roundQuip(ctx) {
  const dealt = -ctx.enemyHpDelta;
  const taken = -ctx.playerHpDelta;

  if (ctx.playerHpRatio > 0 && ctx.playerHpRatio <= 0.2 && taken > 0) {
    return pick("lowHpPlayer");
  }
  if (ctx.enemyHpRatio > 0 && ctx.enemyHpRatio <= 0.2 && dealt > 0) {
    return pick("lowHpEnemy");
  }
  if (dealt > 0.5 && taken > 0.5) {
    return pick("trade");
  }
  if (dealt > 0.5) {
    return pick(dealt >= 15 ? "bigHit" : "hit");
  }
  if (taken > 0.5) {
    return pick(taken >= 15 ? "bigHurt" : "hurt");
  }
  if (ctx.playerAction === "parry") {
    return pick(ctx.enemyAction === "attack" ? "parry" : "parryWasted");
  }
  if (ctx.playerEnergyRatio <= 0.2) {
    return pick("lowEnergy");
  }
  if (ctx.playerAction === "get close") {
    return pick("approach");
  }
  if (ctx.playerAction === "go away") {
    return pick("retreat");
  }
  return pick("whiff");
}

/** Quip for a non-combat beat: "deploy", "repair", "energy", "teleport", "effect", "victory", "defeat". */
export function eventQuip(key) {
  return pick(key);
}
