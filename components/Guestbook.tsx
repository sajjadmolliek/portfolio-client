'use client';

import { useState } from 'react';
import { signGuestbook, useApi, type Testimonial } from '@/lib/api';
import './slots.css';

/** Live guestbook: entries come from MongoDB through the dashboard API. */
export default function Guestbook() {
  const { data, error, loading, reload } = useApi<Testimonial[]>('/api/testimonials');
  const [form, setForm] = useState({ name: '', text: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error2, setError2] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim() || state === 'sending') return;
    setState('sending');
    setError2('');
    try {
      await signGuestbook({ name: form.name.trim() || 'Anonymous visitor', text: form.text.trim() });
      setState('done');
      setForm({ name: '', text: '' });
      reload();
    } catch (err) {
      setState('error');
      setError2(String((err as Error)?.message || err));
    }
  }

  const entries = data || [];

  return (
    <section className="slot slot-guest">
      <style>{`
        .slot{--ink:#e8ecff;--dim:#93a0c4;--line:rgba(255,255,255,.09);
          max-width:840px;margin:0 auto;padding:32px 20px 72px;color:var(--ink);
          position:relative;z-index:2;font-family:inherit}
        .slot .list{display:grid;gap:14px;margin-bottom:28px}
        .slot .card{background:rgba(255,255,255,.035);border:1px solid var(--line);
          border-radius:16px;padding:16px 18px;backdrop-filter:blur(10px)}
        .slot .head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .slot .ava{width:34px;height:34px;border-radius:50%;object-fit:cover;
          background:linear-gradient(120deg,#5eead4,#93c5fd);display:grid;place-items:center;
          font-size:13px;font-weight:700;color:#04121a;overflow:hidden}
        .slot .who{font-weight:650;font-size:14.5px}
        .slot .when{color:var(--dim);font-size:12px;margin-left:auto}
        .slot .txt{color:#cfd7f2;line-height:1.6;font-size:14.5px;white-space:pre-wrap}
        .slot form{display:grid;gap:12px;background:rgba(255,255,255,.035);
          border:1px solid var(--line);border-radius:20px;padding:20px}
        .slot label{display:grid;gap:6px;font-size:12.5px;letter-spacing:.08em;
          text-transform:uppercase;color:var(--dim)}
        .slot input,.slot textarea{font:inherit;font-size:15px;color:var(--ink);
          background:rgba(10,12,24,.7);border:1px solid var(--line);border-radius:12px;
          padding:12px 14px;outline:none;width:100%}
        .slot textarea{min-height:110px;resize:vertical}
        .slot input:focus,.slot textarea:focus{border-color:#5eead4;box-shadow:0 0 0 3px rgba(94,234,212,.16)}
        .slot .row{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .slot button{font:inherit;font-size:15px;font-weight:650;cursor:pointer;color:#04121a;
          background:linear-gradient(120deg,#5eead4,#93c5fd);border:0;border-radius:999px;padding:12px 26px}
        .slot button:disabled{opacity:.6;cursor:not-allowed}
        .slot .msg{font-size:13.5px;color:var(--dim)}
        .slot .msg.ok{color:#7ef7d5}
        .slot .msg.err{color:#ff9c9c}
        .slot .empty{color:var(--dim);text-align:center;padding:26px 0}
      `}</style>

      <div className="list">
        {loading && <div className="empty">Loading entries…</div>}
        {error && <div className="empty">Could not reach the dashboard API: {error}</div>}
        {!loading && !error && entries.length === 0 && (
          <div className="empty">No entries yet — be the first to sign.</div>
        )}
        {entries.map((t, i) => (
          <article className="card" key={t._id || i}>
            <div className="head">
              {t.user?.image ? (
                <img className="ava" src={t.user.image} alt="" />
              ) : (
                <span className="ava">{(t.user?.name || '?').slice(0, 1).toUpperCase()}</span>
              )}
              <span className="who">{t.user?.name || 'Anonymous'}</span>
              {t.createdAt && <span className="when">{new Date(t.createdAt).toLocaleDateString()}</span>}
            </div>
            <div className="txt">{t.text}</div>
          </article>
        ))}
      </div>

      <form onSubmit={submit}>
        <label>
          Your name
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Anonymous visitor"
            autoComplete="name"
          />
        </label>
        <label>
          Sign the guestbook
          <textarea
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="Say hello, share an idea, leave a note…"
            required
          />
        </label>
        <div className="row">
          <span className={`msg ${state === 'done' ? 'ok' : state === 'error' ? 'err' : ''}`}>
            {state === 'sending' && 'Posting…'}
            {state === 'done' && 'Signed! Your entry is live.'}
            {state === 'error' && (error2 || 'Could not post the entry.')}
            {state === 'idle' && 'Stored in MongoDB and shown right away.'}
          </span>
          <button type="submit" disabled={state === 'sending'}>
            Sign guestbook
          </button>
        </div>
      </form>
    </section>
  );
}
