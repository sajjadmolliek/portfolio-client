/**
 * Every URL the frontend talks to lives here.
 *
 *   NEXT_PUBLIC_API_URL  the Express dashboard API
 *                        (http://127.0.0.1:3000 locally, the Vercel domain in prod)
 */
import { useCallback, useEffect, useState } from 'react';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');

export interface Message {
  _id?: string;
  name?: string;
  email?: string;
  message?: string;
  receivedAt?: string;
}

export interface Testimonial {
  _id?: string;
  text: string;
  user?: { _id?: string; name?: string; image?: string };
  createdAt?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

/* ------------------------------------------------------------ read hooks */
export interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Small fetch hook — re-runs when `path` changes, `reload()` forces a refetch. */
export function useApi<T>(path: string): ApiState<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    request<{ data: T }>(path)
      .then(r => {
        if (alive) setState({ data: r.data, error: null, loading: false });
      })
      .catch(e => {
        if (alive) setState({ data: null, error: String(e?.message || e), loading: false });
      });
    return () => {
      alive = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick(t => t + 1), []);
  return { ...state, reload };
}

/* ------------------------------------------------------------ write calls */
export const getMessages = (): Promise<Message[]> =>
  request<{ data: Message[] }>('/api/messages').then(r => r.data);

export const getTestimonials = (): Promise<Testimonial[]> =>
  request<{ data: Testimonial[] }>('/api/testimonials').then(r => r.data);

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export const sendMessage = (payload: ContactPayload): Promise<unknown> =>
  request('/api/messages', { method: 'POST', body: JSON.stringify(payload) });

export interface GuestbookPayload {
  name: string;
  text: string;
}

export const signGuestbook = (payload: GuestbookPayload): Promise<unknown> =>
  request('/api/testimonials', { method: 'POST', body: JSON.stringify(payload) });
