import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {formatDate, STATUS_HU} from '~/lib/accountText';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'KaizenType — Rendelések'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  /** @type {LoaderReturnData} */
  const {customer, filters} = useLoaderData();
  const {orders} = customer;

  return (
    <div>
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

/**
 * @param {{
 *   orders: CustomerOrdersFragment['orders'];
 *   filters: OrderFilterParams;
 * }}
 */
function OrdersTable({orders, filters}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection
          connection={orders}
          resourcesClassName="acct-orders"
        >
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

/**
 * @param {{hasFilters?: boolean}}
 */
function EmptyOrders({hasFilters = false}) {
  return (
    <div className="acct-empty">
      <span className="acct-empty-kanji" aria-hidden="true">
        無
      </span>
      {hasFilters ? (
        <>
          <p>Nincs a keresésnek megfelelő rendelés.</p>
          <Link className="acct-link" to="/account/orders">
            Szűrők törlése →
          </Link>
        </>
      ) : (
        <>
          <p>Még nem adtál le rendelést.</p>
          <Link className="btn" to="/#termekek">
            Irány a termékek
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * @param {{
 *   currentFilters: OrderFilterParams;
 * }}
 */
function OrderSearchForm({currentFilters}) {
  const [, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="acct-search"
      aria-label="Rendelések keresése"
    >
      <input
        type="search"
        className="acct-input"
        name={ORDER_FILTER_FIELDS.NAME}
        placeholder="Rendelésszám"
        aria-label="Rendelésszám"
        defaultValue={currentFilters.name || ''}
      />
      <input
        type="search"
        className="acct-input"
        name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
        placeholder="Visszaigazolási szám"
        aria-label="Visszaigazolási szám"
        defaultValue={currentFilters.confirmationNumber || ''}
      />
      <button className="btn" type="submit" disabled={isSearching}>
        {isSearching ? 'Keresés…' : 'Keresés'}
      </button>
      {hasFilters && (
        <button
          className="btn btn-ghost"
          type="button"
          disabled={isSearching}
          onClick={() => {
            setSearchParams(new URLSearchParams());
            formRef.current?.reset();
          }}
        >
          Törlés
        </button>
      )}
    </form>
  );
}

/**
 * @param {{order: OrderItemFragment}}
 */
function OrderItem({order}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;
  return (
    <Link className="acct-order" to={`/account/orders/${btoa(order.id)}`}>
      <div>
        <p className="acct-order-num">#{order.number}</p>
        <div className="acct-order-meta">
          <span>{formatDate(order.processedAt)}</span>
          {order.confirmationNumber && (
            <span>Visszaig. {order.confirmationNumber}</span>
          )}
          {order.financialStatus && (
            <span className="acct-chip">{STATUS_HU[order.financialStatus] ?? order.financialStatus}</span>
          )}
          {fulfillmentStatus && (
            <span className="acct-chip">{STATUS_HU[fulfillmentStatus] ?? fulfillmentStatus}</span>
          )}
        </div>
      </div>
      <div className="acct-order-total">
        <Money data={order.totalPrice} />
        <span className="acct-link">Részletek →</span>
      </div>
    </Link>
  );
}

/**
 * @typedef {{
 *   customer: CustomerOrdersFragment;
 *   filters: OrderFilterParams;
 * }} OrdersLoaderData
 */

/** @typedef {import('./+types/account.orders._index').Route} Route */
/** @typedef {import('~/lib/orderFilters').OrderFilterParams} OrderFilterParams */
/** @typedef {import('customer-accountapi.generated').CustomerOrdersFragment} CustomerOrdersFragment */
/** @typedef {import('customer-accountapi.generated').OrderItemFragment} OrderItemFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
