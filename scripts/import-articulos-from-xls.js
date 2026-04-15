import XLSX from "xlsx";
import { getConnection } from "../src/config/db.js";

const XLS_PATH = process.argv[2] || "articulos.xls";
const APPLY = process.argv.includes("--apply");
const MANEJA_INVENTARIO = process.argv.includes("--maneja=N") ? "N" : "S";
const FIX_NEGATIVE_INVENTORY = process.argv.includes("--fix-negative-inventory");

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRow(row, index) {
  const idArticulo = toNumber(row["Cve. Art."], NaN);
  const descripcion = String(row["Desc. Articulo"] ?? "").trim();
  const unidad = String(row["Unidad"] ?? "").trim();
  const cuotaRecuperacion = toNumber(row["Cuota Recup."], 0);
  let inventarioActual = toNumber(row["Inventario Actual"], 0);

  if (FIX_NEGATIVE_INVENTORY && inventarioActual < 0) {
    inventarioActual = 0;
  }

  const errores = [];
  if (!Number.isFinite(idArticulo)) {
    errores.push(`Fila ${index}: Cve. Art. invalido`);
  }
  if (!descripcion) {
    errores.push(`Fila ${index}: Desc. Articulo vacio`);
  }
  if (cuotaRecuperacion < 0) {
    errores.push(`Fila ${index}: Cuota Recup. no puede ser negativa`);
  }
  if (inventarioActual < 0) {
    errores.push(`Fila ${index}: Inventario Actual no puede ser negativo`);
  }

  return {
    errores,
    data: {
      idArticulo,
      descripcion,
      unidad: unidad || null,
      cuotaRecuperacion,
      inventarioActual,
      manejaInventario: MANEJA_INVENTARIO,
      idCategoria: null
    }
  };
}

function readRowsFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function upsertArticulo(conn, articulo) {
  const existeResult = await conn.execute(
    `SELECT 1 AS EXISTE FROM ARTICULOS WHERE ID_ARTICULO = :idArticulo`,
    { idArticulo: articulo.idArticulo }
  );

  if (existeResult.rows.length > 0) {
    await conn.execute(
      `UPDATE ARTICULOS
       SET DESCRIPCION = :descripcion,
           UNIDAD = :unidad,
           CUOTA_RECUPERACION = :cuotaRecuperacion,
           INVENTARIO_ACTUAL = :inventarioActual,
           MANEJA_INVENTARIO = :manejaInventario,
           ID_CATEGORIA = :idCategoria
       WHERE ID_ARTICULO = :idArticulo`,
      articulo
    );
    return "updated";
  }

  await conn.execute(
    `INSERT INTO ARTICULOS (
       ID_ARTICULO,
       DESCRIPCION,
       UNIDAD,
       CUOTA_RECUPERACION,
       INVENTARIO_ACTUAL,
       MANEJA_INVENTARIO,
       ID_CATEGORIA
     ) VALUES (
       :idArticulo,
       :descripcion,
       :unidad,
       :cuotaRecuperacion,
       :inventarioActual,
       :manejaInventario,
       :idCategoria
     )`,
    articulo
  );

  return "inserted";
}

async function main() {
  const rows = readRowsFromExcel(XLS_PATH);

  if (!rows.length) {
    console.log("No se encontraron filas en el Excel.");
    process.exit(0);
  }

  const errores = [];
  const articulos = [];

  rows.forEach((row, idx) => {
    const { errores: rowErrors, data } = normalizeRow(row, idx + 2);
    if (rowErrors.length) {
      errores.push(...rowErrors);
      return;
    }
    articulos.push(data);
  });

  const idsUnicos = new Set(articulos.map((a) => a.idArticulo));
  if (idsUnicos.size !== articulos.length) {
    errores.push("Hay IDs duplicados dentro del Excel (Cve. Art.).");
  }

  console.log(`Archivo: ${XLS_PATH}`);
  console.log(`Total filas leidas: ${rows.length}`);
  console.log(`Filas validas: ${articulos.length}`);
  console.log(`Errores: ${errores.length}`);
  console.log(`Modo: ${APPLY ? "APPLY (escritura)" : "DRY-RUN (sin cambios)"}`);
  console.log(`manejaInventario para todos: ${MANEJA_INVENTARIO}`);
  console.log(`Correccion de inventario negativo: ${FIX_NEGATIVE_INVENTORY ? "ACTIVA (a 0)" : "DESACTIVADA"}`);

  if (errores.length) {
    console.log("Primeros errores:");
    errores.slice(0, 20).forEach((e) => console.log(`- ${e}`));
    process.exit(1);
  }

  if (!APPLY) {
    console.log("Dry-run completado. Ejecuta con --apply para guardar en BD.");
    process.exit(0);
  }

  const conn = await getConnection();
  let inserted = 0;
  let updated = 0;

  try {
    for (const articulo of articulos) {
      const action = await upsertArticulo(conn, articulo);
      if (action === "inserted") inserted += 1;
      if (action === "updated") updated += 1;
    }

    await conn.commit();
    console.log(`Importacion completada. Insertados: ${inserted}, Actualizados: ${updated}`);
  } catch (err) {
    await conn.rollback();
    console.error("Error en importacion, se hizo rollback:", err.message);
    process.exit(1);
  } finally {
    await conn.close();
  }
}

main().catch((err) => {
  console.error("Fallo al ejecutar importacion:", err.message);
  process.exit(1);
});
