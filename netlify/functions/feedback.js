const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const store = getStore({ name: 'essenza-feedback', consistency: 'strong' });
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

  try {
    if (event.httpMethod === 'GET') {
      const entries = (await store.get('entries', { type: 'json' })) || [];
      return { statusCode: 200, headers, body: JSON.stringify(entries.slice(0, 100)) };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      const name = String(data.name || '').trim().slice(0, 60);
      const rating = Number(data.rating);
      const message = String(data.message || '').trim().slice(0, 500);
      if (!message || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid feedback' }) };
      }
      const entries = (await store.get('entries', { type: 'json' })) || [];
      entries.unshift({ name: name || 'Customer', rating, message, createdAt: new Date().toISOString() });
      await store.setJSON('entries', entries.slice(0, 100));
      return { statusCode: 201, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) };
  }
};
