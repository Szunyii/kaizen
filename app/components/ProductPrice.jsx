import {formatMoney} from '~/lib/money';

/**
 * Renders a price, plus the compare-at price struck through when on sale.
 * Uses the shared deterministic formatter instead of Hydrogen's `<Money>`
 * so server and client output match (see app/lib/money.js).
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  return (
    <div aria-label="Price" className="product-price" role="group">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <span>{formatMoney(price)}</span> : null}
          <s>{formatMoney(compareAtPrice)}</s>
        </div>
      ) : price ? (
        <span>{formatMoney(price)}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
