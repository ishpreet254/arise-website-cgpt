"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * FAQ — hybrid scroll + free-floating cloud sky.
 * Per Master Spec §5.6, revised: realistic cloud shapes as speech bubbles,
 * each holding one question. Split across two vertically-stacked "parts"
 * that the user reaches with normal page scroll (no pin, no scroll-jack) —
 * Part 1 holds 3 clouds in a single viewport, Part 2 holds 4 clouds spread
 * across a taller stage so only 2–3 are ever in frame at once. Within each
 * part the clouds keep the "current" behaviour: continuous, slow, gentle
 * drift, click to open a full-screen reveal (question left / answer right).
 *
 * Fewer clouds per screen + a taller canvas for the 4-cloud part means
 * bigger cloud art (esp. the wide/rectangle shape) never has to overlap.
 *
 * Three-layer transform separation (kept from the original build, still
 * the reason GSAP and CSS never fight over `transform`):
 *   .faq__cloud-wrap  → static placement (left/top position, scale, rotate)
 *   .faq__cloud-anim  → GSAP-owned (continuous horizontal drift)
 *   .faq__cloud       → CSS-owned ambient float loop (translate, not transform)
 */

const CLOUD_SHAPES = {
  wide: { ratio: 1672 / 941 },
  tall: { ratio: 1322 / 1190 },
  round: { ratio: 1254 / 1254 },
  wispy: { ratio: 1774 / 887 },
};

// Part 1 — three clouds, one full viewport.
const PART_ONE = [
  {
    slug: "services",
    shape: "wide",
    question: "What services does ARISE offer?",
    answer:
      "Branding & design, web and software development, AI & automation, business analytics, digital marketing, e-commerce, and ongoing support & maintenance — everything under one roof so your brand and your tech stay in sync.",
    pos: { left: "22%", top: "32%" },
    scale: 1.02,
    rotate: -2,
    drift: "ltr",
    driftDuration: 58,
    driftDelay: 0,
    driftRange: 9.5,
  },
  {
    slug: "process",
    shape: "round",
    question: "What does your design process look like?",
    answer:
      "Every project starts with understanding your brand's purpose, then moves through concept, refinement, and delivery — with clear communication at each stage so there are no surprises.",
    pos: { left: "84%", top: "24%" },
    scale: 0.98,
    rotate: -1,
    drift: "ltr",
    driftDuration: 50,
    driftDelay: 9,
    driftRange: 7,
  },
  {
    slug: "startups",
    shape: "tall",
    question: "Do you work with startups, or only established businesses?",
    answer:
      "Both. Whether you're a startup shaping your first identity or an established company pushing into new territory, we tailor the approach to where you actually are.",
    pos: { left: "56%", top: "84%" },
    scale: 1,
    rotate: 1.5,
    drift: "rtl",
    driftDuration: 64,
    driftDelay: 4,
    driftRange: 8.1,
  },
];

// Part 2 — four clouds, spread across a taller canvas so scrolling only
// ever brings 2–3 into frame together.
const PART_TWO = [
  {
    slug: "timeline",
    shape: "wispy",
    question: "How long does a typical project take?",
    answer:
      "It depends on scope, but we run on fast turnaround without cutting corners — a logo or brand identity typically moves quicker than a full website or software build.",
    pos: { left: "30%", top: "8%" },
    scale: 0.98,
    rotate: 2,
    drift: "rtl",
    driftDuration: 70,
    driftDelay: 1,
    driftRange: 10.5,
  },
  {
    slug: "portfolio",
    shape: "wide",
    question: "Can I see examples of your previous work?",
    answer:
      "Yes — take a look through the Portfolio section above for real client projects across branding, marketing, and identity work.",
    pos: { left: "72%", top: "30%" },
    scale: 1.02,
    rotate: -1.5,
    drift: "ltr",
    driftDuration: 60,
    driftDelay: 12,
    driftRange: 9.5,
  },
  {
    slug: "support",
    shape: "tall",
    question: "Do you offer support after a project launches?",
    answer: "Yes, support & maintenance is one of our core services — we don't disappear after handoff.",
    pos: { left: "24%", top: "56%" },
    scale: 1,
    rotate: 1,
    drift: "rtl",
    driftDuration: 66,
    driftDelay: 6,
    driftRange: 8.1,
  },
  {
    slug: "getstarted",
    shape: "round",
    question: "How do I get started?",
    answer: "Reach out through the form below or contact us directly — tell us what you need, and we'll take it from there.",
    pos: { left: "76%", top: "84%" },
    scale: 0.96,
    rotate: -2,
    drift: "ltr",
    driftDuration: 52,
    driftDelay: 16,
    driftRange: 7,
  },
];

