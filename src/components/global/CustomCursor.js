"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Hardware & Pointer Detection
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const noFinePointer = !window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasTouchSupport =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Automatically turn off cursor on mobile / touch devices
    if (coarsePointer || noFinePointer || reducedMotion || hasTouchSupport) {
      setIsTouchDevice(true);
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let rafId = 0;

    let targetX = -100;
    let targetY = -100;

    // Dot coordinates (Fast precision tracking)
    let dotX = -100;
    let dotY = -100;

    // Ring coordinates (Silky trailing lag)
    let ringX = -100;
    let ringY = -100;

    const move = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const render = () => {
      // Direct interpolation for dual physics
      dotX += (targetX - dotX) * 0.99;
      dotY += (targetY - dotY) * 0.99;

      ringX += (targetX - ringX) * 0.98;
      ringY += (targetY - ringY) * 0.98;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = requestAnimationFrame(render);
    };

    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select, [data-cursor='interactive'], .menu-trigger, .nav-panel__close";
      "a, button, [role='button'], input, textarea, select, [data-cursor='interactive'], .menu-trigger, .nav-panel__close";

    const setHover = (event) => {
      const target = event.target.closest?.(interactiveSelector);
      if (target) {
        dot.classList.add("is-hovering");
        ring.classList.add("is-hovering");
      } else {
        dot.classList.remove("is-hovering");
        ring.classList.remove("is-hovering");
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", setHover, { passive: true });
    document.addEventListener("pointerout", setHover, { passive: true });

    document.addEventListener("pointerover", setHover, { passive: true });
    document.addEventListener("pointerout", setHover, { passive: true });

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", setHover);
      document.removeEventListener("pointerout", setHover);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Do not render anything on touch/mobile screens
  if (isTouchDevice) return null;

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}