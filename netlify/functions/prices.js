/*
  ESSENZA BY KD - price manager API  (/api/prices)

  GET   -> public. Returns the saved prices (or {} if nothing saved yet).
  POST  -> { action: "login", username, password }  -> { token }
           { action: "save", defaults, products }   -> needs "Authorization: Bearer <token>"

  Login ID / password are checked HERE on the server, so nobody can change
  prices by editing the page in their browser.

  Default login:  kd999 / kd999
  To change it later (recommended): Netlify -> Site configuration -> Environment
  variables -> add ADMIN_USER and ADMIN_PASS, then redeploy.
*/
const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'kd999';
const ADMIN_PASS = process.env.ADMIN_PASS || 'kd999';
const SECRET = process.env.ADMIN_SECRET || ('essenza-by-kd::' + ADMIN_USER + '::' + ADMIN_PASS);
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // stay logged in for 12 hours
const MAX_PRICE = 9999999;
const SIZE_KEYS = ['5ml', '10ml', 'FullBottle'];
const DEFAULT_KEYS = ['price5ml', 'price10ml', 'priceFullBottle'];

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (statusCode, obj) => ({ statusCode, headers, body: JSON.stringify(obj) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function makeToken() {
  const payload = Buffer.from(JSON.stringify({ u: ADMIN_USER, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return payload + '.' + sign(payload);
}

function tokenOk(token) {
  if (!token) return false;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.u === ADMIN_USER && Number(data.exp) > Date.now();
  } catch (e) {
    return false;
  }
}

function bearer(event) {
  const h = event.headers || {};
  const raw = h.authorization || h.Authorization || '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

function cleanPrice(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > MAX_PRICE) throw new Error('Prices must be whole numbers between 0 and ' + MAX_PRICE);
  return n;
}

function sanitize(input) {
  const out = { defaults: {}, products: {} };
  const d = (input && input.defaults) || {};
  for (const k of DEFAULT_KEYS) {
    const n = cleanPrice(d[k]);
    if (n === null) throw new Error('Default price is missing: ' + k);
    out.defaults[k] = n;
  }
  const prod = (input && input.products) || {};
  for (const [name, v] of Object.entries(prod).slice(0, 200)) {
    if (typeof name !== 'string' || !name || name.length > 120 || !v || typeof v !== 'object') continue;
    const row = {};
    for (const k of SIZE_KEYS) {
      const n = cleanPrice(v[k]);
      if (n !== null) row[k] = n;
    }
    if (Object.keys(row).length) out.products[name] = row;
  }
  out.updatedAt = new Date().toISOString();
  return out;
}

function priceStore(event) {
  // Loaded here (not at the top) so LOGIN still works even if the package is missing.
  const { connectLambda, getStore } = require('@netlify/blobs');
  try { connectLambda(event); } catch (e) { /* not needed in every runtime */ }
  return getStore({ name: 'essenza-prices', consistency: 'strong' });
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const data = (await priceStore(event).get('prices', { type: 'json' })) || {};
      return reply(200, data);
    }

    if (event.httpMethod === 'POST') {
      let body;
      try { body = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Invalid request' }); }

      if (body.action === 'login') {
        await sleep(700); // slows down password guessing
        const ok = safeEqual(body.username || '', ADMIN_USER) & safeEqual(body.password || '', ADMIN_PASS);
        if (!ok) return reply(401, { error: 'Wrong login ID or password' });
        return reply(200, { token: makeToken() });
      }

      if (body.action === 'save') {
        if (!tokenOk(bearer(event))) return reply(401, { error: 'Session expired. Please log in again.' });
        let clean;
        try { clean = sanitize(body); } catch (e) { return reply(400, { error: e.message }); }
        await priceStore(event).setJSON('prices', clean);
        return reply(200, { ok: true, saved: clean });
      }

      return reply(400, { error: 'Unknown action' });
    }

    return reply(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('prices function error:', err && err.message);
    const missing = err && err.code === 'MODULE_NOT_FOUND';
    return reply(500, { error: missing
      ? 'Storage package (@netlify/blobs) is not installed. Redeploy using Git or the Netlify CLI.'
      : 'Server error. Please try again.' });
  }
};
