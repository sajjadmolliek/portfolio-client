'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';

/**
 * The nav's client-only half.
 *
 * The captured site renders three pieces of the header in the browser, so they
 * never reach the static HTML the generator reads:
 *
 *   • the search / command palette (also what the mobile hamburger opens, and
 *     what Ctrl/Cmd+K opens),
 *   • the "More" dropdown with the five discovery cards,
 *   • the aria-label swap on the hamburger between "Open menu" and
 *     "Close menu" (with the X icon) while that palette is up.
 *
 * The buttons themselves are already in the markup but carry no handlers —
 * this component wires them up with `addEventListener`, then renders both
 * surfaces through a portal with the original's exact class strings (the
 * captured `public/site.css` ships every utility they use).
 */

/* ------------------------------------------------------------------ icons */

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22v-7h6v7',
  person: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  calendar: 'M8 2v4 M16 2v4 M3 6h18v15H3z M3 11h18',
  book: 'M12 7v14 M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  info: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M12 16v-4 M12 8h.01',
  code: 'm16 18 6-6-6-6 M8 6l-6 6 6 6',
  github: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4 M9 18c-4.51 2-5-2-7-2',
  instagram: 'M4 4h16v16H4z M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8 M17.5 6.5h.01',
  linkedin: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 3a2 2 0 1 0 0 4 2 2 0 1 0 0-4',
  telegram: 'M22 2 11 13 M22 2l-7 20-4-9-9-4z',
  shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  rss: 'M4 11a9 9 0 0 1 9 9 M4 4a16 16 0 0 1 16 16 M5 19h.01',
  sitemap: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z M9 4v14 M15 6v14',
  external: 'M15 3h6v6 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
  search: 'm21 21-4.34-4.34 M3 11a8 8 0 1 0 16 0 8 8 0 1 0-16 0',
} as const;

type IconName = keyof typeof ICONS;

