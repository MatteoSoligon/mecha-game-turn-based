/**
 * Catalog of passive effects. This is shared presentation + identity data:
 * - `key`    matches the counter field on a Robot and the handler on Battle.
 * - `class`  drives the icon colour (attack/parry/move) in the UI.
 * Parts reference effects by `key`; the Robot aggregates the keys of its
 * equipped parts to decide which effects are available to activate.
 */

export const EFFECT_CATEGORY = {
  ATTACK: "attack-icon",
  PARRY: "parry-icon",
  MOVE: "move-icon",
};

export const PASSIVE_EFFECTS = [
  {
    key: "lethalAttack",
    label: "Lethal Attack",
    description: "Perform boosted attack",
    class: EFFECT_CATEGORY.ATTACK,
    icon: "/images/lethal-attack.svg",
  },
  {
    key: "efficiencyDamage",
    label: "Efficiency Damage",
    description: "Reduce opponent efficiency",
    class: EFFECT_CATEGORY.ATTACK,
    icon: "/images/efficiency-damage.svg",
  },
  {
    key: "paralize",
    label: "Paralize",
    description: "Cancel opponent movement",
    class: EFFECT_CATEGORY.ATTACK,
    icon: "/images/paralize.svg",
  },
  {
    key: "counterAttack",
    label: "Counter Attack",
    description: "Retaliate after being attacked",
    class: EFFECT_CATEGORY.PARRY,
    icon: "/images/counter-attack.svg",
  },
  {
    key: "efficiencyFix",
    label: "Efficiency Fix",
    description: "Restore own efficiency",
    class: EFFECT_CATEGORY.PARRY,
    icon: "/images/efficiency-fix.svg",
  },
  {
    key: "HpRecover",
    label: "HP Recover",
    description: "Regain health points",
    class: EFFECT_CATEGORY.PARRY,
    icon: "/images/hp-recovery.svg",
  },
  {
    key: "dodgeAttack",
    label: "Dodge Attack",
    description: "Evade incoming attacks",
    class: EFFECT_CATEGORY.MOVE,
    icon: "/images/dodge.svg",
  },
  {
    key: "flankAttack",
    label: "Flank Attack",
    description: "Attack from the side",
    class: EFFECT_CATEGORY.MOVE,
    icon: "/images/flank-attack.svg",
  },
  {
    key: "escape",
    label: "Escape",
    description: "Cancel opponent movement",
    class: EFFECT_CATEGORY.MOVE,
    icon: "/images/escape.svg",
  },
];

export const PASSIVE_EFFECTS_BY_KEY = Object.fromEntries(
  PASSIVE_EFFECTS.map((effect) => [effect.key, effect]),
);
