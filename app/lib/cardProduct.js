/**
 * Storefront product → `ProductCard` data. Shared by every place that lists
 * products as cards (collection grid, related products), together with the
 * fragment that fetches exactly the fields the mapping needs.
 */

/**
 * Option names treated as the product's colour axis, both for the card
 * swatches and for the colour filter.
 */
const COLOR_OPTION_NAMES = new Set(['szín', 'color', 'colour']);

/** Fallback hexes for colour names without a configured admin swatch. */
const COLOR_HEX = {
  fekete: '#1b1916',
  black: '#1b1916',
  fehér: '#e7e1d4',
  white: '#e7e1d4',
  bone: '#e7e1d4',
  szürke: '#7c776e',
  grey: '#7c776e',
  gray: '#7c776e',
  piros: '#a32e13',
  red: '#a32e13',
  olíva: '#55543f',
  olive: '#55543f',
};

/**
 * The product's colour option values, preferring the admin-configured
 * swatch colour and falling back to a named-colour hex. Values without a
 * resolvable hex are kept (they still filter) but get `hex: null`.
 */
function productColors(options) {
  const colorOption = (options ?? []).find((o) =>
    COLOR_OPTION_NAMES.has(o.name.toLowerCase()),
  );
  if (!colorOption) return [];
  return colorOption.optionValues.map((v) => ({
    name: v.name,
    hex: v.swatch?.color || COLOR_HEX[v.name.toLowerCase()] || null,
  }));
}

/**
 * @param {import('storefrontapi.generated').CardProductFragment} p
 */
export function toCardProduct(p) {
  const colorValues = productColors(p.options);
  return {
    id: p.id,
    handle: p.handle,
    name: p.title,
    price: Number(p.priceRange.minVariantPrice.amount),
    image: p.featuredImage,
    tag: null,
    type: p.productType || null,
    colorNames: colorValues.map((c) => c.name),
    colors: colorValues.filter((c) => c.hex),
  };
}

export const CARD_PRODUCT_FRAGMENT = `#graphql
  fragment CardProduct on Product {
    id
    handle
    title
    productType
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    options {
      name
      optionValues {
        name
        swatch {
          color
        }
      }
    }
  }
`;
