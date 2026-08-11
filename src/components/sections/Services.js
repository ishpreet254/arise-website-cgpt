"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const SERVICES = [
  {
    number: "01",
    name: "Branding",
    description: "Identity systems built to hold their shape — from wordmark to wayfinding.",
    image: "/services/branding.webp",
    clip: null,
  },
  {
    number: "02",
    name: "Design",
    description: "Visual language and detail work that make a brand feel considered.",
    image: "/services/design.webp",
    clip: "/services/clips/branding-to-design.mp4",
  },
  {
    number: "03",
    name: "Web Design",
    description: "Interfaces built for how people actually scroll, tap, and decide.",
    image: "/services/web-design.webp",
    clip: "/services/clips/design-to-web.mp4",
  },
  {
    number: "04",
    name: "Software Development",
    description: "Custom platforms and tools, engineered to scale with you.",
    image: "/services/software-development.webp",
    clip: "/services/clips/web-to-software.mp4",
  },
  {
    number: "05",
    name: "AI & Automation",
    description: "Intelligent workflows that remove the repetitive work, not the judgment.",
    image: "/services/ai-automation.webp",
    clip: "/services/clips/software-to-ai.mp4",
  },
  {
    number: "06",
    name: "Business Analytics",
    description: "Dashboards and reporting that turn raw data into a next move.",
    image: "/services/business-analytics.webp",
    clip: "/services/clips/ai-to-business.mp4",
  },
  {
    number: "07",
    name: "Digital Marketing",
    description: "Campaigns built on reach, engagement, and honest attribution.",
    image: "/services/digital-marketing.webp",
    clip: "/services/clips/business-to-digital.mp4",
  },
  {
    number: "08",
    name: "E-Commerce",
    description: "Storefronts engineered to convert, from browse to checkout.",
    image: "/services/e-commerce.webp",
    clip: "/services/clips/digital-to-ecommerce.mp4",
  },
];

const TOTAL = String(SERVICES.length).padStart(2, "0");

