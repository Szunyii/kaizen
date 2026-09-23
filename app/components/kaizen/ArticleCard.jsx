import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {I} from '~/components/kaizen/Icons';
import {BLOG_TEXT} from '~/lib/blog';

/**
 * One blog post as a card. The `featured` variant lays the image and the
 * copy side by side for the lead story; everything else is the same card
 * stacked, so a grid of them stays visually consistent.
 *
 * @param {{
 *   article: ReturnType<typeof import('~/lib/blog').toArticleCard>,
 *   featured?: boolean,
 *   eager?: boolean,
 *   headingLevel?: 'h2' | 'h3',
 * }} props
 */
export function ArticleCard({
  article,
  featured = false,
  eager = false,
  headingLevel = 'h3',
}) {
  const Heading = headingLevel;
  return (
    <Link
      className={`acard${featured ? ' acard-feat' : ''}`}
      to={article.to}
      prefetch="intent"
    >
      <div className="acard-media">
        {article.image ? (
          <Image
            alt={article.image.altText || article.title}
            aspectRatio={featured ? '4/3' : '3/2'}
            data={article.image}
            loading={eager ? 'eager' : 'lazy'}
            sizes={
              featured
                ? '(min-width: 1000px) 55vw, 100vw'
                : '(min-width: 1000px) 33vw, (min-width: 640px) 50vw, 100vw'
            }
            className="acard-img"
          />
        ) : (
          <div className="acard-ph" aria-hidden="true">
            <span>{BLOG_TEXT.kanji}</span>
          </div>
        )}
        {article.tag ? <span className="acard-tag">{article.tag}</span> : null}
      </div>

      <div className="acard-body">
        <p className="acard-meta">
          <time dateTime={article.publishedAt}>{article.date}</time>
          <span className="acard-dot" aria-hidden="true" />
          <span>{article.minutes} perc olvasás</span>
        </p>
        <Heading className="acard-h display">{article.title}</Heading>
        {article.excerpt ? (
          <p className="acard-x">{article.excerpt}</p>
        ) : null}
        <span className="acard-cta">
          {BLOG_TEXT.readMore} {I.arrow}
        </span>
      </div>
    </Link>
  );
}
