import {Link, useOutletContext} from 'react-router';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'KaizenType — Fiók'}];
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
        <span className="acct-card-kanji" aria-hidden="true">
          注
        </span>
        <h2 className="acct-card-h">Rendelések</h2>
        <p className="acct-card-p">
          Kövesd, nézd vissza és rendeld újra, amit korábban vettél.
        </p>
        <span className="acct-link">Rendelések →</span>
      </Link>
      <Link to="/account/profile" className="acct-card">
        <span className="acct-card-kanji" aria-hidden="true">
          名
        </span>
        <h2 className="acct-card-h">Profil</h2>
        <p className="acct-card-p">
          {name || 'Add meg a neved'}
          {email ? (
            <>
              <br />
              {email}
            </>
          ) : null}
        </p>
        <span className="acct-link">Profil szerkesztése →</span>
      </Link>
      <Link to="/account/addresses" className="acct-card">
        <span className="acct-card-kanji" aria-hidden="true">
          所
        </span>
        <h2 className="acct-card-h">Címek</h2>
        <p className="acct-card-p">
          {defaultAddress
            ? [defaultAddress.address1, defaultAddress.city]
                .filter(Boolean)
                .join(', ')
            : 'Még nincs mentett cím.'}
        </p>
        <span className="acct-link">Címek kezelése →</span>
      </Link>
    </div>
  );
}

/** @typedef {import('./+types/account._index').Route} Route */
/** @typedef {import('customer-accountapi.generated').CustomerFragment} CustomerFragment */