// Flat list (order = stable index used for refs / lightbox lookups),
// tagged with which part each item belongs to.
const FAQ_ITEMS = [
  ...PART_ONE.map((item) => ({ ...item, part: 1 })),
  ...PART_TWO.map((item) => ({ ...item, part: 2 })),
];

export default function FAQ() {
  const rootRef = useRef(null);
  const cloudRefs = useRef([]);
  const tweensRef = useRef([]);

  const [theme, setTheme] = useState("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  // ---- theme sync (same MutationObserver pattern used across the site) ----
  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = window.localStorage.getItem("arise-theme");
    const currentTheme = storedTheme === "light" ? "light" : root.dataset.theme || "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(currentTheme);

    const observer = new MutationObserver(() => {
      setTheme(root.dataset.theme === "light" ? "light" : "dark");
    });
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // ---- reduced motion check ----
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReduced);
  }, []);

  // ---- continuous free-float drift, all 7 clouds simultaneously, slow & gentle ----
  useEffect(() => {
    if (reducedMotion) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const ctx = gsap.context(() => {
      tweensRef.current = FAQ_ITEMS.map((item, i) => {
        const el = cloudRefs.current[i];
        if (!el) return null;

        const direction = item.drift === "rtl" ? -1 : 1;
        const sweep = item.driftRange ?? 8;
        const startX = `${-direction * sweep}vw`;
        const endX = `${direction * sweep}vw`;

        return gsap.fromTo(
          el,
          { x: startX },
          {
            x: endX,
            duration: item.driftDuration,
            delay: item.driftDelay,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }
        );
      });
    }, root);

    return () => {
      ctx.revert();
      tweensRef.current = [];
    };
  }, [reducedMotion]);

  // ---- pause every animation (GSAP drift + CSS float/ambient) while the
  // section is off-screen, so a scrolled-past FAQ doesn't keep costing
  // frames for the rest of the page — resumes just before it's reached ----
  useEffect(() => {
    if (reducedMotion) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          tweensRef.current.forEach((tween) => tween && tween.resume());
          root.classList.remove("faq--paused");
        } else {
          tweensRef.current.forEach((tween) => tween && tween.pause());
          root.classList.add("faq--paused");
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const handleCloudClick = useCallback((index) => {
    setOpenIndex(index);
  }, []);

  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  // ---- Escape closes the open answer lightbox ----
  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex]);

  const dayNight = theme === "light" ? "day" : "night";
  const skySrc = `/faq/faq-sky-${dayNight}.webp`;
  const ambientSrc = `/faq/faq-ambient-${dayNight}.webp`;
  const activeItem = openIndex !== null ? FAQ_ITEMS[openIndex] : null;

  // ---- reduced-motion fallback: static Q&A list, no clouds/drift ----
  if (reducedMotion) {
    return (
      <section id="faq" className="faq faq--static" data-section="FAQ">
        <div className="faq__static-header">
          <p className="faq__eyebrow">FAQ</p>
          <h2 className="faq__heading">Questions, answered</h2>
        </div>
        <div className="faq__static-list">
          {FAQ_ITEMS.map((item) => (
            <details key={item.slug} className="faq__static-item">
              <summary className="faq__static-question">{item.question}</summary>
              <p className="faq__static-answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  // Renders one part's cloud sky (shared markup for both the single-screen
  // and taller multi-screen stages).
  const renderClouds = (items) =>
    items.map((item) => {
      const i = FAQ_ITEMS.findIndex((entry) => entry.slug === item.slug);
      const ratio = CLOUD_SHAPES[item.shape].ratio;
      const isOpen = openIndex === i;
      return (
        <div
          key={item.slug}
          className="faq__cloud-wrap"
          style={{
            left: item.pos.left,
            top: item.pos.top,
            "--faq-scale": item.scale,
            "--faq-rotate": `${item.rotate}deg`,
          }}
        >
          <div
            ref={(el) => {
              cloudRefs.current[i] = el;
            }}
            className="faq__cloud-anim"
          >
            <button
              type="button"
              className={`faq__cloud faq__cloud--${item.shape}${isOpen ? " is-open" : ""}`}
              style={{
                backgroundImage: `url(/faq/faq-cloud-${item.shape}-${dayNight}.webp)`,
                aspectRatio: ratio,
                animationDelay: `${(i % 4) * -1.3}s`,
              }}
              onClick={() => handleCloudClick(i)}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
            >
              <span className="faq__cloud-question">{item.question}</span>
            </button>
          </div>
        </div>
      );
    });

  return (
    <section ref={rootRef} id="faq" className="faq" data-section="FAQ">
      {/* ---- Part 1 — three clouds, one screen ---- */}
      <div className="faq__stage faq__stage--one">
        <div className="faq__backdrop" style={{ backgroundImage: `url(${skySrc})` }} aria-hidden="true" />
        <div
          className="faq__ambient faq__ambient--a"
          style={{ backgroundImage: `url(${ambientSrc})` }}
          aria-hidden="true"
        />
        <div
          className="faq__ambient faq__ambient--b"
          style={{ backgroundImage: `url(${ambientSrc})` }}
          aria-hidden="true"
        />

        <div className="faq__eyebrow-row">
          <p className="faq__eyebrow">FAQ</p>
          <h2 className="faq__heading">Questions, answered</h2>
        </div>

        <div className="faq__sky">{renderClouds(PART_ONE)}</div>

        <div className="faq__scroll-cue" aria-hidden="true">
          <span className="faq__scroll-cue-line" />
        </div>

        <div className="faq__part-fade" aria-hidden="true" />
      </div>

      {/* ---- Part 2 — four clouds, tall canvas, reached by scrolling ---- */}
      <div className="faq__stage faq__stage--two">
        <div className="faq__part-fade faq__part-fade--top" aria-hidden="true" />
        <div className="faq__backdrop" style={{ backgroundImage: `url(${skySrc})` }} aria-hidden="true" />
        <div
          className="faq__ambient faq__ambient--a"
          style={{ backgroundImage: `url(${ambientSrc})` }}
          aria-hidden="true"
        />
        <div
          className="faq__ambient faq__ambient--b"
          style={{ backgroundImage: `url(${ambientSrc})` }}
          aria-hidden="true"
        />

        <div className="faq__sky faq__sky--tall">{renderClouds(PART_TWO)}</div>
      </div>

      {activeItem && (
        <div className="faq__lightbox" role="dialog" aria-modal="true" aria-labelledby="faq-lightbox-question">
          <div className="faq__lightbox-backdrop" onClick={closeLightbox} aria-hidden="true" />
          <div className="faq__lightbox-panel">
            <button type="button" className="faq__lightbox-close" onClick={closeLightbox} aria-label="Close answer">
              ×
            </button>
            <div className="faq__lightbox-question">
              <p className="faq__lightbox-eyebrow">Question</p>
              <h3 id="faq-lightbox-question">{activeItem.question}</h3>
            </div>
            <div className="faq__lightbox-divider" aria-hidden="true" />
            <div className="faq__lightbox-answer">
              <p className="faq__lightbox-eyebrow">Answer</p>
              <p>{activeItem.answer}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}