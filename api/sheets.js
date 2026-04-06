export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbxBCXI0iEDfof5GNY6SJg8wI7WuHY18ooC74d5pOAU2701RVzBgI7iyNtEd6t2TgMM3/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(req.body),
      redirect: 'follow'
    });
    const text = await response.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(502).json({ error: 'No JSON', detail: text.slice(0, 500) });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
