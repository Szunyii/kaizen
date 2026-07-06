# KaizenType Account Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the `/account/*` section (layout, dashboard, orders, order detail, profile, addresses) to the KaizenType design system, keeping all data logic untouched.

**Architecture:** Presentation-layer rewrite only. Every loader, action, and GraphQL operation stays as-is except one added `emailAddress` field. New `acct-*` CSS classes go into a new `ACCOUNT` section of `app/styles/kaizen-pages.css`; JSX in the six account routes is rewritten to use them. `/account` stops redirecting to orders and becomes an overview dashboard.

**Tech Stack:** Shopify Hydrogen, React Router v7 (import from `react-router`, NEVER `@remix-run/*` or `react-router-dom`), Vite, plain CSS with custom properties, JSDoc types.

**Spec:** `docs/superpowers/specs/2026-07-06-account-redesign-design.md`

---

## Context for the implementer

- **No test runner exists in this repo.** Verification is `npm run lint`, `npm run codegen`, `npm run build`. TDD does not apply; each task ends with lint + commit, and the final task runs the full build.
- **Design tokens** live in `app/styles/kaizen.css` (`--ink-*` backgrounds, `--bone*` text, `--red*` accent, `--line` borders, `--serif`/`--sans`/`--brush` fonts). Shared helpers you will reuse: `.wrap` (page container), `.kicker` (red uppercase label), `.display` (serif heading), `.btn` / `.btn-ghost` (buttons), `.view-enter` (page fade-in).
- **Do not touch**: `account_.login.jsx`, `account_.logout.jsx`, `account_.authorize.jsx`, `account.$.jsx`, any loader/action logic, `app/styles/app.css` (its old skeleton account rules become dead code; that is fine).
- Viewing logged-in pages locally requires the Customer Account API public dev domain (`npx shopify hydrogen dev --customer-account-push`, see README). If that is not set up, rely on lint/build and static review.
- Commit messages: imperative mood, no `feat:`-style prefixes (matches repo history), each ending with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.

---

### Task 1: Account CSS foundation

**Files:**
- Modify: `app/styles/kaizen-pages.css` (append at end of file)

- [ ] **Step 1: Append the ACCOUNT section to `app/styles/kaizen-pages.css`**

Add this at the very end of the file:

