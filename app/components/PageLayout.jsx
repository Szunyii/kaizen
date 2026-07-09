import {Await, Link} from 'react-router';
import {Suspense, useEffect, useId, useRef} from 'react';
import {Aside, useAside} from '~/components/Aside';
import {I} from '~/components/kaizen/Icons';
import {KaizenHeader, KaizenMobileNav} from '~/components/kaizen/KaizenHeader';
import {KaizenFooter} from '~/components/kaizen/KaizenFooter';
import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

/**
 * @param {PageLayoutProps}
 */
export function PageLayout({cart, children = null, isLoggedIn, navCollections}) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <SearchAside />
      <MobileMenuAside navCollections={navCollections} />
      <KaizenHeader
        cart={cart}
        isLoggedIn={isLoggedIn}
        navCollections={navCollections}
      />
      <main>{children}</main>
      <KaizenFooter />
    </Aside.Provider>
  );
}

/**
 * @param {{cart: PageLayoutProps['cart']}}
 */
function CartAside({cart}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  const {type} = useAside();
  const rootRef = useRef(null);

  // Focus the input when the drawer opens so typing can start immediately;
  // drop focus when it closes so it doesn't stay inside the hidden overlay.
  useEffect(() => {
    const input = rootRef.current?.querySelector('input[type="search"]');
    if (!input) return;
    if (type !== 'search') {
      input.blur();
      return;
    }
    const timer = setTimeout(() => input.focus(), 150);
    return () => clearTimeout(timer);
  }, [type]);

  return (
    <Aside type="search" heading="SEARCH">
      <div className="sd" ref={rootRef}>
        <SearchFormPredictive className="sd-form">
          {({fetchResults, inputRef}) => (
            <>
              <span className="sd-ic">{I.search}</span>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search products"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              <button
                type="submit"
                className="sd-go"
                aria-label="View all results"
              >
                {I.arrow}
              </button>
            </>
          )}
        </SearchFormPredictive>

        <div className="sd-results">
          <SearchResultsPredictive>
            {({items, total, term, state, closeSearch}) => {
              const {articles, collections, pages, products, queries} = items;

              if (state === 'loading' && term.current) {
                return <p className="sd-note">Searching…</p>;
              }

              if (!total) {
                return <SearchResultsPredictive.Empty term={term} />;
              }

              return (
                <>
                  <SearchResultsPredictive.Queries
                    queries={queries}
                    queriesDatalistId={queriesDatalistId}
                  />
                  <SearchResultsPredictive.Products
                    products={products}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Collections
                    collections={collections}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Pages
                    pages={pages}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  <SearchResultsPredictive.Articles
                    articles={articles}
                    closeSearch={closeSearch}
                    term={term}
                  />
                  {term.current && total ? (
                    <Link
                      className="sd-all"
                      onClick={closeSearch}
                      to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(
                        term.current,
                      )}`}
                    >
                      View all results for <q>{term.current}</q>
                      {I.arrow}
                    </Link>
                  ) : null}
                </>
              );
            }}
          </SearchResultsPredictive>
        </div>
      </div>
    </Aside>
  );
}

/**
 * @param {{navCollections: PageLayoutProps['navCollections']}}
 */
function MobileMenuAside({navCollections}) {
  return (
    <Aside type="mobile" heading="MENU">
      <KaizenMobileNav navCollections={navCollections} />
    </Aside>
  );
}

/**
 * @typedef {Object} PageLayoutProps
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {Promise<boolean>} isLoggedIn
 * @property {NavCollectionFragment[]} navCollections
 * @property {string} publicStoreDomain
 * @property {React.ReactNode} [children]
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').NavCollectionsQuery['collections']['nodes'][number]} NavCollectionFragment */
