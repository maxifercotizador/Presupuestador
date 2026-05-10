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
