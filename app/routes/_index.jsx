import {Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Await, Link, useFetcher, useLoaderData} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {useReveal} from '~/lib/useReveal';
import {Wave} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {formatMoney} from '~/lib/money';
import {fetchActivePromos} from '~/lib/discounts';
import {
  TEXT,
  optionName,
  isSizeOption,
  productType,
  sortSizes,
  collectionTitle,
} from '~/lib/text';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Progress Has No End'},
    {
      name: 'description',
      content:
        'Több mint egy ruhamárka. Nehéz pamut alapdarabok és a Kaizen Family közösség azoknak, akik minden nap 1%-kal jobbak akarnak lenni.',
    },
  ];
};

/**
 * Loads the live Storefront products that feed the homepage showcases,
 * plus the frontpage collection image for the hero if one is set.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const {storefront} = context;
  // Deferred: active Shopify discounts for the promo strip. Never throws.
  const promos = fetchActivePromos(context);
  const [{products}, {collection}] = await Promise.all([
    storefront.query(HOME_PRODUCTS_QUERY, {variables: {first: 6}}),
    storefront.query(HOME_HERO_QUERY, {cache: storefront.CacheLong()}),
  ]);

  const items = products?.nodes ?? [];
  const heroImage =
    collection?.image ??
    items[0]?.images?.nodes?.[1] ??
    items[0]?.featuredImage ??
    null;

  return {products: items, heroImage, promos};
}

export default function Homepage() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((label) => {
    clearTimeout(timer.current);
    setToast(label);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="view-enter home">
      <Hero />
      <div className="home-divider" aria-hidden="true">
        <Wave shape="thin" />
      </div>
      <ValueStrip />
      <Philosophy />
      <Products onAdded={notify} />
      <Community />
      <Family />
      <About />
      <Faq />
      <Toast label={toast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  const ref = useReveal();
  /** @type {LoaderReturnData} */
  const {heroImage} = useLoaderData();
  return (
    <section id="top" className="hero hero-full" ref={ref}>
      {/* The brand film carries the first screen visually; the page still
          needs a heading for search engines and screen readers. */}
      <h1 className="sr-only">
        KaizenType — Progress Has No End. Nehéz pamut alapdarabok és a Kaizen
        Family közösség.
      </h1>
      <HeroVideo poster={heroImage?.url} />
    </section>
  );
}

/**
 * The original hero copy (kicker, headline, CTAs, trust line). Kept out of
 * the render for now — the brand film fills the hero on its own. Drop this
 * back into <Hero /> when the copy should return.
 */
// eslint-disable-next-line no-unused-vars
function HeroCopy() {
  return (
    <div className="hero-copy">
      <p className="kicker reveal">
        <span className="kanji">改善</span>— Continuous improvement
      </p>
      <h1 className="hero-h1 display reveal reveal-d1">
        Progress
        <br />
        <span className="hero-em">Has No End</span>
      </h1>
      <p className="hero-sub reveal reveal-d2">
        Több mint egy ruhamárka. Egy életfilozófia azoknak, akik nem elégednek
        meg a jelennel, és nap mint nap a jobb önmagukért dolgoznak. Készülj
        fel a szintlépésre.
      </p>
      <div className="hero-cta reveal reveal-d3">
        <Link className="btn" to="/#termekek">
          Fedezd fel a kollekciót {I.arrow}
        </Link>
        <Link className="btn btn-ghost" to="/#filozofia">
          A kaizen filozófia
        </Link>
      </div>
      <div className="hero-trust reveal reveal-d3">
        <span>Magyarországon tervezve</span>
        <span>Limitált darabok</span>
        <span>Kaizen Family</span>
      </div>
    </div>
  );
}

/**
 * Autoplaying brand film that fills the hero. Muted + looped so it can
 * autoplay everywhere. Falls back to the poster when the user prefers
 * reduced motion.
 * @param {{poster?: string}} props
 */
