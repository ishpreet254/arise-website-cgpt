"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Contact — Master Spec §5.8. A direct-call CTA, distinct from the
 * ReachOut enquiry form. A vintage landline sits on a lit, glowing
 * stage; contact details and socials sit beside it. The "3D" feel
 * comes entirely from the pre-rendered product photography — no 3D
 * engine, no scroll dependency, CSS-level micro-interaction only.
 *
 * Contact details below are ARISE's real placeholders — edit directly
 * here once anything (address, Telegram/X/YouTube handles) is final.
 */

const CONTACT_PHONE = "+91 98148 60334";
const CONTACT_PHONE_TEL = "+919814860334";
const CONTACT_EMAIL = "ARISELtd19@gmail.com";
const CONTACT_ADDRESS = "India — remote-first studio";

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://instagram.com/ARISE_Ltd_",
    path: "M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.898 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.898-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793 0 1.44.645 1.44 1.439z",
  },
  {
    name: "Telegram",
    href: "#",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.301.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  },
  {
    name: "X",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "YouTube",
    href: "#",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z",
  },
];

export default function Contact() {
  const rootRef = useRef(null);
  const [theme, setTheme] = useState("dark");

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

  const dayNight = theme === "light" ? "light" : "dark";
  const bgSrc = `/contact/bg-marble-gold-${dayNight}.webp`;
  const phoneSrc = `/contact/phone-${dayNight}.webp`;

  return (
    <section ref={rootRef} id="contact" className="contact" data-section="Contact">
      <div className="contact__backdrop" style={{ backgroundImage: `url(${bgSrc})` }} aria-hidden="true" />
      <div className="contact__grain" aria-hidden="true" />

      <div className="contact__inner">
        <div className="contact__intro">
          <p className="contact__eyebrow">Contact Us</p>
          <h2 className="contact__heading">Some conversations deserve a real ring.</h2>
        </div>

        <div className="contact__grid">
          <div className="contact__stage">
            <div className="contact__glow" aria-hidden="true" />
            <button
              type="button"
              className="contact__phone-button"
              onClick={() => {
                window.location.href = `tel:${CONTACT_PHONE_TEL}`;
              }}
              aria-label={`Call ARISE at ${CONTACT_PHONE}`}
            >
              <img className="contact__phone-image" src={phoneSrc} alt="Vintage rotary telephone" draggable="false" />
            </button>
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="contact__call-button">
              <svg className="contact__call-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1L6.6 10.8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              Call Now
            </a>
          </div>

          <div className="contact__details">
            <a href={`tel:${CONTACT_PHONE_TEL}`} className="contact__detail-row">
              <span className="contact__detail-icon-wrap" aria-hidden="true">
                <svg className="contact__detail-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1.1L6.6 10.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="contact__detail-text">
                <span className="contact__detail-label">Phone</span>
                <span className="contact__detail-value">{CONTACT_PHONE}</span>
              </span>
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact__detail-row">
              <span className="contact__detail-icon-wrap" aria-hidden="true">
                <svg className="contact__detail-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3.5 6.5h17v11h-17v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="contact__detail-text">
                <span className="contact__detail-label">Email</span>
                <span className="contact__detail-value">{CONTACT_EMAIL}</span>
              </span>
            </a>
            <div className="contact__detail-row contact__detail-row--static">
              <span className="contact__detail-icon-wrap" aria-hidden="true">
                <svg className="contact__detail-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="contact__detail-text">
                <span className="contact__detail-label">Studio</span>
                <span className="contact__detail-value">{CONTACT_ADDRESS}</span>
              </span>
            </div>

            <div className="contact__socials">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="contact__social-link"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24" className="contact__social-icon" aria-hidden="true">
                    <path fill="currentColor" d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
