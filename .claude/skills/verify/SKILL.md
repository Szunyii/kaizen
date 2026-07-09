---
name: verify
description: Build, launch and drive this Hydrogen storefront to verify changes end-to-end
---

# Verifying changes in this Hydrogen storefront

## Launch

```bash
npm run dev   # MiniOxygen on http://localhost:3000 (subrequest profiler on :3001)
```

Run it in the background and poll until it returns 200 (takes ~10–20s; codegen
watch runs alongside). If port 3000 is taken by another project, the CLI picks
the next free port — read the task output for the actual URL before curling.
`.env` must exist with `SESSION_SECRET` + storefront vars (already checked in
locally).

## Drive

Pages are fully SSR'd — `curl` is enough to verify loader + render behavior,
no browser needed for most flows:

- Product grid cards: grep for `pcard-name`.
- Collection filter chips: `col-chip` / active state `col-chip is-active`.
- Collection empty state: `col-empty-h` (NOT "Nothing here yet" — that string
  also appears in the cart drawer on every page).
- Filters are URL-driven and limited to category + colour: `?type=<productType>`
  and `?color=<colour name>` (repeatable, values must match real product data,
  e.g. `?type=Pol%C3%B3&color=Black`); sort via `?sort=price-asc`. Filtering
  happens in the loader, not via the API's `filters:` argument.

## Live store facts (dev store vrsegv-m5.myshopify.com)

- Collections: `frontpage`, `men`, `women`, `accessories` (must be published to
  the "kaizen" sales channel / publication to be visible to the Storefront API).
- Direct Storefront API queries can be tested with curl against
  `https://$PUBLIC_STORE_DOMAIN/api/2025-04/graphql.json` with header
  `X-Shopify-Storefront-Access-Token: $PUBLIC_STOREFRONT_API_TOKEN` (from `.env`).
- The API's own filter facets are Availability + Price only, and it silently
  ignores `filters:` inputs (productType, variantOption, …) that aren't enabled
  in the Search & Discovery app — which is why the collection route filters in
  the loader instead.
