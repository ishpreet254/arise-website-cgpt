 "use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "arise-theme";

const links = [
  { label: "Home", href: "#hero" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Reach Out", href: "#reach-out" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function setSiteTheme(nextTheme) {
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <header className={`site-nav${open ? " is-open" : ""}`}>
        <a
          className="site-nav__brand"
          href="#hero"
          aria-label="ARISE — home"
          onClick={closeMenu}
        >
          <img src="/logo/arise-logo.png" alt="ARISE" />
        </a>

        <nav className="site-nav__links" aria-label="Primary navigation">
          {links.slice(1, 5).map((link) => (
            <a key={link.href} href={link.href}>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        <button
          className="menu-trigger"
          type="button"
          aria-expanded={open}
          aria-controls="arise-menu"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="menu-trigger__label">{open ? "Close" : "Menu"}</span>
          <span className="menu-trigger__icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </header>

      <div
        className={`nav-backdrop${open ? " is-visible" : ""}`}
        aria-hidden="true"
        onClick={closeMenu}
      />

      <aside
        id="arise-menu"
        className={`nav-panel${open ? " is-visible" : ""}`}
        aria-hidden={!open}
      >
        <div className="nav-panel__top">
          <span className="nav-panel__eyebrow">ARISE / INDEX</span>
          <button type="button" className="nav-panel__close" onClick={closeMenu}>
            <span>Esc</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="nav-panel__body">
          <div className="nav-panel__navigation">
            <p className="nav-panel__label">Navigate</p>
            <div className="nav-panel__list">
              {links.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                >
                  <span className="nav-panel__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="nav-panel__link">{link.label}</span>
                  <span className="nav-panel__arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>

          <div className="nav-panel__aside">
            <div className="nav-panel__statement">
              <span className="nav-panel__label">Direction</span>
              <p>
                Creative thinking.
                <br />
                Technical precision.
                <br />
                Built to rise.
              </p>
            </div>

            <div className="nav-panel__theme">
              <span className="nav-panel__label">Appearance</span>
              <div className="theme-switch" role="group" aria-label="Theme">
                <button
                  type="button"
                  className={theme === "dark" ? "is-active" : ""}
                  onClick={() => setSiteTheme("dark")}
                  aria-pressed={theme === "dark"}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={theme === "light" ? "is-active" : ""}
                  onClick={() => setSiteTheme("light")}
                  aria-pressed={theme === "light"}
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-panel__footer">
          <span>Rise Beyond Imagination</span>
          <span>© ARISE</span>
        </div>
      </aside>
    </>
  );
}
