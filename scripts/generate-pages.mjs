/**
 * Turns the captured static site into the Next.js App Router source.
 *
 * For every route it:
 *   1. pulls the page's real content out of React's streaming hoist container
 *      (`<div hidden id="S:0">…</div>`) and drops it in place of the pending
 *      Suspense boundary that sits in front of the footer — otherwise the body
 *      would render as nav + white loader + footer with everything else hidden,
 *   2. strips the hydration <script> tags, streaming comments and empty
 *      <template> markers,
 *   3. writes the markup to lib/pages/<key>.ts as a typed string,
 *   4. writes app/<route>/page.tsx with real Next.js metadata plus the client
 *      component that makes that page talk to the dashboard API.
 *
 * Pages that render a client component get a `<!--SLOT-->` marker at exactly the
 * spot where React should mount it, and the generated page splits the markup on
 * it, so a form/booking widget lands inside the layout instead of under the footer.
 *
 * The captured stylesheet ends up in public/site.css and is linked from the
 * layout rather than imported: it carries a few rules the original site got
 * wrong (`.card p:not::after){…}`), browsers recover from those on their own,
 * but Next runs every imported stylesheet through cssnano, which refuses to
 * parse them. Font files are copied to public/site/media so the rewritten
 * `/_next/static/media/*` URLs resolve.
 *
 *   node scripts/generate-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = ROOT; // the captured site currently lives at the project root

/** route -> the client component that gives it live data / forms */
const SLOTS = {
  '/': { comp: 'Testimonials', props: '' },
  '/contact': { comp: 'ContactForm', props: '' },
  '/fillForm': { comp: 'ContactForm', props: ' variant="collab"' },
  '/guestBook': { comp: 'Guestbook', props: '' },
  '/bookCall': { comp: 'BookCall', props: '' },
};

const ROUTES = [
  '/',
  '/about',
  '/workspace',
  '/contact',
  '/bookCall',
  '/guestBook',
  '/fillForm',
  '/links',
  '/privacyPolicy',
  '/termsOfUse',
  '/work/automation-platform',
  '/work/chat-application',
  '/work/downly',
  '/work/employee-management-system',
  '/work/facebook-campaign-analyzer',
  '/work/glasswind',
  '/work/nextype',
  '/work/personal-portfolio',
  '/work/planit',
];

const SLOT_MARKER = '<!--SLOT-->';
const BOUNDARY = '<!--$?--><template id="B:';
const HOIST = '<div hidden id="';

const keyFor = route => (route === '/' ? 'home' : route.slice(1).replace(/\//g, '-'));

/**
 * Walks an element block starting at `openIdx` (which points at `<div`) and
 * returns the offset just past its matching `</div>`. Skips anything inside
 * <script> so markup in inline scripts cannot unbalance the count.
 */
function divBlockEnd(html, openIdx) {
  const contentStart = html.indexOf('>', openIdx) + 1;
  if (contentStart <= 0) return -1;
  const re = /<script\b[^>]*>[\s\S]*?<\/script>|<div\b[^>]*>|<\/div>/gi;
  re.lastIndex = contentStart;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    if (tag.charCodeAt(0) === 60 && tag.charCodeAt(1) === 115 /* s */) continue; // script
    if (tag.startsWith('</')) {
      depth -= 1;
      if (depth === 0) return m.index + tag.length;
    } else if (!tag.endsWith('/>')) {
      depth += 1;
    }
  }
  return -1;
}

/**
 * The captured pages are static: framer-motion baked entrance animations into
 * inline styles (`opacity:0;transform:translateY(50px)`) and into Tailwind classes
 * (`opacity-0 translate-y-10 delay-300`), and both only ever run on the client.
 * Leaving them untouched would ship invisible content, so every such element is
 * tagged with `data-reveal="<source>:<props>"` and `components/SiteEffects.tsx`
 * animates it in when it scrolls into view.
 *
 * Styles that toggle (they carry `transition:`) or start collapsed
 * (`height:0px`) are left alone — those are modals and accordions that are
 * supposed to begin hidden, as are the many `group-hover:opacity-*` reveals.
 */
function markRevealStates(body) {
  return body.replace(/<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>'])*)>/g, (match, tag, attrs) => {
    if (attrs.includes('data-reveal')) return match;

    let reveal = '';
    const style = /(?:^|\s)style="([^"]*)"/.exec(attrs);
    if (style) {
      const decls = style[1];
      if (/(^|;)\s*opacity:0\s*(;|$)/.test(decls) && !/transition:/.test(decls) && !/height:0/.test(decls)) {
        const props = ['opacity'];
        if (/(^|;)\s*transform:/.test(decls)) props.push('transform');
        if (/(^|;)\s*filter:/.test(decls)) props.push('filter');
        reveal = `s:${props.join(',')}`;
      }
    }

    if (!reveal) {
      const cls = /(?:^|\s)class="([^"]*)"/.exec(attrs)?.[1];
      if (cls) {
        const tokens = cls.split(/\s+/);
        const hovered = tokens.some(t => t.includes('hover:') || t.includes('focus:'));
        if (tokens.includes('opacity-0') && !hovered) {
          const props = ['opacity'];
          if (tokens.some(t => /^(translate-|scale-|rotate-|skew-)/.test(t))) {
            props.push('transform', 'translate');
          }
          reveal = `c:${props.join(',')}`;
        }
      }
    }

    if (!reveal) return match;
    return `<${tag}${attrs} data-reveal="${reveal}">`;
  });
}

