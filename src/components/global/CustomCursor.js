"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  // Pass 1: Ensure initial hydration match between Server & Client
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Pass 2: Initialize physics and event listeners only after mounting on the client
  useEffect(() => {
    if (!mounted) return;

    // Hardware & Pointer Detection
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const noFinePointer = !window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasTouchSupport =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // Turn off tracking on mobile/touch screens
    if (coarsePointer || noFinePointer || reducedMotion || hasTouchSupport) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let rafId = 0;

    let targetX = -100;
    let targetY = -100;

    // Dot coordinates (Fast tracking)
    let dotX = -100;
    let dotY = -100;

    // Ring coordinates (Smooth trailing lag)
    let ringX = -100;
    let ringY = -100;

    const move = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const render = () => {
      dotX += (targetX - dotX) * 0.99;
      dotY += (targetY - dotY) * 0.99;

      ringX += (targetX - ringX) * 0.40;
      ringY += (targetY - ringY) * 0.40;

      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = requestAnimationFrame(render);
    };

    const interactiveSelector =
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

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", setHover);
      document.removeEventListener("pointerout", setHover);
      cancelAnimationFrame(rafId);
    };
  }, [mounted]);

  // Render nothing on SSR and during initial hydration pass
  if (!mounted) return null;

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}