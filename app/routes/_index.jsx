import {Link, useLoaderData} from 'react-router';
import {useReveal} from '~/lib/useReveal';
import {BrushRibbon, StudioShot} from '~/components/kaizen/Brand';
import {ProductCard} from '~/components/kaizen/ProductCard';
import {I} from '~/components/kaizen/Icons';
import {PRODUCTS, CATEGORIES} from '~/lib/kaizen-data';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Be Better, One Percent'},
    {
      name: 'description',
      content:
        'Heavyweight, Budapest-made essentials engineered for everyone chasing the small, daily better.',
    },
  ];
};

/**
 * Loads the live Storefront products that feed the homepage "Featured" grid.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const {products} = await context.storefront.query(FEATURED_PRODUCTS_QUERY, {
    variables: {first: 6},
  });

  // Map Storefront products onto the shape the Kaizen ProductCard expects.
  const featured = (products?.nodes ?? []).map((p) => ({
    id: p.id,
    handle: p.handle,
    name: p.title,
    price: Number(p.priceRange.minVariantPrice.amount),
    image: p.featuredImage,
    tag: null,
    colors: [],
  }));

  return {featured};
}

export default function Homepage() {
  return (
    <div className="view-enter">
      <Hero />
      <ValueStrip />
      <Featured />
      <CategoryTriptych />
      <MemberBand />
    </div>
  );
}

function Hero() {
  const ref = useReveal();
  return (
    <section className="hero" ref={ref}>
      <div className="hero-glow" />
      <div className="hero-kanji" aria-hidden="true">
        改
      </div>
      <div className="wrap hero-inner">
        <div className="hero-seal" data-reveal>
          <img
            className="hero-logo"
            src="/kaizen-logo.png"
            alt="KaizenType"
            width="210"
            height="210"
          />
        </div>
        <p className="hero-kicker reveal">改善 — Continuous improvement</p>
        <h1 className="hero-h1 display reveal reveal-d1">
          Be Better
          <br />
          <span className="hero-em">One Percent</span>
        </h1>
        <p className="hero-sub reveal reveal-d2">
          Heavyweight, Budapest-made essentials engineered for everyone chasing
          the small, daily better. Less noise. More work.
        </p>
        <div className="hero-cta reveal reveal-d3">
          <Link className="btn" to="/collections/men">
            Shop the collection {I.arrow}
          </Link>
          <Link className="btn btn-ghost" to="/pages/about">
            The philosophy
          </Link>
        </div>
      </div>
      <div className="hero-brush" aria-hidden="true">
        <BrushRibbon opacity={0.85} />
      </div>
    </section>
  );
}

function ValueStrip() {
  const ref = useReveal();
  const vals = [
    [I.truck, 'Free shipping over 25 000 Ft'],
    [I.refresh, '30-day easy returns'],
    [I.leaf, 'Made in Budapest'],
    [I.star, 'Member rewards on every order'],
  ];
  return (
    <div className="vstrip wrap" ref={ref}>
      {vals.map(([ic, t], i) => (
        <div className="vstrip-i reveal" key={i}>
          <span className="vstrip-ic">{ic}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
}

function Featured() {
  const ref = useReveal();
  /** @type {LoaderReturnData} */
  const {featured} = useLoaderData();
  // Fall back to the mock catalogue if the store returns no products.
  const items = featured?.length ? featured : PRODUCTS.slice(0, 6);
  return (
    <section className="feat" ref={ref}>
      <div className="wrap">
        <div className="feat-head">
          <div className="reveal">
            <p className="kicker">The collection</p>
            <h2 className="feat-h display">Explore Our Products</h2>
            <p className="feat-sub">Become a Kaizen Member</p>
          </div>
          <Link className="feat-all ul reveal reveal-d1" to="/collections">
            View all <span>{items.length}</span> {I.arrow}
          </Link>
        </div>
        <div className="grid-3 feat-grid">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTriptych() {
  const ref = useReveal();
  return (
    <section className="trip" ref={ref}>
      <div className="wrap">
        <div className="trip-grid">
          {CATEGORIES.map((c, i) => (
            <Link
              className={`trip-card reveal reveal-d${i + 1}`}
              key={c.id}
              to={`/collections/${c.id}`}
            >
              <div className="trip-media">
                <StudioShot
                  product={{type: c.type}}
                  ratio="3 / 4"
                  showType={false}
                />
                <div className="trip-overlay" />
              </div>
              <div className="trip-cap">
                <div>
                  <h3 className="trip-h display">{c.label}</h3>
                  <p className="trip-sub">{c.sub}</p>
                </div>
                <span className="trip-arrow">{I.arrow}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MemberBand() {
  const ref = useReveal();
  return (
    <section className="member" ref={ref}>
      <div className="member-brush" aria-hidden="true">
        <BrushRibbon flip opacity={0.6} />
      </div>
      <div className="wrap member-inner reveal">
        <div className="member-seal">
          <img
            className="member-logo"
            src="/kaizen-logo.png"
            alt="KaizenType"
            width="150"
            height="150"
          />
        </div>
        <div className="member-txt">
          <p className="kicker">改善 — Membership</p>
          <h2 className="member-h display">Become a Kaizen Member</h2>
          <p className="member-p">
            Earn on every order, unlock member-only drops and early access, and
            get a note on craft and discipline each week. Free to join —
            improvement should be.
          </p>
        </div>
        <div className="member-cta">
          <Link className="btn" to="/account">
            Join free {I.arrow}
          </Link>
        </div>
      </div>
    </section>
  );
}

const FEATURED_PRODUCTS_QUERY = `#graphql
  fragment HomeFeaturedProduct on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
  query HomeFeaturedProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...HomeFeaturedProduct
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
