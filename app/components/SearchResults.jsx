import {Link} from 'react-router';
import {Pagination} from '@shopify/hydrogen';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {I} from '~/components/kaizen/Icons';
import {urlWithTrackingParams} from '~/lib/search';
import {SEARCH_TEXT} from '~/lib/text';
import {useReveal} from '~/lib/useReveal';

/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

/**
 * Pages and articles: a plain link list under the product grid.
 * @param {{title: string; items: Array<{id: string; title: string; url: string}>}}
 */
function SearchLinkList({title, items}) {
  if (!items.length) return null;

  return (
    <section className="srch-sec">
      <h2 className="srch-h">{title}</h2>
      <ul className="srch-list">
        {items.map((item) => (
          <li key={item.id}>
            <Link className="srch-link" prefetch="intent" to={item.url}>
              {item.title} {I.arrow}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * @param {PartialSearchResult<'articles'>}
 */
function SearchResultsArticles({term, articles}) {
  const items = (articles?.nodes ?? []).map((article) => ({
    id: article.id,
    title: article.title,
    url: urlWithTrackingParams({
      baseUrl: `/blogs/${article.handle}`,
      trackingParams: article.trackingParameters,
      term,
    }),
  }));

  return <SearchLinkList title={SEARCH_TEXT.articles} items={items} />;
}

/**
 * @param {PartialSearchResult<'pages'>}
 */
function SearchResultsPages({term, pages}) {
  const items = (pages?.nodes ?? []).map((page) => ({
    id: page.id,
    title: page.title,
    url: urlWithTrackingParams({
      baseUrl: `/pages/${page.handle}`,
      trackingParams: page.trackingParameters,
      term,
    }),
  }));

  return <SearchLinkList title={SEARCH_TEXT.pages} items={items} />;
}

/**
 * Products as the same cards as the collection grid.
 * @param {PartialSearchResult<'products'>}
 */
function SearchResultsProducts({term, products}) {
  // cards are .reveal elements: without the observer they stay invisible
  const ref = useReveal();
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section className="srch-sec" ref={ref}>
      <h2 className="srch-h">{SEARCH_TEXT.products}</h2>
      <Pagination connection={products}>
        {({nodes, isLoading, NextLink, PreviousLink}) => (
          <>
            <PreviousLink className="btn btn-ghost srch-more">
              {isLoading ? SEARCH_TEXT.loading : SEARCH_TEXT.prev}
            </PreviousLink>
            <div className="grid-4 col-grid srch-grid">
              {nodes.map((product, i) => {
                const variant = product.selectedOrFirstAvailableVariant;
                return (
                  <ProductCard
                    key={product.id}
                    idx={i}
                    to={urlWithTrackingParams({
                      baseUrl: `/products/${product.handle}`,
                      trackingParams: product.trackingParameters,
                      term,
                    })}
                    product={{
                      id: product.id,
                      handle: product.handle,
                      name: product.title,
                      price: Number(variant?.price?.amount ?? 0),
                      image: variant?.image ?? null,
                      tag: null,
                      type: null,
                      colorNames: [],
                      colors: [],
                    }}
                  />
                );
              })}
            </div>
            <NextLink className="btn btn-ghost srch-more">
              {isLoading ? SEARCH_TEXT.loading : SEARCH_TEXT.more}
            </NextLink>
          </>
        )}
      </Pagination>
    </section>
  );
}

/**
 * @param {{term?: string}}
 */
function SearchResultsEmpty({term}) {
  return (
    <div className="col-empty">
      <h2 className="col-empty-h display">
        {term ? (
          <>
            {SEARCH_TEXT.noResults} <q>{term}</q>
          </>
        ) : (
          SEARCH_TEXT.emptyTitle
        )}
      </h2>
      <p className="col-empty-p">
        {term ? SEARCH_TEXT.noResultsLead : SEARCH_TEXT.emptyLead}
      </p>
      <div className="col-empty-cta">
        <Link className="btn" to="/#termekek">
          {SEARCH_TEXT.toProducts} {I.arrow}
        </Link>
      </div>
    </div>
  );
}

/** @typedef {RegularSearchReturn['result']['items']} SearchItems */
/**
 * @typedef {Pick<
 *   SearchItems,
 *   ItemType
 * > &
 *   Pick<RegularSearchReturn, 'term'>} PartialSearchResult
 * @template {keyof SearchItems} ItemType
 */
/**
 * @typedef {RegularSearchReturn & {
 *   children: (args: SearchItems & {term: string}) => React.ReactNode;
 * }} SearchResultsProps
 */

/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
