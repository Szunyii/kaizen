import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Link,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import favicon from '~/assets/favicon.svg';
import {
  FOOTER_QUERY,
  HEADER_QUERY,
  NAV_COLLECTIONS_QUERY,
} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import kaizenTokens from '~/styles/kaizen.css?url';
import kaizenComponents from '~/styles/kaizen-components.css?url';
import kaizenPages from '~/styles/kaizen-pages.css?url';
import {PageLayout} from './components/PageLayout';
import {EnsoMark} from '~/components/kaizen/Brand';
import {I} from '~/components/kaizen/Icons';
import {ERROR_TEXT} from '~/lib/text';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * Only the error page takes its title from root; every other route sets its own.
 * @type {Route.MetaFunction}
 */
export const meta = ({error}) => {
  if (!error) return [];
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return [
    {
      title: `${notFound ? ERROR_TEXT.notFoundKicker : ERROR_TEXT.errorKicker} — KaizenType`,
    },
  ];
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png'},
    {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
  ];
}

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context}) {
  const {storefront} = context;

  const [header, nav] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    storefront.query(NAV_COLLECTIONS_QUERY, {
      cache: storefront.CacheLong(),
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    header,
    navCollections: (nav?.collections?.nodes ?? []).filter(
      (collection) => collection.handle !== 'frontpage',
    ),
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

/**
 * @param {{children?: React.ReactNode}}
 */
export function Layout({children}) {
  const nonce = useNonce();

  return (
    <html lang="hu">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@400;500;700&family=Noto+Serif+JP:wght@500;700&display=swap"
        />
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <link rel="stylesheet" href={kaizenTokens}></link>
        <link rel="stylesheet" href={kaizenComponents}></link>
        <link rel="stylesheet" href={kaizenPages}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>
        <Outlet />
      </PageLayout>
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  /** @type {RootLoader | undefined} */
  const data = useRouteLoaderData('root');
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const page = <RouteErrorPage status={errorStatus} message={errorMessage} />;

  // Root data survives when a child route threw (unknown URL, missing product), so
  // keep the header, drawers and footer: the visitor needs a way on from here.
  if (!data) return page;

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      <PageLayout {...data}>{page}</PageLayout>
    </Analytics.Provider>
  );
}

/**
 * @param {{status: number; message: string}}
 */
function RouteErrorPage({status, message}) {
  const notFound = status === 404;

  return (
    <section className="err wrap">
      <EnsoMark size={92} stroke={9} />
      <p className="kicker">
        {status} — {notFound ? ERROR_TEXT.notFoundKicker : ERROR_TEXT.errorKicker}
      </p>
      <h1 className="err-h display">
        {notFound ? ERROR_TEXT.notFoundTitle : ERROR_TEXT.errorTitle}
      </h1>
      <p className="err-p">
        {notFound ? ERROR_TEXT.notFoundLead : ERROR_TEXT.errorLead}
      </p>
      <div className="err-cta">
        <Link className="btn" to="/#termekek">
          {ERROR_TEXT.toProducts} {I.arrow}
        </Link>
        <Link className="btn btn-ghost" to={notFound ? '/' : '/pages/contact'}>
          {notFound ? ERROR_TEXT.home : ERROR_TEXT.contact}
        </Link>
      </div>
      {import.meta.env.DEV && !notFound && message ? (
        <pre className="err-dev">{message}</pre>
      ) : null}
    </section>
  );
}

/** @typedef {LoaderReturnData} RootLoader */

/** @typedef {import('react-router').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('./+types/root').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
