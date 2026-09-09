import {Link, redirect, useLoaderData, useSearchParams} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {BrushRibbon, EnsoMark} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {productType, collectionTitle} from '~/lib/text';

/**
 * Sort options exposed in the UI, mapped to Storefront API sort keys.
 * 'featured' follows the merchandised collection order (COLLECTION_DEFAULT).
 */
const SORT_OPTIONS = {
  featured: {label: 'Kiemelt', sortKey: 'COLLECTION_DEFAULT', reverse: false},
  'price-asc': {label: 'Ár: alacsonytól', sortKey: 'PRICE', reverse: false},
  'price-desc': {label: 'Ár: magastól', sortKey: 'PRICE', reverse: true},
  name: {label: 'Név: A–Z', sortKey: 'TITLE', reverse: false},
};

/**
 * Option names treated as the product's colour axis, both for the card
 * swatches and for the colour filter.
 */
const COLOR_OPTION_NAMES = new Set(['szín', 'color', 'colour']);

/** Fallback hexes for colour names without a configured admin swatch. */
const COLOR_HEX = {
  fekete: '#1b1916',
  black: '#1b1916',
  fehér: '#e7e1d4',
  white: '#e7e1d4',
  bone: '#e7e1d4',
  szürke: '#7c776e',
  grey: '#7c776e',
  gray: '#7c776e',
  piros: '#a32e13',
  red: '#a32e13',
  olíva: '#55543f',
  olive: '#55543f',
};

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `${data?.title ?? 'Kollekció'} — KaizenType`}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  const criticalData = await loadCriticalData(args);
  return criticalData;
}

/**
 * Live collection data with URL-driven filtering + sorting, so filtered
 * views are shareable and SSR-rendered. Filtering is limited to two axes —
 * product category (`?type=`) and colour (`?color=`) — and happens here in
 * the loader: this store's Search & Discovery app doesn't expose
 * productType/variantOption filters, so the Storefront API silently ignores
 * them as `filters:` inputs. Chip values and counts are derived from the
 * products actually in the collection (capped at the first 48), and URL
 * params that don't match a real value are dropped.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const url = new URL(request.url);
  const sortParam = url.searchParams.get('sort');
  const sort = SORT_OPTIONS[sortParam] ? sortParam : 'featured';
  const {sortKey, reverse} = SORT_OPTIONS[sort];

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {handle, first: 48, sortKey, reverse},
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  // A live collection's handle may be localized — redirect to the canonical one.
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const all = collection.products.nodes.map((p) => {
    const colorValues = productColors(p.options);
    return {
      id: p.id,
      handle: p.handle,
      name: p.title,
      price: Number(p.priceRange.minVariantPrice.amount),
      image: p.featuredImage,
      tag: null,
      type: p.productType || null,
      colorNames: colorValues.map((c) => c.name),
      colors: colorValues.filter((c) => c.hex),
    };
  });

  const typeValues = [...new Set(all.map((p) => p.type).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
  const colorNames = [...new Set(all.flatMap((p) => p.colorNames))].sort(
    (a, b) => a.localeCompare(b),
  );
  const hexByColor = new Map();
  for (const p of all) {
    for (const c of p.colors) {
      if (!hexByColor.has(c.name)) hexByColor.set(c.name, c.hex);
    }
  }

  const appliedTypes = [...new Set(url.searchParams.getAll('type'))].filter(
    (t) => typeValues.includes(t),
  );
  const appliedColors = [...new Set(url.searchParams.getAll('color'))].filter(
    (c) => colorNames.includes(c),
  );

  // Values within a group are OR-ed, the two groups are AND-ed.
  const matchesType = (p) =>
    appliedTypes.length === 0 || appliedTypes.includes(p.type);
  const matchesColor = (p) =>
    appliedColors.length === 0 ||
    p.colorNames.some((n) => appliedColors.includes(n));

  return {
    id: collection.id,
    handle,
    title: collectionTitle(collection),
    description: collection.description || '',
    // Each value's count is taken against the other group's selection, so
    // a chip always shows how many items picking it would yield.
    facets: {
      types: typeValues.map((value) => ({
        value,
        count: all.filter((p) => p.type === value && matchesColor(p)).length,
      })),
      colors: colorNames.map((name) => ({
        name,
        hex: hexByColor.get(name) ?? null,
        count: all.filter((p) => p.colorNames.includes(name) && matchesType(p))
          .length,
      })),
    },
    appliedTypes,
    appliedColors,
    sort,
    products: all.filter((p) => matchesType(p) && matchesColor(p)),
  };
}

/**
 * The product's colour option values, preferring the admin-configured
 * swatch colour and falling back to a named-colour hex. Values without a
 * resolvable hex are kept (they still filter) but get `hex: null`.
 */
