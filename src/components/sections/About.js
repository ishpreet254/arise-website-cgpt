"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const NOTES = [
  {
    number: "01",
    title: "Original, every time.",
    body: "Concepts built from scratch — never templated, never recycled.",
    rest: -3,
  },
  {
    number: "02",
    title: "Premium, by design.",
    body: "Every detail considered, nothing shipped generic.",
    rest: 2,
  },
  {
    number: "03",
    title: "Speed without shortcuts.",
    body: "Fast turnarounds, with zero compromise on quality.",
    rest: -4,
  },
  {
    number: "04",
    title: "Built around you.",
    body: "Your goals shape every decision we make.",
    rest: 3,
  },
  {
    number: "05",
    title: "Detail is the difference.",
    body: "We sweat the things other studios skip.",
    rest: -2,
  },
  {
    number: "06",
    title: "Always in the loop.",
    body: "Clear, honest communication from brief to launch.",
    rest: 4,
  },
  {
    number: "07",
    title: "Results, not just visuals.",
    body: "Design engineered to move your business forward.",
    rest: -1,
  },
];

const TOTAL = String(NOTES.length).padStart(2, "0");

export default function About() {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const noteRefs = useRef([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(prefersReduced);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const root = rootRef.current;
    const stage = stageRef.current;
    const notes = noteRefs.current;
    if (!root || !stage || !notes.length) return;

    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      const perNoteVh = isMobile ? 48 : 66;
      const distance = (NOTES.length - 1) * perNoteVh;
      // Each note gets one timeline "unit" of scroll. It should stay fully
      // readable for most of that unit and only flick away near the end —
      // previously the fade-out started the instant the unit began, so a
      // note started disappearing before the user had a chance to read it.
      const HOLD = 0.62;
      const FADE = 1 - HOLD;

      // Resting stack: each note in its natural, slightly-off rotation.
      notes.forEach((note, i) => {
        if (!note) return;
        gsap.set(note, {
          x: 0,
          y: 0,
          rotate: NOTES[i].rest,
          autoAlpha: 1,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: `+=${distance}%`,
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              NOTES.length - 1,
              Math.floor(self.progress * NOTES.length),
            );
            setActiveIndex(idx);
          },
        },
      });

      notes.slice(0, -1).forEach((note, i) => {
        if (!note) return;
        const dir = i % 2 === 0 ? -1 : 1;
        tl.to(
          note,
          {
            x: dir * (isMobile ? 46 : 120),
            y: -70,
            rotate: dir * 22,
            autoAlpha: 0,
            duration: FADE,
            ease: "power1.inOut",
          },
          i + HOLD,
        );
      });
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <section id="about" className="about about--static" data-section="About">
        <div className="about__intro">
          <p className="about__eyebrow">Why ARISE</p>
          <h2 className="about__heading">We don’t just build websites. We build perception</h2>
          <p className="about__lede">
            Seven reasons brands choose to build with us — no filler, just how we work.
          </p>
        </div>
        <div className="about__static-grid">
          {NOTES.map((note) => (
            <article key={note.number} className="about__note about__note--static">
              <span className="about__note-number">{note.number}</span>
              <h3 className="about__note-title">{note.title}</h3>
              <p className="about__note-body">{note.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={rootRef} id="about" className="about" data-section="About">
      <div className="about__intro">
        <p className="about__eyebrow">Why ARISE</p>
        <h2 className="about__heading">We don’t just build websites. We build perception</h2>
        <p className="about__lede">
          Seven reasons brands choose to build with us — no filler, just how we work.
        </p>
      </div>

      <div ref={stageRef} className="about__stage">
        <div className="about__board" aria-hidden="true" />

        <div className="about__stack">
          {NOTES.map((note, i) => (
            <article
              key={note.number}
              ref={(el) => {
                noteRefs.current[i] = el;
              }}
              className="about__note"
              style={{ zIndex: NOTES.length - i }}
            >
              <span className="about__note-tape" aria-hidden="true" />
              <span className="about__note-number">{note.number}</span>
              <h3 className="about__note-title">{note.title}</h3>
              <p className="about__note-body">{note.body}</p>
            </article>
          ))}
        </div>

        <div className="about__progress" aria-hidden="true">
          {NOTES.map((note, i) => (
            <span
              key={note.number}
              className={`about__tick${i === activeIndex ? " is-active" : ""}`}
            />
          ))}
        </div>

        <div className="about__badge" aria-hidden="true">
          <span className="about__badge-current">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <i />
          <span className="about__badge-total">{TOTAL}</span>
        </div>
      </div>
    </section>
  );
}
