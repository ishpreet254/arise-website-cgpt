"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Testimonials — "wind-blown newspaper" section.
 * See project handoff doc (ARISE_Testimonials_Section_Planning_v1) for the
 * full confirmed spec this implements. Key points reflected here:
 *   - Each testimonial is a single baked-text photographic image (day/night),
 *     not HTML text over a template.
 *   - First newspaper auto-flies in on scroll into the section (no click).
 *   - Next-only navigation (loops back to the first after the last — not
 *     explicitly specified in the doc, chosen as the sensible default for a
 *     one-directional control).
 *   - On Next: outgoing card compresses/folds/fades out toward the left
 *     edge, then the next card flies in with the same wind entrance as the
 *     very first one (the separate rolled-newspaper asset was tried and
 *     dropped — didn't read well — so the exit is just the card's own
 *     transform, no handoff to another image).
 *   - Reduced motion: static stacked list of all 5 (matches Services/About).
 *   - Mobile: shorter/less exaggerated version of the same beats, not a
 *     different animation (matches Portfolio's walk-cycle mobile tuning).
 *
 * All 10 client assets + 2 backdrop textures are wired in from
 * /public/testimonials/. (2 rolled-newspaper assets remain in that folder,
 * unused — see note above.)
 */

const TESTIMONIALS = [
  {
    slug: "holyqueen",
    headline: "A Brand Identity We Can Bank On",
    quote:
      "ARISE gave Holy Queen Credit Souhardha Co-operative Society a complete identity — logo, brochure, letterhead, ID cards, certificates, even our passbooks. Every member-facing document now feels consistent, trustworthy, and unmistakably ours.",
    byline: "Management, Holy Queen Credit Souhardha Co-operative Society Ltd.",
  },
  {
    slug: "royallook",
    headline: "Posters That Bring Customers Through the Door",
    quote:
      "The advertisement posters ARISE designed for Royal Look turned heads before customers even walked in. Bold, elegant, and completely on-brand — exactly the glow-up our marketing needed.",
    byline: "Nishu Sharma, Owner, Royal Look Parlour",
  },
  {
    slug: "omorfia",
    headline: "A Logo That Finally Feels Like Us",
    quote:
      "Our new logo captures exactly what Omorfia stands for — elegance, warmth, and quiet luxury. ARISE understood our salon's personality better than we could put into words.",
    byline: "Owner, Omorfia",
  },
  {
    slug: "prodigy",
    headline: "Designers Impressing Designers",
    quote:
      "As designers ourselves, we're picky. ARISE nailed our business card on the first pass — sharp, minimal, and instantly recognizable in a stack of a hundred others.",
    byline: "Founder, Prodigy",
  },
  {
    slug: "sslight",
    headline: "Promotions That Look As Good As the Deals",
    quote:
      "Every flyer, pamphlet, and scheme card ARISE designs for us brings customers straight through the door. Our promotions finally look as exciting as the deals themselves.",
    byline: "Owner, SS Sulight",
  },
];

const TOTAL = String(TESTIMONIALS.length).padStart(2, "0");

// Entrance duration for a card flying in (wind fly-in). Mobile gets a
// shorter version of the same beats per the mobile-tuning precedent.
const ENTER_DURATION = { desktop: 1.05, mobile: 0.7 };
const EXIT_DURATION = { desktop: 0.5, mobile: 0.34 };

export default function Testimonials() {
  const rootRef = useRef(null);
  const cardRefs = useRef([]);

  const [theme, setTheme] = useState("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [inView, setInView] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  const isMountedRef = useRef(true);
  const hasEnteredRef = useRef(false); // guards the one-time auto fly-in

  // ---- theme sync (same MutationObserver pattern as Hero/Portfolio) ----
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
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  // ---- reduced motion check ----
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReduced);
  }, []);

  // ---- visibility check, drives the one-shot auto entrance ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---- rest state: every card parked off-screen right except the active
  // one, which sits centered. Re-applied whenever reducedMotion resolves so
  // the animated stage never flashes mid-position before JS takes over. ----
  useEffect(() => {
    if (reducedMotion) return;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      if (i === activeIndex) {
        gsap.set(card, { x: 0, y: 0, rotate: 0, scale: 1, autoAlpha: hasEnteredRef.current ? 1 : 0 });
      } else {
        gsap.set(card, { x: "55vw", y: 0, rotate: 6, scale: 0.86, autoAlpha: 0 });
      }
    });
    // Only needs to run once on mount — goToNext owns every subsequent change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // ---- one-time entrance: first newspaper auto-flies in the moment the
  // section scrolls into view, no click required ----
  useEffect(() => {
    if (!inView || hasEnteredRef.current || reducedMotion) return;
    hasEnteredRef.current = true;

    const card = cardRefs.current[activeIndex];
    if (!card) return;

    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const duration = isMobile ? ENTER_DURATION.mobile : ENTER_DURATION.desktop;

    gsap.set(card, { x: "60vw", y: 0, rotate: 9, scale: 0.85, autoAlpha: 0 });
    gsap.timeline().to(card, {
      keyframes: isMobile
        ? [{ x: "0vw", rotate: 0, scale: 1, autoAlpha: 1, duration, ease: "power2.out" }]
        : [
            // Launch — fast inward move, still mid-flight.
            { x: "14vw", rotate: -4, scale: 0.94, autoAlpha: 1, duration: duration * 0.5, ease: "power2.out" },
            // Flutter — 2 quick decaying oscillations, catching air mid-flight.
            { x: "4vw", rotate: 5, scale: 0.98, duration: duration * 0.18, ease: "sine.inOut" },
            { x: "-2vw", rotate: -2.5, scale: 1.01, duration: duration * 0.14, ease: "sine.inOut" },
            // Settle — small rotational overshoot-and-correct, "thumps" into place.
            { x: "1vw", rotate: 1.2, scale: 0.995, duration: duration * 0.1, ease: "sine.inOut" },
            { x: "0vw", rotate: 0, scale: 1, duration: duration * 0.08, ease: "power1.out" },
          ],
    });
  }, [inView, reducedMotion, activeIndex]);

  const goToNext = useCallback(() => {
    if (isAnimating || reducedMotion) return;

    const nextIndex = (activeIndex + 1) % TESTIMONIALS.length;
    const outgoing = cardRefs.current[activeIndex];
    const incoming = cardRefs.current[nextIndex];
    if (!outgoing || !incoming) return;

    setIsAnimating(true);

    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    const exitDuration = isMobile ? EXIT_DURATION.mobile : EXIT_DURATION.desktop;
    const enterDuration = isMobile ? ENTER_DURATION.mobile : ENTER_DURATION.desktop;

    gsap.set(incoming, { x: "60vw", y: 0, rotate: 9, scale: 0.85, autoAlpha: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        if (!isMountedRef.current) return;
        setActiveIndex(nextIndex);
        setIsAnimating(false);
      },
    });

    // Outgoing card compresses toward the left edge with a faked fold
    // (skewY reads as a 3D roll under perspective without an actual mesh
    // deformation) while fading out — not a paper simulation, a well-timed
    // crossfade dressed with a squash/fold, matching the
    // illusion-over-simulation bar used elsewhere on the site.
    tl.to(
      outgoing,
      {
        x: "-38vw",
        scaleX: 0.12,
        skewY: isMobile ? -6 : -10,
        rotate: -8,
        autoAlpha: 0,
        duration: exitDuration,
        ease: "power2.in",
      },
      0,
    );

    // Incoming card flies in right after the outgoing one clears, using the
    // same wind-entrance beats as the section's initial auto fly-in.
    tl.to(
      incoming,
      {
        keyframes: isMobile
          ? [{ x: "0vw", rotate: 0, scale: 1, autoAlpha: 1, duration: enterDuration, ease: "power2.out" }]
          : [
              { x: "14vw", rotate: -4, scale: 0.94, autoAlpha: 1, duration: enterDuration * 0.5, ease: "power2.out" },
              { x: "4vw", rotate: 5, scale: 0.98, duration: enterDuration * 0.18, ease: "sine.inOut" },
              { x: "-2vw", rotate: -2.5, scale: 1.01, duration: enterDuration * 0.14, ease: "sine.inOut" },
              { x: "1vw", rotate: 1.2, scale: 0.995, duration: enterDuration * 0.1, ease: "sine.inOut" },
              { x: "0vw", rotate: 0, scale: 1, duration: enterDuration * 0.08, ease: "power1.out" },
            ],
      },
      exitDuration * 0.55,
    );

    // Reset the outgoing card off-screen right so it's ready for its own
    // next entrance once it cycles back around.
    tl.set(outgoing, { x: "55vw", y: 0, rotate: 6, scale: 0.86, skewY: 0, scaleX: 1 });
  }, [activeIndex, isAnimating, reducedMotion]);

  const handleNextClick = useCallback(() => {
    if (reducedMotion) return;
    goToNext();
  }, [goToNext, reducedMotion]);

  // ---- open the full-text popup for the currently-active newspaper,
  // same reveal pattern as the FAQ cloud lightbox ----
  const handleCardClick = useCallback(
    (index) => {
      if (index !== activeIndex || isAnimating) return;
      setOpenIndex(index);
    },
    [activeIndex, isAnimating],
  );

  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  // ---- keyboard: right arrow advances, only while section is in view and
  // no popup is open ----
  useEffect(() => {
    if (!inView || reducedMotion || openIndex !== null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inView, reducedMotion, goToNext, openIndex]);

  // ---- Escape closes the open testimonial popup ----
  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex]);

  const dayNight = theme === "light" ? "day" : "night";
  const bgSrc = `/testimonials/testimonials-bg-${dayNight}.webp`;
  const activeItem = TESTIMONIALS[activeIndex];

  // ---- reduced-motion fallback: static stacked list, matches Services/About/Portfolio precedent ----
  if (reducedMotion) {
    return (
      <section id="testimonials" className="testimonials testimonials--static" data-section="Testimonials">
        <div className="testimonials__static-header">
          <p className="testimonials__eyebrow">Testimonials</p>
          <h2 className="testimonials__heading">What clients are saying</h2>
        </div>
        <div className="testimonials__static-list">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              className="testimonials__static-item"
              onClick={() => setOpenIndex(i)}
              aria-haspopup="dialog"
              aria-expanded={openIndex === i}
              aria-label={`Read full testimonial: ${item.headline}`}
            >
              <img
                src={`/testimonials/testimonials-${item.slug}-day.webp`}
                alt={`${item.headline} — “${item.quote}” — ${item.byline}`}
                className="testimonials__static-image"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {openIndex !== null && (
          <div
            className="testimonials__lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby="testimonials-lightbox-headline"
          >
            <div className="testimonials__lightbox-backdrop" onClick={closeLightbox} aria-hidden="true" />
            <div className="testimonials__lightbox-panel">
              <button
                type="button"
                className="testimonials__lightbox-close"
                onClick={closeLightbox}
                aria-label="Close testimonial"
              >
                ×
              </button>
              <p className="testimonials__lightbox-eyebrow">Client Feedback</p>
              <h3 id="testimonials-lightbox-headline">{TESTIMONIALS[openIndex].headline}</h3>
              <p className="testimonials__lightbox-quote">&ldquo;{TESTIMONIALS[openIndex].quote}&rdquo;</p>
              <p className="testimonials__lightbox-byline">— {TESTIMONIALS[openIndex].byline}</p>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section ref={rootRef} id="testimonials" className="testimonials" data-section="Testimonials">
      <div className="testimonials__backdrop" style={{ backgroundImage: `url(${bgSrc})` }} aria-hidden="true" />

      <div className="testimonials__eyebrow-row">
        <p className="testimonials__eyebrow">Testimonials</p>
      </div>

      <div className="testimonials__stage">
        <div className="testimonials__cards">
          {TESTIMONIALS.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="testimonials__card"
              style={{
                backgroundImage: `url(/testimonials/testimonials-${item.slug}-${dayNight}.webp)`,
                zIndex: i === activeIndex ? 2 : 1,
              }}
              aria-hidden={i !== activeIndex}
              tabIndex={i === activeIndex ? 0 : -1}
              onClick={() => handleCardClick(i)}
              aria-haspopup="dialog"
              aria-expanded={openIndex === i}
              aria-label={`Read full testimonial: ${item.headline}`}
            >
              <span className="testimonials__sr-only">
                {item.headline} — &ldquo;{item.quote}&rdquo; — {item.byline}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="testimonials__progress" aria-hidden="true">
        {TESTIMONIALS.map((item, i) => (
          <span key={item.slug} className={`testimonials__tick${i === activeIndex ? " is-active" : ""}`} />
        ))}
      </div>

      <div className="testimonials__footer-row">
        <div className="testimonials__badge" aria-hidden="true">
          <span className="testimonials__badge-current">{String(activeIndex + 1).padStart(2, "0")}</span>
          <i />
          <span className="testimonials__badge-total">{TOTAL}</span>
        </div>

        <button
          type="button"
          className="testimonials__next-button"
          onClick={handleNextClick}
          disabled={isAnimating}
          aria-label={`Next testimonial: ${TESTIMONIALS[(activeIndex + 1) % TESTIMONIALS.length].byline}`}
        >
          Next
          <span className="testimonials__next-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <p className="testimonials__sr-only" aria-live="polite">
        Showing testimonial {activeIndex + 1} of {TESTIMONIALS.length}: {activeItem.headline}
      </p>

      {openIndex !== null && (
        <div
          className="testimonials__lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimonials-lightbox-headline"
        >
          <div className="testimonials__lightbox-backdrop" onClick={closeLightbox} aria-hidden="true" />
          <div className="testimonials__lightbox-panel">
            <button
              type="button"
              className="testimonials__lightbox-close"
              onClick={closeLightbox}
              aria-label="Close testimonial"
            >
              ×
            </button>
            <p className="testimonials__lightbox-eyebrow">Client Feedback</p>
            <h3 id="testimonials-lightbox-headline">{TESTIMONIALS[openIndex].headline}</h3>
            <p className="testimonials__lightbox-quote">&ldquo;{TESTIMONIALS[openIndex].quote}&rdquo;</p>
            <p className="testimonials__lightbox-byline">— {TESTIMONIALS[openIndex].byline}</p>
          </div>
        </div>
      )}
    </section>
  );
}
