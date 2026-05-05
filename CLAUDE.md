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
HTMLs cifrados en este repo: `index.html`, `index_presupuestador.html`, `3en1.html`, `compras.html`, `listas.html` (los que tengan `<html class="staticrypt-html">`).

- **Password**: `maxifer847`.
- **Salt** embebido en cada archivo (campo `staticryptSaltUniqueVariableName`); en este repo es `cc5a1a7142676e8a40368a16e858f1de`. Usalo con `--salt`, NO el de `.staticrypt.json`.
- **Workflow obligatorio cuando edites un HTML cifrado**:
  1. Descifrar: `npx --yes staticrypt <archivo> --decrypt -p 'maxifer847' --salt 'cc5a1a7142676e8a40368a16e858f1de'` → `decrypted/<archivo>`.
  2. Editar el HTML descifrado.
  3. Re-cifrar conservando el template del lock screen (mismos textos en español, colores, `--remember 30`, `--short`, mismo `--salt`).
  4. Post-procesar el archivo cifrado: cambiar `staticrypt_expiration` → `staticrypt_expiration_maxi`, `staticrypt_passphrase` → `staticrypt_passphrase_maxi`, re-agregar `<meta name="robots" content="noindex, nofollow">` y reinsertar `<link>` + `<script>` de `maxifer-branding` antes de `</head>`.
  5. Verificar roundtrip (descifrar el resultado y diff contra el descifrado original).
  6. Reemplazar el archivo en el repo, commitear y pushear a `main`. **Siempre re-cifrar antes de cerrar la tarea.**
- **Nunca** dejes el archivo descifrado en el repo. Lo que se commitea es siempre el cifrado.
