"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const HERO_MEDIA = {
  dark: {
    video: "/hero/hero-dark.mp4",
    image: "/hero/hero-dark.png",
  },
  light: {
    video: "/hero/hero-light.mp4",
    image: "/hero/hero-light.png",
  },
};

export default function Hero() {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem("arise-theme");
    const currentTheme = storedTheme === "light" ? "light" : root.dataset.theme || "dark";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      const nextTheme = root.dataset.theme === "light" ? "light" : "dark";
      setTheme(nextTheme);
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    const playPromise = video.play();

    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Autoplay can be blocked by the browser. The poster image remains visible.
      });
    }
  }, [theme]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero__eyebrow, .hero__title-line, .hero__copy, .hero__actions, .hero__meta",
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.2,
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  const media = HERO_MEDIA[theme];

  return (
    <section ref={rootRef} id="hero" className="hero" data-section="Hero">
      <div className="hero__media" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero__video"
          key={media.video}
          src={media.video}
          poster={media.image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="hero__image" style={{ backgroundImage: `url(${media.image})` }} />
        <div className="hero__veil" />
        <div className="hero__grain" />
      </div>

      <div className="hero__content">
        <p className="hero__eyebrow">Creative &amp; Technology Studio</p>

        <h1 className="hero__title" aria-label="Rise Beyond Imagination">
          <span className="hero__title-line">Rise Beyond</span>
          <span className="hero__title-line hero__title-line--accent">Imagination.</span>
        </h1>

        <p className="hero__copy">
          We shape ambitious ideas through strategy, design and technology —
          building brands and digital experiences made to move forward.
        </p>

        <div className="hero__actions">
          <a className="hero__button hero__button--primary" href="#services">
            <span>Explore what we do</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a className="hero__button hero__button--secondary" href="#reach-out">
            Start a conversation
          </a>
        </div>

        <div className="hero__meta" aria-label="ARISE capabilities">
          <span>Branding</span>
          <i aria-hidden="true" />
          <span>Digital</span>
          <i aria-hidden="true" />
          <span>Technology</span>
          <i aria-hidden="true" />
          <span>AI</span>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll to explore</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}