/**
 * The section heads — "Experience That / Brings Ideas to Life", "Curated Work",
 * "The Secret My Approuch" — ship as plain markup: no `opacity:0` for the pass
 * above to key on, so they were the one block on the site that never animated.
 * Each line of the block (eyebrow, the two <h1>s, the rule) now starts hidden
 * in the markup, which is what the original entrance animations do, and is
 * revealed by `SiteEffects` with the same 0.6s curve and 0.1s sibling stagger.
 */
function markHeadingBlocks(body) {
  const OPEN = /<div class="text-center px-4 bg-black[^"]*">/g;
  const HIDDEN = 'opacity:0;transform:translateY(50px)';
  let out = '';
  let cursor = 0;
  let m;
  while ((m = OPEN.exec(body))) {
    const contentStart = m.index + m[0].length;
    const end = divBlockEnd(body, m.index);
    OPEN.lastIndex = end < 0 ? OPEN.lastIndex : end;
    if (end < 0) continue;
    const inner = body.slice(contentStart, end - '</div>'.length);
    const fixed = inner.replace(/<(h[12]|div)((?:"[^"]*"|'[^']*'|[^>'])*)>/g, (tag, name, attrs) => {
      if (attrs.includes('data-reveal')) return tag;
      const cls = /(?:^|\s)class="([^"]*)"/.exec(attrs)?.[1] || '';
      const isRule = name === 'div' && cls.includes('h-1 bg-gradient-to-r');
      if (name !== 'h1' && name !== 'h2' && !isRule) return tag;
      const style = /(?:^|\s)style="([^"]*)"/.exec(attrs);
      const withStyle = style
        ? attrs.replace(style[0], ` style="${HIDDEN};${style[1]}"`)
        : `${attrs} style="${HIDDEN}"`;
      return `<${name}${withStyle} data-reveal="s:opacity,transform,translate">`;
    });
    out += body.slice(cursor, contentStart) + fixed;
    cursor = end - '</div>'.length;
  }
  return out + body.slice(cursor);
}

function cleanBody(html) {
  const open = html.indexOf('<body');
  const close = html.indexOf('</body>');
  if (open < 0 || close < 0) throw new Error('no <body> found');
  const tag = html.slice(open, html.indexOf('>', open) + 1);
  let inner = html.slice(html.indexOf('>', open) + 1, close);
  const cls = /class="([^"]*)"/.exec(tag)?.[1] || '';

  // 1. lift the streamed content out of its hidden container
  let hoisted = '';
  const hoistIdx = inner.indexOf(HOIST);
  if (hoistIdx >= 0) {
    const contentStart = inner.indexOf('>', hoistIdx) + 1;
    const blockEnd = divBlockEnd(inner, hoistIdx);
    if (blockEnd < 0) throw new Error('unbalanced hoist container');
    hoisted = inner.slice(contentStart, blockEnd - '</div>'.length);
    inner = inner.slice(0, hoistIdx) + inner.slice(blockEnd);
  }

  // 2. drop it in where the pending Suspense boundary sits (right before <footer>)
  const boundaryIdx = inner.indexOf(BOUNDARY);
  const footerIdx = inner.indexOf('<footer');
  if (boundaryIdx >= 0 && footerIdx > boundaryIdx) {
    inner = inner.slice(0, boundaryIdx) + hoisted + inner.slice(footerIdx);
    hoisted = '';
  }

  const body = inner
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<script[^>]*>/g, '')
    // streaming bookkeeping: comments, bailout markers and empty templates
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<template\b[^>]*>\s*<\/template>/g, '')
    .replace(/data-precedence="[^"]*"/g, '')
    // captured asset URLs live under /site/media in the new app
    .replace(/\/_next\/static\/media\//g, '/site/media/')
    .trim();

  return { body: markHeadingBlocks(markRevealStates(body)), bodyClass: cls };
}

