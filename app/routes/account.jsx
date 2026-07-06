import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  const heading = customer.firstName
    ? `Welcome, ${customer.firstName}`
    : 'Your account';

  return (
    <div className="acct view-enter">
      <div className="wrap">
        <header className="acct-head">
          <p className="kicker">会員 — Member</p>
          <h1 className="acct-h display">{heading}</h1>
        </header>
        <AccountMenu />
        <div className="acct-body">
          <Outlet context={{customer}} />
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  const tabClass = ({isActive}) =>
    isActive ? 'acct-tab is-active' : 'acct-tab';

  return (
    <nav className="acct-nav" role="navigation">
      <NavLink to="/account" end className={tabClass}>
        Overview
      </NavLink>
      <NavLink to="/account/orders" className={tabClass}>
        Orders
      </NavLink>
      <NavLink to="/account/profile" className={tabClass}>
        Profile
      </NavLink>
      <NavLink to="/account/addresses" className={tabClass}>
        Addresses
      </NavLink>
      <Form className="acct-signout" method="POST" action="/account/logout">
        <button type="submit" className="btn btn-ghost">
          Sign out
        </button>
      </Form>
    </nav>
  );
}

/** @typedef {import('./+types/account').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