function HeroVideo({poster}) {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // The SSR'd video may finish loading before hydration attaches handlers.
    if (v.readyState >= 2) setReady(true);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) {
      v.pause();
      return;
    }
    v.play().catch(() => {});
  }, []);

  return (
    <div className={`hero-media hero-video reveal reveal-d2${ready ? ' is-ready' : ''}`}>
      {poster ? (
        <img
          className="hero-video-poster"
          src={poster}
          alt=""
          loading="eager"
          decoding="async"
        />
      ) : null}
      <video
        ref={videoRef}
        className="hero-video-el"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Kaizen brand film"
        onLoadedData={() => setReady(true)}
      >
        <source src="/kaizenweboldal.mp4" type='video/mp4; codecs="hvc1"' />
        <source src="/kaizenweboldal-h264.mp4" type="video/mp4" />
      </video>
      <span className="hero-video-shade" aria-hidden="true" />
    </div>
  );
}

function ValueStrip() {
  const ref = useReveal();
  const vals = [
    'Az 1% fejlődés szimbóluma.',
    'Kompromisszumok nélküli edzős és utcai viselet.',
    'Zárt applikáció és támogató közösség.',
  ];
  return (
    <section className="vstrip-wrap" ref={ref}>
      <div className="wrap vstrip">
        {vals.map((t, i) => (
          <div className={`vstrip-i reveal reveal-d${i}`} key={t}>
            <span className="vstrip-ic">✓</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Philosophy                                                          */
/* ------------------------------------------------------------------ */

function Philosophy() {
  const ref = useReveal();
  return (
    <section id="filozofia" className="phil-home" ref={ref}>
      <div className="wrap">
        <p className="kicker reveal">
          <span className="kanji">改善</span>— A filozófia
        </p>
        <h2 className="sec-h display reveal reveal-d1">Mit jelent a kaizen?</h2>

        <div className="dict reveal reveal-d2">
          <div className="dict-head">
            <span className="dict-word display">kaizen</span>
            <span className="dict-kanji">改善</span>
          </div>
          <div className="dict-meta">
            <span className="dict-ipa">[ ˈkaɪzn, ˈkaɪzən ]</span>
            <i className="dict-dot" />
            <span className="dict-tag">japán</span>
            <i className="dict-dot" />
            <span className="dict-tag">főnév</span>
          </div>
          <p className="dict-p">
            A japán <b>kaizen</b> szó jelentése <b>„változás a jobb felé”</b>. A
            japán szótárakban és a hétköznapi használatban egyaránt együtt jár
            vele a <b>folyamatosság</b> és a <b>szemléletmód</b> jelentése.
          </p>
          {/* The two characters, dictionary-style: no cards, just entries. */}
          <dl className="dict-parts">
            <div className="dict-part">
              <dt>
                <span className="dict-k">改</span>
                <span className="dict-part-h">kai — változás</span>
              </dt>
              <dd>
                Nem a nagy döntés, hanem a mai. Az, amit ma másképp teszel, mint
                tegnap.
              </dd>
            </div>
            <div className="dict-part">
              <dt>
                <span className="dict-k">善</span>
                <span className="dict-part-h">zen — jó</span>
              </dt>
              <dd>A jó irányba. Mérhetően, türelmesen, nem hangosan.</dd>
            </div>
          </dl>
        </div>

        {/* One statement band instead of a third card: the brand's translation. */}
        <div className="one reveal reveal-d3">
          <div className="one-glyph display">1%</div>
          <div className="one-body">
            <div className="one-h">A mi fordításunk</div>
            <p className="one-p">
              Napi egy százalék egy év alatt harmincszoros fejlődés. Ezt hordod
              magadon, és ezt csináljuk együtt a közösségben.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Products (live Storefront data)                                     */
/* ------------------------------------------------------------------ */

/** @param {HomeProduct} product */
function productKicker(product) {
  const first = (product.collections?.nodes ?? []).find(
    (c) => c.handle !== 'frontpage',
  );
  return (
    (first && collectionTitle(first)) ||
    productType(product.productType) ||
    'Kaizen'
  );
}

/** Options worth rendering: more than one value, and not Shopify's default. */
function selectableOptions(product) {
  return (product.options ?? []).filter(
    (o) => o.name !== 'Title' && o.optionValues.length > 1,
  );
}

/** Find the variant matching a {optionName: value} selection. */
function findVariant(product, selection) {
  const variants = product.variants?.nodes ?? [];
  return (
    variants.find((v) =>
      v.selectedOptions.every((so) => selection[so.name] === so.value),
    ) ?? null
  );
}

/** Initial selection: the first available variant, else the first one. */
function initialSelection(product) {
  const variants = product.variants?.nodes ?? [];
  const v = variants.find((x) => x.availableForSale) ?? variants[0];
  return Object.fromEntries(
    (v?.selectedOptions ?? []).map((so) => [so.name, so.value]),
  );
}

/** "9 900 Ft" for HUF, Intl formatting for anything else. */
const money = formatMoney;

/** Short spec line built from the product's option values, e.g. "Black és White · M–L". */
function specLine(product) {
  const parts = [];
  for (const o of product.options ?? []) {
    if (o.name === 'Title') continue;
    const values = o.optionValues.map((v) => v.name);
    if (values.length <= 1) continue;
    const isSize = isSizeOption(o.name);
    const ordered = isSize ? sortSizes(values) : values;
    parts.push(
      isSize && ordered.length > 2
        ? `${ordered[0]}–${ordered[ordered.length - 1]}`
        : ordered.join(' · '),
    );
  }
  return parts.join(' · ');
}

/** Option values in display order: sizes S → M → L, everything else as stored. */
function orderedValues(option) {
  if (!isSizeOption(option.name)) return option.optionValues;
  const byName = new Map(option.optionValues.map((v) => [v.name, v]));
  return sortSizes([...byName.keys()]).map((n) => byName.get(n));
}

/** Trim a description to a readable paragraph. */
function excerpt(text, max = 260) {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' ')))}…`;
}

/** @param {{onAdded: (label: string) => void}} props */
function Products({onAdded}) {
  const ref = useReveal();
  const {open} = useAside();
  /** @type {LoaderReturnData} */
  const {products} = useLoaderData();

  // Same feedback as the product page: show the toast and slide the cart
  // drawer open so the added line is visible immediately.
  const added = useCallback(
    (label) => {
      onAdded(label);
      open('cart');
    },
    [onAdded, open],
  );

  // Variant selection per product, keyed by product id.
  const [selections, setSelections] = useState(() =>
    Object.fromEntries(products.map((p) => [p.id, initialSelection(p)])),
  );
  const select = useCallback((productId, name, value) => {
    setSelections((prev) => ({
      ...prev,
      [productId]: {...prev[productId], [name]: value},
    }));
  }, []);

  const selectedVariants = useMemo(
    () =>
      Object.fromEntries(
        products.map((p) => [p.id, findVariant(p, selections[p.id] ?? {})]),
      ),
    [products, selections],
  );

  return (
    <section id="termekek" className="shop" ref={ref}>
      <div className="wrap">
        <p className="kicker reveal">A kollekció</p>
        <h2 className="sec-h display reveal reveal-d1">
          Tiszta fókusz. Semmi felesleg.
        </h2>
        <p className="sec-p reveal reveal-d2">
          Nem hiszünk a felesleges tömeggyártásban. Kizárólag olyan darabokat
          készítünk, amiket addig finomítunk, amíg a legjobbak nem lesznek.
        </p>

        {products.length === 0 ? (
          <p className="shop-empty">Hamarosan érkeznek az első darabok.</p>
        ) : null}

        {products.map((product, i) => (
          <Showcase
            key={product.id}
            product={product}
            flip={i % 2 === 1}
            selection={selections[product.id] ?? {}}
            variant={selectedVariants[product.id]}
            onSelect={select}
            onAdded={added}
          />
        ))}

        <Promos
          products={products}
          selectedVariants={selectedVariants}
          onAdded={added}
        />
      </div>
    </section>
  );
}

/**
 * @param {{
 *   product: HomeProduct;
 *   flip: boolean;
 *   selection: Record<string, string>;
 *   variant: HomeVariant | null;
 *   onSelect: (productId: string, name: string, value: string) => void;
 *   onAdded: (label: string) => void;
 * }} props
 */
function Showcase({product, flip, selection, variant, onSelect, onAdded}) {
  const ref = useReveal();
  const options = selectableOptions(product);
  const image = variant?.image ?? product.featuredImage;
  const price = variant?.price ?? product.priceRange?.minVariantPrice;
  const compareAt = variant?.compareAtPrice;
  const onSale =
    compareAt && Number(compareAt.amount) > Number(price?.amount ?? 0);
  const available = !!variant?.availableForSale;
  const specs = specLine(product);

  return (
    <article className={`show ${flip ? 'is-flip' : ''}`} ref={ref}>
      <Link
        to={`/products/${product.handle}`}
        className="show-media reveal"
        aria-label={product.title}
      >
        {image ? (
          <Image
            data={image}
            sizes="(min-width: 900px) 45vw, 100vw"
            className="show-img"
          />
        ) : (
          <div className="ph" />
        )}
      </Link>

      <div className="show-body">
        <p className="show-kicker reveal">{productKicker(product)}</p>
        <h3 className="show-h display reveal reveal-d1">
          <Link to={`/products/${product.handle}`}>{product.title}</Link>
        </h3>
        <p className="show-p reveal reveal-d2">{excerpt(product.description)}</p>
        {/* the spec line only earns its place when there are no chips to say the same */}
        {product.productType || (specs && !options.length) ? (
          <div className="show-specs reveal reveal-d2">
            {product.productType ? (
              <span>{productType(product.productType)}</span>
            ) : null}
            {specs && !options.length ? <span>{specs}</span> : null}
          </div>
        ) : null}

        {options.map((o) => (
          <div className="show-opt reveal reveal-d2" key={o.name}>
            <span className="show-opt-name">{optionName(o.name)}</span>
            <div
              className="show-chips"
              role="group"
              aria-label={optionName(o.name)}
            >
              {orderedValues(o).map((v) => {
                const active = selection[o.name] === v.name;
                const exists = findVariant(product, {
                  ...selection,
                  [o.name]: v.name,
                });
                return (
                  <button
                    type="button"
                    key={v.name}
                    className={`chip ${active ? 'is-on' : ''} ${
                      exists && !exists.availableForSale ? 'is-out' : ''
                    }`}
                    aria-pressed={active}
                    onClick={() => onSelect(product.id, o.name, v.name)}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="show-buy reveal reveal-d3">
          <div className="show-price display">
            {onSale ? <s className="show-was">{money(compareAt)}</s> : null}
            {money(price)}
          </div>
          {available ? (
            <AddToCartButton
              className="btn"
              busyLabel={TEXT.adding}
              onClick={() => onAdded(product.title)}
              lines={[
                {
                  merchandiseId: variant.id,
                  quantity: 1,
                  selectedVariant: variant,
                },
              ]}
            >
              {TEXT.addToCart} {I.arrow}
            </AddToCartButton>
          ) : (
            <RestockForm variant={variant} productTitle={product.title} />
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Sold-out state that keeps the path open: a one-field form that asks the
 * `/restock` route to tag the address for this variant.
 * @param {{variant: HomeVariant | null; productTitle: string}} props
 */
function RestockForm({variant, productTitle}) {
  const fetcher = useFetcher();
  /** @type {import('~/routes/restock').RestockResult | undefined} */
  const result = fetcher.data;
  const busy = fetcher.state !== 'idle';
  const done = result?.ok === true;
  const id = `restock-${variant?.id?.split('/').pop() ?? 'x'}`;

  if (!variant) return <span className="show-out">{TEXT.soldOut}</span>;

  return (
    <fetcher.Form
      method="post"
      action="/restock"
      className={`restock${done ? ' is-done' : ''}${result && !result.ok ? ' is-error' : ''}`}
    >
      <input type="hidden" name="variantId" value={variant.id} />
      <input type="hidden" name="product" value={productTitle} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="ft-form-hp"
        aria-hidden="true"
      />
      <label className="restock-label" htmlFor={id}>
        {TEXT.soldOut} · Szólunk, ha újra kapható
      </label>
      <div className="restock-row">
        <input
          id={id}
          type="email"
          name="email"
          placeholder="E-mail cím"
          autoComplete="email"
          required
          disabled={busy || done}
        />
        <button type="submit" disabled={busy || done} aria-busy={busy}>
          {done ? I.check : 'Értesíts'}
        </button>
      </div>
      <p className="restock-msg" role="status" aria-live="polite">
        {result?.message ?? ''}
      </p>
    </fetcher.Form>
  );
}

/**
 * Active promotions from Shopify admin (Discounts). Renders nothing while
 * loading, on failure, or when no discount is active.
 * @param {{
 *   products: HomeProduct[];
 *   selectedVariants: Record<string, HomeVariant | null>;
 *   onAdded: (label: string) => void;
 * }} props
 */
function Promos({products, selectedVariants, onAdded}) {
  /** @type {LoaderReturnData} */
  const {promos} = useLoaderData();
  return (
    <Suspense fallback={null}>
      <Await resolve={promos} errorElement={null}>
        {(list) =>
          list?.length ? (
            <div className="promos">
              {list.map((promo) =>
                promo.bundle ? (
                  <BundlePromo
                    key={promo.id}
                    promo={promo}
                    products={products}
                    selectedVariants={selectedVariants}
                    onAdded={onAdded}
                  />
                ) : (
                  <Promo key={promo.id} promo={promo} />
                ),
              )}
            </div>
          ) : null
        }
      </Await>
    </Suspense>
  );
}

/** @param {{promo: import('~/lib/discounts').Promo}} props */
function Promo({promo}) {
  const ref = useReveal();
  const ends = promo.endsAt ? formatPromoDate(promo.endsAt) : null;
  return (
    <div className="bundle promo reveal" ref={ref}>
      <div className="bundle-txt">
        <p className="show-kicker">{promo.code ? 'Kuponkód' : 'Akció'}</p>
        <div className="bundle-h display">{promo.title}</div>
        <p className="bundle-p">
          {promo.summary}
          {ends ? <span className="promo-ends"> · {ends}-ig</span> : null}
        </p>
      </div>
      <Link className="btn" to={promo.href}>
        {promo.code ? (
          <>
            <span className="promo-code">{promo.code}</span> aktiválása
          </>
        ) : (
          'Megnézem'
        )}{' '}
        {I.arrow}
      </Link>
    </div>
  );
}

/**
 * "Buy N, the cheapest is X% off" promotion rendered as a real bundle: picks
 * the first N eligible products, prices the bundle from the variants
 * currently selected in the showcases, and adds them all to the cart. The
 * automatic discount itself is applied by Shopify in the cart.
 * @param {{
 *   promo: import('~/lib/discounts').Promo;
 *   products: HomeProduct[];
 *   selectedVariants: Record<string, HomeVariant | null>;
 *   onAdded: (label: string) => void;
 * }} props
 */
function BundlePromo({promo, products, selectedVariants, onAdded}) {
  const ref = useReveal();
  const {buys, gets, percentage, handles} = promo.bundle;
  const eligible = handles.length
    ? products.filter((p) => handles.includes(p.handle))
    : products;
  const picked = eligible.slice(0, buys);

  // Not enough products on the page to build the bundle: fall back to the
  // plain promo card so the offer is still visible.
  if (picked.length < buys) return <Promo promo={promo} />;

  const variants = picked.map((p) => selectedVariants[p.id] ?? null);
  const ready = variants.every((v) => v?.availableForSale);
  const prices = picked.map((p, i) =>
    Number(
      variants[i]?.price?.amount ?? p.priceRange.minVariantPrice.amount,
    ),
  );
  const currency =
    variants[0]?.price?.currencyCode ??
    picked[0]?.priceRange?.minVariantPrice?.currencyCode ??
    'HUF';
  const total = prices.reduce((sum, n) => sum + n, 0);
  const saving = [...prices]
    .sort((a, b) => a - b)
    .slice(0, gets)
    .reduce((sum, n) => sum + n * percentage, 0);
  const ends = promo.endsAt ? formatPromoDate(promo.endsAt) : null;

  return (
    <div className="bundle promo reveal" ref={ref}>
      <div className="bundle-txt">
        <p className="show-kicker">Csomag akció</p>
        <div className="bundle-h display">
          {picked.map((p) => p.title).join(' + ')}
        </div>
        <p className="bundle-p">
          {promo.summary}{' '}
          <span className="bundle-total">
            <s className="bundle-was">
              {money({amount: String(total), currencyCode: currency})}
            </s>{' '}
            helyett{' '}
            <strong className="bundle-now">
              {money({amount: String(total - saving), currencyCode: currency})}
            </strong>
          </span>
          {ends ? <span className="promo-ends"> · {ends}-ig</span> : null}
        </p>
      </div>
      <AddToCartButton
        className="btn"
        disabled={!ready}
        busyLabel={TEXT.adding}
        onClick={() => onAdded('Csomag')}
        lines={
          ready
            ? variants.map((v) => ({
                merchandiseId: v.id,
                quantity: 1,
                selectedVariant: v,
              }))
            : []
        }
      >
        Csomag kosárba {I.arrow}
      </AddToCartButton>
    </div>
  );
}

/** @param {string} iso */
function formatPromoDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* Community                                                           */
/* ------------------------------------------------------------------ */

const RATING = 4.5;

const STATS = [
  ['200+', 'vásárló'],
  [null, 'átlagos értékelés'],
  ['100+', 'tag a Kaizen Familyben'],
  ['92%', 'elégedettség'],
];

/** Five stars, filled to the rating (4.9 → the last star is 90% red). */
function StatStars({rating}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <div
      className="stat-stars"
      role="img"
      aria-label={`${String(rating).replace('.', ',')} az 5-ből`}
    >
      <span className="stat-stars-base" aria-hidden="true">
        ★★★★★
      </span>
      <span
        className="stat-stars-fill"
        aria-hidden="true"
        style={{width: `${pct}%`}}
      >
        ★★★★★
      </span>
    </div>
  );
}

const VOICES = [
  {
    who: 'Márk, 34',
    q: '„A minőség meglepett, de a közösség tartott meg. Heti kihívások, valódi emberek, nulla üres motivációs szöveg.”',
  },
  {
    who: 'Eszter, 26',
    q: '„Két hete van meg, és minden második nap ez van rajtam. A szabása pont az, amit kerestem: nem szűk, nem lógós.”',
  },
  {
    who: 'Tamás, 38',
    q: '„A csapatprogram miatt maradtam. Először csak egy pólót akartam, most már futócsoportba járok velük.”',
  },
];

function Community() {
  const ref = useReveal();

  return (
    <section className="comm" ref={ref}>
      <div className="wrap">
        <div className="stats">
          {STATS.map(([n, l], i) => (
            <div className={`stat reveal reveal-d${i}`} key={l}>
              {n ? (
                <div className="stat-n display">{n}</div>
              ) : (
                <div className="stat-n">
                  <StatStars rating={RATING} />
                </div>
              )}
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>

        <h2 className="sec-h sec-h-sm display reveal">Amit a közösség mond</h2>

        {/* Uniform quote cards, no imagery: the words carry the section. */}
        <div className="voices">
          {VOICES.map((v, i) => (
            <figure className={`voice reveal reveal-d${i + 1}`} key={v.who}>
              <span className="voice-mark" aria-hidden="true">
                ”
              </span>
              <div className="stars" aria-label="5 csillag">
                ★★★★★
              </div>
              <blockquote className="voice-q">{v.q}</blockquote>
              <figcaption className="voice-who">{v.who}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kaizen Family                                                       */
/* ------------------------------------------------------------------ */

/** The Kaizen Family app, opened from the Family section. */
const APP_URL = 'https://app.kaizentype.com/';

const FAMILY = [
  {
    h: 'Kihívások',
    p: (
      <>
        Egyéni és csapatfeladatok (pl. <i>Napi 1%</i> vagy{' '}
        <i>Reggeli meditáció</i>). Nem 30 napos csodák, hanem beépíthető
        szokások.
      </>
    ),
  },
  {
    h: 'Közösség',
    p: 'Zárt csoportok, megosztott haladás és fókusz felesleges hangoskodás nélkül.',
  },
  {
    h: 'Csapatprogramok',
    p: 'Közös edzések, futások és élő találkozók a csapattal.',
  },
];

function Family() {
  const ref = useReveal();
  return (
    <section id="family" className="fam" ref={ref}>
      <div className="fam-bg" aria-hidden="true">
        <Wave shape="tall" fill="var(--ink-red)" />
      </div>
      <div className="fam-inner">
        <div className="fam-copy">
          <p className="kicker reveal">
            <span className="kanji">改善</span>— Kaizen Family
          </p>
          <h2 className="sec-h display reveal reveal-d1">
            A ruházat csak a belépő
          </h2>
          <p className="fam-p reveal reveal-d2">
            Minden Kaizen darab megvásárlásával exkluzív hozzáférést kapsz a
            Kaizen Family zárt alkalmazásához. Itt dől el, ki gondolja
            komolyan. Ez a valódi munka helyszíne: napi szintű kihívások, közös
            célok és egy olyan közösség vár, amelyik felesleges zaj nélkül,
            némán teszi a dolgát, hogy minden nap 1%-kal jobb legyen.
          </p>
          <div className="fam-feats">
            {FAMILY.map((f, i) => (
              <div className={`fam-feat reveal reveal-d${i + 1}`} key={f.h}>
                <div className="fam-feat-ic">✓</div>
                <div className="fam-feat-h">{f.h}</div>
                <p className="fam-feat-p">{f.p}</p>
              </div>
            ))}
          </div>
          <div className="fam-cta reveal reveal-d3">
            <div className="fam-cta-row">
              <a
                className="btn"
                href={APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Belépés az appba {I.arrow}
              </a>
              <Link className="btn btn-ghost" to="/#termekek">
                Vásárlás a hozzáféréshez
              </Link>
            </div>
            <span className="fam-note">
              A hozzáférés minden vásárláshoz jár.
            </span>
          </div>
        </div>
        <a
          className="fam-phone-wrap reveal reveal-d2"
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Kaizen Family app megnyitása"
        >
          <div className="fam-phone" aria-hidden="true">
            <div className="fam-app">
              <div className="fam-app-top">
                <span className="fam-app-kanji">改善</span>
                <span>Napi 1%</span>
              </div>
              <div className="fam-app-ring">
                <span>1%</span>
              </div>
              <div className="fam-app-list">
                <div className="fam-app-row is-done">Reggeli meditáció</div>
                <div className="fam-app-row is-done">30 perc mozgás</div>
                <div className="fam-app-row">Esti jegyzet</div>
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About + FAQ                                                         */
/* ------------------------------------------------------------------ */

function About() {
  const ref = useReveal();
  return (
    <section id="rolunk" className="about" ref={ref}>
      <div className="wrap about-grid">
        <div className="about-media reveal">
          <img
            src="/owners.jpg"
            alt="A KaizenType alapítói"
            width="1800"
            height="1200"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="about-copy">
          <p className="kicker reveal">
            <span className="kanji">改善</span>— Rólunk
          </p>
          <h2 className="sec-h sec-h-sm display reveal reveal-d1">
            Az erő nem csak fizikai.
          </h2>
          <p className="about-p reveal reveal-d2">
            Személyi edzőkként és versenyzőkként nap mint nap a határokat
            feszegetjük. Éveken át fókuszáltunk a testépítésre, de útközben
            rájöttünk a legfontosabbra: a fizikum fejlesztése csak az út fele,
            az igazi áttörés az elme erősítésével kezdődik. Ebből a
            felismerésből született a KaizenType. Egy márka és egy közösség,
            ami a folyamatos fejlődést hirdeti. Ezt a fegyelmet követjük a
            háttérben is: minden darabunkat hosszú hónapokig teszteljük, és a
            ti visszajelzéseitek alapján tökéletesítjük újra és újra.
          </p>
          <div className="about-tags reveal reveal-d3">
            <span>Fizikai és mentális szintlépés</span>
            <span>Edzői és versenyzői háttér</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  [
    'Melyik méretet válasszam?',
    'A darabok normál fazonúak, a férfi póló egyenes szabású. Mérj le egy pólót, amiben jól érzed magad, és hasonlítsd össze a cm-es táblázattal mellbőség és teljes hossz alapján. Ha két méret között vagy, a nagyobbat ajánljuk.',
  ],
  [
    'Mennyi idő alatt érkezik meg?',
    'Raktáron lévő darabok esetén 1–3 munkanap Magyarországon, futárral. A csomagolásról e-mailben értesítünk.',
  ],
  [
    'Visszaküldhetem, ha nem jó a méret?',
    'Igen, 14 napon belül indoklás nélkül, viseletlen állapotban. Méretcserénél a visszaküldés költségét mi álljuk.',
  ],
  [
    'Hogyan kapom meg az app-hozzáférést?',
    'A rendelés visszaigazolásában küldünk egy meghívót a Kaizen Family alkalmazáshoz. A hozzáférés a fiókodhoz kötődik, és megmarad.',
  ],
];

function Faq() {
  const ref = useReveal();
  const [open, setOpen] = useState(0);
  return (
    <section id="gyik" className="faq" ref={ref}>
      <div className="faq-wrap faq-grid">
        <div className="faq-head">
          <p className="kicker reveal">
            <span className="kanji">問</span>— Gyakori kérdések
          </p>
          <h2 className="sec-h sec-h-sm display reveal reveal-d1">
            Amit a legtöbben
            <br />
            <em className="faq-em">kérdeznek.</em>
          </h2>
          <p className="faq-lead reveal reveal-d2">
            Méret, szállítás, csere és az app-hozzáférés. Ha nem találod a
            választ, írj nekünk, egy munkanapon belül válaszolunk.
          </p>
          <Link className="faq-contact reveal reveal-d3" to="/pages/contact">
            Írj nekünk {I.arrow}
          </Link>
        </div>

        <div className="faq-list">
          {FAQ.map(([q, a], i) => {
            const isOpen = open === i;
            const id = `faq-${i}`;
            return (
              <div
                className={`faq-i reveal reveal-d${Math.min(i, 3)}${isOpen ? ' is-open' : ''}`}
                key={q}
              >
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={id}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span className="faq-n display">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="faq-q-t display">{q}</span>
                  <span className="faq-ic" aria-hidden="true">
                    {I.plus}
                  </span>
                </button>
                <div className="faq-a-wrap" id={id} role="region">
                  <div className="faq-a-inner">
                    <p className="faq-a">{a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** @param {{label: string | null}} props */
function Toast({label}) {
  return (
    <div className={`toast ${label ? 'is-on' : ''}`} role="status" aria-live="polite">
      {label ? `${label} a kosárban` : ''}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GraphQL                                                             */
/* ------------------------------------------------------------------ */

const HOME_PRODUCTS_QUERY = `#graphql
  fragment HomeImage on Image {
    id
    altText
    url
    width
    height
  }
  fragment HomeVariant on ProductVariant {
    id
    title
    availableForSale
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    selectedOptions {
      name
      value
    }
    image {
      ...HomeImage
    }
    product {
      title
      handle
    }
  }
  fragment HomeProduct on Product {
    id
    handle
    title
    description
    productType
    featuredImage {
      ...HomeImage
    }
    images(first: 3) {
      nodes {
        ...HomeImage
      }
    }
    collections(first: 4) {
      nodes {
        handle
        title
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    options {
      name
      optionValues {
        name
      }
    }
    variants(first: 50) {
      nodes {
        ...HomeVariant
      }
    }
  }
  query HomeProducts(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: CREATED_AT) {
      nodes {
        ...HomeProduct
      }
    }
  }
`;

const HOME_HERO_QUERY = `#graphql
  query HomeHero($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    collection(handle: "frontpage") {
      image {
        id
        altText
        url
        width
        height
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {import('storefrontapi.generated').HomeProductFragment} HomeProduct */
/** @typedef {import('storefrontapi.generated').HomeVariantFragment} HomeVariant */
