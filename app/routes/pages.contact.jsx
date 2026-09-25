import {Link, useLoaderData} from 'react-router';
import {FAQ, FaqList} from '~/components/kaizen/Faq';
import {NewsletterForm} from '~/components/kaizen/NewsletterForm';
import {I} from '~/components/kaizen/Icons';
import {useReveal} from '~/lib/useReveal';

const EMAIL = 'kaizentype@gmail.com';

/** Builds a mailto link with a prefilled subject so requests arrive sorted. */
const mailto = (subject) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Kapcsolat'},
    {
      name: 'description',
      content:
        'Írj a KaizenType csapatának rendelés, méret, csere vagy együttműködés ügyében. Egy munkanapon belül válaszolunk. Iratkozz fel a heti hírlevélre.',
    },
  ];
};

/**
 * The page copy is static; the loader only checks that the shop has a privacy
 * policy so the newsletter consent note never links to a missing page.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  try {
    const {shop} = await context.storefront.query(CONTACT_POLICIES_QUERY, {
      cache: context.storefront.CacheLong(),
    });
    return {policies: shop};
  } catch (error) {
    // Policies are a convenience here; the contact details must still render.
    console.error('[contact] policies query failed', error);
    return {policies: null};
  }
}

const CHANNELS = [
  {
    label: 'Általános kérdés',
    value: EMAIL,
    href: mailto('Kérdés'),
    note: 'Termék, méret, anyag, bármi, amire a GYIK nem válaszol.',
  },
  {
    label: 'Rendelés és csere',
    value: 'Írj a rendelésszámmal',
    href: mailto('Rendelés #'),
    note: 'A rendelésszámot a visszaigazoló e-mailben találod. Így elsőre tudunk segíteni.',
  },
  {
    label: 'Együttműködés',
    value: 'Közös munka, megjelenés',
    href: mailto('Együttműködés'),
    note: 'Írd meg röviden, kik vagytok és mire gondoltatok.',
  },
];

/** The shared FAQ plus the one question that only makes sense here. */
const CONTACT_FAQ = [
  ...FAQ,
  [
    'Hol látom a rendelésem állapotát?',
    'A fiókodban, a rendeléseid között. Ugyanazzal az e-mail címmel lépj be, amivel rendeltél. Ha valami nem stimmel, írj nekünk a rendelésszámmal.',
  ],
];

export default function ContactPage() {
  /** @type {LoaderReturnData} */
  const {policies} = useLoaderData();
  const ref = useReveal();
  const faqRef = useReveal();
  const privacy = policies?.privacyPolicy?.handle;

  return (
    <div className="view-enter">
      <section className="ct" ref={ref}>
        <div className="wrap">
          <p className="kicker reveal">
            <span className="kanji">連絡</span>— Kapcsolat
          </p>
          <h1 className="ct-h display reveal reveal-d1">
            Írj nekünk. <br />
            <em className="ct-em">Egy munkanapon belül válaszolunk.</em>
          </h1>

          <div className="ct-grid">
            <div className="ct-main reveal reveal-d2">
              <dl className="ct-list">
                {CHANNELS.map((c) => (
                  <div className="ct-row" key={c.label}>
                    <dt className="ct-label">{c.label}</dt>
                    <dd className="ct-value">
                      <a className="ct-mail" href={c.href}>
                        {c.value} {I.arrow}
                      </a>
                      <p className="ct-note">{c.note}</p>
                    </dd>
                  </div>
                ))}
                <div className="ct-row">
                  <dt className="ct-label">Válaszidő</dt>
                  <dd className="ct-value">
                    <span className="ct-plain">
                      Hétköznap, egy munkanapon belül
                    </span>
                    <p className="ct-note">
                      Hétvégén érkezett levelekre hétfőn válaszolunk.
                    </p>
                  </dd>
                </div>
                <div className="ct-row">
                  <dt className="ct-label">Műhely</dt>
                  <dd className="ct-value">
                    <span className="ct-plain">Budapest, Magyarország</span>
                    <p className="ct-note">Itt készülnek a darabok.</p>
                  </dd>
                </div>
              </dl>
            </div>

            <section
              className="ct-news reveal reveal-d3"
              aria-labelledby="ct-news-h"
            >
              <p className="kicker">
                <span className="kanji">改善</span>— Hírlevél
              </p>
              <h2 id="ct-news-h" className="ct-news-h display">
                Heti egy levél.
                <br />
                Semmi zaj.
              </h2>
              <p className="ct-news-p">
                Nem küldünk sok hírlevelet, amit küldünk, az igazán hasznos lesz
                számodra.
              </p>
              <NewsletterForm
                className="ct-form"
                label="Hírlevél feliratkozás a kapcsolat oldalon"
              />
              <p className="ct-consent">
                Bármikor leiratkozhatsz egy kattintással.
                {privacy ? (
                  <>
                    {' '}
                    Az adataidat az{' '}
                    <Link to={`/policies/${privacy}`}>
                      adatkezelési tájékoztató
                    </Link>{' '}
                    szerint kezeljük.
                  </>
                ) : null}
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="faq ct-faq" ref={faqRef}>
        <div className="faq-wrap faq-grid">
          <div className="faq-head">
            <p className="kicker reveal">
              <span className="kanji">問</span>— Gyors válaszok
            </p>
            <h2 className="sec-h sec-h-sm display reveal reveal-d1">
              Lehet, hogy már
              <br />
              <em className="faq-em">megvan a válasz.</em>
            </h2>
            <p className="faq-lead reveal reveal-d2">
              Méret, szállítás, csere, rendeléskövetés és az app-hozzáférés. Ha
              itt nincs meg, írj a fenti címre.
            </p>
            <Link className="faq-contact reveal reveal-d3" to="/account">
              Rendeléseim {I.arrow}
            </Link>
          </div>

          <FaqList items={CONTACT_FAQ} idPrefix="ct-faq" />
        </div>
      </section>
    </div>
  );
}

const CONTACT_POLICIES_QUERY = `#graphql
  query ContactPolicies($language: LanguageCode, $country: CountryCode)
  @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy { handle }
    }
  }
`;

/** @typedef {import('./+types/pages.contact').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
