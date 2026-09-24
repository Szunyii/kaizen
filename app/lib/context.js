import {createHydrogenContext, createWithCache} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

/**
 * Custom properties for the load context. They are available to loaders and
 * actions as both `context.propertyName` and `context.get(propertyContext)`.
 * Third-party clients (CMS, reviews, ...) belong here.
 * @param {{
 *   cache: Cache,
 *   waitUntil: (promise: Promise<unknown>) => void,
 *   request: Request,
 * }} options
 */
function createAdditionalContext({cache, waitUntil, request}) {
  return {
    // Cached fetch for third-party APIs (see app/lib/fogyasztobarat.js).
    withCache: createWithCache({cache, waitUntil, request}),
  };
}

/**
 * Creates Hydrogen context for React Router 7.9.x
 * Returns HydrogenRouterContextProvider with hybrid access patterns
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} executionContext
 */
export async function createHydrogenRouterContext(
  request,
  env,
  executionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext(
    {
      env,
      request,
      cache,
      waitUntil,
      session,
      // Or detect from URL path based on locale subpath, cookies, or any other strategy
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
    },
    createAdditionalContext({cache, waitUntil, request}),
  );

  return hydrogenContext;
}

/** @typedef {ReturnType<typeof createAdditionalContext>} AdditionalContextType */
