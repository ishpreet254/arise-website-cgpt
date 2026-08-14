"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenisInstance, isNavigating } from "@/lib/lenis";

const SERVICES = [
  {
    number: "01",
    name: "Branding",
    description: "Identity systems built to hold their shape from wordmark to wayfinding.",
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
  const [skipTransition, setSkipTransition] = useState(true);
  const videoTransitionEnabledRef = useRef(false);

  const displayedIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const unlockTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const lastDirectionRef = useRef(1);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReduced);
  }, []);

  useEffect(() => {
    function handleNavigating(event) {
      if (!event.detail) return;
      // Drop any in-progress panel transition immediately so it can't
      // hold a nav-triggered scroll hostage inside this section.
      clearTimeout(unlockTimerRef.current);
      clearTimeout(transitionTimerRef.current);
      isAnimatingRef.current = false;
      if (videoWrapRef.current) gsap.set(videoWrapRef.current, { autoAlpha: 0 });
      getLenisInstance()?.start();
    }

    window.addEventListener("arise:navigating", handleNavigating);
    return () => window.removeEventListener("arise:navigating", handleNavigating);
  }, []);

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

      const nextIndex = requestedIndex > current ? current + 1 : current - 1;
      lastDirectionRef.current = nextIndex > current ? 1 : -1;
      isAnimatingRef.current = true;
      getLenisInstance()?.stop();

      clearTimeout(unlockTimerRef.current);
      unlockTimerRef.current = setTimeout(() => {
        isAnimatingRef.current = false;
        getLenisInstance()?.start();
      }, 10000);

      const settle = () => {
        panels.forEach((el, i) => {
          if (el) gsap.set(el, { autoAlpha: i === nextIndex ? 1 : 0 });
        });
        displayedIndexRef.current = nextIndex;
        isAnimatingRef.current = false;
        clearTimeout(unlockTimerRef.current);
        getLenisInstance()?.start();
        setActiveIndex(nextIndex);

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
          video.ontimeupdate = null;

          if (!playbackWorked) {
            gsap.set(videoWrap, { autoAlpha: 0 });
            gsap.to(currentPanel, { autoAlpha: 0, duration: 0.35, onComplete: settle });
            return;
          }

          gsap.to(videoWrap, {
            autoAlpha: 0,
            duration: 0.18,
            ease: "power2.inOut",
            onComplete: settle,
          });
        };

        const fallbackTimer = setTimeout(() => finish(false), 5000);
        transitionTimerRef.current = fallbackTimer;
        video.onended = () => finish(true);
        video.onerror = () => finish(false);
        video.ontimeupdate = () => {
          if (lastDirectionRef.current < 0 && video.currentTime <= 0.05) finish(true);
        };

        if (lastDirectionRef.current < 0) {
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

          if (isNavigating()) {
            // A nav link is driving this scroll (e.g. jumping to Home or
            // another section straight through the pinned Services stage).
            // Snap the visible panel to match instead of stepping through
            // the one-at-a-time transition and locking Lenis — that lock
            // is what was trapping nav jumps inside this section.
            if (idx !== displayedIndexRef.current) {
              panels.forEach((el, i) => {
                if (el) gsap.set(el, { autoAlpha: i === idx ? 1 : 0 });
              });
              displayedIndexRef.current = idx;
              setActiveIndex(idx);
            }
            return;
          }

          if (!isAnimatingRef.current && idx !== displayedIndexRef.current) {
            runStep(idx);
          }
        },
      });
    }, root);

    const video = videoRef.current;
    return () => {
      ctx.revert();
      video?.pause();
      clearTimeout(unlockTimerRef.current);
      clearTimeout(transitionTimerRef.current);
      isAnimatingRef.current = false;
      getLenisInstance()?.start();
    };
  }, [reducedMotion]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || reducedMotion) return;
    gsap.killTweensOf(content);
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
          {skipTransition ? "Transition ON" : "Transition OFF"}
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
