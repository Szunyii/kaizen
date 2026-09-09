/**
 * Minimal Shopify Admin GraphQL client for server-side use only.
 *
 * Requires `PRIVATE_ADMIN_API_TOKEN` (a custom app's Admin API access token)
 * in the environment. Callers should check `hasAdminAccess(env)` first and
 * degrade gracefully when the token is missing.
 */

export const ADMIN_API_VERSION = '2025-04';

/** @param {Env} env */
export function hasAdminAccess(env) {
  return Boolean(env.PRIVATE_ADMIN_API_TOKEN && env.PUBLIC_STORE_DOMAIN);
}

/**
 * @template T
 * @param {Env} env
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 * @returns {Promise<T>}
 */
export async function adminQuery(env, query, variables = {}) {
  if (!hasAdminAccess(env)) {
    throw new Error('PRIVATE_ADMIN_API_TOKEN is not configured');
  }
  const response = await fetch(
    `https://${env.PUBLIC_STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.PRIVATE_ADMIN_API_TOKEN,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  if (!response.ok) {
    throw new Error(`Admin API ${response.status}`);
  }
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}
