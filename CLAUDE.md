# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Shopify Hydrogen headless storefront (skeleton template). The stack is **Hydrogen + React Router v7 + Oxygen (Cloudflare Workers runtime) + Vite**. Code is written in JSX/JS (not TS) but typechecked via JSDoc + generated `.d.ts` files.

## Commands

```bash
npm run dev       # Local dev via MiniOxygen + Shopify CLI, runs codegen in watch mode
npm run build     # Production build (shopify hydrogen build --codegen)
npm run preview   # Build then serve the production bundle locally
npm run lint      # ESLint over the repo
npm run codegen   # Regenerate GraphQL types + react-router typegen
```

There is **no test runner configured**. The eslint-plugin-jest config exists but no test scripts/files are present.

## Critical: React Router, not Remix

This project uses React Router v7, **not** Remix. See `.cursor/rules/hydrogen-react-router.mdc`. Always import routing primitives (`useLoaderData`, `Link`, `Form`, `useActionData`, `useNavigation`, `useSubmit`, etc.) from `react-router`. **Never** import from `@remix-run/*` or `react-router-dom`. When adapting Remix docs/examples, translate the package names accordingly.

## Architecture

**Request flow:** `server.js` is the Worker entry. Per request it calls `createHydrogenRouterContext` (`app/lib/context.js`), which builds the Hydrogen context (storefront client, cart, customer account, cache, session, i18n) and hands it to React Router's request handler as the load context. On a 404, `storefrontRedirect` checks Shopify for a configured redirect before returning. Session cookies are committed after the response when `session.isPending`.

**Context object** is what every loader/action receives as `context`. `context.storefront.query(...)` hits the Storefront API; `context.customerAccount` the Customer Account API; `context.cart` the cart. Custom clients (CMS, reviews, etc.) are added to `additionalContext` in `app/lib/context.js` and become available as `context.propertyName`.

**Routing** is file-based via `@react-router/fs-routes` flat routes (`app/routes/`), wrapped by `hydrogenRoutes()` in `app/routes.js`. Filename dots map to URL segments; `$param` = dynamic segment; trailing `_` (e.g. `account_.login.jsx`) opts out of the parent layout; `[literal]` escapes special chars (e.g. `[sitemap.xml].jsx`).

**Loader data pattern** (see `app/routes/products.$handle.jsx`): split into `loadCriticalData` (awaited, above-the-fold, may throw 404/500) and `loadDeferredData` (not awaited, below-the-fold, must never throw). The `loader` merges both. Use `Promise.all` to parallelize critical queries.

**GraphQL:** queries/fragments are inline template literals tagged with the `#graphql` comment (enables codegen + syntax highlighting), colocated in the route or `app/lib/fragments.js`. Customer Account API operations live separately in `app/graphql/customer-account/`. Codegen writes types into `storefrontapi.generated.d.ts` and `customer-accountapi.generated.d.ts`. The two API schemas are configured as separate projects in `.graphqlrc.js`. **Run `npm run codegen` after changing any GraphQL document.**

**Types:** Route types come from React Router typegen into `.react-router/types/` and are imported via JSDoc, e.g. `/** @typedef {import('./+types/products.$handle').Route} Route */`, then used as `Route.LoaderArgs`, `Route.MetaFunction`. The `.react-router/` and `*.generated.d.ts` files are generated — do not hand-edit.

## Environment

`SESSION_SECRET` is required (context throws without it). Local-only vars go in `.env`. Pull storefront vars with `npx shopify hydrogen link` / `npx shopify hydrogen env pull`. The `/account` (Customer Account API) section requires a public dev domain — see README setup link.
