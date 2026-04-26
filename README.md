# Presupuestador MAXIFER

Apps web para cotizaciones, compras y consulta de precios de MAXIFER.

## 📁 Archivos del repositorio

### Datos (los que vos editás)

- **`Listas Maxifer.xlsx`** — Productos: precios de lista, costo, códigos, proveedores. Hoja: `LISTAS Y BD`.
- **`Precio Surtidos.xlsx`** — Composición de los 118 surtidos predefinidos (qué productos lleva cada uno). Hoja: `BD`.

### Datos generados automáticamente (no los toques a mano)

- **`productos.json`** — Generado desde `Listas Maxifer.xlsx`. Lo consumen los HTML.
- **`surtidos.json`** — Generado desde `Precio Surtidos.xlsx`. Lo consume `index_presupuestador.html`.

### Apps

- **`MAXIFER_consultor_precios.html`** — Consulta rápida de precios con descuento.
- **`3en1.html`** — Cotización + Preparación + CSV en un solo paso.
- **`compras.html`** — Procesador de compras a proveedores.
- **`index_presupuestador.html`** — Presupuestador de surtidos predefinidos.

### Infraestructura

- **`build_data.py`** — Script que convierte los Excel en JSON.
- **`.github/workflows/generar-jsons.yml`** — Automatización: cuando se sube un Excel, regenera los JSON solo.

---

## 🔄 Cómo actualizar los precios

1. Editás los Excel en tu computadora (`Listas Maxifer.xlsx` y/o `Precio Surtidos.xlsx`).
2. Subís el Excel modificado al repo (drag-and-drop en la web de GitHub).
3. La GitHub Action corre sola en menos de 1 minuto:
   - Lee los Excel.
   - Genera `productos.json` y `surtidos.json`.
   - Hace commit automático con los JSON actualizados.
4. Las apps cargan los precios nuevos al instante (en los siguientes accesos).

**Nunca tenés que tocar los HTML.**

---

## ⚙️ Reglas que aplica `build_data.py`

- **Excluye la familia `BORNES PARA BATERIA`** (no aparece en los JSON ni en las apps).
- **Los Excel son la fuente de verdad.** Si hay diferencias entre el HTML viejo y el Excel, gana el Excel.
- **Recalcula totales** de cada surtido (`ls`, `lr`, `ps`, `pr`, `ms`) desde precio × cantidad. No hay datos derivados que queden desfasados.
- **Matching robusto** entre los 2 Excel:
  1. Match exacto por `(producto, número)`.
  2. Case-insensitive (resuelve `5 X 30` vs `5 x 30`).
  3. "Volteado" (resuelve `Varios / Varios Ch` invertido en uno y otro Excel).

---

## 🧪 Probar localmente

```bash
# Regenerar JSONs (solo si modificaste los Excel localmente)
python3 build_data.py

# Servir el sitio localmente
python3 -m http.server 8000
# Abrir http://localhost:8000/MAXIFER_consultor_precios.html
```

---

## 🚨 Si algo falla

- Si después de subir un Excel pasan más de 2 minutos y los JSON no se actualizaron, mirá la pestaña **Actions** del repo y revisá el log del workflow.
- Si el workflow falla, lo más común es:
  - Cambió el nombre de una hoja del Excel (debe ser `LISTAS Y BD` o `BD`).
  - Cambió el nombre de una columna del Excel.
  - Hay caracteres raros en los nombres de los archivos.
- Para regenerar manualmente sin tocar los Excel: en la pestaña **Actions** → workflow "Generar JSONs desde Excels" → botón **Run workflow**.
