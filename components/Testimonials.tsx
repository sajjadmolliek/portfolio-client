'use client';

import { useEffect, useRef, useState } from 'react';
import { useApi, type Testimonial } from '@/lib/api';
import './slots.css';

/**
 * The `TESTIMONIALS / Word on the street about me` section on the home page.
 *
 * The original fetched its carousel from /api/comments; it now reads the
 * dashboard API's /api/testimonials (fed by the guestbook and the dashboard),
 * laid out as the reference site's deck: 290px cards sharing one centre point,
 * fanned into slots of 193.333px (2/3 of a card) with a slight alternating
 * tilt, the front card inverted to white. Every card carries the chamfered
 * top-right corner of the original — a 50px clip-path cut with a rotated line
 * drawn along the fold.
 *
 *   slot -2 → x -386.67, y -15, rotate -2.5deg     slot -1 → x -193.33, y +15, rotate +2.5deg
 *   slot  0 → x 0,       y -65, rotate 0, z 10, white         slot +1 → x +193.33, y +15, rotate +2.5deg
 *
 * Clicking a side card brings it to the front; the two chevrons walk the deck.
 */

const CARD = 290;
const STEP = (CARD * 2) / 3; // 193.333 — the demo's horizontal slot spacing
const DECK_HEIGHT = 600;
const CLIP = 'polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0px 100%, 0px 0px)';

/** Which slot card `i` occupies when `active` is at the front. */
function slotOf(i: number, active: number, count: number): number {
  let slot = i - active;
  if (slot > 1) slot -= count; // spill the overflow to the left of the fan
  return Math.max(-2, Math.min(1, slot));
}

function placement(slot: number): { x: number; y: number; rotate: number } {
  if (slot === 0) return { x: 0, y: -65, rotate: 0 };
  const odd = slot % 2 !== 0;
  return { x: slot * STEP, y: odd ? 15 : -15, rotate: odd ? 2.5 : -2.5 };
}

