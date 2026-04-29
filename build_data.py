#!/usr/bin/env python3
"""
build_data.py
-----------------------------------------------------------------
Lee los 2 Excels y genera 2 JSONs que consumen los HTML.

Inputs (carpeta data/):
  - Listas Maxifer.xlsx     hoja "LISTAS Y BD"
  - Precio Surtidos.xlsx    hoja "BD"

Outputs (carpeta data/):
  - productos.json
  - surtidos.json

Reglas:
  - "BORNES PARA BATERIA" se excluye en ambos JSONs.
  - Los Excels son la unica fuente de verdad.
  - Los precios totales (ls, lr) de cada surtido se RECALCULAN
    desde precio_lista x cantidad para garantizar consistencia.
  - Matching robusto:
      1. exacto por (producto, numero) normalizado
      2. case-insensitive
      3. "volteado": Excel surtidos a veces invierte producto<->numero

Uso:
  python scripts/build_data.py
"""

import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT  # los Excels y JSONs viven en la raiz del repo

XLSX_PRODUCTOS = DATA_DIR / "Listas Maxifer.xlsx"
XLSX_SURTIDOS = DATA_DIR / "Precio Surtidos.xlsx"

OUT_PRODUCTOS = DATA_DIR / "productos.json"
OUT_SURTIDOS = DATA_DIR / "surtidos.json"

EXCLUIR_FAMILIAS = {"BORNES PARA BATERIA"}


