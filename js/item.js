class Item {
    constructor(name) {
        this.name = name;
    }

    run() {
        console.log("Using item: " + this.name);
    }
}

export class RepairKit extends Item {
    constructor(robot) {
        super("Repair Kit");
        this.robot = robot;
    }

    run() {
        this.robot.currentHP += 5;
    }
}

export class EnergyBooster extends Item {
    constructor(robot) {
        super("Energy Booster");
        this.robot = robot;
    }

    run() {
        this.robot.globalEnergy += 5;
    }
}

export class Teleporter extends Item {
    constructor(battle) {
        super("Teleporter");
        this.battle = battle;
    }

    run() {
        this.battle.distance = Math.max(0, this.battle.distance - 1);
    }
}
