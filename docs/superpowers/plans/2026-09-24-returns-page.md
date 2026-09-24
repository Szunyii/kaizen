# Visszaküldés (returns) page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/pages/visszakuldes`, a public returns page that explains the policy and lets a logged-in customer request a return through the Customer Account API, and point the footer's "Visszaküldés" link at it.

**Architecture:** One React Router route (`app/routes/pages.visszakuldes.jsx`) with a loader (login check + orders query), an action (form → `orderRequestReturn`) and the page UI; pure helpers and Hungarian maps in `app/lib/returns.js` (unit-tested); two Customer Account API documents under `app/graphql/customer-account/`; a `.rt-*` CSS section appended to `app/styles/kaizen-pages.css`; the footer's returns link becomes a fixed link to the page.

**Tech Stack:** Shopify Hydrogen 2026.4.3 (Customer Account API 2026-04), React Router v7 (import from `react-router`, never `@remix-run/*` or `react-router-dom`), plain CSS with the tokens in `app/styles/kaizen.css`, JSDoc types, Node's built-in test runner (`npm test`).

**Spec:** `docs/superpowers/specs/2026-09-24-returns-page-design.md`

---

## Context for the implementer

- Commands: `npm test` (Node runner over `app/**/*.test.js`), `npm run lint`, `npm run codegen` (GraphQL types + React Router typegen; **run after changing any GraphQL document**), `npm run build`.
- The user's dev server is usually already running on `http://localhost:3001` (`shopify hydrogen dev --codegen --customer-account-push`); it hot-reloads and regenerates types. Port 3000 is another project. If nothing listens on 3001, start `npm run dev:local` in the background and read the port from its output.
- Login does not work on localhost (the OAuth redirect needs the tunnel origin), so `/pages/visszakuldes` renders the logged-out state locally. The logged-in markup is smoke-rendered with `createStaticHandler` + mock data (Task 6).
- Working tree gotcha: `app/components/kaizen/KaizenFooter.jsx`, `app/styles/kaizen-pages.css`, `app/lib/fogyasztobarat.js` and `app/routes/pages.aszf.jsx` carry someone else's uncommitted ÁSZF-embed work. **Never `git add` those files whole.** Tasks 4 and 5 stage only their own hunks with `git apply --cached` (helper in Task 4). Never run `git stash`, `git checkout --` or `git reset` on them.
- Design rules: `DESIGN.md`. Reuse `.wrap`, `.kicker`, `.display`, `.btn`, `.btn-ghost`, `.acct-chip`, `.acct-input`, `.acct-label`, `.acct-error`, `.acct-empty*`; mobile grids use `minmax(0,1fr)`; touch targets ≥ 44px; small red text uses `--red-bright`.
- Commit messages: `feat(returns): …` / `docs(returns): …`, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

### Task 1: Return helpers and Hungarian maps (`app/lib/returns.js`)

**Files:**
- Create: `app/lib/returns.js`
- Test: `app/lib/returns.test.js`

- [ ] **Step 1: Write the failing tests**

`app/lib/returns.test.js`:

```js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  nonReturnableMessage,
  parseReturnForm,
  reasonLabel,
  returnErrorMessage,
  RETURN_ERROR_DEFAULT,
  RETURN_FIELDS,
  RETURN_TEXT,
} from './returns.js';

const ORDER = 'gid://shopify/Order/1001';
const LINE_A = 'gid://shopify/LineItem/11';
const LINE_B = 'gid://shopify/LineItem/12';
const REASON = 'gid://shopify/ReturnReasonDefinition/7';

/** @param {Array<[string, string]>} entries */
function formOf(entries) {
  const form = new FormData();
  for (const [key, value] of entries) form.append(key, value);
  return form;
}

test('parseReturnForm builds the mutation input from the selected rows', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '2'],
      [`${RETURN_FIELDS.REASON_PREFIX}${LINE_A}`, REASON],
      [RETURN_FIELDS.ITEM, LINE_B],
      [RETURN_FIELDS.NOTE, '  Kicsi lett.  '],
    ]),
  );
  assert.equal(result.error, null);
  assert.equal(result.orderId, ORDER);
  assert.deepEqual(result.requestedLineItems, [
    {
      lineItemId: LINE_A,
      quantity: 2,
      returnReasonDefinitionId: REASON,
      customerNote: 'Kicsi lett.',
    },
    {lineItemId: LINE_B, quantity: 1, customerNote: 'Kicsi lett.'},
  ]);
});

test('parseReturnForm rejects a missing or malformed order id', () => {
  assert.equal(
    parseReturnForm(formOf([[RETURN_FIELDS.ITEM, LINE_A]])).error,
    RETURN_TEXT.errNoOrder,
  );
  assert.equal(
    parseReturnForm(
      formOf([
        [RETURN_FIELDS.ORDER_ID, 'gid://shopify/Order/1 OR 1=1'],
        [RETURN_FIELDS.ITEM, LINE_A],
      ]),
    ).error,
    RETURN_TEXT.errNoOrder,
  );
});

test('parseReturnForm needs at least one valid line', () => {
  const empty = parseReturnForm(formOf([[RETURN_FIELDS.ORDER_ID, ORDER]]));
  assert.equal(empty.error, RETURN_TEXT.errNoItems);
  assert.deepEqual(empty.requestedLineItems, []);

  const junk = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, 'gid://shopify/Product/1'],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '0'],
    ]),
  );
  assert.equal(junk.error, RETURN_TEXT.errNoItems);
});

test('parseReturnForm drops bad quantities, unknown reasons and duplicates', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '1.5'],
      [RETURN_FIELDS.ITEM, LINE_B],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_B}`, '3'],
      [`${RETURN_FIELDS.REASON_PREFIX}${LINE_B}`, 'too-small'],
    ]),
  );
  assert.equal(result.error, null);
  assert.deepEqual(result.requestedLineItems, [
    {lineItemId: LINE_B, quantity: 3},
  ]);
});

test('parseReturnForm caps the note at 500 characters', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [RETURN_FIELDS.NOTE, 'x'.repeat(600)],
    ]),
  );
  assert.equal(result.requestedLineItems[0].customerNote.length, 500);
});

test('returnErrorMessage maps known codes and falls back to the generic text', () => {
  assert.match(
    returnErrorMessage({code: 'FEATURE_NOT_ENABLED', message: 'x'}),
    /nem elérhető/,
  );
  assert.equal(
    returnErrorMessage({code: 'TOO_BIG', message: 'x'}),
    RETURN_ERROR_DEFAULT,
  );
  assert.equal(returnErrorMessage(undefined), RETURN_ERROR_DEFAULT);
});

test('nonReturnableMessage picks the most useful reason', () => {
  assert.match(
    nonReturnableMessage({nonReturnableReasons: ['OTHER', 'UNFULFILLED']}),
    /még nem szállítottuk ki/,
  );
  assert.match(
    nonReturnableMessage({nonReturnableReasons: ['RETURN_WINDOW_EXPIRED']}),
    /14 napos/,
  );
  assert.match(nonReturnableMessage(null), /jelenleg nem küldhető vissza/);
});

