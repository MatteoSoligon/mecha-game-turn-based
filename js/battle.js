import { Robot } from "./robot.js";

export class Battle {
  constructor(terrain) {
    this.terrain = terrain;
    this.distance = terrain.width;
  }

  applyTerrainEffects(robot) {
    if (this.terrain.effects) {
      this.terrain.effects(robot);
    }
  }

  calculateDamage(attacker, opponent, parryFailed = false) {
    const attackValue = attacker.attack(this.distance);
    const parryValue = parryFailed ? 0 : opponent.parryStrength();
    const damage = Math.max(0, attackValue - parryValue);

    return damage;
  }

  calculatePerfectParry(_defender, opponent) {
    if (_defender.parry()) {
      return Robot.PARRY_ENERGY_COST + opponent.attack(this.distance);
    }
    return 0;
  }

  calculateMovement(mover, direction, opponent = null) {
    const moverDirection = typeof direction === "number" ? direction : -1;
    const moverDelta = mover.move() * moverDirection;
    const opponentDelta = opponent ? opponent.move() : 0;

    this.distance = Math.max(
      0,
      Math.min(3, this.distance + moverDelta - opponentDelta),
    );
    //console.log("New Distance: " + this.distance);

    return this.distance;
  }

  calculateBothMovement(robot1, direction1, robot2, direction2) {
    const delta1 =
      robot1.move() * (typeof direction1 === "number" ? direction1 : -1);
    const delta2 =
      robot2.move() * (typeof direction2 === "number" ? direction2 : -1);

    this.distance = Math.max(0, Math.min(3, this.distance + delta1 - delta2));
    //console.log("New Distance: " + this.distance);

    return this.distance;
  }

  setupBattle(robot1, robot2) {
    // TODO: ___
    this.applyTerrainEffects(robot1);
  }

  /* Passive consumables */
  // Boost damage in attack vs attack
  lethalAttack(attacker, opponent) {
    if (attacker.lethalAttack > 0) {
      opponent.takeDamage(this.calculateDamage(attacker, opponent) * 1.5);
      attacker.consumeEffect("lethalAttack");
      console.log("Lethal Attack activated! Extra damage dealt to opponent.");
    }
  }
  // Low enemy efficiency after failed attack
  efficiencyDamage(attacker, opponent) {
    if (attacker.efficiencyDamage > 0) {
      opponent.efficiency *= 0.9;
      attacker.consumeEffect("efficiencyDamage");
      console.log("Efficiency Damaged! Opponent Efficiency: " + opponent.efficiency.toFixed(2));
    }
  }
  // Cancel enemy movement after attack vs move
  paralize(attacker, opponent) {
    if (attacker.paralize > 0) {
      attacker.consumeEffect("paralize");
      console.log("Paralize activated! Opponent movement canceled.");
      return true;
    }
    return false;
  }
  
  // Make damage after parry an attack
  counterAttack(defender, opponent) {
    if (defender.counterAttack > 0) {
      defender.consumeEffect("counterAttack");
      defender.takeDamage(this.calculateDamage(defender, opponent));
      console.log("Counter Attack activated! Damage dealt to opponent.");
    }
  }
  // Restore efficiency after parry vs parry
  efficiencyFix(defender, opponent) {
    if (defender.efficiencyFix > 0) {
      defender.consumeEffect("efficiencyFix");
      defender.efficiency = Math.min(1, defender.efficiency * 1.1);
      console.log("Efficiency Restored! Current Efficiency: " + defender.efficiency.toFixed(2));
    }
  }
  // Restore HP after parry vs move
  HpRecover(defender, opponent) {
    if (defender.HpRecover > 0) {
      defender.consumeEffect("HpRecover");
      defender.currentHP = Math.min(defender.maxHP, defender.currentHP + 5);
      console.log("HP Recovered! Current HP: " + defender.currentHP);
    }
  }
  
  // Avoid damage after move vs attack
  dodgeAttack(mover, opponent) {
    if (mover.dodgeAttack > 0) {
      mover.consumeEffect("dodgeAttack");
      console.log("Dodge Attack activated! Damage avoided.");
      return true;
    }
    return false;
  }
  // make damage after move vs parry
  flankAttack(mover, opponent) {
    if (mover.flankAttack > 0) {
      mover.consumeEffect("flankAttack");
      console.log("Flank Attack activated! Extra damage applied.");
      opponent.takeDamage(this.calculateDamage(mover, opponent));
    }
  }
  // cancel opponent movement after move vs move
  escape(mover, opponent) {
    if (mover.escape > 0) {
      console.log("Escape activated! Opponent movement canceled.");
      mover.consumeEffect("escape");
      return true;
    }
    return false;
  }
  

