'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

/**
 * The captured site is static, so everything that used to animate on the client
 * needs a runtime. This component provides those runtimes:
 *
 *  1. **entrance animations** — `scripts/generate-pages.mjs` tags every element
 *     that ships with `opacity:0` (inline style) or the `opacity-0` utility with
 *     `data-reveal="source:props"`. Elements are revealed when they scroll into
 *     view; `s:` entries get the original 0.6s + 0.1s stagger, `c:` entries keep
 *     the `transition-all duration-1000 delay-*` classes they already carry.
 *  2. **hexagon background** — the `Let's work together` section renders an empty
 *     `[data-slot=hexagon-background]` box because the grid was built in JS. The
 *     grid is portalled in here with the original markup, hover glow included.
 *  3. **photo on the illustration** — the avatar is parked on Superman's raised
 *     fist on desktop (the art is fixed-size, so the geometry is stable), at the
 *     height the original gave it inside the nav bar.
 *  4. **scroll rails** — both the "Experience That Brings Ideas to Life"
 *     timeline and the "Curated Work" timeline shipped a progress rail (track +
 *     fill), and the first an avatar riding it; the capture froze all of it at
 *     `height:0px`. They are driven here from the original's scroll progress
 *     (`useScroll({ offset: ["start 10%", "end 50%"] })`).
 *  5. **active case study** — in "Curated Work" the original swapped the sticky
 *     left column's copy, the highlighted card, the dots and the counter as the
 *     progress crossed each project; that swap is replayed here with the
 *     original 0.3s / 0.1s-staggered motion.
 *  6. **nav bar** — the header was a `motion.div` sliding to `y:-100` while
 *     scrolling down and back on the way up (0.3s), which parks the photo out
 *     of the way until you scroll back up. The same `transform` is written
 *     here: because it is a transform, Superman (a `fixed` child of that box)
 *     rides along exactly as the original's illustration did.
 *
 * Everything re-runs on client-side navigation, and a safety timer reveals any
 * element that is already on screen but never got observed, so content can never
 * be stranded invisible.
 */

const FINAL: Record<string, string> = {
  opacity: '1',
  transform: 'none',
  translate: 'none',
  filter: 'none',
};

function reveal(el: HTMLElement, delay = 0, animate = true) {
  const source = el.dataset.reveal || '';
  const props = source.split(':')[1];
  if (!props) return;
  for (const prop of props.split(',').filter(Boolean)) {
    const value = FINAL[prop];
    if (value) el.style.setProperty(prop, value);
  }
  /*
   * `s:` blocks carry no transition class of their own — the original handed
   * motion a duration of .6s plus a .1s sibling stagger, so the transition has
   * to be written even when the delay is 0 (the first sibling of a group),
   * otherwise that block pops into place instead of animating. `c:` blocks keep
   * the `transition-all duration-1000 delay-*` classes they already ship with.
   */
  if (animate && source.startsWith('s:')) {
    el.style.transition = `opacity .6s cubic-bezier(.22,1,.36,1) ${delay}s, transform .6s cubic-bezier(.22,1,.36,1) ${delay}s`;
  }
}

/* ------------------------------------------------------------ hexagons */

const HEX_W = 75;
const HEX_H = 1.1 * HEX_W; // 82.5
const ROW_H = 0.8 * HEX_W; // 60
const MARGIN = 3;
const ROW_OFFSET = -36 - 0.275 * (HEX_W - 100) + MARGIN; // -26.125

const HEX_CLASS = [
  'relative',
  '[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]',
  "before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-neutral-950 before:opacity-100 before:transition-all before:duration-1000",
  "after:content-[''] after:absolute after:inset-[var(--hexagon-margin)] after:bg-neutral-950",
  'after:[clip-path:polygon(50%_0%,_100%_25%,_100%_75%,_50%_100%,_0%_75%,_0%_25%)]',
  'hover:before:bg-neutral-800 hover:before:opacity-100 hover:before:duration-0',
  'hover:after:bg-neutral-900 hover:after:opacity-100 hover:after:duration-0',
].join(' ');

