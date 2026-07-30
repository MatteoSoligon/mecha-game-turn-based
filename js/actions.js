/** Shared action vocabulary used by both the UI and the simulator. */

export const MOVE_GET_CLOSE = "get close";
export const MOVE_GO_AWAY = "go away";

export function normalizeAction(action) {
  return action === MOVE_GET_CLOSE || action === MOVE_GO_AWAY ? "move" : action;
}

export function resolveDirection(action) {
  if (action === MOVE_GET_CLOSE) {
    return -1;
  }

  if (action === MOVE_GO_AWAY) {
    return 1;
  }

  return null;
}
