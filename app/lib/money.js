/**
 * Deterministic price formatting shared by the storefront.
 *
 * Hydrogen's `<Money>` relies on `Intl.NumberFormat`, and the ICU data in the
 * Oxygen/Node runtime disagrees with browsers about HUF fraction digits
 * ("HUF 9,900.00" on the server vs "HUF 9,900" in Chrome). That mismatch
 * throws a hydration error on every page that renders a price while the
 * cart has items. Formatting HUF by hand keeps server and client identical.
 *
 * @param {{amount: string | number, currencyCode: string} | null | undefined} price
 * @returns {string} e.g. "9 900 Ft" for HUF, Intl formatting otherwise
 */
export function formatMoney(price) {
  if (!price) return '';
  const amount = Number(price.amount);
  if (Number.isNaN(amount)) return '';
  if (price.currencyCode === 'HUF') {
    return `${Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`;
  }
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: price.currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}
