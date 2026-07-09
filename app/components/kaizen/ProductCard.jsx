import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {StudioShot} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {ft} from '~/lib/kaizen-data';

/**
 * KAIZENTYPE product card. Links to the product detail route; the hover CTA
 * is a visual affordance that follows the same link. Renders the real
 * Storefront product image when available, otherwise the studio placeholder.
 * @param {{product: import('~/lib/kaizen-data').KaizenProduct & {image?: any}, idx?: number}} props
 */
export function ProductCard({product, idx = 0}) {
  const delay = `reveal-d${(idx % 3) + 1}`;
  return (
    <Link
      to={`/products/${product.handle}`}
      className={`pcard reveal ${delay}`}
      aria-label={product.name}
    >
      <div className="pcard-media">
        {product.tag ? (
          <span className={`pcard-tag ${product.tag.red ? 'tag-red' : ''}`}>
            {product.tag.label}
          </span>
        ) : null}
        {product.image ? (
          <Image
            className="pcard-img"
            alt={product.image.altText || product.name}
            aspectRatio="3/4"
            data={product.image}
            sizes="(min-width: 980px) 33vw, 50vw"
          />
        ) : (
          <StudioShot product={product} ratio="3 / 4" showType={false} />
        )}
        <span className="pcard-cta">
          View product {I.arrow}
        </span>
      </div>
      <div className="pcard-info">
        <span className="pcard-name">{product.name}</span>
        <div className="pcard-meta">
          <span className="pcard-price">{ft(product.price)}</span>
          <span className="pcard-swatches">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.name}
                className="sw"
                style={{background: c.hex}}
                title={c.name}
              />
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
