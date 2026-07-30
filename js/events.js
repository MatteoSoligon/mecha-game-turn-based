/**
 * Event emitter abstractions so the domain layer (Robot, Battle, ...) can
 * announce things without depending directly on the browser `window`.
 * This is the Dependency Inversion seam: domain code depends on the
 * small `emit(name, detail)` contract, not on a concrete transport.
 */

export class WindowEventEmitter {
  emit(name, detail) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

/** No-op emitter, e.g. for headless simulations that must not show popups. */
export class SilentEventEmitter {
  emit() {}
}

export const defaultEmitter = new WindowEventEmitter();
export const silentEmitter = new SilentEventEmitter();
