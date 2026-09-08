# Copilot instructions for this game project

## Global rules

- Before making any code changes, explain what you intend to change and ask for clarification when the requirements are ambiguous or incomplete.
- Keep the work narrow and minimal. Do not broaden scope or refactor unrelated code unless the request explicitly requires it.
- Follow SOLID principles: favor small, focused responsibilities, clear interfaces, and low coupling.
- Preserve the existing game behavior unless a requested change explicitly requires different behavior.
- Keep game logic separate from UI implementation. Game rules, state, and simulation code should not directly depend on DOM rendering details.
- When adding a new feature, update the comments in `js/quips.js` so the feature description remains aligned with the project’s in-game text and behavior notes.
- Prefer the smallest safe change that satisfies the request and avoid speculative redesigns.

## Working conventions

- Separate logic modules from presentation modules. Keep state updates, combat rules, progress, events, and simulation code in logic-focused files; keep rendering, DOM access, and screen updates in UI-focused files.
- If a new feature touches both logic and UI, make the logic change first and keep UI code as thin as possible.
- Preserve naming and style patterns already used in the project unless a change specifically requires a new convention.
- Prefer explicit, readable code over clever abstractions.
- Treat comments as part of the project’s behavior documentation, especially in `js/quips.js`.

## Delivery expectations

- Explain your plan before you code.
- If important details are missing, ask the user for clarification before proceeding.
- Keep the implementation targeted and easy to review.
