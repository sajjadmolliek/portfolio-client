'use client';

import { useEffect } from 'react';

/**
 * The reference /bookCall page is nothing but Cal.com's inline embed inside the
 * captured full-height container — no heading, no copy, no fallback text. This is
 * the same wiring its chunk performed: bootstrap the embed script under the
 * `15min` namespace, load the `sajjadmolliek/15min` event as a month view, then
 * expose the month layout through `ui()`.
 *
 * The embed mounts into the `[data-slot="cal-inline"]` host the captured markup
 * already places inside that container: the component itself renders nothing, so
 * the flex container keeps its size and the iframe lands where the reference's
 * does.
 */

const EMBED_JS = 'https://app.cal.com/embed/embed.js';
const CAL_LINK = 'sajjadmolliek/15min';
const NAMESPACE = '15min';

type Cal = ((...args: unknown[]) => void) & {
  loaded?: boolean;
  ns?: Record<string, ((...args: unknown[]) => void) & { q?: unknown[] }>;
  q?: unknown[];
};

function loadCal(embedJsUrl = EMBED_JS): Cal {
  const w = window as unknown as { Cal?: Cal };
  const cal: Cal = (w.Cal = w.Cal || function (...args: unknown[]) {
    const push = (target: { q?: unknown[] }, value: unknown) => {
      target.q = target.q || [];
      target.q.push(value);
    };
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      const script = document.createElement('script');
      script.src = embedJsUrl;
      document.head.appendChild(script);
      cal.loaded = true;
    }
    if (args[0] === 'init') {
      const namespace = args[1];
      if (typeof namespace === 'string') {
        const init = ((...inner: unknown[]) => push(init, inner)) as { q?: unknown[] };
        cal.ns![namespace] = init as Cal;
        push(init, args);
        push(cal, ['initNamespace', namespace]);
      } else {
        push(cal, args);
      }
      return;
    }
    push(cal, args);
  } as Cal);
  return cal;
}

export default function BookCall() {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>('[data-slot="cal-inline"]');
    if (!host) return;
    const cal = loadCal();
    // no `origin` override: the embed must load from app.cal.com, exactly as the
    // reference's own iframe does
    cal('init', NAMESPACE);
    const ns = cal.ns?.[NAMESPACE];
    ns?.('inline', {
      elementOrSelector: host,
      calLink: CAL_LINK,
      config: { layout: 'month_view' },
    });
    ns?.('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  }, []);

  return null;
}
