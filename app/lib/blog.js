/**
 * Storefront article → blog card data, plus the shared Hungarian copy and
 * the small formatters (date, reading time, excerpt) the blog list and the
 * article page both need. Kept next to the fragment that fetches exactly
 * the fields the mapping uses, like `cardProduct.js` does for products.
 */

/** Hungarian UI copy for the blog routes. */
export const BLOG_TEXT = {
  kicker: 'Napló',
  kanji: '日誌',
  lead:
    'Rövid írások a mesterségről, az anyagokról és arról, ami éppen készül a budapesti műhelyben.',
  readMore: 'Tovább olvasom',
  latest: 'Legfrissebb',
  all: 'Minden bejegyzés',
  more: 'További írások',
  newer: 'Frissebbek',
  older: 'Korábbiak',
  loading: 'Töltés…',
  back: 'Vissza a naplóhoz',
  emptyTitle: 'Hamarosan',
};

/** Fields every article card needs. */
export const ARTICLE_CARD_FRAGMENT = `#graphql
  fragment ArticleCard on Article {
    id
    handle
    title
    excerpt
    content
    publishedAt
    tags
    author: authorV2 {
      name
    }
    image {
      id
      altText
      url
      width
      height
    }
    blog {
      handle
    }
  }
`;

const WORDS_PER_MINUTE = 200;

/**
 * Plain text from an article body. Accepts either `content` (already plain,
 * what the card query fetches) or `contentHtml` (the article page), so both
 * the excerpt and the word count come from one helper.
 * @param {string | null | undefined} html
 */
function toPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reading time in whole minutes, never less than one.
 * @param {string | null | undefined} html
 */
export function readingMinutes(html) {
  const words = toPlainText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * `2026. szeptember 22.` — the Hungarian long date.
 * @param {string | null | undefined} publishedAt
 */
export function formatArticleDate(publishedAt) {
  if (!publishedAt) return '';
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(publishedAt));
}

/**
 * The article's own excerpt when the editor wrote one, otherwise the first
 * sentences of the body cut at a word boundary.
 * @param {{excerpt?: string | null, content?: string | null, contentHtml?: string | null}} article
 * @param {number} [max]
 */
export function articleExcerpt(article, max = 180) {
  const written = article.excerpt?.trim();
  if (written) return written;
  const text = toPlainText(article.content ?? article.contentHtml);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).trimEnd()}…`;
}

/**
 * @param {import('storefrontapi.generated').ArticleCardFragment} article
 */
export function toArticleCard(article) {
  return {
    id: article.id,
    handle: article.handle,
    title: article.title,
    to: `/blogs/${article.blog.handle}/${article.handle}`,
    image: article.image ?? null,
    author: article.author?.name ?? null,
    publishedAt: article.publishedAt,
    date: formatArticleDate(article.publishedAt),
    minutes: readingMinutes(article.content),
    excerpt: articleExcerpt(article),
    tag: article.tags?.[0] ?? null,
  };
}
