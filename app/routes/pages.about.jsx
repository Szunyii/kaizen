import {Link} from 'react-router';
import {useReveal} from '~/lib/useReveal';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'KaizenType — Philosophy'},
    {
      name: 'description',
      content:
        '改善 — kaizen — the Japanese practice of relentless, incremental improvement, and the spirit behind everything we make.',
    },
  ];
};

export default function AboutPage() {
  const ref = useReveal();
  const cards = [
    [
      '改',
      'Kai',
      'Change · reform',
      'Question the habit. Strip what doesn’t serve. Redraw the line a little cleaner.',
    ],
    [
      '善',
      'Zen',
      'For the better',
      'Direction matters more than speed. Every choice bends toward better, or it is cut.',
    ],
  ];
  return (
    <div className="view-enter">
      <section className="phil" ref={ref}>
        <div className="wrap">
          <p className="kicker phil-kicker reveal">The idea</p>
          <h1 className="phil-h display reveal reveal-d1">
            Kaizen is not a sprint.{' '}
            <br />
            It is the small better,{' '}
            <br />
            <span className="phil-em">repeated forever.</span>
          </h1>
          <div className="phil-grid">
            <div className="phil-left reveal reveal-d2">
              <p className="phil-p">
                <span className="phil-kai">改善</span> — <em>kaizen</em> — is
                the Japanese practice of relentless, incremental improvement.
                We build clothing in that spirit: refined patterns, honest
                materials, nothing wasted. Garments made to be worn into the
                work, day after day.
              </p>
              <Link className="phil-link" to="/collections/all">
                Shop the collection <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="phil-right">
              {cards.map((c, i) => (
                <div className={`phil-card reveal reveal-d${i + 2}`} key={c[1]}>
                  <span className="phil-kanji">{c[0]}</span>
                  <div>
                    <span className="phil-rom">{c[1]}</span>
                    <h3 className="phil-card-h">{c[2]}</h3>
                    <p className="phil-card-p">{c[3]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** @typedef {import('./+types/pages.about').Route} Route */
