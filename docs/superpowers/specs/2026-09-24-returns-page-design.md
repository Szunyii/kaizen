# Visszaküldés (returns) page — Design Spec

**Date:** 2026-09-24
**Status:** Designed in an unattended session; the assumptions the user
still has to confirm are listed under "Open points".

## Goal

A public "Visszaküldés" page at `/pages/visszakuldes`, linked from the
footer's Segítség column, that explains how returns work and lets a
logged-in customer request a return on a fulfilled order through the
Customer Account API self-serve returns operations
(`Order.returnInformation`, `Order.returns`, `orderRequestReturn`).

## Findings that shape the design

- The footer's "Visszaküldés" link today points to the Shopify refund
  policy, which is empty (TODOS M1). The new page takes over that slot.
- Hydrogen 2026.4.3 talks to Customer Account API 2026-04. Its schema
  (bundled as `@shopify/hydrogen/dist/customer-account.schema.json`) has
  `Order.returnInformation` (returnable / non-returnable line items,
  `nonReturnableSummary`), `Order.returns` (status, decline reason and
  note, line items), `LineItem.suggestedReturnReasonDefinitions` and
  `orderRequestReturn(orderId, requestedLineItems: [{lineItemId, quantity,
  returnReasonDefinitionId?, customerNote?}])`. The `returnReason` enum is
  deprecated since 2026-01 in favour of reason definitions.
- The shop runs new customer accounts (`NEW_CUSTOMER_ACCOUNTS`) with `hu`
  as its primary and only published locale. The Admin API already returns
  the reason library in Hungarian ("Túl kicsi", "Megondoltam magam"), so
  the API names are usable as labels; a handle-keyed Hungarian map is kept
  as insurance for the handles a clothing shop meets.
- Self-serve returns must also be switched on in Shopify admin (Settings →
  Customer accounts → Self-serve returns). If it is off, the mutation
  answers with a `FEATURE_NOT_ENABLED` user error, which the page turns
  into a Hungarian message with the contact address. This cannot be read
  from code.
- Hydrogen's `customerAccount.login()` stores the `return_to` query
  parameter of the login URL and `authorize()` redirects there, so
  `/account/login?return_to=/pages/visszakuldes` brings the customer back
  to the page after the hosted login.
- Login does not work on localhost (OAuth needs the tunnel origin) and the
  store has no orders yet, so the logged-in flow can only be verified by
  codegen against the schema, a stub-router render with mock data and,
  later, on the live site.

## Approaches considered

1. **Public page with the self-serve flow inline (chosen).** One route:
   logged-out visitors read the policy, the steps and a login CTA;
   logged-in customers see their orders with return forms on the same
   page. One link, one place, matches the request literally.
2. Public info page plus the flow inside `/account` (a new `/account/returns`
   tab). Consistent with the account tabs, but two places to maintain and
   the account header and tabs wrap a task the footer link promises
   directly.
3. A return button on each order-detail page only. This is how Shopify's
   hosted accounts do it, but the footer link would land on a page that
   only says "go to your orders"; more clicks for the customer.

## Design

### Route: `app/routes/pages.visszakuldes.jsx` (`/pages/visszakuldes`)

**Loader.** `customerAccount.isLoggedIn()`. Logged out →
`{loggedIn: false, orders: null, loadError: false}`. Logged in →
`customerAccount.query(CUSTOMER_RETURNS_QUERY)`; GraphQL errors →
`{loggedIn: true, orders: null, loadError: true}` so the policy still
renders with a note to retry or e-mail (a public page never 500s over the
optional part). Responses carry `Cache-Control: no-cache, no-store,
must-revalidate` like the account routes.

**Action.** POST only (405 otherwise). Not logged in → 401 with an error.
`parseReturnForm(formData)` (pure, tested) returns `{orderId,
requestedLineItems, error}`; an error → 400. Otherwise
`customerAccount.mutate(ORDER_REQUEST_RETURN_MUTATION)`; GraphQL errors or
`userErrors` → 400 with `returnErrorMessage(userError)`; success →
`{orderId, success: true, returnName}`. Loader revalidation then shows the
new return as "Elbírálás alatt" and the requested units leave the
returnable list.

**Form data contract.** `orderId` (Order GID); `item` (repeated: the
LineItem GIDs of the selected rows); `qty:<lineItemId>` (1…returnable
quantity); `reason:<lineItemId>` (ReturnReasonDefinition GID or empty);
`note` (trimmed, at most 500 characters, sent as `customerNote` on every
requested line). GIDs are pattern-checked and malformed values are
ignored; no selected item → "Jelölj ki legalább egy terméket."

**UI**, one column, sections in this order:

1. Hero: kicker `返品 — Visszaküldés`, display H1 "Nem jött be? / 14 napon
   belül visszaküldheted.", one lead paragraph.
2. "Így működik": three numbered steps (`.rt-steps`, auto-fit grid,
   hairline top border, serif `01 / 02 / 03`): request it from the
   account → pack and post after approval (the address comes by e-mail) →
   refund within 14 days of arrival, to the original payment method.
