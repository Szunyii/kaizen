import {Link, useOutletContext} from 'react-router';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'KaizenType — Account'}];
};

export default function AccountOverview() {
  /** @type {{customer: CustomerFragment}} */
  const {customer} = useOutletContext();
  const email = customer.emailAddress?.emailAddress;
  const name = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ');
  const {defaultAddress} = customer;

  return (
    <div className="acct-grid">
      <Link to="/account/orders" className="acct-card">
        <span className="acct-card-kanji">注</span>
        <h2 className="acct-card-h">Orders</h2>
        <p className="acct-card-p">
          Track, review and revisit everything you have ordered.
        </p>
        <span className="acct-link">View orders →</span>
      </Link>
      <Link to="/account/profile" className="acct-card">
        <span className="acct-card-kanji">名</span>
        <h2 className="acct-card-h">Profile</h2>
        <p className="acct-card-p">
          {name || 'Add your name'}
          {email ? (
            <>
              <br />
              {email}
            </>
          ) : null}
        </p>
        <span className="acct-link">Edit profile →</span>
      </Link>
      <Link to="/account/addresses" className="acct-card">
        <span className="acct-card-kanji">所</span>
        <h2 className="acct-card-h">Addresses</h2>
        <p className="acct-card-p">
          {defaultAddress
            ? [defaultAddress.address1, defaultAddress.city]
                .filter(Boolean)
                .join(', ')
            : 'No address saved yet.'}
        </p>
        <span className="acct-link">Manage addresses →</span>
      </Link>
    </div>
  );
}

/** @typedef {import('./+types/account._index').Route} Route */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
