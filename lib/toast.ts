'use client';

/**
 * The tiny toast store behind `components/Toaster.tsx`.
 *
 * The reference site calls sonner's `toast()` for two things: the time-of-day
 * greeting that fires once an hour, and the "Failed to load …" errors when the
 * API behind a section is unreachable. Rather than pull in sonner, this keeps the
 * same public shape (`toast(msg, { description, duration })` plus
 * `toast.error(...)`) and renders the exact markup sonner produced — the styling
 * itself comes from the captured sonner stylesheet (public/sonner.css).
 */

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  description?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  leaving?: boolean;
}

const DEFAULT_DURATION = 4000;
const EXIT_MS = 200;

let nextId = 0;
let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<number, { dismiss?: ReturnType<typeof setTimeout>; remove?: ReturnType<typeof setTimeout> }>();

const emit = () => {
  const snapshot = items;
  items = snapshot;
  listeners.forEach(fn => fn());
};

export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastItem[] {
  return items;
}

export function dismissToast(id: number) {
  const item = items.find(t => t.id === id);
  if (!item || item.leaving) return;
  const pending = timers.get(id) || {};
  if (pending.dismiss) clearTimeout(pending.dismiss);
  items = items.map(t => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  pending.remove = setTimeout(() => {
    items = items.filter(t => t.id !== id);
    timers.delete(id);
    emit();
  }, EXIT_MS);
  timers.set(id, pending);
}

export function dismissAllToasts() {
  items.forEach(t => dismissToast(t.id));
}

function push(title: string, options: ToastOptions = {}): number {
  const id = nextId++;
  const item: ToastItem = {
    id,
    title,
    description: options.description,
    type: options.type || 'default',
    duration: options.duration ?? DEFAULT_DURATION,
  };
  items = [...items, item];
  emit();
  if (item.duration > 0) {
    const pending = timers.get(id) || {};
    pending.dismiss = setTimeout(() => dismissToast(id), item.duration);
    timers.set(id, pending);
  }
  return id;
}

type ToastFn = ((title: string, options?: ToastOptions) => number) & {
  success: (title: string, options?: Omit<ToastOptions, 'type'>) => number;
  error: (title: string, options?: Omit<ToastOptions, 'type'>) => number;
  info: (title: string, options?: Omit<ToastOptions, 'type'>) => number;
  warning: (title: string, options?: Omit<ToastOptions, 'type'>) => number;
  dismiss: (id?: number) => void;
};

export const toast: ToastFn = Object.assign(
  (title: string, options?: ToastOptions) => push(title, options),
  {
    success: (title: string, options?: Omit<ToastOptions, 'type'>) => push(title, { ...options, type: 'success' }),
    error: (title: string, options?: Omit<ToastOptions, 'type'>) => push(title, { ...options, type: 'error' }),
    info: (title: string, options?: Omit<ToastOptions, 'type'>) => push(title, { ...options, type: 'info' }),
    warning: (title: string, options?: Omit<ToastOptions, 'type'>) => push(title, { ...options, type: 'warning' }),
    dismiss: (id?: number) => (id === undefined ? dismissAllToasts() : dismissToast(id)),
  },
);
