# Category-Aware Collection Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `app/routes/collections.$handle.jsx` into a KaizenType-branded, category-aware collection page with a category switcher, client-side sub-type filtering and sorting, and a hybrid (live Storefront → mock) data source.

**Architecture:** The loader queries the live Shopify collection by handle and maps products onto the existing `ProductCard` shape; if the collection is missing or empty it falls back to the mock `productsByCategory()` catalogue (same pattern as the homepage). The default component renders a branded head, a `Men/Women/Accessories` switcher (route-level navigation), and a toolbar whose sub-type chips + sort run client-side over the loaded products. New `.col-*` styles go in `kaizen-pages.css`.

**Tech Stack:** Hydrogen + React Router v7 + Oxygen + Vite. JSX/JS with JSDoc. GraphQL Storefront API (inline `#graphql` template, codegen). CSS in `app/styles/`.

> **Note on testing:** This repo has no test runner (see CLAUDE.md). Verification per task uses `npm run codegen`, `npm run lint`, `npm run build`, and the manual checks listed. Import routing primitives from `react-router` only — never `@remix-run/*` or `react-router-dom`.

---

## File Structure

- **Modify (rewrite):** `app/routes/collections.$handle.jsx` — loader (hybrid data + 404 rule), `GraphQL COLLECTION_QUERY`, default component, and inline sub-components (`CollectionHead`, `CategoryTabs`, `CollectionToolbar`, `ProductGrid`, `CollectionEmpty`). Sub-components live in the route file, matching the established pattern in `app/routes/_index.jsx`.
- **Modify (append):** `app/styles/kaizen-pages.css` — add a `COLLECTION` section of `.col-*` styles.
- **No change:** `app/lib/kaizen-data.js` (reuses `CATEGORIES`, `productsByCategory`, `ft`), `app/components/kaizen/ProductCard.jsx`, `app/components/kaizen/Brand.jsx`, `app/lib/useReveal.js`.
- **No longer used by this route:** `PaginatedResourceSection`, `ProductItem`, `getPaginationVariables` (remove their imports).

---

## Task 1: Hybrid loader + GraphQL query + minimal render

Establishes the data layer end-to-end with a deliberately minimal UI, so the loader, the GraphQL document, and codegen are proven before any styling work.

**Files:**
- Modify (rewrite): `app/routes/collections.$handle.jsx`

- [ ] **Step 1: Replace the entire file with the loader, query, and a minimal component**

Overwrite `app/routes/collections.$handle.jsx` with exactly:

```jsx
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

  // Unknown handle with no live collection → 404.
  if (!collection && !category) {
    throw new Response(`Collection ${handle} not found`, {status: 404});
  }

  const liveNodes = collection?.products?.nodes ?? [];

  // Live collection with products wins.
  if (liveNodes.length) {
    redirectIfHandleIsLocalized(request, {handle, data: collection});
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
```

- [ ] **Step 2: Regenerate GraphQL + route types**

Run: `npm run codegen`
Expected: completes with no errors; `storefrontapi.generated.d.ts` is updated to include the new `KaizenCollection` query / `KaizenCollectionProduct` fragment types.

- [ ] **Step 3: Lint the file**

Run: `npm run lint`
Expected: passes with no new errors for `app/routes/collections.$handle.jsx`.

- [ ] **Step 4: Build to confirm the route compiles**

Run: `npm run build`
Expected: build succeeds (codegen + Vite client/server bundles) with no errors referencing the collection route.

- [ ] **Step 5: Commit**

```bash
git add app/routes/collections.$handle.jsx storefrontapi.generated.d.ts
git commit -m "$(cat <<'EOF'
Rewrite collection loader with hybrid live/mock data

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Collection styles (`.col-*`)

Adds all collection-page styles up front so the full component in Task 3 has its classes ready. No markup uses these yet, so there is no visual change until Task 3.

**Files:**
- Modify (append): `app/styles/kaizen-pages.css`

- [ ] **Step 1: Append the COLLECTION section to `app/styles/kaizen-pages.css`**

Add the following at the end of the file (after the PDP section):

```css

/* =================== COLLECTION =================== */
.col-head{ position:relative; overflow:hidden;
  padding-block:clamp(40px,6vw,80px) clamp(26px,3.4vw,44px); }
