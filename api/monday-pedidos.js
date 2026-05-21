// Proxy serverless para los visores por vendedor.
// Consume el token MAXIFER de Monday (env var MONDAY_TOKEN_MAXI) y devuelve
// los pedidos del vendedor identificado por slug. El frontend público
// (Temporales/visor.html) no ve el token.

const BOARD_ID = 7212937829;
const SUBBOARD_ID = 7212960979;
const ACTIVE_GROUP = 'new_group29179';
const DONE_GROUP = 'grupo_nuevo86596__1';
const CLIENTES_BOARD_ID = 8921412317;
const CLIENTES_COL_ZONA = 'numeric_mkzaa3hk';
const EXPRESOS_BOARD_ID = 8921417911;
const PROV_BOARD_ID = 9028339792;
const PROV_COL_UBIC = 'location_mkqf6pe1';
const PROV_COL_ZONA = 'dropdown_mkqx2g3q';

// Columna board_relation del cliente que apunta al board de Expresos.
const CLIENT_EXPRESO_COL = 'board_relation_mkpz3z72';

// Columnas que el visor PUEDE escribir (whitelist de seguridad). Aunque el
// link sea público, solo se editan campos operativos de pedidos y clientes.
const WRITABLE = {
  order:   { board: BOARD_ID,          cols: new Set(['project_status', 'color_mkpd637b', 'color_mkq17tse', 'text_mm0wyss6', 'date']) },
  subitem: { board: SUBBOARD_ID,       cols: new Set(['estado__1', 'status']) },
  client:  { board: CLIENTES_BOARD_ID, cols: new Set(['label__1', CLIENT_EXPRESO_COL]) }
};

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
  expreso: 'lookup_mkpzstfb',
  baseClientes: 'board_relation_mkpzzjqf',
  nombreCliente: 'lookup_mkpzmn01',
  telefono: 'lookup_mkpzh2zz',
  ubicacion: 'lookup_mkpztwy2',
  ubiExpreso: 'location_mkqtyppx',
  pago: 'color_mkpd637b',
  facturado: 'color_mkpdxc04',
  otsBs: 'text_mm0wyss6',
  detalleEnv: 'color_mkwanspv'
};
const COL_IDS = Object.values(COL);
const SUB_COL_IDS = ['men__desplegable__1', 'estado__1', 'status', 'men__desplegable8__1', 'text_mkq4c05', 'text_mkq4hjhx'];

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
  const clienteId = cv[COL.baseClientes]?.linked_item_ids?.[0] || null;
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
    clienteId: clienteId ? String(clienteId) : null,
    zonaCliente: null,
    etiqueta: cv[COL.etiqueta]?.display_value || cv[COL.etiqueta]?.text || '',
    expreso: cv[COL.expreso]?.display_value || cv[COL.expreso]?.text || '',
    telefono: cv[COL.telefono]?.display_value || cv[COL.telefono]?.text || '',
    ubicacion,
    ubiAddr: ubiExpresoCv?.address || '',
    lat: ubiExpresoCv?.lat || null,
    lng: ubiExpresoCv?.lng || null,
    pago: cv[COL.pago]?.text || '',
    facturado: cv[COL.facturado]?.text || '',
    ots: cv[COL.otsBs]?.text || '',
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
            ... on BoardRelationValue { display_value linked_item_ids }
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
                ... on BoardRelationValue { display_value linked_item_ids }
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
            ... on BoardRelationValue { display_value linked_item_ids }
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

  if (orders.length === 0) return orders;

  // Subitems en lotes. items(ids:[...]) trunca a 25 si no se pasa limit.
  const subColIds = JSON.stringify(SUB_COL_IDS);
  const ids = orders.map(o => o.id);
  const BATCH = 80;
  const subMap = new Map();
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const q = `query { items(ids: [${batch.join(',')}], limit: 200) {
      id subitems { id name column_values(ids: ${subColIds}) { id text value } }
    }}`;
    try {
      const d = await mondayQuery(token, q);
      for (const it of (d.items || [])) {
        const subs = (it.subitems || []).map(s => {
          const cv = {};
          for (const c of s.column_values) cv[c.id] = c;
          let tipoIdx = null;
          try {
            const v = JSON.parse(cv['men__desplegable__1']?.value || 'null');
            if (v?.ids?.[0] != null) tipoIdx = v.ids[0];
          } catch (e) {}
          return {
            id: s.id,
            name: s.name,
            tipo: cv['men__desplegable__1']?.text || '',
            tipoIdx,
            exhibidor: cv['estado__1']?.text || '',
            gavetaRepo: cv['status']?.text || '',
            detalles: cv['men__desplegable8__1']?.text || '',
            faltGav: cv['text_mkq4c05']?.text || '',
            faltExhib: cv['text_mkq4hjhx']?.text || ''
          };
        });
        subMap.set(it.id, subs);
      }
    } catch (e) { /* silent */ }
  }
  for (const o of orders) o.subitems = subMap.get(o.id) || [];

  // Zonas de Base Clientes (para el detector de inconsistencias)
  const cliIds = Array.from(new Set(orders.map(o => o.clienteId).filter(Boolean)));
  if (cliIds.length > 0) {
    const zonaMap = new Map();
    const CLI_BATCH = 100;
    for (let i = 0; i < cliIds.length; i += CLI_BATCH) {
      const batch = cliIds.slice(i, i + CLI_BATCH);
      const q = `query { items(ids: [${batch.join(',')}], limit: 200) {
        id column_values(ids: ["${CLIENTES_COL_ZONA}"]) { id text }
      }}`;
      try {
        const d = await mondayQuery(token, q);
        for (const it of (d.items || [])) {
          const z = it.column_values?.[0]?.text;
          if (z !== undefined && z !== null && z !== '') zonaMap.set(String(it.id), z);
        }
      } catch (e) { /* silent */ }
    }
    for (const o of orders) {
      if (o.clienteId) o.zonaCliente = zonaMap.get(String(o.clienteId)) || null;
    }
  }

  return orders;
}

