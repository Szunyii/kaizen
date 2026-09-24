/**
 * Fogyasztóbarát ("consumer friendly") integration: the trust badge loaded
 * from KaizenFooter, and the embed widget or the generated legal documents
 * served from /pages/aszf.
 *
 * Everything the vendor serves is licensed to a domain. Its badge script only
 * renders when `location.host` is on the account's allow-list, and `api.php`
 * only returns a document when the request's Referer/Origin is the licensed
 * site; anything else gets "Hibakód: 1002". Documents are therefore fetched
 * server-side with the licensed site as Referer, which also makes them render
 * on localhost and on Oxygen previews.
 */

export const FOGYASZTOBARAT_ID = 'R7FDJBKH';
export const FOGYASZTOBARAT_ORIGIN = 'https://admin.fogyasztobarat.hu';
/** Badge loader; it reads the widget id from the `#fbarat` element. */
export const FOGYASZTOBARAT_LOADER = `${FOGYASZTOBARAT_ORIGIN}/h-api.js`;
/**
 * Embeddable document loader; it reads the id and document type from the
 * `#fbarat-embed` element and renders the vendor's iframe right after it. The
 * iframe is licensed by the page URL, so it only has content on the licensed
 * site and shows "Hiba kód: 1002" elsewhere.
 */
export const FOGYASZTOBARAT_EMBED_LOADER = `${FOGYASZTOBARAT_ORIGIN}/e-api.js`;
/** The site the badge and the documents are licensed to. */
const LICENSED_SITE = 'https://kaizentype.com/';

// The vendor body carries a <head> (noindex meta), two <style> blocks aimed at
// its own container ids and three <script>s (jQuery TOC-link rewrites and a
// usage ping). None of them belong in our page.
const STRIP = [
  /<head\b[\s\S]*?<\/head>/gi,
  /<style\b[\s\S]*?<\/style>/gi,
  /<script\b[\s\S]*?<\/script>/gi,
];
const LEADING_TITLE = /^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i;
const LEADING_EFFECTIVE =
  /^\s*<p\b[^>]*>(?:(?!<\/p>)[\s\S])*?hatályos ettől a naptól:[\s\S]*?<\/p>\s*/i;
const ISO_DATE = /(\d{4}-\d{2}-\d{2})/;

/**
 * Turns the raw `api.php` body into markup that can be dropped into the page.
 * Returns null for error bodies ("Hibakód: 1002") and anything that is not a
 * document. The vendor's own <h1> and its "hatályos ettől a naptól:
 * YYYY-MM-DD" line are lifted out so the page can render them in its header;
 * an unexpected layout is kept intact rather than guessed at.
 * @param {unknown} raw
 * @returns {{html: string, effectiveDate: string | null} | null}
 */
export function parseDocument(raw) {
  if (typeof raw !== 'string') return null;
  let html = raw;
  for (const re of STRIP) html = html.replace(re, '');
  html = html.trim();
  if (!/<h[1-6]\b/i.test(html)) return null;

  let effectiveDate = null;
  const withoutTitle = html.replace(LEADING_TITLE, '');
  if (withoutTitle !== html) {
    html = withoutTitle.replace(LEADING_EFFECTIVE, (line) => {
      effectiveDate = line.match(ISO_DATE)?.[1] ?? null;
      return '';
    });
  }
  return {html, effectiveDate};
}

const HU_DATE = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * `2026-09-23` → `2026. szeptember 23.`
 * @param {unknown} iso
 * @returns {string | null}
 */
export function formatEffectiveDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return HU_DATE.format(date);
}

/**
 * Loads a generated document (currently only `aszf`) through Hydrogen's cached
 * fetch. Only parsed documents are cached, so a vendor outage or an error body
 * is retried on the next request instead of being served for an hour.
 * @param {{
 *   withCache: import('@shopify/hydrogen').WithCache,
 *   storefront: {CacheLong: () => import('@shopify/hydrogen').CachingStrategy},
 * }} context
 * @param {'aszf'} type
 * @returns {Promise<{html: string, effectiveDate: string | null} | null>}
 */
export async function fetchFogyasztobaratDocument(context, type) {
  const url = `${FOGYASZTOBARAT_ORIGIN}/api.php?${type}=${FOGYASZTOBARAT_ID}`;
  try {
    const {data} = await context.withCache.fetch(
      url,
      {headers: {Referer: LICENSED_SITE, Accept: 'text/html'}},
      {
        displayName: `Fogyasztóbarát ${type}`,
        cacheKey: ['fogyasztobarat', type, FOGYASZTOBARAT_ID],
        cacheStrategy: context.storefront.CacheLong(),
        shouldCacheResponse: (body, response) =>
          response.ok && parseDocument(body) !== null,
      },
    );
    return parseDocument(data);
  } catch (error) {
    console.error(`[fogyasztobarat] ${type} fetch failed`, error);
    return null;
  }
}