function HexagonGrid({ host }: { host: HTMLElement }) {
  const [size, setSize] = useState({ rows: 0, cols: 0 });

  useEffect(() => {
    const measure = () =>
      setSize({
        rows: Math.ceil(window.innerHeight / ROW_H),
        cols: Math.ceil(window.innerWidth / HEX_W) + 1,
      });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return createPortal(
    <>
      {Array.from({ length: size.rows }).map((_, row) => (
        <div
          key={row}
          className="inline-flex"
          style={{ marginTop: ROW_OFFSET, marginLeft: ((row + 1) % 2 === 0 ? MARGIN / 2 : -HEX_W / 2) - 10 }}
        >
          {Array.from({ length: size.cols }).map((_, col) => (
            <div key={col} className={HEX_CLASS} style={{ width: HEX_W, height: HEX_H, marginLeft: MARGIN }} />
          ))}
        </div>
      ))}
    </>,
    host,
  );
}

/* ----------------------------------------------------------- scroll art */

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * The original drives every scroll-linked value with
 * `useScroll({ offset: ["start 10%", "end 50%"] })`: progress starts when the
 * block's top edge reaches 10% of the viewport and ends when its bottom edge
 * reaches 50%.
 */
function scrollProgress(root: HTMLElement) {
  const rect = root.getBoundingClientRect();
  const vh = window.innerHeight;
  const start = rect.top + window.scrollY - vh * 0.1;
  const end = rect.bottom + window.scrollY - vh * 0.5;
  if (end - start <= 0) return window.scrollY >= end ? 1 : 0;
  return clamp01((window.scrollY - start) / (end - start));
}

/** The section wrapper a big `<h1>` lives in (`w-full bg-black font-sans …`). */
function sectionFor(heading: string) {
  const h1 = Array.from(document.querySelectorAll('h1')).find(h => h.textContent?.includes(heading));
  return (h1?.closest('div.w-full.bg-black.font-sans') as HTMLElement | null) ?? null;
}

/** The five card gradients of the case-study timeline, in capture order. */
const CARD_GRADIENTS = [
  'from-pink-500 via-purple-500 to-pink-600',
  'from-blue-500 via-cyan-500 to-teal-500',
  'from-orange-500 via-red-500 to-pink-500',
  'from-green-500 via-emerald-500 to-cyan-500',
  'from-purple-500 via-indigo-500 to-blue-500',
];

/** 1…10, all the counter in the timeline ever prints. */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

type Project = {
  title: string;
  desc: string;
  points: string[];
  chips: { src: string; name: string }[];
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Reads the case-study copy out of the captured mobile column: it holds every
 * project, while the sticky desktop column only ever renders the active one.
 */
function readProjects(stack: HTMLElement): Project[] {
  return Array.from(stack.children)
    .map(card => {
      const body = Array.from(card.querySelectorAll<HTMLElement>('div')).find(
        d => d.className.includes('px-6') && d.className.includes('space-y-4'),
      );
      const pointsBox = body ? Array.from(body.children).find(c => c.className.includes('space-y-2')) : null;
      const chipBox = body ? Array.from(body.children).find(c => c.className.includes('flex-wrap')) : null;
      return {
        title: card.querySelector('h2')?.textContent?.trim() || '',
        desc: body?.querySelector(':scope > p')?.textContent?.trim() || '',
        points: pointsBox
          ? Array.from(pointsBox.querySelectorAll('p'))
              .map(p => p.textContent?.trim() || '')
              .filter(Boolean)
          : [],
        chips: chipBox
          ? Array.from(chipBox.children)
              .map(c => ({
                src: c.querySelector('img')?.getAttribute('src') || '',
                name: c.querySelector('span')?.textContent?.trim() || '',
              }))
              .filter(c => c.name)
          : [],
      };
    })
    .filter(project => project.title);
}

/** The capture froze the timeline on project 1 — repaint card `i` around it. */
function paintCard(card: HTMLElement, active: boolean, i: number) {
  const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
  const frame = Array.from(card.querySelectorAll<HTMLElement>('div')).find(d => d.className.includes('rounded-3xl'));
  if (frame) {
    frame.className = `relative rounded-3xl p-1 transition-all duration-300 h-full min-h-[500px] ${
      active
        ? `bg-gradient-to-br ${gradient} scale-105`
        : 'bg-gradient-to-br from-neutral-700 to-neutral-600 opacity-60'
    }`;
  }
  const inner = frame
    ? Array.from(frame.querySelectorAll<HTMLElement>('div')).find(d => d.className.includes('rounded-2xl p-6'))
    : null;
  if (inner) {
    inner.className = `relative rounded-2xl p-6 ${
      active ? `bg-gradient-to-br ${gradient}/20` : 'bg-gradient-to-br from-neutral-800/50 to-neutral-700/50'
    }`;
  }
  const icon = card.querySelector('div.h-10.w-10.rounded-full svg');
  if (icon) {
    icon.classList.remove('text-white', 'text-neutral-500');
    icon.classList.add(active ? 'text-white' : 'text-neutral-500');
  }
}

/** Scroll rails, the case-study swap and the nav bar slide. */
function setupArt(animate: boolean) {
  /* ------------------------------------------ Experience That timeline */
  const exp = sectionFor('Experience That');
  let expContent: HTMLElement | null = null;
  let expTracks: HTMLElement[] = [];
  let expMarker: HTMLElement | null = null;

  if (exp) {
    expContent = exp.querySelector<HTMLElement>('div.relative.max-w-6xl.mx-auto.pb-20');
    const all = Array.from(exp.querySelectorAll<HTMLElement>('div'));
    expTracks = all.filter(
      d => d.className.includes('absolute') && (d.className.includes('w-[6px]') || d.className.includes('w-[4px]')),
    );
    expMarker =
      all.find(
        d =>
          d.className.includes('z-20') &&
          d.className.includes('left-1/2') &&
          d.className.includes('-translate-y-1/2') &&
          d.style.top !== '',
      ) ?? null;
    // the rail owns these values now — take them away from the reveal sweep
    for (const el of [...expTracks, ...(expMarker ? [expMarker] : [])]) el.removeAttribute('data-reveal');
  }

  const paintExperience = () => {
    if (!exp || !expContent) return;
    const height = expContent.offsetHeight;
    const progress = scrollProgress(exp);
    const fade = `${clamp01(progress / 0.1)}`;
    for (const track of expTracks) {
      track.style.height = `${height}px`;
      const fill = track.firstElementChild as HTMLElement | null;
      if (fill) {
        fill.style.height = `${progress * height}px`;
        fill.style.opacity = fade;
      }
    }
    if (expMarker) {
      expMarker.style.top = `${progress * height}px`;
      expMarker.style.opacity = fade;
    }
  };

  /* ------------------------------------------------- Curated Work */
  const cur = sectionFor('Curated');
  let curWrap: HTMLElement | null = null;
  let curTrack: HTMLElement | null = null;
  let blocks: HTMLElement[] = [];
  let dots: HTMLElement[] = [];
  let counter: HTMLElement | null = null;
  let cards: HTMLElement[] = [];
  let projects: Project[] = [];
  let active = 0;

  if (cur) {
    // the class is `md:block` — an unescaped colon makes this an invalid selector
    // and querySelector throws, which took the whole page down to the error boundary
    curWrap = cur.querySelector<HTMLElement>('div.relative.max-w-7xl.mx-auto.pb-20.hidden.md\\:block');
    const row = curWrap?.children[0] as HTMLElement | undefined;
    const left = row?.children[0] as HTMLElement | undefined;
    const right = row?.children[1] as HTMLElement | undefined;
    const stack = left?.querySelector<HTMLElement>('div.space-y-6');
    if (stack) blocks = Array.from(stack.children).slice(0, 3) as HTMLElement[];
    const meta = left?.querySelector<HTMLElement>('div.mt-8');
    const dotRow = meta?.querySelector<HTMLElement>('div.flex.gap-2');
    if (dotRow) dots = Array.from(dotRow.children) as HTMLElement[];
    counter = meta?.querySelector('p') ?? null;
    if (right) cards = Array.from(right.children) as HTMLElement[];
    curTrack =
      (curWrap
        ? Array.from(curWrap.querySelectorAll<HTMLElement>('div')).find(
            d => d.className.includes('w-[2px]') && d.className.includes('absolute'),
          ) ?? null
        : null) ?? null;
    curTrack?.removeAttribute('data-reveal');
    const mobile = cur.querySelector<HTMLElement>('div.md\\:hidden div.space-y-8');
    if (mobile) projects = readProjects(mobile);
  }

  /** Re-renders the sticky column for project `i` and replays its motion. */
  const applyProject = (i: number): boolean => {
    const data = projects[i];
    if (!data || blocks.length < 3) return false;
    // the entrance reveal has done its job by the time a swap can run
    for (const block of blocks) block.removeAttribute('data-reveal');
    blocks[0].innerHTML =
      `<h2 class="text-xl md:text-3xl font-bold text-white mb-4">${escapeHtml(data.title)}</h2>` +
      `<p class="text-sm md:text-sm font-sans text-neutral-300 leading-relaxed mb-6">${escapeHtml(data.desc)}</p>`;
    blocks[1].innerHTML = data.points
      .map(
        point =>
          `<div class="flex items-start gap-3"><div class="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>` +
          `<p class="text-sm md:text-sm font-sans text-neutral-300">${escapeHtml(point)}</p></div>`,
      )
      .join('');
    blocks[2].innerHTML = data.chips
      .map(
        chip =>
          `<div class="flex items-center gap-2 px-2 py-1 font-sans bg-white/10 rounded-md border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors">` +
          `<img src="${escapeHtml(chip.src)}" alt="${escapeHtml(chip.name)}" class="h-4 w-4 object-contain"/>` +
          `<span>${escapeHtml(chip.name)}</span></div>`,
      )
      .join('');

    blocks.forEach((block, k) => {
      if (!animate) {
        block.style.transition = '';
        block.style.opacity = '1';
        block.style.transform = 'none';
        return;
      }
      block.style.transition = 'none';
      block.style.opacity = '0';
      block.style.transform = 'translateY(20px)';
      void block.offsetHeight; // flush the start state before animating
      block.style.transition = `opacity .3s ease ${k * 0.1}s, transform .3s ease ${k * 0.1}s`;
      block.style.opacity = '1';
      block.style.transform = 'none';
    });

    cards.forEach((card, k) => paintCard(card, k === i, k));
    dots.forEach((dot, k) => {
      dot.className = `h-2 rounded-full transition-all duration-300 ${
        k === i ? 'w-8 bg-pink-500' : 'w-2 bg-neutral-600'
      }`;
    });
    if (counter) counter.textContent = `${ROMAN[i] ?? i + 1} of ${ROMAN[cards.length - 1] ?? cards.length}`;
    return true;
  };

  const paintCurated = () => {
    if (!cur || !curWrap) return;
    const progress = scrollProgress(cur);
    const height = curWrap.offsetHeight;
    if (curTrack) {
      curTrack.style.height = `${height}px`;
      const fill = curTrack.firstElementChild as HTMLElement | null;
      if (fill) {
        fill.style.height = `${progress * height}px`;
        fill.style.opacity = `${clamp01(progress / 0.1)}`;
      }
    }
    if (!projects.length) return;
    const next = Math.max(0, Math.min(projects.length - 1, Math.floor(progress * projects.length)));
    if (next !== active && applyProject(next)) active = next;
  };

  /* ------------------------------------------------------- nav bar */
  const header = document.querySelector<HTMLElement>('div.hidden.md\\:block.fixed.top-6');
  let lastY = window.scrollY;
  let parked = false;
  const onNavScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    if (y === lastY) return;
    const down = y > lastY;
    lastY = y;
    // `lastY` has to be read before it is updated, otherwise `y > lastY` can
    // only ever be false and the bar never parks itself
    if (down === parked) return;
    parked = down;
    header.style.transition = 'transform .3s ease';
    header.style.transform = down ? 'translateY(-100px)' : 'none';
  };

  /* ------------------------------------------------------ the driver */
  let frame = 0;
  const paint = () => {
    frame = 0;
    paintExperience();
    paintCurated();
  };
  const onScroll = () => {
    onNavScroll();
    if (!frame) frame = requestAnimationFrame(paint);
  };

  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', paint);
  window.addEventListener('load', paint, { once: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', paint);
    window.removeEventListener('load', paint);
    if (frame) cancelAnimationFrame(frame);
    if (header) {
      header.style.removeProperty('transform');
      header.style.removeProperty('transition');
      header.style.removeProperty('margin-top');
    }
  };
}

/* -------------------------------------------------------------- effects */

export default function SiteEffects() {
  const pathname = usePathname();
  const [hexHost, setHexHost] = useState<HTMLElement | null>(null);

  // entrance animations + the photo/illustration layering + the scroll art
  useEffect(() => {
    const markHexHost = () => {
      const box = document.querySelector('[data-slot="hexagon-background"]');
      const host = box?.querySelector(':scope > div') as HTMLElement | null;
      setHexHost(prev => (prev === host ? prev : host));
    };

    const layerArt = () => {
      const desktop = window.innerWidth >= 768;
      const sup = document.querySelector<HTMLImageElement>('img[alt="Superman"]');
      if (sup) {
        if (desktop) sup.style.left = '-40px';
        else sup.style.removeProperty('left');

        /*
         * Avatar-on-fist animation. When Superman is parked above the nav bar the
         * reference page converts the avatar into a same-origin overlay riding the
         * fist: it scales from 0→1, snaps forward across the heel, then settles back
         * inside the bar. The layerArt() calls below are the timing — we add the
         * visuals here so the two routes that still carry superman.png animate
         * identically to the demo.
         */
        if (desktop) {
          // The reference page layers the profile photo over Superman's raised
          // fist and animates it the moment the illustration scrolls into the
          // upper viewport: a small scale bounce, then the photo settles into the
          // nav bar. The scroll handler below fires that sequence; we keep the
          // photo invisible until the animation begins so the page never shows an
          // abrupt avatar pop-in.
          sup.style.opacity = '0';
          sup.style.transition = 'opacity .4s ease';
          const bar = sup.closest<HTMLElement>('nav div.relative') ?? null;
          const base = bar ? Math.round((bar.offsetHeight ?? 56) / 2 - 28) : 0;
          let started = false;
          let cleanup: (() => void) | null = null;
          const launch = () => {
            if (started || !sup.isConnected) return;
            started = true;
            sup.style.position = 'relative';
            sup.style.zIndex = '50';
            sup.style.opacity = '1';
            // tiny delay so the opacity fade is felt before the scale pop
            sup.style.transition = 'opacity .4s ease';
            void sup.offsetHeight;
            sup.style.transform = 'scale(0) translateY(-14px)';
            sup.style.transition = 'transform .55s cubic-bezier(.5,0,.5,1.25)';
            void sup.offsetHeight;
            sup.style.transform = 'scale(1.15) translateY(4px)';
            sup.style.transition = 'transform .5s cubic-bezier(.2,.7,.3,1)';
            void sup.offsetHeight;
            sup.style.transform = 'scale(1) translateY(0)';
            sup.style.transition = '';
            cleanup = () => {
              window.removeEventListener('scroll', tick);
              window.removeEventListener('resize', mark);
              sup.style.removeProperty('z-index');
              sup.style.removeProperty('position');
              sup.style.removeProperty('opacity');
              sup.style.removeProperty('transition');
            };
          };
          const mark = () => {
            if (!sup.isConnected) { cleanup?.(); cleanup = null; return; }
            if (sup.getBoundingClientRect().top < 8) launch();
          };
          const tick = () => { if (!started && sup.isConnected) mark(); };
          window.addEventListener('scroll', tick, { passive: true });
          window.addEventListener('resize', () => { if (!started && sup.isConnected) mark(); });
          setTimeout(() => { if (!started && sup.isConnected) mark(); }, 400);
          // keep the animation's cleanup alive across React remounts — the photo
          // element is stable on these two routes, so the scroll handler only
          // needs to go once the image is gone from the DOM
          return () => {
            tick();
            if (cleanup) cleanup();
          };
        }
      }

      const wrap = Array.from(document.querySelectorAll<HTMLElement>('div.absolute')).find(
        el => el.className.includes('left-8') && el.className.includes('top-1/2') && el.querySelector('img[alt="avlogo"]'),
      );
      if (wrap) {
        if (desktop) {
          const bar = wrap.parentElement as HTMLElement | null;
          wrap.style.left = '40px';
          // the original parked it at `top-1/2 -translate-y-1/2` inside the bar,
          // which puts it just above Superman instead of across his head
          wrap.style.top = `${Math.round((bar?.offsetHeight ?? 56) / 2 - 28)}px`;
          wrap.style.translate = 'none';
        } else {
          wrap.style.removeProperty('left');
          wrap.style.removeProperty('top');
          wrap.style.removeProperty('translate');
        }
      }
    };

    markHexHost();
    layerArt();
    window.addEventListener('resize', layerArt);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const art = setupArt(!reduce);
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    // Hero-banner background fade-in (home + workspace).
    // When a route ships an actual photo in the banner frame, fade the placeholder
    // SVG out and the photo in so the background slides up instead of popping.
    const runBannerFade = (host: HTMLElement | null) => {
      if (!host || reduce) return;        const frame = host.querySelector<HTMLElement>('.banner-frame');
      if (!frame) return;
      const placeholder = frame.querySelector<HTMLElement>('svg');
      const img = frame.querySelector<HTMLImageElement>('img');
      if (!placeholder || !img) return;
      const stamp = () => { void placeholder.offsetHeight; };
      if (img.complete && img.naturalWidth > 0) {
        placeholder.style.opacity = '0';
        placeholder.style.transition = 'opacity .5s ease';
        stamp();
        placeholder.remove();
        img.style.opacity = '1';
        img.style.transition = 'opacity .5s ease';
      } else {
        img.style.opacity = '0';
        img.style.transition = 'opacity .5s ease';
        img.addEventListener('load', () => {
          if (!img.isConnected || !placeholder.isConnected) return;
          placeholder.style.opacity = '0';
          placeholder.style.transition = 'opacity .5s ease';
          stamp();
          placeholder.remove();
          img.style.opacity = '1';
        }, { once: true });
        img.addEventListener('error', () => {
          if (!img.isConnected) return;
          img.style.opacity = '0';
          img.style.pointerEvents = 'none';
        }, { once: true });
      }
    };
    const bannerHost = document.querySelector('[data-slot="hero-banner"]') as HTMLElement | null;
    runBannerFade(bannerHost);

    if (reduce) {
      els.forEach(el => reveal(el, 0, false));
      return () => {
        art();
        window.removeEventListener('resize', layerArt);
      };
    }

    /*
     * Reveal on scroll. IntersectionObserver would be the textbook choice, but it
     * only delivers on rendering frames — on throttled/backgrounded renderers it
     * can stay silent for seconds, which would leave content invisible. A plain
     * scroll + interval sweep costs almost nothing and cannot miss.
     */
    const pending = new Set<HTMLElement>(els);
    let timer = 0;
    let ticking = 0;

    const show = (el: HTMLElement) => {
      pending.delete(el);
      if (el.dataset.reveal?.startsWith('s:')) {
        const siblings = Array.from(el.parentElement?.querySelectorAll(':scope > [data-reveal^="s:"]') || []);
        const index = Math.max(0, siblings.indexOf(el));
        reveal(el, Math.min(index, 6) * 0.1);
      } else {
        reveal(el);
      }
    };

    const limit = () => window.innerHeight - 100; // matches the original -100px viewport margin

    const sweep = () => {
      for (const el of Array.from(pending)) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top <= limit()) show(el);
      }
      if (pending.size === 0 && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };

    // first paint: only elements that are unambiguously on screen — anything
    // further down waits for `load`, because lazy images can still shift the page
    // and make a below-the-fold block look "in view" for a moment
    for (const el of Array.from(pending)) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top <= window.innerHeight * 0.5) show(el);
    }

    const onScroll = () => {
      if (ticking) return;
      ticking = window.setTimeout(() => {
        ticking = 0;
        sweep();
      }, 80);
    };

    // the interval covers late layout shifts (images, fonts, hydration) that fire
    // no scroll event; it stops by itself once every element has been revealed
    const start = () => {
      if (timer) return;
      timer = window.setInterval(sweep, 250);
      sweep();
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    const fallback = window.setTimeout(start, 1500);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      art();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('load', start);
      window.removeEventListener('resize', layerArt);
      if (timer) window.clearInterval(timer);
      if (ticking) window.clearTimeout(ticking);
      window.clearTimeout(fallback);
    };
  }, [pathname]);

  return hexHost ? <HexagonGrid host={hexHost} /> : null;
}
