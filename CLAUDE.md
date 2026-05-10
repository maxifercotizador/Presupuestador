# Instrucciones para Claude Code

## Workflow de Git
- Trabajá SIEMPRE directamente sobre la branch main. No crees branches nuevas.
- Si el harness te asigna una feature branch igual mergeala (fast-forward) a `main` y empujá `main` antes de terminar — GitHub Pages sirve desde `main` y Maxi prueba sobre el sitio en vivo.
- Después de cada modificación: hacé commit con un mensaje descriptivo en español y pusheá a main.
- No abras Pull Requests. Push directo a main.

## Contexto del proyecto
Este repo es una app HTML de MAXIFER desplegada en GitHub Pages.
El dueño es Max (Maximiliano Gordillo).
Idioma: español (Argentina).

## Estilo
- Mensajes de commit cortos y en español. Ejemplo: "fix: corrige cálculo de descuento"
- Respondeme en español, breve y directo.

## StatiCrypt — mapa completo (igual en los 3 repos cifrados)

> Bloque idéntico en `Presupuestador/CLAUDE.md`, `Proyecto-Privado/CLAUDE.md` y `Temporales/CLAUDE.md`. Si tocás uno, sincronizá los otros dos.

**Las 2 contraseñas del ecosistema MAXIFER**:

| Password | Rol | Suffix de keys (localStorage) | Repos donde se usa | HTMLs |
|----------|-----|-------------------------------|--------------------|-------|
| `159159` | Empleados | `_emp` | **Presupuestador** | `index.html`, `index_presupuestador.html`, `3en1.html`, `compras.html` |
| `maxifer847` | Admin (Maxi) | `_maxi` | **Proyecto-Privado** | `index.html`, `Analisis_de_Costos.html`, `Analisis_de_Gastos.html`, `Pedidos_a_Fabrica.html`, `surtidos.html` |
| `maxifer847` | Admin (Maxi) | `_maxi` | **Temporales** | `Index_general.html`, `VIAJE_SUR.html`, `Prospectos.html`, `Notas_Pendientes.html`, `analisis_financiero.html`, `postventa_monday.html` |

**Salt** (mismo para TODOS los HTMLs cifrados de los 3 repos): `cc5a1a7142676e8a40368a16e858f1de`. Usalo con `--salt`, NO el valor de `.staticrypt.json`.

### Cómo identificar qué password usa un archivo ANTES de descifrar

1. **Por suffix en el HTML cifrado**: buscar `staticrypt_expiration_emp` o `staticrypt_expiration_maxi`:
   - `_emp` → password `159159`
   - `_maxi` → password `maxifer847`
2. **Si el suffix no está claro**: probá con `159159` primero, y si falla con `maxifer847`. La incorrecta tira `ERROR: could not decrypt`, la correcta funciona silenciosa.

**Repo actual** (`Presupuestador`): rol = **empleados**, password = **`159159`**, suffix = **`_emp`**.

### Workflow obligatorio cuando edites un HTML cifrado de este repo

1. Descifrar: `npx --yes staticrypt <archivo> --decrypt -p '159159' --salt 'cc5a1a7142676e8a40368a16e858f1de' -d decrypted/` → `decrypted/<archivo>`.
2. Editar el HTML descifrado.
3. Re-cifrar conservando el template del lock screen (`--remember 30`, `--short`, mismo `--salt`, mismos textos en español, mismos colores `#f59e0b` / `#0f172a`).
4. Post-procesar el archivo cifrado:
   - Renombrar keys: `staticrypt_expiration` → `staticrypt_expiration_emp`, `staticrypt_passphrase` → `staticrypt_passphrase_emp` (suffix correspondiente al rol del repo — `_emp` acá).
   - Re-agregar `<meta name="robots" content="noindex, nofollow">` después del `<meta charset>`.
   - Re-insertar antes de `</head>`: `<link rel="stylesheet" href="maxifer-branding.css">` y `<script defer src="maxifer-branding.js"></script>`.
5. Verificar roundtrip (descifrar el resultado y `diff` contra el descifrado original — debe ser vacío).
6. Reemplazar el archivo en el repo, commitear y pushear a `main`. **Siempre re-cifrar antes de cerrar la tarea.**
- **Nunca** dejes el archivo descifrado en el repo. Lo que se commitea es siempre el cifrado.


## Branding compartido (no editar a mano)

`maxifer-branding.css` y `maxifer-branding.js` son archivos **auto-sincronizados**. La fuente de verdad vive en `Flyers-Catalogo`. Cuando cambian allá, un workflow (`Flyers-Catalogo/.github/workflows/sync-branding.yml`) los copia automáticamente a este repo y commitea con el mensaje `chore(branding): sync from Flyers-Catalogo (<sha>)`.

