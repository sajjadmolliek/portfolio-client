# portfolio-client

A local, fully working copy of <http://localhost:5000/> served on port **5000**,
personalised to **MD. Sajjad Hossain** (<sajjadmolliek2018@gmail.com>, +8801734402046).

## Run

```bash
npm install        # once (mongodb driver)
node server.js     # http://localhost:5000
PORT=8080 node server.js  # different port
```

Node >= 18. The only dependency is `mongodb`, used to store contact-form
submissions and read testimonials from the same Atlas database the dashboard uses
(`MONGODB_URI` in `.env`; without it the local `api-fixtures/` files answer).

## What's inside

| Path | Purpose |
| --- | --- |
| `index.html`, `about/`, `workspace/`, `contact/`, `bookCall/`, `guestBook/`, `links/`, `fillForm/`, `privacyPolicy/`, `termsOfUse/`, `work/*` | 19 mirrored routes with the name, email, phone and photo replaced |
| `<route>/index.rsc` | Next.js flight payload so client-side `<Link>` navigation works without a Next server |
| `_next/` | CSS, fonts, JS chunks (including the runtime-mapped lazy chunks) and media |
| `*.png/jpg/webp/svg`, `svg/` | Images, icons and logos |
| `404.html` | The site's own not-found page (served with HTTP 404) |
| `api-fixtures/` | Captured API responses served locally (MongoDB fallback) |
| `server.js` | The static + API server |
| `mongo.js` | MongoDB helper used by the API endpoints |

## What `server.js` emulates

- **Clean routes** — `/about` → `about/index.html`
- **Next.js client navigation** — requests with `RSC: 1` or `?_rsc=` get the captured
  flight payload (`index.rsc`) with `text/x-component`
- **`/_next/image`** — the optimizer query is resolved to the real file on disk
- **`GET /api/comments`** — testimonials on the home page (captured response)
- **`GET /api/github/contributions`** — contribution graph on `/about`
- **`POST /api/messages`** — contact form; accepted and appended to
  `api-fixtures/received-messages.json` so the flow completes offline
- **`POST /api/comments`** / **`GET /api/messages`** — return `401`, matching the
  original site's behaviour for signed-out visitors (guestbook needs a login there too)
- **`/_vercel/insights/script.js`, `/_vercel/speed-insights/script.js`,
  `/analytics-stub.js`** — no-op stubs, so the copy runs without console errors and
  does not send page views to the original site's Google Analytics

## Personalisation

Everything on the site belongs to **MD. Sajjad Hossain** — replaced across the HTML,
inline flight payloads (row byte-lengths recomputed), `.rsc` navigation payloads, JS
chunks and API fixtures:

| | |
| --- | --- |
| Name | `MD. Sajjad Hossain` |
| Email | `sajjadmolliek2018@gmail.com` |
| Phone | `+8801734402046` — contact card + `telephone` in the `Person`/`Organization` JSON-LD |
| Photo | `av.jpg`, `av2.jpeg`, `profile.jpg`, `avatar.webp`, `favicon-32.png`, `apple-icon-180.png`, `icon-192.png` |
| Socials | `github.com/sajjadmolliek` · `linkedin.com/in/md-sajjad-molliek` · `instagram.com/m.r.molliek` · `t.me/sajjadmolliek` |
| Navbar avatar | 56 px (was 40) with a light ring, so the profile picture reads clearly |
| Decorative art | `superman.png` (260×280, transparent) in place of the old cartoon; `spider.png` deleted |

The `/links` cards show the matching handles (`@sajjadmolliek`, `@md-sajjad-molliek`,
`@m.r.molliek`, `@sajjadmolliek`). One testimonial written by the previous owner was
removed — three remain.

The admin panel lives next door in **`../backend-dashboard/`** and runs on port **3000**
(`node server.js`); it reads and writes this folder's `api-fixtures/`.

## Verified

- 3,119 local references resolve; 20/20 routes answer 200; 0 missing assets
- Flight payload integrity on all 20 HTML files (row lengths, boundaries) — 0 failures
- 338 images, 54 headings, page height 15007 px at 1440×900
- No old identity strings anywhere in the folder; no broken images on `/`, `/about`, `/links`
- Client-side navigation (no reload), contact form submission and the 404 page all work