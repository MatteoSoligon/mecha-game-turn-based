import { defaultEmitter } from "./events.js";
import { PASSIVE_EFFECTS } from "./effects.js";

export class Robot {
  static ACTION_ENERGY = 3;
  static ATTACK_ENERGY_COST = 3;
  static PARRY_ENERGY_COST = 5;
  static MOVE_ENERGY_COST = 1;
  static ENERGY_COSTS = {
    attack: Robot.ATTACK_ENERGY_COST,
    parry: Robot.PARRY_ENERGY_COST,
    move: Robot.MOVE_ENERGY_COST,
  };
  static REPEAT_ACTION_MALUS = 1.2;
  static SURRENDER_FOR_ENERGY_EVENT = "surrenderForEnergy";
  static SURRENDER_FOR_HP_EVENT = "surrenderForHP";
  static EFFECT_CONSUMED_EVENT = "effectConsumed";
  static PASSIVE_EFFECTS = PASSIVE_EFFECTS;
  parts = [];
  globalEnergy = 0;
  attackEnergy = 0;
  parryEnergy = 0;
  moveEnergy = 0;
  lastActionType = null;
  efficiency = 1;
  luckyChance = 0.01;
  // Set by the mini-game before a player action; consumed once then cleared
  _miniGameResult = null;

  lethalAttack = 0;
  efficiencyDamage = 0;
  paralize = 0;
  counterAttack = 0;
  efficiencyFix = 0;
  HpRecover = 0;
  dodgeAttack = 0;
  flankAttack = 0;
  escape = 0;
  image = "";

  constructor(
    parts,
    energyStocks = { attack: 0, parry: 0, move: 0 },
    name = "Unnamed Robot",
    emitter = defaultEmitter,
    image = "",
  ) {
    this.parts = parts;
    this.emitter = emitter;
    this.image = image;
    this.maxHP = this.parts.reduce((total, part) => total + part.totHP, 0);
    this.currentHP = this.maxHP;
    this.name = name;
    this.globalEnergy = this.parts.reduce((total, part) => total + part.totEnergy, 0);
    this.maxEnergy = this.globalEnergy;

    this.attackEnergy = energyStocks.attack;
    this.parryEnergy = energyStocks.parry;
    this.moveEnergy = energyStocks.move;

    this.maxAttackEnergy = energyStocks.attack;
    this.maxParryEnergy = energyStocks.parry;
    this.maxMoveEnergy = energyStocks.move;

    // Per-effect use budgets are granted by the equipped parts and deplete
    // over the whole match (no refill). `effectUses` tracks remaining uses.
    this.effectCapacity = this.computeEffectCapacities();
    this.effectUses = { ...this.effectCapacity };
  }

  deteriorateAndCheckFailure(degradationRate = 0.05) {
    let multiplier;
    if (this._miniGameResult !== null) {
      multiplier = this._miniGameResult;
      this._miniGameResult = null;
    } else {
      multiplier = Math.random() > this.efficiency ? 0 : 1;
    }
    this.efficiency *= 1 - degradationRate;
    return multiplier;
  }

  lucky() {
    const isLucky = Math.random() < (this.luckyChance);
    if (isLucky) {
      //console.log("Lucky hit! Bonus applied.");
    }
    return isLucky ? 1.3 : 1;
  }

  attackStrength(distance) {
    return this.efficiency * this.parts.reduce((total, part) => total + Math.max(part.attack(distance), 0), 0);
  }

  parryStrength() {
    return this.efficiency * this.parts.reduce((total, part) => total + part.shield, 0);
  }

  moveSpeed() {
    return this.efficiency * this.parts.reduce((total, part) => total + part.speed, 0);
  }

  attack(distance) {
    if (this.globalEnergy < Robot.ATTACK_ENERGY_COST) {
      this.surrenderForEnergy();
      return 0;
    }

    return this.deteriorateAndCheckFailure(0.025) * this.attackStrength(distance) * this.lucky();
  }

  parry() {
    if (this.globalEnergy < Robot.PARRY_ENERGY_COST) {
      this.surrenderForEnergy();
      return 0;
    }

    return this.deteriorateAndCheckFailure(0.05) * this.parryStrength() * this.lucky();
  }

