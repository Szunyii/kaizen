import {data} from 'react-router';
import {adminQuery, hasAdminAccess} from '~/lib/admin';

/**
 * Back-in-stock request resource route (`POST /restock`).
 *
 * Records an email address against a sold-out variant so the shop can notify
 * the customer when it is available again. Uses the Admin API (custom app,
 * `write_customers` scope): the customer is found or created and tagged
 * `restock:<variant id>`, with the product noted on the record, so the list
 * for a restocked variant is one customer-tag filter in admin.
 *
 * Without `PRIVATE_ADMIN_API_TOKEN` there is no way to attach the request to
 * a customer, so the route answers honestly instead of pretending.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GID_RE = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/;

const SUCCESS_MESSAGE = 'Rendben, szólunk, amint újra kapható.';
const UNAVAILABLE_MESSAGE =
  'Az értesítés most nem elérhető. Írj nekünk, és jelezzük, ha újra lesz.';

/** @param {Route.ActionArgs} args */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({ok: false, message: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();
  const variantId = String(form.get('variantId') ?? '');
  const productTitle = String(form.get('product') ?? '').slice(0, 120);

  // Honeypot: bots fill every field, humans never see this one.
  if (form.get('website')) return data({ok: true, message: SUCCESS_MESSAGE});

  if (!EMAIL_RE.test(email)) {
    return data(
      {ok: false, message: 'Adj meg egy érvényes e-mail címet.'},
      {status: 400},
    );
  }
  const variantMatch = GID_RE.exec(variantId);
  if (!variantMatch) {
    return data({ok: false, message: 'Hiányzó termékváltozat.'}, {status: 400});
  }

  if (!hasAdminAccess(context.env)) {
    return data({ok: false, message: UNAVAILABLE_MESSAGE}, {status: 503});
  }

  try {
    const result = await recordViaAdmin(
      email,
      variantMatch[1],
      productTitle,
      context.env,
    );
    return data(result, {status: result.ok ? 200 : 400});
  } catch (error) {
    console.error('[restock] request failed', error);
    return data(
      {ok: false, message: 'Most nem sikerült elmenteni. Próbáld újra később.'},
      {status: 500},
    );
  }
}

/** Non-POST requests to the resource route have nothing to show. */
export function loader() {
  return new Response(null, {status: 404});
}

/**
 * @param {string} email
 * @param {string} variantNumericId
 * @param {string} productTitle
 * @param {Env} env
 * @returns {Promise<RestockResult>}
 */
async function recordViaAdmin(email, variantNumericId, productTitle, env) {
  const tag = `restock:${variantNumericId}`;
  const note = productTitle
    ? `Értesítést kért: ${productTitle} (variant ${variantNumericId})`
    : `Értesítést kért: variant ${variantNumericId}`;

  const found = await adminQuery(env, ADMIN_FIND_CUSTOMER, {
    query: `email:${JSON.stringify(email)}`,
  });
  const existing = found?.customers?.nodes?.[0];

  if (existing) {
    if (existing.tags?.includes(tag)) {
      return {ok: true, message: 'Ezt a darabot már figyeljük neked.'};
    }
    const res = await adminQuery(env, ADMIN_TAGS_ADD, {
      id: existing.id,
      tags: [tag, 'restock'],
    });
    const errors = res?.tagsAdd?.userErrors ?? [];
    if (errors.length) return {ok: false, message: errors[0].message};
    return {ok: true, message: SUCCESS_MESSAGE};
  }

  const res = await adminQuery(env, ADMIN_CUSTOMER_CREATE, {
    input: {email, tags: [tag, 'restock'], note},
  });
  const errors = res?.customerCreate?.userErrors ?? [];
  if (errors.length) return {ok: false, message: errors[0].message};
  return {ok: true, message: SUCCESS_MESSAGE};
}

const ADMIN_FIND_CUSTOMER = `
  query RestockFindCustomer($query: String!) {
    customers(first: 1, query: $query) { nodes { id tags } }
  }
`;

const ADMIN_TAGS_ADD = `
  mutation RestockTagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`;

const ADMIN_CUSTOMER_CREATE = `
  mutation RestockCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

/** @typedef {import('./+types/restock').Route} Route */
/** @typedef {{ok: boolean, message: string}} RestockResult */
