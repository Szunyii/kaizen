import {data} from 'react-router';
import {adminQuery, hasAdminAccess} from '~/lib/admin';

/**
 * Newsletter signup resource route (`POST /newsletter`).
 *
 * Subscribes an email address to Shopify email marketing:
 *  - With `PRIVATE_ADMIN_API_TOKEN` set (custom app, `write_customers` scope),
 *    the Admin API is used: existing customers get their marketing consent
 *    updated, new ones are created already subscribed and tagged `newsletter`.
 *  - Without it, the Storefront API `customerCreate` mutation is used with
 *    `acceptsMarketing: true`. This is what Shopify themes' newsletter forms
 *    do under the hood, but it cannot re-subscribe an existing customer.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** @param {Route.ActionArgs} args */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({ok: false, message: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase();

  // Honeypot: bots fill every field, humans never see this one.
  if (form.get('website')) return data({ok: true, message: SUCCESS_MESSAGE});

  if (!EMAIL_RE.test(email)) {
    return data(
      {ok: false, message: 'Adj meg egy érvényes e-mail címet.'},
      {status: 400},
    );
  }

  try {
    const result = hasAdminAccess(context.env)
      ? await subscribeViaAdmin(email, context.env)
      : await subscribeViaStorefront(email, context.storefront);
    return data(result, {status: result.ok ? 200 : 400});
  } catch (error) {
    console.error('[newsletter] subscribe failed', error);
    return data(
      {ok: false, message: 'Most nem sikerült feliratkozni. Próbáld újra később.'},
      {status: 500},
    );
  }
}

/** Non-POST requests to the resource route have nothing to show. */
export function loader() {
  return new Response(null, {status: 404});
}

const SUCCESS_MESSAGE = 'Köszönjük, feliratkoztál. Hamarosan jelentkezünk.';
const ALREADY_MESSAGE = 'Ezzel a címmel már fel vagy iratkozva.';

/* ------------------------------------------------------------------ */
/* Storefront API path                                                 */
/* ------------------------------------------------------------------ */

/**
 * @param {string} email
 * @param {import('@shopify/hydrogen').Storefront} storefront
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function subscribeViaStorefront(email, storefront) {
  const {customerCreate} = await storefront.mutate(
    STOREFRONT_SUBSCRIBE_MUTATION,
    {
      variables: {
        input: {email, password: randomPassword(), acceptsMarketing: true},
      },
    },
  );

  const errors = customerCreate?.customerUserErrors ?? [];
  if (!errors.length) return {ok: true, message: SUCCESS_MESSAGE};

  if (errors.some((e) => e.code === 'TAKEN')) {
    // The address already belongs to a customer; the Storefront API cannot
    // change their consent, so treat it as already subscribed.
    return {ok: true, message: ALREADY_MESSAGE};
  }
  return {ok: false, message: errors[0].message};
}

function randomPassword() {
  // Shopify caps passwords at 40 characters; 16 bytes -> 32 hex chars.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const STOREFRONT_SUBSCRIBE_MUTATION = `#graphql
  mutation NewsletterSubscribe($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { id }
      customerUserErrors { code field message }
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Admin API path                                                      */
/* ------------------------------------------------------------------ */

/**
 * @param {string} email
 * @param {Env} env
 * @returns {Promise<{ok: boolean, message: string}>}
 */
async function subscribeViaAdmin(email, env) {
  const consent = {
    marketingState: 'SUBSCRIBED',
    marketingOptInLevel: 'SINGLE_OPT_IN',
  };

  const found = await adminQuery(env, ADMIN_FIND_CUSTOMER, {
    query: `email:${JSON.stringify(email)}`,
  });
  const existing = found?.customers?.nodes?.[0];

  if (existing) {
    const res = await adminQuery(env, ADMIN_CONSENT_UPDATE, {
      input: {customerId: existing.id, emailMarketingConsent: consent},
    });
    const errors = res?.customerEmailMarketingConsentUpdate?.userErrors ?? [];
    if (errors.length) return {ok: false, message: errors[0].message};
    return {ok: true, message: SUCCESS_MESSAGE};
  }

  const res = await adminQuery(env, ADMIN_CUSTOMER_CREATE, {
    input: {email, emailMarketingConsent: consent, tags: ['newsletter']},
  });
  const errors = res?.customerCreate?.userErrors ?? [];
  if (errors.length) return {ok: false, message: errors[0].message};
  return {ok: true, message: SUCCESS_MESSAGE};
}

const ADMIN_FIND_CUSTOMER = `
  query NewsletterFindCustomer($query: String!) {
    customers(first: 1, query: $query) { nodes { id } }
  }
`;

const ADMIN_CUSTOMER_CREATE = `
  mutation NewsletterCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const ADMIN_CONSENT_UPDATE = `
  mutation NewsletterConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

/** @typedef {import('./+types/newsletter').Route} Route */
/** @typedef {{ok: boolean, message: string}} NewsletterResult */
