import {CacheShort} from '@shopify/hydrogen';
import {adminQuery, hasAdminAccess} from '~/lib/admin';
import {formatMoney} from '~/lib/money';

/**
 * Active promotions configured in Shopify admin (Discounts), normalised for
 * display on the storefront. The Storefront API cannot list discounts, so
 * this goes through the Admin API and requires `PRIVATE_ADMIN_API_TOKEN`
 * with the `read_discounts` scope. Without the token, or on any failure,
 * it resolves to an empty list so the homepage simply omits the section.
 *
 * @typedef {{
 *   id: string;
 *   kind: 'bxgy' | 'basic' | 'shipping';
 *   title: string;
 *   summary: string;
 *   code: string | null;
 *   endsAt: string | null;
 *   href: string;
 *   bundle: {
 *     buys: number;
 *     gets: number;
 *     percentage: number;
 *     handles: string[];
 *   } | null;
 * }} Promo
 */

const CACHE_KEY = ['kaizen', 'active-discounts'];

/**
 * @param {{env: Env, withCache: import('@shopify/hydrogen').HydrogenContext['withCache']}} context
 * @returns {Promise<Promo[]>}
 */
export async function fetchActivePromos({env, withCache}) {
  if (!hasAdminAccess(env)) return [];
  try {
    const data = await withCache.run(
      {
        cacheKey: CACHE_KEY,
        cacheStrategy: CacheShort(),
        shouldCacheResult: (result) => Array.isArray(result),
      },
      async () => {
        const res = await adminQuery(env, ACTIVE_DISCOUNTS_QUERY);
        return (res?.discountNodes?.nodes ?? [])
          .map(normalise)
          .filter(Boolean);
      },
    );
    return data ?? [];
  } catch (error) {
    console.error('[discounts] failed to load active promos', error);
    return [];
  }
}

/**
 * @param {{id: string, discount: any}} node
 * @returns {Promo | null}
 */
export function normalise({id, discount}) {
  if (!discount?.title) return null;
  const type = discount.__typename ?? '';
  const code = discount.codes?.nodes?.[0]?.code ?? null;
  const gets = discount.customerGets;
  const buys = discount.customerBuys;

  const kind = type.includes('Bxgy')
    ? 'bxgy'
    : type.includes('FreeShipping')
      ? 'shipping'
      : 'basic';

  const landing = landingFor(gets?.items) ?? landingFor(buys?.items) ?? '/collections/all';

  let bundle = null;
  if (kind === 'bxgy') {
    const buyQty = Number(buys?.value?.quantity ?? 0);
    const getQty = Number(gets?.value?.quantity?.quantity ?? 1);
    const effect = gets?.value?.effect;
    const percentage =
      effect?.__typename === 'DiscountPercentage'
        ? Number(effect.percentage ?? 0)
        : 0;
    if (buyQty > 0 && percentage > 0) {
      bundle = {
        buys: buyQty,
        gets: getQty,
        percentage,
        handles: handlesOf(buys?.items),
      };
    }
  }

  return {
    id,
    kind,
    title: discount.title,
    summary: describe(kind, discount, bundle) || discount.summary || '',
    code,
    endsAt: discount.endsAt ?? null,
    // Code discounts go through /discount/:code, which applies the code to
    // the cart and then redirects to the landing page.
    href: code
      ? `/discount/${encodeURIComponent(code)}?redirect=${encodeURIComponent(landing)}`
      : landing,
    bundle,
  };
}

/** @param {any} items */
function landingFor(items) {
  const product = items?.products?.nodes?.[0]?.handle;
  if (product) return `/products/${product}`;
  const collection = items?.collections?.nodes?.[0]?.handle;
  if (collection) return `/collections/${collection}`;
  return null;
}

/** @param {any} items @returns {string[]} */
function handlesOf(items) {
  return (items?.products?.nodes ?? []).map((p) => p.handle).filter(Boolean);
}

/**
 * Hungarian one-liner for the discount. Falls back to Shopify's own
 * (admin-language) summary when the shape is not recognised.
 * @param {Promo['kind']} kind
 * @param {any} discount
 * @param {Promo['bundle']} bundle
 */