function Ico({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  return (
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
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ------------------------------------------------------------------- data */

type Entry = { label: string; href: string; icon: IconName; external?: boolean };

const PAGES: Entry[] = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'About', href: '/about', icon: 'person' },
  { label: 'Projects', href: '/workspace', icon: 'grid' },
  { label: 'Contact', href: '/contact', icon: 'mail' },
  { label: 'Book a Call', href: '/bookCall', icon: 'calendar' },
];

const DISCOVER: Entry[] = [
  { label: 'Guestbook', href: '/guestBook', icon: 'book' },
  { label: 'Bucket List', href: '/', icon: 'list' },
  { label: 'Uses', href: '/', icon: 'info' },
  { label: 'Links', href: '/links', icon: 'link' },
  { label: 'Attribution', href: '/', icon: 'code' },
];

const CONNECT: Entry[] = [
  { label: 'GitHub', href: 'https://github.com/sajjadmolliek', icon: 'github', external: true },
  { label: 'Instagram', href: 'https://www.instagram.com/m.r.molliek', icon: 'instagram', external: true },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/md-sajjad-molliek', icon: 'linkedin', external: true },
  { label: 'Telegram', href: 'https://t.me/sajjadmolliek', icon: 'telegram', external: true },
];

const LEGAL: Entry[] = [
  { label: 'Privacy Policy', href: '/privacyPolicy', icon: 'shield' },
  { label: 'Terms of Use', href: '/termsOfUse', icon: 'file' },
];

const FEED: Entry[] = [
  { label: 'RSS', href: '/rss.xml', icon: 'rss', external: true },
  { label: 'Sitemap', href: '/sitemap.xml', icon: 'sitemap', external: true },
];

const GROUPS = [
  { heading: 'Pages', items: PAGES },
  { heading: 'More', items: DISCOVER },
  { heading: 'Connect', items: CONNECT },
  { heading: 'Legal', items: LEGAL },
  { heading: 'Discover', items: FEED },
];

/** The two cards the dropdown leads with — the originals carry photos. */
const CARDS: (Entry & { bgImage: string })[] = [
  {
    ...DISCOVER[0],
    bgImage:
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
  {
    ...DISCOVER[1],
    bgImage:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  },
];

const CARDS_DESC = ['Let me know you were here', 'Things to do at least once in my life'];
const ROW_DESC: Record<string, string> = {
  Links: 'All my links are here',
  Uses: 'A peek into my digital...',
  Attribution: 'Journey to create this site',
};

const BURGER_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu w-6 h-6 text-white" aria-hidden="true"><path d="M4 12h16"></path><path d="M4 18h16"></path><path d="M4 6h16"></path></svg>';

const BURGER_CLOSE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x w-6 h-6 text-white" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';

const burgerButton = () =>
  document.querySelector<HTMLButtonElement>('nav.md\\:hidden button[aria-label]');

const matches = (entry: Entry, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.label.toLowerCase().includes(q) ||
    entry.href.toLowerCase().includes(q) ||
    (q.length > 2 && entry.href.toLowerCase().replace(/\s/g, '').includes(q.replace(/\s/g, '')))
  );
};

/* -------------------------------------------------------------- component */

export default function SiteMenus() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [more, setMore] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const burgerHtml = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);

  /* a route change drops both surfaces (their markup is re-generated) */
  useEffect(() => {
    setOpen(false);
    setMore(null);
  }, [pathname]);

  /* --------------------------------------------- wire the captured buttons */
  useEffect(() => {
    if (!mounted) return;

    const search = document.querySelector<HTMLButtonElement>('button[aria-label="Search (Ctrl+K)"]');
    const burger = burgerButton();
    const onOpen = () => setOpen(prev => !prev);
    search?.addEventListener('click', onOpen);
    burger?.addEventListener('click', onOpen);

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', onKey);

    const moreButton = Array.from(document.querySelectorAll('nav button')).find(
      b => b.textContent?.trim() === 'More',
    );
    const onMore = (e: Event) => {
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMore(prev =>
        prev ? null : { top: Math.round(rect.bottom + 16), left: Math.round(rect.left + rect.width / 2) },
      );
    };
    moreButton?.addEventListener('click', onMore);

    // outside click + scrolling down both dismiss it, exactly like the original
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (moreButton && moreButton.contains(target)) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      setMore(null);
    };
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      if (down) setMore(null);
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      search?.removeEventListener('click', onOpen);
      burger?.removeEventListener('click', onOpen);
      document.removeEventListener('keydown', onKey);
      moreButton?.removeEventListener('click', onMore);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mounted, pathname]);

  /* ------------------------------------------- palette open/close side effects */
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);

    const burger = burgerButton();
    if (burger) {
      burgerHtml.current ??= burger.innerHTML;
      burger.setAttribute('aria-label', 'Close menu');
      burger.innerHTML = BURGER_CLOSE;
    }

    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(id);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (burger?.isConnected) {
        burger.setAttribute('aria-label', 'Open menu');
        if (burgerHtml.current !== null) burger.innerHTML = burgerHtml.current;
      }
    };
  }, [open]);

  /* ------------------------------------------------------------- palette */
  const results = useMemo(
    () => GROUPS.map(group => ({ heading: group.heading, items: group.items.filter(e => matches(e, query)) })),
    [query],
  );
  const flat = useMemo(() => results.flatMap(g => g.items), [results]);
  const count = results.reduce((n, g) => n + g.items.length, 0);

  useEffect(() => setCursor(0), [query]);

  const go = (entry: Entry) => {
    setOpen(false);
    if (entry.external) window.open(entry.href, '_blank', 'noopener,noreferrer');
    else router.push(entry.href);
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(i => (flat.length ? (i + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(i => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      const entry = flat[cursor];
      if (entry) {
        e.preventDefault();
        go(entry);
      }
    }
  };

  if (!mounted) return null;

  return (
    <>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-200"
            data-state="open"
            onMouseDown={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              data-state="open"
              onMouseDown={e => e.stopPropagation()}
              className="fixed left-[50%] top-[50%] z-[101] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 rounded-2xl dark overflow-hidden p-0 sm:max-w-lg [&>button:last-child]:hidden top-20 translate-y-0 md:top-1/2 md:-translate-y-1/2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            >
              <div cmdk-root="" className="flex h-full flex-col overflow-hidden rounded-md text-foreground">
                <div className="flex items-center border-b border-input px-5" cmdk-input-wrapper="">
                  <Ico name="search" className="me-3 text-muted-foreground/80 h-5 w-5" />
                  <input
                    cmdk-input=""
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder="Try 'guestbook' or 'contact'"
                    aria-label="Search"
                    className="flex h-10 w-full rounded-lg bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div
                  cmdk-list=""
                  className="max-h-80 overflow-y-auto overflow-x-hidden"
                  role="listbox"
                >
                  {count === 0 && (
                    <div cmdk-empty="" className="py-6 text-center text-sm">
                      No results found.
                    </div>
                  )}
                  {results.map(group =>
                    group.items.length ? (
                      <div
                        key={group.heading}
                        cmdk-group=""
                        className="overflow-hidden p-2 text-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
                      >
                        <div cmdk-group-heading="" className="px-3 py-2 text-xs font-medium text-muted-foreground">
                          {group.heading}
                        </div>
                        {group.items.map(entry => {
                          const index = flat.indexOf(entry);
                          const active = index === cursor;
                          return (
                            <div
                              key={`${entry.label}-${entry.href}`}
                              cmdk-item=""
                              data-selected={active ? 'true' : 'false'}
                              role="option"
                              aria-selected={active}
                              onMouseEnter={() => setCursor(index)}
                              onMouseDown={e => {
                                e.preventDefault();
                                go(entry);
                              }}
                              className="relative flex cursor-default select-none items-center gap-3 rounded-md px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 px-3 py-2"
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <Ico name={entry.icon} className="h-4 w-4" />
                              </span>
                              <span className="flex-1">{entry.label}</span>
                              {entry.external && (
                                <Ico name="external" className="h-3.5 w-3.5 text-muted-foreground/60" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {more &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[100]"
            style={{ top: more.top, left: more.left, transform: 'translateX(-50%)' }}
          >
            {/*
              `-top-3` and an arbitrary max-width are not in the captured
              stylesheet (it only carries what the original ever rendered), so
              those two values are written inline instead.
            */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 rounded-t-full"
              style={{ top: -12 }}
            />
            <div
              className="w-180 bg-black/90 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              data-state="open"
              style={{ maxWidth: 'calc(100vw - 2rem)' }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {CARDS.map((card, i) => (
                    <a
                      key={card.href + CARDS_DESC[i]}
                      href={card.href}
                      onClick={() => setMore(null)}
                      className="relative overflow-hidden rounded-xl h-50 group"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${card.bgImage})` }}
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all duration-200" />
                      <div className="relative z-10 p-3 h-full flex flex-col justify-end">
                        <h3 className="text-white font-medium text-sm mb-1">{card.label}</h3>
                        <p className="text-white/80 text-xs">{CARDS_DESC[i]}</p>
                      </div>
                    </a>
                  ))}
                </div>
                <div className="space-y-2">
                  {DISCOVER.slice(2).map(entry => (
                    <a
                      key={entry.label}
                      href={entry.href}
                      onClick={() => setMore(null)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0 text-white/70 group-hover:text-white transition-colors bg-gray-700 p-2 rounded-lg">
                        <Ico name={entry.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm">{entry.label}</h3>
                        <p className="text-white/60 text-xs mt-1">{ROW_DESC[entry.label]}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}