**No edites estos 2 archivos directamente acá.** Si querés cambiar la marca, hacelo en `Flyers-Catalogo` y se propaga solo en menos de 1 minuto.


## Contexto del ecosistema MAXIFER (igual en los 4 CLAUDE.md)

> **Importante**: este bloque va idéntico en `Presupuestador/CLAUDE.md`, `Proyecto-Privado/CLAUDE.md`, `Temporales/CLAUDE.md` y `Flyers-Catalogo/CLAUDE.md`. Si lo cambiás en uno, sincronizá los otros tres.

### Los 4 repos

| Repo | Rol | Auth | Dueño efectivo |
|------|-----|------|----------------|
| **Presupuestador** | Cotización, listas, compras (apps de empleados) | StatiCrypt `159159` (suffix `_emp`) | Empleados |
| **Proyecto-Privado** | Backoffice admin (análisis financiero, costos, pedidos a fábrica). **Hostea el dashboard `architecture-map/`**. | StatiCrypt `maxifer847` (suffix `_maxi`) | Maxi |
| **Temporales** | Apps de Maxi (CRM Prospectos, VIAJE_SUR, postventa Monday, notas, análisis financiero). **Nombre engañoso — son apps de producción, NO temporales.** | StatiCrypt `maxifer847` (suffix `_maxi`) | Maxi |
| **Flyers-Catalogo** | Catálogo público sin auth. **Hostea `maxifer-branding.{css,js}` como fuente de verdad.** | Sin auth (público) | Público |

### Workflows automáticos del ecosistema

| Repo | Workflow | Disparador | Qué hace |
|------|----------|------------|----------|
| Presupuestador | `generar-jsons.yml` | push de `Listas Maxifer.xlsx` o `Precio Surtidos.xlsx` | Regenera `productos.json` y `surtidos.json` con `build_data.py` |
| Presupuestador | `check-catalog-consistency.yml` | push de `Precio Surtidos.xlsx` | Compara contra `Flyers-Catalogo/surtidos-data.js`. Si hay drift, abre/actualiza un Issue con label `catalog-drift` en Flyers-Catalogo. Si no hay drift, lo cierra solo. |
| Presupuestador | `generar-miniaturas.yml` | manual | Genera miniaturas de imágenes |
| Flyers-Catalogo | `sync-branding.yml` | push de `maxifer-branding.{css,js}` | Copia los archivos a Presupuestador/Proyecto-Privado/Temporales |
| Proyecto-Privado | `regenerate-architecture-map.yml` | dispatch / cron / push | Re-escanea los 4 repos, regenera `architecture-map/dependency-graph.json`, **detecta cambios significativos vs scan anterior** y **abre Issues automáticos** (label `inventario-pendiente`) cuando aparece un servicio externo / workflow / integración nuevos sin documentar |
| Los 4 repos | `notify-architecture-map.yml` | push a `main` | Triggerea regenerate del dashboard via repository_dispatch |

### Secrets requeridos

- `ARCHITECTURE_MAP_PAT` (en los 4 repos): fine-grained PAT con Contents R/W + Metadata R + Secrets R/W. Permite a los workflows operar cross-repo (commitear, abrir issues, leer/clonar).
- `STATICRYPT_PASSWORDS` (solo en Proyecto-Privado, valor = `159159,maxifer847`): permite al scan descifrar HTMLs cifrados en CI durante la regeneración del dashboard.

### Archivos auto-generados — NO editar a mano

- `Presupuestador/productos.json`, `Presupuestador/surtidos.json` — generados por `build_data.py` desde los Excels.
- `Presupuestador/thumbs/` — generados por `generar_miniaturas.py`.
- `*/maxifer-branding.{css,js}` (excepto en Flyers-Catalogo, que es la fuente) — sincronizados desde Flyers-Catalogo automáticamente.
- `Proyecto-Privado/architecture-map/dependency-graph.json` — regenerado por `architecture-map/scripts/scan_repos.py`. Si necesitás overrides manuales (nodos que el scan no detecta, edges no inferibles, renames de label), editá `Proyecto-Privado/architecture-map/_manual_nodes.json` — el scan los mergea en cada corrida.

### Apps con dependencias externas importantes

#### 🔄 Sincronización SharePoint → GitHub

