import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {BrushRibbon} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
import {BLOG_TEXT} from '~/lib/blog';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'Napló — KaizenType'},
    {name: 'description', content: BLOG_TEXT.lead},
  ];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 10,
  });

  const [{blogs}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {blogs};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData() {
  return {};
}

export default function Blogs() {
  /** @type {LoaderReturnData} */
  const {blogs} = useLoaderData();
  const ref = useReveal();

  return (
    <div className="blg view-enter" ref={ref}>
      <section className="blg-head">
        <div className="blg-head-kanji" aria-hidden="true">
          {BLOG_TEXT.kanji}
        </div>
        <div className="wrap blg-head-inner">
          <p className="kicker reveal">
            <span className="kanji">{BLOG_TEXT.kanji}</span>— {BLOG_TEXT.kicker}
          </p>
          <h1 className="blg-h display reveal reveal-d1">Naplók</h1>
          <p className="blg-sub reveal reveal-d2">{BLOG_TEXT.lead}</p>
        </div>
        <div className="blg-head-brush" aria-hidden="true">
          <BrushRibbon opacity={0.7} />
        </div>
      </section>

      <div className="wrap">
        <div className="blg-list">
          <PaginatedResourceSection connection={blogs}>
            {({node: blog}) => (
              <div className="blg-list-row reveal" key={blog.handle}>
                <Link
                  className="blg-list-link"
                  prefetch="intent"
                  to={`/blogs/${blog.handle}`}
                >
                  <span className="blg-list-title display">{blog.title}</span>
                  <span className="blg-list-go">
                    {BLOG_TEXT.all} {I.arrow}
                  </span>
                </Link>
                {blog.seo?.description ? (
                  <p className="blg-list-note">{blog.seo.description}</p>
                ) : null}
              </div>
            )}
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blogs(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    blogs(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        title
        handle
        seo {
          title
          description
        }
      }
    }
  }
`;

/** @typedef {BlogsQuery['blogs']['nodes'][0]} BlogNode */

/** @typedef {import('./+types/blogs._index').Route} Route */
/** @typedef {import('storefrontapi.generated').BlogsQuery} BlogsQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