test('reasonLabel prefers the Hungarian map and falls back to the API name', () => {
  assert.equal(reasonLabel({handle: 'too-small', name: 'Túl kicsi'}), 'Kicsi a méret');
  assert.equal(
    reasonLabel({handle: 'absorbency', name: 'Nedvszívó képesség'}),
    'Nedvszívó képesség',
  );
  assert.equal(reasonLabel(null), '');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: the new file fails with `Cannot find module '.../app/lib/returns.js'`; `fogyasztobarat.test.js` still passes.

- [ ] **Step 3: Write the implementation**

`app/lib/returns.js`:

```js
/**
 * Visszaküldés (returns) helpers for /pages/visszakuldes: Hungarian labels
 * for the Customer Account API return enums and the parser of the
 * return-request form. Pure functions only, so they run under `npm test`.
 */

/** Form field names shared by the page and the parser. */
export const RETURN_FIELDS = {
  ORDER_ID: 'orderId',
  /** Repeated: the LineItem ids of the selected rows. */
  ITEM: 'item',
  /** `qty:<lineItemId>`; missing means one unit. */
  QUANTITY_PREFIX: 'qty:',
  /** `reason:<lineItemId>`; a ReturnReasonDefinition id or empty. */
  REASON_PREFIX: 'reason:',
  /** One note for the whole request, copied onto every line. */
  NOTE: 'note',
};

export const NOTE_MAX_LENGTH = 500;

const ORDER_GID = /^gid:\/\/shopify\/Order\/\d+$/;
const LINE_ITEM_GID = /^gid:\/\/shopify\/LineItem\/\d+$/;
const REASON_GID = /^gid:\/\/shopify\/ReturnReasonDefinition\/\d+$/;

export const RETURN_TEXT = {
  errNoItems: 'Jelölj ki legalább egy terméket.',
  errNoOrder:
    'Nem találjuk a rendelést. Frissítsd az oldalt, és próbáld újra.',
  errNotLoggedIn:
    'Lejárt a bejelentkezésed. Lépj be újra, és próbáld meg még egyszer.',
};

/** Customer Account API `ReturnStatus` → chip label. */
export const RETURN_STATUS_HU = {
  REQUESTED: 'Elbírálás alatt',
  OPEN: 'Jóváhagyva',
  CLOSED: 'Lezárva',
  DECLINED: 'Elutasítva',
  CANCELED: 'Visszavonva',
};

/** `ReturnDeclineReason` → what to tell the customer. */
export const DECLINE_HU = {
  FINAL_SALE: 'a tétel nem küldhető vissza',
  RETURN_PERIOD_ENDED: 'lejárt a visszaküldési időszak',
  OTHER: '',
};

/**
 * `NonReturnableReason` → why an order has nothing to return, most useful
 * first: an unshipped order is a matter of time, an expired window is not.
 */
const NON_RETURNABLE_HU = [
  [
    'UNFULFILLED',
    'Ezt a rendelést még nem szállítottuk ki. A visszaküldést az átvétel után tudod kérni.',
  ],
  [
    'RETURN_WINDOW_EXPIRED',
    'Ennél a rendelésnél lejárt a 14 napos visszaküldési időszak.',
  ],
  [
    'RETURNED',
    'Ebből a rendelésből minden visszaküldhető darabra van már visszaküldés.',
  ],
  ['FINAL_SALE', 'Ennek a rendelésnek a tételei nem küldhetők vissza.'],
];
const NON_RETURNABLE_DEFAULT =
  'Ez a rendelés jelenleg nem küldhető vissza. Ha kérdésed van, írj nekünk a rendelésszámmal.';

/**
 * @param {{nonReturnableReasons?: string[] | null} | null | undefined} summary
 *   `Order.returnInformation.nonReturnableSummary`
 */
export function nonReturnableMessage(summary) {
  const reasons = summary?.nonReturnableReasons ?? [];
  const hit = NON_RETURNABLE_HU.find(([code]) => reasons.includes(code));
  return hit ? hit[1] : NON_RETURNABLE_DEFAULT;
}

/**
 * Labels by `ReturnReasonDefinition.handle`. The API localises `name` for
 * the shop's primary locale (hu), but its wording is generic ("Túl kicsi",
 * "Megondoltam magam"); these read like the rest of the site, and the API
 * name covers every other handle.
 */
const REASON_HU = {
  'too-small': 'Kicsi a méret',
  'too-big': 'Nagy a méret',
  'changed-my-mind': 'Meggondoltam magam',
  'item-not-as-described': 'Nem olyan, mint a leírásban',
  'received-the-wrong-item': 'Nem ezt rendeltem',
  'damaged-or-defective': 'Sérült vagy hibás',
  'arrived-late': 'Későn érkezett',
  style: 'Nem tetszik a fazon',
  color: 'Nem tetszik a szín',
  quality: 'Minőség',
  comfort: 'Kényelem',
  'other-reason': 'Egyéb',
  unknown: 'Egyéb',
};

/**
 * @param {{handle?: string | null, name?: string | null} | null | undefined} definition
 */
export function reasonLabel(definition) {
  if (!definition) return '';
  return REASON_HU[definition.handle ?? ''] ?? definition.name ?? '';
}

/** `ReturnErrorCode` → message; anything else gets the generic one. */
const ERROR_HU = {
  FEATURE_NOT_ENABLED:
    'A visszaküldés kérése jelenleg nem elérhető az oldalon. Írj nekünk a rendelésszámmal, és kézzel intézzük.',
  NOT_FOUND:
    'Nem találjuk a rendelést vagy a kijelölt tételt. Frissítsd az oldalt, és próbáld újra.',
  INVALID_STATE: 'Ez a rendelés jelenleg nem küldhető vissza.',
  ALREADY_EXISTS: 'Erre a tételre már van folyamatban visszaküldés.',
  NOT_AUTHORIZED:
    'Ehhez a rendeléshez nincs hozzáférésed. Lépj be azzal az e-mail címmel, amivel rendeltél.',
};
export const RETURN_ERROR_DEFAULT =
  'Nem sikerült elküldeni a kérést. Próbáld újra, vagy írj nekünk a rendelésszámmal.';

/**
 * @param {{code?: string | null, message?: string} | null | undefined} userError
 *   first entry of `orderRequestReturn.userErrors`
 */
export function returnErrorMessage(userError) {
  return ERROR_HU[userError?.code ?? ''] ?? RETURN_ERROR_DEFAULT;
}

/**
 * Reads the return-request form (field names in RETURN_FIELDS) into the
 * `orderRequestReturn` input. Malformed ids and quantities are dropped
 * rather than sent on; the API validates the rest against the order.
 * @param {FormData} form
 * @returns {{orderId: string, requestedLineItems: RequestedLineItem[], error: string | null}}
 */
export function parseReturnForm(form) {
  const orderId = String(form.get(RETURN_FIELDS.ORDER_ID) ?? '').trim();
  if (!ORDER_GID.test(orderId)) {
    return {orderId: '', requestedLineItems: [], error: RETURN_TEXT.errNoOrder};
  }
  const note = String(form.get(RETURN_FIELDS.NOTE) ?? '')
    .trim()
    .slice(0, NOTE_MAX_LENGTH);

  const seen = new Set();
  /** @type {RequestedLineItem[]} */
  const requestedLineItems = [];
  for (const raw of form.getAll(RETURN_FIELDS.ITEM)) {
    const lineItemId = String(raw).trim();
    if (!LINE_ITEM_GID.test(lineItemId) || seen.has(lineItemId)) continue;
    seen.add(lineItemId);
    const quantity = parseQuantity(
      form.get(RETURN_FIELDS.QUANTITY_PREFIX + lineItemId),
    );
    if (!quantity) continue;
    const reason = String(
      form.get(RETURN_FIELDS.REASON_PREFIX + lineItemId) ?? '',
    ).trim();
    /** @type {RequestedLineItem} */
    const line = {lineItemId, quantity};
    if (REASON_GID.test(reason)) line.returnReasonDefinitionId = reason;
    if (note) line.customerNote = note;
    requestedLineItems.push(line);
  }

  if (!requestedLineItems.length) {
    return {orderId, requestedLineItems, error: RETURN_TEXT.errNoItems};
  }
  return {orderId, requestedLineItems, error: null};
}

/**
 * A missing quantity means one unit (the select is only rendered for lines
 * with more than one returnable unit); anything that is not a small
 * positive integer is rejected.
 * @param {FormDataEntryValue | null} value
 */
function parseQuantity(value) {
  if (value === null || value === undefined || value === '') return 1;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : 0;
}

/**
 * @typedef {{
 *   lineItemId: string,
 *   quantity: number,
 *   returnReasonDefinitionId?: string,
 *   customerNote?: string,
 * }} RequestedLineItem
 */
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all tests in both files pass (`# fail 0`).

- [ ] **Step 5: Lint and commit**

Run: `npm run lint` (baseline: pre-existing errors in unrelated files only; none in `app/lib/returns*.js`).

```bash
git add app/lib/returns.js app/lib/returns.test.js
git commit -m "feat(returns): return-request form parser and Hungarian return labels

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Customer Account API documents

**Files:**
- Create: `app/graphql/customer-account/CustomerReturnsQuery.js`
- Create: `app/graphql/customer-account/OrderRequestReturnMutation.js`
- Regenerated: `customer-accountapi.generated.d.ts`

- [ ] **Step 1: Write the orders-with-returns query**

`app/graphql/customer-account/CustomerReturnsQuery.js`:

```js
// NOTE: https://shopify.dev/docs/api/customer/latest/objects/OrderReturnInformation
// Page sizes are small on purpose: the return window is 14 days, the shop
// sells three products, and the nested connections multiply query cost.
export const CUSTOMER_RETURNS_QUERY = `#graphql
  fragment ReturnsMoney on MoneyV2 {
    amount
    currencyCode
  }
  fragment ReturnsReason on ReturnReasonDefinition {
    id
    handle
    name
  }
  fragment ReturnsLineItem on LineItem {
    id
    name
    variantTitle
    quantity
    price {
      ...ReturnsMoney
    }
    image {
      altText
      url
      width
      height
    }
    suggestedReturnReasonDefinitions(first: 8) {
      nodes {
        ...ReturnsReason
      }
    }
  }
  fragment ReturnsReturn on Return {
    id
    name
    status
    createdAt
    decline {
      reason
      note
    }
    returnLineItems(first: 20) {
      nodes {
        id
        quantity
        lineItem {
          id
          name
          variantTitle
        }
        returnReasonDefinition {
          ...ReturnsReason
        }
      }
    }
  }
  fragment ReturnsOrder on Order {
    id
    name
    number
    processedAt
    fulfillmentStatus
    returnInformation {
      nonReturnableSummary {
        nonReturnableReasons
      }
      returnableLineItems(first: 20) {
        nodes {
          quantity
          lineItem {
            ...ReturnsLineItem
          }
        }
      }
    }
    returns(first: 5, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ReturnsReturn
      }
    }
  }
  query CustomerReturns($language: LanguageCode)
    @inContext(language: $language) {
    customer {
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          ...ReturnsOrder
        }
      }
    }
  }
`;
```

- [ ] **Step 2: Write the return-request mutation**

`app/graphql/customer-account/OrderRequestReturnMutation.js`:

```js
// NOTE: https://shopify.dev/docs/api/customer/latest/mutations/orderRequestReturn
export const ORDER_REQUEST_RETURN_MUTATION = `#graphql
  mutation OrderRequestReturn(
    $orderId: ID!
    $requestedLineItems: [RequestedLineItemInput!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    orderRequestReturn(
      orderId: $orderId
      requestedLineItems: $requestedLineItems
    ) {
      return {
        id
        name
        status
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
```

- [ ] **Step 3: Run codegen and check the generated types**

Run: `npm run codegen`
Expected: no GraphQL validation errors; `customer-accountapi.generated.d.ts` gains `ReturnsOrderFragment`, `CustomerReturnsQuery`, `OrderRequestReturnMutation` (check with `grep -c "ReturnsOrderFragment\|OrderRequestReturnMutation" customer-accountapi.generated.d.ts` → at least 2).

- [ ] **Step 4: Commit**

```bash
git add app/graphql/customer-account/CustomerReturnsQuery.js app/graphql/customer-account/OrderRequestReturnMutation.js customer-accountapi.generated.d.ts
git commit -m "feat(returns): Customer Account API documents for self-serve returns

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The route (`/pages/visszakuldes`)

**Files:**
- Create: `app/routes/pages.visszakuldes.jsx`

- [ ] **Step 1: Write the route**

`app/routes/pages.visszakuldes.jsx`:

```jsx
import {useState} from 'react';
import {
  data as routeData,
  Link,
  useFetcher,
  useLoaderData,
} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {FaqList} from '~/components/kaizen/Faq';
import {I} from '~/components/kaizen/Icons';
import {CUSTOMER_RETURNS_QUERY} from '~/graphql/customer-account/CustomerReturnsQuery';
import {ORDER_REQUEST_RETURN_MUTATION} from '~/graphql/customer-account/OrderRequestReturnMutation';
import {formatDate, STATUS_HU} from '~/lib/accountText';
import {formatMoney} from '~/lib/money';
import {
  DECLINE_HU,
  NOTE_MAX_LENGTH,
  nonReturnableMessage,
  parseReturnForm,
  reasonLabel,
  returnErrorMessage,
  RETURN_FIELDS,
  RETURN_STATUS_HU,
  RETURN_TEXT,
} from '~/lib/returns';
import {useReveal} from '~/lib/useReveal';

const PAGE_PATH = '/pages/visszakuldes';
const CONTACT_EMAIL = 'kaizentype@gmail.com';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Visszaküldés, rendelés #',
)}`;
/** Hydrogen's login keeps `return_to` and sends the customer back here. */
const LOGIN_URL = `/account/login?return_to=${encodeURIComponent(PAGE_PATH)}`;
/** The shop's only published locale; return reasons come back in it. */
const LANGUAGE = 'HU';
/** Per-customer content: never let a shared cache keep it. */
const NO_CACHE = {'Cache-Control': 'no-cache, no-store, must-revalidate'};

const STEPS = [
  [
    'Kérd a visszaküldést',
    'Lépj be a fiókodba, jelöld ki a darabokat, és küldd el a kérést. Az átvételtől számított 14 napon belül teheted meg, indoklás nélkül.',
  ],
  [
    'Csomagold be és add fel',
    'A jóváhagyás után e-mailben küldjük a visszaküldési címet. Viseletlenül, címkével, lehetőleg az eredeti csomagolásban add fel.',
  ],
  [
    'Visszatérítés',
    'A csomag beérkezése után legfeljebb 14 napon belül visszautaljuk az árat ugyanarra a fizetési módra, amivel fizettél.',
  ],
];

/** @type {Array<[string, string]>} */
const RETURN_FAQ = [
  [
    'Meddig küldhetem vissza?',
    'Az átvételtől számított 14 napon belül, indoklás nélkül. A kérést itt, a fiókodból indítod; a jóváhagyásról e-mailben értesítünk.',
  ],
  [
    'Ki fizeti a visszaküldést?',
    'A visszaküldés postaköltsége a vásárlót terheli. Ha hibás vagy nem a rendelt terméket kaptad, természetesen mi álljuk.',
  ],
  [
    'Mikor kapom vissza a pénzt?',
    'A csomag beérkezése után legfeljebb 14 napon belül, ugyanarra a fizetési módra, amivel fizettél.',
  ],
  [
    'Cserélhetek másik méretre?',
    'Igen: küldd vissza a darabot, és add le az új rendelést a jó méretre, így a leggyorsabb. Ha elakadsz, írj nekünk a rendelésszámmal.',
  ],
  [
    'Vendégként rendeltem, nincs fiókom.',
    'Lépj be azzal az e-mail címmel, amivel rendeltél. A fiók az első belépéskor magától létrejön, és ott vannak benne a rendeléseid.',
  ],
];

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Visszaküldés'},
    {
      name: 'description',
      content:
        'Nem jó a méret? 14 napon belül indoklás nélkül visszaküldheted a KaizenType darabjait. Kérd a visszaküldést a fiókodból; a visszatérítés a csomag beérkezése után 14 napon belül érkezik.',
    },
  ];
};

/**
 * Logged-out visitors get the policy and a login CTA. Logged-in customers
 * also get their orders with return eligibility and earlier returns. A
 * failed orders query degrades to a note instead of an error page: the
 * policy text is the reason the footer links here.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return routeData(
      {loggedIn: false, orders: null, loadError: false},
      {headers: NO_CACHE},
    );
  }
  try {
    const {data, errors} = await customerAccount.query(
      CUSTOMER_RETURNS_QUERY,
      {variables: {language: LANGUAGE}},
    );
    if (errors?.length || !data?.customer) {
      throw new Error(errors?.[0]?.message ?? 'Customer not found');
    }
    return routeData(
      {loggedIn: true, orders: data.customer.orders.nodes, loadError: false},
      {headers: NO_CACHE},
    );
  } catch (error) {
    // A Response here is Hydrogen's redirect to the login; let it through.
    if (error instanceof Response) throw error;
    console.error('[visszakuldes] orders query failed', error);
    return routeData(
      {loggedIn: true, orders: null, loadError: true},
      {headers: NO_CACHE},
    );
  }
}

/**
 * Turns one order's form into an `orderRequestReturn` call. Errors come
 * back as data (never as a redirect to the login) so the form that sent
 * them can show the message.
 * @param {Route.ActionArgs} args
 */
export async function action({request, context}) {
  const {customerAccount} = context;
  if (request.method !== 'POST') {
    return routeData({orderId: '', error: 'Method not allowed'}, {status: 405});
  }
  const {orderId, requestedLineItems, error} = parseReturnForm(
    await request.formData(),
  );
  if (error) {
    return routeData({orderId, error}, {status: 400});
  }
  if (!(await customerAccount.isLoggedIn())) {
    return routeData({orderId, error: RETURN_TEXT.errNotLoggedIn}, {status: 401});
  }
  try {
    const {data, errors} = await customerAccount.mutate(
      ORDER_REQUEST_RETURN_MUTATION,
      {variables: {orderId, requestedLineItems, language: LANGUAGE}},
    );
    if (errors?.length) {
      throw new Error(errors[0].message);
    }
    const payload = data?.orderRequestReturn;
    const userError = payload?.userErrors?.[0];
    if (userError) {
      return routeData(
        {orderId, error: returnErrorMessage(userError)},
        {status: 400},
      );
    }
    return {orderId, error: null, returnName: payload?.return?.name ?? null};
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error('[visszakuldes] orderRequestReturn failed', err);
    return routeData({orderId, error: returnErrorMessage(null)}, {status: 400});
  }
}

export default function ReturnsPage() {
  /** @type {LoaderReturnData} */
  const {loggedIn, orders, loadError} = useLoaderData();
  const ref = useReveal();
  const faqRef = useReveal();

  return (
    <div className="view-enter">
      <section className="rt" ref={ref}>
        <div className="wrap">
          <p className="kicker reveal">
            <span className="kanji">返品</span>— Visszaküldés
          </p>
          <h1 className="rt-h display reveal reveal-d1">
            Nem jött be?
            <br />
            <em className="rt-em">14 napon belül visszaküldheted.</em>
          </h1>
          <p className="rt-lead reveal reveal-d2">
            Indoklás nélkül, viseletlen, címkés állapotban. A visszatérítést a
            csomag beérkezése után legfeljebb 14 napon belül utaljuk vissza az
            eredeti fizetési módra.
          </p>

          <section
            className="rt-sec reveal reveal-d3"
            aria-labelledby="rt-steps-h"
          >
            <h2 id="rt-steps-h" className="rt-sec-h display">
              Így működik
            </h2>
            <ol className="rt-steps">
              {STEPS.map(([heading, text], i) => (
                <li className="rt-step" key={heading}>
                  <span className="rt-step-n display" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="rt-step-h">{heading}</h3>
                  <p className="rt-step-p">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rt-sec" id="inditas" aria-labelledby="rt-start-h">
            <h2 id="rt-start-h" className="rt-sec-h display">
              Visszaküldés indítása
            </h2>
            {!loggedIn ? (
              <LoginPanel />
            ) : loadError ? (
              <ErrorPanel />
            ) : (
              <OrderList orders={orders ?? []} />
            )}
          </section>
        </div>
      </section>

      <section className="faq rt-faq" ref={faqRef}>
        <div className="faq-wrap faq-grid">
          <div className="faq-head">
            <p className="kicker reveal">
              <span className="kanji">問</span>— Kérdések
            </p>
            <h2 className="sec-h sec-h-sm display reveal reveal-d1">
              Amit még
              <br />
              <em className="faq-em">tudni érdemes.</em>
            </h2>
            <p className="faq-lead reveal reveal-d2">
              Határidő, költség, visszatérítés és csere. Ha itt nincs meg a
              válasz, írj nekünk a rendelésszámmal.
            </p>
            <Link className="faq-contact reveal reveal-d3" to="/pages/contact">
              Kapcsolat {I.arrow}
            </Link>
          </div>
          <FaqList items={RETURN_FAQ} idPrefix="rt-faq" />
        </div>
      </section>
    </div>
  );
}

function LoginPanel() {
  return (
    <div className="rt-panel">
      <p className="rt-panel-p">
        A visszaküldést a fiókodból kéred: ott látod a rendeléseidet, és
        kijelölöd, mit küldesz vissza. Nincs jelszó, az e-mail-címedre küldött
        kóddal lépsz be.
      </p>
      <div className="rt-panel-cta">
        <Link className="btn" to={LOGIN_URL} prefetch="none">
          Bejelentkezés {I.arrow}
        </Link>
      </div>
      <p className="rt-panel-note">
        Vendégként rendeltél? Ugyanazzal az e-mail címmel lépj be, amivel a
        rendelést leadtad. Ha nem megy, írj nekünk:{' '}
        <a href={MAILTO}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}

function ErrorPanel() {
  return (
    <div className="rt-panel">
      <p className="rt-panel-p">
        Nem sikerült betölteni a rendeléseidet. Próbáld újra egy perc múlva,
        vagy írj nekünk a rendelésszámmal.
      </p>
      <div className="rt-panel-cta">
        <Link className="btn btn-ghost" to={PAGE_PATH} reloadDocument>
          Újra {I.refresh}
        </Link>
        <a className="btn btn-ghost" href={MAILTO}>
          Írok nektek {I.arrow}
        </a>
      </div>
    </div>
  );
}

/**
 * @param {{orders: ReturnsOrderFragment[]}} props
 */
function OrderList({orders}) {
  if (!orders.length) {
    return (
      <div className="acct-empty">
        <span className="acct-empty-kanji" aria-hidden="true">
          無
        </span>
        <p>Ehhez a fiókhoz még nem tartozik rendelés.</p>
        <Link className="btn" to="/#termekek">
          Irány a termékek
        </Link>
      </div>
    );
  }
  return (
    <div className="rt-orders">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

/**
 * One order: header, its earlier returns, then the request form (or the
 * reason there is nothing to return). The fetcher lives here, not in the
 * form, so the success note survives the form disappearing after the
 * loader revalidates.
 * @param {{order: ReturnsOrderFragment}} props
 */
function OrderCard({order}) {
  /** @type {ReturnFetcher} */
  const fetcher = useFetcher();
  const returnable = order.returnInformation?.returnableLineItems?.nodes ?? [];
  const returns = order.returns?.nodes ?? [];
  const result = fetcher.data;
  const submitted = Boolean(result && !result.error);
  const headingId = `rt-o-${order.number}`;

  return (
    <article className="rt-order" aria-labelledby={headingId}>
      <header className="rt-order-head">
        <div>
          <h3 id={headingId} className="rt-order-num">
            Rendelés {order.name}
          </h3>
          <p className="rt-order-meta">
            <span>{formatDate(order.processedAt)}</span>
            {order.fulfillmentStatus ? (
              <span className="acct-chip">
                {STATUS_HU[order.fulfillmentStatus] ?? order.fulfillmentStatus}
              </span>
            ) : null}
          </p>
        </div>
        <Link className="acct-link" to={`/account/orders/${btoa(order.id)}`}>
          Részletek →
        </Link>
      </header>

      {returns.length ? <ReturnHistory returns={returns} /> : null}

      {submitted ? (
        <p className="rt-msg rt-msg-ok" role="status">
          Megkaptuk a kérésedet
          {result?.returnName ? ` (${result.returnName})` : ''}. E-mailben
          jelezzük, ha jóváhagytuk, és küldjük a feladáshoz szükséges
          lépéseket.
        </p>
      ) : null}

      {returnable.length ? (
        <ReturnForm
          key={returnable.map((r) => `${r.lineItem.id}:${r.quantity}`).join('|')}
          order={order}
          items={returnable}
          fetcher={fetcher}
        />
      ) : submitted ? null : (
        <p className="rt-order-note">
          {nonReturnableMessage(order.returnInformation?.nonReturnableSummary)}
        </p>
      )}
    </article>
  );
}

/**
 * @param {{returns: ReturnsOrderFragment['returns']['nodes']}} props
 */
function ReturnHistory({returns}) {
  return (
    <ul className="rt-returns" aria-label="Korábbi visszaküldések">
      {returns.map((ret) => {
        const note = ret.status === 'DECLINED' ? declineText(ret.decline) : '';
        return (
          <li className="rt-return" key={ret.id}>
            <div className="rt-return-head">
              <span>Visszaküldés {ret.name}</span>
              <span
                className={`acct-chip${ret.status === 'DECLINED' ? ' red' : ''}`}
              >
                {RETURN_STATUS_HU[ret.status] ?? ret.status}
              </span>
              <span className="rt-return-date">{formatDate(ret.createdAt)}</span>
            </div>
            <ul className="rt-return-items">
              {ret.returnLineItems.nodes.map((line) => {
                const reason = reasonLabel(line.returnReasonDefinition);
                return (
                  <li key={line.id}>
                    {line.lineItem.name}
                    {line.lineItem.variantTitle
                      ? ` (${line.lineItem.variantTitle})`
                      : ''}{' '}
                    × {line.quantity}
                    {reason ? ` · ${reason}` : ''}
                  </li>
                );
              })}
            </ul>
            {note ? <p className="rt-return-note">{note}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * @param {{reason: string, note?: string | null} | null | undefined} decline
 */
function declineText(decline) {
  if (!decline) return '';
  const why = DECLINE_HU[decline.reason] ?? '';
  const note = decline.note?.trim() ?? '';
  if (!why && !note) return '';
  return `Indok: ${[why, note].filter(Boolean).join('. ')}`;
}

/**
 * Checkbox per returnable line; quantity and reason appear for the checked
 * rows. One note for the whole request. Field names are the parser's
 * (RETURN_FIELDS in app/lib/returns.js).
 * @param {{
 *   order: ReturnsOrderFragment,
 *   items: ReturnsOrderFragment['returnInformation']['returnableLineItems']['nodes'],
 *   fetcher: ReturnFetcher,
 * }} props
 */
function ReturnForm({order, items, fetcher}) {
  const [selected, setSelected] = useState(() => new Set());
  const busy = fetcher.state !== 'idle';
  const error = fetcher.data?.error;

  /** @param {string} id @param {boolean} on */
  const toggle = (id, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <fetcher.Form
      method="post"
      className="rt-form"
      aria-label={`Visszaküldés kérése, rendelés ${order.name}`}
    >
      <input type="hidden" name={RETURN_FIELDS.ORDER_ID} value={order.id} />
      <ul className="rt-items">
        {items.map(({quantity, lineItem}) => {
          const checked = selected.has(lineItem.id);
          const reasons = lineItem.suggestedReturnReasonDefinitions?.nodes ?? [];
          const inputId = `rt-i-${order.number}-${gidTail(lineItem.id)}`;
          return (
            <li className={`rt-item${checked ? ' is-on' : ''}`} key={lineItem.id}>
              <label className="rt-item-pick" htmlFor={inputId}>
                <input
                  id={inputId}
                  type="checkbox"
                  name={RETURN_FIELDS.ITEM}
                  value={lineItem.id}
                  checked={checked}
                  onChange={(event) => toggle(lineItem.id, event.target.checked)}
                  disabled={busy}
                />
                {lineItem.image ? (
                  <Image data={lineItem.image} width={64} height={64} />
                ) : (
                  <span className="rt-item-ph" aria-hidden="true" />
                )}
                <span className="rt-item-text">
                  <span className="rt-item-name">{lineItem.name}</span>
                  {lineItem.variantTitle ? (
                    <span className="rt-item-var">{lineItem.variantTitle}</span>
                  ) : null}
                  <span className="rt-item-price">
                    {formatMoney(lineItem.price)}
                    {quantity > 1 ? ` · ${quantity} db visszaküldhető` : ''}
                  </span>
                </span>
              </label>
              {checked ? (
                <div className="rt-item-ctl">
                  {quantity > 1 ? (
                    <label className="rt-field">
                      <span className="acct-label">Mennyiség</span>
                      <select
                        className="acct-input"
                        name={`${RETURN_FIELDS.QUANTITY_PREFIX}${lineItem.id}`}
                        defaultValue="1"
                        disabled={busy}
                      >
                        {Array.from({length: quantity}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {reasons.length ? (
                    <label className="rt-field">
                      <span className="acct-label">Ok (nem kötelező)</span>
                      <select
                        className="acct-input"
                        name={`${RETURN_FIELDS.REASON_PREFIX}${lineItem.id}`}
                        defaultValue=""
                        disabled={busy}
                      >
                        <option value="">Válassz okot</option>
                        {reasons.map((reason) => (
                          <option key={reason.id} value={reason.id}>
                            {reasonLabel(reason)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <label className="rt-field rt-note">
        <span className="acct-label">Megjegyzés (nem kötelező)</span>
        <textarea
          className="acct-input"
          name={RETURN_FIELDS.NOTE}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Ha van, amit tudnunk érdemes."
          disabled={busy}
        />
      </label>

      {error ? (
        <p className="acct-error rt-msg" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rt-actions">
        <button
          className="btn"
          type="submit"
          disabled={busy || selected.size === 0}
        >
          {busy ? 'Küldés…' : 'Visszaküldés kérése'}
          {busy ? null : I.arrow}
        </button>
        <span className="rt-actions-note">
          {selected.size
            ? `${selected.size} tétel kijelölve`
            : 'Jelöld ki, mit küldesz vissza.'}
        </span>
      </div>
    </fetcher.Form>
  );
}

/** The numeric tail of a Shopify GID, for DOM ids. */
function gidTail(id) {
  return String(id).split('/').pop();
}

/** @typedef {import('./+types/pages.visszakuldes').Route} Route */
/** @typedef {import('customer-accountapi.generated').ReturnsOrderFragment} ReturnsOrderFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useFetcher<typeof action>>} ReturnFetcher */
```