3. "Visszaküldés indítása" (`id="inditas"`):
   - Logged out: red-bordered panel (`.rt-panel`, the contact page's
     newsletter panel treatment) with copy, a `Bejelentkezés` button to
     `/account/login?return_to=/pages/visszakuldes`, and a note that a
     guest order shows up after logging in with the order's e-mail.
   - Logged in, load error: the same panel with "Nem sikerült betölteni a
     rendeléseidet…", a retry link and the contact e-mail.
   - Logged in, no orders: empty state (reuses `.acct-empty`).
   - Logged in: the 10 newest orders. Each `.rt-order` card: `#number`,
     date, fulfillment chip; the order's existing returns (name, status
     chip, date, items with quantity and reason, decline note); then either
     the return form (when `returnableLineItems` is non-empty) or one
     sentence from `nonReturnableMessage(summary)`.
   - Return form (`fetcher.Form`, one per order): a row per returnable
     line (checkbox `item`, image, name and variant, unit price; quantity
     select when more than one unit; reason select from
     `suggestedReturnReasonDefinitions` with "Válassz okot" as the empty
     default, omitted when the API suggests nothing), one shared note
     textarea, the `Visszaküldés kérése` button (disabled while submitting
     or while nothing is selected), a `role="alert"` error line and a
     `role="status"` success line.
4. FAQ: `FaqList` with five return questions (window, who pays the
   shipping, refund timing, exchange = return plus a new order, guest
   orders) in the `.faq` layout the contact page uses.

Copy is Hungarian: page copy lives in the route, the status, reason and
error maps in `app/lib/returns.js`. The return address is not hardcoded
("a jóváhagyás után e-mailben küldjük").

### Data: `app/graphql/customer-account/`

`CustomerReturnsQuery.js`: `customer.orders(first: 10, sortKey:
PROCESSED_AT, reverse: true)` with, per order, `id name number processedAt
fulfillmentStatus`, `returnInformation { nonReturnableSummary {
nonReturnableReasons } returnableLineItems(first: 20) { nodes { quantity
lineItem { id name variantTitle quantity price image
suggestedReturnReasonDefinitions(first: 8) { nodes { id handle name } } } }
} }` and `returns(first: 5, sortKey: CREATED_AT, reverse: true) { nodes { id
name status createdAt decline { reason note } returnLineItems(first: 20) {
nodes { id quantity lineItem { id name variantTitle } returnReasonDefinition
{ handle name } } } } }`. The page sizes are deliberately small: the
return window is 14 days, the shop sells three products, and nested
connections multiply query cost. The language variable is
`HU` (the shop's only published locale) so reason names come back in
Hungarian.

`OrderRequestReturnMutation.js`: `orderRequestReturn(orderId,
requestedLineItems) { return { id name status } userErrors { field message
code } }`.

`npm run codegen` regenerates `customer-accountapi.generated.d.ts`.

### Helpers: `app/lib/returns.js` with `app/lib/returns.test.js`

- `parseReturnForm(formData)` as in the contract above.
- `returnErrorMessage(userError)`: `FEATURE_NOT_ENABLED`, `NOT_FOUND`,
  `INVALID_STATE`, `ALREADY_EXISTS`, `NOT_AUTHORIZED`, otherwise a generic
  Hungarian message.
- `nonReturnableMessage(summary)`: the first known reason wins, in the
  order `UNFULFILLED`, `RETURN_WINDOW_EXPIRED`, `RETURNED`, `FINAL_SALE`;
  `OTHER` or an empty summary gets the generic sentence.
- `reasonLabel(definition)`: Hungarian by handle for the generic and
  clothing handles, otherwise the API `name`.
- `RETURN_STATUS_HU`, `DECLINE_HU` and the field-name constants.

### Footer: `app/components/kaizen/KaizenFooter.jsx`

"Visszaküldés" becomes a fixed link to `/pages/visszakuldes` (like the
ÁSZF link) both in the policy-derived list and in the fallback; the empty
refund policy is no longer linked. Column order: Kapcsolat, Szállítás
(when configured), Visszaküldés, Adatkezelés, ÁSZF.

### Styles: a `RETURNS` section appended to `app/styles/kaizen-pages.css`

`.rt-*` classes for the layout; `.acct-chip`, `.acct-input`,
`.acct-label`, `.acct-error` and `.acct-empty*` are reused as they are.
Mobile rules follow the DESIGN.md mobile rules (`minmax(0,1fr)` grids,
44px targets, the global 16px touch-field rule) and sit inside the section
at the end of the file, after their base rules.

### Error handling

The loader never throws for the logged-in branch; the action returns
`{orderId, error}` so only the submitted order's form shows the message;
unknown API codes get the generic Hungarian message; the mutation is never
called without a logged-in session or a valid selection.

### Testing

`npm test` covers the pure helpers. `npm run codegen` validates both
documents against the 2026-04 schema; `npm run lint` and `npm run build`
must stay clean. The logged-out page and the footer are verified in the
dev server (curl and headless Chrome at desktop and 375px). The logged-in
markup is smoke-rendered with `createRoutesStub` and mock loader data.
Live logged-in verification is left to the user: it needs the tunnel (or
the deployed site) and a fulfilled order.

## Open points

- Copy to confirm: the return shipping cost ("a visszaküldés postaköltsége
  a vásárlót terheli; hibás vagy téves terméknél mi álljuk") and the
  14-day refund wording.
- The self-serve returns toggle in Shopify admin; return rules (window,
  fees) are optional and the page shows whatever the API reports.
- Linking the page from the order-detail aside and the account overview
  is not part of this change.

## Out of scope

Exchanges (the Customer Account API only requests returns), return
shipping labels, the refund policy page content (TODOS M1), returns
without logging in.
