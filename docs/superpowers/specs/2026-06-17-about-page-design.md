# About Page — Move Philosophy Section

**Date:** 2026-06-17

## Goal

Create a dedicated About page and relocate the existing homepage Philosophy
section onto it. After this change, Philosophy no longer appears on the
homepage; it is reachable only at `/pages/about`, which every existing
"About" / "philosophy" entry point already targets.

## Scope

Minimal: move the existing Philosophy block verbatim onto its own page. No new
brand-story copy, no new styling. This is a relocation, not a redesign.

## Route choice

Use a static route at **`app/routes/pages.about.jsx`**.

- All existing links already point to `/pages/about`: the header (`hd-about`
  desktop link and the mobile-nav footer link in `KaizenHeader.jsx`) and the
  "Read the manifesto" link inside the Philosophy block.
- In `@react-router/fs-routes` flat routes, the static `about` segment shadows
  the dynamic `pages.$handle.jsx` for this one path, so `/pages/about` renders
  our custom page instead of the Shopify CMS page fetcher.
- Consequence: a Shopify CMS page with the handle `about` would no longer be
  reachable at `/pages/about`. This is intended — we want a custom page here.

## Changes

### New file — `app/routes/pages.about.jsx`

- Static route component; no loader needed (content is static).
- Exports a `meta` function for page title + description.
- Renders a minimal page heading (kicker + title) followed by the Philosophy
  section moved from the homepage: the two `改` (Kai) / `善` (Zen) kanji cards
  plus the "Kaizen is not a sprint." copy block.
- Reuses the existing `.phil*` styles (`kaizen-pages.css`) and the `useReveal`
  hook. No new CSS.
- The internal "Read the manifesto" link is dropped — on the About page it
  would point to itself.
- Imports follow the project rule: routing primitives from `react-router`.

### Edit — `app/routes/_index.jsx`

- Remove the `Philosophy()` component and its `<div id="philosophy">` wrapper
  from the `Homepage` render tree.
- Remove the now-unused `philRef` / `scrollToPhil` scroll logic and the
  `useRef` import if no longer used.
- Change the Hero "The philosophy" control from a scroll-to-section `<button>`
  into a `<Link to="/pages/about">The philosophy</Link>`, keeping the same
  `btn btn-ghost` styling. Drop the `onPhilosophy` prop threading on `Hero`.

### No changes

- Header / footer links — already point to `/pages/about`.
- CSS — `.phil*` styles already exist and are reused.
- Data files — Philosophy content is inline, not data-driven.

## Verification

- `npm run lint` passes (no unused imports/vars left behind).
- `/` no longer shows the Philosophy section; the Hero "The philosophy" button
  navigates to `/pages/about`.
- `/pages/about` renders the Philosophy section with the heading and reveal
  animations, and no self-referential manifesto link.
- Header "About" links (desktop + mobile) land on the new page.