- [ ] **Step 2: Lint**

Run: `npx eslint app/routes/pages.visszakuldes.jsx`
Expected: no errors (warnings about JSDoc are acceptable only if the same kind exists in `app/routes/pages.contact.jsx`).

- [ ] **Step 3: Check the logged-out render in the dev server**

Run: `curl -s -o /tmp/claude-501/rt.html -w "%{http_code}\n" http://localhost:3001/pages/visszakuldes && grep -o 'KaizenType — Visszaküldés\|rt-panel\|return_to=%2Fpages%2Fvisszakuldes\|rt-steps\|rt-faq' /tmp/claude-501/rt.html | sort | uniq -c`
Expected: `200`; every marker appears at least once (styles come in Task 4, so the page is unstyled for now).

- [ ] **Step 4: Commit**

```bash
git add app/routes/pages.visszakuldes.jsx
git commit -m "feat(returns): /pages/visszakuldes with self-serve return requests

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Styles (`.rt-*` section)

**Files:**
- Modify: `app/styles/kaizen-pages.css` (append at the very end; the file also carries an uncommitted `.doc-embed` hunk that must not be staged)
- Create (scratch, not committed): `<scratchpad>/stage-hunks.mjs`

- [ ] **Step 1: Write the hunk-staging helper**

`<scratchpad>/stage-hunks.mjs` — stages the hunks of one file's diff except those matching a pattern:

```js
// usage: node stage-hunks.mjs <file> <exclude-regex>
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const [file, exclude] = process.argv.slice(2);
const diff = execFileSync('git', ['diff', '--', file], {encoding: 'utf8'});
const headerEnd = diff.indexOf('\n@@');
const header = diff.slice(0, headerEnd + 1);
const hunks = diff.slice(headerEnd + 1).split(/(?=^@@ )/m);
const keep = hunks.filter((h) => !new RegExp(exclude).test(h));
if (!keep.length) throw new Error('no hunks left to stage');
const out = `${process.env.TMPDIR ?? '/tmp'}/stage-${Date.now()}.patch`;
writeFileSync(out, header + keep.join(''));
execFileSync('git', ['apply', '--cached', out], {stdio: 'inherit'});
console.log(`staged ${keep.length}/${hunks.length} hunks of ${file}`);
```

- [ ] **Step 2: Append the RETURNS section to `app/styles/kaizen-pages.css`**

```css

