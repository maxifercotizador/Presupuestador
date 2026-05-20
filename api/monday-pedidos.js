// Proxy serverless para los visores por vendedor.
// Consume el token MAXIFER de Monday (env var MONDAY_TOKEN_MAXI) y devuelve
// solo los pedidos del vendedor identificado por slug. El frontend público
// (Temporales/visor.html) no ve el token.

const BOARD_ID = 7212937829;
const ACTIVE_GROUP = 'new_group29179';
const DONE_GROUP = 'grupo_nuevo86596__1';

// Slug → label exacto del dropdown vendedor en el board (color_mkq17tse)
const SLUG_TO_VENDOR = {
  'micky':    'Micky-Fabi',
  'nadia':    'Nadia Uldokat',
  'maxi':     'Maximiliano Gordillo',
  'victor':   'Victor Gordillo',
  'daniel':   'Daniel Tumini',
  'fede':     'Federico-Cordoba',
  'rafa':     'Rafael Bonet',
  'gabriel':  'Gabriel Oribe',
  'eduardo':  'EDUARDO',
  'marcelo':  'MARCELO',
  'armando':  'ARMANDO',
  'gabi':     'GABI MAYESKI',
  'noa':      'Daniel Noa'
};

// Slugs que ven TODOS los pedidos (no se filtran por vendedor).
// Nadia está a cargo de toda la logística, ve el board completo.
const FULL_ACCESS_SLUGS = new Set(['nadia', 'maxi']);

const COL = {
  status: 'project_status',
  fechaEntrega: 'date',
  fechaInicio: 'date_mkq052j',
  vendedor: 'color_mkq17tse',
  vendedorMirror: 'lookup_mkpzg5rd',
  etiqueta: 'lookup_mkpz5epk',
  baseClientes: 'board_relation_mkpzzjqf',
  nombreCliente: 'lookup_mkpzmn01',
  telefono: 'lookup_mkpzh2zz',
  ubicacion: 'lookup_mkpztwy2',
  ubiExpreso: 'location_mkqtyppx',
  detalleEnv: 'color_mkwanspv'
};
const COL_IDS = Object.values(COL);
const SUB_COL_IDS = ['men__desplegable__1', 'estado__1', 'status', 'men__desplegable8__1'];

