// api/sheets.js — Proxy para Google Apps Script

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwjO02cugWUQix_KdGZ2wZT_sUoYe-k06p6CyDD53jJ86xFb9HO039SM1J8rvuA-von/exec';

export const config = {
  api: { bodyParser: { sizeLimit: '2mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Google Apps Script redirige POST a una URL diferente
    // Hay que seguir la redirección manualmente repostando el body
    let response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body,
      redirect: 'manual', // no seguir automáticamente
    });

    // Si hay redirección (302), seguirla con el body original
    if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
      const redirectUrl = response.headers.get('location');
      response = await fetch(redirectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
      });
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      return res.status(200).send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