// Opciones de los selectores editables del panel + lista de expresos.
function parseStatusLabels(settingsStr) {
  try {
    const s = JSON.parse(settingsStr || '{}');
    const labels = s.labels || {};
    const pos = s.labels_positions_v2 || {};
    return Object.keys(labels)
      .filter(k => labels[k] && String(labels[k]).trim())
      .sort((a, b) => (pos[a] != null ? pos[a] : 999) - (pos[b] != null ? pos[b] : 999))
      .map(k => labels[k]);
  } catch (e) { return []; }
}

async function fetchMeta(token) {
  const q = `query {
    cols: boards(ids: [${BOARD_ID}, ${CLIENTES_BOARD_ID}]) { id columns { id settings_str } }
    exp: boards(ids: ${EXPRESOS_BOARD_ID}) { items_page(limit: 300) { items { id name } } }
  }`;
  const d = await mondayQuery(token, q);
  const byBoard = {};
  for (const b of (d.cols || [])) {
    const m = {};
    for (const c of (b.columns || [])) m[c.id] = c.settings_str;
    byBoard[String(b.id)] = m;
  }
  const pedidos = byBoard[String(BOARD_ID)] || {};
  const clientes = byBoard[String(CLIENTES_BOARD_ID)] || {};
  const columnOptions = {
    estado:   parseStatusLabels(pedidos['project_status']),
    vendedor: parseStatusLabels(pedidos['color_mkq17tse']),
    pago:     parseStatusLabels(pedidos['color_mkpd637b']),
    etiqueta: parseStatusLabels(clientes['label__1'])
  };
  const expresos = (d.exp?.[0]?.items_page?.items || []).map(it => ({ id: String(it.id), name: it.name }));
  return { columnOptions, expresos };
}

async function handleUpdate(req, res, token) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const kind = String(body?.kind || '');
  const itemId = String(body?.itemId || '');
  const columnId = String(body?.columnId || '');
  const value = body?.value;

  const rule = WRITABLE[kind];
  if (!rule) return res.status(400).json({ error: 'kind inválido' });
  if (!rule.cols.has(columnId)) return res.status(403).json({ error: 'Columna no editable: ' + columnId });
  if (!/^\d+$/.test(itemId)) return res.status(400).json({ error: 'itemId inválido' });

  let q;
  if (columnId === CLIENT_EXPRESO_COL) {
    // Expreso del cliente: board_relation → change_column_value con JSON.
    const linkedId = String(value == null ? '' : value).trim();
    if (linkedId && !/^\d+$/.test(linkedId)) return res.status(400).json({ error: 'value inválido' });
    const jsonVal = JSON.stringify(linkedId ? { item_ids: [Number(linkedId)] } : { item_ids: [] });
    q = `mutation { change_column_value(board_id: ${rule.board}, item_id: ${itemId}, column_id: "${columnId}", value: ${JSON.stringify(jsonVal)}) { id } }`;
  } else {
    if (typeof value !== 'string' || value.length > 255) return res.status(400).json({ error: 'value inválido' });
    q = `mutation { change_simple_column_value(board_id: ${rule.board}, item_id: ${itemId}, column_id: "${columnId}", value: ${JSON.stringify(value)}, create_labels_if_missing: false) { id } }`;
  }
  try {
    await mondayQuery(token, q);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function fetchProveedores(token) {
  const q = `query { boards(ids: ${PROV_BOARD_ID}) {
    items_page(limit: 200) {
      items {
        id name
        column_values(ids: ["${PROV_COL_UBIC}", "${PROV_COL_ZONA}"]) {
          id text
          ... on LocationValue { lat lng address }
        }
      }
    }
  }}`;
  const data = await mondayQuery(token, q);
  const items = data.boards?.[0]?.items_page?.items || [];
  return items.map(it => {
    const cv = {};
    for (const c of it.column_values) cv[c.id] = c;
    const loc = cv[PROV_COL_UBIC];
    return {
      id: String(it.id),
      name: it.name,
      zona: cv[PROV_COL_ZONA]?.text || '',
      lat: loc?.lat ? parseFloat(loc.lat) : null,
      lng: loc?.lng ? parseFloat(loc.lng) : null,
      address: loc?.address || ''
    };
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.MONDAY_TOKEN_MAXI;
  if (!token) return res.status(500).json({ error: 'Backend no configurado (falta MONDAY_TOKEN_MAXI en Vercel)' });

  if (req.method === 'POST') return handleUpdate(req, res, token);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');
  const slug = String(req.query.slug || req.query.v || '').toLowerCase().trim();
  if (!slug) return res.status(400).json({ error: 'Falta parámetro ?slug=' });

  const vendorLabel = SLUG_TO_VENDOR[slug];
  if (!vendorLabel) return res.status(404).json({ error: 'Vendedor no encontrado', slug, validSlugs: Object.keys(SLUG_TO_VENDOR) });

  try {
    const fullAccess = FULL_ACCESS_SLUGS.has(slug);
    const [orders, proveedores, meta] = await Promise.all([
      fetchOrders(token, fullAccess ? null : vendorLabel),
      fetchProveedores(token).catch(() => []),
      fetchMeta(token).catch(() => ({ columnOptions: {}, expresos: [] }))
    ]);
    return res.status(200).json({
      vendor: vendorLabel,
      fullAccess,
      slug,
      generatedAt: new Date().toISOString(),
      count: orders.length,
      orders,
      proveedores,
      columnOptions: meta.columnOptions,
      expresos: meta.expresos
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