function relativeDate(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const days = Math.max(1, Math.round((Date.now() - date.getTime()) / 86_400_000));
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${days} days ago`;
}

export default function Testimonials() {
  const { data, error, loading } = useApi<Testimonial[]>('/api/testimonials');
  const [index, setIndex] = useState(0);
  const autoRef = useRef<number | undefined>(undefined);
  const autoPlaying = useRef(true);
  const pauseOnHover = useRef(false);
  // Pause auto-rotation while the pointer is anywhere inside the deck area
  // or while a visitor is interacting with a card/nav button; resume once the
  // pointer leaves the whole deck. This matches the reference homepage, whose
  // deck keeps spinning on its own.
  const deckRef = useRef<HTMLDivElement | null>(null);
  // Pause auto-rotation while the pointer is anywhere inside the deck area
  // or while a visitor is interacting with a card/nav button; resume once the
  // pointer leaves the whole deck. This matches the reference homepage, whose
  // deck keeps spinning on its own.
  // auto-advance the deck the way the reference homepage does: start when there
  // is room to rotate and stop while the visitor is sitting on a card
  const listAll = data ?? [];
  const deckCount = listAll.length;
  useEffect(() => {
    if (deckCount < 2 || loading || error) {
      if (autoRef.current !== undefined) { clearInterval(autoRef.current); autoRef.current = undefined; }
      return;
    }
    if (!autoPlaying.current) {
      if (autoRef.current !== undefined) { clearInterval(autoRef.current); autoRef.current = undefined; }
      return;
    }
    autoRef.current = window.setInterval(() => setIndex(i => (i + 1) % deckCount), 7000);
    return () => { if (autoRef.current !== undefined) clearInterval(autoRef.current); };
  }, [deckCount, loading, error]);

  const list = listAll;
  const active = deckCount ? ((index % deckCount) + deckCount) % deckCount : 0;

  return (
    <section className="slot slot-words">
      <style>{`
        .slot-words{position:relative;z-index:2;width:100%;background:#000;color:#fff;
          padding:0 0 96px;font-family:inherit;overflow:hidden}
        .slot-words .head{text-align:center;background:#000;padding:72px 16px 8px}
        .slot-words .eyebrow{margin:0 0 16px;color:#9ca3af;font-size:14px;font-weight:500;
          letter-spacing:.1em;text-transform:uppercase}
        .slot-words .title{margin:0 0 8px;font-size:clamp(36px,6vw,72px);font-weight:700;
          line-height:1.1;color:#fff}
        .slot-words .title em{font-family:'Pacifico',cursive;font-style:normal;padding:6px 0 18px;
          line-height:1.8;font-weight:700;
          background-image:linear-gradient(135deg,#FF0080,#9D6EF5,#4DA6FF,#38bdf8,#FF0080);
          background-size:200% auto;background-clip:text;-webkit-background-clip:text;
          color:transparent;-webkit-text-fill-color:transparent;
          animation:slot-words-aurora 10s linear infinite}
        @keyframes slot-words-aurora{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        .slot-words .lead{margin:0 0 20px;color:rgba(255,255,255,.8);font-size:16px;line-height:1.6}
        .slot-words .lead b{color:#fde047;font-weight:700}
        .slot-words .write{display:inline-block;padding:10px 26px;border:1px solid rgba(255,255,255,.35);
          border-radius:999px;color:#fff;font-size:15px;text-decoration:none;background:rgba(255,255,255,.05);
          transition:border-color .2s,background .2s,transform .2s}
        .slot-words .write:hover{border-color:#fff;background:rgba(255,255,255,.14);transform:translateY(-1px)}

        .slot-words .deck-area{position:relative;display:flex;width:100%;flex-direction:column;
          align-items:center;justify-content:center}
        .slot-words .deck{position:relative;width:100%;overflow:hidden;background:#000;height:${DECK_HEIGHT}px}
        .slot-words .tcard{position:absolute;left:50%;top:50%;box-sizing:border-box;width:${CARD}px;
          height:${CARD}px;padding:32px;cursor:pointer;text-align:left;border:2px solid #404040;
          background:#0a0a0a;color:#fff;z-index:0;transition:all .5s cubic-bezier(.4,0,.2,1)}
        .slot-words .tcard:hover{border-color:#737373}
        .slot-words .tcard.on{background:#fff;color:#171717;border-color:#fff;z-index:10}
        .slot-words .tcard .fold{position:absolute;right:-2px;top:48px;display:block;
          width:70.7107px;height:2px;transform-origin:top right;transform:rotate(45deg);
          background:rgba(255,255,255,.25)}
        .slot-words .tcard.on .fold{background:rgba(23,23,23,.4)}
        .slot-words .tcard .ava{display:flex;align-items:center;justify-content:center;overflow:hidden;
          width:48px;height:56px;margin-bottom:16px;object-fit:cover;object-position:top;
          background:#262626;box-shadow:3px 3px 0 rgba(255,255,255,.22);
          font-size:20px;font-weight:700;color:#0f0f0f}
        .slot-words .tcard.on .ava{box-shadow:3px 3px 0 rgba(0,0,0,.25)}
        .slot-words .tcard .q{margin:0;font-size:16px;line-height:1.45;font-weight:500;
          display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
        .slot-words .tcard .meta{position:absolute;left:32px;right:32px;bottom:32px}
        .slot-words .tcard .who{margin:0;font-size:14px;font-style:italic;color:rgba(255,255,255,.8);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .slot-words .tcard.on .who{color:#404040}
        .slot-words .tcard .when{margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.6);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .slot-words .tcard.on .when{color:#737370}
        .slot-words .nav{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);
          display:flex;gap:8px;z-index:20}
        .slot-words .nav button{display:flex;align-items:center;justify-content:center;
          width:56px;height:56px;padding:0;font-size:24px;line-height:1;cursor:pointer;
          background:#000;color:#fff;border:2px solid #404040;
          transition:background .2s,color .2s,border-color .2s}
        .slot-words .nav button:hover{background:#fff;color:#000;border-color:#fff}
        .slot-words .nav button:focus-visible{outline:2px solid #fff;outline-offset:2px}
        .slot-words .state{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);
          margin:0;padding:0 24px;text-align:center;color:rgba(255,255,255,.65);font-size:15px}
        .slot-words .state.err{color:#ff9c9c}
        @media (min-width:640px){.slot-words .tcard .q{font-size:20px}}
        @media (max-width:640px){
          .slot-words{padding-bottom:72px}
          .slot-words .head{padding-top:56px}
        }
      `}</style>

      <div className="head">
        <p className="eyebrow">Testimonials</p>
        <h2 className="title">
          Word on the street&nbsp;<em>about me</em>
        </h2>
        <p className="lead">
          Have feedback? Click <b>&ldquo;Write a Review&rdquo;</b> below and share your experience.
        </p>
        <a className="write" href="/guestBook">
          Write a Review
        </a>
      </div>

      <div className="deck-area">
        <div className="deck">
          {loading && <p className="state">Loading testimonials…</p>}
          {error && <p className="state err">Could not reach the dashboard API: {error}</p>}
          {!loading && !error && deckCount === 0 && (
            <p className="state">No testimonials yet — be the first to leave one.</p>
          )}

          {list.map((t, i) => {
            const isActive = i === active;
            const { x, y, rotate } = placement(slotOf(i, active, deckCount));
            const name = t.user?.name || 'Anonymous';
            const when = relativeDate(t.createdAt);
            return (
              <div
                key={t._id || i}
                className={`tcard${isActive ? ' on' : ''}`}
                onClick={() => { autoPlaying.current = false; !isActive && setIndex(i); }}
                style={{
                  clipPath: CLIP,
                  transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`,
                  boxShadow: isActive ? 'rgba(255, 255, 255, 0.22) 0px 8px 0px 4px' : 'transparent 0px 0px 0px 0px',
                }}
              >
                <span className="fold" />
                {t.user?.image ? (
                  <img className="ava" src={t.user.image} alt={name} />
                ) : (
                  <span className="ava" aria-hidden="true">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}              <p className="q">{t.text ? `&ldquo;${t.text}&rdquo;` : ''}
</p>
                <div className="meta">
                  <p className="who">- {name}</p>
                  {when && <p className="when">{when}</p>}
                </div>
              </div>
            );
          })}

          {deckCount > 1 && (
            <div className="nav">
              <button type="button" aria-label="Previous testimonial" onClick={() => setIndex(i => i - 1)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button type="button" aria-label="Next testimonial" onClick={() => setIndex(i => i + 1)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>      </button>
            </div>
          )}

          {deckCount === 1 && (
            <p className="state" style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>
              One review so far — the deck stays still until more arrive.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