function headInfo(html) {
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const title = (/<title>([\s\S]*?)<\/title>/.exec(head)?.[1] || '').trim();
  const description = (/<meta\s+name="description"\s+content="([^"]*)"/.exec(head)?.[1] || '').trim();
  const styles = [...head.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
  const sheets = [...head.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    .map(m => m[1])
    .filter(h => h.startsWith('/_next/'));
  return { title: unescapeHtml(title), description: unescapeHtml(description), styles, sheets };
}

const unescapeHtml = s =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/** Where on the page a client component should mount. */
function placeSlot(route, body) {
  if (route === '/bookCall') {
    // the captured page ships an empty full-height container for the Cal.com embed
    const container = 'min-h-screen"></div>';
    if (body.includes(container)) return body.replace(container, `min-h-screen">${SLOT_MARKER}</div>`);
  }
  if (body.includes('<footer')) return body.replace('<footer', SLOT_MARKER + '<footer');
  return body + SLOT_MARKER;
}

/* ------------------------------------------------------------------ pages */
ensureDir(path.join(ROOT, 'lib', 'pages'));

const generated = [];

for (const route of ROUTES) {
  const file = route === '/' ? path.join(SRC, 'index.html') : path.join(SRC, route.slice(1), 'index.html');
  if (!fs.existsSync(file)) {
    console.warn('! missing source for ' + route);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  let { body, bodyClass } = cleanBody(html);
  const { title, description } = headInfo(html);
  const key = keyFor(route);
  const slot = SLOTS[route];
  if (slot) body = placeSlot(route, body);

  fs.writeFileSync(
    path.join(ROOT, 'lib', 'pages', `${key}.ts`),
    `/* Generated from the captured site by scripts/generate-pages.mjs — do not edit. */\n` +
      `export const title = ${JSON.stringify(title)};\n` +
      `export const description = ${JSON.stringify(description)};\n` +
      `export const bodyClass = ${JSON.stringify(bodyClass)};\n` +
      `export const html = ${JSON.stringify(body)};\n`
  );

  const dir = route === '/' ? path.join(ROOT, 'app') : path.join(ROOT, 'app', route.slice(1));
  ensureDir(dir);

  const slotImport = slot ? `import ${slot.comp} from '@/components/${slot.comp}';\n` : '';
  const pageFn = slot
    ? `export default function Page() {\n` +
      `  const [before, after = ''] = html.split('${SLOT_MARKER}');\n` +
      `  return (\n` +
      `    <>\n` +
      `      <div dangerouslySetInnerHTML={{ __html: before }} />\n` +
      `      <${slot.comp}${slot.props} />\n` +
      `      <div dangerouslySetInnerHTML={{ __html: after }} />\n` +
      `    </>\n` +
      `  );\n` +
      `}\n`
    : `export default function Page() {\n` +
      `  return <div dangerouslySetInnerHTML={{ __html: html }} />;\n` +
      `}\n`;

  fs.writeFileSync(
    path.join(dir, 'page.tsx'),
    `/* Generated from the captured site by scripts/generate-pages.mjs — do not edit. */\n` +
      `import type { Metadata } from 'next';\n` +
      `import { html, title, description } from '@/lib/pages/${key}';\n` +
      slotImport +
      `\nexport const metadata: Metadata = { title, description };\n\n` +
      pageFn
  );
  generated.push(route);
}

/* --------------------------------------------------------------- not-found */
const nf = path.join(SRC, '404.html');
if (fs.existsSync(nf)) {
  const { body } = cleanBody(fs.readFileSync(nf, 'utf8'));
  ensureDir(path.join(ROOT, 'app'));
  fs.writeFileSync(
    path.join(ROOT, 'app', 'not-found.tsx'),
    `/* Generated from the captured site by scripts/generate-pages.mjs — do not edit. */\n` +
      `export default function NotFound() {\n` +
      `  return <div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(body)} }} />;\n` +
      `}\n`
  );
}

/* ------------------------------------------------------------------- styles */
const mediaDir = path.join(ROOT, 'public', 'site', 'media');
ensureDir(mediaDir);

// fonts, svg and everything else the captured pages reference
const mediaSrc = path.join(SRC, '_next', 'static', 'media');
if (fs.existsSync(mediaSrc)) {
  for (const f of fs.readdirSync(mediaSrc)) {
    const target = path.join(mediaDir, f);
    if (!fs.existsSync(target)) fs.copyFileSync(path.join(mediaSrc, f), target);
  }
}

// browsers ask for /favicon.ico even when an icon link is declared
const favicon = path.join(ROOT, 'public', 'favicon.ico');
const faviconSrc = path.join(SRC, 'favicon-32.png');
if (!fs.existsSync(favicon) && fs.existsSync(faviconSrc)) fs.copyFileSync(faviconSrc, favicon);

const { styles, sheets } = headInfo(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
const parts = [];
for (const href of sheets) {
  const p = path.join(SRC, href.replace(/^\//, ''));
  if (fs.existsSync(p)) parts.push(fs.readFileSync(p, 'utf8'));
}
parts.push(...styles);
const siteCss = parts.join('\n').replace(/\/_next\/static\/media\//g, '/site/media/');
// served as a plain static file — see the note at the top of this file
fs.writeFileSync(path.join(ROOT, 'public', 'site.css'), siteCss);
fs.rmSync(path.join(ROOT, 'app', 'site.css'), { force: true });

console.log('generated ' + generated.length + ' routes: ' + generated.join(', '));
console.log('wrote public/site.css (' + Math.round(siteCss.length / 1024) + ' kB) and fonts in public/site/media');
