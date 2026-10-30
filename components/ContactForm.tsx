'use client';

import { useState } from 'react';
import { sendMessage } from '@/lib/api';
import './slots.css';

interface Props {
  variant?: 'contact' | 'collab';
}

/**
 * The contact form the original site rendered on the client — now wired to the
 * Express dashboard API, so a submission lands in MongoDB and shows up in the
 * dashboard inbox.
 */
export default function ContactForm({ variant = 'contact' }: Props) {
  const collab = variant === 'collab';
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const field = (key: 'name' | 'email' | 'message', value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.message.trim() || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      await sendMessage(form);
      setState('done');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setState('error');
      setError(String((err as Error)?.message || err));
    }
  }

  return (
    <section className={`slot slot-contact ${collab ? 'slot-collab' : ''}`}>
      <style>{`
        .slot{--ink:#e8ecff;--dim:#93a0c4;--line:rgba(255,255,255,.09);
          max-width:780px;margin:0 auto;padding:40px 20px 72px;color:var(--ink);
          font-family:inherit;position:relative;z-index:2}
        .slot h2{font-size:clamp(28px,5vw,44px);font-weight:800;letter-spacing:-.02em;margin:0 0 8px;
          background:linear-gradient(120deg,#7ef7d5,#8fb8ff 55%,#c8a8ff);
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .slot p.lead{color:var(--dim);font-size:16px;line-height:1.6;margin:0 0 26px;max-width:60ch}
        .slot form{display:grid;gap:14px;background:rgba(255,255,255,.035);
          border:1px solid var(--line);border-radius:20px;padding:24px;
          backdrop-filter:blur(12px);box-shadow:0 24px 60px rgba(0,0,0,.45)}
        .slot .two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        @media (max-width:640px){.slot .two{grid-template-columns:1fr}}
        .slot label{display:grid;gap:6px;font-size:12.5px;letter-spacing:.08em;
          text-transform:uppercase;color:var(--dim)}
        .slot input,.slot textarea{font:inherit;font-size:15px;color:var(--ink);
          background:rgba(10,12,24,.7);border:1px solid var(--line);border-radius:12px;
          padding:12px 14px;outline:none;transition:border-color .18s,box-shadow .18s;width:100%}
        .slot textarea{min-height:132px;resize:vertical}
        .slot input:focus,.slot textarea:focus{border-color:#5eead4;
          box-shadow:0 0 0 3px rgba(94,234,212,.16)}
        .slot .actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .slot button{font:inherit;font-size:15px;font-weight:650;cursor:pointer;color:#04121a;
          background:linear-gradient(120deg,#5eead4,#93c5fd);border:0;border-radius:999px;
          padding:12px 26px;transition:transform .15s,filter .15s}
        .slot button:hover{transform:translateY(-1px);filter:brightness(1.06)}
        .slot button:disabled{opacity:.6;cursor:not-allowed;transform:none}
        .slot .note{font-size:13px;color:var(--dim)}
        .slot .status{font-size:14px;line-height:1.5}
        .slot .status.ok{color:#7ef7d5}
        .slot .status.err{color:#ff9c9c}
      `}</style>

      <h2>{collab ? 'Collaborate With Me' : 'Get In Touch'}</h2>
      <p className="lead">
        {collab
          ? 'Available for exciting full-time opportunities and impactful freelance projects — tell me what you are building.'
          : 'Send me a direct email for any queries or collaborations, or call/WhatsApp me at +8801734402046.'}
      </p>

      <form onSubmit={submit}>
        <div className="two">
          <label>
            Your name
            <input
              value={form.name}
              onChange={e => field('name', e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={e => field('email', e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
            />
          </label>
        </div>
        <label>
          {collab ? 'Project details' : 'Message'}
          <textarea
            value={form.message}
            onChange={e => field('message', e.target.value)}
            placeholder={collab ? 'What are we building?' : 'Hello Sajjad, I would like to talk about…'}
            required
          />
        </label>
        <div className="actions">
          <span className={`status ${state === 'done' ? 'ok' : state === 'error' ? 'err' : ''}`}>
            {state === 'sending' && 'Sending…'}
            {state === 'done' && 'Thanks — your message landed in the dashboard inbox.'}
            {state === 'error' && (error || 'Something went wrong. Please email me instead.')}
            {state === 'idle' && <span className="note">Delivered straight to the portfolio dashboard.</span>}
          </span>
          <button type="submit" disabled={state === 'sending'}>
            {collab ? 'Send details' : 'Send message'}
          </button>
        </div>
      </form>
    </section>
  );
}
