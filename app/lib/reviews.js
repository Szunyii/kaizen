/**
 * Customer reviews: one list feeds the homepage marquee and the product page
 * block. Add real reviews to REVIEWS as they come in (Google, Instagram,
 * e-mail, the app) — copy the customer's words, don't rewrite them.
 *
 * `sample: true` marks layout placeholders. They carry a visible "Minta"
 * badge and are rendered in development only, so an invented review can never
 * reach customers; a section with no real reviews renders nothing in
 * production.
 *
 * @typedef {{
 *   id: string;
 *   name: string;            // as the customer signed it, e.g. "Márk K."
 *   rating: 1 | 2 | 3 | 4 | 5;
 *   date: string;            // ISO date, YYYY-MM-DD
 *   text: string;
 *   source?: string;         // where it was left, e.g. "Google", "Instagram"
 *   productHandle?: string;  // attaches the review to a product page
 *   productTitle?: string;   // label for the product link on the homepage
 *   sample?: boolean;
 * }} Review
 */

/** @type {Review[]} */
const REVIEWS = [
  // The six "Minta" placeholders below are commented out on request
  // (2026-09-24) so the review sections stay hidden in development too.
  // Uncomment them to check the layout, or replace them with real reviews.
  /*
  {
    id: 'sample-1',
    name: 'Minta Vásárló',
    rating: 5,
    date: '2026-09-01',
    text: 'Minta vélemény. Ide egy valódi vásárló szavai kerülnek: mit vett, mire használja, mi tetszett neki.',
    productHandle: 'discipline-t-shirt',
    productTitle: 'Discipline T-shirt',
    sample: true,
  },
  {
    id: 'sample-2',
    name: 'Minta Vásárló',
    rating: 4,
    date: '2026-09-03',
    text: 'Minta vélemény négy csillaggal. A rövidebb szövegek is jól mutatnak a szalagban.',
    productHandle: 'discipline-t-shirt',
    productTitle: 'Discipline T-shirt',
    sample: true,
  },
  {
    id: 'sample-3',
    name: 'Minta Vásárló',
    rating: 5,
    date: '2026-09-05',
    text: 'Minta vélemény. Egy hosszabb szöveg azt mutatja meg, hogyan törik a kártya több sorban: anyag, szabás, méretezés, szállítás, és hogy ajánlaná-e másnak edzéshez vagy hétköznapra.',
    productHandle: 'resolve-athlete',
    productTitle: 'RESOLVE ATHLETE',
    sample: true,
  },
  {
    id: 'sample-4',
    name: 'Minta Vásárló',
    rating: 5,
    date: '2026-09-08',
    text: 'Minta vélemény a trikóról. Termékhez kötve a termékoldalon is megjelenik.',
    productHandle: 'resolve-athlete',
    productTitle: 'RESOLVE ATHLETE',
    sample: true,
  },
  {
    id: 'sample-5',
    name: 'Minta Vásárló',
    rating: 5,
    date: '2026-09-12',
    text: 'Minta vélemény termék nélkül, például a közösségről vagy az appról. Csak a főoldali szalagban látszik.',
    sample: true,
  },
  {
    id: 'sample-6',
    name: 'Minta Vásárló',
    rating: 4,
    date: '2026-09-15',
    text: 'Minta vélemény a rendelésről és a szállításról. Forrással együtt is megadható.',
    source: 'Google',
    sample: true,
  },
  */
];

/** Reviews that may be shown: samples only while developing. */
function visibleReviews() {
  return import.meta.env.DEV ? REVIEWS : REVIEWS.filter((r) => !r.sample);
}

/** Every review for the homepage marquee, newest first. */
export function allReviews() {
  return [...visibleReviews()].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Reviews attached to one product, newest first.
 * @param {string} handle
 */
export function reviewsFor(handle) {
  return allReviews().filter((r) => r.productHandle === handle);
}

/**
 * Mean rating, or null for an empty list.
 * @param {Review[]} reviews
 */
export function averageRating(reviews) {
  if (!reviews.length) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

/**
 * "2026. szeptember" — month precision, like review sites show it.
 * @param {string} iso
 */
export function formatReviewDate(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}
