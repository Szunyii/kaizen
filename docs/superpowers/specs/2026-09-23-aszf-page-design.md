# ÁSZF page from Fogyasztóbarát — Design Spec

**Date:** 2026-09-23
**Status:** Approved by user (URL: `/pages/aszf`)

## Goal

Show the Általános Szerződési Feltételek generated in the Fogyasztóbarát
system (widget id `R7FDJBKH`) on the storefront, in the site's own
typography, without the vendor's jQuery embed snippet.

## Findings that shape the design

- The vendor endpoint `https://admin.fogyasztobarat.hu/api.php?aszf=<id>`
  returns the document only when the request carries a `Referer`/`Origin`
  of the licensed site (`kaizentype.com`). Otherwise it answers with a style
  block and `Hibakód: 1002`. A browser-side fetch therefore only works in
  production; a server-side fetch works everywhere.
- The document is ~110 KB of HTML: a `<head>` with `noindex,nofollow`, two
  `<style>` blocks, three `<script>` blocks (two jQuery TOC-link rewrites and
  one usage ping), two `<h1>`s, ~40 `<h2>`s, in-page anchors (`#aszfNN`),
  two contact tables and links to PDFs on the vendor origin.
- The shop has no `termsOfService` policy in Shopify, so the footer currently
  shows no ÁSZF link and `/policies/terms-of-service` is a 404.

## Design

**Data:** `app/lib/fogyasztobarat.js`
- `parseDocument(raw)` — pure. Strips `<head>`, `<style>`, `<script>`;
  returns `null` for error bodies (no heading); lifts the leading `<h1>` and
  the "hatályos ettől a naptól" paragraph out of the body and returns
  `{html, effectiveDate}`. Unexpected layouts keep the body intact.
- `formatEffectiveDate(iso)` — `2026-09-23` → `2026. szeptember 23.`
- `fetchFogyasztobaratDocument(context, type)` — server-side fetch with
  `Referer: https://kaizentype.com/`, through Hydrogen `withCache.fetch`
  (`CacheLong`, only successful parsed documents are cached). Returns the
  parsed document or `null`.
- `context.withCache` is created in `app/lib/context.js` (`createWithCache`)
  and exposed through `additionalContext`.

**Route:** `app/routes/pages.aszf.jsx` (`/pages/aszf`)
- Loader calls the helper; `null` → `503` with a Hungarian message rendered
  by the root error boundary. Nothing is cached on failure.
- Meta: title `KaizenType — ÁSZF`, description, `robots: noindex, nofollow`
  (mirrors the vendor's own meta; the text is a shared template).
- Markup reuses the article header (`.art-head`: crumbs, `h1.art-h`, lead,
  meta line with the effective date) and the article prose styles
  (`.art-prose`) plus a small `.doc-prose` addition in `kaizen-pages.css`:
  `h1` inside the document, `scroll-margin-top` for anchors under the sticky
  header, horizontally scrollable tables, tighter TOC spacing.
- A client-side `useEffect` replays the vendor's usage ping (`us-file.php`)
  so the Fogyasztóbarát account records the embed.

**Footer:** the ÁSZF link always points to `/pages/aszf`; the other help
links still come from the Shopify policies. The badge constants move to the
new lib so the widget id lives in one place.

**Tests:** `app/lib/fogyasztobarat.test.js` with Node's built-in runner
(`npm test`), covering the pure parsing/formatting functions.

## Out of scope

Other generated documents (adatkezelési tájékoztató), the `/policies` index
page, sitemap entries (page is `noindex`).
