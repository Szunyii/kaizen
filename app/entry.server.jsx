import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

// Fogyasztóbarát trust badge (loaded from KaizenFooter). Its loader is
// injected after hydration without a nonce, fetches the badge markup over
// XHR, then loads images, Google Fonts and an iframe from this origin.
const FOGYASZTOBARAT_ORIGIN = 'https://admin.fogyasztobarat.hu';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} reactRouterContext
 * @param {HydrogenRouterContextProvider} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // Allow the Google Fonts stylesheet + font files used by the KaizenType
    // typography. These are merged with Hydrogen's defaults; without them the
    // production CSP blocks the fonts and every custom face falls back to a
    // system font.
    styleSrc: ['https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    // Hydrogen only merges its defaults into style-src and connect-src. The
    // script/img/frame directives below otherwise fall back to default-src,
    // so they must repeat the default-src hosts or the app's own scripts and
    // Shopify CDN images get blocked as soon as the directive is set.
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      FOGYASZTOBARAT_ORIGIN,
    ],
    connectSrc: [FOGYASZTOBARAT_ORIGIN],
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'data:', // the badge markup uses inline SVG data URIs as backgrounds
      FOGYASZTOBARAT_ORIGIN,
    ],
    frameSrc: ["'self'", FOGYASZTOBARAT_ORIGIN],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/hydrogen').HydrogenRouterContextProvider} HydrogenRouterContextProvider */
/** @typedef {import('react-router').EntryContext} EntryContext */
