"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!finePointer.matches || reducedMotion.matches) return;

    let rafId = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;

    const move = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const render = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      cursor.style.setProperty("--cursor-x", `${x}px`);
      cursor.style.setProperty("--cursor-y", `${y}px`);
      rafId = requestAnimationFrame(render);
    };

    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select, [data-cursor='interactive']";

    const setHover = (event) => {
      const target = event.target.closest?.(interactiveSelector);
      cursor.classList.toggle("is-hovering", Boolean(target));
    };

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", setHover);
    document.addEventListener("pointerout", setHover);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", setHover);
      document.removeEventListener("pointerout", setHover);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="custom-cursor" ref={cursorRef} aria-hidden="true">
      <span />
    </div>
  );
}
