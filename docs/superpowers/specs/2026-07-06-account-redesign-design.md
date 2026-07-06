# KaizenType Account Section Redesign — Design Spec

**Date:** 2026-07-06
**Status:** Approved by user (in-place restyle + dashboard)

## Goal

Bring the customer account section (`/account/*`) in line with the KaizenType
design system (ink/bone/red tokens, Cormorant Garamond serif display, Inter
sans, brand components). The section currently uses the untouched Hydrogen
skeleton markup, which clashes with the redesigned rest of the site.

## Scope

**In scope (presentation-layer rewrite only):**

- `app/routes/account.jsx` — account layout shell
- `app/routes/account._index.jsx` — new dashboard (replaces redirect)
- `app/routes/account.orders._index.jsx` — orders list
- `app/routes/account.orders.$id.jsx` — order detail
- `app/routes/account.profile.jsx` — profile form
- `app/routes/account.addresses.jsx` — address management
- `app/styles/kaizen-pages.css` — new `ACCOUNT` section
- `app/graphql/customer-account/CustomerDetailsQuery.js` — add `emailAddress`
  field (only data-layer change)

**Out of scope / unchanged:**

- `account_.login.jsx`, `account_.logout.jsx`, `account_.authorize.jsx`,
  `account.$.jsx` — redirect-only routes, no UI
- All loaders, actions, GraphQL operations, pagination and filter logic
  (except the one-field query addition above)
- Authentication flow — stays on the real Customer Account API with Shopify
  hosted login; no mock/demo mode

## Design

### 1. Account layout (`account.jsx`)

Branded shell rendered inside the global `PageLayout` (KaizenHeader/Footer):

- `wrap` container, `view-enter` transition wrapper.
- Kicker line: `会員 — Member`.
- Serif display heading: `Welcome, {firstName}` (fallback: `Your account`).
- Tab navigation with `NavLink`s: **Overview** (`/account`, `end`), **Orders**,
  **Profile**, **Addresses** — styled after the collection category switcher
  (`.col-tab` pills; account uses its own `acct-tab` classes with the same
  visual language; active tab = red fill).
- "Sign out" as a quiet ghost button (POST form to `/account/logout`) aligned
  right of the tabs.
- `Outlet` below, passing `{customer}` context as today.

### 2. Dashboard (`account._index.jsx`)

**Behavior change:** `/account` no longer redirects to `/account/orders`; it
renders an overview page. Uses only `useOutletContext()` data — no loader
query. Content:

- Card grid (3 cards, responsive to 1 column):
  - **Orders** — short line + "View orders →" link.
  - **Profile** — customer name + email, "Edit profile →" link.
  - **Addresses** — default address preview (or "No address yet"),
    "Manage addresses →" link.
- Cards follow the `phil-card` visual language (bordered, ink-800 surface,
  hover lift).

### 3. Orders list (`account.orders._index.jsx`)

Logic (filters, pagination via `PaginatedResourceSection`) untouched. Visuals:

- Filter form: branded text inputs + submit/clear buttons (shared account
  input/button styles).
- Each order = a bordered row-card: serif order number, processed date,
  financial + fulfillment status as small uppercase chips, `Money` total,
  hover arrow; whole card links to the order detail.
- Empty state: enso/brush accent, message, "Start shopping →" CTA to
  `/collections`.

### 4. Order detail (`account.orders.$id.jsx`)

Receipt-style layout, logic untouched:

- Header: serif `Order #`, processed date, status chips.
- Line items: product image thumbnail, title, variant, quantity, price.
- Totals block (subtotal/discounts/shipping/tax/total) aligned right.
- Shipping address block; "← Back to orders" link; "View order status" link
  (statusPageUrl) as a branded button.

### 5. Profile (`account.profile.jsx`)

Form action untouched. Branded field styles (label + input), red primary
submit button with pending state ("Updating…"), error rendered as a red-wash
notice box. Shows the customer email (read-only note) using the new
`emailAddress` field.

### 6. Addresses (`account.addresses.jsx`)

All actions (create/update/delete, default toggle) untouched. Visuals:

- Existing addresses as a card grid; the default address gets a "Default"
  chip.
- Edit forms and the "new address" form get the shared branded field styles;
  destructive "Delete" as a quiet danger button.

### 7. CSS

New `/* =================== ACCOUNT =================== */` section appended
to `app/styles/kaizen-pages.css`, using existing tokens (`--ink-*`, `--bone*`,
`--red*`, `--line`, `--serif`, `--sans`) and helpers (`.wrap`, `.kicker`,
reveal classes). Shared primitives inside the section: `acct-tab`,
`acct-card`, `acct-input`, `acct-btn` (primary/ghost/danger), `acct-chip`.
Responsive: tabs wrap, card grids collapse to one column ≤ 720px. Old
skeleton account rules in `app/styles/app.css` are left in place but must not
leak (account markup stops using those class names; verify no visual
conflicts).

### 8. Data change

`CUSTOMER_FRAGMENT` in `CustomerDetailsQuery.js` gains:

```graphql
emailAddress {
  emailAddress
}
```

Then `npm run codegen` regenerates `customer-accountapi.generated.d.ts`.

## Error handling

Unchanged: loaders keep throwing on missing customer (root ErrorBoundary),
actions keep returning `{error}` payloads — now rendered in branded notice
boxes instead of `<mark>`.

## Copy

English, matching the rest of the site. Japanese accents (会員) used the same
way as on the homepage/about page.

## Verification

- `npm run lint`, `npm run codegen`, `npm run build` must pass.
- No test runner exists in this repo; verification is build + lint + manual.
- Visual check of logged-in states requires the Customer Account API public
  dev domain (`npx shopify hydrogen dev --customer-account-push` per README);
  if unavailable locally, verify markup/CSS statically and confirm the
  logged-out `/account` → hosted-login redirect still works.