  move() {
    if (this.globalEnergy < Robot.MOVE_ENERGY_COST) {
      this.surrenderForEnergy();
      return 0;
    }
    // no lucky for movement, to avoid too much randomness in distance changes
    return this.deteriorateAndCheckFailure(0.01) * this.moveSpeed();
  }

  resetEnergy() {
    this.attackEnergy = 0;
    this.parryEnergy = 0;
    this.moveEnergy = 0;
  }

  surrenderForHP() {
    this.emitter.emit(Robot.SURRENDER_FOR_HP_EVENT, { robot: this });
    //console.log("Robot surrenders due to low HP!");
  }

  surrenderForEnergy() {
    this.emitter.emit(Robot.SURRENDER_FOR_ENERGY_EVENT, { robot: this });
    //console.log("Robot surrenders due to low Energy!");
  }

  getCurrentEnergy() {
    return this.globalEnergy;
  }

  get specialStats() {
    return Robot.PASSIVE_EFFECTS
      .map((effect) => ({
        ...effect,
        value: this[effect.key] || 0,
      }))
      .filter((effect) => effect.value !== 0);
  }

  /**
   * Effects this robot can activate, derived from the keys declared by its
   * equipped parts (arms -> attack, torso -> parry, legs -> move).
   * Order follows the catalog; duplicate keys across parts are collapsed.
   */
  get availableEffects() {
    const grantedKeys = new Set();
    for (const part of this.parts) {
      for (const key of Object.keys(part.passiveEffects || {})) {
        grantedKeys.add(key);
      }
    }

    return Robot.PASSIVE_EFFECTS.filter((effect) => grantedKeys.has(effect.key));
  }

  /**
   * Sums the use budget each equipped part grants per effect, clamped to the
   * [1, 3] range. This is the total number of times an effect can be armed in
   * a match.
   */
  computeEffectCapacities() {
    const capacities = {};
    for (const part of this.parts) {
      for (const [key, uses] of Object.entries(part.passiveEffects || {})) {
        capacities[key] = (capacities[key] || 0) + uses;
      }
    }
    for (const key of Object.keys(capacities)) {
      capacities[key] = Math.max(1, Math.min(3, capacities[key]));
    }
    return capacities;
  }

  /**
   * Spends one remaining use to arm a passive effect (adds a charge that the
   * battle can later consume). Returns true if a use was available.
   */
  armEffect(key) {
    if ((this.effectUses[key] || 0) <= 0) {
      return false;
    }
    this.effectUses[key] -= 1;
    this[key] = (this[key] || 0) + 1;
    return true;
  }

  /**
   * Spends one charge of a passive effect and announces it so the UI can
   * react. Returns true if a charge was actually consumed.
   */
  consumeEffect(key) {
    if ((this[key] || 0) <= 0) {
      return false;
    }
    console.log(`Robot ${this.name} consumes effect: ${key}`);
    this[key] -= 1;
    this.emitter.emit(Robot.EFFECT_CONSUMED_EVENT, { robot: this, effect: key });
    return true;
  }


  takeDamage(amount) {
    this.currentHP = Math.max(0, this.currentHP - amount);
    if (this.currentHP <= 0) {
      this.surrenderForHP();
    }
  }

  chooseTurn(_distance, _opponent = null) {
    // Base robots are player-controlled and do not choose autonomously.
    return { action: null, direction: null };
  }

  allocateEnergy(action) {
    const baseCost = Robot.ENERGY_COSTS[action];
    const repetitionMalus = this.lastActionType === action ? Robot.REPEAT_ACTION_MALUS : 1;

    this.lastActionType = action;

    if (baseCost === undefined) {
      return;
    }

    const requested = Number(baseCost) * repetitionMalus;
    if (this.globalEnergy < requested) {
      this.globalEnergy = 0;
      this.surrenderForEnergy();
      return;
    }

    this.globalEnergy -= requested;
  }
}

export class AIRobot extends Robot {
  lastAction;

  // Maps each passive effect to the action this robot must take to trigger it
  // and the opponent action it triggers against.
  static EFFECT_TRIGGER = {
    lethalAttack: { self: "attack", opponent: "attack" },
    efficiencyDamage: { self: "attack", opponent: "parry" },
    paralize: { self: "attack", opponent: "move" },
    counterAttack: { self: "parry", opponent: "attack" },
    efficiencyFix: { self: "parry", opponent: "parry" },
    HpRecover: { self: "parry", opponent: "move" },
    dodgeAttack: { self: "move", opponent: "attack" },
    flankAttack: { self: "move", opponent: "parry" },
    escape: { self: "move", opponent: "move" },
  };

