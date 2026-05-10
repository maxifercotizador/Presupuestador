# Instrucciones para Claude Code

## 🧠 Memoria entre sesiones (LEER PRIMERO)

> **Antes de hacer cualquier cosa**, si tenés acceso al repo `maxifercotizador/Proyecto-Privado`, leé este archivo:
>
> `Proyecto-Privado/.claude-memoria/INDEX.md`
>
> Si no estás trabajando en `Proyecto-Privado` pero podés leer otros repos, hacé:
> ```
> curl -s https://raw.githubusercontent.com/maxifercotizador/Proyecto-Privado/main/.claude-memoria/INDEX.md
> ```
> o usá `mcp__github__get_file_contents` con `owner=maxifercotizador, repo=Proyecto-Privado, path=.claude-memoria/INDEX.md`.

Ese archivo es el **registro acumulativo de qué se hizo en sesiones anteriores** entre Maxi y Claude. Te ahorra reaprender todo cada vez. Si Maxi te dice "como hicimos la otra vez", "lo que decidimos antes", "el sistema que armamos" — la respuesta está en esa memoria.

### Tu obligación al cerrar tareas significativas

Cuando mergeés un PR significativo o cuando Maxi cierra un tema importante, antes de terminar tu turno:

1. **Agregá una línea a `Proyecto-Privado/.claude-memoria/INDEX.md`** con: fecha, qué se hizo, link al PR, link al archivo de detalle (si lo creaste).
2. **Si fue una sesión grande con varias decisiones**, creá un archivo `Proyecto-Privado/.claude-memoria/YYYY-MM-DD-slug.md` con:
   - Contexto inicial (qué pidió Maxi)
   - Qué se descubrió / construyó
   - Decisiones que se tomaron
   - Pendientes acordados al cierre
3. **Si Maxi dice "guardá", "cerramos", "perfecto, listo"** o similar — interpretalo como pedido explícito de actualizar la memoria.

Maxi no se acuerda de los detalles técnicos. Vos sí, gracias a este sistema. **Es tu responsabilidad mantenerlo al día.**

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


<!-- BEGIN auto-sync-from-graph (no editar a mano — se regenera desde dependency-graph.json) -->

_Generado automáticamente desde `architecture-map/dependency-graph.json` (26 servicios externos detectados)._

#### 🔄 Sincronización SharePoint → GitHub

- **☁️ SharePoint (Microsoft 365)** — Carpeta SharePoint donde Maxi edita los Excels maestros. Power Automate los sincroniza a GitHub al cambiar.
- **⚡ Power Automate** — Flujo automático en Microsoft Power Automate. Cuando Maxi edita un Excel en SharePoint: (1) sube el Excel a GitHub; (2) procesa el Excel y genera los JSONs derivados (financiero_*.json, ventas_monday, sur_data, pendientes_data); (3) commitea todo con mensaje 'auto: actualiza X desde SharePoint'.

#### 🔥 Bases de datos / sync cloud

