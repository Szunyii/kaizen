/**
 * Hungarian display helpers for the account section.
 * The Customer Account API returns status enums in English; map the ones
 * customers actually see, fall back to the raw value for anything else.
 */

/** @type {Record<string, string>} */
export const STATUS_HU = {
  // financial status
  PAID: 'Fizetve',
  PENDING: 'Fizetésre vár',
  AUTHORIZED: 'Engedélyezve',
  PARTIALLY_PAID: 'Részben fizetve',
  PARTIALLY_REFUNDED: 'Részben visszatérítve',
  REFUNDED: 'Visszatérítve',
  VOIDED: 'Érvénytelenítve',
  // fulfillment status
  SUCCESS: 'Kiszállítva',
  OPEN: 'Feldolgozás alatt',
  IN_PROGRESS: 'Folyamatban',
  PENDING_FULFILLMENT: 'Csomagolásra vár',
  FULFILLED: 'Kiszállítva',
  UNFULFILLED: 'Feldolgozás alatt',
  PARTIALLY_FULFILLED: 'Részben kiszállítva',
  ON_HOLD: 'Felfüggesztve',
  SCHEDULED: 'Ütemezve',
  CANCELLED: 'Törölve',
  FAILURE: 'Sikertelen',
  ERROR: 'Hiba',
};

const dateFormat = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/**
 * @param {string | Date} value ISO date string from the API
 */
export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}
