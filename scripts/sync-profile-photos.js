#!/usr/bin/env node
/**
 * Descarga en local los archivos bajo /uploads/profiles/ que la API referencia
 * (beneficiarios y, si hay token, administradores). La carpeta `uploads/` no
 * se versiona en git: cada quien debe tener el backend corriendo y ejecutar
 * este script contra una URL donde ya existan las fotos (tu máquina, staging, etc.).
 *
 * Uso (desde la raíz del repo, con Node 18+):
 *   npm run sync:profile-photos
 *
 * Contra otro servidor (p. ej. compañero en LAN o staging):
 *   SYNC_PROFILE_SOURCE_URL=http://192.168.1.10:3000 npm run sync:profile-photos
 *
 * Incluir administradores (GET /administradores requiere JWT):
 *   SYNC_AUTH_TOKEN=eyJhbGciOi... npm run sync:profile-photos
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PROFILES_DIR = path.join(ROOT, "uploads", "profiles");

dotenv.config({ path: path.join(ROOT, ".env") });
dotenv.config({ path: path.join(ROOT, "frontend", ".env.local") });
dotenv.config({ path: path.join(ROOT, "frontend", ".env") });

const SOURCE = (
  process.env.SYNC_PROFILE_SOURCE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const AUTH = (process.env.SYNC_AUTH_TOKEN || "").trim();

function normalizeStoredUrl(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/uploads/profiles/")) return `${SOURCE}${s}`;
  if (s.startsWith("uploads/profiles/")) return `${SOURCE}/${s}`;
  return null;
}

function localPathFromUrl(fullUrl) {
  try {
    const u = new URL(fullUrl);
    if (!u.pathname.startsWith("/uploads/profiles/")) return null;
    const base = path.basename(u.pathname);
    if (!base || base === "." || base === "..") return null;
    if (base.includes("..")) return null;
    return path.join(PROFILES_DIR, base);
  } catch {
    return null;
  }
}

async function collectPhotoUrls() {
  const urls = new Set();

  const benRes = await fetch(`${SOURCE}/beneficiarios`, {
    headers: { Accept: "application/json" },
  });
  if (!benRes.ok) {
    throw new Error(
      `GET /beneficiarios → ${benRes.status} ${benRes.statusText}. ¿Backend encendido y SYNC_PROFILE_SOURCE_URL / NEXT_PUBLIC_API_URL correctas?`
    );
  }
  const beneficiarios = await benRes.json();
  if (!Array.isArray(beneficiarios)) {
    throw new Error("Respuesta de /beneficiarios no es un array.");
  }
  for (const b of beneficiarios) {
    const u = normalizeStoredUrl(b.fotoPerfilUrl);
    if (u) urls.add(u);
  }
  console.log(`[sync] ${beneficiarios.length} beneficiarios; ${urls.size} URL(s) de foto únicas hasta ahora.`);

  if (AUTH) {
    const admRes = await fetch(`${SOURCE}/administradores`, {
      headers: {
        Accept: "application/json",
        Authorization: AUTH.startsWith("Bearer ") ? AUTH : `Bearer ${AUTH}`,
      },
    });
    if (!admRes.ok) {
      console.warn(
        `[sync] GET /administradores → ${admRes.status} (omitido). Revisa SYNC_AUTH_TOKEN.`
      );
    } else {
      const admins = await admRes.json();
      if (Array.isArray(admins)) {
        let n = 0;
        for (const a of admins) {
          const u = normalizeStoredUrl(a.fotoPerfilUrl);
          if (u) {
            urls.add(u);
            n++;
          }
        }
        console.log(`[sync] ${admins.length} administradores; +${n} referencias de foto.`);
      }
    }
  } else {
    console.log("[sync] Sin SYNC_AUTH_TOKEN: se omiten fotos de administradores.");
  }

  return urls;
}

async function downloadOne(fullUrl) {
  const dest = localPathFromUrl(fullUrl);
  if (!dest) {
    console.warn(`[sync] Omitido (ruta no permitida): ${fullUrl}`);
    return "skip";
  }

  const res = await fetch(fullUrl, {
    headers: AUTH ? { Authorization: AUTH.startsWith("Bearer ") ? AUTH : `Bearer ${AUTH}` } : {},
  });
  if (!res.ok) {
    console.warn(`[sync] ${fullUrl} → ${res.status} ${res.statusText}`);
    return "fail";
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    console.warn(`[sync] Vacío: ${fullUrl}`);
    return "fail";
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
  return "ok";
}

async function main() {
  console.log(`[sync] Origen: ${SOURCE}`);
  console.log(`[sync] Destino: ${PROFILES_DIR}`);

  const urls = await collectPhotoUrls();
  if (urls.size === 0) {
    console.log("[sync] No hay URLs que descargar.");
    return;
  }

  let ok = 0;
  let fail = 0;
  let skip = 0;
  for (const u of urls) {
    const r = await downloadOne(u);
    if (r === "ok") {
      ok++;
      console.log(`[sync] OK ${path.basename(new URL(u).pathname)}`);
    } else if (r === "fail") fail++;
    else skip++;
  }
  console.log(`[sync] Listo: ${ok} descargados, ${fail} fallidos, ${skip} omitidos.`);
}

main().catch((e) => {
  console.error("[sync] Error:", e);
  process.exit(1);
});