/* =================== VISSZAKÜLDÉS (returns page) =================== */
.rt{ padding-block:clamp(40px,5vw,68px) clamp(60px,8vw,100px); }
.rt-h{ font-size:clamp(34px,6vw,84px); line-height:1.04; margin-top:26px; letter-spacing:-.02em; color:var(--bone); }
.rt-em{ font-style:italic; font-weight:500; color:var(--red); }
.rt-lead{ margin-top:26px; max-width:60ch; font:400 18px/1.7 var(--sans); color:var(--bone-dim); text-wrap:pretty; }
.rt-sec{ margin-top:clamp(48px,6vw,80px); }
.rt-sec-h{ font-size:clamp(28px,3.4vw,44px); color:var(--bone); margin-bottom:clamp(20px,2.5vw,30px); }

/* three steps as a hairline list, like the dictionary block */
.rt-steps{ list-style:none; margin:0; padding:0; display:grid;
  grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:0 clamp(24px,4vw,56px);
  border-top:1px solid var(--line); }
.rt-step{ padding:clamp(22px,3vw,30px) 0; border-bottom:1px solid var(--line); }
.rt-step-n{ display:block; font-size:14px; letter-spacing:.08em; color:var(--red); }
.rt-step-h{ margin-top:14px; font:600 17px/1.3 var(--sans); color:var(--bone); }
.rt-step-p{ margin-top:10px; font:400 15px/1.65 var(--sans); color:var(--bone-mut); text-wrap:pretty; }

