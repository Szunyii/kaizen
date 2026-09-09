import {Suspense, useEffect, useState} from 'react';
import {Await, Link, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {I} from '~/components/kaizen/Icons';

// Primary navigation: anchors into the homepage sections.
export const PRIMARY_NAV = [
  ['Termékek', '/#termekek'],
  ['Kaizen Family', '/#family'],
  ['Filozófia', '/#filozofia'],
  ['Rólunk', '/#rolunk'],
];

/**
 * KAIZENTYPE header: mark + wordmark, section nav, search/account/cart.
 * Cart + search open the shared Aside drawers.
 * @param {{cart: Promise<any>, isLoggedIn?: Promise<boolean>, navCollections?: Array<any>}} props
 */
export function KaizenHeader({cart, isLoggedIn}) {
  const scrolled = useScrolled(12);
  const {open} = useAside();

  return (
    <header className={`hd ${scrolled ? 'hd-on' : ''}`}>
      <div className="hd-bar">
        <div className="hd-left">
          <button
            className="hd-ic hd-burger"
            aria-label="Menü megnyitása"
            onClick={() => open('mobile')}
          >
            {I.menu}
          </button>
          <Link to="/" className="hd-logo" aria-label="KaizenType kezdőlap">
            <img
              className="hd-mark"
              src="/kaizen-logo.png"
              alt=""
              width="36"
              height="36"
            />
            <span className="hd-word">
              <span className="hd-logo-k">Kaizen</span>type
            </span>
          </Link>
        </div>

        <nav className="hd-nav" role="navigation" aria-label="Elsődleges">
          {PRIMARY_NAV.map(([label, to]) => (
            <Link to={to} key={to} className="hd-nav-link">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hd-actions">
          <button
            className="hd-ic"
            aria-label="Keresés"
            onClick={() => open('search')}
          >
            {I.search}
          </button>
          <Link to="/account" className="hd-ic" aria-label="Fiók">
            <Suspense fallback={I.user}>
              <Await resolve={isLoggedIn} errorElement={I.user}>
                {() => I.user}
              </Await>
            </Suspense>
          </Link>
          <CartToggle cart={cart} />
        </div>
      </div>
    </header>
  );
}

/**
 * Mobile navigation rendered inside the shared "mobile" Aside drawer:
 * the section links plus the real store collections.
 * @param {{navCollections?: Array<{handle: string, title: string}>}} props
 */
export function KaizenMobileNav({navCollections}) {
  const {close} = useAside();
  return (
    <nav className="hd-mnav" aria-label="Mobil">
      <Link className="hd-mnav-home" to="/" onClick={close}>
        Kezdőlap {I.arrow}
      </Link>
      <div className="hd-mnav-group">
        {PRIMARY_NAV.map(([label, to]) => (
          <Link className="hd-mnav-h" to={to} key={to} onClick={close}>
            {label}
          </Link>
        ))}
      </div>
      {navCollections?.length ? (
        <div className="hd-mnav-group">
          <span className="hd-mnav-label">Kollekciók</span>
          <div className="hd-mnav-sub">
            {navCollections.map((c) => (
              <Link
                to={`/collections/${c.handle}`}
                key={c.handle}
                onClick={close}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="hd-mnav-foot">
        <Link className="hd-mnav-link" to="/account" onClick={close}>
          Fiók
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
      className="hd-ic hd-cart"
      aria-label={`Kosár, ${count} tétel`}
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
      <span className="hd-count">{count}</span>
    </button>
  );
}

/** Tracks whether the window has scrolled past `threshold` pixels. */
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}
