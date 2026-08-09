"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "arise-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  // On first load in the browser, check if the person already picked a
  // theme on a previous visit and restore it.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      // Must read localStorage client-side only, after hydration, or the
      // server-rendered "dark" default and the client's first render
      // would mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      // TEMPORARY: plain dev-only control just to prove the token system
      // works. Gets replaced by the real nav/hamburger toggle per Master
      // Spec 4.1-4.2 once the global nav is built.
      style={{
        position: "fixed",
        top: "1.5rem",
        right: "1.5rem",
        zIndex: 50,
        padding: "0.5rem 1.1rem",
        borderRadius: "var(--radius-button)",
        border: "1px solid var(--hairline)",
        background: "var(--surface)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-caption)",
        letterSpacing: "var(--tracking-caption)",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
