/**
 * Minimal screen manager. Every top-level view is a `<section class="screen">`
 * in index.html; exactly one carries `screen--active` at a time.
 */

const SCREEN_PREFIX = "screen-";

let current = null;
const enterHandlers = new Map();

export function registerScreen(name, onEnter) {
  enterHandlers.set(name, onEnter);
}

export function currentScreen() {
  return current;
}

export function showScreen(name, payload) {
  const target = document.getElementById(`${SCREEN_PREFIX}${name}`);
  if (!target) {
    return;
  }

  for (const section of document.querySelectorAll(".screen")) {
    section.classList.toggle("screen--active", section === target);
  }

  current = name;
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);

  const onEnter = enterHandlers.get(name);
  if (onEnter) {
    onEnter(payload);
  }
}
