# portfolio-client

The public portfolio site for **MD. Sajjad Hossain** — a Next.js 15 + React 19 +
TypeScript app (App Router), deployed to **<https://md-sajjad-hossain.vercel.app>**.

Every page is generated from the captured static site, so the markup, styles and
fonts are the original ones; the parts that need data (contact form, guestbook,
testimonials) are React client components wired to the dashboard API.

## Run

```bash
npm install          # once
npm run dev          # http://localhost:5000
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run generate     # regenerate app/ + lib/pages/ from the captured site
```

Node >= 18. The API base URL comes from `NEXT_PUBLIC_API_URL` (`.env` holds the
local value `http://127.0.0.1:3000`; Vercel holds the production value).

## Structure

| Path | Purpose |
| --- | --- |
| `app/` | App Router pages — `layout.tsx` plus one `page.tsx` per route, all generated |
| `lib/pages/*.ts` | the generated page markup as typed strings (one per route) |
| `lib/api.ts` | typed fetch client + `useApi` hook for the dashboard API |
| `components/` | client components mounted into pages (`MessageForm`, `GuestbookLive`, `BookCall`, `Testimonials`) plus the site-wide `SiteEffects`, `CursorFX`, `GitHubActivity`, `GlobeSection` and `HeroRoleLoop` runtimes, and the sonner-style `Toaster` |
| `scripts/generate-pages.mjs` | the generator: captured site → `app/` + `lib/pages/` + `public/site.css` |
| `public/` | served assets: `site.css`, `site/media/` fonts, images, `svg/`, `rss.xml`, `sitemap.xml` |
| `public/site.css` | the captured stylesheet, linked from the layout (not imported — see below) |
| `public/motion.css`, `public/link-tiles.css`, `public/sonner.css` | the animations, the `/links` social-tile styles and the toast styles the original injected at runtime; all linked from the layout |
| `index.html`, `about/`, `workspace/`, `work/*`, `_next/`, … | **captured source** — the input the generator reads; not served directly |
| `api-fixtures/` | captured API responses; the dashboard seeds its collections from here |

## How generation works

`node scripts/generate-pages.mjs` walks the 19 routes and, for each one:

1. pulls the real body content out of React's streaming hoist container and
   drops it in place of the pending Suspense boundary, so nothing renders hidden;
2. strips hydration scripts, streaming comments and empty `<template>` markers;
3. removes the initial states of entrance animations (`opacity:0` +
   `transform:translateY(…)`) — the original site animated those in on scroll,
   and with its JavaScript gone the content would otherwise stay invisible.
   Styles that toggle (`transition:`) or start collapsed (`height:0px`) are left
   alone, since modals and accordions are meant to begin hidden;
4. writes the markup to `lib/pages/<key>.ts` and a matching `app/<route>/page.tsx`
   with real Next.js metadata.

The entrance states themselves are **kept** and tagged `data-reveal="source:props"`
(`s:` = inline-style origin, `c:` = Tailwind `opacity-0` origin) so the page still
ships the animation's starting point. `components/SiteEffects.tsx` then plays them
in as the content scrolls into view — 0.6s with a 0.1s sibling stagger, matching
the original `whileInView` timing — and reveals anything on screen at load so
content can never be stranded invisible.

Pages that need live data get a `<!--SLOT-->` marker; the generated page splits on
it and mounts the React component there, so a form lands inside the layout
instead of under the footer.

The captured stylesheet is written to `public/site.css` and **linked** from
`layout.tsx` rather than imported: it carries a few rules the original site got
wrong (`.card p:not::after){…}`), browsers recover from those on their own, but
Next runs every imported stylesheet through cssnano, which refuses to parse them.
Fonts are copied to `public/site/media/` so the rewritten `/_next/static/media/*`
URLs resolve.

## API wiring

| Route | Component | Endpoint |
| --- | --- | --- |
| `/fillForm` | `MessageForm` | `POST /api/messages` |
| `/guestBook` | `GuestbookLive` | `GET` + `POST /api/testimonials` |
| `/` | `Testimonials` | `GET /api/testimonials` |
| `/bookCall` | `BookCall` | Cal.com inline embed (`sajjadmolliek/15min`) |
| `/about` (GitHub Activity card) | `GitHubActivity` | `GET /api/github` — server-side proxy to GitHub's GraphQL API |
| `/` (time zone card) | `GlobeSection` → `GlobeCanvas` | three.js globe, lazy-loaded on scroll |

`/api/github` reads `GITHUB_TOKEN` from the server environment (set in Vercel for
production, `.env` locally) and answers with the contribution calendar for
`GITHUB_LOGIN`; the token is never shipped to the browser and the response is
cached for five minutes. The captured card fills in its heading, month row and
53×7 grid from that response.

## The globe

The home page's "I'm very flexible with time zone communications" card keeps an
empty box in the captured markup; `GlobeSection` mounts a three.js globe there
once it comes within 200px of the viewport, and nothing WebGL enters the first
load (`/` still ships 107 kB of JS). The scene mirrors the reference exactly —
`three-globe` with its `@react-three/fiber` camera, lights and idle rotation — and
its inputs are extracted from the captured site's own chunks:

* `public/globe-countries.json` — the 176 country features it hexes
* `lib/globe-arcs.ts` — the 40 arcs, each recoloured at random on load

Regenerate both with `node ../extract-globe-data.mjs` (run from this folder) if
the capture changes.

The dashboard lives at **<https://portfolio-dashboard-sajjad.vercel.app>** and
answers with CORS headers for this origin.

## Deployed

Vercel project `md-sajjad-hossain` → <https://md-sajjad-hossain.vercel.app>
(`vercel --prod` from this folder). Production `NEXT_PUBLIC_API_URL` is set in
Vercel's environment, not in `.env`.