- **⚡ Power Automate (Microsoft 365)** — flujo automático. Hace 2 cosas:
  1. Sube Excels editados a GitHub (commits "auto: actualiza X desde SharePoint" autoreados como `maxifercotizador <info@fabricamaxifer.com>`).
  2. **Genera los JSONs financieros derivados** (`financiero_facturacion.json`, `financiero_gastos.json`, `financiero_resumen.json`, `ventas_monday.json`, `sur_data.json`, `pendientes_data.json`) y los commitea en el mismo push.
  
  **Excels que sincroniza**: `Listas Maxifer.xlsx`, `Precio Surtidos.xlsx` (Presupuestador); `01 COMPRAS - COSTOS - FABRICAS.xlsm`, `03 Pedidos Fabricas.xlsm`, `Control de ingresos y gastos.xlsm`, `Gastos Fijos.xlsx` (Proyecto-Privado).

- **☁️ SharePoint (Microsoft 365)** — fuente upstream donde Maxi edita los Excels maestros.

#### 🔥 Bases de datos / sync cloud

- **Firebase Firestore** (project `presupuestador-maxifer`) — base de datos NoSQL que espeja claves de localStorage de las apps (last-write-wins). Sirve para que los datos sincronicen entre celulares de Maxi. La usan vía `firebase-sync.js`: `Presupuestador/compras.html`, `Temporales/{Notas_Pendientes,Prospectos,VIAJE_SUR,postventa_monday}.html`. Config Firebase pública (es estándar en clientes web).

#### ⚡ Backends Vercel (serverless)

- **`presupuestador-eight.vercel.app`** — deployment del repo Presupuestador con 2 functions:
  - `/api/sheets.js` → proxy a **Google Apps Script** (macro de Google que probablemente lee/escribe a una Google Sheet).
  - `/api/transcribir.js` → proxy a **API de Anthropic (Claude)**, usa secret `ANTHROPIC_API_KEY` (env var en Vercel). Probablemente para transcripción de audio.
- **mcp-asistente.vercel.app** — servidor MCP (Python). Conecta los datos de MAXIFER a Claude.ai: lee JSONs financieros, surtidos, productos, despachos vía GitHub raw y los expone como tools. Permite preguntar en Claude "¿cuánto facturé este mes?" o "¿qué le entregué a Casa Blanco?". Es **lector**, no escritor.

#### 📈 Analytics

- **Google Analytics 4** — 2 properties:
  - `G-K8QLJVZT4X` en páginas públicas (`listas.html` del Presupuestador + `Flyers-Catalogo`).
  - `G-LMXG9MDKGC` en `firebase-sync.js` (apps internas con sync).

#### 📊 Monday.com

- `Temporales/Prospectos.html` (board `18410539555` "Seguimiento Prospectos")
- `Temporales/postventa_monday.html` (board `7212937829` "Equipo MAXIFER")
- `Temporales/VIAJE_SUR.html` (board `8921412317`)
- `Proyecto-Privado/surtidos.html`

Token Monday guardado en `localStorage` del navegador (nunca commiteado).

#### 📱 WhatsApp

- Links `wa.me/<numero>?text=...` desde `Temporales/Prospectos.html` y otras. **NO automatizado** — el usuario tiene que tocar enviar.


### Convenciones de commits y branches

- Mensajes de commit en español Argentina, breves.
- **Push directo a `main` está bloqueado** por el harness git server (rechaza con `send-pack: unexpected disconnect`). Usar branches `claude/<tema>` + Pull Request + merge vía MCP GitHub (`mcp__github__merge_pull_request`).
- NO usar `--no-verify`, `--amend`, ni operaciones destructivas (`reset --hard`, `push --force`) salvo pedido explícito de Maxi.
- Los CLAUDE.md de cada repo dicen "push directo a main" como ideal, pero en la práctica del harness eso no funciona → usar PRs.

### Dashboard de arquitectura

- URL pública: `https://maxifercotizador.github.io/Proyecto-Privado/architecture-map/`
- Servido desde `Proyecto-Privado/architecture-map/`, NO está cifrado con StatiCrypt (es accesible para Maxi sin password adicional).
- Linkeado desde `Temporales/Index_general.html` en el módulo "Proyecto Privado" como "🗺️ Mapa de Arquitectura".
- Si una conexión está mal o falta en el grafo → editar `Proyecto-Privado/architecture-map/_manual_nodes.json` y push a main. El scan auto-mergea esos overrides.

### Tests / validaciones existentes

- `Proyecto-Privado/architecture-map/scripts/validate_graph.py` — valida estructura del JSON del dashboard.
- `Presupuestador/scripts/check_catalog_consistency.py` — chequea drift Excel ↔ catálogo Flyers.
- No hay otros tests automatizados. Si querés agregar, integrarlos a los workflows existentes.