function productColors(options) {
  const colorOption = (options ?? []).find((o) =>
    COLOR_OPTION_NAMES.has(o.name.toLowerCase()),
  );
  if (!colorOption) return [];
  return colorOption.optionValues.map((v) => ({
    name: v.name,
    hex: v.swatch?.color || COLOR_HEX[v.name.toLowerCase()] || null,
  }));
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {
    id,
    handle,
    title,
    description,
    facets,
    appliedTypes,
    appliedColors,
    sort,
    products,
  } = useLoaderData();

  const [searchParams, setSearchParams] = useSearchParams();
  const filterCount = appliedTypes.length + appliedColors.length;

  /** Toggle one value of a multi-value filter param (`type` / `color`). */
  const toggleFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    const current = params.getAll(key);
    params.delete(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    for (const v of next) params.append(key, v);
    setSearchParams(params, {preventScrollReset: true});
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('type');
    params.delete('color');
    setSearchParams(params, {preventScrollReset: true});
  };

  const setSort = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'featured') params.delete('sort');
    else params.set('sort', value);
    setSearchParams(params, {preventScrollReset: true});
  };

  return (
    <div className="col view-enter">
      <CollectionHead title={title} description={description} />
      <div className="wrap">
        <CollectionToolbar
          facets={facets}
          appliedTypes={appliedTypes}
          appliedColors={appliedColors}
          onToggle={toggleFilter}
          onClear={clearFilters}
          sort={sort}
          onSort={setSort}
          count={products.length}
        />
        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <CollectionEmpty onReset={clearFilters} filtered={filterCount > 0} />
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
        <p className="kicker">改善 — Kollekció</p>
        <h1 className="col-h display">{title}</h1>
        {description ? <p className="col-sub">{description}</p> : null}
      </div>
      <div className="col-head-brush" aria-hidden="true">
        <BrushRibbon opacity={0.7} />
      </div>
    </section>
  );
}

/**
 * Filter + sort toolbar. Filtering is limited to product category and
 * colour; the chips are the values that actually occur in this collection's
 * products, so every chip maps to at least one real product.
 */
function CollectionToolbar({
  facets,
  appliedTypes,
  appliedColors,
  onToggle,
  onClear,
  sort,
  onSort,
  count,
}) {
  const anyApplied = appliedTypes.length + appliedColors.length > 0;

  return (
    <div className="col-bar">
      <div className="col-filters">
        <button
          type="button"
          className={`col-chip ${anyApplied ? '' : 'is-active'}`}
          onClick={onClear}
        >
          Összes
        </button>
        {facets.types.length ? (
          <span className="col-facet">
            <span className="col-facet-label">Kategória</span>
            {facets.types.map(({value, count: n}) => (
              <button
                key={value}
                type="button"
                className={`col-chip ${
                  appliedTypes.includes(value) ? 'is-active' : ''
                }`}
                onClick={() => onToggle('type', value)}
              >
                {productType(value)}
                <span className="col-chip-count">{n}</span>
              </button>
            ))}
          </span>
        ) : null}
        {facets.colors.length ? (
          <span className="col-facet">
            <span className="col-facet-label">Szín</span>
            {facets.colors.map(({name, hex, count: n}) => (
              <button
                key={name}
                type="button"
                className={`col-chip ${
                  appliedColors.includes(name) ? 'is-active' : ''
                }`}
                onClick={() => onToggle('color', name)}
              >
                {hex ? (
                  <span
                    className="col-chip-dot"
                    style={{background: hex}}
                    aria-hidden="true"
                  />
                ) : null}
                {name}
                <span className="col-chip-count">{n}</span>
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <div className="col-tools">
        <span className="col-count">
          {count} termék
        </span>
        <label className="col-sort">
          <span className="col-sort-label">Rendezés</span>
          <select value={sort} onChange={(e) => onSort(e.target.value)}>
            {Object.entries(SORT_OPTIONS).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/** Reveal-on-scroll product grid. */
function ProductGrid({products}) {
  // useReveal fires once: it adds `.in` when the grid scrolls into view, then
  // stops observing. Reveal is initial-scroll only — when filtering swaps
  // cards, they render immediately via the already-applied `.in .reveal`
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

/** Branded empty state for an empty filter result or empty collection. */
function CollectionEmpty({onReset, filtered}) {
  return (
    <div className="col-empty">
      <EnsoMark size={92} stroke={9} />
      <h2 className="col-empty-h display">Még nincs itt semmi</h2>
      <p className="col-empty-p">
        {filtered
          ? 'Ezekre a szűrőkre nincs találat. Próbálj másik kombinációt, vagy nézd meg a teljes kínálatot.'
          : 'Ebben a kollekcióban még nincs termék. Nézd meg a teljes kínálatot.'}
      </p>
      <div className="col-empty-cta">
        {filtered ? (
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Szűrők törlése
          </button>
        ) : null}
        <Link className="btn" to="/#termekek">
          Összes termék {I.arrow}
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
    options {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
  }
  query KaizenCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        nodes {
          ...KaizenCollectionProduct
        }
      }
    }
  }
`;

/** @typedef {import('./+types/collections.$handle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
