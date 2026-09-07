# Game

Run locally:

```bash
python3 -m http.server 8000
```

## Gameplay

The game runs as a single-page campaign with four screens: **Quest Path → Briefing → Battle → Results**.

- **Quest Path** — 12 missions across 4 chapters. Missions unlock one at a time: clear the current one to open the next.
- **Briefing** — read the enemy intel and stat block, then customize your mecha in the workshop before deploying.
- **Battle** — choose an action and complete the minigame. Passive effects trigger when their conditions are met.
- **Results** — scrap and XP payout, pilot rank progress, and any new blueprints the clear unlocked.

## Progression

- **Scrap** is the currency. You earn it by clearing missions, with bonuses for a flawless hull (80%+ HP left) and a swift takedown (6 rounds or fewer). Replaying a cleared mission pays 40%; losing still returns a small salvage.
- **XP** feeds the cosmetic Pilot Rank track (Cadet → Legend).
- **Parts** unlock progressively: every blueprint in `js/catalog.js` declares an `unlockLevel` (missions that must be cleared) and a scrap `cost`. Base-tier gear opens in chapter 1, Advanced through chapters 2–3, and Legend across chapters 3–4, so your loadout grows alongside enemy difficulty.

Progress is saved to `localStorage`. Use **Reset** in the top bar to wipe it.

## Mecha Customization

Buy and equip parts in the workshop on the Briefing screen — one arm, one torso, one legs. You start with the base Short Range Arm, Bulwark Torso and Sprinter Legs.

## Code map

| File | Role |
| --- | --- |
| `js/campaign.js` | Quest levels, chapters, pilot ranks, reward math |
| `js/catalog.js` | Part shop entries: slot, tier, cost, unlock level |
| `js/progress.js` | localStorage save: scrap, XP, owned parts, loadout, clears |
| `js/screens.js` | Screen manager |
| `js/ui/*.js` | Top bar, quest path, briefing/workshop and results rendering |
| `js/app.js` | Boots the shell and owns the battle lifecycle |
