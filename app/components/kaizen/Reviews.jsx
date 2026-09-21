import {Link} from 'react-router';
import {useReveal} from '~/lib/useReveal';
import {averageRating, formatReviewDate} from '~/lib/reviews';

/** A marquee group needs enough cards to out-span the widest screen. */
const MIN_GROUP = 8;

/** @param {{rating: number}} props */
function Stars({rating}) {
  return (
    <div className="stars" role="img" aria-label={`${rating} csillag az 5-ből`}>
      {'★'.repeat(rating)}
      <span className="stars-off">{'★'.repeat(5 - rating)}</span>
    </div>
  );
}

/**
 * One review as a quote card (the homepage `.voice` card).
 * @param {{review: Review; showProduct?: boolean; hidden?: boolean}} props
 */
function ReviewCard({review, showProduct = false, hidden = false}) {
  const meta = [formatReviewDate(review.date), review.source]
    .filter(Boolean)
    .join(' · ');
  return (
    <figure className="voice review" aria-hidden={hidden || undefined}>
      <span className="voice-mark" aria-hidden="true">
        ”
      </span>
      <div className="review-top">
        <Stars rating={review.rating} />
        {review.sample ? <span className="review-sample">Minta</span> : null}
      </div>
      <blockquote className="voice-q">„{review.text}”</blockquote>
      <figcaption className="voice-who review-who">
        <span className="review-avatar" aria-hidden="true">
          {review.name.charAt(0)}
        </span>
        <span className="review-id">
          <span className="review-name">{review.name}</span>
          {meta ? <span className="review-meta">{meta}</span> : null}
        </span>
        {showProduct && review.productHandle ? (
          <Link
            className="review-product ul"
            to={`/products/${review.productHandle}`}
            tabIndex={hidden ? -1 : undefined}
          >
            {review.productTitle ?? 'Termék'}
          </Link>
        ) : null}
      </figcaption>
    </figure>
  );
}

/**
 * Endless horizontal band of review cards. Two identical groups slide left
 * by one group's width, so the loop is seamless; hovering or focusing pauses
 * it, and reduced motion turns it into a plain scrollable row.
 * @param {{reviews: Review[]}} props
 */
export function ReviewMarquee({reviews}) {
  if (!reviews.length) return null;

  // A short list is repeated so a group never ends mid-screen. Only the
  // first pass of the first group is exposed to assistive tech.
  const group = [];
  while (group.length < MIN_GROUP) group.push(...reviews);

  return (
    <div
      className="review-marquee reveal reveal-d1"
      style={{'--marquee-dur': `${group.length * 8}s`}}
    >
      <div className="review-track">
        {[0, 1].map((copy) => (
          <div className="review-group" key={copy} aria-hidden={copy === 1}>
            {group.map((review, i) => (
              <ReviewCard
                // The same review repeats within a group, so the id alone
                // isn't unique; the list is static, the index is safe.
                // eslint-disable-next-line react/no-array-index-key
                key={`${review.id}-${i}`}
                review={review}
                showProduct
                hidden={copy === 1 || i >= reviews.length}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * "Vélemények" block in the gallery column of the product page (a
 * `.pdp-grid` child). Renders nothing when the product has no reviews.
 * @param {{reviews: Review[]}} props
 */
export function ProductReviews({reviews}) {
  const ref = useReveal();
  if (!reviews.length) return null;
  const average = averageRating(reviews);

  return (
    <section className="pdp-reviews" aria-labelledby="pdp-reviews-h" ref={ref}>
      <p className="kicker reveal">
        <span className="kanji">声</span>— Vásárlóink mondták
      </p>
      <div className="pdp-reviews-head reveal reveal-d1">
        <h2 id="pdp-reviews-h" className="pdp-rel-h display">
          Vélemények
        </h2>
        <p className="pdp-reviews-avg">
          <span className="stars" aria-hidden="true">
            ★
          </span>{' '}
          {average.toFixed(1).replace('.', ',')} · {reviews.length} vélemény
        </p>
      </div>
      <div className="pdp-reviews-list">
        {reviews.map((review, i) => (
          <div className={`reveal reveal-d${Math.min(i + 1, 3)}`} key={review.id}>
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** @typedef {import('~/lib/reviews').Review} Review */
