import {Link, redirect, useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {CATEGORIES, productsByCategory} from '~/lib/kaizen-data';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `KaizenType — ${data?.title ?? 'Collection'}`}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

/**
 * Hybrid collection data: prefer the live Storefront collection, fall back to
 * the mock kaizen catalogue by category. Maps everything onto the shape the
 * Kaizen ProductCard expects.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, first: 48},
  });
  const category = CATEGORIES.find((c) => c.id === handle);

  // A live collection's handle may be localized — redirect to the canonical one.
  if (collection) {
    redirectIfHandleIsLocalized(request, {handle, data: collection});
  }

  // Unknown handle with no live collection → 404.
  if (!collection && !category) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  const liveNodes = collection?.products?.nodes ?? [];

  // Live collection with products wins.
  if (liveNodes.length) {
    return {
      id: collection.id,
      handle,
      title: collection.title,
      description: collection.description || category?.sub || '',
      source: 'live',
      products: liveNodes.map((p) => ({
        id: p.id,
        handle: p.handle,
        name: p.title,
        price: Number(p.priceRange.minVariantPrice.amount),
        image: p.featuredImage,
        type: (p.productType || '').toLowerCase(),
        tag: null,
        colors: [],
      })),
    };
  }

  // Known category → mock fallback.
  if (category) {
    return {
      id: '',
      handle,
      title: category.label,
      description: category.sub,
      source: 'mock',
      products: productsByCategory(handle),
    };
  }

  // Live collection exists but is empty (and not a known category).
  return {
    id: collection.id,
    handle,
    title: collection.title,
    description: collection.description || '',
    source: 'live',
    products: [],
  };
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {id, handle, title, products} = useLoaderData();

  return (
    <div className="col view-enter">
      <div className="wrap" style={{paddingBlock: '60px'}}>
        <p className="kicker">改善 — Collection</p>
        <h1
          className="display"
          style={{fontSize: 'clamp(40px,6vw,86px)', margin: '16px 0 34px'}}
        >
          {title}
        </h1>
        {products.length ? (
          <div className="grid-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} idx={i} />
            ))}
          </div>
        ) : (
          <p style={{color: 'var(--bone-dim)'}}>
            No products yet. <Link className="ul" to="/collections">View all</Link>
          </p>
        )}
      </div>
      <Analytics.CollectionView data={{collection: {id, handle}}} />
    </div>
  );
}

const COLLECTION_QUERY = `#graphql
  fragment KaizenCollectionProduct on Product {
    id
    handle
    title
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
  query KaizenCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first) {
        nodes {
          ...KaizenCollectionProduct
        }
      }
    }
  }
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