  /**
   * Rewards actions that an equipped passive effect could exploit, so the AI
   * leans toward turns where one of its effects pays off. When the opponent's
   * move for this round is already known, only effects that would actually fire
   * against it are rewarded. Bonuses nudge the base strategy rather than
   * override it.
   */
  applyEffectStrategy(score, context) {
    const { opponentAction, myHPRatio, opponentHPRatio } = context;

    for (const effect of this.availableEffects) {
      const trigger = AIRobot.EFFECT_TRIGGER[effect.key];
      if (!trigger) {
        continue;
      }

      // Skip effects with no uses left to arm (and none already armed).
      const usable = (this[effect.key] || 0) + (this.effectUses[effect.key] || 0);
      if (usable <= 0) {
        continue;
      }

      // If we know the opponent's move, skip effects that cannot trigger.
      if (opponentAction && trigger.opponent !== opponentAction) {
        continue;
      }

      // More confident when the opponent action is known for certain.
      let bonus = opponentAction ? 4 : 1.5;
      switch (effect.key) {
        case "lethalAttack":
          // Press the advantage to finish a wounded opponent.
          bonus += (1 - opponentHPRatio) * 6;
          break;
        case "HpRecover":
          // Heal more eagerly the more damaged we are.
          bonus += (1 - myHPRatio) * 6;
          break;
        case "efficiencyFix":
          // Worth more as efficiency degrades.
          bonus += (1 - this.efficiency) * 5;
          break;
        case "counterAttack":
        case "dodgeAttack":
        case "paralize":
        case "flankAttack":
          bonus += 2;
          break;
        default:
          break;
      }

      score[trigger.self] += bonus;
    }
  }

  /**
   * Arms one charge on every equipped effect tied to the chosen action so it is
   * ready to fire this round, drawing from the part-granted use budget.
   */
  activateEffectsFor(action) {
    for (const effect of this.availableEffects) {
      const trigger = AIRobot.EFFECT_TRIGGER[effect.key];
      if (trigger && trigger.self === action && (this[effect.key] || 0) < 1) {
        this.armEffect(effect.key);
      }
    }
  }

  evaluateDistanceUtility(distance, opponent = null) {
    const currentAttack = this.attackStrength(distance);
    const closeDistance = Math.max(0, distance - 1);
    const farDistance = Math.min(3, distance + 1);
    const closeAttack = this.attackStrength(closeDistance);
    const farAttack = this.attackStrength(farDistance);

    let opponentCurrentAttack = 0;
    let opponentCloseAttack = 0;
    let opponentFarAttack = 0;

    if (opponent) {
      opponentCurrentAttack = opponent.attackStrength(distance);
      opponentCloseAttack = opponent.attackStrength(closeDistance);
      opponentFarAttack = opponent.attackStrength(farDistance);
    }

    const closeDelta = closeAttack - currentAttack;
    const farDelta = farAttack - currentAttack;

    return {
      current: { attack: currentAttack, advantage: currentAttack - opponentCurrentAttack },
      close: { attack: closeAttack, advantage: closeAttack - opponentCloseAttack, delta: closeDelta },
      far: { attack: farAttack, advantage: farAttack - opponentFarAttack, delta: farDelta },
      optimalRange: Math.abs(farDelta) > Math.abs(closeDelta) ? "far" : "close",
    };
  }

