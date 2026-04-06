const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBCXI0iEDfof5GNY6SJg8wI7WuHY18ooC74d5pOAU2701RVzBgI7iyNtEd6t2TgMM3/exec';

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
    const url = APPS_SCRIPT_URL + '?payload=' + encodeURIComponent(body);
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await response.text();

    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(502).json({ error: 'Respuesta no JSON', detail: text.slice(0, 300) });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
