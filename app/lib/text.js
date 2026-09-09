/**
 * Shared Hungarian UI copy for the storefront (PDP, collections, cart).
 * Account copy lives in `accountText.js`. Keep this file the single place
 * to change wording so the purchase path never mixes languages.
 */

export const TEXT = {
  allProducts: 'Összes termék',
  addToCart: 'Kosárba',
  adding: 'Hozzáadás…',
  soldOut: 'Elfogyott',
  detail: 'A részletek',
  productImages: 'Termékképek',
  viewImage: 'Kép megtekintése',
  productImage: 'Termékkép',
  collection: 'Kollekció',
  category: 'Kategória',
  colour: 'Szín',
  size: 'Méret',
  all: 'Összes',
  sort: 'Rendezés',
  itemsOne: 'termék',
  itemsMany: 'termék',
  featured: 'Kiemelt',
  sortNewest: 'Legújabb',
  sortPriceAsc: 'Ár: alacsonytól',
  sortPriceDesc: 'Ár: magastól',
  sortBestSelling: 'Legkelendőbb',
  sortAlpha: 'Név: A–Z',
};

/**
 * Localised option names. Shopify option names are set in admin (often in
 * English); map the common ones so the UI reads Hungarian either way.
 */
const OPTION_NAMES = {
  color: 'Szín',
  colour: 'Szín',
  szín: 'Szín',
  size: 'Méret',
  méret: 'Méret',
  material: 'Anyag',
  style: 'Fazon',
};

/** @param {string} name */
export function optionName(name) {
  return OPTION_NAMES[String(name).trim().toLowerCase()] ?? name;
}

/** True for size-like option names in any supported language. */
/** @param {string} name */
export function isSizeOption(name) {
  return /size|méret/i.test(String(name));
}

/** Localised product types shown as the PDP eyebrow / showcase spec line. */
const PRODUCT_TYPES = {
  't-shirt': 'Póló',
  tshirt: 'Póló',
  tee: 'Póló',
  shirt: 'Póló',
  top: 'Top',
  hat: 'Sapka',
  cap: 'Sapka',
  snapback: 'Sapka',
  hoodie: 'Pulóver',
  sweatshirt: 'Pulóver',
  pants: 'Nadrág',
  shorts: 'Rövidnadrág',
  accessories: 'Kiegészítő',
  accessory: 'Kiegészítő',
};

/** @param {string | null | undefined} type */
export function productType(type) {
  if (!type) return '';
  return PRODUCT_TYPES[String(type).trim().toLowerCase()] ?? type;
}

/** Localised, ordered size values (S → M → L …) regardless of admin order. */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];

/**
 * Sort size names by the conventional scale; unknown sizes keep their
 * relative order after the known ones.
 * @param {string[]} values
 */
export function sortSizes(values) {
  const rank = (v) => {
    const i = SIZE_ORDER.indexOf(String(v).trim().toUpperCase());
    return i === -1 ? SIZE_ORDER.length : i;
  };
  return [...values].sort((a, b) => rank(a) - rank(b));
}

/** @param {number} n */
export function itemCount(n) {
  return `${n} ${n === 1 ? TEXT.itemsOne : TEXT.itemsMany}`;
}

/** Hungarian titles for the store collections, keyed by handle. */
const COLLECTION_TITLES = {
  men: 'Férfi',
  women: 'Női',
  accessories: 'Kiegészítők',
  unisex: 'Unisex',
  all: 'Összes termék',
};

/**
 * @param {{handle: string, title?: string | null}} collection
 */
export function collectionTitle(collection) {
  return COLLECTION_TITLES[collection.handle] ?? collection.title ?? '';
}