/* login / error panel: the contact page's highlighted panel */
.rt-panel{ max-width:720px; padding:clamp(28px,3.5vw,44px); border:1px solid rgba(218,41,28,.3); border-radius:4px;
  background:linear-gradient(180deg,#1a0b07,var(--ink-850)); }
.rt-panel-p{ font:400 17px/1.65 var(--sans); color:var(--bone-dim); text-wrap:pretty; }
.rt-panel-cta{ display:flex; flex-wrap:wrap; gap:14px; margin-top:28px; }
.rt-panel-note{ margin-top:22px; font:400 14px/1.6 var(--sans); color:var(--bone-faint); }
.rt-panel-note a{ color:var(--bone-dim); border-bottom:1px solid var(--line); }
.rt-panel-note a:hover{ color:var(--bone); border-color:var(--red); }

/* orders with their returns and the request form */
.rt-orders{ display:flex; flex-direction:column; gap:18px; max-width:880px; }
.rt-order{ padding:clamp(22px,3vw,30px); background:var(--ink-800); border:1px solid var(--line); border-radius:4px; }
.rt-order-head{ display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:12px 24px; }
.rt-order-num{ font-family:var(--serif); font-weight:500; font-size:24px; line-height:1.2; color:var(--bone); }
.rt-order-meta{ display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; margin-top:8px;
  font:400 13px/1.4 var(--sans); color:var(--bone-dim); }
.rt-order-head .acct-link{ min-height:44px; }
.rt-order-note{ margin-top:20px; font:400 15px/1.6 var(--sans); color:var(--bone-mut); }

.rt-returns{ list-style:none; margin:20px 0 0; padding:0; display:flex; flex-direction:column; gap:12px; }
.rt-return{ padding:16px 18px; background:var(--ink-850); border:1px solid var(--line-2); border-radius:2px; }
.rt-return-head{ display:flex; flex-wrap:wrap; align-items:center; gap:8px 14px; font:600 14px/1.4 var(--sans); color:var(--bone); }
.rt-return-date{ font-weight:400; color:var(--bone-faint); }
.rt-return-items{ list-style:none; margin:8px 0 0; padding:0; font:400 14px/1.6 var(--sans); color:var(--bone-dim); }
.rt-return-note{ margin-top:8px; font:400 14px/1.6 var(--sans); color:var(--red-bright); }

.rt-form{ margin-top:22px; padding-top:22px; border-top:1px solid var(--line); }
.rt-items{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
.rt-item{ position:relative; border-bottom:1px solid var(--line-2); }
/* a checked row gets the FAQ's red left edge, drawn in the card padding */
.rt-item::before{ content:''; position:absolute; left:-14px; top:0; bottom:0; width:2px; background:var(--red);
  transform:scaleY(0); transform-origin:top; transition:transform .3s var(--ease-out); }
.rt-item.is-on::before{ transform:scaleY(1); }
.rt-item-pick{ display:grid; grid-template-columns:auto 64px minmax(0,1fr); gap:16px; align-items:center;
  min-height:44px; padding:14px 0; cursor:pointer; }
.rt-item-pick input{ width:20px; height:20px; margin:0; accent-color:var(--red); cursor:pointer; }
.rt-item-pick img, .rt-item-ph{ display:block; width:64px; height:64px; border-radius:2px; object-fit:cover;
  background:var(--ink-750); border:1px solid var(--line-2); }
.rt-item-text{ display:flex; flex-direction:column; gap:3px; min-width:0; }
.rt-item-name{ font:600 15px/1.35 var(--sans); color:var(--bone); overflow-wrap:anywhere; }
.rt-item-var{ font:400 13px/1.4 var(--sans); color:var(--bone-mut); }
.rt-item-price{ font:400 13px/1.4 var(--sans); color:var(--bone-dim); }
/* quantity + reason under the text column (checkbox 20 + gap 16 + image 64 + gap 16) */
.rt-item-ctl{ display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr)); gap:14px;
  padding:0 0 18px 116px; }
.rt-field{ display:flex; flex-direction:column; gap:8px; min-width:0; }
.rt-field .acct-input{ width:100%; }
select.acct-input{ appearance:none; -webkit-appearance:none; padding-right:36px; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,var(--bone-mut) 50%),
    linear-gradient(135deg,var(--bone-mut) 50%,transparent 50%);
  background-position:calc(100% - 19px) 50%, calc(100% - 14px) 50%;
  background-size:5px 5px,5px 5px; background-repeat:no-repeat; }
