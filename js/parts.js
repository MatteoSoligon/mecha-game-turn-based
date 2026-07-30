export class Part {
  damage = 0;
  shield = 0;
  speed = 0;
  totHP = 0;
  totEnergy = 0;
  name = "Unnamed Part";
  passiveEffects = {};

  constructor(damage, shield, speed, totHP, totEnergy, name = "Unnamed Part", passiveEffects = {}) {
    this.damage = damage;
    this.shield = shield;
    this.speed = speed;
    this.totHP = totHP;
    this.totEnergy = totEnergy;
    this.name = name;
    this.passiveEffects = passiveEffects;
  }

  attack() {
    return this.damage;
  }

  parry() {
    return this.shield;
  }

  move() {
    return this.speed;
  }
}

/* ----------------------------------------------------------------------------
 * Arms grant attack effects. Each family ships in three tiers of rising power
 * (base -> advanced -> legend); higher tiers hit harder and grant more uses of
 * their effect (1 -> 2 -> 3). Effect uses are capped at 3 by the robot.
 * ------------------------------------------------------------------------- */

export class LongRangeArm extends Part {
  constructor(damage = 4, name = "long range arm (base)", uses = 1) {
    super(damage, 0, -0.1, 0, 0, name, { paralize: uses });
  }

  attack(distance) {
    if (distance > 2.5) {
      return this.damage;
    }

    return (this.damage * distance) / 3;
  }
}

export class LongRangeArmAdvanced extends LongRangeArm {
  constructor() {
    super(5, "long range arm (advanced)", 2);
  }
}

export class LongRangeArmLegend extends LongRangeArm {
  constructor() {
    super(6, "long range arm (legend)", 3);
  }
}

export class ShortRangeArm extends Part {
  constructor(damage = 10, name = "short range arm (base)", uses = 1) {
    super(damage, 0, -0.9, 0, 0, name, { lethalAttack: uses });
  }

  attack(distance) {
    if (distance < 1) {
      return this.damage;
    }

    return this.damage / distance;
  }
}

export class ShortRangeArmAdvanced extends ShortRangeArm {
  constructor() {
    super(12, "short range arm (advanced)", 2);
  }
}

export class ShortRangeArmLegend extends ShortRangeArm {
  constructor() {
    super(15, "short range arm (legend)", 3);
  }
}

export class MediumRangeArm extends Part {
  constructor(damage = 6, name = "medium range arm (base)", uses = 1) {
    super(damage, 0, -0.4, 0, 0, name, { efficiencyDamage: uses, paralize: uses });
  }

  attack(distance) {
    if (distance < 1 || distance > 2) {
      return this.damage * 0.75;
    }

    return this.damage;
  }
}

export class MediumRangeArmAdvanced extends MediumRangeArm {
  constructor() {
    super(7, "medium range arm (advanced)", 2);
  }
}

export class MediumRangeArmLegend extends MediumRangeArm {
  constructor() {
    super(9, "medium range arm (legend)", 3);
  }
}

/* ----------------------------------------------------------------------------
 * Torsos grant parry effects. They carry the bulk of HP, shield and energy.
 * Higher tiers add shield, HP, energy and effect uses.
 * ------------------------------------------------------------------------- */

export class BulwarkTorso extends Part {
  // Heavy plating: best shield/HP, retaliates when struck.
  constructor(shield = 5, totHP = 12, totEnergy = 28, name = "bulwark torso (base)", uses = 1) {
    super(0, shield, 0, totHP, totEnergy, name, { counterAttack: uses });
  }
}

export class BulwarkTorsoAdvanced extends BulwarkTorso {
  constructor() {
    super(6, 14, 32, "bulwark torso (advanced)", 2);
  }
}

export class BulwarkTorsoLegend extends BulwarkTorso {
  constructor() {
    super(7, 16, 36, "bulwark torso (legend)", 3);
  }
}

export class AegisTorso extends Part {
  // Adaptive frame: balanced, keeps itself calibrated and patched up.
  constructor(shield = 4, totHP = 10, totEnergy = 34, name = "aegis torso (base)", uses = 1) {
    super(0, shield, 0, totHP, totEnergy, name, { efficiencyFix: uses, HpRecover: uses });
  }
}

export class AegisTorsoAdvanced extends AegisTorso {
  constructor() {
    super(5, 12, 38, "aegis torso (advanced)", 2);
  }
}

export class AegisTorsoLegend extends AegisTorso {
  constructor() {
    super(6, 14, 42, "aegis torso (legend)", 3);
  }
}

export class MenderTorso extends Part {
  // Field-medic core: light shield, large energy reserve, self-repairs.
  constructor(shield = 2, totHP = 9, totEnergy = 40, name = "mender torso (base)", uses = 1) {
    super(0, shield, 0, totHP, totEnergy, name, { HpRecover: uses });
  }
}

export class MenderTorsoAdvanced extends MenderTorso {
  constructor() {
    super(2, 11, 46, "mender torso (advanced)", 2);
  }
}

export class MenderTorsoLegend extends MenderTorso {
  constructor() {
    super(3, 13, 52, "mender torso (legend)", 3);
  }
}

/* ----------------------------------------------------------------------------
 * Legs grant move effects. They provide speed and a little HP.
 * Higher tiers add speed and effect uses.
 * ------------------------------------------------------------------------- */

export class SprinterLegs extends Part {
  // Pure speed: outruns blows.
  constructor(speed = 2, totHP = 1, name = "sprinter legs (base)", uses = 1) {
    super(0, 0, speed, totHP, 0, name, { dodgeAttack: uses });
  }
}

export class SprinterLegsAdvanced extends SprinterLegs {
  constructor() {
    super(2.5, 1, "sprinter legs (advanced)", 2);
  }
}

export class SprinterLegsLegend extends SprinterLegs {
  constructor() {
    super(3, 2, "sprinter legs (legend)", 3);
  }
}

export class RaiderLegs extends Part {
  // Aggressive footwork: flanks on the move and breaks away.
  constructor(speed = 1.5, totHP = 1, name = "raider legs (base)", uses = 1) {
    super(0, 0, speed, totHP, 0, name, { flankAttack: uses, escape: uses });
  }
}

export class RaiderLegsAdvanced extends RaiderLegs {
  constructor() {
    super(1.8, 1, "raider legs (advanced)", 2);
  }
}

export class RaiderLegsLegend extends RaiderLegs {
  constructor() {
    super(2.1, 2, "raider legs (legend)", 3);
  }
}

export class EvaderLegs extends Part {
  // Slippery stance: slower, but always finds an exit.
  constructor(speed = 1, totHP = 1, name = "evader legs (base)", uses = 1) {
    super(0, 0, speed, totHP, 0, name, { escape: uses });
  }
}

export class EvaderLegsAdvanced extends EvaderLegs {
  constructor() {
    super(1.3, 1, "evader legs (advanced)", 2);
  }
}

export class EvaderLegsLegend extends EvaderLegs {
  constructor() {
    super(1.6, 2, "evader legs (legend)", 3);
  }
}