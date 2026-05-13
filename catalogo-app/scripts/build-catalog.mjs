import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Carpeta del repo (donde está el .xlsx y Chenille/, etc.) */
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUT_FILE = path.resolve(__dirname, "..", "data", "catalogo-data.js");

const FOLDER_BY_CATEGORY = {
  Chenille: "Chenille",
  "Hiper Barata": "Hiper Barata",
  "Super Gruesa": "Super Gruesa",
  Macramé: "Macrame",
};

/** Precio por ovillo / unidad según tipo (CLP) */
const PRECIO_BY_CATEGORY = {
  Chenille: 2400,
  "Hiper Barata": 1400,
  "Super Gruesa": 1800,
  Macramé: 12000,
};

const DETALLES_BY_CATEGORY = {
  Chenille:
    "Ovillo chenille de tacto aterciopelado. Ideal para amigurumis, bufandas y prendas infantiles. Lavado suave a máquina.",
  "Hiper Barata":
    "Lana económica de uso general: mantas, ropa de bebé y proyectos que requieren mucho material.",
  "Super Gruesa":
    "Ovillo grueso para tejido rápido. Consulta en tienda las agujas o crochet recomendados para este grosor.",
  Macramé:
    "Material indicado para macramé, tapices y decoración. Resistente y con buena definición de nudos.",
};

function normalizeCategory(raw) {
  const t = String(raw ?? "").trim();
  if (t === "Maxcramé") return "Macramé";
  return t;
}

function pickImageFile(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (!files.length) return null;
  const scored = files.map((f) => ({
    f,
    score: f.includes("(1)") || f.includes("(2)") ? 1 : 0,
  }));
  scored.sort((a, b) => a.score - b.score || a.f.localeCompare(b.f));
  return scored[0].f;
}

function resolveImage(categoriaNorm, color) {
  const folderName = FOLDER_BY_CATEGORY[categoriaNorm];
  if (!folderName) return null;

  if (folderName === "Macrame") {
    const macDir = path.join(REPO_ROOT, "Macrame");
    const file = pickImageFile(macDir);
    return file ? `../Macrame/${file}` : null;
  }

  const sub = String(Number(color)).padStart(2, "0");
  const colorDir = path.join(REPO_ROOT, folderName, sub);
  const file = pickImageFile(colorDir);
  return file ? `../${folderName}/${sub}/${file}` : null;
}

function descripcion(categoriaNorm, nombre, color) {
  const n = nombre || `Color ${color}`;
  const intro = {
    Chenille: "Chenille suave en tono",
    "Hiper Barata": "Lana hiper barata en tono",
    "Super Gruesa": "Super gruesa en tono",
    Macramé: "Hilo para macramé en tono",
  }[categoriaNorm];
  return `${intro} «${n}». Disponible en Bazar de la Trini (Rosario).`;
}

const workbook = XLSX.readFile(
  path.join(REPO_ROOT, "Catalogo lanas Rosario .xlsx")
);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

const items = rows.map((row, idx) => {
  const categoria = normalizeCategory(row["Categoría"] ?? row.Categoria);
  const codigo = String(row["Código"] ?? row.Codigo ?? `ITEM-${idx}`).trim();
  const color = row.Color;
  const nombreRaw = row.Nombre;
  const nombre =
    nombreRaw != null && String(nombreRaw).trim() !== ""
      ? String(nombreRaw).trim()
      : `Color ${color}`;

  const imagen = resolveImage(categoria, color);
  const detalles = DETALLES_BY_CATEGORY[categoria] ?? "";
  const precio = PRECIO_BY_CATEGORY[categoria] ?? null;

  return {
    id: codigo,
    categoria,
    codigo,
    color: Number(color),
    nombre,
    descripcion: descripcion(categoria, nombre, color),
    precio,
    detalles,
    imagen,
  };
});

const json = JSON.stringify(items, null, 2);
const banner = `/* Generado por npm run build:data — no editar a mano */\n`;
const body = `${banner}window.CATALOGO_DATA = ${json};\n`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, body, "utf8");
console.log("Escrito:", OUT_FILE, "(" + items.length + " ítems)");
