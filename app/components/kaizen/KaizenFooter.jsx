import {Suspense, useEffect, useRef} from 'react';
import {Await, Link, useFetcher} from 'react-router';
import {Wave} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {collectionTitle} from '~/lib/text';

const BRAND_LINKS = [
  ['A filozófia', '/#filozofia'],
  ['Kaizen Family', '/#family'],
  ['Rólunk', '/#rolunk'],
];

// Used only if the shop has no blog yet.
const FALLBACK_BLOG = {handle: 'hirek', title: 'Hírek'};

// Used only if the Storefront API returns no policies for the shop.
const FALLBACK_HELP = [
  ['Szállítás', '/policies/shipping-policy'],
  ['Visszaküldés', '/policies/refund-policy'],
  ['Adatkezelés', '/policies/privacy-policy'],
  ['ÁSZF', '/policies/terms-of-service'],
];

/**
 * Maps the shop's configured policies onto footer links. Titles are
 * localised here so the footer reads Hungarian even when the policy titles
 * in Shopify are still English.
 * @param {FooterQuery['shop'] | undefined} shop
 */
function helpLinks(shop) {
  if (!shop) return FALLBACK_HELP;
  const entries = [
    ['Szállítás', shop.shippingPolicy],
    ['Visszaküldés', shop.refundPolicy],
    ['Adatkezelés', shop.privacyPolicy],
    ['ÁSZF', shop.termsOfService],
  ].filter(([, policy]) => policy?.handle);
  if (!entries.length) return FALLBACK_HELP;
  return entries.map(([label, policy]) => [label, `/policies/${policy.handle}`]);
}

/**
 * KAIZENTYPE footer. Product and policy links come from the deferred
 * footer query; the rest is brand copy.
 * @param {{
 *   footer: Promise<FooterQuery|null>,
 *   navCollections?: Array<{handle: string, title: string}>,
 * }} props
 */
export function KaizenFooter({footer, navCollections = []}) {
  return (
    <Suspense fallback={<FooterShell collections={navCollections} />}>
      <Await
        resolve={footer}
        errorElement={<FooterShell collections={navCollections} />}
      >
        {(data) => (
          <FooterShell
            collections={navCollections}
            products={data?.products?.nodes ?? []}
            help={helpLinks(data?.shop)}
            blog={data?.blogs?.nodes?.[0] ?? FALLBACK_BLOG}
            articles={data?.articles?.nodes ?? []}
          />
        )}
      </Await>
    </Suspense>
  );
}

/**
 * @param {{
 *   collections?: Array<{handle: string, title: string}>,
 *   products?: Array<{id: string, handle: string, title: string}>,
 *   help?: Array<[string, string]>,
 *   blog?: {handle: string, title: string},
 *   articles?: Array<{id: string, handle: string, title: string, blog: {handle: string}}>,
 * }} props
 */
function FooterShell({
  collections = [],
  products = [],
  help = FALLBACK_HELP,
  blog = FALLBACK_BLOG,
  articles = [],
}) {
  const privacy = help.find(([label]) => label === 'Adatkezelés')?.[1];
  const terms = help.find(([label]) => label === 'ÁSZF')?.[1];
  return (
    <footer className="ft">
      <div className="ft-brush" aria-hidden="true">
        <Wave shape="edge" fill="var(--ink-red)" />
      </div>
      <div className="ft-grid">
        <div className="ft-brand">
          <Link to="/" className="ft-logo">
            <img
              src="/kaizen-logo.png"
              alt="KaizenType"
              width="190"
              height="190"
            />
          </Link>
          <p className="ft-tag">
            Budapesten készülő, nehéz pamut alapdarabok — és a Kaizen Family
            közösség.
          </p>
        </div>

        <div className="ft-col">
          <span className="ft-h">Vásárlás</span>
          {collections.map((c) => (
            <Link
              to={`/collections/${c.handle}`}
              key={c.handle}
              className="ft-link"
            >
              {collectionTitle(c)}
            </Link>
          ))}
          {products.map((p) => (
            <Link to={`/products/${p.handle}`} key={p.id} className="ft-link">
              {p.title}
            </Link>
          ))}
          <Link to="/collections/all" className="ft-link">
            Összes termék
          </Link>
        </div>

        <div className="ft-col">
          <span className="ft-h">A márka</span>
          {BRAND_LINKS.map(([label, to]) => (
            <Link to={to} key={label} className="ft-link">
              {label}
            </Link>
          ))}
        </div>

        <div className="ft-col">
          <span className="ft-h">Blog</span>
          {articles.map((a) => (
            <Link
              to={`/blogs/${a.blog.handle}/${a.handle}`}
              key={a.id}
              className="ft-link"
            >
              {a.title}
            </Link>
          ))}
          <Link to={`/blogs/${blog.handle}`} className="ft-link">
            Összes bejegyzés
          </Link>
        </div>

        <div className="ft-col">
          <span className="ft-h">Segítség</span>
          {help.map(([label, to]) => (
            <Link to={to} key={label} className="ft-link">
              {label}
            </Link>
          ))}
        </div>

        <div className="ft-news">
          <span className="ft-h">
            <span className="kanji">改善</span> — Hírlevél
          </span>
          <p className="ft-news-p">
            Hetente egy rövid levél a fegyelemről és a mesterségről. Semmi zaj.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="ft-base">
        <span>© {new Date().getFullYear()} KaizenType — Készült Budapesten</span>
        <span className="ft-base-links">
          {privacy ? <Link to={privacy}>Adatkezelés</Link> : null}
          {terms ? <Link to={terms}>ÁSZF</Link> : null}
        </span>
      </div>
    </footer>
  );
}

/**
 * Newsletter signup wired to the `/newsletter` resource route, which
 * subscribes the address through Shopify's customer marketing consent.
 */
function NewsletterForm() {
  const fetcher = useFetcher();
  const formRef = useRef(null);
  /** @type {import('~/routes/newsletter').NewsletterResult | undefined} */
  const result = fetcher.data;
  const busy = fetcher.state !== 'idle';
  const done = result?.ok === true;

  useEffect(() => {
    if (done) formRef.current?.reset();
  }, [done]);

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      action="/newsletter"
      className={`ft-form${done ? ' is-done' : ''}${result && !result.ok ? ' is-error' : ''}`}
      aria-label="Hírlevél feliratkozás"
    >
      <div className="ft-form-row">
        <input
          type="email"
          name="email"
          placeholder="E-mail cím"
          aria-label="E-mail"
          autoComplete="email"
          required
          disabled={busy}
        />
        {/* Honeypot: hidden from humans, filled by bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="ft-form-hp"
          aria-hidden="true"
        />
        <button
          type="submit"
          aria-label="Feliratkozás"
          disabled={busy}
          aria-busy={busy}
        >
          {done ? I.check : I.arrow}
        </button>
      </div>
      <p className="ft-form-msg" role="status" aria-live="polite">
        {result?.message ?? ''}
      </p>
    </fetcher.Form>
  );
}

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
