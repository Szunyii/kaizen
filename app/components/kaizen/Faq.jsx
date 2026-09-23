import {useState} from 'react';
import {I} from '~/components/kaizen/Icons';

/**
 * The storefront's frequently asked questions as [question, answer] pairs.
 * Single source for the homepage FAQ and the contact page.
 * @type {Array<[string, string]>}
 */
export const FAQ = [
  [
    'Melyik méretet válasszam?',
    'A termékek méretezése az általános méretezéssel készült, így javasoljuk, hogy olyan méretet válassz, amit a mindennapokban is hordasz.',
  ],
  [
    'Mennyi idő alatt érkezik meg?',
    'Raktáron lévő darabok esetén 1-3 munkanap Magyarországon, futárral. A szállításról e-mailben értesítünk.',
  ],
  [
    'Visszaküldhetem, ha nem jó a méret?',
    'Igen, 14 napon belül indoklás nélkül, viseletlen állapotban.',
  ],
  [
    'Hogyan kapom meg az app-hozzáférést?',
    'A termék megérkezése után egyértelmű lesz számodra, hogyan tudsz csatlakozni a zárt közösséghez.',
  ],
];

/**
 * Numbered accordion of questions; one item open at a time, the first by
 * default. Styled by the `.faq-*` rules in kaizen-pages.css.
 * @param {{items?: Array<[string, string]>, idPrefix?: string}} props
 */
export function FaqList({items = FAQ, idPrefix = 'faq'}) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq-list">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        const id = `${idPrefix}-${i}`;
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
  );
}
