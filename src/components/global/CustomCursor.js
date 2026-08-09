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
    let x = -100;
    let y = -100;
    let targetX = -100;
    let targetY = -100;

    const move = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const render = () => {
      // 0.22 factor offers a silky smooth trail with zero noticeable latency
      x += (targetX - x) * 0.22;
      y += (targetY - y) * 0.22;

      // Direct hardware-accelerated transformation
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      rafId = requestAnimationFrame(render);
    };

    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select, [data-cursor='interactive'], .menu-trigger, .nav-panel__close";

    const setHover = (event) => {
      const target = event.target.closest?.(interactiveSelector);
      cursor.classList.toggle("is-hovering", Boolean(target));
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
  }, []);

  return (
    <div className="custom-cursor" ref={cursorRef} aria-hidden="true">
      <span />
    </div>
  );
}
