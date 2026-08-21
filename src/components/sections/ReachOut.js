"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * ReachOut — Master Spec §5.7. Postcard-styled enquiry form. On successful
 * submit, a GSAP flight plays: a stamp lands on the postcard, an envelope
 * crossfades over it, then the envelope flies into the postbox that sits
 * docked in the corner of the section the whole time.
 *
 * The real submission (Formspree) and the flight animation are decoupled:
 * the network request fires first, and the flight only plays once success
 * is confirmed — a slow connection shows a "Sending…" state on the button
 * rather than a premature "sent" animation, and a failed send never shows
 * the flight at all.
 *
 * prefers-reduced-motion: no stamp/envelope/postbox choreography — submit
 * fades straight to the success message.
 */

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mbgrzwrk";

const PROJECT_TYPES = [
  "Branding",
  "Design",
  "Web Design",
  "Software Development",
  "AI & Automation",
  "Business Analytics",
  "Digital Marketing",
  "E-Commerce",
  "Not sure yet",
];

// Placeholder bands — easy to edit, currency assumed INR (ARISE is India-based).
const BUDGET_RANGES = [
  "Under ₹1,00,000",
  "₹1,00,000 – ₹3,00,000",
  "₹3,00,000 – ₹7,00,000",
  "₹7,00,000+",
  "Not sure yet",
];

