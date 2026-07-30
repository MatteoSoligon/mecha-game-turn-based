import { Battle } from "../battle.js";
import { EnergyBooster, RepairKit, Teleporter } from "../item.js";
import { Part, MediumRangeArm } from "../parts.js";
import { RandomRobot, AIRobot } from "../robot.js";
import { FloodedCity } from "../terrain.js";
import { silentEmitter } from "../events.js";
import { normalizeAction } from "../actions.js";

function createRobot1() {
  const arm = new MediumRangeArm();
  const leg = new Part(0, 0, 2, 0, 0);
  const torso = new Part(0, 4, 0, 3, 25);

  return new AIRobot([arm, leg, torso], {
    attack: 50,
    parry: 20,
    move: 0,
  }, "benchmark-1", silentEmitter);
}

function createRobot2() {
  const arm = new MediumRangeArm();
  const leg = new Part(0, 0, 2, 0, 0);
  const torso = new Part(0, 4, 0, 3, 25);

  return new RandomRobot([arm, leg, torso], {
    attack: 10,
    parry: 50,
    move: 10,
  }, "benchmark-2", silentEmitter);
}

function chooseBenchmarkAction(robot, currentBattle) {
  const robotTurn = robot.chooseTurn(currentBattle.distance);
  const normalizedAction = normalizeAction(robotTurn.action);
  robot.allocateEnergy(normalizedAction);
  return { actionType: normalizedAction, direction: robotTurn.direction };
}

function runSingleQuickBattle(applyItemEffect, maxRounds) {
  const currentBattle = new Battle(new FloodedCity());
  const benchmarkRobot1 = createRobot1();
  const benchmarkRobot2 = createRobot2();

  // run a battle of maxRounds rounds and return the winner and some stats
  //applyItemEffect(benchmarkRobot1, currentBattle);

  let rounds = 0;
  currentBattle.setupBattle(benchmarkRobot1, benchmarkRobot2);
  while (benchmarkRobot1.globalEnergy > 3 && benchmarkRobot2.globalEnergy > 3 && benchmarkRobot1.currentHP > 0 && benchmarkRobot2.currentHP > 0) {
    const action1 = chooseBenchmarkAction(benchmarkRobot1, currentBattle);
    const action2 = chooseBenchmarkAction(benchmarkRobot2, currentBattle);

    benchmarkRobot1.allocateEnergy(action1.actionType);
    benchmarkRobot2.allocateEnergy(action2.actionType);

    currentBattle.fight(
      benchmarkRobot1,
      benchmarkRobot2,
      { action1Type: action1.actionType, direction1: action1.direction },
      { action2Type: action2.actionType, direction2: action2.direction },
    );

    rounds += 1;
  }

  let winner = null;
  if (benchmarkRobot2.globalEnergy < 3) {
      winner = "robot1";
  } else if (benchmarkRobot1.globalEnergy < 3) {
      winner = "robot2";
  } else if (benchmarkRobot1.currentHP < benchmarkRobot2.currentHP) {
      winner = "robot2";
  }

  return {
    winner,
    rounds,
    robot1Hp: benchmarkRobot1.currentHP,
    robot2Hp: benchmarkRobot2.currentHP,
    robot1Energy: benchmarkRobot1.globalEnergy,
    robot2Energy: benchmarkRobot2.globalEnergy,
    winByEnergy: benchmarkRobot1.globalEnergy < 3 || benchmarkRobot2.globalEnergy < 3
  };

}

export function runItemBenchmark(iterations = 1000, maxRounds = 25) {
  const itemSetups = [
    {
      name: "none",
      apply: () => {},
    },
    {
      name: "repair-kit",
      apply: (robot1) => {
        new RepairKit(robot1).run();
      },
    },
    {
      name: "energy-booster",
      apply: (robot1) => {
        new EnergyBooster(robot1).run();
      },
    },
    {
      name: "teleporter",
      apply: (_robot1, currentBattle) => {
        new Teleporter(currentBattle).run();
      },
    },
  ];

  const summary = itemSetups.map((itemSetup) => {
    const totals = {
      wins: 0,
      losses: 0,
      draws: 0,
      rounds: 0,
      robot1Hp: 0,
      robot2Hp: 0,
      robot1Energy: 0,
      robot2Energy: 0,
      winByEnergy: 0,
    };

    for (let i = 0; i < iterations; i += 1) {
      const result = runSingleQuickBattle(itemSetup.apply, maxRounds);

      if (result.winner === "robot1") {
        totals.wins += 1;
      } else if (result.winner === "robot2") {
        totals.losses += 1;
      } else {
        totals.draws += 1;
      }

      totals.rounds += result.rounds;
      totals.robot1Hp += result.robot1Hp;
      totals.robot2Hp += result.robot2Hp;
      totals.robot1Energy += result.robot1Energy;
      totals.robot2Energy += result.robot2Energy;
      totals.winByEnergy += result.winByEnergy ? 1 : 0;
    }

    return {
      item: itemSetup.name,
      iterations,
      winRate: (totals.wins / iterations).toFixed(3),
      drawRate: (totals.draws / iterations).toFixed(3),
      lossRate: (totals.losses / iterations).toFixed(3),
      avgRounds: (totals.rounds / iterations).toFixed(2),
      avgRobot1Hp: (totals.robot1Hp / iterations).toFixed(2),
      avgRobot2Hp: (totals.robot2Hp / iterations).toFixed(2),
      avgRobot1Energy: (totals.robot1Energy / iterations).toFixed(2),
      avgRobot2Energy: (totals.robot2Energy / iterations).toFixed(2),
      winByEnergyRate: totals.winByEnergy,
    };
  });

  console.table(summary);

  return summary;
}
