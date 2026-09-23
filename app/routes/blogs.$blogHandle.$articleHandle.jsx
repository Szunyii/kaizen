import {Link, useLoaderData} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {ArticleCard} from '~/components/kaizen/ArticleCard';
import {NewsletterForm} from '~/components/kaizen/NewsletterForm';
import {BrushRibbon} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  ARTICLE_CARD_FRAGMENT,
  BLOG_TEXT,
  articleExcerpt,
  formatArticleDate,
  readingMinutes,
  toArticleCard,
} from '~/lib/blog';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  const article = data?.article;
  if (!article) return [{title: 'KaizenType'}];
  const description = article.seo?.description || article.lead;
  return [
    {title: `${article.seo?.title || article.title} — KaizenType`},
    {name: 'description', content: description},
    {property: 'og:type', content: 'article'},
    {property: 'og:title', content: article.title},
    {property: 'og:description', content: description},
    ...(article.image?.url
      ? [{property: 'og:image', content: article.image.url}]
      : []),
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
  const {blogHandle, articleHandle} = params;

  if (!articleHandle || !blogHandle) {
    throw new Response('Not found', {status: 404});
  }

  // The article and the "more posts" rail come from the same blog, so one
  // query covers both.
  const [{blog}] = await Promise.all([
    context.storefront.query(ARTICLE_QUERY, {
      variables: {blogHandle, articleHandle},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!blog?.articleByHandle) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(
    request,
    {
      handle: articleHandle,
      data: blog.articleByHandle,
    },
    {
      handle: blogHandle,
      data: blog,
    },
  );

  const source = blog.articleByHandle;
  const article = {
    ...source,
    date: formatArticleDate(source.publishedAt),
    minutes: readingMinutes(source.contentHtml),
    lead: articleExcerpt(source, 220),
  };

  const related = (blog.articles?.nodes ?? [])
    .filter((node) => node.handle !== articleHandle)
    .slice(0, 3)
    .map(toArticleCard);

  return {
    article,
    blog: {handle: blog.handle, title: blog.title},
    related,
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

export default function Article() {
  /** @type {LoaderReturnData} */
  const {article, blog, related} = useLoaderData();
  const {title, image, contentHtml, author, tags} = article;
  const ref = useReveal();

  return (
    <div className="art view-enter" ref={ref}>
      <article>
        <header className="art-head">
          <div className="art-head-kanji" aria-hidden="true">
            {BLOG_TEXT.kanji}
          </div>
          <div className="wrap art-head-inner">
            <nav className="art-crumbs" aria-label="Morzsa navigáció">
              <Link to={`/blogs/${blog.handle}`}>{blog.title}</Link>
              <span aria-hidden="true">/</span>
              <span className="art-crumb-now">{title}</span>
            </nav>
            <h1 className="art-h display">{title}</h1>
            {article.lead ? <p className="art-lead">{article.lead}</p> : null}
            <p className="art-meta">
              <time dateTime={article.publishedAt}>{article.date}</time>
              {author?.name ? (
                <>
                  <span className="art-dot" aria-hidden="true" />
                  <span>{author.name}</span>
                </>
              ) : null}
              <span className="art-dot" aria-hidden="true" />
              <span>{article.minutes} perc olvasás</span>
            </p>
          </div>
          <div className="art-head-brush" aria-hidden="true">
            <BrushRibbon opacity={0.65} />
          </div>
        </header>

        {image ? (
          <figure className="art-hero wrap">
            <Image
              data={image}
              sizes="(min-width: 1200px) 1100px, 100vw"
              loading="eager"
              className="art-hero-img"
            />
            {image.altText ? (
              <figcaption className="art-cap">{image.altText}</figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="wrap art-body">
          <div
            className="art-prose"
            dangerouslySetInnerHTML={{__html: contentHtml}}
          />

          <footer className="art-foot">
            {tags?.length ? (
              <ul className="art-tags">
                {tags.map((tag) => (
                  <li className="art-tag" key={tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
            <Link className="art-back" to={`/blogs/${blog.handle}`}>
              ← {BLOG_TEXT.back}
            </Link>
          </footer>

          <section className="art-news" aria-label="Hírlevél">
            <div className="art-news-copy">
              <p className="kicker">
                <span className="kanji">改善</span>— Hírlevél
              </p>
              <h2 className="art-news-h display">
                Heti egy levél. Semmi zaj.
              </h2>
              <p className="art-news-p">
                Az új írásokról és az új darabokról elsőként ott szólunk.
              </p>
            </div>
            <NewsletterForm
              className="art-form"
              label="Hírlevél feliratkozás a bejegyzés alatt"
            />
          </section>
        </div>
      </article>

      {related.length ? (
        <section className="art-rel wrap" aria-labelledby="art-rel-h">
          <div className="art-rel-head">
            <h2 id="art-rel-h" className="art-rel-h display">
              {BLOG_TEXT.more}
            </h2>
            <Link className="art-rel-all" to={`/blogs/${blog.handle}`}>
              {BLOG_TEXT.all} {I.arrow}
            </Link>
          </div>
          <div className="blg-grid">
            {related.map((item) => (
              <ArticleCard article={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/blog#field-blog-articlebyhandle
const ARTICLE_QUERY = `#graphql
  query Article(
    $articleHandle: String!
    $blogHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        handle
        title
        contentHtml
        excerpt
        tags
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
        seo {
          description
          title
        }
      }
      articles(first: 4, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          ...ArticleCard
        }
      }
    }
  }
  ${ARTICLE_CARD_FRAGMENT}
`;

/** @typedef {import('./+types/blogs.$blogHandle.$articleHandle').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
