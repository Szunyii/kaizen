# Collection page — KaizenType design, category-aware

**Date:** 2026-06-29
**Route:** `app/routes/collections.$handle.jsx` (full rewrite)
**Status:** Approved design, ready for implementation plan

## Goal

Replace the plain Hydrogen skeleton collection page with a KaizenType-branded,
category-aware collection page. The page must "react" to the category in the
URL (`/collections/men`, `/collections/women`, `/collections/accessories`) and
let the visitor switch categories and filter by sub-type without a full reload.

## Context

- KaizenType is a dark-themed streetwear prototype. Design tokens in
  `app/styles/kaizen.css`; component styles in `app/styles/kaizen-components.css`;
  page-section styles in `app/styles/kaizen-pages.css`.
- Reusable pieces already exist: `ProductCard` (`app/components/kaizen/ProductCard.jsx`),
  `.grid-3` / `.grid-4` grids, `StudioShot` placeholder, `useReveal` scroll hook,
  `Icons` (`I`), `Brand` SVGs (`EnsoMark`, `BrushRibbon`, `KaizenSeal`).
- Mock catalogue in `app/lib/kaizen-data.js`: `PRODUCTS` (each tagged
  `cat: 'men'|'women'|'accessories'` and a `type`), `CATEGORIES`, and the
  `productsByCategory(catId)` helper.
- The homepage (`app/routes/_index.jsx`) already uses the hybrid pattern: query
  live Storefront products, fall back to mock `PRODUCTS` when the store returns
  none. The PDP (`products.$handle.jsx`) is fully branded and pure-live.
- The header nav (`KaizenHeader.jsx`) already links to `/collections/<category>`.

## Data source: hybrid (live → mock fallback)

The loader receives `handle` from params.

1. Query the live Shopify collection by handle (`COLLECTION_QUERY`, `first: 48`,
   default collection sort). No server-side pagination.
2. If a collection exists **and** has products → use it (`source: 'live'`).
   Map each live product onto the `ProductCard` shape:
   ```
   {
     id, handle,
     name: title,
     price: Number(priceRange.minVariantPrice.amount),
     image: featuredImage,        // ProductCard renders <Image> when present
     type: (productType || '').toLowerCase(),  // feeds the sub-type filter
     tag: null,
     colors: [],                  // ProductCard slices safely on []
   }
   ```
3. If no live collection **or** it is empty → `productsByCategory(handle)` from
   the mock catalogue (`source: 'mock'`). Mock products already match the
   `ProductCard` shape (with `colors`, `tag`, `type`).
4. `title`: live `collection.title`, else the matching `CATEGORIES` `label`,
   else `'Collection'`.
   `description`: live `collection.description`, else the category `sub`
   (e.g. "Tees · Hoodies · Pants"), else `''`.
5. **404 rule:** if there is no live collection **and** `handle` is not one of
   the known category ids in `CATEGORIES`, throw a 404 (`new Response(..., {status: 404})`).
   A known category with zero products renders the branded empty state instead.
6. Keep `redirectIfHandleIsLocalized` for the live-collection case.

Loader return shape:
```
{ handle, title, description, products, source }
```

## Components

All in the route file (matching `_index.jsx`, which keeps Hero/Featured/etc. inline).
New CSS lives in a `COLLECTION` section of `app/styles/kaizen-pages.css`, prefixed `.col-`.

1. **Collection head** (`.col-head`) — branded hero band: `改善 — Collection`
   kicker, large `.display` title (the category name), short description, faint
   decorative kanji + `BrushRibbon` accent echoing the homepage hero.
2. **Category switcher** (`.col-tabs`) — `Men / Women / Accessories` pills from
   `CATEGORIES`, rendered as `NavLink` to `/collections/<id>`. Active state
   highlighted (driven by the current handle). This is the route-level
   "reacts to man/women/etc." Switching changes the URL and reruns the loader.
3. **Toolbar** (`.col-bar`):
   - Left: **sub-type filter chips** — `All` + the distinct `type` values present
     in the loaded products (e.g. Tees / Hoodies / Pants). Derived dynamically so
     it works for both live and mock data. Client-side `useState`.
   - Right: **sort** (Featured / Price ↑ / Price ↓ / Name) + a result count.
     Client-side `useState`.
4. **Product grid** — `.grid-4` of `ProductCard`, wrapped in a `useReveal`
   container so cards animate in on scroll. Filtering/sorting is computed with
   `useMemo` over the loaded `products` from the active type + sort.
5. **Empty state** (`.col-empty`) — when the active filter (or an empty known
   category) yields no products: branded block with an `EnsoMark`, a short
   message, and a button to clear the filter / go back to `/collections`.
6. `Analytics.CollectionView` — kept. Emit collection `{id, handle}` for the
   live case; for the mock case pass `{handle}` (id may be absent).

### Interaction model

- **Category switch** = real navigation (`NavLink`), loader reruns. SEO-friendly,
  shareable URLs.
- **Sub-type filter + sort** = client-side only over the already-loaded set →
  instant, no reload. `useReveal` adds `.in` to the grid container once; because
  `.in .reveal { opacity:1 }`, cards swapped in by filtering appear immediately
  (verified against `useReveal` + `kaizen.css`).

## Edge cases

- Live product with no image → `ProductCard` already falls back to `StudioShot`.
- Live data has no `colors`/`tag` → no swatches, no tag badge (safe on `[]`/`null`).
- Active sub-type filter produces zero results → empty state; tabs + toolbar stay.
- `prefers-reduced-motion` → reveal is disabled in CSS already.

## Conscious simplifications (YAGNI)

- No server-side pagination — the catalogue is small; one `first: 48` fetch plus
  client-side filter/sort is simpler and gives instant UX.
- No color/size faceting from live variants — out of scope; swatches come from
  mock data only.
- No "All" mega-tab in the switcher (the homepage "View all" already links to
  `/collections`). Can be added later if desired.

## Responsiveness

- `.grid-4` already collapses to 2 columns under 980px (existing rule).
- `.col-tabs` and `.col-bar` wrap (`flex-wrap`) on narrow viewports.

## Files touched

- `app/routes/collections.$handle.jsx` — rewrite (loader + components + GraphQL query).
- `app/styles/kaizen-pages.css` — add the `COLLECTION` style section.
- No change needed to `kaizen-data.js` (uses existing `productsByCategory`, `CATEGORIES`, `ft`).
- Run `npm run codegen` after editing the GraphQL document.

## Verification

- `npm run codegen` — regenerate types for the (modified) collection query.
- `npm run lint` — passes.
- Manual: `/collections/men`, `/collections/women`, `/collections/accessories`
  each show their category; switching tabs changes the URL; sub-type chips and
  sort filter the grid live; empty filter shows the empty state; narrow viewport
  collapses to 2 columns.