export default function Services() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const panelRefs = useRef([]);
  const videoRef = useRef(null);
  const videoWrapRef = useRef(null);
  const contentRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [skipTransition, setSkipTransition] = useState(false);
  const skipTransitionRef = useRef(false);
  const videoTransitionEnabledRef = useRef(true);

  const displayedIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const scrollLockRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const lastDirectionRef = useRef(1);

  // Pass 1: detect reduced-motion preference; drives which markup variant renders
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReduced);
  }, []);

  // Pass 2: pinned scroll sequence (skipped entirely for reduced motion)
  useEffect(() => {
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const root = rootRef.current;
    const stage = stageRef.current;
    const panels = panelRefs.current;
    if (!root || !stage || !panels.length) return;

    gsap.set(panels, { autoAlpha: 0 });
    gsap.set(panels[0], { autoAlpha: 1 });

    const runStep = (requestedIndex) => {
      const current = displayedIndexRef.current;
      if (requestedIndex === current || isAnimatingRef.current) return;

      // Never skip cinematic transitions. Move only one service at a time.
      const nextIndex = requestedIndex > current ? current + 1 : current - 1;
      lastDirectionRef.current = nextIndex > current ? 1 : -1;
      isAnimatingRef.current = true;
      scrollLockRef.current = true;

      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        scrollLockRef.current = false;
        isAnimatingRef.current = false;
      }, 10000);

      const settle = () => {
        panels.forEach((el, i) => {
          if (el) gsap.set(el, { autoAlpha: i === nextIndex ? 1 : 0 });
        });
        displayedIndexRef.current = nextIndex;
        isAnimatingRef.current = false;
        scrollLockRef.current = false;
        clearTimeout(unlockTimerRef.current);
        setActiveIndex(nextIndex);

        // Catch up if the user scrolled during transition.
        if (targetIndexRef.current !== nextIndex) {
          runStep(targetIndexRef.current);
        }
      };

      const clip = SERVICES[nextIndex].clip;
      const currentPanel = panels[current];
      const nextPanel = panels[nextIndex];

      if (clip && videoTransitionEnabledRef.current) {
        const video = videoRef.current;
        const videoWrap = videoWrapRef.current;

        // Keep destination image ready to prevent previous image flash.
        gsap.set(nextPanel, { autoAlpha: 1 });

        video.pause();
        video.currentTime = lastDirectionRef.current < 0 && video.duration ? video.duration : 0;
        video.src = clip;
        video.load();
        gsap.set(videoWrap, { autoAlpha: 1 });

        let settled = false;
        const finish = (playbackWorked = true) => {
          if (settled) return;
          settled = true;
          clearTimeout(fallbackTimer);
          video.onended = null;
          video.onerror = null;

          if (!playbackWorked) {
            gsap.set(videoWrap, { autoAlpha: 0 });
            gsap.to(currentPanel, { autoAlpha: 0, duration: 0.35, onComplete: settle });
            return;
          }

          gsap.to(videoWrap, {
            autoAlpha: 0,
            duration: 0.18,
            ease: 'power2.inOut',
            onComplete: settle,
          });
        };

        // Video is optional. If it fails to start/finish within 5 seconds,
        // use a clean fallback image transition.
        const fallbackTimer = setTimeout(() => finish(false), 5000);
        transitionTimerRef.current = fallbackTimer;
        video.onended = () => finish(true);
        video.onerror = () => finish(false);
        video.ontimeupdate = () => {
          if (lastDirectionRef.current < 0 && video.currentTime <= 0.05) finish(true);
        };
        if (lastDirectionRef.current < 0) {
          // Negative playbackRate is not supported reliably across browsers.
          // Use a smooth image transition for upward movement instead.
          gsap.set(videoWrap, { autoAlpha: 0 });
          gsap.to(currentPanel, { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" });
          gsap.fromTo(
            nextPanel,
            { autoAlpha: 0, scale: 1.03, filter: "blur(8px)" },
            {
              autoAlpha: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.45,
              ease: "power2.out",
              onComplete: settle,
            },
          );
        } else {
          video.playbackRate = 1;
          video.play().catch(() => finish(false));
        }
      } else {
        gsap.to(currentPanel, { autoAlpha: 0, duration: 0.35 });
        gsap.to(nextPanel, {
          autoAlpha: 1,
          duration: 0.35,
          onComplete: settle,
        });
      }
    };


    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const perPanelVh = isMobile ? 70 : 100;
      const distance = (SERVICES.length - 1) * perPanelVh;

      ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: `+=${distance}%`,
        pin: true,
        pinType: isMobile ? "fixed" : "transform",
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.min(
            SERVICES.length - 1,
            Math.floor(self.progress * (SERVICES.length - 1)),
          );
          targetIndexRef.current = idx;
          if (!isAnimatingRef.current && idx !== displayedIndexRef.current) {
            runStep(idx);
          }
        },
      });
    }, root);

    const preventScrollDuringTransition = (event) => {
      if (scrollLockRef.current) {
        event.preventDefault();
        // Keep the 10 second emergency unlock alive only if the user is still trying to scroll.
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = setTimeout(() => {
          scrollLockRef.current = false;
          isAnimatingRef.current = false;
        }, 10000);
      }
    };

    window.addEventListener('wheel', preventScrollDuringTransition, { passive: false });
    window.addEventListener('touchmove', preventScrollDuringTransition, { passive: false });

    const video = videoRef.current;
    return () => {
      window.removeEventListener('wheel', preventScrollDuringTransition);
      window.removeEventListener('touchmove', preventScrollDuringTransition);
      ctx.revert();
      video?.pause();
      clearTimeout(unlockTimerRef.current);
      clearTimeout(transitionTimerRef.current);
    };
  }, [reducedMotion]);

  // Pass 3: small reveal for the text block whenever the active service changes
  useEffect(() => {
    const content = contentRef.current;
    if (!content || reducedMotion) return;
    gsap.fromTo(
      content,
      { y: 14, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
    );
  }, [activeIndex, reducedMotion]);

  if (reducedMotion) {
    return (
      <section id="services" className="services services--static" data-section="Services">
        <p className="services__eyebrow">Our Capabilities</p>
        {SERVICES.map((service) => (
          <article key={service.number} className="services__static-panel">
            <div
              className="services__static-image"
              style={{ backgroundImage: `url(${service.image})` }}
              aria-hidden="true"
            />
            <div className="services__static-scrim" aria-hidden="true" />
            <div className="services__static-content">
              <span className="services__number">
                {service.number} / {TOTAL}
              </span>
              <h3 className="services__name">{service.name}</h3>
              <p className="services__desc">{service.description}</p>
            </div>
          </article>
        ))}
      </section>
    );
  }

  const active = SERVICES[activeIndex];

  return (
    <section ref={rootRef} id="services" className="services" data-section="Services">
      <div ref={stageRef} className="services__stage">
        <div className="services__panels" aria-hidden="true">
          {SERVICES.map((service, i) => (
            <div
              key={service.number}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="services__panel"
              style={{ backgroundImage: `url(${service.image})` }}
            />
          ))}
        </div>

        <div ref={videoWrapRef} className="services__video-wrap" aria-hidden="true">
          <video ref={videoRef} className="services__video" muted playsInline preload="metadata" />
        </div>

        <div className="services__scrim" aria-hidden="true" />

        <div ref={contentRef} className="services__content">
          <p className="services__eyebrow">Our Capabilities</p>
          <h3 className="services__name">{active.name}</h3>
          <p className="services__desc">{active.description}</p>
        </div>

        <div className="services__progress" aria-hidden="true">
          {SERVICES.map((service, i) => (
            <span
              key={service.number}
              className={`services__tick${i === activeIndex ? " is-active" : ""}`}
            />
          ))}
        </div>

        <button
          type="button"
          className={`services__skip-transition${skipTransition ? " is-off" : ""}`}
          onClick={() => {
            const nextState = !skipTransition;
            skipTransitionRef.current = nextState;
            videoTransitionEnabledRef.current = !nextState;
            setSkipTransition(nextState);

            const video = videoRef.current;
            const videoWrap = videoWrapRef.current;
            if (video && nextState) {
              video.pause();
              video.currentTime = 0;
            }
            if (videoWrap && nextState) {
              gsap.set(videoWrap, { autoAlpha: 0 });
            }
          }}
          aria-label="Toggle service transition videos"
          aria-pressed={skipTransition}
        >
          <span className="services__skip-dot" />
          {skipTransition ? "Video OFF" : "Video ON"}
        </button>

        <div className="services__badge" aria-hidden="true">
          <span className="services__badge-current">{active.number}</span>
          <i />
          <span className="services__badge-total">{TOTAL}</span>
        </div>
      </div>
    </section>
  );
}
