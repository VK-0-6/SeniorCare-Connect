// utils/eventBus.js — minimal pub/sub for cross-module communication.
// Decouples features (e.g. auth state changes) from their consumers.

const listeners = new Map();

export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

export function off(event, handler) {
  listeners.get(event)?.delete(handler);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.error(`eventBus handler error for "${event}":`, err);
    }
  });
}