async function mondayQuery(token, query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      'API-Version': '2024-10'
    },
    body: JSON.stringify({ query })
  });
  if (!r.ok) throw new Error('Monday HTTP ' + r.status);
  const data = await r.json();
  if (data.errors) throw new Error(data.errors[0]?.message || 'Monday API error');
  return data.data;
}

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getCurrentWeek() {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function parseOrder(item, vendorFilter) {
  const cv = {};
  for (const c of item.column_values || []) cv[c.id] = c;

  const vendedor = cv[COL.vendedor]?.text || cv[COL.vendedorMirror]?.display_value || '';
  if (vendorFilter && vendedor.trim() !== vendorFilter) return null;

  const clientName = (cv[COL.baseClientes]?.display_value ||
                      cv[COL.nombreCliente]?.display_value || '').trim();
  const ubicacion = (cv[COL.ubicacion]?.display_value || cv[COL.ubicacion]?.text || '').trim();
  const ubiExpresoCv = cv[COL.ubiExpreso];
  const fechaText = cv[COL.fechaEntrega]?.text || '';

  return {
    id: item.id,
    name: item.name,
    group: item.group?.title || '',
    estado: cv[COL.status]?.text || '',
    vendedor,
    clientName,
    etiqueta: cv[COL.etiqueta]?.display_value || cv[COL.etiqueta]?.text || '',
    telefono: cv[COL.telefono]?.display_value || cv[COL.telefono]?.text || '',
    ubicacion,
    ubiAddr: ubiExpresoCv?.address || '',
    lat: ubiExpresoCv?.lat || null,
    lng: ubiExpresoCv?.lng || null,
    detalleEnv: cv[COL.detalleEnv]?.text || '',
    fechaText
  };
}

async function fetchOrders(token, vendorLabel) {
  const colIdsStr = JSON.stringify(COL_IDS);
  const orders = [];

  // Activos
  let cursor = null, page = 0;
  do {
    page++;
    const q = cursor ? `
      query { next_items_page(limit: 200, cursor: "${cursor}") {
        cursor items {
          id name group { id title }
          column_values(ids: ${colIdsStr}) {
            id text value
            ... on MirrorValue { display_value }
            ... on BoardRelationValue { display_value }
            ... on LocationValue { lat lng address }
          }
        }
      }}` : `
      query { boards(ids: ${BOARD_ID}) {
        groups(ids: ["${ACTIVE_GROUP}"]) {
          items_page(limit: 200) {
            cursor items {
              id name group { id title }
              column_values(ids: ${colIdsStr}) {
                id text value
                ... on MirrorValue { display_value }
                ... on BoardRelationValue { display_value }
                ... on LocationValue { lat lng address }
              }
            }
          }
        }
      }}`;
    const data = await mondayQuery(token, q);
    const pageObj = cursor ? data.next_items_page : data.boards[0].groups[0].items_page;
    for (const item of pageObj.items) {
      const o = parseOrder(item, vendorLabel);
      if (o) orders.push(o);
    }
    cursor = pageObj.cursor;
  } while (cursor && page < 20);

  // Finalizados de la semana
  const week = getCurrentWeek();
  const fromStr = ymd(week[0]);
  const toStr = ymd(week[6]);
  const finQ = `query { boards(ids: ${BOARD_ID}) {
    groups(ids: ["${DONE_GROUP}"]) {
      items_page(limit: 200, query_params: { rules: [{ column_id: "date", compare_value: ["${fromStr}", "${toStr}"], operator: between }], operator: and }) {
        items {
          id name group { id title }
          column_values(ids: ${colIdsStr}) {
            id text value
            ... on MirrorValue { display_value }
            ... on BoardRelationValue { display_value }
            ... on LocationValue { lat lng address }
          }
        }
      }
    }
  }}`;
  try {
    const finData = await mondayQuery(token, finQ);
    const finItems = finData.boards?.[0]?.groups?.[0]?.items_page?.items || [];
    for (const item of finItems) {
      const o = parseOrder(item, vendorLabel);
      if (o) { o.isFinalized = true; orders.push(o); }
    }
  } catch (e) { /* silent */ }

  // Subitems (solo si hay pedidos)
  if (orders.length > 0) {
    const subColIds = JSON.stringify(SUB_COL_IDS);
    const ids = orders.map(o => o.id);
    const BATCH = 80;
    const subMap = new Map();
    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      const q = `query { items(ids: [${batch.join(',')}]) {
        id subitems { id name column_values(ids: ${subColIds}) { id text value } }
      }}`;
      try {
        const d = await mondayQuery(token, q);
        for (const it of (d.items || [])) {
          const subs = (it.subitems || []).map(s => {
            const cv = {};
            for (const c of s.column_values) cv[c.id] = c;
            return {
              id: s.id,
              name: s.name,
              tipo: cv['men__desplegable__1']?.text || '',
              exhibidor: cv['estado__1']?.text || '',
              gavetaRepo: cv['status']?.text || '',
              detalles: cv['men__desplegable8__1']?.text || ''
            };
          });
          subMap.set(it.id, subs);
        }
      } catch (e) { /* silent */ }
    }
    for (const o of orders) o.subitems = subMap.get(o.id) || [];
  }

  return orders;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const slug = String(req.query.slug || req.query.v || '').toLowerCase().trim();
  if (!slug) return res.status(400).json({ error: 'Falta parámetro ?slug=' });

  const vendorLabel = SLUG_TO_VENDOR[slug];
  if (!vendorLabel) return res.status(404).json({ error: 'Vendedor no encontrado', slug, validSlugs: Object.keys(SLUG_TO_VENDOR) });

  const token = process.env.MONDAY_TOKEN_MAXI;
  if (!token) return res.status(500).json({ error: 'Backend no configurado (falta MONDAY_TOKEN_MAXI en Vercel)' });

  try {
    const fullAccess = FULL_ACCESS_SLUGS.has(slug);
    const orders = await fetchOrders(token, fullAccess ? null : vendorLabel);
    return res.status(200).json({
      vendor: vendorLabel,
      fullAccess,
      slug,
      generatedAt: new Date().toISOString(),
      count: orders.length,
      orders
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
