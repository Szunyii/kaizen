import {useEffect, useMemo, useState} from 'react';
import {Link, redirect, useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {BrushRibbon, EnsoMark} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
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
  const {id, handle, title, description, products} = useLoaderData();

  const [activeType, setActiveType] = useState('all');
  const [sort, setSort] = useState('featured');

  // Reset filter + sort whenever the category (route) changes.
  useEffect(() => {
    setActiveType('all');
    setSort('featured');
  }, [handle]);

  // Distinct sub-types present in the loaded products.
  const types = useMemo(() => {
    const set = new Set(products.map((p) => p.type).filter(Boolean));
    return ['all', ...set];
  }, [products]);

  // Client-side filter + sort over the loaded set.
  const visible = useMemo(() => {
    const list =
      activeType === 'all'
        ? [...products]
        : products.filter((p) => p.type === activeType);
    // 'featured' keeps the loader's order (Shopify collection order, or mock
    // order); no explicit merchandised-position field is fetched.
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, activeType, sort]);

  return (
    <div className="col view-enter">
      <CollectionHead title={title} description={description} />
      <div className="wrap">
        <CategoryTabs current={handle} />
        <CollectionToolbar
          types={types}
          activeType={activeType}
          onType={setActiveType}
          sort={sort}
          onSort={setSort}
          count={visible.length}
        />
        {visible.length ? (
          <ProductGrid products={visible} />
        ) : (
          <CollectionEmpty onReset={() => setActiveType('all')} />
        )}
      </div>
      <Analytics.CollectionView data={{collection: {id, handle}}} />
    </div>
  );
}

/** Branded collection header with the category title + decorative accents. */
function CollectionHead({title, description}) {
  return (
    <section className="col-head">
      <div className="col-head-kanji" aria-hidden="true">
        改
      </div>
      <div className="wrap col-head-inner">
        <p className="kicker">改善 — Collection</p>
        <h1 className="col-h display">{title}</h1>
        {description ? <p className="col-sub">{description}</p> : null}
      </div>
      <div className="col-head-brush" aria-hidden="true">
        <BrushRibbon opacity={0.7} />
      </div>
    </section>
  );
}

/** Men / Women / Accessories switcher. Each pill is a real route link. */
function CategoryTabs({current}) {
  // Active state matches the category id (men/women/accessories). A live
  // Shopify collection with a different handle intentionally shows no active
  // tab — by design, not a bug.
  return (
    <nav className="col-tabs" aria-label="Categories">
      {CATEGORIES.map((c) => (
        <Link
          key={c.id}
          to={`/collections/${c.id}`}
          className={`col-tab ${c.id === current ? 'is-active' : ''}`}
          aria-current={c.id === current ? 'page' : undefined}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}

/** Sub-type filter chips (client-side) + result count + sort. */
function CollectionToolbar({types, activeType, onType, sort, onSort, count}) {
  return (
    <div className="col-bar">
      <div className="col-filters">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            className={`col-chip ${t === activeType ? 'is-active' : ''}`}
            onClick={() => onType(t)}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="col-tools">
        <span className="col-count">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
        <label className="col-sort">
          <span className="col-sort-label">Sort</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price — low to high</option>
            <option value="price-desc">Price — high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </div>
  );
}

/** Reveal-on-scroll product grid. */
function ProductGrid({products}) {
  // useReveal fires once: it adds `.in` when the grid scrolls into view, then
  // stops observing. Reveal is initial-scroll only — when client filtering
  // swaps cards, they render immediately via the already-applied `.in .reveal`
  // rule (no per-filter replay, by design).
  const ref = useReveal();
  return (
    <div className="grid-4 col-grid" ref={ref}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} idx={i} />
      ))}
    </div>
  );
}

/** Branded empty state for an empty filter or empty category. */
function CollectionEmpty({onReset}) {
  return (
    <div className="col-empty">
      <EnsoMark size={92} stroke={9} />
      <h2 className="col-empty-h display">Nothing here yet</h2>
      <p className="col-empty-p">
        No products match this filter. Try another, or explore the full
        catalogue.
      </p>
      <div className="col-empty-cta">
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Clear filter
        </button>
        <Link className="btn" to="/collections">
          View all {I.arrow}
        </Link>
      </div>
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