.rt-note{ margin-top:18px; max-width:560px; }
.rt-note textarea{ resize:vertical; min-height:88px; font-family:inherit; }
.rt-msg{ margin-top:16px; }
.rt-msg-ok{ margin-top:20px; padding:12px 16px; border:1px solid rgba(218,41,28,.4); border-radius:2px;
  background:var(--red-wash); font:400 14px/1.55 var(--sans); color:var(--bone); }
.rt-actions{ display:flex; flex-wrap:wrap; align-items:center; gap:12px 20px; margin-top:20px; }
.rt-actions-note{ font:400 14px/1.4 var(--sans); color:var(--bone-faint); }

/* FAQ block reused from the homepage; align it to this page's wider .wrap */
.rt-faq{ border-top:1px solid var(--line-2); }
.rt-faq .faq-wrap{ width:min(var(--page-max),100vw - 2*var(--page-pad)); }

@media (max-width:640px){
  .rt-h br{ display:none; }
  .rt-h{ text-wrap:balance; }
  .rt-item-pick{ grid-template-columns:auto 56px minmax(0,1fr); gap:12px; }
  .rt-item-pick img, .rt-item-ph{ width:56px; height:56px; }
  .rt-item-ctl{ padding-left:0; }
  .rt-panel-cta .btn, .rt-actions .btn{ width:100%; justify-content:center; }
}
@media (prefers-reduced-motion:reduce){
  .rt-item::before{ transition:none; }
}
```

- [ ] **Step 3: Check the page in the dev server, desktop and phone**

Run the CDP screenshot recipe (headless Chrome) or at least:
`curl -s http://localhost:3001/pages/visszakuldes | grep -c 'class="rt'` → greater than 5, and open `http://localhost:3001/pages/visszakuldes` in a browser at 1440px and 375px: the H1 breaks after "Nem jött be?", the three steps sit in one row on desktop and stack on the phone, the red-bordered login panel is 720px wide at most, and nothing scrolls horizontally at 320px.

