/**
 * MongoDB access for the portfolio's own API.
 *
 * Same database as the dashboard (`portfolio`), so a contact-form submission
 * lands where the dashboard reads it from:
 *
 *   MONGODB_URI  connection string (env var, or a .env file in this folder)
 *   MONGODB_DB   database name (default: portfolio)
 *
 * When MongoDB is unavailable the local api-fixtures files stay in charge, so
 * the site keeps working offline.
 */
const fs = require('fs');
const path = require('path');
const dns = require('dns');
const { MongoClient, ObjectId } = require('mongodb');

const DB_NAME = process.env.MONGODB_DB || 'portfolio';

function parseEnvFile(file) {
  try {
    const out = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
    return out;
  } catch (e) { return {}; }
}

function findUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  for (const root of [__dirname, path.resolve(__dirname, '..')]) {
    for (const name of ['.env', '.env.local']) {
      const v = parseEnvFile(path.join(root, name)).MONGODB_URI;
      if (v) return v;
    }
  }
  return '';
}

const URI = findUri();
const SRV_HOST = (() => {
  const m = /^mongodb\+srv:\/\/[^@/]+@([^/?]+)/.exec(URI);
  return m ? '_mongodb._tcp.' + m[1] : '';
})();

let dnsReady = false;
async function ensureDns() {
  if (dnsReady || !SRV_HOST) { dnsReady = true; return; }
  await new Promise(resolve => {
    dns.resolveSrv(SRV_HOST, err => {
      if (err) dns.setServers(['1.1.1.1', '8.8.8.8', '8.8.4.4']);
      dnsReady = true;
      resolve();
    });
  });
}

let clientP = null;
let broken = false;

async function getDb() {
  if (!URI || broken) return null;
  if (!clientP) {
    clientP = (async () => {
      await ensureDns();
      const client = new MongoClient(URI, { serverSelectionTimeoutMS: 6000 });
      await client.connect();
      console.log('[db] connected to MongoDB, database: ' + DB_NAME);
      return client;
    })().catch(e => {
      broken = true;
      console.warn('[db] MongoDB unavailable, using local fixtures: ' + String(e.message || e).split('\n')[0]);
      return null;
    });
  }
  const client = await clientP;
  return client ? client.db(DB_NAME) : null;
}

/* ---------------------------------------------------------------- public */
async function addMessage(payload) {
  try {
    const db = await getDb();
    if (!db) return null;
    const res = await db.collection('messages').insertOne(payload);
    return String(res.insertedId);
  } catch (e) { return null; }
}

async function listTestimonials() {
  try {
    const db = await getDb();
    if (!db) return null;
    const col = db.collection('testimonials');
    const meta = db.collection('meta');
    if (!(await meta.findOne({ _id: 'migrated:testimonials' }))) {
      if ((await col.countDocuments()) === 0) {
        let fixture = [];
        try { fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'api-fixtures', 'comments.json'), 'utf8')).data || []; } catch (e) {}
        if (fixture.length) await col.insertMany(fixture);
      }
      await meta.updateOne({ _id: 'migrated:testimonials' }, { $setOnInsert: { at: new Date().toISOString() } }, { upsert: true });
    }
    const docs = await col.find().sort({ createdAt: -1, _id: -1 }).toArray();
    return docs.map(d => Object.assign({}, d, { _id: String(d._id) }));
  } catch (e) { return null; }
}

module.exports = { addMessage, listTestimonials, getDb };