```css
/* =================== ACCOUNT =================== */
.acct{ padding-block:clamp(40px,5vw,72px) clamp(70px,8vw,110px); }
.acct-head{ padding-bottom:26px; }
.acct-h{ font-size:clamp(34px,4.6vw,58px); margin-top:14px; }

/* tab navigation */
.acct-nav{ display:flex; align-items:center; flex-wrap:wrap; gap:10px; padding:18px 0;
  border-bottom:1px solid var(--line); }
.acct-tab{ display:inline-flex; align-items:center; padding:11px 22px; border-radius:2px;
  border:1px solid var(--line); background:var(--ink-800); color:var(--bone-dim);
  font:700 12px/1 var(--sans); letter-spacing:.16em; text-transform:uppercase;
  transition:color .25s var(--ease), border-color .25s var(--ease), background .25s var(--ease), transform .25s var(--ease); }
.acct-tab:hover{ color:var(--bone); border-color:var(--bone-mut); transform:translateY(-1px); }
.acct-tab.is-active{ background:var(--red); border-color:var(--red); color:#fff; }
.acct-signout{ margin-left:auto; }
.acct-signout .btn{ padding:11px 22px; }
.acct-body{ padding-top:36px; }

/* shared primitives */
.acct-sec{ margin-top:48px; }
.acct-sec-h{ font-family:var(--serif); font-weight:600; font-size:26px; margin-bottom:20px; }
.acct-note{ font:400 14px/1.6 var(--sans); color:var(--bone-dim); margin:-10px 0 22px; }
.acct-chip{ display:inline-flex; align-items:center; padding:6px 12px; border-radius:2px;
  border:1px solid var(--line); background:var(--ink-750); color:var(--bone-dim);
  font:700 10px/1 var(--sans); letter-spacing:.18em; text-transform:uppercase; }
.acct-chip.red{ color:var(--red-bright); border-color:rgba(197,60,27,.4); background:var(--red-wash); }
.acct-link{ display:inline-flex; align-items:center; gap:9px; font:700 12px/1 var(--sans);
  letter-spacing:.16em; text-transform:uppercase; color:var(--red); }
.btn-danger{ background:transparent; color:var(--red-bright); border-color:rgba(197,60,27,.45); }
.btn-danger:hover{ background:var(--red-wash); border-color:var(--red); transform:translateY(-1px); }

/* form primitives */
.acct-form{ display:grid; grid-template-columns:1fr 1fr; gap:18px; max-width:680px; }
.acct-form .full{ grid-column:1/-1; }
.acct-field{ display:flex; flex-direction:column; gap:8px; }
.acct-label{ font:600 11px/1 var(--sans); letter-spacing:.2em; text-transform:uppercase; color:var(--bone-mut); }
.acct-input{ padding:13px 16px; background:var(--ink-850); border:1px solid var(--line); border-radius:2px;
  color:var(--bone); font:400 15px/1.4 var(--sans); transition:border-color .25s var(--ease); }
.acct-input:focus{ outline:none; border-color:var(--red); }
.acct-input::placeholder{ color:var(--bone-mut); }
.acct-check{ display:flex; align-items:center; gap:10px; font:400 14px/1.4 var(--sans); color:var(--bone-dim); }
.acct-check input{ accent-color:var(--red); width:16px; height:16px; }
.acct-error{ grid-column:1/-1; padding:12px 16px; background:var(--red-wash);
  border:1px solid rgba(197,60,27,.4); border-radius:2px;
  font:400 13px/1.5 var(--sans); color:var(--red-bright); }
.acct-actions{ grid-column:1/-1; display:flex; flex-wrap:wrap; gap:10px; }

/* dashboard */
.acct-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.acct-card{ display:flex; flex-direction:column; gap:10px; padding:28px 30px; background:var(--ink-800);
  border:1px solid var(--line); border-radius:4px;
  transition:border-color .4s, transform .4s var(--ease); }
.acct-card:hover{ border-color:rgba(197,60,27,.4); transform:translateY(-3px); }
.acct-card-kanji{ font-family:var(--brush); font-size:44px; line-height:1; color:var(--red); }
.acct-card-h{ font:700 17px/1.2 var(--sans); color:var(--bone); }
.acct-card-p{ font:400 14px/1.65 var(--sans); color:var(--bone-dim); flex:1; }

/* orders list */
.acct-search{ display:flex; flex-wrap:wrap; gap:10px; margin-bottom:26px; }
.acct-search .acct-input{ flex:1; min-width:180px; }
.acct-orders{ display:flex; flex-direction:column; gap:14px; padding:8px 0; }
.acct-order{ display:grid; grid-template-columns:1fr auto; gap:6px 24px; align-items:center;
  padding:22px 26px; background:var(--ink-800); border:1px solid var(--line); border-radius:4px;
  transition:border-color .4s, transform .4s var(--ease); }
.acct-order:hover{ border-color:rgba(197,60,27,.4); transform:translateX(4px); }
.acct-order-num{ font-family:var(--serif); font-size:24px; line-height:1.2; }
.acct-order-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; margin-top:8px;
  font:400 13px/1.4 var(--sans); color:var(--bone-dim); }
.acct-order-total{ display:flex; flex-direction:column; align-items:flex-end; gap:8px;
  font-family:var(--serif); font-size:20px; }

/* empty state */
.acct-empty{ display:flex; flex-direction:column; align-items:center; gap:18px;
  padding:64px 20px; text-align:center; border:1px dashed var(--line); border-radius:4px; }
.acct-empty-kanji{ font-family:var(--brush); font-size:64px; line-height:1; color:var(--red); }
.acct-empty p{ color:var(--bone-dim); }

/* order detail */
.acct-back{ display:inline-flex; align-items:center; gap:9px; margin-bottom:24px;
  font:700 12px/1 var(--sans); letter-spacing:.16em; text-transform:uppercase; color:var(--bone-dim); }
.acct-back:hover{ color:var(--bone); }
.acct-order-head{ display:flex; flex-wrap:wrap; align-items:center; gap:12px 18px; }
.acct-order-sub{ font:400 14px/1.6 var(--sans); color:var(--bone-dim); margin-top:8px; }
.acct-order-detail{ display:grid; grid-template-columns:1.6fr .9fr; gap:40px; align-items:start; margin-top:34px; }
.acct-lines{ display:flex; flex-direction:column; }
.acct-line{ display:grid; grid-template-columns:72px 1fr auto; gap:18px; align-items:center;
  padding:16px 0; border-bottom:1px solid var(--line-2); }
.acct-line img, .acct-line-ph{ width:72px; height:72px; border-radius:2px; background:var(--ink-800);
  border:1px solid var(--line-2); object-fit:cover; }
.acct-line-title{ font:600 15px/1.35 var(--sans); }
.acct-line-var{ font:400 13px/1.4 var(--sans); color:var(--bone-mut); margin-top:4px; }
.acct-line-price{ display:flex; flex-direction:column; align-items:flex-end; gap:4px;
  font:400 14px/1.5 var(--sans); color:var(--bone-dim); }
.acct-totals{ display:flex; flex-direction:column; gap:10px; margin-top:20px; margin-left:auto;
  width:100%; max-width:320px; }
.acct-total-row{ display:flex; justify-content:space-between; gap:20px;
  font:400 14px/1.5 var(--sans); color:var(--bone-dim); }
.acct-total-row.grand{ border-top:1px solid var(--line); padding-top:12px;
  font:600 17px/1.4 var(--sans); color:var(--bone); }
.acct-aside{ display:flex; flex-direction:column; gap:26px; padding:26px 28px;
  background:var(--ink-800); border:1px solid var(--line); border-radius:4px; }
.acct-aside h3{ font:600 11px/1 var(--sans); letter-spacing:.2em; text-transform:uppercase;
  color:var(--bone-mut); margin-bottom:10px; }
.acct-aside address{ font-style:normal; font:400 14px/1.7 var(--sans); color:var(--bone-dim); }
.acct-aside .btn{ justify-content:center; }

/* addresses */
.acct-addr-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
.acct-addr{ display:flex; flex-direction:column; gap:16px; align-items:flex-start; padding:26px 28px;
  background:var(--ink-800); border:1px solid var(--line); border-radius:4px; }
.acct-addr .acct-form{ max-width:none; width:100%; }

/* responsive */
@media (max-width:880px){
  .acct-grid{ grid-template-columns:1fr; }
  .acct-order-detail{ grid-template-columns:1fr; }
  .acct-addr-grid{ grid-template-columns:1fr; }
}
@media (max-width:640px){
  .acct-form{ grid-template-columns:1fr; }
  .acct-signout{ margin-left:0; width:100%; }
  .acct-order{ grid-template-columns:1fr; }
  .acct-order-total{ flex-direction:row; align-items:center; justify-content:space-between; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/styles/kaizen-pages.css
git commit -m "Add account section styles to kaizen-pages.css

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Add emailAddress to the customer details query

**Files:**
- Modify: `app/graphql/customer-account/CustomerDetailsQuery.js`
- Regenerated: `customer-accountapi.generated.d.ts` (via codegen, do not hand-edit)

- [ ] **Step 1: Add the field to `CUSTOMER_FRAGMENT`**

In `app/graphql/customer-account/CustomerDetailsQuery.js`, change:

```graphql
  fragment Customer on Customer {
    id
    firstName
    lastName
    defaultAddress {
```

to:

```graphql
  fragment Customer on Customer {
    id
    firstName
    lastName
    emailAddress {
      emailAddress
    }
    defaultAddress {
```

- [ ] **Step 2: Regenerate types**

Run: `npm run codegen`
Expected: exits 0; `customer-accountapi.generated.d.ts` now includes `emailAddress` on the Customer fragment.

- [ ] **Step 3: Commit**

```bash
git add app/graphql/customer-account/CustomerDetailsQuery.js customer-accountapi.generated.d.ts
git commit -m "Fetch customer email in account details query

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Account layout shell (`account.jsx`)

**Files:**
- Modify: `app/routes/account.jsx`

- [ ] **Step 1: Replace the component half of the file**

Keep everything from the top of the file through the end of the `loader` function (imports, `shouldRevalidate`, `loader`) exactly as-is. Replace everything from `export default function AccountLayout()` down to (but not including) the trailing `/** @typedef ... */` lines with:

```jsx
export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  const heading = customer.firstName
    ? `Welcome, ${customer.firstName}`
    : 'Your account';

  return (
    <div className="acct view-enter">
      <div className="wrap">
        <header className="acct-head">
          <p className="kicker">会員 — Member</p>
          <h1 className="acct-h display">{heading}</h1>
        </header>
        <AccountMenu />
        <div className="acct-body">
          <Outlet context={{customer}} />
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  const tabClass = ({isActive}) =>
    isActive ? 'acct-tab is-active' : 'acct-tab';

  return (
    <nav className="acct-nav" role="navigation">
      <NavLink to="/account" end className={tabClass}>
        Overview
      </NavLink>
      <NavLink to="/account/orders" className={tabClass}>
        Orders
      </NavLink>
      <NavLink to="/account/profile" className={tabClass}>
        Profile
      </NavLink>
      <NavLink to="/account/addresses" className={tabClass}>
        Addresses
      </NavLink>
      <Form className="acct-signout" method="POST" action="/account/logout">
        <button type="submit" className="btn btn-ghost">
          Sign out
        </button>
      </Form>
    </nav>
  );
}
```

Notes: the old `Logout` component is deleted (folded into `AccountMenu`); the `end` prop on the Overview NavLink stops it from matching subpages; imports do not change.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0 (warnings that already existed are fine; no new errors).

- [ ] **Step 3: Commit**

```bash
git add app/routes/account.jsx
git commit -m "Restyle account layout with branded tabs

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Account dashboard (`account._index.jsx`)

**Files:**
- Modify: `app/routes/account._index.jsx` (full rewrite — currently just a redirect)

- [ ] **Step 1: Replace the entire file content with:**

```jsx
import {Link, useOutletContext} from 'react-router';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'KaizenType — Account'}];
};

export default function AccountOverview() {
  /** @type {{customer: CustomerFragment}} */
  const {customer} = useOutletContext();
  const email = customer.emailAddress?.emailAddress;
  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ');
  const {defaultAddress} = customer;

  return (
    <div className="acct-grid">
      <Link to="/account/orders" className="acct-card">
        <span className="acct-card-kanji">注</span>
        <h2 className="acct-card-h">Orders</h2>
        <p className="acct-card-p">
          Track, review and revisit everything you have ordered.
        </p>
        <span className="acct-link">View orders →</span>
      </Link>
      <Link to="/account/profile" className="acct-card">
        <span className="acct-card-kanji">名</span>
        <h2 className="acct-card-h">Profile</h2>
        <p className="acct-card-p">
          {name || 'Add your name'}
          {email ? (
            <>
              <br />
              {email}
            </>
          ) : null}
        </p>
        <span className="acct-link">Edit profile →</span>
      </Link>
      <Link to="/account/addresses" className="acct-card">
        <span className="acct-card-kanji">所</span>
        <h2 className="acct-card-h">Addresses</h2>
        <p className="acct-card-p">
          {defaultAddress
            ? [defaultAddress.address1, defaultAddress.city]
                .filter(Boolean)
                .join(', ')
            : 'No address saved yet.'}
        </p>
        <span className="acct-link">Manage addresses →</span>
      </Link>
    </div>
  );
}

/** @typedef {import('./+types/account._index').Route} Route */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
```

This intentionally removes the `loader` redirect to `/account/orders` — `/account` is now a real page (approved behavior change).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add app/routes/account._index.jsx
git commit -m "Replace account redirect with overview dashboard

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Orders list (`account.orders._index.jsx`)

**Files:**
- Modify: `app/routes/account.orders._index.jsx`

Imports and `loader` are unchanged. Only the meta title and the component functions change.

- [ ] **Step 1: Update the meta title**

Change:

```jsx
export const meta = () => {
  return [{title: 'Orders'}];
};
```

to:

```jsx
export const meta = () => {
  return [{title: 'KaizenType — Orders'}];
};
```

- [ ] **Step 2: Replace the component functions**

Replace everything from `export default function Orders()` down to (but not including) the `/**\n * @typedef {{` block near the end of the file with:

```jsx
export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer, filters} = useLoaderData();
  const {orders} = customer;

  return (
    <div className="acct-orders-page">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

/**
 * @param {{
 *   orders: CustomerOrdersFragment['orders'];
 *   filters: OrderFilterParams;
 * }}
 */
function OrdersTable({orders, filters}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection
          connection={orders}
          resourcesClassName="acct-orders"
        >
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

/**
 * @param {{hasFilters?: boolean}}
 */
function EmptyOrders({hasFilters = false}) {
  return (
    <div className="acct-empty">
      <span className="acct-empty-kanji">無</span>
      {hasFilters ? (
        <>
          <p>No orders found matching your search.</p>
          <Link className="acct-link" to="/account/orders">
            Clear filters →
          </Link>
        </>
      ) : (
        <>
          <p>You haven&apos;t placed any orders yet.</p>
          <Link className="btn" to="/collections">
            Start shopping
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * @param {{
 *   currentFilters: OrderFilterParams;
 * }}
 */
function OrderSearchForm({currentFilters}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="acct-search"
      aria-label="Search orders"
    >
      <input
        type="search"
        className="acct-input"
        name={ORDER_FILTER_FIELDS.NAME}
        placeholder="Order #"
        aria-label="Order number"
        defaultValue={currentFilters.name || ''}
      />
      <input
        type="search"
        className="acct-input"
        name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
        placeholder="Confirmation #"
        aria-label="Confirmation number"
        defaultValue={currentFilters.confirmationNumber || ''}
      />
      <button className="btn" type="submit" disabled={isSearching}>
        {isSearching ? 'Searching…' : 'Search'}
      </button>
      {hasFilters && (
        <button
          className="btn btn-ghost"
          type="button"
          disabled={isSearching}
          onClick={() => {
            setSearchParams(new URLSearchParams());
            formRef.current?.reset();
          }}
        >
          Clear
        </button>
      )}
    </form>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <Link className="acct-order" to={`/account/orders/${btoa(order.id)}`}>
      <div>
        <p className="acct-order-num">#{order.number}</p>
        <div className="acct-order-meta">
          <span>{new Date(order.processedAt).toDateString()}</span>
          {order.confirmationNumber && (
            <span>Conf. {order.confirmationNumber}</span>
          )}
          <span className="acct-chip">{order.financialStatus}</span>
          {fulfillmentStatus && (
            <span className="acct-chip">{fulfillmentStatus}</span>
          )}
        </div>
      </div>
      <div className="acct-order-total">
        <Money data={order.totalPrice} />
        <span className="acct-link">View →</span>
      </div>
    </Link>
  );
}
```

All imports at the top of the file are still used (`Link`, `useLoaderData`, `useNavigation`, `useSearchParams`, `useRef`, `Money`, `getPaginationVariables`, `flattenConnection`, the filter helpers, `CUSTOMER_ORDERS_QUERY`, `PaginatedResourceSection`) — leave them alone. The trailing typedef block also stays.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/routes/account.orders._index.jsx
git commit -m "Restyle orders list with branded order cards

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Order detail (`account.orders.$id.jsx`)

**Files:**
- Modify: `app/routes/account.orders.$id.jsx`

`loader` is unchanged. Changes: one import, meta title, component functions.

- [ ] **Step 1: Add `Link` to the react-router import**

Change:

```jsx
import {redirect, useLoaderData} from 'react-router';
```

to:

```jsx
import {Link, redirect, useLoaderData} from 'react-router';
```

- [ ] **Step 2: Update the meta title**

Change:

```jsx
  return [{title: `Order ${data?.order?.name}`}];
```

to:

```jsx
  return [{title: `KaizenType — Order ${data?.order?.name}`}];
```

- [ ] **Step 3: Replace the component functions**

Replace everything from `export default function OrderRoute()` down to (but not including) the trailing `/** @typedef ... */` lines with:

```jsx
export default function OrderRoute() {
  /** @type {LoaderReturnData} */
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData();
  return (
    <div className="acct-order-page">
      <Link className="acct-back" to="/account/orders">
        ← Back to orders
      </Link>
      <div className="acct-order-head">
        <h2 className="acct-order-num">Order {order.name}</h2>
        <span className="acct-chip">{fulfillmentStatus}</span>
      </div>
      <p className="acct-order-sub">
        Placed on {new Date(order.processedAt).toDateString()}
        {order.confirmationNumber
          ? ` · Confirmation ${order.confirmationNumber}`
          : ''}
      </p>

      <div className="acct-order-detail">
        <div>
          <div className="acct-lines">
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </div>
          <div className="acct-totals">
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <div className="acct-total-row">
                <span>Discounts</span>
                {discountPercentage ? (
                  <span>-{discountPercentage}% OFF</span>
                ) : (
                  discountValue && <Money data={discountValue} />
                )}
              </div>
            )}
            <div className="acct-total-row">
              <span>Subtotal</span>
              <Money data={order.subtotal} />
            </div>
            <div className="acct-total-row">
              <span>Tax</span>
              <Money data={order.totalTax} />
            </div>
            <div className="acct-total-row grand">
              <span>Total</span>
              <Money data={order.totalPrice} />
            </div>
          </div>
        </div>
        <aside className="acct-aside">
          <div>
            <h3>Shipping address</h3>
            {order?.shippingAddress ? (
              <address>
                <p>{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted ? (
                  <p>{order.shippingAddress.formatted}</p>
                ) : (
                  ''
                )}
                {order.shippingAddress.formattedArea ? (
                  <p>{order.shippingAddress.formattedArea}</p>
                ) : (
                  ''
                )}
              </address>
            ) : (
              <p>No shipping address defined</p>
            )}
          </div>
          <div>
            <h3>Status</h3>
            <span className="acct-chip">{fulfillmentStatus}</span>
          </div>
          <a
            className="btn"
            target="_blank"
            href={order.statusPageUrl}
            rel="noreferrer"
          >
            View order status
          </a>
        </aside>
      </div>
    </div>
  );
}

/**
 * @param {{lineItem: OrderLineItemFullFragment}}
 */
function OrderLineRow({lineItem}) {
  return (
    <div className="acct-line">
      {lineItem?.image ? (
        <Image data={lineItem.image} width={72} height={72} />
      ) : (
        <div className="acct-line-ph" />
      )}
      <div>
        <p className="acct-line-title">{lineItem.title}</p>
        {lineItem.variantTitle && (
          <p className="acct-line-var">{lineItem.variantTitle}</p>
        )}
      </div>
      <div className="acct-line-price">
        <Money data={lineItem.price} />
        <span>× {lineItem.quantity}</span>
      </div>
    </div>
  );
}
```

The old `<table>` markup (and the per-line `totalDiscount` column) is gone; order-level discounts still show in the totals block.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add "app/routes/account.orders.\$id.jsx"
git commit -m "Restyle order detail as branded receipt layout

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Profile (`account.profile.jsx`)

**Files:**
- Modify: `app/routes/account.profile.jsx`

Imports, `loader`, and `action` are unchanged. Changes: meta title + component.

- [ ] **Step 1: Update the meta title**

Change:

```jsx
  return [{title: 'Profile'}];
```

to:

```jsx
  return [{title: 'KaizenType — Profile'}];
```

- [ ] **Step 2: Replace the component**

Replace everything from `export default function AccountProfile()` down to (but not including) the `/**\n * @typedef {{` block with:

```jsx
export default function AccountProfile() {
  const account = useOutletContext();
  const {state} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const customer = action?.customer ?? account?.customer;
  const email = account?.customer?.emailAddress?.emailAddress;

  return (
    <div className="acct-profile">
      <h2 className="acct-sec-h">My profile</h2>
      {email && <p className="acct-note">Signed in as {email}</p>}
      <Form method="PUT" className="acct-form">
        <div className="acct-field">
          <label className="acct-label" htmlFor="firstName">
            First name
          </label>
          <input
            className="acct-input"
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            aria-label="First name"
            defaultValue={customer.firstName ?? ''}
            minLength={2}
          />
        </div>
        <div className="acct-field">
          <label className="acct-label" htmlFor="lastName">
            Last name
          </label>
          <input
            className="acct-input"
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            aria-label="Last name"
            defaultValue={customer.lastName ?? ''}
            minLength={2}
          />
        </div>
        {action?.error && <p className="acct-error">{action.error}</p>}
        <div className="acct-actions">
          <button className="btn" type="submit" disabled={state !== 'idle'}>
            {state !== 'idle' ? 'Updating…' : 'Update'}
          </button>
        </div>
      </Form>
    </div>
  );
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/routes/account.profile.jsx
git commit -m "Restyle profile form with branded fields

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Addresses (`account.addresses.jsx`)

**Files:**
- Modify: `app/routes/account.addresses.jsx`

Imports, `loader`, and the long `action` (lines ~21–250) are unchanged. Changes: meta title + everything from `export default function Addresses()` to just before the `/**\n * @typedef {{` block.

- [ ] **Step 1: Update the meta title**

Change:

```jsx
  return [{title: 'Addresses'}];
```

to:

```jsx
  return [{title: 'KaizenType — Addresses'}];
```

- [ ] **Step 2: Replace the component functions**

Replace everything from `export default function Addresses()` down to (but not including) the `/**\n * @typedef {{` block with:

```jsx
export default function Addresses() {
  const {customer} = useOutletContext();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="acct-addresses">
      <section>
        <h2 className="acct-sec-h">Saved addresses</h2>
        {!addresses.nodes.length ? (
          <div className="acct-empty">
            <span className="acct-empty-kanji">所</span>
            <p>You have no addresses saved.</p>
          </div>
        ) : (
          <ExistingAddresses
            addresses={addresses}
            defaultAddress={defaultAddress}
          />
        )}
      </section>
      <section className="acct-sec">
        <h2 className="acct-sec-h">Add a new address</h2>
        <NewAddressForm key={addresses.nodes.length} />
      </section>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  };

  return (
    <div className="acct-addr">
      <AddressForm
        addressId={'NEW_ADDRESS_ID'}
        address={newAddress}
        defaultAddress={null}
      >
        {({stateForMethod}) => (
          <div className="acct-actions">
            <button
              className="btn"
              disabled={stateForMethod('POST') !== 'idle'}
              formMethod="POST"
              type="submit"
            >
              {stateForMethod('POST') !== 'idle' ? 'Creating…' : 'Create'}
            </button>
          </div>
        )}
      </AddressForm>
    </div>
  );
}

/**
 * @param {Pick<CustomerFragment, 'addresses' | 'defaultAddress'>}
 */
function ExistingAddresses({addresses, defaultAddress}) {
  return (
    <div className="acct-addr-grid">
      {addresses.nodes.map((address) => (
        <div className="acct-addr" key={address.id}>
          {defaultAddress?.id === address.id && (
            <span className="acct-chip red">Default</span>
          )}
          <AddressForm
            addressId={address.id}
            address={address}
            defaultAddress={defaultAddress}
          >
            {({stateForMethod}) => (
              <div className="acct-actions">
                <button
                  className="btn"
                  disabled={stateForMethod('PUT') !== 'idle'}
                  formMethod="PUT"
                  type="submit"
                >
                  {stateForMethod('PUT') !== 'idle' ? 'Saving…' : 'Save'}
                </button>
                <button
                  className="btn btn-danger"
                  disabled={stateForMethod('DELETE') !== 'idle'}
                  formMethod="DELETE"
                  type="submit"
                >
                  {stateForMethod('DELETE') !== 'idle' ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </AddressForm>
        </div>
      ))}
    </div>
  );
}

/**
 * @param {{
 *   addressId: string;
 *   name: string;
 *   label: string;
 *   full?: boolean;
 * } & React.ComponentProps<'input'>}
 */
function AddressField({addressId, name, label, full = false, ...inputProps}) {
  const id = `${addressId}-${name}`;
  return (
    <div className={full ? 'acct-field full' : 'acct-field'}>
      <label className="acct-label" htmlFor={id}>
        {label}
      </label>
      <input className="acct-input" id={id} name={name} {...inputProps} />
    </div>
  );
}

/**
 * @param {{
 *   addressId: AddressFragment['id'];
 *   address: CustomerAddressInput;
 *   defaultAddress: CustomerFragment['defaultAddress'];
 *   children: (props: {
 *     stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
 *   }) => React.ReactNode;
 * }}
 */
export function AddressForm({addressId, address, defaultAddress, children}) {
  const {state, formMethod} = useNavigation();
  /** @type {ActionReturnData} */
  const action = useActionData();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;
  return (
    <Form id={addressId} className="acct-form">
      <input type="hidden" name="addressId" defaultValue={addressId} />
      <AddressField
        addressId={addressId}
        name="firstName"
        label="First name*"
        aria-label="First name"
        autoComplete="given-name"
        defaultValue={address?.firstName ?? ''}
        placeholder="First name"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="lastName"
        label="Last name*"
        aria-label="Last name"
        autoComplete="family-name"
        defaultValue={address?.lastName ?? ''}
        placeholder="Last name"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="company"
        label="Company"
        full
        aria-label="Company"
        autoComplete="organization"
        defaultValue={address?.company ?? ''}
        placeholder="Company"
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="address1"
        label="Address line*"
        full
        aria-label="Address line 1"
        autoComplete="address-line1"
        defaultValue={address?.address1 ?? ''}
        placeholder="Address line 1"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="address2"
        label="Address line 2"
        full
        aria-label="Address line 2"
        autoComplete="address-line2"
        defaultValue={address?.address2 ?? ''}
        placeholder="Address line 2"
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="city"
        label="City*"
        aria-label="City"
        autoComplete="address-level2"
        defaultValue={address?.city ?? ''}
        placeholder="City"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="zoneCode"
        label="State / Province*"
        aria-label="State/Province"
        autoComplete="address-level1"
        defaultValue={address?.zoneCode ?? ''}
        placeholder="State / Province"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="zip"
        label="Zip / Postal Code*"
        aria-label="Zip"
        autoComplete="postal-code"
        defaultValue={address?.zip ?? ''}
        placeholder="Zip / Postal Code"
        required
        type="text"
      />
      <AddressField
        addressId={addressId}
        name="territoryCode"
        label="Country Code*"
        aria-label="Country code"
        autoComplete="country"
        defaultValue={address?.territoryCode ?? ''}
        placeholder="Country"
        required
        type="text"
        maxLength={2}
      />
      <AddressField
        addressId={addressId}
        name="phoneNumber"
        label="Phone"
        full
        aria-label="Phone Number"
        autoComplete="tel"
        defaultValue={address?.phoneNumber ?? ''}
        placeholder="+16135551111"
        pattern="^\+?[1-9]\d{3,14}$"
        type="tel"
      />
      <div className="acct-check full">
        <input
          defaultChecked={isDefaultAddress}
          id={`${addressId}-defaultAddress`}
          name="defaultAddress"
          type="checkbox"
        />
        <label htmlFor={`${addressId}-defaultAddress`}>
          Set as default address
        </label>
      </div>
      {error && <p className="acct-error">{error}</p>}
      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
```

Notes: input `id`s are now prefixed with the address id (`${addressId}-firstName`) — the skeleton duplicated bare ids across every form on the page, which is invalid HTML. Input `name`s are untouched (the action reads them). The trailing typedef block stays.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add app/routes/account.addresses.jsx
git commit -m "Restyle addresses with card grid and branded forms

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full lint**

Run: `npm run lint`
Expected: exits 0.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: exits 0; codegen and typecheck inside the build pass with no errors mentioning `account`.

- [ ] **Step 3: Manual smoke check (best effort)**

If a dev server can run (`npm run dev`): visit `/account` logged out — it must still redirect to the Shopify hosted login (Customer Account API client handles this in the layout loader). Logged-in visual checks require the public dev domain (`npx shopify hydrogen dev --customer-account-push`); if unavailable, note that in the completion report instead of claiming visual verification.

- [ ] **Step 4: Commit any stragglers**

```bash
git status
```

Expected: clean tree (all account work already committed in Tasks 1–8).
