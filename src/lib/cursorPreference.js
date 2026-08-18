export const CURSOR_STORAGE_KEY = "arise-cursor";
export const CURSOR_EVENT = "arise:cursor-toggle";

// Custom/animated cursor is opt-in — default is off.
export function getStoredCursorPreference() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CURSOR_STORAGE_KEY) === "on";
}

// Persists the preference, syncs the <html> attribute (so CSS can react
// without JS), and broadcasts a CustomEvent so any mounted component —
// even one that isn't a parent/child of the toggle — can pick up the
// change immediately.
export function setCursorPreference(enabled) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CURSOR_STORAGE_KEY, enabled ? "on" : "off");
  document.documentElement.setAttribute("data-custom-cursor", enabled ? "on" : "off");
  window.dispatchEvent(new CustomEvent(CURSOR_EVENT, { detail: enabled }));
}
