'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

/**
 * The reference site hides the native pointer inside the "Experience That
 * Brings Ideas to Life" block and follows the mouse with two layers instead: a
 * blue arrow pinned to the cursor and a spring-lagged pill (avatar + "Actively
 * Seeking Job Opportunities"). Both are driven by the empty
 * `[data-slot=cursor-provider]` marker the captured markup already ships — this
 * component listens on its parent, exactly like the original `CursorProvider`.
 */

const PILL_OFFSET = 15;
const STIFFNESS = 500;
const DAMPING = 50;

function PillContent() {
  return (
    <div className="bg-black/80 rounded-3xl">
      <div className="group relative mx-auto flex items-center justify-center rounded-full sm:px-4 sm:py-1.5 px-2 py-1 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
        <span
          className="absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
          style={{
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'subtract',
            WebkitClipPath: 'padding-box',
          }}
        />
        <div className="relative rounded-full overflow-hidden">
          <img
            src="/avatar.webp"
            alt="MD. Sajjad Hossain"
            className="rounded-full object-cover w-10 h-10"
            width={100}
            height={100}
          />
        </div>
        <hr className="mx-2 h-4 w-px shrink-0 bg-neutral-500" />
        <span
          className="inline animate-gradient bg-gradient-to-r from-[var(--color-from)] via-[var(--color-to)] to-[var(--color-from)] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent sm:text-sm text-xs font-medium"
          style={{ ['--bg-size' as string]: '300%', ['--color-from' as string]: '#ffaa40', ['--color-to' as string]: '#9c40ff' }}
        >
          Actively Seeking Job Opportunities
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-right ml-1 size-4 stroke-neutral-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  );
}

export default function CursorFX() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    const provider = document.querySelector('[data-slot="cursor-provider"]');
    const container = provider?.parentElement as HTMLElement | null;
    if (!container) return;

    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    setHost(container);

    const pointer = { x: 0, y: 0 };
    const pill = { x: 0, y: 0, vx: 0, vy: 0 };
    let frame = 0;
    let last = 0;
    let running = false;

    let cursorEl: HTMLElement | null = null;
    let pillEl: HTMLElement | null = null;

    const loop = (now: number) => {
      cursorEl = cursorEl || container.querySelector<HTMLElement>('[data-slot="cursor"]');
      pillEl = pillEl || container.querySelector<HTMLElement>('[data-slot="cursor-follow"]');
      const dt = Math.min((now - last) / 1000 || 0, 1 / 30);
      last = now;
      const h = dt / 4;
      for (let i = 0; i < 4; i++) {
        pill.vx += (-STIFFNESS * (pill.x - pointer.x) - DAMPING * pill.vx) * h;
        pill.vy += (-STIFFNESS * (pill.y - pointer.y) - DAMPING * pill.vy) * h;
        pill.x += pill.vx * h;
        pill.y += pill.vy * h;
      }
      if (cursorEl) {
        cursorEl.style.left = `${pointer.x}px`;
        cursorEl.style.top = `${pointer.y}px`;
      }
      if (pillEl) {
        pillEl.style.left = `${pill.x}px`;
        pillEl.style.top = `${pill.y}px`;
      }
      if (running) frame = requestAnimationFrame(loop);
    };

    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      // position the arrow straight away: the spring loop below only runs while
      // animation frames are being produced
      const arrow = cursorEl || container.querySelector<HTMLElement>('[data-slot="cursor"]');
      if (arrow) {
        cursorEl = arrow;
        arrow.style.left = `${pointer.x}px`;
        arrow.style.top = `${pointer.y}px`;
      }
      if (!running) {
        running = true;
        pill.x = pointer.x;
        pill.y = pointer.y;
        pill.vx = 0;
        pill.vy = 0;
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
      if (!activeRef.current) {
        activeRef.current = true;
        setActive(true);
        container.style.cursor = 'none';
      }
    };

    const leave = () => {
      running = false;
      cancelAnimationFrame(frame);
      activeRef.current = false;
      setActive(false);
      container.style.removeProperty('cursor');
    };

    container.addEventListener('mousemove', move);
    container.addEventListener('mouseleave', leave);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      container.removeEventListener('mousemove', move);
      container.removeEventListener('mouseleave', leave);
      container.style.removeProperty('cursor');
    };
  }, [pathname]);

  if (!host) return null;

  return createPortal(
    <>
      <div
        data-slot="cursor"
        className="transform-[translate(-50%,-50%)] pointer-events-none z-[9999] absolute"
        style={{
          transform: `translate(-50%,-50%) scale(${active ? 1 : 0})`,
          opacity: active ? 1 : 0,
          transition: 'transform .2s ease, opacity .2s ease',
        }}
      >
        <svg className="size-8 text-blue-500" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path
            fill="currentColor"
            d="M1.8 4.4 7 36.2c.3 1.8 2.6 2.3 3.6.8l3.9-5.7c1.7-2.5 4.5-4.1 7.5-4.3l6.9-.5c1.8-.1 2.5-2.4 1.1-3.5L5 2.5c-1.4-1.1-3.5 0-3.3 1.9Z"
          />
        </svg>
      </div>
      <div
        data-slot="cursor-follow"
        className="pointer-events-none z-[9998] absolute"
        style={{
          transform: `translate(${PILL_OFFSET}px, ${PILL_OFFSET}px) scale(${active ? 1 : 0})`,
          transformOrigin: '0 0',
          opacity: active ? 1 : 0,
          transition: 'transform .25s cubic-bezier(.22,1,.36,1), opacity .25s ease',
        }}
      >
        <PillContent />
      </div>
    </>,
    host,
  );
}
