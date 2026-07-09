import {useEffect, useRef} from 'react';

/**
 * Reveal-on-scroll hook. Attach the returned ref to a container; once it
 * scrolls into view, the `in` class is added so descendant `.reveal`
 * elements animate in (see kaizen.css).
 *
 * @param {{threshold?: number, rootMargin?: string, once?: boolean}} [opts]
 * @returns {import('react').RefObject<any>}
 */
export function useReveal(opts = {}) {
  const {threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true} = opts;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (or reduced data) — reveal immediately.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove('in');
          }
        }
      },
      {threshold, rootMargin},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
