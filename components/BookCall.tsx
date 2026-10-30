'use client';

import { useEffect, useRef, useState } from 'react';
import './slots.css';

const EMBED_JS = 'https://app.cal.com/embed/embed.js';
const CAL_LINK = 'sajjadmolliek/15min';
const NAMESPACE = '15min';

/**
 * The booking widget the original page rendered client-side (the captured HTML
 * only ships an empty full-height container, hence the BAILOUT marker). It is
 * Cal.com's inline embed for the `15min` event, loaded exactly like the original
 * chunk did, with a plain link as a fallback if the CDN is unreachable.
 */
export default function BookCall() {
  const host = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function boot() {
      const w = window as unknown as { Cal?: any };
      if (!w.Cal) {
        setFailed(true);
        return;
      }
      const Cal = w.Cal;
      // the embed queue is flushed by the script itself once it arrives
      Cal('init', NAMESPACE, { origin: window.location.origin });
      Cal.ns[NAMESPACE]('inline', {
        elementOrSelector: host.current,
        calLink: CAL_LINK,
        config: { layout: 'month_view' },
      });
      Cal.ns[NAMESPACE]('ui', { hideEventTypeDetails: false, layout: 'month_view' });
    }

    if ((window as unknown as { Cal?: unknown }).Cal) {
      boot();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-cal-embed]');
    if (existing) {
      existing.addEventListener('load', () => !cancelled && boot(), { once: true });
      existing.addEventListener('error', () => !cancelled && setFailed(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = EMBED_JS;
    script.async = true;
    script.dataset.calEmbed = 'true';
    script.onload = () => !cancelled && boot();
    script.onerror = () => !cancelled && setFailed(true);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="slot slot-book">
      <style>{`
        .slot-book{width:100%;max-width:1024px;margin:0 auto;padding:32px 20px 72px;
          color:#fff;position:relative;z-index:2;font-family:inherit}
        .slot-book h2{font-size:clamp(28px,4.4vw,44px);font-weight:800;letter-spacing:-.02em;
          text-align:center;margin:0 0 8px;
          background:linear-gradient(120deg,#7ef7d5,#8fb8ff 55%,#c8a8ff);
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .slot-book p.lead{text-align:center;color:rgba(255,255,255,.65);font-size:16px;
          line-height:1.6;margin:0 auto 28px;max-width:60ch}
        .slot-book .host{min-height:640px;border-radius:24px;overflow:hidden;
          border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)}
        .slot-book .fallback{text-align:center;padding:60px 20px;color:rgba(255,255,255,.75)}
        .slot-book .fallback a{display:inline-block;margin-top:14px;padding:13px 28px;border-radius:999px;
          background:linear-gradient(120deg,#5eead4,#93c5fd);color:#04121a;font-weight:700;text-decoration:none}
        .slot-book .hint{text-align:center;color:rgba(255,255,255,.45);font-size:13.5px;margin-top:16px}
      `}</style>

      <h2>Book a Call</h2>
      <p className="lead">
        Schedule a 15-minute call and let&rsquo;s talk about your project, an idea, or working together.
      </p>

      {failed ? (
        <div className="fallback">
          <p>The scheduler could not load right now — book directly instead:</p>
          <a href={`https://cal.com/${CAL_LINK}`} target="_blank" rel="noreferrer">
            Open the booking page
          </a>
        </div>
      ) : (
        <div className="host">
          <div className="cal-embed" ref={host} />
        </div>
      )}

      <p className="hint">Times are shown in your local timezone.</p>
    </section>
  );
}
