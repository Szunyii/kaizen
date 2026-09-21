import {Suspense} from 'react';
import {Await} from 'react-router';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {useReveal} from '~/lib/useReveal';
import {TEXT} from '~/lib/text';

/**
 * "Kapcsolódó termékek" block in the gallery column of the product page (a
 * `.pdp-grid` child — it fills the room a long description leaves under the
 * image). The data is deferred, so it streams in after the buy box and
 * renders nothing at all when there is nothing to recommend (or the request
 * failed).
 * @param {{products: Promise<Array<ReturnType<typeof import('~/lib/cardProduct').toCardProduct>>>}} props
 */
export function RelatedProducts({products}) {
  return (
    <Suspense fallback={null}>
      <Await resolve={products} errorElement={null}>
        {(resolved) =>
          resolved?.length ? <RelatedGrid products={resolved} /> : null
        }
      </Await>
    </Suspense>
  );
}

function RelatedGrid({products}) {
  const ref = useReveal();
  return (
    <section className="pdp-rel" aria-labelledby="pdp-rel-h" ref={ref}>
      <p className="kicker reveal">
        <span className="kanji">縁</span>— {TEXT.relatedKicker}
      </p>
      <h2 id="pdp-rel-h" className="pdp-rel-h display reveal reveal-d1">
        {TEXT.related}
      </h2>
      <div className="grid-4 pdp-rel-grid">
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            idx={i}
            sizes="(min-width: 1101px) 18vw, (min-width: 901px) 26vw, 50vw"
          />
        ))}
      </div>
    </section>
  );
}
