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

## StatiCrypt (archivos cifrados)

Este repo es de **uso por empleados**. Todos los HTMLs cifrados acá usan la **password de empleados**:

- **Password (empleados)**: `159159`
- **Salt** (mismo para todos los HTMLs del repo, embebido en cada archivo): `cc5a1a7142676e8a40368a16e858f1de`. Usalo con `--salt`, NO el de `.staticrypt.json`.
- **Storage keys**: `staticrypt_expiration_emp` / `staticrypt_passphrase_emp` (suffix `_emp` = empleados, NO `_maxi`).
- **HTMLs cifrados**: `index.html`, `index_presupuestador.html`, `3en1.html`, `compras.html`. (`listas.html` queda público.)

Repos con la **password de admin** (`maxifer847`) son **`Proyecto-Privado`** y **`Temporales`** — esos usan suffix `_maxi`.

### Workflow obligatorio cuando edites un HTML cifrado

1. Descifrar: `npx --yes staticrypt <archivo> --decrypt -p '159159' --salt 'cc5a1a7142676e8a40368a16e858f1de'` → `decrypted/<archivo>`.
2. Editar el HTML descifrado.
3. Re-cifrar conservando el template del lock screen (`--remember 30`, `--short`, mismo `--salt`, mismos textos en español, mismos colores `#f59e0b` / `#0f172a`).
4. Post-procesar el archivo cifrado:
   - Renombrar keys: `staticrypt_expiration` → `staticrypt_expiration_emp`, `staticrypt_passphrase` → `staticrypt_passphrase_emp`.
   - Re-agregar `<meta name="robots" content="noindex, nofollow">` después del `<meta charset>`.
   - Re-insertar antes de `</head>`: `<link rel="stylesheet" href="maxifer-branding.css">` y `<script defer src="maxifer-branding.js"></script>`.
5. Verificar roundtrip (descifrar el resultado y diff contra el descifrado original).
6. Reemplazar el archivo en el repo, commitear y pushear a `main`. **Siempre re-cifrar antes de cerrar la tarea.**
- **Nunca** dejes el archivo descifrado en el repo. Lo que se commitea es siempre el cifrado.
