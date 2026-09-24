import {useEffect, useRef} from 'react';
import {Link, useLoaderData} from 'react-router';
import {BrushRibbon} from '~/components/kaizen/Brand';
import {
  FOGYASZTOBARAT_EMBED_LOADER,
  FOGYASZTOBARAT_ID,
  FOGYASZTOBARAT_ORIGIN,
  fetchFogyasztobaratDocument,
  formatEffectiveDate,
} from '~/lib/fogyasztobarat';

const CONTACT_EMAIL = 'kaizentype@gmail.com';

/**
 * Which version of the page is shown:
 * - 'embed': the vendor's embeddable widget, exactly as the vendor styles it
 *   (only has content on kaizentype.com, see FOGYASZTOBARAT_EMBED_LOADER);
 * - 'generated': the ÁSZF text fetched server-side and set in the site's
 *   article styles.
 * @type {'embed' | 'generated'}
 */
const ASZF_SOURCE = 'embed';

/**
 * Document type of the embed widget, as in the vendor's snippet. 'def' is the
 * illustrated consumer information ("Képes fogyasztói tájékoztató"), 'aszf'
 * the ÁSZF itself.
 */
const EMBED_TYPE = 'def';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — ÁSZF'},
    {
      name: 'description',
      content:
        'A KaizenType webáruház általános szerződési feltételei és a vásárlókat megillető jogokról szóló fogyasztói tájékoztató.',
    },
    // The generated text is a template shared by many shops and the vendor
    // marks it noindex itself; keep search engines off it.
    {name: 'robots', content: 'noindex, nofollow'},
  ];
};

/**
 * The document is generated and kept current in the Fogyasztóbarát system,
 * so it is fetched (and cached) server-side on every request instead of being
 * stored in Shopify. The embed loads in the browser and needs no data.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  if (ASZF_SOURCE === 'embed') return {generated: null};

  const doc = await fetchFogyasztobaratDocument(context, 'aszf');
  if (!doc) {
    throw new Response(
      `Az ÁSZF jelenleg nem érhető el. Próbáld újra néhány perc múlva, vagy írj nekünk: ${CONTACT_EMAIL}`,
      {status: 503},
    );
  }
  return {
    generated: {
      html: doc.html,
      effectiveDate: doc.effectiveDate,
      effectiveLabel: formatEffectiveDate(doc.effectiveDate),
    },
  };
}

export default function AszfPage() {
  /** @type {LoaderReturnData} */
  const {generated} = useLoaderData();
  return generated ? <GeneratedAszf {...generated} /> : <EmbeddedAszf />;
}

/**
 * The vendor's embed snippet, run from an effect instead of pasted as an
 * inline <script> (which would need the CSP nonce and would not run again on
 * client-side navigation). e-api.js inserts the widget right after its own
 * <script> tag and reads its settings from `#fbarat-embed`, so the tag is
 * created inside the container the widget should fill.
 */
function EmbeddedAszf() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    // StrictMode runs this twice in development; a second loader would take
    // the vendor's "second widget on the page" branch and fail. No cleanup:
    // everything the loader adds lives in the container and leaves with it.
    if (!container || container.querySelector('#fbarat-embed')) return;
    const script = document.createElement('script');
    script.src = FOGYASZTOBARAT_EMBED_LOADER;
    script.id = 'fbarat-embed';
    script.dataset.id = FOGYASZTOBARAT_ID;
    script.dataset.type = EMBED_TYPE;
    container.appendChild(script);
  }, []);

  return (
    <div className="doc-embed view-enter">
      <h1 className="sr-only">ÁSZF és fogyasztói tájékoztató</h1>
      <div ref={containerRef} className="wrap doc-embed-body" />
    </div>
  );
}

/**
 * @param {NonNullable<LoaderReturnData['generated']>} props
 */
function GeneratedAszf({html, effectiveDate, effectiveLabel}) {
  useEffect(() => {
    // The vendor's embed snippet reports each view so the account shows the
    // document as live on the site; replay it without its jQuery wrapper.
    fetch(`${FOGYASZTOBARAT_ORIGIN}/hud/us-file.php`, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `page=html_aszf&embed=0&id=${FOGYASZTOBARAT_ID}&html=aszf`,
      keepalive: true,
    }).catch(() => {});
  }, []);

  return (
    <div className="art doc view-enter">
      <article>
        <header className="art-head">
          <div className="art-head-kanji" aria-hidden="true">
            約款
          </div>
          <div className="wrap art-head-inner">
            <nav className="art-crumbs" aria-label="Morzsa navigáció">
              <Link to="/">Kezdőlap</Link>
              <span aria-hidden="true">/</span>
              <span className="art-crumb-now">ÁSZF</span>
            </nav>
            <h1 className="art-h display">Általános szerződési feltételek</h1>
            <p className="art-lead">
              A KaizenType webáruház szerződési feltételei és a vásárlókat
              megillető jogokról szóló fogyasztói tájékoztató.
            </p>
            <p className="art-meta">
              {effectiveLabel ? (
                <>
                  <span>
                    Hatályos:{' '}
                    <time dateTime={effectiveDate ?? undefined}>
                      {effectiveLabel}
                    </time>
                  </span>
                  <span className="art-dot" aria-hidden="true" />
                </>
              ) : null}
              <span>Fogyasztó Barát rendszerében készült</span>
            </p>
          </div>
          <div className="art-head-brush" aria-hidden="true">
            <BrushRibbon opacity={0.65} />
          </div>
        </header>

        <div className="wrap art-body">
          <div
            className="art-prose doc-prose"
            dangerouslySetInnerHTML={{__html: html}}
          />
        </div>
      </article>
    </div>
  );
}

/** @typedef {import('./+types/pages.aszf').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
