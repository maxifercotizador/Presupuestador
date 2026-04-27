#!/usr/bin/env python3
"""
generar_miniaturas.py
-----------------------------------------------------------------
Recorre la carpeta /listas/ y genera una miniatura JPG de la
primera página de cada PDF en /thumbs/.

- Solo regenera si el PDF es más reciente que la miniatura existente
- Usa pdftoppm (poppler-utils) + Pillow para optimizar
- Borra miniaturas huérfanas (PDFs que ya no existen)

Uso local:
    python scripts/generar_miniaturas.py

En GitHub Actions: corre automáticamente cuando hay cambios en /listas/
"""

import os
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow no instalado. Ejecutar: pip install Pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
LISTAS_DIR = ROOT / "listas"
THUMBS_DIR = ROOT / "thumbs"

# Configuración
THUMB_WIDTH = 400
JPEG_QUALITY = 78
DPI = 100


def pdf_to_thumb(pdf_path: Path, thumb_path: Path) -> bool:
    """Genera una miniatura JPG de la primera página del PDF."""
    tmp_prefix = thumb_path.parent / (thumb_path.stem + "_tmp")

    try:
        # Generar imagen de la primera página
        result = subprocess.run(
            [
                "pdftoppm",
                "-jpeg",
                "-r", str(DPI),
                "-f", "1",
                "-l", "1",
                str(pdf_path),
                str(tmp_prefix),
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            print(f"  ERROR pdftoppm: {result.stderr}")
            return False

        # pdftoppm agrega "-1" al final
        tmp_file = Path(str(tmp_prefix) + "-1.jpg")
        if not tmp_file.exists():
            print(f"  ERROR: no se generó {tmp_file}")
            return False

        # Redimensionar y comprimir con Pillow
        img = Image.open(tmp_file)
        ratio = THUMB_WIDTH / img.width
        new_size = (THUMB_WIDTH, int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)
        img.convert("RGB").save(thumb_path, "JPEG", quality=JPEG_QUALITY, optimize=True)

        # Limpiar archivo temporal
        tmp_file.unlink()
        return True

    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT procesando {pdf_path.name}")
        return False
    except Exception as e:
        print(f"  EXCEPCION: {e}")
        return False


def needs_regen(pdf_path: Path, thumb_path: Path) -> bool:
    """Devuelve True si la miniatura no existe o el PDF es más nuevo."""
    if not thumb_path.exists():
        return True
    return pdf_path.stat().st_mtime > thumb_path.stat().st_mtime


def main():
    if not LISTAS_DIR.exists():
        print(f"ERROR: no existe {LISTAS_DIR}")
        sys.exit(1)

    THUMBS_DIR.mkdir(exist_ok=True)

    pdfs = sorted(LISTAS_DIR.glob("*.pdf"))
    print(f"Encontrados {len(pdfs)} PDFs en /listas/")

    generadas = 0
    saltadas = 0
    fallidas = 0

    for pdf in pdfs:
        thumb = THUMBS_DIR / (pdf.stem + ".jpg")

        if not needs_regen(pdf, thumb):
            saltadas += 1
            continue

        print(f"  Generando: {pdf.name}")
        if pdf_to_thumb(pdf, thumb):
            generadas += 1
        else:
            fallidas += 1

    # Limpiar miniaturas huérfanas
    pdf_stems = {p.stem for p in pdfs}
    huerfanas = 0
    for thumb in THUMBS_DIR.glob("*.jpg"):
        if thumb.stem not in pdf_stems:
            print(f"  Borrando huérfana: {thumb.name}")
            thumb.unlink()
            huerfanas += 1

    print()
    print(f"  Generadas:  {generadas}")
    print(f"  Saltadas:   {saltadas} (ya estaban actualizadas)")
    print(f"  Fallidas:   {fallidas}")
    print(f"  Huérfanas:  {huerfanas} (borradas)")

    if fallidas > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
