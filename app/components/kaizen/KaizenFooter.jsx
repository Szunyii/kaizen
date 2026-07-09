import {Link} from 'react-router';
import {BrushRibbon} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';

const COLS = [
  {
    h: 'Shop',
    links: [
      ['Men', '/collections/men'],
      ['Women', '/collections/women'],
      ['Accessories', '/collections/unisex'],
      ['All products', '/collections'],
    ],
  },
  {
    h: 'House',
    links: [
      ['The philosophy', '/#philosophy'],
      ['About', '/pages/about'],
      ['Journal', '/blogs/news'],
      ['Membership', '/account'],
    ],
  },
  {
    h: 'Help',
    links: [
      ['Shipping', '/policies/shipping-policy'],
      ['Returns', '/policies/refund-policy'],
      ['Privacy', '/policies/privacy-policy'],
      ['Terms', '/policies/terms-of-service'],
    ],
  },
];

/** KAIZENTYPE footer. */
export function KaizenFooter() {
  return (
    <footer className="ft">
      <div className="ft-brush" aria-hidden="true">
        <BrushRibbon opacity={0.4} />
      </div>
      <div className="wrap">
        <div className="ft-grid">
          <div className="ft-brand">
            <Link to="/" className="ft-logo">
              <img
                src="/kaizen-logo.png"
                alt="KaizenType"
                width="150"
                height="150"
              />
            </Link>
            <p className="ft-tag">
              Heavyweight, Budapest-made essentials for everyone chasing the
              small, daily better.
            </p>
          </div>

          <div className="ft-cols">
            {COLS.map((col) => (
              <div className="ft-col" key={col.h}>
                <span className="ft-h">{col.h}</span>
                {col.links.map(([label, to]) => (
                  <Link to={to} key={label} className="ft-link">
                    {label}
                  </Link>
                ))}
              </div>
            ))}

            <div className="ft-col">
              <img
                className="ft-news-logo"
                src="/kaizen-logo.png"
                alt=""
                aria-hidden="true"
                width="76"
                height="76"
              />
              <span className="ft-h">改善 — Newsletter</span>
              <p className="ft-news-p">
                A note on craft and discipline each week. No noise.
              </p>
              <form
                className="ft-form"
                onSubmit={(e) => e.preventDefault()}
                aria-label="Newsletter signup"
              >
                <input type="email" placeholder="Your email" aria-label="Email" />
                <button type="submit" aria-label="Subscribe">
                  {I.send}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="ft-base">
          <span>© {new Date().getFullYear()} KaizenType — Made in Budapest</span>
          <span className="ft-base-links">
            <Link to="/policies/privacy-policy">Privacy</Link>
            <Link to="/policies/terms-of-service">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