.col-head-kanji{ position:absolute; right:-2%; top:50%; transform:translateY(-50%);
  font-family:var(--brush); font-size:min(40vh,360px); line-height:.8;
  color:rgba(197,60,27,.05); user-select:none; pointer-events:none; }
.col-head-inner{ position:relative; }
.col-h{ font-size:clamp(40px,6vw,86px); margin:18px 0 0; }
.col-sub{ font:400 clamp(14px,1.4vw,17px)/1.6 var(--sans); color:var(--bone-dim);
  letter-spacing:.02em; margin-top:14px; max-width:48ch; text-wrap:pretty; }
.col-head-brush{ position:absolute; left:0; right:0; bottom:6px; height:54px; opacity:.6;
  pointer-events:none; mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent); }

/* category switcher */
.col-tabs{ display:flex; flex-wrap:wrap; gap:10px; padding:18px 0;
  border-bottom:1px solid var(--line); }
.col-tab{ display:inline-flex; align-items:center; padding:11px 22px; border-radius:2px;
  border:1px solid var(--line); background:var(--ink-800); color:var(--bone-dim);
  font:700 12px/1 var(--sans); letter-spacing:.16em; text-transform:uppercase;
  transition:color .25s var(--ease), border-color .25s var(--ease), background .25s var(--ease), transform .25s var(--ease); }
