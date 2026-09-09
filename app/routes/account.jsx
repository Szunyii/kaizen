import {
  data as remixData,
  Form,
  Link,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {I} from '~/components/kaizen/Icons';
import kaizenMark from '~/assets/favicon.svg';

export function shouldRevalidate() {
  return true;
}

/**
 * Logged-out visitors get a branded landing page instead of an immediate
 * redirect to Shopify's hosted login. Child routes (orders, profile,
 * addresses) still enforce auth in their own loaders.
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return remixData({customer: null}, {headers});
  }

  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData({customer: data.customer}, {headers});
}

export default function AccountLayout() {
  /** @type {LoaderReturnData} */
  const {customer} = useLoaderData();

  if (!customer) {
    return <AccountLanding />;
  }

  const heading = customer.firstName
    ? `Üdv, ${customer.firstName}`
    : 'A fiókod';

  return (
    <div className="acct view-enter">
      <div className="wrap">
        <header className="acct-head">
          <p className="kicker">
            <span className="kanji">会員</span>— Fiók
          </p>
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

const LANDING_CARDS = [
  {
    kanji: '注',
    h: 'Rendelések',
    p: 'Kövesd a csomagod útját, és nézd vissza bármikor, mit rendeltél korábban.',
  },
  {
    kanji: '所',
    h: 'Címek',
    p: 'Mentett szállítási címek, hogy a következő rendelés két kattintás legyen.',
  },
  {
    kanji: '改',
    h: 'Kaizen Family',
    p: 'A vásárlásaidhoz kötött hozzáférés a zárt közösséghez és a napi kihívásokhoz.',
  },
];

/**
 * Logged-out state of /account: brand hero + sign-in CTA + what the
 * account offers. Sign-in itself is Shopify's hosted, passwordless flow.
 */
function AccountLanding() {
  return (
    <div className="acct acct-login view-enter">
      <div className="wrap">
        <section className="acct-login-hero">
          <div className="acct-login-copy">
            <p className="kicker">
              <span className="kanji">会員</span>— Fiók
            </p>
            <h1 className="acct-h display">
              Lépj be a <span className="hero-em">Kaizen</span> fiókodba
            </h1>
            <p className="acct-login-p">
              Rendelések, címek és a Kaizen Family egy helyen. Nincs jelszó:
              az e-mail-címedre küldött kóddal lépsz be, az első belépéskor a
              fiók magától létrejön.
            </p>
            <div className="acct-login-cta">
              <Link className="btn" to="/account/login" prefetch="none">
                Bejelentkezés {I.arrow}
              </Link>
              <Link className="btn btn-ghost" to="/#termekek">
                Termékek
              </Link>
            </div>
            <p className="acct-login-note">
              Még nincs fiókod? A bejelentkezés gombbal ugyanúgy regisztrálsz.
            </p>
          </div>
          <div className="acct-login-art" aria-hidden="true">
            <img
              className="acct-login-mark"
              src={kaizenMark}
              alt=""
              width="280"
              height="280"
            />
          </div>
        </section>

        <section className="acct-login-cards" aria-label="Mit tud a fiók">
          {LANDING_CARDS.map((c) => (
            <div className="acct-card acct-card-static" key={c.h}>
              <span className="acct-card-kanji">{c.kanji}</span>
              <h2 className="acct-card-h">{c.h}</h2>
              <p className="acct-card-p">{c.p}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function AccountMenu() {
  const tabClass = ({isActive}) =>
    isActive ? 'acct-tab is-active' : 'acct-tab';

  return (
    <nav className="acct-nav" role="navigation" aria-label="Fiók">
      <NavLink to="/account" end className={tabClass}>
        Áttekintés
      </NavLink>
      <NavLink to="/account/orders" className={tabClass}>
        Rendelések
      </NavLink>
      <NavLink to="/account/profile" className={tabClass}>
        Profil
      </NavLink>
      <NavLink to="/account/addresses" className={tabClass}>
        Címek
      </NavLink>
      <Form className="acct-signout" method="POST" action="/account/logout">
        <button type="submit" className="btn btn-ghost">
          Kijelentkezés
        </button>
      </Form>
    </nav>
  );
}

/** @typedef {import('./+types/account').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