- [ ] **Step 4: Stage only this task's hunk and commit**

```bash
node <scratchpad>/stage-hunks.mjs app/styles/kaizen-pages.css 'doc-embed'
git diff --cached --stat     # only kaizen-pages.css, only the RETURNS section
git commit -m "feat(returns): styles for the returns page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Footer link, footer query, docs

**Files:**
- Modify: `app/components/kaizen/KaizenFooter.jsx` (constants + `helpLinks`; the file also carries an uncommitted "Kapcsolat" hunk that must not be staged)
- Modify: `app/lib/fragments.js` (`FOOTER_QUERY`: drop `refundPolicy`)
- Regenerated: `storefrontapi.generated.d.ts`
- Modify: `DESIGN.md`, `TODOS.md`

- [ ] **Step 1: Point "Visszaküldés" at the page**

In `app/components/kaizen/KaizenFooter.jsx` replace the block from `// Used only if the Storefront API returns no policies for the shop.` through the end of `helpLinks` with:

```js
// Returns are handled on our own page (app/routes/pages.visszakuldes.jsx),
// not by the Shopify refund policy, which is empty.
const RETURNS_LINK = ['Visszaküldés', '/pages/visszakuldes'];

// Used only if the Storefront API returns no policies for the shop.
const FALLBACK_HELP = [
  ['Szállítás', '/policies/shipping-policy'],
  RETURNS_LINK,
  ['Adatkezelés', '/policies/privacy-policy'],
  ASZF_LINK,
];

/**
 * Maps the shop's configured policies onto footer links. Titles are
 * localised here so the footer reads Hungarian even when the policy titles
 * in Shopify are still English. Returns and the ÁSZF are our own pages and
 * are always listed.
 * @param {FooterQuery['shop'] | undefined} shop
 */
function helpLinks(shop) {
  if (!shop) return FALLBACK_HELP;
  const policy = (label, p) => (p?.handle ? [[label, `/policies/${p.handle}`]] : []);
  const shipping = policy('Szállítás', shop.shippingPolicy);
  const privacy = policy('Adatkezelés', shop.privacyPolicy);
  if (!shipping.length && !privacy.length) return FALLBACK_HELP;
  return [...shipping, RETURNS_LINK, ...privacy, ASZF_LINK];
}
```

- [ ] **Step 2: Drop `refundPolicy` from `FOOTER_QUERY` in `app/lib/fragments.js`**

Remove the `refundPolicy { handle }` selection (three lines) inside the `shop { … }` block of `FOOTER_QUERY`; leave `privacyPolicy` and `shippingPolicy`. Then run `npm run codegen` (regenerates `storefrontapi.generated.d.ts`).

- [ ] **Step 3: Update the design docs**

`DESIGN.md`, components table, the row starting with `` `.cart-*`, `.sd-*`, `.acct-*` ``: add `` `.rt-*` `` to the list of page prefixes.

`TODOS.md`, section "M1 Üres jogi oldalak": append one line: `- **Update 2026-09-24:** a footer "Visszaküldés" linkje már a saját `/pages/visszakuldes` oldalra mutat (Customer Account API önkiszolgáló visszaküldés), a refund policy nincs linkelve; M1 az Adatkezelés + Szállítás oldalakra szűkül.`

- [ ] **Step 4: Verify the footer**

Run: `curl -s http://localhost:3001/ | grep -o 'href="/pages/visszakuldes"\|href="/policies/refund-policy"' | sort | uniq -c`
Expected: `/pages/visszakuldes` present, `/policies/refund-policy` absent.