  /**
   * Resolves a round by looking up the `${action1}:${action2}` pair in a
   * resolver table. Adding a new interaction means adding one entry here
   * instead of editing a long if/else chain (Open/Closed Principle).
   */
  fight(robot1, robot2, action1, action2) {
    const { action1Type, direction1 } = action1;
    const { action2Type, direction2 } = action2;
    const ctx = { robot1, robot2, direction1, direction2 };

    const resolver = this.roundResolvers[`${action1Type}:${action2Type}`];
    return resolver ? resolver.call(this, ctx) : "Round resolved.";
  }

  get roundResolvers() {
    return {
      "attack:parry": ({ robot1, robot2 }) => {
        this.efficiencyDamage(robot1, robot2);
        this.counterAttack(robot2, robot1);
        const parryResult = this.calculatePerfectParry(robot2, robot1);
        if (parryResult > 0) {
          robot2.globalEnergy += parryResult;
          return "Robot 2 wins!";
        }
        robot2.takeDamage(this.calculateDamage(robot1, robot2));
        return "Robot 2 failed to parry!";
      },
      "parry:attack": ({ robot1, robot2 }) => {
        this.counterAttack(robot1, robot2);
        this.efficiencyDamage(robot2, robot1);
        const parryResult = this.calculatePerfectParry(robot1, robot2);
        if (parryResult > 0) {
          robot1.globalEnergy += parryResult;
          return "Robot 1 wins!";
        }
        robot1.takeDamage(this.calculateDamage(robot2, robot1));
        return "Robot 1 failed to parry!";
      },
      "move:attack": ({ robot1, robot2, direction1 }) => {
        if (!this.dodgeAttack(robot1, robot2)) {
          robot1.takeDamage(this.calculateDamage(robot2, robot1));
        }
        if (!this.paralize(robot2, robot1)) {
          this.calculateMovement(robot1, direction1);
        }
        return "Robot 2 wins!";
      },
      "attack:move": ({ robot1, robot2, direction2 }) => {
        if (!this.paralize(robot1, robot2)) {
          this.calculateMovement(robot2, direction2);
        }
        if (!this.dodgeAttack(robot2, robot1)) {
          robot2.takeDamage(this.calculateDamage(robot1, robot2));
        }
        return "Robot 1 wins!";
      },
      "parry:move": ({ robot1, robot2, direction2 }) => {
        this.HpRecover(robot1, robot2);
        this.flankAttack(robot2, robot1);
        this.calculateMovement(robot2, direction2);
        return "Robot 2 wins!";
      },
      "move:parry": ({ robot1, robot2, direction1 }) => {
        this.flankAttack(robot1, robot2);
        this.HpRecover(robot2, robot1);
        this.calculateMovement(robot1, direction1);
        return "Robot 1 wins!";
      },
      "attack:attack": ({ robot1, robot2 }) => {
        this.lethalAttack(robot1, robot2);
        this.lethalAttack(robot2, robot1);
        robot2.takeDamage(this.calculateDamage(robot1, robot2));
        robot1.takeDamage(this.calculateDamage(robot2, robot1));
        return "Both attacked.";
      },
      "parry:parry": ({ robot1, robot2 }) => {
        this.efficiencyFix(robot1, robot2);
        this.efficiencyFix(robot2, robot1);
        return "Both parried.";
      },
      "move:move": ({ robot1, robot2, direction1, direction2 }) => {
        const robot1Escapes = this.escape(robot1, robot2);
        const robot2Escapes = this.escape(robot2, robot1);
        if (robot1Escapes && robot2Escapes) {
          this.calculateMovement(robot1, direction1);
          this.calculateMovement(robot2, direction2);
        } else if (robot1Escapes) {
          this.calculateMovement(robot1, direction1);
        } else if (robot2Escapes) {
          this.calculateMovement(robot2, direction2);
        } else {
          this.calculateBothMovement(robot1, direction1, robot2, direction2);
        }
        return "Both moved.";
      },
    };
  }
}