def s(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return str(value).strip()


def num(value, default=0):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def norm(value):
    return " ".join(s(value).split()).lower()


def build_productos():
    print(f"Leyendo {XLSX_PRODUCTOS.name}...")
    df = pd.read_excel(XLSX_PRODUCTOS, sheet_name="LISTAS Y BD")

    productos = []
    excluidos = 0
    for _, r in df.iterrows():
        familia = s(r["Producto"])
        if familia in EXCLUIR_FAMILIAS:
            excluidos += 1
            continue
        productos.append({
            "id": s(r["ID"]),
            "p": familia,
            "c": s(r["Codigo BS GESTION"]),
            "n": s(r["Numero"]),
            "d": s(r["Descripción"]),
            "pl": num(r["Precio"]),
            "pc": num(r["COSTO"]),
            "cm": num(r["Cant. Minima"]),
            "prov": s(r["Fabrica"]),
            "cp": s(r["Codigo"]),
        })

    print(f"  Total productos: {len(productos)}  (excluidos: {excluidos})")
    with open(OUT_PRODUCTOS, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  Generado: {OUT_PRODUCTOS.name}  ({OUT_PRODUCTOS.stat().st_size:,} bytes)")
    return productos


def build_surtidos(productos):
    print(f"\nLeyendo {XLSX_SURTIDOS.name}...")
    df = pd.read_excel(XLSX_SURTIDOS, sheet_name="BD")

    pl_lookup = {}
    pl_lookup_swap = {}
    desc_lookup = {}
    desc_lookup_swap = {}
    for p in productos:
        pl_lookup[(norm(p["p"]), norm(p["n"]))] = p["pl"]
        pl_lookup_swap[(norm(p["n"]), norm(p["p"]))] = p["pl"]
        desc_lookup[(norm(p["p"]), norm(p["n"]))] = p["d"]
        desc_lookup_swap[(norm(p["n"]), norm(p["p"]))] = p["d"]

    def find_pl(familia, numero):
        k = (norm(familia), norm(numero))
        if k in pl_lookup:
            return pl_lookup[k], "exacto"
        if k in pl_lookup_swap:
            return pl_lookup_swap[k], "volteado"
        return None, None

    def find_desc(familia, numero):
        k = (norm(familia), norm(numero))
        if k in desc_lookup:
            return desc_lookup[k]
        if k in desc_lookup_swap:
            return desc_lookup_swap[k]
        return ""

    surtidos = {}
    no_encontrados = []
    items_excluidos = 0
    matched_volteado = 0

    for _, r in df.iterrows():
        codigo = s(r["Codigo"])
        nombre = s(r["NOMBRE SURTIDO"])
        if not codigo:
            continue

        familia = s(r["Producto"])
        numero = s(r["N°"])

        if familia in EXCLUIR_FAMILIAS:
            items_excluidos += 1
            continue

        cs = num(r["Cantidad stándar"], 0)
        cr_raw = r["Cantidad Reducidas"]
        if isinstance(cr_raw, (int, float)) and not pd.isna(cr_raw):
            cr = float(cr_raw)
            cr_label = None
        else:
            cr = 0
            cr_label = s(cr_raw) if s(cr_raw) else None

        pl, strategy = find_pl(familia, numero)
        if pl is None:
            no_encontrados.append((codigo, familia, numero))
            pl = 0
        elif strategy == "volteado":
            matched_volteado += 1

        item = {
            "n": numero,
            "p": familia,
            "d": find_desc(familia, numero),
            "cs": cs,
            "cr": cr,
            "pl": pl,
        }
        if cr_label:
            item["cr_label"] = cr_label

        if codigo not in surtidos:
            surtidos[codigo] = {"c": codigo, "n": nombre, "i": []}
        surtidos[codigo]["i"].append(item)

    for codigo, surt in surtidos.items():
        ls = 0.0
        lr = 0.0
        ts = 0.0
        tr = 0.0
        # ps/pr: piezas excluyendo items "Gaveta" y "Varios" (extras administrativos)
        ps = 0.0
        pr = 0.0
        ms = 0  # cantidad de modelos excluyendo extras
        has_reducido = False
        for it in surt["i"]:
            ls += it["pl"] * it["cs"]
            ts += it["cs"]
            if it["cr"] > 0:
                lr += it["pl"] * it["cr"]
                tr += it["cr"]
                has_reducido = True
            # Detectar si es extra (Gaveta o Varios)
            n_low = it["n"].lower()
            is_extra = ("gaveta" in n_low) or ("varios" in n_low)
            if not is_extra:
                ms += 1
                ps += it["cs"]
                if it["cr"] > 0:
                    pr += it["cr"]
        surt["ms"] = ms
        surt["ts"] = round(ts, 2)
        surt["ps"] = round(ps, 2)
        surt["ls"] = round(ls, 2)
        if has_reducido:
            surt["tr"] = round(tr, 2)
            surt["pr"] = round(pr, 2)
            surt["lr"] = round(lr, 2)

    print(f"  Total surtidos: {len(surtidos)}")
    print(f"  Items con match 'volteado' (Varios/Gaveta): {matched_volteado}")
    if items_excluidos:
        print(f"  Items excluidos (BORNES): {items_excluidos}")
    print(f"  Items SIN precio encontrado: {len(no_encontrados)}")

    if no_encontrados:
        print("\n  WARNING: items sin precio (quedan con pl=0):")
        seen = set()
        for codigo, fam, n_ in no_encontrados:
            sig = (fam, n_)
            if sig in seen:
                continue
            seen.add(sig)
            print(f"    surtido={codigo:25s}  producto={fam!r}  n={n_!r}")

    with open(OUT_SURTIDOS, "w", encoding="utf-8") as f:
        json.dump(surtidos, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n  Generado: {OUT_SURTIDOS.name}  ({OUT_SURTIDOS.stat().st_size:,} bytes)")


def main():
    if not XLSX_PRODUCTOS.exists():
        print(f"ERROR: no existe {XLSX_PRODUCTOS}", file=sys.stderr)
        sys.exit(1)
    if not XLSX_SURTIDOS.exists():
        print(f"ERROR: no existe {XLSX_SURTIDOS}", file=sys.stderr)
        sys.exit(1)

    productos = build_productos()
    build_surtidos(productos)
    print("\nOK.")


if __name__ == "__main__":
    main()
