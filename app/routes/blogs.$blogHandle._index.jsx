import {Link, useLoaderData} from 'react-router';
import {Pagination, getPaginationVariables} from '@shopify/hydrogen';
import {ArticleCard} from '~/components/kaizen/ArticleCard';
import {NewsletterForm} from '~/components/kaizen/NewsletterForm';
import {BrushRibbon, EnsoMark} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  ARTICLE_CARD_FRAGMENT,
  BLOG_TEXT,
  BLOG_TOPICS,
  toArticleCard,
} from '~/lib/blog';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const title = data?.blog?.title ?? BLOG_TEXT.kicker;
  return [
    {title: `${title} — KaizenType`},
    {
      name: 'description',
      content: data?.blog?.seo?.description || BLOG_TEXT.lead,
    },
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
async function loadCriticalData({context, request, params}) {
  // One lead story plus two rows of three.
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 7,
  });

  if (!params.blogHandle) {
    throw new Response(`blog not found`, {status: 404});
  }

  const [{blog}] = await Promise.all([
    context.storefront.query(BLOGS_QUERY, {
      variables: {
        blogHandle: params.blogHandle,
        ...paginationVariables,
      },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articles) {
    throw new Response('Not found', {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle: params.blogHandle, data: blog});

  // The cards are shaped here (dates, reading time, excerpts) so the
  // component only renders; `pageInfo` is kept for <Pagination>.
  return {
    blog: {title: blog.title, handle: blog.handle, seo: blog.seo},
    articles: {
      ...blog.articles,
      nodes: blog.articles.nodes.map(toArticleCard),
    },
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData() {
  return {};
}

export default function Blog() {
  /** @type {LoaderReturnData} */
  const {blog, articles} = useLoaderData();
  const ref = useReveal();
  const hasArticles = articles.nodes.length > 0;

  return (
    <div className="blg view-enter" ref={ref}>
      <BlogHead blog={blog} count={articles.nodes.length} />
      <div className="wrap">
        {hasArticles ? (
          <ArticleFeed connection={articles} />
        ) : (
          <BlogEmpty />
        )}
      </div>
    </div>
  );
}

/** Branded blog header — same language as the collection header. */
function BlogHead({blog, count}) {
  return (
    <section className="blg-head">
      <div className="blg-head-kanji" aria-hidden="true">
        {BLOG_TEXT.kanji}
      </div>
      <div className="wrap blg-head-inner">
        <p className="kicker reveal">
          <span className="kanji">{BLOG_TEXT.kanji}</span>— {BLOG_TEXT.kicker}
        </p>
        <h1 className="blg-h display reveal reveal-d1">{blog.title}</h1>
        <p className="blg-sub reveal reveal-d2">
          {blog.seo?.description || BLOG_TEXT.lead}
        </p>
        {count ? (
          <p className="blg-count reveal reveal-d3">
            {BLOG_TEXT.latest} — {count} bejegyzés
          </p>
        ) : null}
      </div>
      <div className="blg-head-brush" aria-hidden="true">
        <BrushRibbon opacity={0.7} />
      </div>
    </section>
  );
}

/**
 * The lead story followed by the rest of the page in a grid, with the
 * cursor-based pagination Shopify returns.
 */
function ArticleFeed({connection}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink, hasPreviousPage, hasNextPage}) => {
        const [lead, ...rest] = nodes;
        return (
          <div className="blg-feed">
            {hasPreviousPage ? (
              <PreviousLink className="blg-more">
                {isLoading ? BLOG_TEXT.loading : <>↑ {BLOG_TEXT.newer}</>}
              </PreviousLink>
            ) : null}

            <ArticleCard
              article={lead}
              featured
              eager
              headingLevel="h2"
              key={lead.id}
            />

            {rest.length ? (
              <div className="blg-grid">
                {rest.map((article, i) => (
                  <ArticleCard
                    article={article}
                    key={article.id}
                    eager={i < 2}
                  />
                ))}
              </div>
            ) : null}

            {hasNextPage ? (
              <NextLink className="blg-more">
                {isLoading ? BLOG_TEXT.loading : <>{BLOG_TEXT.older} ↓</>}
              </NextLink>
            ) : null}
          </div>
        );
      }}
    </Pagination>
  );
}

/**
 * Shown while the blog has no posts yet. It says so plainly and still
 * gives the page a reason to exist: what the journal will cover, and the
 * newsletter that announces the first post.
 */
function BlogEmpty() {
  return (
    <section className="blg-empty">
      <div className="blg-empty-lead reveal">
        <EnsoMark size={92} stroke={9} />
        <h2 className="blg-empty-h display">{BLOG_TEXT.emptyTitle}</h2>
        <p className="blg-empty-p">{BLOG_TEXT.emptyLead}</p>
      </div>

      <div className="blg-empty-grid">
        <div className="blg-topics reveal reveal-d1">
          <h3 className="blg-topics-h">{BLOG_TEXT.emptyTopicsH}</h3>
          <ul className="blg-topic-list">
            {BLOG_TOPICS.map(([kanji, label, note]) => (
              <li className="blg-topic" key={label}>
                <span className="blg-topic-kanji" aria-hidden="true">
                  {kanji}
                </span>
                <div>
                  <span className="blg-topic-label">{label}</span>
                  <p className="blg-topic-note">{note}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link className="btn btn-ghost blg-empty-cta" to="/collections/all">
            {BLOG_TEXT.shop} {I.arrow}
          </Link>
        </div>

        <section className="blg-news reveal reveal-d2">
          <p className="kicker">
            <span className="kanji">改善</span>— Hírlevél
          </p>
          <h3 className="blg-news-h display">{BLOG_TEXT.emptyNewsletterH}</h3>
          <p className="blg-news-p">{BLOG_TEXT.emptyNewsletterP}</p>
          <NewsletterForm
            className="blg-form"
            label="Hírlevél feliratkozás a naplóban"
          />
          <p className="blg-news-note">
            Bármikor leiratkozhatsz egy kattintással.
          </p>
        </section>
      </div>
    </section>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog
const BLOGS_QUERY = `#graphql
  query Blog(
    $language: LanguageCode
    $blogHandle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      title
      handle
      seo {
        title
        description
      }
      articles(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ArticleCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
  ${ARTICLE_CARD_FRAGMENT}
`;

/** @typedef {import('./+types/blogs.$blogHandle._index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
