import {useEffect} from 'react';
import {Link, useLoaderData} from 'react-router';
import {BrushRibbon} from '~/components/kaizen/Brand';
import {
  FOGYASZTOBARAT_ID,
  FOGYASZTOBARAT_ORIGIN,
  fetchFogyasztobaratDocument,
  formatEffectiveDate,
} from '~/lib/fogyasztobarat';

const CONTACT_EMAIL = 'kaizentype@gmail.com';

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
 * stored in Shopify.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const doc = await fetchFogyasztobaratDocument(context, 'aszf');
  if (!doc) {
    throw new Response(
      `Az ÁSZF jelenleg nem érhető el. Próbáld újra néhány perc múlva, vagy írj nekünk: ${CONTACT_EMAIL}`,
      {status: 503},
    );
  }
  return {
    html: doc.html,
    effectiveDate: doc.effectiveDate,
    effectiveLabel: formatEffectiveDate(doc.effectiveDate),
  };
}

export default function AszfPage() {
  /** @type {LoaderReturnData} */
  const {html, effectiveDate, effectiveLabel} = useLoaderData();

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
