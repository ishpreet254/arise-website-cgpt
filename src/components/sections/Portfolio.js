"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * ASSET STATUS (v1.2): real environment + frame + silhouette assets wired in.
 *   - Panorama (day/night): received. NOTE — the two source files have
 *     slightly different aspect ratios (2.50 vs 2.67), so background-size:
 *     cover is used to fill the box either way; expect a subtle crop/zoom
 *     shift on theme toggle rather than a perfectly seamless match.
 *   - Frame overlays (landscape + portrait, day + night): received. The
 *     transparent opening in each was measured directly from the pixel
 *     alpha data (see FRAME_INSETS below) rather than estimated.
 *   - Silhouette (stand + walk, day + night): received.
 *   - Portfolio piece images + captions: still placeholder data below —
 *     swap in real slugs/titles/categories once final.
 *
 * File locations (all present now except pieces/*):
 *   /public/portfolio/panorama-day.png
 *   /public/portfolio/panorama-night.png
 *   /public/portfolio/frame-landscape-day.png
 *   /public/portfolio/frame-landscape-night.png
 *   /public/portfolio/frame-portrait-day.png
 *   /public/portfolio/frame-portrait-night.png
 *   /public/portfolio/silhouette-stand-day.png
 *   /public/portfolio/silhouette-stand-night.png
 *   /public/portfolio/silhouette-walk-day.png
 *   /public/portfolio/silhouette-walk-night.png
 *   /public/portfolio/pieces/<slug>.jpg   — one per portfolio piece, NOT YET provided
 *
 * FRAME SELECTION: auto-detected per piece from that piece's own image
 * dimensions (landscape image -> landscape frame, portrait image -> portrait
 * frame) — see the orientation-detection effect below.
 *
 * OPEN DECISIONS still carried over from the build brief:
 *   - Silhouette direction: single-facing art, mirrored via GSAP scaleX
 *     (set directly on the animated element, not a CSS class — see goTo).
 *     NOTE: the arrival "settle" bounce must animate scaleY only, never the
 *     combined `scale` shorthand — `scale` writes both axes and silently
 *     resets this mirror back to 1 on every walk.
 *   - Carpet: baked into the panorama art, not a separate layer.
 *   - Wall texture (panorama-day/night.png, aka Corridor_-_Light/Dark) tiles
 *     infinitely via CSS background-repeat and is panned by animating
 *     background-position-x on a dedicated layer (panoramaRef) that never
 *     itself receives a transform. The frames ride on a separate `trackRef`
 *     element that gets the actual x transform, kept in lockstep with the
 *     background pan so the wall and the frames always move together.
 */

const FRAME_STEP_VW = 32; // horizontal distance between frame positions, tune to real art

// The active frame is always pinned to this fixed horizontal position (in vw)
// regardless of which index is active — track/panorama transform is computed
// as START_OFFSET_VW - activeIndex*FRAME_STEP_VW, so the "current" picture
// always lands in the same spot. Left of that spot is empty corridor where
// the silhouette stands, fixed, facing right toward whatever is currently
// active — see .portfolio__ground-anchor in globals.css.
const START_OFFSET_VW = 42;

// Measured directly from each frame PNG's alpha channel (% inset from each
// canvas edge to where the transparent opening begins). Landscape's top/
// bottom are larger than left/right because that canvas has empty padding
// above and below the frame artwork itself, not just border thickness.
const FRAME_INSETS = {
  landscape: { top: "9.57%", right: "6.90%", bottom: "11.13%", left: "6.90%" },
  portrait: { top: "11.64%", right: "14.41%", bottom: "12.15%", left: "14.32%" },
};

const WALK_DURATION = 0.85; // seconds, matches CSS bob animation length below

const FRAME_ASSETS = {
  landscape: { day: "/portfolio/frame-landscape-day.png", night: "/portfolio/frame-landscape-night.png" },
  portrait: { day: "/portfolio/frame-portrait-day.png", night: "/portfolio/frame-portrait-night.png" },
};

// Order is interleaved landscape/portrait (L,P,L,P,...) rather than grouped,
// so the frame shape alternates as visitors step through the corridor
// instead of running all 5 landscape pieces before the 4 portrait ones.
const PORTFOLIO_ITEMS = [
  { slug: "holy-queen-logo", title: "Holy Queen Credit Souhardha — Logo & Brand Mark", category: "Branding" }, // landscape
  { slug: "nishu-sharma-flyer", title: "Nishu Sharma Makeup — Promotional Flyer", category: "Digital Marketing" }, // portrait
  { slug: "holy-queen-brochure", title: "Holy Queen — Tri-fold Brochure", category: "Branding" }, // landscape
  { slug: "ss-sunlite-poster", title: "SS Sunlite Enterprises — Scheme Poster", category: "Digital Marketing" }, // portrait
  { slug: "holy-queen-business-card", title: "Holy Queen — Business Card", category: "Branding" }, // landscape
  { slug: "ss-sunlite-coupon-dark", title: "SS Sunlite Enterprises — Membership Coupon", category: "Branding" }, // portrait
  { slug: "prodigy-logo", title: "Prodigy — Brand Identity", category: "Branding" }, // landscape
  { slug: "ss-sunlite-coupon-light", title: "SS Sunlite Enterprises — Membership Coupon (Alt)", category: "Branding" }, // portrait
  { slug: "omorfia-logo", title: "Omorfiá — Makeup Brand Identity", category: "Branding" }, // landscape
];

export default function Portfolio() {
  const rootRef = useRef(null);
  const panoramaRef = useRef(null);
  const trackRef = useRef(null);
  const silhouetteRef = useRef(null);
  const shadowRef = useRef(null);

  const [theme, setTheme] = useState("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [inView, setInView] = useState(false);
  const [imageErrors, setImageErrors] = useState({}); // { [slug]: true } once a piece image fails to load

  const isMountedRef = useRef(true);
  const touchStartX = useRef(null);
  const hasEnteredRef = useRef(false); // guards the one-time bottom-left walk-in

  // ---- auto-detect each piece's frame orientation from its own image ----
  const [orientations, setOrientations] = useState({}); // { [slug]: 'landscape' | 'portrait' }

  useEffect(() => {
    let cancelled = false;

    PORTFOLIO_ITEMS.forEach((item) => {
      const img = new window.Image();
      img.onload = () => {
        if (cancelled) return;
        const detected = img.naturalWidth >= img.naturalHeight ? "landscape" : "portrait";
        setOrientations((prev) =>
          prev[item.slug] === detected ? prev : { ...prev, [item.slug]: detected },
        );
      };
      // onerror: leave undetected — falls back to 'landscape' default at render time
      img.src = `/portfolio/pieces/${item.slug}.jpg`;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- theme sync (same MutationObserver pattern as Hero) ----
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

  // ---- visibility check, so keyboard arrows only drive this section when it's on screen ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ---- set the track/panorama's resting position on mount, and on every
  // reducedMotion change, so the active frame starts at START_OFFSET_VW
  // instead of at the literal left edge (index*FRAME_STEP_VW with no base
  // offset) ----
  useEffect(() => {
    if (reducedMotion) return;
    const panorama = panoramaRef.current;
    const track = trackRef.current;
    const restX = `${START_OFFSET_VW - activeIndex * FRAME_STEP_VW}vw`;
    if (panorama) gsap.set(panorama, { backgroundPositionX: restX });
    if (track) gsap.set(track, { x: restX });
    // Only needs to run once on mount — goTo owns this transform for every
    // subsequent index change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // ---- one-time entrance: silhouette walks in from the stage's bottom-left
  // corner to its resting position the first time the section comes into view ----
  useEffect(() => {
    if (!inView || hasEnteredRef.current) return;
    hasEnteredRef.current = true;

    const silhouette = silhouetteRef.current;
    const shadow = shadowRef.current;
    if (!silhouette) return;

    if (reducedMotion) return; // static fallback render doesn't use this stage at all

    setIsWalking(true);
    gsap.set(silhouette, { scaleX: 1 });
    gsap.fromTo(
      silhouette,
      { x: "-38vw", y: 0, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1.1,
        ease: "power2.out",
        onComplete: () => {
          if (isMountedRef.current) setIsWalking(false);
        },
      },
    );
    if (shadow) {
      gsap.fromTo(
        shadow,
        { x: "-38vw", opacity: 0 },
        { x: 0, opacity: 0.55, duration: 1.1, ease: "power2.out" },
      );
    }
  }, [inView, reducedMotion]);

  const goTo = useCallback(
    (nextIndex, direction) => {
      if (isWalking) return;
      if (nextIndex < 0 || nextIndex >= PORTFOLIO_ITEMS.length) return;

      if (reducedMotion) {
        setActiveIndex(nextIndex);
        return;
      }

      setIsWalking(true);

      const panorama = panoramaRef.current;
      const track = trackRef.current;
      const silhouette = silhouetteRef.current;
      const shadow = shadowRef.current;
      const stepSign = direction === "next" ? 1 : -1; // sway direction matches travel direction

      // Mirror instantly (not animated) so it's correct from the first frame of
      // the walk, and persists into the resting pose afterward. Set via GSAP
      // rather than a CSS class — GSAP owns this element's `transform` for the
      // whole walk cycle, and an inline-style write would otherwise silently
      // override a class-based transform.
      if (silhouette) {
        gsap.set(silhouette, { scaleX: direction === "prev" ? -1 : 1 });
      }

      const tl = gsap.timeline({
        onComplete: () => {
          if (!isMountedRef.current) return;
          setActiveIndex(nextIndex);
          setIsWalking(false);
          // The walk cycle mirrors to face the travel direction, but the
          // resting "stand" pose should always face right (unmirrored) —
          // only the walk itself flips, not the person standing afterward.
          if (silhouette) gsap.set(silhouette, { scaleX: 1 });
        },
      });

      // The wall texture (panorama) tiles infinitely via background-repeat, so it
      // pans by shifting background-position-x — it never runs out of image the
      // way translating a single fixed background layer would. The frames ride
      // on a separate track element that gets the actual transform, so the two
      // stay in lockstep without the background itself being cropped/clipped.
      // Both target START_OFFSET_VW - nextIndex*FRAME_STEP_VW so the active
      // frame always lands at the same fixed spot (see START_OFFSET_VW above).
      const restX = `${START_OFFSET_VW - nextIndex * FRAME_STEP_VW}vw`;

      if (panorama) {
        tl.to(
          panorama,
          {
            backgroundPositionX: restX,
            duration: WALK_DURATION + 0.35,
            ease: "power2.inOut",
          },
          0,
        );
      }

      if (track) {
        tl.to(
          track,
          {
            x: restX,
            duration: WALK_DURATION + 0.35,
            ease: "power2.inOut",
          },
          0,
        );
      }

      if (silhouette) {
        // Four-step footstep cycle: each step lifts (bob), sways slightly toward the
        // direction of travel, and tilts a couple of degrees — reads as weight
        // transferring from foot to foot rather than a uniform bounce.
        const stepDuration = WALK_DURATION / 4;
        tl.to(
          silhouette,
          {
            keyframes: [
              { y: -9, x: 3 * stepSign, rotate: 1.4 * stepSign, duration: stepDuration, ease: "power1.out" },
              { y: 0, x: 5 * stepSign, rotate: -0.8 * stepSign, duration: stepDuration, ease: "power1.in" },
              { y: -7, x: 3 * stepSign, rotate: 1.1 * stepSign, duration: stepDuration, ease: "power1.out" },
              { y: 0, x: 0, rotate: 0, duration: stepDuration, ease: "power1.in" },
            ],
          },
          0,
        );
        // Arrival settle — tiny overshoot so landing reads as weight settling in,
        // not motion just switching off. Uses scaleY only (not the combined
        // `scale` shorthand) because `scale` writes both axes at once and would
        // silently reset the scaleX mirror set above back to 1, undoing the
        // left/right facing flip every time a walk finishes.
        tl.fromTo(
          silhouette,
          { scaleY: 1 },
          { scaleY: 1.015, duration: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" },
          WALK_DURATION,
        );
      }

      if (shadow) {
        // Contact shadow compresses (foot lifting) and stretches back out (foot
        // landing) opposite the bob, in sync with the same four-step cycle.
        const stepDuration = WALK_DURATION / 4;
        tl.to(
          shadow,
          {
            keyframes: [
              { scaleX: 0.78, opacity: 0.35, duration: stepDuration, ease: "power1.out" },
              { scaleX: 1, opacity: 0.55, duration: stepDuration, ease: "power1.in" },
              { scaleX: 0.82, opacity: 0.38, duration: stepDuration, ease: "power1.out" },
              { scaleX: 1, opacity: 0.55, duration: stepDuration, ease: "power1.in" },
            ],
          },
          0,
        );
      }
    },
    [isWalking, reducedMotion],
  );

  const handleNext = useCallback(() => {
    goTo(activeIndex + 1, "next");
  }, [activeIndex, goTo]);

  const handlePrev = useCallback(() => {
    goTo(activeIndex - 1, "prev");
  }, [activeIndex, goTo]);

  // ---- keyboard arrows, only while section is in view ----
  useEffect(() => {
    if (!inView) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inView, handleNext, handlePrev]);

  // ---- touch swipe ----
  const onTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    const THRESHOLD = 40;
    if (delta > THRESHOLD) handlePrev();
    else if (delta < -THRESHOLD) handleNext();
    touchStartX.current = null;
  };

  const activeItem = PORTFOLIO_ITEMS[activeIndex];
  const pose = isWalking ? "walk" : "stand";
  const silhouetteSrc = `/portfolio/silhouette-${pose}-${theme === "light" ? "day" : "night"}.png`;
  const panoramaSrc = `/portfolio/panorama-${theme === "light" ? "day" : "night"}.png`;

  // ---- reduced-motion fallback: static stacked grid, matches Services/About pattern ----
  if (reducedMotion) {
    return (
      <section id="portfolio" className="portfolio portfolio--static" data-section="Portfolio">
        <div className="portfolio__static-header">
          <p className="portfolio__eyebrow">Portfolio</p>
          <h2 className="portfolio__heading">Selected work</h2>
        </div>
        <div className="portfolio__static-grid">
          {PORTFOLIO_ITEMS.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              className="portfolio__static-card"
              onClick={() => setLightboxIndex(index)}
            >
              <div className="portfolio__static-frame" aria-hidden="true">
                {imageErrors[item.slug] ? (
                  <span className="portfolio__placeholder-label">{item.slug}</span>
                ) : (
                  <img
                    src={`/portfolio/pieces/${item.slug}.jpg`}
                    alt=""
                    className="portfolio__static-frame-image"
                    loading="lazy"
                    onError={() =>
                      setImageErrors((prev) => (prev[item.slug] ? prev : { ...prev, [item.slug]: true }))
                    }
                  />
                )}
              </div>
              <p className="portfolio__static-title">{item.title}</p>
              <p className="portfolio__static-category">{item.category}</p>
            </button>
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            item={PORTFOLIO_ITEMS[lightboxIndex]}
            src={`/portfolio/pieces/${PORTFOLIO_ITEMS[lightboxIndex].slug}.jpg`}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </section>
    );
  }

  return (
    <section
      ref={rootRef}
      id="portfolio"
      className="portfolio"
      data-section="Portfolio"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="portfolio__eyebrow-row">
        <p className="portfolio__eyebrow">Portfolio</p>
      </div>

      <div className="portfolio__stage">
        {/* Outer viewport carries a slow ambient "breathing" zoom independent of
            the GSAP-driven pan below, so the scene never sits perfectly still
            between Next/Prev presses. */}
        <div className="portfolio__panorama-viewport">
          {/* Background wall layer: tiles infinitely via CSS background-repeat and
              is panned purely by shifting background-position-x (see goTo), so it
              never runs out of image or overflows its box — no transform is ever
              applied to this element directly. */}
          <div
            ref={panoramaRef}
            className="portfolio__panorama"
            style={{ backgroundImage: `url(${panoramaSrc})` }}
          />
          {/* Track: the element that actually gets translated to bring each frame
              into view. Kept separate from the background layer above so the two
              can be animated in lockstep without the wall texture itself moving
              off its tiled loop. */}
          <div ref={trackRef} className="portfolio__track">
            {PORTFOLIO_ITEMS.map((item, index) => {
              const orientation = orientations[item.slug] || "landscape"; // default until detected
              const frameSrc = FRAME_ASSETS[orientation][theme === "light" ? "day" : "night"];
              const pieceSrc = `/portfolio/pieces/${item.slug}.jpg`;
              const visible = Math.abs(index - activeIndex) <= 1; // the 3 on-screen frames

              const handleFrameClick = () => {
                if (index === activeIndex) {
                  setLightboxIndex(index);
                } else {
                  goTo(index, index > activeIndex ? "next" : "prev");
                }
              };

              return (
                <div
                  key={item.slug}
                  className={`portfolio__frame-slot ${index === activeIndex ? "is-active" : ""}`}
                  style={{
                    left: `${index * FRAME_STEP_VW}vw`,
                    "--frame-slot-width": `${FRAME_STEP_VW - 6}vw`,
                  }}
                >
                  {/* Ground shadow — anchors the frame to the wall/floor, only shown
                      for the active piece so it doesn't clutter the neighbors. */}
                  {index === activeIndex && (
                    <span className={`portfolio__frame-ground-shadow portfolio__frame-ground-shadow--${orientation}`} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className={`portfolio__frame portfolio__frame--${orientation}`}
                    onClick={handleFrameClick}
                    tabIndex={visible ? 0 : -1}
                    aria-hidden={!visible}
                    aria-label={index === activeIndex ? `Open ${item.title}` : `View ${item.title}`}
                  >
                    {/* Piece image — sits behind the frame's transparent centre. Falls back to
                        the placeholder label below only if pieces/<slug>.jpg fails to load. */}
                    <span
                      className="portfolio__frame-canvas"
                      style={{
                        top: FRAME_INSETS[orientation].top,
                        right: FRAME_INSETS[orientation].right,
                        bottom: FRAME_INSETS[orientation].bottom,
                        left: FRAME_INSETS[orientation].left,
                      }}
                    >
                      {imageErrors[item.slug] ? (
                        <span className="portfolio__placeholder-label">{item.slug}</span>
                      ) : (
                        <img
                          src={pieceSrc}
                          alt={item.title}
                          className="portfolio__frame-image"
                          loading="lazy"
                          onError={() =>
                            setImageErrors((prev) => (prev[item.slug] ? prev : { ...prev, [item.slug]: true }))
                          }
                        />
                      )}
                    </span>

                    {/* Frame overlay — transparent everywhere except the ornate border. If
                        frame-<orientation>-<theme>.png doesn't exist yet, this simply renders
                        nothing and the dashed placeholder border (CSS) shows instead. */}
                    <span
                      className="portfolio__frame-overlay"
                      style={{ backgroundImage: `url(${frameSrc})` }}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ground anchor centers both the contact shadow and the silhouette
            horizontally via plain CSS (translateX(-50%)) — GSAP only ever
            touches the two children's own transforms (x/y/rotate/scale),
            never this wrapper's, so centering can't be clobbered. */}
        <div className="portfolio__ground-anchor" aria-hidden="true">
          <div
            ref={silhouetteRef}
            className={`portfolio__silhouette portfolio__silhouette--${pose}`}
            style={{ backgroundImage: `url(${silhouetteSrc})` }}
          />
          <div ref={shadowRef} className="portfolio__silhouette-shadow" />
        </div>
      </div>

      <div className="portfolio__caption" key={activeItem.slug}>
        <p className="portfolio__caption-title">{activeItem.title}</p>
        <p className="portfolio__caption-category">{activeItem.category}</p>
      </div>

      {/* Wayfinding row — same tick-mark language as Services__progress, so the
          two sequential-content sections read as one system. Each tick is a
          real jump-to-piece control (goTo already guards range + in-flight
          walks), not just a decorative dot. */}
      <div className="portfolio__ticks" role="tablist" aria-label="Jump to piece">
        {PORTFOLIO_ITEMS.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            role="tab"
            className={`portfolio__tick ${index === activeIndex ? "is-active" : ""}`}
            aria-selected={index === activeIndex}
            aria-label={item.title}
            onClick={() => index !== activeIndex && goTo(index, index > activeIndex ? "next" : "prev")}
          />
        ))}
      </div>

      <div className="portfolio__controls">
        <button
          type="button"
          className="portfolio__nav-button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous piece"
        >
          ←
        </button>
        <span className="portfolio__index">
          {String(activeIndex + 1).padStart(2, "0")} / {String(PORTFOLIO_ITEMS.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          className="portfolio__nav-button"
          onClick={handleNext}
          disabled={activeIndex === PORTFOLIO_ITEMS.length - 1}
          aria-label="Next piece"
        >
          →
        </button>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          item={PORTFOLIO_ITEMS[lightboxIndex]}
          src={`/portfolio/pieces/${PORTFOLIO_ITEMS[lightboxIndex].slug}.jpg`}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

// Full-bleed expand, restyled from the same visual language as the Services
// panels (full-bleed image, bottom gradient scrim, caption pinned bottom-left)
// rather than a centered modal card.
function Lightbox({ item, src, onClose }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="portfolio-lightbox" role="dialog" aria-modal="true">
      <button
        type="button"
        className="portfolio-lightbox__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="portfolio-lightbox__stage">
        {imageFailed ? (
          <span className="portfolio-lightbox__fallback-label">{item.slug}</span>
        ) : (
          <img
            src={src}
            alt={item.title}
            className="portfolio-lightbox__image-el"
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="portfolio-lightbox__scrim" aria-hidden="true" />
        <button type="button" className="portfolio-lightbox__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="portfolio-lightbox__caption">
          <p className="portfolio-lightbox__eyebrow">Portfolio</p>
          <p className="portfolio-lightbox__title">{item.title}</p>
          <p className="portfolio-lightbox__category">{item.category}</p>
        </div>
      </div>
    </div>
  );
}
