/**
 * Visszaküldés (returns) helpers for /pages/visszakuldes: Hungarian labels
 * for the Customer Account API return enums and the parser of the
 * return-request form. Pure functions only, so they run under `npm test`.
 */

/** Form field names shared by the page and the parser. */
export const RETURN_FIELDS = {
  ORDER_ID: 'orderId',
  /** Repeated: the LineItem ids of the selected rows. */
  ITEM: 'item',
  /** `qty:<lineItemId>`; missing means one unit. */
  QUANTITY_PREFIX: 'qty:',
  /** `reason:<lineItemId>`; a ReturnReasonDefinition id or empty. */
  REASON_PREFIX: 'reason:',
  /** One note for the whole request, copied onto every line. */
  NOTE: 'note',
};

export const NOTE_MAX_LENGTH = 500;

const ORDER_GID = /^gid:\/\/shopify\/Order\/\d+$/;
const LINE_ITEM_GID = /^gid:\/\/shopify\/LineItem\/\d+$/;
const REASON_GID = /^gid:\/\/shopify\/ReturnReasonDefinition\/\d+$/;

export const RETURN_TEXT = {
  errNoItems: 'Jelölj ki legalább egy terméket.',
  errNoOrder:
    'Nem találjuk a rendelést. Frissítsd az oldalt, és próbáld újra.',
  errNotLoggedIn:
    'Lejárt a bejelentkezésed. Lépj be újra, és próbáld meg még egyszer.',
};

/** Customer Account API `ReturnStatus` → chip label. */
export const RETURN_STATUS_HU = {
  REQUESTED: 'Elbírálás alatt',
  OPEN: 'Jóváhagyva',
  CLOSED: 'Lezárva',
  DECLINED: 'Elutasítva',
  CANCELED: 'Visszavonva',
};

/** `ReturnDeclineReason` → what to tell the customer. */
export const DECLINE_HU = {
  FINAL_SALE: 'a tétel nem küldhető vissza',
  RETURN_PERIOD_ENDED: 'lejárt a visszaküldési időszak',
  OTHER: '',
};

/**
 * `NonReturnableReason` → why an order has nothing to return, most useful
 * first: an unshipped order is a matter of time, an expired window is not.
 */
const NON_RETURNABLE_HU = [
  [
    'UNFULFILLED',
    'Ezt a rendelést még nem szállítottuk ki. A visszaküldést az átvétel után tudod kérni.',
  ],
  [
    'RETURN_WINDOW_EXPIRED',
    'Ennél a rendelésnél lejárt a 14 napos visszaküldési időszak.',
  ],
  [
    'RETURNED',
    'Ebből a rendelésből minden visszaküldhető darabra van már visszaküldés.',
  ],
  ['FINAL_SALE', 'Ennek a rendelésnek a tételei nem küldhetők vissza.'],
];
const NON_RETURNABLE_DEFAULT =
  'Ez a rendelés jelenleg nem küldhető vissza. Ha kérdésed van, írj nekünk a rendelésszámmal.';

/**
 * @param {{nonReturnableReasons?: string[] | null} | null | undefined} summary
 *   `Order.returnInformation.nonReturnableSummary`
 */
export function nonReturnableMessage(summary) {
  const reasons = summary?.nonReturnableReasons ?? [];
  const hit = NON_RETURNABLE_HU.find(([code]) => reasons.includes(code));
  return hit ? hit[1] : NON_RETURNABLE_DEFAULT;
}

/**
 * Labels by `ReturnReasonDefinition.handle`. The API localises `name` for
 * the shop's primary locale (hu), but its wording is generic ("Túl kicsi",
 * "Megondoltam magam"); these read like the rest of the site, and the API
 * name covers every other handle.
 */
const REASON_HU = {
  'too-small': 'Kicsi a méret',
  'too-big': 'Nagy a méret',
  'changed-my-mind': 'Meggondoltam magam',
  'item-not-as-described': 'Nem olyan, mint a leírásban',
  'received-the-wrong-item': 'Nem ezt rendeltem',
  'damaged-or-defective': 'Sérült vagy hibás',
  'arrived-late': 'Későn érkezett',
  style: 'Nem tetszik a fazon',
  color: 'Nem tetszik a szín',
  quality: 'Minőség',
  comfort: 'Kényelem',
  'other-reason': 'Egyéb',
  unknown: 'Egyéb',
};

