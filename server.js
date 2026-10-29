/**
 * Local server for the MD. Sajjad Hossain portfolio copy.
 *
 * - Serves this folder on PORT 5000 (override with: PORT=8080 node server.js)
 * - Resolves clean routes (/about -> about/index.html)
 * - Answers Next.js client navigation (RSC: 1 header or ?_rsc=) with the
 *   captured flight payload (about/index.rsc) so <Link> navigation works
 * - Falls back to the site's own not-found page with a 404 status
 *
 *   node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mongo = require('./mongo');

const ROOT = __dirname;
// the host shell exports PORT=0, so only honour a real, positive port
const envPort = Number(process.env.PORT);
const PORT = Number.isInteger(envPort) && envPort > 0 ? envPort : 5000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json; charset=utf-8',
  '.rsc': 'text/x-component; charset=utf-8'
};

function send(req, res, status, file, extraHeaders = {}) {
  const ext = path.extname(file).toLowerCase();
  const headers = Object.assign(
    { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' },
    extraHeaders
  );
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    headers['Content-Length'] = stat.size;
    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------------------------------------------------------- local API
 * The live site drives three parts of the UI from server endpoints:
 *   GET  /api/comments              -> testimonials section on the home page
 *   GET  /api/github/contributions  -> contribution graph on /about
 *   POST /api/messages              -> contact form submission
 * Responses captured from the live site are stored in api-fixtures/.
 * ------------------------------------------------------------------------ */
const FIXTURES = path.join(ROOT, 'api-fixtures');

function json(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': buf.length, 'Cache-Control': 'no-store' });
  res.end(buf);
}

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(data));
  });
}

async function handleApi(req, res, pathname) {
  const fixture = name => {
    try { return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8')); } catch (e) { return null; }
  };

  if (pathname === '/api/comments' && req.method === 'GET') {
    // MongoDB is the source of truth; the fixture answers while it is offline
    const fromDb = await mongo.listTestimonials();
    if (fromDb) return json(res, 200, { success: true, data: fromDb, count: fromDb.length });
    const data = fixture('comments.json');
    return data ? json(res, 200, data) : json(res, 404, { success: false, error: 'Not found' });
  }

  // writing a review needs a signed-in session on the live site too
  if (pathname === '/api/comments' && req.method === 'POST') {
    return json(res, 401, { success: false, error: 'Unauthorized' });
  }

  if (pathname === '/api/github/contributions' && req.method === 'GET') {
    const data = fixture('github_contributions.json');
    return data ? json(res, 200, data) : json(res, 404, { success: false, error: 'Not found' });
  }

  if (pathname === '/api/messages' && req.method === 'GET') {
    const data = fixture('messages.json');
    return data ? json(res, 200, data) : json(res, 401, { success: false, error: 'Unauthorized' });
  }

  // contact form: stored in MongoDB (and mirrored to the local fixture so the
  // dashboard still has something to show while the database is offline)
  if (pathname === '/api/messages' && req.method === 'POST') {
    const raw = await readBody(req);
    let payload = {};
    try { payload = JSON.parse(raw || '{}'); } catch (e) {}
    payload.receivedAt = new Date().toISOString();
    try {
      const file = path.join(FIXTURES, 'received-messages.json');
      let log = [];
      try { log = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
      log.push(payload);
      fs.writeFileSync(file, JSON.stringify(log, null, 2));
    } catch (e) {}
    const id = await mongo.addMessage(payload);
    if (id) payload._id = id;
    return json(res, 200, { success: true, data: payload });
  }

  return json(res, 404, { success: false, error: 'Not found' });
}

function notFound(res) {
  const page = path.join(ROOT, '404.html');
  fs.stat(page, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Not Found');
    }
    res.writeHead(404, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
    fs.createReadStream(page).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(url.parse(req.url).pathname);
  } catch (e) {
    res.writeHead(400);
    return res.end('Bad Request');
  }

  const wantsRsc =
    (req.headers.rsc === '1' || req.headers.rsc === '' || req.headers['next-router-prefetch'] === '1') ||
    Object.prototype.hasOwnProperty.call(url.parse(req.url, true).query, '_rsc');

  if (pathname === '/api' || pathname.startsWith('/api/')) return handleApi(req, res, pathname);

  /* Vercel analytics loaders only exist on the deployed site — answer them
     with a no-op so the local copy runs without console errors */
  if (pathname === '/_vercel/insights/script.js' || pathname === '/_vercel/speed-insights/script.js' || pathname === '/analytics-stub.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end('/* local copy: analytics disabled */');
  }

  /* next/image optimizer emulation: the HTML keeps its original
     /_next/image?url=... markup, so those requests resolve to the real file */
  if (pathname === '/_next/image') {
    const query = url.parse(req.url, true).query;
    const raw = Array.isArray(query.url) ? query.url[0] : query.url;
    if (!raw) return notFound(res);
    let target = raw;
    try { target = decodeURIComponent(raw); } catch (e) {}
    if (/^https?:\/\//i.test(target)) {
      // optimizer was pointed at an external asset (e.g. a GitHub avatar)
      res.writeHead(302, { Location: target, 'Cache-Control': 'no-store' });
      return res.end();
    }
    if (!target.startsWith('/')) target = '/' + target;
    const file = path.normalize(path.join(ROOT, target));
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return send(req, res, 200, file);
    }
    return notFound(res);
  }

  const target = path.normalize(path.join(ROOT, pathname));
  if (!target.startsWith(ROOT)) return notFound(res);

  // exact file on disk
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return send(req, res, 200, target);
  }

  // clean route -> folder with index.html / index.rsc
  const dir = path.join(target, 'index.html');
  if (fs.existsSync(dir)) {
    if (wantsRsc) {
      const rsc = path.join(target, 'index.rsc');
      if (fs.existsSync(rsc)) return send(req, res, 200, rsc);
    }
    return send(req, res, 200, dir);
  }

  // /about.html style
  if (fs.existsSync(target + '.html')) return send(req, res, 200, target + '.html');

  return notFound(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('portfolio-client running at http://localhost:' + PORT);
});