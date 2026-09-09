import {Link, redirect, useLoaderData} from 'react-router';
import {Money, Image} from '@shopify/hydrogen';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import {formatDate, STATUS_HU} from '~/lib/accountText';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [{title: `KaizenType — Rendelés ${data?.order?.name}`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({params, context}) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors} = await customerAccount.query(CUSTOMER_ORDER_QUERY, {
    variables: {
      orderId,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2' ? firstDiscount : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? firstDiscount.percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

export default function OrderRoute() {
  /** @type {LoaderReturnData} */
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData();
  return (
    <div>
      <Link className="acct-back" to="/account/orders">
        ← Vissza a rendelésekhez
      </Link>
      <div className="acct-order-head">
        <h2 className="acct-order-num">Rendelés {order.name}</h2>
        {fulfillmentStatus && fulfillmentStatus !== 'N/A' && (
          <span className="acct-chip">{STATUS_HU[fulfillmentStatus] ?? fulfillmentStatus}</span>
        )}
      </div>
      <p className="acct-order-sub">
        Leadva: {formatDate(order.processedAt)}
        {order.confirmationNumber
          ? ` · Visszaigazolás: ${order.confirmationNumber}`
          : ''}
      </p>

      <div className="acct-order-detail">
        <div>
          <div className="acct-lines">
            {lineItems.map((lineItem, lineItemIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
            ))}
          </div>
          <div className="acct-totals">
            {((discountValue && discountValue.amount) ||
              discountPercentage) && (
              <div className="acct-total-row">
                <span>Kedvezmény</span>
                {discountPercentage ? (
                  <span>−{discountPercentage}%</span>
                ) : (
                  discountValue && <Money data={discountValue} />
                )}
              </div>
            )}
            {order.subtotal && (
              <div className="acct-total-row">
                <span>Részösszeg</span>
                <Money data={order.subtotal} />
              </div>
            )}
            {order.totalTax && (
              <div className="acct-total-row">
                <span>Adó</span>
                <Money data={order.totalTax} />
              </div>
            )}
            <div className="acct-total-row grand">
              <span>Összesen</span>
              <Money data={order.totalPrice} />
            </div>
          </div>
        </div>
        <aside className="acct-aside">
          <div>
            <h3>Szállítási cím</h3>
            {order?.shippingAddress ? (
              <address>
                <p>{order.shippingAddress.name}</p>
                {order.shippingAddress.formatted ? (
                  <p>{order.shippingAddress.formatted}</p>
                ) : (
                  ''
                )}
                {order.shippingAddress.formattedArea ? (
                  <p>{order.shippingAddress.formattedArea}</p>
                ) : (
                  ''
                )}
              </address>
            ) : (
              <p>Nincs megadva szállítási cím</p>
            )}
          </div>
          {fulfillmentStatus && fulfillmentStatus !== 'N/A' && (
            <div>
              <h3>Állapot</h3>
              <span className="acct-chip">{STATUS_HU[fulfillmentStatus] ?? fulfillmentStatus}</span>
            </div>
          )}
          <a
            className="btn"
            target="_blank"
            href={order.statusPageUrl}
            rel="noreferrer"
          >
            Rendelés követése
          </a>
        </aside>
      </div>
    </div>
  );
}

/**
 * @param {{lineItem: OrderLineItemFullFragment}}
 */
function OrderLineRow({lineItem}) {
  return (
    <div className="acct-line">
      {lineItem?.image ? (
        <Image data={lineItem.image} width={72} height={72} />
      ) : (
        <div className="acct-line-ph" />
      )}
      <div>
        <p className="acct-line-title">{lineItem.title}</p>
        {lineItem.variantTitle && (
          <p className="acct-line-var">{lineItem.variantTitle}</p>
        )}
      </div>
      <div className="acct-line-price">
        {lineItem.price && <Money data={lineItem.price} />}
        <span>× {lineItem.quantity}</span>
      </div>
    </div>
  );
}

/** @typedef {import('./+types/account.orders.$id').Route} Route */
/** @typedef {import('customer-accountapi.generated').OrderLineItemFullFragment} OrderLineItemFullFragment */
/** @typedef {import('customer-accountapi.generated').OrderQuery} OrderQuery */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
