import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import {I} from '~/components/kaizen/Icons';

/**
 * Newsletter signup wired to the `/newsletter` resource route, which
 * subscribes the address through Shopify's customer marketing consent.
 * Each instance owns its fetcher, so the footer form and an in-page form
 * can live on the same route without sharing state.
 * @param {{className?: string, label?: string}} props
 */
export function NewsletterForm({
  className = '',
  label = 'Hírlevél feliratkozás',
}) {
  const fetcher = useFetcher();
  const formRef = useRef(null);
  /** @type {import('~/routes/newsletter').NewsletterResult | undefined} */
  const result = fetcher.data;
  const busy = fetcher.state !== 'idle';
  const done = result?.ok === true;

  useEffect(() => {
    if (done) formRef.current?.reset();
  }, [done]);

  return (
    <fetcher.Form
      ref={formRef}
      method="post"
      action="/newsletter"
      className={`ft-form${className ? ` ${className}` : ''}${done ? ' is-done' : ''}${result && !result.ok ? ' is-error' : ''}`}
      aria-label={label}
    >
      <div className="ft-form-row">
        <input
          type="email"
          name="email"
          placeholder="E-mail cím"
          aria-label="E-mail"
          autoComplete="email"
          required
          disabled={busy}
        />
        {/* Honeypot: hidden from humans, filled by bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="ft-form-hp"
          aria-hidden="true"
        />
        <button
          type="submit"
          aria-label="Feliratkozás"
          disabled={busy}
          aria-busy={busy}
        >
          {done ? I.check : I.arrow}
        </button>
      </div>
      <p className="ft-form-msg" role="status" aria-live="polite">
        {result?.message ?? ''}
      </p>
    </fetcher.Form>
  );
}
