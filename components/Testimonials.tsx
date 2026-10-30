'use client';

import { useState } from 'react';
import { useApi, type Testimonial } from '@/lib/api';
import './slots.css';

/**
 * The "Word on the street about me" section on the home page. The original
 * fetched its carousel from /api/comments; it now reads the dashboard API's
 * /api/testimonials, which is fed by the guestbook and the dashboard itself.
 */
export default function Testimonials() {
  const { data, error, loading } = useApi<Testimonial[]>('/api/testimonials');
  const [index, setIndex] = useState(0);

  const list = data || [];
  const current = list.length ? list[((index % list.length) + list.length) % list.length] : null;
  const step = (delta: number) => setIndex(i => i + delta);

  return (
    <section className="slot slot-words">
      <style>{`
        .slot-words{--ink:#fff;--dim:rgba(255,255,255,.7);--line:rgba(255,255,255,.12);
          position:relative;z-index:2;width:100%;padding:80px 20px 96px;color:var(--ink);
          background:linear-gradient(to bottom,#000,#0a0a0a);text-align:center;font-family:inherit}
        .slot-words h2{font-size:clamp(30px,5vw,60px);font-weight:800;line-height:1.1;margin:0 0 14px}
        .slot-words h2 em{font-family:'Pacifico',cursive;font-style:normal;
          background:linear-gradient(135deg,#FF0080,#9D6EF5,#4DA6FF,#38bdf8,#FF0080);
          background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent}
        .slot-words .lead{color:var(--dim);font-size:16px;line-height:1.6;margin:0 auto 40px;max-width:60ch}
        .slot-words .lead b{color:#fde047;font-weight:700}
        .slot-words .stage{position:relative;max-width:860px;margin:0 auto;min-height:230px;
          display:flex;align-items:stretch;justify-content:center}
        .slot-words .card{flex:1;background:rgba(255,255,255,.05);border:1px solid var(--line);
          border-radius:24px;padding:32px 34px;backdrop-filter:blur(14px);text-align:left;
          box-shadow:0 30px 70px rgba(0,0,0,.55);display:flex;flex-direction:column;gap:16px}
        .slot-words .who{display:flex;align-items:center;gap:12px}
        .slot-words .ava{width:44px;height:44px;border-radius:50%;object-fit:cover;
          background:linear-gradient(120deg,#5eead4,#93c5fd);display:grid;place-items:center;
          font-weight:700;color:#04121a;font-size:16px;overflow:hidden}
        .slot-words .name{font-weight:700;font-size:16px}
        .slot-words .when{display:block;color:rgba(255,255,255,.45);font-size:12.5px;font-weight:400}
        .slot-words .quote{color:#e6e9f7;font-size:17px;line-height:1.65;white-space:pre-wrap;margin:0}
        .slot-words .quote::before{content:'“';display:block;font-family:'Pacifico',cursive;
          font-size:44px;line-height:.6;color:#5eead4;margin-bottom:6px}
        .slot-words .nav{position:absolute;top:50%;transform:translateY(-50%);z-index:3;
          width:46px;height:46px;border-radius:50%;border:1px solid var(--line);cursor:pointer;
          background:rgba(10,12,24,.85);color:#fff;font-size:20px;line-height:1;
          display:grid;place-items:center;transition:transform .15s,background .15s}
        .slot-words .nav:hover{background:rgba(94,234,212,.22);transform:translateY(-50%) scale(1.06)}
        .slot-words .nav.prev{left:-8px}
        .slot-words .nav.next{right:-8px}
        .slot-words .dots{display:flex;gap:8px;justify-content:center;margin-top:22px}
        .slot-words .dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.25)}
        .slot-words .dot.on{background:#5eead4;width:22px;border-radius:999px}
        .slot-words .state{color:var(--dim);font-size:15px;padding:38px 0}
        .slot-words .state.err{color:#ff9c9c}
        .slot-words .cta{margin-top:34px;font-size:15px;color:var(--dim)}
        .slot-words .cta a{color:#5eead4;font-weight:650;text-decoration:none;border-bottom:1px solid rgba(94,234,212,.4)}
        @media (max-width:640px){
          .slot-words{padding:56px 16px 72px}
          .slot-words .nav.prev{left:0}
          .slot-words .nav.next{right:0}
          .slot-words .card{padding:26px 22px}
        }
      `}</style>

      <h2>
        Word on the street&nbsp;<em>about me</em>
      </h2>
      <p className="lead">
        Have feedback? Click <b>&ldquo;Write a Review&rdquo;</b> in the guestbook below and share your experience.
      </p>

      <div className="stage">
        {loading && <div className="state">Loading testimonials…</div>}
        {error && <div className="state err">Could not reach the dashboard API: {error}</div>}
        {!loading && !error && list.length === 0 && (
          <div className="state">No testimonials yet — be the first to leave one.</div>
        )}
        {current && (
          <>
            <button className="nav prev" type="button" aria-label="Previous testimonial" onClick={() => step(-1)}>
              ‹
            </button>
            <article className="card">
              <div className="who">
                {current.user?.image ? (
                  <img className="ava" src={current.user.image} alt="" />
                ) : (
                  <span className="ava">{(current.user?.name || '?').slice(0, 1).toUpperCase()}</span>
                )}
                <span className="name">
                  {current.user?.name || 'Anonymous'}
                  {current.createdAt && (
                    <span className="when">{new Date(current.createdAt).toLocaleDateString()}</span>
                  )}
                </span>
              </div>
              <p className="quote">{current.text}</p>
            </article>
            <button className="nav next" type="button" aria-label="Next testimonial" onClick={() => step(1)}>
              ›
            </button>
          </>
        )}
      </div>

      {list.length > 0 && (
        <div className="dots">
          {list.map((t, i) => (
            <span
              key={t._id || i}
              className={`dot${((index % list.length) + list.length) % list.length === i ? ' on' : ''}`}
            />
          ))}
        </div>
      )}

      <p className="cta">
        Sign the <a href="/guestBook">guest book</a> or <a href="/contact">send me a message</a>.
      </p>
    </section>
  );
}
