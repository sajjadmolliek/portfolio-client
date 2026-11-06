import fs from 'node:fs';

/* The reference site renders its hero background in the client, so the static
 * capture only holds a bailed-out placeholder and the generated markup came back
 * without the photo. Re-add the frame, the photo and the gradient placeholder
 * exactly as the reference ships them, tagged data-slot="hero-banner" so
 * SiteEffects can cross-fade the placeholder out once the photo loads. */

const photo = (alt) =>
  `<img alt="${alt}" loading="eager" width="1920" height="1080" decoding="async" data-nimg="1" class="absolute inset-0 h-full w-full object-cover" style="color:transparent;opacity:0;transition:opacity .5s ease" srcSet="/_next/image?url=%2Fportfolio.png&w=32&q=75 32w, /_next/image?url=%2Fportfolio.png&w=256&q=75 256w, /_next/image?url=%2Fportfolio.png&w=1080&q=75 1080w, /_next/image?url=%2Fportfolio.png&w=1920&q=75 1920w" src="/_next/image?url=%2Fportfolio.png&w=1920&q=75"/>`;

const gradient =
  `<svg viewBox="0 0 1920 1080" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" style="opacity:1;transition:opacity .5s ease" aria-hidden="true" focusable="false"><defs><linearGradient id="ohm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0a0a"/><stop offset="1" stop-color="#000000"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#ohm)"/></svg>`;

/*
 * Home's banner ships as the empty frame over `bg-black`: the reference capture
 * never paints portfolio.png (that picture is itself a screenshot of a website,
 * so fading it in put a second navbar directly under the real one) and its
 * placeholder gradient only lifted the background off pure black. Workspace
 * keeps the photo + gradient placeholder it already had.
 */
const frame = (alt, { withPhoto = true, withGradient = true } = {}) =>
  `<div class="w-full absolute inset-0 h-screen banner-frame overflow-hidden"><div style="width:100%;height:100%;position:relative"></div>${withPhoto ? photo(alt) : ''}${withGradient ? gradient : ''}</div>`;

// the generated files are double-quoted strings: every `"` inside them is \"`
const esc = (s) => s.replace(/"/g, '\\"');

const patch = (path, edits) => {
  let src = fs.readFileSync(path, 'utf8');
  for (const { oldStr, newStr, label } of edits) {
    const o = esc(oldStr);
    const n = esc(newStr);
    const hits = src.split(o).length - 1;
    if (hits === 0 && src.includes(n)) {
      console.log(`  ..  ${path}: ${label} already applied`);
      continue;
    }
    if (hits !== 1) throw new Error(`${path}: ${label} matched ${hits} times (expected 1)`);
    src = src.replace(o, n);
    console.log(`  ok  ${path}: ${label}`);
  }
  fs.writeFileSync(path, src);
};

const heroOpen =
  '<div data-slot="hero-banner" class="min-h-screen relative w-full bg-black font-sans flex flex-col items-center justify-center overflow-hidden">';

patch('lib/pages/home.ts', [
  {
    label: 'home hero frame',
    oldStr:
      '<div class="min-h-screen relative w-full bg-black font-sans flex flex-col items-center justify-center overflow-hidden"><div class="w-full absolute inset-0 h-screen"><div style="width:100%;height:100%;position:relative"></div></div>',
    // no closing </div> here: heroOpen replaces the original hero container,
    // which stays open so the badge/headline/buttons keep sitting inside it,
    // centred over the banner, exactly as the reference renders them
    newStr: heroOpen + frame('Hero banner', { withPhoto: false, withGradient: false }),
  },
]);

/*
 * `/workspace` is deliberately NOT patched. Its content is client-rendered in
 * the reference (the capture only holds the bailed-out loading screen), and the
 * live page opens straight into the stacked project showcase — there is no hero
 * banner above it. Injecting one here pushed every section down a full viewport.
 */

for (const f of ['lib/pages/home.ts']) {
  const s = fs.readFileSync(f, 'utf8');
  const count = (k) => s.split(k).length - 1;
  console.log(
    `${f}: hero-banner=${count('data-slot=\\"hero-banner\\"')} banner-frame=${count('banner-frame')} photo=${count(
      'alt=\\"Hero banner\\"'
    )}+${count('alt=\\"Workspace hero\\"')} len=${s.length}`
  );
}