- **🔥 Firebase Firestore** — Project Firebase 'presupuestador-maxifer'. Base de datos NoSQL que espeja claves de localStorage (last-write-wins). Sirve como cloud-sync entre celulares de Maxi. La usan vía firebase-sync.js: compras.html, Notas_Pendientes.html, Prospectos.html, VIAJE_SUR.html, postventa_monday.html. **Lo usan**: `firebase-sync.js`. [https://console.firebase.google.com/project/presupuestador-maxifer](https://console.firebase.google.com/project/presupuestador-maxifer).

#### ⚡ Backends Vercel (serverless)

- **▲ Vercel: presupuestador-eight** — Deployment Vercel del repo Presupuestador (presupuestador-eight.vercel.app). Hostea 2 serverless functions: api/sheets.js (proxy a Google Apps Script) y api/transcribir.js (proxy a Anthropic API). También sirve listas.html como vista pública. **Lo usan**: `Presupuestador/listas.html`, `Proyecto-Privado/🤖 mcp-asistente (servidor MCP)`. [https://presupuestador-eight.vercel.app](https://presupuestador-eight.vercel.app).
- **🤖 mcp-asistente (servidor MCP)** — Servidor MCP en Vercel que conecta los datos de MAXIFER a Claude.ai. Lee los JSONs financieros, surtidos, productos, despachos y los expone como tools. Permite preguntar en Claude '¿cuánto facturé este mes?' o '¿qué le entregué a Casa Blanco?'.

#### 🤖 APIs de IA

- **🤖 Claude API (Anthropic)** — API de Anthropic (api.anthropic.com/v1/messages) — usada para TRANSCRIBIR FOTOS DE PEDIDOS MANUSCRITOS. El empleado saca foto del papel del pedido en Presupuestador/3en1.html (función transcribeAllImages) o index_presupuestador.html, la app la manda al Vercel proxy api/transcribir.js, que llama a Claude con la imagen + prompt; Claude lee el pape... **Lo usan**: `Presupuestador/index_presupuestador.html`, `Presupuestador/transcribir.js`. **Secret**: `ANTHROPIC_API_KEY`. [https://docs.anthropic.com](https://docs.anthropic.com).

#### 📊 Google Workspace

- **Google Drive (6ac30698)** — Archivo o carpeta en Google Drive. **Lo usan**: `Proyecto-Privado/Pedidos_a_Fabrica.html`, `Proyecto-Privado/index.html`. [https://drive.google.com/uc?export=download&id=](https://drive.google.com/uc?export=download&id=). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **Google Drive (e1711511)** — Archivo o carpeta en Google Drive. **Lo usan**: `Proyecto-Privado/Pedidos_a_Fabrica.html`. [https://drive.google.com/file/d/...](https://drive.google.com/file/d/...). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **📊 Google Apps Script** — Macro Google Apps Script (URL .../macros/s/AKfycb.../exec). Backend serverless probablemente conectado a una Google Sheet. Se accede vía Vercel proxy api/sheets.js (Presupuestador) que agrega CORS. **Lo usan**: `Presupuestador/3en1.html`, `Presupuestador/sheets.js`.

#### 📈 Analytics

- **📈 GA4 (apps internas)** — Google Analytics 4 G-LMXG9MDKGC. Configurada en firebase-sync.js — trackea uso de apps internas con sync. **Lo usan**: `firebase-sync.js`.
- **📈 GA4 (público)** — Google Analytics 4 G-K8QLJVZT4X. Trackea visitas a páginas públicas: Presupuestador/listas.html, Flyers-Catalogo/index.html y catalogo_actualizado.html. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`, `Flyers-Catalogo/index.html`, `Presupuestador/listas.html`.

#### 📊 Monday.com

- **Monday board 18410539555** — Board de Monday.com (ID 18410539555). **Lo usan**: `Temporales/Prospectos.html`. [https://maxifercotizador.monday.com/boards/18410539555](https://maxifercotizador.monday.com/boards/18410539555).
- **Monday board 18410539771** — Board de Monday.com (ID 18410539771). **Lo usan**: `Temporales/Prospectos.html`. [https://maxifercotizador.monday.com/boards/18410539771](https://maxifercotizador.monday.com/boards/18410539771).
- **Monday board 8921412317** — Board de Monday.com (ID 8921412317). **Lo usan**: `Temporales/VIAJE_SUR.html`. [https://maxifercotizador.monday.com/boards/8921412317](https://maxifercotizador.monday.com/boards/8921412317).
- **Monday — Equipo MAXIFER** — Board de Monday con tareas y agenda del equipo MAXIFER. **Lo usan**: `Proyecto-Privado/surtidos.html`, `Temporales/VIAJE_SUR.html`, `Temporales/postventa_monday.html`. [https://maxifercotizador.monday.com/boards/7212937829](https://maxifercotizador.monday.com/boards/7212937829).
- **Monday.com API** — Endpoint genérico de Monday.com (api.monday.com/v2). **Lo usan**: `Proyecto-Privado/surtidos.html`, `Temporales/Prospectos.html`, `Temporales/VIAJE_SUR.html`, `Temporales/postventa_monday.html`. [https://api.monday.com/v2](https://api.monday.com/v2). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._

#### 📱 WhatsApp

- **WhatsApp** — Apertura de chat en WhatsApp. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`, `Flyers-Catalogo/catalogo-app.js`, `Flyers-Catalogo/index.html`, `Flyers-Catalogo/maxifer_flyer_v2.html`, `Flyers-Catalogo/maxifer_landing_v4.html`, `Presupuestador/compras.html`, +3 más. [https://wa.me/?text=](https://wa.me/?text=). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._

#### 🌐 Otros servicios externos

- **api.github.com** — Servicio externo detectado automáticamente (api.github.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Proyecto-Privado/Analisis_de_Costos.html`, `Proyecto-Privado/Analisis_de_Gastos.html`, `Proyecto-Privado/Pedidos_a_Fabrica.html`, `Proyecto-Privado/index.html`, `Proyecto-Privado/surtidos.html`, `Temporales/Index_general.html`, +1 más. [https://api.github.com/repos/](https://api.github.com/repos/). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **fabricamaxifer.com** — Sitio público fabricamaxifer.com. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`. [https://www.fabricamaxifer.com](https://www.fabricamaxifer.com).
- **nominatim.openstreetmap.org** — Servicio externo detectado automáticamente (nominatim.openstreetmap.org). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Temporales/postventa_monday.html`. [https://nominatim.openstreetmap.org/search?format=json&limit=1&q=](https://nominatim.openstreetmap.org/search?format=json&limit=1&q=). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.facebook.com** — Servicio externo detectado automáticamente (www.facebook.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`. [https://www.facebook.com/profile.php?id=100011140833984](https://www.facebook.com/profile.php?id=100011140833984). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.google.com** — Servicio externo detectado automáticamente (www.google.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Temporales/VIAJE_SUR.html`. [https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.dir)}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.dir)}). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.instagram.com** — Servicio externo detectado automáticamente (www.instagram.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`. [https://www.instagram.com/fabrica.maxifer](https://www.instagram.com/fabrica.maxifer). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.openstreetmap.org** — Servicio externo detectado automáticamente (www.openstreetmap.org). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Temporales/VIAJE_SUR.html`. [https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}](https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.tiktok.com** — Servicio externo detectado automáticamente (www.tiktok.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Flyers-Catalogo/Catálogo Interactivo`. [https://www.tiktok.com/@fabrica.maxifer](https://www.tiktok.com/@fabrica.maxifer). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._
- **www.youtube.com** — Servicio externo detectado automáticamente (www.youtube.com). Para enriquecer la descripción, agregá un override con el mismo ID en _manual_nodes.json — o usá metadata.aliases para mergear con un nodo manual existente. **Lo usan**: `Flyers-Catalogo/index.html`. [https://www.youtube.com/embed/YOUTUBE_ID](https://www.youtube.com/embed/YOUTUBE_ID). 🔍 _Auto-detectado por el scan — descripción puede mejorarse en `_manual_nodes.json`._

<!-- END auto-sync-from-graph -->


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
