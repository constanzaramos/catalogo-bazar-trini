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
  Soft: "soft",
  Macramé: "Macrame",
};

/** Precio por ovillo / unidad según tipo (CLP) */
const PRECIO_BY_CATEGORY = {
  Chenille: 2400,
  "Hiper Barata": 1400,
  "Super Gruesa": 1800,
  Soft: null,
  Macramé: 12000,
};

const DETALLES_BY_CATEGORY = {
  "Hiper Barata": `¡Calidad increíble al mejor precio! Esta lana es la aliada perfecta para quienes buscan maximizar su presupuesto sin sacrificar suavidad. Su composición 100% acrílica garantiza durabilidad y un cuidado sencillo, siendo totalmente antialérgica, ideal para prendas de vestir o accesorios en contacto con la piel.

Con un rendimiento excepcional de 240 metros por ovillo, es la opción más rendidora para tus proyectos medianos y grandes.

Composición: 100% Acrílico (Antialérgico).
Peso/Longitud: 100g / 240 mt.
Herramientas recomendadas: Crochet y palillos N° 3 - 4.
Uso ideal: Chalecos, mantas livianas y gorros.`,
  "Super Gruesa": `Volumen y rapidez en cada tejido. Si buscas terminar tus proyectos en tiempo récord con un acabado imponente, la versión Super Gruesa es para ti. Mantiene todas las propiedades de nuestra línea económica: es antialérgica y 100% acrílica, pero con un grosor diseñado para destacar la textura de tus puntos.

Es perfecta para piezas de invierno que requieren cuerpo y calidez inmediata, trabajando cómodamente con ganchillos o agujas de mayor numeración.

Composición: 100% Acrílico (Antialérgico).
Peso: 100g.
Herramientas recomendadas: Crochet y palillos N° 5 - 7.
Uso ideal: Bufandas XL, mantas de sofá, abrigos y cuellos de invierno.`,
  Chenille: `Textura aterciopelada y brillo sutil. El Chenille es sinónimo de delicadeza. Su hebra tipo "peluche" ofrece un acabado extrasuave que encanta tanto a grandes como a chicos. Con un excelente metraje de 160 metros, es una lana versátil que combina un tacto lujoso con la practicidad de un tejido definido y prolijo.

Al ser suave y ligera, es perfecta para piezas que requieren un acabado profesional y tierno a la vez.

Rendimiento: 100g / 160 mt.
Herramientas recomendadas: Palillos N° 3 - 4.
Uso ideal: Amigurumis premium, ropa de bebé, mantas de apego y cojines decorativos.`,
  Soft: `¡Tan suave que parece una nube! Esta lana destaca por su increíble textura tipo peluche, diseñada para quienes buscan un acabado ultra esponjoso y tierno. Al ser una lana de gran grosor, es ideal para proyectos "express" que quedan con un volumen espectacular y una suavidad inigualable al contacto con la piel.

Es la opción favorita para crear piezas que transmitan confort absoluto y un look moderno.

Textura: Peluche / Soft-touch.
Rendimiento: 100g / 60 mt.
Herramientas recomendadas: Palillos N° 8 - 10.
Uso ideal: Chalecos "oversized", cuellos gigantes, mantas de descanso y accesorios para el hogar que inviten al relax.`,
  Macramé:
    "Material indicado para macramé, tapices y decoración. Resistente y con buena definición de nudos.",
};

/** Ítems Soft (imágenes en soft/{color}.png) — hasta que estén en el Excel */
const SOFT_ITEMS = [
  { codigo: "S01", color: 1, nombre: "Azul" },
  { codigo: "S02", color: 2, nombre: "Beige" },
  { codigo: "S03", color: 3, nombre: "Blanco" },
  { codigo: "S04", color: 4, nombre: "Rosado" },
  { codigo: "S05", color: 5, nombre: "Negro" },
];

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

  if (folderName === "soft") {
    const n = Number(color);
    for (const ext of [".png", ".jpg", ".jpeg", ".webp"]) {
      const rel = `../soft/${n}${ext}`;
      if (fs.existsSync(path.join(REPO_ROOT, "soft", `${n}${ext}`))) return rel;
    }
    return null;
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
    Soft: "Lana soft en tono",
    Macramé: "Hilo para macramé en tono",
  }[categoriaNorm];
  return `${intro} «${n}». Disponible en Bazar de la Trini (Rosario).`;
}

const workbook = XLSX.readFile(
  path.join(REPO_ROOT, "Catalogo lanas Rosario .xlsx")
);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

function buildItem(categoria, codigo, color, nombre) {
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
}

const items = rows.map((row, idx) => {
  const categoria = normalizeCategory(row["Categoría"] ?? row.Categoria);
  const codigo = String(row["Código"] ?? row.Codigo ?? `ITEM-${idx}`).trim();
  const color = row.Color;
  const nombreRaw = row.Nombre;
  const nombre =
    nombreRaw != null && String(nombreRaw).trim() !== ""
      ? String(nombreRaw).trim()
      : `Color ${color}`;

  return buildItem(categoria, codigo, color, nombre);
});

if (!items.some((i) => i.categoria === "Soft")) {
  for (const row of SOFT_ITEMS) {
    items.push(buildItem("Soft", row.codigo, row.color, row.nombre));
  }
}

const json = JSON.stringify(items, null, 2);
const banner = `/* Generado por npm run build:data — no editar a mano */\n`;
const body = `${banner}window.CATALOGO_DATA = ${json};\n`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, body, "utf8");
console.log("Escrito:", OUT_FILE, "(" + items.length + " ítems)");