- [ ] **Step 5: Stage only this task's hunks and commit**

```bash
node <scratchpad>/stage-hunks.mjs app/components/kaizen/KaizenFooter.jsx 'Kapcsolat'
git add app/lib/fragments.js storefrontapi.generated.d.ts DESIGN.md TODOS.md
git diff --cached --stat
git commit -m "feat(returns): footer Visszaküldés link points at the returns page

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Verification

**Files:**
- Create (scratch, not committed): `<scratchpad>/render-returns.jsx`, `<scratchpad>/hydrogen-stub.jsx`

- [ ] **Step 1: Full checks**

Run: `npm test && npm run lint && npm run build`
Expected: tests pass; lint shows only the pre-existing errors in unrelated files (compare with `git stash`-free baseline: run lint on `main` before Task 1 and keep the count); build succeeds.

- [ ] **Step 2: Smoke-render the logged-in states with mock data**

`<scratchpad>/hydrogen-stub.jsx` (replaces `@shopify/hydrogen` in the bundle):

```jsx
export function Image({data, width, height}) {
  return <img src={data?.url} alt={data?.altText ?? ''} width={width} height={height} />;
}
```

`<scratchpad>/render-returns.jsx`:

```jsx
import {renderToString} from 'react-dom/server';
import {createStaticHandler, createStaticRouter, StaticRouterProvider} from 'react-router';
import ReturnsPage, {action} from '../app/routes/pages.visszakuldes.jsx';

const reason = (n, handle, name) => ({id: `gid://shopify/ReturnReasonDefinition/${n}`, handle, name});
const line = (n, name, variantTitle, qty) => ({
  id: `gid://shopify/LineItem/${n}`, name, variantTitle, quantity: qty,
  price: {amount: '9900.0', currencyCode: 'HUF'},
  image: {altText: name, url: 'https://cdn.shopify.com/x.jpg', width: 800, height: 1000},
  suggestedReturnReasonDefinitions: {nodes: [reason(7, 'too-small', 'Túl kicsi'), reason(2, 'changed-my-mind', 'Megondoltam magam')]},
});
const orders = [
  {id: 'gid://shopify/Order/1', name: '#1001', number: 1001, processedAt: '2026-09-20T10:00:00Z', fulfillmentStatus: 'FULFILLED',
    returnInformation: {nonReturnableSummary: null, returnableLineItems: {nodes: [{quantity: 2, lineItem: line(11, 'Kaizen Oversized Tee', 'M / Fekete', 2)}, {quantity: 1, lineItem: line(12, 'Kaizen Snapback Sapka', null, 1)}]}},
    returns: {nodes: [{id: 'gid://shopify/Return/1', name: '#1001-R1', status: 'DECLINED', createdAt: '2026-09-21T10:00:00Z', decline: {reason: 'OTHER', note: 'Használt darab.'},
      returnLineItems: {nodes: [{id: 'gid://shopify/ReturnLineItem/1', quantity: 1, lineItem: {id: 'gid://shopify/LineItem/13', name: 'Kaizen Top', variantTitle: 'S'}, returnReasonDefinition: reason(7, 'too-small', 'Túl kicsi')}]}}]}},
  {id: 'gid://shopify/Order/2', name: '#1002', number: 1002, processedAt: '2026-09-23T10:00:00Z', fulfillmentStatus: 'UNFULFILLED',
    returnInformation: {nonReturnableSummary: {nonReturnableReasons: ['UNFULFILLED']}, returnableLineItems: {nodes: []}}, returns: {nodes: []}},
];

async function render(loaderData) {
  const routes = [{path: '/pages/visszakuldes', Component: ReturnsPage, loader: () => loaderData, action: () => null}];
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request('http://x/pages/visszakuldes'));
  const router = createStaticRouter(handler.dataRoutes, context);
  return renderToString(<StaticRouterProvider router={router} context={context} />);
}

const expect = (html, markers, label) => {
  const missing = markers.filter((m) => !html.includes(m));
  if (missing.length) throw new Error(`${label}: missing ${JSON.stringify(missing)}`);
  console.log(`ok ${label}`);
};

expect(await render({loggedIn: false, orders: null, loadError: false}), ['rt-panel', 'return_to=%2Fpages%2Fvisszakuldes'], 'logged out');
expect(await render({loggedIn: true, orders: null, loadError: true}), ['Nem sikerült betölteni'], 'load error');
expect(await render({loggedIn: true, orders: [], loadError: false}), ['acct-empty'], 'no orders');
expect(await render({loggedIn: true, orders, loadError: false}), [
  'Rendelés #1001', 'name="item"', 'value="gid://shopify/LineItem/11"', '2 db visszaküldhető', '9&nbsp;900&nbsp;Ft',
  'Visszaküldés #1001-R1', 'Elutasítva', 'Használt darab.', 'Kicsi a méret',
  'Rendelés #1002', 'még nem szállítottuk ki', 'Kiszállítva', 'Feldolgozás alatt',
], 'orders');

// The action: parsed input reaches the mutation; user errors map to Hungarian.
const calls = [];
const context = {customerAccount: {
  isLoggedIn: async () => true,
  mutate: async (doc, {variables}) => { calls.push(variables); return {data: {orderRequestReturn: {return: {id: 'gid://shopify/Return/9', name: '#1001-R2', status: 'REQUESTED'}, userErrors: []}}}; },
}};
const body = new URLSearchParams([['orderId', 'gid://shopify/Order/1'], ['item', 'gid://shopify/LineItem/11'], ['qty:gid://shopify/LineItem/11', '2'], ['reason:gid://shopify/LineItem/11', 'gid://shopify/ReturnReasonDefinition/7'], ['note', 'Kicsi.']]);
const req = () => new Request('http://x/pages/visszakuldes', {method: 'POST', body, headers: {'content-type': 'application/x-www-form-urlencoded'}});
const ok = await action({request: req(), context});
if (ok.returnName !== '#1001-R2' || calls[0].requestedLineItems[0].quantity !== 2 || calls[0].language !== 'HU') throw new Error('action success path wrong: ' + JSON.stringify({ok, calls}));
context.customerAccount.mutate = async () => ({data: {orderRequestReturn: {return: null, userErrors: [{code: 'FEATURE_NOT_ENABLED', message: 'x', field: null}]}}});
const failed = await action({request: req(), context});
const failedData = failed.data ?? failed;
if (failed.init?.status !== 400 || !/nem elérhető/.test(failedData.error)) throw new Error('action error path wrong: ' + JSON.stringify(failed));
console.log('ok action');
```

Run:
```bash
node_modules/.bin/esbuild <scratchpad>/render-returns.jsx --bundle --platform=node --format=esm --jsx=automatic \
  --alias:~=./app --alias:@shopify/hydrogen=<scratchpad>/hydrogen-stub.jsx \
  --external:react --external:react-dom --external:react-router --outfile=<scratchpad>/render-returns.mjs \
  && node <scratchpad>/render-returns.mjs
```
Expected: five `ok …` lines. (React Router's `data()` returns an object with `data`/`init`; the check reads both shapes.)

- [ ] **Step 3: Record what could not be verified**

Live logged-in behaviour (real order, real `orderRequestReturn`) needs the tunnel or the deployed site and a fulfilled order; say so in the hand-off together with the admin setting to enable (Settings → Customer accounts → Self-serve returns).
