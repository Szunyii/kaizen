import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  nonReturnableMessage,
  parseReturnForm,
  reasonLabel,
  returnErrorMessage,
  RETURN_ERROR_DEFAULT,
  RETURN_FIELDS,
  RETURN_TEXT,
} from './returns.js';

const ORDER = 'gid://shopify/Order/1001';
const LINE_A = 'gid://shopify/LineItem/11';
const LINE_B = 'gid://shopify/LineItem/12';
const REASON = 'gid://shopify/ReturnReasonDefinition/7';

/** @param {Array<[string, string]>} entries */
function formOf(entries) {
  const form = new FormData();
  for (const [key, value] of entries) form.append(key, value);
  return form;
}

test('parseReturnForm builds the mutation input from the selected rows', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '2'],
      [`${RETURN_FIELDS.REASON_PREFIX}${LINE_A}`, REASON],
      [RETURN_FIELDS.ITEM, LINE_B],
      [RETURN_FIELDS.NOTE, '  Kicsi lett.  '],
    ]),
  );
  assert.equal(result.error, null);
  assert.equal(result.orderId, ORDER);
  assert.deepEqual(result.requestedLineItems, [
    {
      lineItemId: LINE_A,
      quantity: 2,
      returnReasonDefinitionId: REASON,
      customerNote: 'Kicsi lett.',
    },
    {lineItemId: LINE_B, quantity: 1, customerNote: 'Kicsi lett.'},
  ]);
});

test('parseReturnForm rejects a missing or malformed order id', () => {
  assert.equal(
    parseReturnForm(formOf([[RETURN_FIELDS.ITEM, LINE_A]])).error,
    RETURN_TEXT.errNoOrder,
  );
  assert.equal(
    parseReturnForm(
      formOf([
        [RETURN_FIELDS.ORDER_ID, 'gid://shopify/Order/1 OR 1=1'],
        [RETURN_FIELDS.ITEM, LINE_A],
      ]),
    ).error,
    RETURN_TEXT.errNoOrder,
  );
});

test('parseReturnForm needs at least one valid line', () => {
  const empty = parseReturnForm(formOf([[RETURN_FIELDS.ORDER_ID, ORDER]]));
  assert.equal(empty.error, RETURN_TEXT.errNoItems);
  assert.deepEqual(empty.requestedLineItems, []);

  const junk = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, 'gid://shopify/Product/1'],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '0'],
    ]),
  );
  assert.equal(junk.error, RETURN_TEXT.errNoItems);
});

test('parseReturnForm drops bad quantities, unknown reasons and duplicates', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [RETURN_FIELDS.ITEM, LINE_A],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_A}`, '1.5'],
      [RETURN_FIELDS.ITEM, LINE_B],
      [`${RETURN_FIELDS.QUANTITY_PREFIX}${LINE_B}`, '3'],
      [`${RETURN_FIELDS.REASON_PREFIX}${LINE_B}`, 'too-small'],
    ]),
  );
  assert.equal(result.error, null);
  assert.deepEqual(result.requestedLineItems, [
    {lineItemId: LINE_B, quantity: 3},
  ]);
});

test('parseReturnForm caps the note at 500 characters', () => {
  const result = parseReturnForm(
    formOf([
      [RETURN_FIELDS.ORDER_ID, ORDER],
      [RETURN_FIELDS.ITEM, LINE_A],
      [RETURN_FIELDS.NOTE, 'x'.repeat(600)],
    ]),
  );
  assert.equal(result.requestedLineItems[0].customerNote.length, 500);
});

test('returnErrorMessage maps known codes and falls back to the generic text', () => {
  assert.match(
    returnErrorMessage({code: 'FEATURE_NOT_ENABLED', message: 'x'}),
    /nem elérhető/,
  );
  assert.equal(
    returnErrorMessage({code: 'TOO_BIG', message: 'x'}),
    RETURN_ERROR_DEFAULT,
  );
  assert.equal(returnErrorMessage(undefined), RETURN_ERROR_DEFAULT);
});

test('nonReturnableMessage picks the most useful reason', () => {
  assert.match(
    nonReturnableMessage({nonReturnableReasons: ['OTHER', 'UNFULFILLED']}),
    /még nem szállítottuk ki/,
  );
  assert.match(
    nonReturnableMessage({nonReturnableReasons: ['RETURN_WINDOW_EXPIRED']}),
    /14 napos/,
  );
  assert.match(nonReturnableMessage(null), /jelenleg nem küldhető vissza/);
});

test('reasonLabel prefers the Hungarian map and falls back to the API name', () => {
  assert.equal(reasonLabel({handle: 'too-small', name: 'Túl kicsi'}), 'Kicsi a méret');
  assert.equal(
    reasonLabel({handle: 'absorbency', name: 'Nedvszívó képesség'}),
    'Nedvszívó képesség',
  );
  assert.equal(reasonLabel(null), '');
});
