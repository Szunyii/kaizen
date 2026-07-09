import {Suspense, useEffect, useState} from 'react';
import {Await, Link, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {I} from '~/components/kaizen/Icons';

// Fallback shown only if the nav collections query returns nothing.
const FALLBACK_NAV = [
  {id: 'men', label: 'Men', items: []},
  {id: 'women', label: 'Women', items: []},
  {id: 'accessories', label: 'Accessories', items: []},
];

/**
 * Maps real store collections onto the nav shape: top level links to the
 * collection, dropdown items are the product-type categories that actually
 * exist in that collection, linking to the collection filtered by type
 * (the `?type=` param collections.$handle filters by).
 * @param {Array<{handle: string, title: string, products?: {nodes?: Array<{productType: string}>}}>} [collections]
 */
function buildNav(collections) {
  if (!collections?.length) return FALLBACK_NAV;
  return collections.map((collection) => {
    const types = [
      ...new Set(
        (collection.products?.nodes ?? [])
          .map((product) => product.productType)
          .filter(Boolean),
      ),
    ];
    return {
      id: collection.handle,
      label: collection.title,
      items: types.map((type) => [
        type,
        `/collections/${collection.handle}?type=${encodeURIComponent(type)}`,
      ]),
    };
  });
}

/**
 * KAIZENTYPE header: announce marquee, centred wordmark, dropdown nav, and
 * search/account/cart actions. Cart + search open the shared Aside drawers.
 * @param {{cart: Promise<any>, isLoggedIn?: Promise<boolean>, navCollections?: Array<any>}} props
 */
export function KaizenHeader({cart, isLoggedIn, navCollections}) {
  const scrolled = useScrolled(24);
  const {open} = useAside();
  const nav = buildNav(navCollections);

  return (
    <header className={`hd ${scrolled ? 'hd-on' : ''}`}>
      <div className="hd-bar wrap ">
        <div className="hd-left">
          <button
            className="hd-ic hd-burger"
            aria-label="Open menu"
            onClick={() => open('mobile')}
          >
            {I.menu}
          </button>
          <Link to="/pages/about" className="hd-about">
            About
          </Link>
        </div>

        <Link to="/" className="hd-logo" aria-label="KaizenType home">
          <span className="hd-logo-k">Kaizen</span>type
        </Link>

        <div className="hd-actions">
          <button
            className="hd-ic"
            aria-label="Search"
            onClick={() => open('search')}
          >
            {I.search}
          </button>
          <Link to="/account" className="hd-ic" aria-label="Account">
            <Suspense fallback={I.user}>
              <Await resolve={isLoggedIn} errorElement={I.user}>
                {() => I.user}
              </Await>
            </Suspense>
          </Link>
          <CartToggle cart={cart} />
        </div>
      </div>

      <nav className="hd-sub" role="navigation" aria-label="Primary">
        {nav.map((group) => (
          <div className="navd" key={group.id}>
            <NavLink to={`/collections/${group.id}`} className="navd-trigger">
              {group.label}
              {group.items.length > 0 ? I.chevron : null}
            </NavLink>
            {group.items.length > 0 ? (
              <div className="navd-menu">
                {group.items.map(([label, to]) => (
                  <Link to={to} key={to + label}>
                    {label}
                  </Link>
                ))}
                <Link
                  to={`/collections/${group.id}`}
                  className="navd-all"
                >
                  Shop all {group.label} {I.arrow}
                </Link>
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </header>
  );
}

/**
 * Mobile navigation rendered inside the shared "mobile" Aside drawer.
 * Mirrors the desktop sub-nav so both viewports stay consistent and
 * brand-themed — no skeleton menu, no black-on-dark text.
 * @param {{navCollections?: Array<any>}} props
 */
export function KaizenMobileNav({navCollections}) {
  const {close} = useAside();
  const nav = buildNav(navCollections);
  return (
    <nav className="hd-mnav" aria-label="Mobile">
      <Link className="hd-mnav-home" to="/" onClick={close}>
        Home {I.arrow}
      </Link>
      {nav.map((group) => (
        <div className="hd-mnav-group" key={group.id}>
          <Link
            className="hd-mnav-h"
            to={`/collections/${group.id}`}
            onClick={close}
          >
            {group.label}
          </Link>
          <div className="hd-mnav-sub">
            {group.items.map(([label, to]) => (
              <Link to={to} key={to + label} onClick={close}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="hd-mnav-foot">
        <Link className="hd-mnav-link" to="/pages/about" onClick={close}>
          About
        </Link>
        <Link className="hd-mnav-link" to="/account" onClick={close}>
          Account
        </Link>
      </div>
    </nav>
  );
}

/** @param {{cart: Promise<any>}} props */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartButton count={0} />}>
      <Await resolve={cart}>
        <CartButtonResolved />
      </Await>
    </Suspense>
  );
}

function CartButtonResolved() {
  const original = useAsyncValue();
  const cart = useOptimisticCart(original);
  return <CartButton count={cart?.totalQuantity ?? 0} />;
}

/** @param {{count: number}} props */
function CartButton({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <button
      className="hd-ic"
      aria-label={`Cart, ${count} items`}
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: (typeof window !== 'undefined' && window.location.href) || '',
        });
      }}
    >
      {I.bag}
      {count > 0 ? <span className="hd-badge">{count}</span> : null}
    </button>
  );
}

/** Tracks whether the window has scrolled past `threshold` pixels. */
function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}