function describe(kind, discount, bundle) {
  if (kind === 'shipping') return 'Ingyenes szállítás a rendelésedre.';

  if (kind === 'bxgy') {
    if (!bundle) return '';
    const pct = Math.round(bundle.percentage * 100);
    const which =
      bundle.gets > 1 ? `a ${bundle.gets} legolcsóbb` : 'az olcsóbb';
    const what = pct >= 100 ? 'ingyen' : `${pct}% kedvezménnyel`;
    return `Vegyél ${bundle.buys} terméket, ${which} ${what}.`;
  }

  const value = discount.customerGets?.value;
  let amount = '';
  if (value?.__typename === 'DiscountPercentage') {
    amount = `${Math.round(Number(value.percentage) * 100)}% kedvezmény`;
  } else if (value?.__typename === 'DiscountAmount' && value.amount) {
    amount = `${formatMoney(value.amount)} kedvezmény`;
  } else {
    return '';
  }

  const items = discount.customerGets?.items;
  const scope =
    items?.__typename === 'AllDiscountItems'
      ? 'minden termékre'
      : items?.__typename === 'DiscountCollections'
        ? `a ${items.collections?.nodes?.[0]?.title ?? 'kiválasztott'} kollekcióra`
        : 'a kiválasztott termékekre';

  const min = discount.minimumRequirement;
  let condition = '';
  if (min?.__typename === 'DiscountMinimumSubtotal') {
    condition = ` ${formatMoney(min.greaterThanOrEqualToSubtotal)} feletti rendelésnél`;
  } else if (min?.__typename === 'DiscountMinimumQuantity') {
    condition = ` legalább ${min.greaterThanOrEqualToQuantity} termék vásárlásánál`;
  }

  return `${amount} ${scope}${condition}.`;
}

const ACTIVE_DISCOUNTS_QUERY = `
  query ActiveDiscounts {
    discountNodes(first: 20, query: "status:active", sortKey: ENDS_AT) {
      nodes {
        id
        discount {
          __typename
          ... on DiscountAutomaticBasic { ...AutoBasic }
          ... on DiscountAutomaticBxgy { ...AutoBxgy }
          ... on DiscountAutomaticFreeShipping { title summary endsAt }
          ... on DiscountCodeBasic { ...CodeBasic codes(first: 1) { nodes { code } } }
          ... on DiscountCodeBxgy { ...CodeBxgy codes(first: 1) { nodes { code } } }
          ... on DiscountCodeFreeShipping { title summary endsAt codes(first: 1) { nodes { code } } }
        }
      }
    }
  }
  fragment Targets on DiscountItems {
    __typename
    ... on AllDiscountItems { allItems }
    ... on DiscountProducts { products(first: 10) { nodes { handle } } }
    ... on DiscountCollections { collections(first: 1) { nodes { handle title } } }
  }
  fragment AutoBasic on DiscountAutomaticBasic {
    title summary endsAt
    minimumRequirement {
      __typename
      ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
      ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } }
    }
    customerGets {
      value {
        __typename
        ... on DiscountPercentage { percentage }
        ... on DiscountAmount { amount { amount currencyCode } }
      }
      items { ...Targets }
    }
  }
  fragment CodeBasic on DiscountCodeBasic {
    title summary endsAt
    minimumRequirement {
      __typename
      ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
      ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount currencyCode } }
    }
    customerGets {
      value {
        __typename
        ... on DiscountPercentage { percentage }
        ... on DiscountAmount { amount { amount currencyCode } }
      }
      items { ...Targets }
    }
  }
  fragment AutoBxgy on DiscountAutomaticBxgy {
    title summary endsAt
    customerBuys {
      value { __typename ... on DiscountQuantity { quantity } }
      items { ...Targets }
    }
    customerGets {
      value {
        __typename
        ... on DiscountOnQuantity {
          quantity { quantity }
          effect {
            __typename
            ... on DiscountPercentage { percentage }
            ... on DiscountAmount { amount { amount currencyCode } }
          }
        }
      }
      items { ...Targets }
    }
  }
  fragment CodeBxgy on DiscountCodeBxgy {
    title summary endsAt
    customerBuys {
      value { __typename ... on DiscountQuantity { quantity } }
      items { ...Targets }
    }
    customerGets {
      value {
        __typename
        ... on DiscountOnQuantity {
          quantity { quantity }
          effect {
            __typename
            ... on DiscountPercentage { percentage }
            ... on DiscountAmount { amount { amount currencyCode } }
          }
        }
      }
      items { ...Targets }
    }
  }
`;
