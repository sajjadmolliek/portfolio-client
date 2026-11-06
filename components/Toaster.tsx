'use client';

import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { dismissToast, getToasts, subscribeToasts, type ToastItem } from '@/lib/toast';

/**
 * The toast host. The reference site renders sonner's `<Toaster />` in its root
 * layout (`position="top-right"`, dark theme, 24px offset); this renders the same
 * markup those toasts collapse into, and public/sonner.css is the stylesheet
 * sonner injected at runtime, captured from the reference page.
 */

const GAP = 14;

/** sonner's 20×20 status icons, verbatim. */
const ICONS: Record<string, React.ReactNode> = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const CLOSE = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const measured = useRef<Record<number, number>>({});

  const measure = useCallback((toast: ToastItem) => (node: HTMLLIElement | null) => {
    if (!node) return;
    const height = Math.round(node.getBoundingClientRect().height * 100) / 100;
    if (Math.abs((measured.current[toast.id] || 0) - height) < 0.5) return;
    measured.current[toast.id] = height;
    setHeights(prev => ({ ...prev, [toast.id]: height }));
  }, []);

  // toasts are stacked newest-first from the top-right corner
  const shown = [...items].reverse();
  const frontHeight = shown.length ? heights[shown[0].id] || 0 : 0;

  useLayoutEffect(() => {
    if (!items.length) {
      measured.current = {};
      setHeights({});
    }
  }, [items.length]);

  return (
    <section
      aria-label="Notifications alt+T"
      tabIndex={-1}
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
    >
      <ol
        dir="ltr"
        tabIndex={-1}
        data-sonner-toaster="true"
        data-sonner-theme="dark"
        data-y-position="top"
        data-x-position="right"
        style={
          {
            '--front-toast-height': `${frontHeight}px`,
            '--width': '356px',
            '--gap': `${GAP}px`,
            '--offset-top': '24px',
            '--offset-right': '24px',
            '--offset-bottom': '24px',
            '--offset-left': '24px',
            '--mobile-offset-top': '16px',
            '--mobile-offset-right': '16px',
            '--mobile-offset-bottom': '16px',
            '--mobile-offset-left': '16px',
          } as React.CSSProperties
        }
      >
        {shown.map((toast, index) => {
          let offset = 0;
          for (let i = 0; i < index; i++) offset += (heights[shown[i].id] || 0) + GAP;
          const height = heights[toast.id] || 0;
          return (
            <li
              key={toast.id}
              ref={measure(toast)}
              tabIndex={0}
              data-sonner-toast=""
              data-rich-colors="true"
              data-styled="true"
              data-mounted="true"
              data-promise="false"
              data-swiped="false"
              data-removed={toast.leaving ? 'true' : 'false'}
              data-visible={toast.leaving ? 'false' : 'true'}
              data-y-position="top"
              data-x-position="right"
              data-index={index}
              data-front={index === 0 ? 'true' : 'false'}
              data-swiping="false"
              data-dismissible="true"
              data-type={toast.type === 'default' ? undefined : toast.type}
              data-swipe-out="false"
              data-expanded="false"
              style={
                {
                  '--index': index,
                  '--toasts-before': index,
                  '--z-index': shown.length - index + 1,
                  '--offset': `${offset}px`,
                  '--initial-height': `${height}px`,
                  background: 'rgb(10, 10, 10)',
                  border: '1px solid rgb(39, 39, 42)',
                  color: 'rgb(229, 231, 235)',
                } as React.CSSProperties
              }
            >
              <button aria-label="Close toast" data-disabled="false" data-close-button="true" onClick={() => dismissToast(toast.id)}>
                {CLOSE}
              </button>
              {toast.type !== 'default' && ICONS[toast.type] && <div data-icon="">{ICONS[toast.type]}</div>}
              <div data-content="">
                <div data-title="">{toast.title}</div>
                {toast.description && <div data-description="">{toast.description}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
