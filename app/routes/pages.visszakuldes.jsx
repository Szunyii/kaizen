import {useState} from 'react';
import {
  data as routeData,
  Link,
  useFetcher,
  useLoaderData,
} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {FaqList} from '~/components/kaizen/Faq';
import {I} from '~/components/kaizen/Icons';
import {CUSTOMER_RETURNS_QUERY} from '~/graphql/customer-account/CustomerReturnsQuery';
import {ORDER_REQUEST_RETURN_MUTATION} from '~/graphql/customer-account/OrderRequestReturnMutation';
import {formatDate, STATUS_HU} from '~/lib/accountText';
import {formatMoney} from '~/lib/money';
import {
  DECLINE_HU,
  NOTE_MAX_LENGTH,
  nonReturnableMessage,
  parseReturnForm,
  reasonLabel,
  returnErrorMessage,
  RETURN_FIELDS,
  RETURN_STATUS_HU,
  RETURN_TEXT,
} from '~/lib/returns';
import {useReveal} from '~/lib/useReveal';

const PAGE_PATH = '/pages/visszakuldes';
const CONTACT_EMAIL = 'kaizentype@gmail.com';
const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Visszaküldés, rendelés #',
)}`;
/** Hydrogen's login keeps `return_to` and sends the customer back here. */
const LOGIN_URL = `/account/login?return_to=${encodeURIComponent(PAGE_PATH)}`;
/** The shop's only published locale; return reasons come back in it. */
const LANGUAGE = 'HU';
/** Per-customer content: never let a shared cache keep it. */
const NO_CACHE = {'Cache-Control': 'no-cache, no-store, must-revalidate'};

const STEPS = [
  [
    'Kérd a visszaküldést',
    'Lépj be a fiókodba, jelöld ki a darabokat, és küldd el a kérést. Az átvételtől számított 14 napon belül teheted meg, indoklás nélkül.',
  ],
  [
    'Csomagold be és add fel',
    'A jóváhagyás után e-mailben küldjük a visszaküldési címet. Viseletlenül, címkével, lehetőleg az eredeti csomagolásban add fel.',
  ],
  [
    'Visszatérítés',
    'A csomag beérkezése után legfeljebb 14 napon belül visszautaljuk az árat ugyanarra a fizetési módra, amivel fizettél.',
  ],
];

/** @type {Array<[string, string]>} */
const RETURN_FAQ = [
  [
    'Meddig küldhetem vissza?',
    'Az átvételtől számított 14 napon belül, indoklás nélkül. A kérést itt, a fiókodból indítod; a jóváhagyásról e-mailben értesítünk.',
  ],
  [
    'Ki fizeti a visszaküldést?',
    'A visszaküldés postaköltsége a vásárlót terheli. Ha hibás vagy nem a rendelt terméket kaptad, természetesen mi álljuk.',
  ],
  [
    'Mikor kapom vissza a pénzt?',
    'A csomag beérkezése után legfeljebb 14 napon belül, ugyanarra a fizetési módra, amivel fizettél.',
  ],
  [
    'Cserélhetek másik méretre?',
    'Igen: küldd vissza a darabot, és add le az új rendelést a jó méretre, így a leggyorsabb. Ha elakadsz, írj nekünk a rendelésszámmal.',
  ],
  [
    'Vendégként rendeltem, nincs fiókom.',
    'Lépj be azzal az e-mail címmel, amivel rendeltél. A fiók az első belépéskor magától létrejön, és ott vannak benne a rendeléseid.',
  ],
];

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Visszaküldés'},
    {
      name: 'description',
      content:
        'Nem jó a méret? 14 napon belül indoklás nélkül visszaküldheted a KaizenType darabjait. Kérd a visszaküldést a fiókodból; a visszatérítés a csomag beérkezése után 14 napon belül érkezik.',
    },
  ];
};

/**
 * Logged-out visitors get the policy and a login CTA. Logged-in customers
 * also get their orders with return eligibility and earlier returns. A
 * failed orders query degrades to a note instead of an error page: the
 * policy text is the reason the footer links here.
 * @param {Route.LoaderArgs} args
 */
export async function loader({context}) {
  const {customerAccount} = context;
  const isLoggedIn = await customerAccount.isLoggedIn();
  if (!isLoggedIn) {
    return routeData(
      {loggedIn: false, orders: null, loadError: false},
      {headers: NO_CACHE},
    );
  }
  try {
    const {data, errors} = await customerAccount.query(
      CUSTOMER_RETURNS_QUERY,
      {variables: {language: LANGUAGE}},
    );
    if (errors?.length || !data?.customer) {
      throw new Error(errors?.[0]?.message ?? 'Customer not found');
    }
    return routeData(
      {loggedIn: true, orders: data.customer.orders.nodes, loadError: false},
      {headers: NO_CACHE},
    );
  } catch (error) {
    // A Response here is Hydrogen's redirect to the login; let it through.
    if (error instanceof Response) throw error;
    console.error('[visszakuldes] orders query failed', error);
    return routeData(
      {loggedIn: true, orders: null, loadError: true},
      {headers: NO_CACHE},
    );
  }
}

/**
 * Turns one order's form into an `orderRequestReturn` call. Errors come
 * back as data (never as a redirect to the login) so the form that sent
 * them can show the message.
 * @param {Route.ActionArgs} args
 */
export async function action({request, context}) {
  const {customerAccount} = context;
  if (request.method !== 'POST') {
    return routeData({orderId: '', error: 'Method not allowed'}, {status: 405});
  }
  const {orderId, requestedLineItems, error} = parseReturnForm(
    await request.formData(),
  );
  if (error) {
    return routeData({orderId, error}, {status: 400});
  }
  if (!(await customerAccount.isLoggedIn())) {
    return routeData({orderId, error: RETURN_TEXT.errNotLoggedIn}, {status: 401});
  }
  try {
    const {data, errors} = await customerAccount.mutate(
      ORDER_REQUEST_RETURN_MUTATION,
      {variables: {orderId, requestedLineItems, language: LANGUAGE}},
    );
    if (errors?.length) {
      throw new Error(errors[0].message);
    }
    const payload = data?.orderRequestReturn;
    const userError = payload?.userErrors?.[0];
    if (userError) {
      return routeData(
        {orderId, error: returnErrorMessage(userError)},
        {status: 400},
      );
    }
    return {orderId, error: null, returnName: payload?.return?.name ?? null};
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error('[visszakuldes] orderRequestReturn failed', err);
    return routeData({orderId, error: returnErrorMessage(null)}, {status: 400});
  }
}

export default function ReturnsPage() {
  /** @type {LoaderReturnData} */
  const {loggedIn, orders, loadError} = useLoaderData();
  const ref = useReveal();
  const faqRef = useReveal();

  return (
    <div className="view-enter">
      <section className="rt" ref={ref}>
        <div className="wrap">
          <p className="kicker reveal">
            <span className="kanji">返品</span>— Visszaküldés
          </p>
          <h1 className="rt-h display reveal reveal-d1">
            Nem jött be?
            <br />
            <em className="rt-em">14 napon belül visszaküldheted.</em>
          </h1>
          <p className="rt-lead reveal reveal-d2">
            Indoklás nélkül, viseletlen, címkés állapotban. A visszatérítést a
            csomag beérkezése után legfeljebb 14 napon belül utaljuk vissza az
            eredeti fizetési módra.
          </p>

          <section
            className="rt-sec reveal reveal-d3"
            aria-labelledby="rt-steps-h"
          >
            <h2 id="rt-steps-h" className="rt-sec-h display">
              Így működik
            </h2>
            <ol className="rt-steps">
              {STEPS.map(([heading, text], i) => (
                <li className="rt-step" key={heading}>
                  <span className="rt-step-n display" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="rt-step-h">{heading}</h3>
                  <p className="rt-step-p">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rt-sec" id="inditas" aria-labelledby="rt-start-h">
            <h2 id="rt-start-h" className="rt-sec-h display">
              Visszaküldés indítása
            </h2>
            {!loggedIn ? (
              <LoginPanel />
            ) : loadError ? (
              <ErrorPanel />
            ) : (
              <OrderList orders={orders ?? []} />
            )}
          </section>
        </div>
      </section>

      <section className="faq rt-faq" ref={faqRef}>
        <div className="faq-wrap faq-grid">
          <div className="faq-head">
            <p className="kicker reveal">
              <span className="kanji">問</span>— Kérdések
            </p>
            <h2 className="sec-h sec-h-sm display reveal reveal-d1">
              Amit még
              <br />
              <em className="faq-em">tudni érdemes.</em>
            </h2>
            <p className="faq-lead reveal reveal-d2">
              Határidő, költség, visszatérítés és csere. Ha itt nincs meg a
              válasz, írj nekünk a rendelésszámmal.
            </p>
            <Link className="faq-contact reveal reveal-d3" to="/pages/contact">
              Kapcsolat {I.arrow}
            </Link>
          </div>
          <FaqList items={RETURN_FAQ} idPrefix="rt-faq" />
        </div>
      </section>
    </div>
  );
}

function LoginPanel() {
  return (
    <div className="rt-panel">
      <p className="rt-panel-p">
        A visszaküldést a fiókodból kéred: ott látod a rendeléseidet, és
        kijelölöd, mit küldesz vissza. Nincs jelszó, az e-mail-címedre küldött
        kóddal lépsz be.
      </p>
      <div className="rt-panel-cta">
        <Link className="btn" to={LOGIN_URL} prefetch="none">
          Bejelentkezés {I.arrow}
        </Link>
      </div>
      <p className="rt-panel-note">
        Vendégként rendeltél? Ugyanazzal az e-mail címmel lépj be, amivel a
        rendelést leadtad. Ha nem megy, írj nekünk:{' '}
        <a href={MAILTO}>{CONTACT_EMAIL}</a>
      </p>
    </div>
  );
}

function ErrorPanel() {
  return (
    <div className="rt-panel">
      <p className="rt-panel-p">
        Nem sikerült betölteni a rendeléseidet. Próbáld újra egy perc múlva,
        vagy írj nekünk a rendelésszámmal.
      </p>
      <div className="rt-panel-cta">
        <Link className="btn btn-ghost" to={PAGE_PATH} reloadDocument>
          Újra {I.refresh}
        </Link>
        <a className="btn btn-ghost" href={MAILTO}>
          Írok nektek {I.arrow}
        </a>
      </div>
    </div>
  );
}

/**
 * @param {{orders: ReturnsOrderFragment[]}} props
 */
function OrderList({orders}) {
  if (!orders.length) {
    return (
      <div className="acct-empty">
        <span className="acct-empty-kanji" aria-hidden="true">
          無
        </span>
        <p>Ehhez a fiókhoz még nem tartozik rendelés.</p>
        <Link className="btn" to="/#termekek">
          Irány a termékek
        </Link>
      </div>
    );
  }
  return (
    <div className="rt-orders">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

/**
 * One order: header, its earlier returns, then the request form (or the
 * reason there is nothing to return). The fetcher lives here, not in the
 * form, so the success note survives the form disappearing after the
 * loader revalidates.
 * @param {{order: ReturnsOrderFragment}} props
 */
function OrderCard({order}) {
  /** @type {ReturnFetcher} */
  const fetcher = useFetcher();
  const returnable = order.returnInformation?.returnableLineItems?.nodes ?? [];
  const returns = order.returns?.nodes ?? [];
  const result = fetcher.data;
  const submitted = Boolean(result && !result.error);
  const headingId = `rt-o-${order.number}`;

  return (
    <article className="rt-order" aria-labelledby={headingId}>
      <header className="rt-order-head">
        <div>
          <h3 id={headingId} className="rt-order-num">
            Rendelés {order.name}
          </h3>
          <p className="rt-order-meta">
            <span>{formatDate(order.processedAt)}</span>
            {order.fulfillmentStatus ? (
              <span className="acct-chip">
                {STATUS_HU[order.fulfillmentStatus] ?? order.fulfillmentStatus}
              </span>
            ) : null}
          </p>
        </div>
        <Link className="acct-link" to={`/account/orders/${btoa(order.id)}`}>
          Részletek →
        </Link>
      </header>

      {returns.length ? <ReturnHistory returns={returns} /> : null}

      {submitted ? (
        <p className="rt-msg rt-msg-ok" role="status">
          Megkaptuk a kérésedet
          {result?.returnName ? ` (${result.returnName})` : ''}. E-mailben
          jelezzük, ha jóváhagytuk, és küldjük a feladáshoz szükséges
          lépéseket.
        </p>
      ) : null}

      {returnable.length ? (
        <ReturnForm
          key={returnable.map((r) => `${r.lineItem.id}:${r.quantity}`).join('|')}
          order={order}
          items={returnable}
          fetcher={fetcher}
        />
      ) : submitted ? null : (
        <p className="rt-order-note">
          {nonReturnableMessage(order.returnInformation?.nonReturnableSummary)}
        </p>
      )}
    </article>
  );
}

/**
 * @param {{returns: ReturnsOrderFragment['returns']['nodes']}} props
 */
function ReturnHistory({returns}) {
  return (
    <ul className="rt-returns" aria-label="Korábbi visszaküldések">
      {returns.map((ret) => {
        const note = ret.status === 'DECLINED' ? declineText(ret.decline) : '';
        return (
          <li className="rt-return" key={ret.id}>
            <div className="rt-return-head">
              <span>Visszaküldés {ret.name}</span>
              <span
                className={`acct-chip${ret.status === 'DECLINED' ? ' red' : ''}`}
              >
                {RETURN_STATUS_HU[ret.status] ?? ret.status}
              </span>
              <span className="rt-return-date">{formatDate(ret.createdAt)}</span>
            </div>
            <ul className="rt-return-items">
              {ret.returnLineItems.nodes.map((line) => {
                const reason = reasonLabel(line.returnReasonDefinition);
                return (
                  <li key={line.id}>
                    {line.lineItem.name}
                    {line.lineItem.variantTitle
                      ? ` (${line.lineItem.variantTitle})`
                      : ''}{' '}
                    × {line.quantity}
                    {reason ? ` · ${reason}` : ''}
                  </li>
                );
              })}
            </ul>
            {note ? <p className="rt-return-note">{note}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * @param {{reason: string, note?: string | null} | null | undefined} decline
 */
function declineText(decline) {
  if (!decline) return '';
  const why = DECLINE_HU[decline.reason] ?? '';
  const note = decline.note?.trim() ?? '';
  if (!why && !note) return '';
  return `Indok: ${[why, note].filter(Boolean).join('. ')}`;
}

/**
 * Checkbox per returnable line; quantity and reason appear for the checked
 * rows. One note for the whole request. Field names are the parser's
 * (RETURN_FIELDS in app/lib/returns.js).
 * @param {{
 *   order: ReturnsOrderFragment,
 *   items: ReturnsOrderFragment['returnInformation']['returnableLineItems']['nodes'],
 *   fetcher: ReturnFetcher,
 * }} props
 */
function ReturnForm({order, items, fetcher}) {
  const [selected, setSelected] = useState(() => new Set());
  const busy = fetcher.state !== 'idle';
  const error = fetcher.data?.error;

  /** @param {string} id @param {boolean} on */
  const toggle = (id, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <fetcher.Form
      method="post"
      className="rt-form"
      aria-label={`Visszaküldés kérése, rendelés ${order.name}`}
    >
      <input type="hidden" name={RETURN_FIELDS.ORDER_ID} value={order.id} />
      <ul className="rt-items">
        {items.map(({quantity, lineItem}) => {
          const checked = selected.has(lineItem.id);
          const reasons = lineItem.suggestedReturnReasonDefinitions?.nodes ?? [];
          const inputId = `rt-i-${order.number}-${gidTail(lineItem.id)}`;
          return (
            <li className={`rt-item${checked ? ' is-on' : ''}`} key={lineItem.id}>
              <label className="rt-item-pick" htmlFor={inputId}>
                <input
                  id={inputId}
                  type="checkbox"
                  name={RETURN_FIELDS.ITEM}
                  value={lineItem.id}
                  checked={checked}
                  onChange={(event) => toggle(lineItem.id, event.target.checked)}
                  disabled={busy}
                />
                {lineItem.image ? (
                  <Image data={lineItem.image} width={64} height={64} />
                ) : (
                  <span className="rt-item-ph" aria-hidden="true" />
                )}
                <span className="rt-item-text">
                  <span className="rt-item-name">{lineItem.name}</span>
                  {lineItem.variantTitle ? (
                    <span className="rt-item-var">{lineItem.variantTitle}</span>
                  ) : null}
                  <span className="rt-item-price">
                    {formatMoney(lineItem.price)}
                    {quantity > 1 ? ` · ${quantity} db visszaküldhető` : ''}
                  </span>
                </span>
              </label>
              {checked ? (
                <div className="rt-item-ctl">
                  {quantity > 1 ? (
                    <label className="rt-field">
                      <span className="acct-label">Mennyiség</span>
                      <select
                        className="acct-input"
                        name={`${RETURN_FIELDS.QUANTITY_PREFIX}${lineItem.id}`}
                        defaultValue="1"
                        disabled={busy}
                      >
                        {Array.from({length: quantity}, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {reasons.length ? (
                    <label className="rt-field">
                      <span className="acct-label">Ok (nem kötelező)</span>
                      <select
                        className="acct-input"
                        name={`${RETURN_FIELDS.REASON_PREFIX}${lineItem.id}`}
                        defaultValue=""
                        disabled={busy}
                      >
                        <option value="">Válassz okot</option>
                        {reasons.map((reason) => (
                          <option key={reason.id} value={reason.id}>
                            {reasonLabel(reason)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <label className="rt-field rt-note">
        <span className="acct-label">Megjegyzés (nem kötelező)</span>
        <textarea
          className="acct-input"
          name={RETURN_FIELDS.NOTE}
          rows={3}
          maxLength={NOTE_MAX_LENGTH}
          placeholder="Ha van, amit tudnunk érdemes."
          disabled={busy}
        />
      </label>

      {error ? (
        <p className="acct-error rt-msg" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rt-actions">
        <button
          className="btn"
          type="submit"
          disabled={busy || selected.size === 0}
        >
          {busy ? 'Küldés…' : 'Visszaküldés kérése'}
          {busy ? null : I.arrow}
        </button>
        <span className="rt-actions-note">
          {selected.size
            ? `${selected.size} tétel kijelölve`
            : 'Jelöld ki, mit küldesz vissza.'}
        </span>
      </div>
    </fetcher.Form>
  );
}

/** The numeric tail of a Shopify GID, for DOM ids. */
function gidTail(id) {
  return String(id).split('/').pop();
}

/** @typedef {import('./+types/pages.visszakuldes').Route} Route */
/** @typedef {import('customer-accountapi.generated').ReturnsOrderFragment} ReturnsOrderFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useFetcher<typeof action>>} ReturnFetcher */
