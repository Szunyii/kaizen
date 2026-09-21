import {useEffect, useRef} from 'react';

const REVEAL_SELECTOR = '.reveal, [data-reveal]';

/**
 * Reveal-on-scroll hook. Attach the returned ref to a container; each
 * descendant `.reveal` / `[data-reveal]` element (and the container itself,
 * if it is one) animates in when *it* scrolls into view (see kaizen.css).
 *
 * Elements are observed one by one on purpose: revealing a whole section at
 * once plays the transition for everything below the fold before anyone can
 * see it. The revealed state is a `data-revealed` attribute rather than a
 * class, so React re-rendering `className` (e.g. `is-open`) can't wipe it.
 *
 * Elements added after mount (filtered grids, pagination) show immediately.
 *
 * @param {{threshold?: number, rootMargin?: string, once?: boolean}} [opts]
 * @returns {import('react').RefObject<any>}
 */
export function useReveal(opts = {}) {
  // The huge top margin makes everything above the viewport count as "in
  // view", so content skipped by a jump (hash link, restored scroll) is
  // revealed instead of staying blank until the user scrolls back up.
  const {
    threshold = 0.15,
    rootMargin = '100000px 0px -8% 0px',
    once = true,
  } = opts;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /** @param {Element} root */
    const targetsIn = (root) => [
      ...(root.matches(REVEAL_SELECTOR) ? [root] : []),
      ...root.querySelectorAll(REVEAL_SELECTOR),
    ];
    /** @param {Element} target */
    const show = (target) => target.setAttribute('data-revealed', '');

    // No IntersectionObserver — reveal immediately.
    if (typeof IntersectionObserver === 'undefined') {
      targetsIn(el).forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show(entry.target);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.removeAttribute('data-revealed');
          }
        }
      },
      {threshold, rootMargin},
    );

    targetsIn(el).forEach((target) => observer.observe(target));

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) targetsIn(node).forEach(show);
        }
      }
    });
    mutations.observe(el, {childList: true, subtree: true});

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return ref;
}