.col-tab:hover{ color:var(--bone); border-color:var(--bone-mut); transform:translateY(-1px); }
.col-tab.is-active{ background:var(--red); border-color:var(--red); color:#fff; }

/* toolbar */
.col-bar{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap;
  gap:16px; padding:24px 0; }
.col-filters{ display:flex; flex-wrap:wrap; gap:8px; }
.col-chip{ padding:9px 16px; border-radius:2px; border:1px solid var(--line);
  background:transparent; color:var(--bone-dim); font:600 12px/1 var(--sans);
  letter-spacing:.06em; transition:color .2s var(--ease), border-color .2s var(--ease), background .2s var(--ease); }
.col-chip:hover{ color:var(--bone); border-color:var(--bone-mut); }
.col-chip.is-active{ color:var(--bone); border-color:var(--red); background:var(--red-wash); }
.col-tools{ display:flex; align-items:center; gap:20px; }
.col-count{ font:500 12px/1 var(--sans); letter-spacing:.08em; text-transform:uppercase;
  color:var(--bone-mut); white-space:nowrap; }
.col-sort{ display:inline-flex; align-items:center; gap:10px; }
.col-sort-label{ font:600 11px/1 var(--sans); letter-spacing:.16em; text-transform:uppercase;
  color:var(--bone-mut); }
.col-sort select{ appearance:none; -webkit-appearance:none; background-color:var(--ink-800);
  color:var(--bone); border:1px solid var(--line); border-radius:2px;
  padding:10px 30px 10px 14px; font:600 12px/1 var(--sans); letter-spacing:.04em; cursor:pointer;
  background-image:linear-gradient(45deg,transparent 50%,var(--bone-mut) 50%),
    linear-gradient(135deg,var(--bone-mut) 50%,transparent 50%);
  background-position:calc(100% - 16px) 50%, calc(100% - 11px) 50%;
  background-size:5px 5px,5px 5px; background-repeat:no-repeat;
  transition:border-color .2s var(--ease); }
.col-sort select:hover{ border-color:var(--bone-mut); }
.col-sort select:focus{ outline:none; border-color:var(--red); }

/* grid spacing */
.col-grid{ padding-bottom:clamp(60px,8vw,110px); }

/* empty state */
.col-empty{ display:flex; flex-direction:column; align-items:center; text-align:center;
  gap:16px; padding:clamp(50px,8vw,100px) 0 clamp(70px,10vw,120px); }
.col-empty-h{ font-size:clamp(26px,3.4vw,42px); color:var(--bone); }
.col-empty-p{ font:400 15px/1.65 var(--sans); color:var(--bone-dim); max-width:40ch; text-wrap:pretty; }
.col-empty-cta{ display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:8px; }

@media (max-width:680px){
  .col-bar{ align-items:flex-start; }
  .col-tools{ width:100%; justify-content:space-between; }
}
```

- [ ] **Step 2: Lint / build to confirm CSS is valid**

Run: `npm run build`
Expected: build succeeds; no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add app/styles/kaizen-pages.css
git commit -m "$(cat <<'EOF'
Add collection page styles

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Full branded UI — head, switcher, toolbar, filtering, empty state

Replaces the minimal component body from Task 1 with the full branded UI wired to the Task 2 styles. Category switching is route-level navigation; sub-type filtering and sorting run client-side over the loaded products via `useMemo`.

**Files:**
- Modify: `app/routes/collections.$handle.jsx` (imports + replace the `Collection` default export and add sub-components; loader and query from Task 1 stay unchanged)

- [ ] **Step 1: Update the import block**

Replace the top import lines of `app/routes/collections.$handle.jsx` with:

```jsx
import {useEffect, useMemo, useState} from 'react';
import {Link, redirect, useLoaderData} from 'react-router';
import {Analytics} from '@shopify/hydrogen';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {BrushRibbon, EnsoMark} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {CATEGORIES, productsByCategory} from '~/lib/kaizen-data';
```

- [ ] **Step 2: Replace the `Collection` default export with the full component + sub-components**

Replace the entire `export default function Collection() { ... }` block (the minimal one from Task 1) with:

```jsx
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
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: passes; no unused-import warnings (every import — `useEffect`, `useMemo`, `useState`, `Link`, `redirect`, `useLoaderData`, `Analytics`, `ProductCard`, `BrushRibbon`, `EnsoMark`, `I`, `useReveal`, `redirectIfHandleIsLocalized`, `CATEGORIES`, `productsByCategory` — is referenced).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, then check in the browser:
- `/collections/men` → branded head shows "Men", grid of men's products.
- `/collections/women` and `/collections/accessories` → their own products.
- Clicking a category pill navigates (URL changes) and highlights the active pill.
- Sub-type chips (e.g. Tees / Hoodies) and the Sort dropdown filter/reorder the grid instantly with no page reload; the item count updates.
- Selecting a sub-type that has no matches (or any empty category) shows the branded empty state; "Clear filter" restores the grid.
- Resize below 980px → grid is 2 columns; below 680px → toolbar tools span full width.

Expected: all behaviors as described; no console errors.

- [ ] **Step 6: Commit**

```bash
git add app/routes/collections.$handle.jsx
git commit -m "$(cat <<'EOF'
Build branded category-aware collection UI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**Spec coverage:**
- Hybrid data source (live → mock) → Task 1 loader. ✓
- ProductCard shape mapping (id/name/price/image/type/tag/colors) → Task 1 loader. ✓
- 404 rule (no live collection AND not a known category) → Task 1 loader. ✓
- `redirectIfHandleIsLocalized` for live case → Task 1 loader. ✓
- Collection head (kicker, title, description, kanji + brush) → Task 3 `CollectionHead` + Task 2 `.col-head*`. ✓
- Category switcher (Men/Women/Accessories, route-level, active state) → Task 3 `CategoryTabs` + Task 2 `.col-tabs/.col-tab`. ✓
- Toolbar: sub-type chips (dynamic from `type`), sort, count, client-side → Task 3 `CollectionToolbar` + Task 2 `.col-bar`. ✓
- Product grid `.grid-4` + ProductCard + reveal → Task 3 `ProductGrid`. ✓
- Empty state → Task 3 `CollectionEmpty` + Task 2 `.col-empty*`. ✓
- `Analytics.CollectionView` (id/handle) → Tasks 1 & 3. ✓
- No server pagination (single `first: 48`) → Task 1 query. ✓
- Responsiveness (grid 2-col <980px existing; toolbar wrap <680px) → Task 2 media query + existing `.grid-4`. ✓
- Run codegen after GraphQL change → Task 1 Step 2. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete code. ✓

**Type consistency:** Loader returns `{id, handle, title, description, source, products}` in every branch; the component destructures `{id, handle, title, description, products}` (ignores `source`, which exists for future use/debugging and is harmless). Product objects always carry `id, handle, name, price, image?, type, tag, colors`, matching `ProductCard`'s expected props. Sub-component prop names (`title`, `description`, `current`, `types`, `activeType`, `onType`, `sort`, `onSort`, `count`, `products`, `onReset`) match between call sites and definitions. ✓
