# About Section — Delivery Notes

## Files in this package
- `src/components/sections/About.js` — full replacement, drop-in over your existing stub
- `src/app/globals.css` — full file, includes the new About block inserted right before
  `/* ============ Services ============ */` (search for `/* ============ About ============ */`)
  — everything else in this file is untouched from your current version
- `public/about/board-dark.webp`, `board-light.webp`, `paper-texture.webp` — your generated
  textures, converted to .webp (matches the convention used in `public/services/`)

## What to do
1. Copy `public/about/*.webp` into your repo's `public/about/`
2. Replace `src/components/sections/About.js` with the version here
3. In `src/app/globals.css`, paste in the new `/* ============ About ============ */` block
   (or just replace the whole file with the one here — I only touched the About block)
4. `page.js` needs no changes — it already imports and renders `<About />`

## What it does
- Pinned scroll section, 7 sticky notes stacked with slight natural rotation
- Scroll drives a GSAP scrub timeline (not discrete steps like Services) — each note peels
  off (translate + rotate + fade) to reveal the next one underneath
- Scroll distance: 58vh per note desktop, 42vh mobile (~350vh / ~250vh total pin) — shorter
  than Services on purpose, per your "faster, not frustrating" note
- Board background swaps automatically with your existing dark/light theme system
  (`data-theme` attribute) — no new JS needed, handled via CSS custom properties
- Paper grain texture is shared across all 7 notes via `mix-blend-mode: multiply` — only
  one image needed, not one per note
- `prefers-reduced-motion` fallback: static grid of all 7 notes, no pin/scroll-jacking
- Progress dots + counter badge (bottom-left/right) match the visual language of the
  Services section's badge/tick pattern already in your codebase

## Verified
- `npm run build` — compiles clean, no errors
- `npx eslint` — no lint issues on the new file