/**
 * @param {{handle?: string | null, name?: string | null} | null | undefined} definition
 */
export function reasonLabel(definition) {
  if (!definition) return '';
  return REASON_HU[definition.handle ?? ''] ?? definition.name ?? '';
}

/** `ReturnErrorCode` → message; anything else gets the generic one. */
const ERROR_HU = {
  FEATURE_NOT_ENABLED:
    'A visszaküldés kérése jelenleg nem elérhető az oldalon. Írj nekünk a rendelésszámmal, és kézzel intézzük.',
  NOT_FOUND:
    'Nem találjuk a rendelést vagy a kijelölt tételt. Frissítsd az oldalt, és próbáld újra.',
  INVALID_STATE: 'Ez a rendelés jelenleg nem küldhető vissza.',
  ALREADY_EXISTS: 'Erre a tételre már van folyamatban visszaküldés.',
  NOT_AUTHORIZED:
    'Ehhez a rendeléshez nincs hozzáférésed. Lépj be azzal az e-mail címmel, amivel rendeltél.',
};
export const RETURN_ERROR_DEFAULT =
  'Nem sikerült elküldeni a kérést. Próbáld újra, vagy írj nekünk a rendelésszámmal.';

/**
 * @param {{code?: string | null, message?: string} | null | undefined} userError
 *   first entry of `orderRequestReturn.userErrors`
 */
export function returnErrorMessage(userError) {
  return ERROR_HU[userError?.code ?? ''] ?? RETURN_ERROR_DEFAULT;
}

/**
 * Reads the return-request form (field names in RETURN_FIELDS) into the
 * `orderRequestReturn` input. Malformed ids and quantities are dropped
 * rather than sent on; the API validates the rest against the order.
 * @param {FormData} form
 * @returns {{orderId: string, requestedLineItems: RequestedLineItem[], error: string | null}}
 */
export function parseReturnForm(form) {
  const orderId = String(form.get(RETURN_FIELDS.ORDER_ID) ?? '').trim();
  if (!ORDER_GID.test(orderId)) {
    return {orderId: '', requestedLineItems: [], error: RETURN_TEXT.errNoOrder};
  }
  const note = String(form.get(RETURN_FIELDS.NOTE) ?? '')
    .trim()
    .slice(0, NOTE_MAX_LENGTH);

  const seen = new Set();
  /** @type {RequestedLineItem[]} */
  const requestedLineItems = [];
  for (const raw of form.getAll(RETURN_FIELDS.ITEM)) {
    const lineItemId = String(raw).trim();
    if (!LINE_ITEM_GID.test(lineItemId) || seen.has(lineItemId)) continue;
    seen.add(lineItemId);
    const quantity = parseQuantity(
      form.get(RETURN_FIELDS.QUANTITY_PREFIX + lineItemId),
    );
    if (!quantity) continue;
    const reason = String(
      form.get(RETURN_FIELDS.REASON_PREFIX + lineItemId) ?? '',
    ).trim();
    /** @type {RequestedLineItem} */
    const line = {lineItemId, quantity};
    if (REASON_GID.test(reason)) line.returnReasonDefinitionId = reason;
    if (note) line.customerNote = note;
    requestedLineItems.push(line);
  }

  if (!requestedLineItems.length) {
    return {orderId, requestedLineItems, error: RETURN_TEXT.errNoItems};
  }
  return {orderId, requestedLineItems, error: null};
}

/**
 * A missing quantity means one unit (the select is only rendered for lines
 * with more than one returnable unit); anything that is not a small
 * positive integer is rejected.
 * @param {FormDataEntryValue | null} value
 */
function parseQuantity(value) {
  if (value === null || value === undefined || value === '') return 1;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : 0;
}

/**
 * @typedef {{
 *   lineItemId: string,
 *   quantity: number,
 *   returnReasonDefinitionId?: string,
 *   customerNote?: string,
 * }} RequestedLineItem
 */
