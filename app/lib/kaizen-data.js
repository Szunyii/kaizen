/**
 * KAIZENTYPE — mock catalogue data.
 * Standalone prototype data used by the homepage while no store is linked.
 */

/** Format a forint amount with a space thousands separator, e.g. 15000 -> "15 000 Ft". */
export function ft(n) {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`;
}

const C = {
  black: {name: 'Black', hex: '#1b1916'},
  bone: {name: 'Bone', hex: '#e7e1d4'},
  red: {name: 'Jam', hex: '#a32e13'},
  grey: {name: 'Ash', hex: '#7c776e'},
  olive: {name: 'Olive', hex: '#55543f'},
};

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/** @type {KaizenProduct[]} */
export const PRODUCTS = [
  {
    id: 'k-top-reverse',
    handle: 'kaizen-top-reverse-print',
    name: 'Kaizen Top — Reverse Print',
    cat: 'women',
    type: 'crop',
    price: 15000,
    tag: {label: 'New', red: true},
    colors: [C.bone, C.black, C.grey],
    sizes: APPAREL_SIZES,
    rating: 5,
    reviews: 48,
    blurb:
      'A boxy, cropped heavyweight tee with the reversed kaizen mark across the chest. Pre-shrunk, garment-dyed, built to soften with every wash.',
    specs: [
      ['Weight', '240 gsm'],
      ['Fabric', '100% combed cotton'],
      ['Fit', 'Boxy / cropped'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-top-red',
    handle: 'kaizen-top-red-print',
    name: 'Kaizen Top — Red Print',
    cat: 'women',
    type: 'crop',
    price: 15000,
    tag: null,
    colors: [C.black, C.bone],
    sizes: APPAREL_SIZES,
    rating: 5,
    reviews: 31,
    blurb:
      'The signature crop in deep ink with the red kaizen print. Cut for movement, finished with a clean rib collar.',
    specs: [
      ['Weight', '240 gsm'],
      ['Fabric', '100% combed cotton'],
      ['Fit', 'Boxy / cropped'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-rambo-red',
    handle: 'kaizen-rambo-cut-red-print',
    name: 'Kaizen Rambo Cut — Red Print',
    cat: 'men',
    type: 'tee',
    price: 15000,
    tag: {label: 'Bestseller', red: false},
    colors: [C.black, C.olive, C.grey],
    sizes: APPAREL_SIZES,
    rating: 4,
    reviews: 64,
    blurb:
      'Sleeveless, dropped-armhole muscle cut in heavyweight jersey. The red kaizen line print runs the chest. Made to be worn into the work.',
    specs: [
      ['Weight', '240 gsm'],
      ['Fabric', '100% combed cotton'],
      ['Fit', 'Muscle / sleeveless'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-hoodie-ink',
    handle: 'kaizen-heavy-hoodie-ink',
    name: 'Kaizen Heavy Hoodie — Ink',
    cat: 'men',
    type: 'hoodie',
    price: 28000,
    tag: null,
    colors: [C.black, C.grey, C.olive],
    sizes: APPAREL_SIZES,
    rating: 5,
    reviews: 22,
    blurb:
      'A 420 gsm brushed-back hoodie with a lined hood and the embroidered enso at the cuff. Heavyweight, honest, made to last.',
    specs: [
      ['Weight', '420 gsm'],
      ['Fabric', '80% cotton / 20% poly'],
      ['Fit', 'Relaxed'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-pants-utility',
    handle: 'kaizen-utility-pants',
    name: 'Kaizen Utility Pants',
    cat: 'men',
    type: 'pants',
    price: 32000,
    tag: null,
    colors: [C.black, C.olive],
    sizes: APPAREL_SIZES,
    rating: 4,
    reviews: 17,
    blurb:
      'Tapered utility trousers in a tough cotton twill with articulated knees and a cinch hem. Function first.',
    specs: [
      ['Weight', '300 gsm twill'],
      ['Fabric', '98% cotton / 2% elastane'],
      ['Fit', 'Tapered'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-leggings',
    handle: 'kaizen-form-leggings',
    name: 'Kaizen Form Leggings',
    cat: 'women',
    type: 'pants',
    price: 22000,
    tag: {label: 'New', red: true},
    colors: [C.black, C.grey],
    sizes: APPAREL_SIZES,
    rating: 5,
    reviews: 39,
    blurb:
      'High-rise compressive leggings in a buttery four-way stretch. Squat-proof, with a hidden waistband pocket.',
    specs: [
      ['Weight', '260 gsm'],
      ['Fabric', '75% nylon / 25% elastane'],
      ['Fit', 'High-rise compressive'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-cap',
    handle: 'kaizen-enso-cap',
    name: 'Kaizen Enso Cap',
    cat: 'accessories',
    type: 'cap',
    price: 9000,
    tag: null,
    colors: [C.black, C.bone, C.red],
    sizes: ['One size'],
    rating: 5,
    reviews: 12,
    blurb:
      'A six-panel washed cotton cap with the embroidered enso at the front and a brass back clasp.',
    specs: [
      ['Fabric', 'Washed cotton'],
      ['Closure', 'Brass clasp'],
      ['Fit', 'Adjustable'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-tote',
    handle: 'kaizen-canvas-tote',
    name: 'Kaizen Canvas Tote',
    cat: 'accessories',
    type: 'bag',
    price: 11000,
    tag: null,
    colors: [C.bone, C.black],
    sizes: ['One size'],
    rating: 4,
    reviews: 8,
    blurb:
      'A heavy 16 oz canvas tote with reinforced straps and the kaizen seal screen-printed on the side.',
    specs: [
      ['Fabric', '16 oz canvas'],
      ['Volume', '20 L'],
      ['Handle drop', '28 cm'],
      ['Made in', 'Budapest'],
    ],
  },
  {
    id: 'k-socks',
    handle: 'kaizen-everyday-socks',
    name: 'Kaizen Everyday Socks',
    cat: 'accessories',
    type: 'socks',
    price: 4500,
    tag: {label: 'Pack of 3', red: false},
    colors: [C.black, C.bone, C.grey],
    sizes: ['39–42', '43–46'],
    rating: 5,
    reviews: 27,
    blurb:
      'A three-pack of cushioned crew socks with arch support and the small enso at the cuff.',
    specs: [
      ['Fabric', 'Combed cotton blend'],
      ['Pack', '3 pairs'],
      ['Cushion', 'Terry footbed'],
      ['Made in', 'Budapest'],
    ],
  },
];

/** @type {KaizenCategory[]} */
export const CATEGORIES = [
  {id: 'men', label: 'Men', sub: 'Tees · Hoodies · Pants', type: 'hoodie'},
  {id: 'women', label: 'Women', sub: 'Crops · Leggings · Tops', type: 'crop'},
  {id: 'accessories', label: 'Accessories', sub: 'Caps · Bags · Socks', type: 'bag'},
];

/** @param {string} catId */
export function productsByCategory(catId) {
  return PRODUCTS.filter((p) => p.cat === catId);
}

/**
 * @typedef {{name:string, hex:string}} KaizenColor
 * @typedef {Object} KaizenProduct
 * @property {string} id
 * @property {string} handle
 * @property {string} name
 * @property {'men'|'women'|'accessories'} cat
 * @property {string} type
 * @property {number} price
 * @property {{label:string, red:boolean}|null} tag
 * @property {KaizenColor[]} colors
 * @property {string[]} sizes
 * @property {number} rating
 * @property {number} reviews
 * @property {string} blurb
 * @property {[string,string][]} specs
 *
 * @typedef {Object} KaizenCategory
 * @property {string} id
 * @property {string} label
 * @property {string} sub
 * @property {string} type
 */
