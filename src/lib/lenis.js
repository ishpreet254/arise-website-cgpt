let lenisInstance = null;
let navigating = false;

export function setLenisInstance(instance) {
  lenisInstance = instance;
}

export function getLenisInstance() {
  return lenisInstance;
}

// Flags a programmatic, nav-triggered scroll (as opposed to the user
// scrolling by hand). Pinned/scroll-jacked sections (Services, About)
// listen for this so they stop stepping through their own internal
// transitions and locking Lenis mid-flight, which is what was causing
// nav jumps to get stuck inside those sections.
export function setNavigating(value) {
  navigating = value;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("arise:navigating", { detail: value }));
  }
}

export function isNavigating() {
  return navigating;
}