const INITIAL_FIELDS = {
  name: "",
  email: "",
  query: "",
  projectType: "",
  budget: "",
  company: "",
  phone: "",
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ReachOut() {
  const rootRef = useRef(null);
  const postcardRef = useRef(null);
  const stampRef = useRef(null);
  const envelopeRef = useRef(null);
  const postboxRef = useRef(null);
  const flightTweenRef = useRef(null);

  const [theme, setTheme] = useState("dark");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | flying | success | error

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

  // ---- pause the postbox idle float while the section is off-screen ----
  useEffect(() => {
    if (reducedMotion) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        root.classList.toggle("reach-out--paused", !entry.isIntersecting);
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const handleChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!fields.name.trim()) next.name = "Please enter your name.";
    if (!fields.email.trim()) next.email = "Please enter your email.";
    else if (!isValidEmail(fields.email)) next.email = "That email doesn't look right.";
    if (!fields.query.trim()) next.query = "Tell us a little about what you need.";
    return next;
  }, [fields]);

  // ---- flight animation: stamp lands, envelope crossfades in, flies to postbox ----
  const playFlight = useCallback(() => {
    const postcard = postcardRef.current;
    const stamp = stampRef.current;
    const envelope = envelopeRef.current;
    const postbox = postboxRef.current;
    if (!postcard || !stamp || !envelope || !postbox) {
      setStatus("success");
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // The postcard was faded to opacity:0 so the envelope could cover
        // it mid-flight. The success message renders inside that same
        // element, so restore its opacity now or the confirmation is
        // invisible even though it's in the DOM.
        gsap.set(postcard, { opacity: 1 });
        setStatus("success");
      },
    });
    flightTweenRef.current = tl;

    tl.set(envelope, { opacity: 0, scale: 1, x: 0, y: 0, rotate: 0 })
      .set(stamp, { opacity: 0, scale: 0.5, rotate: -14 })
      .to(stamp, { opacity: 1, scale: 1, rotate: -8, duration: 0.4, ease: "back.out(2)" })
      .to(postcard, { opacity: 0, duration: 0.35, ease: "power1.out" }, "+=0.15")
      .to(envelope, { opacity: 1, duration: 0.35, ease: "power1.out" }, "<")
      .to(
        [envelope, stamp],
        {
          x: () => {
            const eRect = envelope.getBoundingClientRect();
            const bRect = postbox.getBoundingClientRect();
            return bRect.left + bRect.width / 2 - (eRect.left + eRect.width / 2);
          },
          y: () => {
            const eRect = envelope.getBoundingClientRect();
            const bRect = postbox.getBoundingClientRect();
            return bRect.top + bRect.height / 2 - (eRect.top + eRect.height / 2);
          },
          scale: 0.16,
          rotate: 10,
          duration: 0.9,
          ease: "power2.in",
        },
        "+=0.1"
      )
      .to([envelope, stamp], { opacity: 0, duration: 0.15 }, "-=0.1")
      .to(
        postbox,
        { scale: 1.08, duration: 0.12, ease: "power1.out", yoyo: true, repeat: 1 },
        "-=0.15"
      );
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (status === "sending" || status === "flying") return;

      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setStatus("sending");
      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: fields.name,
            email: fields.email,
            message: fields.query,
            projectType: fields.projectType || undefined,
            budget: fields.budget || undefined,
            company: fields.company || undefined,
            phone: fields.phone || undefined,
          }),
        });

        if (!res.ok) throw new Error("Formspree request failed");

        if (reducedMotion) {
          setStatus("success");
        } else {
          setStatus("flying");
          playFlight();
        }
      } catch {
        setStatus("error");
      }
    },
    [status, validate, fields, reducedMotion, playFlight]
  );

  const handleReset = useCallback(() => {
    if (flightTweenRef.current) {
      flightTweenRef.current.kill();
      flightTweenRef.current = null;
    }
    setFields(INITIAL_FIELDS);
    setErrors({});
    setDetailsOpen(false);
    setStatus("idle");
    gsap.set([postcardRef.current, stampRef.current, envelopeRef.current], { clearProps: "all" });
  }, []);

  const dayNight = theme === "light" ? "day" : "night";
  const bgSrc = `/reachout/reachout-bg-${dayNight}.webp`;
  const postcardSrc = `/reachout/reachout-postcard-${dayNight}.webp`;
  const stampSrc = `/reachout/reachout-stamp-${dayNight}.webp`;
  const envelopeSrc = `/reachout/reachout-envelope-${dayNight}.webp`;
  const postboxSrc = `/reachout/reachout-postbox-${dayNight}.webp`;

  const isBusy = status === "sending" || status === "flying";

  return (
    <section ref={rootRef} id="reach-out" className="reach-out" data-section="ReachOut">
      <div className="reach-out__backdrop" style={{ backgroundImage: `url(${bgSrc})` }} aria-hidden="true" />

      <div className="reach-out__inner">
        <div className="reach-out__intro">
          <p className="reach-out__eyebrow">Get In Touch</p>
          <h2 className="reach-out__heading">Tell us about your project</h2>
          <p className="reach-out__subhead">
            Send us a few details and we&rsquo;ll get back to you with next steps.
          </p>
        </div>

        <div className="reach-out__stage">
          <div className="reach-out__postbox-wrap">
            <img
              ref={postboxRef}
              className="reach-out__postbox"
              src={postboxSrc}
              alt=""
              aria-hidden="true"
            />
          </div>

          <div className="reach-out__card-wrap">
            <div
              ref={postcardRef}
              className="reach-out__postcard"
              style={{ backgroundImage: `url(${postcardSrc})` }}
            >
              {status === "success" ? (
                <div className="reach-out__success" role="status">
                  <p className="reach-out__success-eyebrow">Message sent</p>
                  <h3>Thanks, {fields.name || "friend"}.</h3>
                  <p>We&rsquo;ve got your note and will be in touch shortly.</p>
                  <button type="button" className="reach-out__button reach-out__button--ghost" onClick={handleReset}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="reach-out__form" onSubmit={handleSubmit} noValidate>
                  <div className="reach-out__row">
                    <label className="reach-out__field">
                      <span className="reach-out__label">Name</span>
                      <input
                        type="text"
                        value={fields.name}
                        onChange={handleChange("name")}
                        disabled={isBusy}
                        autoComplete="name"
                      />
                      {errors.name && <span className="reach-out__error">{errors.name}</span>}
                    </label>
                    <label className="reach-out__field">
                      <span className="reach-out__label">Email</span>
                      <input
                        type="email"
                        value={fields.email}
                        onChange={handleChange("email")}
                        disabled={isBusy}
                        autoComplete="email"
                      />
                      {errors.email && <span className="reach-out__error">{errors.email}</span>}
                    </label>
                  </div>

                  <label className="reach-out__field reach-out__field--full">
                    <span className="reach-out__label">What can we help with?</span>
                    <textarea
                      rows={3}
                      value={fields.query}
                      onChange={handleChange("query")}
                      disabled={isBusy}
                    />
                    {errors.query && <span className="reach-out__error">{errors.query}</span>}
                  </label>

                  <button
                    type="button"
                    className="reach-out__details-toggle"
                    onClick={() => setDetailsOpen((v) => !v)}
                    aria-expanded={detailsOpen}
                  >
                    <span>{detailsOpen ? "− Hide project details" : "+ Add project details"}</span>
                    <span className="reach-out__details-hint">(optional)</span>
                  </button>

                  <div className={`reach-out__details${detailsOpen ? " is-open" : ""}`}>
                    <div className="reach-out__details-inner">
                      <div className="reach-out__row">
                        <label className="reach-out__field">
                          <span className="reach-out__label">Project type</span>
                          <div className="reach-out__select-wrap">
                            <select value={fields.projectType} onChange={handleChange("projectType")} disabled={isBusy}>
                              <option value="">Select one</option>
                              {PROJECT_TYPES.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>
                        <label className="reach-out__field">
                          <span className="reach-out__label">Budget</span>
                          <div className="reach-out__select-wrap">
                            <select value={fields.budget} onChange={handleChange("budget")} disabled={isBusy}>
                              <option value="">Select a range</option>
                              {BUDGET_RANGES.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        </label>
                      </div>
                      <div className="reach-out__row">
                        <label className="reach-out__field">
                          <span className="reach-out__label">Company</span>
                          <input
                            type="text"
                            value={fields.company}
                            onChange={handleChange("company")}
                            disabled={isBusy}
                            autoComplete="organization"
                          />
                        </label>
                        <label className="reach-out__field">
                          <span className="reach-out__label">Phone</span>
                          <input
                            type="tel"
                            value={fields.phone}
                            onChange={handleChange("phone")}
                            disabled={isBusy}
                            autoComplete="tel"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="reach-out__submit-row">
                    <button type="submit" className="reach-out__button reach-out__button--primary" disabled={isBusy}>
                      {isBusy ? "Sending…" : "Send Enquiry"}
                    </button>
                    {status === "error" && (
                      <span className="reach-out__error reach-out__error--submit" role="alert">
                        Something went wrong — please try again.
                      </span>
                    )}
                  </div>
                </form>
              )}
            </div>

            <div
              ref={envelopeRef}
              className="reach-out__envelope"
              style={{ backgroundImage: `url(${envelopeSrc})` }}
              aria-hidden="true"
            />
            <div
              ref={stampRef}
              className="reach-out__stamp"
              style={{ backgroundImage: `url(${stampSrc})` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