  randomAction(distance = 0, opponent = null) {
    const actions = ["attack", "parry", "move"].filter((action) => {
      if (action === "attack") return this.globalEnergy > Robot.ATTACK_ENERGY_COST;
      if (action === "parry") return this.globalEnergy > Robot.PARRY_ENERGY_COST;
      if (action === "move") return this.globalEnergy > Robot.MOVE_ENERGY_COST;
      return false;
    });

    if (actions.length === 0) {
      return "attack";
    }

    const myAttack = this.attackStrength(distance);
    const myParry = this.parryStrength();
    const mySpeed = this.moveSpeed();
    const myHPRatio = this.currentHP / this.maxHP;

    let opponentAttack = 0;
    let opponentParry = 0;
    let opponentSpeed = 0;
    let opponentHPRatio = 1;

    if (opponent) {
      opponentAttack = opponent.attackStrength(distance);
      opponentParry = opponent.parryStrength();
      opponentSpeed = opponent.moveSpeed();
      opponentHPRatio = opponent.currentHP / opponent.maxHP;
    }

    const distanceAnalysis = this.evaluateDistanceUtility(distance, opponent);
    const attackAdvantage = myAttack - opponentParry;
    const defenseAdvantage = myParry - opponentAttack;
    const speedAdvantage = mySpeed - opponentSpeed;

    if (myHPRatio < 0.2) {
      const betterClose = distanceAnalysis.close.advantage > distanceAnalysis.current.advantage && distance > 0.5;
      const betterFar = distanceAnalysis.far.advantage > distanceAnalysis.current.advantage && distance < 2.5;

      if (actions.includes("move") && (betterClose || betterFar)) return "move";
      if (actions.includes("parry")) return "parry";
      if (actions.includes("move")) return "move";
      return actions[0];
    }

    const score = { attack: 0, parry: 0, move: 0 };

    if (attackAdvantage > 0) {
      score.attack += attackAdvantage * 2;
    } else {
      score.attack -= Math.abs(attackAdvantage) * 1.5;
    }
    score.attack += (1 - opponentHPRatio) * 10;

    if (defenseAdvantage > 0) {
      score.parry += defenseAdvantage * 1.8;
    }
    score.parry += opponentAttack > myParry ? 5 : 0;

    let moveScore = 0;
    if (distanceAnalysis.optimalRange === "close" && distance > 0.5) {
      moveScore += distanceAnalysis.close.advantage > distanceAnalysis.current.advantage ? 4 : 1;
    } else if (distanceAnalysis.optimalRange === "far" && distance < 2.5) {
      moveScore += distanceAnalysis.far.advantage > distanceAnalysis.current.advantage ? 4 : 1;
    }

    if (distance < 1 && opponentAttack > myParry && distanceAnalysis.optimalRange === "far") {
      moveScore += 3;
    }

    if (attackAdvantage < 0) {
      if (distanceAnalysis.far.advantage > distanceAnalysis.current.advantage && distance < 2.5) {
        moveScore += 2;
      }
      if (distanceAnalysis.close.advantage > distanceAnalysis.current.advantage && distance > 0.5) {
        moveScore += 2;
      }
    }

    if (speedAdvantage > 0) {
      moveScore += speedAdvantage * 1.2;
    }
    score.move = moveScore;

    if (this.globalEnergy < Robot.PARRY_ENERGY_COST * 1.5) {
      score.parry *= 0.7;
    }

    const hpPenalty = 1 - myHPRatio;
    score.parry += hpPenalty * 3;
    score.attack -= hpPenalty * 2;

    this.applyEffectStrategy(score, {
      opponentAction: opponent ? opponent.lastActionType : null,
      myHPRatio,
      opponentHPRatio,
    });

    let recommendedAction = "attack";
    if (actions.includes("parry") && score.parry > score.attack) {
      recommendedAction = "parry";
    }
    if (actions.includes("move") && score.move > Math.max(score.attack, score.parry)) {
      recommendedAction = "move";
    }

    return actions.includes(recommendedAction) ? recommendedAction : actions[0];
  }

  chooseTurn(distance, opponent = null) {
    const action = this.randomAction(distance, opponent);
    // Charge the effects tied to the chosen action so they can fire this round.
    this.activateEffectsFor(action);
    // Distance is limited to 3, so check if the robot is a limit (0 or 3)
    const direction =
      action === "move" ? distance >= 3 ? -1 : distance <= 0 ? 1 : (Math.random() > 0.5 ? -1 : 1) : null;

    return { action, direction };
  }
}

export class RandomRobot extends Robot {
  randomAction() {
    const actions = ["attack", "parry", "move" ].filter(action => {
      if (action === "attack") return this.globalEnergy > Robot.ATTACK_ENERGY_COST;
      if (action === "parry") return this.globalEnergy > Robot.PARRY_ENERGY_COST;
      if (action === "move") return this.globalEnergy > Robot.MOVE_ENERGY_COST;
    });

    return actions[Math.floor(Math.random() * actions.length)];
    
  }

  chooseTurn(distance) {
    const action = this.randomAction();
    const direction = (Math.random() > 0.5 ? -1 : 1)

    return { action, direction };
  }
}

